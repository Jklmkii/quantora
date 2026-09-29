# GEMINI.md — Matriz de Governança & Delegação Antigravity ↔ Jules AI

> Este arquivo define a política soberana de orquestração do agente principal (**Google Antigravity**) e do agente de apoio em nuvem (**Jules AI**). O objetivo primordial desta regra é **poupar a cota de tokens do Antigravity**, aproveitando a cota diária dedicada da Jules (100 tarefas/dia) para trabalhos de escopo fechado e baixo risco.

---

## 1. Classificação de Complexidade & Matriz de Roteamento

| Faixa | Critério Técnico | Aptidão da Jules AI | Ação de Roteamento |
| :--- | :--- | :--- | :--- |
| **Baixa** | Alteração isolada em único arquivo sem algoritmo novo: CSS, Tailwind, espaçamento, texto/i18n, atributos ARIA, renomeação de variáveis. | **Excelente (100% autônoma):** Executa com perfeição sem riscos colaterais. | **Delegar para a Jules via API** (se cota disponível). |
| **Média** | Função pura nova e testável isoladamente, ajuste de componente simples, bug com causa-raiz clara, expansão de testes Vitest, otimizações atômicas (`React.memo`). | **Alta eficácia (escopo fechado):** Brilha em tarefas com critérios de aceite explícitos no estilo "Ticket Jira". | **Delegar para a Jules via API** (se cota disponível). |
| **Média-Alta** | Feature transversal que toca múltiplos arquivos, alteração na store central (Zustand), arquitetura de módulos, gráficos visuais/canvas complexos. | **Inadequada (risco de divergência):** Jules perde contexto em mudanças interdependentes e não tem feedback visual. | **Executar localmente (Antigravity)**. Nunca delegar. |
| **Alta** | Workflows do GitHub Actions, permissões/segredos, processos Electron/Capacitor nativos, build de release (`.exe`/`.apk`), acesso ao SO local ou Obsidian. | **Incompatível (ambiente isolado):** Jules roda em container Linux sem acesso ao sistema local ou cofre Obsidian. | **Executar localmente (Antigravity)**. Nunca delegar. |

---

## 2. Engenharia de Prompt Obrigatória para Delegação (Ticket Determinístico)

Toda tarefa delegada para a Jules deve seguir a estrutura de um **Ticket Jira**:
1. **Sintoma Observável:** O que está acontecendo vs o que deveria acontecer.
2. **Localização Provável:** O caminho do arquivo relativo (sem linha fixa).
3. **Critérios de Aceite:** O comportamento esperado após a alteração.
4. **Comando de Verificação:** Qual comando a Jules deve rodar antes de concluir (ex: `npx vitest run src/tests/...`, `npm run lint`).

### Regra de Ouro: Proibido Pré-Resolver
Ao delegar à Jules, o Antigravity **NUNCA deve enviar a solução já codificada, diff pronto para colar ou linhas exatas**. Envie o "o quê", não o "como", permitindo que o container da Jules processe a demanda e poupe seus tokens.

---

## 3. Fatiamento Obrigatório de Demandas em Lote
Quando o usuário enviar mais de um requisito na mesma mensagem:
1. O Antigravity **NUNCA deve agrupar o lote em um único plano de execução local** para resolver tudo de uma vez.
2. O Antigravity **DEVE fatiar o lote**: isolar as tarefas Baixas/Médias e despachá-las imediatamente para a Jules via API.
3. Se duas tarefas tocarem o mesmo arquivo, a execução deve ser **sequencial**: despachar a tarefa da Jules primeiro, aguardar o merge do PR, fazer `git pull` e só então o Antigravity assume a tarefa de maior complexidade.

---

## 4. Auditoria de PRs & Documentação no Obsidian
1. **Separação de Papéis:** A Jules gera o código via PR. A documentação no cofre do Obsidian é de responsabilidade exclusiva do Antigravity.
2. **Verificação de Diff Real:** Antes de registrar uma entrega da Jules no cofre, o Antigravity deve abrir o diff real do PR mergeado para confirmar que a implementação corresponde fielmente aos critérios de aceite.

---

## 5. Notificação Mandatória de Complexidade ao Usuário
A cada solicitação processada pelo Antigravity, o agente **DEVE sempre informar expressamente** no topo de sua resposta:
1. O **Nível de Complexidade** avaliado (`Baixa`, `Média`, `Média-Alta` ou `Alta`).
2. O **Agente Designado** (`Jules AI` via API ou `Antigravity` localmente) e a justificativa técnica correspondente.

---

## 6. Auto-Restauração de Crons em Background
Sempre que o Antigravity constatar a notificação `[Notice] All your subagents and background tasks have been stopped due to server restart` ou ausência de daemons no `manage_task(Action='list')`, deve restaurar imediatamente via ferramenta `schedule` (`IsDaemon: true`):
1. `0 14 * * *` — Sincronização Diária Repositório $\to$ Vault às 14:00.
2. `30 21 * * *` — Revisão Noturna Diária das Sessões Jules às 21:30.
