import { describe, it, expect } from 'vitest';
import {
  calculateMRU,
  calculateMRUV,
  calculateQuedaLivre,
  calculateLancamentoVertical,
  calculateLancamentoHorizontal,
  calculateLancamentoObliquo,
  calculateMCU,
  calculateMHS,
  calculatePlanoInclinado,
  calculateEnergiaTrabalho,
  convertKmHToMS,
  convertMSToKmH,
  kmhToMs,
  msToKmh,
  sinDeg,
  cosDeg,
  formatUnit,
  degToRad,
  radToDeg,
} from '../core/physics';

describe('Physics Module - Unit Tests', () => {
  describe('Physics Utilities & Unit Conversion', () => {
    it('converts km/h to m/s accurately', () => {
      expect(Number(kmhToMs(72).toString())).toBe(20);
      expect(convertKmHToMS(108)).toBe('30.00');
      expect(Number(kmhToMs(0).toString())).toBe(0);
      expect(convertKmHToMS('invalid')).toBe('0');
    });

    it('converts m/s to km/h accurately', () => {
      expect(Number(msToKmh(20).toString())).toBe(72);
      expect(convertMSToKmH(30)).toBe('108.00');
      expect(Number(msToKmh(0).toString())).toBe(0);
      expect(convertMSToKmH('invalid')).toBe('0');
    });

    it('formats values with units correctly', () => {
      expect(formatUnit(3.14159, 'm/s', 2, '.')).toBe('3.14 m/s');
      expect(formatUnit(10, 'N', 2, ',')).toBe('10 N');
    });

    it('computes trigonometric values with high precision', () => {
      expect(Number(sinDeg(0).toString())).toBe(0);
      expect(Number(sinDeg(30).toString())).toBe(0.5);
      expect(Number(sinDeg(90).toString())).toBe(1);

      expect(Number(cosDeg(0).toString())).toBe(1);
      expect(Number(cosDeg(60).toString())).toBe(0.5);
      expect(Number(cosDeg(90).toString())).toBe(0);
    });

    it('converts degrees to radians and back', () => {
      expect(degToRad(180)).toBeCloseTo(Math.PI, 6);
      expect(radToDeg(Math.PI)).toBeCloseTo(180, 6);
    });
  });

  describe('1. MRU (Movimento Retilíneo Uniforme)', () => {
    it('calculates final position s = s0 + v * t', () => {
      const res = calculateMRU({
        s0: '10',
        v: '5',
        t: '4',
        unknown: 's',
      });
      expect(res.s).toBe(30);
      expect(res.s0).toBe(10);
      expect(res.v).toBe(5);
      expect(res.t).toBe(4);
      expect(res.chartData.type).toBe('temporal');
      expect(res.chartData.points.length).toBeGreaterThan(0);
      expect(res.steps.length).toBeGreaterThan(0);
    });

    it('calculates time t = (s - s0) / v', () => {
      const res = calculateMRU({
        s: '50',
        s0: '20',
        v: '6',
        unknown: 't',
      });
      expect(res.t).toBe(5);
      expect(res.formattedT).toBe('5');
    });

    it('calculates velocity v = (s - s0) / t', () => {
      const res = calculateMRU({
        s: '100',
        s0: '0',
        t: '10',
        unknown: 'v',
      });
      expect(res.v).toBe(10);
      expect(res.formattedV).toBe('10');
    });

    it('calculates initial position s0 = s - v * t', () => {
      const res = calculateMRU({
        s: '100',
        v: '20',
        t: '3',
        unknown: 's0',
      });
      expect(res.s0).toBe(40);
      expect(res.formattedS0).toBe('40');
      expect(res.formattedS).toBe('100');
    });
  });

  describe('2. MRUV & Torricelli', () => {
    it('calculates position using s = s0 + v0*t + 0.5*a*t^2', () => {
      const res = calculateMRUV({
        subMode: 'horaria',
        s0: '0',
        v0: '10',
        a: '2',
        t: '5',
        unknown: 's',
      });
      expect(res.s).toBe(75);
      expect(res.v).toBe(20);
      expect(res.chartData.type).toBe('temporal');
    });

    it('calculates final velocity using Torricelli: v^2 = v0^2 + 2*a*deltaS', () => {
      const res = calculateMRUV({
        subMode: 'torricelli',
        v0: '0',
        a: '2',
        deltaS: '100',
        unknown: 'v',
      });
      expect(res.v).toBe(20);
    });

    it('calculates stopping distance and stopping time for decelerating object', () => {
      const res = calculateMRUV({
        subMode: 'horaria',
        s0: '0',
        v0: '30',
        a: '-5',
        t: '2',
        unknown: 's',
      });
      expect(res.stoppingTime).toBe(6);
      expect(res.stoppingDistance).toBe(90);
    });
  });

  describe('3. Queda Livre', () => {
    it('calculates fall time and impact speed accurately in vacuum', () => {
      const res = calculateQuedaLivre({
        h0: '45',
        g: '10',
      });
      expect(res.tQueda).toBe(3);
      expect(res.vImpacto).toBe(30);
      expect(res.hasAirResistance).toBe(false);
      expect(res.chartData.type).toBe('temporal');
      expect(res.chartData.points.length).toBeGreaterThan(0);
    });

    it('calculates free fall with air resistance (terminal velocity)', () => {
      const res = calculateQuedaLivre({
        h0: '500',
        g: '9.8',
        enableAirResistance: true,
        vTerminal: '50',
      });

      expect(res.hasAirResistance).toBe(true);
      expect(res.vTerminal).toBe(50);
      // Com resistência do ar, o tempo de queda é maior que no vácuo
      expect(res.tQueda).toBeGreaterThan(res.vacuumTQueda!);
      // A velocidade de impacto é menor que no vácuo
      expect(res.vImpacto).toBeLessThan(res.vacuumVImpacto!);
      // A velocidade de impacto nunca ultrapassa a velocidade terminal
      expect(res.vImpacto).toBeLessThanOrEqual(50);
      expect(res.percentageOfVTerminal).toBeGreaterThan(90);
      expect(res.formattedVTerminal).toBe('50');
    });

    it('approaches terminal velocity asymptotically from high drops', () => {
      const res = calculateQuedaLivre({
        h0: '3000',
        g: '10',
        enableAirResistance: true,
        vTerminal: '40',
      });

      expect(res.vImpacto).toBeCloseTo(40, 1);
      expect(res.percentageOfVTerminal).toBeCloseTo(100, 0);
    });
  });

  describe('4. Lançamento Vertical', () => {
    it('calculates ascent time, maximum height, total flight time, and return speed', () => {
      const res = calculateLancamentoVertical({
        v0: '30',
        g: '10',
      });
      expect(res.tSubida).toBe(3);
      expect(res.hMax).toBe(45);
      expect(res.tTotal).toBe(6);
      expect(res.vRetorno).toBe(30);
    });
  });

  describe('5. Lançamento Horizontal', () => {
    it('calculates fall time, horizontal range, and resultant impact speed', () => {
      const res = calculateLancamentoHorizontal({
        h0: '80',
        v0x: '20',
        g: '10',
      });
      expect(res.tQueda).toBe(4);
      expect(res.alcance).toBe(80);
      expect(res.vyFinal).toBe(40);
      expect(res.vImpacto).toBeCloseTo(Math.sqrt(2000), 2);
      expect(res.chartData.type).toBe('ballistic');
      expect(res.chartData.apex.x).toBe(0);
      expect(res.chartData.apex.y).toBe(80);
      expect(res.chartData.range.x).toBe(80);
    });
  });

  describe('6. Lançamento Oblíquo', () => {
    it('calculates apex, range, and flight time at 45 degrees', () => {
      const res = calculateLancamentoObliquo({
        v0: '20',
        angleDeg: '45',
        g: '10',
      });
      expect(res.alcance).toBeCloseTo(40, 1);
      expect(res.hMax).toBeCloseTo(10, 1);
      expect(res.chartData.type).toBe('ballistic');
      expect(res.chartData.apex.x).toBeCloseTo(20, 1);
      expect(res.chartData.apex.y).toBeCloseTo(10, 1);
      expect(res.chartData.range.x).toBeCloseTo(40, 1);
    });
  });

  describe('7. MCU (Movimento Circular Uniforme)', () => {
    it('calculates period, frequency, omega, linear speed, and centripetal acceleration', () => {
      const res = calculateMCU({
        radius: '2',
        parameterType: 'period',
        value: '4',
      });
      expect(res.period).toBe(4);
      expect(res.frequency).toBe(0.25);
      expect(res.omega).toBeCloseTo(Math.PI / 2, 3);
      expect(res.vLinear).toBeCloseTo(Math.PI, 3);
      expect(res.aCentripeta).toBeCloseTo((Math.PI * Math.PI) / 2, 3);
      expect(res.chartData.type).toBe('circular');
    });
  });

  describe('8. MHS (Movimento Harmônico Simples)', () => {
    it('calculates simple pendulum period and frequency', () => {
      const res = calculateMHS({
        type: 'pendulo',
        amplitude: '0.2',
        length: '1',
        g: '9.8',
      });
      expect(res.period).toBeCloseTo(2 * Math.PI * Math.sqrt(1 / 9.8), 3);
      expect(res.chartData.type).toBe('temporal');
      expect(res.wavePoints.length).toBeGreaterThan(0);
    });

    it('calculates mass-spring oscillator period and frequency', () => {
      const res = calculateMHS({
        type: 'massa_mola',
        amplitude: '0.1',
        mass: '2',
        k: '200',
      });
      expect(res.omega).toBe(10);
      expect(res.period).toBeCloseTo((2 * Math.PI) / 10, 3);
      expect(res.frequency).toBeCloseTo(10 / (2 * Math.PI), 3);
    });
  });

  describe('9. Plano Inclinado', () => {
    it('decomposes weight into Px and Py and calculates normal and acceleration', () => {
      const res = calculatePlanoInclinado({
        mass: '10',
        angleDeg: '30',
        frictionCoef: '0.1',
        g: '10',
      });
      expect(res.peso).toBe(100);
      expect(res.px).toBeCloseTo(50, 2);
      expect(res.py).toBeCloseTo(86.6, 1);
      expect(res.normal).toBeCloseTo(86.6, 1);
      expect(res.fat).toBeCloseTo(8.66, 1);
      expect(res.aceleracao).toBeCloseTo(4.134, 2);
      expect(res.isStatic).toBe(false);
      expect(res.chartData.type).toBe('inclined_plane');
    });

    it('detects static condition when friction exceeds or matches parallel weight component', () => {
      const res = calculatePlanoInclinado({
        mass: '5',
        angleDeg: '15',
        frictionCoef: '0.5',
        g: '10',
      });
      expect(res.isStatic).toBe(true);
      expect(res.aceleracao).toBe(0);
    });

    it('supports external applied force pulling up the ramp', () => {
      // Massa 10 kg, ângulo 30°, g=10 m/s² -> Px = 50 N, Py = 86.6 N, FatMax = 8.66 N
      // Força aplicada F = 50 N equilibra exatamente Px -> estático, a = 0
      const resBalanced = calculatePlanoInclinado({
        mass: '10',
        angleDeg: '30',
        frictionCoef: '0.1',
        appliedForce: '50',
        g: '10',
      });
      expect(resBalanced.isStatic).toBe(true);
      expect(resBalanced.aceleracao).toBe(0);
      expect(resBalanced.appliedForce).toBe(50);
      expect(resBalanced.chartData.appliedForce).toBe(50);

      // Força aplicada F = 100 N vence Px (50 N) e FatMax (8.66 N) -> acelera subindo
      const resPullingUp = calculatePlanoInclinado({
        mass: '10',
        angleDeg: '30',
        frictionCoef: '0.1',
        appliedForce: '100',
        g: '10',
      });
      expect(resPullingUp.isStatic).toBe(false);
      // F_res = (100 - 50) - 8.66025 = 41.33975 N -> a = 4.133975 m/s²
      expect(resPullingUp.aceleracao).toBeCloseTo(4.134, 2);
      expect(resPullingUp.formattedValues.status).toContain('Subindo');
    });
  });

  describe('10. Conservação de Energia & Trabalho', () => {
    it('calculates kinetic, potential, and mechanical energy', () => {
      const res = calculateEnergiaTrabalho({
        calculationSubtype: 'conservacao_energia',
        mass: '4',
        v: '10',
        h: '5',
        g: '10',
      });
      expect(res.ec).toBe(200);
      expect(res.ep).toBe(200);
      expect(res.em).toBe(400);
      expect(res.chartData.type).toBe('energy_bars');
      expect(res.chartData.bars.length).toBe(3);
    });

    it('calculates work, power, CV, and HP', () => {
      const res = calculateEnergiaTrabalho({
        calculationSubtype: 'trabalho_potencia',
        force: '100',
        distance: '20',
        angleDeg: '60',
        time: '10',
      });
      expect(res.work).toBe(1000);
      expect(res.power).toBe(100);
      expect(res.chartData.type).toBe('energy_bars');
      expect(res.chartData.bars.length).toBe(2);
      expect(res.steps.some((st) => st.includes('CV') && st.includes('HP'))).toBe(true);
    });
  });
});
