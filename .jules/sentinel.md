## 2025-02-27 - [Add file size check to electron dialog:openFile]
**Vulnerability:** Missing file size limit in electron main process `fs.promises.readFile` file loader, leading to potential Out Of Memory / Denial of Service attacks when loading maliciously large files.
**Learning:** Even though the web frontend checks file sizes, the Electron main process must enforce limits too as it loads files directly into Node context.
**Prevention:** Always `stat` file sizes before `readFile` when accepting user input in electron IPC handlers.
