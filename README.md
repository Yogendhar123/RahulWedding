# Rahul & Bhavani — cinematic wedding invitation

A complete React + Vite + Tailwind CSS v4 + Framer Motion frontend. All wedding copy, dates, venue, media URLs, and the optional RSVP endpoint live in [src/config/weddingDetails.js](src/config/weddingDetails.js).

## Development

Requires Node.js 22+ and npm. Run `npm install`, then `npm run dev`. A **Wedding invitation: dev** task is also supplied in VS Code. Run `npm run build` for the production `dist` folder, `npm run preview` to preview it, and `npm test` for the countdown tests. Deploy `dist` to any static host. Sharing a localhost link will not make the invitation accessible to guests: publish the site first.

## Actual supplied footage

The current active MP4s are mapped as follows. The older bride/groom WhatsApp clips remain untouched in assets but are no longer referenced or included in the production bundle:

| Supplied clip | Role |
| --- | --- |
| Groom_walking_in_place_dfd0f81e.mp4 | New groom, 1280×720, faces right |
| Bride_walking_in_place_671ecc04.mp4 | New bride, 1280×720, faces left |
| WhatsApp Video 2026-11-02 at 1.19.01 PM.mp4 | Scroll opening |

No human illustrations or substitute people are used. The new bride/groom clips are about 10 seconds at 24 fps and 3.9/3.4 MB respectively; the unchanged scroll is about 1.7 MB. The real HTML video frames are displayed through WebGL with green-dominance soft keying, edge despill, and fixed crops. Cropped canvases and images use `object-fit: contain`, preserving proportions. A small mask removes the scroll clip's residual green spotlight above the parchment without covering the parchment or people. Video audio stays muted; the music toggle remains independent.

The groom and bride load sequentially **only after opening**, then play together with their durations normalized to a 10-second Framer Motion entrance. The scroll loads only after arrival. Its editable HTML text fades in once the parchment opens. Matching transparent standing images derived from final footage frames hold the character poses. After the scroll animation finishes, its clean open-parchment frame extracted from the same video remains visible, avoiding frozen flower overlays behind the text. Replay reloads the introduction. Skip reveals the readable invitation immediately.

Transparent posters are included and regenerated from the new footage at 9.9 seconds. Skip also displays these matching final poses instead of leaving characters mid-step. To regenerate them, run `npm run prepare:posters`. This uses development-only `ffmpeg-static` and `sharp`; neither is shipped in the frontend. [src/config/mediaAssets.js](src/config/mediaAssets.js) shares the crop fractions, filenames, facing flags, and poster times with the renderer and generator. When replacing a clip, update its import in the wedding configuration and its filename/crop in the shared media configuration. Supplied videos retain their original content.

## Character direction and quality

The new footage naturally faces inward: groom on the left looking right, bride on the right looking left, including their final standing poses. Both mirroring flags are disabled, preserving clothing/jewellery placement. The bride is positioned farther right inside her source frame, so her crop is [0.48, 0.82]; the groom crop is [0.30, 0.64]. Both crops have equal proportions to keep the displayed people consistently scaled.

Desktop character display height is 472px (540px on large screens), below the new footage's native 720px height, with restrained colour matching and soft grounding shadows. These clips are 720p, not 1080p/4K. Sharpening or stretching cannot recover missing facial detail; higher-resolution original footage can improve quality further. Regenerate matching posters and retune crops/keying when replacing footage.

## Missing mandap asset

**No mandap background image or video was present in the supplied assets.** The current atmospheric maroon/gold architectural backdrop is a deliberate non-photographic fallback, not a claimed mandap asset. Put a licensed mandap image/video into `public/assets/` and set `media.backgroundPoster` / `media.backgroundVideo` in the configuration to `/assets/your-file.jpg` or `/assets/your-file.mp4`. Never substitute human illustrations for the supplied videos.

## Music

Music is off by default and only starts from the manual toggle. With no audio file supplied, the toggle produces an original, gentle tanpura-inspired synthesized drone through Web Audio. Set `media.music` to your licensed track URL to replace it. Audio stops when the tab is hidden and must be manually restarted.

## RSVP and privacy

**By default, responses are saved to this browser only and are not sent to the couple.** This limitation appears visibly above the form and in the success confirmation. No backend, credentials, email delivery, or remote database is silently assumed.

To enable real delivery, set `rsvpEndpoint` to your HTTPS backend URL. The form sends JSON containing `name`, optional `email`, `guests` (1–10), `attendance`, and optional `message`. The server must validate, rate-limit, securely store responses, allow the deployed origin through CORS, and return a successful HTTP status only after accepting the response. Do not put private API keys in client configuration. Browser-local responses can be removed by clearing site storage.

## Accessibility and performance

- Reduced-motion visitors see the static final-pose invitation without downloading entrance videos. A visible notice explains the skip, and **Play full animation** explicitly opts into the cinematic entrance for this visit without changing system settings. Decorative motion remains reduced.
- Videos, the entrance timeline, petals, and particles pause while the hero is offscreen or the tab is hidden.
- Decode callbacks redraw the keyed video only for actual frames; the final canvas does not run a perpetual render loop.
- WebGL/asset failures retain transparent poster fallbacks. All details remain readable in the HTML sections.
- Native share is used when available, with clipboard fallback. Google Maps opens an exact-venue search; verify the venue before travel.
- Countdown uses the explicit Indian timezone offset, not the visitor's local timezone.
- Mobile moves the actual characters below the parchment, preserves aspect ratios, and exposes full details in responsive event/venue sections.
- Google Fonts use `display=swap`; local serif/sans fallbacks work offline. Self-host the fonts if third-party requests are undesirable.

## Validation

Production build, unit tests, desktop/mobile browser checks, completed video playback, reduced-motion behavior, overflow checks, and browser-local RSVP submission have been verified. `npm audit` reports no known vulnerabilities at setup time.