import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Bell,
  Lock,
  Cloud,
} from 'lucide-react';
import { useAppStore, type ActiveTab } from '../../store/useAppStore';
import { useShallow } from 'zustand/react/shallow';
import { calculateLevelInfo } from '../../core/gamification/leveling';
import { getTodayDateString } from '../../core/daily/dailyEngine';
import { useTranslation } from '../../core/i18n/translations';
import { playHubSwipe } from '../../core/platform/audio';
import { getDueCards } from '../../core/quiz/spacedRepetition';
import { NotificationPopover } from './NotificationPopover';
import logoImg from '../../assets/logo.webp';

import {
  CosmicSkull3D,
  CosmicLightning3D,
  CosmicSwords3D,
  CosmicBhaskara3D,
  CosmicAtom3D,
  CosmicPitagoras3D,
  CosmicRegraDeTres3D,
  CosmicDaily3D,
  CosmicSpaced3D,
  CosmicHistory3D,
} from './CosmicIcons3D';

interface HubCard {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  renderIcon: (isActive: boolean) => React.ReactNode;
  neonColor: 'cyan' | 'purple' | 'amber' | 'emerald' | 'indigo';
  targetTab: ActiveTab;
  quizModeSubtrack?: string;
  badge?: string;
  statsLabel: string;
  statsValue: string;
  isLocked?: boolean;
  unlockRequirement?: string;
}

interface CosmicHubProps {
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  onOpenAuth?: () => void;
}

