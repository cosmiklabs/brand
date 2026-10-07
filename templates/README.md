# Cosmik technical note template

A reusable, editable two-page Word document for a project brief, technical decision, or implementation note. The PDF is a reviewed layout reference of the same placeholder content.

## Use

1. Make a copy of `cosmik-technical-note-template.docx` for each note.
2. Replace every bracketed field, including the short title in the footer. The example text gives writing guidance; it does not describe a real Cosmik project.
3. Keep the sections that fit the work. The second page demonstrates an editable table, a code style, nested headings, and references. Delete any unused material.
4. Apply the named Word paragraph styles rather than manually formatting text. The headings support document navigation; the numbered next steps are a native list.
5. Use descriptive link text for references. Add meaningful alt text if you insert a figure.
6. Refresh the page fields and check the document in print layout before exporting or sharing. Longer replacement content may increase the page count. The Supporting detail heading starts a new page; turn off its “Page break before” option if that separation is no longer useful.

## Typography and page setup

Install the official desktop **Inter** family, including Regular, Medium, and SemiBold, and **IBM Plex Mono Regular** before editing. Fonts are not embedded in the DOCX; a system without them can substitute another face and change wrapping. The reference PDF includes embedded font subsets.

| Word style | Typeface | Size | Line spacing |
| --- | --- | ---: | ---: |
| Normal and Subtitle | Inter Regular | 11 pt | 1.40 |
| Title | Inter SemiBold | 30 pt | 1.10 |
| Heading 1 | Inter SemiBold | 20 pt | 1.20 |
| Heading 2 | Inter SemiBold | 14 pt | 1.25 |
| Heading 3 | Inter SemiBold | 11.5 pt | 1.30 |
| Caption | Inter Regular | 9.5 pt | 1.30 |
| Table Body | Inter Regular | 10 pt | 1.30 |
| Table Header | Inter Medium | 10 pt | 1.30 |
| Code | IBM Plex Mono Regular | 9.5 pt | 1.35 |
| Metadata | Inter Regular | 10 pt | 1.30 |
| Footer | Inter Regular | 9 pt | 1.20 |

The page is US Letter portrait with 0.78-inch margins and a 6.94-inch content width. Titles and headings are black and have no decorative borders. SemiBold is selected as a font face; do not apply an extra Bold toggle to these styles. The table has a repeating header row, light-gray borders, and cells that expand with content.

## Identity status

The 16 mm square emblem is the supplied approved raster, embedded without cropping, recoloring, redrawing, or changing its original canvas. Preserve its proportions and black plate. The adjacent editable “Cosmik” text uses Inter Medium as a document label; it is not a replacement for the approved wordmark. The template was produced for the 0.2.0 kit. The baseline typography and document rules are now approved (owner, 2026-10-07); the current [document guide](../guide/documents.md) governs their use.

## Verification

The reference PDF was produced with the bundled LibreOfficeDev 26.8.0.0.alpha0 renderer and the official Inter and IBM Plex Mono desktop font files. Both rendered pages were visually reviewed. Checks confirmed two Letter pages, embedded Inter Regular/Medium/SemiBold and IBM Plex Mono in the PDF, correct page numbers, an intact original raster, a native table header, image alt text, and an unskipped heading hierarchy. The document accessibility audit reported no findings; this is not a full accessibility certification. Microsoft Word and Google Docs were not independently rendered.
