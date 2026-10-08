# Product families

**Cosmik is the parent identity.** Each project has its own name, purpose, status and upstream obligations, and a project can have its own visual mood while the endorsement and the interface type stay consistent.

## Who uses what

- **The organisation itself** (the website, the GitHub profile, Cosmik documents) uses the **baseline**: monochrome, Inter and Plex Mono.
- **A product family** (one product or a group of related products, such as HPLX: the engine, its game reimplementations, the launcher and the planned editor) may use a **family kit**: the baseline with a style of its own on top.
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
| HPLX | `tokens/hplx/` | Proposed: warm blacks and bone text, a lantern-amber accent, Spectral headings, status hues |

## Endorsement

Let the project's title lead. Place "A Cosmik project" beneath the title or in the footer, in the `body` type role at a smaller size (14 px on the web, 9.5 pt in a document), at least 16 px or 4 mm from the title block. Never combine the marks into a new logo.

## Names and claims

Use Cosmik in prose and `cosmiklabs` as the handle. HPLX names the product family and its foundational engine. Each game built on it (such as the reimplementation of *Amnesia: The Dark Descent*), the launcher and the planned editor has its own name and status. Never imply official affiliation, ownership of a game's intellectual property, or one licence across all code and assets. Keep original creators' credits and licence notices readable and separate from the Cosmik endorsement.
