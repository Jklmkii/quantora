import React from 'react';
import { type BossClassId, BOSS_CLASSES } from '../../core/quiz/bossEngine';
import { getBossClassStyles } from '../../core/quiz/bossClassThemes';

// ============================================================================
// SVG THEMATIC EMBLEMS FOR ALL 10 BOSS CLASSES
// High-contrast, scalable, theme-reactive vector designs
// ============================================================================

interface SvgEmblemProps {
  className?: string;
  isEnraged?: boolean;
}

/** 1. Vampiro Ilusionista (Morcego heráldico, presas de sangue e runas de armadilha) */
export const IllusionistEmblem: React.FC<SvgEmblemProps> = ({ className, isEnraged }) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Emblema do Vampiro Ilusionista"
  >
    <defs>
      <radialGradient id="illGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor={isEnraged ? '#f43f5e' : '#be123c'} stopOpacity="0.8" />
        <stop offset="100%" stopColor="#4c0519" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="illWing" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={isEnraged ? '#fb7185' : '#e11d48'} />
        <stop offset="50%" stopColor="#881337" />
        <stop offset="100%" stopColor="#4c0519" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="46" fill="url(#illGlow)" />
    {/* Asas de Morcego Góticas */}
    <path
      d="M50 34 C42 16, 20 20, 10 32 C16 46, 26 52, 28 64 C34 56, 42 62, 50 78 C58 62, 66 56, 72 64 C74 52, 84 46, 90 32 C80 20, 58 16, 50 34 Z"
      fill="url(#illWing)"
      stroke={isEnraged ? '#fecdd3' : '#f43f5e'}
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    {/* Cabeça do Morcego com orelhas pontiagudas */}
    <polygon points="43,26 50,38 57,26 54,42 46,42" fill="#fff1f2" />
    {/* Olhos Carmesins / Presas */}
    <circle cx="46" cy="35" r="2.2" fill={isEnraged ? '#ff0033' : '#e11d48'} className="animate-pulse" />
    <circle cx="54" cy="35" r="2.2" fill={isEnraged ? '#ff0033' : '#e11d48'} className="animate-pulse" />
    <path d="M47 42 L48 48 L49 42 M51 42 L52 48 L53 42" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
    {/* Runas de Armadilha Ilusória */}
    <circle cx="24" cy="40" r="3" fill="#fda4af" opacity="0.6" className="animate-ping" />
    <circle cx="76" cy="40" r="3" fill="#fda4af" opacity="0.6" className="animate-ping" />
    <path d="M50 14 L52 18 L50 22 L48 18 Z" fill="#f43f5e" />
  </svg>
);

