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
import { extractBestEquationFromOcrText } from '../core/math/imageOcr';
import { calculateOtsuThreshold } from '../core/math/imagePreprocessor';
import { DEFAULT_MATH_WHITELIST } from '../core/math/ocrService';
import { normalizeEquation, extractMathLine } from '../core/math/equationNormalizer';

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

    it('normalizes variable exponents missing carets like x2 to x^2', () => {
      const input = 'x2 - 5x + 6 = 0';
      const normalized = normalizeOcrText(input);
      expect(normalized).toBe('x^2 - 5x + 6 = 0');
    });

    it('normalizes Pythagorean square sums from handwriting like 17² + 20² = x² or 172 + 202 = x2', () => {
      expect(normalizeOcrText('17² + 20² = x²')).toBe('17^2 + 20^2 = x^2');
      expect(normalizeOcrText('172 + 202 = x2')).toBe('17^2 + 20^2 = x^2');
      expect(normalizeOcrText('x2 = 32 + 42')).toBe('x^2 = 3^2 + 4^2');
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

    it('detects Pythagorean theorem equations including inverted forms', () => {
      expect(detectEquationType('3^2 + 4^2 = x^2')).toBe('pitagoras');
      expect(detectEquationType('17^2 + 20^2 = x^2')).toBe('pitagoras');
      expect(detectEquationType('x^2 = 17^2 + 20^2')).toBe('pitagoras');
      expect(detectEquationType('x^2 + 12^2 = 13^2')).toBe('pitagoras');
      expect(detectEquationType('c^2 = 3^2 + 4^2')).toBe('pitagoras');
    });

    it('extracts best equation line from raw multi-line OCR text ignoring UI chrome', () => {
      const rawOcr = `
        Foto Capturada com Sucesso
        Filtro aplicado para clarear os traços
        17² + 20² = x²
        400 = x²
      `;
      const best = extractBestEquationFromOcrText(rawOcr);
      expect(best).toBe('17² + 20² = x²');
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

    it('solves linear equations with parentheses and distributive property', () => {
      const res = solveLinearEquation('3(x - 4) = 15');
      expect(res.isSolvable).toBe(true);
      expect(res.resultSummary).toBe('x = 9');
      expect(res.steps.some((s) => s.includes('Propriedade Distributiva'))).toBe(true);
    });

    it('solves bilateral linear equations with multiple parentheses', () => {
      const res = solveLinearEquation('2(x + 3) = 4(x - 1)');
      expect(res.isSolvable).toBe(true);
      expect(res.resultSummary).toBe('x = 5');
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

    it('formats roots with custom decimal places and comma separator', () => {
      const res = solveQuadraticEquation('3x^2 - 5x + 1 = 0', { decimals: 4, separator: ',' });
      expect(res.isSolvable).toBe(true);
      // roots of 3x^2 - 5x + 1 = 0: (5 +- sqrt(13)) / 6 approx 1,4343 and 0,2324
      expect(res.resultSummary).toContain(',');
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

  describe('9. Store & Scratchpad-to-Scanner Workflow', () => {
    it('routes canvas image from scratchpad directly to photo_math tab and sets pending image', async () => {
      const { useAppStore } = await import('../store/useAppStore');
      const store = useAppStore.getState();

      store.sendScratchpadToScanner('data:image/png;base64,mockPngData');
      const updated = useAppStore.getState();

      expect(updated.activeTab).toBe('photo_math');
      expect(updated.isScratchpadOpen).toBe(false);
      expect(updated.scratchpadPendingImage).toBe('data:image/png;base64,mockPngData');

      // Cleanup
      updated.setScratchpadPendingImage(null);
      expect(useAppStore.getState().scratchpadPendingImage).toBeNull();
    });

    it('manages floating scratchpadContext state accurately', async () => {
      const { useAppStore } = await import('../store/useAppStore');
      const store = useAppStore.getState();

      store.setScratchpadContext({
        title: 'Foto Scanner',
        expression: '3x + 12 = 36',
      });

      const updated = useAppStore.getState();
      expect(updated.scratchpadContext).toEqual({
        title: 'Foto Scanner',
        expression: '3x + 12 = 36',
      });

      // Cleanup
      updated.setScratchpadContext(null);
      expect(useAppStore.getState().scratchpadContext).toBeNull();
    });
  });

  describe('10. imagePreprocessor — Otsu Adaptive Thresholding', () => {
    it('calculates optimal Otsu threshold for bimodal pixel distributions', () => {
      // Simula uma distribuição bimodal (fundo claro ~200, texto escuro ~30)
      const data = new Uint8ClampedArray(100 * 4);
      for (let i = 0; i < 50; i++) {
        data[i * 4] = 30; // Texto escuro
      }
      for (let i = 50; i < 100; i++) {
        data[i * 4] = 220; // Fundo claro
      }
      const threshold = calculateOtsuThreshold(data);
      expect(threshold).toBeGreaterThanOrEqual(30);
      expect(threshold).toBeLessThan(220);
    });
  });

  describe('11. ocrService — Math Configuration & Whitelist', () => {
    it('contains all required digits, operators, exponents and math variables in whitelist', () => {
      expect(DEFAULT_MATH_WHITELIST).toContain('0123456789');
      expect(DEFAULT_MATH_WHITELIST).toContain('+-*/=()^.,');
      expect(DEFAULT_MATH_WHITELIST).toContain('xyzabc');
      expect(DEFAULT_MATH_WHITELIST).toContain('√');
      expect(DEFAULT_MATH_WHITELIST).toContain('²');
      expect(DEFAULT_MATH_WHITELIST).toContain('³');
    });
  });

  describe('12. equationNormalizer — Pure Error Correction & Formatting', () => {
    it('swaps letter O for 0 in equation and numeric contexts', () => {
      expect(normalizeEquation('x^2 - 4 = O')).toBe('x^2 - 4 = 0');
      expect(normalizeEquation('2O + 5 = 25')).toBe('20 + 5 = 25');
      expect(normalizeEquation('O = 3x - 9')).toBe('0 = 3x - 9');
    });

    it('converts unicode dashes and minus signs into standard minus', () => {
      expect(normalizeEquation('5x − 10 = 0')).toBe('5x - 10 = 0'); // unicode minus \u2212
      expect(normalizeEquation('5x — 10 = 0')).toBe('5x - 10 = 0'); // em-dash
    });

    it('converts patterns like x2 or c2 or a2 into powers x^2, c^2, a^2', () => {
      expect(normalizeEquation('x2 - 5x + 6 = 0')).toBe('x^2 - 5x + 6 = 0');
      expect(normalizeEquation('a2 + b2 = c2')).toBe('a^2 + b^2 = c^2');
      expect(normalizeEquation('172 + 202 = x2')).toBe('17^2 + 20^2 = x^2');
      expect(normalizeEquation('x2 = 172 + 202')).toBe('x^2 = 17^2 + 20^2');
    });

    it('extracts single math line from multi-line OCR ignoring UI chrome', () => {
      const sample = `
        Foto Capturada com Sucesso
        Filtro aplicado para clarear os traços da escrita.
        Original Alto Contraste Binarizado
        17² + 20² = x²
        400 = x²
      `;
      expect(extractMathLine(sample)).toBe('17² + 20² = x²');
      expect(normalizeEquation(sample)).toBe('17^2 + 20^2 = x^2');
    });
  });

  describe('13. UI Integration & 4 Master Mathematical Classifications', () => {
    it('classifies and solves: 1. Aritmética', () => {
      const res = scanAndSolveEquation('15 * 4 - (8 + 12) / 2');
      expect(res.type).toBe('arithmetic');
      expect(res.isSolvable).toBe(true);
      expect(res.resultSummary).toContain('50');
    });

    it('classifies and solves: 2. Álgebra Linear (1º Grau)', () => {
      const res = scanAndSolveEquation('3x + 12 = 36');
      expect(res.type).toBe('linear');
      expect(res.isSolvable).toBe(true);
      expect(res.resultSummary).toBe('x = 8');
    });

    it('classifies and solves: 3. Equação do 2º Grau (Bhaskara)', () => {
      const res = scanAndSolveEquation('x² - 5x + 6 = 0');
      expect(res.type).toBe('bhaskara');
      expect(res.isSolvable).toBe(true);
      expect(res.resultSummary).toContain('x₁ = 3');
      expect(res.resultSummary).toContain('x₂ = 2');
    });

    it('classifies and solves: 4. Geometria (Teorema de Pitágoras)', () => {
      const resHyp = scanAndSolveEquation('17^2 + 20^2 = x^2');
      expect(resHyp.type).toBe('pitagoras');
      expect(resHyp.isSolvable).toBe(true);
      expect(resHyp.resultSummary).toContain('Hipotenusa c =');

      const resInverted = scanAndSolveEquation('x^2 = 3^2 + 4^2');
      expect(resInverted.type).toBe('pitagoras');
      expect(resInverted.isSolvable).toBe(true);
      expect(resInverted.resultSummary).toBe('Hipotenusa c = 5');
    });

    it('classifies and solves: 5. Cálculo Diferencial e Integral (∫ x³ dx e derivadas)', () => {
      expect(normalizeEquation('∫ 3dx')).toBe('∫ x^3 dx');
      expect(normalizeEquation('∫ v3dx =')).toBe('∫ x^3 dx');

      const resInt = scanAndSolveEquation('∫ x³ dx');
      expect(resInt.type).toBe('calculus');
      expect(resInt.isSolvable).toBe(true);
      expect(resInt.resultSummary).toBe('x^4/4 + C');
      expect(resInt.steps.length).toBe(4);

      const resPolyInt = scanAndSolveEquation('∫ (3x^2 + 2x - 5) dx');
      expect(resPolyInt.type).toBe('calculus');
      expect(resPolyInt.isSolvable).toBe(true);
      expect(resPolyInt.resultSummary).toBe('x^3 + x^2 - 5x + C');

      const resDeriv = scanAndSolveEquation('d/dx (x^3)');
      expect(resDeriv.type).toBe('calculus');
      expect(resDeriv.isSolvable).toBe(true);
      expect(resDeriv.resultSummary).toBe('3x^2');
    });
  });
});
