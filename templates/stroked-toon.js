// Material contract adapted from sloemo01/diorama templates/stroked-toon.js at
// a4cb078. MIT: Copyright (c) 2026 Nehal Kanak / Sloemo01; docs/DIORAMA-LICENSE.
// New in isom3trics: visible-surface depth/normal ink replaces inverted hulls.
import * as THREE from 'three';

export const STROKED_TOON_DEFAULTS = Object.freeze({
  bands: Object.freeze([88, 145, 205, 255]),
  ink: 0x363b38,
  strokePx: 1.25,
  maxDpr: 2,
});

export function makeToonRamp(bands = STROKED_TOON_DEFAULTS.bands) {
  if (bands.length !== 4 || !bands.every(v => Number.isInteger(v) && v >= 0 && v <= 255)) {
    throw new Error('isom3trics requires four byte-valued shade steps');
  }
  const ramp = new THREE.DataTexture(new Uint8Array(bands), 4, 1, THREE.RedFormat);
  ramp.minFilter = ramp.magFilter = THREE.NearestFilter;
  ramp.generateMipmaps = false;
  ramp.needsUpdate = true;
  return ramp;
}

export function setToonOutline(material, enabled = true, weight = 1) {
  material.userData.isom3tricsInk = { visible: enabled, weight };
  return material;
}

// Kept as a pure contract helper for camera calibration tests. The replacement
// shader directly uses physical target texels, so strokePx is independent of
// camera distance/zoom and is stable across orthographic/perspective views.
export function projectedOutlineThickness(camera, cssHeight, strokePx) {
  if (!(cssHeight > 0) || !(strokePx >= 0)) throw new Error('A positive viewport and nonnegative stroke are required');
  return 2 * strokePx / (cssHeight * Math.abs(camera.projectionMatrix.elements[5]));
}

const vertexShader = /* glsl */`
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const edgeShader = /* glsl */`
  uniform sampler2D tNormal;
  uniform sampler2D tDepth;
  uniform sampler2D tInk;
  uniform vec2 texel;
  uniform float nearClip;
  uniform float farClip;
  uniform float orthographic;
  varying vec2 vUv;
  float linearDepth(float z) {
    if (orthographic > 0.5) return z;
    float ndc = z * 2.0 - 1.0;
    return (2.0 * nearClip * farClip) / (farClip + nearClip - ndc * (farClip - nearClip)) / farClip;
  }
  void main() {
    float d = linearDepth(texture2D(tDepth, vUv).r);
    vec3 n = texture2D(tNormal, vUv).rgb * 2.0 - 1.0;
    float a = texture2D(tNormal, vUv).a;
    vec3 inkAttributes = texture2D(tInk, vUv).rgb;
    float weight = inkAttributes.r;
    float depthAllowance = inkAttributes.g;
    float normalAllowance = inkAttributes.b;
    if (a < 0.5 || weight < 0.001) discard;
    float edge = 0.0;
    // One-physical-texel samples only. Never dilate the edge mask: dilation
    // merges keyboard keys, vents and bezels into dark bands at small scale.
    for (int i = 0; i < 8; i++) {
      float angle = float(i) * 0.78539816339;
      vec2 uv = vUv + vec2(cos(angle), sin(angle)) * texel;
      float nd = linearDepth(texture2D(tDepth, uv).r);
      vec3 nn = texture2D(tNormal, uv).rgb * 2.0 - 1.0;
      float na = texture2D(tNormal, uv).a;
      vec3 neighborInk = texture2D(tInk, uv).rgb;
      float neighborWeight = neighborInk.r;
      // A signed occlusion test is a clean contact/silhouette edge; symmetric
      // absolute depth deltas ink BOTH sides and double the apparent width.
      float occluded = max(0.0, d - nd);
      float depthEdge = smoothstep(0.0005, 0.0018, occluded) * depthAllowance;
      float normalEdge = (1.0 - smoothstep(0.4, 0.76, dot(n, nn))) * min(a, na) * normalAllowance;
      // The zero-weight region itself is the outer edge; never dilate inward.
      float silhouette = abs(a - na) * step(0.5, a + na);
      float pairWeight = min(weight, na > 0.5 ? neighborWeight : 1.0);
      edge = max(edge, max(depthEdge * min(a, na), max(normalEdge, silhouette)) * pairWeight);
    }
    gl_FragColor = vec4(vec3(edge * 0.82), 1.0);
  }
