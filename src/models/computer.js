import * as THREE from 'three';
import { box, cylinder, mesh, roundedBox, tube } from '../core/geometry.js';

/** Complete, authored miniature personal computer. Front faces +Z; desk is y=0. */
export function createComputer(look, materials) {
  const group = new THREE.Group();
  group.name = 'personal-computer';
  const monitor = new THREE.Group();
  monitor.name = 'monitor-assembly';
  monitor.position.set(-0.45, 0, -0.4);
  group.add(monitor);

  // Weighted swivel base and connected support, not a floating display.
  box(monitor, [1.8, 0.18, 1.2], [0, 0.13, 0.06], materials.trim, 0.11, 'monitor-foot');
  box(monitor, [1.6, 0.12, 1.04], [0, 0.25, 0.04], materials.shell, 0.08, 'monitor-foot-top');
  cylinder(monitor, 0.26, 0.48, [0, 0.48, -0.05], materials.dark, { name: 'swivel-neck' });
  cylinder(monitor, 0.34, 0.12, [0, 0.69, -0.05], materials.trim, { name: 'swivel-joint' });
  box(monitor, [0.7, 0.65, 0.44], [0, 0.73, -0.07], materials.shell, 0.08, 'monitor-support');

  // The shell is assembled from a back, bezel and inset front, leaving the
  // display recessed. Rounded exterior fillets have no triangle-wireframe ink.
  box(monitor, [2.62, 2.05, 1.57], [0, 1.74, -0.03], materials.shell, 0.15, 'monitor-housing');
  box(monitor, [2.49, 1.9, 0.18], [0, 1.75, 0.77], materials.trim, 0.1, 'front-bezel');
  box(monitor, [2.08, 1.49, 0.12], [0, 1.85, 0.89], materials.dark, 0.1, 'screen-recess');
  const screen = mesh(monitor, roundedBox(1.92, 1.32, 0.035, 0.08), materials.screen, { position: [0, 1.87, 0.96], name: 'crt-screen', shadow: false });
  screen.userData.noInk = true;

  // Lower bezel hardware: deliberately sparse and larger than one screen pixel.
  box(monitor, [0.42, 0.065, 0.035], [-0.69, 0.91, 0.91], materials.secondary, 0.015, 'maker-badge');
  cylinder(monitor, 0.065, 0.035, [0.87, 0.91, 0.92], materials.dark, { rotation: [Math.PI / 2, 0, 0], name: 'brightness-dial' });
  cylinder(monitor, 0.034, 0.035, [0.62, 0.91, 0.92], materials.glow, { rotation: [Math.PI / 2, 0, 0], name: 'power-led' });
  box(monitor, [0.18, 0.055, 0.025], [0.3, 0.91, 0.91], materials.black, 0.01, 'power-button');

  // Rear/side ventilation and service details remain when orbiting.
  for (let i = 0; i < 8; i++) {
    box(monitor, [0.018, 0.055, 0.6], [1.309, 1.35 + i * 0.115, -0.12], materials.dark, 0.006, `side-vent-${i}`);
  }
  for (let i = 0; i < 7; i++) {
    box(monitor, [0.42, 0.05, 0.025], [0.65, 1.12 + i * 0.13, -0.829], materials.dark, 0.006, `rear-vent-${i}`);
  }
  box(monitor, [1.38, 0.5, 0.045], [-0.28, 1.32, -0.834], materials.trim, 0.035, 'rear-service-panel');
  for (const x of [-0.85, 0.29]) for (const y of [1.14, 1.5]) {
    cylinder(monitor, 0.028, 0.026, [x, y, -0.868], materials.metal, { rotation: [Math.PI / 2, 0, 0], segments: 12, name: 'rear-screw' });
  }
  box(monitor, [0.4, 0.15, 0.06], [-0.59, 1.32, -0.88], materials.black, 0.016, 'video-port');
  box(monitor, [0.22, 0.13, 0.07], [-0.05, 1.32, -0.88], materials.black, 0.016, 'power-port');
  tube(group, [[-0.5, 1.32, -1.3], [-0.5, 0.5, -1.58], [0.12, 0.08, -1.52], [0.32, 0.065, -1.13]], 0.038, materials.dark, 'power-cable');

  const keyboard = new THREE.Group();
  keyboard.name = 'keyboard-assembly';
  keyboard.position.set(-0.35, 0.015, 1.62);
  keyboard.rotation.y = -0.035;
  group.add(keyboard);
  box(keyboard, [2.48, 0.19, 0.94], [0, 0.12, 0], materials.trim, 0.065, 'keyboard-case');
  box(keyboard, [2.33, 0.1, 0.82], [0, 0.23, -0.015], materials.shell, 0.035, 'keyboard-deck');
  for (let row = 0; row < 4; row++) {
    const count = row === 3 ? 10 : 13;
    for (let col = 0; col < count; col++) {
      const x = (col - (count - 1) / 2) * 0.166;
      const z = -0.275 + row * 0.165;
      const special = (row === 0 && col === 0) || (row === 2 && col >= 10);
      box(keyboard, [0.13, 0.065, 0.12], [x, 0.31, z], special ? materials.secondary : materials.paper, 0.012, `key-${row}-${col}`);
    }
  }
  box(keyboard, [0.94, 0.065, 0.12], [0, 0.31, 0.375], materials.paper, 0.015, 'spacebar');
  box(keyboard, [0.13, 0.065, 0.12], [-0.84, 0.31, 0.375], materials.accent, 0.015, 'return-key');
  box(keyboard, [0.13, 0.065, 0.12], [0.84, 0.31, 0.375], materials.secondary, 0.015, 'shift-key');
  tube(group, [[-0.65, 0.13, 1.13], [-0.8, 0.09, 0.91], [-0.1, 0.055, 0.65], [0.4, 0.1, 0.2], [0.27, 0.73, 0.0]], 0.026, materials.dark, 'keyboard-cable');

  const mouse = new THREE.Group();
  mouse.name = 'mouse-assembly';
  mouse.position.set(1.42, 0, 1.55);
  mouse.rotation.y = -0.16;
  group.add(mouse);
  box(mouse, [0.54, 0.22, 0.76], [0, 0.13, 0], materials.trim, 0.15, 'mouse-shell');
  box(mouse, [0.22, 0.07, 0.33], [-0.125, 0.245, -0.14], materials.shell, 0.05, 'mouse-left');
  box(mouse, [0.22, 0.07, 0.33], [0.125, 0.245, -0.14], materials.shell, 0.05, 'mouse-right');
  cylinder(mouse, 0.044, 0.1, [0, 0.3, -0.12], materials.dark, { rotation: [0, 0, Math.PI / 2], segments: 16, name: 'mouse-wheel' });
  tube(group, [[1.43, 0.15, 1.17], [1.48, 0.06, 0.84], [1.17, 0.045, 0.56], [0.67, 0.08, 0.36], [0.65, 0.9, 0.12]], 0.024, materials.dark, 'mouse-cable');

  group.userData.parts = ['monitor-housing', 'front-bezel', 'crt-screen', 'monitor-foot', 'swivel-neck', 'side-vent-0', 'rear-service-panel', 'video-port', 'power-cable', 'keyboard-case', 'key-0-0', 'spacebar', 'keyboard-cable', 'mouse-shell', 'mouse-left', 'mouse-wheel', 'mouse-cable'];
  return group;
}
