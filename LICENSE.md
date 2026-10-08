# Licensing and brand use

> **Names.** Cosmik Labs (long form), CosmikLabs (full name), `cosmiklabs` (GitHub handle) and Cosmik (short form) all name the same personal GitHub organisation. It is not a company or other legal entity: copyright stays with the contributors, and the Cosmik marks are held by the organisation's owner.

This repository mixes three kinds of material with different rights. Each part is covered separately; a licence for one part says nothing about the others.

## 1. Tooling and token data: MIT

Covers:

- scripts: everything in `scripts/`;
- token sources and generated token files in `tokens/` (every kit: the baseline and the families);
- the specimen code in `specimens/` (HTML, CSS, JavaScript);
- `asset-manifest.json`, `.gitattributes` and the Markdown documentation.


```
MIT License

Copyright (c) 2026 Cosmik Labs contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

A permissive licence on the token values lets any project, including a fork, reuse the palette, spacing and type scale. Colours and spacing are not the identity; the marks below are.

## 2. Brand marks: trademark-style policy

Covers the **Cosmik marks**: the emblem (every file in `assets/`, the app icons in `icons/`, and any render of them), the COSMIK wordmark and banner, the name "Cosmik" used as the name of a product, project or organisation, and the brand guide and document template in `guide/` and `templates/`.

These files are **not** licensed under section 1 or under the licence of any project that ships them. The owner of Cosmik Labs keeps all rights in them, subject to the permissions below.

**Who may ship the marks.**

1. **Official Cosmik projects:** repositories under the `cosmiklabs` GitHub organisation and the builds, installers, websites and documentation published from them by Cosmik Labs. They may ship the marks unmodified, as supplied in this repository, following the brand guide.
2. **Contributors** to an official Cosmik project may use the marks while working on that project, including in local and test builds.
3. **Anyone** may refer to Cosmik and its projects by name and may show the unmodified emblem to identify them (for example in an article, a review, a catalogue entry or a link), provided it does not suggest endorsement, partnership or official status that does not exist.

**Unmodified means:** the supplied files, or exact renders of them at another size, in the supplied colour variants. No redrawing, recolouring outside the supplied variants, stretching, rotating, cropping into the flare, added effects, or recreating the wordmark in another typeface (see the brand guide).

**Forks and derivative distributions.** A fork of a Cosmik project, or any build not published by Cosmik Labs, must remove the Cosmik marks and must not use "Cosmik" as its own name or imply it is an official Cosmik release. It may state factually that it is "based on" or "a fork of" the Cosmik project. This applies whatever the code licence of the forked project: a copyleft or permissive code licence grants rights in the code, not in the marks. For GPL-3.0 projects, this is the declination of trademark rights that GPL-3.0 section 7(e) permits.

**Everything else** (merchandise, third-party products, modified marks, co-branding) needs written permission from the owner of Cosmik Labs.

## 3. Fonts: SIL Open Font License 1.1

The typefaces in `fonts/` are not Cosmik Labs' work and stay under their own licence, the SIL Open Font License 1.1:

- Inter: `fonts/licenses/Inter-OFL.txt`
- IBM Plex Mono: `fonts/licenses/IBM-Plex-OFL.txt` (Reserved Font Name "Plex")
- Spectral (the HPLX family's headings): `fonts/licenses/Spectral-OFL.txt`

Preserve these notices whenever font files are redistributed. `fonts/web/IBMPlexMono-Regular.woff2` is a lossless WOFF2 wrapper of the bundled TTF (every table byte-identical; see `scripts/build-web-fonts.mjs`), made so the web specimen does not need the TTF. Using the fonts here implies no endorsement by their authors.

## Notes

- **Official projects** are the repositories in the `cosmiklabs` GitHub organisation; a project elsewhere becomes official by moving there.
- **The marks are claimed, not registered.** Nothing here claims a registration.
