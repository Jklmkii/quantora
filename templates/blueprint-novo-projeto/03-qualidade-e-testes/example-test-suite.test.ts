import { describe, it, expect } from 'vitest';
import { safeAdd, safeDiv, formatDidacticNumber } from '../02-arquitetura-e-padroes-codigo/precision-math-template';
import { getDeviceLocalDateString, calculateStreakUpdate, checkStreakMaintenance } from '../02-arquitetura-e-padroes-codigo/streak-date-helper';

describe('Exemplo de Suíte de Testes Unitários (Padrão Quantora)', () => {
  describe('Precisão Numérica (IEEE 754)', () => {
    it('deve somar 0.1 e 0.2 resultando exatamente em 0.3 sem resíduo binário', () => {
      expect(safeAdd(0.1, 0.2)).toBe(0.3);
    });

    it('deve disparar erro ao tentar dividir por zero', () => {
      expect(() => safeDiv(10, 0)).toThrow('Divisão por zero não é permitida.');
    });

    it('deve identificar dízimas e formatar com o símbolo de aproximação ≈', () => {
      const res = formatDidacticNumber(10 / 3, 2);
      expect(res.isApproximate).toBe(true);
      expect(res.text).toContain('≈');
      expect(res.text).toContain('3,33');
    });

    it('não deve adicionar aproximação para inteiros exatos', () => {
      const res = formatDidacticNumber(10, 2);
      expect(res.isApproximate).toBe(false);
      expect(res.text).toBe('10');
    });
  });

  describe('Cálculo de Streaks & Fuso Horário Local', () => {
    it('deve extrair a data no formato YYYY-MM-DD', () => {
      const dateStr = getDeviceLocalDateString(new Date(2026, 8, 29)); // Mês 8 = Setembro
      expect(dateStr).toBe('2026-09-29');
    });

    it('deve expirar o streak para 0 se o usuário ficou mais de 1 dia inativo', () => {
      const streak = checkStreakMaintenance('2026-09-20', 5);
      expect(streak).toBe(0);
    });

    it('deve manter o streak se concluído ontem ou hoje', () => {
      const today = getDeviceLocalDateString();
      expect(checkStreakMaintenance(today, 5)).toBe(5);
    });

        it('deve incrementar o streak ao concluir atividade', () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const res = calculateStreakUpdate(getDeviceLocalDateString(yesterday), 3);
      expect(res.newStreak).toBe(4);
      expect(res.newDate).toBe(getDeviceLocalDateString());
    });
  });
});
