# CLAUDE.md

- 完整需求在 `SPEC.md`，資料設定在 `config/`，真實資料樣本在 `fixtures/`。開始前先讀這三個。
- 使用者看得到的文字（小工具介面、推播、README）一律繁體中文、台灣用語。程式碼註解可用英文。
- 開發環境的網路可能連不到 nsysu.edu.tw、twse.com.tw、youbike.com.tw、open-meteo.com。連不到就用 fixtures 開發與測試，不要一直重試。真正的連線會在 GitHub Actions 上驗證。
- 不要把 NTFY_TOPIC 或任何秘密寫進檔案、log 或 commit。
- 完成後：`npm test` 全過、`npm run build` 產生 `dist/NSYSU-HUD.js`、`npm run preview` 能印出每個模式的版面。
