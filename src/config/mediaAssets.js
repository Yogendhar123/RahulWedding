// Shared by the browser renderer and poster generator to keep crops and poses
// identical. Fractions refer to the original video's horizontal coordinates.
export const mediaAssets = {
  groom: { file: 'Groom_walking_in_place_dfd0f81e.mp4', crop: [0.30, 0.64], flipX: false, posterTime: 9.9 },
  bride: { file: 'Bride_walking_in_place_671ecc04.mp4', crop: [0.48, 0.82], flipX: false, posterTime: 9.9 },
  // Portrait 12-second scroll clip generated from scroll-final.png.
  // Full-frame crop is essential: the artwork is portrait-proportioned, not a center crop of a landscape clip.
  scroll: { file: 'scroll-vertical-unroll.mp4', crop: [0, 1], flipX: false, posterTime: 11.9 },
};