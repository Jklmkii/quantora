import { describe, it, expect } from 'vitest';
import {
  normalizeOcrText,
  detectEquationType,
  solveLinearEquation,
  solveQuadraticEquation,
  solvePitagorasEquation,
  solveProportionEquation,
  solveArithmeticExpression,
  scanAndSolveEquation,
} from '../core/math/equationScanner';

describe('Photo Math Scanner — Engine & Solver Unit Tests', () => {
  describe('1. OCR Text Normalization', () => {
    it('normalizes multiplication and division unicode operators', () => {
      const input = '2 × 5 ÷ 10 = 1';
      const normalized = normalizeOcrText(input);
      expect(normalized).toBe('2 * 5 / 10 = 1');
    });

    it('normalizes unicode superscripts to standard exponents', () => {
      const input = 'x² - 4x + 4 = 0';
      const normalized = normalizeOcrText(input);
      expect(normalized).toBe('x^2 - 4x + 4 = 0');
    });

    it('normalizes unicode minus signs and dashes', () => {
      const input = '5x − 10 = 0'; // unicode minus \u2212
      const normalized = normalizeOcrText(input);
      expect(normalized).toBe('5x - 10 = 0');
    });

    it('cleans uppercase X and OCR letter confusion for zero', () => {
      const input = '2X^2 - 4X = O';
      const normalized = normalizeOcrText(input);
      expect(normalized).toBe('2x^2 - 4x = 0');
    });
  });

  describe('2. Equation Type Detection', () => {
    it('detects quadratic equations with x^2', () => {
      expect(detectEquationType('x^2 - 5x + 6 = 0')).toBe('bhaskara');
      expect(detectEquationType('2x² + 4x - 6 = 0')).toBe('bhaskara');
      expect(detectEquationType('3x^2 = 27')).toBe('bhaskara');
    });

    it('detects linear equations with x and single power', () => {
      expect(detectEquationType('3x + 12 = 36')).toBe('linear');
      expect(detectEquationType('5x - 7 = 2x + 8')).toBe('linear');
      expect(detectEquationType('2x = 10')).toBe('linear');
    });

    it('detects Pythagorean theorem equations', () => {
      expect(detectEquationType('3^2 + 4^2 = x^2')).toBe('pitagoras');
      expect(detectEquationType('x^2 + 12^2 = 13^2')).toBe('pitagoras');
    });

    it('detects proportions and rule of three', () => {
      expect(detectEquationType('4 / 10 = x / 25')).toBe('regra_simples');
      expect(detectEquationType('2/5 = 6/x')).toBe('regra_simples');
    });

    it('detects pure arithmetic expressions', () => {
      expect(detectEquationType('15 * 4 - 10')).toBe('arithmetic');
      expect(detectEquationType('(20 + 30) / 2')).toBe('arithmetic');
    });
  });

  describe('3. Linear Equation Solving (ax + b = cx + d)', () => {
    it('solves simple linear equation with positive integer result', () => {
      const res = solveLinearEquation('3x + 12 = 36');
      expect(res.isSolvable).toBe(true);
      expect(res.resultSummary).toBe('x = 8');
      expect(res.steps.length).toBeGreaterThan(0);
    });

    it('solves bilateral linear equation with variables on both sides', () => {
      const res = solveLinearEquation('5x - 7 = 2x + 8');
      expect(res.isSolvable).toBe(true);
      expect(res.resultSummary).toBe('x = 5');
    });

    it('handles negative results and decimals', () => {
      const res = solveLinearEquation('2x + 10 = 0');
      expect(res.isSolvable).toBe(true);
      expect(res.resultSummary).toBe('x = -5');
    });

    it('identifies infinite solutions identity (0x = 0)', () => {
      const res = solveLinearEquation('2x + 4 = 2x + 4');
      expect(res.isSolvable).toBe(true);
      expect(res.resultSummary).toContain('Infinitas Soluções');
    });

    it('identifies impossible contradiction equations (0x = k)', () => {
      const res = solveLinearEquation('2x + 5 = 2x + 9');
      expect(res.isSolvable).toBe(false);
      expect(res.resultSummary).toContain('Sem Solução');
    });
  });

  describe('4. Quadratic Equation Solving (Bhaskara)', () => {
    it('solves quadratic with two distinct real roots', () => {
      const res = solveQuadraticEquation('x^2 - 5x + 6 = 0');
      expect(res.isSolvable).toBe(true);
      expect(res.resultSummary).toContain('3');
      expect(res.resultSummary).toContain('2');
      expect(res.targetTab).toBe('bhaskara');
      expect(res.targetPayload).toBeDefined();
    });

    it('solves quadratic with non-zero right hand side', () => {
      const res = solveQuadraticEquation('2x^2 + 4x = 6');
      expect(res.isSolvable).toBe(true);
      expect(res.resultSummary).toContain('1');
      expect(res.resultSummary).toContain('-3');
    });

    it('handles double roots (delta = 0)', () => {
      const res = solveQuadraticEquation('x^2 - 4x + 4 = 0');
      expect(res.isSolvable).toBe(true);
      expect(res.resultSummary).toContain('2');
      expect(res.resultSummary).toContain('raiz dupla');
    });

    it('handles complex roots without throwing errors', () => {
      const res = solveQuadraticEquation('x^2 + 4 = 0');
      expect(res.isSolvable).toBe(true);
      expect(res.resultSummary).toContain('Raízes complexas');
      expect(res.resultSummary).toContain('2i');
    });
  });

  describe('5. Pythagorean Theorem Solving', () => {
    it('solves for hypotenuse (3-4-5 triangle)', () => {
      const res = solvePitagorasEquation('3^2 + 4^2 = x^2');
      expect(res.isSolvable).toBe(true);
      expect(res.resultSummary).toContain('5');
      expect(res.targetTab).toBe('pitagoras');
    });

    it('solves for leg A (5-12-13 triangle)', () => {
      const res = solvePitagorasEquation('x^2 + 12^2 = 13^2');
      expect(res.isSolvable).toBe(true);
      expect(res.resultSummary).toContain('5');
    });
  });

  describe('6. Proportion & Rule of Three Solving', () => {
    it('solves direct proportion', () => {
      const res = solveProportionEquation('4 / 10 = x / 25');
      expect(res.isSolvable).toBe(true);
      expect(res.resultSummary).toBe('x = 10');
      expect(res.targetTab).toBe('regra_simples');
    });
  });

  describe('7. Pure Arithmetic Expressions', () => {
    it('evaluates expression respecting operator precedence', () => {
      const res = solveArithmeticExpression('15 * 4 - (8 + 12) / 2');
      expect(res.isSolvable).toBe(true);
      expect(res.resultSummary).toBe('50');
    });

    it('handles implicit multiplication with parentheses', () => {
      // e.g. 15(4 - 2) becomes 15 * (4 - 2)
      let norm = normalizeOcrText('15(4 - 2)');
      let res = solveArithmeticExpression(norm);
      expect(res.isSolvable).toBe(true);
      expect(res.resultSummary).toBe('30');

      // e.g. (3 + 2)5 becomes (3 + 2) * 5
      norm = normalizeOcrText('(3 + 2)5');
      res = solveArithmeticExpression(norm);
      expect(res.isSolvable).toBe(true);
      expect(res.resultSummary).toBe('25');
    });
  });

  describe('8. Master scanAndSolveEquation Controller', () => {
    it('automatically recognizes and solves quadratic equations', () => {
      const res = scanAndSolveEquation('x² - 7x + 10 = 0');
      expect(res.type).toBe('bhaskara');
      expect(res.isSolvable).toBe(true);
      expect(res.resultSummary).toContain('5');
      expect(res.resultSummary).toContain('2');
    });

    it('automatically recognizes and solves linear equations', () => {
      const res = scanAndSolveEquation('4x - 8 = 12');
      expect(res.type).toBe('linear');
      expect(res.isSolvable).toBe(true);
      expect(res.resultSummary).toBe('x = 5');
    });

    it('returns helpful didactic tips for unknown formats', () => {
      const res = scanAndSolveEquation('texto sem equacao matematica');
      expect(res.type).toBe('unknown');
      expect(res.isSolvable).toBe(false);
      expect(res.steps.length).toBeGreaterThan(0);
    });
  });
});
