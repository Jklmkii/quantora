---
aliases: ["[NOME_DO_PROJETO] - Visão Geral", "Arquitetura"]
tags: [projeto, arquitetura, visao-geral]
data_criacao: 2026-09-29
---

# 🧭 [NOME_DO_PROJETO] — Visão Geral & Arquitetura

## 📌 1. Identificação do Projeto
* **Nome do Projeto:** `[NOME_DO_PROJETO]`
* **Missão & Proposta:** `[DESCRICAO_CURTA_DO_PROPOSITO]`
* **Status:** `Em Desenvolvimento Ativo`
* **Versão Atual:** `v1.0.0`

---

## 🏗️ 2. Stack Tecnológica
* **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS v4.
* **Gerenciamento de Estado:** Zustand com persistência local.
* **Qualidade & Testes:** Vitest (100% de aprovação obrigatória) e Oxlint.
* **CI/CD:** GitHub Actions com auto-merge de PRs da Jules AI.

---

## 📂 3. Mapa de Pastas do Projeto
```text
src/
├── core/            # Regras de negócio, cálculos puros e helpers
├── presentation/    # Componentes visuais, telas, modals e layout
├── store/           # Zustand store persistida
├── tests/           # Suíte de testes unitários Vitest
└── types/           # Interfaces e tipos estritos TypeScript
```

---

## 🔗 Navegação Rápida
* [[Decisoes & Estado Atual]]
* [[Historico de Bugs]]
* [[Historico de Prompts & Demandas]]
* [[Dashboard]]
