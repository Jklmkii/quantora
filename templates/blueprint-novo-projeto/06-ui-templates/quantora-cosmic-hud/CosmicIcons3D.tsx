import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

/**
 * 1. CosmicSkull3D — Modo Sobrevivência (Survival)
 * Crânio de cristal facetado com labaredas cósmicas em plasma ciano e magenta.
 */
export const CosmicSkull3D: React.FC<IconProps> = ({ className = '', size = 80 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`drop-shadow-[0_0_24px_rgba(6,182,212,0.45)] transition-transform duration-500 ${className}`}
    aria-hidden="true"
  >
    <defs>
      {/* Gradientes do Crânio de Cristal */}
      <linearGradient id="skullGlass" x1="20" y1="10" x2="80" y2="90" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.85" />
        <stop offset="45%" stopColor="#0891b2" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#0e7490" stopOpacity="0.75" />
      </linearGradient>
      <linearGradient id="skullFacetLeft" x1="25" y1="20" x2="50" y2="60" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#a5f3fc" stopOpacity="0.7" />
        <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.15" />
      </linearGradient>
      <linearGradient id="skullFacetRight" x1="75" y1="20" x2="50" y2="60" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#0891b2" stopOpacity="0.3" />
        <stop offset="100%" stopColor="#164e63" stopOpacity="0.7" />
      </linearGradient>
      {/* Chamas de Plasma Cósmico Laterais (Ciano & Magenta) */}
      <linearGradient id="plasmaFlameLeft" x1="0" y1="50" x2="35" y2="15" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
        <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.5" />
        <stop offset="100%" stopColor="#d946ef" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="plasmaFlameRight" x1="100" y1="50" x2="65" y2="15" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#d946ef" stopOpacity="0.8" />
        <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.5" />
        <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
      </linearGradient>
      {/* Brilho das Órbitas */}
      <radialGradient id="eyeGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#e0f2fe" stopOpacity="1" />
        <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
      </radialGradient>
      {/* Glow Filter */}
      <filter id="cosmicGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    {/* Labaredas de Plasma Cósmico (Fundo Flamejante) */}
    <path
      d="M12 55 C6 40 10 25 24 18 C18 28 22 36 28 42 C20 48 14 50 12 55 Z"
      fill="url(#plasmaFlameLeft)"
      filter="url(#cosmicGlow)"
    />
    <path
      d="M88 55 C94 40 90 25 76 18 C82 28 78 36 72 42 C80 48 86 50 88 55 Z"
      fill="url(#plasmaFlameRight)"
      filter="url(#cosmicGlow)"
    />

    {/* Estrutura Principal do Crânio (Facetas de Vidro 3D) */}
    <path
      d="M50 12 L76 22 L82 46 L74 64 L64 68 L62 82 L38 82 L36 68 L26 64 L18 46 L24 22 Z"
      fill="url(#skullGlass)"
      stroke="rgba(255, 255, 255, 0.45)"
      strokeWidth="1.2"
    />

    {/* Faceta Esquerda de Luz Especular */}
    <path
      d="M50 12 L24 22 L18 46 L34 50 L50 40 Z"
      fill="url(#skullFacetLeft)"
      stroke="rgba(255, 255, 255, 0.55)"
      strokeWidth="0.8"
    />

    {/* Faceta Direita de Sombra Translúcida */}
    <path
      d="M50 12 L76 22 L82 46 L66 50 L50 40 Z"
      fill="url(#skullFacetRight)"
      stroke="rgba(255, 255, 255, 0.25)"
      strokeWidth="0.8"
    />

    {/* Órbitas Oculares Facetadas */}
    <polygon points="32,44 44,46 41,58 30,55" fill="#031b26" stroke="#38bdf8" strokeWidth="1" />
    <circle cx="37" cy="51" r="3" fill="url(#eyeGlow)" filter="url(#cosmicGlow)" />

    <polygon points="68,44 56,46 59,58 70,55" fill="#031b26" stroke="#38bdf8" strokeWidth="1" />
    <circle cx="63" cy="51" r="3" fill="url(#eyeGlow)" filter="url(#cosmicGlow)" />

    {/* Cavidade Nasal Hexagonal */}
    <polygon points="50,56 46,65 54,65" fill="#082f49" stroke="rgba(56, 189, 248, 0.6)" strokeWidth="0.8" />

    {/* Maxilar e Dentes de Cristal Chanfrados */}
    <rect x="40" y="72" width="5" height="7" rx="1" fill="#cffafe" opacity="0.85" />
    <rect x="47.5" y="72" width="5" height="7" rx="1" fill="#e0f2fe" opacity="0.9" />
    <rect x="55" y="72" width="5" height="7" rx="1" fill="#cffafe" opacity="0.85" />

    {/* Linha de reflexo especular na testa */}
    <path d="M36 22 L50 16 L64 22" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.75" />
  </svg>
);

