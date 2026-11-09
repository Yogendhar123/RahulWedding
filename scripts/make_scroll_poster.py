"""Builds a clean, high-resolution final-state image of the invitation scroll.

Why: the old poster was one mid-animation video frame (458x478) with falling
petals, sparkles and a hard-cut green spotlight, so the finished invitation
looked soft and blocky. This script registers the last ~4.5 s of the scroll
video, takes a per-pixel median (petals/sparkles drop out, compression noise is
averaged away), keeps a crisp mandala from the least-cluttered late frame,
upscales 3x and keys out the green screen with a cleaner matte.

Usage (from the project root):  python3 scripts/make_scroll_poster.py
Needs: ffmpeg on PATH, numpy, opencv-python, pillow.
"""
import glob, os, subprocess, tempfile
import cv2, numpy as np

VIDEO = 'assets/WhatsApp Video 2026-11-02 at 1.19.01 PM.mp4'
OUT = 'assets/scroll-poster.png'
CROP = (0.23, 0.77)        # must match src/config/mediaAssets.js
SCALE = 3
MANDALA = (425, 112, 72)   # cx, cy, radius in source pixels
CORDS = (279, 569)         # x of the two hanging cords in source pixels
BODY_TOP = 42              # above this row only the cords are kept

tmp = tempfile.mkdtemp()
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', '5.5', '-i', VIDEO, '-t', '4.5', f'{tmp}/f%03d.png'], check=True)
imgs = [cv2.imread(f) for f in sorted(glob.glob(f'{tmp}/f*.png'))]
H, W = imgs[0].shape[:2]

# 1. register every frame to the last one (the scroll drifts a little)
ref = cv2.cvtColor(imgs[-1], cv2.COLOR_BGR2GRAY).astype(np.float32)
mask = np.zeros((H, W), np.uint8); mask[45:455, 205:650] = 255
crit = (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 200, 1e-6)
aligned = []
for im in imgs:
    g = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY).astype(np.float32)
    M = np.eye(2, 3, dtype=np.float32)
    try: _, M = cv2.findTransformECC(ref, g, M, cv2.MOTION_AFFINE, crit, mask, 5)
    except cv2.error: pass
    aligned.append(cv2.warpAffine(im, M, (W, H), flags=cv2.INTER_LINEAR + cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REPLICATE))
A = np.stack(aligned).astype(np.float32)
plate = np.median(A, axis=0)

# 2. the mandala animates, so take it from the least cluttered late frame
cx, cy, r = MANDALA
yy, xx = np.mgrid[0:H, 0:W]
dist = np.hypot(xx - cx, yy - cy)
late = A[-12:]; late_med = np.median(late, axis=0)
score = [np.abs(f - late_med)[dist < r].mean() for f in late]
best = late[int(np.argmin(score))]
w = np.clip((r - dist) / 8.0, 0, 1)[..., None]
comp = plate * (1 - w) + best * w

# the HTML text draws its own divider, so erase the two printed flourishes by
# borrowing clean parchment from just beside them
for (y0, y1, sy) in ((180, 210, 214), (326, 354, 292)):
    h = y1 - y0; x0, x1 = 345, 505
    patch = comp[sy:sy + h, x0:x1].copy()
    fm = np.ones((h, x1 - x0), np.float32)
    fm = cv2.GaussianBlur(np.pad(fm[4:-4, 6:-6], ((4, 4), (6, 6))), (0, 0), 3)[..., None]
    comp[y0:y1, x0:x1] = comp[y0:y1, x0:x1] * (1 - fm) + patch * fm

# 3. upscale + sharpen

big = cv2.resize(comp, (W * SCALE, H * SCALE), interpolation=cv2.INTER_LANCZOS4)
blur = cv2.GaussianBlur(big, (0, 0), 1.6)
big = np.clip(big + 0.9 * (big - blur), 0, 255)

# 4. chroma key with despill
b, g, rr = [big[..., i] / 255.0 for i in (0, 1, 2)]
excess = g - np.maximum(rr, b)
t = np.clip((excess - 0.03) / 0.08, 0, 1)
alpha = 1 - t * t * (3 - 2 * t)
Hb, Wb = alpha.shape
rows = np.arange(Hb)[:, None]; cols = np.arange(Wb)[None, :]
cord = np.zeros((Hb, Wb), bool)
for cxp in CORDS: cord |= np.abs(cols - cxp * SCALE) <= 4 * SCALE
alpha = np.where((rows < BODY_TOP * SCALE) & ~cord, 0, alpha)
# the spotlight glow sits between the cords above the top rod: inside that zone
# keep only the mandala itself
zone = (cols >= 320 * SCALE) & (cols <= 530 * SCALE) & (rows < 74 * SCALE)
d_big = np.hypot(cols / SCALE - cx, rows / SCALE - cy)
# the glow is lime (red ~ green, low blue); petals and gold line-work are clearly redder
petal = np.clip(((rr - g) - 0.05) / 0.04, 0, 1)
zm = ((petal > 0.5) & zone & (d_big < 70)).astype(np.uint8)
zm = cv2.morphologyEx(zm, cv2.MORPH_CLOSE, np.ones((13, 13), np.uint8))
cnts, _ = cv2.findContours(zm, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
zfill = np.zeros_like(zm); cv2.drawContours(zfill, cnts, -1, 1, cv2.FILLED)   # no pin-holes inside the petals
zfill[(rows >= 74 * SCALE) & (d_big < 72)] = 1                               # no soft seam where the zone ends
zalpha = cv2.GaussianBlur(zfill.astype(np.float32), (0, 0), 2.4)
zalpha = np.clip((zalpha - 0.5) * 2.4 + 0.5, 0, 1)                           # smooth, un-jagged petal tips
alpha = np.where(zone, np.minimum(alpha.clip(0, 1) if False else 1.0, zalpha), alpha)
# keep only the main object; drops stray sparkles and spotlight remnants
solid = (alpha > 0.5).astype(np.uint8)
solid = cv2.morphologyEx(solid, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
n, lab, stats, _ = cv2.connectedComponentsWithStats(solid, connectivity=8)
keep = lab == (1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA])))
keep = cv2.dilate(keep.astype(np.uint8), np.ones((9, 9), np.uint8)).astype(bool)
alpha = np.where(keep, alpha, 0)
alpha = cv2.GaussianBlur(alpha.astype(np.float32), (0, 0), 0.6)
alpha = np.clip((alpha - 0.08) / 0.84, 0, 1)   # pull the edge in slightly: no green halo
spill = excess > (0.004 if False else 0.02)
spill = spill | ((rows < 92 * SCALE) & (excess > 0.0))   # yellow-green glow fringe along the top rod
g2 = np.where(spill, np.minimum(g, np.maximum(rr, b) + 0.02), g)
out = np.dstack([big[..., 2], g2 * 255, big[..., 0], alpha * 255])  # RGBA

left, right = int(W * CROP[0]) * SCALE, (int(W * CROP[0]) + round(W * (CROP[1] - CROP[0]))) * SCALE
out = out[:, left:right].astype(np.uint8)
cv2.imwrite(OUT, cv2.cvtColor(out, cv2.COLOR_RGBA2BGRA))
print('wrote', OUT, out.shape[1], 'x', out.shape[0])
