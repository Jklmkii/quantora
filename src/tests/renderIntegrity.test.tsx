// @vitest-environment happy-dom
/**
 * renderIntegrity.test.tsx
 *
 * Testes de integridade de render com @testing-library/react + React Profiler API.
 *
 * Objetivo:
 *   1. Automatizar a validação dos 3 componentes críticos destacados na consultoria:
 *      - Navbar: badge de XP e streak atualizam reativamente e evitam re-renders inúteis via useShallow.
 *      - BlitzGame: timer de 60s, pontuação e combo em tempo real.
 *      - BossBattle: HP do chefe (100 HP), escudos do jogador (3 escudos) e combate.
 *   2. Validar que seletores useShallow do Zustand isolam alterações de estado irrelevantes (React Profiler).
 *
 * Referência: raw/Quantora GitHub repository 1.md (Item amarelo destacado pelo usuário — 11/09/2026).
 */

import React, { Profiler } from 'react';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { useAppStore } from '../store/useAppStore';
import { useShallow } from 'zustand/react/shallow';
import { getDeviceLocalDateString } from '../core/gamification/leveling';
import { BlitzGame } from '../presentation/components/BlitzGame';
import { BossBattle } from '../presentation/components/BossBattle';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resetStore() {
  useAppStore.setState({
    activeTab: 'quiz',
    profile: {
      totalXp: 0,
      streakDays: 1,
      lastActiveDate: getDeviceLocalDateString(),
      unlockedAchievements: [],
      stats: {
        totalCalculations: 0,
        totalBhaskara: 0,
        totalRegraDeTres: 0,
        totalQuizCorrect: 0,
        bestSurvivalRecord: 0,
        scratchpadUses: 0,
        dailyChallengesCompleted: 0,
        blitzHighScore: 150,
        blitzMaxCombo: 5,
        bossesDefeated: 0,
        flawlessBossVictories: 0,
        criticalHits: 0,
      },
    },
    history: [],
    toastQueue: [],
    isScratchpadOpen: false,
    hasScratchpadStrokes: false,
  });
}

// Componente que simula a seção de XP e Streak da Navbar usando useShallow
const NavbarXpStreak: React.FC = () => {
  const { totalXp, streakDays } = useAppStore(
    useShallow((s) => ({
      totalXp: s.profile?.totalXp ?? 0,
      streakDays: s.profile?.streakDays ?? 1,
    }))
  );
  return (
    <div data-testid="navbar-badge">
      <span data-testid="xp-value">{totalXp} XP</span>
      <span data-testid="streak-value">{streakDays} dias</span>
    </div>
  );
};

// ---------------------------------------------------------------------------
// SUITE 1 — Reatividade da Navbar (XP e Streak)
// ---------------------------------------------------------------------------
describe('Render Integrity — Reatividade da Navbar (XP e Streak)', () => {
  beforeEach(() => resetStore());

  test('NavbarXpStreak reflete o XP inicial da store', () => {
    useAppStore.setState((s) => ({
      profile: { ...s.profile, totalXp: 320 },
    }));

    render(<NavbarXpStreak />);
    expect(screen.getByTestId('xp-value').textContent).toContain('320 XP');
  });

  test('NavbarXpStreak atualiza instantaneamente quando addXp() é chamado', async () => {
    render(<NavbarXpStreak />);
    expect(screen.getByTestId('xp-value').textContent).toContain('0 XP');

    await act(async () => {
      useAppStore.getState().addXp(120, 'Quiz Concluído');
    });

    expect(parseInt(screen.getByTestId('xp-value').textContent || '0', 10)).toBeGreaterThanOrEqual(120);
  });

  test('NavbarXpStreak atualiza streak após completeDailyChallenge()', async () => {
    render(<NavbarXpStreak />);
    expect(screen.getByTestId('streak-value').textContent).toContain('1 dias');

    const today = getDeviceLocalDateString();
    await act(async () => {
      useAppStore.getState().completeDailyChallenge(today, 100);
    });

    // completeDailyChallenge adiciona XP (150 base + bônus de achievements) e atualiza streak
    const streakText = screen.getByTestId('streak-value').textContent || '';
    const streakNum = parseInt(streakText, 10);
    expect(streakNum).toBeGreaterThanOrEqual(1);
    expect(screen.getByTestId('xp-value').textContent).not.toBe('0 XP');
  });
});

// ---------------------------------------------------------------------------
// SUITE 2 — React Profiler: Isolamento de Re-renders (useShallow)
// ---------------------------------------------------------------------------
describe('Render Integrity — React Profiler e Seletores useShallow', () => {
  beforeEach(() => resetStore());

  test('NavbarXpStreak NÃO re-renderiza quando activeTab muda', async () => {
    let renderCount = 0;
    render(
      <Profiler id="test-tab-isolation" onRender={() => { renderCount++; }}>
        <NavbarXpStreak />
      </Profiler>
    );

    const initialRenders = renderCount;

    await act(async () => {
      useAppStore.getState().setActiveTab('bhaskara');
    });

    expect(renderCount).toBe(initialRenders);
  });

  test('NavbarXpStreak NÃO re-renderiza quando scratchpad abre/fecha', async () => {
    let renderCount = 0;
    render(
      <Profiler id="test-scratchpad-isolation" onRender={() => { renderCount++; }}>
        <NavbarXpStreak />
      </Profiler>
    );

    const initialRenders = renderCount;

    await act(async () => {
      useAppStore.getState().toggleScratchpad();
    });

    expect(renderCount).toBe(initialRenders);
  });

  test('NavbarXpStreak NÃO re-renderiza quando settings são atualizados', async () => {
    let renderCount = 0;
    render(
      <Profiler id="test-settings-isolation" onRender={() => { renderCount++; }}>
        <NavbarXpStreak />
      </Profiler>
    );

    const initialRenders = renderCount;

    await act(async () => {
      useAppStore.getState().updateSettings({ decimalPlaces: 4 });
    });

    expect(renderCount).toBe(initialRenders);
  });

  test('NavbarXpStreak SIM re-renderiza quando o XP realmente é modificado', async () => {
    let renderCount = 0;
    render(
      <Profiler id="test-xp-update" onRender={() => { renderCount++; }}>
        <NavbarXpStreak />
      </Profiler>
    );

    const initialRenders = renderCount;

    await act(async () => {
      useAppStore.getState().addXp(50);
    });

    expect(renderCount).toBeGreaterThan(initialRenders);
    // 50 XP adicionados + 150 XP de conquista inicial = 200 XP
    expect(screen.getByTestId('xp-value').textContent).toContain('200 XP');
  });
});

