# Reference validation

This is the current evidence record for the shared component reference and the
controls layer. Kit checks establish their tested properties; they do not certify
a consuming product or replace its interaction journeys. Product families keep
their own validation records in their repositories.


## 0.16.0 review — 26 October 2026

Glass follows the theme, legible through a per-tone backdrop filter. Run on macOS
with Node.js 24.22.0 and headless Chrome for Testing 156.0.8078.4 (software
compositing, `--disable-gpu`):

- Filter model measured before the contract was written: solid backdrops behind
  `saturate(1.4) contrast(0.75) brightness(0.5)` and `saturate(1.4) contrast(0.5)
  brightness(1.35)` (16 colours each, including the saturated primaries) render
  exactly as per-channel sRGB with the saturate result clamped, then contrast,
  then brightness clamped. The token check uses that model; a unit test pins one
  measured value.
- `npm run build` and `npm run check` (104 tests) pass. Worst cases over all 4,913
  backdrops through the filter: dark text 7.16:1, `glass-muted` 4.67:1, quiet text
  on the pressed tint 4.67:1, focus and selection 7.16:1, pressed / rest 1.53:1;
  light text 10.24:1, `glass-muted` 4.68:1, pressed text 7.93:1, focus and selection
  10.24:1, pressed / rest 1.29:1. Scene kept: dark filtered backdrop luminance
  0.005–0.161, composite 0.006–0.084 (2.42:1); light filtered 0.093–1.000,
  composite 0.462–1.000 (2.05:1).
- `npm run check:browser` passes. Every glass surface in each theme's section
  (dark, light and busy content stages) computes the theme's tint, text and
  filter; the override stage computes the other tone's. Rendered probes, each
  theme over 17 backdrops spanning white to black, saturated primaries, stripes and
  checkers: dark text 7.05–17.3:1, muted 4.60–11.29:1 (worst over white); light
  text 10.24–21:1, muted 4.68–9.59:1 (worst over black). Composite luminance over
  white / black content: dark 0.0865 / 0.0056 (2.46:1), light 1.0 / 0.462
  (2.05:1). Glass pressed ramps 1.50–1.67:1 (dark) and 1.32:1 (light). Solid
  fallbacks (no backdrop-filter, reduced transparency, `data-glass="solid"`) and
  forced colours unchanged; `data-glass="flat"` keeps the tint and the tone's
  filter without blur.
- On `main` before this change the browser check failed at the
  reduced-transparency fallback in this Chrome: re-enabling the `disabled`
  controls stylesheet after the no-backdrop fixture did not reapply it in time.
  The fixture now toggles the link's `media`; the check passes.
- Rendered inspection of the specimen in both themes and the probe sheets: the
  content's colours and stripes visibly show through both tones; text, muted text,
  icons and selection read clearly over light, dark and busy content; the tone
  never changes within a theme.

## HTML reference review — 26 October 2026 (unreleased)

This review covers the generated HTML guide, not a new token release or identity approval. Kit version remains 0.15.1; baseline token version remains 0.10.1. Markdown guidance and approved masters remain authoritative.

- `npm run build` completed; `npm run check` passed 99 tests and the existing token/manifest checks. Seven new reference tests cover all current guide chapters, heading anchors, local links and downloads, escaped and nested Markdown, all 157 exported CSS token names, both color modes, deterministic output, publishing boundaries and the project-path 404 base.
- Live in-app browser checks covered seven representative pages (overview, identity, typography, color, integration, assets and tokens), in light and dark modes at 1440, 768, 390 and 320 CSS pixels: 56 combinations, with no horizontal page overflow, loaded images and one page heading each. Narrow navigation started collapsed and was opened and used.
- Interaction review exercised guide search and its results, Escape clearing, theme selection, a single-token filter, the empty-result state and restoring all 157 token rows. Desktop and mobile compositions and the live color panels were visually inspected. The browser console was checked for warnings and errors.
- The repository's `npm run check:browser` was attempted with both installed Chrome and Chrome for Testing binaries. Each process exited before opening its debugging port, without diagnostic browser output. The new automated reference cases are written into that runner, but **did not execute** locally. The existing component suite likewise did not complete in that runner during this review.
- Direct-file navigation is blocked by the in-app browser's URL policy (HTTP/HTTPS only), so offline browser behavior was not independently exercised. No-JavaScript runtime behavior, full browser zoom, forced-color rendering of the new guide, assistive technologies and other browser engines remain unverified. Static and generation checks confirm that reading content, normal links and native navigation are present without enhancement; they do not replace those runtime checks.
- No GitHub Pages deployment was run. The Pages workflow and the generated publish directory are prepared; the repository must use GitHub Actions as its Pages source. Publishing the guide does not create a new immutable kit release.


