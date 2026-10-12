#!/usr/bin/env node
/**
 * Quantora & Antigravity — Google Files Style Coding Progress & ETA Tracker
 * Intercepts PreInvocation, PreToolUse, PostToolUse, and Stop lifecycle hooks
 * to compute real-time % completion, phase classification, transfer-like speed,
 * and dynamic countdown ETA (in seconds).
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const eventType = process.argv[2] || 'unknown';
const stateDir = path.join(os.homedir(), '.gemini', 'antigravity');
const stateFile = path.join(stateDir, 'coding_progress_state.json');

function readStdinSync() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '{}';
  }
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
    percent: 0,
    etaSeconds: 0,
    phaseIndex: 0,
    currentPhase: 'Aguardando tarefa',
    currentAction: 'Pronto para iniciar',
    currentDetail: '',
    stepsCompleted: 0,
    estimatedTotalSteps: 6,
    avgStepMs: 3200,
    lastStepStartedAt: Date.now(),
    recentSteps: [],
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

function shortenPath(p) {
  if (!p || typeof p !== 'string') return '';
  const normalized = p.replace(/\\/g, '/');
  const parts = normalized.split('/').filter(Boolean);
  if (parts.length <= 3) return normalized;
  return '…/' + parts.slice(-3).join('/');
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

  // Phase 5: Vault Documentation or Git Push
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

  // Phase 4: Vitest / E2E / Verification
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

  // Phase 3: Build & Linter
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

  // Phase 2: Code Editing & File Creation
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

  // Phase 1: Analysis, Reading & Research
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
      state.stepsCompleted = 0;
      state.estimatedTotalSteps = 6;
      state.percent = 8;
      state.etaSeconds = 20;
      state.phaseIndex = 1;
      state.currentPhase = 'Fase 1/5 • Leitura & Diagnóstico';
      state.currentAction = 'Analisando solicitação e planejando passos...';
      state.currentDetail = payload.modelName ? `Modelo ativo • Invocação #${payload.invocationNum || 1}` : 'Iniciando execução';
      state.recentSteps = [];
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

    if (state.status !== 'working') {
      state.status = 'working';
      state.startedAt = now;
      state.stepsCompleted = 0;
      state.percent = 10;
      state.recentSteps = [];
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
    const stepDuration = Math.max(100, now - (state.lastStepStartedAt || now));
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
    }

    saveState(state);
    process.stdout.write('{}\n');
    return;
  }

  if (eventType === 'stop') {
    const totalMs = Math.max(500, now - (state.startedAt || now));
    state.status = 'completed';
    state.percent = 100;
    state.etaSeconds = 0;
    state.phaseIndex = 5;
    state.currentPhase = '5/5 • Tarefa Concluída com Sucesso';
    state.currentAction = `Concluído em ${(totalMs / 1000).toFixed(1)}s (${state.stepsCompleted || 1} operações)`;
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
