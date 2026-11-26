# isom3trics — component-only skill

## Request
A reusable skill for colored stroked-toon components, where the canvas contains only the component and no text.

- Profile: reusable skill and component-only example.
- UI: **none**. Only a full-viewport canvas; no DOM furniture, labels, buttons, text, fonts, or text in screen textures.
- Render: colored stroked-toon with fine, view-dependent outlines.
- Geometry: authored only; no downloaded models.
- Interaction: free orbit, bounded polar angle, zoom, arrow keys, R reset; no auto-spin.
- Example: complete miniature retro personal computer with keyboard and mouse. No slab unless separately commissioned.

## Rendering
Use `MeshToonMaterial`, a four-step nearest-filter ramp, native antialiasing, sRGB / NoToneMapping, warm key and cool fill, and direct drag orbit.

Render visible view-space normals and depth to detect edges at the current camera angle. Use a fixed one-physical-texel mask without zoom-dependent dilation. A signed depth test avoids doubled occlusion lines. Multisampled normal/depth targets reduce jagged ink on small parts. Material attributes distinguish full housing contours, subtle keycap separations and unoutlined solid cables. Tiny hardware receives shadows without each casting a second dark shape onto its neighbors.

## Object construction
Rounded shell and recessed bezel; blank colored screen; front controls; side vents; connected swivel stand and foot; rear service panel, screws, ports and cable; matching keyboard with individual keys; matching mouse and cables. All sides are present and reviewable.

## Verification
- Unit tests cover ramp, opt-out metadata, projection math, rendering state restoration and disposal.
- Headless Chrome checks one canvas, empty visible text, finite geometry, desktop/phone sizing, drag orbit, wheel zoom, R reset, and no browser/WebGL errors.
- Desktop, phone, orbit, zoom, minimum-zoom, rear and high-angle screenshots stored under `qa/captures/`.
