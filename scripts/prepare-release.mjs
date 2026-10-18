import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const pkg = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf-8'));
const version = pkg.version || '1.0.0';
const [major = 1, minor = 0, patch = 0] = version.split('.').map(Number);
const versionCode = major * 10000 + minor * 100 + patch;

// 1. Atualiza android/app/build.gradle automaticamente
const gradlePath = path.resolve('android/app/build.gradle');
if (fs.existsSync(gradlePath)) {
  let gradle = fs.readFileSync(gradlePath, 'utf-8');
  gradle = gradle.replace(/versionCode\s+\d+/, `versionCode ${versionCode}`);
  gradle = gradle.replace(/versionName\s+["'][^"']+["']/, `versionName "${version}"`);
  fs.writeFileSync(gradlePath, gradle, 'utf-8');
  console.log(`[RELEASE] build.gradle sincronizado: v${version} (versionCode: ${versionCode})`);
}

// 2. Compacta a pasta dist/ em dist.zip para o OTA via GitHub Releases
const distDir = path.resolve('dist');
const zipPath = path.resolve('dist.zip');

if (fs.existsSync(distDir)) {
  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

  if (process.platform === 'win32') {
    execSync(
      `powershell -NoProfile -Command "Compress-Archive -Path '${distDir}\\*' -DestinationPath '${zipPath}' -Force"`,
      { stdio: 'inherit' }
    );
  } else {
    execSync(`cd "${distDir}" && zip -r "${zipPath}" .`, { stdio: 'inherit' });
  }
  console.log(`[RELEASE] Pacote OTA gerado em: ${zipPath}`);
} else {
  console.warn('[RELEASE] Pasta dist/ não encontrada. Rode npm run build antes.');
}
