# 🪐 GEMINI.md — Diretrizes Prioritárias de Orquestração & Governança Agêntica (Antigravity)

Este documento define as diretrizes executáveis e a matriz de orquestração com **prioridade máxima** para o agente autônomo **Google Antigravity** no projeto **Quantora**. As instruções aqui contidas complementam e têm precedência sobre o arquivo compartilhado `AGENTS.md` em matéria de orquestração, delegação e controle de tarefas.

---

## 🧭 1. Princípios de Precedência & Orquestração

* **`GEMINI.md` (Prioridade Máxima):** Regras exclusivas de raciocínio, classificação, roteamento e coordenação agêntica do Antigravity.
* **`AGENTS.md` (Base Compartilhada):** Convenções de arquitetura, padrões de código, testes obrigatórios, e regras compartilhadas com outros agentes (ex: Google Jules).
* **Obsidian-First:** O cofre local (`Obsidian-Vault/`) documenta a arquitetura profunda, histórico de bugs e registro de demandas; o `GEMINI.md` é o motor executável dessas decisões.

---

## 📋 2. Protocolo Pré-Tarefa em 4 Etapas Obrigatórias

Antes de iniciar a modificação de qualquer linha de código ou executar qualquer tarefa, o Antigravity DEVE compulsoriamente:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. CLASSIFICAR A COMPLEXIDADE (Baixa, Média, Média-Alta, Alta)│
└──────────────────────────────┬──────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. VERIFICAR A COTA DIÁRIA DA JULES (.antigravity/quota)    │
└──────────────────────────────┬──────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. PREVENIR CONCORRÊNCIA (Historico de Prompts: EM ANDAMENTO)│
└──────────────────────────────┬──────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. ROTEAR A EXECUÇÃO (Delegar para Jules OU Executar Local) │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 3. Matriz de Classificação de Complexidade

| Faixa de Complexidade | Critérios & Exemplos Práticos |
| :--- | :--- |
| **🟢 Baixa** | • Mudança isolada em um único arquivo, sem introduzir lógica algorítmica nova.<br>• Ajustes cosméticos de CSS/Tailwind (espaçamento, cores, padding, margens).<br>• Textos, rótulos de i18n (`translations.ts`), correção de typos.<br>• Renomeação de variáveis ou adição/ajuste de comentários e documentação de código. |
| **🟡 Média** | • Função pura nova e isolada, testável diretamente em testes unitários (helpers, cálculos matemáticos/físicos com `big.js`).<br>• Ajuste de um componente existente com lógica simples e escopo funcional delimitado.<br>• Correção de bug com causa-raiz já previamente diagnosticada e sem ambiguidade técnica de abordagem. |
| **🟠 Média-Alta** | • Feature transversal que toca múltiplos componentes ou módulos.<br>• Criação ou alteração de estado global na store Zustand (`src/store/useAppStore.ts`) e migrações de schema.<br>• Mudança estrutural na arquitetura de um módulo existente.<br>• Qualquer demanda que exija decisão de design ou produto ainda não consolidada. |
| **🔴 Alta** | • Alterações em workflows de CI/CD do GitHub Actions (`.github/workflows/*`).<br>• Segurança, chaves de API, PATs, permissões de repositório e tokens.<br>• Código nativo ou de runtime privilegiado: Electron (`electron/main.cjs`, `preload.cjs`, IPC) e Capacitor Android Gradle.<br>• Pipeline de build, empacotamento, assinatura de instaladores (`electron-builder`, APK).<br>• Tarefas com arquiteturas concorrentes ou abordagens conceituais genuinamente em aberto. |

---

## 📊 4. Verificação e Controle de Cota da Jules

* **Limite Diário da API:** **100 tarefas/dia**.
* **Mecanismo de Consulta:** Como a API REST v1alpha do Google Jules não disponibiliza rota pública de telemetria de cota restante (rotas como `/user`, `/settings` e `/integrations` retornam 404), o Antigravity gerencia um **contador local persistido em disco** em:
  `code/quantora/.antigravity/jules-quota.json`
* **Estrutura do Contador:**
  ```json
  {
    "date": "YYYY-MM-DD",
    "usedCount": 0,
    "dailyLimit": 100,
    "lastResetTimestamp": "YYYY-MM-DDT00:00:00-03:00",
    "timezone": "America/Sao_Paulo"
  }
  ```
