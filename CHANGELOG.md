# Changes

Versions follow semver; release tags are `vX.Y.Z`. Newest first. Family kits carry
their own version in `family.json`; from 0.8.0 they live in their own repositories.

## 0.9.1 · 24 October 2026

- **Tests.** The both-layers CLI test now accepts the platform's path separator;
  `vendor.mjs` prints nested layer paths in native form, so the test failed on
  Windows in 0.9.0's CI. No tool, contract, token or asset change; of the
  distributed files only `package.json` (the version) differs from 0.9.0. Vendor
  0.9.1 rather than 0.9.0.

## 0.9.0 · 24 October 2026

One distribution contract for every Cosmik brand repository, so a product can sync
its product brand, with the foundation that brand was built on, using one tool and
verify both layers in one check. Breaking for readers of the manifest's `vendor`
section and of `vendor.mjs`'s exports (see migration below).

- **Distribution contract.** The manifest's `vendor` section is now `distribution`:
  what this repository publishes for consumers to vendor. Each entry is
  `{ "path", "sha256" }`; the build refreshes the hashes and the check fails when
  they differ from the bytes, without ever refreshing an upstream font, licence
  notice or approved original. `package.json` gains `repository`, which names the
  release in locks. Any repository with `name`, `version` and `repository` in
  `package.json`, `distribution.files` in `asset-manifest.json` and HEAD exactly
  at `v<version>` on a clean tree can be synced.
- **`scripts/vendor.mjs` works for any such repository.** `sync --from <checkout>
  --into <dir>` checks every file against its distribution hash before copying,
  installs the set only after it verifies, refuses to replace a directory holding a
  different repository's release, and writes `<short name>.lock.json` (the package
  name without its scope: `brand.lock.json` here, `brand-tectra.lock.json` for
  `@cosmiklabs/brand-tectra`). Locks are `lockfileVersion` 2 and add `package`.
- **Nested layers.** When a synced set contains a lock (a product brand's
  `vendor/brand/brand.lock.json`), `verify` also checks that layer's files against
  it and names a change in both layers; `--release` proves the outer lock against
  its tag. `verify` and `sync` print every layer. `lockfileVersion` 1 locks from
  0.8.0 still verify, with `--release` against a 0.8.0-shaped release too.
