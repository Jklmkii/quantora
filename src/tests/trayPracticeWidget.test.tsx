// @vitest-environment happy-dom
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { TrayPracticeWidget } from '../presentation/components/TrayPracticeWidget';
import { useAppStore } from '../store/useAppStore';

describe('TrayPracticeWidget (Desktop Micro-Practice)', () => {
  beforeEach(() => {
    useAppStore.setState({
      profile: {
        totalXp: 100,
        streakDays: 3,
        lastActiveDate: '2026-09-16',
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
    });

    window.electronAPI = {
      isElectron: true,
      saveFile: vi.fn(),
      openFile: vi.fn(),
      closeTrayWidget: vi.fn(),
      openMainWindow: vi.fn(),
      onTrayNewQuestion: vi.fn(() => () => {}),
    };
  });

  test('renders header, level information, and question', () => {
    render(<TrayPracticeWidget />);
    expect(screen.getByText(/Quantora • Prática/i)).toBeTruthy();
    expect(screen.getByText(/Nível 2 • 100 XP/i)).toBeTruthy();
    expect(screen.getByPlaceholderText(/Resposta.../i)).toBeTruthy();
  });

  test('calls window.electronAPI.closeTrayWidget when clicking close button', () => {
    render(<TrayPracticeWidget />);
    const closeBtn = screen.getByTitle(/Fechar widget/i);
    fireEvent.click(closeBtn);
    expect(window.electronAPI?.closeTrayWidget).toHaveBeenCalledTimes(1);
  });

  test('calls window.electronAPI.openMainWindow when clicking open main button', () => {
    render(<TrayPracticeWidget />);
    const openBtn = screen.getByTitle(/Abrir aplicativo principal/i);
    fireEvent.click(openBtn);
    expect(window.electronAPI?.openMainWindow).toHaveBeenCalledTimes(1);
  });

  test('submitting wrong answer triggers incorrect feedback', async () => {
    render(<TrayPracticeWidget />);
    const input = screen.getByPlaceholderText(/Resposta.../i);
    fireEvent.change(input, { target: { value: '999999' } });
    
    await act(async () => {
      fireEvent.submit(input.closest('form')!);
    });

    expect(screen.getByText(/Incorreto/i)).toBeTruthy();
    expect(screen.getByText(/Mais uma conta/i)).toBeTruthy();
  });
});
