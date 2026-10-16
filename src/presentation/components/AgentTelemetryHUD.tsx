import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Bot,
  Activity,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Zap,
  Palette,
  ExternalLink,
  X,
  RotateCcw,
  Sparkles,
  Layers,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useShallow } from 'zustand/react/shallow';
import { hapticComboTick } from '../../core/platform/haptics';

/**
 * ⚡ Bolt Performance Optimization
 * 💡 What: Split AgentTelemetryHUD into a wrapper and an inner content component.
 * 🎯 Why: When hidden via early return, the component still subscribed to the frequently updating agentTelemetry state, causing invisible background re-renders. The wrapper conditionally mounts the inner component while preserving the global keyboard shortcut listener.
 * 📊 Impact: Eliminates hidden background re-renders when the HUD is closed.
 */
export const AgentTelemetryHUD: React.FC = () => {
  const { isAgentTelemetryOpen, setAgentTelemetryOpen } = useAppStore(
    useShallow((s) => ({
      isAgentTelemetryOpen: s.isAgentTelemetryOpen,
      setAgentTelemetryOpen: s.setAgentTelemetryOpen,
    }))
  );

  // Atalho global de teclado: Ctrl + Shift + D para abrir/fechar, ESC para fechar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        hapticComboTick(1);
        setAgentTelemetryOpen(!isAgentTelemetryOpen);
      } else if (e.key === 'Escape' && isAgentTelemetryOpen) {
        e.preventDefault();
        setAgentTelemetryOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAgentTelemetryOpen, setAgentTelemetryOpen]);

  if (!isAgentTelemetryOpen) return null;

  return <AgentTelemetryHUDContent />;
};

