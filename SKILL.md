---
name: isom3trics
description: Build standalone, colored, stroked-toon Three.js components on a clean canvas. Use when someone asks for an isometric object, a miniature component, a rotatable colored object with ink contours, or a small staged object scene. No page UI, text, labels, cast, timelines or educational panels.
version: 0.1.0
license: MIT
---

# isom3trics

Build **one colored, contour-lined component** that can be freely rotated. Deliver the object and its rendering, not a surrounding website.

## Non-negotiable contract

- The deliverable is a canvas and the requested 3D component. **Nothing else on the page.** No headings, labels, instructions, captions, logos, borders, buttons, swatches, sliders, HUDs, lesson panels or text baked into textures.
- Default to a single freestanding object. Add a slab and supporting props only when the user explicitly requests a staged scene.
- Color, not monochrome. Four-tone toon surfaces and selective warm-charcoal contours; never pixel quantization, dither, pixelated CSS or a luminance-edge filter.
- Free drag/touch orbit, wheel/pinch zoom, keyboard arrow orbit and `R` reset. No auto-spin. Keep the canvas keyboard-focusable with a concise accessible label.
- Build a complete object, not a front facade: underside, back, attachments and supports must exist and remain coherent from every allowed angle.
- No downloaded models unless the user separately requests them. Primitive assemblies must have bevels, attachments, panels and functional details; no naked hero boxes.
- No narrative cast, service systems, scene timelines, unrelated decorative props, educational UI or branded page shell.

## Files

- `templates/stroked-toon.js` — four-tone materials and view-dependent visible-surface ink.
- `templates/orbit.js` — drag/touch orbit, zoom and deterministic reset.
- `templates/viewer.js` — neutral renderer/camera/lights host. Does not add DOM or UI.
- `templates/geometry.js` — reusable geometry helpers, without text or textures.
- `examples/computer.js` — authored miniature computer component, without a screen texture.
- `templates/DESIGN.md` — short component contract.
- `tests/stroked-toon.test.js` — CPU-testable renderer contracts.
- `LICENSE` — this skill's MIT license.

Copy the modules needed by the project. Use local project imports (`three` and `three/addons/...`), not imports into this installed skill directory.

## Procedure

### 1. Define only the object

Record the whole-object silhouette, material palette, supporting assemblies, back/underside, attachments and default camera angle in `DESIGN.md`. The user's explicit colored stroked-toon request is the rendering choice; do not reopen pixel-versus-toon gates. Ask about geometry sourcing only if the user has not already specified it.

If the user requests a staged scene, define the slab and a small number of supporting objects in the same sheet. Do not introduce a page layout to present them.

### 2. Build authored, colored geometry

Use shared local datums and actual contacts. Build primary mass, secondary assemblies, attachments, then sparse functional details. Model the edge with small bevels; do not stroke every triangulation. Back-facing or inward cavity materials, decals, contact shadows and transparent films normally set `outline:false`.

The complete computer example has a rounded display housing, recessed bezel, physical screen surface, swivel foot, vents, rear service panel, ports, keyboard, mouse and connecting cables. Its screen is a plain colored surface, never an image containing text.

### 3. Use the renderer

```js
import * as THREE from 'three';
import { createStrokedToon } from './core/stroked-toon.js';

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
const look = createStrokedToon(renderer, { strokePx: 1.25 });
const shell = look.toon('#acc8b5');
const smallPart = look.toon('#e6b777', { stroke: 0.65, depth: 0.4 });
const inner = look.toon('#374c47', { outline: false });
const screen = look.flat('#b9d9cd');
const cable = look.flat('#4d5850'); // one solid strand, no internal outline
look.render(scene, camera);           // not renderer.render(...)
```

Use a four-step `DataTexture` ramp with nearest filtering. Render visible view-space normals and depth, then detect silhouette/depth/normal discontinuities in an eight-neighbor screen pass and composite warm ink over the colored surface. Never expand mesh backfaces for outlines.

Call `look.resize(camera)` after viewport changes and `look.setStroke(px)` when changing emphasis. The edge mask uses a fixed one-physical-texel footprint and never dilates during zoom. Use material ink attributes to separate housing contours, small-part separations and unoutlined strands:

- `stroke`: relative ink strength, typically `0.35–0.6` for keycaps and `1` for housing.
- `depth`: depth-discontinuity contribution; set `0` for tiny keycaps and flat cables.
- `normal`: normal-discontinuity contribution; reduce it on small beveled details.
- `outline:false`: no interior ink. The material still contributes a clean outer silhouette.

Do not apply the same depth threshold to every part. Dense keycaps must not merge into a dark block, and cables must not receive two competing internal outlines. Keep keycaps and other tiny hardware from each casting an additional dark shadow onto neighboring details.

### 4. Present a blank stage

```html
<canvas id="object" aria-label="Rotatable miniature computer" tabindex="0"></canvas>
```

```css
html, body { margin: 0; width: 100%; height: 100%; overflow: hidden; background: #f6f4ee; }
canvas { display: block; width: 100%; height: 100%; touch-action: none; }
```

No overlay elements. No fallback copy placed on the canvas page. WebGL/import errors go to the developer console and automated test results, not visual HTML.

Use an orthographic camera for the isometric look. Fit its left/right/top/bottom to the object's projected eight-corner bounding box, with 15–25% empty margin. A useful initial view is azimuth 34°, elevation 28°. Measure the stable canvas parent or viewport, not the WebGL canvas after `renderer.setSize`, to avoid resize feedback. Native antialiasing and device pixel ratio capped at 2; no pixelation.

### 5. Verify what the user asked for

- `npm test` for ramp, material opt-out, projection math, rendering state restoration and disposal.
- Capture cold-load desktop and phone canvases, then front, rear, high orbit and minimum zoom. The page DOM contains only the canvas and scripts; no text nodes are visibly rendered.
- Inspect 1:1 crops: continuous silhouette ink, no triangle diagonals, no merged keycaps, no broken/doubled cables, no heavy cavity outlines. Compare both zoom limits and several orbit angles.
- Exercise drag, wheel/pinch, arrows and R reset. Check console errors, finite geometry, contact points and stable framing after resize.
- `npm run build` for the consuming example. Do not claim visual quality from unit tests alone.
