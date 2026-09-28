const fs = require('fs');
const path = require('path');
const https = require('https');

const TOKEN_FILE = path.resolve(__dirname, '../.antigravity/jules-token.txt');
const JULES_TOKEN = process.env.JULES_API_KEY || (fs.existsSync(TOKEN_FILE) ? fs.readFileSync(TOKEN_FILE, 'utf8').trim() : '');
const QUOTA_FILE = path.resolve(__dirname, '../.antigravity/jules-quota.json');

const tasks = [
  {
    id: 'SUGG-1-SECURITY',
    role: 'Função 5: Guardiã de Segurança (Sentinel 🛡️)',
    title: 'Security: Insecure UUID Generation Fallback in QuizGenerator',
    prompt: `Ticket Determinístico — Security (Função 5 Jules AI):
1. Sintoma Observável: Em src/core/math/quizGenerator.ts na linha 127, o identificador de pergunta utiliza como fallback 'Math.random().toString(36).slice(2, 7)' caso 'globalThis.crypto?.randomUUID' não esteja disponível. O uso de Math.random() não é criptograficamente seguro e pode gerar colisões previsíveis.
2. Localização Provável: src/core/math/quizGenerator.ts
3. Critérios de Aceite:
   - Substituir o fallback baseado em Math.random() por um fallback seguro utilizando crypto.getRandomValues ou um gerador determinístico seguro sem comprometer a entropia.
   - Manter a assinatura do gerador de questões e garantir que 100% dos testes em src/tests/quizGenerator.test.ts continuem passando.
4. Comando de Verificação:
   npx vitest run src/tests/quizGenerator.test.ts && npm run lint`,
    targetFiles: ['src/core/math/quizGenerator.ts']
  },
  {
    id: 'SUGG-2-PERFORMANCE',
    role: 'Função 5: Otimizadora de Performance (Bolt ⚡)',
    title: 'Performance: Redundant Inline Array Initialization in PhysicsChart.tsx',
    prompt: `Ticket Determinístico — Performance (Função 5 Jules AI):
1. Sintoma Observável: Em src/presentation/components/PhysicsChart.tsx, arrays literais como '[0, 0.25, 0.5, 0.75, 1]' e outros arrays de proporções de grade são recriados e alocados a cada ciclo de renderização dos gráficos de física dentro do corpo dos componentes SVG.
2. Localização Provável: src/presentation/components/PhysicsChart.tsx
3. Critérios de Aceite:
   - Extrair arrays estáticos constantes (como proporções de grade e divisores de eixos) para constantes fora do componente PhysicsChart (ex: GRID_RATIOS).
   - Evitar alocações desnecessárias no garbage collector a cada re-render para manter 60 FPS consistentes.
   - Preservar integralmente o desenho visual dos 5 tipos de gráficos SVG de física.
4. Comando de Verificação:
   npm run build && npm run lint`,
    targetFiles: ['src/presentation/components/PhysicsChart.tsx']
  },
  {
    id: 'SUGG-3-CODE-HEALTH',
    role: 'Função 3: Higiene de Código & Tipagem Estrita (Code Hygiene)',
    title: 'Code Health: Use of any type for activeResult in PhysicsModule',
    prompt: `Ticket Determinístico — Code Health & Strict Typing (Função 3 Jules AI):
1. Sintoma Observável: Em src/presentation/modules/PhysicsModule.tsx na linha 310, o código utiliza 'const anyRes = activeResult as any;' para acessar propriedades calculadas dos motores de física, contornando a checagem de tipos estrita do TypeScript.
2. Localização Provável: src/presentation/modules/PhysicsModule.tsx
3. Critérios de Aceite:
   - Eliminar o cast 'as any' em activeResult.
   - Utilizar as interfaces e tipos discriminados já exportados em src/types/index.ts (ou type guards adequados por 'selectedMode') para acessar as propriedades calculadas com tipagem estrita e segura.
   - Garantir 0 erros de compilação no TypeScript.
4. Comando de Verificação:
   npm run build && npm run lint`,
    targetFiles: ['src/presentation/modules/PhysicsModule.tsx']
  }
];

function createSession(task) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      title: task.title,
      prompt: task.prompt,
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

(async () => {
  console.log(`=== Despachando ${tasks.length} Sugestões Auditadas para a Jules AI ===\n`);
  const dispatched = [];

  for (const task of tasks) {
    console.log(`-> Enviando [${task.id}] ${task.title}...`);
    try {
      const res = await createSession(task);
      if (res.status === 200 || res.status === 201) {
        const sessionId = res.data.name || res.data.id || 'N/A';
        console.log(`   ✅ Sucesso! Sessão criada: ${sessionId}`);
        console.log(`   Estado inicial: ${res.data.state || 'IN_PROGRESS'}\n`);
        dispatched.push({
          task,
          sessionId,
          state: res.data.state || 'IN_PROGRESS'
        });
      } else {
        console.error(`   ❌ Falha ao criar sessão (HTTP ${res.status}):`, res.data);
      }
    } catch (err) {
      console.error(`   ❌ Erro de rede para [${task.id}]:`, err.message);
    }
  }

  if (dispatched.length > 0) {
    updateQuota(dispatched.length);
  }

  fs.writeFileSync(
    path.resolve(__dirname, '../.antigravity/dispatched-suggestions-sessions.json'),
    JSON.stringify(dispatched, null, 2),
    'utf8'
  );
  console.log('=== Despacho concluído com sucesso ===');
})();