* **Regra de Reset Diário:** O contador é reiniciado para `usedCount: 0` à meia-noite (00:00:00) no fuso horário do dispositivo do usuário (`America/Sao_Paulo` / UTC-3), utilizando `getDeviceLocalDateString(new Date())`.
* **Critério de Guarda:** Antes de qualquer delegação:
  1. Se `date !== dataAtual`, atualizar a data e resetar `usedCount = 0`.
  2. Se `usedCount >= 100` ou houver falha de I/O na leitura do arquivo, **tratar a cota como esgotada** e assumir a tarefa localmente. Nunca delegar com cota incerta.

---

## 🔀 5. Tabela de Roteamento de Tarefas

| Complexidade | Status da Cota Jules | Agente Responsável | Canal de Execução |
| :--- | :--- | :--- | :--- |
| **Baixa** | Disponível (`< 100`) | **Google Jules** | API REST (`POST https://jules.googleapis.com/v1alpha/sessions`) |
| **Média** | Disponível (`< 100`) | **Google Jules** | API REST (`POST https://jules.googleapis.com/v1alpha/sessions`) |
| **Baixa / Média** | Esgotada (`>= 100`) | **Antigravity** | Localmente no repositório (sem enfileiramento passivo) |
| **Média-Alta** | Qualquer status | **Antigravity** | Localmente no repositório (**nunca delegar à Jules**) |
| **Alta** | Qualquer status | **Antigravity** | Localmente no repositório (**nunca delegar à Jules**) |

---

## 🛡️ 6. Coordenação & Prevenção de Concorrência (Anti-Race Condition)

A Jules atua de forma assíncrona gerando Pull Requests e branches no GitHub, enquanto o Antigravity atua de forma síncrona/direta no repositório local. Para impedir trabalho duplicado, merges conflitantes ou edições sobrepostas no mesmo arquivo:

1. **Checagem de Tarefas Ativas:**
   * Antes de iniciar qualquer trabalho, o Antigravity inspeciona `Obsidian-Vault/Projetos/Quantora/Historico de Prompts & Demandas.md` buscando entradas com status `⏳ EM ANDAMENTO`.
   * Se houver uma tarefa ativa tocando os mesmos arquivos ou o mesmo módulo da demanda corrente, o Antigravity **aguarda a conclusão da tarefa existente** antes de prosseguir.
2. **Marcação de Início Imediata:**
   * Ao aprovar o início de uma tarefa (seja para delegação à Jules ou execução local), o Antigravity cria imediatamente o registro no histórico:
     ```markdown
     ### Prompt N — DD/MM/AAAA HH:MM — [Título da Tarefa]
     * **Status da Execução:** `⏳ EM ANDAMENTO`
     * **Agente Designado:** `[Google Jules (API) | Antigravity (Local)]`
     * **Arquivos Alvo / Impactados:** `[lista de caminhos]`
     ```
3. **Fechamento e Verificação:**
   * Ao finalizar a execução e validar testes e build, o status é promovido para `✅ CONCLUÍDO`, acompanhado da análise forense e métricas de qualidade.

---

## 🔍 7. Acompanhamento & Auditoria de Tarefas Delegadas

Ao delegar uma tarefa para o Google Jules:
1. **Registro da Sessão:** Armazenar o `sessionId` retornado pela API e registrar nos metadados da tarefa.
2. **Monitoramento Ativo:** Acompanhar as atividades via `GET /sessions/{id}/activities` e aprovar o plano proposto com `POST /sessions/{id}:approvePlan` caso o plano esteja tecnicamente correto.
3. **Inspeção do PR:** Verificar o Pull Request aberto pela Jules no GitHub. O pipeline `auto-merge-jules.yml` só deve aprovar se `npm run lint`, `npx vitest run` e `npm run build` passarem 100% no CI.
4. **Resgate Autônomo:** Se a Jules entregar uma solução incompleta, com erros de teste, ou que exija decisões além do escopo original:
   * O Antigravity reavalia a complexidade da demanda.
   * Assume o restante da implementação localmente, fecha ou complementa a branch e conclui a entrega com segurança.

---

## 🛑 8. Separação entre Código e Vault & Proibição Estrita de Bypass (v3)

A regra de delegação de tarefas de complexidade **Baixa** e **Média** para a Jules visa a preservação de cotas e o aproveitamento do ecossistema agêntico. A sua aplicação é mandatória e não pode ser driblada por conveniência operacional.

