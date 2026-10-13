import { describe, it, expect } from 'vitest';
import { ALL_BOSS_CLASS_IDS, BOSS_CLASSES } from '../core/quiz/bossEngine';
import { getBossClassStyles } from '../core/quiz/bossClassThemes';

describe('Boss Class Visual Identity System', () => {
  it('should ensure all 10 boss classes have comprehensive visual theme metadata', () => {
    expect(ALL_BOSS_CLASS_IDS).toHaveLength(10);

    for (const classId of ALL_BOSS_CLASS_IDS) {
      const spec = BOSS_CLASSES[classId];
      expect(spec).toBeDefined();
      expect(spec.id).toBe(classId);
      expect(spec.themeColor).toBeTypeOf('string');
      expect(spec.themeColor.length).toBeGreaterThan(0);
      expect(spec.auraGradient).toBeTypeOf('string');
      expect(spec.borderGlow).toBeTypeOf('string');
      expect(spec.accentGlow).toBeTypeOf('string');
      expect(spec.emblemTitle).toBeTypeOf('string');
      expect(spec.emblemTitle.length).toBeGreaterThan(0);
      expect(spec.quote).toBeTypeOf('string');
      expect(spec.quote.length).toBeGreaterThan(0);
    }
  });

  it('should generate distinct styling profiles for all 10 classes in normal phase', () => {
    const borders = new Set<string>();
    const gradients = new Set<string>();

    for (const classId of ALL_BOSS_CLASS_IDS) {
      const styles = getBossClassStyles(classId, 1, false);
      expect(styles.borderClass).toBeDefined();
      expect(styles.glowShadow).toBeDefined();
      expect(styles.bannerGradient).toBeDefined();

      borders.add(styles.borderClass);
      gradients.add(styles.bannerGradient);
    }

    // All 10 classes must have unique border and banner gradient styles
    expect(borders.size).toBe(10);
    expect(gradients.size).toBe(10);
  });

  it('should adapt styling dynamically during Stagger (posture break)', () => {
    for (const classId of ALL_BOSS_CLASS_IDS) {
      const normalStyles = getBossClassStyles(classId, 1, false);
      const staggeredStyles = getBossClassStyles(classId, 1, true);

      expect(staggeredStyles.borderClass).toContain('cyan');
      expect(staggeredStyles.glowShadow).toContain('rgba(34,211,238');
      expect(staggeredStyles.borderClass).not.toBe(normalStyles.borderClass);
    }
  });

  it('should adapt styling dynamically during Phase 3 Enrage', () => {
    for (const classId of ALL_BOSS_CLASS_IDS) {
      const normalStyles = getBossClassStyles(classId, 1, false);
      const enrageStyles = getBossClassStyles(classId, 3, false);

      expect(enrageStyles.borderClass).toContain('red-500');
      expect(enrageStyles.borderClass).toContain('animate-pulse');
      expect(enrageStyles.borderClass).not.toBe(normalStyles.borderClass);
    }
  });
});
