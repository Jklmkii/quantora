/**
 * Quantora — Agent Telemetry & Debug Service
 * Fornece estado e telemetria em tempo real das ações dos agentes (Google Antigravity e Jules AI).
 */

export type AgentName = 'Antigravity' | 'Jules AI' | 'Idle';
export type ToolExecutionStatus = 'success' | 'running' | 'error';

export interface ToolLogEntry {
  id: string;
  timestamp: number;
  toolName: string;
  target?: string;
  durationMs: number;
  status: ToolExecutionStatus;
  summary: string;
}

export interface AgentPhaseInfo {
  index: number;
  total: number;
  name: string;
  percent: number;
  etaSeconds: number;
  currentAction: string;
}

export interface JulesSessionInfo {
  palette: 'idle' | 'active' | 'awaiting_review';
  bolt: 'idle' | 'active' | 'awaiting_review';
  sentinel: 'idle' | 'active' | 'awaiting_review';
  usedToday: number;
  dailyLimit: number;
  remaining: number;
  lastMergedPr?: string;
}

export interface SystemHealthMetrics {
  vitestTests: number;
  vitestSuites: number;
  oxlintWarnings: number;
  oxlintErrors: number;
  buildStatus: 'passed' | 'building' | 'failed';
  buildDurationSec: number;
  vaultHealthScore: number;
  vaultNotesCount: number;
  lastCommitHash: string;
  lastCommitMessage: string;
}

export interface ActiveCronSchedule {
  name: string;
  expression: string;
  description: string;
  status: 'active' | 'paused';
}

export interface AgentTelemetryState {
  activeAgent: AgentName;
  statusMessage: string;
  currentPhase: AgentPhaseInfo;
  jules: JulesSessionInfo;
  health: SystemHealthMetrics;
  crons: ActiveCronSchedule[];
  recentLogs: ToolLogEntry[];
  updatedAt: number;
}

export const DEFAULT_AGENT_TELEMETRY: AgentTelemetryState = {
  activeAgent: 'Antigravity',
  statusMessage: 'Pronto e monitorando sistema em tempo real',
  currentPhase: {
    index: 5,
    total: 5,
    name: 'Entrega & Documentação no Vault',
    percent: 100,
    etaSeconds: 0,
    currentAction: 'Concluído com sucesso • Todas as etapas finalizadas',
  },
  jules: {
    palette: 'idle',
    bolt: 'idle',
    sentinel: 'idle',
    usedToday: 3,
    dailyLimit: 100,
    remaining: 97,
    lastMergedPr: 'PR #91 (🎨 Palette: Add aria-current for active navigation tabs)',
  },
  health: {
    vitestTests: 576,
    vitestSuites: 35,
    oxlintWarnings: 0,
    oxlintErrors: 0,
    buildStatus: 'passed',
    buildDurationSec: 1.66,
    vaultHealthScore: 100.0,
    vaultNotesCount: 70,
    lastCommitHash: '29683c9',
    lastCommitMessage: 'Merge pull request #91 from Jklmkii/palette-ux-aria-current-tabs',
  },
  crons: [
    {
      name: 'Sync Vault Diário (14:00)',
      expression: '0 14 * * *',
      description: 'Sincronização de integridade Repositório -> Vault e ronda do Guardião',
      status: 'active',
    },
    {
      name: 'Revisão Jules Diária (21:30)',
      expression: '30 21 * * *',
      description: 'Auditoria noturna das sessões Palette 🎨, Bolt ⚡ e Sentinel 🛡️',
      status: 'active',
    },
  ],
  recentLogs: [
    {
      id: 'log-1',
      timestamp: Date.now() - 140000,
      toolName: 'git pull origin main',
      target: 'PR #91 Palette',
      durationMs: 1200,
      status: 'success',
      summary: 'Sincronizado commit 29683c9 com aria-current nas abas de navegação',
    },
    {
      id: 'log-2',
      timestamp: Date.now() - 95000,
      toolName: 'schedule (14:00)',
      target: 'Cron Background',
      durationMs: 50,
      status: 'success',
      summary: 'Restaurado cron autônomo 0 14 * * * com IsDaemon: true',
    },
    {
      id: 'log-3',
      timestamp: Date.now() - 90000,
      toolName: 'schedule (21:30)',
      target: 'Cron Background',
      durationMs: 50,
      status: 'success',
      summary: 'Restaurado cron autônomo 30 21 * * * com IsDaemon: true',
    },
    {
      id: 'log-4',
      timestamp: Date.now() - 45000,
      toolName: 'npx vitest run',
      target: 'src/tests/',
      durationMs: 1970,
      status: 'success',
      summary: '576 testes executados e 100% aprovados em 35 suítes',
    },
    {
      id: 'log-5',
      timestamp: Date.now() - 20000,
      toolName: 'vault_guardian_core.cjs',
      target: 'Obsidian-Vault',
      durationMs: 79,
      status: 'success',
      summary: 'Auditoria de 70 notas no cofre: VHS 100%, 0 links órfãos',
    },
  ],
  updatedAt: Date.now(),
};
