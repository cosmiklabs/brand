# Typography

| Typeface | Role |
| --- | --- |
| Inter | Reading and utility interfaces; default headings |
| IBM Plex Mono | Code, dimensions and brief technical metadata |
| COSMIK wordmark | Separate artwork; no typeface may stand in for it |

Type sizes, weights, line heights and tracking live in the
[token sources](../kits/README.md). Apply the complete role rather than mixing a
heading's size with a control's spacing. A family may change heading family and
weight; shared reading and utility type remain Inter. A family's own heading
typeface is bundled and licensed in its repository (HPLX's Spectral headings live
in `cosmiklabs/brand-hplx`); this kit bundles only Inter and IBM Plex Mono.

## Hierarchy by context

Use `display` and `display-small` for page-level introductions, `section` for major
content sections and `card` for content headings. Small menus, popovers and tool
panels usually need the `ui` role with a clear weight, not a card-sized heading.
Semantic heading level and visual size are separate decisions: maintain a logical
document outline without making every heading large.

Use `body` for explanations and reading, `control` for standard forms, `ui` for
dense application controls and `ui-small` for brief supporting metadata. The `label`
role is technical metadata, not a universal form-label style. `identity-label` is
reserved for the live Cosmik identity treatment described in [identity](identity.md).

## Readability and layout

- Use sentence case and normal tracking. Reserve the `label` role's uppercase
  tracking for short metadata. Do not set paragraphs in all caps or monospace.
- Bound reading copy by the shared reading-measure token. Allow short help text to
  wrap naturally instead of forcing a small fixed height or shrinking its type.
- Use supplied weights; avoid synthetic bold or artificially condensed text.
  Preserve useful hierarchy when fonts load or a fallback is temporarily shown.
- Keep headings with the content they introduce. Give related text a consistent
  rhythm rather than a different margin for every screen.
- Truncate only when a repeated layout requires it, and provide a way to inspect
  the full value without hover. Never truncate instructions, errors or action labels
  merely to preserve a screenshot's layout.
- Test enlarged text, long names and user text-spacing overrides. Fixed-height
  controls must grow when their labels wrap; they are minimums, not clipping boxes.

## Fonts and documents

Use the bundled desktop fonts for native applications and document editing, and
web fonts with explicit weight declarations for websites. Font loading belongs to
the consumer; token CSS names the families but does not load them. Preserve the
SIL OFL notices whenever font files are redistributed.

Documents use the same families at print sizes. The [technical-note template](documents.md)
carries named paragraph styles; do not approximate them by manually formatting each
paragraph. Verify exports because font substitution changes pagination.