/**
 * 2. CosmicLightning3D — Modo 60s Blitz
 * Tríade de raios energéticos de cristal chanfrado com neon elétrico ciano.
 */
export const CosmicLightning3D: React.FC<IconProps> = ({ className = '', size = 80 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`drop-shadow-[0_0_24px_rgba(56,189,248,0.5)] transition-transform duration-500 ${className}`}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="lightningGlass" x1="30" y1="10" x2="70" y2="90" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.95" />
        <stop offset="35%" stopColor="#38bdf8" stopOpacity="0.8" />
        <stop offset="70%" stopColor="#0284c7" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#0369a1" stopOpacity="0.85" />
      </linearGradient>
      <linearGradient id="lightningSide" x1="15" y1="25" x2="85" y2="75" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#0891b2" stopOpacity="0.1" />
      </linearGradient>
      <radialGradient id="electricSpark" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="60%" stopColor="#38bdf8" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
      </radialGradient>
    </defs>

    {/* Raios Secundários Menores (Asas Elétricas) */}
    <polygon
      points="24,32 38,32 30,52 42,52 26,76 32,56 22,56"
      fill="url(#lightningSide)"
      stroke="rgba(56, 189, 248, 0.4)"
      strokeWidth="0.8"
    />
    <polygon
      points="76,32 62,32 70,52 58,52 74,76 68,56 78,56"
      fill="url(#lightningSide)"
      stroke="rgba(56, 189, 248, 0.4)"
      strokeWidth="0.8"
    />

    {/* Raio Central 3D Chanfrado Principal */}
    <polygon
      points="54,8 32,46 48,46 36,92 72,44 54,44"
      fill="url(#lightningGlass)"
      stroke="rgba(255, 255, 255, 0.7)"
      strokeWidth="1.2"
    />

    {/* Faceta Interna Chanfrada de Luz */}
    <polygon
      points="54,8 48,46 36,92 52,48"
      fill="rgba(255, 255, 255, 0.25)"
      stroke="rgba(255, 255, 255, 0.4)"
      strokeWidth="0.6"
    />

    {/* Faíscas e Orbs Elétricos */}
    <circle cx="50" cy="46" r="6" fill="url(#electricSpark)" />
    <circle cx="36" cy="92" r="3" fill="#e0f2fe" />
    <line x1="54" y1="8" x2="50" y2="35" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
  </svg>
);

/**
 * 3. CosmicSwords3D — Modo Batalha contra o Chefe (Boss Battle)
 * Espadas cruzadas de cristal translúcido com brilho neon magenta e gema central.
 */