### A. Separação Funcional: Código vs. Documentação
* **Código:** Quando uma tarefa é classificada como Baixa ou Média (com cota da Jules disponível), a criação, edição e teste do código da aplicação competem **exclusivamente à Jules** via Pull Request.
* **Obsidian Vault:** A Jules não tem (e não deve ter) acesso ao cofre local do Obsidian. A documentação no Vault (`Changelog & Historico de Bugs.md`, `Historico de Prompts & Demandas.md`, etc.) é **sempre atribuição do Antigravity**, em 100% dos prompts do projeto.
* **Independência:** O fato de o Antigravity ter que registrar o trabalho no Vault **jamais justifica assumir a escrita do código**. O Antigravity delega o código à Jules, aguarda o PR/merge e, em seguida, faz a documentação no Vault citando o PR da Jules como fonte.

### B. Proibição Expressa dos Três Motivos de Bypass
Fica expressamente **proibido** ao Antigravity executar localmente tarefas Baixas ou Médias alegando qualquer um dos seguintes motivos:
1. *"A conversa está ocorrendo em tempo real no chat"* (desativaria a delegação exatamente quando o usuário mais utiliza o sistema).
2. *"Localmente é mais rápido / a Jules demorará 5 a 15 minutos"* (localmente sempre será mais rápido; usar isso como critério anularia 100% das delegações e destruiria o propósito de economizar cota).
3. *"Preciso atualizar o Vault de qualquer forma"* (mistura responsabilidades que são independentes).

Se nenhuma outra razão técnica substancial existir além dessas três, a tarefa **DEVE** ser compulsoriamente delegada à Jules.

### C. Comunicação Assíncrona Transparente
Ao despachar uma tarefa para a Jules durante uma sessão interativa, o Antigravity deve comunicar o fato de forma clara e direta ao usuário:
> *"A tarefa foi classificada como [Baixa/Média] e despachada para o Google Jules (Sessão `ID`). A execução assíncrona leva em média de 5 a 15 minutos. Notificarei assim que o PR for submetido e validado pelo CI."*

A espera assíncrona é parte integral da arquitetura; ela não deve ser escondida nem contornada com execução local não autorizada.

### D. Única Exceção Legítima
A única exceção aceitável para o Antigravity assumir diretamente uma tarefa Baixa ou Média com cota disponível é a **ordem direta, explícita e inequívoca do usuário** na conversa (ex.: *"faça você mesmo agora"*, *"não mande para a Jules"*, *"é urgente, resolva direto"*). Nesse caso, a exceção deve ser expressamente registrada no Vault citando a instrução do usuário.

---

## 🔎 9. Inspeção Mandatória do Diff Real Antes de Documentar (Adendo v3)

O Antigravity nunca deve redigir a documentação final de uma tarefa delegada baseando-se unicamente no prompt original, no plano teórico ou na descrição textual do PR gerada pela Jules.

### Protocolo de Auditoria Pré-Documentação:
1. **Inspeção do Diff Real (`git show` / `git diff`):** Inspecionar detalhadamente as linhas e arquivos efetivamente alterados no commit ou PR mergeado.
2. **Confrontação de Escopo:** Comparar o diff real contra o escopo encomendado:
   * Todos os arquivos necessários foram tocados?
   * Houve alterações inesperadas ou ausência de partes da especificação?
   * A abordagem técnica respeitou os padrões do projeto (ex.: `big.js`, classes do Tailwind, ausência de regressões)?
3. **Documentação Fidedigna:** O registro no `Changelog & Historico de Bugs.md` e no `Historico de Prompts & Demandas.md` deve descrever rigorosamente o que **de fato** foi alterado no código, apontando eventuais divergências ou limites da entrega.
4. **Resgate ou Complementação:** Caso a Jules tenha entregue uma solução parcial ou divergente, o Antigravity não deve encerrar o ticket como se estivesse completo. Deve acionar o mecanismo de resgate/complementação local, finalizar o escopo pendente e apenas então promover o status para `✅ CONCLUÍDO`.
5. **Evidências Reais de Validação:** Manter a prática de registrar saídas e métricas reais de execução (como o relatório do Vitest, contagem de testes e status de build), garantindo auditoria verificável.

---

## 🔗 Links Relacionados
* [[Antigravity & Cotas de IA]]
* [[Credenciais & Tokens]]
* [[Historico de Prompts & Demandas]]
* [[AGENTS]]
* [[Decisoes & Estado Atual]]

