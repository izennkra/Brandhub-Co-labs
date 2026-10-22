// Rendu d'un prisme (pyramide de verre) en 3D avec three.js, dans un Chromium sans fenêtre.
// Illustration « Prisme » de la bibliothèque (reference/illustrations/prisme.png).
// Usage : node scripts/render-prisme.mjs . reference/illustrations/prisme.png
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const [projectArg, out] = process.argv.slice(2);
const project = resolve(projectArg);
const require = createRequire(join(project, 'package.json'));
const { chromium } = require('@playwright/test');
const threePath = join(project, 'node_modules/three/build/three.min.js');

const SIZE = 1400;
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader'] });
const page = await browser.newPage({ viewport: { width: SIZE, height: SIZE } });
await page.setContent('<html><body style="margin:0;background:#fff"></body></html>');
await page.addScriptTag({ path: threePath });

const dataUrl = await page.evaluate((SIZE) => {
  const THREE = window.THREE;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(SIZE, SIZE);
  renderer.setClearColor(0xffffff, 1);
  document.body.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0.3, 0.3, 8.6);
  camera.lookAt(0, -0.05, 0);

  // Pyramide à base triangulaire : sommet en haut à gauche, base large, comme la référence.
  const apex = new THREE.Vector3(-0.42, 1.38, 0.1);
  const a = new THREE.Vector3(-1.45, -0.95, 0.55);
  const b = new THREE.Vector3(0.55, -1.25, 0.95);
  const c = new THREE.Vector3(1.55, -0.2, -0.75);
  const faces = [
    [apex, a, b], // face avant gauche
    [apex, b, c], // face avant droite
    [apex, c, a], // face arrière
    [a, c, b], // base
  ];
  const pos = [],
    bary = [],
    face = [];
  faces.forEach((f, i) => {
    f.forEach((v, k) => {
      pos.push(v.x, v.y, v.z);
      bary.push(k === 0 ? 1 : 0, k === 1 ? 1 : 0, k === 2 ? 1 : 0);
      face.push(i);
    });
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('bary', new THREE.Float32BufferAttribute(bary, 3));
  geo.setAttribute('face', new THREE.Float32BufferAttribute(face, 1));
  geo.computeVertexNormals();

  const vertex = `
    attribute vec3 bary; attribute float face;
    varying vec3 vBary; varying vec3 vN; varying vec3 vW; varying float vFace;
    void main(){
      vBary = bary; vFace = face; vW = position;
      vN = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`;
  const fragment = `
    uniform float uBack;
    varying vec3 vBary; varying vec3 vN; varying vec3 vW; varying float vFace;
    float blob(vec3 p, vec3 c, float r){ vec3 d = p - c; return exp(-dot(d,d) / (r*r)); }
    vec3 corners(vec3 c0, vec3 c1, vec3 c2){ return c0 * vBary.x + c1 * vBary.y + c2 * vBary.z; }
    void main(){
      vec3 n = normalize(vN);
      if (!gl_FrontFacing) n = -n;
      vec3 deep = vec3(0.02, 0.24, 0.44);
      // couleurs aux coins de chaque face, comme un verre teinté éclairé par le haut à gauche
      vec3 col;
      float h = 0.0, d = 0.0;
      if (vFace < 0.5) {
        // face gauche : très claire en haut, bleu profond dans le coin gauche
        col = corners(vec3(0.82, 0.96, 0.98), vec3(0.03, 0.33, 0.60), vec3(0.16, 0.62, 0.82));
        h += blob(vBary, vec3(0.42, 0.14, 0.44), 0.22) * 0.95;
        h += blob(vBary, vec3(0.26, 0.30, 0.44), 0.14) * 0.45;
        d += blob(vBary, vec3(0.10, 0.72, 0.18), 0.22) * 0.55;
      } else if (vFace < 1.5) {
        // face droite : sarcelle en haut, cyan en bas, bleu-violet à droite, grand reflet blanc
        col = corners(vec3(0.16, 0.58, 0.60), vec3(0.36, 0.84, 0.93), vec3(0.40, 0.52, 0.80));
        h += blob(vBary, vec3(0.20, 0.42, 0.38), 0.27) * 1.15;
        h += blob(vBary, vec3(0.08, 0.30, 0.62), 0.16) * 0.55;
        d += blob(vBary, vec3(0.62, 0.10, 0.28), 0.16) * 0.35;
      } else {
        col = mix(deep, vec3(0.20, 0.55, 0.75), 0.5);
        h += blob(vBary, vec3(0.33, 0.33, 0.33), 0.30) * 0.3;
      }
      col = mix(col, deep, clamp(d, 0.0, 0.7));
      col = mix(col, vec3(0.97, 0.99, 1.0), clamp(h, 0.0, 0.95));
      float e = min(min(vBary.x, vBary.y), vBary.z);
      float edge = 1.0 - smoothstep(0.0015, 0.0045, e);
      col = mix(col, vec3(0.03, 0.20, 0.36), edge * 0.75);
      float rim = smoothstep(0.004, 0.007, e) * (1.0 - smoothstep(0.007, 0.022, e));
      col = mix(col, vec3(0.92, 0.99, 1.0), rim * 0.3);
      float alpha = uBack > 0.5 ? 0.5 : 0.88;
      if (uBack > 0.5) col = mix(col, deep, 0.45);
      gl_FragColor = vec4(col, alpha);
    }`;
  const make = (side, back) =>
    new THREE.ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      uniforms: { uBack: { value: back } },
      transparent: true,
      depthWrite: false,
      side,
    });
  const backMesh = new THREE.Mesh(geo, make(THREE.BackSide, 1));
  const frontMesh = new THREE.Mesh(geo, make(THREE.FrontSide, 0));
  backMesh.renderOrder = 0;
  frontMesh.renderOrder = 1;
  const group = new THREE.Group();
  group.add(backMesh, frontMesh);
  group.rotation.set(0.12, -0.25, 0.05);
  scene.add(group);
  renderer.render(scene, camera);
  // recadrage serré sur le prisme (6 % de marge), fond blanc
  const src = renderer.domElement;
  const probe = document.createElement('canvas');
  probe.width = probe.height = SIZE;
  const px = probe.getContext('2d');
  px.drawImage(src, 0, 0);
  const { data } = px.getImageData(0, 0, SIZE, SIZE);
  let x0 = SIZE,
    y0 = SIZE,
    x1 = 0,
    y1 = 0;
  for (let y = 0; y < SIZE; y++)
    for (let x = 0; x < SIZE; x++) {
      const i = (y * SIZE + x) * 4;
      if (data[i] + data[i + 1] + data[i + 2] < 740) {
        x0 = Math.min(x0, x);
        x1 = Math.max(x1, x);
        y0 = Math.min(y0, y);
        y1 = Math.max(y1, y);
      }
    }
  const m = Math.round(0.06 * Math.max(x1 - x0, y1 - y0));
  const out = document.createElement('canvas');
  out.width = x1 - x0 + 2 * m;
  out.height = y1 - y0 + 2 * m;
  const ox = out.getContext('2d');
  ox.fillStyle = '#fff';
  ox.fillRect(0, 0, out.width, out.height);
  ox.drawImage(src, x0 - m, y0 - m, out.width, out.height, 0, 0, out.width, out.height);
  return out.toDataURL('image/png');
}, SIZE);

writeFileSync(out, Buffer.from(dataUrl.split(',')[1], 'base64'));
await browser.close();
console.log('écrit :', out);
