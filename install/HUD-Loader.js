// NSYSU HUD 安裝器：整段貼到 Scriptable 的新腳本。主程式會自動下載、每天檢查一次更新，沒網路就用上次的版本。
const SRC = "https://raw.githubusercontent.com/andrewlin9697/nsysu-hud/main/dist/NSYSU-HUD.js";
const fm = FileManager.local();
const path = fm.joinPath(fm.libraryDirectory(), "NSYSU-HUD.js");
const cached = fm.fileExists(path);
if (!cached || Date.now() - fm.modificationDate(path).getTime() > 24 * 3600 * 1000) {
  try {
    const req = new Request(SRC);
    req.timeoutInterval = 15;
    const code = await req.loadString();
    if (req.response.statusCode === 200 && code.includes("NSYSU-HUD")) fm.writeString(path, code);
  } catch (e) { console.log("下載失敗，先用上次的版本：" + e); }
}
if (!fm.fileExists(path)) throw new Error("第一次使用需要網路，請連上網路後再執行一次。");
const hud = { exports: {} };
new Function("module", "exports", fm.readString(path))(hud, hud.exports);
await hud.exports.run({ path });
