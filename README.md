# Cosmik brand kit

The shared Cosmik foundation: the approved Cosmik marks, baseline semantic tokens,
Inter and IBM Plex Mono, a framework-neutral controls layer, practical guidance,
interactive references and the tools product families use to build on it. The kit
defines reusable principles and tokens independently of any website, application
layout or framework. Its examples demonstrate components and states, not a
proposed product design.

Product families live in their own repositories and build on a pinned release of
this one: [`cosmiklabs/brand-hplx`](https://github.com/cosmiklabs/brand-hplx) and
[`cosmiklabs/brand-tectra`](https://github.com/cosmiklabs/brand-tectra). See
[product families](guide/families.md).

**Version: 0.15.1** (`v0.15.1`, prepared 25 October 2026; untagged until released).
Consume an immutable release tag; working-tree changes are unreleased until tagged.
See [CHANGELOG.md](CHANGELOG.md).

## Start here

| Your task | Start with |
| --- | --- |
| Build or refine an interface | [Interface](guide/interface.md), [motion](guide/motion.md) and the [interactive reference](specimens/components.html) |
| Integrate tokens, controls or fonts | [Consumer guide](kits/README.md) and the manifest's `entry_points` |
| Build or upgrade a product family | [Product families](guide/families.md) and [building a family](kits/README.md#building-a-family) |
| Use a logo | The [Cosmik kit](kits/cosmik/README.md) and [identity rules](guide/identity.md); a product's marks are in its `brand-<product>` repository |
| Write product copy | [Voice and imagery](guide/voice.md) and the product's family guide |
| Make an editable document | [Technical-note template](templates/README.md) |
| Improve the kit | [Working on the kit](#working-on-the-kit), [quality review](guide/quality.md) and [governance](guide/governance.md) |

Open `specimens/components.html` in a browser; it works offline. It demonstrates
the baseline and the shared controls in light and dark modes with neutral component
examples. It does not prescribe a consumer's information architecture. Interact
with examples as well as reading them: source validity alone does not prove a
usable interface.

## What lives here

| Part | Use | Status |
| --- | --- | --- |
| [Cosmik kit](kits/cosmik/README.md) | Organisation website, profile and documents; the baseline every family extends | Monochrome baseline and accepted Cosmik masters |
| [Controls layer](kits/README.md#shared-controls) | Buttons, icon buttons, toolbars, segmented controls, links, selects, text fields, chips and status labels from semantic tokens, with opt-in glass variants for floating controls | Shared reference implementation |
| [Family tools](guide/families.md#how-a-family-builds-on-the-baseline) | `scripts/vendor.mjs` and `scripts/family.mjs` for `brand-<product>` repositories | Contract enforced by the baseline generator |

Use a family's kit, from its own repository, for its product. If family content is
presented inside a Cosmik organisation surface, that enclosing identity stays
baseline. Family JSON and Rust outputs include the baseline values; browser
integration loads the baseline CSS before the scoped family CSS.

Approved artwork does not settle product availability, commercial terms or the
organisation wording still under review. The [guide](guide/README.md) and family
repositories distinguish those decisions.

## Consume a release

Pin an exact `vX.Y.Z` tag. Never depend on `main` for production assets.

- **Vendor files:** copy the generated outputs and assets you use, along with
  required fonts and their licence notices. Verify their SHA-256 values against
  `asset-manifest.json` from the same tag. Or use `scripts/vendor.mjs`, which
  copies the release's `distribution` set and writes a lock that
  `vendor.mjs verify` checks. Products take their family's product brand
  repository the same way; it carries this foundation with its own lock. See
  [vendoring a release](kits/README.md#vendoring-a-release).
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
| `kits/cosmik/tokens/` | Baseline token source plus generated CSS, JSON, DTCG JSON and Rust |
| `kits/cosmik/components/` | The framework-neutral controls layer |
| `kits/cosmik/assets/` | Approved sources, generated mark variants and explicitly historical artwork |
| `kits/cosmik/icons/` | Cosmik platform icons |
| `fonts/` | Desktop and web typefaces with licence notices |
| `specimens/` | Interactive component reference and its validation record |
| `templates/` | Editable technical-note document and reviewed PDF reference |
| `scripts/`, `tests/` | Dependency-free Node.js generation, validation and the family tools; `tests/fixtures/` holds a fictional test-only family |
| `asset-manifest.json` | Canonical entry points, roles, hashes and known gaps |

## Working on the kit

Requires Node.js 22 or later. No package installation is needed for the repository
scripts. Read [AGENTS.md](AGENTS.md) and [governance](guide/governance.md) before editing.
Edit token and artwork sources, not their generated outputs. Guidance, specimens,
tests and scripts are hand-maintained. Preserve approved originals and font notices.

```sh
npm run build                # regenerate baseline outputs and refresh permitted manifest hashes
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

Inter and IBM Plex Mono are bundled under SIL OFL 1.1. Use the supplied files and
preserve `fonts/licenses/` notices when redistributing fonts. Provenance is recorded
in the manifest. A family's own typefaces, such as HPLX's Spectral headings, are
bundled and licensed in its repository. No typeface
match or rights clearance for the original Cosmik wordmark is asserted.

[LICENSE.md](LICENSE.md) covers tooling, token data and written guidance under MIT,
with separate restrictions for marks and artwork, and separate font licences. A code licence does
not grant unrestricted use of the identity. The organisation profile is maintained
in the separate `.github` repository.
