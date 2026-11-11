# CLAUDE.md

- 完整需求在 `SPEC.md`，資料設定在 `config/`，真實資料樣本在 `fixtures/`。開始前先讀這三個。
- 使用者看得到的文字（小工具介面、推播、README）一律繁體中文、台灣用語。程式碼註解可用英文。
- `fixtures/` 必須是伺服器回的原始內容（用 `curl` 存檔），不能從瀏覽器畫面複製，也不能自己編。
- 動到抓取、解析或推播的程式時，合併前先對真實網站跑一次：`OUT_DIR=/tmp/site PENDING_FILE=/tmp/p.json node scripts/data-job.js --force notices,course`（只讀、不推播、不部署），把每個來源的 ✓／✗ 貼進 PR 說明。真的連不到才只用 fixtures，並在 PR 說明寫「沒有對真實網站驗證」。2026-11 從開發環境實測，12 個公告來源連得到 11 個。
- 不要把 NTFY_TOPIC 或任何秘密寫進檔案、log 或 commit。
- 完成的定義（缺一項都不算完成）：
  1. `npm test` 全過、`npm run build` 產生 `dist/NSYSU-HUD.js`、`npm run preview` 能印出每個模式的版面。
  2. PR 已合併。分支上不留沒合併的 commit；不合併就刪掉並說明原因。
  3. 合併後看一次線上資料 `https://andrewlin9697.github.io/nsysu-hud/data/notices.json`：`errors` 是空的、`updatedAt` 是新的。
- 需要使用者自己動手的步驟（設定 secret、外部服務、手機上的操作）寫在 PR 說明和回覆的最上面，一項一行。只寫在 README 不算交代過。
- 該做的事沒做到，程式要以非 0 結束（Actions 變紅，GitHub 會寄信）。不要「略過並印一行」。
- 發現平台的實際行為跟設計不符（例如排程沒照頻率跑），當場改設計或列成待辦交給使用者，不要只寫進 commit 訊息或常見問題。
