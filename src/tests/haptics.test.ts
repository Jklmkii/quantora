import { describe, it, expect } from 'vitest';
import {
  hapticComboTick,
  hapticBossHit,
  hapticBossDamageTaken,
  hapticMasteryBadge,
} from '../core/platform/haptics';

describe('Haptics Platform Guard Tests', () => {
  it('should return safely without throwing in non-native environments for all haptic calls', async () => {
    await expect(hapticComboTick(1)).resolves.toBeUndefined();
    await expect(hapticComboTick(5)).resolves.toBeUndefined();
    await expect(hapticBossHit()).resolves.toBeUndefined();
    await expect(hapticBossDamageTaken()).resolves.toBeUndefined();
    await expect(hapticMasteryBadge()).resolves.toBeUndefined();
  });
});
