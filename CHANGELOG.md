# Changes

Versions follow semver; release tags are `vX.Y.Z`. Newest first. Family kits carry
their own version in `family.json`; from 0.8.0 they live in their own repositories.

## 0.16.1 · 26 October 2026

Licensing names COSMIK LABS, LLC. No token, mark, font or control changes; the
baseline token version stays **0.11.0**, so families' `extends` is unchanged.

- **Licence.** `LICENSE.md` no longer says Cosmik is not a company or other legal
  entity. COSMIK LABS, LLC holds the copyright in this repository's own material
  and the Cosmik marks; the MIT notice reads "Copyright (c) 2026 COSMIK LABS, LLC",
  and the brand-use policy names COSMIK LABS, LLC where it named the owner of
  Cosmik Labs. Sections, grants and permissions are otherwise unchanged. Fonts keep
  their own OFL notices. The change applies from this release; earlier tags keep
  the terms they were published with.
- **Guide.** The identity guide's names table adds COSMIK LABS, LLC as the legal
  name for notices, and the identity and voice guides drop "not a company" while
  keeping "never imply a larger team". The voice guide now asks not to write like
  a press release.

## 0.16.0 · 26 October 2026

Glass keeps the theme's tone. Choosing a tone from the content behind each surface
made viewport controls flip between light and dark as a colourful scene moved
under them, which read as jarring and scripted. Glass now stays dark in the dark
theme and light in the light theme over anything, and gets its legibility from
filtering the backdrop instead. Not breaking for markup; the baseline token
version moves to **0.11.0**, so families update `extends` and re-check their glass
tints against the new contract.

- **Backdrop filter per tone.** After the shared blur and `saturate(1.4)`, each
  tone applies `contrast()` then `brightness()`: dark glass `contrast(0.75)
  brightness(0.5)` dims the backdrop and lowers its contrast; light glass
  `contrast(0.5) brightness(1.35)` lowers its contrast and brightens it, mapping
  black to a light grey and leaving white just short of clipping. New tokens
  `glass.dark` and `glass.light` (`contrast`, `brightness`), published as
  `--c-glass-contrast` and `--c-glass-brightness` in each mode's block, so they
  follow the theme and `data-glass-tone` like the colour roles. Baseline-only.
- **Lighter tints.** With the filter doing the work, the tint drops from 60 % to
  31 % on the dark tone (`#12121250`) and to 56 % on the light tone (`#FFFFFF8F`),
  the most translucent values that pass over any backdrop with a small margin.
  The scene keeps a 2.42:1 (dark) and 2.05:1 (light) luminance ratio between its
  brightest and darkest content behind the glass.
- **Contract: any backdrop.** Each tone's text and `glass-muted` (4.5:1), quiet
  control text including on the pressed tint (4.5:1), focus and selection (3:1),
  and the hover and pressed ramps are now checked over the full 4,913-colour grid,
  passed through the tone's filter as Chromium paints it (measured: per channel in
  sRGB, saturate clamped, then contrast, then brightness clamped), not over a
  luminance band. Worst cases: dark text 7.16:1, muted 4.67:1, pressed text
  4.67:1; light text 10.24:1, muted 4.68:1. The report adds each tone's scene
  range.
- **Removed: the tone threshold.** `glass.toneThreshold`, `glass.toneHysteresis`,
  `--c-glass-tone-threshold`, `--c-glass-tone-hysteresis` and the Rust
  `TONE_THRESHOLD` and `TONE_HYSTERESIS` are gone, with the guidance to pick a tone
  from the backdrop's luminance. Remove any per-backdrop tone switching: glass
  follows the theme, and switching by backdrop is discouraged because it flips in
  motion. `data-glass-tone` stays as an explicit override for a surface or region
  a product must force.
- **Fallbacks unchanged in kind.** No backdrop-filter, reduced transparency,
  `data-glass="solid"` and forced colours stay solid; `data-glass="flat"` now keeps
  the tone's saturate, contrast and brightness and drops only the blur, since the
  tint alone no longer holds. The edge sheen is unchanged.
- **Specimen and checks.** Each theme shows its glass over light, dark and busy
  content, plus one override stage. The browser check asserts every glass surface
  in a theme paints that theme's tint, text and filter over all three, measures
  rendered text and muted contrast for each theme over white, black, greys,
  saturated primaries, stripes and checkers (all must pass; the old
  "wrong tone must fail" probes are gone), and records how much of the scene
  shows. The no-backdrop-filter fixture now restores the real stylesheet through
  its `media` attribute; re-enabling a `disabled` link no longer reapplied it
  synchronously in Chrome for Testing 156, which failed the reduced-transparency
  check on `main`.

