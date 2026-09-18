/**
 * Remove stale Capacitor web bundle before sync.
 * cap sync copies into public/ but does not always delete orphaned hashed chunks.
 */
const fs = require('fs');
const path = require('path');

const publicDir = path.join(
  __dirname,
  '..',
  'android',
  'app',
  'src',
  'main',
  'assets',
  'public',
);

if (fs.existsSync(publicDir)) {
  fs.rmSync(publicDir, { recursive: true, force: true });
  console.log('Removed stale android web assets:', publicDir);
} else {
  console.log('No stale web assets to remove.');
}