export const CosmicSwords3D: React.FC<IconProps> = ({ className = '', size = 80 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`drop-shadow-[0_0_24px_rgba(217,70,239,0.5)] transition-transform duration-500 ${className}`}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="swordBlade1" x1="15" y1="15" x2="85" y2="85" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fae8ff" stopOpacity="0.95" />
        <stop offset="40%" stopColor="#d946ef" stopOpacity="0.75" />
        <stop offset="100%" stopColor="#701a75" stopOpacity="0.8" />
      </linearGradient>
      <linearGradient id="swordBlade2" x1="85" y1="15" x2="15" y2="85" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fae8ff" stopOpacity="0.95" />
        <stop offset="40%" stopColor="#a855f7" stopOpacity="0.75" />
        <stop offset="100%" stopColor="#4c1d95" stopOpacity="0.8" />
      </linearGradient>
    </defs>

    {/* Espada 1: Noroeste para Sudeste */}
    <g transform="rotate(45 50 50)">
      {/* Lâmina Chanfrada */}
      <polygon
        points="50,12 55,25 54,65 50,70 46,65 45,25"
        fill="url(#swordBlade1)"
        stroke="rgba(255, 255, 255, 0.6)"
        strokeWidth="0.8"
      />
      {/* Fio de corte com reflexo */}
      <line x1="50" y1="12" x2="50" y2="68" stroke="white" strokeWidth="1.2" opacity="0.85" />
      {/* Guarda da Espada */}
      <rect x="36" y="68" width="28" height="4" rx="2" fill="#c084fc" stroke="white" strokeWidth="0.8" />
      {/* Empunhadura e Pomo */}
      <rect x="48" y="72" width="4" height="12" rx="1" fill="#4c1d95" />
      <polygon points="50,85 53,88 50,91 47,88" fill="#f0abfc" stroke="white" strokeWidth="0.8" />
    </g>

    {/* Espada 2: Nordeste para Sudoeste */}
    <g transform="rotate(-45 50 50)">
      {/* Lâmina Chanfrada */}
      <polygon
        points="50,12 55,25 54,65 50,70 46,65 45,25"
        fill="url(#swordBlade2)"
        stroke="rgba(255, 255, 255, 0.6)"
        strokeWidth="0.8"
      />
      {/* Fio de corte com reflexo */}
      <line x1="50" y1="12" x2="50" y2="68" stroke="white" strokeWidth="1.2" opacity="0.85" />
      {/* Guarda da Espada */}
      <rect x="36" y="68" width="28" height="4" rx="2" fill="#d946ef" stroke="white" strokeWidth="0.8" />
      {/* Empunhadura e Pomo */}
      <rect x="48" y="72" width="4" height="12" rx="1" fill="#701a75" />
      <polygon points="50,85 53,88 50,91 47,88" fill="#f0abfc" stroke="white" strokeWidth="0.8" />
    </g>

    {/* Gema Central de Cristal Diamante na Interseção */}
    <polygon
      points="50,42 58,50 50,58 42,50"
      fill="#fae8ff"
      stroke="#d946ef"
      strokeWidth="1.5"
      className="drop-shadow-[0_0_12px_rgba(255,255,255,0.9)]"
    />
  </svg>
);

/**
 * 4. CosmicBhaskara3D — Módulo Bhaskara / Equações
 * Parábola 3D projetada sobre plano cartesiano de cristal com raízes luminosas.
 */
export const CosmicBhaskara3D: React.FC<IconProps> = ({ className = '', size = 80 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`drop-shadow-[0_0_20px_rgba(56,189,248,0.4)] transition-transform duration-500 ${className}`}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="planeGrid" x1="20" y1="30" x2="80" y2="85" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
        <stop offset="100%" stopColor="#0369a1" stopOpacity="0.05" />
      </linearGradient>
      <linearGradient id="parabolaNeon" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#e0f2fe" />
        <stop offset="50%" stopColor="#38bdf8" />
        <stop offset="100%" stopColor="#0284c7" />
      </linearGradient>
    </defs>

    {/* Plano Cartesiano Isométrico Translúcido */}
    <polygon
      points="50,22 84,40 50,68 16,50"
      fill="url(#planeGrid)"
      stroke="rgba(56, 189, 248, 0.4)"
      strokeWidth="0.8"
    />
    <line x1="50" y1="22" x2="50" y2="68" stroke="rgba(56, 189, 248, 0.3)" strokeDasharray="2 2" />
    <line x1="16" y1="50" x2="84" y2="40" stroke="rgba(56, 189, 248, 0.3)" strokeDasharray="2 2" />

    {/* Curva Parabólica 3D Iluminada */}
    <path
      d="M26 28 Q 50 82 74 28"
      stroke="url(#parabolaNeon)"
      strokeWidth="3.5"
      strokeLinecap="round"
      className="drop-shadow-[0_0_8px_#38bdf8]"
    />

    {/* Linha de reflexo especular na parábola */}
    <path d="M30 32 Q 50 78 70 32" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.6" />

    {/* Vértice da Parábola em Cristal */}
    <polygon points="50,71 54,75 50,79 46,75" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="1" />

    {/* Raízes x1 e x2 */}
    <circle cx="34" cy="50" r="3.5" fill="#38bdf8" stroke="white" strokeWidth="1" />
    <circle cx="66" cy="46" r="3.5" fill="#38bdf8" stroke="white" strokeWidth="1" />
  </svg>
);

/**
 * 5. CosmicAtom3D — Módulo Física Clássica
 * Átomo tridimensional com órbitas elípticas de vidro em múltiplos planos e núcleo cósmico.
 */
