# Identity

## Sources of truth

Use one approved source for each identity role. Keep the original compositions as references; never silently replace them with a generated or traced interpretation.

| Asset | Status | Use |
|---|---|---|
| Original square and banner (`assets/approved-raster/`) | Approved raster compositions | Intact, proportionally scaled, on their black background |
| Traced emblem and its exact reverses (`assets/vector/`) | Accepted vector master | The reusable symbol; proof it in the final medium |
| App icons (`icons/`) | Generated from the vector master | Executables, windows, bundles and touch icons |
| Generated light PNGs (`assets/archive/`) | Archived alternatives | Reference only: their geometry differs from the original |
| Outlined wordmark and horizontal lockup | Not yet made | Do not recreate them (see below) |

**One shape across colours.** The vector reverses use the same geometry with a different fill; derive every transparent and solid-background export from the accepted vector source, never from the archived PNGs.

**Never** redraw, stretch, rotate, recolour outside the supplied variants, crop into the flare, add effects, or recreate the COSMIK wordmark in another typeface (Inter included).

## Names

| Form | Use |
|---|---|
| **Cosmik** | In prose, and as the short name |
| **Cosmik Labs** | The long form, where a formal name reads better |
| **CosmikLabs** | The full name written as one word |
| **cosmiklabs** | The handle: the GitHub organisation, URLs, package and file names |

Cosmik is a personal GitHub organisation, not a company: never imply a larger team or a formal company.

## The live identity label

Until the wordmark exists, interfaces may show the emblem followed by the word "Cosmik" set live in the `identity-label` type role (Inter Medium), centred vertically beside a 48 px emblem with a 12 px gap. It is an interface label, not a replacement for the COSMIK wordmark: never use it as a logo on its own.

## Clear space and size

- **Emblem:** clear space of at least 10% of its visible flare-to-flare width on every side. The supplied square canvas already exceeds this.
- **Banner:** keep 0.25 S of clear space around the complete visible lockup, where S is the visible emblem height. The banner's gap (about 0.15 S) and letter height (about 0.39 S) describe the artwork; never rebuild it from these ratios.
- **Sizes on screen:** 48 px for brand-led placements, 32 px for constrained avatars. At 16–24 px the flare loses definition: no optically redrawn small master exists yet. Use the full banner from 360 px wide.
- **Raster exports:** the numeric suffix is the full canvas size in physical pixels; show a 96 px export at 48 CSS px for a 2× display.
- **Print:** start at a 15 mm emblem or a 75 mm banner and proof on the actual stock. These are provisional recommendations, not reproduction limits.
