# 🚀 Blueprint Starter Kit — Arquitetura de Alto Desempenho & Governança Agêntica

Este repositório/pasta contém os padrões de engenharia, governança entre agentes de IA (**Google Antigravity** e **Jules AI**), automações de CI/CD, configurações de qualidade e templates de documentação extraídos e consolidados a partir do desenvolvimento do projeto **Quantora**.

---

## 📂 Estrutura do Kit

```text
blueprint-starter-kit/
├── 01-regras-e-governanca-ia/
│   ├── AGENTS.md                   # Diretrizes universais de arquitetura, testes e pair programming
│   └── GEMINI.md                   # Matriz de complexidade, roteamento Antigravity ↔ Jules e cotas
├── 02-arquitetura-e-padroes-codigo/
│   ├── zustand-store-template.ts   # Store Zustand com persistência local, migração e seletores atômicos
│   ├── precision-math-template.ts  # Tratamento numérico seguro (big.js, IEEE 754 e aproximação ≈)
│   ├── streak-date-helper.ts       # Tratamento de datas e streak imune a fuso horário negativo (UTC-3)
│   └── i18n-dictionary-template.ts # Dicionário bilíngue reativo ultraleve (sem dependências pesadas)
├── 03-qualidade-e-testes/
│   ├── .oxlintrc.json              # Linter em Rust ultra-rápido (100x mais rápido que ESLint)
│   ├── vitest.config.ts            # Configuração otimizada para suíte de testes unitários Vitest
│   └── example-test-suite.test.ts  # Padrão de testes unitários cobrindo determinismo e casos de borda
├── 04-ci-cd-e-automacoes-github/
│   ├── auto-merge-jules.yml        # CI do GitHub Actions para testar e auto-aprovar PRs da Jules AI
│   └── check-and-bump-version.cjs  # Script de auto-bump semântico (#patch, #minor, #major)
├── 05-obsidian-vault-template/
│   ├── Visao Geral & Arquitetura.md
│   ├── Decisoes & Estado Atual.md
│   ├── Historico de Bugs.md        # Metodologia Forense (Sintoma, Causa Raiz e Prevenção)
│   └── Historico de Prompts & Demandas.md # Indexação estrita ipsis litteris de demandas
└── README.md                       # Este guia de inicialização rápida
```

---

## ⚡ Passo a Passo: "Do Zero ao Primeiro Commit" no Novo Projeto

### 1. Inicializar o Repositório Git
```bash
git init
git branch -M main
```

### 2. Copiar as Regras de Governança
Copie os arquivos de `01-regras-e-governanca-ia/` para a raiz do seu novo projeto:
* `AGENTS.md` (regras gerais e convenções).
* `GEMINI.md` (regras específicas do Antigravity e matriz de delegação).
* Ajuste o nome do projeto e os caminhos dentro dos arquivos copiados.

### 3. Configurar Qualidade & Testes
Instale o Oxlint e o Vitest no `package.json`:
```bash
npm install -D oxlint vitest
```
Copie `.oxlintrc.json` e `vitest.config.ts` para a raiz do projeto.

### 4. Configurar CI/CD no GitHub
Copie `.github/workflows/auto-merge-jules.yml` para habilitar a colaboração assíncrona com a Jules AI.

### 5. Inicializar a Documentação no Obsidian
Copie a pasta `05-obsidian-vault-template/` para dentro de `Obsidian-Vault/10 - Projetos/<NomeDoSeuNovoProjeto>/`.
Atualize o catálogo do cofre (`vault_catalog.json` e `llms.txt`).

---

## 🎯 As 7 Regras de Ouro Aprendidas no Quantora

1. **Governança por Complexidade (`GEMINI.md`):** Demandas de complexidade Baixa ou Média (CSS, acessibilidade ARIA, internacionalização, testes pontuais) devem ser delegadas para a Jules AI via API para poupar a cota semanal do Antigravity.
2. **Proibição de Pré-Resolver:** Ao despachar tarefas para a Jules, forneça apenas o sintoma, o arquivo provável e os critérios de aceite (estilo Jira ticket) — nunca a solução pronta.
3. **Cálculo de Datas sem `toISOString()`:** Nunca use `toISOString()` para cálculos de dias, desafios diários ou streaks no Brasil/fusos negativos; use sempre a data local do dispositivo (`YYYY-MM-DD`).
4. **Precisão Numérica Estrita:** Em cálculos matemáticos ou financeiros, nunca utilize operadores de float brutos (`/`, `*`). Utilize `big.js` para blindagem contra artefatos IEEE 754.
5. **Pair-Programming Ativo:** O agente de desenvolvimento deve narrar brevemente suas ações antes de executar, diagnosticar erros abertamente e fornecer feedback atômico com tabela de verificação final.
6. **Análise Forense de Causa Raiz:** Todo bug corrigido deve ser documentado no `Historico de Bugs.md` com Diagnóstico Profundo, Solução Aplicada e Forma de Prevenção Definitiva.
7. **Rastreabilidade Ipsis Litteris:** Toda demanda deve ter seu texto original copiado na íntegra no `Historico de Prompts & Demandas.md`, acompanhada do hash e link clicável do commit no GitHub.