## 0.15.1 review — 25 October 2026

Interaction-state ramps. Run on macOS with Node.js 24.22.0 and headless Chrome for
Testing 156.0.8078.4:

- `npm run build`, `npm run check` and `node scripts/build.mjs --check` from the
  release commit pass, with the new `state` pairs.
- Browser check, rendered fill sampled in each control's padding at rest, hover
  and pressed (relative luminance; pressed / rest, pressed / hover): opaque
  controls 1.34:1 and 1.18:1 (dark primary 0.91 → 0.80 → 0.66; dark secondary,
  quiet, segment option and chip 0.006 → 0.014 → 0.025), light 1.47:1 and 1.19:1
  (secondary family) and 1.27:1 and 1.14:1 (primary). Glass: dark tone 1.54–1.68:1
  and 1.30–1.32:1, light tone 1.31–1.32:1 and 1.16:1, in both page themes.
- With 0.15.0's action values restored, `npm run check` fails six `state` pairs
  and the browser check fails at the dark primary button ("must move one way").
- Rendered inspection of the rest, hover and pressed crops of every control in
  both themes and tones: pressed reads as a deeper hover throughout.

## 0.15.0 review — 25 October 2026

The edge sheen. Run on macOS with Node.js 24.22.0 and headless Chrome for Testing
156.0.8078.4 (software compositing, `--disable-gpu`):

- `npm run build`, `npm run check` (126 baseline contrast pairs, 91 tests) and
  `node scripts/build.mjs --check` from the release commit pass. Text, muted text,
  focus and selection over each tone's band are unchanged from 0.14.0.
- Browser check: every glass surface has a transparent border and a `::before`
  ring (160° gradient, 1px, masked, radius matching its host). Measured sheen
  luminance, top-left edge against bottom-right edge, over every probe backdrop:
  dark tone 0.35–0.58 top against 0.04–0.26 bottom; light tone 0.90–0.99 top
  against 0.18–0.56 bottom. The panel edge's contrast with the content outside is
  reported and now ranges down to 1.0:1 (light tone over white), as intended for a
  decorative edge. Solid fallbacks show the plain `glass-border` with no sheen;
  forced colours show a solid system border and no sheen.
- Rendered inspection, including 2× crops of a toolbar in each tone: the dark
  tone's rim brightens at the top left and fades along the top and sides; the light
  tone reads by its faint darker lower and right edges on light content, with the
  white highlight showing over mid-tones. Text and selection stay clear.

## 0.14.0 review — 25 October 2026

Clearer glass in two tones. Run on macOS with Node.js 24.22.0 and headless Chrome
for Testing 156.0.8078.4 (software compositing, `--disable-gpu`):

- `npm run build`, `npm run check` (130 baseline contrast pairs including 16 glass
  pairs; 90 tests) and `node scripts/build.mjs --check` from the release commit pass.
- Token check, each tone over its band of the 4,913-colour grid (weakest backdrop
  in brackets): dark tone over luminance 0–0.25: text 8.64:1, `glass-muted` 5.64:1
  (`#009F00`), boundary 3.48:1 (`#6080FF`); light tone over 0.15–1: text 10.27:1,
  `glass-muted` 4.69:1 (`#DF0000`), boundary 4.00:1 (`#AF30BF`). Solid fallback:
  `glass-muted` / `surface` 11.20:1 dark and 9.59:1 light. Wrong tones fail: dark
  `glass-muted` over white 2.92:1, light `glass-muted` over black 3.37:1.
