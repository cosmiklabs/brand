# Reference validation

This is the current evidence record for the shared component reference and Tectra
review board. Kit checks establish their tested properties; they do not certify a
consuming product or replace its interaction journeys.

## 0.7.0 review — 23 October 2026

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
execute it in that environment. The current run above supersedes that browser
blocker and the old two-kit coverage statement. See the
[historical Tectra review](../kits/tectra/validation.md) for its original source and
contrast findings. Approval status belongs in the manifest and family guides.

The quality acceptance process is in [guide/quality.md](../guide/quality.md), and
behavior requirements are in [interface](../guide/interface.md) and
[motion](../guide/motion.md).
