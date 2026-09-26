import { describe, it, expect } from 'vitest';
import { calculatePitagoras } from '../core/math/pitagoras';

describe('Teorema de Pitágoras & Trigonometria Fundamental', () => {
  describe('Cálculo da Hipotenusa (c = √(a² + b²))', () => {
    it('calcula o triângulo pitagórico clássico 3-4-5', () => {
      const res = calculatePitagoras({
        target: 'hypotenuse',
        legA: 3,
        legB: 4,
      });

      expect(res.hypotenuse).toBe(5);
      expect(res.legA).toBe(3);
      expect(res.legB).toBe(4);
      expect(res.isExactSquare).toBe(true);

      // Métricas
      expect(res.metrics.area).toBe(6); // (3 * 4) / 2
      expect(res.metrics.perimeter).toBe(12); // 3 + 4 + 5
      expect(res.metrics.heightH).toBe(2.4); // 12 / 5
      expect(res.metrics.projectionM).toBe(1.8); // 9 / 5
      expect(res.metrics.projectionN).toBe(3.2); // 16 / 5
      expect(res.metrics.projectionM + res.metrics.projectionN).toBeCloseTo(5, 5);

      // Trigonometria
      expect(res.trig.sinAlpha).toBeCloseTo(0.6, 5); // 3 / 5
      expect(res.trig.cosAlpha).toBeCloseTo(0.8, 5); // 4 / 5
      expect(res.trig.tanAlpha).toBeCloseTo(0.75, 5); // 3 / 4
      expect(res.trig.alphaDegrees + res.trig.betaDegrees).toBeCloseTo(90, 5);
    });

    it('calcula o triângulo pitagórico 5-12-13', () => {
      const res = calculatePitagoras({
        target: 'hypotenuse',
        legA: '5',
        legB: '12',
      });

      expect(res.hypotenuse).toBe(13);
      expect(res.isExactSquare).toBe(true);
      expect(res.metrics.area).toBe(30);
      expect(res.metrics.perimeter).toBe(30);
    });

    it('calcula o triângulo pitagórico 8-15-17', () => {
      const res = calculatePitagoras({
        target: 'hypotenuse',
        legA: 8,
        legB: 15,
      });

      expect(res.hypotenuse).toBe(17);
      expect(res.isExactSquare).toBe(true);
    });

    it('calcula raízes irracionais aproximadas (ex: catetos 1 e 1 -> √2)', () => {
      const res = calculatePitagoras({
        target: 'hypotenuse',
        legA: 1,
        legB: 1,
      });

      expect(res.hypotenuse).toBeCloseTo(Math.SQRT2, 5);
      expect(res.isExactSquare).toBe(false);
      expect(res.trig.alphaDegrees).toBeCloseTo(45, 2);
      expect(res.trig.betaDegrees).toBeCloseTo(45, 2);
    });
  });

  describe('Cálculo de Catetos (Isolamento)', () => {
    it('calcula o cateto b a partir da hipotenusa 10 e cateto a 6', () => {
      const res = calculatePitagoras({
        target: 'leg_b',
        hypotenuse: 10,
        legA: 6,
      });

      expect(res.legB).toBe(8);
      expect(res.hypotenuse).toBe(10);
      expect(res.legA).toBe(6);
      expect(res.isExactSquare).toBe(true);
    });

    it('calcula o cateto a a partir da hipotenusa 25 e cateto b 24', () => {
      const res = calculatePitagoras({
        target: 'leg_a',
        hypotenuse: 25,
        legB: 24,
      });

      expect(res.legA).toBe(7);
      expect(res.hypotenuse).toBe(25);
      expect(res.legB).toBe(24);
      expect(res.isExactSquare).toBe(true);
    });
  });

  describe('Validações e Tratamento de Erros', () => {
    it('lança erro se cateto for menor ou igual a zero', () => {
      expect(() => {
        calculatePitagoras({
          target: 'hypotenuse',
          legA: 0,
          legB: 4,
        });
      }).toThrowError('estritamente positivos');

      expect(() => {
        calculatePitagoras({
          target: 'hypotenuse',
          legA: -3,
          legB: 4,
        });
      }).toThrowError('estritamente positivos');
    });

    it('lança erro se o cateto for maior ou igual à hipotenusa', () => {
      expect(() => {
        calculatePitagoras({
          target: 'leg_b',
          hypotenuse: 5,
          legA: 5,
        });
      }).toThrowError('estritamente maior que qualquer cateto');

      expect(() => {
        calculatePitagoras({
          target: 'leg_b',
          hypotenuse: 4,
          legA: 5,
        });
      }).toThrowError('estritamente maior que qualquer cateto');
    });

    it('lança erro se campos obrigatórios estiverem ausentes', () => {
      expect(() => {
        calculatePitagoras({
          target: 'hypotenuse',
          legA: 3,
        });
      }).toThrowError('Informe o valor dos dois catetos');
    });
  });

  describe('Identidade Trigonométrica Fundamental', () => {
    it('garante sin²(α) + cos²(α) = 1 em qualquer triângulo', () => {
      const res = calculatePitagoras({
        target: 'hypotenuse',
        legA: 17,
        legB: 23,
      });

      const sin2 = Math.pow(res.trig.sinAlpha, 2);
      const cos2 = Math.pow(res.trig.cosAlpha, 2);
      expect(sin2 + cos2).toBeCloseTo(1, 5);
    });
  });
});
