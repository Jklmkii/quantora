# GEMINI.md — Regra de Delegação Antigravity ↔ Jules

> Este arquivo consolida e substitui as versões fragmentadas anteriores na pasta `scripts/`:
> `Regra de Delegacao Antigravity-Jules por Complexidade.md` (v1), `(v2).md`, `Correcao v3 -
> Fechando a Brecha do Vault...md`, `Adendo v3 - Verificar Diff Real...md` e `Adendo v4 -
> Proibir Pre-Resolver...md`. Esses cinco arquivos podem ser apagados manualmente da pasta
> `scripts/` após confirmar que este documento está no lugar certo (`GEMINI.md` na raiz do
> projeto) — não consigo apagar por conta própria.

## Por que este arquivo existe
O Antigravity lê regras de duas fontes: `AGENTS.md` (fundação compartilhada entre
ferramentas — inclusive a Jules — prioridade mais baixa) e `GEMINI.md` (específico do
Antigravity, prioridade mais alta, sobrescreve `AGENTS.md` em conflito). Como esta regra rege
exclusivamente o comportamento de orquestração do Antigravity — quando ele delega pra Jules
vs. quando executa sozinho — ela pertence aqui, não no `AGENTS.md`.

O propósito da regra é **poupar a cota/tokens do Antigravity**, usando a cota diária
separada da Jules (100 tarefas/dia) pra trabalho de baixo risco. Qualquer interpretação da
regra que não entregue essa economia de recurso — mesmo que cumpra a letra do processo — está
errada. Isso é testado explicitamente na seção "Teste de Conformidade" abaixo.

---

## 1. Classificação de Complexidade & Perfil Operacional da Jules

| Faixa | Critério Técnico | Aptidão da Jules | Ação de Roteamento |
| :--- | :--- | :--- | :--- |
| **Baixa** | Mudança isolada num único arquivo, sem lógica algorítmica nova: ajuste de CSS/Tailwind, espaçamento, cor, texto/i18n, atributos de acessibilidade ARIA, correção de nome de variável, comentários. | **Excelente (100% autônoma):** Executa com perfeição sem riscos de efeitos colaterais. | **Delegar para a Jules via API** (se cota disponível). |
| **Média** | Função pura nova e testável isoladamente (helper, cálculo matemático, parser), ajuste de componente com lógica simples e escopo delimitado, bug com causa-raiz diagnosticada, criação/expansão de suítes de testes unitários Vitest/Jest, otimizações atômicas de performance (`React.memo`). | **Alta eficácia (escopo fechado):** Brilha em tarefas com critérios de aceite explícitos no estilo "Ticket Jira". | **Delegar para a Jules via API** (se cota disponível). |
| **Média-Alta** | Feature transversal que toca múltiplos arquivos, introdução/modificação de estado na store central (Zustand), mudança de arquitetura de um módulo, componentes com desenho visual complexo (Canvas HTML5 / Gráficos SVG Cartesianos), decisões de design ainda não consolidadas. | **Inadequada (alto risco de degradação):** Jules sofre com perda de contexto em alterações interdependentes e não tem feedback visual para telas ricas. | **Executar localmente (Antigravity)**. Nunca delegar. |
| **Alta** | Mudança em workflows do GitHub Actions, segurança, permissões e segredos, Electron IPC/main process, build nativo/release de executáveis Windows (`.exe`/NSIS) ou Android, tarefas que exigem acesso ao sistema local ou ao cofre Obsidian. | **Incompatível (ambiente isolado):** Jules roda em container Linux na nuvem sem acesso a ferramentas locais, runtime Windows ou vault. | **Executar localmente (Antigravity)**. Nunca delegar. |

### 1.1. Perfil Empírico da Jules AI: Pontos Fortes vs. Limitações Críticas (Grounding da Pesquisa)

