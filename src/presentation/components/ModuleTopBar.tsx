import React, { useMemo, useState } from 'react';
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
  Bell,
  Camera,
  GitMerge,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from '../../core/i18n/translations';
import { calculateLevelInfo, getDeviceLocalDateString } from '../../core/gamification/leveling';
import { getDueCards } from '../../core/quiz/spacedRepetition';
import { NotificationPopover } from './NotificationPopover';
import logoImg from '../../assets/logo.webp';

interface ModuleTopBarProps {
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  onOpenAuth?: () => void;
}

export const ModuleTopBar: React.FC<ModuleTopBarProps> = React.memo(({ onOpenSettings, onOpenProfile, onOpenAuth }) => {
  /**
   * ⚡ Bolt Performance Optimization
   * 💡 What: Extracted specific primitive fields from useAppStore instead of full objects.
   * 🎯 Why: Extracting `profile: s.profile` or `settings: s.settings` causes re-renders when *any* property of those objects changes.
   * 📊 Impact: Prevents unnecessary component re-renders when unrelated properties (like profile.stats) are updated.
   */
  const {
    activeTab,
    setActiveTab,
    language,
    theme,
    updateSettings,
    totalXp,
    streakDays,
    isScratchpadOpen,
    toggleScratchpad,
    hasScratchpadStrokes,
    openQuizWithSubmode,
    spacedRepetitionCards,
    spacedRepetitionGlobalQuestionsAnswered,
    dailyChallengeLastCompletedDate,
  } = useAppStore(
    useShallow((s) => ({
      activeTab: s.activeTab,
      setActiveTab: s.setActiveTab,
      language: s.settings.language,
      theme: s.settings.theme,
      updateSettings: s.updateSettings,
      totalXp: s.profile?.totalXp,
      streakDays: s.profile?.streakDays,
      isScratchpadOpen: s.isScratchpadOpen,
      toggleScratchpad: s.toggleScratchpad,
      hasScratchpadStrokes: s.hasScratchpadStrokes,
      openQuizWithSubmode: s.openQuizWithSubmode,
      spacedRepetitionCards: s.spacedRepetition?.cards,
      spacedRepetitionGlobalQuestionsAnswered: s.spacedRepetition?.globalQuestionsAnswered,
      dailyChallengeLastCompletedDate: s.dailyChallenge?.lastCompletedDate,
    }))
  );

  const t = useTranslation(language || 'pt');
  const levelInfo = useMemo(
    () => calculateLevelInfo(totalXp || 0, language || 'pt'),
    [totalXp, language]
  );

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const today = useMemo(() => getDeviceLocalDateString(), []);
  const [mountTime] = useState(() => Date.now());
  const isDailyCompleted = useMemo(() => {
    return dailyChallengeLastCompletedDate === today;
  }, [dailyChallengeLastCompletedDate, today]);

  const dueCards = useMemo(() => {
    return getDueCards(
      spacedRepetitionCards || {},
      spacedRepetitionGlobalQuestionsAnswered || 0,
      mountTime
    );
  }, [spacedRepetitionCards, spacedRepetitionGlobalQuestionsAnswered, mountTime]);

  const hasDueCards = dueCards.length > 0;

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
      case 'photo_math':
        return {
          title: t.nav_photo_math || 'Foto Scanner',
          category: 'Visão Computacional & IA',
          icon: <Camera size={18} className="text-cyan-400" />,
          color: 'cyan',
        };
      case 'linear_systems':
        return {
          title: t.nav_linear || 'Sistemas & Progressões',
          category: 'Álgebra & Gerador',
          icon: <GitMerge size={18} className="text-cyan-400" />,
          color: 'cyan',
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
    const currentTheme = theme || 'system';
    const nextIndex = (modes.indexOf(currentTheme) + 1) % modes.length;
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

        {/* Centro: Menu de Navegação Global Persistente */}
        <nav aria-label="Navegação Global" className="hidden lg:flex items-center gap-1 bg-slate-900/80 p-1 rounded-2xl border border-slate-700/60 backdrop-blur-md shadow-lg">
          <button
            type="button"
            onClick={() => setActiveTab('hub')}
            aria-current={activeTab === 'hub' ? 'page' : undefined}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 ${
              activeTab === 'hub'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <LayoutGrid size={13} />
            <span>Hub</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('photo_math')}
            aria-current={activeTab === 'photo_math' ? 'page' : undefined}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 ${
              activeTab === 'photo_math'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Camera size={13} />
            <span>Foto Scanner</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab(['bhaskara', 'pitagoras', 'regra_simples', 'regra_composta', 'physics'].includes(activeTab) ? activeTab : 'bhaskara')}
            aria-current={['bhaskara', 'pitagoras', 'regra_simples', 'regra_composta', 'physics'].includes(activeTab) ? 'page' : undefined}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 ${
              ['bhaskara', 'pitagoras', 'regra_simples', 'regra_composta', 'physics'].includes(activeTab)
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sigma size={13} />
            <span>Calculadoras</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('quiz')}
            aria-current={activeTab === 'quiz' ? 'page' : undefined}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 ${
              activeTab === 'quiz'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Brain size={13} />
            <span>Arcade</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            aria-current={activeTab === 'history' ? 'page' : undefined}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 ${
              activeTab === 'history'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <History size={13} />
            <span>Histórico</span>
          </button>
        </nav>

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
            aria-pressed={isScratchpadOpen}
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
            title={`${t.theme_prefix}: ${theme || 'system'}`}
            aria-label={`${t.theme_prefix}: ${theme || 'system'}`}
          >
            {theme === 'light' && <Sun size={17} />}
            {theme === 'dark' && <Moon size={17} />}
            {(!theme || theme === 'system') && <Laptop size={17} />}
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

          {/* Central de Notificações Cósmica */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsNotificationOpen((prev) => !prev)}
              className={`relative p-2 rounded-xl border transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 ${
                isNotificationOpen
                  ? 'border-cyan-400 bg-cyan-500/20 text-cyan-400 shadow-cyan-500/20'
                  : 'border-slate-300 dark:border-cyan-500/20 bg-slate-100/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 hover:text-cyan-400'
              }`}
              title={t.notifications_title}
              aria-label={t.notifications_title}
              aria-expanded={isNotificationOpen}
              aria-haspopup="dialog"
            >
              <Bell size={17} />
              {(!isDailyCompleted || hasDueCards) && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-fuchsia-500 animate-ping" />
              )}
            </button>

            {/*
              * ⚡ Bolt Performance Optimization
              * 💡 What: Conditionally mount NotificationPopover only when open.
              * 🎯 Why: When hidden via early returns, its useAppStore hooks still ran on every update, causing invisible re-renders.
              * 📊 Impact: Eliminates unnecessary React subscription evaluations.
            */}
            {isNotificationOpen && (
              <NotificationPopover
                isOpen={isNotificationOpen}
                onClose={() => setIsNotificationOpen(false)}
                onNavigateToDaily={() => openQuizWithSubmode('daily')}
                onNavigateToMistakes={() => openQuizWithSubmode('spaced')}
                onOpenProfile={onOpenProfile}
              />
            )}
          </div>

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

          {/* Pílula de Perfil e Nível com Contador Numérico de XP */}
          <button
            type="button"
            onClick={onOpenProfile}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-cyan-500/30 bg-slate-100/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-200 text-xs font-bold hover:border-cyan-400 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
            title={`Perfil & Conquistas (${levelInfo.currentLevelXp}/${levelInfo.xpForNextLevel} XP para o próximo nível)`}
            aria-label={`Perfil & Conquistas, Nível ${levelInfo.level}, ${levelInfo.currentLevelXp} de ${levelInfo.xpForNextLevel} XP`}
          >
            <Trophy size={14} className="text-amber-400 shrink-0" />
            <span className="font-mono">
              Nv. {levelInfo.level} <span className="text-[10px] text-slate-500 dark:text-cyan-300/80 font-normal">({levelInfo.currentLevelXp}/{levelInfo.xpForNextLevel} XP)</span>
            </span>
            {(streakDays || 1) > 1 && (
              <span className="text-orange-400 font-extrabold text-[11px] ml-0.5">
                🔥{streakDays}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
});

ModuleTopBar.displayName = 'ModuleTopBar';
