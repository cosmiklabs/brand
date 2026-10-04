# Cosmik tokens · proposed v0.2

## Use

Open `../specimens/components.html` directly in a browser. Its stylesheet, script, and fonts are local; it requires no server, installation, or internet connection. Controls demonstrate local states only.

For implementation, load `cosmik.css` before your component CSS. Set `data-theme="dark"` or `data-theme="light"` on the root or a containing section. Dark is the default. This explicit theme mechanism is intentional; it does not silently follow or override the operating system preference.

Use role variables such as `--c-bg`, `--c-surface`, `--c-text`, `--c-muted`, and `--c-action-primary-fg`. Do not compose a theme by overriding just its text value, or by applying a dark-only primitive to a light surface. The two theme maps include identical role keys.

The `--c-divider` token is decorative. Use `--c-border` for an essential control boundary. Status treatments always need explicit words; error meaning must never depend on color. The neutral palette provides no separate success, warning, or error colors.

## Build

Run `node tokens/generate-tokens.mjs` from the extracted bundle root. The generator needs Node.js and no third-party packages. It reads `cosmik.source.json`, checks that both theme maps are complete, and writes `cosmik.css` and `cosmik.json` beside it. Do not hand-edit those two generated files.

- `cosmik.source.json`: primitive values, semantic aliases, spacing, typography, layout, and motion source
- `cosmik.json`: resolved semantic colors plus their aliases and supporting values; a simple kit-specific JSON contract, not a claimed DTCG implementation
- `cosmik.css`: generated custom properties and explicit theme scopes
- `../specimens/components.css`: example components, local font definitions, focus, responsive and reduced-motion treatments

Rem values assume a 16 px browser root but leave the user’s browser root setting intact. The proposed scale is a 4 px base with 8, 16, 24, 32, 48, 64, and 96 px intervals. Typography uses body tracking of zero; only all-caps labels use 0.06em. The live identity label is Inter 500, 20 px/1.3, and is not an alternative wordmark.

These are proposed design-system choices. The HTML is a compact reference, not a production UI package. Keep accessible names, error relationships, disabled semantics, focus behavior, and localization under review when adapting a component. See `../references/component-validation.md` for completed checks and remaining browser-QA limitations.

Recheck the defined contrast pairs with `node tokens/validate-tokens.mjs`. This uses Node.js only and does not perform browser or assistive-technology testing.
