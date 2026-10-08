# Changes

Versions follow semver. Release tags will be `vX.Y.Z`; none exist yet.

## Unreleased (0.3.0)

- **Theme inheritance:** family CSS now follows the nearest explicit theme, including a dark family inside a light ancestor, using `light-dark()` and the inherited colour scheme.
- **Component reference:** compare the baseline and proposed HPLX family in the same specimen. Headings consume type roles; tabs, story actions, confirmation dialogs, status hues and elevation examples are interactive. Narrow layouts reflow at 200% root text size.
- **Verification:** headless Chromium checks cover both kits and the new interactions. Font licence notices are hashed immutable inputs; regression checks reject missing or changed notices, including during generated-hash refreshes.

- **Baseline approved (owner, 2026-10-07):** typography, the semantic dark/light roles, layout and component rules. It stays monochrome, as the guide says (§5, §7): the status hues, the shadow role and the elevation levels proposed earlier in this release moved to the HPLX family; the `scrim` role stays.
- **Family kits:** product families get their own style on top of the baseline. `scripts/generate-tokens.mjs` merges `tokens/<id>/family.json` over the baseline and refuses a family that breaks the contract (every baseline role and mode kept; colours through its own primitives; its own typeface only for heading roles; utility type, spacing, layout, radii, breakpoints and motion fixed). Each family gets the same outputs as the baseline, its CSS scoped to `[data-family="<id>"]`. The validator checks every kit against the baseline's pairs, plus pairs for a family's own roles.
- **HPLX family (proposed):** `tokens/hplx/`: warm blacks and bone text, a lantern-amber accent, Spectral 600 headings, the status tones `status-{error,warning,success,info}-{fg,bg,border}`, `accent`, `shadow` and elevation levels 1–3. 50 roles per mode; 184 contrast pairs pass.
- **Spectral bundled:** Spectral SemiBold (SIL OFL 1.1) for the HPLX family's headings: `fonts/desktop/Spectral-SemiBold.ttf` from Google Fonts' repository, a WOFF2 built by `scripts/build-web-fonts.mjs`, and its notice in `fonts/licenses/`.
- **Guide in Markdown:** `guide/` replaces the Word/PDF guide with eight pages of rules and judgement (identity, typography, colour, interface, product families, voice, documents, governance). Values live only in the tokens; the handle is `cosmiklabs`; the family-kit rules and the endorsement have their own page. The v0.2 Word/PDF guide moved to `guide/archive/`.
- **Layout:** every kit is a folder under `tokens/` (`cosmik/`, `hplx/`); every script is in `scripts/`, run through `node scripts/build.mjs` and `node scripts/check.mjs`.
- **Licence:** `LICENSE.md` sets a split: MIT for tooling and token data (copyright Cosmik Labs contributors), a brand-use policy for the emblem, wordmark and name (official Cosmik projects ship them unmodified; forks remove them), and the fonts' own OFL.
- **Line endings:** `.gitattributes` keeps text files LF on every platform; upstream licence notices keep their original bytes. Manifest hashes verify on a Windows checkout and the build reproduces the committed files byte for byte.
- **Native units:** each kit's JSON has a `native` section: px at a 16 px root for spacing, radius, gutter, control height, breakpoints and type sizes; letter spacing as a fraction; `line` as characters; easing as cubic-bezier points; durations in ms; colours as hex, sRGB floats and linear floats. The 0.2.0 CSS variables are unchanged, apart from the roles that moved to the HPLX family.
- **W3C DTCG:** each kit has a generated `<kit>.tokens.json` (Format Module 2025.10). Semantic colours alias primitives; light/dark modes are carried in `$extensions["com.cosmiklabs.modes"]` with dark as the default value.
- **Rust:** each kit has a generated, dependency-free `<kit>_tokens.rs` (`DARK`/`LIGHT` themes, primitives, spacing, type, motion).
- **New baseline roles:** `scrim`; radius scale `sm`/`md`/`full`; breakpoints `compact` (720 px) and `narrow` (380 px); named decorative greys used by the website (`divider-strong`, `ornament`, `ornament-faint`, `ornament-text`, `media-placeholder`). 36 semantic roles per mode (was 30).
- **Validator:** `disabled-border` on every surface and the disabled fill, and `muted` on `input-bg` and `status-bg`, are now checked too. Translucent roles are excluded by design.
- **App icons:** `scripts/build-icons.mjs` builds `cosmik.ico` (16/24/32/48/64/256), `cosmik.icns`, `cosmik-512.png` and `cosmik-apple-touch-180.png` from the plate (primary) variant renders. Node only.
- **Web font:** `scripts/build-web-fonts.mjs` wraps IBM Plex Mono Regular as WOFF2 (every table unchanged; Brotli from Node). The specimen prefers it, with the TTF as a fallback.
- **Manifest:** entry points (tokens per kit), a `web_fonts` list (family, weight, style, format), font family/weight/style on desktop fonts, a `role` for every asset, `visible_bounds` renamed to `visible_bounds_xywh`, `interim_identity` and `known_gaps`, and hashes for every generated file; `scripts/verify-manifest.mjs` checks them.
- **Docs:** `references/vector-README.txt` names files that exist; the README explains how to pin and consume the kit, including from Rust.

## 0.2.0 · 4 October 2026

- Added the accepted real SVG emblem, exact geometry color reverses, and tested raster exports.
- Kept approved raster originals unchanged and moved generated inverse alternatives to archive.
- Distinguished the standalone emblem from the still-unresolved outlined wordmark/lockup.
- Replaced incomplete light-mode tokens with 30 complete semantic roles in both themes.
- Added synchronized CSS/JSON, a generator, and a dependency-free 94-pair contrast validator.
- Added compact local component examples with native field, button, error, selected, focus, and reduced-motion behavior.
- Added exact type roles, a 720 px layout breakpoint, live-label and endorsement rules, and a two-page editable document template.
- Corrected SemiBold styling in document output.
- Marked browser behavior, tiny optical refinement, print proofs, and rights/reuse decisions as remaining work.

## 0.1.0

Initial eight-page visual-direction guide and unchanged raster asset bundle.
