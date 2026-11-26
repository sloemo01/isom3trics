# isom3trics — component-only skill

## Clarified request
"make a skill which utilizes that stroked toon part, where in a new canvas only that component exists and no text etc"

- Profile: a reusable skill and its component-only example.
- UI: **none**. Only a full-viewport canvas; no DOM furniture, labels, buttons, text, fonts, or text in screen textures.
- Render: colored stroked-toon, derived from the **cloned** `sloemo01/diorama` repository, not the installed skill pack.
- Source commit: `a4cb0784a13ee51d00df04f3bc6d4fe461ac6b07`.
- Geometry: authored only; no downloaded models.
- Interaction: free orbit, bounded polar angle, zoom, arrow keys, R reset; no auto-spin.
- Example: complete miniature retro personal computer with keyboard and mouse. No diorama slab unless separately commissioned.

## Extracted and improved
Retain upstream `MeshToonMaterial`, four-step nearest-filter ramp, native antialiasing, sRGB / NoToneMapping, warm key and cool fill, and drag-orbit approach. Preserve upstream MIT notices.

Replace `OutlineEffect` inverted hulls with a depth/normal visible-surface stroke. Render color, view normals plus depth, an eight-neighbor edge mask, then a single ink composite. This prevents backface strokes bleeding through thin beveled components. Ink is view-dependent and specified in CSS pixels after DPR conversion. No triangle wireframes, luminance edges, pixel quantization, dither, pixelated CSS, or multiple outline effects.

## Object construction
Rounded shell and recessed bezel; blank colored screen; front controls; side vents; connected swivel stand and foot; rear service panel, screws, ports and cable; matching keyboard with individual keys; matching mouse and cables. All sides are present and reviewable.

## Verification
- Unit tests cover ramp, opt-out metadata, projection math, rendering state restoration and disposal.
- Headless Chrome checks one DOM element (canvas), empty visible text, finite geometry, desktop/phone sizing, actual drag orbit, wheel zoom and R reset, and no browser/WebGL errors.
- Desktop, phone, orbit, zoom, rear and high-angle screenshots stored under `qa/captures/`.
- Pixel-specific Diorama QA is intentionally not applied; this is not a pixel diorama or narrative scene.
