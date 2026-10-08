# Interface

Rules for websites, tools and in-game interfaces. The offline [component specimens](../specimens/components.html) show them with a selector for the approved baseline and proposed HPLX family tokens; they are examples, not a UI framework.

## Actions

| State | Behaviour |
|---|---|
| Default | One primary action per local task, with a specific verb label |
| Hover and pressed | Change the fill without changing layout; keep text contrast |
| Keyboard focus | A visible outline with an offset (the `focus` role and the layout tokens); never clipped or hidden under an overlay |
| Disabled | Native disabled behaviour, plus a reason when the next step is unclear |
| Loading | Keep the control's width; use a meaningful loading label and expose the busy state |

- Standalone targets are at least 44 × 44 CSS px. WCAG 2.2 AA asks for 24 px with exceptions; the larger house size gives touch and pointer users more room.
- Underline inline links. A button performs an action; a link navigates.
- Keep keyboard order meaningful, and give touch, pointer and keyboard users the same useful content.

## Forms

Put a persistent label above each field and helper text for the expected format. A placeholder can show an example but never replaces the label. Name an error in words, connect it to its field, say how to fix it, and keep what the user entered.

## Status

Use explicit words: *Error*, *Saved*, *In development*. Pair important status with a distinct symbol or text treatment; never rely on a change of shade alone. In the baseline, success and error share the neutral status colours because their words carry the meaning; a family may add status hues, and the words stay.

## Layout

- A 4 px rhythm; the common steps and the gutter are in the [tokens](../tokens/README.md).
- Choose one dominant alignment, and group related controls more tightly than unrelated sections.
- Use two or three columns only when the content fits; a single column below the `compact` breakpoint (720 px), keeping every piece of content when columns stack.
- Navigation and actions wrap cleanly, keeping their target sizes.
- Use the radius tokens for controls and surfaces. Avoid ornamental shadows, repeated logo decoration and dense clusters of badges.
- Code blocks may scroll sideways inside their own container; the page itself must reflow.

## Before shipping

Check keyboard access, visible focus, accessible names, error associations, and announcements for asynchronous results. Test 320 CSS px reflow, 200% text size and reduced motion. The kit's checks are evidence for its own reference, not certification of a product.