/** 2. Soberano dos Pares (Balança cósmica imperial, anéis de paridade e coroa) */
export const ParityLordEmblem: React.FC<SvgEmblemProps> = ({ className, isEnraged }) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Emblema do Soberano dos Pares"
  >
    <defs>
      <radialGradient id="parityGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor={isEnraged ? '#f59e0b' : '#6366f1'} stopOpacity="0.7" />
        <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="goldBeam" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="50%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#b45309" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="46" fill="url(#parityGlow)" />
    {/* Anéis orbitais de paridade cósmica */}
    <ellipse cx="50" cy="50" rx="42" ry="18" stroke="#818cf8" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.7" />
    <ellipse cx="50" cy="50" rx="42" ry="18" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.5" transform="rotate(60 50 50)" />
    {/* Coluna Central da Balança */}
    <line x1="50" y1="24" x2="50" y2="84" stroke="url(#goldBeam)" strokeWidth="4" strokeLinecap="round" />
    <path d="M38 84 L62 84 L56 78 L44 78 Z" fill="#f59e0b" stroke="#78350f" strokeWidth="1" />
    {/* Haste Horizontal em Equilíbrio Perfeito */}
    <line x1="18" y1="36" x2="82" y2="36" stroke="url(#goldBeam)" strokeWidth="3.5" strokeLinecap="round" />
    <circle cx="50" cy="36" r="4.5" fill="#fef08a" stroke="#d97706" strokeWidth="2" />
    {/* Coroa Superior da Lei */}
    <polygon points="42,22 50,14 58,22 55,26 45,26" fill="#fbbf24" stroke="#b45309" strokeWidth="1.2" />
    {/* Prato Esquerdo (Par II) */}
    <line x1="22" y1="36" x2="14" y2="58" stroke="#fef08a" strokeWidth="1.5" />
    <line x1="22" y1="36" x2="30" y2="58" stroke="#fef08a" strokeWidth="1.5" />
    <path d="M12 58 Q22 66 32 58 Z" fill="#4338ca" stroke="#fbbf24" strokeWidth="2" />
    <circle cx="22" cy="54" r="5" fill="#fef08a" />
    <text x="22" y="57" fontSize="7" fontWeight="bold" textAnchor="middle" fill="#1e1b4b">II</text>
    {/* Prato Direito (Par IV) */}
    <line x1="78" y1="36" x2="70" y2="58" stroke="#fef08a" strokeWidth="1.5" />
    <line x1="78" y1="36" x2="86" y2="58" stroke="#fef08a" strokeWidth="1.5" />
    <path d="M68 58 Q78 66 88 58 Z" fill="#4338ca" stroke="#fbbf24" strokeWidth="2" />
    <circle cx="78" cy="54" r="5" fill="#fef08a" />
    <text x="78" y="57" fontSize="7" fontWeight="bold" textAnchor="middle" fill="#1e1b4b">IV</text>
  </svg>
);

/** 3. Carrasco Veloz (Lâminas de guilhotina e foice cruzadas com raios elétricos) */
export const SpeedExecutionerEmblem: React.FC<SvgEmblemProps> = ({ className, isEnraged }) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Emblema do Carrasco Veloz"
  >
    <defs>
      <radialGradient id="speedGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor={isEnraged ? '#ef4444' : '#eab308'} stopOpacity="0.8" />
        <stop offset="100%" stopColor="#7c2d12" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="bladeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fef9c3" />
        <stop offset="50%" stopColor="#eab308" />
        <stop offset="100%" stopColor="#ea580c" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="46" fill="url(#speedGlow)" />
    {/* Lâmina Curva de Foice Assassina */}
    <path
      d="M20 78 C24 50, 44 26, 78 18 C64 34, 48 54, 46 82 L38 84 Z"
      fill="url(#bladeGrad)"
      stroke={isEnraged ? '#fecaca' : '#fef08a'}
      strokeWidth="2.5"
    />
    {/* Lâmina de Guilhotina Cruzada */}
    <path
      d="M80 78 C76 50, 56 26, 22 18 C36 34, 52 54, 54 82 L62 84 Z"
      fill="url(#bladeGrad)"
      stroke={isEnraged ? '#fecaca' : '#fef08a'}
      strokeWidth="2.5"
    />
    {/* Raio Elétrico Central Hipersônico */}
    <polygon
      points="54,12 36,46 50,46 44,88 64,48 50,48"
      fill="#fef08a"
      stroke="#ca8a04"
      strokeWidth="2"
      className="animate-pulse"
    />
    {/* Faíscas de Velocidade */}
    <line x1="14" y1="46" x2="28" y2="44" stroke="#fde047" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="86" y1="46" x2="72" y2="44" stroke="#fde047" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="20" y1="62" x2="30" y2="60" stroke="#f97316" strokeWidth="2" strokeLinecap="round" />
    <line x1="80" y1="62" x2="70" y2="60" stroke="#f97316" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

