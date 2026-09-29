import React from 'react';
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

export interface HUDCard {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  renderIcon: (isActive: boolean) => React.ReactNode;
  neonColor: 'cyan' | 'purple' | 'amber' | 'emerald' | 'indigo';
  badge?: string;
  statsLabel: string;
  statsValue: string;
  isLocked?: boolean;
  unlockRequirement?: string;
}

// 10 Cards Padrão do Quantora com Ícones 3D em Glassmorphism
export const DEFAULT_QUANTORA_CARDS: HUDCard[] = [
  {
    id: 'survival',
    title: 'Sobrevivência',
    subtitle: 'Resolva rápido antes que o tempo esgote. 1 erro = Fim de Jogo!',
    category: 'TREINO MENTAL',
    neonColor: 'cyan',
    badge: 'Destaque',
    statsLabel: 'Recorde de Questões',
    statsValue: '1.250 XP',
    renderIcon: (isActive) => <CosmicSkull3D size={isActive ? 88 : 66} />,
  },
  {
    id: 'blitz',
    title: 'Blitz 60s',
    subtitle: 'Corra contra o cronômetro! Acertos concedem +2s e ativam combos.',
    category: 'VELOCIDADE',
    neonColor: 'amber',
    badge: 'Popular',
    statsLabel: 'Melhor Pontuação',
    statsValue: '850 pts',
    renderIcon: (isActive) => <CosmicLightning3D size={isActive ? 84 : 64} />,
  },
  {
    id: 'boss',
    title: 'Boss Battle',
    subtitle: 'Batalha contra o Guardião Supremo com debuffs e escudos.',
    category: 'DESAFIO ÉPICO',
    neonColor: 'purple',
    badge: 'Chefe',
    statsLabel: 'Nível Concluído: 5',
    statsValue: '120 Moedas',
    renderIcon: (isActive) => <CosmicSwords3D size={isActive ? 84 : 64} />,
  },
  {
    id: 'bhaskara',
    title: 'Bhaskara Didática',
    subtitle: 'Equações quadráticas, discriminante Delta e raízes passo a passo.',
    category: 'ÁLGEBRA',
    neonColor: 'cyan',
    statsLabel: 'Cálculos Realizados',
    statsValue: '42',
    renderIcon: (isActive) => <CosmicBhaskara3D size={isActive ? 84 : 64} />,
  },
  {
    id: 'physics',
    title: 'Física Clássica',
    subtitle: '10 simuladores analíticos: MRU, Queda Livre, Lançamentos e Órbita.',
    category: 'MECÂNICA',
    neonColor: 'indigo',
    badge: '10 Modos',
    statsLabel: 'Módulos Disponíveis',
    statsValue: '10 Módulos',
    renderIcon: (isActive) => <CosmicAtom3D size={isActive ? 84 : 64} />,
  },
  {
    id: 'pitagoras',
    title: 'Teorema de Pitágoras',
    subtitle: 'Hipotenusa, catetos, triângulos pitagóricos e relações métricas.',
    category: 'GEOMETRIA',
    neonColor: 'amber',
    statsLabel: 'Resoluções Geométricas',
    statsValue: '38',
    renderIcon: (isActive) => <CosmicPitagoras3D size={isActive ? 84 : 64} />,
  },
  {
    id: 'regra_de_tres',
    title: 'Regra de Três',
    subtitle: 'Proporções diretas e inversas com passo a passo didático.',
    category: 'PROPORÇÃO',
    neonColor: 'emerald',
    statsLabel: 'Cálculos Resolvidos',
    statsValue: '55',
    renderIcon: (isActive) => <CosmicRegraDeTres3D size={isActive ? 84 : 64} />,
  },
  {
    id: 'daily',
    title: 'Desafio Diário',
    subtitle: 'Problema especial do dia com geração determinística e bônus de streak.',
    category: 'DIÁRIO',
    neonColor: 'amber',
    badge: 'Pendente',
    statsLabel: 'Streak Atual',
    statsValue: '7 Dias',
    renderIcon: (isActive) => <CosmicDaily3D size={isActive ? 84 : 64} />,
  },
  {
    id: 'spaced',
    title: 'Repetição Espaçada',
    subtitle: 'Revisão ativa baseada no sistema Leitner para consolidar aprendizado.',
    category: 'MEMÓRIA',
    neonColor: 'cyan',
    badge: 'Leitner',
    statsLabel: 'Cards para Revisar',
    statsValue: '12 Cards',
    renderIcon: (isActive) => <CosmicSpaced3D size={isActive ? 84 : 64} />,
  },
  {
    id: 'history',
    title: 'Histórico & Backup',
    subtitle: 'Registro local de todos os cálculos com filtros e exportação.',
    category: 'ARQUIVO',
    neonColor: 'indigo',
    statsLabel: 'Total de Registros',
    statsValue: '84 Itens',
    renderIcon: (isActive) => <CosmicHistory3D size={isActive ? 84 : 64} />,
  },
];
