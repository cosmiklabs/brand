# Reference validation

This is the current evidence record for the shared component reference and the
controls layer. Kit checks establish their tested properties; they do not certify
a consuming product or replace its interaction journeys. Product families keep
their own validation records in their repositories.

## 0.13.0 review — 25 October 2026

Glass variants. Run on macOS with Node.js 24.22.0 and headless Chrome for Testing
156.0.8078.4 (software compositing, `--disable-gpu`):

- `npm run build`, `npm run check` (130 baseline contrast pairs including 16 glass
  pairs; 87 tests) and `node scripts/build.mjs --check` from the release commit pass.
- Token check, glass over any of 4,913 backdrops (weakest backdrop in brackets):
  dark text 10.74:1, `glass-muted` 4.65:1 (white), boundary 3.07:1 (a dull green
  mid-tone); light text 14.45:1, `glass-muted` 4.82:1 (black), boundary 3.18:1 (a
  saturated pink). Focus and selection over glass are 10.7:1 or more. The solid
  fallback: `glass-muted` / `surface` 7.43:1 dark and 7.01:1 light.
- Browser check, measured from screenshot pixels over 14 backdrops per theme
  (white, black, mid grey, four saturated mid-tones, pure red and blue, the two
  weakest boundary mid-tones from the token check, 1 px stripes, a 2 px checker
  and coloured stripes). Worst pixel in each theme: dark text 10.74:1, muted
  4.65:1 (over white), boundary 3.08:1; light text 14.45:1, muted 4.82:1 (over
  black), boundary 3.18:1. The sampled composites match the token model to two
  decimals, which confirms straight-alpha sRGB compositing; over 1 px stripes the
  composite's luminance varies by less than 0.02, so the blur is real.
- Fallbacks, each asserted on every glass control in both themes: a copy of the
  layer with its `@supports` condition made false paints `surface` with no
  backdrop filter; so does emulated `prefers-reduced-transparency: reduce` and
  `data-glass="solid"`; `data-glass="flat"` keeps the tint without the filter;
  forced colours give an opaque fill, a solid boundary and no filter. Under touch
  emulation a tapped glass button keeps `:hover` but returns to its tint.
- Rendered inspection: the glass row in both themes at 1280 px, the probe grids,
  reduced transparency and forced colours. Controls read clearly over every band;
  the dark hairline is visibly brighter than the solid toolbar border, which is
  what holds the boundary over mid-tones. No issue found.
- Not covered: GPU compositing (the check runs in software), other engines, the
  frame cost of the blur over moving content (a product measurement) and real
  photographs or 3D scenes, which the product must review in place.

## 0.12.2 review — 25 October 2026

Hover gated on `(hover: hover)`. Run on macOS with Node.js 24.22.0 and headless
Google Chrome 155.0.8059.86:

- `npm run build`, `npm run check` (all contrast pairs, 79 tests) and
  `node scripts/build.mjs --check` from the release commit pass.
- `npm run check:browser` passes with the new tap assertions; with 0.12.1's
  controls layer restored it fails at "no hover fill persists on a tapped quiet
  button". The desktop forced-hover assertions still pass, so a hovering pointer
  keeps every hover treatment.

## 0.12.1 review — 25 October 2026

The segmented control and toolbar reflow fix. Run on macOS with Node.js 24.22.0 and
headless Google Chrome 155.0.8059.86:

- `npm run build`, `npm run check` (all contrast pairs, 79 tests) and
  `node scripts/build.mjs --check` from the release commit pass.
- `npm run check:browser` passes with the new shrink-wrapped assertion; with
  0.12.0's `minmax(0, 1fr)` tracks restored, that assertion fails, and with
  `minmax(max-content, 1fr)` the 390 px, 200 % text page overflows by 51 px.
- Rendered inspection: the toolbar row at 1280 px in both themes and at 320 px with
  200 % text, where the combined toolbar wraps its action under the segmented
  control and labels wrap inside their options (the reference page's
  `overflow-wrap: anywhere` breaks words at that size). No overflow remains.

