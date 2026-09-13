# 📐 Quantora — Suíte Científica, Física Clássica & Desafios Mentais (Desktop & Mobile)

Um aplicativo moderno, educativo e 100% offline para cálculos analíticos avançados, simulação de física, treinamento mental gamificado, lousa de rascunho digital, **Física Clássica (10 modos de mecânica)**, **Equações do 2º Grau (Bhaskara)** e **Regra de Três (Simples e Composta)**, com resolução didática passo a passo, gráficos dinâmicos e exportação de backups.

Disponível como **Web App (PWA)**, **Executável Nativo do Windows (.exe)** e **Aplicativo Android (.apk)**.

---

## ✨ Funcionalidades

### 1. ⚛️ Módulo de Física Clássica & Mecânica Analítica
- **10 Modos de Resolução Analítica Didática:**
  1. **MRU (Movimento Retilíneo Uniforme):** Posição horária, velocidade constante e tempo, suportando isolamento de qualquer variável ($S, S_0, v, t$).
  2. **MRUV & Torricelli:** Aceleração linear, distância e tempo de frenagem com limites de desaceleração.
  3. **Queda Livre com Arrasto Aerodinâmico:** Modelo analítico exato para o vácuo ou com resistência do ar via velocidade terminal ($v(t) = v_t \tanh(gt/v_t)$), tempo via $\operatorname{arcosh}$ e presets paraquedista/gota.
  4. **Lançamento Vertical:** Subida desacelerada, altura máxima, tempo de permanência e velocidade de retorno.
  5. **Lançamento Horizontal:** Composição independente de Galileu, alcance e velocidade de impacto.
  6. **Lançamento Oblíquo (Balística 2D):** Ângulo de disparo, alcance parabólico, vetor resultante e ápice da trajetória.
  7. **MCU (Movimento Circular Uniforme):** Frequência, período, velocidade angular ($\omega$), aceleração centrípeta e velocidade linear.
  8. **MHS (Movimento Harmônico Simples):** Pêndulo simples e oscilador massa-mola com equações senoidais.
  9. **Plano Inclinado & Leis de Newton:** Modo simples e avançado com força externa aplicada ao longo da rampa, decomposição de forças ($P_x, P_y, N$), atrito estático/cinético e determinação da direção do movimento.
  10. **Conservação de Energia & Trabalho:** Energia cinética, potencial gravitacional e mecânica total; trabalho de forças constantes e potência mecânica (com conversões para CV e HP).
- **5 Gráficos SVG Vetoriais Interativos (`PhysicsChart.tsx`):**
  - Curvas temporais contínuas ($S \times t, v \times t, y \times t$).
  - Balística 2D cartesiana com solo pontilhado, ápice ($h_{max}$) e alcance ($A$).
  - Órbita circular 2D com vetores tangenciais e centrípetos.
  - Diagrama de corpo livre com até 6 vetores de força dinâmicos em rampa inclinada.
  - Gráficos de barras proporcionais de energias mecânicas e trabalho/potência.

### 2. 🔍 Módulo Bhaskara (Equação do 2º Grau)
- **Cálculo Completo:** Suporte a $\Delta > 0$ (duas raízes), $\Delta = 0$ (raiz real única) e $\Delta < 0$ (raízes no conjunto dos números complexos $\mathbb{C}$ no formato $p \pm qi$).
- **Gráfico Interativo da Parábola em SVG:** Curva desenhada com autoescala dinâmica (inclusive para coeficientes extremos).
- **Vértice e Eixo de Simetria:** Determinação exata de $V(X_v, Y_v)$ e ponto de máximo/mínimo.
- **Parser de Equações por Texto:** Permite colar expressões diretamente (ex: `2x² - 4x + 2 = 0` ou `x^2 = 9`).
- **Passo a Passo Didático:** Visualização detalhada de todas as substituições na fórmula.

### 3. ⚖️ Módulo Regra de Três
- **Simples (2x2):** Incógnita flexível em qualquer posição ($A_1, B_1, A_2, B_2$), proporção direta ou inversa.
- **Composta (3+ Grandezas):** Grade dinâmica com adição/remoção de grandezas e definição individual de proporcionalidade.
- **Resolução Passo a Passo:** Demonstração do produto das frações até o isolamento de $x$.

