# Changes

Versions follow semver. Release tags will be `vX.Y.Z`; none exist yet.

## Unreleased (proposed 0.3.0)

Items marked *proposed* need owner approval before release.

- **Licence:** `LICENSE.md` sets a split: MIT for tooling and token data, a trademark-style policy for the emblem, wordmark and name (official Cosmik projects ship them unmodified; forks remove them), and the fonts' own OFL. Linked from the README.
- **Line endings:** `.gitattributes` keeps text files LF on every platform; upstream licence notices keep their original bytes. All manifest hashes verify on a Windows checkout and the generator reproduces the committed files byte for byte.
- **Native units:** `cosmik.json` gains a `native` section: px at a 16 px root for spacing, radius, gutter, control height, breakpoints and type sizes; letter spacing as a fraction; `line` as characters; easing as cubic-bezier points; durations in ms; colours as hex, sRGB floats and linear floats. CSS variables from 0.2.0 are unchanged.
- **W3C DTCG:** new generated `tokens/cosmik.tokens.json` (Format Module 2025.10). Semantic colours alias primitives; light/dark modes are carried in `$extensions["com.cosmiklabs.modes"]` with dark as the default value.
- **Rust:** new generated, dependency-free `tokens/cosmik_tokens.rs` (`DARK`/`LIGHT` themes, primitives, spacing, type, motion).
- **New tokens:** status tones `status-{error,warning,success,info}-{fg,bg,border}` in both themes (*proposed* colours); `scrim`, `shadow` and elevation levels 1–3; radius scale `sm`/`md`/`full`; breakpoints `compact` (720 px) and `narrow` (380 px); named decorative greys used by the website (`divider-strong`, `ornament`, `ornament-faint`, `ornament-text`, `media-placeholder`; their light/dark counterparts are *proposed*). 49 semantic roles per theme (was 30).
- **Validator:** 178 contrast pairs (was 94): adds `disabled-border` on every surface and the disabled fill, `muted` on `input-bg` and `status-bg`, and every status tone's fg and border on its own fill and on the page surfaces. All pass. Translucent roles are excluded by design.
- **App icons:** new `icons/build-icons.mjs` builds `cosmik.ico` (16/24/32/48/64/256), `cosmik.icns`, `cosmik-512.png` and `cosmik-apple-touch-180.png` from the plate (primary) variant renders. Node only.
- **Web font:** new `fonts/build-web-fonts.mjs` wraps IBM Plex Mono Regular as WOFF2 (every table unchanged; Brotli from Node). It loads in Chromium's font sanitizer. The specimen now prefers it, with the TTF as a fallback.
- **Manifest:** `entry_points`, a `web_fonts` list (family, weight, style, format), font family/weight/style on desktop fonts, a `role` for every asset (kind, variant, size), `visible_bounds` renamed to `visible_bounds_xywh`, `interim_identity` and `known_gaps` (wordmark/lockup, optical small icon, print proofs, browser QA), and hashes for the new tokens, icons and fonts. New `verify-manifest.mjs` checks every hash.
- **Docs:** `references/vector-README.txt` now names files that exist; the README explains how to pin and consume the kit, including from Rust; versions read 0.2.0 throughout.

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
