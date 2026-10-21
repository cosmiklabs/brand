# Tectra theme validation — 17 October 2026

Base: cosmiklabs/brand main at 24fd4bf49bc57d9af4add52aea60900a390cfb68. Owner approved the theme and publication to the brand repository on 17 October 2026. No product release or deployment is included.

- Generator resolves 37 semantic roles in each mode. All 112 Tectra baseline/extension contrast pairs pass. Lowest Tectra text ratio is 4.986:1 and essential boundary ratio 3.517:1.
- Full kit build and check pass: 402 contrast pairs across three kits; original baseline and HPLX output files unchanged; manifest and 11 existing asset/font tests passed at initial build (15 total tests after the accessibility additions below).
- Local HTML static checks cover existing stylesheet/font references, unique IDs, internal targets, and referenced CSS variables. The review board uses no JavaScript or network resources.
- Browser regression coverage was extended to three-kit selection and nested Tectra themes. Execution is blocked by the environment's Chromium process/socket permissions; those checks have not passed here. No screenshots or rendered visual acceptance are claimed.

Before consumer rollout: render the offline board in current browsers, check 320/390/768/1280 px widths and 200% text size, keyboard and forced-colour behavior, nested dark/light scoping, and real consumer examples. Run BRAND_BROWSER=<browser> node scripts/check-browser.mjs in an environment that supports Chromium. Product-specific accessibility remains separate.

The angle-only Latch symbol and matching outlined Inter lockup were added after owner approval on 17 October 2026. Exact source paths are regression-tested. Optical icons, banners, print proofs and consumer rollout are not included; rendered accessibility QA remains pending.

## Positioning update

Public copy leads with creative benefits and intended workflow. Implementation architecture and repository plans are excluded. Pricing, access and launch claims require separate approval; no workflow completion is asserted. Palette and interface rules are unchanged.

## Accessibility review and fixes — 17 October 2026

A second, independent source reviewer audited the palette and preview. This review uses WCAG 2.2 criteria as a reference; it is not a WCAG conformance certification. The palette and font families did not need replacement. No parent Cosmik or HPLX token changed.

### Measured colour results

All 112 Tectra contrast pairs pass. Ratios below are displayed to three decimals; pass/fail uses unrounded values.

| Pair | Dark | Light |
|---|---:|---:|
| Main text / page | 16.281:1 | 14.033:1 |
| Muted text / raised surface (weakest text pair) | 7.221:1 | 4.986:1 |
| Primary button text / normal | 10.467:1 | 6.382:1 |
| Primary button text / hover | 12.430:1 | 7.987:1 |
| Primary button text / pressed | 7.329:1 | 10.033:1 |
| Essential border / raised surface | 4.614:1 | 3.517:1 |
| Focus / raised surface | 7.843:1 | 5.195:1 |

Checks cover text/link states, primary/secondary action states, selection, input/placeholder, disabled and neutral status roles, focus, boundaries and accent. Additional tests check illustration strokes against both diagram fills. Decorative dividers and swatch fills are not presented as readable text or sole information cues. Labels name swatches; relationship information has text, nodes and dashed/solid lines, rather than relying on hue.

### Typography and layout fixes

- Replaced 12-unit SVG labels, which could shrink to about 5.6 CSS px on a narrow screen, with wrapping HTML legends at the inherited 14 px label size. Text now responds to root-size and user text-spacing changes. SVG title/description agrees with the visible legend.
- Raised 12 px palette-code and status labels to 14 px. Body remains 17 px / 1.55, controls 15 px / 1.4, labels 14 px / 1.5, and headings Inter 600. No thin font weights or new typeface required. These sizes are readability choices, not a claim that WCAG specifies a minimum font size.
- Removed nonwrapping draft text and allowed flex rows to wrap, with bounded children and no fixed text-container heights. Reading copy is bounded by the inherited 65-character measure.
- Preserved the 44 px minimum control height and added the same minimum width. Added a skip link and retained the visible 2 px focus outline with 2 px offset.
- Added explicit pressed styles, system-colour forced-colours treatment and non-scaling diagram strokes; kept reduced-motion suppression. No motion is required to understand the board.

### Verified and outstanding

Verified: full generation; all 402 kit contrast checks; manifest hashes; 15 regression tests (11 existing plus four Tectra accessibility/source tests); static IDs, links, font references and CSS-variable checks; JavaScript syntax and diff whitespace checks. The colour ratios and source safeguards above were inspected/calculated, not inferred from screenshots.

The browser suite now explicitly navigates to `specimens/tectra.html` after the component tests. It includes 1280/768/390/320 CSS-pixel viewports at 100% and 200% root text size, each with standard and WCAG text-spacing overrides (line height 1.5, paragraph spacing 2em, letter spacing .12em, word spacing .16em), target bounds, focus and forced-colours checks. These new browser checks are **written but not executed successfully** here because Chromium cannot create its process socket. A 320 CSS-pixel viewport models the reflow width at 400% zoom on a 1280-pixel window; it does not establish actual browser-zoom behavior. Actual 200% text, 400% browser zoom, keyboard order/visibility, screen-reader output, forced colours and cross-browser rendering remain manual acceptance checks. The earlier cloud-browser preview was also unreachable; no rendered QA is claimed.

### Primary references consulted

- [WCAG 2.2 1.4.3 Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html): normal text 4.5:1; large text 3:1.
- [1.4.11 Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html): essential graphics/control cues 3:1 against adjacent colours.
- [1.4.1 Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html): meaning must not depend solely on colour.
- [1.4.4 Resize Text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html), [1.4.10 Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html), and [1.4.12 Text Spacing](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html): preserve content/function with resizing, narrow viewport and specified user spacing.
- [2.5.8 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html): AA 24 CSS-pixel target minimum with exceptions; this board uses the stronger inherited 44 px control dimension.
- [2.4.13 Focus Appearance](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html): AAA focus guidance, not an AA requirement or a claim of AAA compliance.
