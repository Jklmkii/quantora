import React, { useMemo } from 'react';
import {
  ChevronLeft,
  Sun,
  Moon,
  Laptop,
  Settings,
  Pencil,
  Trophy,
  Sigma,
  Scale,
  Triangle,
  Atom,
  Brain,
  History,
  LayoutGrid,
  Cloud,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from '../../core/i18n/translations';
import { calculateLevelInfo } from '../../core/gamification/leveling';
import logoImg from '../../assets/logo.webp';

interface ModuleTopBarProps {
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  onOpenAuth?: () => void;
}

export const ModuleTopBar: React.FC<ModuleTopBarProps> = React.memo(({ onOpenSettings, onOpenProfile, onOpenAuth }) => {
  const {
    activeTab,
    setActiveTab,
    settings,
    updateSettings,
    profile,
    isScratchpadOpen,
    toggleScratchpad,
    hasScratchpadStrokes,
  } = useAppStore(
    useShallow((s) => ({
      activeTab: s.activeTab,
      setActiveTab: s.setActiveTab,
      settings: s.settings,
      updateSettings: s.updateSettings,
      profile: s.profile,
      isScratchpadOpen: s.isScratchpadOpen,
      toggleScratchpad: s.toggleScratchpad,
      hasScratchpadStrokes: s.hasScratchpadStrokes,
    }))
  );

  const t = useTranslation(settings.language || 'pt');
  const levelInfo = useMemo(
    () => calculateLevelInfo(profile?.totalXp || 0, settings.language || 'pt'),
    [profile?.totalXp, settings.language]
  );

  // Mapeamento dinâmico de títulos e ícones do módulo ativo
  const moduleMeta = useMemo(() => {
    switch (activeTab) {
      case 'bhaskara':
        return {
          title: t.nav_bhaskara || 'Equação de 2º Grau',
          category: 'Álgebra Didática',
          icon: <Sigma size={18} className="text-cyan-400" />,
          color: 'cyan',
        };
      case 'regra_simples':
      case 'regra_composta':
        return {
          title: t.nav_regra || 'Regra de Três',
          category: 'Aritmética Proporcional',
          icon: <Scale size={18} className="text-emerald-400" />,
          color: 'emerald',
        };
      case 'pitagoras':
        return {
          title: t.nav_pitagoras || 'Teorema de Pitágoras',
          category: 'Geometria & Trigonometria',
          icon: <Triangle size={18} className="text-amber-400 rotate-90" />,
          color: 'amber',
        };
      case 'physics':
        return {
          title: t.physics_title || 'Física Clássica',
          category: '10 Motores Mecânicos',
          icon: <Atom size={18} className="text-indigo-400" />,
          color: 'indigo',
        };
      case 'quiz':
        return {
          title: t.nav_treino || 'Treino & Desafios',
          category: 'Arena de Cálculo Mental',
          icon: <Brain size={18} className="text-cyan-400" />,
          color: 'cyan',
        };
      case 'history':
        return {
          title: t.nav_historico || 'Histórico de Cálculos',
          category: 'Auditoria Local',
          icon: <History size={18} className="text-purple-400" />,
          color: 'purple',
        };
      default:
        return {
          title: 'Quantora',
          category: 'Suíte Didática',
          icon: <LayoutGrid size={18} className="text-cyan-400" />,
          color: 'cyan',
        };
    }
  }, [activeTab, t]);

  const cycleTheme = () => {
    const modes = ['light', 'dark', 'system'] as const;
    const nextIndex = (modes.indexOf(settings.theme) + 1) % modes.length;
    updateSettings({ theme: modes[nextIndex] });
  };

  return (
    <header className="sticky top-0 z-40 w-full cosmic-glass border-b border-slate-200/70 dark:border-cyan-500/20 pt-safe backdrop-blur-xl transition-all">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Lado Esquerdo: Botão Retornar ao Hub Cósmico */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('hub')}
            className="flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-cyan-400 border border-cyan-500/40 hover:border-cyan-400 shadow-md shadow-cyan-500/10 hover:shadow-cyan-500/25 transition-all cursor-pointer group active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50"
            title="Voltar ao Hub Principal"
            aria-label="Voltar ao Hub Principal"
          >
            <ChevronLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
            <div className="w-5 h-5 rounded-md overflow-hidden bg-slate-950 flex items-center justify-center border border-cyan-400/40">
              <img src={logoImg} alt="Q" className="w-full h-full object-cover" />
            </div>
            <span className="font-mono text-xs sm:text-sm font-bold tracking-wider uppercase">Hub</span>
          </button>

          {/* Divisor Vertical */}
          <div className="h-6 w-px bg-slate-700/50 hidden sm:block" />

          {/* Identificação do Módulo Focado (Sem HUD de abas!) */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-900 border border-cyan-500/30 flex items-center justify-center shrink-0 shadow-sm">
              {moduleMeta.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight truncate">
                  {moduleMeta.title}
                </h1>
                <span className="hidden md:inline text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30">
                  {moduleMeta.category}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Lado Direito: Ferramentas Utilitárias & Perfil */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Lousa de Rascunho */}
          <button
            type="button"
            onClick={toggleScratchpad}
            className={`relative p-2 rounded-xl border transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 ${
              isScratchpadOpen
                ? 'border-amber-400 bg-amber-500/20 text-amber-500 shadow-amber-500/20'
                : 'border-slate-300 dark:border-cyan-500/20 bg-slate-100/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 hover:text-cyan-400'
            }`}
            title="Lousa de Rascunho"
            aria-label="Lousa de Rascunho"
          >
            <Pencil size={17} className={isScratchpadOpen ? 'rotate-12' : ''} />
            {hasScratchpadStrokes && !isScratchpadOpen && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>

          {/* Alternar Tema Claro / Escuro */}
          <button
            type="button"
            onClick={cycleTheme}
            className="p-2 rounded-xl border border-slate-300 dark:border-cyan-500/20 bg-slate-100/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 hover:text-cyan-400 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50"
            title={`${t.theme_prefix}: ${settings.theme}`}
            aria-label={t.theme}
          >
            {settings.theme === 'light' && <Sun size={17} />}
            {settings.theme === 'dark' && <Moon size={17} />}
            {settings.theme === 'system' && <Laptop size={17} />}
          </button>

          {/* Sincronização em Nuvem */}
          {onOpenAuth && (
            <button
              type="button"
              onClick={onOpenAuth}
              className="p-2 rounded-xl border border-slate-300 dark:border-cyan-500/20 bg-slate-100/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 hover:text-cyan-400 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50"
              title={t.auth_title || 'Sincronização em Nuvem'}
              aria-label={t.auth_title || 'Sincronização em Nuvem'}
            >
              <Cloud size={17} />
            </button>
          )}

          {/* Configurações */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-2 rounded-xl border border-slate-300 dark:border-cyan-500/20 bg-slate-100/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 hover:text-cyan-400 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50"
            title={t.settings_title}
            aria-label={t.settings_title}
          >
            <Settings size={17} />
          </button>

          {/* Pílula de Perfil e Nível */}
          <button
            type="button"
            onClick={onOpenProfile}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-cyan-500/30 bg-slate-100/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-200 text-xs font-bold hover:border-cyan-400 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
            title="Perfil & Conquistas"
          >
            <Trophy size={14} className="text-amber-400 shrink-0" />
            <span className="font-mono">Nv. {levelInfo.level}</span>
            {(profile?.streakDays || 1) > 1 && (
              <span className="text-orange-400 font-extrabold text-[11px] ml-0.5">
                🔥{profile.streakDays}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
});

ModuleTopBar.displayName = 'ModuleTopBar';
