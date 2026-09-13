import { describe, it, expect } from 'vitest';
import Big from 'big.js';
import {
  parseBig,
  formatNumber,
  formatNumberSmart,
  isValidInputChar,
} from '../core/math/precision';

describe('Motor Matemático: Precision', () => {
  describe('parseBig', () => {
    it('deve parsear números válidos', () => {
      expect(parseBig(10).toNumber()).toBe(10);
      expect(parseBig(-5.5).toNumber()).toBe(-5.5);
      expect(parseBig(0).toNumber()).toBe(0);
    });

    it('deve lançar erro para números inválidos', () => {
      expect(() => parseBig(NaN)).toThrow('Número inválido');
      expect(() => parseBig(Infinity)).toThrow('Número inválido');
      expect(() => parseBig(-Infinity)).toThrow('Número inválido');
    });

    it('deve parsear strings válidas com separadores diferentes', () => {
      expect(parseBig('10').toNumber()).toBe(10);
      expect(parseBig('-5.5').toNumber()).toBe(-5.5);
      expect(parseBig('3,14').toNumber()).toBe(3.14);
      expect(parseBig('  42  ').toNumber()).toBe(42);
    });

    it('deve lançar erro para strings inválidas', () => {
      expect(() => parseBig('')).toThrow('Valor numérico inválido: ""');
      expect(() => parseBig('abc')).toThrow('Valor numérico inválido: "abc"');
      expect(() => parseBig('12.34.56')).toThrow('Valor numérico inválido: "12.34.56"');
    });
  });

  describe('formatNumber', () => {
    it('deve formatar número e Big com defaults', () => {
      expect(formatNumber(10)).toBe('10,00');
      expect(formatNumber(new Big(3.1415))).toBe('3,14');
    });

    it('deve respeitar a precisão de decimais', () => {
      expect(formatNumber(10, 0)).toBe('10');
      expect(formatNumber(3.1415, 3)).toBe('3,142'); // Verifica o arredondamento
    });

    it('deve respeitar o separador', () => {
      expect(formatNumber(3.14, 2, '.')).toBe('3.14');
      expect(formatNumber(3.14, 2, ',')).toBe('3,14');
    });
  });

  describe('formatNumberSmart', () => {
    it('deve remover zeros à direita desnecessários', () => {
      expect(formatNumberSmart(4)).toBe('4');
      expect(formatNumberSmart(4.0)).toBe('4');
      expect(formatNumberSmart(4.25)).toBe('4,25');
      expect(formatNumberSmart(4.250)).toBe('4,25');
    });

    it('deve respeitar o limite máximo de decimais', () => {
      expect(formatNumberSmart(3.14159, 4)).toBe('3,1416');
      expect(formatNumberSmart(3.14159, 2)).toBe('3,14');
    });

    it('deve respeitar o separador', () => {
      expect(formatNumberSmart(4.5, 2, '.')).toBe('4.5');
      expect(formatNumberSmart(4.5, 2, ',')).toBe('4,5');
    });
  });

  describe('isValidInputChar', () => {
    it('deve aceitar inputs parciais válidos', () => {
      expect(isValidInputChar('')).toBe(true);
      expect(isValidInputChar('-')).toBe(true);
      expect(isValidInputChar('-.')).toBe(true);
      expect(isValidInputChar('3.')).toBe(true);
      expect(isValidInputChar('-3.14')).toBe(true);
      expect(isValidInputChar('3,14')).toBe(true);
    });

    it('deve rejeitar inputs inválidos', () => {
      expect(isValidInputChar('abc')).toBe(false);
      expect(isValidInputChar('--')).toBe(false);
      expect(isValidInputChar('3.14.2')).toBe(false);
      expect(isValidInputChar('12-3')).toBe(false);
    });
  });

  describe('Didático: Segurança de Precisão e Arredondamento (big.js)', () => {
    it('deve garantir que não há perda de precisão (ex: 0.1 + 0.2)', () => {
      // Problema nativo do JavaScript (IEEE 754): 0.1 + 0.2 = 0.30000000000000004
      const jsNormal = 0.1 + 0.2;
      expect(jsNormal).not.toBe(0.3);

      // Solução com big.js garantindo exatidão decimal
      const b1 = new Big('0.1');
      const b2 = new Big('0.2');
      const bResult = b1.plus(b2);
      expect(bResult.toNumber()).toBe(0.3);
      expect(bResult.toString()).toBe('0.3');
    });

    it('deve preservar números extensos sem arredondamento automático indesejado', () => {
      // Número extenso (excedendo a precisão normal do tipo Number)
      const longoString = '3.14159265358979323846';
      const bPi = parseBig(longoString);

      // Garantimos que a string interna continua idêntica, suportando alta precisão
      expect(bPi.toString()).toBe(longoString);

      // O tipo Number nativo não suportaria essa extensão sem perder os dígitos finais
      const jsNumber = Number(longoString);
      expect(jsNumber.toString()).not.toBe(longoString);
    });

    it('deve realizar arredondamentos (Half-Up padrão) corretos com formatNumber', () => {
      const longoExtenso = parseBig('3.14159265358979323846');

      // Avaliando as casas decimais: 3.14159...
      // Com precisão de 4, o quinto dígito (9) empurra o 5 para 6
      expect(formatNumber(longoExtenso, 4, '.')).toBe('3.1416');

      // Com precisão de 5, o sexto dígito (2) não arredonda para cima, mantendo 9
      expect(formatNumber(longoExtenso, 5, '.')).toBe('3.14159');

      // Validando arredondamento clássico (round-half-up) em casos limite
      const exatoMeio = parseBig('2.55');
      // 2.55 com 1 casa -> o '5' arredonda para cima -> 2.6
      expect(formatNumber(exatoMeio, 1, '.')).toBe('2.6');
      expect(formatNumber(exatoMeio, 1, ',')).toBe('2,6');
    });

    it('deve arredondar e truncar corretamente com formatNumberSmart', () => {
      const valor = parseBig('1.005');

      // Max decimals 2: 1.005 -> 1.01
      expect(formatNumberSmart(valor, 2, '.')).toBe('1.01');

      // Se fosse 1.00, deve retornar só 1
      const inteiroFalso = parseBig('1.000');
      expect(formatNumberSmart(inteiroFalso, 3, '.')).toBe('1');
    });
  });
});
