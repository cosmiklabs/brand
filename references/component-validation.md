# Component validation

Run `node scripts/check.mjs` for current contrast and source-integrity results from `tokens/cosmik/source.json` and `tokens/hplx/family.json`. These checks cover defined combinations and do not establish browser or accessibility conformance.

The baseline was approved on 7 October 2026; the HPLX family remains proposed. The manual checks below remain open from the 4 October review.

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
