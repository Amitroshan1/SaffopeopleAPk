const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const releaseDir = path.join(root, 'release');
const androidOut = path.join(root, 'android', 'app', 'build', 'outputs');

const copies = [
  ['apk/debug/app-debug.apk', 'SaffoPeople-debug.apk'],
  ['apk/release/app-release.apk', 'SaffoPeople-release.apk'],
  ['bundle/release/app-release.aab', 'SaffoPeople-release.aab'],
];

fs.mkdirSync(releaseDir, { recursive: true });

for (const [src, dest] of copies) {
  const full = path.join(androidOut, src);
  if (fs.existsSync(full)) {
    fs.copyFileSync(full, path.join(releaseDir, dest));
    console.log(`Copied ${dest}`);
  } else {
    console.warn(`Skip (not built): ${src}`);
  }
}
