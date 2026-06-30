// Extracts frames from the hero mp4 into assets/frames/ and writes a JSON manifest.
// Run with: npm run extract
import ffmpegPath from 'ffmpeg-static';
import { execFileSync } from 'node:child_process';
import { readdirSync, writeFileSync, rmSync, mkdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(root, 'Video-herosection-new.mp4');
const OUT_DIR = join(root, 'assets', 'frames');
const MANIFEST = join(root, 'assets', 'frames.json');

// --- config ---
const FPS = 24;          // sample rate (source ~24fps / 5.08s ~= 122 frames)
const MAX_WIDTH = 1920;  // source is 1920w 16:9 — keep native for crisp retina display
const QUALITY = 2;       // ffmpeg -qscale:v (2=best/near-lossless .. 31=worst)

// fresh output dir
rmSync(OUT_DIR, { recursive: true, force: true });
mkdirSync(OUT_DIR, { recursive: true });

console.log('Extracting frames with ffmpeg...');
execFileSync(ffmpegPath, [
  '-i', SRC,
  '-vf', `fps=${FPS},scale=${MAX_WIDTH}:-2:flags=lanczos`,
  '-qscale:v', String(QUALITY),
  join(OUT_DIR, 'frame_%04d.jpg'),
], { stdio: 'inherit' });

// probe output dimensions from first frame via ffmpeg (no ffprobe needed)
const files = readdirSync(OUT_DIR).filter(f => f.endsWith('.jpg')).sort();
let width = MAX_WIDTH, height = 0;
try {
  execFileSync(ffmpegPath, ['-i', join(OUT_DIR, files[0])]);
} catch (e) {
  const m = e.stderr.toString().match(/(\d{2,5})x(\d{2,5})/);
  if (m) { width = +m[1]; height = +m[2]; }
}

const totalBytes = files.reduce((s, f) => s + statSync(join(OUT_DIR, f)).size, 0);

const manifest = {
  source: 'Video-herosection-new.mp4',
  fps: FPS,
  count: files.length,
  width,
  height,
  pattern: 'assets/frames/frame_%04d.jpg', // 1-indexed, 4-digit zero pad
  frames: files.map(f => `assets/frames/${f}`),
};

writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
console.log(`\nDone: ${files.length} frames @ ${width}x${height}`);
console.log(`Total frame size: ${(totalBytes / 1048576).toFixed(2)} MB`);
console.log(`Manifest: assets/frames.json`);