- Browser check, measured from screenshot pixels, 12 (dark) and 13 (light) in-band backdrops
  (band edges, saturated colours, the token check's weakest colours, stripes, a
  checker and coloured stripes). Worst pixel: dark tone text 8.64:1, muted 5.64:1,
  boundary 3.48:1; light tone text 10.27:1, muted 4.69:1, boundary 4.00:1. The
  wrong tone fails as asserted (dark over white: text 4.47:1, muted 2.92:1; light
  over black: muted 3.37:1). A tone overrides the page theme for glass, text,
  selection and `color-scheme`. Fallbacks as in 0.13.0 pass.
- One browser run failed early and was not captured; four further runs, with and
  without screenshots, passed. Treat it as a possible intermittent failure.
- Rendered inspection: both tones over light and dark content in both themes and
  the probe grids. The content visibly shows through the glass (colour bands read
  through the toolbar and hint), and text, muted text, selection and hairlines stay
  clear. No issue found.

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


## Reference header alignment — 2026-10-26

The shared reference header now has an 88 px minimum desktop height and a 72 px minimum mobile height. Logos retain their proportions and remain vertically centered. At widths of 380 px and below, the visible Theme label is hidden while the select retains its accessible name, keeping the header on one row. Live local browser measurements confirmed identical heights across Cosmik, HPLX and Tectra at 1280, 390 and 320 px with no horizontal overflow. All 164 repository tests passed before the final narrow-screen label adjustment; that adjustment was checked in the live browser.


## Reference navigation consistency — 2026-10-26

Shared presentation now defines sidebar labels and section ordering, search prompts, homepage actions and component examples. Brand-specific chapters and assets remain separate. Cosmik’s component page retains the guide navigation and links to its full interactive specimen with a return link. A selected theme is stored locally and reused across guide pages on the same host. Storage failures fall back to page-local selection.

Local review covered 54 page/theme/viewport combinations across the three guides at 1280, 390 and 320 px, with no overflow, broken images or missing active navigation. Form reset, search, mobile navigation and the interactive-specimen return path were exercised. Theme selection persisted between sites. Local repository checks passed 100 Cosmik, 31 HPLX and 36 Tectra tests. CI runs the full browser suite, including 64 reference layout cases and theme retention.


## Identity surface previews — 2026-10-26

The Cosmik identity reference now displays approved off-white artwork on a dark surface and approved ink artwork on a light surface, each with its own SVG download. Both retain the supplied canvas and proportions; at narrow widths, both previews use their matching approved emblem variants. No identity assets or token values changed.

Validation: all 100 repository tests passed. Live local review confirmed both previews load in light and dark page themes at 1280, 390 and 320 px, with no horizontal overflow and the correct narrow-screen emblem variants.

## 2026-10-26 — Reference-site consistency review

- Added searchable product Guide indexes, using the same Start here navigation position and chapter labels as Cosmik.
- Aligned the shared header identity slot and divider, and scaled product lockups proportionally to match the apparent size of the Cosmik header identity.
- Added original off-white and ink artwork previews to the Cosmik Overview, in paired dark/light surface cards.
- Built and checked all three repositories: 104 Cosmik, 31 HPLX and 36 Tectra tests passed.
- Inspected local desktop renders of all three overviews and the product index; checked all overviews at 1280, 390 and 320 px in light/dark themes: no horizontal overflow or broken images, 88 px desktop and 72 px mobile headers, matching desktop divider position. Product indexes also passed the same width/theme checks. Exercised HPLX index search and identity/index navigation.
- Approved identity sources, family tokens and vendored foundations were not changed. This is reference-site review evidence, not accessibility certification.

- The browser suite passed locally, including 64 reference page/theme/width cases. The first Pages CI attempt timed out before Chrome opened its debugging port; increased only the bounded startup allowance from 10 to 30 seconds.

## 2026-10-26 — Shared presentation and artwork audit

This supersedes the earlier header sizing pass. Container dimensions alone did not establish consistent visible identities.

