import { spawnSync } from 'node:child_process';
import { mkdir, rm } from 'node:fs/promises';
import ffmpeg from 'ffmpeg-static';
import sharp from 'sharp';
import { mediaAssets } from '../src/config/mediaAssets.js';

// Matching transparent final-pose fallbacks, derived only from the supplied footage.
await mkdir('assets', { recursive: true });
for (const [role, { file, posterTime: time, crop: [left, right] }] of Object.entries(mediaAssets)) {
  const temp = `assets/${role}-frame.png`;
  const result = spawnSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-ss', String(time), '-i', `assets/${file}`, '-frames:v', '1', '-y', temp]);
  if (result.status !== 0) throw new Error(result.stderr.toString());
  const { data, info } = await sharp(temp).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255;
    const excess = g - Math.max(r, b);
    const t = Math.max(0, Math.min(1, (excess - 0.035) / 0.075));
    const alpha = 1 - t * t * (3 - 2 * t);
    data[i + 3] = Math.round(alpha * 255);
    const x = (i / 4) % info.width, y = Math.floor((i / 4) / info.width);
    const cropX = (x / info.width - left) / (right - left);
    if (role === 'scroll' && y / info.height < 0.12 && cropX > 0.2 && cropX < 0.8) data[i + 3] = 0;
    if (excess > 0.02) data[i + 1] = Math.round(Math.min(g, Math.max(r, b) + 0.02) * 255);
  }
  await sharp(data, { raw: info }).extract({ left: Math.floor(info.width * left), top: 0, width: Math.round(info.width * (right - left)), height: info.height }).png().toFile(`assets/${role}-poster.png`);
  await rm(temp);
}
console.log('Created three transparent posters from supplied video frames.');