const fs = require('fs');
const path = require('path');
const https = require('https');

const tokenFile = path.resolve(__dirname, '../.antigravity/jules-token.txt');
const token = fs.readFileSync(tokenFile, 'utf8').trim();

const replies = [
  {
    sessionId: 'sessions/5919805441718166244',
    agent: 'Palette (Micro-UX & A11y)',
    message: 'Please proceed with Option 1: Add missing focus-visible styles to interactive buttons in src/presentation/components/TrayPracticeWidget.tsx to improve keyboard navigation accessibility (e.g. focus-visible:ring-2 focus-visible:ring-cyan-500/50). Please verify with npx vitest run and npm run lint before completing.'
  },
  {
    sessionId: 'sessions/14943539312967169193',
    agent: 'Sentinel (Security)',
    message: 'Yes, please proceed with adding input length validation to validateHistoryItem in src/core/storage/historyValidator.ts (enforcing reasonable length limits such as id <= 100, title <= 200, summary <= 1000, details <= 10000 characters) to prevent DoS via oversized JSON payloads. Ensure all Vitest tests in src/tests/ pass with 100% and npm run lint passes with 0 errors.'
  }
];

function sendMessage(sessionId, text) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ prompt: text });
    const req = https.request(`https://jules.googleapis.com/v1alpha/${sessionId}:sendMessage`, {
      method: 'POST',
      headers: {
        'X-Goog-Api-Key': token,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

(async () => {
  console.log('=== Enviando Respostas para as Sessões da Jules ===\n');
  for (const r of replies) {
    console.log(`-> Respondendo para ${r.agent} (${r.sessionId})...`);
    try {
      const res = await sendMessage(r.sessionId, r.message);
      console.log(`   Status: HTTP ${res.status}`);
      console.log(`   Resposta:`, res.data || '(Vazio - Sucesso)');
    } catch {
      console.error(`   Erro ao enviar:`, err.message);
    }
  }
  console.log('\n=== Respostas despachadas com sucesso ===');
})();
