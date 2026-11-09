// Builds the lightweight clips the browser plays (assets/*-play.mp4).
// Each original is cropped to the region the page displays (crop fractions from mediaAssets.js)
// and scaled so no more pixels are decoded/uploaded to the GPU than are ever shown on screen.
// Run: npm run optimize:videos   (set FFMPEG=/path/to/ffmpeg to use a system ffmpeg)
import { spawnSync } from 'node:child_process';
import { mediaAssets } from '../src/config/mediaAssets.js';

const ffmpeg = process.env.FFMPEG || (await import('ffmpeg-static')).default;
const probe = (file) => {
  const r = spawnSync(ffmpeg, ['-hide_banner', '-i', file], { encoding: 'utf8' });
  const m = /Stream #.*Video:.*?, (\d{2,5})x(\d{2,5})/.exec(r.stderr);
  if (!m) throw new Error(`Cannot read size of ${file}`);
  return [Number(m[1]), Number(m[2])];
};
const even = (n) => Math.round(n / 2) * 2;

for (const [role, { file, crop: [left, right], playFile, maxWidth }] of Object.entries(mediaAssets)) {
  const input = `assets/${file}`, output = `assets/${playFile}`;
  const [w, h] = probe(input);
  const cropW = even((right - left) * w), cropX = Math.floor(left * w);
  const outW = Math.min(maxWidth, cropW), outH = even(h * outW / cropW);
  const filter = `crop=${cropW}:${h}:${cropX}:0,scale=${outW}:${outH}:flags=lanczos`;
  const args = ['-hide_banner', '-loglevel', 'error', '-y', '-i', input, '-an', '-vf', filter,
    // One keyframe per second keeps seeking cheap; yuv420p + faststart play everywhere and start immediately.
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '19', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-g', '24', '-movflags', '+faststart', output];
  const r = spawnSync(ffmpeg, args, { stdio: 'inherit' });
  if (r.status !== 0) throw new Error(`ffmpeg failed for ${role}`);
  console.log(`${role}: ${w}x${h} -> ${outW}x${outH}  (${output})`);
}