## 0.15.1 · 25 October 2026

Pressed no longer looks like letting go. A fix; the baseline token version moves
to **0.10.1**, so families update `extends` and re-check their action roles.

- **Pressed is a deeper hover.** `action-*-active` ran the other way from hover:
  in the dark theme the secondary role went lighter on hover and then black when
  pressed, darker than rest, and in the light theme pressed returned to paper,
  almost the rest colour; the dark primary went lighter on hover and darker when
  pressed. Now rest → hover → pressed moves one way: dark secondary
  `#121212` → `#1F1F1F` → `#2C2C2C`, light secondary white → `#E8E7E3` →
  `#D6D5D0`, dark primary paper → `#E8E7E3` → `#D6D5D0` (hover now darkens), and
  the light primary was already monotonic. This covers every control that uses
  them: buttons (primary, secondary, quiet, icon), segment options and chips.
- **Glass tints instead of swapping.** New translucent roles `glass-hover` and
  `glass-active` per tone (white 8 % and 16 % on the dark tone, black 6 % and
  12 % on the light tone). A glass button layers the tint over its fill; quiet
  buttons and segment options inside a glass surface take the tint. Selected and
  disabled states are unchanged.
- **Checks.** The token check adds `state` pairs: each rest → hover → pressed
  ramp must move one way with pressed at least 1.25:1 from rest and 1.08:1 beyond
  hover (for glass, over every backdrop in the tone's band, with quiet text at
  4.5:1 on the pressed tint). The browser check measures the rendered fill of
  every control with a pressed state, in both themes and both glass tones, and
  asserts the same. Both fail on 0.15.0's values.

## 0.15.0 · 25 October 2026

Glass loses its solid border: its edge is now a sheen of light caught by the rim.
Not breaking for markup; the baseline token version moves to **0.10.0**, so
families update `extends`.

- **Edge sheen.** Each glass surface draws a 1px gradient ring from its
  `::before`, masked to the rim (`mask-composite: exclude`), so it follows any
  border radius and never tints the fill. Light comes from the top left: brightest
  there, fading along the sides, with a fainter return at the bottom right. A
  glass select draws it on its wrapper. Surfaces are positioned with zero
  specificity; a glass container that scrolls should scroll an inner element.
- **Roles.** New `glass-sheen` and `glass-sheen-low`, translucent, per tone. Dark:
  white at 65 % fading to white at 20 %. Light: white at 95 % (a highlight that
  shows on mid-tones) fading to black at 25 %, a faint lower edge that keeps the
  shape on light content. `glass-border` is now the plain, subtle border of the
  solid fallbacks (`#414141` dark, `#C6C5C0` light).
- **Token.** `glass.sheenAngle` (160°), `--c-glass-sheen-angle`, baseline-only;
  families may tint the sheen roles.
- **Contrast contract.** A glass surface's own edge is decorative and no longer
  needs 3:1 against the content behind it. The 3:1 non-text requirement applies to
  what identifies the controls on glass: icons (the text colour), selection and
  focus, all checked over each tone's band. A standalone glass button or select
  trigger is identified by its label, icon or chevron, which meet 4.5:1, so it
  needs no boundary of its own; its focus ring keeps the solid halo.
- **Fallbacks.** Without backdrop blur, with reduced transparency or in
  `data-glass="solid"`: the solid surface with a plain `glass-border` and no
  sheen. Forced colours: no sheen, a solid system border. `data-glass="flat"`
  keeps the sheen.
- **Checks.** The panel-edge boundary assertions are gone (the edge contrast is
  still reported). The browser check asserts every glass surface has no solid
  border and a masked 1px sheen gradient matching its radius, that the sheen is
  brighter at the top left than the bottom right over every backdrop in both
  tones, the plain border in each solid fallback, and the solid system border in
  forced colours. The token check requires translucent sheen roles.

## 0.14.0 · 25 October 2026

Glass you can see through, in two tones that follow the content behind it. 0.13.0's
glass, at an 84 % tint, read as a solid surface. Not breaking for markup; the
baseline token version moves to **0.9.0**, so families update `extends` and
review their glass roles.

