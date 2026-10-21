# Cosmik brand kit

Brand kit 0.4.0 (21 October 2026), tagged `v0.4.0`. See [CHANGELOG.md](CHANGELOG.md).

The identity system for Cosmik and its product families: the rules in the
[guide](guide/README.md), and per-kit tokens, marks and icons generated from one
source each. Published for reference and implementation; it does not claim every
production asset, legal permission or accessibility check is complete.

## Kits

Each kit lives in one folder with its tokens, marks, icons, specimens and evidence.
A product consumes its family's kit; the organisation's own surfaces consume the
baseline. Family files already include the baseline's values.

| Kit | For | Status | Start with |
| --- | --- | --- | --- |
| [cosmik](kits/cosmik/README.md) | Cosmik itself: website, profile, documents | Approved 2026-10-07 | `kits/cosmik/tokens/cosmik.css` |
| [hplx](kits/hplx/README.md) | The HPLX engine, reimplementations, app and editor | Approved 2026-10-15 | `kits/hplx/tokens/hplx.css` |
| [tectra](kits/tectra/README.md) | Tectra, the agent-driven construction authoring product | Approved 2026-10-17 | `kits/tectra/tokens/tectra.css` |

[kits/README.md](kits/README.md) explains the token formats, the family contract the
build enforces, and how to use a kit on the web and in native code.

## Layout

| Path | Holds |
| --- | --- |
| `guide/` | The brand guide: rules and judgement, never values (the v0.2 Word/PDF guide is in `guide/archive/`) |
| `kits/<kit>/` | One kit: `tokens/` (source plus generated CSS, JSON, DTCG JSON, Rust), `assets/`, `icons/`, specimens and validation |
| `fonts/` | Supporting typefaces for desktop and web, with their licence notices |
| `specimens/` | The offline component reference, with a selector across every kit |
| `templates/` | The editable technical-note template and its proof |
| `scripts/`, `tests/` | The build, checks and tests (Node.js only, no packages) |
| `asset-manifest.json` | Entry points, roles, font lists, known gaps and a SHA-256 for every listed file |

## Using a kit

Pin an exact release; never track `main`. Releases use semver tags `vX.Y.Z`
(`version` in `asset-manifest.json` and `kits/cosmik/tokens/source.json`).

- **Vendor files from a tagged release** (best for websites and design tools): copy
  the files you use (`entry_points` in the manifest names them) and check them
  against the manifest's SHA-256 hashes.
- **Git submodule** at a tag (`git submodule add https://github.com/cosmiklabs/brand vendor/brand`):
  best when a build reads files from the kit directly.
- **Git subtree** (`git subtree add --prefix vendor/brand https://github.com/cosmiklabs/brand vX.Y.Z --squash`):
  files live in the consumer's history, so clones need no submodule step.

Consume only generated outputs and listed assets, and keep the font licence files
with any font you ship. Web and Rust usage is in [kits/README.md](kits/README.md).

## Working on the kit

Requires Node.js 22+ and no third-party packages.

```sh
npm run build                # regenerate every kit, icon and web font, refresh manifest hashes
npm run check                # contrast pairs for every kit, every manifest hash, every test
npm test                     # the tests alone
npm run check:browser        # specimens in Chromium; set BRAND_BROWSER to its executable
npm run check:reproducible   # rebuild and fail if any committed file differs
```

Edit only sources (`source.json`, `family.json`, `*.source.json`); generated files
are overwritten by the build. `.gitattributes` keeps text LF on every platform so
hashes match the committed bytes. [CI](.github/workflows/check.yml) runs the
reproducibility check, `check` and the browser check. Owner decisions and release
steps are in [governance](guide/governance.md).

Browser checks cover every kit's specimen in both themes, nested themes, fonts,
responsive widths, 200% text and the specimen interactions. Full browser zoom,
assistive technologies and other engines still need manual review
([specimen validation](specimens/validation.md)); these checks do not certify a
product built with the kit.

## Fonts and rights

Inter (4.1 release, internal version 4.001), IBM Plex Mono Regular (2.005) and
Spectral SemiBold (for HPLX headings) are bundled under SIL OFL 1.1; preserve the
notices in `fonts/licenses/` when distributing font files. Sources:
[Inter](https://rsms.me/inter/download/),
[Plex](https://github.com/IBM/plex/tree/master/packages/plex-mono),
[Spectral](https://github.com/google/fonts/tree/main/ofl/spectral). No typeface
match or rights clearance for the original wordmark is asserted.

[LICENSE.md](LICENSE.md) sets the terms: tooling and token data under MIT; the
emblem, wordmark and name under a trademark-style policy (official Cosmik projects
ship them unmodified; forks remove them); fonts under their own licences. A code
licence does not resolve brand-artwork permissions. The organisation profile lives
in the separate `.github` repository.
