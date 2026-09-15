import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateQuizQuestion } from '../core/math/quizGenerator';

describe('quizGenerator', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random');
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Track: soma', () => {
    it('gerar soma de dois números para countNumber <= 20', () => {
      vi.mocked(Math.random)
        .mockReturnValueOnce(0) // for a
        .mockReturnValueOnce(0.5); // for b

      const question = generateQuizQuestion('soma', 1);

      expect(question.type).toBe('soma');
      expect(question.displayExpression).toBe('5 + 17'); // a = 5, b = 3 + (27 * 0.5) = 16.5 ~ 16. wait, Math.floor(0.5 * 28) = 14, 14+3=17.
      expect(question.correctAnswer).toBe(22);
      expect(question.formattedCorrectAnswer).toBe('22');
      expect(question.explanation).toContain('Equação: 5 + 17');
    });

    it('gerar soma de três termos para countNumber <= 50', () => {
      vi.mocked(Math.random)
        .mockReturnValueOnce(0.5) // > 0.4 branch
        .mockReturnValueOnce(0) // a
        .mockReturnValueOnce(0) // b
        .mockReturnValueOnce(0); // c

      const question = generateQuizQuestion('soma', 25);

      expect(question.type).toBe('soma');
      expect(question.displayExpression).toBe('100 + 50 + 11');
      expect(question.correctAnswer).toBe(161);
    });
  });

  describe('Track: subtracao', () => {
    it('gerar subtracao simples para countNumber <= 20', () => {
      vi.mocked(Math.random)
        .mockReturnValueOnce(0) // b = getRandomInt(5, 40) => 5
        .mockReturnValueOnce(0); // a = b + getRandomInt(4, 50) => 5 + 4 = 9

      const question = generateQuizQuestion('subtracao', 10);
      expect(question.type).toBe('subtracao');
      expect(question.displayExpression).toBe('9 - 5');
      expect(question.correctAnswer).toBe(4);
    });

    it('gerar subtracao com resultado negativo para countNumber <= 110', () => {
      vi.mocked(Math.random)
        .mockReturnValueOnce(0) // a = getRandomInt(20, 100) => 20
        .mockReturnValueOnce(0); // b = a + getRandomInt(15, 80) => 20 + 15 = 35

      const question = generateQuizQuestion('subtracao', 90);
      expect(question.type).toBe('subtracao');
      expect(question.displayExpression).toBe('20 - 35');
      expect(question.correctAnswer).toBe(-15);
      expect(question.explanation).toContain('Como 20 é menor que 35, o resultado é negativo.');
    });

    it('gerar subtracao com decimais finitos para countNumber > 110', () => {
      vi.mocked(Math.random)
        .mockReturnValueOnce(0) // aInt = getRandomInt(30, 150) => 30
        .mockReturnValueOnce(0); // bInt = getRandomInt(10, 30-5) => 10

      const question = generateQuizQuestion('subtracao', 150);
      expect(question.type).toBe('subtracao');
      expect(question.displayExpression).toBe('3 - 1'); // 30/10 - 10/10
      expect(question.correctAnswer).toBe(2);
    });
  });

  describe('Track: multiplicacao', () => {
    it('gerar multiplicacao mental para countNumber <= 30', () => {
      vi.mocked(Math.random)
        .mockReturnValueOnce(0) // a = getRandomInt(2, 10) => 2
        .mockReturnValueOnce(0); // b = getRandomInt(3, 10) => 3

      const question = generateQuizQuestion('multiplicacao', 10);
      expect(question.type).toBe('multiplicacao');
      expect(question.displayExpression).toBe('2 × 3');
      expect(question.correctAnswer).toBe(6);
    });

    it('gerar multiplicacao de 2 digitos por 1 digito para countNumber <= 80', () => {
      vi.mocked(Math.random)
        .mockReturnValueOnce(0) // a = getRandomInt(11, 45) => 11
        .mockReturnValueOnce(0); // b = getRandomInt(3, 9) => 3

      const question = generateQuizQuestion('multiplicacao', 50);
      expect(question.type).toBe('multiplicacao');
      expect(question.displayExpression).toBe('11 × 3');
      expect(question.correctAnswer).toBe(33);
    });
  });

  describe('Track: divisao', () => {
    it('gerar divisao exata para countNumber <= 30', () => {
      vi.mocked(Math.random)
        .mockReturnValueOnce(0) // b = getRandomInt(2, 9) => 2
        .mockReturnValueOnce(0); // correct = getRandomInt(2, 10) => 2

      const question = generateQuizQuestion('divisao', 10);
      expect(question.type).toBe('divisao');
      expect(question.displayExpression).toBe('4 ÷ 2'); // a = b * correct = 4
      expect(question.correctAnswer).toBe(2);
    });

    it('gerar divisao com decimal finito para countNumber > 80', () => {
      vi.mocked(Math.random)
        .mockReturnValueOnce(0) // pickRandom => FINITE_DECIMAL_DIVISORS_1_DECIMAL[0] = 2
        .mockReturnValueOnce(0); // a = getRandomInt(15, 150) => 15. Wait, 15 % 2 != 0, so 15

      const question = generateQuizQuestion('divisao', 100);
      expect(question.type).toBe('divisao');
      expect(question.displayExpression).toBe('15 ÷ 2');
      expect(question.correctAnswer).toBe(7.5);
    });
  });

  describe('Track: regra_simples', () => {
    it('gerar pergunta de regra de tres', () => {
      vi.mocked(Math.random)
        .mockReturnValueOnce(0); // pickRandom item 0

      const question = generateQuizQuestion('regra_simples', 10);
      expect(question.type).toBe('regra_simples');
      expect(question.correctAnswer).toBe(3); // Based on the first item in scenarios
    });
  });

  describe('sobrevivencia selector', () => {
    it('escolhe trilha baseada no countNumber <= 20', () => {
       vi.mocked(Math.random)
        .mockReturnValueOnce(0) // pickRandom -> 'soma' (index 0)
        .mockReturnValueOnce(0) // a
        .mockReturnValueOnce(0); // b

       const question = generateQuizQuestion('sobrevivencia', 1);
       expect(question.type).toBe('soma');
    });

    it('escolhe trilha baseada no countNumber > 50', () => {
      vi.mocked(Math.random)
       .mockReturnValueOnce(0.9) // pickRandom -> 'regra_simples' (last item)
       .mockReturnValueOnce(0); // item index

      const question = generateQuizQuestion('sobrevivencia', 60);
      expect(question.type).toBe('regra_simples');
   });
  });
});