- **Clearer glass.** The tint drops to 60 % (`#12121299` dark, `#FFFFFF99`
  light) over a stronger backdrop: `glass.blur` 24px and `glass.saturation` 1.4.
  Hairlines are white on the dark tone and black on the light tone; `glass-muted`
  is `#C8C8C8` and `#454545`.
- **Glass tones.** Each mode is a glass tone. `data-glass-tone="dark"` or
  `"light"` on a glass surface or a region gives it and its contents that mode's
  roles (tint, hairline, text, muted, selection, hover, focus) regardless of the
  page's theme; without it, glass follows the theme as before. The token CSS
  scopes the themes to `[data-glass-tone]` as well as `[data-theme]`.
- **Tone threshold.** `glass.toneThreshold` (0.2) and `glass.toneHysteresis`
  (0.05), relative luminances, in CSS (`--c-glass-tone-threshold`,
  `--c-glass-tone-hysteresis`), JSON, DTCG and Rust. Content at or above the
  threshold takes the light tone, below it the dark tone. Baseline-only.
- **Contrast contract.** Glass now holds over the content its tone is for, not
  over any content: the dark tone over backdrops of luminance 0–0.25, the light
  tone over 0.15–1. The check reports each pair over its band, and a test proves
  that each tone fails over the other's extreme, so a product must switch.
- **Tone crossfade.** Glass surfaces transition background, border and text
  colour with the motion tokens, so a tone change crossfades and reduced motion
  snaps.
- **Reference and browser checks.** The reference shows both tones over light and
  dark busy content in both themes. The browser check measures each tone over 12–13
  backdrops in its band from screenshot pixels, asserts the wrong tone fails over
  the other extreme, and asserts a tone overrides the page theme. Fallbacks are
  unchanged and still checked.

### Migrating

Vendor 0.14.0 and set `extends` to `"Cosmik baseline 0.9.0"`. Glass over content
of varying brightness now needs `data-glass-tone` chosen from that content; see
the interface guide. Families that set their own glass roles re-check them
against the bands.

## 0.13.0 · 25 October 2026

Glass variants for controls that float over busy or moving content. Not breaking:
glass is opt-in per surface and no existing class changes. The baseline token
version moves to **0.8.0** (new roles and tokens), so families update `extends`.

- **Roles.** `glass` (a translucent tint, `#RRGGBBAA`), `glass-border` (the
  hairline) and `glass-muted` (muted text on glass), in both modes. Dark: the
  dark surface at 84 % over the backdrop, a `#C6C5C0` hairline and the usual dark
  muted grey; light: white at 84 %, a `#303030` hairline and a new `#595959`
  muted grey. A family may override them under `semantic` like any colour role.
- **Tokens.** A `glass` group: `blur` (12px) and `saturation` (1.2), in CSS
  (`--c-glass-blur`, `--c-glass-saturation`), JSON (`glass` and `native.glass`),
  DTCG and Rust (`glass::BLUR`, `glass::SATURATION`). Like spacing and motion they
  are baseline-only: the family contract now rejects a `glass` section.
- **Contrast check.** Glass roles are checked against the tint composited over
  every backdrop on a grid of 17 levels per sRGB channel (4,913 colours),
  saturated as the token says: text, `glass-muted` and `action-secondary-fg` at 4.5:1, focus and
  selection at 3:1, and a boundary at 3:1 where either the hairline or the fill
  must clear each backdrop. The solid fallback is checked against `surface`.
  Reports name the backdrop each pair is weakest over. Families get the same
  checks through `family.mjs check`.
- **Controls.** `c-glass` (a container for menus, popovers, hints and labels),
  `c-toolbar--glass`, `c-button--glass` (a standalone button, instead of
  `--secondary`, with `--icon` and `--dense`), `c-segmented--glass` and
  `c-select--glass` (the trigger). Selection stays opaque with its bar; hover and
  pressed use the action roles; a standalone glass control's focus ring sits on a
  solid halo. Inside glass, `--c-muted` resolves to `glass-muted`.
- **Fallbacks.** Solid by default and glass only under
  `@supports (backdrop-filter …)`; solid under `prefers-reduced-transparency:
  reduce`; opaque system colours with the boundary kept in forced colours.
  Regions may choose `data-glass="flat"` (tint, no blur, for where the blur is
  too costly) or `data-glass="solid"`.