/** 4. Colosso de Vidro (Prisma lapidado de diamante com refrações e rachaduras luminescentes) */
export const GlassColossusEmblem: React.FC<SvgEmblemProps> = ({ className, isEnraged }) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Emblema do Colosso de Vidro"
  >
    <defs>
      <radialGradient id="glassGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor={isEnraged ? '#ec4899' : '#06b6d4'} stopOpacity="0.8" />
        <stop offset="100%" stopColor="#083344" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="facetA" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#cffafe" />
        <stop offset="100%" stopColor="#0891b2" />
      </linearGradient>
      <linearGradient id="facetB" x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#67e8f9" />
        <stop offset="100%" stopColor="#0e7490" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="46" fill="url(#glassGlow)" />
    {/* Prisma Poligonal de Diamante */}
    {/* Topo do Diamante */}
    <polygon points="32,24 68,24 84,40 16,40" fill="url(#facetA)" stroke="#e0f2fe" strokeWidth="1.8" />
    {/* Faceta Central Superior */}
    <polygon points="42,24 58,24 50,40" fill="#ecfeff" stroke="#a5f3fc" strokeWidth="1.5" />
    {/* Corpo Inferior do Cristal Lapidado */}
    <polygon points="16,40 50,86 36,40" fill="url(#facetB)" stroke="#67e8f9" strokeWidth="1.5" />
    <polygon points="84,40 50,86 64,40" fill="url(#facetB)" stroke="#67e8f9" strokeWidth="1.5" />
    <polygon points="36,40 50,86 64,40" fill="url(#facetA)" stroke="#e0f2fe" strokeWidth="2" />
    {/* Rachaduras de Fragilidade Cristalina */}
    <path
      d="M50 40 L44 54 L52 62 L48 74"
      stroke={isEnraged ? '#fda4af' : '#ffffff'}
      strokeWidth="2"
      strokeLinecap="round"
      className="animate-pulse"
    />
    {/* Fragmentos Flutuantes Prismáticos */}
    <polygon points="20,22 25,26 22,30 17,26" fill="#a5f3fc" opacity="0.8" />
    <polygon points="80,22 83,27 78,31 75,26" fill="#a5f3fc" opacity="0.8" />
    <polygon points="18,68 22,72 19,76 15,72" fill="#67e8f9" opacity="0.7" />
    <polygon points="82,68 85,73 81,77 78,72" fill="#67e8f9" opacity="0.7" />
  </svg>
);

/** 5. Engenheiro do Núcleo (Reator termonuclear com engrenagens concêntricas e radiação ☢️) */
export const CoreEngineerEmblem: React.FC<SvgEmblemProps> = ({ className, isEnraged }) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Emblema do Engenheiro do Núcleo"
  >
    <defs>
      <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor={isEnraged ? '#ef4444' : '#f97316'} stopOpacity="0.85" />
        <stop offset="100%" stopColor="#431407" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="gearGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fdba74" />
        <stop offset="50%" stopColor="#ea580c" />
        <stop offset="100%" stopColor="#7c2d12" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="46" fill="url(#coreGlow)" />
    {/* Engrenagem Industrial Externa */}
    <path
      d="M50 14 L54 14 L56 22 L62 24 L68 18 L71 21 L69 29 L75 33 L83 29 L85 33 L81 39 L85 45 L93 45 L93 49 L85 51 L85 57 L93 57 L93 61 L85 63 L81 69 L85 75 L83 79 L75 75 L69 79 L71 87 L68 90 L62 84 L56 86 L54 94 L50 94 L46 94 L44 86 L38 84 L32 90 L29 87 L31 79 L25 75 L17 79 L15 75 L19 69 L15 63 L7 61 L7 57 L15 57 L15 51 L7 49 L7 45 L15 45 L19 39 L15 33 L17 29 L25 33 L31 29 L29 21 L32 18 L38 24 L44 22 L46 14 Z"
      fill="url(#gearGrad)"
      stroke="#ffedd5"
      strokeWidth="1.2"
    />
    {/* Câmara do Reator Circular */}
    <circle cx="50" cy="50" r="28" fill="#1c1917" stroke="#f97316" strokeWidth="3" />
    <circle cx="50" cy="50" r="24" fill={isEnraged ? '#7f1d1d' : '#292524'} />
    {/* Símbolo de Radiação Nuclear ☢️ */}
    {/* Centro */}
    <circle cx="50" cy="50" r="5" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" className="animate-pulse" />
    {/* Pás de Radiação */}
    <path d="M50 42 A14 14 0 0 1 60 48 L55 50 A6 6 0 0 0 50 46 Z" fill="#facc15" />
    <path d="M50 42 A14 14 0 0 0 40 48 L45 50 A6 6 0 0 1 50 46 Z" fill="#facc15" />
    <path d="M58 55 A14 14 0 0 1 50 64 L50 58 A6 6 0 0 0 54 54 Z" fill="#facc15" />
    <path d="M42 55 A14 14 0 0 0 50 64 L50 58 A6 6 0 0 1 46 54 Z" fill="#facc15" />
    {/* Barras de Combustível Incandescentes */}
    <line x1="28" y1="50" x2="36" y2="50" stroke="#f97316" strokeWidth="3" strokeLinecap="round" />
    <line x1="64" y1="50" x2="72" y2="50" stroke="#f97316" strokeWidth="3" strokeLinecap="round" />
    <line x1="50" y1="28" x2="50" y2="36" stroke="#f97316" strokeWidth="3" strokeLinecap="round" />
    <line x1="50" y1="64" x2="50" y2="72" stroke="#f97316" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

