# Consuming the kit

Use the Cosmik baseline for organisation surfaces and a product's family for that
product. This repository holds the baseline, the [Cosmik identity](cosmik/README.md),
the shared controls and the tools that build families. Product families live in
their own repositories, such as `cosmiklabs/brand-hplx` and `cosmiklabs/brand-tectra`;
read that family's guide before selecting its artwork. Pin a release and resolve
deliverables through `asset-manifest.json` from that same release. The formats
below are platform adapters for the same visual contract; none requires a
particular framework, page composition or application workflow.

## Source and output contract

| Kit | Token source | Generated output stem |
| --- | --- | --- |
| Cosmik baseline | `cosmik/tokens/source.json` | `cosmik/tokens/cosmik` |
| A product family | `tokens/family.json` in its `brand-<product>` repository | `tokens/<id>` in that repository |

Each stem provides `.css`, `.json`, `.tokens.json` and `_tokens.rs`. Edit the source
and run `npm run build` here, or `family.mjs build` in a family repository; never
edit an output. Generated JSON and Rust resolve the family over the baseline and
are complete on their own. Family CSS is scoped and requires the baseline CSS for
shared values. The baseline's token version (in `source.json`) and a family's
revision are separate from this repository's release version; a family's
`extends` names the baseline token version it resolves against.

Values are authoritative in the sources, not in hand-copied lists of hex codes or
pixel sizes. Use semantic roles for surfaces, text, boundaries, selection, actions,
inputs and status. Primitives document the palette; they are not component roles.
`border` is an essential boundary; `divider` is decorative. Use type, spacing,
layout, radius and motion tokens alongside colour roles.

## Vendoring a release

Every Cosmik brand repository publishes a **distribution**: `distribution.files` in
its `asset-manifest.json` lists each file a consumer copies with its SHA-256. One
tool, `scripts/vendor.mjs` from this repository, copies any such release and
verifies it later. A product brand carries it at `vendor/brand/scripts/vendor.mjs`.
Run it from the release you sync, so the checks are that release's own. From this
repository:

```sh
node <brand>/scripts/vendor.mjs sync --from <brand> --into vendor/brand
node vendor/brand/scripts/vendor.mjs verify vendor/brand
node vendor/brand/scripts/vendor.mjs verify vendor/brand --release <brand>
```

`sync` refuses a checkout that has local changes or whose HEAD is not exactly the
`v<version>` tag, checks every byte against the manifest before copying, and
writes `<short name>.lock.json` beside the files: the package name without its
scope, so `brand.lock.json` for `@cosmiklabs/brand` and `brand-tectra.lock.json`
for `@cosmiklabs/brand-tectra`. `verify` fails on any missing, extra or changed
file; `--release` also proves the lock against the tag's own bytes, so an edited
lock cannot bless altered files.

**A product consumes its product brand, not this repository.** The Tectra app and
`website-tectra` sync `cosmiklabs/brand-tectra`; an HPLX product syncs
`cosmiklabs/brand-hplx`. A product brand's distribution includes the foundation it
vendored, unchanged, with its lock, so one sync brings both layers at the versions
the family was built and checked against:

```sh
node <brand-tectra>/vendor/brand/scripts/vendor.mjs sync --from <brand-tectra> --into vendor/brand-tectra
node vendor/brand-tectra/vendor/brand/scripts/vendor.mjs verify vendor/brand-tectra
```

```text
vendor/brand-tectra/
  brand-tectra.lock.json        the product brand release: tag, commit, every file
  tokens/tectra.css  assets/  README.md  LICENSE.md
  vendor/brand/
    brand.lock.json             the foundation release the family was built on
    kits/cosmik/tokens/cosmik.css  kits/cosmik/components/controls.css  fonts/  guide/
```

`verify` checks the outer lock and then every lock it finds inside the synced set,
so a change to `vendor/brand-tectra/vendor/brand/kits/cosmik/tokens/cosmik.css` is
named against both releases. `--release <brand-tectra checkout>` proves the outer
lock; the nested lock is part of those bytes, and the product brand's CI proves it
against this repository's tag. Never sync this repository separately beside a
product brand: the family's tokens were checked against its own vendored baseline.

**Organisation surfaces consume this repository directly.** The Cosmik website and
other baseline-only consumers sync `cosmiklabs/brand` into `vendor/brand/`. A
surface that also shows a product family takes that family's product brand and
uses its `vendor/brand/` layer instead of a second copy of the baseline.

