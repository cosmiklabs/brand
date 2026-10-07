# Colour and themes

**The identity is black and warm off-white.** The baseline has no accent colour: hierarchy comes from type, space and structure, and status from words. Paper matches the accepted emblem's fill. The palette is sRGB; no universal CMYK or Pantone match is specified.

## Use roles, not colours

Product code reads **semantic roles** (`bg`, `surface`, `raised`, `text`, `muted`, `border`, `focus`, the action, input, disabled and status roles), never raw colours or primitives. Every role exists in both a dark and a light mode. The values, and the full list, are in the [tokens](../tokens/README.md).

- **Switch a whole mode together.** Never change text without its surfaces, or put a dark-only colour on a light surface.
- **Dark is the default.** A page or section chooses its mode explicitly; it does not follow the operating system's preference silently.
- **Essential boundaries use `border`.** `divider`, `divider-strong` and the ornament greys are decorative and must never be the only cue.

## Contrast

Required text meets at least 4.5:1 against its background; essential control boundaries, focus indicators and selected states meet at least 3:1. `node scripts/check.mjs` checks every defined pair in every kit. Decorative separators are exempt only when they carry no information. These checks are evidence for the kit, not certification of a product built with it.

## Print

Use the original paper colour, test black coverage, and approve a physical proof for each print process and stock.

## Product families

A product family may bring colour of its own (an accent, tinted surfaces, status hues) through a family kit, under rules the build enforces. See [Product families](families.md).