/** 6. Arquiteto de Operadores (Tesseract cibernético com circuitos e operadores +, -, ×, ÷) */
export const OperatorArchitectEmblem: React.FC<SvgEmblemProps> = ({ className, isEnraged }) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Emblema do Arquiteto de Operadores"
  >
    <defs>
      <radialGradient id="archGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor={isEnraged ? '#10b981' : '#059669'} stopOpacity="0.85" />
        <stop offset="100%" stopColor="#022c22" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="neonCube" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#a7f3d0" />
        <stop offset="50%" stopColor="#34d399" />
        <stop offset="100%" stopColor="#047857" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="46" fill="url(#archGlow)" />
    {/* Malha Digital Geométrica */}
    <polygon points="50,18 78,34 78,66 50,82 22,66 22,34" stroke="#6ee7b7" strokeWidth="2" strokeDasharray="4 2" />
    {/* Cubo Isométrico Central */}
    {/* Face Topo */}
    <polygon points="50,30 68,40 50,50 32,40" fill="#34d399" stroke="#ecfdf5" strokeWidth="1.5" opacity="0.9" />
    {/* Face Esquerda */}
    <polygon points="32,40 50,50 50,70 32,60" fill="#059669" stroke="#6ee7b7" strokeWidth="1.5" opacity="0.9" />
    {/* Face Direita */}
    <polygon points="50,50 68,40 68,60 50,70" fill="#047857" stroke="#6ee7b7" strokeWidth="1.5" opacity="0.9" />
    {/* Operadores Matemáticos Holográficos Flutuantes */}
    {/* Topo: + */}
    <g transform="translate(50, 16)">
      <circle cx="0" cy="0" r="7" fill="#064e3b" stroke="#34d399" strokeWidth="1.5" />
      <text x="0" y="3.5" fontSize="11" fontWeight="900" textAnchor="middle" fill="#a7f3d0">+</text>
    </g>
    {/* Direita: × */}
    <g transform="translate(84, 50)">
      <circle cx="0" cy="0" r="7" fill="#064e3b" stroke="#34d399" strokeWidth="1.5" />
      <text x="0" y="3.5" fontSize="10" fontWeight="900" textAnchor="middle" fill="#a7f3d0">×</text>
    </g>
    {/* Base: ÷ */}
    <g transform="translate(50, 84)">
      <circle cx="0" cy="0" r="7" fill="#064e3b" stroke="#34d399" strokeWidth="1.5" />
      <text x="0" y="3.5" fontSize="10" fontWeight="900" textAnchor="middle" fill="#a7f3d0">÷</text>
    </g>
    {/* Esquerda: − */}
    <g transform="translate(16, 50)">
      <circle cx="0" cy="0" r="7" fill="#064e3b" stroke="#34d399" strokeWidth="1.5" />
      <text x="0" y="3.5" fontSize="12" fontWeight="900" textAnchor="middle" fill="#a7f3d0">−</text>
    </g>
  </svg>
);