export const CosmicHub: React.FC<CosmicHubProps> = ({ onOpenSettings, onOpenProfile, onOpenAuth }) => {
  const {
    setActiveTab,
    profile,
    quizProgress,
    blitzHighScore,
    highestBossLevelCleared,
    bossCoins,
    dailyChallenge,
    spacedRepetition,
    historyCount,
    unlockedFeatures,
    unlockAllFeatures,
    openQuizWithSubmode,
    settings,
  } = useAppStore(
    useShallow((s) => ({
      setActiveTab: s.setActiveTab,
      openQuizWithSubmode: s.openQuizWithSubmode,
      settings: s.settings,
      profile: s.profile,
      quizProgress: s.quizProgress,
      blitzHighScore: s.profile?.stats?.blitzHighScore || 0,
      highestBossLevelCleared: s.profile?.stats?.highestBossLevelCleared || 0,
      bossCoins: s.profile?.stats?.bossCoins || 0,
      dailyChallenge: s.dailyChallenge,
      spacedRepetition: s.spacedRepetition,
      historyCount: s.history.length,
      unlockedFeatures: s.unlockedFeatures || ['survival'],
      unlockAllFeatures: s.settings?.unlockAllFeatures ?? false,
    }))
  );

  const levelInfo = calculateLevelInfo(profile?.totalXp || 0);
  const isDailyCompleted = dailyChallenge?.lastCompletedDate === getTodayDateString();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [mountTime] = useState(() => Date.now());
  const dueCards = useMemo(() => {
    return getDueCards(
      spacedRepetition?.cards || {},
      spacedRepetition?.globalQuestionsAnswered || 0,
      mountTime
    );
  }, [spacedRepetition, mountTime]);
  const hasDueCards = dueCards.length > 0;

  const sobrevRecorde = quizProgress.survival?.recordCount || 0;
  const isBlitzUnlocked = unlockAllFeatures || levelInfo.level >= 3 || unlockedFeatures.includes('blitz');
  const isBossUnlocked = unlockAllFeatures || levelInfo.level >= 5 || unlockedFeatures.includes('boss_rush');

  const t = useTranslation(settings?.language || 'pt');

  // Mapeamento de todos os módulos e modos do Quantora em cards com ícones 3D em Glassmorphism
  const hubCards: HubCard[] = useMemo(() => [
    {
      id: 'survival',
      title: t.hub_survival_title,
      subtitle: t.hub_survival_subtitle,
      category: t.hub_survival_category,
      neonColor: 'cyan',
      targetTab: 'quiz',
      badge: t.hub_survival_badge,
      statsLabel: t.hub_survival_stats.replace('{record}', sobrevRecorde.toString()),
      statsValue: `${quizProgress.survival?.highScore || 0} XP`,
      renderIcon: (isActive) => <CosmicSkull3D size={isActive ? 88 : 66} />,
    },
    {
      id: 'blitz',
      title: t.hub_blitz_title,
      subtitle: t.hub_blitz_subtitle,
      category: t.hub_blitz_category,
      neonColor: 'amber',
      targetTab: 'quiz',
      badge: t.hub_blitz_badge,
      statsLabel: t.hub_blitz_stats,
      statsValue: `${blitzHighScore} pts`,
      isLocked: !isBlitzUnlocked,
      unlockRequirement: t.hub_blitz_unlock,
      renderIcon: (isActive) => <CosmicLightning3D size={isActive ? 84 : 64} />,
    },
    {
      id: 'boss',
      title: t.hub_boss_title,
      subtitle: t.hub_boss_subtitle,
      category: t.hub_boss_category,
      neonColor: 'purple',
      targetTab: 'quiz',
      badge: t.hub_boss_badge,
      statsLabel: t.hub_boss_stats_level.replace('{level}', (highestBossLevelCleared > 0 ? highestBossLevelCleared : 1).toString()),
      statsValue: t.hub_boss_stats_coins.replace('{coins}', bossCoins.toString()),
      isLocked: !isBossUnlocked,
      unlockRequirement: t.hub_boss_unlock,
      renderIcon: (isActive) => <CosmicSwords3D size={isActive ? 84 : 64} />,
    },
    {
      id: 'bhaskara',
      title: t.hub_bhaskara_title,
      subtitle: t.hub_bhaskara_subtitle,
      category: t.hub_bhaskara_category,
      neonColor: 'cyan',
      targetTab: 'bhaskara',
      badge: t.hub_bhaskara_badge,
      statsLabel: t.hub_bhaskara_stats,
      statsValue: `${profile?.stats?.totalBhaskara || 0}`,
      renderIcon: (isActive) => <CosmicBhaskara3D size={isActive ? 84 : 64} />,
    },
    {
      id: 'physics',
      title: t.hub_physics_title,
      subtitle: t.hub_physics_subtitle,
      category: t.hub_physics_category,
      neonColor: 'indigo',
      targetTab: 'physics',
      badge: t.hub_physics_badge,
      statsLabel: t.hub_physics_stats_label,
      statsValue: t.hub_physics_stats_value,
      renderIcon: (isActive) => <CosmicAtom3D size={isActive ? 84 : 64} />,
    },
    {
      id: 'pitagoras',
      title: t.hub_pitagoras_title,
      subtitle: t.hub_pitagoras_subtitle,
      category: t.hub_pitagoras_category,
      neonColor: 'amber',
      targetTab: 'pitagoras',
      badge: t.hub_pitagoras_badge,
      statsLabel: t.hub_pitagoras_stats_label,
      statsValue: t.hub_pitagoras_stats_value,
      renderIcon: (isActive) => <CosmicPitagoras3D size={isActive ? 84 : 64} />,
    },
    {
      id: 'regra_de_tres',
      title: t.hub_regra_title,
      subtitle: t.hub_regra_subtitle,
      category: t.hub_regra_category,
      neonColor: 'emerald',
      targetTab: 'regra_simples',
      badge: t.hub_regra_badge,
      statsLabel: t.hub_regra_stats,
      statsValue: `${profile?.stats?.totalRegraDeTres || 0}`,
      renderIcon: (isActive) => <CosmicRegraDeTres3D size={isActive ? 84 : 64} />,
    },
    {
      id: 'daily',
      title: t.hub_daily_title,
      subtitle: t.hub_daily_subtitle,
      category: t.hub_daily_category,
      neonColor: 'amber',
      targetTab: 'quiz',
      badge: isDailyCompleted ? t.hub_daily_badge_done : t.hub_daily_badge_pending,
      statsLabel: t.hub_daily_stats_label,
      statsValue: t.hub_daily_stats_value.replace('{streak}', (profile?.streakDays || 1).toString()),
      renderIcon: (isActive) => <CosmicDaily3D size={isActive ? 84 : 64} />,
    },
    {
      id: 'spaced',
      title: t.hub_spaced_title,
      subtitle: t.hub_spaced_subtitle,
      category: t.hub_spaced_category,
      neonColor: 'cyan',
      targetTab: 'quiz',
      badge: t.hub_spaced_badge,
      statsLabel: t.hub_spaced_stats_label,
      statsValue: t.hub_spaced_stats_value.replace('{count}', Object.keys(spacedRepetition?.cards || {}).length.toString()),
      renderIcon: (isActive) => <CosmicSpaced3D size={isActive ? 84 : 64} />,
    },
    {
      id: 'history',
      title: t.hub_history_title,
      subtitle: t.hub_history_subtitle,
      category: t.hub_history_category,
      neonColor: 'indigo',
      targetTab: 'history',
      badge: t.hub_history_badge.replace('{count}', historyCount.toString()),
      statsLabel: t.hub_history_stats_label,
      statsValue: t.hub_history_stats_value.replace('{count}', historyCount.toString()),
      renderIcon: (isActive) => <CosmicHistory3D size={isActive ? 84 : 64} />,
    },
  ], [
    t,
    sobrevRecorde,
    quizProgress,
    isBlitzUnlocked,
    isBossUnlocked,
    isDailyCompleted,
    historyCount,
    profile,
    highestBossLevelCleared,
    spacedRepetition,
    blitzHighScore,
    bossCoins,
  ]);


  // Índice do card central selecionado (inicia no Survival Mode: índice 0)
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const activeIndexRef = useRef<number>(0);
  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);


  // Estados e referências para Drag-to-Scroll com mouse
  const isDraggingRef = useRef<boolean>(false);
  const startXRef = useRef<number>(0);
  const scrollLeftRef = useRef<number>(0);
  const hasDraggedRef = useRef<boolean>(false);
  const isInitialMount = useRef<boolean>(true);

  // Rolagem suave para centralizar o card ativo com feedback sonoro sutil
  const scrollToCard = useCallback((index: number) => {
    const prevIndex = activeIndexRef.current;
    setActiveIndex(index);

    if (!isInitialMount.current && prevIndex !== index) {
      playHubSwipe();
    } else {
      isInitialMount.current = false;
    }

    if (!carouselRef.current) return;
    const container = carouselRef.current;
    const cardElements = container.children;
    if (cardElements[index]) {
      const card = cardElements[index] as HTMLElement;
      const scrollLeft = card.offsetLeft - container.offsetWidth / 2 + card.offsetWidth / 2;
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  }, []);

  // Handlers para arrastar o carrossel com o mouse (Drag to Scroll)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!carouselRef.current) return;
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = e.pageX - carouselRef.current.offsetLeft;
    scrollLeftRef.current = carouselRef.current.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !carouselRef.current) return;
    const x = e.pageX - carouselRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.35;
    if (Math.abs(walk) > 6) {
      hasDraggedRef.current = true;
    }
    carouselRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    if (!isDraggingRef.current || !carouselRef.current) return;
    isDraggingRef.current = false;

    // Se o usuário arrastou com o mouse, calcular o card mais próximo do centro para encaixar com snap
    if (hasDraggedRef.current && carouselRef.current) {
      const container = carouselRef.current;
      const containerCenter = container.scrollLeft + container.offsetWidth / 2;
      const children = Array.from(container.children) as HTMLElement[];

      let closestIdx = activeIndexRef.current;
      let minDistance = Infinity;

      children.forEach((child, idx) => {
        const childCenter = child.offsetLeft + child.offsetWidth / 2;
        const dist = Math.abs(containerCenter - childCenter);
        if (dist < minDistance) {
          minDistance = dist;
          closestIdx = idx;
        }
      });

      scrollToCard(closestIdx);
    }
  };

  // Ação de entrada direta no módulo/modo selecionado
  const handleLaunchCard = useCallback(
    (card: HubCard) => {
      if (card.isLocked) return;
      if (card.id === 'survival') {
        openQuizWithSubmode('survival');
      } else if (card.id === 'blitz') {
        openQuizWithSubmode('blitz');
      } else if (card.id === 'boss') {
        openQuizWithSubmode('boss_rush');
      } else if (card.id === 'daily') {
        openQuizWithSubmode('daily');
      } else if (card.id === 'spaced') {
        openQuizWithSubmode('spaced');
      } else {
        setActiveTab(card.targetTab);
      }
    },
    [openQuizWithSubmode, setActiveTab]
  );

  // Atalhos de teclado (Setas Esquerda / Direita e Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        const next = Math.min(hubCards.length - 1, activeIndex + 1);
        scrollToCard(next);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const prev = Math.max(0, activeIndex - 1);
        scrollToCard(prev);
      } else if (e.key === 'Enter') {
        const activeCard = hubCards[activeIndex];
        if (activeCard) {
          handleLaunchCard(activeCard);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, hubCards, scrollToCard, handleLaunchCard]);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-between overflow-x-hidden select-none py-2">
      {/* 1. TOP HEADER MINIMALISTA (Fiel à Imagem: Logo clean + Notificação + Perfil) */}
      <div className="w-full flex items-center justify-between px-4 sm:px-8 z-30">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-cyan-400/50 flex items-center justify-center shadow-lg shadow-cyan-500/10 dark:shadow-cyan-500/25 overflow-hidden">
            <img src={logoImg} alt="Quantora" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white font-mono flex items-center gap-2">
              <span>Quantora</span>
              <span className="hidden sm:inline text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border border-cyan-500/30 dark:border-cyan-400/40">
                Cyber Arena
              </span>
            </h1>
          </div>
        </div>

        {/* Quick Actions (Cápsulas de Vidro: Nuvem + Sino + Perfil) */}
        <div className="flex items-center gap-3">
          {/* Sincronização em Nuvem */}
          {onOpenAuth && (
            <button
              type="button"
              onClick={onOpenAuth}
              className="w-10 h-10 rounded-2xl cosmic-glass flex items-center justify-center text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-300 hover:border-cyan-400/50 transition-all cursor-pointer shadow-md relative"
              title={t.auth_title || 'Sincronização em Nuvem'}
              aria-label={t.auth_title || 'Sincronização em Nuvem'}
            >
              <Cloud size={18} />
            </button>
          )}

          {/* Sino de Notificação / Central Cósmica */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsNotificationOpen((prev) => !prev)}
              className={`w-10 h-10 rounded-2xl cosmic-glass flex items-center justify-center transition-all cursor-pointer shadow-md relative focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 ${
                isNotificationOpen
                  ? 'border-cyan-400 bg-cyan-500/20 text-cyan-400 shadow-cyan-500/20'
                  : 'text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-300 hover:border-cyan-400/50'
              }`}
              title={t.notifications_title}
              aria-label={t.notifications_title}
              aria-expanded={isNotificationOpen}
              aria-haspopup="dialog"
            >
              <Bell size={18} />
              {(!isDailyCompleted || hasDueCards) && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-fuchsia-500 animate-ping" />
              )}
            </button>

            <NotificationPopover
              isOpen={isNotificationOpen}
              onClose={() => setIsNotificationOpen(false)}
              onNavigateToDaily={() => openQuizWithSubmode('daily')}
              onNavigateToMistakes={() => openQuizWithSubmode('spaced')}
              onOpenProfile={onOpenProfile}
            />
          </div>

          {/* Cápsula de Perfil e Nível (Quartora / Lucas) */}
          <button
            type="button"
            onClick={onOpenProfile}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl cosmic-glass border border-slate-300/80 dark:border-slate-700/60 hover:border-cyan-400/50 text-xs font-bold text-slate-800 dark:text-slate-200 transition-all cursor-pointer shadow-md"
            title="Perfil do Jogador"
          >
            <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
              <Trophy size={13} className="text-amber-500 dark:text-amber-400" />
            </div>
            <span className="font-mono text-cyan-800 dark:text-cyan-200">Nv. {levelInfo.level}</span>
          </button>
        </div>
      </div>

      {/* 2. O CARROSSEL HORIZONTAL DE CARDS FLUTUANTES (Scrolla para o nada com Drag do Mouse!) */}
      <div className="relative w-full my-auto py-6 sm:py-10 flex items-center overflow-hidden">
        {/* Setas de Navegação Flutuantes nas Laterais */}
        <button
          type="button"
          onClick={() => scrollToCard(Math.max(0, activeIndex - 1))}
          disabled={activeIndex === 0}
          className="hidden md:flex absolute left-4 z-40 w-12 h-12 rounded-full cosmic-glass border border-slate-300/80 dark:border-cyan-500/30 items-center justify-center text-slate-700 dark:text-cyan-300 hover:scale-110 hover:border-cyan-400 transition-all disabled:opacity-20 disabled:pointer-events-none cursor-pointer shadow-lg dark:shadow-xl bg-white/90 dark:bg-slate-900/70"
          aria-label="Card anterior"
        >
          <ChevronLeft size={24} />
        </button>

        <button
          type="button"
          onClick={() => scrollToCard(Math.min(hubCards.length - 1, activeIndex + 1))}
          disabled={activeIndex === hubCards.length - 1}
          className="hidden md:flex absolute right-4 z-40 w-12 h-12 rounded-full cosmic-glass border border-slate-300/80 dark:border-cyan-500/30 items-center justify-center text-slate-700 dark:text-cyan-300 hover:scale-110 hover:border-cyan-400 transition-all disabled:opacity-20 disabled:pointer-events-none cursor-pointer shadow-lg dark:shadow-xl bg-white/90 dark:bg-slate-900/70"
          aria-label="Próximo card"
        >
          <ChevronRight size={24} />
        </button>

        {/* Trilho de Scroll Horizontal (Fading nas extremidades para o nada + Drag com Mouse) */}
        <div
          ref={carouselRef}
          role="tablist"
          aria-label="Carrossel de Modos"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          className="w-full flex items-center gap-6 sm:gap-10 overflow-x-auto no-scrollbar scroll-smooth px-[calc(50vw-160px)] sm:px-[calc(50vw-200px)] py-4 snap-x snap-mandatory cursor-grab active:cursor-grabbing select-none"
          style={{
            maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
            WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
          }}
        >
          {hubCards.map((card, idx) => {
            const isActive = idx === activeIndex;

            return (
              <div
                key={card.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => {
                  if (!hasDraggedRef.current) {
                    scrollToCard(idx);
                  }
                }}
                className={`snap-center shrink-0 w-[300px] sm:w-[360px] h-[480px] sm:h-[530px] rounded-[36px] flex flex-col items-center justify-between p-7 sm:p-8 text-center relative overflow-hidden transition-all duration-500 cursor-pointer select-none ${
                  isActive
                    ? 'cosmic-hero-card scale-100 sm:scale-105 z-20 opacity-100 shadow-2xl shadow-cyan-500/10 dark:shadow-[0_0_45px_-5px_rgba(6,182,212,0.5)]'
                    : 'cosmic-glass-stage scale-90 opacity-75 dark:opacity-40 hover:opacity-100 z-10'
                }`}
              >
                {/* Reflexo Especular de Luz no Topo do Vidro */}
                <div
                  className={`absolute inset-x-0 top-0 h-44 pointer-events-none rounded-t-[36px] ${
                    isActive
                      ? 'bg-gradient-to-b from-cyan-400/20 via-white/40 dark:via-white/10 to-transparent'
                      : 'bg-gradient-to-b from-white/30 dark:from-white/10 to-transparent'
                  }`}
                />

                {/* Top Header do Card */}
                <div className="flex flex-col items-center gap-1.5 z-10 w-full">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono font-black uppercase tracking-widest ${
                        isActive ? 'text-cyan-700 dark:text-cyan-300' : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {card.category}
                    </span>
                    {card.badge && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 dark:bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 border border-cyan-500/30 dark:border-cyan-400/30">
                        {card.badge}
                      </span>
                    )}
                  </div>
                  <h2
                    className={`font-black font-mono tracking-wide ${
                      isActive
                        ? 'text-2xl sm:text-3xl text-slate-950 dark:text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:drop-shadow-[0_2px_12px_rgba(255,255,255,0.4)]'
                        : 'text-xl sm:text-2xl text-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {card.title}
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400 max-w-[240px] line-clamp-2 font-medium">
                    {card.subtitle}
                  </p>
                </div>

                {/* Centro do Card: Ícone 3D em Glassmorphism com ambientação fiel ao protótipo */}
                <div className="relative my-auto flex items-center justify-center z-10 w-full py-2">
                  {/* Detalhes de ambientação do protótipo no card ativo do Survival Mode */}
                  {isActive && card.id === 'survival' && (
                    <>
                      <span className="absolute -left-1 sm:left-2 text-xs font-mono font-black tracking-widest text-cyan-600 dark:text-cyan-400/50 select-none drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]">
                        XP
                      </span>
                      <span className="absolute -right-1 sm:right-2 text-xs font-mono font-black tracking-widest text-fuchsia-600 dark:text-fuchsia-400/50 select-none drop-shadow-[0_0_8px_rgba(217,70,239,0.6)]">
                        XP
                      </span>
                    </>
                  )}

                  <div
                    className={`rounded-3xl flex items-center justify-center transition-all duration-500 relative ${
                      isActive
                        ? 'p-2 sm:p-3 bg-cyan-500/10 dark:bg-gradient-to-b dark:from-cyan-500/15 dark:via-transparent dark:to-sky-950/40 border border-cyan-400/50 dark:border-cyan-400/60 shadow-lg shadow-cyan-500/15 dark:shadow-[0_0_50px_rgba(6,182,212,0.4)] scale-110'
                        : 'p-2 bg-slate-100 dark:bg-slate-900/30 border border-slate-300/80 dark:border-slate-700/40'
                    }`}
                  >
                    {card.isLocked ? (
                      <Lock size={44} className="text-slate-500" />
                    ) : (
                      card.renderIcon(isActive)
                    )}
                  </div>

                  {card.isLocked && (
                    <span className="absolute -bottom-5 text-[11px] font-mono font-bold text-amber-500 dark:text-amber-400">
                      🔒 Requer {card.unlockRequirement}
                    </span>
                  )}
                </div>

                {/* Rodapé do Card: Estatísticas + Botão Cápsula Luminoso */}
                <div className="w-full flex flex-col items-center gap-3 z-10">
                  <div className="w-full flex items-center justify-between text-xs font-mono font-bold text-slate-600 dark:text-slate-400 px-2 border-t border-slate-200 dark:border-slate-700/50 pt-2.5">
                    <span>{card.statsLabel}</span>
                    <span className="text-cyan-700 dark:text-cyan-300 font-black">{card.statsValue}</span>
                  </div>

                  {/* Botão Cápsula ("Continue" no Ativo / "Selecionar" nos vizinhos) */}
                  <button
                    type="button"
                    disabled={card.isLocked}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isActive) {
                        handleLaunchCard(card);
                      } else {
                        scrollToCard(idx);
                      }
                    }}
                    className={`w-full py-3 rounded-full font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-400 via-sky-300 to-cyan-400 hover:from-cyan-300 hover:to-sky-200 text-slate-950 shadow-lg shadow-cyan-500/25 dark:shadow-[0_0_35px_rgba(6,182,212,0.8)] hover:scale-105 active:scale-95'
                        : 'bg-slate-100/90 dark:bg-transparent text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white border border-slate-300 dark:border-slate-700 hover:border-cyan-400/50'
                    }`}
                  >
                    {isActive ? (
                      <>
                        <span>Continue</span>
                        <ArrowRight size={16} className="stroke-[3]" />
                      </>
                    ) : (
                      <span>Selecionar</span>
                    )}
                  </button>

                  {/* Indicadores de Traço na Base (Fiel ao Mockup) */}
                  {isActive && (
                    <div className="flex items-center gap-1.5 mt-1">
                      {hubCards.map((_, i) => (
                        <div
                          key={i}
                          className={`h-1 rounded-full transition-all duration-300 ${
                            i === activeIndex
                              ? 'w-6 bg-cyan-600 dark:bg-cyan-400 shadow-md shadow-cyan-500/30 dark:shadow-[0_0_8px_rgba(6,182,212,0.9)]'
                              : 'w-2 bg-slate-300 dark:bg-slate-700/60'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. BARRA INFERIOR / RODAPÉ COCKPIT (Fiel à Imagem) */}
      <div className="w-full flex items-center justify-between px-4 sm:px-8 z-30">
        {/* Canto Inferior Esquerdo: Seta de Ação + Código Digital */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => scrollToCard(0)}
            className="w-10 h-10 rounded-full cosmic-glass border border-slate-300/80 dark:border-cyan-500/30 flex items-center justify-center text-slate-700 dark:text-cyan-300 hover:scale-110 hover:border-cyan-400 transition-all cursor-pointer shadow-md dark:shadow-lg bg-white/90 dark:bg-slate-900/60"
            title="Voltar ao início do Hub"
            aria-label="Voltar ao início do Hub"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="hidden sm:flex flex-col text-[11px] font-mono text-cyan-800 dark:text-cyan-400/80 leading-tight">
            <span>SYS: 03:57.772</span>
            <span className="text-[9px] text-slate-600 dark:text-slate-500">QUANTORA OS v1.2</span>
          </div>
        </div>

        {/* Canto Inferior Direito: Configurações & Ajuste em Cápsula */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Abrir configurações do sistema"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full cosmic-glass border border-slate-300/80 dark:border-slate-700/60 hover:border-cyan-400/50 text-xs font-mono text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-all cursor-pointer shadow-md bg-white/90 dark:bg-slate-900/60"
          >
            <span>Refined</span>
            <span className="text-cyan-600 dark:text-cyan-400">⚙</span>
          </button>
        </div>
      </div>
    </div>
  );
};
