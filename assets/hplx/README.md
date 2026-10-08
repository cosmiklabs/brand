# HPLX Ember

The owner selected the original **01 / EMBER** symbol on 8 October 2026: one diamond above two shallow, tapered arcs. These are clean vector and raster deliveries of that selected shape. They are not a new logo concept.

## Use the mark

- `hplx-ember-amber.svg`: primary transparent symbol, using the selected concept's measured amber.
- `hplx-ember-bone.svg` and `hplx-ember-ink.svg`: identical geometry in the existing HPLX bone/ink colours, for contrasting backgrounds.
- `hplx-ember-primary.svg`: the amber symbol centred on a square dark plate for icon delivery.
- `png/`: transparent symbol exports (1024 × 384) and square dark-plate exports (16–1024 px). The square files retain the same proportions; they are not optically redrawn small icons.
- `../../icons/hplx-ember.ico`, `hplx-ember.icns`, `hplx-ember-512.png` and `hplx-ember-apple-touch-180.png`: platform containers/exports derived from the square plate.

Keep the diamond, both arcs, their spacing and their proportions together. Do not crop into a tip, stretch, rotate, merge the arcs, add glow or reconstruct the symbol from text. The SVG viewBox includes a small safety margin; allow additional surrounding space in the consuming layout.

This is a **symbol only**. There is no supplied HPLX wordmark, combined lockup or splash composition. Set the product name as ordinary live interface text when needed. Do not substitute the Cosmik emblem or combine the two symbols into a new logo.

Use an accessible name such as `alt="HPLX"` when the symbol identifies a link on its own. If an adjacent product name already supplies the same meaning, use an empty image alternative. Prefer the SVG for scalable UI use and preserve its aspect ratio.

## Theme integration

The HPLX family still consumes `tokens/hplx/`. Symbol selection is independent of theme approval: the existing palette, Spectral headings, status hues and elevation remain **proposed**. This addition does not change those token values or the shared interface rules.

The root `asset-manifest.json` lists the HPLX identity separately under `family_identities.hplx` and its usable paths under `entry_points.families.hplx`. Global Cosmik chrome keeps the Cosmik identity; HPLX content can use its own symbol and the separate “A Cosmik project” endorsement. See [product families](../../guide/families.md).

## Source, reproduction and limits

`ember.source.json` holds the measured original geometry and source reference checksum. The three shapes were reconstructed as four diamond edges and eight cubic Bézier segments, retaining the source spacing and slight asymmetry. The source's texture was flattened to its median interior amber for a clean, transparent production mark. No board lettering, background, other concept or embedded raster is distributed.

Run `node scripts/build.mjs` from the repository root. The Node-only HPLX builder creates the SVG and PNG files from the same geometry; the existing icon packer creates the platform files. `node scripts/check.mjs` verifies hashes, asset structure and the unchanged theme contrast requirements.

At original source scale, the reconstructed silhouette overlaps the selected source by 99.33% intersection-over-union. The two curve-edge fits have approximately 0.05–0.06 source-pixel RMS error. These are tracing measurements, not a print or accessibility certification.

The very thin upper arc and small diamond lose definition at favicon sizes. The supplied 16–32 px files are faithful reductions, not an approved optical redesign. Review the actual target size before shipping; no launcher, website or other consuming product is changed by this asset kit.

The mark and its geometry are covered by the repository's [brand-use policy](../../LICENSE.md#2-brand-marks-trademark-style-policy), not the MIT licence for tooling. The selected concept was AI-generated; the vector reconstruction adds no claim of registration or third-party rights clearance.
