# 🤖 AGENTS.md — Quantora Architecture & Guidelines for Autonomous Agents

Welcome, Agent! This document provides an architectural map, operational conventions, and technical constraints for autonomous agents (such as **Google Jules**) working on the **Quantora** repository.

> [!NOTE]
> **Orquestração Agêntica & Precedência:** Para o agente principal **Google Antigravity**, as diretrizes executáveis de classificação de complexidade, controle de cota e roteamento de tarefas entre agentes estão formalizadas em `GEMINI.md` (raiz do projeto), o qual possui prioridade executiva máxima sobre este documento.

---

## 🧭 1. Repository Overview & Mission

**Quantora** is an offline-first, cross-platform educational application designed for didactic step-by-step mathematical problem solving, rapid arithmetic mental training, and gamified challenges.

* **Primary Targets:**
  * **Web Application:** React 19 + TypeScript + Vite + Tailwind CSS v4.
  * **Desktop Windows App:** Electron 44 (NSIS installer & portable `.exe`).
  * **Mobile Android App:** Capacitor 8 (SDK 36, Java 21, Gradle).
* **Core Philosophy:** 100% offline capability, zero external telemetry/backend dependency, arbitrary arithmetic precision, and high-performance local state management.

---

## 🛠️ 2. Tech Stack & Key Subsystems

| Subsystem | Technologies / Libraries | Directory Path |
| :--- | :--- | :--- |
| **Frontend Framework** | React `^19.2.8`, TypeScript `~7.0.2`, Vite `^8.2.2` | `src/` |
| **Styling & Icons** | Tailwind CSS `^4.3.3`, `@tailwindcss/vite`, Lucide React | `src/index.css`, `src/presentation/` |
| **State & Persistence** | Zustand `^5.0.15` (`persist` middleware, `localStorage`) | `src/store/useAppStore.ts` |
| **Math Engines** | Pure TypeScript, `big.js ^7.0.1` | `src/core/math/` |
| **Physics Engines** | Pure TypeScript, `big.js`, analytical classical mechanics | `src/core/physics/` |
| **Gamification & Streak** | Pure TypeScript, deterministic algorithms | `src/core/gamification/` |
| **Training & Mini-Games** | Pure TypeScript (Mulberry32 PRNG, Blitz, Boss Rush) | `src/core/daily/`, `src/core/quiz/` |
| **Data Integrity** | Schema validation for history & local storage | `src/core/storage/historyValidator.ts` |
| **Internationalization** | In-house reactive i18n (`pt` and `en`) | `src/core/i18n/translations.ts` |
| **Test Suite** | Vitest `^5.0.0` (408 tests across 24 test suites) | `src/tests/` |
| **Linter** | Oxlint `^1.79.0` (87 files analyzed) | `.oxlintrc.json` |

---

## 📂 3. Directory Layout & Key Files