- **Docs and reference.** Interface (when to use glass and when not), colour
  (the roles and how they are checked), families (the contract) and the consumer
  guide (classes and markup). The reference shows every glass control over white,
  black, saturated colours, fine stripes and a checker in both themes.
- **Browser checks** assert the glass roles, blur and selection; measure text,
  muted text and boundary contrast from screenshots over 14 worst-case backdrops
  per theme; and prove each fallback (a copy of the layer with the `@supports`
  condition made false, emulated reduced transparency, both `data-glass` values,
  forced colours) and that a tapped glass button keeps no hover fill.

### Migrating

Vendor 0.13.0, set a family's `extends` to `"Cosmik baseline 0.8.0"`, rebuild and
check. A family that overrides `surface` or `muted` heavily should review its glass
pairs in the report; override `glass`, `glass-border` or `glass-muted` only if the
baseline values do not suit its palette.

## 0.12.2 · 25 October 2026

Hover no longer sticks after a tap. Not breaking.

- **Hover treatments apply only under `(hover: hover)`.** A tap on a touch screen
  leaves the browser's `:hover` on what was tapped, so a quiet button, a segmented
  option or a chip kept its hover fill after the tap, and an unselected option
  could look half-selected beside the real selection. The hover rules of
  `c-button` (primary, secondary, quiet), `c-segmented__option`, `c-chip`,
  `c-link`, `c-input` and the select now sit in `@media (hover: hover)`. Pressed
  (`:active`) feedback, selection and disabled roles are unchanged on every input.
- **Docs.** The interface guide and the consumer guide state the rule; consumers
  should gate their own hover styles the same way.
- **Browser checks** emulate touch (which reports `hover: none`), tap a quiet icon
  button, a segmented option (then move the selection without a pointer) and a
  chip (on and off), and assert each keeps `:hover` but shows its resting
  background. The check fails on 0.12.1.

No token value, mark or font changed; the baseline token version stays 0.7.0.

## 0.12.1 · 25 October 2026

A fix to 0.12.0's toolbar controls, found in the first product to use them. Vendor
0.12.1 rather than 0.12.0.

- **`c-segmented` no longer collapses in a shrink-to-fit container.** Its tracks
  were `minmax(0, 1fr)`, so inside a `width: min-content` or wrapping container the
  options shrank to their minimum width and their labels overflowed. Tracks are now
  `minmax(min-content, 1fr)`: still equal shares of the widest option, never
  narrower than an option's content. The group takes `max-width: 100%` and labels
  wrap instead of overflowing a narrow container or enlarged text.
- **`c-toolbar` wraps** (`flex-wrap: wrap`, `max-width: 100%`) rather than
  overflowing a narrow container or enlarged text.
- **Browser checks** add a shrink-wrapped segmented control whose options must
  keep their content (it fails on 0.12.0), and the existing 320 px, 200 % text
  check now covers the toolbar row.

No token value, mark or font changed; the baseline token version stays 0.7.0.

## 0.12.0 · 25 October 2026

Toolbar controls, found missing while rebuilding a product's viewport toolbars on
the kit. Not breaking: existing markup keeps working.

- **`c-toolbar`.** A bounded group of related controls: the surface role, a
  border (so it reads over a busy canvas without a shadow; a family elevation
  shadow may add depth), the medium radius and `space-base` padding and gaps.
  `c-toolbar--vertical` stacks it. Role, name and placement are the consumer's.
- **`c-button--quiet`.** A button emphasis with no fill or boundary until hover,
  for actions inside a toolbar or other bounded group.
- **`c-button--icon`.** A square icon-only button at the button's target size,
  `control-dense` with `c-button--dense` on fine pointers and `control-min` on
  touch. It needs an accessible name and a tooltip on hover and keyboard focus.
- **Toggles.** A `c-button` with `aria-pressed="true"` takes the selected roles
  plus a drawn bar along its bottom edge; hover and pressed never erase it.
- **`c-segmented`.** One choice from a few, as a `radiogroup` of
  `c-segmented__option` radios or `aria-pressed` buttons. Every option takes the
  widest option's width, so the group never resizes when the selection changes.
  Selection uses the selected roles plus the bar. `c-segmented--dense` follows the
  dense button sizes. Options share the focus ring, disabled roles and forced
  colours.
