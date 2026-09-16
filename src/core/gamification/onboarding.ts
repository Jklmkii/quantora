/**
 * Progressive Onboarding & Feature Unlock Engine
 * Regras e critérios de desbloqueio progressivo de recursos
 */

export type FeatureId =
  | 'survival'
  | 'blitz'
  | 'boss_battle'
  | 'spaced_repetition'
  | 'bhaskara'
  | 'regra_simples'
  | 'physics';

export interface FeatureUnlockDef {
  id: FeatureId;
  reqLevel: number;
  icon: string;
  titlePt: string;
  titleEn: string;
  descPt: string;
  descEn: string;
}

export const FEATURE_DEFINITIONS: Record<FeatureId, FeatureUnlockDef> = {
  survival: {
    id: 'survival',
    reqLevel: 1,
    icon: '💀',
    titlePt: 'Modo Sobrevivência',
    titleEn: 'Survival Mode',
    descPt: 'Ponto de entrada padrão para treino contínuo.',
    descEn: 'Standard entry point for continuous practice.',
  },
  bhaskara: {
    id: 'bhaskara',
    reqLevel: 1,
    icon: '📐',
    titlePt: 'Equação de 2º Grau',
    titleEn: 'Quadratic Equation',
    descPt: 'Resolução didática com Bhaskara e raízes complexas.',
    descEn: 'Step-by-step solving with Bhaskara and complex roots.',
  },
  regra_simples: {
    id: 'regra_simples',
    reqLevel: 1,
    icon: '⚖️',
    titlePt: 'Regra de Três',
    titleEn: 'Rule of Three',
    descPt: 'Proporções diretas e inversas.',
    descEn: 'Direct and inverse proportions.',
  },
  physics: {
    id: 'physics',
    reqLevel: 1,
    icon: '⚛️',
    titlePt: 'Física Clássica',
    titleEn: 'Classical Physics',
    descPt: '10 módulos de mecânica analítica e gráficos interativos.',
    descEn: '10 analytical mechanics modules and interactive graphs.',
  },
  spaced_repetition: {
    id: 'spaced_repetition',
    reqLevel: 1,
    icon: '📖',
    titlePt: 'Caderno de Erros',
    titleEn: 'Error Notebook',
    descPt: 'Repetição espaçada com curva de esquecimento.',
    descEn: 'Spaced repetition with forgetting curve.',
  },
  blitz: {
    id: 'blitz',
    reqLevel: 3,
    icon: '⚡',
    titlePt: 'Modo Blitz (60s)',
    titleEn: 'Blitz Mode (60s)',
    descPt: 'Agilidade mental contra o relógio (+2s acerto / -3s erro).',
    descEn: 'Mental speed against the clock (+2s hit / -3s miss).',
  },
  boss_battle: {
    id: 'boss_battle',
    reqLevel: 5,
    icon: '⚔️',
    titlePt: 'Batalha de Chefe',
    titleEn: 'Boss Battle',
    descPt: '10 chefes épicos com poderes e forja de runas.',
    descEn: '10 epic bosses with abilities and rune forging.',
  },
};

export const ALL_FEATURE_IDS: FeatureId[] = [
  'survival',
  'bhaskara',
  'regra_simples',
  'physics',
  'spaced_repetition',
  'blitz',
  'boss_battle',
];

export function isFeatureUnlocked(
  feature: FeatureId,
  userLevel: number,
  blitzHighScore: number = 0,
  unlockedFeatures: string[] = ['survival'],
  unlockAll: boolean = false
): boolean {
  if (unlockAll) return true;
  if (unlockedFeatures.includes(feature)) return true;

  switch (feature) {
    case 'survival':
    case 'bhaskara':
    case 'regra_simples':
    case 'physics':
    case 'spaced_repetition':
      return true;
    case 'blitz':
      return userLevel >= 3;
    case 'boss_battle':
      // Nível 5 de XP ou vencer 1 sessão de Blitz (pontuação > 0)
      return userLevel >= 5 || blitzHighScore > 0;
    default:
      return true;
  }
}

/**
 * Detecta novos desbloqueios baseados no nível e pontuação do Blitz
 */
export function checkNewFeatureUnlocks(params: {
  userLevel: number;
  blitzHighScore?: number;
  currentUnlocked: string[];
  unlockAll?: boolean;
}): FeatureUnlockDef[] {
  if (params.unlockAll) return [];

  const newlyUnlocked: FeatureUnlockDef[] = [];
  const currentSet = new Set(params.currentUnlocked);

  for (const featId of ['blitz', 'boss_battle'] as FeatureId[]) {
    if (!currentSet.has(featId)) {
      if (
        isFeatureUnlocked(
          featId,
          params.userLevel,
          params.blitzHighScore || 0,
          params.currentUnlocked,
          false
        )
      ) {
        newlyUnlocked.push(FEATURE_DEFINITIONS[featId]);
      }
    }
  }

  return newlyUnlocked;
}

