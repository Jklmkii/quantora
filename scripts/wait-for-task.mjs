import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const READY_TAG = '<!-- QUANTORA_TASK_READY -->';
const INBOX_DIR = path.resolve('tasks/inbox');
const PROCESSING_DIR = path.resolve('tasks/processing');
const DONE_DIR = path.resolve('tasks/done');
const DOWNLOADS_DIR = path.join(os.homedir(), 'Downloads');

[INBOX_DIR, PROCESSING_DIR, DONE_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

function isFileReady(filePath) {
  try {
    if (!fs.existsSync(filePath)) return false;
    const stat = fs.statSync(filePath);
    if (!stat.isFile() || stat.size === 0) return false;
    const content = fs.readFileSync(filePath, 'utf-8').trim();
    return content.endsWith(READY_TAG);
  } catch {
    return false;
  }
}

function pullFromDownloads() {
  if (!fs.existsSync(DOWNLOADS_DIR)) return;
  for (const file of fs.readdirSync(DOWNLOADS_DIR)) {
    if (!file.endsWith('.md')) continue;
    const fullPath = path.join(DOWNLOADS_DIR, file);
    if (isFileReady(fullPath)) {
      const destPath = path.join(INBOX_DIR, file);
      fs.renameSync(fullPath, destPath);
      console.log(`[HOOK] Arquivo detectado em Downloads e movido para: ${destPath}`);
    }
  }
}

function checkQueue() {
  pullFromDownloads();
  const files = fs
    .readdirSync(INBOX_DIR)
    .filter((f) => f.endsWith('.md'))
    .sort();

  for (const file of files) {
    const inboxPath = path.join(INBOX_DIR, file);
    if (isFileReady(inboxPath)) {
      const processingPath = path.join(PROCESSING_DIR, file);
      fs.renameSync(inboxPath, processingPath);
      console.log(`NEXT_TASK_FILE=${processingPath}`);
      process.exit(0);
    }
  }
}

checkQueue();
console.log(`[HOOK] Aguardando arquivos .md finalizados com ${READY_TAG} em tasks/inbox/ ou ~/Downloads...`);

let debounce = null;
const trigger = () => {
  clearTimeout(debounce);
  debounce = setTimeout(checkQueue, 500);
};

fs.watch(INBOX_DIR, trigger);
if (fs.existsSync(DOWNLOADS_DIR)) fs.watch(DOWNLOADS_DIR, trigger);
