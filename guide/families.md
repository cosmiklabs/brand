# Product families

Cosmik is the parent identity. A product has its own name, purpose and obligations,
while shared utility typography, controls and interaction behavior make the family
of products feel related.

## Where families live

This repository holds only the shared Cosmik foundation: the baseline tokens, the
Cosmik marks, Inter and IBM Plex Mono, the [controls layer](interface.md#shared-controls),
this guide and the tools that build and check a family. Each product family lives
in its own public `brand-<product>` repository and builds on a pinned release of
this kit:

| Family | Repository | Holds |
| --- | --- | --- |
| HPLX | [`cosmiklabs/brand-hplx`](https://github.com/cosmiklabs/brand-hplx) | HPLX tokens, Glimmer, historical Ember, Spectral headings and the HPLX guide |
| Tectra | [`cosmiklabs/brand-tectra`](https://github.com/cosmiklabs/brand-tectra) | Tectra tokens, Latch, its review board and the Tectra guide |

Each family's repository is the authority for its identity, approvals, artwork,
product wording and any fonts only it uses. This guide sets what every family
shares. Releases up to 0.7.0 of this kit also carried both families under
`kits/hplx/` and `kits/tectra/`; see the [changelog](../CHANGELOG.md) for migration.

## Choose the right scope

| Surface | Kit |
| --- | --- |
| Organisation website, profile or document | Cosmik baseline (this repository) |
| A product's interfaces, adapters and documentation | That product's family, from its `brand-<product>` repository |
| Product content within an organisation surface | Family identity within the baseline organisation scope |

Use one family identity across a product's interfaces, adapters and documentation;
repository boundaries are not a reason to create more logos. Keep the user's
content and artistic choices independent of the surrounding interface palette.

These are identity scopes, not page-layout requirements. The kit does not require
an organisation header, navigation shell or footer in a product interface.

## How a family builds on the baseline

A family repository never copies the contract, generator or contrast pairs into
code of its own. It vendors them from a tagged release and runs them unchanged, so
"builds on Cosmik" is something a check can prove rather than a claim:

1. **Provenance.** `node scripts/vendor.mjs sync --from <brand checkout> --into vendor/brand`
   copies the release's distribution (listed with hashes under `distribution` in
   [asset-manifest.json](../asset-manifest.json)) and writes `vendor/brand/brand.lock.json`
   with the package, repository, tag, commit and SHA-256 of every file. The checkout must be
   clean and exactly at a `vX.Y.Z` tag. `node vendor/brand/scripts/vendor.mjs verify vendor/brand`
   fails if any vendored file is missing, extra or changed. Adding
   `--release <brand checkout>` also proves the lock against the tag itself, so an
   edited lock cannot bless altered files.
2. **Conformance.** `node vendor/brand/scripts/family.mjs build .` writes
   `tokens/<id>.css`, `.json`, `.tokens.json` and `_tokens.rs` from the family's
   `tokens/family.json`, resolved over the vendored baseline. `node vendor/brand/scripts/family.mjs check .`
   fails when the family breaks the contract, when `extends` does not name the
   vendored baseline, when committed outputs differ from regeneration, or when any
   defined contrast pair fails, including pairs for the family's extension roles.

Run both checks in the family's CI. Generated headers name the brand release that
produced them, so an upgrade shows up as a reviewed diff in the family repository.
The [consumer guide](../kits/README.md#building-a-family) has the commands in full.

## Publishing a product brand

Products consume their family from its `brand-<product>` repository, never from
this one, with the same `vendor.mjs` (see the
[consumer guide](../kits/README.md#vendoring-a-release)). A product brand is therefore
a release in its own right and must follow the distribution contract:

- **`package.json`** has `name` (`@cosmiklabs/brand-<product>`; the part after the
  scope names the consumer's lock, `brand-<product>.lock.json`), `version` equal to
  the family's `version` in `tokens/family.json`, and `repository`
  (`{"type": "git", "url": "git+https://github.com/cosmiklabs/brand-<product>.git"}`).
- **Releases** are annotated `v<version>` tags on a clean, committed tree.
- **`asset-manifest.json`** has a `brand` section naming the vendored foundation
  (`repository`, `tag`, `commit`, `directory` and `lock`), and a `distribution`
  section whose `files` list, each `{ "path", "sha256" }`, every file a consumer
  needs: the family's generated tokens, marks, icons, fonts and their licence
  notices, `LICENSE.md`, the guide, **and every file under `vendor/brand/`,
  including `vendor/brand/brand.lock.json`**. The foundation travels unchanged with
  its lock, so a consumer's `verify` checks both layers. No top-level file may end
  in `.lock.json`; that name is the consumer's lock.
- **The build derives `brand` and the distribution** from the lock and the files,
  and the check fails when the manifest, the lock and the bytes disagree. CI runs
  `vendor.mjs verify vendor/brand --release <brand checkout at the locked tag>`.

## What the contract allows

The contract is enforced by `familySource` in `scripts/generate-tokens.mjs`; the
table describes it, the code decides.

| A family | Contract |
| --- | --- |
| May set | Its own primitives, under names the baseline does not use |
| May override | Baseline semantic colour roles in either mode (`semantic` names both `dark` and `light`), using its own or baseline primitives |
| May add | Roles under `extensions`, named identically in both modes (for example `accent`, `shadow` or status tones); elevation levels; licensed fonts it supplies itself |
| May change type | Typeface family and weight for the heading roles `display`, `display-small`, `section` and `card` only |
| Must keep | Every baseline role and both modes; the baseline contrast requirements |
| Must not change | Utility type (`body`, `control`, `ui`, `ui-small`, `label`, `identity-label`), type sizes, spacing, layout, motion, radii or breakpoints |

Every resolved family keeps both themes, the shared [controls](interface.md#shared-controls)
and [motion](motion.md) behavior. Family-specific mark usage, imagery and product
wording belong in the family's repository. A family mood does not change Cosmik's
name, mark or organisation-wide claims.

## Starting a new family

1. Show a product need and real screens in both themes; a family is not approved
   until the owner accepts it. Follow [governance](governance.md).
2. Create `brand-<product>`, vendor a release of this kit into `vendor/brand/` and
   commit the lock. Set up `package.json` and the manifest as in
   [publishing a product brand](#publishing-a-product-brand).
3. Write `tokens/family.json` with `id`, `name`, `version`, `status`,
   `extends` (`"Cosmik baseline <baseline version>"`, as the vendored
   `kits/cosmik/tokens/source.json` states), `description` and `semantic` with
   `dark` and `light`. Add `primitives`, `extensions`, `type`, `elevation`, `fonts`
   and `proposals` as needed. Start small: override only the roles the product needs.
4. Run `family.mjs build` and `family.mjs check`, review the generated CSS in the
   vendored [reference](../specimens/components.html) patterns, and keep the
   family's own guide, marks and fonts (with their licence notices) in its repository.
5. To upgrade, vendor the newer tag, read the changelog, update `extends` if the
   baseline version changed, rebuild and re-check, then review the diff in both themes.

## Endorsement

Let the product title lead. Place “A Cosmik project” beneath the title or in an
appropriate footer using subdued reading or utility type, with clear separation
from the title block. Keep at least 16 px on screen or 4 mm in documents. Never
combine product and parent marks into a new logo. An endorsement need not repeat
inside every small control or dialog.

Keep genre imagery within its product. Preserve original creators' credits and
licence notices separately from the Cosmik endorsement. A product does not imply
official affiliation with a third party's work, or one licence across all its code
and assets.

## Claims

Use Cosmik in prose and `cosmiklabs` as the handle. Keep current capability claims
separate from plans; a family approval is not a product launch. Organisation wording
constraints are in [voice](voice.md), and commercial constraints are in the relevant
family's repository.