```
quantora/
├── .github/workflows/
│   ├── release.yml               # Windows Electron build & GitHub release
│   ├── build-apk.yml             # Android Capacitor APK build via Gradle
│   └── auto-merge-jules.yml      # CI that tests and auto-merges Jules PRs
├── electron/
│   ├── main.cjs                  # Electron main process (window lifecycle, updater)
│   └── preload.cjs               # Safe contextBridge IPC API
├── scripts/
│   ├── check-and-bump-version.cjs # Auto-bumps patch release if tag exists on GitHub
│   └── publish-release.cjs       # Releases asset binaries with changelog notes
├── src/
│   ├── core/
│   │   ├── daily/
│   │   │   └── dailyEngine.ts    # Deterministic FNV-1a + Mulberry32 daily challenge
│   │   ├── gamification/
│   │   │   └── leveling.ts       # XP formula, titles, 16 achievements & local streak
│   │   ├── i18n/
│   │   │   └── translations.ts   # Complete Portuguese and English dictionaries
│   │   ├── math/
│   │   │   ├── bhaskara.ts       # Quadratic equations, delta, complex roots & vertex
│   │   │   ├── regraDeTresSimples.ts   # Direct and inverse simple rule of three
│   │   │   ├── regraDeTresComposta.ts  # Multi-column compound rule of three
│   │   │   └── precision.ts      # Floating-point safety using big.js
│   │   ├── physics/              # 10 Classical Mechanics calculation modules
│   │   │   ├── mru.ts            # Uniform linear motion
│   │   │   ├── mruv.ts           # Uniformly accelerated motion & Torricelli
│   │   │   ├── quedaLivre.ts     # Free fall with terminal velocity & drag
│   │   │   ├── lancamentoVertical.ts
│   │   │   ├── lancamentoHorizontal.ts
│   │   │   ├── lancamentoObliquo.ts
│   │   │   ├── mcu.ts            # Uniform circular motion
│   │   │   ├── mhs.ts            # Simple harmonic motion (pendulum & spring)
│   │   │   ├── planoInclinado.ts # Inclined plane with static/kinetic friction & applied force
│   │   │   └── energiaTrabalho.ts# Work, power & mechanical energy conservation
│   │   ├── quiz/
│   │   │   ├── quizGenerator.ts  # Arithmetic tracks (addition, sub, mult, div, survival)
│   │   │   ├── blitzEngine.ts    # 60s Blitz mode (+2s, -3s, combos 1x-3x)
│   │   │   └── bossEngine.ts     # Boss Battle (100 HP, 3 shields, critical hits <3s)
│   │   └── storage/
│   │       └── historyValidator.ts # Schema validation and corrupted data recovery
│   ├── presentation/
│   │   ├── components/
│   │   │   ├── Navbar.tsx        # Top navigation, streak & level badges
│   │   │   ├── Scratchpad.tsx    # Transparent HTML5 canvas floating whiteboard
│   │   │   ├── ProfileModal.tsx  # Trophy showcase (16 achievements) & statistics
│   │   │   ├── SettingsModal.tsx # Theme, language, precision, export/import
│   │   │   ├── BlitzGame.tsx     # Blitz 60s gameplay screen
│   │   │   ├── BossBattle.tsx    # Boss battle gameplay screen
│   │   │   ├── DailyChallengeCard.tsx # Daily challenge UI with sharing
│   │   │   ├── AchievementToast.tsx   # Floating unlock animation
│   │   │   ├── ParabolaChart.tsx # SVG Cartesian graph for quadratic functions
│   │   │   └── PhysicsChart.tsx  # 5 interactive SVG charts for classical mechanics
│   │   └── modules/
│   │       ├── BhaskaraModule.tsx
│   │       ├── RegraDeTresModule.tsx
│   │       ├── PhysicsModule.tsx # 10 physics modes with interactive UI & diagrams
│   │       ├── QuizModule.tsx
│   │       └── HistoryModule.tsx
│   ├── store/
│   │   └── useAppStore.ts        # Central Zustand store with localStorage persistence
│   ├── tests/                    # 24 unit test files (Vitest - 408 tests)
│   ├── types/
│   │   └── index.ts              # Global TypeScript interfaces and types
│   ├── App.tsx                   # Root component, theme provider & tab routing
│   └── main.tsx                  # React entry point
├── package.json
└── vite.config.ts
```

---

## ⚡ 4. Verification & Testing Commands

Before submitting any Pull Request or proposing code changes to the Quantora codebase, run and verify the following commands:

> [!NOTE]
> **Escopo de Execução dos Testes:** Quando a tarefa ou demanda não envolver alterações no código da aplicação Quantora (por exemplo: configurações globais de ambiente, servidores MCP, manutenção de documentação no Obsidian, credenciais ou scripts externos isolados), **não é necessário rodar a suíte Vitest nem compilar o bundle**. A execução completa é obrigatória apenas ao modificar arquivos de código-fonte do produto (`src/`, componentes, motores matemáticos/físicos, testes ou configurações de build).

```bash
# 1. Run the entire automated unit test suite (Must be 100% passing when changing project code)
npx vitest run

# 2. Verify TypeScript types and production bundle build (Must exit with code 0 when changing project code)
npm run build

# 3. Check for code smells, dead code, and linter errors
npm run lint
```

---

## 📏 5. Rules & Conventions for Agents

When implementing features, fixing bugs, or refactoring code, adhere strictly to these rules:

### A. Date, Time & Streak Calculation
* **NEVER use raw `new Date().toISOString()` for daily resets, streaks, or calendar days.**
  * In UTC-negative timezones (e.g. UTC-3 in Brazil), `toISOString()` enters tomorrow at 21:00, corrupting user streaks.
