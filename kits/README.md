# Consuming a kit

Use the Cosmik baseline for organisation surfaces and a family kit for its product.
Read the relevant [Cosmik](cosmik/README.md), [HPLX](hplx/README.md) or
[Tectra](tectra/README.md) identity guide before selecting artwork. Pin a release
and resolve deliverables through `asset-manifest.json` from that same release.
The formats below are platform adapters for the same visual contract; none
requires a particular framework, page composition or application workflow.

## Source and output contract

| Kit | Token source | Generated output stem |
| --- | --- | --- |
| Cosmik baseline | `cosmik/tokens/source.json` | `cosmik/tokens/cosmik` |
| HPLX family | `hplx/tokens/family.json` | `hplx/tokens/hplx` |
| Tectra family | `tectra/tokens/family.json` | `tectra/tokens/tectra` |

Each stem provides `.css`, `.json`, `.tokens.json` and `_tokens.rs`. Edit the source
and run `npm run build`; never edit an output. Generated JSON and Rust resolve the
family over the baseline and are complete on their own. Family CSS is scoped and
requires the baseline CSS for shared values. Family revision metadata is separate
from the repository release version; consume all files from one pinned release.

Values are authoritative in the sources, not in hand-copied lists of hex codes or
pixel sizes. Use semantic roles for surfaces, text, boundaries, selection, actions,
inputs and status. Primitives document the palette; they are not component roles.
`border` is an essential boundary; `divider` is decorative. Use type, spacing,
layout, radius and motion tokens alongside colour roles.

## Browser integration

The CSS supplies tokens, not resets, font loading or component styles. Define the
bundled font faces with the provided weights, apply type roles in component CSS
and preserve the corresponding font notices. Load baseline before family:

```html
<link rel="stylesheet" href="kits/cosmik/tokens/cosmik.css">
<link rel="stylesheet" href="kits/tectra/tokens/tectra.css">
<section data-family="tectra" data-theme="dark" data-motion="system">
  <button class="primary" type="button">Apply changes</button>
</section>
```

```css
.primary {
  background: var(--c-action-primary);
  color: var(--c-action-primary-fg);
  border: 1px solid var(--c-action-primary);
  border-radius: var(--c-radius-md);
  min-height: var(--c-layout-control-min);
  font-family: var(--c-type-control-font-family), sans-serif;
  font-size: var(--c-type-control-font-size);
  font-weight: var(--c-type-control-font-weight);
  line-height: var(--c-type-control-line-height);
  padding: var(--c-space-2) var(--c-space-4);
  transition: background-color var(--c-motion-duration) var(--c-motion-easing);
}
.primary:hover { background: var(--c-action-primary-hover); }
.primary:active { background: var(--c-action-primary-active); }
.primary:focus-visible {
  outline: var(--c-layout-focus-width) solid var(--c-focus);
  outline-offset: var(--c-layout-focus-offset);
}
```

This illustrates role binding, not a complete button implementation. Handle disabled,
pending and other states according to the [interface guide](../guide/interface.md).
The [component reference](../specimens/components.html) provides interactive examples.

### Themes, scopes and motion

A page without an explicit `data-theme` follows the operating system. Set `dark`
or `light` on the root or a section to choose a mode. A nested explicit theme wins;
change the complete mode rather than overriding text independently of its surface.
Family colours use `light-dark()` and the nearest colour scheme. Verify support in
your browser targets; this kit does not include a legacy-browser polyfill.

`data-family` scopes family styling. A scope can cover the root or a smaller
region; choose the boundary for the content's identity, not a prescribed page layout. A portal mounted
outside a family or theme subtree must receive the same effective context, or its
popover will use different colours and typography from its trigger.

`--c-motion-duration` is the effective duration. `data-motion="system"`, `"reduce"`
or `"full"` selects the policy for a scope; omitted scopes inherit. Use the policy
and lifecycle contract in [motion](../guide/motion.md), rather than hard-coding an
animation duration or independently overriding the operating-system query.

Breakpoint properties document the shared layout thresholds; CSS custom properties
cannot be substituted directly into `@media` conditions. Keep any literal query
in sync with the source and verify the actual layout at enlarged text size.

## Family contract

The generator merges a family's `family.json` over the baseline. It rejects
unsupported overrides and missing or inconsistent modes; contrast checks validate
the defined semantic pairs in every generated kit.

| A family | Contract |
| --- | --- |
| Must retain | Every baseline role and both modes; the baseline contrast requirements |
| May override | Semantic colours using its own primitive names; heading font family and weight for `display`, `display-small`, `section` and `card` |
| May add | Roles under `extensions`, identical in every mode; elevation levels; required licensed heading fonts |
| Must not change | Utility type, spacing, layout, radii, breakpoints or motion |

HPLX uses Spectral headings, a warm accent, status tones and elevation. Tectra uses
Inter headings and restrained teal; its status remains neutral and explicit in
words. A family does not replace Cosmik's parent identity or change the endorsement.
See [families](../guide/families.md) for visual and naming boundaries.

## Native integration

`<kit>.json` includes a `native` section, and `<kit>_tokens.rs` provides standalone
constants without dependencies. Include one resolved kit. Do not merge its values
over a separately loaded baseline a second time.

| Value | Native representation |
| --- | --- |
| Length | Logical pixels at a 16 px root; scale for the consumer's text and display settings |
| Reading measure | `layout.line` as `{ "chars": 65 }` |
| Letter spacing | Fraction of font size, plus pixels at the role's reference size |
| Easing | Cubic-bezier control points |
| Duration | Milliseconds; apply the user's effective motion preference |
| Colour | Hex, straight-alpha sRGB floats and linear-light floats |

The Rust output includes typed colours, themes, typography and elevation, plus
modules for shared layout and motion. Use the `DARK` and `LIGHT` theme roles in UI
code. Choose the colour representation your renderer expects; do not treat linear
values as sRGB or multiply alpha twice.

Load desktop fonts from `fonts/desktop/` and distribute their notices. Use the
manifest's canonical artwork entry points. Cosmik has platform icons; current
Glimmer and Latch do not yet have a platform icon pack. Historical Ember icons are
not current HPLX identity. Do not infer a current deliverable from a directory name.

## DTCG integration

`<kit>.tokens.json` uses the Design Tokens Format Module 2025.10 shape: `$type` and
`$value`, colour-space colour values, dimension and duration objects, cubic-bezier
easing, typography composites and shadow composites.

- `primitive.color.*` holds palette values. `color.*` uses aliases, and elevation
  references the semantic shadow colour.
- The default colour value is **dark**. Light and dark aliases also appear in
  `$extensions["com.cosmiklabs.modes"]`. An importer must understand that extension
  to switch modes; do not assume it will select the system's theme automatically.
- Letter spacing is in pixels at the role's reference size; the original em fraction
  is in `$extensions["com.cosmiklabs"].letterSpacingEm`. Reading measure is a number
  of characters.

Validate an import against the resolved JSON and a real screen. Token-format
compatibility alone does not prove a design tool preserved all the intended roles.

## Validation and upgrades

The kit checks defined contrast pairs, sources, generated assets and reference
behavior. [Validation](../specimens/validation.md) states the executed scope and
remaining manual checks. Products still need their own keyboard, responsive,
assistive-technology and browser review.

Follow [governance](../guide/governance.md#upgrading-a-consumer) when upgrading a
pinned kit. Keep framework-specific components in the consumer; bring shared
behavior changes back to the guide and reference rather than editing vendored files.
