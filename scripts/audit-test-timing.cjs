const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const baselineDir = path.join(rootDir, '.antigravity');
const baselineFile = path.join(baselineDir, 'test-timing-baseline.json');

if (!fs.existsSync(baselineDir)) {
  fs.mkdirSync(baselineDir, { recursive: true });
}

console.log('🧪 --- Relatório de Auditoria de Suíte de Testes (Auditor) ---');
console.log('Executando vitest run...');

let rawOutput = '';
try {
  rawOutput = execSync('npx vitest run', {
    cwd: rootDir,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
} catch (err) {
  rawOutput = (err.stdout || '') + '\n' + (err.stderr || '');
}

// Strip ANSI color escape codes and normalize line endings
// eslint-disable-next-line no-control-regex
const output = rawOutput.replace(/\x1b\[[0-9;]*m/g, '').replace(/\r\n/g, '\n');

// Regex to capture: ✓ src/tests/physics.test.ts (26 tests) 24ms
const suiteRegex = /[✓√]\s+([^\s]+\.test\.[^\s]+)\s+\((\d+)\s+tests?\)\s+(\d+)(ms|s)/g;
const suites = {};
let match;
while ((match = suiteRegex.exec(output)) !== null) {
  const filePath = match[1];
  const count = parseInt(match[2], 10);
  const timeVal = parseFloat(match[3]);
  const unit = match[4];
  const timeMs = unit === 's' ? timeVal * 1000 : timeVal;
  suites[filePath] = { count, timeMs };
}

// Extract total tests and duration
const totalMatch = output.match(/Tests\s+(\d+)\s+passed/);
const totalPassed = totalMatch ? parseInt(totalMatch[1], 10) : 0;
const durationMatch = output.match(/Duration\s+([\d.]+)(s|ms)/);
const totalDuration = durationMatch ? `${durationMatch[1]}${durationMatch[2]}` : 'N/A';

console.log(`Total de testes aprovados: ${totalPassed} | Duração Total: ${totalDuration}`);
console.log(`Suítes auditadas: ${Object.keys(suites).length}`);

let baseline = {};
if (fs.existsSync(baselineFile)) {
  try {
    baseline = JSON.parse(fs.readFileSync(baselineFile, 'utf8'));
  } catch {
    baseline = {};
  }
}

const warnings = [];
for (const [file, data] of Object.entries(suites)) {
  const prev = baseline[file];
  if (prev && prev.timeMs > 30) {
    const diff = (data.timeMs - prev.timeMs) / prev.timeMs;
    if (diff > 0.3) {
      warnings.push(`⚠️ ${file}: tempo subiu ${Math.round(diff * 100)}% (${prev.timeMs}ms -> ${data.timeMs}ms)`);
    }
  }
}

// Detect suites with high number of tests (>= 35 tests)
const heavySuites = Object.entries(suites)
  .filter(entry => entry[1].count >= 35)
  .map(([f, d]) => `${f} (${d.count} testes, ${d.timeMs}ms)`);

console.log('\n📊 Suítes de estresse de grande porte (>= 35 casos):');
heavySuites.forEach(s => console.log('  - ' + s));

if (warnings.length > 0) {
  console.log('\n⚠️ Alertas de regressão de performance (> +30%):');
  warnings.forEach(w => console.log('  ' + w));
} else {
  console.log('\n✓ Nenhuma regressão de tempo detectada (> 30%). Suíte estável.');
}

// Save current baseline
fs.writeFileSync(baselineFile, JSON.stringify(suites, null, 2), 'utf8');
console.log('✅ Baseline de tempos atualizado em .antigravity/test-timing-baseline.json');
