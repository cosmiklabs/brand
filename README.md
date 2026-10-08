# Cosmik brand kit

Brand kit 0.3.0 release candidate (8 October 2026); the release tag is pending. See [CHANGELOG.md](CHANGELOG.md).

Start with the [brand guide](guide/README.md).
This package turns the visual direction into a practical identity and product-reference system. It is published for reference and implementation trials; it is not a claim that every production asset, legal permission, or accessibility check is complete.

## Start here

1. Read the [brand guide](guide/README.md): the rules and judgement behind the identity, in Markdown. The earlier Word/PDF guide (v0.2) is in `guide/archive/`.
2. Use `assets/vector/cosmik-emblem-master-offwhite.svg` as the accepted standalone emblem master. `cosmik-emblem-ink.svg` reverses the same geometry; `cosmik-emblem-primary.svg` includes the original black canvas. PNG sizes are in `assets/vector/png/`.
3. Keep the approved original horizontal banner while a faithful outlined wordmark and complete vector lockup are prepared. No supporting font is an identified match for the wordmark. Until then, the **official stand-in** in product UIs is the emblem followed by the live label “Cosmik” in Inter 500 (type role `identity-label`, 20 px / 1.3, tracking 0).
4. Open `specimens/components.html` locally and use the kit selector to compare the approved baseline and proposed HPLX family in dark/light themes. CSS, script, and fonts are local. It has no submission, storage, analytics, or network behavior.
5. Copy `templates/cosmik-technical-note-template.docx` for a new document. Install the bundled desktop fonts first, replace bracketed content, and review the PDF export.

## Status and source of truth

- Accepted: traced standalone emblem geometry, based on the approved original. Dark/light SVGs share the same path.
- Approved references: original square and banner PNG compositions, unchanged. Their source names and checksums are in `asset-manifest.json`.
- **Approved baseline (owner, 2026-10-07):** typography, the semantic dark/light roles, layout and component rules, as generated in `tokens/cosmik/`. The baseline is monochrome: no accent colour, status in words.
- **Family kits:** product families may have their own style on top of the baseline, under rules the build enforces (`tokens/README.md`). The **HPLX** family (`tokens/hplx/`) is proposed; its values await owner review.
- Archive: earlier generated light PNGs. They differ geometrically and are not current masters.
- Incomplete (known gaps, also recorded in `asset-manifest.json`): outlined wordmark/full lockup, optically optimized tiny icon, print-process proofs, and remaining browser/accessibility QA.

Do not redraw, stretch, rotate, crop into the flare, add effects, or recreate the COSMIK wordmark with Inter. The live “Cosmik” interface label is a separate, specified typographic treatment.

## Package map

- `assets/approved-raster/`: original selected square and banner
- `assets/vector/`: accepted emblem SVGs, full renders, and named pixel-size exports
- `assets/archive/`: prior generated alternatives for reference
- `tokens/`: one folder per kit. `cosmik/` is the baseline (`source.json` plus generated CSS, JSON, W3C DTCG JSON and Rust constants); `hplx/` is the HPLX family (`family.json` plus the same outputs). `tokens/README.md` explains both and the family contract.
- `icons/`: app icons generated from the plate variant (`cosmik.ico`, `cosmik.icns`, 512 px PNG, 180 px apple-touch PNG)
- `fonts/desktop/`, `fonts/web/`, `fonts/licenses/`: actual supporting typefaces and notices
- `specimens/`: compact offline component reference in both themes
- `guide/`: the brand guide in Markdown (rules only; values live in `tokens/`), with the v0.2 Word/PDF guide in `guide/archive/`
- `templates/`: two-page editable technical-note template, proof PDF, and usage notes
- `scripts/`: `build.mjs` (regenerate everything) and `check.mjs` (contrast, hashes and font-notice regression checks), `check-browser.mjs` (headless Chromium), and the scripts they run
- `asset-manifest.json`: entry points, roles, web/desktop font lists, known gaps and SHA-256 for every listed file
- `LICENSE.md`: the licence (MIT for tooling and tokens) and the brand-use policy for the marks
- `references/`: validation results, remaining tests, and vector source/trace evidence

For raster exports, the numeric suffix is the full canvas width and height in physical pixels. Display a 96 px export at 48 CSS px for a 2× source. Export names do not promise an optical redesign at small sizes. SVGs preserve the 1254-square source composition and its clear space.

## Tokens and verification

Use semantic roles, not individual colour values: both modes of every kit map every surface, foreground, interaction, input, focus and status role. Paper is #F6F5F0 to match the accepted emblem fill.

From the repository root, with Node.js 22+ and no third-party packages:

