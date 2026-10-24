# Quality review

Review the experience a person uses, not just the tokens or a screenshot of the
happy path. A kit check proves the checks it ran; it does not certify a consuming
product. Current reference evidence and its limitations belong in
[specimen validation](../specimens/validation.md).

## Choose representative flows

Review at least one complete flow for every changed interaction: open, understand,
act, receive feedback and dismiss or continue. Include the state before data
arrives, no results, a recoverable failure and success when those states exist.

For changes to shared components, sample more than one consumer. A menu that looks
correct over a flat surface may fail over complex imagery; a short dialog may
hide the problems in a longer scrollable surface. Use realistic names, descriptive text and enough items
to exercise wrapping and scrolling. Keep screenshot fixtures deterministic and
label invented examples as examples. The kit's examples should stay neutral and
component-focused; consumer-specific flows belong in the consuming product.

## Review matrix

| Dimension | Check |
| --- | --- |
| Family and theme | Every affected family, light and dark; nested themes and portalled surfaces |
| Space | Wide, narrow and short available areas; browser references include 320 CSS px width |
| Text | Enlarged text, long names, wrapping helpers and user text-spacing overrides |
| Input | Pointer, keyboard and touch-sized targets; no hover-only action |
| Motion | System preference and any explicit app override; entrance, exit, rapid reopening and preference changes during motion |
| Focus | Initial focus, visible focus while scrolling, Escape behavior and return focus |
| Data | Empty, pending, complete, failed and disabled states; repeat actions and retry |
| Contrast | Semantic pair checks plus real backgrounds, images, disabled content and forced colours |

Use the matrix in the target platform's terms: browser zoom or native text/display
scaling, accessible roles and the intended keyboard, pointer or touch conventions.
Root text-size tests do not establish browser-zoom behavior. Review actual browser
zoom separately where applicable. Test the supported runtimes and assistive
technologies; a Chromium-only reference run cannot establish native or other-engine
behavior.

## Look at the rendered result

Inspect screenshots at their actual display size. Compare hierarchy, alignment,
density, target separation, surface boundaries and text contrast. Then interact
with the same screen: still images do not reveal clipped focus, an abrupt exit,
a lost selection or a layout jump after an asynchronous update.

Look for details that source checks cannot settle: an oversized heading in a small
popover, excess chrome in a short dialog, empty columns in a form, a preview that
obscures its controls or a toolbar that changes width with its selected option.
Change the composition for a clear usability reason, not to decorate every surface.

## Evidence and completion

For a kit change, record:

- The code or release tested and the commands that ran.
- The platforms or browsers, themes, sizes and interactions actually reviewed.
- Which assertions were automated and which screenshots or flows were inspected.
- Failures, fixes and checks that could not run.

Keep exact results in validation records, not copied across every guide page. A
historical result stays dated; new evidence supplements or supersedes it explicitly.
Do not describe a written test as a passing test. Use focused regression coverage
for real failure modes, including interrupted animation and responsive overflow.

Release and consumer upgrade steps are in [governance](governance.md).
