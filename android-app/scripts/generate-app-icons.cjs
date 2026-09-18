/**
 * Generates Android launcher icons from assets/saffopeople-icon-source.png
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SOURCE = path.join(ROOT, 'assets', 'saffopeople-icon-source.png');
const RES = path.join(ROOT, 'android', 'app', 'src', 'main', 'res');

const DENSITIES = {
  'mipmap-mdpi': { launcher: 48, foreground: 108 },
  'mipmap-hdpi': { launcher: 72, foreground: 162 },
  'mipmap-xhdpi': { launcher: 96, foreground: 216 },
  'mipmap-xxhdpi': { launcher: 144, foreground: 324 },
  'mipmap-xxxhdpi': { launcher: 192, foreground: 432 },
};

async function renderSquare(size, paddingPercent) {
  const sharp = (await import('sharp')).default;
  const padding = Math.round(size * (paddingPercent / 100));
  const inner = Math.max(1, size - padding * 2);
  return sharp(SOURCE)
    .resize(inner, inner, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .extend({
      top: padding,
      bottom: padding,
      left: padding,
      right: padding,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .png({ quality: 100, compressionLevel: 9 })
    .toBuffer();
}

async function main() {
  if (!fs.existsSync(SOURCE)) {
    console.error('Missing source:', SOURCE);
    process.exit(1);
  }

  for (const [folder, sizes] of Object.entries(DENSITIES)) {
    const dir = path.join(RES, folder);
    fs.mkdirSync(dir, { recursive: true });

    const launcherBuf = await renderSquare(sizes.launcher, 8);
    const fgBuf = await renderSquare(sizes.foreground, 14);

    const sharp = (await import('sharp')).default;
    await sharp(launcherBuf).toFile(path.join(dir, 'ic_launcher.png'));
    await sharp(launcherBuf).toFile(path.join(dir, 'ic_launcher_round.png'));
    await sharp(fgBuf).toFile(path.join(dir, 'ic_launcher_foreground.png'));

    console.log('Wrote', folder);
  }

  // Play Store icon
  const storeDir = path.join(ROOT, 'assets');
  fs.mkdirSync(storeDir, { recursive: true });
  const sharp = (await import('sharp')).default;
  await sharp(SOURCE)
    .resize(512, 512, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .extend({
      top: 40,
      bottom: 40,
      left: 40,
      right: 40,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .png()
    .toFile(path.join(storeDir, 'play-store-icon-512.png'));

  // Splash (portrait center logo on brand background)
  const splashDir = path.join(RES, 'drawable');
  fs.mkdirSync(splashDir, { recursive: true });
  await sharp(SOURCE)
    .resize(720, 720, {
      fit: 'contain',
      background: { r: 244, g: 247, b: 246, alpha: 1 },
    })
    .extend({
      top: 280,
      bottom: 280,
      left: 180,
      right: 180,
      background: { r: 244, g: 247, b: 246, alpha: 1 },
    })
    .png()
    .toFile(path.join(splashDir, 'splash.png'));

  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
