# Cosmik brand kit

Brand kit v0.2 · 4 October 2026

Start with the twelve-page PDF in `guides/`. The DOCX is editable.
This package turns the visual direction into a practical identity and product-reference system. It is published for reference and implementation trials; it is not a claim that every production asset, legal permission, or accessibility check is complete.

## Start here

1. Read the [brand guide PDF](guides/Cosmik%20Brand%20Guide%20v0.2.pdf) or open the [editable guide](guides/Cosmik%20Brand%20Guide%20v0.2.docx).
2. Use `assets/vector/cosmik-emblem-master-offwhite.svg` as the accepted standalone emblem master. `cosmik-emblem-ink.svg` reverses the same geometry; `cosmik-emblem-primary.svg` includes the original black canvas. PNG sizes are in `assets/vector/png/`.
3. Keep the approved original horizontal banner while a faithful outlined wordmark and complete vector lockup are prepared. No supporting font is an identified match for the wordmark.
4. Open `specimens/components.html` locally for the proposed dark/light components. CSS, script, and fonts are local. It has no submission, storage, analytics, or network behavior.
5. Copy `templates/cosmik-technical-note-template.docx` for a new document. Install the bundled desktop fonts first, replace bracketed content, and review the PDF export.

## Status and source of truth

- Accepted: traced standalone emblem geometry, based on the approved original. Dark/light SVGs share the same path.
- Approved references: original square and banner PNG compositions, unchanged. Their source names and checksums are in `asset-manifest.json`.
- Proposed: supporting typography, exact semantic themes, component behavior, layout rules, document styles, and voice guidance.
- Archive: earlier generated light PNGs. They differ geometrically and are not current masters.
- Incomplete: outlined wordmark/full lockup, optically optimized tiny icon, print-process proofs, brand reuse terms, and downstream product validation.

Do not redraw, stretch, rotate, crop into the flare, add effects, or recreate the COSMIK wordmark with Inter. The live “Cosmik” interface label is a separate, specified typographic treatment.

## Package map

- `assets/approved-raster/`: original selected square and banner
- `assets/vector/`: accepted emblem SVGs, full renders, and named pixel-size exports
- `assets/archive/`: prior generated alternatives for reference
- `guides/`: editable guide and reviewed PDF
- `tokens/`: single editable source, generated CSS/JSON, generator, validator, usage notes
- `specimens/`: compact offline component reference in both themes
- `templates/`: two-page editable technical-note template, proof PDF, and usage notes
- `fonts/desktop/`, `fonts/web/`, `fonts/licenses/`: actual supporting typefaces and notices
- `references/`: validation results, remaining tests, and vector source/trace evidence

For raster exports, the numeric suffix is the full canvas width and height in physical pixels. Display a 96 px export at 48 CSS px for a 2× source. Export names do not promise an optical redesign at small sizes. SVGs preserve the 1254-square source composition and its clear space.

## Tokens and verification

Use semantic variables, not individual gray values. Both themes map every surface, foreground, interaction, input, focus, and status role. Paper is #F6F5F0 to match the accepted emblem fill. The light-mode surface inheritance defect from v0.1 is fixed.

From the extracted root, `node tokens/generate-tokens.mjs` regenerates CSS and JSON without third-party packages. `node tokens/validate-tokens.mjs` checks the 94 defined contrast pairs. See `tokens/README.md` for theme scope and font setup.

Completed: twelve guide pages and two template pages visually reviewed; correct Inter SemiBold verified in both PDFs; original raster byte checks; real SVG path/source checks; 30-role theme parity; reproducible CSS/JSON; 94 contrast-pair checks; static label/reference/script checks.

Pending: actual browser rendering, width/zoom/reflow, keyboard and assistive-technology checks. Browser execution was unavailable for this review. Guide component figures are drawn specifications, not screenshots. The detailed manual test list is in `references/component-validation.md`. These results do not certify a future product.

## Fonts and rights

Inter desktop files come from the official Inter 4.1 release; internal font version is 4.001. IBM Plex Mono Regular has internal version 2.005. Both are provided under SIL OFL 1.1; preserve the included notices when distributing font files. No typeface match or external rights clearance for the original wordmark is asserted.

- Inter: https://rsms.me/inter/download/
- Plex: https://github.com/IBM/plex/tree/master/packages/plex-mono

Brand-asset reuse terms remain undecided; publication of this repository does not grant a blanket brand-asset reuse license. A software repository's code license does not automatically resolve brand-artwork permissions. Keep upstream creator and license credits separate from Cosmik's endorsement.

## Publishing

This repository is the home of the Cosmik v0.2 brand kit. The approved source documents and assets are preserved in their original package layout. The organization profile remains in the separate `.github` repository.
