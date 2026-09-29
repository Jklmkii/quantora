import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  ChevronDown, 
  ArrowLeft, 
  Plus, 
  Minus, 
  Zap, 
  Skull, 
  Swords, 
  Flame, 
  LucideIcon 
} from 'lucide-react';

export interface CarouselCardItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: LucideIcon;
  iconColor: string;
  glowColor: string;
  borderGradient: string;
  xpValue: number;
  streakLabel?: string;
  buttonLabel?: string;
  metaInfo?: string;
}

const DEFAULT_ITEMS: CarouselCardItem[] = [
  {
    id: 'blitz',
    title: '60s Blitz',
    subtitle: 'Velocidade & Reflexos',
    description: 'Resolva o máximo de operações antes que o tempo esgote. Combos aceleram seu XP.',
    icon: Zap,
    iconColor: '#00f2fe',
    glowColor: 'rgba(0, 242, 254, 0.4)',
    borderGradient: 'from-cyan-400 to-blue-600',
    xpValue: 150,
    buttonLabel: 'Iniciar Blitz',
    metaInfo: 'Glow glover electrical skarks',
  },
  {
    id: 'survival',
    title: 'Survival Mode',
    subtitle: 'Educational Math training',
    description: 'Sobreviva a ondas crescentes de dificuldade. Erros drenam seus escudos.',
    icon: Skull,
    iconColor: '#00f2fe',
    glowColor: 'rgba(0, 242, 254, 0.5)',
    borderGradient: 'from-cyan-400 via-purple-500 to-pink-500',
    xpValue: 500,
    streakLabel: 'Streak Mode',
    buttonLabel: 'Continue',
    metaInfo: 'BP Treak Mode',
  },
  {
    id: 'boss',
    title: 'Boss Battle',
    subtitle: 'Batalha Épica Contra o Chefe',
    description: 'Supere o guardião supremo resolvendo desafios matemáticos com limites críticos de tempo.',
    icon: Swords,
    iconColor: '#ec4899',
    glowColor: 'rgba(236, 72, 153, 0.45)',
    borderGradient: 'from-pink-500 to-rose-600',
    xpValue: 1000,
    buttonLabel: 'Desafiar Chefe',
    metaInfo: 'Chain compaon toarn to Boss Battle',
  },
];

export interface CyberGlassCarouselProps {
  items?: CarouselCardItem[];
  onSelectCard?: (item: CarouselCardItem) => void;
  brandTitle?: string;
  userName?: string;
}

