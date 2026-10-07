# Cosmik brand kit

Brand kit 0.2.0 · 4 October 2026 · unreleased changes are listed in [CHANGELOG.md](CHANGELOG.md)

Start with the twelve-page PDF in `guides/`. The DOCX is editable.
This package turns the visual direction into a practical identity and product-reference system. It is published for reference and implementation trials; it is not a claim that every production asset, legal permission, or accessibility check is complete.

## Start here

1. Read the [brand guide PDF](guides/Cosmik%20Brand%20Guide%20v0.2.pdf) or open the [editable guide](guides/Cosmik%20Brand%20Guide%20v0.2.docx).
2. Use `assets/vector/cosmik-emblem-master-offwhite.svg` as the accepted standalone emblem master. `cosmik-emblem-ink.svg` reverses the same geometry; `cosmik-emblem-primary.svg` includes the original black canvas. PNG sizes are in `assets/vector/png/`.
3. Keep the approved original horizontal banner while a faithful outlined wordmark and complete vector lockup are prepared. No supporting font is an identified match for the wordmark. Until then, the **official stand-in** in product UIs is the emblem followed by the live label “Cosmik” in Inter 500 (type role `identity-label`, 20 px / 1.3, tracking 0).
4. Open `specimens/components.html` locally for the proposed dark/light components. CSS, script, and fonts are local. It has no submission, storage, analytics, or network behavior.
5. Copy `templates/cosmik-technical-note-template.docx` for a new document. Install the bundled desktop fonts first, replace bracketed content, and review the PDF export.

## Status and source of truth

- Accepted: traced standalone emblem geometry, based on the approved original. Dark/light SVGs share the same path.
- Approved references: original square and banner PNG compositions, unchanged. Their source names and checksums are in `asset-manifest.json`.
- Proposed: supporting typography, exact semantic themes, component behavior, layout rules, document styles, and voice guidance.
- Archive: earlier generated light PNGs. They differ geometrically and are not current masters.
- Incomplete (known gaps, also recorded in `asset-manifest.json`): outlined wordmark/full lockup, optically optimized tiny icon, print-process proofs, and downstream product validation.
- Proposed, awaiting owner approval: status colours and the other roles marked as proposals in `tokens/cosmik.source.json`.

Do not redraw, stretch, rotate, crop into the flare, add effects, or recreate the COSMIK wordmark with Inter. The live “Cosmik” interface label is a separate, specified typographic treatment.

## Package map

- `assets/approved-raster/`: original selected square and banner
- `assets/vector/`: accepted emblem SVGs, full renders, and named pixel-size exports
- `assets/archive/`: prior generated alternatives for reference
- `guides/`: editable guide and reviewed PDF
- `tokens/`: single editable source; generated CSS, JSON, W3C DTCG JSON and Rust constants; generator, validator, usage notes
- `icons/`: app icons generated from the plate variant (`cosmik.ico`, `cosmik.icns`, 512 px PNG, 180 px apple-touch PNG) and their build script
- `specimens/`: compact offline component reference in both themes
- `templates/`: two-page editable technical-note template, proof PDF, and usage notes
- `fonts/desktop/`, `fonts/web/`, `fonts/licenses/`: actual supporting typefaces and notices; `fonts/build-web-fonts.mjs` builds the Plex Mono WOFF2
- `asset-manifest.json`: entry points, roles, web/desktop font lists, known gaps and SHA-256 for every listed file; `verify-manifest.mjs` checks them
- `LICENSE.md`: the licence (MIT for tooling and tokens) and the brand-use policy for the marks
- `references/`: validation results, remaining tests, and vector source/trace evidence

For raster exports, the numeric suffix is the full canvas width and height in physical pixels. Display a 96 px export at 48 CSS px for a 2× source. Export names do not promise an optical redesign at small sizes. SVGs preserve the 1254-square source composition and its clear space.

## Tokens and verification

Use semantic variables, not individual gray values. Both themes map every surface, foreground, interaction, input, focus, and status role. Paper is #F6F5F0 to match the accepted emblem fill. The light-mode surface inheritance defect from v0.1 is fixed.

From the extracted root, with Node.js and no third-party packages:

