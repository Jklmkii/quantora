// @vitest-environment happy-dom
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NotificationPopover } from '../presentation/components/NotificationPopover';
import { useAppStore } from '../store/useAppStore';
import { getDeviceLocalDateString } from '../core/gamification/leveling';

describe('NotificationPopover (Central de Notificações Cósmica)', () => {
  const onNavigateToDaily = vi.fn();
  const onNavigateToMistakes = vi.fn();
  const onOpenProfile = vi.fn();
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({
      settings: {
        language: 'pt',
        theme: 'dark',
        decimalPlaces: 2,
        decimalSeparator: ',',
        historyLimit: 50,
        hasCompletedOnboarding: true,
        soundEnabled: false,
        soundVolume: 0.5,
      },
      profile: {
        totalXp: 150,
        streakDays: 5,
        lastActiveDate: getDeviceLocalDateString(),
        unlockedAchievements: [],
        stats: {
          totalCalculations: 5,
          totalBhaskara: 0,
          totalRegraDeTres: 0,
          totalQuizCorrect: 5,
          bestSurvivalRecord: 5,
          scratchpadUses: 0,
          dailyChallengesCompleted: 1,
          blitzHighScore: 0,
          blitzMaxCombo: 0,
          bossesDefeated: 0,
          flawlessBossVictories: 0,
          criticalHits: 0,
        },
      },
      dailyChallenge: {
        lastCompletedDate: null,
        history: [],
      },
      spacedRepetition: {
        cards: {
          'soma:3+4': {
            id: 'soma:3+4',
            track: 'soma',
            operands: [3, 4],
            box: 1,
            consecutiveCorrect: 0,
            lastReviewedAt: Date.now() - 2000,
            lastQuestionCounter: 0,
            nextReviewTimestamp: Date.now() - 1000,
            nextReviewQuestions: 0,
            hasGraduated: false,
            totalMistakes: 1,
            totalReviews: 1,
          },
        },
        globalQuestionsAnswered: 10,
      },
    });
  });

  test('não renderiza conteúdo quando isOpen for false', () => {
    render(
      <NotificationPopover
        isOpen={false}
        onClose={onClose}
        onNavigateToDaily={onNavigateToDaily}
        onNavigateToMistakes={onNavigateToMistakes}
        onOpenProfile={onOpenProfile}
      />
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  test('renderiza cabeçalho, pendências e itens quando isOpen for true', () => {
    render(
      <NotificationPopover
        isOpen={true}
        onClose={onClose}
        onNavigateToDaily={onNavigateToDaily}
        onNavigateToMistakes={onNavigateToMistakes}
        onOpenProfile={onOpenProfile}
      />
    );

    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText('Central de Notificações')).toBeTruthy();
    expect(screen.getByText('Desafio Diário Disponível')).toBeTruthy();
    expect(screen.getByText('Caderno de Erros')).toBeTruthy();
    expect(screen.getByText(/Ofensiva Cósmica/i)).toBeTruthy();
  });

  test('aciona onNavigateToDaily ao clicar em Resolver Agora no desafio diário', () => {
    render(
      <NotificationPopover
        isOpen={true}
        onClose={onClose}
        onNavigateToDaily={onNavigateToDaily}
        onNavigateToMistakes={onNavigateToMistakes}
        onOpenProfile={onOpenProfile}
      />
    );

    const solveBtn = screen.getByText('Resolver Agora');
    fireEvent.click(solveBtn);

    expect(onClose).toHaveBeenCalled();
    expect(onNavigateToDaily).toHaveBeenCalled();
  });

  test('aciona onNavigateToMistakes ao clicar em Revisar Agora no caderno de erros', () => {
    render(
      <NotificationPopover
        isOpen={true}
        onClose={onClose}
        onNavigateToDaily={onNavigateToDaily}
        onNavigateToMistakes={onNavigateToMistakes}
        onOpenProfile={onOpenProfile}
      />
    );

    const reviewBtn = screen.getByText('Revisar Agora');
    fireEvent.click(reviewBtn);

    expect(onClose).toHaveBeenCalled();
    expect(onNavigateToMistakes).toHaveBeenCalled();
  });

  test('exibe desafio concluído quando dailyChallenge já foi finalizado hoje', () => {
    useAppStore.setState({
      dailyChallenge: {
        lastCompletedDate: getDeviceLocalDateString(),
        history: [],
      },
      spacedRepetition: {
        cards: {},
        globalQuestionsAnswered: 10,
      },
    });

    render(
      <NotificationPopover
        isOpen={true}
        onClose={onClose}
        onNavigateToDaily={onNavigateToDaily}
        onNavigateToMistakes={onNavigateToMistakes}
        onOpenProfile={onOpenProfile}
      />
    );

    expect(screen.getByText('Desafio Diário Concluído')).toBeTruthy();
    expect(screen.getByText('Tudo em dia!')).toBeTruthy();
  });

  test('fecha o popover ao pressionar a tecla Escape', () => {
    render(
      <NotificationPopover
        isOpen={true}
        onClose={onClose}
        onNavigateToDaily={onNavigateToDaily}
        onNavigateToMistakes={onNavigateToMistakes}
        onOpenProfile={onOpenProfile}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
