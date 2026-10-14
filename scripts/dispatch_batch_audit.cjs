const fs = require('fs');
const path = require('path');
const https = require('https');

const TOKEN_FILE = path.resolve(__dirname, '../.antigravity/jules-token.txt');
const JULES_TOKEN = process.env.JULES_API_KEY || (fs.existsSync(TOKEN_FILE) ? fs.readFileSync(TOKEN_FILE, 'utf8').trim() : '');
const QUOTA_FILE = path.resolve(__dirname, '../.antigravity/jules-quota.json');

const tickets = [
  {
    id: 'TICKET-1-I18N-LEVELING',
    title: 'i18n & Gamification: Fix corrupted subtitles and level 10 description',
    prompt: `Ticket Determinístico — i18n & Gamificação (Função 4 Jules AI):
1. Sintoma Observável: Em src/core/i18n/translations.ts, as chaves 'hub_blitz_subtitle', 'hub_survival_title' e 'hub_survival_subtitle' possuem textos corrompidos ou em inglês na seção de português (pt). Além disso, em src/core/gamification/leveling.ts, a conquista 'level_10' possui 'descriptionPt' que repete o título ('Mestre dos Números') em vez de descrever o alcance do nível 10 de perfil.
2. Localização Provável: src/core/i18n/translations.ts e src/core/gamification/leveling.ts
3. Critérios de Aceite:
   - Corrigir 'hub_blitz_subtitle' para textos limpos e coerentes em pt e en (ex: treino de cálculo rápido sob pressão).
   - Traduzir 'hub_survival_title' e 'hub_survival_subtitle' corretamente no bloco 'pt'.
   - Atualizar a 'descriptionPt' de 'level_10' para 'Alcançou o Nível 10 de Perfil.'.
   - Preservar 100% de paridade entre dicionários pt e en.
4. Comando de Verificação:
   npx vitest run src/tests/gamification.test.ts && npm run lint`,
    targetFiles: ['src/core/i18n/translations.ts', 'src/core/gamification/leveling.ts']
  },
  {
    id: 'TICKET-2-TAILWIND-BOSS-GLOW',
    title: 'Tailwind v4: Replace dynamic class string concatenation in BossBattle arena glow',
    prompt: `Ticket Determinístico — Tailwind CSS v4 (Função 1 Jules AI):
1. Sintoma Observável: Em src/presentation/components/BossBattle.tsx na área do brilho radial da arena, o gradiente de fundo é montado por concatenação dinâmica de strings ('bg-gradient-to-b from-' + activeBossClassSpec.themeColor + '-500/25 to-transparent'). O compilador do Tailwind CSS v4 exige classes estáticas para extração do CSS.
2. Localização Provável: src/presentation/components/BossBattle.tsx e src/core/quiz/bossClassThemes.ts
3. Critérios de Aceite:
   - Adicionar uma propriedade estática de classe de gradiente (ex: 'radialGlowClass') em cada tema de classe de chefe em bossClassThemes.ts contendo a classe completa do Tailwind (ex: 'bg-gradient-to-b from-rose-500/25 to-transparent', etc.).
   - Utilizar essa classe estática em BossBattle.tsx sem interpolação dinâmica.
4. Comando de Verificação:
   npm run build && npm run lint`,
    targetFiles: ['src/presentation/components/BossBattle.tsx', 'src/core/quiz/bossClassThemes.ts']
  },
  {
    id: 'TICKET-3-SCRATCHPAD-DPR',
    title: 'Canvas: Clamp devicePixelRatio in Scratchpad handlePointerDown',
    prompt: `Ticket Determinístico — Canvas & Performance (Função 5 Jules AI):
1. Sintoma Observável: Em src/presentation/components/Scratchpad.tsx na função handlePointerDown, o cálculo de escala do canvas utiliza 'window.devicePixelRatio || 1' sem o limite de 2 que é adotado em redrawAll e initCanvasSize ('Math.min(window.devicePixelRatio || 1, 2)'), causando desalinhamento do traço em tempo real em dispositivos com DPR alto.
2. Localização Provável: src/presentation/components/Scratchpad.tsx
3. Critérios de Aceite:
   - Alinhar o cálculo de DPR em handlePointerDown para utilizar 'Math.min(window.devicePixelRatio || 1, 2)'.
   - Preservar toda a funcionalidade de desenho da lousa.
4. Comando de Verificação:
   npm run build && npm run lint`,
    targetFiles: ['src/presentation/components/Scratchpad.tsx']
  },
  {
    id: 'TICKET-4-PHOTOMATH-XSS',
    title: 'Security: Sanitize steps rendering in PhotoMathModule',
    prompt: `Ticket Determinístico — Segurança (Função 5 Jules AI):
1. Sintoma Observável: Em src/presentation/modules/PhotoMathModule.tsx, os passos de resolução matemática são renderizados com dangerouslySetInnerHTML contendo a equação editável do usuário interpolada no texto, criando vulnerabilidade potencial de XSS caso tags HTML sejam inseridas.
2. Localização Provável: src/presentation/modules/PhotoMathModule.tsx
3. Critérios de Aceite:
   - Eliminar a injeção direta de HTML não sanitizado.
   - Sanitizar as tags (escapar < e >) antes de formatar em negrito/código ou utilizar renderização segura com componentes React (como StepByStep).
4. Comando de Verificação:
   npm run build && npm run lint`,
    targetFiles: ['src/presentation/modules/PhotoMathModule.tsx']
  },
  {
    id: 'TICKET-5-MATH-BIG-SQRT',
    title: 'Math: Use big.js native sqrt method in Bhaskara and Pitagoras engines',
    prompt: `Ticket Determinístico — Precisão Numérica (Função 2 Jules AI):
1. Sintoma Observável: Em src/core/math/bhaskara.ts e src/core/math/pitagoras.ts, o cálculo da raiz quadrada converte instâncias de Big para float64 ('Math.sqrt(Number(...))') e reconverte para Big, introduzindo imprecisão de ponto flutuante em números de grande magnitude.
2. Localização Provável: src/core/math/bhaskara.ts e src/core/math/pitagoras.ts
3. Critérios de Aceite:
   - Utilizar o método nativo '.sqrt()' fornecido pela biblioteca 'big.js' diretamente sobre as instâncias Big (delta.sqrt(), cSquared.sqrt(), etc.).
   - Garantir que todos os testes matemáticos existentes continuem passando com 100% de sucesso.
4. Comando de Verificação:
   npx vitest run src/tests/bhaskara.test.ts src/tests/pitagoras.test.ts && npm run lint`,
    targetFiles: ['src/core/math/bhaskara.ts', 'src/core/math/pitagoras.ts']
  },
  {
    id: 'TICKET-6-OCR-IMPLICIT-MULT',
    title: 'Math: Support implicit multiplication by parentheses in equationScanner',
    prompt: `Ticket Determinístico — Parser Matemático (Função 2 Jules AI):
1. Sintoma Observável: Em src/core/math/equationScanner.ts na função solveArithmeticExpression e normalizeOcrText, expressões capturadas com multiplicação implícita por parênteses (ex: '15(4 - 2)' ou '(3 + 2)5') falham na resolução ao avaliar a expressão.
2. Localização Provável: src/core/math/equationScanner.ts
3. Critérios de Aceite:
   - Normalizar expressões em normalizeOcrText inserindo o operador explícito '*' entre dígitos e parênteses de abertura ('$1 * (') e entre parênteses de fechamento e dígitos (') * $1').
   - Manter 100% dos testes de scanner passando.
4. Comando de Verificação:
   npx vitest run src/tests/photoMathScanner.test.ts && npm run lint`,
    targetFiles: ['src/core/math/equationScanner.ts']
  },
  {
    id: 'TICKET-7-HISTORY-LABELS',
    title: 'UI: Add correct calculation type labels for Pitagoras and Photo Math in HistoryModule',
    prompt: `Ticket Determinístico — UI & Acessibilidade (Função 1 Jules AI):
1. Sintoma Observável: Em src/presentation/modules/HistoryModule.tsx, os itens de histórico do tipo 'pitagoras' e 'photo_math' aparecem rotulados como 'Regra de Três' devido a uma condição ternária incompleta.
2. Localização Provável: src/presentation/modules/HistoryModule.tsx
3. Critérios de Aceite:
   - Criar um mapeamento explícito para todos os valores de CalculationType ('bhaskara', 'regra_simples', 'regra_composta', 'physics', 'pitagoras', 'photo_math') exibindo o rótulo adequado ('Pitágoras', 'Foto Scanner', etc.).
   - Adicionar os botões de filtro correspondentes na barra de filtros superiores.
4. Comando de Verificação:
   npm run build && npm run lint`,
    targetFiles: ['src/presentation/modules/HistoryModule.tsx']
  },
  {
    id: 'TICKET-8-CLOUD-SYNC-MERGE',
    title: 'Cloud Sync: Preserve all RPG and Physics stats in mergeStates',
    prompt: `Ticket Determinístico — Lógica & Persistência (Função 5 Jules AI):
1. Sintoma Observável: Em src/core/auth/cloudSync.ts, a função mergeStates e a interface QuantoraFullState não preservam campos recentes de estatísticas e RPG (como 'totalPhysics', 'bossTokens', 'bossClearedLevels', 'bossSPlusLevels', 'unlockedBossWeapons'), e a mesclagem de 'tracks' em quizProgress descarta dados remotos se o objeto local estiver com valores padrão.
2. Localização Provável: src/core/auth/cloudSync.ts
3. Critérios de Aceite:
   - Expandir mergeStates para mesclar 'totalPhysics' (maior valor), 'bossTokens' (maior valor), 'bossClearedLevels' (união ordenada sem duplicatas), 'bossSPlusLevels' e 'unlockedBossWeapons'.
   - Mesclar individualmente cada trilha em 'quizProgress.tracks' para preservar o maior progresso entre local e remoto.
   - Atualizar a suíte de testes em src/tests/cloudSync.test.ts cobrindo a nova mesclagem.
4. Comando de Verificação:
   npx vitest run src/tests/cloudSync.test.ts && npm run lint`,
    targetFiles: ['src/core/auth/cloudSync.ts', 'src/tests/cloudSync.test.ts']
  }
];

