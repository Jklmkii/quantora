import React, { useEffect, useRef } from 'react';

interface StarNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseAlpha: number;
  alpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
}

interface CosmicOrb {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: 'cyan' | 'magenta' | 'indigo';
  phase: number;
}

export const CosmicBackgroundCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Adaptação de densidade de estrelas ao tamanho da viewport
    const starCount = Math.floor(Math.min(70, Math.max(35, (width * height) / 22000)));
    const stars: StarNode[] = [];

    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: Math.random() * 1.6 + 0.6,
        baseAlpha: Math.random() * 0.4 + 0.3,
        alpha: 0.5,
        twinkleSpeed: Math.random() * 0.02 + 0.008,
        twinklePhase: Math.random() * Math.PI * 2,
      });
    }

    // Orbs de nebulosa volumétrica suave (ciano, magenta, índigo)
    const orbs: CosmicOrb[] = [
      { x: width * 0.2, y: height * 0.3, vx: 0.12, vy: 0.08, radius: 240, color: 'cyan', phase: 0 },
      { x: width * 0.8, y: height * 0.4, vx: -0.1, vy: 0.11, radius: 280, color: 'magenta', phase: 2 },
      { x: width * 0.5, y: height * 0.8, vx: 0.09, vy: -0.12, radius: 260, color: 'indigo', phase: 4 },
      { x: width * 0.15, y: height * 0.75, vx: 0.08, vy: -0.07, radius: 210, color: 'magenta', phase: 1.5 },
      { x: width * 0.85, y: height * 0.85, vx: -0.11, vy: -0.09, radius: 230, color: 'cyan', phase: 3.2 },
    ];

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const maxConnectionDist = 120;
    let isVisible = !document.hidden;

    const handleVisibility = () => {
      isVisible = !document.hidden;
      if (isVisible) {
        lastTime = performance.now();
        loop();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    let lastTime = performance.now();

    const loop = () => {
      if (!isVisible) return;

      const now = performance.now();
      const dt = Math.min((now - lastTime) / 16.66, 2.5);
      lastTime = now;

      ctx.clearRect(0, 0, width, height);

      // 1. Desenhar Orbs de Nebulosa Cósmica com Gradientes Radiais Suaves
      ctx.save();
      for (let i = 0; i < orbs.length; i++) {
        const orb = orbs[i];
        orb.x += orb.vx * dt;
        orb.y += orb.vy * dt;
        orb.phase += 0.008 * dt;

        // Bouncing suave com padding
        if (orb.x < -100) orb.vx = Math.abs(orb.vx);
        if (orb.x > width + 100) orb.vx = -Math.abs(orb.vx);
        if (orb.y < -100) orb.vy = Math.abs(orb.vy);
        if (orb.y > height + 100) orb.vy = -Math.abs(orb.vy);

        const currentRadius = orb.radius + Math.sin(orb.phase) * 25;
        const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, Math.max(1, currentRadius));

        if (orb.color === 'cyan') {
          grad.addColorStop(0, 'rgba(6, 182, 212, 0.08)');
          grad.addColorStop(0.5, 'rgba(6, 182, 212, 0.03)');
          grad.addColorStop(1, 'rgba(6, 182, 212, 0)');
        } else if (orb.color === 'magenta') {
          grad.addColorStop(0, 'rgba(217, 70, 239, 0.07)');
          grad.addColorStop(0.5, 'rgba(217, 70, 239, 0.025)');
          grad.addColorStop(1, 'rgba(217, 70, 239, 0)');
        } else {
          grad.addColorStop(0, 'rgba(99, 102, 241, 0.06)');
          grad.addColorStop(0.5, 'rgba(99, 102, 241, 0.02)');
          grad.addColorStop(1, 'rgba(99, 102, 241, 0)');
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, Math.max(1, currentRadius), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // 2. Atualizar Posições e Cintilação das Estrelas
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        star.x += star.vx * dt;
        star.y += star.vy * dt;
        star.twinklePhase += star.twinkleSpeed * dt;
        star.alpha = star.baseAlpha + Math.sin(star.twinklePhase) * 0.25;

        // Loop contínuo pelas bordas
        if (star.x < 0) star.x = width;
        else if (star.x > width) star.x = 0;
        if (star.y < 0) star.y = height;
        else if (star.y > height) star.y = 0;
      }

      // 3. Desenhar Conexões de Constelações Dinâmicas por Proximidade
      ctx.save();
      for (let i = 0; i < stars.length; i++) {
        const s1 = stars[i];
        for (let j = i + 1; j < stars.length; j++) {
          const s2 = stars[j];
          const dx = s2.x - s1.x;
          const dy = s2.y - s1.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxConnectionDist) {
            const edgeAlpha = (1 - dist / maxConnectionDist) * 0.18;
            ctx.strokeStyle = `rgba(56, 189, 248, ${edgeAlpha})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(s1.x, s1.y);
            ctx.lineTo(s2.x, s2.y);
            ctx.stroke();
          }
        }
      }
      ctx.restore();

      // 4. Desenhar Nós Estelares com Brilho Cósmico
      ctx.save();
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        const clampedAlpha = Math.max(0.1, Math.min(0.9, star.alpha));

        // Ponto da estrela
        ctx.fillStyle = `rgba(224, 242, 254, ${clampedAlpha})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();

        // Glow sutil para estrelas maiores
        if (star.radius > 1.4) {
          ctx.fillStyle = `rgba(56, 189, 248, ${clampedAlpha * 0.35})`;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.radius * 2.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      animationFrameId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-80 transition-opacity duration-1000"
      aria-hidden="true"
    />
  );
};
