# NSYSU HUD 規格書

iPhone 主畫面的「指揮中心」小工具（Scriptable）＋ GitHub Actions 雲端小幫手。使用者是中山大學電機系大一（全英班）學生，住宿舍，用 iPhone（iOS）＋ Apple Watch Ultra。

**完全不碰使用者的電腦。** 宿舍電腦的遙控、溫度、上傳流量、斷線通知等，是另一個專案在做，這裡一律不要做。

## 1. 架構

```
iPhone（Scriptable 小工具，直接抓）            GitHub Actions（排程，公開 repo，免費）
├─ iPhone 行事曆（Google 日曆已同步）          ├─ 公告監看 → ntfy 推播 ＋ notices.json
├─ 課表（config/courses.json）                ├─ YouBike 指定站點 → youbike.json
├─ 天氣／紫外線（Open-Meteo，手機 IP）          ├─ 課程異動監看（NSYSUCourseAPI）→ 推播
├─ 台股即時（TWSE MIS API）                    └─ 美股大事前一晚提醒 → 推播
└─ 讀 GitHub Pages 上的 notices.json / youbike.json
```

- **GitHub Pages**：用 `actions/upload-pages-artifact` ＋ `actions/deploy-pages` 部署 `data/*.json`，**不要每次排程都 commit**，避免歷史爆量。
- **狀態保存**（哪些公告已推過）：下一輪先抓目前 Pages 上的 `notices.json` 當上一次狀態，合併後再部署。抓不到時（第一次）只建立基準、**不推播**，避免一次推幾十則。
- **推播**：ntfy（https://ntfy.sh），主題名稱放在 repo secret `NTFY_TOPIC`，程式碼和 log 裡都不能印出主題名稱。用 JSON 發布（`POST https://ntfy.sh/` body 含 `topic`、`title`、`message`、`click`、`tags`、`priority`），中文標題才不會亂碼。
- **公開 repo 的注意事項**：任何金鑰、主題名稱只放 secrets。60 天沒有 commit 的公開 repo 排程會被 GitHub 停用，要有 keepalive（例如每月自動做一次空 commit，或用現成 keepalive action）。

## 2. 小工具（Scriptable）