function createSession(ticket) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      title: ticket.title,
      prompt: ticket.prompt,
      sourceContext: {
        source: 'sources/github/Jklmkii/quantora',
        githubRepoContext: {
          startingBranch: 'main'
        }
      }
    });

    const req = https.request('https://jules.googleapis.com/v1alpha/sessions', {
      method: 'POST',
      headers: {
        'X-Goog-Api-Key': JULES_TOKEN,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function updateQuota(increment) {
  try {
    let quota = { date: new Date().toISOString().slice(0, 10), usedCount: 0, dailyLimit: 100 };
    if (fs.existsSync(QUOTA_FILE)) {
      quota = JSON.parse(fs.readFileSync(QUOTA_FILE, 'utf8'));
      const today = new Date().toISOString().slice(0, 10);
      if (quota.date !== today) {
        quota.date = today;
        quota.usedCount = 0;
      }
    }
    quota.usedCount += increment;
    fs.writeFileSync(QUOTA_FILE, JSON.stringify(quota, null, 2), 'utf8');
    console.log(`[Quota] Atualizada: ${quota.usedCount}/${quota.dailyLimit} utilizadas hoje (${quota.date})`);
  } catch (err) {
    console.error('[Quota Error]', err);
  }
}

async function main() {
  console.log('===============================================================');
  console.log('🚀 DISPARO EM LOTE PARA JULES AI (SEÇÃO 10 GEMINI.MD)');
  console.log('===============================================================');

  const results = [];

  for (const t of tickets) {
    console.log(`\n[Despachando] ${t.id}: ${t.title}`);
    try {
      const res = await createSession(t);
      if (res.status === 200 || res.status === 201) {
        console.log(`  ✅ Sessão criada com sucesso! ID: ${res.data.name || res.data.id || 'OK'}`);
        results.push({ ticket: t.id, status: 'SUCCESS', session: res.data.name || res.data.id });
        updateQuota(1);
      } else {
        console.error(`  ❌ Falha HTTP ${res.status}:`, res.data);
        results.push({ ticket: t.id, status: 'FAILED', error: res.data });
      }
    } catch (e) {
      console.error(`  ❌ Erro de rede:`, e.message);
      results.push({ ticket: t.id, status: 'ERROR', error: e.message });
    }
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log('\n===============================================================');
  console.log('📋 RESUMO DE DESPACHO PARA A JULES AI');
  console.log('===============================================================');
  console.table(results);
}

main().catch(console.error);
