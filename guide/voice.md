# Voice and imagery

## Useful, direct language

Write like an independent developer sharing useful work: say what a project does,
what works today and what someone can do next. Use “I” for Matthew's personal
updates and “Cosmik” for neutral descriptions. Do not imply a larger team or
write like a press release. Use plain American English in interface copy.

Labels name the task: “Export”, “Save changes”, “Choose folder”. Use sentence case,
specific verbs and familiar nouns. Explain an unfamiliar setting directly beside
it; a tooltip may carry optional detail, but not the information needed to decide.
Do not expose internal service names or implementation details unless they help the
person solve the problem.

| Situation | Say | Avoid |
| --- | --- | --- |
| Pending work | What is happening, with real progress when known | A fake percentage or reassurance unsupported by the operation |
| Error | What failed, what was preserved and the next useful action | “Something went wrong” without recovery or blaming the user |
| Empty collection | What belongs here and the relevant first action | Repeated onboarding copy after every empty search |
| Confirmation | The item and consequence of the action | An unexplained “Are you sure?” |
| Product update | What now works, its build or version and remaining limits | Announcing a plan as a shipped feature |

Do not repeat the same explanation in a heading, subtitle and helper. Short does
not mean cryptic: keep important consequences and limitations visible. Product
copy can be confident without exaggerated claims or decorative slogans.

## Organisation positioning

Cosmik is an independent software company building tools for creating 3D structures
and playable stories. Use this as a factual description, not a motto that must
appear on every surface. The company is owned and run by Matthew Downs.

Lead a Cosmik introduction with what the company makes, then identify the products
and their different purposes. A newcomer should not need to recognize HPLX or
Tectra before understanding the company. About and contact pages explain who is
behind the work; design-system implementation belongs in the brand reference.

Cosmik accommodates open-source and proprietary work. Do not describe the whole
company as open-source, free forever, a game studio or a collection of mods. Each
product's own availability and licensing commitments remain specific to it. The
former “Reimagine / Extend / Create” motto is retired; no replacement motto is
needed to explain the company.

Use Cosmik for the company and the product's own name for its customer-facing
story. Keep the parent endorsement secondary. The [product-family guidance](families.md#marketing-architecture)
sets the relationship between company, product and reference sites.

## Product messages

Explain the person's task before the implementation. A product introduction
answers four questions: who is it for, what can they do, why is that useful, and
what can they do next? Give the reader a concrete example before listing features.
Product-specific wording and commercial constraints live in its `brand-<product>`
guide; shared typography does not make the products interchangeable.

| Content | Rule |
| --- | --- |
| Headline | Name a useful outcome; let a nearby plain-language description identify the product category and audience. |
| Capability | Describe verified behavior at its actual scope. Avoid “always”, “every”, “exactly” and “never” unless evidence supports the full promise. |
| Demonstration | Prefer a real workflow and representative result. Label illustrations, prepared examples and hypothetical data where they appear. |
| Availability | Distinguish in development, preview access and an available release. A working feature in a private build is not public availability. |
| Action | Offer a working destination that matches the label. “Download” needs an available artifact; “Get updates” needs a maintained update destination. |
| Contact | Use a monitored address or working form. State a response window only when it can be maintained; do not imply a support team. |
| Pricing and licence | Use the product's settled terms. Never infer a trial, free allowance, subscription or open-source licence from another product. |

Do not invent testimonials, adoption numbers, customers, benchmark results or
release dates. A restrained “In development” status is enough; the rest of the page
can still explain useful work confidently. Keep requirements visible near the
relevant decision without making the opening paragraph a disclaimer.

## Imagery and icons

Use real project screenshots, diagrams or relevant artwork when they explain the
work. Label illustrative examples and hypothetical data. Do not publish private
project screenshots without authorization. Preserve proportions and crop only when
the essential information remains visible.

Keep genre imagery inside the project it belongs to. Avoid generic space wallpaper,
decorative starfields and artificial glow as default Cosmik styling. A product's
interface frames the user's work; its accent colour must not recolour that work.

Utility icons use a consistent stroke family and alignment. Give meaningful icons
an accessible name through their control; hide decorative icons from assistive
technology. Pair unfamiliar symbols with words. Use the same icon for the same
action across the product, and distinguish different actions even when their
names are similar. Icons and marks are different assets: do not adapt a logo into
a generic toolbar glyph.

## Identity animation

A centred emblem sliding left to reveal lettering remains an exploration, not an
approved deliverable. Keep recurring branding static. A logo reveal must never
delay essential content. All interface motion, including reduced-motion behavior,
follows the dedicated [motion guide](motion.md).