/** 7. Hidra Fracionária (Três cabeças serpentinas, escamas abissais e barra de fração) */
export const FractionHydraEmblem: React.FC<SvgEmblemProps> = ({ className, isEnraged }) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Emblema da Hidra Fracionária"
  >
    <defs>
      <radialGradient id="hydraGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor={isEnraged ? '#84cc16' : '#65a30d'} stopOpacity="0.85" />
        <stop offset="100%" stopColor="#14532d" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="scaleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#bef264" />
        <stop offset="50%" stopColor="#4d7c0f" />
        <stop offset="100%" stopColor="#1a2e05" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="46" fill="url(#hydraGlow)" />
    {/* Barra de Divisão Fracionária Abissal */}
    <line x1="16" y1="52" x2="84" y2="52" stroke="#bef264" strokeWidth="4" strokeLinecap="round" />
    {/* Cabeça Central da Hidra (Imponente) */}
    <path
      d="M50 16 C42 24, 40 38, 50 48 C60 38, 58 24, 50 16 Z"
      fill="url(#scaleGrad)"
      stroke="#ecfccb"
      strokeWidth="2"
    />
    <circle cx="46" cy="30" r="2" fill="#facc15" className="animate-pulse" />
    <circle cx="54" cy="30" r="2" fill="#facc15" className="animate-pulse" />
    {/* Chifres / Presas da Cabeça Central */}
    <path d="M43 20 L37 14 L42 23 Z" fill="#bef264" />
    <path d="M57 20 L63 14 L58 23 Z" fill="#bef264" />
    {/* Cabeça Esquerda (Bifurcação 1) */}
    <path
      d="M26 28 C20 34, 22 46, 32 50 C36 42, 34 32, 26 28 Z"
      fill="url(#scaleGrad)"
      stroke="#a3e635"
      strokeWidth="1.8"
    />
    <circle cx="27" cy="38" r="1.8" fill="#facc15" />
    {/* Cabeça Direita (Bifurcação 2) */}
    <path
      d="M74 28 C80 34, 78 46, 68 50 C64 42, 66 32, 74 28 Z"
      fill="url(#scaleGrad)"
      stroke="#a3e635"
      strokeWidth="1.8"
    />
    <circle cx="73" cy="38" r="1.8" fill="#facc15" />
    {/* Tentáculos e Caudas Fracionárias Inferiores */}
    <path d="M50 56 Q35 74 22 84 Q38 82 46 64 Z" fill="#365314" stroke="#a3e635" strokeWidth="1.5" />
    <path d="M50 56 Q65 74 78 84 Q62 82 54 64 Z" fill="#365314" stroke="#a3e635" strokeWidth="1.5" />
    {/* Gotas de Veneno Fracionário */}
    <circle cx="34" cy="58" r="2" fill="#bef264" />
    <circle cx="66" cy="58" r="2" fill="#bef264" />
  </svg>
);