export const CyberGlassCarousel: React.FC<CyberGlassCarouselProps> = ({
  items = DEFAULT_ITEMS,
  onSelectCard,
  brandTitle = 'Quantora',
  userName = 'Quartora',
}) => {
  const [activeIndex, setActiveIndex] = useState(1); // Default to middle card (Survival Mode)
  const [count, setCount] = useState(10);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Efeito de Fundo: Canvas com Partículas Cósmicas e Constelações
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Gerar estrelas/nós da constelação
    const particleCount = 45;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 1.8 + 0.8,
      color: Math.random() > 0.4 ? 'rgba(0, 242, 254, ' : 'rgba(236, 72, 153, ',
      alpha: Math.random() * 0.6 + 0.2,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Atualizar posições e desenhar conexões
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        p1.x += p1.vx;
        p1.y += p1.vy;

        if (p1.x < 0) p1.x = width;
        if (p1.x > width) p1.x = 0;
        if (p1.y < 0) p1.y = height;
        if (p1.y > height) p1.y = 0;

        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p1.color}${p1.alpha})`;
        ctx.fill();

        // Linhas de constelação
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (dist < 130) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(0, 242, 254, ${(1 - dist / 130) * 0.15})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Navegação por teclado (Setas Esquerda / Direita)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
      } else if (e.key === 'ArrowRight') {
        setActiveIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'Enter') {
        if (onSelectCard) onSelectCard(items[activeIndex]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, items, onSelectCard]);

  return (
    <div className="relative w-full min-h-screen bg-[#050811] text-white flex flex-col justify-between overflow-hidden font-sans select-none">
      {/* 1. Fundo Cósmico & Nebulosa Radial */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(circle at 50% 45%, rgba(28, 11, 54, 0.75) 0%, rgba(5, 8, 17, 0.95) 70%),
            radial-gradient(circle at 15% 20%, rgba(8, 40, 59, 0.5) 0%, transparent 50%),
            radial-gradient(circle at 85% 60%, rgba(40, 10, 48, 0.45) 0%, transparent 50%)
          `
        }}
      />

      {/* Canvas com Constelações Vivas */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />

      {/* 2. Top Navigation Bar */}
      <header className="relative z-10 w-full px-8 py-6 flex items-center justify-between">
        {/* Logo Brand */}
        <div className="flex items-center gap-3.5">
          <div className="relative w-10 h-10 rounded-full flex items-center justify-center p-[2px] bg-gradient-to-tr from-cyan-400 via-indigo-500 to-pink-500 shadow-[0_0_20px_rgba(0,242,254,0.5)]">
            <div className="w-full h-full bg-[#070b15] rounded-full flex items-center justify-center">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-pink-400 font-extrabold text-xl tracking-tighter">
                Q
              </span>
            </div>
          </div>
          <span className="text-2xl font-bold tracking-tight text-white drop-shadow-md">
            {brandTitle}
          </span>
        </div>

        {/* Controles da Direita (Notificação & Perfil) */}
        <div className="flex items-center gap-4">
          {/* Botão de Notificação */}
          <button 
            type="button"
            aria-label="Notificações"
            className="relative w-11 h-11 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] backdrop-blur-xl border border-white/[0.12] flex items-center justify-center text-slate-300 hover:text-white transition-all shadow-[0_8px_20px_rgba(0,0,0,0.3)] hover:scale-105 active:scale-95"
          >
            <Bell size={18} />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
          </button>

          {/* Cápsula de Perfil */}
          <button 
            type="button"
            className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/[0.05] hover:bg-white/[0.09] backdrop-blur-xl border border-white/[0.12] transition-all shadow-[0_8px_20px_rgba(0,0,0,0.3)] hover:border-cyan-400/40"
          >
            <div className="w-7 h-7 rounded-full bg-slate-700/80 border border-white/20 flex items-center justify-center text-xs font-bold text-cyan-300">
              👤
            </div>
            <span className="text-xs font-semibold text-slate-200 tracking-wide">
              {userName}
            </span>
            <ChevronDown size={14} className="text-slate-400" />
          </button>
        </div>
      </header>

      {/* 3. Main Deck: Carrossel 3D de Cards Vítreos */}
      <main className="relative z-10 w-full flex-1 flex flex-col items-center justify-center px-4 py-6">
        <div 
          className="relative w-full max-w-5xl flex items-center justify-center gap-6"
          style={{ perspective: '1200px' }}
        >
          {items.map((item, index) => {
            const isActive = index === activeIndex;
            const isLeft = index < activeIndex;
            const isRight = index > activeIndex;
            const Icon = item.icon;

            return (
              <div
                key={item.id}
                onClick={() => setActiveIndex(index)}
                className={`cursor-pointer transition-all duration-500 ease-out transform ${
                  isActive
                    ? 'scale-105 z-30 opacity-100 shadow-[0_20px_50px_rgba(0,0,0,0.7)]'
                    : 'scale-90 z-10 opacity-45 hover:opacity-75 blur-[0.5px] hover:blur-none'
                }`}
                style={{
                  transform: isLeft 
                    ? 'rotateY(16deg) translateZ(-60px)' 
                    : isRight 
                    ? 'rotateY(-16deg) translateZ(-60px)' 
                    : 'translateZ(0px)',
                }}
              >
                {/* Superfície do Card */}
                <div 
                  className={`relative w-[340px] md:w-[380px] rounded-3xl p-8 flex flex-col items-center text-center transition-all ${
                    isActive
                      ? 'bg-[#0b1224]/85 backdrop-blur-2xl border-2 border-cyan-400 shadow-[0_0_45px_rgba(0,242,254,0.3)]'
                      : 'bg-[#0d162a]/60 backdrop-blur-xl border border-white/[0.12]'
                  }`}
                >
                  {/* Specular Top Highlight (Luz do vidro) */}
                  <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

                  {/* Título & Subtítulo */}
                  <h2 className="text-2xl font-bold tracking-tight text-white drop-shadow">
                    {item.title}
                  </h2>
                  <p className="text-xs text-slate-400 font-medium mt-1 mb-8">
                    {item.subtitle}
                  </p>

                  {/* Centro do Card: Ícone Luminescente & Badges */}
                  <div className="relative w-full flex items-center justify-center my-4">
                    {/* Badge Lateral Esquerda XP */}
                    <div className="absolute left-2 flex flex-col items-center">
                      <span className="text-xs font-extrabold text-cyan-400 drop-shadow-[0_0_8px_rgba(0,242,254,0.6)]">
                        XP
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        {item.xpValue}
                      </span>
                    </div>

                    {/* Ícone Central com Chamas / Efeito Holográfico */}
                    <div className="relative flex items-center justify-center">
                      {isActive && (
                        <div className="absolute -top-3 -right-3 text-pink-500 animate-pulse drop-shadow-[0_0_12px_rgba(236,72,153,0.8)]">
                          <Flame size={28} />
                        </div>
                      )}
                      
                      <div 
                        className={`w-28 h-28 rounded-3xl flex items-center justify-center transition-all ${
                          isActive 
                            ? 'bg-cyan-500/10 border-2 border-cyan-400/80 shadow-[0_0_35px_rgba(0,242,254,0.35)]'
                            : 'bg-white/[0.03] border border-white/10'
                        }`}
                      >
                        <Icon 
                          size={64} 
                          color={item.iconColor} 
                          style={{ filter: `drop-shadow(0 0 16px ${item.glowColor})` }}
                        />
                      </div>
                    </div>

                    {/* Badge Lateral Direita XP */}
                    <div className="absolute right-2 flex flex-col items-center">
                      <span className="text-xs font-extrabold text-cyan-400 drop-shadow-[0_0_8px_rgba(0,242,254,0.6)]">
                        XP
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        +{Math.round(item.xpValue * 0.2)}
                      </span>
                    </div>
                  </div>

                  {/* Descrição & Rótulos */}
                  <p className="text-xs text-slate-300/80 font-normal leading-relaxed mt-4 max-w-[260px] line-clamp-2">
                    {item.description}
                  </p>

                  {/* Barra de Progresso / Indicador do Modo (se ativo) */}
                  {isActive && (
                    <div className="w-full mt-6 flex flex-col items-center gap-2">
                      <span className="text-xs font-bold text-cyan-400 tracking-wider flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                        {item.streakLabel || 'Active Deck'}
                      </span>
                      
                      {/* Segmentos de Progresso */}
                      <div className="flex gap-1.5">
                        <div className="w-8 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,242,254,0.8)]" />
                        <div className="w-4 h-1.5 rounded-full bg-slate-700" />
                        <div className="w-4 h-1.5 rounded-full bg-slate-700" />
                      </div>

                      {/* Botão de Ação Primária "Continue" */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectCard) onSelectCard(item);
                        }}
                        className="mt-5 px-8 py-3 rounded-full bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider shadow-[0_0_24px_rgba(0,242,254,0.6)] transition-all hover:scale-105 active:scale-95 cursor-pointer"
                      >
                        {item.buttonLabel || 'Continue'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* 4. Bottom HUD: Controles Inferiores */}
      <footer className="relative z-10 w-full px-8 py-6 flex items-center justify-between">
        {/* Botão Voltar & Timecode Telemetria */}
        <div className="flex items-center gap-6">
          <button 
            type="button"
            aria-label="Voltar"
            className="w-10 h-10 rounded-full bg-white/[0.05] hover:bg-white/[0.1] backdrop-blur-xl border border-white/[0.12] flex items-center justify-center text-slate-300 hover:text-white transition-all shadow-md hover:scale-105 active:scale-95"
          >
            <ArrowLeft size={16} />
          </button>

          {/* Timecode Box */}
          <div className="px-3.5 py-1.5 rounded-xl bg-white/[0.04] backdrop-blur-md border border-white/[0.08] font-mono text-[11px] text-cyan-400 font-bold tracking-widest shadow-inner">
            03:57.772
          </div>
        </div>

        {/* Stepper Numérico & Dropdown Filtro */}
        <div className="flex items-center gap-4">
          {/* Stepper [ - 10 + ] */}
          <div className="flex items-center gap-3 px-3 py-1.5 rounded-2xl bg-white/[0.05] backdrop-blur-xl border border-white/[0.12] text-xs font-semibold text-slate-300 shadow-md">
            <button 
              type="button"
              onClick={() => setCount((prev) => Math.max(1, prev - 1))}
              className="p-1 hover:text-cyan-400 transition-colors"
            >
              <Minus size={12} />
            </button>
            <span className="w-5 text-center font-bold text-white">
              {count}
            </span>
            <button 
              type="button"
              onClick={() => setCount((prev) => prev + 1)}
              className="p-1 hover:text-cyan-400 transition-colors"
            >
              <Plus size={12} />
            </button>
          </div>

          {/* Dropdown Filtro [ Refined ∨ ] */}
          <button 
            type="button"
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/[0.05] hover:bg-white/[0.09] backdrop-blur-xl border border-white/[0.12] text-xs font-semibold text-slate-300 shadow-md transition-all hover:border-cyan-400/40"
          >
            <span>Refined</span>
            <ChevronDown size={14} className="text-slate-400" />
          </button>
        </div>
      </footer>
    </div>
  );
};
