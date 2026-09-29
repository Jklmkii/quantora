/**
 * Script de Auto-Bump de Versão Semântica
 * Verifica o último commit da branch main:
 * - Se contiver #major: incrementa major (x.0.0)
 * - Se contiver #minor: incrementa minor (x.y.0)
 * - Padrão: incrementa patch (x.y.z+1)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function bumpVersion() {
  const pkgPath = path.resolve(__dirname, '../package.json');
  if (!fs.existsSync(pkgPath)) {
    console.warn('package.json não encontrado.');
    return;
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const currentVersion = pkg.version || '1.0.0';
  const parts = currentVersion.split('.').map(Number);

  let commitMsg = '';
  try {
    commitMsg = execSync('git log -1 --pretty=%B', { encoding: 'utf8' }).trim();
  } catch {
    commitMsg = '';
  }

  if (commitMsg.includes('#major')) {
    parts[0] += 1;
    parts[1] = 0;
    parts[2] = 0;
  } else if (commitMsg.includes('#minor')) {
    parts[1] += 1;
    parts[2] = 0;
  } else {
    // Default: patch
    parts[2] += 1;
  }

  const newVersion = parts.join('.');
  pkg.version = newVersion;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');

  console.log(`Versão avançada: ${currentVersion} -> ${newVersion}`);
  return newVersion;
}

if (require.main === module) {
  bumpVersion();
}

module.exports = { bumpVersion };