- Compared approved SVG canvases and visible bounds. Header symbols use their original assets in a 48 px slot, with Glimmer rendered at 36 px to compensate for its taller ink bounds. Visible symbol heights are approximately 30 px. All three names use the same Inter Medium 20 px / 26 px live interface label; full approved wordmarks remain in the artwork previews. No identity paths, fonts, token sources or vendored files changed.
- Consolidated headers, overview content structure, Guide indexes and identity surfaces into shared functions. Overview actions now open the Guide index on every site. Chapter headings follow navigation labels. Identity, Overview and Asset library pages use the same paired artwork/download cards.
- Preserved original SVG canvases and compensated for their different padding in CSS. Lockup ink/canvas width ratios are Cosmik 1336.64/2172, HPLX 178.892/192 and Tectra 178.03/195. Narrow previews use approved symbols across all three sites, with accurate captions.
- Executed local builds/checks: 104 Cosmik, 31 HPLX and 36 Tectra tests passed. Regressions cover live header labels, exclusion of undersized header lockups, common Guide index actions and both artwork surfaces on the three relevant page types.
- Executed the Chromium browser suite, including 64 reference page/theme/width cases. Separately checked 144 local browser combinations: 3 brands × 8 pages (Overview, Guide index, Identity, Assets, Tokens, Components, Typography, Color) × 3 widths (1440, 390, 320) × 2 themes. No horizontal overflow or unloaded images. All headers measured 88 px desktop / 72 px narrow; labels shared font, size, line height and x-position; desktop overview cards measured the same height.
- Inspected rendered overview, header, artwork and index comparisons, including the settled dark-theme artwork. An early capture omitted artwork during repaint; a settled capture and reload confirmed both original variants render. Screenshot timing is not counted as a site defect fixed by this change.
- Family palettes, heading faces, approved logo proportions and source-specific chapters remain distinct. These checks do not constitute accessibility certification.

## 2026-10-26 — Remove retired brand material

Removed the Historical navigation/page from the shared reference builder. Retired HPLX Ember assets, lockups, icons, builders and asset tests, plus Cosmik’s superseded guides and alternate artwork, are recoverable from Git history. Current approved assets, font notices, licence terms and pinned foundations remain unchanged. Manifest and navigation checks reject references to the retired page and HPLX distribution entries.

Executed builds and checks: 104 Cosmik, 24 current HPLX and 36 Tectra tests passed. HPLX’s seven retired-asset tests were removed with their assets; current Glimmer geometry, manifest, vendoring and navigation checks remain. Inspected the local HPLX Guide index and confirmed that neither navigation nor index contains an Archive/Historical section.


## Marketing guidance — 26 October 2026 (unreleased)

Updated company positioning, product-family marketing architecture and evidence rules.
Marks, palettes, token values and fonts are unchanged. The shared family reference
composes current product presentation from each family's README with pinned general
writing and imagery guidance. It explicitly identifies both sources, omits the
superseded organization-positioning section from that rendered page, and preserves
the immutable vendored file.

Executed `npm run build` and `npm run check`: 104 tests passed. The installed Chrome
156 browser suite passed all component checks and 64 reference page/theme/width
cases, plus search, token filtering, no-JavaScript and direct-file behavior. The
runner now waits for the selected theme's image sources to finish loading before
asserting they are healthy; previously it could test the new source immediately
after a theme change. Family-specific current-content and search-index regressions
are executed in the family repositories. This is local review work, not a published
brand release or a claim of full accessibility conformance.


## Narrow prose readability — 26 October 2026 (unreleased)

Rendered family Voice review found that page-width checks alone missed two defects:
the source category wrapped inside a compressed flex item, and minimum table-cell
widths put the last prose column outside its scrolling viewport. Shared metadata
now wraps deliberately, keeps its category on one line and stacks source links on
narrow screens. Prose tables retain semantic markup and fit the available width
with wrapping cells; the token browser retains its separate horizontal layout.
Family Voice headings lead a compact disclosure identifying current product
wording and pinned shared rules; full source scope remains available in the disclosure.

Executed the 104-test repository check and the Chrome component/reference browser
suite. Its expanded 72 page/theme/width cases include Voice and assert single-line
metadata and fully visible prose-table columns at 390 and 320 px in both modes.
These checks supplement, rather than replace, rendered review of family pages.
