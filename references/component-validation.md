# Component validation

Run `node scripts/check.mjs` for current contrast and source-integrity results from `tokens/cosmik/source.json` and `tokens/hplx/family.json`. These checks cover defined combinations and do not establish browser or accessibility conformance.

The baseline was approved on 7 October 2026; the HPLX family remains proposed.

## Browser checks

On 7 October 2026, `node scripts/check-browser.mjs` passed in headless Chrome and Edge on Windows. Set `BRAND_BROWSER` to an installed Chromium executable and optionally `BRAND_SCREENSHOTS` to a review-image folder. The script uses Node.js 22+ without dependencies.

Coverage includes both kits in dark/light themes at 1280, 768, 390 and 320 CSS pixels, with 100% and 200% root text size; nested theme precedence; local font loading and heading/control faces; tab keyboard navigation; all three confirmations, safe initial focus, inert background and focus restoration; slug validation; checkbox keyboard activation; and reduced-motion behavior. Selected Chrome desktop, narrow-layout and dialog captures were visually reviewed. Forced-colors captures are provided for inspection, without claiming accessibility conformance.

Still required before adopting these examples in a product:

- Full browser zoom at 200% and 400%, with clipping, reflow and visible-focus review. Root text resizing is a separate check.
- A complete keyboard pass through the skip link, navigation and all control states, including disabled controls and responsive dialogs.
- Screen-reader verification of names, field errors, tabs, modal context and live announcements, including real asynchronous loading in the consuming product.
- Visual and functional checks in other browser engines, intended assistive technologies and system high-contrast settings.

Guide diagrams remain illustrative unless explicitly identified as browser screenshots. These checks do not certify a future product.

## Reference basis

- [W3C: Contrast (Minimum), SC 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- [W3C: Non-text Contrast, SC 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)
- [W3C: Target Size (Minimum), SC 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)

Reference pages checked 4 October 2026. Product-level testing is still required.
