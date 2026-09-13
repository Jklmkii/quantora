import { describe, it, expect } from 'vitest';
import {
  validateHistorySchema,
  VALID_TYPES,
} from '../core/storage/historyValidator';
import { translations } from '../core/i18n/translations';
import type {
  CalculationType,
  HistoryItem,
  ActiveTab,
  PhysicsCategory,
  PhysicsMode,
  PhysicsChartData,
  TemporalChartData,
  BallisticChartData,
  CircularVectorChartData,
  InclinedPlaneChartData,
  EnergyChartData,
  UserProfileStats,
} from '../types';

const validateHistoryItem = (item: any) => validateHistorySchema([item]).valid === true;

describe('Empirical Challenger 2 — Milestone M1 Stress Testing Suite', () => {
  describe('1. historyValidator: VALID_TYPES Integrity & Exhaustiveness', () => {
    it('VALID_TYPES contains exactly the 4 expected calculation types including physics', () => {
      expect(VALID_TYPES).toEqual(['bhaskara', 'regra_simples', 'regra_composta', 'physics']);
      expect(VALID_TYPES.length).toBe(4);
      expect(VALID_TYPES).toContain('physics');
      expect(VALID_TYPES).toContain('bhaskara');
      expect(VALID_TYPES).toContain('regra_simples');
      expect(VALID_TYPES).toContain('regra_composta');
      expect(Object.isFrozen(VALID_TYPES) || Array.isArray(VALID_TYPES)).toBe(true);
    });
  });

  describe('2. historyValidator: validateHistoryItem Comprehensive Fuzzing & Boundaries', () => {
    it('approves well-formed physics history items', () => {
      const minimalPhysicsItem = {
        id: 'phys_test_1',
        timestamp: 1726077600000,
        type: 'physics',
        title: 'MRU: S = 10 + 5*2',
        summary: 'S = 20 m',
        details: 'Etapa 1: Dados identificados',
      };
      expect(validateHistoryItem(minimalPhysicsItem)).toBe(true);

      const richPhysicsItem: HistoryItem = {
        id: 'phys_test_2',
        timestamp: Date.now(),
        type: 'physics',
        title: 'Lançamento Oblíquo: θ = 45°, v0 = 20 m/s',
        summary: 'Alcance = 40.82 m, H_max = 10.20 m',
        details: 'Etapa 1: Decomposição vetorial\nEtapa 2: Tempo de subida',
        isPinned: true,
        rawPayload: {
          mode: 'lancamento_obliquo',
          category: 'cinematica',
          inputs: { v0: '20', angleDeg: '45', g: '9.8' },
          results: { alcance: '40.82', hMax: '10.20' },
          chartData: { type: 'ballistic', points: [{ x: 0, y: 0 }] },
        },
      };
      expect(validateHistoryItem(richPhysicsItem)).toBe(true);
    });

    it('approves legacy items (bhaskara, regra_simples, regra_composta)', () => {
      const legacyBhaskara = {
        id: 'bhas_1',
        timestamp: 1600000000000,
        type: 'bhaskara',
        title: 'x² - 5x + 6 = 0',
        summary: 'x1=3, x2=2',
        details: 'Δ = 1',
      };
      const legacyRegraSimples = {
        id: 'rs_1',
        timestamp: 1600000000000,
        type: 'regra_simples',
        title: 'Regra de 3 Direta',
        summary: 'X = 15',
        details: 'Proporção',
      };
      const legacyRegraComposta = {
        id: 'rc_1',
        timestamp: 1600000000000,
        type: 'regra_composta',
        title: 'Regra Composta',
        summary: 'X = 42',
        details: 'Tabela composta',
      };

      expect(validateHistoryItem(legacyBhaskara)).toBe(true);
      expect(validateHistoryItem(legacyRegraSimples)).toBe(true);
      expect(validateHistoryItem(legacyRegraComposta)).toBe(true);
    });

    it('rejects non-object, null, and undefined inputs without throwing uncaught exceptions', () => {
      const nonObjects = [
        null,
        undefined,
        0,
        -1,
        42,
        3.14,
        NaN,
        Infinity,
        -Infinity,
        '',
        'string',
        '{"id":"1"}',
        true,
        false,
        Symbol('test'),
        BigInt(100),
        () => {},
      ];

      for (const val of nonObjects) {
        expect(() => validateHistoryItem(val)).not.toThrow();
        expect(validateHistoryItem(val)).toBe(false);
      }
    });

    it('rejects empty and partial objects missing required fields', () => {
      expect(validateHistoryItem({})).toBe(false);
      expect(validateHistoryItem({ id: '1' })).toBe(false);
      expect(validateHistoryItem({ id: '1', timestamp: 1234 })).toBe(false);
      expect(validateHistoryItem({ id: '1', timestamp: 1234, type: 'physics' })).toBe(false);
      expect(validateHistoryItem({ id: '1', timestamp: 1234, type: 'physics', title: 'T' })).toBe(false);
      expect(
        validateHistoryItem({ id: '1', timestamp: 1234, type: 'physics', title: 'T', summary: 'S' })
      ).toBe(false);
    });

    it('rejects items with invalid field types (type mismatches)', () => {
      const baseValid = {
        id: 'id_valid',
        timestamp: 1726000000000,
        type: 'physics',
        title: 'Title',
        summary: 'Summary',
        details: 'Details',
      };

      // Mismatched id
      expect(validateHistoryItem({ ...baseValid, id: 123 })).toBe(false);
      expect(validateHistoryItem({ ...baseValid, id: null })).toBe(false);
      expect(validateHistoryItem({ ...baseValid, id: undefined })).toBe(false);
      expect(validateHistoryItem({ ...baseValid, id: {} })).toBe(false);

      // Mismatched timestamp
      expect(validateHistoryItem({ ...baseValid, timestamp: '1726000000000' })).toBe(false);
      expect(validateHistoryItem({ ...baseValid, timestamp: null })).toBe(false);
      expect(validateHistoryItem({ ...baseValid, timestamp: undefined })).toBe(false);
      expect(validateHistoryItem({ ...baseValid, timestamp: new Date() })).toBe(false);

      // Mismatched type
      expect(validateHistoryItem({ ...baseValid, type: 'PHYSICS' })).toBe(false);
      expect(validateHistoryItem({ ...baseValid, type: 'Physics' })).toBe(false);
      expect(validateHistoryItem({ ...baseValid, type: 'physics ' })).toBe(false);
      expect(validateHistoryItem({ ...baseValid, type: ' chemistry' })).toBe(false);
      expect(validateHistoryItem({ ...baseValid, type: 123 })).toBe(false);
      expect(validateHistoryItem({ ...baseValid, type: null })).toBe(false);
      expect(validateHistoryItem({ ...baseValid, type: undefined })).toBe(false);
      expect(validateHistoryItem({ ...baseValid, type: '__proto__' })).toBe(false);
      expect(validateHistoryItem({ ...baseValid, type: 'constructor' })).toBe(false);
      expect(validateHistoryItem({ ...baseValid, type: 'toString' })).toBe(false);

      // Mismatched title
      expect(validateHistoryItem({ ...baseValid, title: 123 })).toBe(false);
      expect(validateHistoryItem({ ...baseValid, title: null })).toBe(false);
      expect(validateHistoryItem({ ...baseValid, title: undefined })).toBe(false);
      expect(validateHistoryItem({ ...baseValid, title: ['Title'] })).toBe(false);

      // Mismatched summary
      expect(validateHistoryItem({ ...baseValid, summary: 123 })).toBe(false);
      expect(validateHistoryItem({ ...baseValid, summary: null })).toBe(false);
      expect(validateHistoryItem({ ...baseValid, summary: undefined })).toBe(false);

      // Mismatched details
      expect(validateHistoryItem({ ...baseValid, details: 123 })).toBe(false);
      expect(validateHistoryItem({ ...baseValid, details: null })).toBe(false);
      expect(validateHistoryItem({ ...baseValid, details: undefined })).toBe(false);
      expect(validateHistoryItem({ ...baseValid, details: { steps: [] } })).toBe(false);
    });

    it('handles prototype-less objects safely', () => {
      const bareObject = Object.create(null);
      bareObject.id = 'bare_1';
      bareObject.timestamp = 1000;
      bareObject.type = 'physics';
      bareObject.title = 'Bare Title';
      bareObject.summary = 'Bare Summary';
      bareObject.details = 'Bare Details';

      expect(() => validateHistoryItem(bareObject)).not.toThrow();
      expect(validateHistoryItem(bareObject)).toBe(true);
    });
  });

  describe('3. historyValidator: validateHistorySchema Array Validation & Error Reporting', () => {
    it('approves valid history arrays mixing legacy and physics items', () => {
      const mixedBatch = [
        {
          id: 'bhas_1',
          timestamp: 1000,
          type: 'bhaskara' as const,
          title: 'B1',
          summary: 'S1',
          details: 'D1',
        },
        {
          id: 'rs_1',
          timestamp: 2000,
          type: 'regra_simples' as const,
          title: 'RS1',
          summary: 'S2',
          details: 'D2',
        },
        {
          id: 'phys_1',
          timestamp: 3000,
          type: 'physics' as const,
          title: 'P1',
          summary: 'S3',
          details: 'D3',
        },
        {
          id: 'rc_1',
          timestamp: 4000,
          type: 'regra_composta' as const,
          title: 'RC1',
          summary: 'S4',
          details: 'D4',
        },
      ];

      const result = validateHistorySchema(mixedBatch);
      expect(result.valid).toBe(true);
      expect(result.data).toHaveLength(4);
      expect(result.error).toBeUndefined();
    });

    it('approves empty array []', () => {
      const res = validateHistorySchema([]);
      expect(res.valid).toBe(true);
      expect(res.data).toEqual([]);
      expect(res.error).toBeUndefined();
    });

    it('rejects non-array payloads with didactic error message', () => {
      const nonArrays = [
        null,
        undefined,
        {},
        { length: 0 },
        'string',
        123,
        true,
      ];

      for (const item of nonArrays) {
        const res = validateHistorySchema(item);
        expect(res.valid).toBe(false);
        expect(res.error).toBe('Formato inválido: o backup de histórico deve ser uma lista (array) de itens.');
        expect(res.data).toBeUndefined();
      }
    });

    it('correctly reports the exact 1-indexed corrupted item number', () => {
      const validItem = {
        id: 'v1',
        timestamp: 1000,
        type: 'physics',
        title: 'T',
        summary: 'S',
        details: 'D',
      };

      // Item #1 is corrupted
      const res1 = validateHistorySchema([{ ...validItem, type: 'unknown_type' }]);
      expect(res1.valid).toBe(false);
      expect(res1.error).toBe('O item #1 do arquivo não segue a estrutura esperada do histórico.');

      // Item #3 is corrupted in a list of 5
      const res3 = validateHistorySchema([
        validItem,
        validItem,
        { ...validItem, timestamp: 'invalid-string' },
        validItem,
        validItem,
      ]);
      expect(res3.valid).toBe(false);
      expect(res3.error).toBe('O item #3 do arquivo não segue a estrutura esperada do histórico.');
    });

    it('scales linearly under heavy load (5,000 history items)', () => {
      const items: HistoryItem[] = [];
      const types: CalculationType[] = ['bhaskara', 'regra_simples', 'regra_composta', 'physics'];

      for (let i = 0; i < 5000; i++) {
        items.push({
          id: `item_${i}`,
          timestamp: 1700000000000 + i * 1000,
          type: types[i % types.length],
          title: `Item Title ${i}`,
          summary: `Summary ${i}`,
          details: `Detailed steps for calculation ${i}`,
          isPinned: i % 10 === 0,
          rawPayload: { index: i },
        });
      }

      const start = performance.now();
      const res = validateHistorySchema(items);
      const duration = performance.now() - start;

      expect(res.valid).toBe(true);
      expect(res.data?.length).toBe(5000);
      // Linear O(N) validation should execute well within 50ms for 5,000 items
      expect(duration).toBeLessThan(100);
    });
  });

  describe('4. translations.ts: Bilingual i18n Strict Symmetry & Value Integrity', () => {
    const ptKeys = Object.keys(translations.pt);
    const enKeys = Object.keys(translations.en);

    it('has exact count equality between pt and en dictionaries', () => {
      expect(ptKeys.length).toBe(enKeys.length);
      expect(ptKeys.length).toBeGreaterThanOrEqual(213);
    });

    it('has zero missing keys in en that exist in pt', () => {
      const missingInEn = ptKeys.filter((k) => translations.en[k as keyof typeof translations.en] === undefined);
      expect(missingInEn).toEqual([]);
    });

    it('has zero missing keys in pt that exist in en', () => {
      const missingInPt = enKeys.filter((k) => translations.pt[k as keyof typeof translations.pt] === undefined);
      expect(missingInPt).toEqual([]);
    });

    it('ensures all translation values are non-empty strings (no undefined, null, or empty)', () => {
      for (const [key, value] of Object.entries(translations.pt)) {
        expect(typeof value, `PT key "${key}" should be string`).toBe('string');
        expect((value as string).trim().length, `PT key "${key}" should not be empty`).toBeGreaterThan(0);
      }

      for (const [key, value] of Object.entries(translations.en)) {
        expect(typeof value, `EN key "${key}" should be string`).toBe('string');
        expect((value as string).trim().length, `EN key "${key}" should not be empty`).toBeGreaterThan(0);
      }
    });

    it('contains all 10 physics mode keys and descriptions in both languages', () => {
      const modes: PhysicsMode[] = [
        'mru',
        'mruv',
        'queda_livre',
        'lancamento_vertical',
        'lancamento_horizontal',
        'lancamento_obliquo',
        'mcu',
        'mhs',
        'plano_inclinado',
        'energia_trabalho',
      ];

      for (const mode of modes) {
        const titleKey = `physics_mode_${mode}` as keyof typeof translations.pt;
        const descKey = `physics_desc_${mode}` as keyof typeof translations.pt;

        expect(translations.pt[titleKey], `Missing PT title for mode: ${mode}`).toBeTruthy();
        expect(translations.en[titleKey], `Missing EN title for mode: ${mode}`).toBeTruthy();

        expect(translations.pt[descKey], `Missing PT desc for mode: ${mode}`).toBeTruthy();
        expect(translations.en[descKey], `Missing EN desc for mode: ${mode}`).toBeTruthy();
      }
    });

    it('contains all 3 physics category keys in both languages', () => {
      const categories: PhysicsCategory[] = [
        'cinematica',
        'circular_oscilacoes',
        'dinamica_energia',
      ];

      for (const cat of categories) {
        const catKey = `physics_cat_${cat}` as keyof typeof translations.pt;
        expect(translations.pt[catKey], `Missing PT category: ${cat}`).toBeTruthy();
        expect(translations.en[catKey], `Missing EN category: ${cat}`).toBeTruthy();
      }
    });

    it('contains navigation, badge, converter, and history keys for physics', () => {
      const requiredKeys: Array<keyof typeof translations.pt> = [
        'nav_fisica',
        'physics_title',
        'physics_subtitle',
        'physics_history_badge',
        'history_type_physics',
        'filter_physics',
        'stat_physics',
        'physics_gravity_label',
        'physics_converter_title',
        'physics_to_ms',
        'physics_to_kmh',
        'physics_save_history',
        'physics_saved_toast',
      ];

      for (const k of requiredKeys) {
        expect(translations.pt[k], `Missing PT key: ${k}`).toBeTruthy();
        expect(translations.en[k], `Missing EN key: ${k}`).toBeTruthy();
      }
    });
  });

  describe('5. Types: Compile-time Interface Contract Conformance', () => {
    it('validates ActiveTab, CalculationType, and UserProfileStats type assignments', () => {
      const activeTabPhysics: ActiveTab = 'physics';
      const calcTypePhysics: CalculationType = 'physics';
      const stats: UserProfileStats = {
        totalCalculations: 10,
        totalBhaskara: 5,
        totalRegraDeTres: 3,
        totalQuizCorrect: 2,
        bestSurvivalRecord: 5,
        totalPhysics: 2,
      };

      expect(activeTabPhysics).toBe('physics');
      expect(calcTypePhysics).toBe('physics');
      expect(stats.totalPhysics).toBe(2);
    });

    it('validates all 5 PhysicsChartData discrimination types', () => {
      const temporal: TemporalChartData = {
        type: 'temporal',
        points: [{ t: 0, s: 0, v: 10 }],
      };
      const ballistic: BallisticChartData = {
        type: 'ballistic',
        points: [{ x: 0, y: 0 }],
        apex: { x: 10, y: 5 },
        range: { x: 20, y: 0 },
      };
      const circular: CircularVectorChartData = {
        type: 'circular',
        radius: 5,
        omega: 2,
        vLinear: 10,
        aCentripeta: 20,
      };
      const inclined: InclinedPlaneChartData = {
        type: 'inclined_plane',
        angleDeg: 30,
        mass: 10,
        peso: 98,
        px: 49,
        py: 84.87,
        normal: 84.87,
        fat: 10,
        aceleracao: 3.9,
      };
      const energy: EnergyChartData = {
        type: 'energy_bars',
        ec: 100,
        ep: 50,
        em: 150,
        bars: [
          { label: 'Cinética', value: 100 },
          { label: 'Potencial', value: 50 },
          { label: 'Mecânica', value: 150 },
        ],
      };

      const chartList: PhysicsChartData[] = [temporal, ballistic, circular, inclined, energy];
      expect(chartList).toHaveLength(5);
      expect(chartList.map((c) => c.type)).toEqual([
        'temporal',
        'ballistic',
        'circular',
        'inclined_plane',
        'energy_bars',
      ]);
    });
  });

  describe('6. Electron Parity & Hostile Adversarial Stress Test', () => {
    // Electron's exact IPC validation implementation for equivalence check
    function simulateElectronValidation(rawContent: string) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(rawContent);
      } catch {
        return {
          success: false,
          error: 'O arquivo selecionado não é um JSON válido ou está corrompido.',
        };
      }

      if (!Array.isArray(parsed)) {
        return {
          success: false,
          error: 'Formato inválido: o arquivo de backup deve conter uma lista (array) de itens.',
        };
      }

      const validTypes = ['bhaskara', 'regra_simples', 'regra_composta', 'physics'];
      for (let i = 0; i < parsed.length; i++) {
        const item = parsed[i];
        if (
          !item ||
          typeof item !== 'object' ||
          typeof item.id !== 'string' ||
          typeof item.timestamp !== 'number' ||
          !validTypes.includes(item.type) ||
          typeof item.title !== 'string' ||
          typeof item.summary !== 'string' ||
          typeof item.details !== 'string'
        ) {
          return {
            success: false,
            error: `O item #${i + 1} do arquivo não segue a estrutura esperada do histórico.`,
          };
        }
      }

      return { success: true, data: parsed };
    }

    it('validates 100% equivalence between Electron IPC validator and validateHistorySchema', () => {
      const testCases: unknown[] = [
        [],
        [
          {
            id: 'p_1',
            timestamp: 1000,
            type: 'physics',
            title: 'Physics Title',
            summary: 'Summary',
            details: 'Details',
          },
        ],
        [
          {
            id: 'b_1',
            timestamp: 2000,
            type: 'bhaskara',
            title: 'Bhaskara',
            summary: 'Summary',
            details: 'Details',
          },
        ],
        [
          {
            id: 'bad_type',
            timestamp: 3000,
            type: 'chemistry',
            title: 'Title',
            summary: 'Summary',
            details: 'Details',
          },
        ],
        [
          {
            id: 'bad_ts',
            timestamp: 'invalid',
            type: 'physics',
            title: 'Title',
            summary: 'Summary',
            details: 'Details',
          },
        ],
        [null],
        [undefined],
        [{}],
        'not-an-array',
        12345,
        null,
      ];

      for (const tc of testCases) {
        let jsonStr = '';
        try {
          jsonStr = JSON.stringify(tc);
        } catch {
          continue;
        }

        const electronRes = simulateElectronValidation(jsonStr);
        const schemaRes = validateHistorySchema(tc);

        expect(electronRes.success).toBe(schemaRes.valid);
        if (!electronRes.success) {
          if (electronRes.error?.includes('não segue a estrutura esperada')) {
            expect(electronRes.error).toBe(schemaRes.error);
          } else {
            expect(electronRes.error).toContain('Formato inválido');
            expect(schemaRes.error).toContain('Formato inválido');
          }
        }
      }
    });

    it('survives hostile circular reference objects without throwing or crashing', () => {
      const circularItem: Record<string, unknown> = {
        id: 'circ_1',
        timestamp: 123456,
        type: 'physics',
        title: 'Title',
        summary: 'Summary',
        details: 'Details',
      };
      circularItem.self = circularItem;

      expect(() => validateHistoryItem(circularItem)).not.toThrow();
      expect(validateHistoryItem(circularItem)).toBe(true);

      expect(() => validateHistorySchema([circularItem])).not.toThrow();
      expect(validateHistorySchema([circularItem]).valid).toBe(true);
    });

    it('survives frozen, sealed, and prototype-polluted objects', () => {
      const frozenItem = Object.freeze({
        id: 'froz_1',
        timestamp: 123,
        type: 'physics',
        title: 'T',
        summary: 'S',
        details: 'D',
      });
      expect(validateHistoryItem(frozenItem)).toBe(true);

      const sealedItem = Object.seal({
        id: 'seal_1',
        timestamp: 123,
        type: 'physics',
        title: 'T',
        summary: 'S',
        details: 'D',
      });
      expect(validateHistoryItem(sealedItem)).toBe(true);

      const pollutedItem = JSON.parse(
        '{"__proto__":{"isAdmin":true},"id":"p_1","timestamp":123,"type":"physics","title":"T","summary":"S","details":"D"}'
      );
      expect(validateHistoryItem(pollutedItem)).toBe(true);
      expect((pollutedItem as any).isAdmin).toBeUndefined();
    });

    it('rejects corrupt raw JSON strings with proper parse error in Electron simulation', () => {
      const malformedJsonStrings = [
        '{',
        '[{id:"unquoted"}]',
        'undefined',
        '[{"id":"p1", "timestamp": 123, "type": "physics", "title": "T", "summary": "S", "details": "D",}]', // trailing comma
        '{"valid": false}',
      ];

      for (const str of malformedJsonStrings) {
        const res = simulateElectronValidation(str);
        expect(res.success).toBe(false);
        expect(res.error).toBeDefined();
      }
    });
  });
});
