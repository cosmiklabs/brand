# Cosmik baseline kit

The organisation's own identity and the base every family kit extends: black and
warm off-white, no accent colour, status in words. Approved by the owner on
7 October 2026. Rules live in the [guide](../../guide/README.md); values live in
[tokens/](tokens/), generated from [source.json](tokens/source.json).

## Contents

| Path | Holds | Status |
| --- | --- | --- |
| `tokens/` | `source.json` and generated CSS, JSON, W3C DTCG JSON and Rust constants | Approved (owner, 2026-10-07) |
| `assets/vector/` | The emblem master and its reverses, the traced lockup, full renders and named pixel-size exports | Accepted masters |
| `assets/approved-raster/` | The original selected square and banner, byte-for-byte | Approved references |
| `assets/archive/` | Earlier generated light PNGs; their geometry differs | Archive, never a master |
| `icons/` | App icons generated from the plate variant (`.ico`, `.icns`, 512 px and 180 px apple-touch PNGs) | Generated |
| `validation/` | Emblem and lockup trace evidence (QA JSON, overlays, vector notes) | Evidence |

## Masters

- **Emblem:** `assets/vector/cosmik-emblem-master-offwhite.svg` is the accepted
  standalone master. `cosmik-emblem-ink.svg` reverses the same geometry;
  `cosmik-emblem-primary.svg` includes the original black canvas. Dark and light
  SVGs share one path.
- **Lockup:** keep the approved original horizontal banner. Its vector lockup,
  `assets/vector/cosmik-lockup-*.svg` (the accepted emblem beside the outlined
  COSMIK wordmark), is the reusable logo, accepted on 11 October 2026. It is traced
  from the banner by `scripts/trace-cosmik-lockup.mjs`; geometry is in
  `assets/vector/cosmik-lockup.source.json` and evidence in `validation/lockup-qa.json`
  and `validation/lockup-trace-overlay.png`. The wordmark overlaps the banner by
  99.1% with every edge within 1 px. The emblem is the accepted master, which
  differs slightly from the banner's own drawing (93.6% overlap; its horn tips and
  inner flare).
- **Small identity:** where a product UI needs something smaller than the lockup,
  use the emblem followed by the live label “Cosmik” in Inter 500 (type role
  `identity-label`). No supporting font matches the wordmark; never recreate it.

Do not redraw, stretch, rotate, crop into the flare or add effects (see
[identity](../../guide/identity.md)).

## Exports

The numeric suffix of a raster export is the full canvas width and height in
physical pixels: show a 96 px export at 48 CSS px for a 2× source. Export names do
not promise an optical redesign at small sizes. SVGs preserve the 1254-square source
composition and its clear space.

## Known gaps

No optically redrawn small icon, no print-process proofs, and remaining browser and
accessibility QA; `known_gaps` in [asset-manifest.json](../../asset-manifest.json)
is the current list.
