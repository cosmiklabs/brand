# Cosmik tokens

Design tokens for every Cosmik surface, as **kits**: one **baseline** (`cosmik/`) that the organisation itself uses (website, GitHub profile, documents) and **family kits** (`hplx/`, …) for product families with a style of their own. Every kit is generated from one source file by `node scripts/build.mjs` and checked by `node scripts/check.mjs`; never hand-edit the generated files.

| Kit | Source | Status | Outputs |
|---|---|---|---|
| `cosmik/` (baseline) | `source.json` | Approved (owner, 2026-10-07) | `cosmik.css`, `cosmik.json`, `cosmik.tokens.json`, `cosmik_tokens.rs` |
| `hplx/` (HPLX family: the engine, its game reimplementations, launcher and editor) | `family.json` | Proposed: values pending owner review | `hplx.css`, `hplx.json`, `hplx.tokens.json`, `hplx_tokens.rs` |

## The baseline

The identity is black and warm off-white with no accent colour, and status is carried by words and structure, not hue (guide §5, §7). The baseline defines:

- **Semantic roles** in a dark and a light mode, every role in both: surfaces (`bg`, `surface`, `raised`), text (`text`, `muted`), boundaries (`border` for essential control edges, `divider` and `divider-strong` decorative), focus, links, selection, primary and secondary actions, inputs, disabled and neutral status (`status-fg`/`-bg`/`-border`), decorative greys (`ornament`, `ornament-faint`, `ornament-text`, `media-placeholder`) and `scrim` (a translucent backdrop behind a modal).
- **Type roles:** Inter for reading and interface (`body`, `display`, `display-small`, `section`, `card`, `control`), IBM Plex Mono for short technical labels (`label`), and the live `identity-label` (Inter 500, 20 px).
- **Rhythm:** a 4 px spacing base (8, 16, 24, 32, 48, 64, 96), 4 px radii (`radius-sm` 2 px, `radius-md` 4 px, `radius-full`), layout values (44 px control minimum, 2 px focus outline with 2 px offset, a 65-character reading measure), breakpoints (720 px compact, 380 px narrow) and motion (140 ms ease-out; 0 ms under reduced motion).

### Use on the web

Load `cosmik/cosmik.css` before your component CSS. Set `data-theme="dark"` or `data-theme="light"` on the root or a section; dark is the default. The theme is explicit on purpose: it does not follow or override the operating-system preference. Use role variables (`--c-bg`, `--c-surface`, `--c-text`, `--c-muted`, `--c-action-primary-fg`, …), never primitives, and switch a whole theme together rather than overriding one value. `--c-divider` is decorative; use `--c-border` for an essential boundary. Breakpoint variables are reference values: custom properties cannot be used inside `@media`.

## Family kits

A family gives a product family its own mood while staying recognisably Cosmik (guide §10: "A project can have its own visual mood while keeping the endorsement and utility type consistent"). `scripts/generate-tokens.mjs` merges `tokens/<id>/family.json` over the baseline and **refuses a family that breaks the contract**; `scripts/validate-tokens.mjs` checks every kit against the same contrast pairs.

