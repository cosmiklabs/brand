# Cosmik tokens · proposed 0.2.0

## Use

Open `../specimens/components.html` directly in a browser. Its stylesheet, script, and fonts are local; it requires no server, installation, or internet connection. Controls demonstrate local states only.

For implementation, load `cosmik.css` before your component CSS. Set `data-theme="dark"` or `data-theme="light"` on the root or a containing section. Dark is the default. This explicit theme mechanism is intentional; it does not silently follow or override the operating system preference.

Use role variables such as `--c-bg`, `--c-surface`, `--c-text`, `--c-muted`, and `--c-action-primary-fg`. Do not compose a theme by overriding just its text value, or by applying a dark-only primitive to a light surface. The two theme maps include identical role keys.

The `--c-divider` token is decorative. Use `--c-border` for an essential control boundary. Status treatments always need explicit words; error meaning must never depend on color.

### Added roles (unreleased)

- **Status:** `--c-status-{error,warning,success,info}-{fg,bg,border}` in both themes. **Proposed — needs owner approval.** Muted red, amber, green and blue primitives chosen to sit beside the neutral palette; every fg/bg/border pairing passes the validator. The neutral `--c-status-*` roles remain for status without a tone. Colour never carries the meaning alone.
- **Decorative greys** that the website hard-coded: `--c-divider-strong` (#C6C5C0 rule on light), `--c-ornament` (#252525 line), `--c-ornament-faint` (#181818 line), `--c-ornament-text` (#414141 index numeral), `--c-media-placeholder` (#111111 image backdrop). Decorative only: not contrast-checked, never the only cue. Their counterparts in the other theme are proposed.
- **Overlay and elevation:** `--c-scrim` (translucent backdrop behind a modal), `--c-shadow`, and `--c-elevation-{1,2,3}-surface` / `--c-elevation-{1,2,3}-shadow` (a ready `box-shadow` value). Elevation values are declared inside each theme scope, so a nested light section gets light shadows. On dark, elevation shows mainly through the raised surface; the shadow is secondary.
- **Radius:** `--c-radius-sm` (2 px), `--c-radius-md` (4 px, same as `--c-layout-radius`), `--c-radius-full`.
- **Breakpoints:** `--c-breakpoint-compact` (720 px) and `--c-breakpoint-narrow` (380 px), as used by the specimen. Custom properties cannot be used inside `@media`; they are reference values for scripts and other platforms.

## Build

Run `node tokens/generate-tokens.mjs` from the extracted bundle root. The generator needs Node.js and no third-party packages. It reads `cosmik.source.json`, checks that both theme maps are complete, and writes `cosmik.css`, `cosmik.json`, `cosmik.tokens.json` and `cosmik_tokens.rs` beside it. Do not hand-edit the generated files. After regenerating, run `node verify-manifest.mjs --update-generated` to refresh their hashes in `asset-manifest.json`.

- `cosmik.source.json`: primitive values, semantic aliases, spacing, typography, layout, and motion source
- `cosmik.json`: resolved semantic colors plus their aliases and supporting values; a simple kit-specific JSON contract. Its `native` section restates everything for non-browser consumers (below).
- `cosmik.tokens.json`: the same tokens in W3C Design Tokens (DTCG 2025.10) format, for design tools and token pipelines (below).
- `cosmik_tokens.rs`: dependency-free Rust constants generated from the same values (below).
- `cosmik.css`: generated custom properties and explicit theme scopes
- `../specimens/components.css`: example components, local font definitions, focus, responsive and reduced-motion treatments

Rem values assume a 16 px browser root but leave the user’s browser root setting intact. The proposed scale is a 4 px base with 8, 16, 24, 32, 48, 64, and 96 px intervals. Typography uses body tracking of zero; only all-caps labels use 0.06em. The live identity label is Inter 500, 20 px/1.3, and is not an alternative wordmark.

These are proposed design-system choices. The HTML is a compact reference, not a production UI package. Keep accessible names, error relationships, disabled semantics, focus behavior, and localization under review when adapting a component. See `../references/component-validation.md` for completed checks and remaining browser-QA limitations.

Recheck the defined contrast pairs with `node tokens/validate-tokens.mjs`. This uses Node.js only and does not perform browser or assistive-technology testing.

## Native consumers

`cosmik.json` → `native` and `cosmik_tokens.rs` give values that need no browser:

- lengths (space, radius, gutter, control height, breakpoints, type sizes, elevation offsets) as logical px at a 16 px root;
- `layout.line` as `{ "chars": 65 }`, a reading measure in characters (multiply by the advance of `0` in the body font if a width is needed);
- letter spacing as a fraction of the font size (`0.06` for labels), plus the px value at the role's size;
- easing as cubic-bezier control points `[x1, y1, x2, y2]` (`ease-out` is `[0, 0, 0.58, 1]`), and durations in ms;
- every colour as `hex`, straight-alpha sRGB floats `srgb: [r, g, b, a]` and linear-light floats `linear: [r, g, b, a]`. In Bevy, `Color::srgba(r, g, b, a)` takes the `srgb` array; in egui, `Color32::from_rgba_unmultiplied` takes the hex bytes.

`cosmik_tokens.rs` defines `Color`, `TypeRole`, `Elevation` and `Theme` structs, a `primitive` module, `DARK` and `LIGHT` themes with every role, and `space`, `radius`, `breakpoint`, `layout`, `typography` and `motion` modules. It has no dependencies; include it with `#[path = "…/tokens/cosmik_tokens.rs"] mod cosmik_tokens;` (add `#[allow(dead_code)]` on the `mod` to silence unused constants) or copy it into a crate.

## DTCG file

`cosmik.tokens.json` follows the W3C Design Tokens Format Module 2025.10: `$type`/`$value`, colour values as `{ colorSpace, components, alpha, hex }`, dimensions as `{ value, unit }`, durations in ms, easing as `cubicBezier`, typography and shadow composites.

- `primitive.color.*` holds raw values; `color.*` holds the semantic roles as `{primitive.color.…}` aliases; elevation shadows alias `{color.shadow}`.
- **Modes:** DTCG 2025.10 has no theme mechanism in the format itself. Each `color.*` `$value` is the default **dark** alias, and `$extensions["com.cosmiklabs.modes"]` lists the alias for every theme (`dark`, `light`). A tool that understands the extension (or a small transform) can build the light set; a tool that does not sees the dark theme.
- Letter spacing is given in px at the role's size, because DTCG dimensions allow only px and rem; the em fraction is in `$extensions["com.cosmiklabs"].letterSpacingEm`. `layout.line` is a `number` (characters).
