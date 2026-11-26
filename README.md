# isom3trics

A reusable skill for **colored, rotatable, stroked-toon components on a clean canvas**, with view-dependent, material-aware stroke rendering.

An independent artifact of [`sloemo01/diorama`](https://github.com/sloemo01/diorama).

**The output is the object—not a website.** No headings, text, labels, UI, fonts, scene timelines or educational panels.

## Run the computer example

```sh
npm install
npm run dev
```

Open the printed local URL. Drag/touch to orbit; scroll/pinch to zoom; focus the canvas and use arrow keys or **R** to reset. The only page element is the canvas.

```sh
npm test          # renderer contracts
npm run dev       # required in another terminal for browser QA
npm run qa        # canvas-only, rotation, zoom, reset, mobile, WebGL errors
npm run build
```

## Use the skill

Give [`SKILL.md`](SKILL.md) to a skill-capable coding agent, or copy it into your skills directory. It directs the agent to copy from `templates/`, accept a `createModel(look)` component factory, and render only that component.

```js
const viewer = createViewer(canvas, {
  stroke: 1.25,
  createModel(look) {
    const group = new THREE.Group();
    // Build your complete, colored object here using look.toon(color).
    return group;
  },
});
```

## The stroke correction

Upstream `OutlineEffect` expands inverted mesh backfaces. In this miniature, those hulls bled through thin beveled parts. The replacement uses visible view-space normals and depth to detect edges at the current camera angle.

The edge mask uses a fixed one-physical-texel footprint and does **not dilate** when zooming out. A signed depth test avoids doubling both sides of an occlusion. Multisampled normal/depth targets reduce jagged ink on small parts. Small keycaps, vents and hardware receive shadows without each casting a second dark silhouette onto neighboring details. This keeps the line closer to a fine isometric illustration while preserving free rotation.

`strokePx` is a capped hairline setting, not an instruction to grow a neighborhood mask. To change line emphasis, adjust `look.setStroke(px)`; geometry remains in true 3D and the edge calculation remains view-based.

## Files

- [`SKILL.md`](SKILL.md) — complete agent instructions and scope.
- [`templates/`](templates) — reusable renderer, orbit, geometry, light and generic viewer.
- [`examples/computer.js`](examples/computer.js) — authored object geometry.
- [`src/`](src) — runnable canvas example using the same modules.
- [`qa/captures/`](qa/captures) — desktop, phone, front, rear, high and zoom evidence.

## License

isom3trics is MIT licensed. See [`LICENSE`](LICENSE).
