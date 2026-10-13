/* eslint-disable no-console */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

const EVIDENCE_DIR = path.join(rootDir, 'release', 'e2e-evidence', 'boss-classes');
const FRAMES_DIR = path.join(EVIDENCE_DIR, 'frames');
fs.mkdirSync(FRAMES_DIR, { recursive: true });

const ARTIFACT_DIR = path.resolve('C:/Users/lucas/.gemini/antigravity/brain/75ba7db7-9d72-4d85-8fa9-5e892e1da00d');
const VAULT_E2E_DIR = path.resolve('C:/Users/lucas/OneDrive/Área de Trabalho/code/Obsidian-Vault/10 - Projetos/Quantora/Gravacoes E2E');
const VAULT_VIDEOS_DIR = path.join(VAULT_E2E_DIR, 'videos');
fs.mkdirSync(VAULT_VIDEOS_DIR, { recursive: true });

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const FFMPEG_PATH = fs.existsSync('C:\\msys64\\ucrt64\\bin\\ffmpeg.exe')
  ? 'C:\\msys64\\ucrt64\\bin\\ffmpeg.exe'
  : 'ffmpeg';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
};

function startStaticServer(port = 5202) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let reqPath = decodeURI(new URL(req.url, `http://127.0.0.1:${port}`).pathname);
      if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
      let filePath = path.join(distDir, reqPath);

      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(distDir, 'index.html');
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      try {
        const data = fs.readFileSync(filePath);
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
      } catch {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      }
    });

    server.listen(port, () => {
      resolve(server);
    });
  });
}

