import { describe, it, expect } from 'vitest';
import { generateWorksheet, formatWorksheetToMarkdown } from '../core/math/worksheetGenerator';

describe('Motor Matemático: Gerador Determinístico de Listas de Exercícios (PRNG Mulberry32)', () => {
  it('deve gerar listas 100% idênticas para a mesma seed (determinismo estrito)', () => {
    const seed = 'QUANTORA-MATH-2026';
    const sheet1 = generateWorksheet({
      seed,
      count: 10,
      topic: 'mixed',
      lang: 'pt',
    });

    const sheet2 = generateWorksheet({
      seed,
      count: 10,
      topic: 'mixed',
      lang: 'pt',
    });

    expect(sheet1.seed).toBe(seed);
    expect(sheet2.seed).toBe(seed);
    expect(sheet1.exercises.length).toBe(10);
    expect(sheet2.exercises.length).toBe(10);

    const md1 = formatWorksheetToMarkdown(sheet1, { includeAnswerKey: true, lang: 'pt' });
    const md2 = formatWorksheetToMarkdown(sheet2, { includeAnswerKey: true, lang: 'pt' });
    expect(md1).toBe(md2);

    for (let i = 0; i < 10; i++) {
      expect(sheet1.exercises[i].statement).toBe(sheet2.exercises[i].statement);
      expect(sheet1.exercises[i].finalAnswer).toBe(sheet2.exercises[i].finalAnswer);
      expect(sheet1.exercises[i].topic).toBe(sheet2.exercises[i].topic);
    }
  });

  it('deve gerar questões distintas ao alterar a seed', () => {
    const sheetA = generateWorksheet({
      seed: 'SEED-ALPHA',
      count: 5,
      topic: 'bhaskara',
      lang: 'pt',
    });

    const sheetB = generateWorksheet({
      seed: 'SEED-BETA',
      count: 5,
      topic: 'bhaskara',
      lang: 'pt',
    });

    const mdA = formatWorksheetToMarkdown(sheetA);
    const mdB = formatWorksheetToMarkdown(sheetB);
    expect(mdA).not.toBe(mdB);
  });

  it('deve respeitar a contagem solicitada de questões (5, 10, 20)', () => {
    const counts: Array<5 | 10 | 20> = [5, 10, 20];
    for (const count of counts) {
      const sheet = generateWorksheet({
        seed: `COUNT-${count}`,
        count,
        topic: 'mixed',
        lang: 'pt',
      });
      expect(sheet.exercises.length).toBe(count);
    }
  });

  it('deve filtrar estritamente pelos tópicos selecionados', () => {
    const sheetOnlyBhaskara = generateWorksheet({
      seed: 'SEED-BHASKARA',
      count: 5,
      topic: 'bhaskara',
      lang: 'pt',
    });

    for (const ex of sheetOnlyBhaskara.exercises) {
      expect(ex.topic).toBe('bhaskara');
    }

    const sheetOnlyLinear = generateWorksheet({
      seed: 'SEED-LINEAR',
      count: 5,
      topic: 'linear_system',
      lang: 'pt',
    });

    for (const ex of sheetOnlyLinear.exercises) {
      expect(ex.topic).toBe('linear_system');
    }
  });

  it('deve gerar gabarito detalhado com resolução passo a passo', () => {
    const sheet = generateWorksheet({
      seed: 'SEED-GABARITO',
      count: 5,
      topic: 'progression',
      lang: 'pt',
    });

    const md = formatWorksheetToMarkdown(sheet, { includeAnswerKey: true, lang: 'pt' });
    expect(md).toContain('Gabarito Comentado');
    for (const ex of sheet.exercises) {
      expect(ex.finalAnswer).toBeTruthy();
      expect(ex.steps.length).toBeGreaterThan(0);
    }
  });

  it('deve suportar internacionalização em inglês (en)', () => {
    const sheetEn = generateWorksheet({
      seed: 'SEED-ENGLISH',
      count: 5,
      topic: 'pitagoras',
      lang: 'en',
    });

    expect(sheetEn.title).toContain('Worksheet');
    const md = formatWorksheetToMarkdown(sheetEn, { includeAnswerKey: true, lang: 'en' });
    expect(md).toContain('Commented Answer Key');
  });
});
