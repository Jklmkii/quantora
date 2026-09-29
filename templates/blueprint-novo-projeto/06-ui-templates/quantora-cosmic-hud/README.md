# 🌌 Quantora Cosmic HUD — Template de Carrossel Interativo com Drag-to-Scroll & Ícones 3D

Um template de interface completo, premium e de alto desempenho extraído diretamente do ecossistema de produção do **Quantora**. Oferece um carrossel horizontal imersivo com física de arrasto (*drag-to-scroll* com mouse e *touch swipe* em celulares), inércia elástica, máscaras laterais translúcidas, ícones 3D facetados em SVG e síntese de áudio procedural via **Web Audio API** (sem arquivos `.mp3` externos).

---

## 🚀 Demonstração Instantânea (Sem Node.js)

Dê um duplo clique no arquivo [`preview.html`](preview.html) para abrir a demonstração interativa completa diretamente no seu navegador (Edge, Chrome, Firefox), 100% offline e sem necessidade de compilar nada.

---

## 📦 Estrutura do Pacote

```
quantora-cosmic-hud/
├── preview.html            # Demonstração completa 100% autônoma (HTML5 + CSS + JS puro)
├── QuantoraCosmicHUD.tsx   # Componente React 19 / TypeScript desacoplado e customizável
├── CosmicIcons3D.tsx       # 10 ícones 3D em SVG com iluminação volumétrica e gradientes facetados
├── audio-feedback.ts       # Síntese sonora procedural com Web Audio API (glissando senoidal de 380Hz a 540Hz)
├── cosmic-styles.css       # Classes de glassmorphism, máscaras de desfoque e brilhos neon (Tailwind v4 / CSS puro)
└── README.md               # Este guia completo de integração
```

---

## ✨ Recursos & Diferenciais Técnicos

| Recurso | Detalhes Técnicos |
| :--- | :--- |
| **🖱️ Drag-to-Scroll Fluido** | Captura `mousedown`, `mousemove` e `mouseup` com multiplicador físico de inércia (`1.35x`) e cancelamento inteligente de clique se o deslocamento for maior que 6px. |
| **📱 Touch-Swipe Mobile** | Suporte nativo a aceleração por hardware móvel via `-webkit-overflow-scrolling: touch` e `scroll-snap-type: x mandatory`. |
| **🎯 Centralização Simétrica** | `padding: 0 calc(50vw - 160px)` garante que qualquer card focado repouse perfeitamente no centro geométrico da viewport, independentemente da resolução. |
| **✨ Máscara com Fade nas Bordas** | Gradiente linear CSS aplicado em `mask-image` criando um desvanecimento orgânico nas laterais do palco sem recorrer a sobreposições de divs opacas. |
| **💎 Ícones 3D Nativos (SVG)** | 10 modelos tridimensionais (Crânio de Cristal, Ampulheta Quântica, Elmo do Titã, Parábola de Cristal, Triângulo Retângulo, etc.) com múltiplos facetamentos de luz. |
| **🔊 Áudio Procedural Sem Assets** | Síntese de frequência sonora em tempo real via Web Audio API. Zero requisições de rede, zero arquivos de áudio pesados, latência sub-milissegundo. |
| **🌓 Suporte a Dark / Light Mode** | Adaptação completa de contraste e refração do vidro acrílico através de variáveis CSS e classes `.dark`. |
| **♿ Acessibilidade WCAG AAA** | Navegação por setas do teclado (<kbd>←</kbd> e <kbd>→</kbd>), seleção por <kbd>Enter</kbd> e regiões semânticas ARIA. |

---

## 🛠️ Como Integrar no seu Projeto React / Vite / Next.js

### 1. Copie os Arquivos para o seu Projeto
Copie a pasta `quantora-cosmic-hud` para `src/components/` (ou crie um alias correspondente).

### 2. Importe o Componente e os Estilos

```tsx
import React from 'react';
import { QuantoraCosmicHUD, CosmicCardItem } from './components/quantora-cosmic-hud/QuantoraCosmicHUD';
import './components/quantora-cosmic-hud/cosmic-styles.css';

export function MinhaPagina() {
  const meusModulos: CosmicCardItem[] = [
    {
      id: 'arena-batalha',
      title: 'Arena de Batalha',
      subtitle: 'Enfrente adversários em tempo real com desafios matemáticos rápidos.',
      tier: 'Hardcore',
      xpReward: 100,
      glowColor: '#ef4444',
      buttonText: 'Entrar na Arena',
      // Você pode passar qualquer componente JSX como ícone
      customIcon: <div className="text-6xl">⚔️</div>
    },
    {
      id: 'laboratorio-alquimia',
      title: 'Laboratório Alquímico',
      subtitle: 'Misture compostos e resolva equações químicas balanceadas.',
      tier: 'Normal',
      xpReward: 40,
      glowColor: '#10b981',
      buttonText: 'Acessar Bancada'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <QuantoraCosmicHUD 
        title="Módulos de Exploração"
        subtitle="Escolha seu próximo destino cósmico"
        cards={meusModulos}
        onSelectCard={(card) => {
          console.log('Módulo selecionado:', card.id);
        }}
        enableSound={true}
      />
    </div>
  );
}
```

---

## ⚙️ Propriedades do Componente (`QuantoraCosmicHUDProps`)

| Prop | Tipo | Padrão | Descrição |
| :--- | :--- | :--- | :--- |
| `cards` | `CosmicCardItem[]` | *10 cards padrão do Quantora* | Lista de itens/módulos a serem renderizados no carrossel. |
| `onSelectCard` | `(card: CosmicCardItem) => void` | `undefined` | Callback acionado ao clicar ou pressionar <kbd>Enter</kbd> no card. |
| `title` | `string` | `"Módulos & Desafios Cósmicos"` | Título principal exibido no cabeçalho do palco. |
| `subtitle` | `string` | *(Texto explicativo de controles)* | Subtítulo ou dica de navegação. |
| `enableSound` | `boolean` | `true` | Habilita ou desabilita os efeitos sonoros procedurais via Web Audio API. |
| `className` | `string` | `""` | Classes CSS Tailwind adicionais para o container externo. |

---

## 🎨 Tipagem do Card (`CosmicCardItem`)

```typescript
export interface CosmicCardItem {
  id: string;
  title: string;
  subtitle: string;
  tier?: string;                // Ex: "Iniciante", "Hardcore", "Épico"
  xpReward?: number;            // Ex: 30, 50, 100
  glowColor?: string;           // Cor em HEX/RGB para o halo de luz neon
  buttonText?: string;          // Rótulo do botão de ação
  customIcon?: React.ReactNode; // Componente JSX de ícone customizado
  disabled?: boolean;           // Se verdadeiro, bloqueia interação
  badgeLabel?: string;          // Etiqueta lateral adicional
}
```

---

## 📜 Licença & Autoria
Extraído do ecossistema de produção **Quantora** para utilização como acelerador arquitetural em novos projetos e aplicações web/desktop.
Livre para expansão, modificação e uso em produtos comerciais ou educacionais.
