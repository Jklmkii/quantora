import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  playBossHitCritical,
  playBossHitStandard,
  playBossDamageTaken,
  playComboTick,
  playMasteryBadge,
  playBossVictory,
  playBossShieldBreak,
  playBlitzTimeWarning,
  playLevelUp,
  playStreakFlame,
  playRare67,
  playTestSound,
  playSfx,
  _clearAudioCache,
} from '../core/platform/audio';
import { useAppStore } from '../store/useAppStore';

describe('Audio Platform Helper (SFX)', () => {
  beforeEach(() => {
    _clearAudioCache();
    // Reset store settings to defaults
    useAppStore.setState({
      settings: {
        theme: 'system',
        language: 'pt',
        decimalPlaces: 2,
        decimalSeparator: ',',
        historyLimit: 20,
        hasCompletedOnboarding: true,
        soundEnabled: true,
        soundVolume: 0.5,
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    _clearAudioCache();
  });

  it('exports all intent-named sound functions without throwing in test environment', () => {
    expect(() => playBossHitCritical()).not.toThrow();
    expect(() => playBossHitStandard()).not.toThrow();
    expect(() => playBossDamageTaken()).not.toThrow();
    expect(() => playComboTick()).not.toThrow();
    expect(() => playMasteryBadge()).not.toThrow();
    expect(() => playBossVictory()).not.toThrow();
    expect(() => playBossShieldBreak()).not.toThrow();
    expect(() => playBlitzTimeWarning()).not.toThrow();
    expect(() => playLevelUp()).not.toThrow();
    expect(() => playStreakFlame()).not.toThrow();
    expect(() => playRare67()).not.toThrow();
    expect(() => playTestSound()).not.toThrow();
  });

  it('respects soundEnabled = false by suppressing playback', () => {
    useAppStore.getState().setSoundEnabled(false);
    expect(useAppStore.getState().settings.soundEnabled).toBe(false);

    const playMock = vi.fn().mockResolvedValue(undefined);
    class MockAudio {
      play = playMock;
      volume = 1;
      currentTime = 0;
      paused = true;
    }
    vi.stubGlobal('Audio', MockAudio);

    playBossHitCritical();
    playComboTick();

    expect(playMock).not.toHaveBeenCalled();
  });

  it('plays sound when soundEnabled = true and volume > 0', () => {
    useAppStore.getState().setSoundEnabled(true);
    useAppStore.getState().setSoundVolume(0.8);

    const playMock = vi.fn().mockResolvedValue(undefined);
    class MockAudio {
      play = playMock;
      volume = 0;
      currentTime = 0;
      paused = true;
    }
    vi.stubGlobal('Audio', MockAudio);

    playBossHitStandard();
    expect(playMock).toHaveBeenCalled();
  });

  it('clamps volume between 0 and 1 via setSoundVolume', () => {
    useAppStore.getState().setSoundVolume(1.5);
    expect(useAppStore.getState().settings.soundVolume).toBe(1.0);

    useAppStore.getState().setSoundVolume(-0.5);
    expect(useAppStore.getState().settings.soundVolume).toBe(0.0);

    useAppStore.getState().setSoundVolume(0.7);
    expect(useAppStore.getState().settings.soundVolume).toBe(0.7);
  });

  it('gracefully handles and suppresses exceptions from Audio.play() without crashing', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    class MockAudio {
      play() {
        throw new Error('NotAllowedError: Autoplay blocked');
      }
      volume = 1;
      currentTime = 0;
      paused = true;
    }
    vi.stubGlobal('Audio', MockAudio);

    expect(() => playSfx('hit-critical')).not.toThrow();
    expect(warnSpy).toHaveBeenCalled();
  });
});
