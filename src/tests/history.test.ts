import { describe, it, expect } from 'vitest';
import { validateHistorySchema } from '../core/storage/historyValidator';

describe('Validação de Integridade do Histórico', () => {
  it('deve rejeitar valores que não sejam arrays', () => {
    expect(validateHistorySchema(null).valid).toBe(false);
    expect(validateHistorySchema({}).valid).toBe(false);
    expect(validateHistorySchema('string').valid).toBe(false);
  });

  it('deve aprovar um array com itens válidos', () => {
    const validData = [
      {
        id: 'calc_1',
        timestamp: Date.now(),
        type: 'bhaskara' as const,
        title: 'Bhaskara: x² - 5x + 6 = 0',
        summary: 'x1 = 3, x2 = 2',
        details: 'Passos detalhados',
        isPinned: false,
        rawPayload: {},
      },
    ];

    const result = validateHistorySchema(validData);
    expect(result.valid).toBe(true);
    expect(result.data?.length).toBe(1);
  });

  it('deve rejeitar itens corrompidos ou com tipos inválidos', () => {
    const corruptedData = [
      {
        id: 'calc_1',
        timestamp: 'invalid-date', // deveria ser número
        type: 'bhaskara',
        title: 'Bhaskara',
        summary: 'resumo',
        details: 'detalhes',
      },
    ];

    const result = validateHistorySchema(corruptedData);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('não segue a estrutura esperada');
  });

  it('deve rejeitar cálculo com tipo desconhecido', () => {
    const unknownTypeData = [
      {
        id: 'calc_1',
        timestamp: Date.now(),
        type: 'tipo_desconhecido',
        title: 'Teste',
        summary: 'resumo',
        details: 'detalhes',
      },
    ];

    const result = validateHistorySchema(unknownTypeData);
    expect(result.valid).toBe(false);
  });

  it('deve rejeitar itens com propriedades excedendo limites de caracteres (DoS protection)', () => {
    const longStringData = [
      {
        id: 'a'.repeat(101),
        timestamp: Date.now(),
        type: 'bhaskara' as const,
        title: 'Título válido',
        summary: 'Resumo válido',
        details: 'Detalhes',
      },
    ];

    expect(validateHistorySchema(longStringData).valid).toBe(false);

    const longTitleData = [
      {
        id: 'calc_1',
        timestamp: Date.now(),
        type: 'bhaskara' as const,
        title: 'b'.repeat(201),
        summary: 'Resumo',
        details: 'Detalhes',
      },
    ];
    expect(validateHistorySchema(longTitleData).valid).toBe(false);

    const longSummaryData = [
      {
        id: 'calc_1',
        timestamp: Date.now(),
        type: 'bhaskara' as const,
        title: 'Titulo',
        summary: 'c'.repeat(1001),
        details: 'Detalhes',
      },
    ];
    expect(validateHistorySchema(longSummaryData).valid).toBe(false);

    const longDetailsData = [
      {
        id: 'calc_1',
        timestamp: Date.now(),
        type: 'bhaskara' as const,
        title: 'Titulo',
        summary: 'Resumo',
        details: 'd'.repeat(10001),
      },
    ];
    expect(validateHistorySchema(longDetailsData).valid).toBe(false);
  });
});
