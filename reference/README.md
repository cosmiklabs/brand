# HTML brand reference

The complete current reference is built from the repository’s authoritative Markdown, generated tokens and asset manifest. The presentation lives here; the rules stay in `guide/`. Product-family kits and private product evidence are not copied into this site.

## Build and preview

Node.js 22 or later; no dependency installation.

```sh
npm run build             # regenerate the kit, verify its manifest, build site/
npm run dev:reference     # build the HTML reference, then preview at localhost:4188
npm run preview:reference # serve an existing build; PORT selects another port
npm run check             # kit checks, including reference generation and link checks
npm run check:browser     # shared components and reference behavior in Chromium
```

`site/` is ignored output. Open `site/index.html` directly for offline reading, searching and downloads, or use the preview server. Its links and font files are relative, so the site works at a GitHub Pages project path as well as a root domain. The existing component specimen is retained, with built-copy navigation back to the guide. Print styles remove navigation and preserve the reading content.

## Sources and editing

`scripts/build-reference.mjs` lists the rendered documents and navigation groups. It reads every current guide chapter, the consumer and baseline kit guides, document template instructions, validation record, license, changelog and repository guide. `scripts/reference-markdown.mjs` renders the Markdown syntax used by these sources: headings and stable anchors, paragraphs, nested lists, tables, fenced code, quotes, links, inline code and emphasis. It escapes raw HTML; executable examples remain code. Extend its tests when introducing a new Markdown construct.

`reference.css` controls layout and loads the actual generated Cosmik tokens and shared controls. `reference.js` progressively enhances theme selection, local guide search, token filtering and mobile navigation. It makes no network requests or persistent preference writes. Without JavaScript, all reading content, normal links, native navigation disclosures, downloads and complete token tables remain available.

Live exhibits use approved source artwork and actual type/color roles. The token reference derives semantic colors from resolved JSON, includes both modes, and distinguishes normal motion duration from the effective preference-dependent duration. Kit release and baseline token versions are shown separately.

The asset library selects accepted/approved, non-deprecated assets, canonical entry points, fonts with their notices and editable document templates. Historical artwork is available in the repository, not promoted as a production download. `asset-manifest.json` remains the authority for status and file hashes. The build never copies Git metadata, tests, credentials or an entire repository into the publish directory.

## GitHub Pages

`.github/workflows/pages.yml` builds and validates the kit and reference, runs Chromium checks, uploads **only `site/`**, then deploys with Pages’ environment and OIDC permissions. Publishing occurs on a push to `main` or a manual run. No custom domain or kit release tag is introduced.

In the repository’s **Settings → Pages**, select **GitHub Actions** as the build source before the first deployment. The default project address is `https://cosmiklabs.github.io/brand/`; that is the expected destination, not evidence that a deployment has already succeeded. The generated files are also suitable for a configured custom domain.

Development of the HTML guide does not change an immutable brand release. Do not bump token versions, modify approved asset masters or describe this work as a new published kit release just to publish the reference.

## Verification

Tests cover chapter coverage, heading IDs, nested Markdown and escaped examples, local links and fragments, download integrity, real token names, both color modes, deterministic output and a narrow publishing allowlist. The browser check covers representative pages in both modes at desktop and narrow widths, guide search, token filters, no-JavaScript reading, navigation and direct-file use. Exact executed checks and review limits are recorded in [the reference validation record](../specimens/validation.md#html-reference-review--26-october-2026-unreleased); passing assertions are not accessibility certification.

## Family reference sites

The shared `scripts/build-family-reference.mjs` presentation renders HPLX and Tectra from their own guides, approved assets and pinned foundations. `scripts/reference-sites.mjs` owns reciprocal navigation among all three Pages sites. It does not replace either family’s vendored baseline. Each family verifies the shared presentation files against its own SHA-256 lock before building; its Pages workflow additionally pins an exact published tooling commit. Update both locks deliberately when changing shared presentation files. See each family’s `reference/README.md` for setup.

The guides share sidebar labels and ordering, search prompts, component examples and homepage actions. A selected theme is saved locally under `cosmik-reference-theme`; the three Pages sites share this preference on their common host. If storage is unavailable, theme selection still works for the current page.
