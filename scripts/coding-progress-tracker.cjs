#!/usr/bin/env node
/**
 * Quantora & Antigravity — Google Files Style Coding Progress & ETA Tracker + Anti-Hang Guard (v7.1)
 * Intercepts PreInvocation, PreToolUse, PostToolUse, and Stop lifecycle hooks
 * to compute real-time % completion, phase classification, transfer-like speed,
 * dynamic countdown ETA (in seconds), pre-turn rollback snapshots (F1),
 * real-time file locking (F4), and prevent runaway recursive shell commands.
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const eventType = process.argv[2] || 'unknown';
const stateDir = path.join(os.homedir(), '.gemini', 'antigravity');
const stateFile = path.join(stateDir, 'coding_progress_state.json');
const snapshotsFile = path.join(stateDir, 'pre_turn_snapshots.json');

function readStdinSync() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '{}';
  }
}

function normalizePathKey(p) {
  if (!p || typeof p !== 'string') return '';
  return p.replace(/\\/g, '/').trim().toLowerCase();
}

function loadState() {
  try {
    if (fs.existsSync(stateFile)) {
      return JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    }
  } catch {
    // ignore corrupted state
  }
  return {
    status: 'idle',
    taskId: 0,
    startedAt: Date.now(),
    updatedAt: Date.now(),
    lastStepStartedAt: Date.now(),
    lastStepEndedAt: Date.now(),
    activeWorkMs: 0,
    turnDurationSec: 0,
    percent: 0,
    etaSeconds: 0,
    phaseIndex: 0,
    currentPhase: 'Aguardando tarefa',
    currentAction: 'Pronto para iniciar',
    currentDetail: '',
    stepsCompleted: 0,
    estimatedTotalSteps: 6,
    avgStepMs: 3200,
    recentSteps: [],
    lockedFiles: [],
  };
}

function saveState(state) {
  try {
    fs.mkdirSync(stateDir, { recursive: true });
    state.updatedAt = Date.now();
    fs.writeFileSync(stateFile, JSON.stringify(state, null, 2), 'utf8');
  } catch {
    // ignore write errors so hooks never block the agent
  }
}

// F1 (v7.1): Guarda snapshot pré-turno na primeira edição de qualquer ficheiro
function capturePreTurnSnapshotIfNeeded(targetFile, taskId) {
  if (!targetFile || typeof targetFile !== 'string') return;
  try {
    const cleanPath = targetFile.replace(/^["']|["']$/g, '').trim();
    const key = normalizePathKey(cleanPath);
    if (!key) return;

    fs.mkdirSync(stateDir, { recursive: true });
    let snaps = {};
    if (fs.existsSync(snapshotsFile)) {
      try {
        snaps = JSON.parse(fs.readFileSync(snapshotsFile, 'utf8'));
      } catch {
        snaps = {};
      }
    }

    const existing = snaps[key];
    // Só captura se ainda não houver snapshot para este taskId (preserva o estado original pré-turno)
    if (existing && existing.taskId === taskId) {
      return;
    }

    const existedBefore = fs.existsSync(cleanPath);
    let content = '';
    if (existedBefore) {
      const st = fs.statSync(cleanPath);
      if (st.size <= 2 * 1024 * 1024) {
        content = fs.readFileSync(cleanPath, 'utf8');
      } else {
        return; // Ignora ficheiros binários/gigantes > 2MB
      }
    }

    snaps[key] = {
      fullPath: cleanPath.replace(/\\/g, '/'),
      existedBefore,
      content,
      taskId: taskId || 1,
      capturedAt: Date.now(),
    };

    // Limita o cache aos 40 ficheiros mais recentes para evitar crescimento indefinido
    const keys = Object.keys(snaps);
    if (keys.length > 40) {
      const sortedKeys = keys.sort((a, b) => (snaps[a]?.capturedAt || 0) - (snaps[b]?.capturedAt || 0));
      for (let i = 0; i < keys.length - 40; i++) {
        delete snaps[sortedKeys[i]];
      }
    }

    fs.writeFileSync(snapshotsFile, JSON.stringify(snaps, null, 2), 'utf8');
  } catch {
    // Nunca bloqueia o hook se falhar ao salvar snapshot
  }
}

// F4 (v7.1): Verifica se o ficheiro alvo está trancado pelo utilizador na HUD
function checkLockedFileGuard(toolName, args, lockedFiles) {
  if (!Array.isArray(lockedFiles) || lockedFiles.length === 0) return null;
  const tName = String(toolName || '').toLowerCase();
  const isWriteTool =
    tName.includes('replace_file') ||
    tName.includes('write_to_file') ||
    tName.includes('multi_replace') ||
    tName.includes('edit');
  if (!isWriteTool) return null;

  const targetFile = String(args?.TargetFile || args?.AbsolutePath || '').trim();
  if (!targetFile) return null;
  const normTarget = normalizePathKey(targetFile);
  const baseTarget = normTarget.split('/').pop() || normTarget;

  const isLocked = lockedFiles.some((lf) => {
    const normLock = normalizePathKey(lf);
    if (!normLock) return false;
    return normTarget === normLock || normTarget.endsWith('/' + normLock) || baseTarget === normLock;
  });

  if (isLocked) {
    return `[Workspace File Lock 🔒] Edição bloqueada: O ficheiro "${targetFile}" está trancado pelo desenvolvedor no painel Agent Workspace (🔒 Proteger). Não modifique este ficheiro até que o utilizador o destranque na HUD.`;
  }
  return null;
}

function shortenPath(p) {
  if (!p || typeof p !== 'string') return '';
  const normalized = p.replace(/\\/g, '/');
  const parts = normalized.split('/').filter(Boolean);
  if (parts.length <= 3) return normalized;
  return '…/' + parts.slice(-3).join('/');
}

function checkAntiHangGuard(toolName, args) {
  const tName = String(toolName || '').toLowerCase();

  // [Vault SSOT Guard] Impede que conversas/projetos sobrescrevam os proxies locais do vault_guardian_core.cjs ou corrompam as cores do grafo
  if (tName.includes('write_to_file') || tName.includes('replace_file_content')) {
    const targetFile = String(args?.TargetFile || '').replace(/\\/g, '/');
    const codeText = String(args?.CodeContent || args?.ReplacementContent || '');

    const isLocalProxy =
      (targetFile.includes('/quantora/.antigravity/automation/vault_guardian_core.cjs') ||
        targetFile.includes('/gerenciador_senhas/.antigravity/automation/vault_guardian_core.cjs')) &&
      !targetFile.includes('Obsidian-Vault');

    if (isLocalProxy && (codeText.includes('colorGroups') || codeText.includes('GRAPH_CONFIG'))) {
      return '[Vault SSOT Guard] Edição bloqueada: O arquivo vault_guardian_core.cjs nos repositórios Quantora/Aegon é apenas um proxy delegado! A Fonte Única da Verdade (SSOT) reside em Obsidian-Vault/.antigravity/automation/vault_guardian_core.cjs e as cores oficiais estão travadas em graph_palette.lock.json.';
    }

    if (
      (targetFile.endsWith('.obsidian/graph.json') || targetFile.endsWith('graph_palette.lock.json')) &&
      codeText.includes('colorGroups') &&
      (!codeText.includes('11032055') || !codeText.includes('440020') || !codeText.includes('16449316'))
    ) {
      return '[Vault SSOT Guard] Edição bloqueada: Tentativa de alterar a paleta cromática oficial do Obsidian Vault com valores RGB divergentes de graph_palette.lock.json (Hub: 16449316, Quantora: 440020, Aegon: 11032055, Sistemas: 3900150, E2E: 16347926).';
    }
  }

  if (tName !== 'run_command') {
    return null;
  }
  const cmd = String(args?.CommandLine || '');

  // 1. Block unguarded Get-ChildItem -Recurse without -Depth
  if (/Get-ChildItem\b/i.test(cmd) && /-Recurse\b/i.test(cmd) && !/-Depth\b/i.test(cmd)) {
    return '[Anti-Hang Guard] Comando bloqueado: Get-ChildItem -Recurse sem -Depth varre node_modules/.git no OneDrive e trava em background. Use -Depth 2 ou um script node -e que ignore node_modules, .git, dist, release e android.';
  }

  // 2. Block nested powershell -Command "... $_ ..."
  if (/powershell(?:\.exe)?\s+-Command\s+"[^"]*\$_/i.test(cmd)) {
    return '[Anti-Hang Guard] Comando bloqueado: powershell -Command com aspas duplas consome a variavel $_ no shell externo e quebra filtros Where-Object/ForEach-Object. Execute os cmdlets diretamente sem invocar outro powershell -Command.';
  }

  // 3. Block slow single-threaded libvpx-vp9 without -deadline realtime
  if (/libvpx-vp9/i.test(cmd) && !/-deadline\s+realtime/i.test(cmd)) {
    return '[Anti-Hang Guard] Comando bloqueado: FFmpeg libvpx-vp9 sem "-deadline realtime -cpu-used 8" trava por varios minutos em 1080p. Adicione -deadline realtime -cpu-used 8 -row-mt 1.';
  }

  return null;
}

function classifyToolAndEstimate(toolName, args, prevPercent, stepsCompleted) {
  const name = String(toolName || '').toLowerCase();
  const actionLabel = args?.toolAction || args?.toolSummary || toolName || 'Executando operação';
  const fileTarget = args?.TargetFile || args?.AbsolutePath || '';
  const cmdTarget = args?.CommandLine || '';
  const detail = fileTarget
    ? shortenPath(fileTarget)
    : cmdTarget
      ? cmdTarget.slice(0, 75) + (cmdTarget.length > 75 ? '…' : '')
      : args?.query || args?.Url || '';

  if (
    fileTarget.includes('Obsidian-Vault') ||
    cmdTarget.includes('vault_guardian') ||
    cmdTarget.includes('git push') ||
    cmdTarget.includes('git commit')
  ) {
    const targetPct = Math.max(prevPercent + 3, Math.min(95, 84 + stepsCompleted * 2));
    return {
      phaseIndex: 5,
      currentPhase: 'Fase 5/5 • Sincronização Vault & Git',
      currentAction: actionLabel,
      currentDetail: detail,
      targetPercent: targetPct,
      baseEtaSec: Math.max(2, Math.round((100 - targetPct) * 0.45)),
    };
  }

  if (
    cmdTarget.includes('vitest') ||
    cmdTarget.includes('record-') ||
    cmdTarget.includes('test')
  ) {
    const targetPct = Math.max(prevPercent + 4, Math.min(88, 72 + stepsCompleted * 2));
    return {
      phaseIndex: 4,
      currentPhase: 'Fase 4/5 • Testes Automatizados & E2E',
      currentAction: actionLabel,
      currentDetail: detail,
      targetPercent: targetPct,
      baseEtaSec: Math.max(4, Math.round((100 - targetPct) * 0.6)),
    };
  }

  if (
    cmdTarget.includes('npm run build') ||
    cmdTarget.includes('npm run lint') ||
    cmdTarget.includes('oxlint') ||
    cmdTarget.includes('tsc')
  ) {
    const targetPct = Math.max(prevPercent + 4, Math.min(78, 60 + stepsCompleted * 2));
    return {
      phaseIndex: 3,
      currentPhase: 'Fase 3/5 • Compilação & Linter',
      currentAction: actionLabel,
      currentDetail: detail,
      targetPercent: targetPct,
      baseEtaSec: Math.max(5, Math.round((100 - targetPct) * 0.55)),
    };
  }

  if (
    name.includes('replace_file_content') ||
    name.includes('write_to_file') ||
    name.includes('edit')
  ) {
    const targetPct = Math.max(prevPercent + 5, Math.min(68, 38 + stepsCompleted * 5));
    return {
      phaseIndex: 2,
      currentPhase: 'Fase 2/5 • Codificação & Implementação',
      currentAction: actionLabel,
      currentDetail: detail,
      targetPercent: targetPct,
      baseEtaSec: Math.max(7, Math.round((100 - targetPct) * 0.5)),
    };
  }

  const targetPct = Math.max(prevPercent + 4, Math.min(42, 14 + stepsCompleted * 6));
  return {
    phaseIndex: 1,
    currentPhase: 'Fase 1/5 • Leitura & Diagnóstico',
    currentAction: actionLabel,
    currentDetail: detail,
    targetPercent: targetPct,
    baseEtaSec: Math.max(10, Math.round((100 - targetPct) * 0.45)),
  };
}

function main() {
  const rawInput = readStdinSync();
  let payload = {};
  try {
    payload = JSON.parse(rawInput || '{}');
  } catch {
    payload = {};
  }

  const state = loadState();
  const now = Date.now();

  if (eventType === 'pre-invocation') {
    const isNewTask =
      state.status === 'completed' ||
      state.status === 'idle' ||
      now - (state.updatedAt || now) > 90000;

    if (isNewTask) {
      state.taskId = (state.taskId || 0) + 1;
      state.startedAt = now;
      state.lastStepStartedAt = now;
      state.lastStepEndedAt = now;
      state.activeWorkMs = 0;
      state.turnDurationSec = 0;
      state.stepsCompleted = 0;
      state.estimatedTotalSteps = 6;
      state.percent = 8;
      state.etaSeconds = 20;
      state.phaseIndex = 1;
      state.currentPhase = 'Fase 1/5 • Leitura & Diagnóstico';
      state.currentAction = 'Analisando solicitação e planejando passos...';
      state.currentDetail = payload.modelName ? `Modelo ativo • Invocação #${payload.invocationNum || 1}` : 'Iniciando execução';
      state.recentSteps = [];
      state.manualQualityGates = {};
      state.manualShellHistory = [];
    } else {
      state.status = 'working';
      state.percent = Math.min(95, Math.max(state.percent || 10, 12));
    }
    state.status = 'working';
    state.lastStepStartedAt = now;
    saveState(state);
    process.stdout.write('{}\n');
    return;
  }

  if (eventType === 'pre-tool') {
    const toolCall = payload.toolCall || {};
    const toolName = toolCall.name || 'tool';
    const args = toolCall.args || {};

    const steerMsg = String(state.steerMessage || '').trim();
    if (state.pauseRequested || steerMsg) {
      state.pauseRequested = false;
      state.steerMessage = '';
      state.currentAction = steerMsg
        ? `💬 Instrução ao vivo recebida: "${steerMsg.slice(0, 60)}"`
        : '⏸️ Execução pausada manualmente pelo usuário no Workspace';
      saveState(state);
      const denyReason = steerMsg
        ? `[Workspace Live Steer] O desenvolvedor enviou uma instrução em tempo real pelo painel Coding Progress Bar: "${steerMsg}". Ajuste imediatamente sua rota para atender a essa instrução antes de prosseguir.`
        : '[Workspace Gatekeeper] O desenvolvedor clicou em "Pausar no Próximo Passo" no painel Coding Progress Bar. Interrompa as chamadas de ferramentas imediatamente e pergunte ao usuário no chat como ele deseja prosseguir.';
      process.stdout.write(
        JSON.stringify({
          decision: 'deny',
          reason: denyReason,
        }) + '\n'
      );
      return;
    }

    // F4 (v7.1): Verifica se o ficheiro está trancado em lockedFiles
    const lockBlockReason = checkLockedFileGuard(toolName, args, state.lockedFiles);
    if (lockBlockReason) {
      process.stdout.write(
        JSON.stringify({
          decision: 'deny',
          reason: lockBlockReason,
        }) + '\n'
      );
      return;
    }

    const hangBlockReason = checkAntiHangGuard(toolName, args);
    if (hangBlockReason) {
      process.stdout.write(
        JSON.stringify({
          decision: 'deny',
          reason: hangBlockReason,
        }) + '\n'
      );
      return;
    }

    if (state.status !== 'working') {
      state.taskId = (state.taskId || 0) + 1;
      state.status = 'working';
      state.startedAt = now;
      state.lastStepEndedAt = now;
      state.activeWorkMs = 0;
      state.turnDurationSec = 0;
      state.stepsCompleted = 0;
      state.percent = 10;
      state.recentSteps = [];
    }

    // F1 (v7.1): Captura snapshot pré-turno antes da primeira edição no ficheiro
    const tLower = String(toolName || '').toLowerCase();
    if (tLower.includes('replace_file') || tLower.includes('write_to_file') || tLower.includes('multi_replace') || tLower.includes('edit')) {
      capturePreTurnSnapshotIfNeeded(args?.TargetFile || args?.AbsolutePath, state.taskId || 1);
    }

    const est = classifyToolAndEstimate(
      toolName,
      args,
      state.percent || 10,
      state.stepsCompleted || 0
    );

    state.phaseIndex = Math.max(state.phaseIndex || 1, est.phaseIndex);
    state.currentPhase = est.currentPhase;
    state.currentAction = est.currentAction;
    state.currentDetail = est.currentDetail;
    state.percent = Math.min(96, Math.max(state.percent || 10, est.targetPercent));
    state.etaSeconds = est.baseEtaSec;
    state.lastStepStartedAt = now;

    const stepRecord = {
      id: (state.stepsCompleted || 0) + 1,
      tool: toolName,
      cmd: String(args?.CommandLine || ''),
      action: est.currentAction,
      detail: est.currentDetail,
      phaseIndex: est.phaseIndex,
      status: 'running',
      startedAt: now,
    };

    state.recentSteps = [stepRecord, ...(state.recentSteps || []).slice(0, 7)];
    saveState(state);
    process.stdout.write(JSON.stringify({ decision: 'allow' }) + '\n');
    return;
  }

  if (eventType === 'post-tool') {
    const rawStepDur = Math.max(100, now - (state.lastStepStartedAt || now));
    const stepDuration = Math.min(45000, rawStepDur);
    state.lastStepEndedAt = now;
    state.activeWorkMs = (state.activeWorkMs || 0) + stepDuration;
    state.avgStepMs = Math.round((state.avgStepMs || 3000) * 0.7 + stepDuration * 0.3);
    state.stepsCompleted = (state.stepsCompleted || 0) + 1;
    if (state.stepsCompleted >= state.estimatedTotalSteps - 1) {
      state.estimatedTotalSteps = state.stepsCompleted + 2;
    }
    state.percent = Math.min(97, (state.percent || 15) + 4);
    state.etaSeconds = Math.max(2, Math.round((state.etaSeconds || 8) * 0.8));

    if (Array.isArray(state.recentSteps) && state.recentSteps.length > 0) {
      state.recentSteps[0].status = payload.error ? 'error' : 'done';
      state.recentSteps[0].durationMs = stepDuration;
      state.recentSteps[0].endedAt = now;

      // M1 (v7.0): Calibração Persistente de Latência P50/P90 por categoria em tool_latency_profile.json
      try {
        const lastRec = state.recentSteps[0];
        const tLower = String(lastRec.tool || '').toLowerCase();
        const cLower = String(lastRec.cmd || '').toLowerCase();
        let catKey = 'fast_read';
        if (tLower.includes('subagent') || tLower.includes('search_web') || tLower.includes('read_url') || tLower.includes('browser')) {
          catKey = 'subagent_web';
        } else if (tLower.includes('run_command')) {
          if (cLower.includes('vitest') || cLower.includes('record-') || cLower.includes('test') || cLower.includes('ffmpeg')) {
            catKey = 'cmd_test';
          } else if (cLower.includes('build') || cLower.includes('lint') || cLower.includes('oxlint') || cLower.includes('tsc')) {
            catKey = 'cmd_build_lint';
          } else {
            catKey = 'cmd_light';
          }
        } else if (tLower.includes('replace_file') || tLower.includes('write_to_file') || tLower.includes('edit')) {
          catKey = 'code_edit';
        }
        const profilePath = path.join(stateDir, 'tool_latency_profile.json');
        let profile = {};
        if (fs.existsSync(profilePath)) {
          profile = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
        }
        const entry = profile[catKey] || { samples: [], ewmaMs: stepDuration, p50Ms: stepDuration, p90Ms: stepDuration };
        const clamped = Math.min(35000, Math.max(150, stepDuration));
        const samples = [...(Array.isArray(entry.samples) ? entry.samples : []), clamped].slice(-30);
        const sorted = [...samples].sort((a, b) => a - b);
        const p50Ms = sorted[Math.floor(sorted.length * 0.5)] || clamped;
        const p90Ms = sorted[Math.floor(sorted.length * 0.9)] || clamped;
        const ewmaMs = Math.round(0.3 * clamped + 0.7 * (entry.ewmaMs || p50Ms));
        profile[catKey] = { samples, ewmaMs, p50Ms, p90Ms, updatedAt: now };
        fs.writeFileSync(profilePath, JSON.stringify(profile, null, 2), 'utf8');
      } catch {
        // Ignore profile write errors
      }

      // Feature #10 (Vault Guardian v5.0): Hook Reativo Pós-Edição de Nota no Obsidian Vault
      const lastStep = state.recentSteps[0];
      const lastTool = String(lastStep.tool || '').toLowerCase();
      const lastDetail = String(lastStep.detail || '');
      if (
        !payload.error &&
        (lastTool.includes('write_to_file') || lastTool.includes('replace_file_content')) &&
        lastDetail.includes('Obsidian-Vault')
      ) {
        try {
          const corePath = path.resolve(__dirname, '../.antigravity/automation/vault_guardian_core.cjs');
          if (fs.existsSync(corePath)) {
            const { runVaultGuardian } = require(corePath);
            runVaultGuardian({ autoFix: true, syncCatalogs: true, silent: true });
          }
        } catch {
          // Never block the hook if vault guardian fails
        }
      }
    }

    saveState(state);
    process.stdout.write('{}\n');
    return;
  }

  if (eventType === 'stop') {
    // Bug 3 Fix (v7.1): Usa o timestamp da última operação efetiva (lastStepEndedAt - startedAt),
    // descartando o tempo ocioso de timeout antes do fecho do estado.
    const effectiveEndMs = state.lastStepEndedAt || state.lastStepStartedAt || now;
    const rawWallMs = Math.max(500, effectiveEndMs - (state.startedAt || effectiveEndMs));
    const maxPlausibleActiveMs = Math.max(1500, (state.activeWorkMs || 1000) + (state.stepsCompleted || 1) * 1800);
    const totalMs = rawWallMs > maxPlausibleActiveMs * 1.8 ? maxPlausibleActiveMs : rawWallMs;
    const totalSecNum = Number((totalMs / 1000).toFixed(1));

    state.status = 'completed';
    state.percent = 100;
    state.etaSeconds = 0;
    state.turnDurationSec = totalSecNum;
    state.phaseIndex = 5;
    state.currentPhase = '5/5 • Tarefa Concluída com Sucesso';
    state.currentAction = `Concluído em ${totalSecNum.toFixed(1)}s (${state.stepsCompleted || 1} operações)`;
    state.currentDetail = 'Todas as etapas foram executadas e verificadas.';
    if (Array.isArray(state.recentSteps) && state.recentSteps.length > 0) {
      state.recentSteps[0].status = 'done';
    }
    saveState(state);
    process.stdout.write(JSON.stringify({ decision: 'allow_stop' }) + '\n');
    return;
  }

  process.stdout.write('{}\n');
}

main();