export const CosmicAtom3D: React.FC<IconProps> = ({ className = '', size = 80 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`drop-shadow-[0_0_22px_rgba(129,140,248,0.45)] transition-transform duration-500 ${className}`}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="nucleusGrad" x1="40" y1="40" x2="60" y2="60" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#e0e7ff" />
        <stop offset="50%" stopColor="#818cf8" />
        <stop offset="100%" stopColor="#4338ca" />
      </linearGradient>
    </defs>

    {/* Órbita 1 (Inclinada 60°) */}
    <ellipse
      cx="50"
      cy="50"
      rx="38"
      ry="14"
      transform="rotate(60 50 50)"
      stroke="rgba(129, 140, 248, 0.6)"
      strokeWidth="1.5"
      fill="rgba(99, 102, 241, 0.05)"
    />
    <circle cx="28" cy="20" r="3" fill="#c7d2fe" stroke="white" strokeWidth="0.8" />

    {/* Órbita 2 (Inclinada -60°) */}
    <ellipse
      cx="50"
      cy="50"
      rx="38"
      ry="14"
      transform="rotate(-60 50 50)"
      stroke="rgba(99, 102, 241, 0.6)"
      strokeWidth="1.5"
      fill="rgba(99, 102, 241, 0.05)"
    />
    <circle cx="72" cy="20" r="3" fill="#c7d2fe" stroke="white" strokeWidth="0.8" />

    {/* Órbita 3 (Horizontal com inclinação) */}
    <ellipse
      cx="50"
      cy="50"
      rx="38"
      ry="14"
      stroke="rgba(165, 180, 252, 0.7)"
      strokeWidth="1.5"
      fill="rgba(165, 180, 252, 0.05)"
    />
    <circle cx="86" cy="50" r="3.5" fill="#ffffff" stroke="#818cf8" strokeWidth="1" />

    {/* Núcleo Estelar Multidimensional */}
    <circle cx="50" cy="50" r="10" fill="url(#nucleusGrad)" stroke="white" strokeWidth="1.2" />
    <circle cx="47" cy="47" r="3" fill="white" opacity="0.8" />
  </svg>
);

/**
 * 6. CosmicPitagoras3D — Módulo Teorema de Pitágoras
 * Triângulo retângulo de cristal tridimensional dourado com projeção de catetos de vidro.
 */
export const CosmicPitagoras3D: React.FC<IconProps> = ({ className = '', size = 80 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`drop-shadow-[0_0_22px_rgba(251,191,36,0.45)] transition-transform duration-500 ${className}`}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="goldGlass" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fef3c7" stopOpacity="0.9" />
        <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.5" />
        <stop offset="100%" stopColor="#b45309" stopOpacity="0.75" />
      </linearGradient>
    </defs>

    {/* Quadrado do Cateto Horizontal (Projeção Isométrica) */}
    <polygon
      points="26,76 26,90 62,90 62,76"
      fill="rgba(245, 158, 11, 0.15)"
      stroke="rgba(251, 191, 36, 0.4)"
      strokeWidth="0.8"
    />

    {/* Quadrado do Cateto Vertical */}
    <polygon
      points="12,24 26,24 26,76 12,76"
      fill="rgba(245, 158, 11, 0.15)"
      stroke="rgba(251, 191, 36, 0.4)"
      strokeWidth="0.8"
    />

    {/* Corpo Principal do Triângulo de Cristal 3D */}
    <polygon
      points="26,24 82,76 26,76"
      fill="url(#goldGlass)"
      stroke="rgba(255, 255, 255, 0.7)"
      strokeWidth="1.5"
    />

    {/* Hipotenusa com Reflexo Especular de Luz */}
    <line x1="26" y1="24" x2="82" y2="76" stroke="white" strokeWidth="2.5" strokeLinecap="round" />

    {/* Ângulo Reto Marcado em Prisma de Vidro */}
    <rect x="26" y="66" width="10" height="10" fill="none" stroke="#fde68a" strokeWidth="1.2" />
    <circle cx="31" cy="71" r="1.5" fill="#fef3c7" />
  </svg>
);

/**
 * 7. CosmicRegraDeTres3D — Módulo Regra de Três
 * Balança proporcional cósmica de cristal esmeralda com pratos em equilíbrio dinâmico.
 */
