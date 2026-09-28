const fs = require('fs');
const path = require('path');
const https = require('https');

// Resolve canonical path to .antigravity in main project root
const mainRoot = path.resolve(__dirname, '..');
const stateDir = path.join(mainRoot, '.antigravity');
const stateFile = path.join(stateDir, 'documented-jules-prs.json');
const tokenFile = path.join(stateDir, 'github-token.txt');
const logDir = path.join(stateDir, 'logs');

if (!fs.existsSync(stateDir)) {
  fs.mkdirSync(stateDir, { recursive: true });
}
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFile = path.join(logDir, 'hook-execution.log');
function logHook(msg) {
  try {
    fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`, 'utf8');
  } catch {}
}

const githubToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || (fs.existsSync(tokenFile) ? fs.readFileSync(tokenFile, 'utf8').trim() : '');

let documentedPrs = [];
if (fs.existsSync(stateFile)) {
  try {
    documentedPrs = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
  } catch {
    documentedPrs = [];
  }
}

function sendResponse(injectMessages = []) {
  logHook(`Hook finalizado: ${injectMessages.length} mensagem(ns) injetada(s)`);
  if (injectMessages.length > 0) {
    const payload = {
      injectSteps: injectMessages.map(msg => ({
        ephemeralMessage: msg
      }))
    };
    process.stdout.write(JSON.stringify(payload));
  } else {
    process.stdout.write('{}');
  }
  process.exit(0);
}

// Timeout safety fallback
setTimeout(() => sendResponse([]), 4500);

let started = false;
function triggerCheck() {
  if (started) return;
  started = true;
  logHook('Trigger disparado via PreInvocation.');
  checkPrs();
}

process.stdin.resume();
let inputData = '';
process.stdin.on('data', chunk => { inputData += chunk; });
process.stdin.on('end', () => triggerCheck());

setTimeout(() => {
  if (!started) triggerCheck();
}, 80);

function checkPrs() {
  const reqHeaders = {
    'User-Agent': 'Antigravity-Hook-Agent',
    'Accept': 'application/vnd.github.v3+json'
  };
  if (githubToken) {
    reqHeaders['Authorization'] = `Bearer ${githubToken}`;
  }

  const req = https.get({
    hostname: 'api.github.com',
    path: '/repos/Jklmkii/quantora/pulls?state=closed&per_page=10',
    headers: reqHeaders
  }, (res) => {
    let raw = '';
    res.on('data', chunk => { raw += chunk; });
    res.on('end', () => {
      logHook(`Resposta GitHub API: HTTP ${res.statusCode}`);
      if (res.statusCode !== 200) {
        sendResponse([]);
        return;
      }

      try {
        const prs = JSON.parse(raw);
        const julesPrs = prs.filter(p => 
          p.merged_at &&
          (p.user?.login?.includes('jules') ||
           p.head?.ref?.includes('palette') ||
           p.head?.ref?.includes('sentinel') ||
           p.head?.ref?.includes('bolt'))
        );

        const newMerged = julesPrs.filter(p => !documentedPrs.includes(p.number));

        if (newMerged.length > 0) {
          const alerts = newMerged.map(p => 
            `🔔 [Hook Jules PR Mergeado]: PR #${p.number} ('${p.title}') foi mergeado no main! Verifique o diff real (Seção 6 do GEMINI.md) e atualize a documentação no Vault.`
          );

          newMerged.forEach(p => documentedPrs.push(p.number));
          fs.writeFileSync(stateFile, JSON.stringify(documentedPrs, null, 2), 'utf8');

          sendResponse(alerts);
        } else {
          sendResponse([]);
        }
      } catch {
        sendResponse([]);
      }
    });
  });

  req.on('error', () => {
    sendResponse([]);
  });
}
