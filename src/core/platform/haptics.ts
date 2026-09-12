import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

/**
 * Feedback tátil nativo (Android/iOS) com guarda estrita de plataforma.
 * Em ambientes Web (PWA), Desktop (Electron) ou testes Vitest, as chamadas retornam imediatamente sem efeito colateral.
 */

export async function hapticComboTick(comboCount: number): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const style = comboCount > 0 && comboCount % 5 === 0 ? ImpactStyle.Medium : ImpactStyle.Light;
    await Haptics.impact({ style });
  } catch (err) {
    console.warn('Haptic combo tick failed:', err);
  }
}

export async function hapticBossHit(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await Haptics.notification({ type: NotificationType.Success });
  } catch (err) {
    console.warn('Haptic boss hit failed:', err);
  }
}

export async function hapticBossDamageTaken(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await Haptics.notification({ type: NotificationType.Error });
  } catch (err) {
    console.warn('Haptic boss damage failed:', err);
  }
}

export async function hapticMasteryBadge(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch (err) {
    console.warn('Haptic mastery badge failed:', err);
  }
}
