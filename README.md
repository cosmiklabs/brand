# Cosmik brand kit

The shared identity and interface system for Cosmik, HPLX and Tectra: approved
marks, semantic tokens, typefaces, practical guidance and interactive references.
The kit defines reusable principles and tokens independently of any website,
application layout or framework. Its examples demonstrate components and states,
not a proposed product design.

**Version: 0.7.0** (`v0.7.0`, 23 October 2026). Consume the matching immutable
release tag; working-tree changes are unreleased until tagged. See
[CHANGELOG.md](CHANGELOG.md).

## Start here

| Your task | Start with |
| --- | --- |
| Build or refine an interface | [Interface](guide/interface.md), [motion](guide/motion.md) and the [interactive reference](specimens/components.html) |
| Integrate tokens or fonts | [Consumer guide](kits/README.md) and the manifest's `entry_points` |
| Use a logo or product identity | The relevant kit below and [identity rules](guide/identity.md) |
| Write product copy | [Voice and imagery](guide/voice.md) and the product's family guide |
| Make an editable document | [Technical-note template](templates/README.md) |
| Improve the kit | [Working on the kit](#working-on-the-kit), [quality review](guide/quality.md) and [governance](guide/governance.md) |

Open `specimens/components.html` in a browser; it works offline. It demonstrates
all three kits in light and dark modes with neutral component examples. Tectra
also has an existing family [review board](kits/tectra/specimen.html) showing its
approved visual direction. Neither reference prescribes a consumer's information
architecture. Interact with examples as well as reading them: source validity
alone does not prove a usable interface.

## Kits

| Kit | Use | Approved identity |
| --- | --- | --- |
| [Cosmik](kits/cosmik/README.md) | Organisation website, profile and documents | Monochrome baseline and accepted Cosmik masters |
| [HPLX](kits/hplx/README.md) | HPLX engine, reimplementations, app and editor | Warm palette, Spectral headings and Glimmer |
| [Tectra](kits/tectra/README.md) | Tectra product, documentation and related presentation | Mineral surfaces, restrained teal and Latch |

Use a family's kit for its product. If family content is presented inside a
Cosmik organisation surface, that enclosing identity stays baseline. Family JSON and Rust outputs include the baseline values; browser
integration loads the baseline CSS before the scoped family CSS.

Approved artwork does not settle product availability, commercial terms or the
organisation wording still under review. The [guide](guide/README.md) and family
pages distinguish those decisions.

## Consume a release

Pin an exact `vX.Y.Z` tag. Never depend on `main` for production assets.

- **Vendor files:** copy the generated outputs and assets you use, along with
  required fonts and their licence notices. Verify their SHA-256 values against
  `asset-manifest.json` from the same tag.
- **Git submodule:** pin its checkout to the exact tag or commit, not a moving
  branch. Keep the checked-in submodule pointer with the consumer change.
- **Git subtree:** import a tagged release when files need to live directly in the
  consumer's history.

Canonical entry points and asset status are in [asset-manifest.json](asset-manifest.json).
Do not choose a deprecated asset just because an old filename still exists. Keep
application components outside the vendored kit. [Web and native examples](kits/README.md)
explain token, theme, font and motion integration.

## Repository map

| Path | Responsibility |
| --- | --- |
| `guide/` | Identity, design and interaction rules; historical documents in `guide/archive/` |
| `kits/<kit>/tokens/` | Token source plus generated CSS, JSON, DTCG JSON and Rust |
| `kits/<kit>/assets/` | Approved sources, generated mark variants and explicitly historical artwork |
| `kits/<kit>/icons/` | Platform assets where supplied; not every family has a current icon pack |
| `fonts/` | Desktop and web typefaces with licence notices |
| `specimens/` | Interactive component reference and its validation record |
| `templates/` | Editable technical-note document and reviewed PDF reference |
| `scripts/`, `tests/` | Dependency-free Node.js generation and validation |
| `asset-manifest.json` | Canonical entry points, roles, hashes and known gaps |

## Working on the kit

Requires Node.js 22 or later. No package installation is needed for the repository
scripts. Read [AGENTS.md](AGENTS.md) and [governance](guide/governance.md) before editing.
Edit token and artwork sources, not their generated outputs. Guidance, specimens,
tests and scripts are hand-maintained. Preserve approved originals and font notices.

```sh
npm run build                # regenerate outputs and refresh permitted manifest hashes
npm run check                # contrast, integrity and regression checks
npm test                     # regression tests alone
npm run check:browser        # interactive references in Chromium
npm run check:reproducible   # rebuild from a clean commit; fail on generated drift
```

Set `BRAND_BROWSER` to an installed Chromium executable when running browser
checks. Set `BRAND_SCREENSHOTS` to retain browser review images. Inspect those images and
exercise the changed flows; passing assertions are not a visual design review.
[CI](.github/workflows/check.yml) runs reproducibility, repository and browser checks.
`.gitattributes` keeps text LF so hashes represent the same committed bytes across
platforms. Release steps and consumer migration belong in [governance](guide/governance.md).

See [specimen validation](specimens/validation.md) for what has actually run and
what remains manual. Browser zoom, assistive technologies and other engines need
appropriate review; the reference cannot certify a consuming product.

## Fonts and rights

Inter, IBM Plex Mono and HPLX's Spectral headings are bundled under SIL OFL 1.1.
Use the supplied files and preserve `fonts/licenses/` notices when redistributing
fonts. Provenance is recorded in the manifest and family sources. No typeface
match or rights clearance for the original Cosmik wordmark is asserted.

[LICENSE.md](LICENSE.md) covers tooling, token data and written guidance under MIT,
with separate restrictions for marks and artwork, and separate font licences. A code licence does
not grant unrestricted use of the identity. The organisation profile is maintained
in the separate `.github` repository.