## 0.12.0 review — 25 October 2026

Toolbars, quiet and icon buttons, toggles and the segmented control. Run on macOS
with Node.js 24.22.0 and headless Google Chrome 155.0.8059.86:

- `npm run build`, then `node scripts/build.mjs --check` from the release commit:
  no token, mark or font output changed; manifest verification passes for 75
  hashed files and 20 entry points.
- `npm run check`: all baseline contrast pairs pass and all 79 tests pass.
- `npm run check:browser` passes, with new assertions in both themes: the toolbar
  has a solid border in the `border` role on the `surface` role with `space-base`
  padding and gaps; dense icon buttons are 32 × 32 px; a quiet button has no fill
  until hover, then the secondary hover and active roles, and no transform when
  pressed; a pressed toggle and a checked option keep the selected roles under
  forced hover and pressed and draw a solid bar; segmented options share one
  width and the group width is unchanged after the arrow keys move the
  selection; the checked option takes the focus ring. Under touch emulation icon
  buttons and options are at least 44 × 44 px. In forced colours the toolbar
  border and both selection bars stay solid.
- Rendered inspection: the dark and light toolbar rows at 1280 px and the
  forced-colour toolbar row. The selected option and pressed toggle read as
  selected through the inverted fill and the bar; in forced colours the bar and a
  highlight border remain. No visual issue was found.

## 0.11.0 review — 24 October 2026

The dense status label. Run on macOS with Node.js 24.22.0 and headless Google
Chrome 155.0.8059.86:

- `npm run build`, then `node scripts/build.mjs --check` from the release commit:
  no token, mark or font output changed; manifest verification passes for 75
  hashed files and 20 entry points.
- `npm run check`: all baseline contrast pairs pass and all 79 tests pass.
- `npm run check:browser` passes, with new assertions in both themes: the dense
  status label uses the `ui-small` size and line height with the standard label's
  family, weight and tracking, is a pill with the default cursor, is not
  focusable, has no transition, keeps its status roles under forced hover and
  pressed, has tighter padding than the standard label and a `space-6` minimum
  height below `control-dense`; it keeps that size under touch emulation and takes
  the same forced colours as the standard label.
- Rendered inspection: the dark and light actions panels at 1280 px and the
  forced-colour actions panel. The dense label reads as a smaller version of the
  standard pill beside the dense button, with its symbol and words aligned; in
  forced colours its boundary stays visible. No visual issue was found.

## 0.10.0 review — 24 October 2026

Controls refinements: the status label, dense fields and the large button. Run on
macOS with Node.js 24.22.0 and headless Google Chrome 155.0.8059.86:

- `npm run build`, then `node scripts/build.mjs --check` from the release commit:
  no token, mark or font output changed; manifest verification passes for 75
  hashed files and 20 entry points.
- `npm run check`: all baseline contrast pairs pass (weakest text 4.64:1, weakest
  boundary 3.629:1; `status-fg` on `status-bg` and `status-border` are among them)
  and all 79 tests pass.
- `npm run check:browser` passes, with new assertions in both themes: the status
  label (in a card and beside buttons) uses the `label` family and uppercase, is a
  pill while the button, chip and field are not, has the default cursor, is not
  focusable, has no transition and keeps its status roles under forced hover and
  pressed; dense fields are 32 px with the `ui` size on a fine pointer and at least
  44 px with the `body` size under touch emulation at 200% text; the large button
  is at least `control-min` + 3 × `space-base` and taller than the standard one.
- Rendered inspection: the dark and light actions panels at 1280 px, both field
  panels, the 320 px / 200% text layout and the forced-colour panel. The status
  label reads as uppercase monospace metadata in a pill, clearly unlike the
  rectangular buttons beside it; the dense select's chevron sits inside its
  clearance; the large button stands out without changing the label size. No
  visual issue was found after spacing the specimen's dense-field row.

## 0.9.0 review — 24 October 2026

