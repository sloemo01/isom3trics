import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { makeToonRamp, setToonOutline, createStrokedToon, projectedOutlineThickness } from '../src/core/stroked-toon.js';

function fakeRenderer() {
  return {
    domElement: { clientHeight: 800 }, shadowMap: {}, passes: [], clearAlpha: 0, clearColor: new THREE.Color(),
    setPixelRatio(v) { this.dpr = v; },
    getPixelRatio() { return this.dpr || 1; },
    getDrawingBufferSize(v) { return v.set(1200, 800); },
    getRenderTarget() { return null; },
    setRenderTarget(v) { this.target = v; },
    getClearAlpha() { return this.clearAlpha; },
    getClearColor(v) { return v.copy(this.clearColor); },
    setClearColor(c, a) { this.clearColor.set(c); this.clearAlpha = a; },
    clear() {},
    render(scene) { this.passes.push(scene); },
  };
}

test('retains upstream four-tone ramp and native rendering settings', () => {
  const ramp = makeToonRamp();
  assert.deepEqual([...ramp.image.data], [88, 145, 205, 255]);
  assert.equal(ramp.minFilter, THREE.NearestFilter);
  assert.equal(ramp.generateMipmaps, false);
  assert.throws(() => makeToonRamp([0, 1, 2]));
  assert.throws(() => makeToonRamp([0, 1, 2, 256]));
  const renderer = fakeRenderer();
  const look = createStrokedToon(renderer, { dpr: 3 });
  assert.equal(renderer.dpr, 2);
  assert.equal(renderer.outputColorSpace, THREE.SRGBColorSpace);
  assert.equal(renderer.toneMapping, THREE.NoToneMapping);
  assert.equal(renderer.shadowMap.type, THREE.PCFSoftShadowMap);
  look.dispose(); ramp.dispose();
});

test('flat/cavity materials opt out of ink without a second inverted hull', () => {
  const material = new THREE.MeshToonMaterial();
  assert.equal(setToonOutline(material, false), material);
  assert.deepEqual(material.userData.isom3tricsInk, { visible: false, weight: 1 });
  setToonOutline(material, true, 0.6);
  assert.deepEqual(material.userData.isom3tricsInk, { visible: true, weight: 0.6 });
  assert.equal(material.userData.outlineParameters, undefined);
  material.dispose();
});

test('stroke projection is in CSS pixels and scales with zoom and viewport', () => {
  const camera = new THREE.OrthographicCamera(-4, 4, 3, -3, 0.1, 100);
  camera.updateProjectionMatrix();
  const base = projectedOutlineThickness(camera, 600, 1.5);
  assert.ok(Math.abs(base - 2 * 1.5 / (600 * camera.projectionMatrix.elements[5])) < 1e-12);
  camera.zoom = 2; camera.updateProjectionMatrix();
  assert.ok(Math.abs(projectedOutlineThickness(camera, 600, 1.5) - base / 2) < 1e-12);
  assert.equal(projectedOutlineThickness(camera, 1200, 1.5), base / 4);
  assert.throws(() => projectedOutlineThickness(camera, 0, 1));
});

test('renderer uses visible depth/normal geometry and restores scene overrides', () => {
  const renderer = fakeRenderer();
  const look = createStrokedToon(renderer);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-3, 3, 2, -2, 0.1, 100);
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(), look.toon('#a9c4b1'));
  scene.add(mesh);
  look.render(scene, camera);
  // One extra fullscreen pass isolates the edge mask from the composite.
  assert.equal(renderer.passes.length, 4);
  assert.equal(renderer.passes[0], scene);
  assert.equal(renderer.passes[1], scene);
  assert.notEqual(renderer.passes[2], scene);
  assert.equal(scene.overrideMaterial, null);
  assert.equal(mesh.material.type, 'MeshToonMaterial');
  assert.equal(renderer.clearAlpha, 0);
  look.setStroke(2.2);
  assert.equal(look.strokePx, 2.2);
  assert.throws(() => look.setStroke(5));
  look.dispose(); mesh.geometry.dispose();
});

test('all owned toon/flat materials and GPU passes are disposed', () => {
  const look = createStrokedToon(fakeRenderer());
  const toon = look.toon('#abcdef');
  const flat = look.flat('#ffeecc');
  let disposed = 0;
  for (const material of [toon, flat, look.ramp]) material.addEventListener('dispose', () => disposed++);
  look.dispose();
  assert.equal(disposed, 3);
});
