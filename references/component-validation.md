# Cosmik 0.2.0 · component validation

**Status: proposed component system.** Contrast and source-integrity checks completed on 4 October 2026. Browser rendering and interactive QA could not be completed in this environment. This report is not an accessibility-conformance claim or production certification.

## What changed

The earlier light treatment could inherit `surface: #121212` while changing its text to black, a pairing of approximately **1.121:1**. The 0.2.0 source separates primitive values from semantic roles. Both dark and light now explicitly map the same **30 color roles**, including every surface, text, input, action, disabled, selected, focus, and status role. Paper is **#F6F5F0**, matching the accepted symbol’s off-white.

`tokens/cosmik.source.json` is authoritative. `tokens/generate-tokens.mjs` generates both `cosmik.css` and the resolved `cosmik.json`. Regenerating produced byte-identical outputs. Consumers should use semantic variables, not primitive colors directly.

## Contrast results

Calculated from the source sRGB hex values with the WCAG relative-luminance method. Threshold decisions use unrounded values; displayed ratios are rounded to three decimals. All **94 defined text, essential-boundary, and focus pairings passed their numerical targets**. This evaluates approved combinations, not arbitrary combinations of the palette.

| Pair | Dark mode | Light mode |
|---|---:|---:|
| Primary text / background | 19.238:1 | 19.238:1 |
| Primary text / surface | 17.162:1 | 21.000:1 |
| Primary text / raised | 15.100:1 | 16.971:1 |
| Muted text / background | 8.325:1 | 5.260:1 |
| Muted text / surface | 7.427:1 | 5.742:1 |
| Muted text / raised | 6.534:1 | 4.640:1 |
| Primary action text / default | 19.238:1 | 21.000:1 |
| Primary action text / hover | 21.000:1 | 18.734:1 |
| Primary action text / active | 16.971:1 | 16.483:1 |
| Disabled text / disabled fill | 6.534:1 | 4.640:1 |
| Functional border / background | 4.623:1 | 4.161:1 |
| Functional border / surface | 4.124:1 | 4.542:1 |
| Functional border / raised | 3.629:1 | 3.671:1 |
| Focus outline / component surface | 17.162:1 | 21.000:1 |

Minimum normal-text combination: **#666666 on #E8E7E3, 4.640:1** (target ≥4.5:1). Minimum tested essential-boundary combination: **#767676 on #1F1F1F, 3.629:1** (target ≥3:1). The inactive controls also meet the text target by choice, although inactive controls have relevant WCAG contrast exceptions. Decorative dividers are excluded from essential boundaries and must never identify an input, selection, or status by themselves.

Full numerical pairs and the static-check results are in `component-validation-data.json`.

## Source checks completed

- Two complete semantic theme maps, with 30 roles in each; all aliases resolve.
- CSS and JSON regenerate reproducibly from the same source.
- 30 unique HTML IDs; all label, description, section, and fragment references resolve.
- Every input has a real label. Error examples have `aria-invalid` and connected explanatory text.
- 14 native buttons across the two modes; four use native `disabled`; two loading examples are named and use `aria-busy`.
- JavaScript syntax checked. No form submission, storage, fetch, external link, or analytics is implemented.
- All seven local CSS, script, and font references exist. HTML, CSS, and script contain no remote URLs.
- Source includes a 2 px focus outline with 2 px offset, underlined links, explicit status wording, and a selected checkbox.
- Source includes a 44 × 44 px minimum house target for standalone buttons, and 44 px-tall label/navigation hit areas. This exceeds the WCAG 2.2 AA 24 × 24 px minimum and its applicable exceptions. Inline links retain normal text flow.
- Source includes a 720 px compact-layout breakpoint with single-column product and action grids; 24 px page gutters, 1120 px content maximum, 65ch reading measure, and 4 px radius.
- Source includes `prefers-reduced-motion: reduce` handling that removes transitions and the decorative loading pulse.

These are implementation/source findings. They do not substitute for rendered measurements or assistive-technology checks.

## Browser checks not completed

**No rendered widths, browser zoom levels, keyboard flows, reduced-motion behavior, or screenshots are reported as passed.** Browser execution was unavailable in this review environment. These checks remain pending.

The following checks remain required before adopting these examples in a product:

1. Open `specimens/components.html` locally and inspect dark/light sections at 1280, 768, 390, and 320 CSS-pixel widths for clipping, overflow, and hierarchy. Verify the 720 px breakpoint.
2. Test browser zoom at 200% and 400%, and text resizing to 200%. Confirm no lost content or control labels, usable reflow, and readable focus.
3. Use Tab/Shift+Tab through the skip link, navigation, buttons, fields, and checkboxes. Confirm visible 2 px focus, expected order, no trap, skipped disabled buttons, Enter/Space activation, and repeated activation without side effects.
4. Correct each slug error, toggle selection with Space, and verify helper/error relationships and announcements with a screen reader. Verify labels, names, state changes, and the skip link.
5. Enable reduced motion and confirm the loading pulse and transitions stop. Check actual loading-start/completion announcements in the consuming product; these specimen loading states are illustrative.
6. Confirm all bundled local font faces load at their real weights. Repeat visual and functional checks in target browsers, high contrast/forced-colors mode, and intended assistive technologies.

Any diagram elsewhere in the guide is an illustrative design figure unless explicitly identified as an actual browser screenshot.

## Reference basis

- [W3C: Contrast (Minimum), SC 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- [W3C: Non-text Contrast, SC 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)
- [W3C: Target Size (Minimum), SC 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)

Reference pages checked 4 October 2026. Product-level testing is still required.
