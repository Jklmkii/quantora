import React, { useEffect, useRef } from 'react';

export interface ConfettiCanvasProps {
  active?: boolean;
  durationMs?: number;
  particleCount?: number;
  onComplete?: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  shape: 'rect' | 'circle';
}

const CONFETTI_COLORS = [
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#f97316', // Orange
  '#eab308', // Yellow
];

export const ConfettiCanvas: React.FC<ConfettiCanvasProps> = ({
  active = true,
  durationMs = 2800,
  particleCount = 80,
  onComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active) return;

    // Accessibility: Check for prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      if (onComplete) onComplete();
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Generate confetti particles
    const particles: Particle[] = [];
    const originX = width / 2;
    const originY = height * 0.25;

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.random() * Math.PI * 2);
      const speed = Math.random() * 8 + 4;
      particles.push({
        x: originX + (Math.random() * 120 - 60),
        y: originY + (Math.random() * 60 - 30),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 5, // Upward initial burst
        size: Math.random() * 8 + 6,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 1,
        shape: Math.random() > 0.3 ? 'rect' : 'circle',
      });
    }

    const startTime = performance.now();
    let animationFrameId: number;

    const render = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);

      ctx.clearRect(0, 0, width, height);

      let aliveCount = 0;

      for (const p of particles) {
        // Physics update
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.25; // Gravity
        p.vx *= 0.98; // Air resistance
        p.rotation += p.rotationSpeed;
        p.opacity = Math.max(0, 1 - progress);

        if (p.opacity > 0 && p.y < height + 50) {
          aliveCount++;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.globalAlpha = p.opacity;
          ctx.fillStyle = p.color;

          if (p.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          }

          ctx.restore();
        }
      }

      if (aliveCount > 0 && progress < 1) {
        animationFrameId = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, width, height);
        if (onComplete) onComplete();
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [active, durationMs, particleCount, onComplete]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[100] w-full h-full"
      aria-hidden="true"
    />
  );
};
