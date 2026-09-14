## 2025-02-27 - [Add file size check to electron dialog:openFile]
**Vulnerability:** Missing file size limit in electron main process `fs.promises.readFile` file loader, leading to potential Out Of Memory / Denial of Service attacks when loading maliciously large files.
**Learning:** Even though the web frontend checks file sizes, the Electron main process must enforce limits too as it loads files directly into Node context.
**Prevention:** Always `stat` file sizes before `readFile` when accepting user input in electron IPC handlers.
## 2024-09-14 - Add will-navigate Event Listener to Electron App
**Vulnerability:** The Electron main window (`win.webContents`) lacked a `will-navigate` event listener to prevent arbitrary navigation away from the trusted local app origin. While `setWindowOpenHandler` protected `window.open`, the main window itself was vulnerable to navigation changes (e.g., via injected `<a target="_self">` or `location.href` manipulation).
**Learning:** In Electron, developers often remember to secure `window.open` using `setWindowOpenHandler` but forget that the main `webContents` can still navigate away from the app. This is a common security gap that allows attackers to load malicious external content in the trusted app window context.
**Prevention:** Always implement a `will-navigate` event listener on `webContents` to explicitly restrict navigation only to allowed origins (e.g., the local dev server or `file://` protocols in production) alongside `setWindowOpenHandler`.
