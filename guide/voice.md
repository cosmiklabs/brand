# Voice and imagery

## Useful, direct language

Write like an independent developer sharing useful work: say what a project does,
what works today and what someone can do next. Use “I” for Matthew's personal
updates and “Cosmik” for neutral descriptions. Do not imply a larger team or a
formal company. Use plain American English in interface copy.

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

## Organisation wording under review

The prior “Reimagine / Extend / Create” motto must not be used in new current-facing
material. No replacement motto or organisation-wide descriptor is approved.
“Tools for building interactive worlds.” and “Give worlds shape.” are exploratory
options only, not official copy.

The earlier published description, “Cosmik is an independent open-source gaming
workshop, building games, mods, tools, and modern reimplementations of classic game
technology”, is historical wording under review, not a new-copy template. Cosmik
accommodates open-source and proprietary work; do not describe every product as
open-source or free forever. A product's own commitments remain specific to that
product and are stated in its family guide.

A visual-system change does not announce a launch, price or availability. Each
product's presentation and any unresolved commercial terms are in its family guide,
in its `brand-<product>` repository (for example `cosmiklabs/brand-hplx` and
`cosmiklabs/brand-tectra`). Describe capabilities from verified product evidence
and identify intended workflow as intended.

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