* **Always use `getDeviceLocalDateString(date)`** from `src/core/gamification/leveling.ts`, which extracts the device's local calendar year, month, and day (`YYYY-MM-DD`).
* **Passive Mount vs. Active Action:**
  * Opening or refreshing the app must **never** increment streak days. Use `checkStreakMaintenance()` to preserve the streak or expire it if inactive for $> 1$ day.
  * Only real user completions (e.g., `completeDailyChallenge`) may trigger `calculateStreakUpdate()`.

### B. Mathematical Accuracy & Precision
* Never perform raw floating-point operations where IEEE 754 precision issues may produce artifacts like `0.30000000000000004`.
* Use `big.js` and the helper functions in `src/core/math/precision.ts` for divisions, multiplications, and decimal formatting.
* When handling quadratic equations ($\Delta < 0$), generate valid complex roots formatted as `p ± qi`. Do not throw errors or return `NaN`.

### C. Gamification & Progression Formula
* **Level Progression:** Formula is $XP_{req}(L) = 50 \cdot L \cdot (L - 1)$.
* **Achievements:** All 16 achievements are defined in `ACHIEVEMENTS` inside `src/core/gamification/leveling.ts`. Any new achievement must include:
  * Unique ID, Icon, Category, XP Reward, Title & Description in both PT and EN, and an evaluation condition.

### D. UI, Themes & Internationalization
* **Tailwind CSS v4:** Use standard utility classes. Dynamic styling must be handled with `clsx` and `tailwind-merge`.
* **Dark / Light Theme:** Ensure every component renders correctly in both `.dark` mode and default light mode. Do not hardcode dark backgrounds without specifying light alternatives.
* **i18n:** All user-facing strings must be mapped in `src/core/i18n/translations.ts` in both `pt` (Portuguese) and `en` (English).

### E. Code Quality & Test Integrity
* **Strict Typing:** Avoid `any`. Define or reuse interfaces in `src/types/index.ts`.
* **Zero Production Mocks:** Production code must be fully implemented. Stubs, fake static returns, or mock simulations in production modules are strictly prohibited.
* **Preserve Tests:** Do not delete or weaken existing tests in `src/tests/`. If changing business logic, update corresponding tests to reflect the new intended behavior and maintain 100% test pass rate.

### F. Sincronização Obrigatória com o Obsidian (Obsidian-First — Foco Estrito no Desenvolvimento)
* **Antes de Iniciar Qualquer Tarefa:** Sempre consulte as notas do projeto em `Obsidian-Vault/Projetos/Quantora/` (`Decisoes & Estado Atual.md`, `Quantora - Visao Geral.md`, etc.) para verificar requisitos prévios, convenções de arquitetura e decisões já tomadas, minimizando retrabalho e consumo desnecessário de contexto.
* **Ao Concluir ou Alterar Funcionalidades:** Sempre registre ou atualize o Obsidian com as novas decisões, mudanças de estado, correções de bugs em `Changelog & Historico de Bugs.md` e impactos nos módulos correspondentes.
* **Indexação Estrita de Prompts de Desenvolvimento:**
  A partir de agora, **todo prompt relacionado ao desenvolvimento deste programa deve ser salvo, indexado e correlacionado à alteração implementada no Obsidian**. Cada registro deve manter o vínculo estruturado entre:
  1. `💬 Requisito / Texto Original do Usuário (Ipsis Litteris)`
  2. `🛠️ Arquivos Modificados / Impactados` (caminhos absolutos e links diretos).
  3. `🧠 Implementação Realizada & Raciocínio (Analysis and Reasoning em Português)`:
     * **User's Goal:** Intenção do requisito de desenvolvimento.
     * **Evaluation of the Solution:**
       * **Core Functionality:** Implementação técnica e lógica das alterações.
       * **Safety & Side Effects:** Tipagem, segurança, ausência de regressões.
       * **Completeness:** Validação contra requisitos e testes unitários.
       * **Merge / Release Assessment:** Estado de prontidão para commit, release e compilação.
  4. `📊 Resultado & Verificação` (status da compilação, testes unitários aprovados e versão publicada).
