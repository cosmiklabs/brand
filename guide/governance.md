# Governance

**Matthew owns identity decisions.** Anyone can propose a change with a before-and-after proof, the files it affects, and its validation results (`node scripts/check.mjs`).

- A new product reuses the system: the baseline, or its product family's kit.
- Changes to the emblem, the core type or the baseline palette need the owner's explicit review.
- A new product family, or a change to a family's values, is proposed in `tokens/<family>/family.json` and stays *proposed* until the owner approves it.
- The terms for reusing the marks are in [LICENSE.md](../LICENSE.md).

## Before a release

1. Run `node scripts/build.mjs` and `node scripts/check.mjs`; both must pass, with every manifest hash verified.
2. Re-test real product screens and print output; the kit's checks don't cover them.
3. Record the changes in [CHANGELOG.md](../CHANGELOG.md), set the version (semver) in `asset-manifest.json` and `tokens/cosmik/source.json`, and tag the release `vX.Y.Z`.
4. Retire superseded copies of assets; keep the approved originals unchanged.

## Still open

The outlined wordmark and horizontal lockup, an optically redrawn small icon, print-process proofs, and browser, keyboard and assistive-technology checks of the specimens. The current list is `known_gaps` in `asset-manifest.json`.
