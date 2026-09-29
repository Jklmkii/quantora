# 🤖 AGENTS.md — Arquitetura & Diretrizes para Agentes Autônomos

Bem-vindo, Agente! Este documento estabelece o mapa arquitetural, as convenções operacionais e os limites técnicos para agentes de inteligência artificial (como **Google Antigravity** e **Jules AI**) trabalhando neste repositório.

> [!NOTE]
> **Orquestração Agêntica & Precedência:** Para o agente principal **Google Antigravity**, as diretrizes executáveis de classificação de complexidade, controle de cota e roteamento de tarefas entre agentes estão formalizadas em `GEMINI.md` (raiz do projeto), o qual possui prioridade executiva máxima sobre este documento.

---

## 🧭 1. Visão Geral do Repositório & Missão

* **Nome do Projeto:** `[NOME_DO_PROJETO]`
* **Objetivo Principal:** `[DESCRICAO_DO_OBJETIVO_E_PROPOSTA_DE_VALOR]`
* **Plataformas-Alvo:**
  * **Web Application:** React 19 + TypeScript + Vite + Tailwind CSS v4.
  * *(Opcional)* **Desktop App:** Electron (NSIS installer & portable `.exe`).
  * *(Opcional)* **Mobile App:** Capacitor (Android SDK / iOS).
* **Filosofia Central:** Alta performance, tipagem estrita, acessibilidade inclusiva (WCAG AAA), zero telemetria invasiva e 100% de cobertura nos motores lógicos.

---

## 🛠️ 2. Stack Tecnológica & Subsistemas

| Subsistema | Tecnologias / Bibliotecas | Diretório |
| :--- | :--- | :--- |
| **Frontend Framework** | React `^19.x`, TypeScript `^7.x`, Vite `^8.x` | `src/` |
| **Estilização & Ícones** | Tailwind CSS `^4.x`, Lucide React | `src/index.css`, `src/presentation/` |
| **Estado & Persistência** | Zustand `^5.x` (`persist` middleware, `localStorage`) | `src/store/useAppStore.ts` |
| **Motores de Cálculo / Regra de Negócio**| TypeScript puro, `big.js` (se houver matemática) | `src/core/` |
| **Internacionalização** | Dicionários reativos in-house (`pt` e `en`) | `src/core/i18n/` |
| **Suíte de Testes** | Vitest `^5.x` (100% de aprovação obrigatória) | `src/tests/` |
| **Linter de Alta Velocidade**| Oxlint `^1.x` | `.oxlintrc.json` |

---

## ⚡ 3. Comandos de Verificação & Qualidade

Antes de submeter qualquer Pull Request, commit ou alteração no código-fonte, execute obrigatoriamente:

```bash
# 1. Executar toda a suíte de testes unitários automatizados (100% de aprovação obrigatória)
npx vitest run

# 2. Verificar tipagem TypeScript e compilação do bundle de produção (código 0 obrigatório)
npm run build

# 3. Verificar code smells, dead code e conformidade com o linter (0 warnings e 0 errors)
npm run lint
```

---

## 📏 4. Regras & Convenções de Engenharia para Agentes

### A. Datas, Fusos Horários e Streaks Locais
* **NUNCA use `new Date().toISOString()` para cálculos de dias civis, resets diários ou streaks.**
  * Em fusos horários UTC-negativos (como UTC-3 no Brasil), `toISOString()` vira o dia às 21:00, corrompendo a lógica do usuário.
* **Sempre use uma função utilitária local** que extraia o ano, mês e dia com base no relógio do dispositivo:
  ```typescript
  export function getDeviceLocalDateString(date: Date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  ```

### B. Precisão Numérica e Ponto Flutuante
* Nunca realize divisões ou multiplicações com floats brutos onde a precisão binária IEEE 754 possa gerar artefatos como `0.30000000000000004`.
* Use bibliotecas de precisão arbitrária (`big.js`) para operações críticas e formatação didática com símbolo de aproximação (`≈`) quando houver dízimas.

### C. Qualidade de Código & Tipagem Estrita
* **Proibição de `any`:** Defina interfaces e tipos explícitos em `src/types/index.ts`.
* **Zero Mocks em Produção:** O código de produção deve ser real e completo. Stubs ou mocks são estritamente limitados ao ambiente de teste.
* **Preservação de Testes:** Nunca apague ou enfraqueça asserções de testes existentes. Atualize os testes se o comportamento intencional tiver mudado.

### D. Pair-Programming Ativo (Narração em Tempo Real)
* O desenvolvedor prefere transparência passo a passo. O agente **NUNCA** deve operar em silêncio executando blocos massivos sem contexto.
* Contextualize brevemente cada ação antes de executá-la com frases curtas e diretas.
* Reporte resultados de build, testes e linter imediatamente com marcadores visuais (`✅`).
* Conclua tarefas apresentando uma tabela resumo de status, build e lint.

### E. Link Mandatório de Acompanhamento de Commits (Regra Obrigatória)
* Sempre que realizar um `git push` ou criar um commit na branch `main`, o agente DEVE expressamente fornecer o link clicável direto para o commit no GitHub (`https://github.com/<usuario>/<repo>/commit/<hash>`), permitindo auditar o diff e workflows de CI/CD.

### F. Documentação Sincronizada com o Obsidian Vault (Obsidian-First)
* Antes de iniciar tarefas: consultar o cofre em `Obsidian-Vault/10 - Projetos/[NOME_DO_PROJETO]/` para verificar decisões prévias e evitar retrabalho.
* Ao concluir alterações: registrar novos bugs resolvidos no `Historico de Bugs.md` (com diagnóstico, causa raiz e prevenção) e registrar o prompt do usuário no `Historico de Prompts & Demandas.md`.
