const fs = require('fs');
const path = require('path');

const VAULT_ROOT = 'c:\\Users\\lucas\\OneDrive\\Área de Trabalho\\code\\Obsidian-Vault';

const quantoraPath = path.join(VAULT_ROOT, '10 - Projetos', 'Quantora', 'Historico de Prompts & Demandas.md');
const quantoraArchive = path.join(VAULT_ROOT, '90 - Historico & Arquivo', 'Prompts', '2026-09 - Historico de Prompts.md');

const aegonPath = path.join(VAULT_ROOT, '10 - Projetos', 'Aegon - Gerenciador de Senhas', 'Historico de Prompts & Demandas.md');
const aegonArchive = path.join(VAULT_ROOT, '90 - Historico & Arquivo', 'Prompts', '2026-09 - Historico de Prompts - Aegon.md');

console.log('--- 1. Verificando Quantora ---');
const qContent = fs.readFileSync(quantoraPath, 'utf8');
if (qContent.includes('### Prompt 56')) {
  console.log('Quantora ainda possui Prompt 56. Executando separação...');
  const qLines = qContent.split(/\r?\n/);
  let p56Idx = -1;
  let p105Idx = -1;

  for (let i = 0; i < qLines.length; i++) {
    if (p56Idx === -1 && /###\s+(?:📌\s+)?Prompt 56/i.test(qLines[i])) {
      p56Idx = i;
    }
    if (/###\s+(?:📌\s+)?Prompt 105/i.test(qLines[i])) {
      p105Idx = i;
      break;
    }
  }

  const quantoraSeptLines = qLines.slice(p56Idx, p105Idx);
  while (quantoraSeptLines.length > 0 && (quantoraSeptLines[quantoraSeptLines.length - 1].trim() === '---' || quantoraSeptLines[quantoraSeptLines.length - 1].trim() === '')) {
    quantoraSeptLines.pop();
  }

  const septTOCEntries = [];
  quantoraSeptLines.forEach(line => {
    if (/###\s+(?:📌\s+)?Prompt /i.test(line)) {
      const title = line.replace(/^###\s+/, '').trim();
      septTOCEntries.push(`* [[#${title}]]`);
    }
  });

  let archiveContent = fs.readFileSync(quantoraArchive, 'utf8');
  archiveContent = archiveContent.replace(
    '# 📜 Histórico de Prompts de Desenvolvimento & Rastreabilidade Técnica — Setembro/2026 (Prompts 01 a 55)',
    '# 📜 Histórico de Prompts de Desenvolvimento & Rastreabilidade Técnica — Setembro/2026 (Prompts 01 a 104)'
  );
  archiveContent = archiveContent.replace(
    '**Prompts 01 a 55**',
    '**Prompts 01 a 104**'
  );
  archiveContent = archiveContent.replace(
    '* **Janela Ativa de Prompts (56 a 72):** [[Historico de Prompts & Demandas]]',
    '* **Janela Ativa de Prompts — Outubro/2026 (Prompt 105 em diante):** [[Historico de Prompts & Demandas]]'
  );
  archiveContent = archiveContent.replace(
    '## 📑 Sumário Completo dos Prompts Arquivados (01 a 55 — Setembro/2026)',
    '## 📑 Sumário Completo dos Prompts Arquivados (01 a 104 — Setembro/2026)'
  );

  const prompt55TOC = '* [[#Prompt 55 — 16/09/2026 18:11 — Auditoria do Repositório Quantora & Sincronização da Documentação Técnica no Obsidian-Vault]]';
  if (archiveContent.includes(prompt55TOC)) {
    const insertTOC = prompt55TOC + '\n' + septTOCEntries.join('\n');
    archiveContent = archiveContent.replace(prompt55TOC, insertTOC);
  }

  archiveContent = archiveContent.trimEnd() + '\n\n---\n\n' + quantoraSeptLines.join('\n') + '\n';
  fs.writeFileSync(quantoraArchive, archiveContent, 'utf8');

  const quantoraOctLines = qLines.slice(p105Idx);
  const octTOCEntries = [];
  quantoraOctLines.forEach(line => {
    if (line.startsWith('### Prompt ') || line.startsWith('### Demanda') || line.startsWith('### 🚀 Demanda') || line.startsWith('### 📌 Registro')) {
      const title = line.replace(/^###\s+/, '').trim();
      octTOCEntries.push(`* [[#${title}]]`);
    }
  });

  const newQuantoraActiveHeader = `---
title: "Quantora — Histórico de Prompts, Demandas & Rastreabilidade (Outubro/2026)"
aliases:
  - "Prompts Quantora"
  - "Histórico de Demandas"
  - "Audit Log Prompts"
  - "Prompts Outubro 2026"
project: quantora
type: history-log
status: active
tags:
  - quantora
  - prompts
  - audit
  - traceability
  - commits
  - october-2026
summary: "Rastreabilidade ipsis litteris de todas as solicitações do usuário no mês de Outubro/2026 (Prompt 105 em diante), vinculadas aos commits e avaliações de código no GitHub."
created: 2026-10-01
last_updated: 2026-10-13
---

# 📜 Histórico de Prompts de Desenvolvimento & Rastreabilidade Técnica — Outubro/2026 (Janela Ativa)

Este documento registra cronologicamente a janela ativa de demandas recentes, prompts do usuário e análises de impacto no desenvolvimento do **Quantora** durante o mês de **Outubro de 2026**.

> [!NOTE]
> 📌 **Histórico Anterior Consolidado:**
> * **Setembro/2026 (Prompts 01 a 104):** [[2026-09 - Historico de Prompts]]
> * **Hub Central:** [[Dashboard]]
> * **Visão Geral:** [[Quantora - Visao Geral]]
> * **Histórico Forense de Bugs:** [[Historico de Bugs]]
> * **Releases Oficiais:** [[CHANGELOG]]

---

## 📑 Sumário das Demandas e Prompts Ativos (Outubro/2026)

${octTOCEntries.join('\n')}

---

`;

  fs.writeFileSync(quantoraPath, newQuantoraActiveHeader + quantoraOctLines.join('\n'), 'utf8');
  console.log('✅ Quantora consolidado e ativo atualizado.');
} else {
  console.log('Quantora já está consolidado (Prompt 56 já foi movido para o arquivo).');
}

console.log('\n--- 2. Processando Aegon ---');
const aContent = fs.readFileSync(aegonPath, 'utf8');
const aLines = aContent.split(/\r?\n/);
console.log('Total linhas Aegon ativo:', aLines.length);

let aP01Idx = -1;
let aP34Idx = -1;

for (let i = 0; i < aLines.length; i++) {
  if (aP01Idx === -1 && /###\s+(?:📌\s+)?Prompt 01/i.test(aLines[i])) {
    aP01Idx = i;
  }
  if (/###\s+(?:📌\s+)?Prompt 34/i.test(aLines[i])) {
    aP34Idx = i;
    break;
  }
}

console.log(`Aegon Prompt 01 índice: ${aP01Idx + 1} -> ${aLines[aP01Idx]}`);
console.log(`Aegon Prompt 34 índice: ${aP34Idx + 1} -> ${aLines[aP34Idx]}`);

if (aP01Idx === -1 || aP34Idx === -1) {
  throw new Error('Falha ao localizar Prompt 01 ou Prompt 34 no Aegon.');
}

const aegonSeptLines = aLines.slice(aP01Idx, aP34Idx);
while (aegonSeptLines.length > 0 && (aegonSeptLines[aegonSeptLines.length - 1].trim() === '---' || aegonSeptLines[aegonSeptLines.length - 1].trim() === '')) {
  aegonSeptLines.pop();
}

const aegonSeptTOC = [];
aegonSeptLines.forEach(line => {
  if (/###\s+(?:📌\s+)?Prompt /i.test(line)) {
    const title = line.replace(/^###\s+/, '').trim();
    aegonSeptTOC.push(`* [[#${title}]]`);
  }
});

const aegonArchiveContent = `---
title: "Arquivo Histórico de Prompts & Demandas — Setembro/2026 (Aegon)"
aliases:
  - "Prompts Setembro 2026 Aegon"
  - "Arquivo Prompts Setembro Aegon"
project: aegis-vault
type: history-log
status: archived
tags:
  - aegon
  - archive
  - prompts
  - september-2026
summary: "Compilação arquivada dos prompts e demandas executadas no Aegon durante o mês de Setembro de 2026 (Prompts 01 a 33)."
created: 2026-09-29
last_updated: 2026-09-30
---

# 📜 Histórico de Prompts de Desenvolvimento & Rastreabilidade Técnica — Setembro/2026 (Aegon — Prompts 01 a 33)

Este documento consolida o histórico auditável dos **Prompts 01 a 33** executados durante a fundação do **Aegon Vault & Autofill** em Setembro de 2026.

> [!NOTE]
> 📌 **Navegação no Cofre:**
> * **Janela Ativa de Prompts — Outubro/2026 (Prompt 34 em diante):** [[Historico de Prompts & Demandas]]
> * **Visão Geral do Projeto:** [[Aegon - Visao Geral]]
> * **Hub Central:** [[Dashboard]]

---

## 📑 Sumário Completo dos Prompts Arquivados (01 a 33 — Setembro/2026)

${aegonSeptTOC.join('\n')}

---

${aegonSeptLines.join('\n')}
`;

fs.writeFileSync(aegonArchive, aegonArchiveContent, 'utf8');
console.log('✅ Arquivo consolidado de Setembro gravado (Aegon):', aegonArchive);

// Gerar novo ativo do Aegon (Outubro/2026)
const aegonOctLines = aLines.slice(aP34Idx);
const aegonOctTOC = [];
aegonOctLines.forEach(line => {
  if (line.startsWith('### Prompt ') || line.startsWith('### 📌 Prompt ') || line.startsWith('### Demanda') || line.startsWith('### 🚀 Demanda')) {
    const title = line.replace(/^###\s+/, '').trim();
    aegonOctTOC.push(`* [[#${title}]]`);
  }
});

const newAegonActiveHeader = `---
title: "Aegon — Histórico de Prompts & Demandas (Janela Ativa — Outubro/2026)"
aliases:
  - "Prompts Aegon"
  - "Histórico de Demandas Aegon"
  - "Prompts Outubro 2026 Aegon"
project: aegis-vault
type: history-log
status: active
tags:
  - aegon
  - prompts
  - audit
  - traceability
  - commits
  - october-2026
summary: "Rastreabilidade ipsis litteris de todas as solicitações do usuário no projeto Aegon Vault & Autofill no mês de Outubro/2026 (Prompt 34 em diante)."
created: 2026-10-01
last_updated: 2026-10-13
---

# 📜 Histórico de Prompts de Desenvolvimento & Rastreabilidade Técnica — Outubro/2026 (Aegon — Janela Ativa)

Este documento registra, de forma estrita e *ipsis litteris*, todas as solicitações do usuário no projeto **Aegon Vault & Autofill** no mês de **Outubro de 2026** (Prompt 34 em diante), acompanhadas do nível de complexidade, agente executor e hash de commit.

> [!NOTE]
> 📌 **Histórico Anterior Consolidado:**
> * **Setembro/2026 (Prompts 01 a 33):** [[2026-09 - Historico de Prompts - Aegon]]
> * **Visão Geral:** [[Aegon - Visao Geral]]
> * **Hub Central:** [[Dashboard]]
> * **Roadmap & Planejamento:** [[Roadmap & Planejamento do MVP]]

---

## 📑 Sumário das Demandas e Prompts Ativos (Outubro/2026)

${aegonOctTOC.join('\n')}

---

`;

fs.writeFileSync(aegonPath, newAegonActiveHeader + aegonOctLines.join('\n'), 'utf8');
console.log('✅ Arquivo ativo do Aegon reescrito com foco exclusivo em Outubro:', aegonPath);

console.log('\n✨ Migração e segregação mensal concluída com 100% de sucesso!');