/** 8. Esfinge Algébrica (Máscara Faraônica, Nêmes sagrado e enigma [?]) */
export const CipherSphinxEmblem: React.FC<SvgEmblemProps> = ({ className, isEnraged }) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Emblema da Esfinge Algébrica"
  >
    <defs>
      <radialGradient id="sphinxGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor={isEnraged ? '#f59e0b' : '#3b82f6'} stopOpacity="0.8" />
        <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="nemesGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="50%" stopColor="#eab308" />
        <stop offset="100%" stopColor="#854d0e" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="46" fill="url(#sphinxGlow)" />
    {/* Nêmes Faraônico Listrado (Abas laterais) */}
    <path
      d="M50 18 C30 18, 16 32, 14 62 C22 66, 30 58, 34 50 L50 50 L66 50 C70 58, 78 66, 86 62 C84 32, 70 18, 50 18 Z"
      fill="#1e3a8a"
      stroke="#eab308"
      strokeWidth="2"
    />
    {/* Listras Douradas do Nêmes */}
    <path d="M22 36 L32 44 M18 48 L28 52 M78 36 L68 44 M82 48 L72 52" stroke="#fef08a" strokeWidth="2" />
    {/* Máscara Dourada da Face */}
    <path
      d="M34 38 C34 30, 66 30, 66 38 C66 60, 58 74, 50 78 C42 74, 34 60, 34 38 Z"
      fill="url(#nemesGold)"
      stroke="#713f12"
      strokeWidth="2"
    />
    {/* Olhos de Hórus Estilizados */}
    <path d="M40 46 Q45 42 50 46" stroke="#1e1b4b" strokeWidth="2" fill="none" />
    <path d="M50 46 Q55 42 60 46" stroke="#1e1b4b" strokeWidth="2" fill="none" />
    {/* Barba Cerimonial de Faraó */}
    <polygon points="46,78 54,78 52,90 48,90" fill="#3b82f6" stroke="#eab308" strokeWidth="1.5" />
    {/* Cartucho Sagrado da Incógnita [?] na Fronte */}
    <rect x="42" y="24" width="16" height="15" rx="4" fill="#0f172a" stroke="#fef08a" strokeWidth="1.8" />
    <text x="50" y="35" fontSize="11" fontWeight="bold" textAnchor="middle" fill="#38bdf8" className="animate-pulse">
      ?
    </text>
  </svg>
);

/** 9. Espectro dos Negativos (Crânio fantasmagórico, chamas gélidas e sinais -x) */
export const NegativeWraithEmblem: React.FC<SvgEmblemProps> = ({ className, isEnraged }) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Emblema do Espectro dos Negativos"
  >
    <defs>
      <radialGradient id="wraithGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor={isEnraged ? '#e879f9' : '#a855f7'} stopOpacity="0.85" />
        <stop offset="100%" stopColor="#3b0764" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="smokeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f3e8ff" />
        <stop offset="50%" stopColor="#c084fc" />
        <stop offset="100%" stopColor="#581c87" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="46" fill="url(#wraithGlow)" />
    {/* Manto Espectral e Fumaça Gélida do Zero Absoluto */}
    <path
      d="M50 14 C30 14, 20 28, 22 52 C24 70, 16 80, 24 88 C32 80, 36 86, 50 82 C64 86, 68 80, 76 88 C84 80, 76 70, 78 52 C80 28, 70 14, 50 14 Z"
      fill="url(#smokeGrad)"
      stroke="#e9d5ff"
      strokeWidth="2"
    />
    {/* Crânio Ectoplásmico Sombrio */}
    <path
      d="M36 40 C36 30, 64 30, 64 40 C64 54, 58 60, 58 68 L42 68 C42 60, 36 54, 36 40 Z"
      fill="#1e1b4b"
      stroke="#c084fc"
      strokeWidth="1.5"
    />
    {/* Órbitas Fantasmagóricas */}
    <ellipse cx="43" cy="46" rx="4" ry="5.5" fill="#f43f5e" className="animate-pulse" />
    <ellipse cx="57" cy="46" rx="4" ry="5.5" fill="#f43f5e" className="animate-pulse" />
    {/* Narina e Dentes */}
    <polygon points="49,56 51,56 50,59" fill="#c084fc" />
    <line x1="45" y1="64" x2="55" y2="64" stroke="#c084fc" strokeWidth="2" strokeDasharray="2 2" />
    {/* Glifos do Sinal Negativo Flutuantes (−1, −x, −∞) */}
    <g transform="translate(18, 34)">
      <circle cx="0" cy="0" r="6" fill="#3b0764" stroke="#c084fc" strokeWidth="1.2" />
      <text x="0" y="3.5" fontSize="10" fontWeight="bold" textAnchor="middle" fill="#f5d0fe">−</text>
    </g>
    <g transform="translate(82, 34)">
      <circle cx="0" cy="0" r="6" fill="#3b0764" stroke="#c084fc" strokeWidth="1.2" />
      <text x="0" y="3" fontSize="8" fontWeight="bold" textAnchor="middle" fill="#f5d0fe">−x</text>
    </g>
  </svg>
);

