# 📌 Quantora — Decisões de Arquitetura & Estado Atual

Documento de persistência rápida de contexto e decisões de projeto para consultas do agente e histórico permanente.

---

## ⚡ Estado Atual do Projeto
* **Nome Oficial:** Quantora
* **Versão no Repositório:** `1.2.29`
* **Branch Ativa:** `main`
* **Testes Automatizados:** 455 testes passando em 28 suítes (`100% verde`)
* **Linter Oxlint:** 0 warnings e 0 errors em 100 arquivos
* **Build de Produção:** Vite + TypeScript compilando limpo (<650ms)

---

## 💎 Identidade Visual & Branding
* **Logotipo Aprovado:** Conceito 4 (Cristal/Troféu + Letra 'Q' em tons de azul, índigo e violeta com base geométrica).
* **Assets Integrados:**
  * `build/icon.ico` (camadas 16, 32, 48, 256px para Windows)
  * `build/icon.png` (256x256)
  * `public/favicon.svg`, `public/icon-192.png`, `public/icon-512.png`
  * `android/app/src/main/res/mipmap-*/` (todas as densidades do launcher)
  * `src/presentation/components/Navbar.tsx` (emblema oficial no header)

---

## ⚙️ Decisões Técnicas Principais
1. **Migração de Storage (Schema v7):** Em `src/store/useAppStore.ts`, schema versionado com suporte retrocompatível e migrações seguras, persistindo consumíveis de batalha (`bossOracleCharges`, `bossTimeFreezeCharges`).
2. **Pacote Android:** `com.quantora.app`, com `MainActivity.java` sob `com/quantora/app/`.
3. **Desktop (Electron):** Título da janela padronizado e rotina de auto-update configurada para instaladores `Quantora-Setup-<ver>.exe`.
4. **Modos de Jogo:**
   * Desafio Diário determinístico (Mulberry32 seeded por data ISO).
   * Modo Blitz 60s (+2s acerto / -3s erro / combos até 3x).
   * Modo Batalha de Chefe em **Torre Procedural Infinita ($N = 1, \dots, \infty$)**:
     * Fórmula de vida: $HP_{max}(N) = 100 \cdot (1 + 0.35 \cdot (N - 1))$.
     * Teto assintótico de dificuldade aritmética ($N_{cap} = 15$).
     * 3 Fases Dinâmicas (Fase 3 Enrage $\le 25\%$ HP com $1.5\times$ dano crítico e 2 de dano de escudo ao errar).
     * Debuffs cognitivos procedurais (`fog`, `mirror`, `time_siphon`).
     * Consumíveis compráveis com moedas (`oracle` e `timeFreeze`).
   * Lousa de Rascunho (*Scratchpad*) em Canvas transparente.
   * Catálogo de 16 Conquistas (*Achievements*).

---

## 🎯 Protocolo de Economia de Tokens & Contexto
* **Persistir Primeiro no Obsidian:** Toda nova regra, configuração ou decisão deve ser registrada diretamente no cofre para evitar re-pesquisas caras.
* **Comunicação Enxuta:** Manter respostas concisas, diretas e objetivas, evitando redundâncias.

---

## 🔗 Links Relacionados
* [[Quantora - Visao Geral]]
* [[Dashboard]]
* [[CHANGELOG]]
* [[README]]
* [[Deploy & Releases]]
