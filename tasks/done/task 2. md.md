# Task: Finalização do Auto-Update OTA e Scripts do Package.json

Execute as etapas abaixo caso ainda não tenham sido aplicadas:

## 1. Scripts no `package.json`
Garanta que a seção `"scripts"` do `package.json` contenha estes dois comandos (mantendo os demais existentes):
- `"task:watch": "node scripts/wait-for-task.mjs"`
- `"release:prepare": "npm run build && node scripts/prepare-release.mjs"`

## 2. Serviço de Auto-Update OTA (`src/services/mobileAutoUpdater.ts`)
1. Instale `@capgo/capacitor-updater` caso ainda não conste nas dependências e configure `CapacitorUpdater: { autoUpdate: false }` em `capacitor.config.ts`.
2. Crie `src/services/mobileAutoUpdater.ts` que execute no boot do app (apenas quando `Capacitor.isNativePlatform()` for `true`):
   - Chame `await CapacitorUpdater.notifyAppReady()`.
   - Consulte a última release do repositório no GitHub (`/releases/latest`).
   - Se a versão da release for mais recente que a atual e existir o asset `dist.zip`, baixe-o em segundo plano com `CapacitorUpdater.download` e aplique com `CapacitorUpdater.set`.
3. Chame `initMobileAutoUpdater()` na inicialização do app (`App.tsx` ou `main.tsx`).

Ao concluir, mova este arquivo para `tasks/done/` e volte a executar `node scripts/wait-for-task.mjs`.

<!-- QUANTORA_TASK_READY -->