const AgentTelemetryHUDContent: React.FC = () => {
  const { agentTelemetry, setAgentTelemetryOpen } = useAppStore(
    useShallow((s) => ({
      agentTelemetry: s.agentTelemetry,
      setAgentTelemetryOpen: s.setAgentTelemetryOpen,
    }))
  );

  const [activeTab, setActiveTab] = useState<'overview' | 'terminal' | 'jules' | 'health'>('overview');

  const { currentPhase, jules, health, crons, recentLogs } = agentTelemetry;

  const handleOpenExternalDashboard = () => {
    hapticComboTick(1);
    window.open('./debug-agent-hud.html', '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="agent-telemetry-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn"
    >
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl bg-slate-900/90 border border-cyan-500/40 shadow-[0_0_60px_rgba(6,182,212,0.25)] overflow-hidden font-sans">
        {/* Glow de fundo */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/30 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400">
              <Bot className="w-5 h-5 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-950 animate-ping" />
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="agent-telemetry-title" className="text-base sm:text-lg font-black text-white tracking-wide flex items-center gap-2">
                  Console de Depuração & Telemetria do Agente
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase">
                  Ao Vivo
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2 font-mono">
                <span>Agente Ativo: <strong className="text-cyan-400">Google Antigravity</strong></span>
                <span>•</span>
                <span>Parceira: <strong className="text-purple-400">Jules AI</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenExternalDashboard}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold border border-slate-700 transition-all cursor-pointer shadow-sm"
              title="Abrir em aba independente no navegador (segunda tela)"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Segunda Tela</span>
            </button>

            <button
              type="button"
              onClick={() => {
                hapticComboTick(1);
                setAgentTelemetryOpen(false);
              }}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer border border-slate-700"
              title="Fechar (ESC ou Ctrl+Shift+D)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barra de Abas */}
        <div className="flex items-center gap-2 px-6 pt-3 pb-2 border-b border-slate-800 bg-slate-950/40 shrink-0 overflow-x-auto">
          {[
            { id: 'overview', label: 'Visão Geral & Pipeline', icon: Activity },
            { id: 'terminal', label: 'Terminal de Ações', icon: Terminal },
            { id: 'jules', label: 'Radar Jules AI & Cota', icon: Bot },
            { id: 'health', label: 'Saúde do Sistema & Vault', icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  hapticComboTick(1);
                  setActiveTab(tab.id as typeof activeTab);
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Conteúdo Dinâmico com Rolagem */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ABA 1: VISÃO GERAL & PIPELINE */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Card de Fase Ativa & Progresso */}
              <div className="p-5 rounded-2xl bg-slate-950/70 border border-cyan-500/30 relative overflow-hidden space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                      Fase {currentPhase.index}/{currentPhase.total}: {currentPhase.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-xs">
                    <span className="text-cyan-400 font-bold">{currentPhase.percent}% Concluído</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      {currentPhase.etaSeconds > 0 ? `~${currentPhase.etaSeconds}s restantes` : 'Concluído'}
                    </span>
                  </div>
                </div>

                {/* Barra de Progresso Estilo Files by Google */}
                <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden p-0.5 border border-slate-700/60">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 transition-all duration-500 shadow-[0_0_12px_rgba(6,182,212,0.6)]"
                    style={{ width: `${currentPhase.percent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="text-slate-300 font-medium">{currentPhase.currentAction}</span>
                  <span className="font-mono text-[10px] text-cyan-400/80">ETA Tracker Ativo</span>
                </div>
              </div>

              {/* 5 Fases do Pipeline */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                {[
                  { step: 1, title: 'Análise & Leitura', desc: 'Inspecionar código e requisitos' },
                  { step: 2, title: 'Implementação', desc: 'Edição atômica e TypeScript' },
                  { step: 3, title: 'Build & Lint', desc: 'Vite build e Oxlint 0 warnings' },
                  { step: 4, title: 'Testes Vitest', desc: '576 testes automatizados' },
                  { step: 5, title: 'Entrega & Vault', desc: 'Commit GitHub e ronda no cofre' },
                ].map((phase) => {
                  const isDone = currentPhase.percent >= (phase.step / 5) * 100;
                  const isCurrent = currentPhase.index === phase.step;
                  return (
                    <div
                      key={phase.step}
                      className={`p-3 rounded-2xl border transition-all ${
                        isDone
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                          : isCurrent
                          ? 'bg-cyan-500/15 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                          : 'bg-slate-950/40 border-slate-800 text-slate-500'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono font-bold">ETAPA {phase.step}</span>
                        {isDone ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : isCurrent ? (
                          <RotateCcw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                        ) : null}
                      </div>
                      <h4 className="text-xs font-bold leading-tight">{phase.title}</h4>
                      <p className="text-[10px] mt-1 opacity-75 line-clamp-1">{phase.desc}</p>
                    </div>
                  );
                })}
              </div>

              {/* Destaques Rápidos dos Agentes e Saúde */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Cota Diária da Jules
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-cyan-400 font-mono">{jules.remaining}</span>
                    <span className="text-xs text-slate-400 font-mono">/ {jules.dailyLimit} tarefas</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {jules.usedToday} tarefas consumidas hoje (Palette, Sentinel, Bolt).
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Suíte Vitest
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-emerald-400 font-mono">{health.vitestTests}</span>
                    <span className="text-xs text-slate-400 font-mono">testes (100% OK)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    35 arquivos de teste rodando em ~2s.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Vault Health Score
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-purple-400 font-mono">{health.vaultHealthScore}%</span>
                    <span className="text-xs text-slate-400 font-mono">({health.vaultNotesCount} notas)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Zero links órfãos • Catálogo e LLMs sincronizados.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ABA 2: TERMINAL DE AÇÕES / LOGS RECENTES */}
          {activeTab === 'terminal' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Registro Forense de Ferramentas Executadas
                </span>
                <span className="text-xs text-slate-500 font-mono">Últimas 5 ações registradas</span>
              </div>

              <div className="space-y-2 font-mono text-xs">
                {recentLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          {log.toolName}
                        </span>
                        {log.target && (
                          <span className="text-slate-400 text-[11px]">{log.target}</span>
                        )}
                      </div>
                      <p className="text-slate-300 text-xs font-sans">{log.summary}</p>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 shrink-0">
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700/60">
                        {log.durationMs}ms
                      </span>
                      <span className="flex items-center gap-1 text-emerald-400 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        OK
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ABA 3: RADAR JULES AI & COTA */}
          {activeTab === 'jules' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-slate-950/60 border border-purple-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Bot className="w-5 h-5 text-purple-400" />
                    <div>
                      <h3 className="text-sm font-bold text-white">Guardiãs Diárias da Jules AI</h3>
                      <p className="text-xs text-slate-400">Rotinas agendadas das 21:00 GMT-3 no repositório</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    Cota: {jules.remaining}/100 tarefas
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4 text-pink-400" />
                      <h4 className="text-xs font-bold text-slate-200">Palette 🎨 (UX & A11y)</h4>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Acessibilidade WCAG, atributos ARIA e contraste.
                    </p>
                    <span className="inline-block mt-2 text-[10px] text-emerald-400 font-mono">
                      ● PR #91 Mergeado com Sucesso
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <h4 className="text-xs font-bold text-slate-200">Bolt ⚡ (Performance)</h4>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Otimizações atômicas de render, memo e bundles.
                    </p>
                    <span className="inline-block mt-2 text-[10px] text-cyan-400 font-mono">
                      ● Standby / Agendada
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-cyan-400" />
                      <h4 className="text-xs font-bold text-slate-200">Sentinel 🛡️ (Segurança)</h4>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Varredura de dependências e Electron hardening.
                    </p>
                    <span className="inline-block mt-2 text-[10px] text-purple-400 font-mono">
                      ● Standby / Agendada
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ABA 4: SAÚDE DO SISTEMA & CRONS */}
          {activeTab === 'health' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    Crons e Tarefas Agendadas no Background
                  </h3>
                  <div className="space-y-2">
                    {crons.map((cron, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-200">{cron.name}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {cron.expression}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">{cron.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Último Commit em Produção
                  </h3>
                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 font-mono text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Hash:</span>
                      <span className="text-cyan-400 font-bold">{health.lastCommitHash}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">Mensagem:</span>
                      <p className="text-slate-200 text-xs font-sans">{health.lastCommitMessage}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé do HUD */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-950/70 text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px]">Atalho Global:</span>
            <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-300 font-mono text-[10px]">
              Ctrl + Shift + D
            </kbd>
            <span className="text-slate-500">•</span>
            <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[10px]">
              ESC
            </kbd>
          </div>

          <div className="text-[11px] text-slate-500 font-mono">
            Quantora Agent Engine v2.0
          </div>
        </div>
      </div>
    </div>
  );
};
