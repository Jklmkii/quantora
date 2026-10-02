#!/usr/bin/env node
/**
 * 🛡️ Vault Guardian Core — Runner na pasta scripts/
 */
const path = require('path');
const coreScript = path.resolve(__dirname, '../.antigravity/automation/vault_guardian_core.cjs');
const { runVaultGuardian } = require(coreScript);

runVaultGuardian({ autoFix: true, syncCatalogs: true });
