# Product families

**Cosmik is the parent identity.** Each project has its own name, purpose, status and upstream obligations, and a project can have its own visual mood while the endorsement and the interface type stay consistent.

## Who uses what

- **The organisation itself** (the website, the GitHub profile, Cosmik documents) uses the **baseline**: monochrome, Inter and Plex Mono.
- **A product family** (one product or a group of related products, such as HPLX: the engine, its game reimplementations, the desktop app and the planned editor) may use a **family kit**: the baseline with a style of its own on top.
- **A product page on the Cosmik website** may apply its family to its own content, while the site's header, navigation and footer stay baseline, so it reads as a product hosted by Cosmik.

## What a family may change

A family kit is a file (`tokens/<family>/family.json`) that the build merges over the baseline. The build **refuses** a family that breaks these rules ([tokens/README.md](../tokens/README.md) has the detail):

- **Must keep** every baseline role and both modes, and pass every baseline contrast pair.
- **May change** the colour of any role, through its own palette, and the typeface of its heading roles.
- **May add** roles of its own (an accent, status hues, elevation for menus and dialogs) and the fonts its headings need, with their licences.
- **Never changes** the interface type (reading text, controls, labels), spacing, layout, radii, breakpoints and motion, and never the emblem, the name or the endorsement.

Keep a family's genre imagery inside it: horror imagery belongs to a horror project, not to Cosmik.

| Family | Kit | Status |
|---|---|---|
| HPLX | `tokens/hplx/` | Approved (2026-10-15): warm blacks and bone text, a lantern-amber accent, Spectral headings, status hues |

## Endorsement

Let the project's title lead. Place "A Cosmik project" beneath the title or in the footer, in the `body` type role at a smaller size (14 px on the web, 9.5 pt in a document), at least 16 px or 4 mm from the title block. Never combine the marks into a new logo.

## Names and claims

Use Cosmik in prose and `cosmiklabs` as the handle. HPLX names the product family and its foundational engine. Each game built on it (such as the reimplementation of *Amnesia: The Dark Descent*), the desktop app and the planned editor has its own name and status. Never imply official affiliation, ownership of a game's intellectual property, or one licence across all code and assets. Keep original creators' credits and licence notices readable and separate from the Cosmik endorsement.

## Tecton family

The mineral-and-teal theme was approved on 17 October 2026. Tecton inherits Inter headings and all baseline utility, layout and motion rules. No symbol has been selected. See [family source](../tokens/tecton/family.json), [family guide](../assets/tecton/README.md) and [offline review board](../specimens/tecton.html). The logo remains pending, and rendered consumer accessibility QA is still required.

Lead public-facing copy with creative benefits and the intended authoring workflow. Keep business-model facts in governance or relevant commercial details, not hero labels. Pricing, access and any free-credit allowance are undecided.

### Tecton presentation

Describe intended creative outcomes and workflow without exposing implementation architecture or repository organisation. Use one Tecton identity throughout. Cosmik can include open-source and proprietary products; HPLX’s no-payment commitment remains separate. No pricing, launch or availability is announced by this kit.
