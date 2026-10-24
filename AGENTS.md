# Working on the brand kit

- Read the root README, relevant family guide and `guide/governance.md`. Inspect
  the working tree and preserve unrelated work. Keep the requested scope clear.
- Preserve approved marks, palettes and fonts unless the owner explicitly approves
  changing them. Do not turn an interface improvement into a new identity or a
  product, pricing or availability promise.
- Edit authoritative sources. Token sources are `kits/cosmik/tokens/source.json`
  and `kits/<family>/tokens/family.json`; mark sources are named by each family
  guide and the manifest. Never hand-edit generated exports or historical masters.
- Keep shared component references implementation-agnostic: demonstrate neutral
  components and states, not a proposed website or a specific product workflow.
  Platform adapters illustrate the contract without prescribing a framework.
- Keep semantic roles and both themes intact. Follow `guide/interface.md` and
  `guide/motion.md`. Use real keyboard and accessibility semantics in examples.
- Avoid dependencies without a demonstrated need. Scripts currently use Node.js
  built-ins. Keep builds deterministic, portable and usable offline.
- Run `npm run build` and `npm run check` after source changes. For interactive or
  visual changes, run `npm run check:browser`, inspect the rendered screenshots
  and exercise affected flows. Add focused regression coverage for actual defects.
- Record verification honestly: distinguish written tests, executed checks and
  visual inspection. Keep exact evidence in validation records; do not duplicate
  stale results across guides. Do not claim accessibility certification.
- Keep values in token sources, canonical asset paths/status in the manifest and
  rules in the guide. Update links and consumer migration guidance when changing
  contracts. Preserve font notices, provenance and approved originals.
- Review the final diff and generated changes. Do not add credentials, private
  screenshots, personal paths or test artifacts to tracked files.
- Commit, tag, publish or push only when authorized. Do not bump release versions
  or describe unreleased work as a published release without an actual release.