export const CosmicRegraDeTres3D: React.FC<IconProps> = ({ className = '', size = 80 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`drop-shadow-[0_0_22px_rgba(52,211,153,0.45)] transition-transform duration-500 ${className}`}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="emeraldGlass" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#a7f3d0" stopOpacity="0.9" />
        <stop offset="50%" stopColor="#10b981" stopOpacity="0.5" />
        <stop offset="100%" stopColor="#047857" stopOpacity="0.8" />
      </linearGradient>
    </defs>

    {/* Coluna Central do Prisma de Cristal */}
    <polygon
      points="50,18 53,24 53,78 50,84 47,78 47,24"
      fill="url(#emeraldGlass)"
      stroke="rgba(255, 255, 255, 0.6)"
      strokeWidth="0.8"
    />

    {/* Base Hexagonal da Balança */}
    <polygon
      points="50,80 68,88 50,94 32,88"
      fill="rgba(16, 185, 129, 0.25)"
      stroke="#34d399"
      strokeWidth="1"
    />

    {/* Haste Transversal Dinâmica */}
    <polygon
      points="20,38 80,32 80,36 20,42"
      fill="url(#emeraldGlass)"
      stroke="white"
      strokeWidth="0.8"
    />

    {/* Prato Esquerdo com Poliedro Proporcional */}
    <line x1="22" y1="41" x2="16" y2="60" stroke="#34d399" strokeWidth="1" />
    <line x1="22" y1="41" x2="32" y2="60" stroke="#34d399" strokeWidth="1" />
    <ellipse cx="24" cy="61" rx="10" ry="3" fill="#065f46" stroke="#6ee7b7" strokeWidth="1" />
    <polygon points="24,53 28,57 24,61 20,57" fill="#a7f3d0" />

    {/* Prato Direito com Poliedro Proporcional Maior */}
    <line x1="78" y1="35" x2="70" y2="52" stroke="#34d399" strokeWidth="1" />
    <line x1="78" y1="35" x2="86" y2="52" stroke="#34d399" strokeWidth="1" />
    <ellipse cx="78" cy="53" rx="11" ry="3" fill="#065f46" stroke="#6ee7b7" strokeWidth="1" />
    <polygon points="78,43 83,48 78,53 73,48" fill="#a7f3d0" />

    {/* Gema Central de Equilíbrio */}
    <circle cx="50" cy="39" r="4.5" fill="#ecfdf5" stroke="#34d399" strokeWidth="1.2" />
  </svg>
);

/**
 * 8. CosmicDaily3D — Desafio Diário
 * Astrolábio estelar de cristal com anéis concêntricos e estrela central de 8 pontas.
 */
export const CosmicDaily3D: React.FC<IconProps> = ({ className = '', size = 80 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`drop-shadow-[0_0_22px_rgba(251,146,60,0.45)] transition-transform duration-500 ${className}`}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="amberStar" x1="30" y1="30" x2="70" y2="70" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fff7ed" />
        <stop offset="50%" stopColor="#f97316" />
        <stop offset="100%" stopColor="#c2410c" />
      </linearGradient>
    </defs>

    {/* Anel Externo Celestial */}
    <circle cx="50" cy="50" r="38" stroke="rgba(251, 146, 60, 0.4)" strokeWidth="1.5" strokeDasharray="4 3" />

    {/* Anel Intermediário de Cristal */}
    <circle cx="50" cy="50" r="28" stroke="rgba(254, 215, 170, 0.8)" strokeWidth="1.2" fill="rgba(249, 115, 22, 0.08)" />

    {/* Raios Diagonais de Astrolábio */}
    <line x1="16" y1="50" x2="84" y2="50" stroke="rgba(251, 146, 60, 0.35)" />
    <line x1="50" y1="16" x2="50" y2="84" stroke="rgba(251, 146, 60, 0.35)" />

    {/* Estrela Cósmica de 8 Pontas Central */}
    <polygon
      points="50,22 55,42 75,35 60,50 75,65 55,58 50,78 45,58 25,65 40,50 25,35 45,42"
      fill="url(#amberStar)"
      stroke="white"
      strokeWidth="1"
    />

    {/* Núcleo de Diamante */}
    <circle cx="50" cy="50" r="4.5" fill="#ffffff" />
  </svg>
);

/**
 * 9. CosmicSpaced3D — Repetição Espaçada / Caderno de Erros
 * Cubo holográfico tridimensional de memória (Leitner) com matrizes de retenção mnemônica.
 */
