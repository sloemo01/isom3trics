---
name: isom3trics
description: Create standalone HTML files with colored, stroked-toon Three.js components on a clean canvas. No React, npm, build tools, decorative UI, visible text or labels. Use for isometric miniature objects and small staged scenes.
version: 0.10.0
license: MIT
---

# isom3trics

Create a **single HTML file containing one colored, rotatable component**. The browser loads Three.js from a CDN. Everything else—geometry, materials, lighting, camera, edge shaders and interactions—is inline in that HTML.

## Required format

- `index.html` is the miniature computer. `examples/` contains other standalone HTML files, one per component.
- No React, npm, bundler or local runtime dependencies. Temporary QA probes and screenshots stay out of the deliverable.
- Use one canvas. Use a square-corner instrument plate with figure number and title above the stage, and a hint, live readout and rotation lock along the bottom. Put the caption and wrapping controls below the frame. Keep text out of the model and retain the rotation lock.
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

### Rotation lock

Put a single open/closed padlock toggle on the figure footer. Default to unlocked. Use a native button with a stable accessible label, `aria-pressed`, and a visible focus style. Lock camera rotation from drag and arrow keys only: zoom and part interactions remain usable. Keep the persistent lock separate from temporary orbit suspension during part grabs. Preserve the lock through resize, reset and part release/cancel. Refit the projection on resize without resetting the camera orientation or zoom; only an explicit reset restores the hero view. Check that unlock restores orbit and that a part still responds while locked.

### Direct part actions

Give each interactive model at least one action that belongs to the object: a lid opens on its hinge, a gripper closes, a dial tunes. Keep the working area clear; place controls beside or below the canvas. Mark the actual visible part with a pointer cursor, and describe the action in the canvas accessible name. Use `bindPartAction` from an example: register target meshes or groups and one reversible state setter. Tap/click activates the first visible hit; orbit drags must not activate it. Provide Enter/Space and restore the initial part state with R. If a brief calls for part dragging, reserve it for that handle, constrain it to its real axis or pivot, temporarily suspend orbit, and restore orbit on release/cancel.

For a hands-on brief, choose gestures from the mechanism: momentary press for a key, planar slide for a mouse, rotation coupled to jaw travel for a screw, and a pivot with a safe range for a lid, arm or wand. Reuse `slider` and `bindPartAction`: register the visible hit parts, bounds, state setter, and keyboard step. Use the same setter for pointer, keyboard and reset. Brackets select a control; minus/plus adjust it. Keep cables anchored and moving assemblies attached to their pivots. Preserve orbit on empty space; return it on pointer up, cancel or lost capture. Cancel timed effects on reset.

Before shipping, exercise the actual input path: click a visible part, click empty space, drag from empty space to orbit, then drag a part handle and verify only the part moves, activate by keyboard, and reset. Verify changed positions or materials, not just event delivery. Check the largest movement from another angle for lost contacts, clipping, or hidden parts that still intercept clicks. Keep it to one useful action first; add a second only if it serves the object.

## Building another component

Copy the closest example. Replace its model factory and update the document title and canvas accessible name. Keep the renderer, controls and CSS unchanged. Model the complete object: back, underside, attachments and contact points. Use beveled primary masses, functional secondary assemblies and a small coherent color family. No downloaded geometry unless separately requested.

For a staged scene, add a slab and a few supporting objects only when requested. Use the existing figure plate rather than adding unrelated page UI.

## Mechanical construction gates for every new figure

- **Mount every moving part before detailing it.** Name its fixed support, moving group, axis and stops. Derive the bearing, shaft and moving group from the same pivot datum. Make the connection visible from at least one angle. Check that fixed supports stay fixed, moving parts stay seated, and the complete handle sweep clears the body, base and nearby parts. Check both travel limits and intermediate poses, not just the hero view. A knob, lever or linkage that appears to float fails.
- **Route every line through real attachments.** For thread, cable, belts, or tubing, mark the source, each guide and the destination. Seat the guides on the frame. Derive moving endpoints from the actual moving parts in the correct coordinate frame, and check the visible line at both limits and mid-travel for gaps and penetration. For sewing, keep the spool → guides → needle-eye route distinct from the stitches, seat stitches on the fabric, and check needle, feed and presser-foot timing together.
- **Test the mechanism through the actual controls.** In Playwright, drive one complete cycle and its return, then cancel or interrupt at mid-motion. Assert the moving pose, fixed mount, and readout independently. Inspect the worst-angle image after any repair. If a linkage cannot be made credible, simplify it explicitly rather than adding disconnected decoration.

