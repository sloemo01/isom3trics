import * as THREE from 'three';
import { createStrokedToon } from './stroked-toon.js';
import { createObjectOrbit } from './orbit.js';
import { addStudioLights } from './lighting.js';

/** Neutral canvas host. The caller supplies the entire component; no DOM or text. */
export function createViewer(canvas, { createModel, stroke = 1.25, azimuth = 34, elevation = 28, fill = 0.75 } = {}) {
  if (typeof createModel !== 'function') throw new Error('createViewer requires a createModel(look) component factory');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-5, 5, 4, -4, 0.1, 100);
  const look = createStrokedToon(renderer, { strokePx: stroke });
  addStudioLights(scene, 7);
  const model = createModel(look);
  if (!model?.isObject3D) throw new Error('createModel must return a THREE.Object3D');
  scene.add(model);
  let orbit;
  let destroyed = false;
  let lastFitKey = '';

  function render() { if (!destroyed) look.render(scene, camera); }
  function fit() {
    const rect = canvas.parentElement.getBoundingClientRect();
    const key = `${Math.round(rect.width)}:${Math.round(rect.height)}`;
    if (key === lastFitKey) return;
    lastFitKey = key;
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    const aspect = width / height;
    const bounds = new THREE.Box3().setFromObject(model);
    const target = bounds.getCenter(new THREE.Vector3());
    const a = THREE.MathUtils.degToRad(azimuth);
    const e = THREE.MathUtils.degToRad(elevation);
    const direction = new THREE.Vector3(Math.cos(e) * Math.sin(a), Math.sin(e), Math.cos(e) * Math.cos(a));
    const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), direction).normalize();
    const up = new THREE.Vector3().crossVectors(direction, right).normalize();
    let horizontal = 0;
    let vertical = 0;
    for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
      const point = new THREE.Vector3(x, y, z).sub(target);
      horizontal = Math.max(horizontal, Math.abs(point.dot(right)));
      vertical = Math.max(vertical, Math.abs(point.dot(up)));
    }
    const halfHeight = Math.max(vertical / fill, horizontal / (fill * aspect));
    Object.assign(camera, { left: -halfHeight * aspect, right: halfHeight * aspect, top: halfHeight, bottom: -halfHeight, zoom: 1 });
    camera.position.copy(target).addScaledVector(direction, 20);
    camera.lookAt(target);
    camera.updateProjectionMatrix();
    orbit?.dispose();
    orbit = createObjectOrbit(camera, canvas, { target, onChange: render });
    renderer.setSize(width, height, false);
    look.resize();
    render();
  }
  const resizeObserver = new ResizeObserver(fit);
  // Observe the CSS viewport/parent, never the resized WebGL backing canvas.
  resizeObserver.observe(canvas.parentElement);
  fit();

  return {
    scene, camera, renderer, look, model,
    get orbit() { return orbit; },
    render,
    reset() { orbit.reset(); },
    setView(nextAzimuth = azimuth, nextElevation = elevation) {
      const a = THREE.MathUtils.degToRad(nextAzimuth);
      const e = THREE.MathUtils.degToRad(nextElevation);
      const direction = new THREE.Vector3(Math.cos(e) * Math.sin(a), Math.sin(e), Math.cos(e) * Math.cos(a));
      camera.position.copy(orbit.controls.target).addScaledVector(direction, 20);
      camera.lookAt(orbit.controls.target);
      orbit.controls.update();
      render();
    },
    freeze(time = 0) { model.userData.time = time; render(); },
    setStroke(px) { look.setStroke(px); render(); },
    snapshot() { return renderer.domElement.toDataURL('image/png'); },
    getStats() {
      let meshes = 0;
      let finite = true;
      model.traverse(object => {
        if (!object.isMesh) return;
        meshes++;
        for (const value of object.geometry.attributes.position.array) if (!Number.isFinite(value)) finite = false;
      });
      return { mode: 'component', meshes, finite, strokePx: look.strokePx, camera: camera.position.toArray(), zoom: camera.zoom, time: model.userData.time || 0 };
    },
    dispose() {
      destroyed = true;
      resizeObserver.disconnect();
      orbit.dispose();
      const geometries = new Set();
      model.traverse(object => { if (object.geometry) geometries.add(object.geometry); });
      for (const geometry of geometries) geometry.dispose();
      look.dispose();
      renderer.dispose();
    },
  };
}