export const CosmicSpaced3D: React.FC<IconProps> = ({ className = '', size = 80 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`drop-shadow-[0_0_22px_rgba(168,85,247,0.45)] transition-transform duration-500 ${className}`}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="cubeTop" x1="50" y1="15" x2="50" y2="45" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#f3e8ff" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#c084fc" stopOpacity="0.5" />
      </linearGradient>
      <linearGradient id="cubeLeft" x1="22" y1="45" x2="50" y2="85" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#a855f7" stopOpacity="0.75" />
        <stop offset="100%" stopColor="#581c87" stopOpacity="0.9" />
      </linearGradient>
      <linearGradient id="cubeRight" x1="78" y1="45" x2="50" y2="85" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#7e22ce" stopOpacity="0.65" />
        <stop offset="100%" stopColor="#3b0764" stopOpacity="0.9" />
      </linearGradient>
    </defs>

    {/* Face Superior do Cubo de Vidro */}
    <polygon
      points="50,16 78,32 50,48 22,32"
      fill="url(#cubeTop)"
      stroke="white"
      strokeWidth="1"
    />

    {/* Face Esquerda */}
    <polygon
      points="22,32 50,48 50,82 22,66"
      fill="url(#cubeLeft)"
      stroke="rgba(255, 255, 255, 0.6)"
      strokeWidth="1"
    />

    {/* Face Direita */}
    <polygon
      points="50,48 78,32 78,66 50,82"
      fill="url(#cubeRight)"
      stroke="rgba(255, 255, 255, 0.4)"
      strokeWidth="1"
    />

    {/* Conexões de Memória Espaçada (Nós Hexagonais e Linhas Neurais) */}
    <circle cx="50" cy="32" r="3.5" fill="#ffffff" />
    <circle cx="36" cy="56" r="3" fill="#e9d5ff" />
    <circle cx="64" cy="56" r="3" fill="#e9d5ff" />
    <line x1="50" y1="32" x2="36" y2="56" stroke="white" strokeWidth="1" strokeDasharray="2 2" />
    <line x1="50" y1="32" x2="64" y2="56" stroke="white" strokeWidth="1" strokeDasharray="2 2" />
  </svg>
);

/**
 * 10. CosmicHistory3D — Histórico de Cálculos
 * Prisma cronológico do tempo com anel orbital de satélite e registros em neon.
 */
export const CosmicHistory3D: React.FC<IconProps> = ({ className = '', size = 80 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`drop-shadow-[0_0_22px_rgba(56,189,248,0.45)] transition-transform duration-500 ${className}`}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="historyPrism" x1="30" y1="20" x2="70" y2="80" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.85" />
        <stop offset="50%" stopColor="#0284c7" stopOpacity="0.45" />
        <stop offset="100%" stopColor="#075985" stopOpacity="0.8" />
      </linearGradient>
    </defs>

    {/* Anel Orbital de Tempo (Perspectiva 3D) */}
    <ellipse
      cx="50"
      cy="52"
      rx="40"
      ry="16"
      stroke="rgba(56, 189, 248, 0.55)"
      strokeWidth="1.5"
      strokeDasharray="4 3"
      transform="rotate(-15 50 52)"
    />
    <circle cx="78" cy="40" r="3.5" fill="#ffffff" stroke="#38bdf8" strokeWidth="1" />

    {/* Prisma Cilindro / Ampulheta Cósmica */}
    <ellipse cx="50" cy="24" rx="22" ry="8" fill="url(#historyPrism)" stroke="white" strokeWidth="1" />
    <path
      d="M28 24 L28 72 C28 78 72 78 72 72 L72 24"
      fill="rgba(14, 116, 144, 0.25)"
      stroke="rgba(255, 255, 255, 0.6)"
      strokeWidth="1"
    />
    <ellipse cx="50" cy="72" rx="22" ry="8" fill="#0369a1" stroke="white" strokeWidth="1" />

    {/* Linhas de Registro Cronológico Luminoso */}
    <line x1="36" y1="38" x2="64" y2="38" stroke="#7dd3fc" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="40" y1="46" x2="60" y2="46" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="38" y1="54" x2="62" y2="54" stroke="#7dd3fc" strokeWidth="1.5" strokeLinecap="round" />

    {/* Ponteiros de Tempo Holográficos */}
    <circle cx="50" cy="46" r="3" fill="#ffffff" />
    <line x1="50" y1="46" x2="56" y2="42" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