/** 10. Tecelão Cronológico (Astrolábio quântico, pêndulo temporal e ondas do tempo) */
export const TimeWeaverEmblem: React.FC<SvgEmblemProps> = ({ className, isEnraged }) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Emblema do Tecelão Cronológico"
  >
    <defs>
      <radialGradient id="timeGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor={isEnraged ? '#38bdf8' : '#0284c7'} stopOpacity="0.8" />
        <stop offset="100%" stopColor="#0c4a6e" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="chronoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#bae6fd" />
        <stop offset="50%" stopColor="#0284c7" />
        <stop offset="100%" stopColor="#0369a1" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="46" fill="url(#timeGlow)" />
    {/* Mostrador Cósmico Externo do Relógio */}
    <circle cx="50" cy="50" r="38" stroke="url(#chronoGrad)" strokeWidth="3" />
    <circle cx="50" cy="50" r="32" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.8" />
    {/* Marcadores das 12 Horas Rúnicas */}
    <line x1="50" y1="16" x2="50" y2="21" stroke="#f0f9ff" strokeWidth="2.5" />
    <line x1="50" y1="79" x2="50" y2="84" stroke="#f0f9ff" strokeWidth="2.5" />
    <line x1="16" y1="50" x2="21" y2="50" stroke="#f0f9ff" strokeWidth="2.5" />
    <line x1="79" y1="50" x2="84" y2="50" stroke="#f0f9ff" strokeWidth="2.5" />
    {/* Ampulheta de Luz no Núcleo */}
    <polygon points="40,32 60,32 50,50" fill="#0369a1" stroke="#7dd3fc" strokeWidth="1.5" />
    <polygon points="50,50 60,68 40,68" fill="#0284c7" stroke="#7dd3fc" strokeWidth="1.5" />
    <circle cx="50" cy="50" r="3" fill="#f0f9ff" className="animate-ping" />
    {/* Ponteiros Distorcidos do Continuum Espaço-Tempo */}
    <line x1="50" y1="50" x2="68" y2="38" stroke="#f0f9ff" strokeWidth="3" strokeLinecap="round" />
    <line x1="50" y1="50" x2="38" y2="30" stroke="#bae6fd" strokeWidth="2" strokeLinecap="round" />
    {/* Pêndulo Temporal Oscilante */}
    <path d="M50 68 Q52 82 56 86" stroke="#38bdf8" strokeWidth="1.8" />
    <circle cx="56" cy="86" r="3.5" fill="#bae6fd" stroke="#0284c7" strokeWidth="1" />
  </svg>
);

// ============================================================================
// BOSS CLASS THEME HELPER & EMBLEM ROUTER COMPONENT
// ============================================================================

export interface BossClassEmblemProps {
  bossClass: BossClassId;
  isEnraged?: boolean;
  className?: string;
}

export const BossClassEmblem: React.FC<BossClassEmblemProps> = ({
  bossClass,
  isEnraged = false,
  className = 'w-full h-full',
}) => {
  switch (bossClass) {
    case 'illusionist':
      return <IllusionistEmblem className={className} isEnraged={isEnraged} />;
    case 'parity_lord':
      return <ParityLordEmblem className={className} isEnraged={isEnraged} />;
    case 'speed_executioner':
      return <SpeedExecutionerEmblem className={className} isEnraged={isEnraged} />;
    case 'glass_colossus':
      return <GlassColossusEmblem className={className} isEnraged={isEnraged} />;
    case 'core_engineer':
      return <CoreEngineerEmblem className={className} isEnraged={isEnraged} />;
    case 'operator_architect':
      return <OperatorArchitectEmblem className={className} isEnraged={isEnraged} />;
    case 'fraction_hydra':
      return <FractionHydraEmblem className={className} isEnraged={isEnraged} />;
    case 'cipher_sphinx':
      return <CipherSphinxEmblem className={className} isEnraged={isEnraged} />;
    case 'negative_wraith':
      return <NegativeWraithEmblem className={className} isEnraged={isEnraged} />;
    case 'time_weaver':
      return <TimeWeaverEmblem className={className} isEnraged={isEnraged} />;
    default:
      return <IllusionistEmblem className={className} isEnraged={isEnraged} />;
  }
};

