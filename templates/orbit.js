// Direct component orbit with a deterministic reset pose and no automatic spin.
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function createObjectOrbit(camera, canvas, {
  target, minZoom = 0.65, maxZoom = 2.5,
  minPolarAngle = 0.08, maxPolarAngle = Math.PI * 0.49,
  onChange = () => {},
} = {}) {
  const controls = new OrbitControls(camera, canvas);
  if (target) controls.target.copy(target);
  controls.enablePan = false;
  controls.autoRotate = false;
  controls.enableDamping = false;
  Object.assign(controls, { minZoom, maxZoom, minPolarAngle, maxPolarAngle });
  controls.update();
  const heroPosition = camera.position.clone();
  const heroTarget = controls.target.clone();
  const heroZoom = camera.zoom;
  function reset() {
    camera.position.copy(heroPosition);
    camera.zoom = heroZoom;
    controls.target.copy(heroTarget);
    camera.updateProjectionMatrix();
    controls.update();
    onChange();
  }
  function key(event) {
    if (event.target !== canvas) return;
    if (event.key.toLowerCase() === 'r') { event.preventDefault(); reset(); return; }
    const delta = { ArrowLeft: [-0.12, 0], ArrowRight: [0.12, 0], ArrowUp: [0, -0.12], ArrowDown: [0, 0.12] }[event.key];
    if (!delta) return;
    event.preventDefault();
    const offset = camera.position.clone().sub(controls.target);
    const radius = offset.length();
    const theta = Math.atan2(offset.x, offset.z) + delta[0];
    const phi = Math.max(minPolarAngle, Math.min(maxPolarAngle, Math.acos(offset.y / radius) + delta[1]));
    offset.set(radius * Math.sin(phi) * Math.sin(theta), radius * Math.cos(phi), radius * Math.sin(phi) * Math.cos(theta));
    camera.position.copy(controls.target).add(offset);
    controls.update();
    onChange();
  }
  const oldTabIndex = canvas.getAttribute('tabindex');
  if (oldTabIndex === null) canvas.tabIndex = 0;
  canvas.addEventListener('keydown', key);
  controls.addEventListener('change', onChange);
  return {
    controls, reset, heroPosition, heroTarget,
    dispose() {
      canvas.removeEventListener('keydown', key);
      controls.removeEventListener('change', onChange);
      controls.dispose();
      if (oldTabIndex === null) canvas.removeAttribute('tabindex');
    },
  };
}
