import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const FFMPEG_PATH = fs.existsSync('C:\\msys64\\ucrt64\\bin\\ffmpeg.exe')
  ? 'C:\\msys64\\ucrt64\\bin\\ffmpeg.exe'
  : 'ffmpeg';

const ROOT = process.cwd();
const VAULT_ROOT = path.resolve(ROOT, '..', 'Obsidian-Vault');
const VIDEO_OUT_DIR = path.join(ROOT, 'release', 'e2e-evidence', 'video');
const VAULT_VIDEO_DIR = path.join(VAULT_ROOT, '10 - Projetos', 'Quantora', 'Gravacoes E2E', 'videos');
const ARTIFACT_DIR = path.join(
  os.homedir(),
  '.gemini',
  'antigravity',
  'brain',
  '75ba7db7-9d72-4d85-8fa9-5e892e1da00d'
);
const FRAMES_DIR = path.join(os.tmpdir(), 'quantora_progress_bar_frames_' + Date.now());

fs.mkdirSync(VIDEO_OUT_DIR, { recursive: true });
fs.mkdirSync(VAULT_VIDEO_DIR, { recursive: true });
fs.mkdirSync(FRAMES_DIR, { recursive: true });

// 1. Discover active sidecar port from sidecar.log
const logPath = path.join(
  os.homedir(),
  '.gemini',
  'antigravity',
  'sidecar_data',
  'coding-progress-bar',
  'panel',
  'logs',
  'sidecar.log'
);
const logContent = fs.readFileSync(logPath, 'utf8').slice(-500);
const portMatches = [...logContent.matchAll(/127\.0\.0\.1:(\d+)/g)];
if (portMatches.length === 0) {
  throw new Error('Could not find sidecar port in sidecar.log');
}
const PORT = portMatches[portMatches.length - 1][1];
const BASE_URL = `http://127.0.0.1:${PORT}`;
console.log(`[E2E] Testing sidecar at ${BASE_URL}`);

// 2. Test Anti-Hang Guard in scripts/coding-progress-tracker.cjs
function testAntiHangGuard() {
  const trackerPath = path.join(ROOT, 'scripts', 'coding-progress-tracker.cjs');

  // Case A: Dangerous recursive command without -Depth -> MUST DENY
  const badPayload = JSON.stringify({
    toolCall: {
      name: 'run_command',
      args: {
        CommandLine: 'Get-ChildItem -Path . -Recurse | Select-Object FullName',
      },
    },
  });
  const resBad = spawnSync('node', [trackerPath, 'pre-tool'], {
    input: badPayload,
    encoding: 'utf8',
  });
  const parsedBad = JSON.parse(resBad.stdout.trim());
  if (parsedBad.decision !== 'deny') {
    throw new Error(`Expected deny for unsafe Get-ChildItem -Recurse, got: ${resBad.stdout}`);
  }

  // Case B: Safe command -> MUST ALLOW
  const goodPayload = JSON.stringify({
    toolCall: {
      name: 'run_command',
      args: {
        CommandLine: 'npm run lint',
        toolSummary: 'Running Oxlint',
      },
    },
  });
  const resGood = spawnSync('node', [trackerPath, 'pre-tool'], {
    input: goodPayload,
    encoding: 'utf8',
  });
  const parsedGood = JSON.parse(resGood.stdout.trim());
  if (parsedGood.decision !== 'allow') {
    throw new Error(`Expected allow for safe command, got: ${resGood.stdout}`);
  }

  return {
    unsafeCommandBlocked: true,
    denyReason: parsedBad.reason,
    safeCommandAllowed: true,
  };
}