#### 🌟 Pontos Fortes Comprovados (O "Doce Ponto" de Delegação):
1. **Execução em Sandbox Assíncrona:** Jules opera em uma VM dedicada no Google Cloud sem consumir recursos da máquina de desenvolvimento nem tokens da janela interativa do Antigravity.
2. **Tarefas de "Overhead Cognitivo" e Higiene:** Brilha na resolução de warnings de linter (Oxlint/ESLint), tipagem estrita TypeScript (eliminação de `any`), refatoração de acessibilidade (`aria-expanded`, `aria-controls`, `role`) e internacionalização.
3. **Escrita de Testes Unitários:** Excelente capacidade de derivar e cobrir casos de borda em funções puras já existentes usando suítes de teste automatizadas.
4. **Resolução de Bugs Determinísticos:** Alta precisão quando o sintoma observável e o arquivo provável são fornecidos claramente no prompt (estilo issue).

#### ⚠️ Limitações Reais & Modos de Falha da Jules:
1. **Perda de Coerência em Mudanças Transversais (Multi-Arquivo):** Quando uma alteração afeta 5+ arquivos simultâneos (ex: store Zustand + múltiplos componentes dependentes), Jules frequentemente esquece de atualizar referências secundárias ou cria interfaces divergentes.
2. **Incapacidade de Validação Visual:** Como opera em VM headless sem tela gráfica, Jules não consegue inspecionar artefatos visuais interativos (ex: Scratchpad Canvas, renderização de curvas parabólicas).
3. **Incompatibilidade com Especificidades de SO Local:** Jules roda em Linux; particularidades de Electron Windows (NSIS, PowerShell, caminhos de drive `C:\...`, locks de sincronização do OneDrive) falham ou não podem ser testadas por ela.
4. **Alucinação sob Requisitos Ambíguos:** Diante de prompts abertos ("melhore a interface da home"), Jules tende a congelar em `AWAITING_USER_FEEDBACK` ou gerar soluções genéricas fora das convenções do repositório.
5. **Isolamento de Repositório Único:** Não possui acesso a diretórios externos à árvore Git (como o Obsidian Vault ou bases locais de scrapers).

### 1.2. Engenharia de Prompt Obrigatória ao Delegar para a Jules
Toda delegação para a Jules deve seguir a estrutura de um **Ticket Determinístico**:
1. **Sintoma Observável:** O que está acontecendo vs o que deveria acontecer.
2. **Localização Provável:** O arquivo relativo (sem linha fixa).
3. **Critérios de Aceite:** O comportamento esperado após a alteração.
4. **Comando de Verificação:** Qual comando de teste ou linter a Jules deve rodar antes de concluir (ex: `npx vitest run src/tests/...`, `npm run lint`).

## 2. Verificação de Cota Diária da Jules
- Antes de assumir que a API da Jules expõe a cota restante, confirmar isso na documentação
  real da API (não presumir a existência de um endpoint de consulta).
- **Se a API expuser a cota:** consultar diretamente antes de cada delegação.
- **Se a API NÃO expuser** (confirmado: `404` em `/user`, `/settings`, `/integrations`):
  manter um contador local persistido (`.antigravity/jules-quota.json`), incrementado a cada
  delegação bem-sucedida, resetado à meia-noite (fuso do usuário). Na dúvida, tratar como
  esgotada e executar localmente — nunca assumir cota disponível sem essa verificação.

## 3. Roteamento
- **Baixa ou Média** → delegar para a Jules via API (`POST
  https://jules.googleapis.com/v1alpha/sessions`), **somente se** a cota diária não estiver
  esgotada.
- **Média-Alta ou Alta** → o Antigravity executa sempre, localmente — nunca delegar essas
  faixas, independente da cota.
- **Cota da Jules esgotada** → o Antigravity assume também as faixas Baixa e Média enquanto
  durar o esgotamento, em vez de esperar ou enfileirar.

## 4. Separação entre Código Delegado e Documentação do Vault
- Delegar à Jules cobre **somente a mudança de código**. A Jules não tem acesso ao Obsidian
  Vault local — isso nunca muda.
- A documentação no vault é **sempre** responsabilidade do Antigravity, **mesmo quando o
  código foi feito pela Jules** — essa necessidade de documentar **não é motivo** pra também
  assumir o código que poderia ter sido delegado. São dois trabalhos distintos.
- Fluxo correto quando delegado: abrir a tarefa na Jules → registrar `EM ANDAMENTO [Agente:
  Jules]` → **não bloquear a conversa esperando** → quando o PR for mergeado, revisar o diff
  real (seção 6) → só então documentar no vault referenciando o commit/PR como autoria da
  Jules.

