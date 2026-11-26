import * as THREE from 'three';

export function addStudioLights(scene, extent = 7) {
  const hemisphere = new THREE.HemisphereLight(0xf7f5e9, 0x98a6a0, 1.25);
  scene.add(hemisphere);
  const key = new THREE.DirectionalLight(0xfff0da, 1.85);
  key.position.set(-5, 10, 7);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = key.shadow.camera.bottom = -extent;
  key.shadow.camera.right = key.shadow.camera.top = extent;
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 40;
  key.shadow.bias = -0.00015;
  key.shadow.normalBias = 0.025;
  key.shadow.radius = 3;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xdceaf1, 0.45);
  fill.position.set(6, 5, -6);
  scene.add(fill);
  return { key, hemisphere, fill };
}

export const PALETTES = {
  butter: { shell: '#e6d6ac', trim: '#b8ac8b', accent: '#e8a063', dark: '#434d48', secondary: '#90aaa0', name: 'Butter' },
  mint: { shell: '#acc8b5', trim: '#7c9c8b', accent: '#e6b777', dark: '#374c47', secondary: '#eee0ba', name: 'Mint' },
  lilac: { shell: '#c4b5d0', trim: '#9b8cac', accent: '#e69b85', dark: '#494353', secondary: '#a6c4c2', name: 'Lilac' },
  sky: { shell: '#a9c7d4', trim: '#7e9eaf', accent: '#e9b775', dark: '#3c4b55', secondary: '#e6d8b5', name: 'Sky' },
};

export function createComputerMaterials(look, palette = 'butter') {
  const colors = PALETTES[palette] || PALETTES.butter;
  const materials = {
    shell: look.toon(colors.shell),
    trim: look.toon(colors.trim),
    accent: look.toon(colors.accent),
    dark: look.toon(colors.dark),
    secondary: look.toon(colors.secondary),
    black: look.toon('#303b38'),
    metal: look.toon('#a3aaa0'),
    paper: look.toon('#f2e7cc'),
    coffee: look.toon('#7c5341', { outline: false }),
    leaf: look.toon('#819b76'),
    soil: look.toon('#665344', { outline: false }),
    screen: look.flat('#a8c9ba', { toneMapped: false }),
    glow: look.flat('#edba78', { toneMapped: false }),
  };
  materials.shell.name = 'shell';
  materials.trim.name = 'trim';
  materials.accent.name = 'accent';
  materials.secondary.name = 'secondary';
  materials.dark.name = 'dark';
  return materials;
}

export function applyPalette(materials, name) {
  const palette = PALETTES[name];
  if (!palette) throw new Error(`Unknown palette: ${name}`);
  for (const role of ['shell', 'trim', 'accent', 'dark', 'secondary']) materials[role].color.set(palette[role]);
}
