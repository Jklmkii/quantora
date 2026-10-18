# 🔍 Análise de Viabilidade e Triagem: ETA & Agent Workspace v7.0

O plano original sofre da clássica **"síndrome do número redondo"**: para fechar exatamente **25 melhorias divididas em 5 categorias simétricas ($5 \times 5$)**, o escopo mistura ferramentas excelentes de fluxo de trabalho com métricas de vaidade e *bloatware* de interface. 

Além disso, há uma contradição central na proposta: o documento promete uma **HUD Minimalista Compacta com zero poluição visual**, mas tenta empilhar micro-gráficos SVG, estrelas de favoritos, múltiplos novos badges e uma Command Palette inteira na mesma janela.

Abaixo está a triagem cirúrgica do que realmente agrega valor produtivo e do que é apenas preenchimento de escopo.

---

## 🔥 1. O que é Realmente Útil (Alto Impacto — Vale Implementar)

Estas **10 melhorias** resolvem problemas reais de fricção, travamento do agente, leitura de código e governança:

* **M16 (Injetor de Instrução Ao Vivo / Gatekeeper Live Steer):** É a melhor funcionalidade do plano inteiro. Interceptar o hook `PreToolUse` no `coding-progress-tracker.cjs` para corrigir a rota do agente no meio do turno sem precisar abortar e perder o contexto economiza muito tempo e cota de tokens.
* **M4 (Detector de Processo Zumbi + Botão `⚡ Destravar`):** Extremamente útil na prática. Comandos como `vitest` em modo watch acidental ou processos filhos pendurados travam o turno; ter um `POST /api/kill-stuck` direto na HUD evita abrir o terminal ou o Gerenciador de Tarefas para encerrar o processo manualmente.
* **M12 (Parser de Cores ANSI no Terminal):** Mais que melhoria, isso é correção de bug visual. Ler saída do Vitest ou Oxlint poluída com `\x1b[32m` cru quebra a leitura rápida; converter para HTML limpo é obrigatório.
* **M11 (Destaque de Erros + Botão `🚨 Ir p/ Erro`):** Quando um build ou suíte de testes falha com centenas de linhas de log, o scroll automático direto para `error TS` ou `FAIL` economiza vários segundos de caça visual.
* **M10 (Diff Consolidado do Turno `[Passo | Turno]`):** Muito útil quando o agente faz vários `replace_file_content` picados no mesmo arquivo. Ver o diff acumulado do turno inteiro permite revisar de uma vez só o que realmente mudou no código.
* **M14 (Deep-Link `vscode://file/...` na Linha Exata):** Conecta o painel diretamente à ação. Viu algo estranho no diff do agente? Um clique abre o VS Code exatamente na linha editada.
* **M1 (Calibração Persistente de Latência `P50/P90`):** Se o objetivo é ter um ETA que não minta, parar de usar pesos estáticos reiniciados a cada sessão e passar a salvar o tempo real de `npx vitest run` vs. `git status` na sua máquina é o único jeito de a estimativa funcionar de verdade.
* **M7 (Modo Ultra-Compacto "Mini-Strip"):** Como o painel é uma janela auxiliar (sidecar), poder encolhê-lo para uma faixa de `56px` apenas com o cabeçalho e a `Flamebar` libera espaço de tela enquanto você programa.
* **M20 (Detector de Leitura Redundante):** Excelente para auditar se o agente está desperdiçando contexto dando `view_file` repetido no mesmo trecho de arquivo durante o mesmo turno.
* **M22 (Alerta Sonoro Sutil / Notificação no 100%):** Como turnos com testes demoram de 15s a 40s, você naturalmente alterna de janela para fazer outra coisa; um aviso sonoro discreto via `AudioContext` sinaliza na hora que o agente terminou ou travou num erro.

---

## ⚙️ 2. Úteis, mas Secundárias (Implementar apenas se forem discretas)

Estas **8 melhorias** trazem conveniência para o seu ecossistema específico, mas precisam ser mantidas simples para não poluir a tela:

* **M13 (Histórico Dropdown de Comandos Shell):** Bom para conferir o log do `npm run build` anterior depois que o agente já rodou o `vitest` por cima.
* **M15 (Extrator de Placar do Vitest `455/455`):** É apenas um regex simples no `main.mjs` e dá uma confirmação visual imediata no badge de Quality Gate.
* **M18 (Badge do Obsidian Vault + Trigger 1-Click):** Útil especificamente para o seu fluxo porque roda o `vault_guardian_core.cjs` em 1 clique sem precisar digitar comando no terminal.
* **M24 (Botão Copiar Resumo PR/Vault):** Prático se você cola o relatório de fechamento com frequência no Obsidian ou em PRs.
* **M2 (Classificador Preditivo de Escopo no Início do Turno):** Ajuda o ETA no segundo `0s` a não chutar sempre 28s para uma simples pergunta. Deve ser mantido como uma heurística simples de palavras-chave, sem complicar.
* **M5 (SLA por Fase):** Útil para saber onde foi o gargalo (`Código 6.4s` vs. `Build 3.2s`), mas deve ficar **estritamente no tooltip** (ao passar o mouse) para não espremer a barra de fases.
* **M17 (Radar Git na Barra Superior) & M19 (Monitor de Daemons):** São bons indicadores de estado (`dirty files`, crons das 14:00/21:30), desde que fiquem escondidos em micro-pílulas discretas com tooltip.

---

## 🗑️ 3. Puro Preenchimento / Bloat (Recomendado Cortar)

Estas **7 melhorias** foram claramente criadas para fechar a conta em 25 itens. Elas adicionam complexidade de código no `index.html` e no `main.mjs` sem trazer retorno real no dia a dia:

* **M3 (Sparkline SVG de Contagem Regressiva do ETA):** Preenchimento clássico. Você não precisa de um gráfico vetorial de $44 \times 14\text{ px}$ mostrando a curva de decaimento de um relógio regressivo nos últimos 15 ticks. O número dos segundos e a mudança de cor para âmbar quando há *stall* já passam 100% da informação necessária.
* **M6 (Command Palette `Ctrl+K` estilo Raycast):** *Over-engineering* pesado. Command Palette faz sentido em sistemas com centenas de comandos ocultos (VS Code, Linear). Em uma HUD compacta onde todos os botões já estão a 1 clique na sua frente, criar um modal de busca rápida só para clicar em "Pausar" ou "Mudar Tema" é código morto.
* **M8 (Seletor de 3 Temas — incluindo Light Mode):** A própria premissa do documento no topo diz *"Filosofia Visual: Linear / Raycast / Vercel Dark"*. Gastar linhas de CSS criando tema claro (`Daylight Clean`) que você nunca vai usar é puro preenchimento. Se quiser muito o preto absoluto, basta ajustar a cor de fundo padrão.
* **M9 (Pinning / Favoritos de Passos na Timeline `⭐`):** Um turno normal do agente tem entre 5 e 15 passos. Você não vai ficar "favoritando passos com diamantes dourados" durante uma execução de 20 segundos — especialmente se o **M11** já destaca onde deu erro automaticamente.
* **M21 (Calculadora de Economia de Cota Jules/Cache):** Métrica de vaidade. Tentar adivinhar quantos tokens foram "poupados" por não ler o arquivo inteiro gera apenas um número fictício que não muda nenhuma decisão sua durante o código.
* **M23 (Delta de Performance `-18% mais rápido que a média`):** Estatisticamente inútil. O Turno #1 pode ser uma pergunta rápida de 4 segundos e o Turno #2 uma refatoração com Vitest de 45 segundos; dizer que um turno foi `"-18% mais rápido que a média da sessão"` compara tarefas completamente diferentes.
* **M25 (Exportação `.json` Completa de Telemetria):** Como o próprio plano mostra, os dados já ficam salvos em arquivos JSON locais (`coding_progress_state.json` e `tool_latency_profile.json`). Criar um botão na UI para baixar um JSON que já está salvo no seu disco é redundante.

---

## 💡 Recomendação de Execução (Escopo Enxuto v7.0)

Em vez de aprovar o pacote inchado de 25 itens, o ideal é enxugar a **v7.0** para focar apenas no que traz ganho real de produtividade e diagnóstico:

| Prioridade | Melhorias Selecionadas | Objetivo Principal |
| :--- | :--- | :--- |
| **P0 (Essenciais)** | **M16, M4, M12, M11, M10, M14** | Controle do agente ao vivo, destravamento de processos, leitura limpa de terminal/erros, diff acumulado do turno e abertura rápida no VS Code. |
| **P1 (Motor & UI)** | **M1, M7, M20, M22** | Precisão real de ETA com dados persistidos, modo compacto Mini-Strip, auditoria de releitura de tokens e notificação de fim de turno. |
| **P2 (Ecossistema)** | **M13, M15, M18, M24** *(+ M2, M5, M17, M19 discretos)* | Histórico de shell, contador do Vitest, integração 1-click com Obsidian Vault e cópia rápida de resumo para PR. |
| **Cortadas** | ~~M3, M6, M8, M9, M21, M23, M25~~ | Eliminação de poluição visual, métricas de vaidade e código redundante. |
<!-- QUANTORA_TASK_READY -->