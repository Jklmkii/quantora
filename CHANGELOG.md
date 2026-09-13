# 📜 Histórico de Versões — Quantora

Todas as alterações notáveis deste projeto são documentadas neste arquivo.

## [1.2.19] — Sistema de Feedback Sonoro Multiplataforma (SFX) & Áudio Resiliente (2026-09-12)

### 🔊 Feedback Sonoro & Motor de Áudio
- **Motor de Áudio Universal (`src/core/platform/audio.ts`):** Helper de áudio centralizado operando em Web, Electron Desktop e Android com isolamento hermético contra falhas em ambientes SSR/Node/Vitest.
- **Assets Ultraleves (`public/sounds/`):** 6 efeitos sonoros autorais gerados proceduralmente (< 85 KB total) em formato `.ogg` e `.wav`: `hit-critical` (golpes críticos), `hit-standard` (golpe comum no chefe), `damage-taken` (perda de escudo), `combo-tick` (sustentação de combo no Blitz), `mastery-badge` (graduação em repetição espaçada) e `rare-67` (easter egg para o número 67).
- **Controle de Mudo & Volume no Settings (`SettingsModal.tsx`):** Toggle visual de efeitos sonoros, slider com indicador numérico de 0% a 100% e botão interativo para teste de áudio.
- **Integração Completa nos Modos de Jogo:** Conexão nativa em `BossBattle.tsx`, `BlitzGame.tsx` e `QuizModule.tsx`.
- **401 Testes Unitários Aprovados:** Suíte Vitest ampliada para 401 testes em 23 arquivos (100% verde) com validação de `src/tests/audio.test.ts`.

---

## [1.2.15] — Instalador NSIS Silencioso (oneClick) & Governança Agêntica GEMINI.md (2026-09-12)

### 💻 Desktop (Electron) & Instalador Windows
- **Instalador NSIS Silencioso (`oneClick: true`):** Eliminação do assistente interativo ("Escolha uma opção de instalação") durante atualizações automáticas via `electron-updater` (`quitAndInstall()`). A instalação ocorre em segundo plano com barra de progresso nativa rápida, instalando no diretório do usuário (`perMachine: false`, `allowToChangeInstallationDirectory: false`) sem janelas de diálogo desnecessárias.
- **Identidade Visual no Instalador:** Ícones personalizados do instalador, desinstalador e cabeçalho (`installerIcon`, `uninstallerIcon`, `installerHeaderIcon`) utilizando o asset oficial `build/icon.ico`.

### 🪐 Governança Agêntica & Automação
- **Diretrizes Prioritárias Antigravity (`GEMINI.md`):** Matriz determinística de complexidade em 4 faixas, roteamento de tarefas, contador persistente de cota da Jules (`.antigravity/jules-quota.json`) e protocolo de prevenção de concorrência com marcação de status em andamento.

---

## [1.2.14] — Espaçamento e Divisores da Navbar & Respiro no HUD do Boss Battle (2026-09-12)

### 🎨 Interface, Navegação & Ergonomia Visual
- **Espaçamento Modular e Divisores na Navbar (`Navbar.tsx`):** Eliminação de elementos colados. Container principal ampliado com `gap-3 sm:gap-4 lg:gap-6`, divisor visual vertical de 1px entre marca e navegação, e cluster de ações da direita bipartido entre Badges de Status (Diário e Nível/Streak) e Ferramentas Utilitárias (Lousa, Tema, Configurações) com divisor sutil intermediário e `cursor-pointer`.
- **Eliminação de Clipping no Boss Battle (`BossBattle.tsx`):** Respiro superior ampliado com `pt-4 sm:pt-6` e `mt-6 sm:mt-8`, e textos flutuantes reancorados em `-top-12 sm:-top-14`, evitando corte superior de `-1 ESCUDO!` sob containers com `overflow-hidden`.

---

## [1.2.13] — Proteção contra DoS OOM no Carregador de Arquivos do Electron (2026-09-12)