// ============================================================================
// MAIN PRESENTATION COMPONENTS
// ============================================================================

export interface BossClassAvatarProps {
  bossClass: BossClassId;
  phase?: 1 | 2 | 3;
  isEnraged?: boolean;
  isRecoiling?: boolean;
  isStaggered?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

/**
 * Visual Avatar of the Boss inside the Arena.
 * Dynamically responds to Boss Class identity, phases, recoils and staggering!
 */
export const BossClassAvatar: React.FC<BossClassAvatarProps> = ({
  bossClass,
  phase = 1,
  isEnraged = false,
  isRecoiling = false,
  isStaggered = false,
  size = 'lg',
  className = '',
}) => {
  const spec = BOSS_CLASSES[bossClass] || BOSS_CLASSES.illusionist;
  const styles = getBossClassStyles(bossClass, phase, isStaggered);

  const sizeClasses = {
    sm: 'w-12 h-12 rounded-xl p-0.5',
    md: 'w-16 h-16 rounded-2xl p-1',
    lg: 'w-20 h-20 sm:w-24 sm:h-24 rounded-3xl p-1',
    xl: 'w-28 h-28 sm:w-32 sm:h-32 rounded-3xl p-1.5',
  }[size];

  return (
    <div
      data-testid={`boss-avatar-${bossClass}`}
      aria-label={`Avatar do Chefe: ${spec.name}`}
      className={`relative flex items-center justify-center transition-all duration-300 select-none ${sizeClasses} ${
        styles.borderClass
      } ${styles.glowShadow} ${
        isRecoiling ? 'scale-90 rotate-6 brightness-125' : 'scale-100'
      } ${className}`}
    >
      {/* Background Frame Layer */}
      <div className={`w-full h-full rounded-[22px] bg-gradient-to-br ${spec.auraGradient} p-1 flex items-center justify-center overflow-hidden relative shadow-inner`}>
        {/* Thematic SVG Crest */}
        <BossClassEmblem
          bossClass={bossClass}
          isEnraged={isEnraged || phase === 3}
          className="w-full h-full transition-transform duration-300 hover:scale-105"
        />
        
        {/* Atmospheric Particle Overlays */}
        {phase === 3 && (
          <div className="absolute inset-0 bg-red-600/20 mix-blend-overlay animate-pulse pointer-events-none" />
        )}
        {isStaggered && (
          <div className="absolute inset-0 bg-cyan-400/25 mix-blend-color-dodge animate-ping pointer-events-none" />
        )}
      </div>

      {/* Class Tag Pill Floating Underneath */}
      <div className="absolute -bottom-2 px-2 py-0.5 rounded-full bg-slate-950/90 border border-slate-700/80 text-[9px] font-black font-mono tracking-wider text-slate-200 shadow-md">
        {spec.name.split(' ')[0]}
      </div>
    </div>
  );
};

/**
 * Mini Icon representation for level select cards and badges
 */
export const BossClassMiniIcon: React.FC<{ bossClass: BossClassId; size?: number; className?: string }> = ({
  bossClass,
  size = 18,
  className = '',
}) => {
  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
      title={BOSS_CLASSES[bossClass]?.name || 'Boss'}
    >
      <BossClassEmblem bossClass={bossClass} isEnraged={false} className="w-full h-full" />
    </span>
  );
};