- **Docs.** [Shared controls](kits/README.md#shared-controls) and the
  [interface guide](guide/interface.md#shared-controls) give the markup and rules,
  including the narrow-width rule for toolbars (drop labels together, keep icons,
  tooltips carry the names). The component reference shows a toolbar of icon
  buttons, a segmented control and a toolbar combining both, in both themes.
- **Browser checks** assert, in both themes, the toolbar's border, surface and
  spacing; square 32 px dense icon buttons; quiet buttons with no fill until hover;
  no transform when pressed; pressed toggles and checked options in the selected
  roles under hover and pressed, with the drawn bar; equal option widths and an
  unchanged group width after arrow keys move the selection; the segmented focus
  ring; at least 44 px targets under touch emulation; and the toolbar boundary
  and selection bars in forced colours.

No token value, mark or font changed; the baseline token version stays 0.7.0.

### Migration

- Re-sync. Replace local toolbar surfaces, icon buttons and segmented groups with
  `c-toolbar`, `c-button c-button--quiet c-button--icon` and `c-segmented`. Remove
  any pressed-state scaling: the rules allow colour changes only.

## 0.11.0 · 24 October 2026

A dense status label for compact contexts. Not breaking: `c-status` is unchanged.

- **`c-status--dense`.** Add it to a `c-status` label inside a dense row, header or
  card. It keeps the pill shape, the neutral status roles and the `label` family,
  weight, tracking and uppercase, at the `ui-small` size and line height with
  tighter padding (`0` / `space-2`), a `space-base` gap and a `space-6` minimum
  height. A label is not a target, so it keeps that size on touch. Like `c-status`
  it has no hover, pressed, focus, transition or pointer cursor, and in forced
  colours it takes the text colours.
- **Docs.** [Shared controls](kits/README.md#shared-controls) and the
  [interface guide](guide/interface.md#shared-controls) describe when to use it.
  The component reference shows it beside the dense button and the standard
  status label in both themes.
- **Browser checks** assert, in both themes, the `ui-small` size and line height,
  the same family, weight and tracking as the standard label, the pill, default
  cursor, no focusability or transition, unchanged roles under forced hover and
  pressed, tighter padding, the `space-6` minimum height below `control-dense`,
  the same size under touch emulation and the same forced colours as `c-status`.

No token value, mark or font changed; the baseline token version stays 0.7.0.

### Migration

- Re-sync. Replace local compact status pills (smaller font, tighter padding) with
  `c-status c-status--dense`.

## 0.10.0 · 24 October 2026

Three refinements to the shared controls, found by using them on real pages. Not
breaking: existing markup keeps working; `c-status` changes appearance.

- **`c-status` reads as a label, not a button.** It now uses the `label` type role
  (IBM Plex Mono, its tracking and its uppercase transform), the full radius, which
  no control uses, the neutral status roles and `cursor: default`. It has no hover,
  pressed, focus or transition. In forced colours it takes the text colours
  (`CanvasText` on `Canvas`) instead of `ButtonText`.
- **`c-select--dense` and `c-input--dense`.** Put `c-select--dense` on the select
  wrapper or `c-input--dense` on an input: `control-dense` and the `ui` type role on
  fine pointers, with the chevron and its clearance scaled to match; on coarse
  pointers they return to `control-min` and the `body` type, so focusing one never
  zooms a mobile page.
- **`c-button--large`.** A taller target (`control-min` + 3 × `space-base`, 56 px at
  the baseline) and wider padding (`space-4` / `space-8`) for a page's prominent
  call to action. The type scale has no larger control step, so the label keeps the
  `control` role. A mechanism only; no product default.
- **Docs.** [Shared controls](kits/README.md#shared-controls) and the
  [interface guide](guide/interface.md#shared-controls) describe the new sizes and
  the status label's rules. The component reference shows large, standard and
  dense buttons beside a status label, and dense fields, in both themes.
- **Browser checks** assert the status label's label type, pill shape against the
  button, chip and field radii, default cursor, no focusability, no transition and
  unchanged roles under forced hover and pressed; dense fields at 32 px with the
  `ui` size on a fine pointer and at least 44 px with the `body` size under touch
  emulation; and the large button's target.

No token value, mark or font changed; the baseline token version stays 0.7.0.

### Migration

- Re-sync. Pages that styled `c-status` locally (font, radius, padding) can drop
  those overrides. A status label inside a link or button should move out of it.
- Use `c-select c-select--dense` for compact selects (footers, toolbars) and
  `c-button--large` where a product wants a ceremonious call to action.

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
