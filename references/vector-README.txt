COSMIK EMBLEM — VECTOR TRACE v0.2

Contents
- cosmik-emblem-master-offwhite.svg: off-white (#F6F5F0) emblem, transparent background; editable path master.
- cosmik-emblem-ink.svg: black (#000000) emblem, transparent background.
- cosmik-emblem-primary.svg: off-white emblem with a black square background.
- png/: rendered previews at 16, 24, 32, 48, 64, 96, 128, 256 and 1024 pixels.
- cosmik-vector-preview.png: light/dark comparison and native-size contact sheet.
- trace-overlay.png: original silhouette vs. vector rasterization; shared pixels gray, original-only magenta, vector-only cyan.
- qa.json: numerical silhouette comparison.

Construction
All three SVGs share the exact same emblem path data and viewBox (0 0 1254 1254). The emblem is one editable compound path with two closed contours. It uses cubic Béziers and straight segments; there are no embedded raster images, fonts, external resources, scripts, filters or masks. The primary variant adds a separate rectangular background path. Original composition and margins are retained.

Source: the approved 1254 × 1254 original Minimalist Crescent Eclipse Emblem(1).png. Originals have not been modified. The crescent, inner eclipse curve, horizontal cut, central flare, and isolated right point were traced from the original light silhouette. Trace smoothing was applied to the binary silhouette at mean RGB >123; the two tiny horizontal tips were adjusted against source-pixel measurements to avoid rounded trace caps. Original raster texture and subtle color variation are intentionally represented by a flat off-white fill.

This is a close traced approximation, not recovery of a lost original drawing. At source resolution, the rendered silhouette overlaps the thresholded source by 99.643% intersection-over-union. Symmetric edge distances average 0.192 px; 95% are within 1 px, maximum 4 px at very thin tips. Render antialiasing affects the last visible tip pixels. Vector geometric bounds: x=133.5, y=222.009, width=944.5, height=778.617. Bounds from alpha>127 rasterization are narrower at the needle tips and are not the vector bounds.

Verified by XML parsing, exact shared-path comparison, Inkscape rendering at full and small sizes, and visual source overlay review. The tiny point and fine cut lose definition at favicon sizes; these are faithful size tests, not a separately approved optical small-size redesign.

Scope: emblem only. No wordmark or horizontal logo lockup has been vectorized or newly approved by this package.