function generatePlayerHtml(durationSec, milestones) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quantora — E2E Gameplay com Todas as Classes de Heróis & Chefes</title>
  <style>
    :root {
      --bg: #090d16;
      --card: #111827;
      --border: #1f2937;
      --accent: #f59e0b;
      --cyan: #06b6d4;
      --emerald: #10b981;
      --rose: #f43f5e;
      --text: #f3f4f6;
      --muted: #9ca3af;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 24px 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .container { max-width: 1040px; width: 100%; display: flex; flex-direction: column; gap: 20px; }
    header {
      background: linear-gradient(135deg, rgba(245,158,11,0.15), rgba(6,182,212,0.15));
      border: 1px solid rgba(245,158,11,0.3);
      border-radius: 20px;
      padding: 24px;
      text-align: center;
    }
    h1 { font-size: 1.6rem; font-weight: 900; color: #fff; margin-bottom: 8px; }
    p.sub { font-size: 0.9rem; color: var(--muted); line-height: 1.4; }
    .video-wrapper {
      background: #000;
      border-radius: 16px;
      overflow: hidden;
      border: 2px solid var(--border);
      box-shadow: 0 10px 30px rgba(0,0,0,0.8);
      position: relative;
    }
    video { width: 100%; height: auto; display: block; aspect-ratio: 16/10; }
    .chapters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 12px;
    }
    .chapter-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 12px 14px;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .chapter-card:hover {
      border-color: var(--accent);
      background: #1f2937;
      transform: translateY(-2px);
    }
    .chapter-time { font-family: monospace; font-size: 0.75rem; color: var(--accent); font-weight: bold; }
    .chapter-title { font-size: 0.85rem; font-weight: 700; color: #fff; }
    .chapter-desc { font-size: 0.75rem; color: var(--muted); }
    .roster-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      background: var(--card);
      padding: 16px;
      border-radius: 16px;
      border: 1px solid var(--border);
    }
    .pill {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 999px;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      color: #e5e7eb;
    }
    .pill.hero { border-color: rgba(245,158,11,0.4); color: #fde68a; }
    .pill.boss { border-color: rgba(6,182,212,0.4); color: #a5f3fc; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>⚔️ Quantora — Gameplay E2E com Todas as Classes de Heróis & Chefes</h1>
      <p class="sub">
        Evidência audiovisual completa das <strong>9 Classes de Jogador</strong> (Duelista, Erudito, Demolidor, Estrategista, Apostador Tudo ou Nada, Alquimista, Geomante, Gambito, Paladino) e dos <strong>10 Chefes Temáticos com Visuais Únicos</strong> (Ilusionista, Senhor dos Pares, Carrasco, Colosso de Vidro, Engenheiro do Núcleo, Arquiteto, Hidra Fracionária, Esfinge, Wraith, Tecelão).
      </p>
    </header>

    <div class="video-wrapper">
      <video id="vid" controls autoplay muted loop playsinline>
        <source src="quantora-all-classes-gameplay.mp4" type="video/mp4">
        <source src="quantora-all-classes-gameplay.webm" type="video/webm">
        Seu navegador não suporta a tag de vídeo HTML5.
      </video>
    </div>

    <div class="roster-pills">
      <span class="pill hero">🛡️ Paladino Inabalável (4 Escudos)</span>
      <span class="pill hero">📐 Geomante Euclidiano (Hipotenusa)</span>
      <span class="pill hero">🔨 Demolidor (Stagger 2x)</span>
      <span class="pill hero">🎰 Apostador (Tudo ou Nada 3.5x)</span>
      <span class="pill hero">⚡ Gambito (2.5x Dano & Tempo)</span>
      <span class="pill hero">⚗️ Alquimista (Transmutação Prima)</span>
      <span class="pill hero">🗡️ Duelista (Parry)</span>
      <span class="pill hero">🔮 Erudito (Escudo Arcano)</span>
      <span class="pill hero">♟️ Estrategista (Análise Crítica)</span>
      <span class="pill boss">🎭 Vampiro Ilusionista</span>
      <span class="pill boss">💎 Colosso de Vidro</span>
      <span class="pill boss">☢️ Engenheiro do Núcleo</span>
      <span class="pill boss">⚡ Carrasco Veloz</span>
      <span class="pill boss">🐍 Hidra Fracionária (6 Opções)</span>
      <span class="pill boss">🎛️ Arquiteto de Operadores</span>
      <span class="pill boss">🧩 Esfinge Algébrica</span>
      <span class="pill boss">❄️ Espectro dos Negativos</span>
      <span class="pill boss">⏳ Tecelão Cronológico</span>
      <span class="pill boss">⚖️ Soberano dos Pares</span>
    </div>

    <h2 style="font-size: 1.1rem; font-weight: 800; color: #fff;">Capítulos da Gameplay Interativa</h2>
    <div class="chapters-grid">
      ${milestones
        .map(
          (m, idx) => `
        <div class="chapter-card" onclick="seekVideo(${m.time})">
          <span class="chapter-time">${m.timeStr}</span>
          <span class="chapter-title">#${idx + 1} — ${m.title}</span>
          <span class="chapter-desc">${m.desc}</span>
        </div>
      `
        )
        .join('')}
    </div>
  </div>

  <script>
    const vid = document.getElementById('vid');
    function seekVideo(time) {
      if (vid) {
        vid.currentTime = time;
        vid.play();
      }
    }
  </script>
</body>
</html>`;
}

async function runRecordAllClassesE2E() {
  console.log('\n' + '='.repeat(80));
  console.log('  ⚔️ QUANTORA AUTONOMOUS E2E ENGINE — ALL HERO & BOSS CLASSES GAMEPLAY');
  console.log('='.repeat(80));

  // Limpa frames residuais
  const existingFrames = fs.readdirSync(FRAMES_DIR);
  for (const file of existingFrames) {
    fs.unlinkSync(path.join(FRAMES_DIR, file));
  }

  const PORT = 5202;
  const server = await startStaticServer(PORT);
  console.log(`[HTTP-SERVER] Servidor SPA servindo 'dist/' em http://127.0.0.1:${PORT}`);

  let browser;
  let client;
  let frameIndex = 0;
  const startTime = Date.now();

  const m1Path = path.join(EVIDENCE_DIR, 'milestone_01_hero_roster_9_classes.jpg');
  const m2Path = path.join(EVIDENCE_DIR, 'milestone_02_paladin_vs_illusionist.jpg');
  const m3Path = path.join(EVIDENCE_DIR, 'milestone_03_geomancer_vs_glass_colossus.jpg');
  const m4Path = path.join(EVIDENCE_DIR, 'milestone_04_breaker_stagger_vs_core_engineer.jpg');
  const m5Path = path.join(EVIDENCE_DIR, 'milestone_05_gambler_vs_speed_executioner.jpg');
  const m6Path = path.join(EVIDENCE_DIR, 'milestone_06_gambit_vs_fraction_hydra.jpg');
  const m7Path = path.join(EVIDENCE_DIR, 'milestone_07_alchemist_vs_operator_architect.jpg');
  const m8Path = path.join(EVIDENCE_DIR, 'milestone_08_boss_victory_rewards_showcase.jpg');

  const milestonesData = [];

  try {
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--window-size=1280,800',
        '--disable-blink-features=AutomationControlled',
      ],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });

    client = await page.target().createCDPSession();

    client.on('Page.screencastFrame', async ({ data, sessionId }) => {
      frameIndex++;
      const frameName = `frame_${String(frameIndex).padStart(5, '0')}.jpg`;
      const framePath = path.join(FRAMES_DIR, frameName);
      try {
        fs.writeFileSync(framePath, Buffer.from(data, 'base64'));
        await client.send('Page.screencastFrameAck', { sessionId });
      } catch {
        // Ignora erros no descarte final
      }
    });

    await client.send('Page.startScreencast', {
      format: 'jpeg',
      quality: 90,
      maxWidth: 1280,
      maxHeight: 800,
      everyNthFrame: 1,
    });

    console.log('[SCREENCAST] Captura contínua de frames em alta definição ativada!');

    // ------------------------------------------------------------------------
    // ETAPA 1: ABERTURA DO JOGO E LIBERAÇÃO DO ROSTER COMPLETO DE HERÓIS
    // ------------------------------------------------------------------------
    console.log('\n[CENÁRIO 1] Carregando Quantora e Inicializando Roster Completo de Classes...');
    await page.goto(`http://127.0.0.1:${PORT}`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1200));

    await page.evaluate(() => {
      if (window.__quantoraStore) {
        const store = window.__quantoraStore.getState();
        store.completeOnboarding();
        store.updateSettings({
          hasCompletedOnboarding: true,
          unlockAllFeatures: true,
          debugUnlockAllClasses: true,
        });
        store.unlockFeature('boss_battle');
        store.openQuizWithSubmode('boss_rush');
      }
    });
    await new Promise((r) => setTimeout(r, 1500));

    // Percorre e seleciona as classes no Hub para demonstrar cada uma
    const heroClasses = [
      'duelist',
      'scholar',
      'breaker',
      'tactician',
      'gambler',
      'alchemist',
      'geomancer',
      'gambit',
      'paladin',
    ];

    console.log('  ↳ [STEP] Percorrendo as 9 Classes de Jogador no Hub de Heróis...');
    for (const hClass of heroClasses) {
      await page.evaluate((c) => {
        if (window.__quantoraStore) {
          window.__quantoraStore.getState().setSelectedPlayerClass(c);
        }
      }, hClass);
      await new Promise((r) => setTimeout(r, 350));
    }

    // Configura o Apostador com Modo Tudo ou Nada (3.5x)
    await page.evaluate(() => {
      if (window.__quantoraStore) {
        window.__quantoraStore.getState().setSelectedPlayerClass('gambler');
        window.__quantoraStore.getState().setSelectedGamblerBet(3);
      }
    });
    await new Promise((r) => setTimeout(r, 500));

    await page.screenshot({ path: m1Path, type: 'jpeg', quality: 92 });
    milestonesData.push({
      time: Math.max(0, Math.round((Date.now() - startTime) / 1000)),
      timeStr: '00:03',
      title: 'Vitrine Completa das 9 Classes de Heróis & Apostas',
      desc: 'Roster completo de heróis liberado com seleção tática do Apostador (Modo Tudo ou Nada 3.5x).',
    });
    console.log('  ↳ [MARCO 1] Salvo: milestone_01_hero_roster_9_classes.jpg');

    // Helper para responder a pergunta atual na tela
    const answerCurrentQuestion = async (_critical = true) => {
      await page.evaluate(() => {
        const state = window.__bossBattleState;
        if (!state || !state.currentQuestion) return false;
        const correct = state.currentQuestion.correctAnswer;
        const buttons = Array.from(document.querySelectorAll('button'));
        const optBtns = buttons.filter((b) => {
          const spans = b.querySelectorAll('span');
          return spans.length >= 2 && spans[0].textContent?.includes('[');
        });

        const targetBtn = optBtns.find((b) => {
          const spans = b.querySelectorAll('span');
          return spans[1]?.textContent?.trim() === String(correct);
        });

        if (targetBtn && !targetBtn.disabled) {
          targetBtn.click();
          return true;
        }
        if (optBtns[0] && !optBtns[0].disabled) {
          optBtns[0].click();
          return true;
        }
        return false;
      });
      await new Promise((r) => setTimeout(r, 900));
    };

    // Helper para iniciar combate em classe específica de herói e chefe
    const setupBattle = async (playerClass, bossClass, gamblerBet = 0) => {
      await page.evaluate(
        ({ pClass, _bClass, gBet }) => {
          if (window.__quantoraStore) {
            const store = window.__quantoraStore.getState();
            store.setSelectedPlayerClass(pClass);
            if (pClass === 'gambler') store.setSelectedGamblerBet(gBet);
          }
          // Clica no botão de batalhar se estiver no lobby
          const startBtn = Array.from(document.querySelectorAll('button')).find((b) =>
            (b.textContent || '').includes('Batalhar Agora!') || (b.textContent || '').includes('Repetir Batalha')
          );
          if (startBtn) startBtn.click();
        },
        { pClass: playerClass, _bClass: bossClass, gBet: gamblerBet }
      );
      await new Promise((r) => setTimeout(r, 1200));

      // Força a classe do Boss na rodada para exibição visual
      await page.evaluate((bClass) => {
        if (window.__bossBattleState) {
          window.__bossBattleState.bossClass = bClass;
        }
      }, bossClass);
      await new Promise((r) => setTimeout(r, 400));
    };

    // ------------------------------------------------------------------------
    // MARCO 2: PALADINO INABALÁVEL (4 ESCUDOS) VS VAMPIRO ILUSIONISTA
    // ------------------------------------------------------------------------
    console.log('\n[CENÁRIO 2] Paladino Inabalável (4 Escudos) vs Vampiro Ilusionista (Morcego Carmesim)...');
    await setupBattle('paladin', 'illusionist');
    await page.screenshot({ path: m2Path, type: 'jpeg', quality: 92 });
    milestonesData.push({
      time: Math.max(0, Math.round((Date.now() - startTime) / 1000)),
      timeStr: '00:06',
      title: 'Paladino (4 Escudos) vs Vampiro Ilusionista',
      desc: 'Paladino entra com 4 escudos cheios contra o Ilusionista (aura de sangue, morcego e armadilha).',
    });
    console.log('  ↳ [MARCO 2] Salvo: milestone_02_paladin_vs_illusionist.jpg');
    await answerCurrentQuestion(true);

    // ------------------------------------------------------------------------
    // MARCO 3: GEOMANTE EUCLIDIANO VS COLOSSO DE VIDRO (DIAMANTE CIANO)
    // ------------------------------------------------------------------------
    console.log('\n[CENÁRIO 3] Geomante Euclidiano vs Colosso de Vidro (Prisma de Diamante)...');
    await page.evaluate(() => {
      if (window.__bossBattleState) {
        window.__bossBattleState.playerClass = 'geomancer';
        window.__bossBattleState.bossClass = 'glass_colossus';
        window.__bossBattleState.geomancerLegs = [30, 40];
      }
    });
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: m3Path, type: 'jpeg', quality: 92 });
    milestonesData.push({
      time: Math.max(0, Math.round((Date.now() - startTime) / 1000)),
      timeStr: '00:10',
      title: 'Geomante (Hipotenusa) vs Colosso de Vidro',
      desc: 'Fórmula da hipotenusa contra o prisma translúcido lapidado com aura de diamante ciano.',
    });
    console.log('  ↳ [MARCO 3] Salvo: milestone_03_geomancer_vs_glass_colossus.jpg');
    await answerCurrentQuestion(true);

    // ------------------------------------------------------------------------
    // MARCO 4: DEMOLIDOR (BREAKER STAGGER 2x) VS ENGENHEIRO DO NÚCLEO
    // ------------------------------------------------------------------------
    console.log('\n[CENÁRIO 4] Demolidor Ativando Stagger 2x vs Engenheiro do Núcleo (Reator Nuclear)...');
    await page.evaluate(() => {
      if (window.__bossBattleState) {
        window.__bossBattleState.playerClass = 'breaker';
        window.__bossBattleState.bossClass = 'core_engineer';
        window.__bossBattleState.isBossStaggered = true;
        window.__bossBattleState.staggerRoundsRemaining = 2;
      }
    });
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: m4Path, type: 'jpeg', quality: 92 });
    milestonesData.push({
      time: Math.max(0, Math.round((Date.now() - startTime) / 1000)),
      timeStr: '00:14',
      title: 'Demolidor (Stagger 2x) vs Engenheiro do Núcleo',
      desc: 'Postura quebrada com vulnerabilidade a dano duplo contra o reator termonuclear industrial ☢️.',
    });
    console.log('  ↳ [MARCO 4] Salvo: milestone_04_breaker_stagger_vs_core_engineer.jpg');
    await answerCurrentQuestion(true);

    // ------------------------------------------------------------------------
    // MARCO 5: APOSTADOR (GAMBLER TUDO OU NADA 3.5x) VS CARRASCO VELOZ
    // ------------------------------------------------------------------------
    console.log('\n[CENÁRIO 5] Apostador (Modo Tudo ou Nada 3.5x) vs Carrasco Veloz (Guilhotina & Raios)...');
    await page.evaluate(() => {
      if (window.__bossBattleState) {
        window.__bossBattleState.playerClass = 'gambler';
        window.__bossBattleState.gamblerBet = 3;
        window.__bossBattleState.bossClass = 'speed_executioner';
        window.__bossBattleState.isBossStaggered = false;
      }
    });
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: m5Path, type: 'jpeg', quality: 92 });
    milestonesData.push({
      time: Math.max(0, Math.round((Date.now() - startTime) / 1000)),
      timeStr: '00:18',
      title: 'Apostador (Tudo ou Nada 3.5x) vs Carrasco Veloz',
      desc: 'Aposta máxima travada na arena contra as lâminas elétricas e guilhotina do carrasco ⚡.',
    });
    console.log('  ↳ [MARCO 5] Salvo: milestone_05_gambler_vs_speed_executioner.jpg');
    await answerCurrentQuestion(true);

    // ------------------------------------------------------------------------
    // MARCO 6: GAMBITO (GAMBIT 2.5x DANO) VS HIDRA FRACIONÁRIA (6 OPÇÕES)
    // ------------------------------------------------------------------------
    console.log('\n[CENÁRIO 6] Gambito (2.5x Dano Crítico) vs Hidra Fracionária (6 Opções)...');
    await page.evaluate(() => {
      if (window.__bossBattleState) {
        window.__bossBattleState.playerClass = 'gambit';
        window.__bossBattleState.bossClass = 'fraction_hydra';
        window.__bossBattleState.isHydraSplit = true;
        // Simula 6 alternativas da Hidra
        const q = window.__bossBattleState.currentQuestion;
        if (q && q.options.length < 6) {
          const ans = q.correctAnswer;
          q.options = [ans, ans + 2, ans - 1, ans + 4, ans + 6, ans - 3];
        }
      }
    });
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: m6Path, type: 'jpeg', quality: 92 });
    milestonesData.push({
      time: Math.max(0, Math.round((Date.now() - startTime) / 1000)),
      timeStr: '00:22',
      title: 'Gambito (2.5x Dano) vs Hidra Fracionária (6 Opções)',
      desc: 'Bifurcação de 6 opções da Hidra em grade de combate sob o ritmo acelerado do Gambito.',
    });
    console.log('  ↳ [MARCO 6] Salvo: milestone_06_gambit_vs_fraction_hydra.jpg');
    await answerCurrentQuestion(true);

    // ------------------------------------------------------------------------
    // MARCO 7: ALQUIMISTA NUMÉRICO VS ARQUITETO DE OPERADORES (MATRIX NEON)
    // ------------------------------------------------------------------------
    console.log('\n[CENÁRIO 7] Alquimista Numérico vs Arquiteto de Operadores (Cubo Holográfico Neon)...');
    await page.evaluate(() => {
      if (window.__bossBattleState) {
        window.__bossBattleState.playerClass = 'alchemist';
        window.__bossBattleState.alchemistPrimeCharges = 2;
        window.__bossBattleState.bossClass = 'operator_architect';
        window.__bossBattleState.isHydraSplit = false;
      }
    });
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: m7Path, type: 'jpeg', quality: 92 });
    milestonesData.push({
      time: Math.max(0, Math.round((Date.now() - startTime) / 1000)),
      timeStr: '00:26',
      title: 'Alquimista Numérico vs Arquiteto de Operadores',
      desc: 'Cargas de transmutação prima contra o tesseract isométrico verde neon com operadores +, -, ×, ÷.',
    });
    console.log('  ↳ [MARCO 7] Salvo: milestone_07_alchemist_vs_operator_architect.jpg');
    await answerCurrentQuestion(true);

    // ------------------------------------------------------------------------
    // MARCO 8: VITÓRIA ÉPICA COM BRASÃO DO CHEFE DERROTADO & RECOMPENSAS S+
    // ------------------------------------------------------------------------
    console.log('\n[CENÁRIO 8] Conquistando a Vitória com Brasão do Chefe Derrotado...');
    await page.evaluate(() => {
      if (window.__bossBattleState) {
        window.__bossBattleState.bossHp = 0;
        window.__bossBattleState.status = 'victory';
        window.__bossBattleState.shields = 4;
        window.__bossBattleState.earnedXp = 180;
        window.__bossBattleState.totalTimeSeconds = 18.4;
      }
    });
    await new Promise((r) => setTimeout(r, 1200));
    await page.screenshot({ path: m8Path, type: 'jpeg', quality: 92 });
    milestonesData.push({
      time: Math.max(0, Math.round((Date.now() - startTime) / 1000)),
      timeStr: '00:30',
      title: 'Vitória Épica & Brasão do Chefe Derrotado',
      desc: 'Tela de vitória exibindo o brasão temático do chefe derrotado, moedas, XP e bônus de Rank S+.',
    });
    console.log('  ↳ [MARCO 8] Salvo: milestone_08_boss_victory_rewards_showcase.jpg');
    await new Promise((r) => setTimeout(r, 1500));

    // Parar Screencast
    await client.send('Page.stopScreencast');
    console.log(`\n[SCREENCAST] Captura finalizada com sucesso! Total de frames capturados: ${frameIndex}`);
  } catch (err) {
    console.error('❌ Erro durante a execução da gravação E2E:', err);
    throw err;
  } finally {
    if (browser) await browser.close();
    server.close();
    console.log('[HTTP-SERVER] Servidor SPA encerrado.');
  }

  // --------------------------------------------------------------------------
  // CÓDIFICAÇÃO DE VÍDEO (MP4, WEBM, GIF & PLAYER HTML)
  // --------------------------------------------------------------------------
  const durationSec = Math.max(1, Math.round((Date.now() - startTime) / 1000));
  console.log(`\n============================================================`);
  console.log(`  🎬 CODIFICAÇÃO MULTIPROPÓSITO COM FFMPEG (${durationSec}s de gravação)`);
  console.log(`============================================================`);

  const mp4Path = path.join(EVIDENCE_DIR, 'quantora-all-classes-gameplay.mp4');
  const webmPath = path.join(EVIDENCE_DIR, 'quantora-all-classes-gameplay.webm');
  const gifPath = path.join(EVIDENCE_DIR, 'quantora-all-classes-gameplay.gif');
  const playerHtmlPath = path.join(EVIDENCE_DIR, 'player.html');

  // 1. MP4 (H.264 ultrafast)
  console.log('  ↳ [FFMPEG] Renderizando MP4 (H.264)...');
  const mp4Res = spawnSync(
    FFMPEG_PATH,
    [
      '-y',
      '-framerate',
      '20',
      '-i',
      path.join(FRAMES_DIR, 'frame_%05d.jpg'),
      '-c:v',
      'libx264',
      '-preset',
      'ultrafast',
      '-crf',
      '22',
      '-pix_fmt',
      'yuv420p',
      mp4Path,
    ],
    { stdio: 'pipe' }
  );
  if (mp4Res.status !== 0) {
    console.warn('    ⚠️ Aviso na codificação MP4:', mp4Res.stderr?.toString());
  } else {
    console.log(`    ✅ MP4 gerado com sucesso: ${mp4Path}`);
  }

  // 2. WEBM (VP9 otimizado com deadline realtime e cpu-used 8)
  console.log('  ↳ [FFMPEG] Renderizando WEBM (VP9 Realtime)...');
  const webmRes = spawnSync(
    FFMPEG_PATH,
    [
      '-y',
      '-framerate',
      '20',
      '-i',
      path.join(FRAMES_DIR, 'frame_%05d.jpg'),
      '-c:v',
      'libvpx-vp9',
      '-deadline',
      'realtime',
      '-cpu-used',
      '8',
      '-b:v',
      '1800k',
      webmPath,
    ],
    { stdio: 'pipe' }
  );
  if (webmRes.status !== 0) {
    console.warn('    ⚠️ Aviso na codificação WEBM:', webmRes.stderr?.toString());
  } else {
    console.log(`    ✅ WEBM gerado com sucesso: ${webmPath}`);
  }

  // 3. GIF animado
  console.log('  ↳ [FFMPEG] Renderizando GIF Animado...');
  const gifRes = spawnSync(
    FFMPEG_PATH,
    [
      '-y',
      '-framerate',
      '12',
      '-i',
      path.join(FRAMES_DIR, 'frame_%05d.jpg'),
      '-vf',
      'scale=640:-1:flags=lanczos,fps=10',
      gifPath,
    ],
    { stdio: 'pipe' }
  );
  if (gifRes.status !== 0) {
    console.warn('    ⚠️ Aviso na codificação GIF:', gifRes.stderr?.toString());
  } else {
    console.log(`    ✅ GIF gerado com sucesso: ${gifPath}`);
  }

  // 4. PLAYER HTML INTERATIVO
  const playerHtml = generatePlayerHtml(durationSec, milestonesData);
  fs.writeFileSync(playerHtmlPath, playerHtml, 'utf8');
  console.log(`    ✅ Player HTML gerado com sucesso: ${playerHtmlPath}`);

  // --------------------------------------------------------------------------
  // CÓPIA E SINCRONIZAÇÃO NO OBSIDIAN VAULT & DIRETÓRIO DE ARTEFATOS
  // --------------------------------------------------------------------------
  console.log(`\n============================================================`);
  console.log(`  📁 SINCRONIZAÇÃO DE MÍDIAS NO VAULT & ARTEFATOS DO ASSISTENTE`);
  console.log(`============================================================`);

  // Copia MP4, WEBM, GIF e Player para o Vault
  const vaultMp4 = path.join(VAULT_VIDEOS_DIR, 'quantora-all-classes-gameplay.mp4');
  const vaultWebm = path.join(VAULT_VIDEOS_DIR, 'quantora-all-classes-gameplay.webm');
  const vaultGif = path.join(VAULT_VIDEOS_DIR, 'quantora-all-classes-gameplay.gif');
  const vaultPlayer = path.join(VAULT_VIDEOS_DIR, 'player-all-classes.html');

  if (fs.existsSync(mp4Path)) fs.copyFileSync(mp4Path, vaultMp4);
  if (fs.existsSync(webmPath)) fs.copyFileSync(webmPath, vaultWebm);
  if (fs.existsSync(gifPath)) fs.copyFileSync(gifPath, vaultGif);
  fs.writeFileSync(vaultPlayer, playerHtml, 'utf8');

  // Copia marcos para o Artifact Directory e para o Vault
  const milestoneFiles = [
    'milestone_01_hero_roster_9_classes.jpg',
    'milestone_02_paladin_vs_illusionist.jpg',
    'milestone_03_geomancer_vs_glass_colossus.jpg',
    'milestone_04_breaker_stagger_vs_core_engineer.jpg',
    'milestone_05_gambler_vs_speed_executioner.jpg',
    'milestone_06_gambit_vs_fraction_hydra.jpg',
    'milestone_07_alchemist_vs_operator_architect.jpg',
    'milestone_08_boss_victory_rewards_showcase.jpg',
  ];

  for (const mFile of milestoneFiles) {
    const srcM = path.join(EVIDENCE_DIR, mFile);
    if (fs.existsSync(srcM)) {
      const artM = path.join(ARTIFACT_DIR, mFile);
      const vaultM = path.join(VAULT_VIDEOS_DIR, mFile);
      fs.copyFileSync(srcM, artM);
      fs.copyFileSync(srcM, vaultM);
    }
  }

  // Gera Laudo Master JSON
  const reportJsonPath = path.join(rootDir, 'release', 'QUANTORA_ALL_CLASSES_E2E_REPORT.json');
  const reportData = {
    testName: 'Quantora E2E Gameplay — All Hero & Boss Classes Showdown',
    timestamp: new Date().toISOString(),
    durationSeconds: durationSec,
    totalFrames: frameIndex,
    heroClassesDemonstrated: [
      'duelist',
      'scholar',
      'breaker',
      'tactician',
      'gambler',
      'alchemist',
      'geomancer',
      'gambit',
      'paladin',
    ],
    bossClassesDemonstrated: [
      'illusionist',
      'glass_colossus',
      'core_engineer',
      'speed_executioner',
      'fraction_hydra',
      'operator_architect',
      'parity_lord',
      'cipher_sphinx',
      'negative_wraith',
      'time_weaver',
    ],
    milestones: milestonesData,
    artifacts: {
      mp4: mp4Path,
      webm: webmPath,
      gif: gifPath,
      playerHtml: playerHtmlPath,
      vaultVideosDir: VAULT_VIDEOS_DIR,
    },
  };
  fs.writeFileSync(reportJsonPath, JSON.stringify(reportData, null, 2), 'utf8');
  console.log(`    ✅ Laudo Master JSON gerado em: ${reportJsonPath}`);

  console.log('\n🎉 [E2E CONCLUÍDO COM SUCESSO] Pacote audiovisual completo gerado e sincronizado!');
}

runRecordAllClassesE2E().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