* **Inclusão Obrigatória de Scripts nos Relatórios (Regra Mandatória):**
  Sempre que o usuário solicitar verificar ou executar um script a partir da aba/pasta `scripts/` (ex: "verifique a aba de script para executá-la", "pegue o novo script"):
  - **No Relatório de Resposta no Chat:** Incluir expressamente o nome do script e a transcrição / síntese dos seus requisitos e diretrizes no corpo da resposta para confirmação e rastreabilidade imediata do usuário.
  - **No Registro do Vault (`Historico de Prompts & Demandas.md`):** Anexar a íntegra do script original sob a seção `💬 Requisito / Texto Original do Usuário (Ipsis Litteris)`, garantindo que o teor do arquivo fique eternamente auditável e preservado no cofre mesmo após eventual exclusão do arquivo bruto da pasta `scripts/`.
* **Filtro Mandatório Contra Conteúdos Off-Topic:**
  É terminantemente proibido registrar ou manter no Obsidian conteúdos que não façam parte do desenvolvimento deste programa, como dúvidas gerais, conversas casuais, pesquisas, explicações teóricas ou outros assuntos off-topic.
* **Exclusão Somente sob Permissão Expressa do Usuário (Regra Mandatória):**
  Qualquer exclusão, expurgo ou remoção de notas, arquivos ou diretórios do Obsidian Vault só poderá ser realizada com a autorização prévia, expressa e explícita do usuário.
* **Preservação da Pasta `raw/`:**
  A pasta `raw/` abriga materiais brutos não tratados que serão mantidos intactos e processados exclusivamente quando solicitado pelo usuário.
* **Credenciais & Tokens:**
  O arquivo `Sistemas & Integracoes/Credenciais & Tokens.md` é permanente e vital para a autenticação não-interativa do Git (GitHub PAT) e execução dos agentes.

### G. Análise de Falhas, Causa Raiz & Prevenção no Vault (Regra Mandatória)
* **Análise Prévia Obrigatória:** Toda falha recorrente ou relevante encontrada durante a execução (seja em testes, build, automação de CI/CD, comandos de terminal ou comportamento da UI) deve ser minuciosamente analisada **antes** de qualquer tentativa de correção.
* **Proibição de Tentativa-e-Erro Cega:** O agente nunca deve aplicar "patches rápidos" sem compreender a causa raiz profunda do comportamento inesperado.
* **Registro Obrigatório no Vault (`Changelog & Historico de Bugs.md`):**
  Para cada falha ou bug diagnosticado e resolvido, registrar rigorosamente:
  1. **Sintoma & Diagnóstico da Causa Raiz:** O que ocorreu e qual o mecanismo exato do defeito.
  2. **Solução Aplicada:** Como o defeito foi corrigido estruturalmente na fonte.
  3. **Forma de Prevenção Definitiva:** Regras de arquitetura, testes unitários de regressão no Vitest, salvaguardas ou automações adicionadas para blindar o sistema e impedir a repetição do erro no futuro.

---

## 🤖 6. Pull Request Conventions

* Use **Conventional Commits**:
  * `feat:` for new capabilities or math modes.
  * `fix:` for bug fixes.
  * `test:` for expanding unit or stress tests.
  * `refactor:` for code restructuring without behavior changes.
* **Version Bumping & Cadence Conventions (`check-and-bump-version.cjs`):**
  * **Auto-Patch (Default):** Merges comuns em `main` com tag existente disparam automaticamente bump de patch (`x.y.z -> x.y.(z+1)`).
  * **Gatilho de Minor (`#minor`):** Inclua o marcador `#minor` no título ou corpo do commit/PR para avançar a versão minor (`x.y.z -> x.(y+1).0`), indicado para novos modos de jogo, módulos matemáticos ou recursos substanciais.
  * **Gatilho de Major (`#major`):** Inclua o marcador `#major` no título ou corpo do commit/PR para avançar a versão major (`x.y.z -> (x+1).0.0`), reservado para reestruturações arquiteturais ou quebras de compatibilidade.
* Provide a concise, bulleted summary of:
  1. What was changed.
  2. Why the change was made.
  3. Commands executed to verify the change (`vitest`, `npm run build`, `lint`).

---

## 🔗 Navegação na Documentação (Obsidian)
* [[Quantora - Visao Geral]]
* [[Dashboard]]
* [[GEMINI]]
* [[Antigravity & Cotas de IA]]
* [[README]]
* [[Suite de Testes & Qualidade]]
