import Big from 'big.js';
import type { MRUVInput, MRUVResult, TemporalChartData } from '../../types';
import { formatNumberSmart, parseBig } from '../math/precision';
import type { PhysicsCalculationOptions } from './physicsUtils';
import { safeSqrt } from './physicsUtils';

/**
 * Movimento Retilíneo Uniformemente Variado (MRUV) & Equação de Torricelli
 */
export function calculateMRUV(
  input: MRUVInput,
  options: PhysicsCalculationOptions = {}
): MRUVResult {
  const decimals = options.decimals ?? 2;
  const separator = options.separator ?? ',';
  const { subMode, unknown } = input;

  let bigS0 = input.s0 !== undefined && input.s0 !== '' ? parseBig(input.s0) : new Big(0);
  let bigV0 = input.v0 !== undefined && input.v0 !== '' ? parseBig(input.v0) : new Big(0);
  let bigA = input.a !== undefined && input.a !== '' ? parseBig(input.a) : new Big(0);
  let bigT: Big | undefined = input.t !== undefined && input.t !== '' ? parseBig(input.t) : undefined;
  let bigS: Big | undefined = input.s !== undefined && input.s !== '' ? parseBig(input.s) : undefined;
  let bigV: Big | undefined = input.v !== undefined && input.v !== '' ? parseBig(input.v) : undefined;
  let bigDeltaS: Big | undefined = input.deltaS !== undefined && input.deltaS !== '' ? parseBig(input.deltaS) : undefined;

  const steps: string[] = [];

  if (subMode === 'horaria') {
    steps.push('**Movimento Retilíneo Uniformemente Variado (MRUV) — Funções Horárias**');

    switch (unknown) {
      case 's': {
        if (input.t === undefined || input.t === '') {
          throw new Error('Parâmetro ausente: informe o tempo (t) para calcular a posição final (S).');
        }
        bigT = parseBig(input.t);

        steps.push(
          `1. **Identificação dos Dados Fornecidos:**\n` +
            `   • Posição inicial (S₀) = **${formatNumberSmart(bigS0, decimals, separator)} m**\n` +
            `   • Velocidade inicial (v₀) = **${formatNumberSmart(bigV0, decimals, separator)} m/s**\n` +
            `   • Aceleração (a) = **${formatNumberSmart(bigA, decimals, separator)} m/s²**\n` +
            `   • Tempo (t) = **${formatNumberSmart(bigT, decimals, separator)} s**`
        );

        steps.push(
          `2. **Função Horária da Posição:**\n` +
            `   **S(t) = S₀ + v₀ · t + ½ · a · t²**`
        );

        const v0t = bigV0.times(bigT);
        const halfAt2 = bigA.times(bigT).times(bigT).times(0.5);
        bigS = bigS0.plus(v0t).plus(halfAt2);
        bigDeltaS = bigS.minus(bigS0);
        bigV = bigV0.plus(bigA.times(bigT));

        steps.push(
          `3. **Substituição e Resolução Numérica:**\n` +
            `   S = ${formatNumberSmart(bigS0, decimals, separator)} + (${formatNumberSmart(bigV0, decimals, separator)} · ${formatNumberSmart(bigT, decimals, separator)}) + ½ · (${formatNumberSmart(bigA, decimals, separator)}) · (${formatNumberSmart(bigT, decimals, separator)})²\n` +
            `   S = ${formatNumberSmart(bigS0, decimals, separator)} + (${formatNumberSmart(v0t, decimals, separator)}) + (${formatNumberSmart(halfAt2, decimals, separator)})\n` +
            `   **S = ${formatNumberSmart(bigS, decimals, separator)} m**\n` +
            `   Velocidade no instante t: **v = v₀ + a · t = ${formatNumberSmart(bigV, decimals, separator)} m/s**`
        );
        break;
      }

      case 'v': {
        if (input.t === undefined || input.t === '') {
          throw new Error('Parâmetro ausente: informe o tempo (t) para calcular a velocidade final (v).');
        }
        bigT = parseBig(input.t);

        steps.push(
          `1. **Identificação dos Dados Fornecidos:**\n` +
            `   • Velocidade inicial (v₀) = **${formatNumberSmart(bigV0, decimals, separator)} m/s**\n` +
            `   • Aceleração (a) = **${formatNumberSmart(bigA, decimals, separator)} m/s²**\n` +
            `   • Tempo (t) = **${formatNumberSmart(bigT, decimals, separator)} s**`
        );

        steps.push(
          `2. **Função Horária da Velocidade:**\n` +
            `   **v(t) = v₀ + a · t**`
        );

        const at = bigA.times(bigT);
        bigV = bigV0.plus(at);

        const v0t = bigV0.times(bigT);
        const halfAt2 = bigA.times(bigT).times(bigT).times(0.5);
        bigS = bigS0.plus(v0t).plus(halfAt2);
        bigDeltaS = bigS.minus(bigS0);

        steps.push(
          `3. **Substituição e Resolução Numérica:**\n` +
            `   v = ${formatNumberSmart(bigV0, decimals, separator)} + (${formatNumberSmart(bigA, decimals, separator)} · ${formatNumberSmart(bigT, decimals, separator)})\n` +
            `   v = ${formatNumberSmart(bigV0, decimals, separator)} + (${formatNumberSmart(at, decimals, separator)})\n` +
            `   **v = ${formatNumberSmart(bigV, decimals, separator)} m/s**`
        );
        break;
      }

      case 't': {
        if (input.v !== undefined && input.v !== '') {
          bigV = parseBig(input.v);
          if (bigA.eq(0)) {
            throw new Error('Aceleração nula e velocidades distintas no cálculo do tempo.');
          }
          bigT = bigV.minus(bigV0).div(bigA);

          steps.push(
            `1. **Identificação dos Dados Fornecidos:**\n` +
              `   • Velocidade final (v) = **${formatNumberSmart(bigV, decimals, separator)} m/s**\n` +
              `   • Velocidade inicial (v₀) = **${formatNumberSmart(bigV0, decimals, separator)} m/s**\n` +
              `   • Aceleração (a) = **${formatNumberSmart(bigA, decimals, separator)} m/s²**`
          );

          steps.push(
            `2. **Isolamento do Tempo via Função da Velocidade:**\n` +
              `   v = v₀ + a · t  ⟹  **t = (v - v₀) / a**`
          );

          steps.push(
            `3. **Substituição e Resolução Numérica:**\n` +
              `   t = (${formatNumberSmart(bigV, decimals, separator)} - ${formatNumberSmart(bigV0, decimals, separator)}) / ${formatNumberSmart(bigA, decimals, separator)}\n` +
              `   **t = ${formatNumberSmart(bigT, decimals, separator)} s**`
          );

          const v0t = bigV0.times(bigT);
          const halfAt2 = bigA.times(bigT).times(bigT).times(0.5);
          bigS = bigS0.plus(v0t).plus(halfAt2);
          bigDeltaS = bigS.minus(bigS0);
        } else if (input.s !== undefined && input.s !== '') {
          bigS = parseBig(input.s);
          const deltaS = bigS.minus(bigS0);
          bigDeltaS = deltaS;

          if (bigA.eq(0)) {
            if (bigV0.eq(0)) {
              throw new Error('Aceleração e velocidade inicial nulas: impossível determinar o tempo.');
            }
            bigT = deltaS.div(bigV0);
          } else {
            // ½ a t² + v0 t - deltaS = 0
            const aQuad = bigA.times(0.5);
            const bQuad = bigV0;
            const cQuad = deltaS.times(-1);
            const deltaDiscriminant = bQuad.times(bQuad).minus(aQuad.times(cQuad).times(4));

            if (deltaDiscriminant.lt(0)) {
              throw new Error('O móvel nunca atinge a posição solicitada com a aceleração informada.');
            }

            const sqrtDisc = safeSqrt(deltaDiscriminant, 'discriminante');
            const t1 = bQuad.times(-1).plus(sqrtDisc).div(aQuad.times(2));
            const t2 = bQuad.times(-1).minus(sqrtDisc).div(aQuad.times(2));

            // Escolhe a raiz positiva fisicamente plausível
            if (t1.gte(0) && t2.gte(0)) {
              bigT = t1.lt(t2) ? t1 : t2;
            } else if (t1.gte(0)) {
              bigT = t1;
            } else if (t2.gte(0)) {
              bigT = t2;
            } else {
              bigT = t1; // fallback
            }
          }

          bigV = bigV0.plus(bigA.times(bigT));
          steps.push(
            `1. **Cálculo do Tempo a partir da Posição:**\n` +
              `   Equação: ½ · a · t² + v₀ · t - ΔS = 0\n` +
              `   **t = ${formatNumberSmart(bigT, decimals, separator)} s**`
          );
        } else {
          throw new Error('Parâmetro ausente: informe a velocidade final (v) ou a posição (S) para calcular o tempo.');
        }
        break;
      }

      case 'a': {
        if (input.t === undefined || input.t === '') {
          throw new Error('Parâmetro ausente: informe o tempo (t) para calcular a aceleração (a).');
        }
        bigT = parseBig(input.t);
        if (bigT.eq(0)) {
          throw new Error('O tempo decorrido não pode ser zero.');
        }

        if (input.v !== undefined && input.v !== '') {
          bigV = parseBig(input.v);
          bigA = bigV.minus(bigV0).div(bigT);

          steps.push(
            `1. **Cálculo da Aceleração via Velocidade:**\n` +
              `   a = (v - v₀) / t\n` +
              `   a = (${formatNumberSmart(bigV, decimals, separator)} - ${formatNumberSmart(bigV0, decimals, separator)}) / ${formatNumberSmart(bigT, decimals, separator)}\n` +
              `   **a = ${formatNumberSmart(bigA, decimals, separator)} m/s²**`
          );

          const v0t = bigV0.times(bigT);
          const halfAt2 = bigA.times(bigT).times(bigT).times(0.5);
          bigS = bigS0.plus(v0t).plus(halfAt2);
          bigDeltaS = bigS.minus(bigS0);
        } else if (input.s !== undefined && input.s !== '') {
          bigS = parseBig(input.s);
          const deltaS = bigS.minus(bigS0);
          bigDeltaS = deltaS;
          const v0t = bigV0.times(bigT);
          bigA = deltaS.minus(v0t).times(2).div(bigT.times(bigT));
          bigV = bigV0.plus(bigA.times(bigT));

          steps.push(
            `1. **Cálculo da Aceleração via Posição:**\n` +
              `   a = 2 · (ΔS - v₀ · t) / t²\n` +
              `   **a = ${formatNumberSmart(bigA, decimals, separator)} m/s²**`
          );
        } else {
          throw new Error('Parâmetro ausente: informe v ou S para calcular a aceleração.');
        }
        break;
      }

      case 'deltaS': {
        if (input.t === undefined || input.t === '') {
          throw new Error('Parâmetro ausente: informe o tempo (t) para calcular o deslocamento (ΔS).');
        }
        bigT = parseBig(input.t);
        const v0t = bigV0.times(bigT);
        const halfAt2 = bigA.times(bigT).times(bigT).times(0.5);
        bigDeltaS = v0t.plus(halfAt2);
        bigS = bigS0.plus(bigDeltaS);
        bigV = bigV0.plus(bigA.times(bigT));

        steps.push(
          `1. **Deslocamento no MRUV:**\n` +
            `   ΔS = v₀ · t + ½ · a · t²\n` +
            `   **ΔS = ${formatNumberSmart(bigDeltaS, decimals, separator)} m**`
        );
        break;
      }

      default:
        throw new Error(`Incógnita desconhecida no MRUV: "${String(unknown)}".`);
    }
  } else {
    // Equação de Torricelli: v² = v0² + 2 * a * deltaS
    steps.push('**Equação de Torricelli (Sem dependência explícita do tempo)**');
    steps.push('**v² = v₀² + 2 · a · ΔS**');

    switch (unknown) {
      case 'v': {
        if (input.deltaS === undefined || input.deltaS === '') {
          if (input.s !== undefined && input.s !== '') {
            bigDeltaS = parseBig(input.s).minus(bigS0);
          } else {
            throw new Error('Parâmetro ausente: informe o deslocamento (ΔS) para Torricelli.');
          }
        } else {
          bigDeltaS = parseBig(input.deltaS);
        }

        steps.push(
          `1. **Identificação dos Dados:**\n` +
            `   • v₀ = **${formatNumberSmart(bigV0, decimals, separator)} m/s**\n` +
            `   • a = **${formatNumberSmart(bigA, decimals, separator)} m/s²**\n` +
            `   • ΔS = **${formatNumberSmart(bigDeltaS, decimals, separator)} m**`
        );

        const v0Sq = bigV0.times(bigV0);
        const twoADeltaS = bigA.times(bigDeltaS).times(2);
        const vSq = v0Sq.plus(twoADeltaS);

        if (vSq.lt(0)) {
          throw new Error('Radicando de Torricelli negativo: o móvel para antes de atingir o deslocamento informado sob esta aceleração.');
        }

        bigV = safeSqrt(vSq, 'v²');
        if (bigV0.lte(0) && bigA.lt(0) && bigDeltaS.lte(0)) {
          bigV = bigV.times(-1);
        }
        bigS = bigS0.plus(bigDeltaS);

        if (!bigA.eq(0)) {
          bigT = bigV.minus(bigV0).div(bigA).abs();
        }

        steps.push(
          `2. **Aplicação de Torricelli:**\n` +
            `   v² = (${formatNumberSmart(bigV0, decimals, separator)})² + 2 · (${formatNumberSmart(bigA, decimals, separator)}) · (${formatNumberSmart(bigDeltaS, decimals, separator)})\n` +
            `   v² = ${formatNumberSmart(v0Sq, decimals, separator)} + (${formatNumberSmart(twoADeltaS, decimals, separator)})\n` +
            `   v² = ${formatNumberSmart(vSq, decimals, separator)}\n` +
            (bigV.lt(0)
              ? `   **v = -√${formatNumberSmart(vSq, decimals, separator)} = ${formatNumberSmart(bigV, decimals, separator)} m/s** (sentido retrógrado)`
              : `   **v = √${formatNumberSmart(vSq, decimals, separator)} = ${formatNumberSmart(bigV, decimals, separator)} m/s**`)
        );
        break;
      }

      case 'deltaS':
      case 's': {
        if (input.v === undefined || input.v === '') {
          throw new Error('Parâmetro ausente: informe a velocidade final (v) para calcular ΔS por Torricelli.');
        }
        bigV = parseBig(input.v);

        if (bigA.eq(0)) {
          throw new Error('Aceleração nula em Torricelli: use o modelo de MRU para aceleração igual a zero.');
        }

        const vSq = bigV.times(bigV);
        const v0Sq = bigV0.times(bigV0);
        const numerator = vSq.minus(v0Sq);
        const denominator = bigA.times(2);
        bigDeltaS = numerator.div(denominator);
        bigS = bigS0.plus(bigDeltaS);

        bigT = bigV.minus(bigV0).div(bigA).abs();

        steps.push(
          `1. **Isolamento do Deslocamento em Torricelli:**\n` +
            `   ΔS = (v² - v₀²) / (2 · a)\n` +
            `   ΔS = ((${formatNumberSmart(bigV, decimals, separator)})² - (${formatNumberSmart(bigV0, decimals, separator)})²) / (2 · ${formatNumberSmart(bigA, decimals, separator)})\n` +
            `   **ΔS = ${formatNumberSmart(bigDeltaS, decimals, separator)} m**`
        );
        break;
      }

      case 'a': {
        if (input.v === undefined || input.v === '') {
          throw new Error('Parâmetro ausente: informe a velocidade final (v).');
        }
        if (input.deltaS === undefined || input.deltaS === '') {
          if (input.s !== undefined && input.s !== '') {
            bigDeltaS = parseBig(input.s).minus(bigS0);
          } else {
            throw new Error('Parâmetro ausente: informe o deslocamento (ΔS).');
          }
        } else {
          bigDeltaS = parseBig(input.deltaS);
        }

        if (bigDeltaS.eq(0)) {
          throw new Error('Deslocamento nulo: impossível calcular a aceleração por Torricelli com ΔS = 0.');
        }

        bigV = parseBig(input.v);
        const vSq = bigV.times(bigV);
        const v0Sq = bigV0.times(bigV0);
        bigA = vSq.minus(v0Sq).div(bigDeltaS.times(2));
        bigS = bigS0.plus(bigDeltaS);

        if (!bigA.eq(0)) {
          bigT = bigV.minus(bigV0).div(bigA).abs();
        }

        steps.push(
          `1. **Isolamento da Aceleração em Torricelli:**\n` +
            `   a = (v² - v₀²) / (2 · ΔS)\n` +
            `   **a = ${formatNumberSmart(bigA, decimals, separator)} m/s²**`
        );
        break;
      }

      default:
        throw new Error(`Incógnita "${String(unknown)}" não suportada diretamente em Torricelli.`);
    }
  }

  // Ponto de parada / inversão do movimento (quando v = 0)
  let stoppingTime: number | undefined;
  let stoppingDistance: number | undefined;

  if (!bigA.eq(0) && bigV0.times(bigA).lt(0)) {
    const tStop = bigV0.div(bigA).abs();
    const dStop = bigV0.times(bigV0).div(bigA.times(2)).abs();
    stoppingTime = Number(tStop.toString());
    stoppingDistance = Number(dStop.toString());

    steps.push(
      `• **Ponto de Inversão de Sentido:**\n` +
        `  Como a velocidade inicial e a aceleração têm sinais opostos, o móvel desacelera até o repouso instantâneo:\n` +
        `  Instante de parada: **t_parada = ${formatNumberSmart(tStop, decimals, separator)} s**\n` +
        `  Distância percorrida até a parada: **d_parada = ${formatNumberSmart(dStop, decimals, separator)} m**`
    );
  }

  // Classificação do movimento no instante analisado
  let motionClassification = '';
  if (bigA.eq(0)) {
    motionClassification = 'Movimento Uniforme (a = 0)';
  } else {
    const prod = bigV.times(bigA);
    if (prod.gt(0)) {
      motionClassification = 'Movimento Acelerado (|v| aumenta com o tempo)';
    } else if (prod.lt(0)) {
      motionClassification = 'Movimento Retardado (|v| diminui com o tempo)';
    } else {
      motionClassification = 'Inversão de movimento / Parada momentânea (v = 0)';
    }
  }

  steps.push(`• **Classificação:** **${motionClassification}**`);

  // Gera pontos para o gráfico temporal
  const tEnd = bigT && bigT.gt(0) ? Number(bigT.toString()) : 10;
  const maxPlotT = Math.max(tEnd, stoppingTime ? stoppingTime * 1.2 : 5);
  const count = 21;
  const step = maxPlotT / (count - 1);

  const points = [];
  for (let i = 0; i < count; i++) {
    const currentTime = Number((i * step).toFixed(4));
    const currentBigT = new Big(currentTime);
    const pos = Number(
      bigS0
        .plus(bigV0.times(currentBigT))
        .plus(bigA.times(currentBigT).times(currentBigT).times(0.5))
        .toFixed(4)
    );
    const vel = Number(bigV0.plus(bigA.times(currentBigT)).toFixed(4));
    points.push({
      t: currentTime,
      s: pos,
      v: vel,
      a: Number(bigA.toFixed(4)),
    });
  }

  const chartData: TemporalChartData = {
    type: 'temporal',
    points,
    xLabel: 'Tempo (s)',
    yLabel: 'Posição / Velocidade',
  };

  const formattedValues: Record<string, string> = {
    s: formatNumberSmart(bigS ?? 0, decimals, separator),
    s0: formatNumberSmart(bigS0, decimals, separator),
    v0: formatNumberSmart(bigV0, decimals, separator),
    v: formatNumberSmart(bigV ?? 0, decimals, separator),
    a: formatNumberSmart(bigA, decimals, separator),
    t: bigT ? formatNumberSmart(bigT, decimals, separator) : '',
    deltaS: formatNumberSmart(bigDeltaS ?? 0, decimals, separator),
  };

  return {
    mode: 'mruv',
    category: 'cinematica',
    equationTitle: subMode === 'horaria' ? 'MRUV (Funções Horárias)' : 'Equação de Torricelli',
    summary: `v = ${formattedValues.v} m/s | a = ${formattedValues.a} m/s² | S = ${formattedValues.s} m`,
    subMode,
    s0: Number(bigS0.toString()),
    v0: Number(bigV0.toString()),
    a: Number(bigA.toString()),
    t: bigT ? Number(bigT.toString()) : undefined,
    s: bigS ? Number(bigS.toString()) : undefined,
    v: Number(bigV.toString()),
    deltaS: bigDeltaS ? Number(bigDeltaS.toString()) : undefined,
    stoppingTime,
    stoppingDistance,
    formattedValues,
    steps,
    chartData,
  };
}