Locks written by brand 0.8.0 (`lockfileVersion` 1) still verify. Re-sync to get
`lockfileVersion` 2, which also records the package name.

## Browser integration

The token CSS supplies custom properties, not resets, font loading or component
styles. Define the bundled font faces with the provided weights, apply type roles in
component CSS and preserve the corresponding font notices. Load the baseline first,
then any family CSS, then the optional [controls layer](#shared-controls):

```html
<link rel="stylesheet" href="vendor/brand/kits/cosmik/tokens/cosmik.css">
<link rel="stylesheet" href="tokens/example.css"> <!-- a family's own output, if any -->
<link rel="stylesheet" href="vendor/brand/kits/cosmik/components/controls.css">
<section data-family="example" data-theme="dark" data-motion="system">
  <button class="c-button c-button--primary" type="button">Apply changes</button>
</section>
```

Paths depend on how you consume a release; `vendor/brand/` is the layout
`scripts/vendor.mjs` produces from this repository. From a product brand synced
into `vendor/brand-<product>/`, the three stylesheets are
`vendor/brand-<product>/vendor/brand/kits/cosmik/tokens/cosmik.css`,
`vendor/brand-<product>/tokens/<id>.css` and
`vendor/brand-<product>/vendor/brand/kits/cosmik/components/controls.css`.
Without a family, omit its stylesheet and scope.

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

## Shared controls

`components/controls.css` (in `kits/cosmik/`) styles common controls using only
semantic tokens, so the same classes follow the baseline, any family scope, both
themes and the motion policy. It is framework-neutral CSS: use the classes on
native elements, or copy the role bindings into your platform's components. The
behavior each state must have is defined once, in the
[interface guide](../guide/interface.md#shared-controls); the
[component reference](../specimens/components.html) uses these classes throughout.

| Class | Element | States handled |
| --- | --- | --- |
| `c-button c-button--primary` | `<button>` (or `<a>` that navigates) | Hover, pressed, focus, disabled, `aria-disabled`, `aria-busy` |
| `c-button c-button--secondary` | `<button>` | As primary |
| `c-button--dense` | Added to a button | `control-dense` height and the `ui` type on fine pointers; `control-min` on touch |
| `c-button--large` | Added to a button | A taller target (`control-min` + 3 × `space-base`) and wider padding for a prominent call to action |
| `c-button--quiet` | Added to a button inside a toolbar or bounded group | No fill or boundary until hover; pressed, focus, disabled as other buttons |
| `c-button--icon` | Added to an icon-only button, with an emphasis and optionally `--dense` | Square target (`control-dense` on fine pointers when dense, `control-min` on touch); needs an accessible name and a tooltip |
| `c-button[aria-pressed]` | A toggle button | Pressed: the selected roles plus a drawn bar, kept under hover |
| `c-toolbar` | `<div role="toolbar">` or `role="group"`, with an accessible name | Bordered surface with `space-base` padding and gaps; `c-toolbar--vertical` stacks it |
| `c-segmented`, `c-segmented__option` | `<div role="radiogroup">` with `<button role="radio" aria-checked>` options (or `aria-pressed` buttons) | Equal option widths, hover, pressed, selected roles and bar, focus, disabled; `c-segmented--dense` as dense buttons |
| `c-link` | `<a>` in text | Underlined; hover, pressed, focus |
| `c-input` | `<input>`, `<textarea>` | Placeholder, hover, focus, `aria-invalid`, disabled |
| `c-select` | `<span class="c-select"><select>…</select></span>` | Drawn chevron; hover, focus, `aria-invalid`, disabled |
| `c-input--dense`, `c-select--dense` | Added to the input, or to the select's wrapper | `control-dense` and the `ui` type on fine pointers; `control-min` and the `body` type on touch, so focus never zooms |
| `c-chip` | `<button aria-pressed>` | Dense target, hover, pressed, selected check, focus, disabled |
| `c-status` | `<span>` | Neutral status label: `label` type, pill shape, no interaction states or pointer cursor |
| `c-status--dense` | Added to a status label | The same pill, roles and `label` family, tracking and case at the `ui-small` size with tighter padding, for dense rows, headers and cards; still no interaction states |
| `c-focus-ring` | Any other custom focusable control | The shared focus-visible ring |
| `c-glass` | A floating container over busy content: a menu, popover, hint or label | Glass tint, edge sheen, blurred backdrop; `muted` resolves to `glass-muted` inside; solid fallbacks |
| `c-toolbar--glass` | Added to a toolbar | The toolbar on glass; its quiet buttons and segmented controls need nothing more |
| `c-button--glass` | Added to a button that floats alone, instead of `--secondary`; with `--icon` and `--dense` as needed | Glass at rest; hover, pressed, toggle (opaque selected roles and bar), disabled as other buttons; focus ring over a solid halo |
| `c-segmented--glass` | Added to a segmented control that floats alone | Its own glass group with `space-base` padding |
| `c-select--glass` | Added to the select's wrapper, with `--dense` as needed | The trigger on glass with the chevron in `text`; the opened list stays the platform's |
| `data-glass="flat"` / `"solid"` | On a region that holds glass controls | Flat keeps the tint without the blur; solid paints the solid surface |
| `data-glass-tone="dark"` / `"light"` | On a glass surface or a region | That mode's roles for the surface and its contents, whatever the page's theme; choose it from the backdrop's luminance against `--c-glass-tone-threshold` |

```html
<label for="order">Order</label>
<span class="c-select"><select id="order"><option>Newest first</option></select></span>

<div role="group" aria-label="Filters">
  <button type="button" class="c-chip" aria-pressed="true">Open</button>
  <button type="button" class="c-chip" aria-pressed="false">Closed</button>
</div>
<span class="c-status"><span aria-hidden="true">◷</span> Saved</span>
<span class="c-status c-status--dense">Running</span>

<div class="c-toolbar" role="toolbar" aria-label="Tools">
  <button type="button" class="c-button c-button--quiet c-button--icon c-button--dense"
    aria-label="Grid lines" aria-pressed="true"><svg aria-hidden="true">…</svg></button>
  <button type="button" class="c-button c-button--quiet c-button--dense" tabindex="-1">View</button>
</div>
<div class="c-segmented c-segmented--dense" role="radiogroup" aria-label="Layout">
  <button type="button" class="c-segmented__option" role="radio" aria-checked="true">Grid</button>
  <button type="button" class="c-segmented__option" role="radio" aria-checked="false" tabindex="-1">List</button>
</div>

<a class="c-button c-button--primary c-button--large" href="#start">Get started</a>
<span class="c-select c-select--dense"><select aria-label="Rows">…</select></span>

<!-- Floating over a canvas or media: glass, opt-in per surface, toned by what is behind it. -->
<div class="c-toolbar c-toolbar--glass" data-glass-tone="light" role="toolbar" aria-label="View tools">
  <button type="button" class="c-button c-button--quiet c-button--icon c-button--dense"
    aria-label="Grid lines" aria-pressed="true"><svg aria-hidden="true">…</svg></button>
</div>
<button type="button" class="c-button c-button--glass c-button--dense">View</button>
<span class="c-select c-select--dense c-select--glass"><select aria-label="Scale">…</select></span>
<div class="c-segmented c-segmented--dense c-segmented--glass" role="radiogroup" aria-label="Distance">…</div>
<div class="c-glass" role="menu" aria-label="Display">…</div>
```

Sizes are mechanisms, not defaults: `--dense` suits mouse-driven application
toolbars and compact footers, `--large` a page's one prominent call to action,
`c-status--dense` a status inside a dense row, header or card;
the product chooses where each appears. A status label must never look like a
control, so it takes the `label` type role and the full radius, which no control
uses, and has no hover, pressed or focus state; do not make it a link or button.

Icon-only buttons and options need an accessible name and a tooltip that opens on
hover and keyboard focus; the layer styles the control, not the tooltip, the roving
tab stop or the arrow keys, which remain the consumer's. A segmented control sizes
every option to the widest, so a changing selection never resizes its toolbar;
hiding labels at narrow widths is the consumer's choice, made for a whole toolbar at
once. Pressing never scales or moves a control: hover and pressed change colour only.
Hover treatments apply only under `(hover: hover)`, so a tap on a touch screen
never leaves a control looking hovered; pressed (`:active`) feedback applies on
every input. Gate your own hover styles the same way.

Glass is a mechanism for controls that float over busy or moving content, not a
default: the product opts in per surface and keeps reading content, forms, dense
lists, dialogs and side panels solid ([interface](../guide/interface.md#shared-controls)).
Glass surfaces read the `glass`, `glass-sheen`, `glass-sheen-low`, `glass-border`
and `glass-muted` roles and the `--c-glass-blur`, `--c-glass-saturation` and
`--c-glass-sheen-angle` tokens; a family may set the roles, not the blur,
saturation or angle. The edge is a sheen, not a border: a 1px gradient ring drawn
by each surface's `::before` (a glass select draws it on its wrapper), masked to
the rim so it follows any radius. Each surface is therefore positioned (with zero
specificity, so your positioning wins) and keeps its `::before` free; a glass
container that scrolls should scroll an inner element, because overflow clips the
ring. The solid fallbacks draw a plain `glass-border` instead. Hover and pressed on glass
tint it with `glass-hover` and the deeper `glass-active` (a glass button layers the
tint over its fill; quiet buttons and segment options inside a glass surface take
the tint alone). Each mode is a glass tone: `data-glass-tone` on a
surface or region gives it that mode's roles regardless of the page's theme.
Over content whose brightness varies, the consumer chooses the tone: measure the
relative luminance behind each surface (a small downscaled copy of the frame is
enough), take `light` at or above `--c-glass-tone-threshold` and `dark` below it,
and keep the current tone until the luminance passes the threshold by
`--c-glass-tone-hysteresis`, within which both tones are checked to hold. JSON,
DTCG and Rust carry the same `toneThreshold` and `toneHysteresis`. Without a tone a
surface follows the page's theme. Where `backdrop-filter` is unsupported, under
`prefers-reduced-transparency: reduce`, inside `data-glass="solid"` and in forced
colours they paint the solid surface (`--c-elevation-1-surface`, else `surface`);
`data-glass="flat"` keeps the tint and drops the blur, for a region where the blur
costs too much. Backdrop blur is recomposited whenever the content behind it
changes, so measure it over a moving canvas. Selection on glass stays opaque. A
portalled menu or popover takes `c-glass` itself and needs its trigger's theme
and family, like any portal.

Fields fill their container; size the container. The select wrapper draws a
stroked chevron with borders, inset by `--c-space-4`, that ignores pointer input;
the native `<select>` keeps its semantics and keyboard behavior. Forced-colour
modes keep borders, the chevron, the selection check and bar and the focus ring in
system colours. Transitions use `--c-motion-duration` and `--c-motion-easing`, so a
reduced-motion scope removes them. The layer contains no resets, layout, font
loading or product defaults such as a theme; your own CSS loads after it.
Field labels, error text and pending announcements remain the consumer's markup.

## Building a family

The [family guide](../guide/families.md) explains the model and what the contract
allows. In a `brand-<product>` repository, with a release vendored at `vendor/brand/`:

```sh
# Pin a release: the brand checkout must be clean and exactly at a vX.Y.Z tag.
node <brand>/scripts/vendor.mjs sync --from <brand> --into vendor/brand
node vendor/brand/scripts/vendor.mjs verify vendor/brand          # in CI
node vendor/brand/scripts/vendor.mjs verify vendor/brand --release <brand>  # proves the lock against the tag

node vendor/brand/scripts/family.mjs build .   # writes tokens/<id>.css, .json, .tokens.json, _tokens.rs
node vendor/brand/scripts/family.mjs check .   # in CI: contract, extends, drift and contrast
```

`vendor/brand/brand.lock.json` records what was vendored:

```json
{
  "lockfileVersion": 2,
  "package": "@cosmiklabs/brand",
  "repository": "cosmiklabs/brand",
  "tag": "v0.9.0",
  "commit": "<40-character commit>",
  "files": {
    "kits/cosmik/tokens/source.json": "<sha256>",
    "scripts/family.mjs": "<sha256>"
  }
}
```

A family repository is itself a release that products sync, so it follows the
[distribution contract](../guide/families.md#publishing-a-product-brand): its
`asset-manifest.json` lists every file a consumer needs under `distribution`,
including every file under `vendor/brand/` and its lock.

Never edit vendored files; `verify` fails on any change, addition or removal.
Keep the family's guide, marks, fonts and their notices beside `tokens/`, outside
`vendor/brand/`. The vendored `scripts/font-outlines.mjs` and
`scripts/vector-raster.mjs` are available to a family's own mark builders.

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
manifest's canonical artwork entry points; Cosmik has platform icons in
`cosmik/icons/`. A family's artwork and icon status are recorded in its own
repository. Do not infer a current deliverable from a directory name.

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
pinned kit, and the [0.8.0 migration notes](../CHANGELOG.md#080--24-october-2026)
when moving from a release that still contained the HPLX and Tectra kits.
Keep framework-specific components in the consumer; bring shared
behavior changes back to the guide and reference rather than editing vendored files.