- `node scripts/build.mjs` regenerates every kit's tokens, the app icons and the Plex Mono and Spectral WOFF2 files, then refreshes the generated files' hashes in `asset-manifest.json`;
- `node scripts/check.mjs` checks every kit's contrast pairs (each kit passes the baseline's; a family adds pairs for its own roles), verifies every hash in the manifest, and tests that font notices cannot be omitted or silently rehashed;
- `node scripts/check-browser.mjs` checks the specimen in an installed Chromium browser. Set `BRAND_BROWSER` to its executable path; optionally set `BRAND_SCREENSHOTS` to an output folder for review images.

`.gitattributes` keeps text files LF on every platform, so hashes and regenerated output match the committed bytes.

Completed in the 0.2.0 review: twelve guide pages and two template pages visually reviewed; correct Inter SemiBold verified in both PDFs; original raster byte checks; real SVG path/source checks; reproducible CSS/JSON; contrast-pair checks. Since then: contrast checks for every kit (see CHANGELOG).

Headless Chrome and Edge checks now cover both kits, nested themes, fonts, responsive widths, 200% root text size and the specimen interactions. Full browser zoom, assistive technologies and other browser engines remain to be checked; see `references/component-validation.md`. Guide component figures are drawn specifications, not screenshots. These results do not certify a future product.

## Fonts and rights

Inter desktop files come from the official Inter 4.1 release; internal font version is 4.001. IBM Plex Mono Regular has internal version 2.005. Spectral SemiBold is also bundled for the proposed HPLX family headings. All three families are provided under SIL OFL 1.1; preserve the included notices when distributing font files. No typeface match or external rights clearance for the original wordmark is asserted.

- Inter: https://rsms.me/inter/download/
- Plex: https://github.com/IBM/plex/tree/master/packages/plex-mono
- Spectral: https://github.com/google/fonts/tree/main/ofl/spectral

[LICENSE.md](LICENSE.md) sets the terms: tooling and token data under MIT, the emblem, wordmark and name under a trademark-style policy (official Cosmik projects ship them unmodified; forks remove them), and the fonts under their own OFL. Publishing this repository grants no other brand-asset reuse. A software repository's code license does not automatically resolve brand-artwork permissions. Keep upstream creator and license credits separate from Cosmik's endorsement.

## Consuming the kit

Pin an exact version; never track `main`. The kit is versioned with semver (`version` in `asset-manifest.json` and `tokens/cosmik/source.json`); a release will be a git tag `vX.Y.Z`. No release tags exist yet; until one does, pin an exact commit and record that it includes unreleased changes.

- **Tagged release archive** (recommended for the website and design tools): download the archive for a tag and vendor the files you use (`entry_points` in `asset-manifest.json` names them). Check them with the listed SHA-256 hashes.
- **Git submodule** at a tagged commit (`git submodule add https://github.com/cosmiklabs/brand vendor/brand`, then check out the tag): best when a build reads files from the kit directly. Update by moving the submodule to a newer tag.
- **Git subtree** (`git subtree add --prefix vendor/brand https://github.com/cosmiklabs/brand vX.Y.Z --squash`): the files live in the consumer's history, so clones need no submodule step.

Whichever you use, consume only generated outputs and listed assets, and keep the font licence files with any font you ship. A product in a family consumes that family's kit (`tokens/<family>/`); the organisation's own surfaces consume the baseline (`tokens/cosmik/`).

**Rust consumers** (desktop launcher, in-game editor; Bevy UI or egui):

- Compile-time constants: include the kit's Rust file (`tokens/hplx/hplx_tokens.rs` for an HPLX product) from a submodule or subtree with `#[path]`, or copy it into the crate at a pinned version. It has no dependencies; convert `srgb` arrays to `bevy::color::Color::srgba` or the hex bytes to `egui::Color32`.
- Data at runtime or in `build.rs`: parse the kit's JSON (`tokens/hplx/hplx.json`) → `native` with `serde_json` (px, fractions, ms, bezier points, sRGB and linear floats); useful if a theme should be swappable without a rebuild.
- Fonts: load `fonts/desktop/*.ttf` (Bevy and egui both take TTF bytes, for example with `include_bytes!`). Icons: `icons/cosmik.ico` for the Windows executable resource, `icons/cosmik-512.png` for a window icon, `icons/cosmik.icns` for a macOS bundle.
- Use the `LIGHT`/`DARK` theme roles in UI code, never primitives directly, as on the web. A family's files already include the baseline's values.

## Publishing

This repository is the home of the Cosmik brand kit (0.3.0 release candidate). The current Markdown guide and per-kit token folders supersede the original package layout; earlier guide documents remain in `guide/archive/` as historical references. The organization profile remains in the separate `.github` repository.
