# Colour and themes

**The identity is black and warm off-white.** The baseline has no accent colour: hierarchy comes from type, space and structure, and status from words. Paper matches the accepted emblem's fill. The palette is sRGB; no universal CMYK or Pantone match is specified.

## Use roles, not colours

Product code reads **semantic roles** (`bg`, `surface`, `raised`, `text`, `muted`, `border`, `focus`, the action, input, disabled, status and glass roles), never raw colours or primitives. Every role exists in both a dark and a light mode. The values, and the full list, are in the [tokens](../kits/README.md).

- **Switch a whole mode together.** Never change text without its surfaces, or put a dark-only colour on a light surface.
- **Choosing a mode is the product's decision.** `data-theme` sets one on a page or section; without it the page follows the operating system's light or dark preference.
- **Essential boundaries use `border`.** `divider`, `divider-strong` and the ornament greys are decorative and must never be the only cue.

## Contrast

Required text meets at least 4.5:1 against its background; essential control boundaries, focus indicators and selected states meet at least 3:1. `npm run check` checks every defined pair in every kit. Decorative separators are exempt only when they carry no information. These checks are evidence for the kit, not certification of a product built with it.

## Compositing and overlays

Keep essential text and controls on surfaces with a known contrast relationship.
An attractive translucent panel over a screenshot or 3D viewport is not guaranteed
to retain that relationship as the content changes. Use a sufficiently solid
semantic surface and a functional boundary; do not count a decorative shadow as
the boundary. Check actual backgrounds in both themes.

The **glass roles** are the one sanctioned translucent surface, for controls that
float over busy or moving content (see [interface](interface.md#shared-controls)):

| Role | Use |
| --- | --- |
| `glass` | The translucent tint (`#RRGGBBAA`) painted over the filtered backdrop |
| `glass-sheen` | The edge sheen where the rim catches light, at the top left (translucent) |
| `glass-sheen-low` | The sheen's fainter return at the bottom right (translucent) |
| `glass-hover`, `glass-active` | Translucent tints over glass for hover and pressed; pressed is the deeper of the two |
| `glass-border` | A plain, subtle border for the solid fallbacks, in place of the sheen |
| `glass-muted` | Muted text on glass; ordinary text stays `text` |

**Glass follows the theme.** Each mode is also a glass tone, with its own tint,
sheen, text, muted text, icons (which take the text colour), selection and focus:
dark glass in the dark theme, light glass in the light theme, over whatever lies
behind it. Legibility comes from filtering the backdrop rather than from a heavy
tint. After the shared blur and saturation, each tone applies its own
`contrast()` and then `brightness()` (`glass.dark` and `glass.light`, published as
`--c-glass-contrast` and `--c-glass-brightness` in each mode): the dark tone dims
the backdrop and lowers its contrast, the light tone lowers its contrast and
brightens it. The scene still shows through, with its luminance range compressed
far enough that the tint over it holds text over any backdrop. Do not switch tones
by what is behind the glass: in motion over a changing scene the controls flip
constantly. `data-glass-tone="dark"` or `"light"` remains an explicit override that
gives a surface or region that mode's roles and filter whatever the page's theme,
for a product that must force a tone for a region.

The action roles step one way: `*-hover` and `*-active` move from the rest role in
the same direction of lightness, `*-active` at least 1.25:1 from rest and 1.08:1
beyond hover; on glass, the same holds for the tints over every backdrop, and quiet control text holds 4.5:1 on the pressed tint. `npm run check`
reports these as `state` pairs, and the browser check measures each control's
rendered fill.

Each tone's text and `glass-muted` (4.5:1), quiet controls (4.5:1, also on the
pressed tint), focus and selection (3:1) are checked against the tint composited
over **any** backdrop: a grid of 17 levels per sRGB channel (4,913 colours, the
full luminance range and the saturated primaries), each passed through the tone's
filter as Chromium paints it (saturate, clamped; contrast; brightness, clamped; all
per channel in sRGB), then under the tint. Blur only averages the backdrop, so a
solid colour is the worst case; the browser check also samples real rendered
pixels over stripes and checkers. The solid fallback (`surface`) is checked too. The glass surface's own edge (the
sheen, or `glass-border` when solid) is decorative and has no contrast
requirement: the 3:1 non-text contrast applies to what identifies the controls on
it (icons, which take the text colour, the selected state and its bar, and the
focus ring), and a standalone glass button or select trigger is identified by its
label, icon or chevron, which meet the text requirement. The sheen roles must be
translucent. Its direction (`glass.sheenAngle`, `--c-glass-sheen-angle`) is
baseline; a family may tint its colours. The blur, saturation, each tone's
contrast and brightness, and the sheen angle are baseline-only; a family may set
its own glass roles in either mode, and its tints must pass the same contract.
`npm run check` reports each glass pair with the backdrop it is weakest over, and
how much of the scene each tone keeps (the filtered and composited luminance
range); the browser check measures the same from rendered pixels.

Portalled overlays must receive the same theme and family context as their trigger.
Use the [consumer integration contract](../kits/README.md#themes-scopes-and-motion)
and the [interface layering rules](interface.md#menus-popovers-and-dialogs).

## Print

Use the original paper colour, test black coverage, and approve a physical proof for each print process and stock.

## Product families

A product family may bring colour of its own (an accent, tinted surfaces, status hues) through a family kit, under rules the build enforces. See [Product families](families.md).