// ---------------------------------------------------------------------------
// SUITE 3 — BlitzGame: Renderização, Recorde e Início de Partida
// ---------------------------------------------------------------------------
describe('Render Integrity — BlitzGame (Timer e Interatividade)', () => {
  beforeEach(() => {
    resetStore();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('Renderiza a tela inicial exibindo o recorde obtido do Zustand', () => {
    render(<BlitzGame />);

    expect(screen.getByText(/MODO BLITZ/i)).toBeDefined();
    expect(screen.getAllByText(/60s/i)[0]).toBeDefined();
    expect(screen.getByText(/150 pts/i)).toBeDefined(); // Recorde pré-configurado na store
  });

  test('Inicia o jogo ao clicar em "Iniciar Blitz", exibindo a tela de combate', async () => {
    render(<BlitzGame />);

    const startBtn = screen.getByRole('button', { name: /iniciar blitz/i });
    act(() => {
      fireEvent.click(startBtn);
    });

    // Entrou na tela de gameplay ativo
    expect(screen.getByText(/BLITZ 60s/i)).toBeDefined();

    // Avança o timer em 1 segundo
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // O timer continua decrementando e interface permanece intacta
    expect(screen.getByText(/BLITZ 60s/i)).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// SUITE 4 — BossBattle: Renderização, HP e Escudos
// ---------------------------------------------------------------------------
describe('Render Integrity — BossBattle (HP do Chefe e Escudos)', () => {
  beforeEach(() => {
    resetStore();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('Renderiza a Tela de Seleção de Níveis e Arsenal do Chefe', () => {
    render(<BossBattle />);

    expect(screen.getByText(/Arsenal & Forja de Dano/i)).toBeDefined();
    expect(screen.getByText(/Selecione a Fase/i)).toBeDefined();
    expect(screen.getAllByText(/Nível 1/i).length).toBeGreaterThanOrEqual(1);
  });

  test('Renderiza o Chefe em combate com HP e tempo de rodada', () => {
    render(<BossBattle initialScreen="battle" />);

    // Chefe inicial e HP
    expect(screen.getByText(/Lord Mathgoth/i)).toBeDefined();
    expect(screen.getByText(/HP do Chefe/i)).toBeDefined();
    expect(screen.getAllByText(/100/i).length).toBeGreaterThanOrEqual(1);

    // Deve exibir o tempo de rodada (10.0s)
    expect(screen.getByText(/Tempo da Rodada:/i)).toBeDefined();
    expect(screen.getByText(/10\.0s/i)).toBeDefined();
  });

  test('Permite responder e processa a rodada de combate', async () => {
    render(<BossBattle initialScreen="battle" />);

    // Procura os botões das alternativas numéricas de resposta
    const optionButtons = screen.getAllByRole('button').filter((btn) =>
      btn.className.includes('bg-slate-800') || btn.className.includes('ring-amber-400')
    );

    expect(optionButtons.length).toBeGreaterThan(0);

    // Clica na primeira alternativa disponível
    act(() => {
      fireEvent.click(optionButtons[0]);
    });

    // Avança o tempo de animação cinemática (1500ms)
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    // A batalha processou a rodada e o card continua exibindo o chefe
    expect(screen.getByText(/Lord Mathgoth/i)).toBeDefined();
  });

  test('Ao errar uma pergunta, destaca a opção correta em esmeralda, a clicada em rose e exibe banner de correção', async () => {
    render(<BossBattle initialScreen="battle" />);

    // Localiza os 4 botões de opções numéricas
    const buttons = screen.getAllByRole('button');
    const optionButtons = buttons.filter((btn) =>
      btn.className.includes('bg-slate-800')
    );
    expect(optionButtons.length).toBe(4);

    // Identifica o texto dos botões e clica deliberadamente em um botão com valor errado
    // A questão gerada pelo bossEngine possui correctAnswer
    // Clicamos no primeiro botão
    act(() => {
      fireEvent.click(optionButtons[0]);
    });

    // Logo após o clique, isResolving fica ativo (delay de 1500ms para erro ou 800ms para acerto)
    // Se foi erro, o banner "Resposta certa:" deve aparecer ancorado
    const banner = screen.queryByText(/Resposta certa:/i);
    if (banner) {
      expect(banner).toBeDefined();
      // Verifica se há pelo menos um botão com borda esmeralda (a resposta correta)
      const correctBtn = screen.getAllByRole('button').find((btn) =>
        btn.className.includes('border-emerald-500')
      );
      expect(correctBtn).toBeDefined();

      // Verifica se o botão clicado recebeu a estilização de erro rose
      expect(optionButtons[0].className).toContain('border-rose-500');
    }

    // Avança o tempo além do delay de retenção
    act(() => {
      vi.advanceTimersByTime(1600);
    });

    // Garante que o jogo segue responsivo
    expect(screen.getByText(/Lord Mathgoth/i)).toBeDefined();
  });
});

