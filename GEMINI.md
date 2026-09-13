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

## 1. Classificação de Complexidade

| Faixa | Critério |
| :--- | :--- |
| **Baixa** | Mudança isolada num único arquivo, sem lógica nova: ajuste de CSS/Tailwind, espaçamento, cor, texto/i18n, correção de nome de variável, comentário. |
| **Média** | Função pura nova e testável isoladamente (helper, cálculo), ajuste de componente com lógica simples e escopo já claro, correção de bug com causa-raiz já diagnosticada e sem ambiguidade de abordagem. |
| **Média-Alta** | Feature que toca múltiplos arquivos e introduz estado novo na store (Zustand), mudança de arquitetura de um módulo, qualquer coisa que exija decisão de design ainda não fechada. |
| **Alta** | Mudança em workflows do GitHub Actions, segurança, permissões, Electron IPC/main process, build/release/assinatura de app, ou tarefa com mais de uma abordagem de produto/arquitetura genuinamente em aberto. |

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

## Registro no Obsidian
Referenciar este arquivo em `Sistemas & Integracoes/Antigravity & Cotas de IA.md` — o
`GEMINI.md` é a fonte executável da regra, o Obsidian é a documentação de por que ela existe
e o histórico dos casos reais que motivaram cada seção.
