/**
 * Audio Platform Helper — Quantora SFX Engine
 * Multiplatform audio playback (Web, Electron, Android)
 * Safe fallback for Node/SSR/Vitest environments.
 */

import { useAppStore } from '../../store/useAppStore';

export type SfxName =
  | 'hit-critical'
  | 'hit-standard'
  | 'damage-taken'
  | 'combo-tick'
  | 'mastery-badge'
  | 'rare-67'
  | 'boss-victory'
  | 'boss-shield-break'
  | 'blitz-time-warning'
  | 'level-up'
  | 'streak-flame';

// Cache audio elements for fast playback without reloading
let audioCache: Partial<Record<SfxName, HTMLAudioElement>> = {};

export function _clearAudioCache(): void {
  audioCache = {};
}

function getSoundUrl(name: SfxName): string {
  const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL)
    ? import.meta.env.BASE_URL.replace(/\/$/, '')
    : '';
  return `${base}/sounds/${name}.ogg`;
}

/**
 * Low-level safe sound player
 */
export function playSfx(name: SfxName, overrideVolume?: number): void {
  const AudioCtor = (typeof window !== 'undefined' && window.Audio) || (typeof globalThis !== 'undefined' && (globalThis as any).Audio);
  if (!AudioCtor) {
    return;
  }

  try {
    const { settings } = useAppStore.getState();
    const soundEnabled = settings?.soundEnabled ?? true;
    if (!soundEnabled) {
      return;
    }

    const volume = overrideVolume !== undefined
      ? Math.max(0, Math.min(1, overrideVolume))
      : (settings?.soundVolume ?? 0.5);

    if (volume <= 0) {
      return;
    }

    let audio = audioCache[name];
    if (!audio) {
      audio = new (AudioCtor as new (src?: string) => HTMLAudioElement)(getSoundUrl(name));
      audioCache[name] = audio;
    }
    if (!audio) {
      return;
    }

    // Clone or reset to allow rapid consecutive plays without clipping
    if (!audio.paused && audio.currentTime > 0) {
      const clone = audio.cloneNode() as HTMLAudioElement;
      clone.volume = volume;
      clone.play().catch(() => {
        // Fallback or autoplay policy block - ignore silently
      });
      return;
    }

    audio.volume = volume;
    audio.currentTime = 0;
    audio.play().catch(() => {
      // Autoplay policy or audio device busy - ignore silently
    });
  } catch (err) {
    // Audio failures must never crash the application or game loops
    console.warn(`[SFX] Failed to play sound "${name}":`, err);
  }
}

/* =========================================================================
 * Intent-Named Helpers (Mirroring haptics.ts design pattern)
 * ========================================================================= */

/** Som de golpe crítico no Boss Battle (< 3s) */
export function playBossHitCritical(): void {
  playSfx('hit-critical');
}

/** Som de golpe padrão no Boss Battle */
export function playBossHitStandard(): void {
  playSfx('hit-standard');
}

/** Som de dano sofrido / perda de escudo pelo jogador */
export function playBossDamageTaken(): void {
  playSfx('damage-taken');
}

/** Som de acerto ágil mantendo combo no Blitz */
export function playComboTick(): void {
  playSfx('combo-tick');
}

/** Som triunfante de maestria / graduação de fato matemático no Caderno de Erros */
export function playMasteryBadge(): void {
  playSfx('mastery-badge');
}

/** Som triunfal épico de vitória contra o Boss */
export function playBossVictory(): void {
  playSfx('boss-victory');
}

/** Som de estilhaçamento de escudo/barreira do Boss */
export function playBossShieldBreak(): void {
  playSfx('boss-shield-break');
}

/** Som tenso de pulso cardíaco para avisar os últimos segundos no Blitz */
export function playBlitzTimeWarning(): void {
  playSfx('blitz-time-warning');
}

/** Som mágico e cintilante ao subir de nível ou desbloquear conquistas */
export function playLevelUp(): void {
  playSfx('level-up');
}

/** Som crepitante de chama ao manter a sequência diária */
export function playStreakFlame(): void {
  playSfx('streak-flame');
}

/** Som especial e raro para o easter egg do número 67 */
export function playRare67(): void {
  playSfx('rare-67');
}

/** Som de teste para calibração no modal de Configurações */
export function playTestSound(volume?: number): void {
  playSfx('combo-tick', volume);
}

// Instância compartilhada de AudioContext para micro-interações sintetizadas de baixa latência
let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    try {
      sharedAudioCtx = new AudioCtx();
    } catch {
      return null;
    }
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

/**
 * Som harmônico sutil e espacial ao navegar ou deslizar entre cards no Hub
 */
export function playHubSwipe(): void {
  try {
    const { settings } = useAppStore.getState();
    if (!settings?.soundEnabled) return;
    const vol = (settings?.soundVolume ?? 0.5) * 0.22;
    if (vol <= 0) return;

    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Glissando ascendente suave estilo cristalino (420Hz -> 640Hz em 55ms)
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(640, now + 0.055);

    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.06);
  } catch {
    // Ignora silenciosamente em ambientes restritos
  }
}
