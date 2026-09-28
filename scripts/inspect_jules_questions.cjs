const fs = require('fs');
const path = require('path');
const https = require('https');

const tokenFile = path.resolve(__dirname, '../.antigravity/jules-token.txt');
const token = fs.readFileSync(tokenFile, 'utf8').trim();

const targetSessions = [
  { id: 'sessions/3528833431443713608', label: 'TASK-A (Test Coverage)' },
  { id: 'sessions/5919805441718166244', label: 'Palette (Micro-UX & A11y)' },
  { id: 'sessions/14943539312967169193', label: 'Sentinel (Security)' }
];

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: { 'X-Goog-Api-Key': token, 'Accept': 'application/json' }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    }).on('error', reject);
  });
}

(async () => {
  for (const s of targetSessions) {
    console.log('==================================================');
    console.log(`SESSAO: ${s.label} (${s.id})`);
    const actRes = await fetchJson(`https://jules.googleapis.com/v1alpha/${s.id}/activities`);
    if (actRes.status === 200 && actRes.data && actRes.data.activities) {
      const acts = actRes.data.activities;
      console.log(`Total de atividades: ${acts.length}`);
      const lastActs = acts.slice(-3);
      for (const a of lastActs) {
        console.log(`\n[Atividade ${a.name || 'N/A'}]`);
        console.log(JSON.stringify(a, null, 2));
      }
    } else {
      console.log(`Falha ao obter atividades (HTTP ${actRes.status}):`, actRes);
    }
  }
})();
