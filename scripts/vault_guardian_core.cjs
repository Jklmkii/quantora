#!/usr/bin/env node
/**
 * 🛡️ Vault Guardian Core v6.0 — Runner Oficial na pasta scripts/ (Delega para SSOT no Obsidian-Vault)
 */
const path = require('path');
const ssotEnginePath = path.resolve(
  'c:/Users/lucas/OneDrive/Área de Trabalho/code/Obsidian-Vault/.antigravity/automation/vault_guardian_core.cjs'
);
const { runVaultGuardian } = require(ssotEnginePath);

const args = process.argv.slice(2);
runVaultGuardian({
  autoFix: !args.includes('--no-fix'),
  syncCatalogs: !args.includes('--no-sync'),
  silent: args.includes('--silent') || args.includes('--fast')
});
