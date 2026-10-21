# HPLX Glimmer

Glimmer is the official HPLX symbol, selected and approved on 17 October 2026. A compact light above an enclosing shadow expresses the family’s light-and-dark motif. Use the exact approved paths in `glimmer.source.json`; do not reshape, stretch, rotate or add effects.

## Canonical assets

- `hplx-glimmer-dark.svg`: amber #E0A53A on dark surfaces.
- `hplx-glimmer-light.svg`: umber #875709 on light surfaces.
- `hplx-glimmer-black.svg`, `hplx-glimmer-white.svg`: monochrome variants.
- `hplx-glimmer-currentColor.svg`: inherits colour when inlined. External img elements do not inherit page text colour.
- `hplx-glimmer-lockup-{dark,light,black,white,currentColor}.svg`: the approved horizontal pairing with HPLX outlined in Spectral SemiBold. Preserve the Spectral font notice in `fonts/licenses/Spectral-OFL.txt`.

The symbol has a 64×64 viewBox and visible bounds [8,6,48,54]. Keep at least 8 source units of clear space outside the visible mark. Recommended minimum symbol width is 24 CSS px; smaller exports require consumer-specific visual testing. Recommended lockup minimum width is 160 CSS px. Keep the exact approved geometry at every size; no optical redraw is implied.

If a linked logo alone identifies the destination, use an accessible name such as “HPLX”. If adjacent text already identifies it, hide the decorative symbol from assistive technology. Preserve transparent backgrounds and use a contrasting approved variant. Keep Cosmik’s endorsement separate.

## Theme and generation

The approved HPLX palette and Spectral headings are unchanged. Global navigation remains Cosmik; family content uses HPLX. Run `node scripts/build.mjs` to regenerate the canonical SVGs through `scripts/build-glimmer-assets.mjs`; `node scripts/check.mjs` tests the exact approved geometry, manifest and contrast roles.

## Migration and limits

Ember, its previous lockups and platform icons are deprecated historical assets, retained byte-for-byte so existing consumers do not break. Canonical manifest entry points now select Glimmer. See [historical Ember notes](EMBER-HISTORICAL.md) only for maintenance of old integrations. Existing Ember builders and tests remain to preserve those historical files. No platform icon package, optical redraw, splash, print proof or cross-browser conformance claim is included in this change.

Brand artwork remains covered by the [brand-use policy](../../LICENSE.md#2-brand-marks-trademark-style-policy). Approval does not imply trademark registration or third-party rights clearance.
