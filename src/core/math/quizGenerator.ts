import Big from 'big.js';
import type { QuizQuestion, QuizTrack, QuizTrackSelector, SpacedCard } from '../../types';
import { calculateRegraDeTresSimples } from './regraDeTresSimples';
import { formatNumberSmart } from './precision';

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Divisores que garantem dízimas finitas (fatores primos apenas 2 e 5)
const FINITE_DECIMAL_DIVISORS_1_DECIMAL = [2, 5, 10];
const FINITE_DECIMAL_DIVISORS_2_DECIMALS = [4, 20, 25, 50];

export function generateQuizQuestionFromCard(
  card: SpacedCard,
  countNumber: number = 1
): QuizQuestion {
  const id = `spaced_${card.id}_${Date.now()}`;
  const [a, b] = card.operands;
  const track = card.track;

  let questionText = 'Resolva o cálculo mental:';
  let displayExpression = '';
  let correctAnswer = 0;
  let formattedCorrectAnswer = '';
  let explanation: string[] = [];

  switch (track) {
    case 'soma': {
      questionText = 'Resolva a soma (Fixação):';
      displayExpression = `${a} + ${b}`;
      correctAnswer = a + b;
      formattedCorrectAnswer = correctAnswer.toString();
      explanation = [
        `Fixação Ativa: ${a} + ${b}`,
        `Decomposição: ${Math.floor(a / 10) * 10} + ${Math.floor(b / 10) * 10} = ${Math.floor(a / 10) * 10 + Math.floor(b / 10) * 10}`,
        `Unidades: ${a % 10} + ${b % 10} = ${(a % 10) + (b % 10)}`,
        `Resultado final: ${correctAnswer}`,
      ];
      break;
    }
    case 'subtracao': {
      questionText = 'Resolva a subtração (Fixação):';
      displayExpression = `${a} - ${b}`;
      correctAnswer = a - b;
      formattedCorrectAnswer = correctAnswer.toString();
      explanation = [
        `Fixação Ativa: ${a} - ${b}`,
        `Resultado final: ${correctAnswer}`,
      ];
      break;
    }
    case 'multiplicacao': {
      questionText = 'Multiplicação mental (Fixação):';
      displayExpression = `${a} × ${b}`;
      correctAnswer = a * b;
      formattedCorrectAnswer = correctAnswer.toString();
      explanation = [
        `Fixação Ativa: ${a} × ${b}`,
        `Resultado: ${correctAnswer}`,
      ];
      break;
    }
    case 'divisao': {
      questionText = 'Divisão mental (Fixação):';
      displayExpression = `${a} ÷ ${b}`;
      correctAnswer = a / b;
      formattedCorrectAnswer = formatNumberSmart(new Big(correctAnswer), 2, ',');
      explanation = [
        `Fixação Ativa: ${a} ÷ ${b}`,
        `Resultado: ${formattedCorrectAnswer}`,
      ];
      break;
    }
    default: {
      questionText = 'Resolva a operação:';
      displayExpression = `${a} + ${b}`;
      correctAnswer = a + b;
      formattedCorrectAnswer = correctAnswer.toString();
      explanation = [`Resultado: ${correctAnswer}`];
    }
  }

  return {
    id,
    type: track,
    countNumber,
    totalGoal: 200,
    question: questionText,
    displayExpression,
    correctAnswer,
    formattedCorrectAnswer,
    explanation,
    isSpacedReview: true,
    spacedBox: card.box,
    spacedCardId: card.id,
    operands: [a, b],
  };
}

