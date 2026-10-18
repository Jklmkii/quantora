/**
 * Módulo: equationNormalizer.ts
 * Função pura para higienização e normalização de equações extraídas de OCR
 */

/**
 * Filtra e extrai a linha matemática mais relevante caso o OCR retorne múltiplas linhas
 */
export function extractMathLine(rawText: string): string {
  if (!rawText) return '';

  const lines = rawText
    .split(/[\r\n]+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return '';
  if (lines.length === 1) return lines[0];

  const scored: { line: string; score: number }[] = [];

  for (const rawLine of lines) {
    let score = 0;
    const l = rawLine.toLowerCase();

    // Filtra cabeçalhos da interface se a imagem foi capturada de uma tela
    if (
      l.includes('foto capturada') ||
      l.includes('suporta png') ||
      l.includes('cadernos ou telas') ||
      l.includes('filtro aplicado') ||
      l.includes('equação identificada') ||
      l.includes('resultado oficial') ||
      l.includes('você pode editar') ||
      l.includes('inserir:')
    ) {
      continue;
    }

    // Integral ou derivada: forte indicador de expressão de Cálculo
    if (rawLine.includes('∫') || /\bint\b/i.test(rawLine) || /d[xyzabc]\b/i.test(rawLine)) {
      score += 30;
    }

    // Sinal de igualdade: forte indicador de equação matemática
    if (rawLine.includes('=')) score += 25;

    // Variáveis matemáticas (x, y, z, a, b, c)
    if (/\b[xyzabcXYZABC]\b/.test(rawLine) || /[xyzabcXYZABC][²³^0-9]/.test(rawLine)) score += 15;

    // Expoentes e potências (^2, ², ³, ^)
    if (rawLine.includes('^') || /[²³]/.test(rawLine)) score += 15;

    // Operadores matemáticos (+, -, *, /, ÷, ×)
    const opCount = (rawLine.match(/[+\-*/×÷]/g) || []).length;
    score += opCount * 8;

    // Dígitos numéricos
    const numCount = (rawLine.match(/\d/g) || []).length;
    score += Math.min(numCount * 3, 15);

    // Penaliza palavras com mais de 4 letras sem operadores (exceto sqrt)
    const words = rawLine
      .split(/\s+/)
      .filter((w) => /^[a-zA-Z]{4,}$/.test(w) && w.toLowerCase() !== 'sqrt');
    score -= words.length * 10;

    if (score > 10) {
      scored.push({ line: rawLine, score });
    }
  }

  if (scored.length > 0) {
    scored.sort((a, b) => b.score - a.score);
    return scored[0].line;
  }

  return lines.find((line) => /\d/.test(line) && /[=+\-*/^²³∫]/.test(line)) || lines[0] || '';
}

/**
 * Função pura: recebe a string bruta do OCR e devolve a equação limpa e padronizada
 */
export function normalizeEquation(rawText: string): string {
  if (!rawText) return '';

  // 1. Extrai a melhor linha de equação se houver múltiplas linhas
  let text = extractMathLine(rawText).trim();

  // 2. Normaliza notações de integral (\int, int, símbolo vertical lido como | antes de dx)
  text = text.replace(/\\int\b/gi, '∫');
  text = text.replace(/\bint\s+/gi, '∫ ');
  if (/^[|I/]\s*.*d[xyz]\b/i.test(text)) {
    text = text.replace(/^[|I/]\s*/, '∫ ');
  }

  // 3. Converte travessões e hífens unicode para sinal de menos '-'
  text = text.replace(/[\u2212\u2013\u2014\u2012\u2015]/g, '-');

  // 4. Normaliza operadores de multiplicação e divisão
  text = text.replace(/[×•\u00D7\u22C5\u2219]/g, '*');
  text = text.replace(/[÷\u00F7]/g, '/');

  // 5. Normaliza raiz quadrada unicode
  text = text.replace(/[\u221A√]/g, 'sqrt');

  // 6. Normaliza expoentes sobrescritos unicode (², ³, ⁴, ¹, ⁰)
  text = text.replace(/[²\u00B2]/g, '^2');
  text = text.replace(/[³\u00B3]/g, '^3');
  text = text.replace(/[¹\u00B9]/g, '^1');
  text = text.replace(/[⁰\u2070]/g, '^0');
  text = text.replace(/[⁴\u2074]/g, '^4');

  // 7. Corrige leituras ópticas de integrais onde o 'x' em itálico antes do expoente foi omitido ou lido como 'v' (ex: "∫ 3dx" ou "∫ v3dx" -> "∫ x^3 dx")
  text = text.replace(/∫\s*[vV]?(\d+)\s*d([xyz])\b/g, '∫ $2^$1 d$2');
  text = text.replace(/∫\s*([xyz])(\d+)\s*d([xyz])\b/gi, '∫ $1^$2 d$3');
  text = text.replace(/∫\s*([xyz]\^\d+)\s*d([xyz])\b/gi, '∫ $1 d$2');

  // 8. Converte padrões como x2, x3 ou c2 em x^2, x^3 ou c^2
  text = text.replace(/\b([a-zA-Z])2\b/g, '$1^2');
  text = text.replace(/\b([a-zA-Z])3\b/g, '$1^3');
  text = text.replace(/([a-zA-Z])2(?=[+\-*/=\s]|d[xyz]|$)/g, '$1^2');
  text = text.replace(/([a-zA-Z])3(?=[+\-*/=\s]|d[xyz]|$)/g, '$1^3');

  // 9. Corrige somas de quadrados com expoente 2 colado de caligrafia (ex: 172 + 202 = x2 -> 17^2 + 20^2 = x^2)
  text = text.replace(/(\d{1,3})2\s*\+\s*(\d{1,3})2\s*=\s*([a-zA-Z])\^?2?/g, '$1^2 + $2^2 = $3^2');
  text = text.replace(/([a-zA-Z])\^?2?\s*=\s*(\d{1,3})2\s*\+\s*(\d{1,3})2/g, '$1^2 = $2^2 + $3^2');

  // 10. Troca a letra 'O' ou 'o' por '0' em contextos numéricos e de equações
  text = text.replace(/=\s*[oO]\b/g, '= 0');
  text = text.replace(/\b[oO]\s*=/g, '0 =');
  text = text.replace(/([+\-*/])\s*[oO]\b/g, '$1 0');
  text = text.replace(/\b[oO]\s*([+\-*/])/g, '0 $1');
  text = text.replace(/(\d)[oO]\b/g, '$10');
  text = text.replace(/\b[oO](\d)/g, '0$1');

  // 11. Converte variáveis maiúsculas X para x minúsculo
  text = text.replace(/\bX\b/g, 'x');
  text = text.replace(/(\d)X/g, '$1x');
  text = text.replace(/X(\d)/g, 'x$1');

  // 12. Normaliza duplos sinais de igualdade ou hífens
  text = text.replace(/==/g, '=');
  text = text.replace(/--/g, '+');

  // 13. Remove espaços inválidos e padroniza o espaçamento em torno dos operadores
  text = text.replace(/\s*\^\s*/g, '^');
  text = text.replace(/\s*([=+\-*/])\s*/g, ' $1 ');
  // Restaura sinal de potência negativo (ex: x^-1)
  text = text.replace(/\^\s*-\s*(\d+)/g, '^-$1');
  // Remove sinal de igualdade solto no final de integrais indefinidas (ex: "∫ x^3 dx =")
  if (text.includes('∫')) {
    text = text.replace(/\s*=\s*$/, '');
    text = text.replace(/^∫\s*/, '∫ ');
  }
  text = text.replace(/\(\s+/g, '(');
  text = text.replace(/\s+\)/g, ')');
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}
