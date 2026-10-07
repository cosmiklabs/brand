# Typography

| Typeface | For |
|---|---|
| **Inter** | Reading and interface: body text, headings, navigation, buttons, forms |
| **IBM Plex Mono** | Code and short technical metadata (labels, versions, paths) |
| **The COSMIK wordmark** | Separate artwork: no typeface matches it, and none may stand in for it |

The type roles (`body`, `display`, `display-small`, `section`, `card`, `control`, `label`, `identity-label`) and their sizes, weights and line heights are in the [tokens](../tokens/README.md). A product family may give its heading roles a typeface of its own; reading and interface text stays Inter everywhere ([Product families](families.md)).

## Setting type

- Use sentence case and normal tracking. Only short uppercase metadata (the `label` role) gets extra tracking.
- Keep reading columns near 65 characters.
- Never set body copy in all caps, use artificially condensed type, or set long prose in a monospace face.
- Documents use the same families at print sizes; the [technical-note template](documents.md) carries the styles.

## Fonts in the kit

`fonts/` holds the official desktop files (for documents and native apps), web files, and their SIL Open Font License notices. Install the desktop fonts before editing a Word document. Preserve the licence notices whenever font files are redistributed.