## 5. Justificativas de Bypass Proibidas
As razões abaixo **nunca**, isoladamente, justificam executar localmente uma tarefa Baixa ou
Média com cota da Jules disponível:
- "A conversa está acontecendo no chat agora" — a delegação é assíncrona por natureza; isso
  não muda por estar numa sessão interativa.
- "Localmente é mais rápido / a Jules demoraria alguns minutos" — o ganho da regra é de
  recurso (tokens/cota), não de velocidade de resposta. Localmente será sempre mais rápido;
  isso não é argumento válido.
- "Preciso mexer no vault de qualquer forma" — ver seção 4. Documentação não é código.
Se nenhuma razão além dessas três existir, a tarefa **deve** ser delegada.

### Exceção legítima (a única válida)
Se o usuário disser explicitamente que quer a correção agora, sem esperar ("prefiro que você
faça direto", "é urgente"), o Antigravity pode executar localmente mesmo em faixa Baixa/Média
— registrando no vault o motivo real (pedido explícito do usuário), não uma das três
justificativas proibidas.

## 6. Verificar Antes de Documentar
Antes de escrever qualquer entrada no vault sobre uma tarefa delegada:
1. Abrir o diff real do PR mergeado — não confiar na descrição do PR nem no plano original
   como fonte de verdade.
2. Confirmar que o que foi implementado bate com o que foi pedido; escopo divergente, arquivo
   faltando, ou abordagem diferente devem ser sinalizados na documentação, não silenciados.
3. Só então escrever a entrada, descrevendo o que **de fato** foi feito.
4. Se o resultado divergir significativamente do escopo pedido, reavaliar se o restante
   precisa ser assumido pelo Antigravity antes de marcar `CONCLUÍDO`.

## 7. Proibido Pré-Resolver Antes de Delegar
Ao delegar uma tarefa Baixa/Média, o Antigravity **não pode** incluir na mensagem à Jules:
- Trecho de código já corrigido, pronto pra colar.
- Número de linha exato ou diff completo antes/depois.
- Diagnóstico técnico detalhado além do necessário pra descrever o sintoma.

O Antigravity **deve** enviar apenas: a descrição do problema observável (sintoma, não
causa), o arquivo/área provável (sem linha exata), e o comportamento esperado depois da
correção (o "o quê", não o "como").

### 7-A. Verificação Rápida de Existência (Sanidade Pré-Delegação)
Antes de delegar qualquer item vindo de um documento de sugestões/backlog (não de um bug já
confirmado em produção), rodar verificação rápida de existência (grep/leitura pontual) do
sintoma alegado. Isso **não é pré-resolver** — pré-resolver é escrever a solução; verificar é
confirmar que o problema é real antes de gastar cota da Jules nele. Se a funcionalidade já
estiver implementada ou a premissa da sugestão for factualmente incorreta no código atual,
documentar o fato, informar o usuário e não despachar a tarefa.

### Teste de Conformidade (aplica-se a toda a regra, não só à seção 7)
Antes de agir, o Antigravity se pergunta: *"esta ação está de fato poupando meus recursos, ou
só cumprindo a forma da regra sem entregar a economia que ela existe pra dar?"* Se a resposta
for a segunda, a ação está errada mesmo que tecnicamente siga os passos descritos.

## 8. Coordenação entre Agentes (concorrência)
- Antes de iniciar qualquer tarefa (delegada ou local), registrar em `Historico de Prompts &
  Demandas.md` como `⏳ EM ANDAMENTO [Agente: Jules|Antigravity]`, incluindo quais
  arquivos/módulos serão tocados.
- Antes de começar, conferir esse arquivo por entradas em andamento que toquem os mesmos
  arquivos/módulos. Se houver conflito, aguardar a conclusão antes de prosseguir.
- Ao concluir (após a seção 6), atualizar para `✅ CONCLUÍDO`.
- **Inclusão Obrigatória de Scripts nos Relatórios:** Quando a tarefa for disparada por um
  arquivo da pasta `scripts/`, incluir o nome e a transcrição / diretrizes do script tanto no
  relatório de resposta no chat quanto no registro documental de `Historico de Prompts & Demandas.md`.

## 9. Acompanhamento de Delegação
- Registrar o session ID retornado pela API da Jules e monitorar o progresso (`GET
  /activities`) até a conclusão — delegar não é dar por feito no momento do envio.
- Se a Jules retornar algo incompleto ou fora do escopo, reavaliar a complexidade real (pode
  ter sido subestimada) e decidir se o Antigravity assume o restante.

## 10. Demandas em Lote e Fatiamento Obrigatório (Redução do Uso de Tokens do Antigravity)
- O objetivo primordial da governança com a Jules é **diminuir diretamente o uso de tokens e preservar a cota do Antigravity**, transferindo a carga cognitiva e a geração de código de baixa e média complexidade para a cota diária dedicada da Jules (100 tarefas/dia).
- Quando o usuário enviar mais de um script ou requisito na mesma mensagem/sessão:
  1. O Antigravity **NUNCA deve agrupar o lote em um único plano de execução local** para "resolver tudo de uma vez", pois isso consome tokens massivos do Antigravity na análise, refatoração e testes de tarefas fáceis.
  2. O Antigravity **DEVE fatiar o lote**: isolar os scripts de complexidade Baixa ou Média e despachá-los imediatamente para a Jules via API.
  3. **Concorrência de Arquivos no Lote:** Caso dois scripts toquem o mesmo arquivo (ex: um altera classes visuais e outro altera lógica no mesmo componente), a execução DEVE ser **sequencial**: delegar o script Baixo/Médio para a Jules primeiro via API, aguardar a conclusão e merge do PR, atualizar o repositório local (`git pull`) e só então o Antigravity assume a tarefa de maior complexidade. Agrupar as tarefas para executar localmente sob pretexto de evitar a espera pelo arquivo comum é considerado bypass proibido de tokens.

## 11. Cota Semanal do Próprio Antigravity e Preferência por Hooks Reativos
Até agora o `GEMINI.md` só rastreia a cota diária da **Jules** (100/dia). É mandatório reconhecer que o **Antigravity também tem cota própria (semanal)**, e que multiplicar Tarefas Agendadas nativas consome esse recurso mesmo sem gerar nenhuma sessão da Jules.
- Antes de adicionar uma nova Tarefa Agendada ou Hook recorrente, considerar o custo acumulado semanal, não só o custo de uma execução isolada.
- **Preferir Hooks (reativos)** — que só disparam quando há evento real — a **Tarefas Agendadas de verificação frequente (proativas)** — que rodam periodicamente mesmo sem nada ter mudado — sempre que o caso de uso permitir.
- Exemplo prático: a reação a um PR mergeado da Jules deve ser implementada via Hook de ciclo de vida (ou webhooks de evento), e não por um cron que faça polling constante a cada poucos minutos, preservando integralmente os tokens do Antigravity.

## 12. Blindagem de Worktree para Persistência de Cota (jules-quota.json)
Antes de qualquer automação ou agente rodar dentro de um **New Worktree** isolado (ou branches clonadas):
- **Problema:** O arquivo `.antigravity/jules-quota.json` é gitignorado (`.gitignore`). Ao criar uma pasta temporária/worktree, esse arquivo não é clonado nem sincronizado pelo git, fazendo com que o agente no worktree enxergue um contador zerado ou inexistente, violando a checagem de cota da Seção 2.
- **Diretriz Mandatória:** Qualquer script ou processo que consulte ou incremente a cota da Jules DEVE sempre resolver o caminho absoluto do repositório raiz principal (`c:\Users\lucas\OneDrive\Área de Trabalho\code\quantora\.antigravity\jules-quota.json`) ou utilizar variável de ambiente/link simbólico apontando para a fonte canônica, blindando o contador de cota diária contra duplicação ou reset acidental.

## 13. Resposta às Sessões Diárias Agendadas da Jules (Palette, Sentinel, Bolt)
Existem 3 agentes de habilidade agendados diariamente no painel da Jules às 21:00 GMT-3: **Palette** 🎨 (UX/acessibilidade), **Sentinel** 🛡️ (segurança/vulnerabilidades) e **Bolt** ⚡ (performance).

### 13.1. Contabilização da Cota Diária
- As 3 sessões agendadas consomem cota da Jules **todo dia** automaticamente. O contador local (`.antigravity/jules-quota.json`, Seção 2) deve somar essas 3 execuções fixas na contagem de uso diário, reduzindo a cota disponível para delegações ad-hoc para ~97/dia.

### 13.2. Rotina de Revisão Pós-Execução
- Após as 21:00 (com margem de conclusão até ~21:30), o Antigravity verifica as 3 sessões para identificar perguntas pendentes, solicitações de aprovação ou PRs concluídos.

### 13.3. Tomada de Decisão em Perguntas da Jules
Quando uma das sessões pausar solicitando aprovação:
- **Baixa ou Média** → O Antigravity classifica pela matriz da Seção 1 e pode decidir de forma autônoma (aprovar ou rejeitar, com justificativa concisa no Vault).
- **Média-Alta ou Alta** → O Antigravity **nunca decide sozinho** — registra como `⏳ AGUARDANDO DECISÃO DO USUÁRIO` no `Historico de Prompts & Demandas.md`, notifica o usuário e só prossegue após consentimento explícito.
  - **Atenção especial à Sentinel (Segurança):** Mudanças de segurança são tipicamente de complexidade Alta; portanto, aprovações da Sentinel devem ser escaladas compulsoriamente ao usuário por padrão para evitar merges acidentais de mudanças sensíveis.

### 13.4. Auditoria Pré-Decisão & Registro Documental
- Antes de aprovar qualquer continuidade, o Antigravity deve ler a proposta real e o diff prévio da Jules (reaplicando a Seção 6).
- Cada decisão tomada (aprovada, rejeitada ou escalada) deve ser registrada formalmente no `Historico de Prompts & Demandas.md`.

## 14. Auto-Restauração Autônoma de Crons em Background (14:00 e 21:30)
- **Cenário:** O desligamento do computador ou o encerramento do processo do servidor da IDE encerra as tarefas em background na memória, disparando a mensagem de sistema `[Notice] All your subagents and background tasks have been stopped due to server restart`.
- **Comportamento Mandatório:** Sempre que o Antigravity for acionado e constatar essa notificação de reinício, ou se `manage_task(Action='list')` indicar que os daemons não estão em execução, o agente **NÃO deve esperar o usuário solicitar a reativação**. Ele deve, de forma imediata e autônoma, invocar a ferramenta `schedule` (`IsDaemon: true`) para restaurar:
  1. `0 14 * * *` — Sincronização Diária Repositório $\rightarrow$ Vault às 14:00.
  2. `30 21 * * *` — Revisão Noturna Diária das Sessões Jules (Palette, Sentinel, Bolt) às 21:30.
- Essa regra elimina qualquer atrito operacional ou dependência de lembretes manuais por parte do usuário.

## 15. Notificação Mandatória de Complexidade e Roteamento ao Usuário
A cada solicitação ou tarefa processada pelo Antigravity, o agente **DEVE sempre informar expressamente** no corpo ou cabeçalho de sua resposta ao usuário:
1. O **Nível de Dificuldade / Complexidade** avaliado (`Baixa`, `Média`, `Média-Alta` ou `Alta`), rigorosamente justificado pelos critérios técnicos e pelo perfil operacional da Jules (Seção 1).
2. O **Agente Designado** (`Jules AI` via API REST ou `Antigravity` em execução local) e a justificativa técnica clara do roteamento adotado, permitindo a auditoria contínua e a validação transparente por parte do usuário.

## Registro no Obsidian
Referenciar este arquivo em [[Antigravity & Cotas de IA]] (`Sistemas & Integracoes/Antigravity & Cotas de IA.md`) — o
`GEMINI.md` é a fonte executável da regra, o Obsidian é a documentação de por que ela existe
e o histórico dos casos reais que motivaram cada seção.

---

## 🔗 Navegação na Documentação (Obsidian)
* [[Quantora - Visao Geral]]
* [[Dashboard]]
* [[Antigravity & Cotas de IA]]
* [[AGENTS]]
* [[Decisoes & Estado Atual]]
* [[Historico de Prompts & Demandas]]