### 4. 🎮 Modos de Treino, Jogos & Desafios
- **Treino Mental & Sobrevivência:** Modo Sobrevivência progressivo full-mix e Caderno de Erros com Repetição Espaçada adaptativa (algoritmo Leitner amortecido com gatilho dual e normalização comutativa de fatos).
- **Desafio Diário (Daily Challenge):** Questão determinística única mundial gerada a partir da data via hash FNV-1a e PRNG Mulberry32, concedendo +150 XP e avanço de ofensiva (*streak*).
- **Modo Blitz (60 Segundos):** Corrida contra o relógio (+2s acerto / -3s erro) com multiplicadores de combo ($1\times \to 2\times \to 3\times$) e feedback tátil dinâmico.
- **Batalha de Chefe por Níveis ("1 Fase, 1 Tentativa"):** Fases independentes com vida progressiva ($\text{HP}(L) = \lfloor 100 \cdot (1 + 0,35 \cdot (L - 1)) \rceil$), 3 escudos restaurados por tentativa, drops de Moedas de Chefe, Forja de Upgrades permanentes de dano e balão didático `Certo: X` ao errar.

### 5. 📝 Lousa de Rascunho Digital (Scratchpad)
- Camada flutuante em HTML5 Canvas transparente sobre qualquer módulo.
- Caneta com 6 cores contrastantes, 3 espessuras de traço, paleta sanfona recolhível para mobile, botão satélite circular dedicado no dock móvel, borracha e botão unificado de fechar preservando desenhos na memória.

### 6. 🏅 Gamificação & Perfil do Jogador
- Fórmula quadrática de XP: $XP_{req}(L) = 50 \cdot L \cdot (L - 1)$.
- 6 Patentes históricas em PT e EN (*Aprendiz* a *Lenda dos Números*).
- 16 Conquistas desbloqueáveis com animação de troféu e efeito de confetes.
- Ofensiva diária (*Streak*) estritamente atrelada ao relógio local do dispositivo.
- Vitrine de recordes no perfil (Sobrevivência, Blitz e Maior Nível de Chefe Concluído).

### 7. 💾 Histórico Local, Backup & Modos de Tema
- Armazenamento 100% privado e local no dispositivo via Zustand (migração v4) e `localStorage`.
- Busca rápida e filtros por tipo (`'bhaskara'`, `'regra-de-tres'`, `'physics'`).
- Exportação e importação de histórico em **JSON** e **CSV**.
- Suporte fluido a temas Claro, Escuro e Sistema, além de internacionalização em Português e Inglês.
- Feedback tátil nativo Android via `@capacitor/haptics` (Blitz, Chefe e Fixação Ativa).
- Sistema de Feedback Sonoro Multiplataforma (SFX) via `audio.ts` (Web, Electron, Android) com 6 sons ultraleves procedurais, slider percentual de volume e toggle de mudo.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React 19, TypeScript ~7.0.2, Vite, Tailwind CSS v4, Lucide Icons, HTML5 Canvas nativo (`ConfettiCanvas`).
- **Áudio & Feedback Sonoro:** Web Audio API / HTML5 Audio (< 85 KB de assets procedurais em `.ogg` e `.wav`).
- **Motor Matemático & Físico:** `big.js` (eliminando erros de precisão de ponto flutuante IEEE 754).
- **Gerenciamento de Estado:** Zustand 5.0 com persistência local e validador de schema.
- **Desktop:** Electron 44, Electron-Builder (NSIS oneClick silencioso), Electron-Updater.
- **Mobile:** Capacitor 8.5, `@capacitor/haptics`, Android SDK 36, Gradle 8.x, Java 21.
- **Qualidade & Testes:** Vitest (408 testes unitários em 24 suítes), Oxlint (87 arquivos).

---

## 🚀 Como Executar

### 1. Instalação de Dependências
```bash
npm install
```

### 2. Modo Desenvolvimento Web
```bash
npm run dev
```

### 3. Modo Desenvolvimento Desktop (Electron)
```bash
npm run electron:dev
```

### 4. Executar Testes Unitários (408 Testes / 24 Suítes)
```bash
npx vitest run
```

### 5. Executar Linter
```bash
npm run lint
```

### 6. Compilar o Executável (.exe) para Windows
```bash
npm run electron:build
```
Os arquivos gerados estarão na pasta `release/`:
* `Quantora-Setup-1.2.22.exe` (Instalador tradicional NSIS)
* `Quantora-1.2.22-portable.exe` (Executável portátil autônomo)

Você também pode baixar os executáveis prontos diretamente na página de [Releases do GitHub](https://github.com/Jklmkii/quantora/releases).

### 7. Mobile Android (.apk via Capacitor)
```bash
# Compilar frontend e sincronizar com o projeto nativo Android
npm run cap:sync

# Abrir no Android Studio para gerar o .apk ou rodar no emulador/dispositivo
npm run cap:android
```

---

## 👤 Autor

Desenvolvido por **Lucas**  
Contato: `lucascaminha06@gmail.com`

---

## 🔗 Navegação na Documentação (Obsidian)
* [[Quantora - Visao Geral]]
* [[Dashboard]]
* [[CHANGELOG]]
* [[AGENTS]]
* [[Deploy & Releases]]
