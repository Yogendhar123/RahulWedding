import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { mediaAssets } from './mediaAssets';

describe('active cinematic footage', () => {
  it('uses the new clips without reversing the inward-facing poses', () => {
    expect(mediaAssets.groom.file).toBe('Groom_walking_in_place_dfd0f81e.mp4');
    expect(mediaAssets.bride.file).toBe('Bride_walking_in_place_671ecc04.mp4');
    expect(mediaAssets.groom.flipX).toBe(false);
    expect(mediaAssets.bride.flipX).toBe(false);
  });

  it('keeps equal crop proportions and all active files available', () => {
    const width = ({ crop }) => crop[1] - crop[0];
    expect(width(mediaAssets.bride)).toBeCloseTo(width(mediaAssets.groom));
    for (const asset of Object.values(mediaAssets)) {
      expect(asset.crop[0]).toBeGreaterThanOrEqual(0);
      expect(asset.crop[1]).toBeLessThanOrEqual(1);
      expect(asset.crop[1]).toBeGreaterThan(asset.crop[0]);
      expect(existsSync(new URL(`../../assets/${asset.file}`, import.meta.url))).toBe(true);
    }
  });

  for (const role of ['groom', 'bride']) {
    it(`uses a transparent 720p ${role} poster matching the source crop`, async () => {
      const file = new URL(`../../assets/${role}-poster.png`, import.meta.url);
      const image = sharp(fileURLToPath(file));
      const metadata = await image.metadata();
      expect(metadata.height).toBe(720);
      expect(metadata.width).toBe(Math.round(1280 * (mediaAssets[role].crop[1] - mediaAssets[role].crop[0])));
      expect(metadata.hasAlpha).toBe(true);
      const corner = await image.extract({ left: 0, top: 0, width: 1, height: 1 }).raw().toBuffer();
      expect(corner[3]).toBe(0);
    });
  }
});