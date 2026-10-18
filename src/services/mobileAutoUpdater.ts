import { Capacitor } from '@capacitor/core';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import pkg from '../../package.json';

const GITHUB_LATEST_RELEASE_URL = 'https://api.github.com/repos/Jklmkii/quantora/releases/latest';
const OTA_ASSET_NAME = 'dist.zip';

interface GitHubReleaseAsset {
  name: string;
  browser_download_url: string;
}

interface GitHubReleaseResponse {
  tag_name?: string;
  assets?: GitHubReleaseAsset[];
}

/**
 * Compara duas versões semânticas (ex: "v1.2.93" vs "1.2.92").
 * Retorna true se `remoteVersion` for estritamente maior que `currentVersion`.
 */
export function isNewerVersion(remoteVersion: string, currentVersion: string): boolean {
  const cleanRemote = remoteVersion.trim().replace(/^v/i, '');
  const cleanCurrent = currentVersion.trim().replace(/^v/i, '');

  if (!cleanRemote || !cleanCurrent) return false;

  const remoteParts = cleanRemote.split('.').map((n) => Number.parseInt(n, 10) || 0);
  const currentParts = cleanCurrent.split('.').map((n) => Number.parseInt(n, 10) || 0);
  const maxLength = Math.max(remoteParts.length, currentParts.length, 3);

  for (let i = 0; i < maxLength; i++) {
    const r = remoteParts[i] ?? 0;
    const c = currentParts[i] ?? 0;
    if (r > c) return true;
    if (r < c) return false;
  }

  return false;
}

/**
 * Inicializa o serviço de atualização OTA no Android/iOS via @capgo/capacitor-updater.
 * Opera exclusivamente quando `Capacitor.isNativePlatform()` é verdadeiro.
 */
export async function initMobileAutoUpdater(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    await CapacitorUpdater.notifyAppReady();

    const response = await fetch(GITHUB_LATEST_RELEASE_URL, {
      headers: {
        Accept: 'application/vnd.github+json',
      },
    });

    if (!response.ok) {
      return;
    }

    const release = (await response.json()) as GitHubReleaseResponse;
    const latestTag = release.tag_name?.replace(/^v/i, '') ?? '';
    const currentVersion = pkg.version || '1.0.0';

    if (!latestTag || !isNewerVersion(latestTag, currentVersion)) {
      return;
    }

    const distAsset = release.assets?.find((asset) => asset.name === OTA_ASSET_NAME);
    if (!distAsset?.browser_download_url) {
      return;
    }

    const bundle = await CapacitorUpdater.download({
      url: distAsset.browser_download_url,
      version: latestTag,
    });

    if (bundle) {
      await CapacitorUpdater.set(bundle);
    }
  } catch (error) {
    console.warn('[OTA] Falha ao verificar ou aplicar atualização OTA:', error);
  }
}
