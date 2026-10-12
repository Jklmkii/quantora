#!/usr/bin/env node
/**
 * 🛡️ Vault Guardian Core v4.0 — Runner Oficial na pasta scripts/
 * Suporta: --no-fix (apenas auditoria) e --no-sync (pula regeneração de catálogos)
 */
const path = require('path');
const coreScript = path.resolve(__dirname, '../.antigravity/automation/vault_guardian_core.cjs');
const { runVaultGuardian } = require(coreScript);

const args = process.argv.slice(2);
runVaultGuardian({
  autoFix: !args.includes('--no-fix'),
  syncCatalogs: !args.includes('--no-sync')
});
