import { describe, it, expect } from 'vitest';
import {
  isFeatureUnlocked,
  checkNewFeatureUnlocks,
  FEATURE_DEFINITIONS,
  ALL_FEATURE_IDS,
} from '../core/gamification/onboarding';

describe('Progressive Onboarding Engine', () => {
  describe('isFeatureUnlocked', () => {
    it('always unlocks core calculators and survival from Level 1', () => {
      expect(isFeatureUnlocked('survival', 1)).toBe(true);
      expect(isFeatureUnlocked('bhaskara', 1)).toBe(true);
      expect(isFeatureUnlocked('regra_simples', 1)).toBe(true);
      expect(isFeatureUnlocked('physics', 1)).toBe(true);
      expect(isFeatureUnlocked('spaced_repetition', 1)).toBe(true);
    });

    it('keeps Blitz and Boss Battle locked for a brand new Level 1 user', () => {
      expect(isFeatureUnlocked('blitz', 1, 0, ['survival'])).toBe(false);
      expect(isFeatureUnlocked('boss_battle', 1, 0, ['survival'])).toBe(false);
    });

    it('unlocks Blitz at Level 3', () => {
      expect(isFeatureUnlocked('blitz', 2, 0, ['survival'])).toBe(false);
      expect(isFeatureUnlocked('blitz', 3, 0, ['survival'])).toBe(true);
      expect(isFeatureUnlocked('blitz', 4, 0, ['survival'])).toBe(true);
    });

    it('unlocks Boss Battle at Level 5 or upon winning 1 Blitz session', () => {
      // Below level 5 without blitz score: locked
      expect(isFeatureUnlocked('boss_battle', 4, 0, ['survival'])).toBe(false);

      // Level 5 reached: unlocked
      expect(isFeatureUnlocked('boss_battle', 5, 0, ['survival'])).toBe(true);

      // Lower level but scored in Blitz (> 0): unlocked
      expect(isFeatureUnlocked('boss_battle', 2, 15, ['survival'])).toBe(true);
    });

    it('immediately unlocks everything if unlockAll is true', () => {
      for (const feat of ALL_FEATURE_IDS) {
        expect(isFeatureUnlocked(feat, 1, 0, [], true)).toBe(true);
      }
    });

    it('respects explicitly unlocked features list', () => {
      expect(isFeatureUnlocked('blitz', 1, 0, ['blitz'])).toBe(true);
      expect(isFeatureUnlocked('boss_battle', 1, 0, ['boss_battle'])).toBe(true);
    });
  });

  describe('checkNewFeatureUnlocks', () => {
    it('detects Blitz unlock when reaching Level 3', () => {
      const newly = checkNewFeatureUnlocks({
        userLevel: 3,
        blitzHighScore: 0,
        currentUnlocked: ['survival'],
      });

      expect(newly.map((f) => f.id)).toContain('blitz');
      expect(newly.map((f) => f.id)).not.toContain('boss_battle');
    });

    it('detects Boss Battle unlock when achieving Blitz high score', () => {
      const newly = checkNewFeatureUnlocks({
        userLevel: 2,
        blitzHighScore: 12,
        currentUnlocked: ['survival', 'blitz'],
      });

      expect(newly.map((f) => f.id)).toContain('boss_battle');
    });

    it('returns empty array if all features are already unlocked', () => {
      const newly = checkNewFeatureUnlocks({
        userLevel: 10,
        blitzHighScore: 50,
        currentUnlocked: ['survival', 'blitz', 'boss_battle'],
      });

      expect(newly).toHaveLength(0);
    });
  });

  describe('Feature definitions integrity', () => {
    it('has valid titles and descriptions in PT and EN for all features', () => {
      for (const featId of ALL_FEATURE_IDS) {
        const def = FEATURE_DEFINITIONS[featId];
        expect(def).toBeDefined();
        expect(def.titlePt.length).toBeGreaterThan(0);
        expect(def.titleEn.length).toBeGreaterThan(0);
        expect(def.descPt.length).toBeGreaterThan(0);
        expect(def.descEn.length).toBeGreaterThan(0);
        expect(def.icon.length).toBeGreaterThan(0);
      }
    });
  });
});
