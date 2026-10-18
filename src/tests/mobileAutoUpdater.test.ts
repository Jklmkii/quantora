import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Capacitor } from '@capacitor/core';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { isNewerVersion, initMobileAutoUpdater } from '../services/mobileAutoUpdater';

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(() => false),
  },
}));

vi.mock('@capgo/capacitor-updater', () => ({
  CapacitorUpdater: {
    notifyAppReady: vi.fn(() => Promise.resolve()),
    download: vi.fn(() => Promise.resolve({ id: 'bundle-123' })),
    set: vi.fn(() => Promise.resolve()),
  },
}));

describe('mobileAutoUpdater', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  describe('isNewerVersion', () => {
    it('identifies newer patch, minor and major versions accurately', () => {
      expect(isNewerVersion('v1.2.93', '1.2.92')).toBe(true);
      expect(isNewerVersion('1.3.0', '1.2.99')).toBe(true);
      expect(isNewerVersion('2.0.0', '1.9.9')).toBe(true);
    });

    it('returns false for equal or older versions', () => {
      expect(isNewerVersion('v1.2.92', '1.2.92')).toBe(false);
      expect(isNewerVersion('1.2.91', '1.2.92')).toBe(false);
      expect(isNewerVersion('', '1.2.92')).toBe(false);
    });
  });

  describe('initMobileAutoUpdater', () => {
    it('does nothing when running on web / non-native platform', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
      await initMobileAutoUpdater();
      expect(CapacitorUpdater.notifyAppReady).not.toHaveBeenCalled();
    });

    it('notifies app ready, downloads dist.zip and applies update when a newer release exists on native platform', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            tag_name: 'v99.0.0',
            assets: [
              {
                name: 'dist.zip',
                browser_download_url: 'https://github.com/Jklmkii/quantora/releases/download/v99.0.0/dist.zip',
              },
            ],
          }),
        })
      );

      await initMobileAutoUpdater();

      expect(CapacitorUpdater.notifyAppReady).toHaveBeenCalledTimes(1);
      expect(CapacitorUpdater.download).toHaveBeenCalledWith({
        url: 'https://github.com/Jklmkii/quantora/releases/download/v99.0.0/dist.zip',
        version: '99.0.0',
      });
      expect(CapacitorUpdater.set).toHaveBeenCalledWith({ id: 'bundle-123' });
    });
  });
});
