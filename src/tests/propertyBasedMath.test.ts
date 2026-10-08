import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { calculateBhaskara } from '../core/math/bhaskara';
import { calculatePitagoras } from '../core/math/pitagoras';
import { calculateRegraDeTresSimples } from '../core/math/regraDeTresSimples';
import { parseBig, formatNumber, formatNumberSmart } from '../core/math/precision';
import type { SimpleGridPosition } from '../types';

describe('Property-Based Testing: Invariantes Algébricas e Geométricas', () => {
  describe('Bhaskara (Equações do 2º Grau)', () => {
    it('Invariante das Raízes Reais: a·x² + b·x + c ≈ 0 para raízes geradas', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -50, max: 50 }).filter((a) => a !== 0),
          fc.integer({ min: -200, max: 200 }),
          fc.integer({ min: -200, max: 200 }),
          (a, r1, r2) => {
            // Construir equação a partir das raízes r1 e r2: a(x - r1)(x - r2) = ax² - a(r1+r2)x + a·r1·r2
            const b = -a * (r1 + r2);
            const c = a * r1 * r2;

            const res = calculateBhaskara(a, b, c);
            expect(res.delta).toBeGreaterThanOrEqual(0);
            expect(res.x1).not.toBeNull();
            expect(res.x2).not.toBeNull();

            // Avaliar polinômio em x1 e x2
            const evalX1 = a * Math.pow(res.x1!, 2) + b * res.x1! + c;
            const evalX2 = a * Math.pow(res.x2!, 2) + b * res.x2! + c;

            expect(Math.abs(evalX1)).toBeLessThan(1e-4);
            expect(Math.abs(evalX2)).toBeLessThan(1e-4);

            // Soma e Produto das raízes (Relações de Girard)
            const sumRoots = res.x1! + res.x2!;
            const expectedSum = -b / a;
            expect(Math.abs(sumRoots - expectedSum)).toBeLessThan(1e-4);

            const prodRoots = res.x1! * res.x2!;
            const expectedProd = c / a;
            expect(Math.abs(prodRoots - expectedProd)).toBeLessThan(1e-4);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Invariante do Vértice: f(xv) = yv para qualquer a ≠ 0, b, c', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -100, max: 100 }).filter((a) => a !== 0),
          fc.integer({ min: -500, max: 500 }),
          fc.integer({ min: -500, max: 500 }),
          (a, b, c) => {
            const res = calculateBhaskara(a, b, c);
            const evalXv = a * Math.pow(res.vertex.x, 2) + b * res.vertex.x + c;

            // f(xv) deve ser exatamente yv
            expect(Math.abs(evalXv - res.vertex.y)).toBeLessThan(1e-4);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Invariante das Raízes Complexas: partes reais iguais e imaginárias conjugadas quando Δ < 0', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 50 }),
          fc.integer({ min: -20, max: 20 }),
          (a, b) => {
            // Escolher c tal que b² - 4ac < 0 (ex: c = b² + 10)
            const c = Math.ceil((b * b + 10) / (4 * a)) + 1;
            const res = calculateBhaskara(a, b, c);

            expect(res.delta).toBeLessThan(0);
            expect(res.rootType).toBe('complex');
            expect(res.complexRoots).toBeDefined();

            const cRoots = res.complexRoots!;
            expect(cRoots.x1.real).toBeCloseTo(-b / (2 * a), 5);
            expect(cRoots.x2.real).toBeCloseTo(-b / (2 * a), 5);
            expect(cRoots.x1.imaginary).toBeCloseTo(-cRoots.x2.imaginary, 5);
            expect(cRoots.x1.imaginary).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Pitágoras (Geometria do Triângulo Retângulo)', () => {
    it('Invariante Fundamental: c² = a² + b² e c > a, c > b para catetos positivos', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0.1, max: 5000, noNaN: true }),
          fc.double({ min: 0.1, max: 5000, noNaN: true }),
          (a, b) => {
            const res = calculatePitagoras({
              target: 'hypotenuse',
              legA: a,
              legB: b,
            });

            // c² ≈ a² + b²
            const hypSq = Math.pow(res.hypotenuse, 2);
            const legsSqSum = Math.pow(a, 2) + Math.pow(b, 2);
            const relativeDiff = Math.abs(hypSq - legsSqSum) / legsSqSum;
            expect(relativeDiff).toBeLessThan(1e-6);

            // c > a e c > b
            expect(res.hypotenuse).toBeGreaterThan(a);
            expect(res.hypotenuse).toBeGreaterThan(b);

            // Desigualdade triangular: a + b > c
            expect(a + b).toBeGreaterThan(res.hypotenuse);

            // Identidade trigonométrica fundamental: sin²(α) + cos²(α) ≈ 1
            const trigSum = Math.pow(res.trig.sinAlpha, 2) + Math.pow(res.trig.cosAlpha, 2);
            expect(trigSum).toBeCloseTo(1, 5);

            // Soma dos ângulos agudos ≈ 90°
            expect(res.trig.alphaDegrees + res.trig.betaDegrees).toBeCloseTo(90, 4);

            // Relação métrica: h · c ≈ a · b
            const areaFormula1 = (a * b) / 2;
            const areaFormula2 = (res.hypotenuse * res.metrics.heightH) / 2;
            expect(areaFormula1).toBeCloseTo(areaFormula2, 4);

            // Projeções: m + n ≈ c
            expect(res.metrics.projectionM + res.metrics.projectionN).toBeCloseTo(res.hypotenuse, 4);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Invariante do Cálculo de Cateto: a² + b² = c² quando isolando cateto', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 2, max: 5000, noNaN: true }),
          fc.double({ min: 0.1, max: 0.9, noNaN: true }),
          (hypotenuse, ratio) => {
            const legA = hypotenuse * ratio;
            const res = calculatePitagoras({
              target: 'leg_b',
              hypotenuse,
              legA,
            });

            const hypSq = Math.pow(hypotenuse, 2);
            const legsSqSum = Math.pow(legA, 2) + Math.pow(res.legB, 2);
            const relativeDiff = Math.abs(hypSq - legsSqSum) / hypSq;
            expect(relativeDiff).toBeLessThan(1e-6);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Regra de Três Simples (Proporcionalidade Direta e Inversa)', () => {
    const positions: SimpleGridPosition[] = ['a1', 'b1', 'a2', 'b2'];

    it('Invariante Direta: A₁ · B₂ = A₂ · B₁ em qualquer posição da incógnita', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...positions),
          fc.integer({ min: 1, max: 500 }),
          fc.integer({ min: 1, max: 500 }),
          fc.integer({ min: 1, max: 500 }),
          (unknownPos, val1, val2, val3) => {
            const rawInputs: Record<SimpleGridPosition, string> = {
              a1: val1.toString(),
              b1: val2.toString(),
              a2: val3.toString(),
              b2: '1',
            };

            const res = calculateRegraDeTresSimples({
              type: 'direct',
              unknownPos,
              a1: rawInputs.a1,
              b1: rawInputs.b1,
              a2: rawInputs.a2,
              b2: rawInputs.b2,
            });

            const solvedValues = {
              ...rawInputs,
              [unknownPos]: res.x,
            };

            const a1 = Number(solvedValues.a1);
            const b1 = Number(solvedValues.b1);
            const a2 = Number(solvedValues.a2);
            const b2 = Number(solvedValues.b2);

            // Cruzado: a1 * b2 = a2 * b1
            expect(a1 * b2).toBeCloseTo(a2 * b1, 4);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Invariante Inversa: A₁ · B₁ = A₂ · B₂ em qualquer posição da incógnita', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...positions),
          fc.integer({ min: 1, max: 500 }),
          fc.integer({ min: 1, max: 500 }),
          fc.integer({ min: 1, max: 500 }),
          (unknownPos, val1, val2, val3) => {
            const rawInputs: Record<SimpleGridPosition, string> = {
              a1: val1.toString(),
              b1: val2.toString(),
              a2: val3.toString(),
              b2: '1',
            };

            const res = calculateRegraDeTresSimples({
              type: 'inverse',
              unknownPos,
              a1: rawInputs.a1,
              b1: rawInputs.b1,
              a2: rawInputs.a2,
              b2: rawInputs.b2,
            });

            const solvedValues = {
              ...rawInputs,
              [unknownPos]: res.x,
            };

            const a1 = Number(solvedValues.a1);
            const b1 = Number(solvedValues.b1);
            const a2 = Number(solvedValues.a2);
            const b2 = Number(solvedValues.b2);

            // Linear: a1 * b1 = a2 * b2
            expect(a1 * b1).toBeCloseTo(a2 * b2, 4);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Precisão & Parsing Arbitrário', () => {
    it('Robustez de Formatação: formatNumber e formatNumberSmart nunca geram NaN', () => {
      fc.assert(
        fc.property(
          fc.double({ min: -1e8, max: 1e8, noNaN: true }),
          fc.integer({ min: 0, max: 8 }),
          fc.constantFrom(',' as const, '.' as const),
          (num, decimals, separator) => {
            const formatted = formatNumber(num, decimals, separator);
            const smartFormatted = formatNumberSmart(num, decimals, separator);

            expect(formatted).not.toContain('NaN');
            expect(smartFormatted).not.toContain('NaN');
            expect(typeof formatted).toBe('string');
            expect(typeof smartFormatted).toBe('string');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Fidelidade de Frações: parseBig("p/q") == p / q com alta precisão', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -1000, max: 1000 }),
          fc.integer({ min: 1, max: 1000 }),
          (num, den) => {
            const fractionStr = `${num} / ${den}`;
            const parsed = parseBig(fractionStr);
            const expected = num / den;

            expect(parsed.toNumber()).toBeCloseTo(expected, 8);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
