const fs = require('fs');
const path = require('path');
const https = require('https');

// Resolve canonical path to .antigravity in main project root
const mainRoot = path.resolve(__dirname, '..');
const stateDir = path.join(mainRoot, '.antigravity');
const stateFile = path.join(stateDir, 'documented-jules-prs.json');

if (!fs.existsSync(stateDir)) {
  fs.mkdirSync(stateDir, { recursive: true });
}

let documentedPrs = [];
if (fs.existsSync(stateFile)) {
  try {
    documentedPrs = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
  } catch {
    documentedPrs = [];
  }
}

function sendResponse(injectMessages = []) {
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
  const req = https.get({
    hostname: 'api.github.com',
    path: '/repos/Jklmkii/quantora/pulls?state=closed&per_page=10',
    headers: {
      'User-Agent': 'Antigravity-Hook-Agent'
    }
  }, (res) => {
    let raw = '';
    res.on('data', chunk => { raw += chunk; });
    res.on('end', () => {
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
