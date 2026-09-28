const fs = require('fs');
const path = require('path');
const https = require('https');

const TOKEN_FILE = path.resolve(__dirname, '../.antigravity/jules-token.txt');
const JULES_TOKEN = process.env.JULES_API_KEY || (fs.existsSync(TOKEN_FILE) ? fs.readFileSync(TOKEN_FILE, 'utf8').trim() : '');
const QUOTA_FILE = path.resolve(__dirname, '../.antigravity/jules-quota.json');


const tasks = [
  {
    id: 'TASK-A',
    role: 'Função 2: Engenheira de Testes (Test Coverage Guardian)',
    title: 'Test Coverage: Expand audio.test.ts for playHubSwipe()',
    prompt: `Ticket Determinístico — Test Coverage (Função 2 Jules AI):
1. Sintoma Observável: A função playHubSwipe() foi implementada em src/core/platform/audio.ts para síntese sonora de navegação do Hub, mas ainda não possui cobertura de testes unitários na suíte src/tests/audio.test.ts.
2. Localização Provável: src/tests/audio.test.ts
3. Critérios de Aceite:
   - Adicionar teste verificando que playHubSwipe() é exportada e executa sem lançar exceções em ambiente de teste (not.toThrow()).
   - Adicionar teste verificando que playHubSwipe() respeita soundEnabled = false da store Zustand suprimindo a execução.
4. Comando de Verificação:
   npx vitest run src/tests/audio.test.ts && npm run lint`,
    targetFiles: ['src/tests/audio.test.ts']
  },
  {
    id: 'TASK-B',
    role: 'Função 1: Guardiã de Acessibilidade & Semântica (Palette / A11y)',
    title: 'A11y Audit: Add ARIA semantics and labels in CosmicHub.tsx',
    prompt: `Ticket Determinístico — A11y Audit (Função 1 Jules AI):
1. Sintoma Observável: Os botões de navegação, controles laterais (como voltar ao início e botão de configurações) e os cards do carrossel em src/presentation/components/CosmicHub.tsx necessitam de atributos ARIA explícitos (aria-label, role="region" ou role="tablist", aria-selected) para conformidade com acessibilidade WCAG AAA e leitores de tela.
2. Localização Provável: src/presentation/components/CosmicHub.tsx
3. Critérios de Aceite:
   - Adicionar aria-label descritivo nos botões de ícone (ex: botão de voltar ao início e botão de configurações).
   - Indicar role semântico no container do carrossel e aria-selected no card ativo.
   - Manter 100% intacta a funcionalidade visual, o drag-to-scroll e os efeitos sonoros existentes.
4. Comando de Verificação:
   npm run build && npm run lint`,
    targetFiles: ['src/presentation/components/CosmicHub.tsx']
  },
  {
    id: 'TASK-C',
    role: 'Função 4: Especialista em Internacionalização (i18n Specialist)',
    title: 'i18n Parity: Audit and synchronize translations.ts',
    prompt: `Ticket Determinístico — i18n Specialist (Função 4 Jules AI):
1. Sintoma Observável: O dicionário de traduções em src/core/i18n/translations.ts precisa de uma auditoria de paridade estrita de 100% entre os idiomas Português (pt) e Inglês (en), assegurando que novos termos e descrições do Hub possuam correspondência exata sem chaves faltantes.
2. Localização Provável: src/core/i18n/translations.ts
3. Critérios de Aceite:
   - Auditar as interfaces e os objetos de tradução pt e en garantindo paridade completa de chaves.
   - Corrigir qualquer chave ausente ou divergência de tipos.
4. Comando de Verificação:
   npm run build && npm run lint`,
    targetFiles: ['src/core/i18n/translations.ts']
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
  } catch {
    console.error('[Quota Error]', err);
  }
}

(async () => {
  console.log(`=== Despachando ${tasks.length} Tarefas Determinísticas para a Jules AI ===\n`);
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
    } catch {
      console.error(`   ❌ Erro de rede para [${task.id}]:`, err.message);
    }
  }

  if (dispatched.length > 0) {
    updateQuota(dispatched.length);
  }

  fs.writeFileSync(
    path.resolve(__dirname, '../.antigravity/dispatched-jules-sessions.json'),
    JSON.stringify(dispatched, null, 2),
    'utf8'
  );
  console.log('=== Despacho concluído com sucesso ===');
})();
