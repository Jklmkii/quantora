# 🌌 Cyber Glass Design Tokens & Visual Guide

Este documento detalha o sistema de design visual extraído do conceito **Cyberpunk Sci-Fi Glassmorphism (Glassmorphism 2.0)**, pronto para ser reaproveitado em qualquer projeto web, desktop (Electron) ou mobile (Capacitor).

---

## 🎨 1. Paleta Cromática (Color Palette)

### Fundo Cósmico & Nebulosa
| Token | Cor Hex | Uso |
| :--- | :--- | :--- |
| `--bg-space-dark` | `#050811` | Fundo base espacial ultra-profundo |
| `--bg-space-mid` | `#0a0f24` | Gradiente intermediário cósmico |
| `--nebula-purple` | `#230c3d` | Brilho difuso da nebulosa central |
| `--nebula-teal` | `#08283b` | Iluminação ambiental lateral ciano |

### Neons Luminescentes
| Token | Cor Hex / RGBA | Uso |
| :--- | :--- | :--- |
| `--neon-cyan` | `#00f2fe` | Ícones principais, bordas ativas e botões de ação primária |
| `--neon-cyan-glow`| `rgba(0, 242, 254, 0.4)` | Box-shadow e drop-shadow luminescente |
| `--neon-magenta` | `#f43f5e` / `#ec4899`| Ícones de chefes/combate e chamas holográficas |
| `--neon-magenta-glow`| `rgba(236, 72, 153, 0.4)` | Box-shadow de contraste para modos desafiadores |
| `--neon-yellow` | `#facc15` | Indicadores de bônus, XP e partículas especiais |

### Superfícies de Vidro (Frosted Glass 2.0)
| Elemento | Propriedades CSS |
| :--- | :--- |
| **Placa de Vidro Padrão** | `background: rgba(13, 20, 36, 0.55); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.12);` |
| **Card Ativo (Elevado)** | `background: rgba(14, 25, 48, 0.75); backdrop-filter: blur(28px); border: 2px solid #00f2fe; box-shadow: 0 0 45px rgba(0, 242, 254, 0.28);` |
| **Reflexo Especular Superior** | `background: linear-gradient(180deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0) 100%);` |
| **Pílulas & Botões HUD** | `background: rgba(255, 255, 255, 0.06); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.15);` |

---

## 📐 2. Efeitos Visuais & Receitas CSS

### A. O Segredo do "Vidro Realista com Luz Superior" (Specular Highlight)
Para evitar que o vidro pareça apenas um retângulo cinza sem graça, adiciona-se uma camada sutil de luz na borda superior:

```css
.cyber-glass-card {
  position: relative;
  border-radius: 24px;
  background: rgba(13, 20, 36, 0.55);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

/* Reflexo superior de lente */
.cyber-glass-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 10%;
  right: 10%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent);
  pointer-events: none;
}
```

### B. Borda com Gradiente Neon & Brilho
```css
.cyber-card-active {
  border: 2px solid transparent;
  background-image: 
    linear-gradient(rgba(14, 25, 48, 0.8), rgba(14, 25, 48, 0.8)), 
    linear-gradient(135deg, #00f2fe 0%, #ec4899 100%);
  background-origin: border-box;
  background-clip: padding-box, border-box;
  box-shadow: 0 0 40px rgba(0, 242, 254, 0.3), inset 0 0 20px rgba(0, 242, 254, 0.1);
}
```

### C. Ícone com Brilho Neon (Neon Glow)
```css
.neon-glow-cyan {
  filter: drop-shadow(0 0 12px #00f2fe) drop-shadow(0 0 24px rgba(0, 242, 254, 0.5));
}

.neon-glow-magenta {
  filter: drop-shadow(0 0 12px #ec4899) drop-shadow(0 0 24px rgba(236, 72, 153, 0.5));
}
```

---

## 🎯 3. Onde Reutilizar Este Template

1. **Seleção de Modos de Jogo / Treino:** (como visto no layout: Survival, Blitz 60s, Boss Battle).
2. **Seleção de Personagens / Heróis:** (RPG, games, avatares educacionais).
3. **Planos & Tiers de Assinatura:** (Free, Pro, Enterprise com o Pro em destaque no meio).
4. **Showcase de Features de Produto:** (Carrossel interativo em landing pages tecnológicas).
5. **Dashboard de Missões / Capítulos:** (Seleção de fases ou módulos de aprendizado).