| A family… | |
|---|---|
| **must** | define both of the baseline's modes; keep every baseline role (any it does not override comes from the baseline); pass every baseline contrast pair (4.5:1 text, 3:1 essential boundaries and focus) |
| **may change** | the colour of any baseline role, through primitives of its own (names that do not collide with the baseline's); the typeface and weight of the heading roles `display`, `display-small`, `section` and `card` |
| **may add** | roles of its own under `extensions`, named in every mode (for example `accent` and the status tones); elevation levels; heading fonts it needs, listed with their licence |
| **never changes** | utility type (`body`, `control`, `label`, `identity-label`), spacing, layout, radii, breakpoints and motion; and, outside the tokens, the emblem, the name and the endorsement ("A Cosmik project") |

### Use a family on the web

Load the family's CSS after the baseline's, and mark the region it styles:

```html
<link rel="stylesheet" href="tokens/cosmik/cosmik.css">
<link rel="stylesheet" href="tokens/hplx/hplx.css">
…
<main data-family="hplx"> <!-- this product's content; the site's header and footer stay baseline -->
  <section data-theme="light">…</section>
</main>
```

Inside `[data-family="hplx"]` the same role variables take the family's values: dark by default, light where the family element or a section inside it carries `data-theme="light"` (or where the family element sits inside a light section). Components read the roles, including the typography variables, and load the fonts the kit lists. Family colors use `light-dark()` (current browsers) with the nearest explicit `data-theme` color scheme, including a dark family inside a light ancestor. The root stays explicitly dark by default; OS preference does not switch it.

### The HPLX family (proposed)

The launcher art board's look: warm blacks and bone text, a lantern-amber accent for primary actions, focus and highlights, Spectral 600 for headings, and what HPLX's tools need that the monochrome baseline leaves out: `accent`, status tones `status-{error,warning,success,info}-{fg,bg,border}` (muted red, amber, green and blue; status still also says it in words) and `shadow` with elevation levels 1–3 for menus and dialogs. Spectral SemiBold (SIL OFL 1.1, The Spectral Project Authors) is bundled: `fonts/desktop/Spectral-SemiBold.ttf`, `fonts/web/Spectral-SemiBold.woff2`, notice in `fonts/licenses/Spectral-OFL.txt`.

## Native consumers

Each kit's `<kit>.json` → `native` and `<kit>_tokens.rs` give values that need no browser:

- lengths (space, radius, gutter, control height, breakpoints, type sizes, elevation offsets) as logical px at a 16 px root;
- `layout.line` as `{ "chars": 65 }`, a reading measure in characters;
- letter spacing as a fraction of the font size (`0.06` for labels), plus the px value at the role's size;
- easing as cubic-bezier control points `[x1, y1, x2, y2]` (`ease-out` is `[0, 0, 0.58, 1]`), and durations in ms;
- every colour as `hex`, straight-alpha sRGB floats `srgb: [r, g, b, a]` and linear-light floats `linear: [r, g, b, a]`. In Bevy, `Color::srgba(r, g, b, a)` takes the `srgb` array; in egui, `Color32::from_rgba_unmultiplied` takes the hex bytes.

A family's files are complete on their own (baseline values included), so a product includes one kit only. `<kit>_tokens.rs` defines `Color`, `TypeRole`, `Elevation` and `Theme` structs, a `primitive` module, `DARK` and `LIGHT` themes with every role, and `space`, `radius`, `breakpoint`, `layout`, `typography` and `motion` modules. It has no dependencies; include it with `#[path = "…/tokens/hplx/hplx_tokens.rs"] mod hplx_tokens;` (add `#[allow(dead_code)]` on the `mod`) or copy it into a crate.

## DTCG files

`<kit>.tokens.json` follows the W3C Design Tokens Format Module 2025.10: `$type`/`$value`, colours as `{ colorSpace, components, alpha, hex }`, dimensions as `{ value, unit }`, durations in ms, easing as `cubicBezier`, typography and shadow composites.

- `primitive.color.*` holds raw values; `color.*` holds the semantic roles as `{primitive.color.…}` aliases; elevation shadows alias `{color.shadow}`.
- **Modes:** DTCG 2025.10 has no theme mechanism. Each `color.*` `$value` is the default **dark** alias, and `$extensions["com.cosmiklabs.modes"]` lists the alias for every mode (`dark`, `light`). A tool that does not read the extension sees the dark theme.
- Letter spacing is given in px at the role's size (DTCG dimensions allow only px and rem); the em fraction is in `$extensions["com.cosmiklabs"].letterSpacingEm`. `layout.line` is a `number` (characters).

## Scope

These tokens and the specimens are a design-system reference, not a production UI package and not an accessibility certification: contrast is checked for the defined pairs only (`node scripts/check.mjs`), and browser, keyboard and assistive-technology checks remain pending (`../references/component-validation.md`).