## Build → try to break it → fix → verify

**Own the routine decisions and QA.** Start from the closest working example, inspect references when the mechanism is unfamiliar, and choose reversible defaults for unspecified layout, pose and styling. Ask only when a consequential choice cannot be inferred, consent or missing access is required, or ambiguity would materially change the deliverable. Don't ask the user to reproduce a bug, open the page, or judge basic quality when you can collect that evidence yourself. If a check is blocked, do the independent checks first and name the specific gap.

1. **Define 3–5 falsifiable acceptance checks before editing.** Write the expected parts, state transitions, and risky contacts independently of the implementation. For a vague repair, run the existing page first and try normal use, travel limits, and repeated input; don't claim to have reproduced the user's exact symptom unless you did. Capture baseline evidence for the defect you find.
2. **Drive the shipped page over HTTP with Playwright.** Default to an isolated Chromium session for browser QA: use Playwright locators, mouse or touch input, keyboard input, state assertions, and screenshots. Use page evaluation for readback and geometry measurements, not to substitute synthetic events or direct setters for real input. Keep Playwright in the QA environment, not in the standalone deliverable. If Playwright cannot run, report the blocker and label any fallback checks separately. Verify modules and shaders load, the canvas draws a model, the figure fits on desktop and at 390 px, and controls remain usable. Test the real pointer gesture and native or keyboard equivalent; inspect camera, part transforms or materials, and readout afterward. Calling the setter directly tests the model, not picking, pointer capture or gesture delivery. Cover start/middle/stop, reverse from the stop, release outside or cancel, and repeat/reset. For timed behavior, verify actual mid-motion, completion, and interruption; wait on state with a deadline, not a fixed sleep. When shared viewer code changes, smoke-test all affected examples and run deeper checks on the changed mechanisms.
3. **Check the actual mechanism and try a failing case.** Capture and visually inspect Playwright screenshots from the front three-quarter, side, and rear three-quarter angles, plus a phone-width view. Add a close crop of the riskiest interface at its worst pose; add an underside or overhead shot when it exposes a hidden contact. Use one compact contact sheet where practical. Inspect the images yourself before calling visual QA passed; saving screenshots alone is not a check.

   **Make QA images disposable.** Prefer in-memory screenshots when they can be inspected directly. Otherwise write only to a dedicated temporary directory created for this QA run, outside the deliverable. After inspecting the last capture and recording findings in text, clean up the screenshots, crops, and contact sheets in a `finally` block, including on failed checks. Verify the resolved cleanup path is the exact run-owned directory before removing it. Never delete user files or existing artifacts, and retain QA images only when the user explicitly requests them.

    Measure jaw gaps and handle sweep, gripper attachment through elbow travel, or pour endpoints and fill level as applicable. For cables derive endpoints from shared local datums, then sample the generated tube rings against the boots, nearby solids and support plane across relevant poses. Bounds are a screening test, not exact collision proof. For the riskiest numerical check, temporarily introduce a known bad state in a disposable probe (e.g. offset a cable end), verify it fails, and discard the mutation. A clean console, a plausible screenshot, and a passing setter test each prove different things; none certifies the whole model.
4. **Fix and rerun on the final page.** Keep a compact `defect → evidence → patch → rerun` log. Fix missing parts, lost contacts, clipping and broken input before cosmetics. Batch checks in one reusable probe and capture only views that answer a question. Budget two passes for optional polish, not for known functional failures. Ship only with the required checks passing or explicitly report the remaining failure or blocked check. In the handoff, summarize what changed, what ran, and what remains unverified; don't turn routine QA into homework for the user.