- `node tokens/generate-tokens.mjs` regenerates `cosmik.css`, `cosmik.json`, `cosmik.tokens.json` and `cosmik_tokens.rs`;
- `node tokens/validate-tokens.mjs` checks the 178 defined contrast pairs (94 in the 0.2.0 review, plus disabled borders, muted text on input and status fills, and the status tones);
- `node icons/build-icons.mjs` and `node fonts/build-web-fonts.mjs` rebuild the app icons and the Plex Mono WOFF2;
- `node verify-manifest.mjs` verifies every hash in `asset-manifest.json` (add `--update-generated` after regenerating).

`.gitattributes` keeps text files LF on every platform so hashes and regenerated output match the committed bytes. See `tokens/README.md` for theme scope, native units, the DTCG file and font setup.

Completed in the 0.2.0 review: twelve guide pages and two template pages visually reviewed; correct Inter SemiBold verified in both PDFs; original raster byte checks; real SVG path/source checks; 30-role theme parity; reproducible CSS/JSON; 94 contrast-pair checks; static label/reference/script checks. Since then: 49-role theme parity and 178 contrast-pair checks (see CHANGELOG).

Pending: actual browser rendering, width/zoom/reflow, keyboard and assistive-technology checks. Browser execution was unavailable for this review. Guide component figures are drawn specifications, not screenshots. The detailed manual test list is in `references/component-validation.md`. These results do not certify a future product.

## Fonts and rights

Inter desktop files come from the official Inter 4.1 release; internal font version is 4.001. IBM Plex Mono Regular has internal version 2.005. Both are provided under SIL OFL 1.1; preserve the included notices when distributing font files. No typeface match or external rights clearance for the original wordmark is asserted.

- Inter: https://rsms.me/inter/download/
- Plex: https://github.com/IBM/plex/tree/master/packages/plex-mono

[LICENSE.md](LICENSE.md) sets the terms: tooling and token data under MIT, the emblem, wordmark and name under a trademark-style policy (official Cosmik projects ship them unmodified; forks remove them), and the fonts under their own OFL. Publishing this repository grants no other brand-asset reuse. A software repository's code license does not automatically resolve brand-artwork permissions. Keep upstream creator and license credits separate from Cosmik's endorsement.

## Consuming the kit

Pin an exact version; never track `main`. The kit is versioned with semver (`version` in `asset-manifest.json` and `tokens/cosmik.source.json`); a release will be a git tag `vX.Y.Z`.

- **Tagged release archive** (recommended for the website and design tools): download the archive for a tag and vendor the files you use (`entry_points` in `asset-manifest.json` names them). Check them with the listed SHA-256 hashes.
- **Git submodule** at a tagged commit (`git submodule add https://github.com/cosmiklabs/brand vendor/brand`, then check out the tag): best when a build reads files from the kit directly. Update by moving the submodule to a newer tag.
- **Git subtree** (`git subtree add --prefix vendor/brand https://github.com/cosmiklabs/brand vX.Y.Z --squash`): the files live in the consumer's history, so clones need no submodule step.

Whichever you use, consume only generated outputs and listed assets, and keep the font licence files with any font you ship.

**Rust consumers** (desktop launcher, in-game editor; Bevy UI or egui):

- Compile-time constants: include `tokens/cosmik_tokens.rs` from a submodule or subtree with `#[path]`, or copy it into the crate at a pinned version. It has no dependencies; convert `srgb` arrays to `bevy::color::Color::srgba` or the hex bytes to `egui::Color32`.
- Data at runtime or in `build.rs`: parse `tokens/cosmik.json` → `native` with `serde_json` (px, fractions, ms, bezier points, sRGB and linear floats); useful if a theme should be swappable without a rebuild.
- Fonts: load `fonts/desktop/*.ttf` (Bevy and egui both take TTF bytes, for example with `include_bytes!`). Icons: `icons/cosmik.ico` for the Windows executable resource, `icons/cosmik-512.png` for a window icon, `icons/cosmik.icns` for a macOS bundle.
- Use the `LIGHT`/`DARK` theme roles in UI code, never primitives directly, as on the web.

## Publishing

This repository is the home of the Cosmik brand kit (0.2.0). The approved source documents and assets are preserved in their original package layout. The organization profile remains in the separate `.github` repository.
