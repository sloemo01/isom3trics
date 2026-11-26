---
name: isom3trics
description: Build standalone, colored, stroked-toon Three.js components on a clean canvas, adapted from sloemo01/diorama's stroked-toon preset. Use when someone asks for an isometric object, a miniature component, a rotatable colored object with ink contours, or an object-only diorama. No page UI, text, labels, cast, timelines or educational panels.
version: 0.1.0
---

# isom3trics

Build **one colored, contour-lined component** that can be freely rotated. Extract the rendering idea, not the whole diorama playbook.

## Non-negotiable contract

- The deliverable is a canvas and the requested 3D component. **Nothing else on the page.** No headings, labels, instructions, captions, logos, borders, buttons, swatches, sliders, HUDs, lesson panels or text baked into textures.
- Default to a single freestanding object. Add a slab and supporting props only when the user explicitly requests a **diorama**.
- Color, not monochrome. Four-tone toon surfaces and selective warm-charcoal contours; never pixel quantization, dither, pixelated CSS or a Sobel postprocess.
- Free drag/touch orbit, wheel/pinch zoom, keyboard arrow orbit and `R` reset. No auto-spin. Keep the canvas keyboard-focusable with a concise accessible label.
- Build a complete object, not a front facade: underside, back, attachments and supports must exist and remain coherent from every allowed angle.
- No downloaded models unless the user separately requests them. Primitive assemblies must have bevels, attachments, panels and functional details; no naked hero boxes.
- No narrative cast, service systems, scene timelines, unrelated decorative props, educational UI or branded page shell. This skill intentionally does **not** import the rest of Diorama.

## Files

- `templates/stroked-toon.js` — four-tone material factory and view-dependent visible-surface ink.
- `templates/orbit.js` — drag/touch orbit, zoom and deterministic reset, adapted from upstream.
- `templates/viewer.js` — neutral renderer/camera/lights host. Does not add DOM or UI.
- `templates/geometry.js` — reusable geometry helpers, without screen text or textures.
- `examples/computer.js` — authored miniature computer component, without a screen texture.
- `templates/DESIGN.md` — short component contract.
- `tests/stroked-toon.test.js` — CPU-testable renderer contracts.
- `DIORAMA-LICENSE` — required upstream MIT copyright and permission notice.

Copy the modules needed by the project. Use local project imports (`three` and `three/addons/...`), not imports into this installed skill directory.

## Procedure

### 1. Define only the object

Record the whole-object silhouette, material palette, supporting assemblies, back/underside, attachments and default camera angle in `DESIGN.md`. The user's explicit colored stroked-toon request is the rendering choice; do not reopen pixel-versus-toon gates. Ask about geometry sourcing only if the user has not already specified it.

If the user requests a diorama, define the slab and a small number of supporting objects in the same sheet. Do not introduce a page layout to present them.

### 2. Build authored, colored geometry

Use shared local datums and actual contacts. Build primary mass, secondary assemblies, attachments, then sparse functional details. Model the edge with small bevels; do not stroke every triangulation. Back-facing or inward cavity materials, decals, contact shadows and transparent films normally set `outline:false`.

The complete computer example has a rounded display housing, recessed bezel, physical screen surface, swivel foot, vents, rear service panel, ports, keyboard, mouse and connecting cables. Its screen is a plain colored surface, never an image containing text.

### 3. Use the extracted renderer

```js
import * as THREE from 'three';
import { createStrokedToon } from './core/stroked-toon.js';

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
const look = createStrokedToon(renderer, { strokePx: 1.25 });
const shell = look.toon('#acc8b5');               // relative stroke weight 1
const smallPart = look.toon('#e6b777', { stroke: 0.65 });
const inner = look.toon('#374c47', { outline: false });
const screen = look.flat('#b9d9cd');               // never outlined
look.render(scene, camera);                       // not renderer.render(...)
```

Retain the original four-step `DataTexture` ramp and nearest filtering. The new ink pipeline renders visible view-space normals and depth, detects silhouette/depth/normal discontinuities in an eight-neighbor screen pass, then composites warm ink over the colored surface. This replaces upstream `OutlineEffect`'s inverted hulls, which can bleed through thin beveled parts and overlapping assemblies.

Call `look.resize(camera)` after viewport changes and `look.setStroke(px)` when changing ink weight. The stroke is sampled in physical target pixels derived from CSS-pixel width and DPR, so it stays stable across orbit, zoom and camera type. This is **not** a luminance/Sobel edge filter and must not be combined with another outline pipeline.

Material `outline:false` records the selective-ink contract for authored surfaces. If a specific surface must be excluded from the screen-space normal/depth pass, give it a separate non-ink render layer and compose it after the main pass; do not silently re-enable inverted hulls.

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

- `npm test` for ramp, material opt-out, screen-pixel projection math, zoom/resize behavior, material restoration and disposal.
- Capture a cold-load desktop and phone canvas, then front, rear and high orbit. The page DOM contains only the canvas and scripts; no text nodes are visibly rendered.
- Inspect 1:1 crops: continuous silhouette ink, no triangle diagonals, no heavy cavity outlines, no disappearing detail or double contours. Compare at both ends of zoom.
- Exercise drag, wheel/pinch, arrows and R reset. Check console errors, finite geometry, contact points and stable framing after resize.
- `npm run build` for the consuming example. Do not claim visual quality from unit tests alone.

## Scope boundary

The upstream `diorama` repository is MIT licensed. Its `templates/stroked-toon.js` material approach and `templates/orbit.js` interaction approach are adapted here, with attribution. The inverted-hull outline is deliberately replaced by the new visible-surface stroke. The pixel renderer, educational modules, cast and long-form scene machinery are out of scope.
