# Governance

Matthew owns identity decisions. A general improvement to guidance or reference
behavior does not approve a different mark, palette, core typeface, product claim
or commercial promise. Keep proposed choices clearly separate from approved work.
The terms for reusing artwork are in [LICENSE.md](../LICENSE.md).

## One home for each decision

| Concern | Authoritative home |
| --- | --- |
| Baseline token values | `kits/cosmik/tokens/source.json` |
| Family token overrides | `tokens/family.json` in the family's `brand-<product>` repository |
| Family contract | `familySource` in `scripts/generate-tokens.mjs`, described in [families](families.md) |
| Shared controls | `kits/cosmik/components/controls.css`; rules in [interface](interface.md#shared-controls) |
| Vendorable release files | `vendor` in `asset-manifest.json` |
| Mark geometry | The accepted source identified by each kit's README and the manifest |
| Roles, canonical paths, asset status and hashes | `asset-manifest.json` |
| Use and interaction rules | `guide/`, and each family's guide in its repository |
| Executable examples | `specimens/`, and each family's own references |
| Observed verification | Validation records, with dates and test conditions |
| Release history | `CHANGELOG.md` and immutable `vX.Y.Z` tags |

Generated token files and artwork exports are consumer deliverables, not separate
sources to edit. Historical artwork stays intact when replaced. Deprecate entry
points deliberately, retain provenance and explain migration before removing them.

## Proposing and implementing a change

1. Identify the problem in a real screen, source contract or reference interaction.
   Check the working tree and preserve unrelated changes.
2. Show the affected consumers and the intended behavior. For visual changes,
   compare before and after in both modes, including a narrow or short layout.
3. Edit the authoritative source and the relevant guide or example. A family
   extends the baseline under the [family contract](../kits/README.md); it cannot
   silently redefine shared utility type, layout or motion.
4. Regenerate outputs and run the [repository checks](../README.md#working-on-the-kit).
   Add focused regression coverage for the actual defect. Use the
   [quality review](quality.md) for rendered and interaction checks.
5. Report what changed, what was verified and remaining limitations. Changes to a
   mark, core type, baseline palette or family values require explicit owner
   review before being described as approved.

The manifest's `known_gaps` lists outstanding asset and validation work. Keep that
list consistent with current evidence; do not copy a stale list into every guide.

## Releasing

A working-tree improvement is not a release. Commit, tag and publish only when
authorized. Prepare a release in this order:

1. Choose the semver change and document it in `CHANGELOG.md`. Breaking consumer
   contracts or removed entry points require a major version; additive contracts
   use a minor version; compatible corrections use a patch version. State any
   visual migration a consumer needs to review.
2. Update the release version in `package.json` and `asset-manifest.json`. Change
   the baseline source's own `version` only when a baseline token value changes:
   every family's `extends` names it, so a release without token changes leaves
   families' `extends` valid. Family revisions live in their own repositories.
   Update release labels in documentation without calling an uncreated tag
   published. Keep the manifest's `vendor` list complete; the tests check that
   vendored scripts carry their imports, fonts their notices and the full guide.
3. Run `npm run build`, then `npm run check` and `npm run check:browser`. Inspect
   generated diffs, hashes and rendered proofs. A build may refresh generated and
   editable assets; it must never bless a changed approved original automatically.
4. Re-test representative consuming screens and any changed document exports.
   Record the tested scope and unresolved manual checks. Preserve font notices.
5. Commit the reviewed sources, outputs, evidence and manifest together. From a
   clean checkout, run `npm run check:reproducible`; its comparison requires a
   committed baseline. Then create the authorized immutable `vX.Y.Z` tag and
   publish the release. Never move an existing release tag to different content.

## Upgrading a consumer

Pin the new tag and review the changelog before replacing vendored files. Verify
manifest hashes, include required fonts and notices, and update all related
outputs together. A family repository re-runs `vendor.mjs sync` from the new tag,
then `family.mjs build` and `check`, and reviews the regenerated outputs. Keep application-specific components and CSS outside the vendored
kit; do not fix a kit defect by silently editing the copied source of truth.

Re-run affected product flows in both themes, at narrow widths and with reduced
motion. A passing kit suite does not establish product correctness. If a consumer
needs a new shared role or behavior, bring it back with evidence instead of
creating an undocumented parallel design system.