### 2.1 安裝與更新
- 使用者只貼一個 **約 10–20 行的安裝器**（`install/HUD-Loader.js`）到 Scriptable。它從 `https://raw.githubusercontent.com/andrewlin9697/nsysu-hud/main/dist/NSYSU-HUD.js` 下載主程式並快取在本機，**一天檢查一次更新**；網路失敗就用快取。
- 主程式是 build 出來的單一檔案 `dist/NSYSU-HUD.js`（Scriptable 不支援 npm 模組）。原始碼可以拆成多個模組，用 build script 合併。
- 設定（config/*.json）也從 raw.githubusercontent.com 讀，同樣快取。使用者之後要改觀察清單或課表，只需要改 repo 裡的 JSON。

### 2.2 尺寸與風格
- 主要做 **大尺寸（large）**。medium、small 給簡化版就好，不要壞掉。
- **Apple 原生風**：系統字體（SF）、`Color.dynamic` 支援淺色／深色、SF Symbols、圓角卡片、留白、灰階為主，只有重點用系統色（紅＝急、橘＝快到、綠／紅＝台股漲跌依台灣習慣「紅漲綠跌」）。不要花俏漸層。
- 全部介面文字用**繁體中文（台灣用語）**。
- 右下角小字顯示資料更新時間；資料過期（例如 YouBike 超過 30 分鐘）要變灰並標示時間。

### 2.3 依時段自動換內容（核心玩法）
依台北時間、星期、行事曆和學期狀態決定「模式」，每個模式排列不同的區塊。模式選擇要寫成純函式、可單元測試。

| 模式 | 時間（平日） | 主要內容 |
|---|---|---|
| 早晨 | 06:00–09:10 | 今天天氣（氣溫、降雨機率最高的時段、要不要帶傘）、今日課表、第一堂倒數、最近 3 個倒數 |
| 上課日白天 | 09:10–16:00 有課的日子 | 現在這堂（課名、教室、剩幾分鐘）、下一堂（課名、教室、幾點）、下一堂教室附近 YouBike 車數、台股精簡列（盤中） |
| 午後 | 13:30–18:00（沒課或下課後） | 台股收盤摘要、倒數、晚上會不會下雨、新公告數 |
| 晚間 | 18:00–24:00 | 7 天內的考試／截止、明天第一堂（幾點、教室）、明天天氣、今天新公告標題、今晚的美股大事 |
| 深夜 | 00:00–06:00 | 極簡：明天第一堂、最近的考試倒數 |
| 假日 | 週六日、放假日（config/semester.json） | 倒數、天氣、本週台股、下週一第一堂 |

覆寫規則：
- **48 小時內有考試**：在任何模式都置頂，紅色強調。
- **期中考週、期末考週**（config/semester.json）：課表區改成「本週考試」清單。
- **放假日、寒假**：不顯示課表。

### 2.4 區塊細節

**A. 考試／作業倒數（iPhone 行事曆）**
- 用 Scriptable `CalendarEvent.between` 讀未來 45 天、所有行事曆（排除節日類行事曆）。
- 依標題關鍵字分類：考試（`考試|期中|期末|小考|Quiz|Exam|Midterm|Final`）、截止（`截止|繳交|deadline|Deadline|due|報名`）。不符合的事件忽略。
- 標題開頭是 `留意公告:` 的是**日期未確定**，顯示成灰色「約」。
- 顯示「D-2」「明天」「今天 19:00」這種格式；≤2 天紅、≤7 天橘。
- 範例資料在 `fixtures/calendar-events.json`（真實標題）。
- 注意全天事件的 end 是隔天 00:00。

**B. 下一堂課（config/courses.json）**
- 節次時間在 `periods`。一門課的連續節次（例如 234）要合成一段 09:10–12:00。
- 要處理：上課中（剩幾分鐘）、下課空檔、今天已經沒課（顯示明天或下週第一堂）、放假日跳過。
- 教室旁邊附上最近 YouBike 站的可借車數（`buildingToYouBike`）。

**C. 天氣、帶傘、紫外線（Open-Meteo，手機端呼叫）**
- URL 在 `config/location.json`。手機直接呼叫，快取 30 分鐘。
- **帶傘**：現在到 20:00 之間任何一小時降雨機率 ≥ 50% 或降水 ≥ 0.5 mm，就顯示「要帶傘」和最可能下雨的時段。
- **本機通知**：每次小工具更新時，用 `Notification` 排一則**隔天 07:30** 的帶傘提醒（固定 identifier，後面的覆蓋前面的，不會重複）。不下雨就取消。
- **曬太陽時段**：找 09:00–15:00 之間 UV 指數 3–7 的小時，**優先挑沒有課的時段**（例如 12:00–13:10 午休），顯示「曬太陽好時段 12:10–12:40（UV 6）」。UV ≥ 8 時改顯示「UV 很強，10 分鐘就夠」。不要提供醫療建議。

**D. 台股觀察清單（config/watchlist.json，手機端 TWSE MIS API）**
- 一次請求把所有代號帶上（`tse_XXXX.tw|otc_XXXX.tw|...`），回應格式見 `fixtures/twse-mis.json`。
- 小工具上顯示：台積電（價格、漲跌%）、加權指數，以及每個題材一列：題材名、平均漲跌%、漲最多與跌最多的那一檔。
- `z` 是 `"-"` 時要退回買一／賣一或昨收；非交易時間顯示最近一個交易日的收盤，並標示日期。
- 台灣習慣**紅漲綠跌**。
- **只呈現資訊，不要產生任何買賣建議、訊號或評分。**

**E. 美股大事倒數（config/macro-events.json）**
- 顯示下一個事件和台北時間（例如「CPI 11/10（二）21:30，還有 19 天」）。`confirmed: false` 顯示「預估」。

**F. 公告與 YouBike（讀 GitHub Pages 的 JSON）**
- `notices.json`：顯示過去 24 小時新公告數，晚間模式列最新 2 則標題（標上來源，例如「電機系」「教務處」「住宿」）。
- `youbike.json`：顯示我的最愛站點的可借／可還。

### 2.5 點小工具之後（App 內完整版）
點小工具會在 Scriptable 裡開完整儀表板（`UITable` 或 `WebView` 都可以，選看起來最像原生的），分頁或分段：
- 所有倒數（可點開看描述）
- 今天、本週課表
- 完整觀察清單（每檔價格、漲跌%、成交量）
- YouBike：**這裡直接抓即時的 station-yb2.json**（約 6 MB，只在打開時抓，快取 2 分鐘），顯示全部 config 站點
- 公告列表，點了用 Safari 打開原文
- 逐時天氣、降雨、UV

## 3. GitHub Actions

用 Node 20（不要加不必要的相依套件；HTML 解析可用 `cheerio` 或嚴謹的正規表示式，二選一，並用 fixtures 測試）。

| Workflow | 排程（cron 是 UTC！台北 = UTC+8） | 工作 |
|---|---|---|
| `notices` | 台北 07:00–23:30 每 30 分鐘 | 抓 `config/notices.json` 中 `enabled` 的來源 → 解析 → 跟上次比對 → 新的推播（同一輪多則合併成一則，標題寫「中山公告 3 則」，內文列標題，click 到第一則網址）→ 部署 `data/notices.json`（保留最近 200 則，含 id、source、group、title、url、date、firstSeen） |
| `youbike` | 台北 07:00–23:30 每 10 分鐘 | 抓 station-yb2.json → 只留 config 站點 → 跟 notices 一起部署到 Pages（兩個 workflow 都會部署同一個 Pages 站，要避免互相蓋掉：建議合併成同一個 `data` workflow，每 10 分鐘跑，公告部分只在分鐘數落在 0–9 或 30–39 時執行；或每次部署都先抓回另一份現有 JSON） |
| `course-watch` | 每天台北 08:00 | 讀 NSYSUCourseAPI 最新版本 → 比對 8 門課的 room、classTime、change → 有變就推播（例如「普物教室改到 工EC 2011」），並把目前狀態存進 Pages |
| `macro-reminder` | 每天台北 20:00 | 如果今晚到明早 06:00 之間有 macro event，推播「今晚 21:30 美國 CPI」或「凌晨 2:00 聯準會利率決議」 |
| `keepalive` | 每月一次 | 避免 60 天無活動被停用 |
| `data` 裡的 `activities` | 跟 `data` 一起，每 10 分鐘 | EMI 中心預約系統 EEARS（`config/activities.json`）：讀公開的 `/api/events`、`/api/event-types`，依每種活動的 `openRule` 算出開放時間，用 ntfy 的定時送出（`delay`＋固定 `sequence_id`）在開放前 5 分鐘提醒；另外通知新增場次、額滿場次空出名額（每場一次）。跟課表衝堂的場次略過。狀態存 Pages 的 `data/activities.json` |

- 所有 workflow 都要能 `workflow_dispatch` 手動執行，並有 `DRY_RUN` 輸入（只印出結果、不推播）。
- 網路錯誤要重試 2 次，單一來源失敗不能讓整輪失敗；失敗的來源記在 JSON 的 `errors` 欄位。
- 推播文字：繁體中文、簡短、可以加 ntfy tags（📢 等）。公告用 priority 3，課程異動用 4。
- `concurrency` 設好，避免同時部署 Pages。

**解析規則**（見 `fixtures/` 與 `config/notices.json` 的 `_note`）：
- `rpage-403`：`.row.listBS .mtitle a`，標題用 `title` 屬性（去掉「(另開新視窗)」）或文字；日期在同一列的 `i.mdate`（`YYYY.MM.DD`，可能沒有）。西灣學院是表格版：`table.row.listBS` 裡每個 `tr` 一則，日期 `YYYY/M/D` 在標題前。
- `rpage-422`：**只解析 `.module-ptlist` 裡的表格**，`td[data-th="日期"]`、`td[data-th="標題"] a`、`td[data-th="公告單位"]`。頁首輪播也有文章連結，不能抓到。
- 文章 ID：網址 `/p/40[46]-(\d+)-(\d+)` 的第二組數字。去重用 `{hostname}:{id}`。
- 去掉網址的 `?Lang=zh-tw`。

## 4. 測試與品質

- 純邏輯（模式選擇、下一堂課、倒數分類、帶傘判斷、曬太陽時段、台股題材彙整、公告解析與去重、課程異動比對、ntfy payload）都要有單元測試（`node --test`），用 fixtures 和**固定的假時間**，不要依賴今天日期。
- 要測的邊界：跨午夜、全天事件、上課中最後一分鐘、週五最後一堂後要顯示下週一、放假日、期中考週、`z = "-"`、Open-Meteo 抓不到、Pages JSON 不存在（第一次）、公告置頂舊文章、同一則公告出現在兩個來源。
- Scriptable API（`ListWidget`、`Request`、`FileManager`、`CalendarEvent`、`Notification`、`config`、`Script`）要包在 adapter 後面，Node 測試用假的 adapter。
- 加一個 `npm run preview`：在 Node 裡用假資料把每個模式的「版面內容」印成文字，方便沒有 iPhone 也能檢查。

## 5. 文件

`README.md`（繁體中文，給使用者看）：
1. 這是什麼（3 行）
2. 安裝：裝 Scriptable → 新增腳本貼上 `install/HUD-Loader.js` → 執行一次（會要行事曆、通知權限，按允許）→ 長按主畫面加大尺寸 Scriptable 小工具、選這個腳本
3. 推播：裝 ntfy App、訂閱主題（主題名稱另外給，不寫在 README）
4. 每個模式長怎樣（文字描述即可）
5. 要改觀察清單、課表、YouBike 站點 → 改哪個 config 檔
6. 常見問題（小工具沒更新、權限、資料過期）

## 6. 不要做的事

- 不碰使用者電腦、不做任何遠端控制或電腦監控。
- 不放任何帳號密碼、cookie、token 到 repo；不需要使用者登入任何學校系統。
- 台股不要給買賣建議。
- 不要從 GitHub Actions 呼叫 Open-Meteo（共用 IP 會被擋）。
