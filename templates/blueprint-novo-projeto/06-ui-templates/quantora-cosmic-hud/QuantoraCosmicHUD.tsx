import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Bell,
  Lock,
  Cloud,
} from 'lucide-react';
import { playHubSwipe } from './audio-feedback';
import { HUDCard, DEFAULT_QUANTORA_CARDS } from './defaultCards';

export type { HUDCard } from './defaultCards';

export interface QuantoraCosmicHUDProps {
  cards?: HUDCard[];
  onLaunchCard?: (card: HUDCard) => void;
  onOpenSettings?: () => void;
  onOpenProfile?: () => void;
  onOpenAuth?: () => void;
  brandTitle?: string;
  userLevel?: number;
  isDailyNotificationPending?: boolean;
}

export const QuantoraCosmicHUD: React.FC<QuantoraCosmicHUDProps> = ({
  cards = DEFAULT_QUANTORA_CARDS,
  onLaunchCard,
  onOpenSettings,
  onOpenProfile,
  onOpenAuth,
  brandTitle = 'Quantora',
  userLevel = 5,
  isDailyNotificationPending = true,
}) => {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const activeIndexRef = useRef<number>(0);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  // Estados e referências para Drag-to-Scroll com mouse (Arrastar para o lado)
  const isDraggingRef = useRef<boolean>(false);
  const startXRef = useRef<number>(0);
  const scrollLeftRef = useRef<number>(0);
  const hasDraggedRef = useRef<boolean>(false);
  const isInitialMount = useRef<boolean>(true);

  // Rolagem suave para centralizar o card ativo com feedback sonoro sintético
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

  // Atalhos de teclado (Setas Esquerda / Direita e Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        const next = Math.min(cards.length - 1, activeIndex + 1);
        scrollToCard(next);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const prev = Math.max(0, activeIndex - 1);
        scrollToCard(prev);
      } else if (e.key === 'Enter') {
        const activeCard = cards[activeIndex];
        if (activeCard && onLaunchCard) {
          onLaunchCard(activeCard);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, cards, scrollToCard, onLaunchCard]);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-between overflow-x-hidden select-none py-2 font-sans">
      {/* 1. TOP HEADER (Logo + Notificação + Perfil com Nível) */}
      <div className="w-full flex items-center justify-between px-4 sm:px-8 z-30">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-cyan-400/50 flex items-center justify-center shadow-lg shadow-cyan-500/10 dark:shadow-cyan-500/25">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-500 font-extrabold text-xl font-mono">
              Q
            </span>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white font-mono flex items-center gap-2">
              <span>{brandTitle}</span>
              <span className="hidden sm:inline text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border border-cyan-500/30 dark:border-cyan-400/40">
                Cyber Arena
              </span>
            </h1>
          </div>
        </div>

        {/* Quick Actions (Nuvem + Sino + Perfil) */}
        <div className="flex items-center gap-3">
          {onOpenAuth && (
            <button
              type="button"
              onClick={onOpenAuth}
              className="w-10 h-10 rounded-2xl cosmic-glass flex items-center justify-center text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-300 hover:border-cyan-400/50 transition-all cursor-pointer shadow-md"
              title="Sincronização em Nuvem"
              aria-label="Sincronização em Nuvem"
            >
              <Cloud size={18} />
            </button>
          )}

          <button
            type="button"
            className="w-10 h-10 rounded-2xl cosmic-glass flex items-center justify-center text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-300 hover:border-cyan-400/50 transition-all cursor-pointer shadow-md relative"
            title="Notificações / Desafio Diário"
          >
            <Bell size={18} />
            {isDailyNotificationPending && (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-fuchsia-500 animate-ping" />
            )}
          </button>

          <button
            type="button"
            onClick={onOpenProfile}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl cosmic-glass border border-slate-300/80 dark:border-slate-700/60 hover:border-cyan-400/50 text-xs font-bold text-slate-800 dark:text-slate-200 transition-all cursor-pointer shadow-md"
            title="Perfil do Jogador"
          >
            <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
              <Trophy size={13} className="text-amber-500 dark:text-amber-400" />
            </div>
            <span className="font-mono text-cyan-800 dark:text-cyan-200">Nv. {userLevel}</span>
          </button>
        </div>
      </div>

      {/* 2. O CARROSSEL HORIZONTAL DE CARDS (Arrastar para o lado com Mouse Drag e Touch Swipe) */}
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
          onClick={() => scrollToCard(Math.min(cards.length - 1, activeIndex + 1))}
          disabled={activeIndex === cards.length - 1}
          className="hidden md:flex absolute right-4 z-40 w-12 h-12 rounded-full cosmic-glass border border-slate-300/80 dark:border-cyan-500/30 items-center justify-center text-slate-700 dark:text-cyan-300 hover:scale-110 hover:border-cyan-400 transition-all disabled:opacity-20 disabled:pointer-events-none cursor-pointer shadow-lg dark:shadow-xl bg-white/90 dark:bg-slate-900/70"
          aria-label="Próximo card"
        >
          <ChevronRight size={24} />
        </button>

        {/* Trilho de Scroll Horizontal com Máscara de Desvanecimento nas Bordas */}
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
          {cards.map((card, idx) => {
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

                {/* Centro do Card: Ícone 3D em Glassmorphism */}
                <div className="relative my-auto flex items-center justify-center z-10 w-full py-2">
                  {/* Badges XP laterais no card ativo */}
                  {isActive && (
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

                {/* Rodapé do Card: Estatísticas + Botão Cápsula */}
                <div className="w-full flex flex-col items-center gap-3 z-10">
                  <div className="w-full flex items-center justify-between text-xs font-mono font-bold text-slate-600 dark:text-slate-400 px-2 border-t border-slate-200 dark:border-slate-700/50 pt-2.5">
                    <span>{card.statsLabel}</span>
                    <span className="text-cyan-700 dark:text-cyan-300 font-black">{card.statsValue}</span>
                  </div>

                  <button
                    type="button"
                    disabled={card.isLocked}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isActive) {
                        if (onLaunchCard) onLaunchCard(card);
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

                  {/* Indicadores de Traço na Base */}
                  {isActive && (
                    <div className="flex items-center gap-1.5 mt-1">
                      {cards.map((_, i) => (
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

      {/* 3. BARRA INFERIOR / RODAPÉ COCKPIT */}
      <div className="w-full flex items-center justify-between px-4 sm:px-8 z-30">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => scrollToCard(0)}
            className="w-10 h-10 rounded-full cosmic-glass border border-slate-300/80 dark:border-cyan-500/30 flex items-center justify-center text-slate-700 dark:text-cyan-300 hover:scale-110 hover:border-cyan-400 transition-all cursor-pointer shadow-md dark:shadow-lg bg-white/90 dark:bg-slate-900/60"
            title="Voltar ao primeiro card"
            aria-label="Voltar ao primeiro card"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="hidden sm:flex flex-col text-[11px] font-mono text-cyan-800 dark:text-cyan-400/80 leading-tight">
            <span>SYS: 03:57.772</span>
            <span className="text-[9px] text-slate-600 dark:text-slate-500">QUANTORA OS v1.2</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Configurações"
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
