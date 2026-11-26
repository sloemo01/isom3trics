import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export function roundedBox(width, height, depth, radius = 0.08, segments = 3) {
  return new RoundedBoxGeometry(width, height, depth, segments, Math.min(radius, width / 3, height / 3, depth / 3));
}

export function mesh(parent, geometry, material, { position = [0, 0, 0], rotation = [0, 0, 0], name = '', shadow = true, castShadow = shadow } = {}) {
  const object = new THREE.Mesh(geometry, material);
  object.name = name;
  object.position.set(...position);
  object.rotation.set(...rotation);
  // Small keys, vents and hardware receive the assembly's shadow but should
  // not each cast another dark block onto adjacent details at miniature scale.
  const bounds = geometry.boundingBox || (geometry.computeBoundingBox(), geometry.boundingBox);
  const size = bounds.getSize(new THREE.Vector3());
  const smallest = Math.min(size.x, size.y, size.z);
  const largest = Math.max(size.x, size.y, size.z);
  object.castShadow = castShadow && !(smallest < 0.16 && largest < 0.85);
  object.receiveShadow = shadow;
  parent.add(object);
  return object;
}

export function box(parent, size, position, material, radius = 0.035, name = '') {
  return mesh(parent, roundedBox(...size, radius), material, { position, name });
}

export function cylinder(parent, radius, height, position, material, { rotation = [0, 0, 0], segments = 32, name = '' } = {}) {
  return mesh(parent, new THREE.CylinderGeometry(radius, radius, height, segments), material, { position, rotation, name });
}

export function sphere(parent, radius, position, scale, material, name = '') {
  const object = mesh(parent, new THREE.SphereGeometry(radius, 24, 16), material, { position, name });
  object.scale.set(...scale);
  return object;
}

export function tube(parent, points, radius, material, name = '') {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
  return mesh(parent, new THREE.TubeGeometry(curve, 48, radius, 8, false), material, { name });
}

// Deliberately no text, fonts, labels or canvas texture helpers in this kit.

export function contactShadow(width, depth, opacity = 0.16) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(64, 64, 6, 64, 64, 64);
  gradient.addColorStop(0, `rgba(54,49,39,${opacity})`);
  gradient.addColorStop(0.5, `rgba(54,49,39,${opacity * 0.55})`);
  gradient.addColorStop(1, 'rgba(54,49,39,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  const map = new THREE.CanvasTexture(canvas);
  const material = new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 });
  material.userData.outlineParameters = { visible: false };
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), material);
  shadow.rotation.x = -Math.PI / 2;
  shadow.renderOrder = 1;
  return shadow;
}

export function disposeObject(root) {
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();
  root.traverse(object => {
    if (object.geometry) geometries.add(object.geometry);
    const list = Array.isArray(object.material) ? object.material : object.material ? [object.material] : [];
    for (const material of list) {
      materials.add(material);
      for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
    }
  });
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
  for (const texture of textures) texture.dispose();
}
