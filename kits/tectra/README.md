# Tectra family kit

Theme approved on 17 October 2026: cool mineral surfaces, restrained teal, clean utility typography and construction relationships. The palette, typography and applications have owner approval; rendered consumer accessibility QA remains required. This is a design reference, not a product release.

## Identity and hierarchy

The approved **Latch** is the original mark with only its cut angles corrected, accepted on 17 October 2026. Its exact two paths live in `latch.source.json`; do not close its openings, alter its proportions or use the later closed-fit/airy explorations. Use the supplied symbol or horizontal lockup. The lockup pairs the unchanged symbol with outlined Inter SemiBold; it is a typographic label treatment, not a custom-lettered wordmark. Keep the separate “A Cosmik project” endorsement at least 16 px away.

Use `tectra-latch-dark.svg` / `tectra-lockup-dark.svg` on dark surfaces and the `light` versions on light surfaces. Black and white variants serve monochrome applications. `currentColor` inherits colour when inlined; an external `<img>` does not inherit page text colour. All exports are transparent. Keep at least 8 source units of clear space around visible artwork (one sixth of the symbol's 48-unit visible width). The lockup's 16-unit symbol/label gap is fixed.

Recommended minimum CSS width: symbol 24 px; horizontal lockup 160 px. At 24 px, the narrowest 4-unit feature is 1.5 px; validate rendering on the actual display before using it smaller. No separate optical favicon redraw or platform icon package is approved. Preserve the viewBox, aspect ratio, silhouette and contrast. For linked identities use an accessible name such as “Tectra”; hide a decorative symbol from assistive technology when adjacent text already names the product.

Cosmik navigation, headers and footers keep the baseline. Tectra content uses `data-family="tectra"` in either mode. The kit applies to the family, including its documentation, bindings, adapters and showcase presentation; these are not separate logo systems.

## Organisation wording under review

Do not carry the former “Reimagine / Extend / Create” motto into this family. The owner requested reworking or removing it; no replacement is approved. The Tectra review board contains no organisation motto. Its construction-specific line is a family reference, not a new Cosmik-wide promise.

## Marketing emphasis

Lead with what Tectra helps people create and how the intended authoring workflow supports their ideas. Explain envisioning, planning, building and reviewing in plain language, while distinguishing planned workflow from verified capabilities. Keep artistic direction with the creator.

Business-model labels are not the headline, hero badge or primary reason to use the product. Do not frame pricing as its defining feature. Pricing, access and any free-credit allowance remain undecided; do not promise a free tier, credits, a trial or a price. Explain commercial terms separately when they are settled and relevant.

## Product presentation

Use one Tectra family identity across the product, documentation and interfaces. Leave the user's artistic choices intact. Public copy explains useful outcomes and intended workflow without exposing implementation architecture or repository organisation. Distinguish verified capabilities from plans and avoid implying launch or availability.

Cosmik can include open-source and proprietary products. Do not describe every Cosmik product as open-source or free forever. HPLX's existing no-payment commitment remains specific to HPLX.

## Colour and type

Consume semantic values from [the family tokens](tokens/family.json), never copied hex values. Light and dark roles are complete after generation. Teal marks focus, primary actions and selected emphasis; it does not mean success. Status uses words and structure. The family inherits neutral status roles; it does not invent approval, warning or error colour semantics.

Inter serves both headings and reading/interface text. IBM Plex Mono serves short dimensions, identifiers and technical labels, not paragraphs. No new font is required. Preserve existing font notices. Spacing, controls, radii, breakpoints and motion remain the baseline's.

## Imagery and examples

Lead with understandable constructions and their declared relationships: sections, joined members, precise annotated diagrams and real project views. Vary the subjects so the identity does not imply only buildings, a particular architectural style, or a game engine. A diagram is not a logo. Label illustrative diagrams and hypothetical values; never present them as tested outputs.

Keep a creator's chosen materials, lighting and aesthetic intact. The teal interface must not recolour the work itself. Avoid default blueprint grids, construction-site hazard stripes, horror imagery or decorative cosmic effects. Public examples require an explicit publication decision; the family kit does not authorize publishing private project evidence.

## Motion and accessibility

Use the inherited interface duration and easing, and zero duration under reduced motion. Construction relationships may be illustrated when explaining an edit; do not imply a static snapshot is live editing. Recurring identity stays static. Use words and structural cues in addition to colour, visible keyboard focus, and explicit labels.

## Deliverables and pending assets

- [Offline review board](specimen.html): two-mode visual direction and illustrative applications.
- [Component reference](../../specimens/components.html): choose Tectra to inspect inherited controls.
- Generated CSS, JSON, DTCG and Rust under `tokens/tectra/`.
- [Validation record](validation.md).

The symbol and supplied horizontal lockup are approved for integration. Platform icons, banners, identity animation and an optical small-size redraw remain separate future deliverables. Generate canonical variants with `node scripts/build-tectra-assets.mjs`; Inter's existing font notice continues to apply.

Tectra remains experimental; a brand kit does not certify API stability, host compatibility or software availability. Describe capabilities from current project evidence, separately from identity guidance.
