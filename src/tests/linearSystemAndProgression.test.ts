import { describe, it, expect } from 'vitest';
import {
  solveLinearSystem2x2,
  solveProgression,
} from '../core/math/linearSystemAndProgression';

describe('Motor Matemático: Sistemas Lineares 2x2 (Regra de Cramer & big.js)', () => {
  it('deve resolver corretamente um Sistema Possível e Determinado (SPD)', () => {
    // x + y = 5
    // 2x - y = 4
    // Solução esperada: x = 3, y = 2
    const result = solveLinearSystem2x2({ a1: 1, b1: 1, c1: 5, a2: 2, b2: -1, c2: 4 }, 2, ',', 'pt');
    expect(result.classification).toBe('SPD');
    expect(result.detD).toBe(-3);
    expect(result.detDx).toBe(-9);
    expect(result.detDy).toBe(-6);
    expect(result.x).toBe(3);
    expect(result.y).toBe(2);
    expect(result.steps.length).toBeGreaterThan(0);
    expect(result.didacticSteps.length).toBeGreaterThan(0);
  });

  it('deve classificar corretamente um Sistema Impossível (SI) com retas paralelas', () => {
    // x + y = 3
    // x + y = 5
    // D = 0, Dx = -2 (não nulo)
    const result = solveLinearSystem2x2({ a1: 1, b1: 1, c1: 3, a2: 1, b2: 1, c2: 5 }, 2, ',', 'pt');
    expect(result.classification).toBe('SI');
    expect(result.detD).toBe(0);
    expect(result.x).toBeNull();
    expect(result.y).toBeNull();
  });

  it('deve classificar corretamente um Sistema Possível e Indeterminado (SPI) com retas coincidentes', () => {
    // 2x + 4y = 8
    // x + 2y = 4
    // D = 0, Dx = 0, Dy = 0
    const result = solveLinearSystem2x2({ a1: 2, b1: 4, c1: 8, a2: 1, b2: 2, c2: 4 }, 2, ',', 'pt');
    expect(result.classification).toBe('SPI');
    expect(result.detD).toBe(0);
    expect(result.detDx).toBe(0);
    expect(result.detDy).toBe(0);
    expect(result.x).toBeNull();
    expect(result.y).toBeNull();
  });

  it('deve preservar precisão arbitrária com valores decimais (big.js)', () => {
    // 0.2x + 0.3y = 1.3
    // 0.4x - 0.1y = 0.5
    // Solução esperada: x = 2, y = 3
    const result = solveLinearSystem2x2({ a1: '0.2', b1: '0.3', c1: '1.3', a2: '0.4', b2: '-0.1', c2: '0.5' }, 2, '.', 'en');
    expect(result.classification).toBe('SPD');
    expect(result.x).toBe(2);
    expect(result.y).toBe(3);
  });

  it('deve identificar equação degenerada impossível (0x + 0y = c != 0)', () => {
    const result = solveLinearSystem2x2({ a1: 0, b1: 0, c1: 7, a2: 1, b2: 2, c2: 3 }, 2, ',', 'pt');
    expect(result.classification).toBe('SI');
    expect(result.x).toBeNull();
  });
});

describe('Motor Matemático: Progressão Aritmética (PA)', () => {
  it('deve calcular corretamente o termo geral e a soma dos termos', () => {
    // a1 = 2, r = 3, n = 5 -> PA: 2, 5, 8, 11, 14
    // a5 = 14, S5 = (2 + 14) * 5 / 2 = 40
    const result = solveProgression({ mode: 'pa', firstTerm: 2, ratio: 3, n: 5 }, 2, ',', 'pt');
    expect(result.mode).toBe('pa');
    expect(result.firstTerm).toBe(2);
    expect(result.ratio).toBe(3);
    expect(result.n).toBe(5);
    expect(result.nthTerm).toBe(14);
    expect(result.sumN).toBe(40);
    expect(result.termsPreview.slice(0, 5)).toEqual(['2', '5', '8', '11', '14']);
    expect(result.steps.length).toBeGreaterThan(0);
  });

  it('deve lançar erro se n não for um número inteiro positivo', () => {
    expect(() => solveProgression({ mode: 'pa', firstTerm: 1, ratio: 2, n: 0 }, 2, ',', 'pt')).toThrow();
    expect(() => solveProgression({ mode: 'pa', firstTerm: 1, ratio: 2, n: -3 }, 2, ',', 'pt')).toThrow();
    expect(() => solveProgression({ mode: 'pa', firstTerm: 1, ratio: 2, n: 2.5 }, 2, ',', 'pt')).toThrow();
  });
});

describe('Motor Matemático: Progressão Geométrica (PG)', () => {
  it('deve calcular corretamente termo geral e soma finita com razão q > 1', () => {
    // a1 = 3, q = 2, n = 4 -> PG: 3, 6, 12, 24
    // an = 3 * 2^3 = 24, S4 = 3 * (16 - 1) / (2 - 1) = 45
    const result = solveProgression({ mode: 'pg', firstTerm: 3, ratio: 2, n: 4 }, 2, ',', 'pt');
    expect(result.mode).toBe('pg');
    expect(result.firstTerm).toBe(3);
    expect(result.ratio).toBe(2);
    expect(result.nthTerm).toBe(24);
    expect(result.sumN).toBe(45);
    expect(result.termsPreview.slice(0, 4)).toEqual(['3', '6', '12', '24']);
    expect(result.infiniteSum).toBeNull();
  });

  it('deve calcular corretamente a soma infinita para razão convergente (|q| < 1)', () => {
    // a1 = 10, q = 0.5 -> S_inf = 10 / (1 - 0.5) = 20
    const result = solveProgression({ mode: 'pg', firstTerm: 10, ratio: 0.5, n: 3 }, 2, ',', 'pt');
    expect(result.infiniteSum).toBe(20);
  });

  it('deve lidar corretamente com q = 1 (soma finita = n * a1)', () => {
    const result = solveProgression({ mode: 'pg', firstTerm: 7, ratio: 1, n: 5 }, 2, ',', 'pt');
    expect(result.nthTerm).toBe(7);
    expect(result.sumN).toBe(35);
  });
});