export function generateQuizQuestion(
  trackSelector: QuizTrackSelector = 'sobrevivencia',
  countNumber: number = 1,
  dueCard?: SpacedCard
): QuizQuestion {
  if (dueCard) {
    return generateQuizQuestionFromCard(dueCard, countNumber);
  }
  let track: QuizTrack;

  if (trackSelector === 'sobrevivencia') {
    if (countNumber <= 20) {
      track = pickRandom(['soma', 'subtracao']);
    } else if (countNumber <= 50) {
      track = pickRandom(['soma', 'subtracao', 'multiplicacao', 'divisao']);
    } else {
      track = pickRandom(['soma', 'subtracao', 'multiplicacao', 'divisao', 'regra_simples']);
    }
  } else {
    track = trackSelector;
  }

  const id = `q_${Date.now()}_${globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2, 7)}`;
  const totalGoal = 200;

  switch (track) {
    case 'soma': {
      // Dificuldade progressiva baseada em countNumber
      if (countNumber <= 20) {
        // 2 números de 1 a 2 dígitos
        const a = getRandomInt(5, 50);
        const b = getRandomInt(3, 30);
        const correct = a + b;
        return {
          id,
          type: 'soma',
          countNumber,
          totalGoal,
          question: 'Resolva a soma:',
          displayExpression: `${a} + ${b}`,
          correctAnswer: correct,
          formattedCorrectAnswer: correct.toString(),
          explanation: [
            `Equação: ${a} + ${b}`,
            `Decomposição: ${Math.floor(a / 10) * 10} + ${Math.floor(b / 10) * 10} = ${Math.floor(a / 10) * 10 + Math.floor(b / 10) * 10}`,
            `Unidades: ${a % 10} + ${b % 10} = ${(a % 10) + (b % 10)}`,
            `Resultado final: ${correct}`,
          ],
          operands: [a, b],
        };
      } else if (countNumber <= 50) {
        // 3 números (como na referência: 200 + 180 + 59) ou 2 números de centenas
        if (Math.random() > 0.4) {
          const a = getRandomInt(10, 30) * 10;
          const b = getRandomInt(5, 20) * 10;
          const c = getRandomInt(11, 89);
          const correct = a + b + c;
          return {
            id,
            type: 'soma',
            countNumber,
            totalGoal,
            question: 'Resolva a soma de 3 termos:',
            displayExpression: `${a} + ${b} + ${c}`,
            correctAnswer: correct,
            formattedCorrectAnswer: correct.toString(),
            explanation: [
              `Passo 1: some os dois primeiros termos: ${a} + ${b} = ${a + b}`,
              `Passo 2: adicione o terceiro termo: ${a + b} + ${c} = ${correct}`,
            ],
          };
        } else {
          const a = getRandomInt(50, 450);
          const b = getRandomInt(50, 450);
          const correct = a + b;
          return {
            id,
            type: 'soma',
            countNumber,
            totalGoal,
            question: 'Resolva a soma:',
            displayExpression: `${a} + ${b}`,
            correctAnswer: correct,
            formattedCorrectAnswer: correct.toString(),
            explanation: [
              `Equação: ${a} + ${b}`,
              `Centenas: ${Math.floor(a / 100) * 100} + ${Math.floor(b / 100) * 100} = ${Math.floor(a / 100) * 100 + Math.floor(b / 100) * 100}`,
              `Dezenas e unidades: ${a % 100} + ${b % 100} = ${(a % 100) + (b % 100)}`,
              `Resultado: ${correct}`,
            ],
            operands: [a, b],
          };
        }
      } else if (countNumber <= 100) {
        // Centenas maiores com 3 parcelas
        const a = getRandomInt(100, 500);
        const b = getRandomInt(50, 400);
        const c = getRandomInt(20, 200);
        const correct = a + b + c;
        return {
          id,
          type: 'soma',
          countNumber,
          totalGoal,
          question: 'Resolva a soma:',
          displayExpression: `${a} + ${b} + ${c}`,
          correctAnswer: correct,
          formattedCorrectAnswer: correct.toString(),
          explanation: [
            `${a} + ${b} = ${a + b}`,
            `${a + b} + ${c} = ${correct}`,
          ],
        };
      } else {
        // Decimais finitos (1 ou 2 casas)
        const aInt = getRandomInt(15, 120);
        const bInt = getRandomInt(10, 80);
        const aBig = new Big(aInt).div(10);
        const bBig = new Big(bInt).div(10);
        const correctBig = aBig.plus(bBig);
        const correct = correctBig.toNumber();
        const aStr = formatNumberSmart(aBig, 2, ',');
        const bStr = formatNumberSmart(bBig, 2, ',');
        const correctStr = formatNumberSmart(correctBig, 2, ',');

        return {
          id,
          type: 'soma',
          countNumber,
          totalGoal,
          question: 'Resolva a soma com decimais:',
          displayExpression: `${aStr} + ${bStr}`,
          correctAnswer: correct,
          formattedCorrectAnswer: correctStr,
          explanation: [
            `Alinhando as vírgulas: ${aStr} + ${bStr}`,
            `Resultado: ${correctStr}`,
          ],
        };
      }
    }

    case 'subtracao': {
      if (countNumber <= 20) {
        // Minuendo >= Subtraendo (resultado positivo)
        const b = getRandomInt(5, 40);
        const a = b + getRandomInt(4, 50);
        const correct = a - b;
        return {
          id,
          type: 'subtracao',
          countNumber,
          totalGoal,
          question: 'Resolva a subtração:',
          displayExpression: `${a} - ${b}`,
          correctAnswer: correct,
          formattedCorrectAnswer: correct.toString(),
          explanation: [
            `Subtração: ${a} - ${b}`,
            `Decompondo: ${a} - ${Math.floor(b / 10) * 10} = ${a - Math.floor(b / 10) * 10}`,
            `${a - Math.floor(b / 10) * 10} - ${b % 10} = ${correct}`,
          ],
          operands: [a, b],
        };
      } else if (countNumber <= 70) {
        // Números maiores de 2 a 3 dígitos (resultado positivo)
        const b = getRandomInt(30, 250);
        const a = b + getRandomInt(25, 350);
        const correct = a - b;
        return {
          id,
          type: 'subtracao',
          countNumber,
          totalGoal,
          question: 'Resolva a subtração:',
          displayExpression: `${a} - ${b}`,
          correctAnswer: correct,
          formattedCorrectAnswer: correct.toString(),
          explanation: [
            `Subtração: ${a} - ${b}`,
            `Resultado: ${correct}`,
          ],
          operands: [a, b],
        };
      } else if (countNumber <= 110) {
        // Permite resultados negativos (a < b)
        const a = getRandomInt(20, 100);
        const b = a + getRandomInt(15, 80);
        const correct = a - b;
        return {
          id,
          type: 'subtracao',
          countNumber,
          totalGoal,
          question: 'Resolva a subtração com resultado negativo:',
          displayExpression: `${a} - ${b}`,
          correctAnswer: correct,
          formattedCorrectAnswer: correct.toString(),
          explanation: [
            `Como ${a} é menor que ${b}, o resultado é negativo.`,
            `-(${b} - ${a}) = -${b - a} = ${correct}`,
          ],
          operands: [a, b],
        };
      } else {
        // Decimais finitos
        const aInt = getRandomInt(30, 150);
        const bInt = getRandomInt(10, aInt - 5);
        const aBig = new Big(aInt).div(10);
        const bBig = new Big(bInt).div(10);
        const correctBig = aBig.minus(bBig);
        const correct = correctBig.toNumber();
        const aStr = formatNumberSmart(aBig, 2, ',');
        const bStr = formatNumberSmart(bBig, 2, ',');
        const correctStr = formatNumberSmart(correctBig, 2, ',');

        return {
          id,
          type: 'subtracao',
          countNumber,
          totalGoal,
          question: 'Resolva a subtração decimal:',
          displayExpression: `${aStr} - ${bStr}`,
          correctAnswer: correct,
          formattedCorrectAnswer: correctStr,
          explanation: [
            `Alinhando as casas decimais: ${aStr} - ${bStr}`,
            `Resultado: ${correctStr}`,
          ],
          operands: [aInt, bInt],
        };
      }
    }

    case 'multiplicacao': {
      if (countNumber <= 30) {
        // Tabuada clássica (2x2 até 10x10)
        const a = getRandomInt(2, 10);
        const b = getRandomInt(3, 10);
        const correct = a * b;
        return {
          id,
          type: 'multiplicacao',
          countNumber,
          totalGoal,
          question: 'Multiplicação mental:',
          displayExpression: `${a} × ${b}`,
          correctAnswer: correct,
          formattedCorrectAnswer: correct.toString(),
          explanation: [
            `Tabuada: ${a} × ${b} = ${correct}`,
          ],
          operands: [a, b],
        };
      } else if (countNumber <= 80) {
        // Fator de 2 dígitos por 1 dígito (ex: 14x7, 25x6, 36x4)
        const a = getRandomInt(11, 45);
        const b = getRandomInt(3, 9);
        const correct = a * b;
        const tens = Math.floor(a / 10) * 10;
        const units = a % 10;
        return {
          id,
          type: 'multiplicacao',
          countNumber,
          totalGoal,
          question: 'Multiplicação ágil:',
          displayExpression: `${a} × ${b}`,
          correctAnswer: correct,
          formattedCorrectAnswer: correct.toString(),
          explanation: [
            `Propriedade distributiva: (${tens} + ${units}) × ${b}`,
            `${tens} × ${b} = ${tens * b}`,
            `${units} × ${b} = ${units * b}`,
            `${tens * b} + ${units * b} = ${correct}`,
          ],
          operands: [a, b],
        };
      } else if (countNumber <= 130) {
        // Decimal simples por inteiro (ex: 2,5 x 8 = 20 ou 1,5 x 12 = 18)
        const base = pickRandom([1.5, 2.5, 3.5, 4.5, 0.5]);
        const mult = getRandomInt(2, 16) * 2; // número par facilita decimal .5
        const correctBig = new Big(base).times(mult);
        const correct = correctBig.toNumber();
        const baseStr = formatNumberSmart(new Big(base), 2, ',');
        const correctStr = formatNumberSmart(correctBig, 2, ',');

        return {
          id,
          type: 'multiplicacao',
          countNumber,
          totalGoal,
          question: 'Multiplicação com decimal:',
          displayExpression: `${baseStr} × ${mult}`,
          correctAnswer: correct,
          formattedCorrectAnswer: correctStr,
          explanation: [
            `Cálculo mental: ${baseStr} é metade de ${base * 2}`,
            `Ou multiplique por ${base}: (${Math.floor(base)} × ${mult}) + (0,5 × ${mult})`,
            `${Math.floor(base) * mult} + ${0.5 * mult} = ${correctStr}`,
          ],
          operands: [base, mult],
        };
      } else {
        // 2 dígitos x 2 dígitos (ex: 14 x 15, 12 x 18, 25 x 16)
        const a = getRandomInt(11, 25);
        const b = getRandomInt(11, 20);
        const correct = a * b;
        return {
          id,
          type: 'multiplicacao',
          countNumber,
          totalGoal,
          question: 'Multiplicação de 2 dígitos:',
          displayExpression: `${a} × ${b}`,
          correctAnswer: correct,
          formattedCorrectAnswer: correct.toString(),
          explanation: [
            `${a} × ${b} = ${a} × 10 + ${a} × ${b - 10}`,
            `${a * 10} + ${a * (b - 10)} = ${correct}`,
          ],
          operands: [a, b],
        };
      }
    }

    case 'divisao': {
      if (countNumber <= 30) {
        // Divisões exatas de tabuada (ex: 56 ÷ 8, 45 ÷ 9, 36 ÷ 6)
        const b = getRandomInt(2, 9);
        const correct = getRandomInt(2, 10);
        const a = b * correct;
        return {
          id,
          type: 'divisao',
          countNumber,
          totalGoal,
          question: 'Divisão exata:',
          displayExpression: `${a} ÷ ${b}`,
          correctAnswer: correct,
          formattedCorrectAnswer: correct.toString(),
          explanation: [
            `Operação inversa: que número vezes ${b} resulta em ${a}?`,
            `${b} × ${correct} = ${a}`,
            `Portanto, ${a} ÷ ${b} = ${correct}`,
          ],
          operands: [a, b],
        };
      } else if (countNumber <= 80) {
        // Divisões exatas maiores (ex: 335 ÷ 5 = 67, 144 ÷ 12 = 12, 192 ÷ 6 = 32)
        const b = pickRandom([3, 4, 5, 6, 7, 8, 9, 12, 15]);
        const correct = getRandomInt(12, 75);
        const a = b * correct;
        return {
          id,
          type: 'divisao',
          countNumber,
          totalGoal,
          question: 'Divisão exata rápida:',
          displayExpression: `${a} ÷ ${b}`,
          correctAnswer: correct,
          formattedCorrectAnswer: correct.toString(),
          explanation: [
            `Divisão de ${a} por ${b}:`,
            `${a} = ${b * Math.floor(correct / 10) * 10} + ${b * (correct % 10)}`,
            `Resultado: ${correct}`,
          ],
          operands: [a, b],
        };
      } else {
        // Divisões com resultado decimal finito (divisores: 2, 4, 5, 10, 20, 25)
        const b = countNumber <= 140
          ? pickRandom(FINITE_DECIMAL_DIVISORS_1_DECIMAL)
          : pickRandom(FINITE_DECIMAL_DIVISORS_2_DECIMALS);
        
        // Garante que a não é múltiplo exato de b para produzir decimal interessante
        let a = getRandomInt(15, 150);
        if (a % b === 0) a += 1;

        const correctBig = new Big(a).div(b);
        const correct = correctBig.toNumber();
        const correctStr = formatNumberSmart(correctBig, 4, ',');

        return {
          id,
          type: 'divisao',
          countNumber,
          totalGoal,
          question: 'Divisão com resultado decimal finito:',
          displayExpression: `${a} ÷ ${b}`,
          correctAnswer: correct,
          formattedCorrectAnswer: correctStr,
          explanation: [
            `${a} dividido por ${b}:`,
            `Parte inteira: ${Math.floor(a / b)} (resto ${a % b})`,
            `Adicionando casas decimais: ${(a % b) * 10} / ${b}`,
            `Resultado exato: ${correctStr}`,
          ],
          operands: [a, b],
        };
      }
    }

    case 'regra_simples': {
      // Cenários variados e didáticos
      const scenarios = [
        {
          template: (p1: number, v1: number, p2: number) =>
            `Se ${p1} operários constroem um muro em ${v1} dias, quantos dias levarão ${p2} operários?`,
          type: 'inverse' as const,
          colA: 'Operários',
          colB: 'Dias',
          p1: 4,
          v1: 6,
          p2: 8, // (4*6)/8 = 3
        },
        {
          template: (p1: number, v1: number, p2: number) =>
            `Um carro a ${p1} km/h faz um trajeto em ${v1} horas. A ${p2} km/h, fará em quantas horas?`,
          type: 'inverse' as const,
          colA: 'Velocidade',
          colB: 'Horas',
          p1: 60,
          v1: 4,
          p2: 80, // (60*4)/80 = 3
        },
        {
          template: (p1: number, v1: number, p2: number) =>
            `Se ${p1} cadernos custam R$ ${v1}, quanto custarão ${p2} cadernos?`,
          type: 'direct' as const,
          colA: 'Cadernos',
          colB: 'Preço',
          p1: 3,
          v1: 15,
          p2: 7, // (7*15)/3 = 35
        },
        {
          template: (p1: number, v1: number, p2: number) =>
            `Uma impressora imprime ${p1} páginas em ${v1} minutos. Quantas páginas imprimirá em ${p2} minutos?`,
          type: 'direct' as const,
          colA: 'Páginas',
          colB: 'Minutos',
          p1: 40,
          v1: 10,
          p2: 25, // (40*25)/10 = 100
        },
        {
          template: (p1: number, v1: number, p2: number) =>
            `Um veículo consome ${v1} litros de combustível para percorrer ${p1} km. Quantos litros gastará em ${p2} km?`,
          type: 'direct' as const,
          colA: 'Distância (km)',
          colB: 'Litros',
          p1: 100,
          v1: 8,
          p2: 250, // (250*8)/100 = 20
        },
      ];

      const item = pickRandom(scenarios);
      const res = calculateRegraDeTresSimples({
        a1: item.p1.toString(),
        b1: item.v1.toString(),
        a2: item.p2.toString(),
        b2: '',
        unknownPos: 'b2',
        type: item.type,
        labelA: item.colA,
        labelB: item.colB,
      });

      const correct = res.x;
      const correctStr = formatNumberSmart(new Big(correct), 2, ',');

      return {
        id,
        type: 'regra_simples',
        countNumber,
        totalGoal,
        question: item.template(item.p1, item.v1, item.p2),
        displayExpression: `${item.colA}: ${item.p1} → ${item.p2} | ${item.colB}: ${item.v1} → ?`,
        context: item.type === 'direct' ? 'Proporção Direta' : 'Proporção Inversa',
        correctAnswer: correct,
        formattedCorrectAnswer: correctStr,
        explanation: res.steps,
      };
    }
  }
}
