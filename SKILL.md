---
name: isom3trics
description: Create standalone HTML files with colored, stroked-toon Three.js components on a clean canvas. No React, npm, build tools, page UI, text or labels. Use for isometric miniature objects and small staged scenes.
version: 0.2.0
license: MIT
---

# isom3trics

Create a **single HTML file containing one colored, rotatable component**. The browser loads Three.js from a CDN. Everything else—geometry, materials, lighting, camera, edge shaders and interactions—is inline in that HTML.

## Required format

- `index.html` is the example component: one standalone miniature computer.
- No React, npm, `package.json`, bundler, source tree, template directory, test harness, design documents or development dependencies.
- The visible page is one full-viewport canvas. No headings, captions, controls, navigation, text textures, labels or watermark.
- Keep only `index.html`, `SKILL.md`, `README.md` and `LICENSE`.
- Use native ES modules, absolute CDN imports for official helpers, and one small browser import map resolving the helpers' own `three` dependency. This is native browser resolution, not an npm setup.

```js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/geometries/RoundedBoxGeometry.js';
```

## Rendering

Use colored `MeshToonMaterial` surfaces with a four-step nearest-filter `DataTexture` ramp. Render visible view-space normals and depth, detect geometry discontinuities, then composite warm charcoal ink over the color. Never expand backfaces for outlines, draw triangle wireframes, or apply a luminance edge filter.

The edge mask uses one physical texel and does not dilate with zoom. Give materials independent ink strength and depth/normal contributions: subtle keycaps, full housing contours, and flat unoutlined cables must not share one heavy edge rule. Tiny parts should not cast individual dark blocks onto adjacent details.

## Interaction

Use `OrbitControls` with an orthographic camera. Drag/touch to orbit, scroll/pinch to zoom, arrow keys to rotate and `R` to reset. No automatic spin. Fit the camera to the object's projected bounds with clear margin and observe the canvas parent rather than the resized canvas.

## Building another component

Copy `index.html` and replace only its `createComputer(look)` factory. Keep the renderer, controls and CSS unchanged. Model the complete object: back, underside, attachments and contact points. Use beveled primary masses, functional secondary assemblies and a small coherent color family. No downloaded geometry unless separately requested.

For a staged scene, add a slab and a few supporting objects only when requested. Do not add surrounding HTML to present the scene.

## Check

Open the HTML through a local static server (CDN modules may not load under `file://`). Confirm one canvas and no visible text. Inspect minimum zoom, close zoom, front, rear and phone views. Verify continuous silhouettes, separated small details and unbroken solid cables. Check the browser console for import or shader errors.