### 🛡️ Segurança & Desktop (Electron)
- **Validação de Limite de Arquivo no IPC (`electron/main.cjs`):** Verificação via `fs.promises.stat` antes da leitura com limite de 5MB, prevenindo exaustão de memória e DoS no processo principal (PR #25 via Jules Sentinel).

---

## [1.2.12] — Testes de Precisão Matemática, Integração Render Previews & Hardening CI/CD (2026-09-12)

### 🤖 Automação, Nuvem & CI/CD
- **Deploy Automático no Render (Pull Request Previews):** Configuração do pipeline no Render (`https://quantora-pr-*.onrender.com`) com compilação estática automática para PRs abertos pelo Google Jules e pela equipe.
- **Resolução de Falha no Auto-Merge do Jules (`auto-merge-jules.yml`):** Adicionado `actions/checkout@v4` e a flag explícita `--repo ${{ github.repository }}` nas chamadas do GitHub CLI (`gh pr review` e `gh pr merge`), eliminando o erro `fatal: not a git repository` no runner Ubuntu.
- **Suporte ao Bot Oficial `google-labs-jules[bot]`:** Atualizadas as verificações de identidade e permissões estritas de autorização contra spoofing.

### 🧮 Motor Matemático & Testes
- **Novos Testes Didáticos de Precisão Decimal (`precision.test.ts`):** Cobertura de integridade para números extensos, arredondamento padrão round-half-up (`formatNumber`) e formatação inteligente (`formatNumberSmart`) via `big.js`.
- **396 Testes Unitários Aprovados:** Suíte Vitest ampliada para 396 testes em 22 arquivos, mantendo 100% de taxa de aprovação e 0 avisos no linter Oxlint.

---

## [1.2.10] — Responsividade da Janela, Boss Battle por Níveis, Moedas & Haptics Android (2026-09-12)

### ⚔️ Batalha de Chefe & Progressão
- **Fases Discretas Independentes ("1 Fase, 1 Tentativa"):** Substituição do rush contínuo/chefe estático por níveis selecionáveis individualmente. Vida do chefe escala por $\text{HP}(L) = \lfloor 100 \cdot (1 + 0,35 \cdot (L - 1)) \rceil$.
- **Escudos Restaurados por Nível:** Cada fase iniciada restaura integralmente os 3 escudos do jogador (`PLAYER_INITIAL_SHIELDS`), permitindo foco total em cada desafio.
- **Feedback Didático de Resposta Correta:** Ao errar uma pergunta ou estourar o cronômetro, o HUD exibe o balão `Certo: X` com estilização visual destacada (`correction`), associado ao haptic de dano.
- **Moedas de Chefe & Forja de Upgrades:** Moedas concedidas por vitória ($\text{Moedas}(L) = 10 + L \cdot 5$) gastáveis na Forja integrada para comprar bônus permanente de dano (+3 de dano aditivo por nível em acertos normais e críticos). Custo evolui exponencialmente ($\lfloor 30 \cdot 1,5^U \rfloor$).
- **Vitrine de Recordes:** Recorde de maior nível de chefe superado (`highestBossLevelCleared`) exibido no `ProfileModal.tsx`.

### 📱 Experiência Mobile & Sensorial
- **Feedback Tátil Nativo Android com `@capacitor/haptics`:** Vibrações táteis sincronizadas para combos do Blitz (`hapticComboTick`), combate do Chefe (`hapticBossHit` e `hapticBossDamageTaken`) e transição do badge de Fixação Ativa no Quiz (`hapticMasteryBadge`).

### 🤖 Automação & CI/CD
- **Versionamento Semântico (#minor/#major):** Suporte nativo a tags de minor e major no script `check-and-bump-version.cjs` e alinhamento de repositório padrão para `quantora`.

### 🧪 Suíte de Testes & Qualidade
- **391 Testes Unitários Aprovados:** 22 suítes de teste executando 100% verde em Vitest.
- **Zero Avisos no Linter:** Oxlint aprovado com 0 erros e 0 avisos em 82 arquivos analisados.

---

## [1.2.8] — Repetição Espaçada, Rede CI/CD Permanente & Purga MatSpeed (2026-09-12)

### 🧠 Pedagogia & Retenção de Aprendizado
- **Motor de Repetição Espaçada (Leitner Amortecido):** Implementação de sistema adaptativo de repetição espaçada estilo Anki (`src/core/quiz/spacedRepetition.ts`). Normalização comutativa de fatos matemáticos (`7 × 8` == `8 × 7`), 5 caixas de maturidade e gatilho dual de revisão (contagem de operações globais ou tempo real decorrido).
- **Caderno de Erros (Lobby do Quiz):** Painel dedicado exibindo operações devidas para revisão com contadores em tempo real e modo de "Prática Focada" 100% determinístico.
- **Economia de XP Anti-Exploit:** Curva de XP achatada com prevenção contra fazendas de erros intencionais (+10 XP base, +5 XP de resiliência nas Caixas 1–2) e bônus de graduação de maestria de +50 XP concedido uma única vez ao atingir a Caixa 5 (`hasGraduated: true`).
- **Badges de Fixação no Jogo:** Indicadores visuais dinâmicos no HUD para operações devidas (`⚡ Fixação Ativa · Caixa N`) e comemoração de graduação de memória.

### 🏛️ Interface & Design System
- **Lobby Consolidado em Sobrevivência:** Redesenho completo do Lobby do Quiz com Card Hero Full-Width centralizado em estilo glassmorphism ciano-índigo, integrando o modo Sobrevivência progressivo e unificado.
- **Purga Completa de Branding de Terceiros:** Eliminação total de referências a "MatSpeed" no i18n (`quiz_lobby_title`, `quiz_lobby_subtitle`), componentes e comentários de código.
- **Remoção de Trilhas Isoladas:** Limpeza do grid 2x2 antigo e botão avulso de regra de três, expurgando variáveis órfãs (`somaNivel`, `subNivel`, `multNivel`, `divNivel`).

### 🔒 Segurança & Infraestrutura CI/CD
- **Rede Permanente de Segurança CodeQL:** Workflow automatizado `.github/workflows/codeql.yml` com a suíte `security-extended` do GitHub para análise estática contínua de vulnerabilidades em JS/TS e Actions.
- **Dependabot Ativo:** Configuração `.github/dependabot.yml` com monitoramento automatizado semanal de dependências npm e atualizações de actions do GitHub.
- **Correção da Pipeline de Auto-Merge:** Hardening de `auto-merge-jules.yml` contra injeção em forks e execução não autorizada de scripts em dependências (`npm ci --ignore-scripts`).

---

## [1.2.3] — HUD Mobile Flutuante, Botão Satélite de Rascunho & Pipeline Unificada do APK (2026-09-11)

### 📱 Experiência Mobile & HUD Flutuante
- **Dock de Navegação em Cápsula Flutuante:** Nova barra de navegação móvel centralizada em estilo cápsula (dock) com visual translúcido *glassmorphism* (`backdrop-blur-xl`), destaque na aba ativa com fundo pílula e rótulo, e microinterações táteis otimizadas.
- **Botão Satélite Circular da Lousa:** O botão de acionamento da Lousa de Rascunho (Scratchpad) foi transformado em um satélite circular perfeitamente alinhado ao dock móvel, com indicador pulsante de traços salvos e rotação suave do ícone do lápis.
- **Remoção de Sobreposição no Mobile:** O botão flutuante antigo do desktop foi ocultado no mobile (`hidden md:flex`), eliminando interferências sobre os campos de entrada dos módulos.
- **Cabeçalho Compacto:** Título e subtítulo do app otimizados para evitar quebra de linha em telas pequenas (`hidden sm:block`), garantindo que os botões de ação rápida permaneçam visíveis e confortáveis.
- **Espaçamento de Rolagem Seguro (`pb-24`):** Adicionado padding inferior ao contêiner principal para que nenhum botão ou resultado fique oculto atrás do dock móvel.

### 🤖 Pipeline Unificada de CI/CD (GitHub Actions)
- **Correção de Condição de Corrida no Release:** Unificação dos jobs de release em `.github/workflows/release.yml` com dependência sequencial (`release-android` aguardando `needs: release-windows`).
- **Garantia de Presença do APK:** O aplicativo nativo Android (`Quantora.apk`) agora é anexado de forma perene e garantida a todos os releases do GitHub via `gh release upload`, eliminando falhas silenciosas causadas por execuções paralelas assíncronas.
- **Disparo Manual Opcional:** O workflow avulso `build-apk.yml` foi reconfigurado para `workflow_dispatch`, evitando duplicações concorrentes.

---

## [1.2.2] — Otimização de Performance, Code-Splitting & Seletores Reativos (2026-09-11)

### ⚡ Performance, Bundle Slimming & Code-Splitting
- **Code-Splitting via `React.lazy()` & `Suspense`:** Divisão dos 5 módulos centrais (`BhaskaraModule`, `RegraDeTresModule`, `PhysicsModule`, `QuizModule`, `HistoryModule`) em chunks dinâmicos carregados estritamente sob demanda.
- **Redução de 42.4% no Bundle Inicial:** O chunk inicial `dist/assets/index.js` diminuiu de **575.23 kB** para **331.53 kB** (101.41 kB gzipped), eliminando alertas do Vite.
- **Subdivisão Dinâmica no Quiz:** Carregamento sob demanda dos sub-modos `BlitzGame` (18.37 kB) e `BossBattle` (33.63 kB).
- **Seletores Granulares no Zustand v5:** Substituição de desestruturações integrais da store (`useAppStore()`) por seletores e `useShallow` em todos os módulos e componentes de apresentação, isolando re-renderizações desnecessárias durante contagens regressivas de timers e ganhos de XP.
- **Limpeza de Assets em `public/`:** Remoção de ~827 kB de imagens não utilizadas em tempo de execução (`quantora-logo.jpg`, `icon-192.png`, `icon-512.png`), transferidas para `assets-source/`.
- **Compressão Moderna de Imagens:** Logotipo convertido para WebP de alta fidelidade (`src/assets/logo.webp`), reduzindo seu tamanho de 119 kB para **12.16 kB** (redução de 89.8%).
- **Memoização SVG com `React.memo`:** Otimização e definição de `displayName` explícito em `PhysicsChart.tsx` e `ParabolaChart.tsx`.

---

## [1.2.1] — Atualização de Mecânica Avançada, Usabilidade & CI/CD (2026-09-11)

### ⚛️ Física Analítica & Cinemática Avançada
- **Velocidade Terminal com Arrasto Aerodinâmico:** Queda livre com modelo analítico diferencial integrado ($v(t) = v_t \tanh(gt/v_t)$), tempo via $\operatorname{arcosh}$ e cálculo de discrepância em relação ao vácuo ideal ($\Delta t, \Delta v$).
- **Presets Aerodinâmicos e Astronômicos:** Presets de arrasto (paraquedista de barriga/cabeça, gota de chuva, esfera lisa) e gravidade astronômica (Terra, Lua, Marte, Júpiter e Sol).
- **Modo Avançado no Plano Inclinado:** Força externa aplicada ao longo da rampa com análise vetorial completa, decomposição de forças, atrito estático/cinético e determinação automatizada da direção de aceleração.
- **Correção no Cálculo de MRU:** Adicionado o parâmetro Posição Final ($S$) para resolver incógnitas $S_0$, $v$ e $t$ sem exceções de parâmetros ausentes.

### 🎨 Usabilidade & Lousa Digital
- **Lousa Mobile-Friendly (Scratchpad):** Modo sanfona recolhível de paleta (`isPaletteCollapsed`) para evitar estouro horizontal de tela em dispositivos móveis, e botão unificado de fechar/minimizar.
- **Logotipo do Header (Navbar):** Importação estrita ESM do asset `logo.png` para compatibilidade total com empacotamento Electron (`file://`) e contingência visual via SVG estilizado.

### 🤖 Automação & CI/CD
- **Auto-Incremento de Patch:** Script `check-and-bump-version.cjs` para incrementar versões automaticamente no GitHub Actions quando a tag já existir.
- **Publicação Automatizada de Releases:** Script `publish-release.cjs` integrado para gerar instaladores Windows (.exe NSIS/portátil) e APK Android com notas extraídas do CHANGELOG.

### 🧪 Suíte de Testes & Qualidade
- **357 Testes Unitários Aprovados:** 18 suítes de teste executando 100% verde em Vitest.
- **Zero Avisos no Linter:** Oxlint aprovado com 0 erros e 0 avisos em 76 arquivos.

---

## [1.2.0] — Módulo de Física Clássica & Gráficos Interativos (2026-09-11)

### ⚛️ Módulo de Física Clássica & Mecânica Analítica
- **10 Modos de Resolução Passo a Passo:**
  1. **MRU (Movimento Retilíneo Uniforme):** Posição horária, velocidade constante e tempo.
  2. **MRUV & Torricelli:** Aceleração linear, distância e tempo de frenagem automática.
  3. **Queda Livre:** Altura inicial, aceleração da gravidade, tempo de queda e velocidade de impacto.
  4. **Lançamento Vertical:** Subida desacelerada, altura máxima, tempo total e velocidade de retorno.
  5. **Lançamento Horizontal:** Decomposição independente de Galileu, alcance horizontal e velocidade resultante.
  6. **Lançamento Oblíquo (Balística 2D):** Ângulo de disparo, alcance parabólico e ápice da trajetória.
  7. **MCU (Movimento Circular Uniforme):** Frequência, período, velocidade angular ($\omega$), velocidade linear e aceleração centrípeta.
  8. **MHS (Movimento Harmônico Simples):** Pêndulo simples e oscilador massa-mola com funções senoidais.
  9. **Plano Inclinado & Leis de Newton:** Decomposição $P_x$ e $P_y$, força normal, atrito estático/cinético e aceleração na rampa.
  10. **Conservação de Energia & Trabalho:** Energia cinética, potencial gravitacional e mecânica total; trabalho de forças constantes e potência mecânica (com conversões para CV e HP).
- **5 Motores de Gráficos SVG Vetoriais Interativos (`PhysicsChart.tsx`):**
  - Gráficos cartesianos temporais contínuos ($S \times t, v \times t$).
  - Balística 2D com solo pontilhado, solo $y=0$, nós interativos de ápice ($h_{max}$) e alcance horizontal ($A$).
  - Órbita circular com raio e vetores de velocidade e aceleração centrípeta.
  - Diagrama de corpo livre do plano inclinado com 5 vetores de força renderizados dinamicamente.
  - Gráficos de barras proporcionais para energias e trabalho.
- **Integração Completa:**
  - Aba de Física com ícone `Atom` na barra de navegação superior (`Navbar.tsx`).
  - Tipo `'physics'` integrado ao validador e persistência de Histórico (`HistoryModule.tsx`).
  - Suporte bilingue (Português e Inglês) em todos os modos e unidades.

### 🧪 Expansão e Qualidade de Testes
- **342 Testes Unitários Aprovados:** 17 suítes de teste executando 100% verde em Vitest.
- **Zero Avisos no Linter:** Oxlint aprovado com 0 erros e 0 avisos em 74 arquivos.
- **Build de Produção Limpo:** TypeScript strict mode compilado sem falhas.

---

## [1.1.1] — Atualização de Estabilidade, Segurança & Jules AI (2026-09-11)

### 🔥 Correção Crítica de Ofensiva (Streak Diário)
- **Data Local do Dispositivo:** A ofensiva agora é estritamente vinculada ao relógio local do usuário (`getDeviceLocalDateString`), evitando que noites (a partir das 21h em fusos como UTC-3) avancem o calendário indevidamente para o dia seguinte.
- **Prevenção de Falsos Incrementos:** Recarregar a tela (`F5`) ou reabrir o app agora executa apenas a manutenção passiva (`checkStreakMaintenance`); o streak **nunca** soma dias sem a conclusão de uma atividade real.

### 🌓 Temas & Internacionalização (i18n)
- **Modo Claro Instantâneo:** Correção na alternância entre temas Claro e Escuro, garantindo sincronização imediata no elemento raiz sem retenção de classes CSS.
- **Configurações 100% Bilíngues:** Mapeamento completo e reativo de todos os rótulos, botões e status do modal de Configurações em Português e Inglês.

### 🔒 Segurança & Confiabilidade (Contribuições Jules AI)
- **Proteção contra Sobrecarga (DoS):** Limite de 5MB no upload de arquivos de histórico com mensagem amigável de erro, prevenindo travamentos do navegador.
- **IDs Criptograficamente Seguros:** Geração de identificadores de histórico com `crypto.randomUUID()`.
- **Navegação Segura no Electron:** Validação rigorosa de URLs externas no `shell.openExternal` utilizando `parsedUrl.href`.

### ⚡ Performance & Qualidade de Código
- **Otimização de Expressões Regulares:** Reutilização de regex (`QUOTE_REGEX` no exportador CSV e `BOLD_REGEX` no passo a passo) em escopo de módulo para evitar recompilações em loops de renderização.
- **Log Semântico:** Uso de `console.error` para registro de falhas de registro do Service Worker.
- **Refatoração:** Criação da função auxiliar `showTemporaryStatus` no modal de configurações.

### 🧪 Expansão da Suíte de Testes (172 Testes)
- Nova suíte de testes unitários para o módulo `precision.ts` (`src/tests/precision.test.ts`).
- Novos testes para divisões por zero e tratamento de erros na Regra de Três Simples, Composta e Bhaskara.
- Cobertura expandida para 172 testes unitários em 12 suítes, 100% aprovados.

### 🤖 Automação & AGENTS.md
- Adicionado o manifesto `AGENTS.md` na raiz do projeto com diretrizes arquiteturais, regras de streak local e convenções para o agente autônomo Jules da Google.

---

## [1.1.0] — The Evolution Update (2026-09-10)

### 🏆 Conquistas & Troféus
- **16 Medalhas Desbloqueáveis:** Categorizadas em *Habilidade*, *Consistência*, *Mestria* e *Desafios*.
- **Vitrine no Perfil:** Acompanhe o progresso (X/16), filtros por categoria e status de bloqueado/desbloqueado.
- **Celebração em Tempo Real:** Alerta animado flutuante (*Achievement Toast*) com confetes coloridos.

### 📝 Lousa de Rascunho Digital (Scratchpad)
- Botão flutuante de lápis acessível em qualquer tela para rabiscos e cálculos rápidos.
- Suporte a toque (*touch*) e mouse com opções de caneta colorida e borracha.
- Persistência temporária ao fechar e reabrir.

### 📅 Desafio Diário (Daily Challenge)
- Motor determinístico de questões baseado na data ISO.
- Recompensa exclusiva de **+150 XP**, streak diário e contagem regressiva para a meia-noite.
- Botão de compartilhamento formatado para a área de transferência.

### ⚡ Modo Blitz (60 Segundos)
- Modo contra o relógio dinâmico: **+2s por acerto** e **-3s por erro**.
- Multiplicador de combo de XP progressivo ($1\times \to 2\times \to 3\times$).

### 👾 Batalha de Chefe Matemático (Boss Rush)
- Enfrente o Chefe com **100 HP** e proteja seus 3 escudos.
- Bônus de **dano crítico** por velocidade de resposta (<3s).

### 📱 Android & Infraestrutura
- Suporte a **Java 21** e **Android SDK 36** via Capacitor 8.
- Suíte completa de 149 testes unitários com Vitest.

---

## [1.0.6] (2026-09-10)
- 📱 **Compilação Oficial Android (.apk):** Integração com Capacitor 8, Java 21 e Android SDK 36.
- ⚙️ **Automação de Build:** Workflow dedicado no GitHub Actions para empacotar o APK assinado a cada versão.
- 🛠️ **Correções:** Ajuste na resolução de dependências no pipeline de integração contínua.

---

## [1.0.5] (2026-09-10)
- 🤖 **Integração com Jules:** Automação de revisão e merge inteligente com execução obrigatória da suíte Vitest.
- ⚡ **Otimização de Carregamento:** Redução de bundle com Vite e chunks dinâmicos.
- 🧪 **Testes:** Expansão da cobertura de testes para cálculos de fração e conversão.

---

## [1.0.4] (2026-09-10)
- 🎮 **Gamificação & Níveis:** Sistema de patentes matemáticas, cálculo de XP e barra de progressão de nível.
- 🔥 **Ofensiva Diária (Streak):** Monitoramento de dias consecutivos de estudo com bônus de XP.
- ⚙️ **Configurações:** Exibição dinâmica da versão instalada no modal de configurações.

---

## [1.0.3] (2026-09-10)
- 📈 **Gráficos 2D:** Renderização matemática aprimorada para funções quadráticas e parábolas.
- ♿ **Acessibilidade:** Navegação completa por teclado com foco visual nos campos de entrada.
- 🎨 **Interface:** Refinamento do contraste em temas escuros.

---

## [1.0.2] (2026-09-10)
- 🔄 **Atualizações Automáticas (Auto-Update):** Suporte ao Electron-Updater para download silencioso de updates no Windows.
- ⏱️ **Modo Quiz:** Novo motor de cronômetro com feedback sonoro/visual em respostas certas e erradas.

---

## [1.0.1] (2026-09-09)
- 🌐 **Internacionalização:** Suporte completo aos idiomas Português (Brasil) e Inglês (US) com troca dinâmica.

---

## [1.0.0] (2026-09-09)
- 🎉 **Lançamento Inicial Desktop:** Calculadora científica, gerador de gráficos 2D, conversor de unidades, fórmulas interativas e quiz matemático.

---

## 🔗 Navegação na Documentação (Obsidian)
* [[Quantora - Visao Geral]]
* [[Dashboard]]
* [[Changelog & Historico de Bugs]]
* [[README]]
* [[Deploy & Releases]]