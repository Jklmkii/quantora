#!/usr/bin/env node
const { execSync } = require('node:child_process');
const path = require('node:path');

const filePath = path.resolve(__dirname, '..', 'debug-agent-hud.html');
console.log('🚀 Abrindo Console de Depuração & Telemetria do Agente no navegador...');

try {
  if (process.platform === 'win32') {
    execSync(`start "" "${filePath}"`);
  } else if (process.platform === 'darwin') {
    execSync(`open "${filePath}"`);
  } else {
    execSync(`xdg-open "${filePath}"`);
  }
  console.log('✅ Console aberto com sucesso!');
} catch (err) {
  console.error('Falha ao abrir navegador:', err.message);
}