A tooling release: no token, mark, font, controls or specimen bytes changed, so the
0.8.0 rendered inspection below still describes the reference. Run on macOS with
Node.js 24.22.0 and headless Google Chrome 155.0.8059.86:

- `npm run build`, then `node scripts/build.mjs --check` from the release commit:
  baseline outputs are unchanged; manifest verification passes for 75 hashed files,
  20 entry points and the 36-file distribution.
- `npm run check`: all 114 baseline contrast pairs pass (weakest text 4.64:1,
  weakest boundary 3.629:1) and all 79 tests pass, including syncing a fictional
  product brand that vendors this release, both-layer verification, nested
  tampering, a lockfileVersion 1 lock and `--release` on both manifest shapes.
- `npm run check:browser`: every component, controls, motion and direct `file:`
  check passes as in 0.8.0. Screenshots were not re-inspected.

## 0.8.0 review — 24 October 2026

Prepared on branch `foundation-only` from `main` (6bf3c86), on macOS with
Node.js 24.22.0 and headless Google Chrome 155.0.8059.86. Commands:

```sh
npm run build
npm run check
BRAND_BROWSER="/path/to/chromium" BRAND_SCREENSHOTS=.local/review npm run check:browser
```

### Automated checks

- Baseline generation is byte-identical to 0.7.0; no token, mark or font bytes
  changed. Manifest verification passes for 75 hashed files and 20 entry points.
- All 114 baseline contrast pairs pass (weakest text 4.64:1, weakest boundary
  3.629:1). The test-only family fixture passes its 120 pairs through `family.mjs check`.
- All 72 regression tests pass, including the family contract (each forbidden
  override, `extends` mismatch, drift, missing output and contrast failure),
  vendored-path resolution, and vendoring (tamper, extra and missing files, a
  forged lock against its release, and refusal off a release tag or on a dirty tree).
- The component reference passes in dark and light themes at 1280, 768, 390 and
  320 CSS px with 100% and 200% root text. A fictional family scope, served from
  memory, is checked for nested theme precedence, elevation and controls picking
  up family roles.
- The controls layer is checked in both themes by forcing hover, active and
  focus-visible states and comparing computed values with the semantic roles:
  primary and secondary buttons, disabled buttons under hover, links, text fields
  (hover, invalid, disabled), the select chevron (stroke, colour, 16 px inset,
  `pointer-events: none`, clicks reaching the native select), chips (selection
  check, keyboard toggling, hover keeping selection), the status label, target
  sizes on fine and coarse pointers, transition tokens and forced-colour borders,
  chevron, check and focus ring.
- Existing keyboard, menu, dialog, motion, tooltip, disclosure, completion, font
  loading and direct `file:` opening checks pass unchanged.

### Rendered inspection

Inspected desktop captures of both themes, the dark and light field panels with
focus on a text field, the select chevron, chips and status label, menus and
confirmations, the 320 px / 200% text layout and the forced-colour panel. The
controls read as the previous specimen styles did; the chevron, chip check and
focus ring remain visible in forced colours. No visual issue was found.

### Still manual or product-specific

- Actual 200%/400% browser zoom. Root text resizing and a 320 CSS-pixel viewport
  test different things; they are not substitutes for browser zoom.
- Other browser engines, operating systems, actual touch devices, screen readers
  and native system high-contrast settings. CI was not executed in this local review.
- Real application portals, navigation, network work, loading failures and focus
  fallbacks. The specimen intentionally changes no product data.
- Each product family's own screens, in its repository.

## 0.7.0 review — 23 October 2026

This review covered the HPLX and Tectra kits while they still lived here; their
family-specific evidence now belongs to `cosmiklabs/brand-hplx` and `cosmiklabs/brand-tectra`.

Reviewed the changes on `codex/brand-system-overhaul`, based on release `v0.6.0`,
then repeated the build, repository and browser checks with 0.7.0 release metadata.
Tests ran on macOS with Node.js 24.22.0 and headless Chrome for Testing
156.0.8078.4. The recorded commands were:

```sh
npm run build
npm run check
BRAND_BROWSER="/path/to/chromium" BRAND_SCREENSHOTS=.local/review npm run check:browser
```

