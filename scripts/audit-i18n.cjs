const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const translationsPath = path.join(rootDir, 'src', 'core', 'i18n', 'translations.ts');

if (!fs.existsSync(translationsPath)) {
  console.error('translations.ts not found at:', translationsPath);
  process.exit(1);
}

const content = fs.readFileSync(translationsPath, 'utf8').replace(/\r\n/g, '\n');

function extractBlock(startMarker, endMarker) {
  const startIdx = content.indexOf(startMarker);
  if (startIdx === -1) return '';
  const endIdx = content.indexOf(endMarker, startIdx);
  if (endIdx === -1) return '';
  return content.slice(startIdx + startMarker.length, endIdx);
}

const ptBlock = extractBlock('pt: {', '  en: {');
const enBlock = extractBlock('en: {', '  },\n} as const;');

function extractKeys(block) {
  const keys = [];
  const lineRegex = /^\s*([a-zA-Z0-9_]+)\s*:/gm;
  let match;
  while ((match = lineRegex.exec(block)) !== null) {
    keys.push(match[1]);
  }
  return keys;
}

const ptKeys = extractKeys(ptBlock);
const enKeys = extractKeys(enBlock);

const ptSet = new Set(ptKeys);
const enSet = new Set(enKeys);

const missingInEn = ptKeys.filter(k => !enSet.has(k));
const missingInPt = enKeys.filter(k => !ptSet.has(k));

console.log('🌐 --- Relatório de Auditoria i18n (Translator) ---');
console.log(`Total chaves PT: ${ptKeys.length} | Total chaves EN: ${enKeys.length}`);

if (missingInEn.length > 0) {
  console.log(`❌ Chaves presentes em PT mas ausentes em EN (${missingInEn.length}):`, missingInEn);
} else {
  console.log('✓ Nenhuma chave faltando em EN.');
}

if (missingInPt.length > 0) {
  console.log(`❌ Chaves presentes em EN mas ausentes em PT (${missingInPt.length}):`, missingInPt);
} else {
  console.log('✓ Nenhuma chave faltando em PT.');
}

// Check for orphan keys across src/
function getAllSourceFiles(dir) {
  let results = [];
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    if (item.name.startsWith('.') || item.name === 'node_modules' || item.name === 'dist') continue;
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      results = results.concat(getAllSourceFiles(full));
    } else if (/\.(tsx?|jsx?)$/.test(item.name) && !item.name.includes('translations.ts')) {
      results.push(full);
    }
  }
  return results;
}

const sourceFiles = getAllSourceFiles(path.join(rootDir, 'src'));
let combinedSource = '';
for (const file of sourceFiles) {
  combinedSource += fs.readFileSync(file, 'utf8') + '\n';
}

const orphanCandidates = [];
for (const key of ptKeys) {
  const regex = new RegExp(`\\b${key}\\b`);
  if (!regex.test(combinedSource)) {
    orphanCandidates.push(key);
  }
}

if (orphanCandidates.length > 0) {
  console.log(`⚠️ Chaves declaradas possivelmente órfãs (${orphanCandidates.length}):`, orphanCandidates.slice(0, 10), orphanCandidates.length > 10 ? `... e mais ${orphanCandidates.length - 10}` : '');
} else {
  console.log('✓ Nenhuma chave órfã detectada.');
}

if (missingInEn.length === 0 && missingInPt.length === 0) {
  console.log('✅ i18n 100% consistente (Paridade Total PT ↔ EN)!');
}