async function run() {
  const startedAt = Date.now();
  const guardReport = testAntiHangGuard();
  console.log('[E2E] Anti-Hang Guard verified:', guardReport.unsafeCommandBlocked);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    defaultViewport: { width: 1280, height: 800, deviceScaleFactor: 1 },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // Inject mock window.sidecar before page scripts run so we simulate the Antigravity host window!
  await page.evaluateOnNewDocument(() => {
    window.__mockHostConvId = '75ba7db7-9d72-4d85-8fa9-5e892e1da00d';
    window.__mockWorkspaceUri = 'file:///c:/Users/lucas/OneDrive/%C3%81rea%20de%20Trabalho/code/quantora';
    Object.defineProperty(window, 'sidecar', {
      configurable: true,
      get() {
        return {
          conversationId: window.__mockHostConvId,
          getWorkspaceUris: async () => [window.__mockWorkspaceUri],
          onWorkspaceChange: (cb) => {
            window.__workspaceChangeListener = cb;
            return () => {};
          },
        };
      },
      set() {},
    });
  });

  let frameIndex = 0;
  const saveFrames = async (count = 8) => {
    const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
    for (let i = 0; i < count; i++) {
      frameIndex++;
      const fname = `frame_${String(frameIndex).padStart(5, '0')}.jpg`;
      fs.writeFileSync(path.join(FRAMES_DIR, fname), buf);
    }
    return buf;
  };

  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 600));

  // Add a visual HUD header around the panel so the 1280x800 video looks crisp and self-explanatory
  await page.evaluate(() => {
    document.body.style.maxWidth = '760px';
    document.body.style.margin = '24px auto';
    document.body.style.background = '#090d16';
    const banner = document.createElement('div');
    banner.id = 'e2eBanner';
    banner.style.cssText =
      'background:linear-gradient(90deg,#1e3a8a,#3b82f6);color:#fff;padding:10px 16px;border-radius:10px;margin-bottom:12px;font-weight:700;font-size:13px;display:flex;justify-content:space-between;align-items:center;box-shadow:0 4px 15px rgba(59,130,246,0.3);';
    banner.innerHTML =
      '<span>🧪 AUDITORIA E2E • PAINEL PROGRESSO & ETA MULTI-PROJETO</span><span id="e2eStepLabel">Passo 1/4: Conversa Aberta (quantora)</span>';
    document.querySelector('.container').prepend(banner);
  });

  // Milestone 1: Conversa Aberta (quantora)
  await saveFrames(18);
  const m1Buf = await page.screenshot({ type: 'jpeg', quality: 92 });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'milestone_01_progress_open_quantora.jpg'), m1Buf);

  const m1Data = await page.evaluate(() => ({
    badge: document.getElementById('projectBadge')?.textContent?.trim(),
    tabs: [...document.querySelectorAll('.conv-tab')].map((b) => b.textContent.replace(/\s+/g, ' ').trim()),
  }));
  console.log('[E2E] Milestone 1 (Auto -> quantora):', m1Data);

  // Milestone 2: Click on "gerenciador_senhas" tab while still in quantora host window!
  await page.evaluate(() => {
    document.getElementById('e2eStepLabel').textContent =
      'Passo 2/4: Clique na aba 📁 gerenciador_senhas (sem renomear para quantora!)';
    const tabs = [...document.querySelectorAll('.conv-tab')];
    const aegonTab = tabs.find((t) => t.textContent.includes('gerenciador_senhas'));
    if (aegonTab) aegonTab.click();
  });
  await new Promise((r) => setTimeout(r, 850));
  await saveFrames(20);
  const m2Buf = await page.screenshot({ type: 'jpeg', quality: 92 });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'milestone_02_progress_tab_aegon.jpg'), m2Buf);

  const m2Data = await page.evaluate(() => ({
    badge: document.getElementById('projectBadge')?.textContent?.trim(),
    tabs: [...document.querySelectorAll('.conv-tab')].map((b) => b.textContent.replace(/\s+/g, ' ').trim()),
  }));
  console.log('[E2E] Milestone 2 (Clicked gerenciador_senhas):', m2Data);
  if (!m2Data.badge?.includes('gerenciador_senhas')) {
    throw new Error(`Expected badge to be gerenciador_senhas, got ${m2Data.badge}`);
  }

  // Milestone 3: Click on "jujutsu" tab!
  await page.evaluate(() => {
    document.getElementById('e2eStepLabel').textContent =
      'Passo 3/4: Clique na aba 📁 jujutsu (preservação estrita de projeto)';
    const tabs = [...document.querySelectorAll('.conv-tab')];
    const jTab = tabs.find((t) => t.textContent.includes('jujutsu'));
    if (jTab) jTab.click();
  });
  await new Promise((r) => setTimeout(r, 850));
  await saveFrames(20);
  const m3Buf = await page.screenshot({ type: 'jpeg', quality: 92 });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'milestone_03_progress_tab_jujutsu.jpg'), m3Buf);

  const m3Data = await page.evaluate(() => ({
    badge: document.getElementById('projectBadge')?.textContent?.trim(),
    tabs: [...document.querySelectorAll('.conv-tab')].map((b) => b.textContent.replace(/\s+/g, ' ').trim()),
  }));
  console.log('[E2E] Milestone 3 (Clicked jujutsu):', m3Data);
  if (!m3Data.badge?.includes('jujutsu')) {
    throw new Error(`Expected badge to be jujutsu, got ${m3Data.badge}`);
  }

  // Milestone 4: Click back on "🎯 Conversa Aberta" -> returns to quantora!
  await page.evaluate(() => {
    document.getElementById('e2eStepLabel').textContent =
      'Passo 4/4: Retorno para 🎯 Conversa Aberta (quantora sincronizado)';
    const tabs = [...document.querySelectorAll('.conv-tab')];
    const autoTab = tabs.find((t) => t.getAttribute('data-conv') === 'auto');
    if (autoTab) autoTab.click();
  });
  await new Promise((r) => setTimeout(r, 850));
  await saveFrames(22);
  const m4Buf = await page.screenshot({ type: 'jpeg', quality: 92 });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'milestone_04_progress_back_to_auto.jpg'), m4Buf);

  const m4Data = await page.evaluate(() => ({
    badge: document.getElementById('projectBadge')?.textContent?.trim(),
    tabs: [...document.querySelectorAll('.conv-tab')].map((b) => b.textContent.replace(/\s+/g, ' ').trim()),
  }));
  console.log('[E2E] Milestone 4 (Back to Auto -> quantora):', m4Data);

  await browser.close();

  // Encode MP4, WebM (realtime!) and GIF
  const mp4Path = path.join(VIDEO_OUT_DIR, 'progress-bar-multiproyect-e2e.mp4');
  const webmPath = path.join(VIDEO_OUT_DIR, 'progress-bar-multiproyect-e2e.webm');
  const gifPath = path.join(VIDEO_OUT_DIR, 'progress-bar-multiproyect-e2e.gif');

  const inputPattern = path.join(FRAMES_DIR, 'frame_%05d.jpg');

  execFileSync(FFMPEG_PATH, [
    '-y',
    '-framerate', '12',
    '-i', inputPattern,
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-preset', 'ultrafast',
    mp4Path,
  ]);

  execFileSync(FFMPEG_PATH, [
    '-y',
    '-framerate', '12',
    '-i', inputPattern,
    '-c:v', 'libvpx-vp9',
    '-deadline', 'realtime',
    '-cpu-used', '8',
    '-b:v', '1M',
    webmPath,
  ]);

  execFileSync(FFMPEG_PATH, [
    '-y',
    '-framerate', '12',
    '-i', inputPattern,
    '-vf', 'fps=8,scale=800:-1:flags=lanczos',
    gifPath,
  ]);

  // Copy to Vault videos directory and Artifact directory
  for (const src of [mp4Path, webmPath, gifPath]) {
    const base = path.basename(src);
    fs.copyFileSync(src, path.join(VAULT_VIDEO_DIR, base));
  }

  const report = {
    suite: 'Coding Progress Bar Multi-Project & Anti-Hang Watchdog E2E',
    timestamp: new Date().toISOString(),
    durationMs: Date.now() - startedAt,
    totalFrames: frameIndex,
    sidecarPort: Number(PORT),
    antiHangGuard: guardReport,
    milestones: {
      m1_auto_quantora: m1Data,
      m2_tab_gerenciador_senhas: m2Data,
      m3_tab_jujutsu: m3Data,
      m4_return_auto_quantora: m4Data,
    },
    media: {
      mp4: mp4Path,
      webm: webmPath,
      gif: gifPath,
    },
  };

  fs.writeFileSync(
    path.join(ROOT, 'release', 'PROGRESS_BAR_E2E_REPORT.json'),
    JSON.stringify(report, null, 2)
  );
  console.log('[E2E] Complete!', JSON.stringify(report.milestones));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