The browser executable is supplied by the reviewer; there is no downloaded test
browser or package dependency in the kit. Review captures are local and ignored.
The browser harness also verifies direct `file:` opening, so the distributed
reference does not require a server.

### Automated checks

- Generation and manifest verification pass, including immutable originals,
  fonts and notices, complete distribution inventories, portable paths and image
  metadata. Approved artwork and font bytes remain unchanged. The Tectra lockup's
  manifest dimensions were corrected to agree with its existing SVG.
- All 426 defined contrast pairs pass: 114 baseline, 192 HPLX and 120 Tectra.
  The weakest tested text pair is 4.64:1; the weakest essential boundary is
  3.517:1. These are the defined pairs, not a claim about arbitrary backgrounds.
- All 58 regression tests pass, covering generated exports, malformed token inputs,
  no partial output on validation failure, manifest corruption, protected hash refreshes,
  staged/untracked reproducibility failures and malformed SVG/PNG input.
- The component reference passes all three kits in dark and light themes at
  1280, 768, 390 and 320 CSS px, with 100% and 200% root text size. Nested family
  and theme precedence and every bundled font face are checked.
- Keyboard checks cover tabs, menu arrows/Home/End/typeahead/Escape, all three
  confirmation actions, safe initial focus, modal background blocking, visible
  return targets, field errors and checkbox activation.
- Motion checks exercise actual surface transitions: retained exit content,
  immediate inert state, rapid reopening, coordinated dialog/scrim completion,
  infinite child animation exclusion, preference changes during exit and
  synchronous zero-duration cleanup. System, explicit and nested motion scopes
  are checked against computed behavior. Disclosure focus, tooltip dismissal and
  finite completion feedback are exercised.
- A 320 × 480 CSS-pixel touch-emulated viewport at 200% root text checks menu and
  dialog bounds and action reachability. Long confirmations initially focus their
  heading so opening does not skip the question; Tab reaches the safe action.
- The Tectra board passes the same four widths and two text sizes, each with and
  without user text-spacing overrides. Target dimensions, skip-link focus and
  forced-colour rendering are checked.

### Rendered inspection

Inspected captured desktop components, menus and confirmations across the three
families and both themes, the Tectra motion examples, narrow enlarged-text menus
and dialog actions, and forced-colour Tectra examples. Reviewed hierarchy, surface
boundaries, typography, wrapping and visible focus. This review led to bounded
menus, more usable short-screen dialog padding and actions, and initial focus on
long confirmation context. Exit/interruption behavior was checked in the running
browser in addition to screenshots. The release verification also inspected fresh
captures of Tectra desktop components, a light-theme menu, motion examples, short
enlarged-text menus and dialog actions, Cosmik light components, an HPLX dark
confirmation and the forced-colour Tectra board; no new visual issue was found.

### Still manual or product-specific

- Actual 200%/400% browser zoom. Root text resizing and a 320 CSS-pixel viewport
  test different things; they are not substitutes for browser zoom.
- Other browser engines, operating systems, actual touch devices, screen readers
  and native system high-contrast settings. CI includes Node 22/24 on Linux and
  Node 24 on Windows, but those remote jobs were not executed in this local review.
- Real application portals, navigation, network work, loading failures and focus
  fallbacks when route changes remove the entire owning surface. The specimen
  intentionally changes no product data.
- Print-process proofs, document rendering in installed office software and the
  remaining optical/platform asset gaps recorded in the manifest.

## Earlier evidence

The 7 October baseline/HPLX component run was recorded in Chrome and Edge on
Windows. The 17 October Tectra source review added browser coverage but could not
execute it in that environment; the 0.7.0 run superseded that blocker. The
historical Tectra review moved with the Tectra kit to `cosmiklabs/brand-tectra`.
Approval status belongs in the manifest and family guides.

The quality acceptance process is in [guide/quality.md](../guide/quality.md), and
behavior requirements are in [interface](../guide/interface.md) and
[motion](../guide/motion.md).