`;

const compositeShader = /* glsl */`
  uniform sampler2D tColor;
  uniform sampler2D tEdge;
  uniform vec3 ink;
  varying vec2 vUv;
  void main() {
    vec4 surface = texture2D(tColor, vUv);
    float inkAmount = texture2D(tEdge, vUv).r;
    gl_FragColor = vec4(mix(surface.rgb, ink, inkAmount * surface.a), surface.a);
    #include <colorspace_fragment>
  }
`;

export function createStrokedToon(renderer, {
  bands = STROKED_TOON_DEFAULTS.bands,
  ink = STROKED_TOON_DEFAULTS.ink,
  strokePx = STROKED_TOON_DEFAULTS.strokePx,
  maxDpr = STROKED_TOON_DEFAULTS.maxDpr,
  dpr = globalThis.devicePixelRatio || 1,
} = {}) {
  const ramp = makeToonRamp(bands);
  renderer.setPixelRatio(Math.min(Math.max(dpr, 1), maxDpr));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x000000, 0);
  const inkColor = new THREE.Color(ink);
  const ownedMaterials = new Set();
  let stroke = strokePx;
  let width = 1;
  let height = 1;

  const colorTarget = new THREE.WebGLRenderTarget(1, 1, { samples: 4, depthBuffer: true });
  // Multisample the geometry buffers too. Single-sample normals turn small
  // keycaps into a field of jagged ink before the edge pass even runs.
  const normalTarget = new THREE.WebGLRenderTarget(1, 1, { samples: 4, depthBuffer: true });
  normalTarget.depthTexture = new THREE.DepthTexture(1, 1, THREE.UnsignedIntType);
  const normalMaterial = new THREE.MeshNormalMaterial();
  const inkTarget = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: true });
  inkTarget.depthTexture = normalTarget.depthTexture;
  const inkMaterial = new THREE.ShaderMaterial({
    vertexShader: `void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform vec3 inkAttributes; void main() { gl_FragColor = vec4(inkAttributes, 1.0); }`,
    uniforms: { inkAttributes: { value: new THREE.Vector3(1, 1, 1) } },
  });
  const edgeMaterial = new THREE.ShaderMaterial({
    vertexShader, fragmentShader: edgeShader, depthTest: false, depthWrite: false,
    uniforms: {
      tNormal: { value: normalTarget.texture }, tDepth: { value: normalTarget.depthTexture }, tInk: { value: inkTarget.texture },
      texel: { value: new THREE.Vector2(1, 1) }, nearClip: { value: 0.1 }, farClip: { value: 100 }, orthographic: { value: 1 },
    },
  });
  const compositeMaterial = new THREE.ShaderMaterial({
    vertexShader, fragmentShader: compositeShader, depthTest: false, depthWrite: false,
    uniforms: { tColor: { value: colorTarget.texture }, tEdge: { value: edgeMaterial.uniforms.tNormal.value }, ink: { value: inkColor } },
  });
  const edgeTarget = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: false });
  compositeMaterial.uniforms.tEdge.value = edgeTarget.texture;
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), edgeMaterial);
  const passScene = new THREE.Scene();
  passScene.add(quad);
  const passCamera = new THREE.Camera();

  function toon(color, { outline = true, stroke: weight = 1, depth = 1, normal = 1, ...options } = {}) {
    const material = new THREE.MeshToonMaterial({ color, gradientMap: ramp, ...options });
    setToonOutline(material, outline, weight);
    Object.assign(material.userData.isom3tricsInk, { depth, normal });
    ownedMaterials.add(material);
    return material;
  }
  function flat(color, { outline = false, stroke: weight = 1, depth = 0, normal = 0, ...options } = {}) {
    const material = new THREE.MeshBasicMaterial({ color, ...options });
    setToonOutline(material, outline, weight);
    Object.assign(material.userData.isom3tricsInk, { depth, normal });
    ownedMaterials.add(material);
    return material;
  }
  function syncStroke() {
    const ratio = renderer.getPixelRatio();
    // strokePx describes a capped hairline footprint, not an expanding mask.
    // Fixed one-texel detection stays view-based without growing on zoom-out.
    edgeMaterial.uniforms.texel.value.set(Math.min(stroke, 1) * ratio / width, Math.min(stroke, 1) * ratio / height);
  }
  function resize() {
    const size = renderer.getDrawingBufferSize(new THREE.Vector2());
    width = Math.max(1, size.x); height = Math.max(1, size.y);
    colorTarget.setSize(width, height); normalTarget.setSize(width, height); inkTarget.setSize(width, height); edgeTarget.setSize(width, height);
    syncStroke();
  }
  function render(scene, camera) {
    const size = renderer.getDrawingBufferSize(new THREE.Vector2());
    if (size.x !== width || size.y !== height) resize();
    const oldTarget = renderer.getRenderTarget();
    const oldOverride = scene.overrideMaterial;
    const oldClearAlpha = renderer.getClearAlpha();
    const oldClearColor = renderer.getClearColor(new THREE.Color());
    renderer.setRenderTarget(colorTarget);
    renderer.setClearColor(0x000000, 0);
    renderer.clear();
    renderer.render(scene, camera);
    scene.overrideMaterial = normalMaterial;
    renderer.setRenderTarget(normalTarget);
    renderer.setClearColor(0x8080ff, 0);
    renderer.clear();
    renderer.render(scene, camera);
    scene.overrideMaterial = oldOverride;
    // Per-material ink attributes let thin cables be solid strands and small
    // keys keep subtle separation instead of the housing's full crease ink.
    const replacements = [];
    scene.traverse(object => {
      if (!object.isMesh) return;
      const material = object.material;
      if (Array.isArray(material)) return;
      const settings = material.userData.isom3tricsInk || { visible: true, weight: 1 };
      const override = inkMaterial.clone();
      override.uniforms.inkAttributes.value.set(settings.visible ? settings.weight : 0, settings.depth ?? 1, settings.normal ?? 1);
      override.side = material.side;
      replacements.push([object, material, override]);
      object.material = override;
    });
    renderer.setRenderTarget(inkTarget);
    renderer.clear();
    renderer.render(scene, camera);
    for (const [object, original, override] of replacements) { object.material = original; override.dispose(); }
    edgeMaterial.uniforms.nearClip.value = camera.near;
    edgeMaterial.uniforms.farClip.value = camera.far;
    edgeMaterial.uniforms.orthographic.value = camera.isOrthographicCamera ? 1 : 0;
    quad.material = edgeMaterial;
    renderer.setRenderTarget(edgeTarget);
    renderer.clear();
    renderer.render(passScene, passCamera);
    quad.material = compositeMaterial;
    renderer.setRenderTarget(oldTarget);
    renderer.render(passScene, passCamera);
    renderer.setClearColor(oldClearColor, oldClearAlpha);
  }
  return {
    preset: 'isom3trics-stroked-toon', ramp, toon, flat, render, resize,
    setStroke(px) {
      if (!(px >= 0 && px <= 4)) throw new Error('Stroke must be between 0 and 4 CSS pixels');
      stroke = px; syncStroke();
    },
    get strokePx() { return stroke; },
    setInk(color) { inkColor.set(color); },
    dispose() {
      for (const material of ownedMaterials) material.dispose();
      ownedMaterials.clear(); ramp.dispose();
      colorTarget.dispose(); normalTarget.dispose(); inkTarget.dispose(); edgeTarget.dispose();
      normalMaterial.dispose(); inkMaterial.dispose(); edgeMaterial.dispose(); compositeMaterial.dispose(); quad.geometry.dispose();
    },
  };
}