- **Docs.** [Vendoring a release](kits/README.md#vendoring-a-release) explains how a
  product consumes its product brand and how organisation surfaces consume this
  repository; [publishing a product brand](guide/families.md#publishing-a-product-brand)
  states what a `brand-<product>` repository must publish.
- **Tests** sync a fictional product brand that vendors this release, check both
  layers, nested tampering (including an edited outer lock and an edited nested
  lock caught by `--release`), refusal of a release whose nested layer is broken, a
  v1 lock, the `--release` proof on both manifest shapes, and the manifest's
  distribution hashes.

The family contract in `scripts/generate-tokens.mjs`, every baseline token value and
the baseline token version (0.7.0) are unchanged; families' `extends` stays
`"Cosmik baseline 0.7.0"`, and family outputs change only in their provenance header.

### Migration

- **Product brand repositories:** re-sync with
  `node <brand>/scripts/vendor.mjs sync --from <brand> --into vendor/brand`, rename
  the manifest section that described the vendored foundation (it was also called
  `vendor`) to the `brand` reference plus a `distribution` that lists your own
  deliverables and every file under `vendor/brand/`, including its lock; add
  `repository` to `package.json`. See
  [publishing a product brand](guide/families.md#publishing-a-product-brand).
- **Products** (the Tectra app, `website-tectra`, HPLX): sync your product brand
  instead of copying files by hand:
  `node <brand-tectra>/vendor/brand/scripts/vendor.mjs sync --from <brand-tectra> --into vendor/brand-tectra`,
  then `verify vendor/brand-tectra` in CI. Load
  `vendor/brand-tectra/vendor/brand/kits/cosmik/tokens/cosmik.css`, then
  `vendor/brand-tectra/tokens/tectra.css`, then the optional
  `vendor/brand-tectra/vendor/brand/kits/cosmik/components/controls.css`.
- **Code reading `manifest.vendor`** reads `manifest.distribution.files[].path`.
  `vendor.mjs` no longer exports `vendorSet` or `LOCK`; use `distributionSet`,
  `lockFileName` and `findLock`. `verify()` also returns `lockFile` and `layers`.
- Existing 0.8.0 locks keep verifying; re-sync to write a version 2 lock.

## 0.8.0 · 24 October 2026

This repository now holds only the shared Cosmik foundation. Product families move
to their own repositories, which build on a pinned release of this kit and can
prove it. Breaking for consumers of the removed paths (see migration below).

- **Split.** Remove `kits/hplx/` and `kits/tectra/` (tokens, marks, icons, guides,
  the Tectra review board and validation record), their builders
  (`build-glimmer-assets`, `build-hplx-assets`, `build-hplx-lockup`,
  `build-tectra-assets`, the HPLX icon pack in `build-icons`) and tests, and
  Spectral (`fonts/desktop/Spectral-SemiBold.ttf`, `fonts/web/Spectral-SemiBold.woff2`,
  `fonts/licenses/Spectral-OFL.txt`). They continue in `cosmiklabs/brand-hplx`
  and `cosmiklabs/brand-tectra`. The manifest drops `family_identities`,
  `tectra_identity`, `glimmer_assets`, the family token entry points and Spectral.
- **Family API.** `scripts/family.mjs build|check <familyRoot>` builds a family's
  `tokens/family.json` over the baseline of the checkout the script belongs to,
  including a copy vendored into another repository. `check` fails on a contract
  violation, an `extends` that does not name this baseline, committed outputs that
  differ from regeneration, or a failing contrast pair (baseline and extension
  roles). The contract itself is unchanged. `generate-tokens.mjs` and
  `validate-tokens.mjs` export their pieces; `generate-tokens.mjs` now generates
  only the baseline, byte for byte as before. Family output headers name the brand
  release that generated them and use relative paths only.
- **Provenance.** `scripts/vendor.mjs sync --from <brand> --into <dir>` copies the
  reviewable `vendor` set listed in `asset-manifest.json` from a clean checkout at
  a `vX.Y.Z` tag and writes `brand.lock.json` (repository, tag, commit, SHA-256 per
  file). `vendor.mjs verify <dir>` fails on any missing, extra or changed file;
  `--release <brand>` also proves the lock against the tag's own bytes.
- **Shared controls.** `kits/cosmik/components/controls.css` adds framework-neutral
  `c-button` (primary, secondary, dense), `c-link`, `c-input`, `c-select` (native
  select with a drawn, stroked chevron), `c-chip`, `c-status` and `c-focus-ring`,
  bound only to semantic tokens, with hover, pressed, focus-visible, disabled,
  pending and forced-colour handling. Rules are in
  [interface](guide/interface.md#shared-controls); the component reference now uses
  these classes, and the browser check verifies their computed states.
- **Tests.** A fictional, test-only family under `tests/fixtures/example/` keeps the
  family path covered: contract violations, drift, `extends` mismatches, contrast
  failures, vendored-path resolution and browser family scopes.

No baseline token value, mark, palette or bundled Inter or IBM Plex Mono file
changes; the baseline token version stays 0.7.0, so families' `extends` remains
`"Cosmik baseline 0.7.0"`.

### Migration

- **Family repositories** (`brand-hplx`, `brand-tectra`): move `kits/<id>/` content
  to the repository root (`tokens/family.json`, assets, guide), and HPLX's Spectral
  files with their notice. Vendor this release with `vendor.mjs sync`, then run
  `node vendor/brand/scripts/family.mjs build .` and `check .` in CI with
  `vendor.mjs verify vendor/brand`. Regenerated outputs are byte-identical to 0.7.0
  apart from the provenance header (CSS comment, DTCG `$description`, Rust comment).
- **Website and other organisation consumers:** baseline paths are unchanged.
  Replace hand-written button, link, field and select styles with
  `kits/cosmik/components/controls.css` where they match, loaded after the token
  CSS. Take any family CSS from that family's repository instead of `kits/<id>/`.
- **Tectra app** (`packages/brand/sync.mjs`): keep vendoring `cosmik.css`, the fonts
  and licences from this repository, but take `tectra.css` and Latch from a
  `brand-tectra` release, or switch to that repository's vendored layout. The
  `kits/tectra/...` paths in `vendor.json` no longer exist at 0.8.0.
- `[data-family]` selectors, token names and generated JSON are unchanged.

## 0.7.0 · 23 October 2026

- Add a shared motion contract covering entrances, exits, interruptions, focus,
  reduced motion and pending/completed states, with offline interactive examples
  for menus, dialogs, tooltips and disclosures.
- CSS now exposes normal, system-resolved and effective motion durations. The
  existing effective duration still follows the OS by default; `data-motion`
  accepts `system`, `reduce` and `full` for explicit scope overrides. Consumers
  should use the effective token and apply the same scope to portalled content.
  Source durations and native exports are unchanged.
- Overhaul interface composition, responsive density, state/copy guidance,
  consumer onboarding, quality review and release governance. Correct stale
  family approvals, asset paths and icon-pack assumptions.
- Strengthen token input validation, immutable asset protection, manifest
  inventory checks, PNG/SVG validation and reproducibility checks. Correct
  Tectra lockup metadata to match the existing artwork. Add Node 22/24 and Windows
  CI coverage without introducing dependencies.
- Expand browser regressions to test actual exit transitions, cancellation,
  nested motion policy, short touch layouts and direct file opening. Fix the
  macOS test browser's keychain-related startup stall.
- Clarify the licence with owner approval: written guidance is MIT; marks and
  artwork keep their separate restrictions, and fonts keep their OFL licences.

No palette, font family or approved artwork changes. Family revisions remain
HPLX 0.1.0 and Tectra 0.2.0; both resolve against baseline 0.7.0.

## 0.6.0 · 21 October 2026

- **Behaviour change:** a root without `data-theme` now follows the operating
  system's light or dark preference instead of staying dark, and family kits
  follow with it. `data-theme="dark"` or `"light"` still fixes a mode. The guide
  no longer prescribes a default mode; that is each product's decision.

## 0.5.0 · 21 October 2026

- Add dense application roles to the baseline, so every kit has them: type roles
  `ui` (Inter 500, 14 px) and `ui-small` (Inter 500, 12 px), and layout
  `control-dense` (32 px). The [interface guide](guide/interface.md) says where
  they apply: navigation, menus, toolbars and lists for a pointer, while touch
  keeps 44 px targets and forms keep `control`. Families inherit them as utility
  type. Nothing existing changes.

## 0.4.0 · 21 October 2026

**Breaking layout change.** Each kit now lives in one folder: `kits/<kit>/` holds its
`tokens/`, `assets/`, `icons/`, specimen and validation. `tokens/<kit>/` becomes
`kits/<kit>/tokens/`, `assets/vector/` and the other baseline art move under
`kits/cosmik/`, family art under `kits/<family>/assets/`, and `tokens/README.md`
becomes `kits/README.md`. File names inside the kits are unchanged except Tectra's
specimen (`kits/tectra/specimen.html`). Consumers must update their paths.

- Add `package.json` scripts (`build`, `check`, `test`, `check:browser`,
  `check:reproducible`) and a CI workflow that fails if committed generated files
  differ from a fresh build. `check` discovers every test instead of a fixed list.
- The browser check loads every declared font face before asserting it loaded;
  it previously failed whenever a face was declared but unused on the page.
- Rewrite the README as an entry point; baseline masters and evidence move to the
  [baseline kit](kits/cosmik/README.md). Replace the stale "Tectra family draft"
  notes with the approved family's summary.

### Tectra family 0.2.0 · 21 October 2026

- Rename the Tecton family to **Tectra**, the product's name. Paths, token names, the `data-family` selector, specimens, tests and the generator move from `tecton` to `tectra`; `[data-family="tecton"]` no longer applies. Lockups are regenerated with the outlined Inter label "Tectra". The Latch geometry, palette and every other value are unchanged.

### HPLX Glimmer · 17 October 2026

- Adopt the approved compact Glimmer as the official HPLX symbol, with five transparent variants and matching Spectral lockups.
- Canonical manifest paths select Glimmer. Preserve Ember assets and builders as deprecated historical compatibility files. HPLX theme values and Tecton remain unchanged.

### Tecton family 0.1.0 · 17 October 2026

- Add the approved original angle-only Latch, five transparent symbol variants and matching outlined Inter lockups. Preserve exact source paths; document clear space and minimum sizes.

- Owner-approved mineral/teal theme. Angle-only Latch symbol and Inter lockups approved; rendered browser accessibility checks remain unverified.

- Improve specimen accessibility: scalable HTML diagram legends, 14 px small labels, wrapping, explicit pressed states, forced-colour treatment and board-specific regression coverage.
- Mark the former organisation motto for retirement/replacement; no new motto adopted.
- Lead Tecton presentation with creative benefits and intended workflow; exclude implementation architecture and unannounced commercial terms.
- Add approved mineral/teal family tokens and offline review board, with Inter inherited throughout. Theme values and applications approved by owner.
- Extend component selection and browser regression coverage to Tecton. No existing family values or parent rules changed. No product release or consumer rollout.

### HPLX family approval · 15 October 2026

- **HPLX family approved (owner, 2026-10-15):** its palette, amber accent, Spectral headings, status hues and elevation, unchanged. Two rules join the guide: desktop products (the HPLX app and editor) follow the system theme until the person picks System, Dark or Light; dense tool panels (the HPLX Editor) use 28 px rows with a 24/32 px density setting, every target still at least 24 px.
- **HPLX small icon (accepted):** an optical redraw of Ember for 16, 24, 32 and 48 px, where the faithful mark's upper arc vanishes: the same composition, drawn on whole pixels with thicker arcs (their top edges as shallow as the master's) and a larger diamond, from `kits/hplx/assets/ember-small.source.json`. `hplx-ember.ico` and `.icns` use it up to 48 px; the Cosmik icons are unchanged.
- **HPLX lockup (accepted):** Ember centred above HPLX in Spectral SemiBold, the lettering the owner chose, set as outlines from the bundled font with its own advances and kerning plus tracking. `scripts/build-hplx-lockup.mjs` builds primary (the banner, on the dark plate), amber, bone and ink SVGs at 2172 × 724 with full-size and 1024 px PNGs from `kits/hplx/assets/hplx-lockup.source.json`. `scripts/font-outlines.mjs` reads the font; it adds no dependency.
- **Vector lockup (accepted):** the horizontal banner as vectors. `scripts/trace-cosmik-lockup.mjs` outlines the COSMIK wordmark from the approved banner (which stays unchanged) and places the accepted emblem master where the banner shows it; `scripts/build-cosmik-lockup.mjs` builds off-white, ink and primary SVGs at the banner's 2172 × 724 composition with full-size and 1024 px PNGs. The wordmark overlaps the banner by 99.1%; the master emblem differs slightly from the banner's own drawing (93.6%). Evidence is in `kits/cosmik/validation/lockup-qa.json` and `lockup-trace-overlay.png`.

## 0.3.0 · 8 October 2026

- **HPLX Ember symbol:** added the owner's selected original Ember (diamond above two shallow arcs), faithfully reconstructed as clean vector geometry. SVG variants, transparent PNGs and square platform-icon derivatives rebuild from `kits/hplx/assets/ember.source.json`; the manifest exposes HPLX-specific entry points. No wordmark or splash artwork was invented, no consuming product was changed, and all HPLX theme values remain proposed.
- **Theme inheritance:** family CSS now follows the nearest explicit theme, including a dark family inside a light ancestor, using `light-dark()` and the inherited colour scheme.
- **Component reference:** compare the baseline and proposed HPLX family in the same specimen. Headings consume type roles; tabs, story actions, confirmation dialogs, status hues and elevation examples are interactive. Narrow layouts reflow at 200% root text size.
- **Verification:** headless Chromium checks cover both kits and the new interactions. Font licence notices are hashed immutable inputs; regression checks reject missing or changed notices, including during generated-hash refreshes.

- **Baseline approved (owner, 2026-10-07):** typography, the semantic dark/light roles, layout and component rules. It stays monochrome, as the guide says (§5, §7): the status hues, the shadow role and the elevation levels proposed earlier in this release moved to the HPLX family; the `scrim` role stays.
- **Family kits:** product families get their own style on top of the baseline. `scripts/generate-tokens.mjs` merges `tokens/<id>/family.json` over the baseline and refuses a family that breaks the contract (every baseline role and mode kept; colours through its own primitives; its own typeface only for heading roles; utility type, spacing, layout, radii, breakpoints and motion fixed). Each family gets the same outputs as the baseline, its CSS scoped to `[data-family="<id>"]`. The validator checks every kit against the baseline's pairs, plus pairs for a family's own roles.
- **HPLX family (proposed):** `kits/hplx/tokens/`: warm blacks and bone text, a lantern-amber accent, Spectral 600 headings, the status tones `status-{error,warning,success,info}-{fg,bg,border}`, `accent`, `shadow` and elevation levels 1–3. 50 roles per mode; 184 contrast pairs pass.
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
- **Docs:** `kits/cosmik/validation/vector-README.txt` names files that exist; the README explains how to pin and consume the kit, including from Rust.

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
