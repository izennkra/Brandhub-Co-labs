// Rendu d'un prisme (pyramide de verre) en 3D avec three.js, dans un Chromium sans fenêtre.
// Illustration « Prisme » de la bibliothèque (reference/illustrations/prisme.png).
// Usage : node scripts/render-prisme.mjs . reference/illustrations/prisme.png
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [project, out] = process.argv.slice(2);
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
    void main(){
      vec3 n = normalize(vN);
      if (!gl_FrontFacing) n = -n;
      vec3 deep = vec3(0.02, 0.27, 0.45);
      vec3 mid  = vec3(0.10, 0.55, 0.78);
      vec3 cyan = vec3(0.62, 0.92, 0.96);
      vec3 L = normalize(vec3(-0.5, 0.7, 0.6));
      float diff = clamp(dot(n, L) * 0.5 + 0.5, 0.0, 1.0);
      // dégradé vertical et selon la lumière : bas foncé, haut clair
      float t = clamp(diff * 0.55 + (vW.y + 1.2) / 2.6 * 0.5, 0.0, 1.0);
      // chaque face a sa valeur : gauche claire, droite plus profonde, comme un vrai verre éclairé
      t += vFace < 0.5 ? 0.32 : (vFace < 1.5 ? -0.22 : -0.2);
      t = clamp(t, 0.0, 1.0);
      vec3 col = mix(deep, mid, smoothstep(0.0, 0.55, t));
      col = mix(col, cyan, smoothstep(0.45, 1.0, t));
      // reflets doux et flous, propres à chaque face (verre dépoli)
      float h = 0.0;
      if (vFace < 0.5) {
        h += blob(vBary, vec3(0.42, 0.18, 0.40), 0.26) * 1.0;
        h += blob(vBary, vec3(0.70, 0.22, 0.08), 0.18) * 0.7;
        h += blob(vBary, vec3(0.10, 0.20, 0.70), 0.18) * 0.35;
      } else if (vFace < 1.5) {
        h += blob(vBary, vec3(0.22, 0.30, 0.48), 0.30) * 1.05;
        h += blob(vBary, vec3(0.62, 0.05, 0.33), 0.16) * 0.5;
        h += blob(vBary, vec3(0.05, 0.65, 0.30), 0.14) * 0.25;
      } else if (vFace < 2.5) {
        h += blob(vBary, vec3(0.35, 0.35, 0.30), 0.25) * 0.5;
      } else {
        h += blob(vBary, vec3(0.33, 0.33, 0.33), 0.30) * 0.35;
      }
      col = mix(col, vec3(1.0), clamp(h, 0.0, 0.92));
      // bords plus clairs (Fresnel) et arêtes nettes, foncées
      float fres = pow(1.0 - abs(n.z), 2.0);
      col = mix(col, vec3(0.85, 0.97, 1.0), fres * 0.35);
      float e = min(min(vBary.x, vBary.y), vBary.z);
      float edge = 1.0 - smoothstep(0.003, 0.008, e);
      col = mix(col, vec3(0.02, 0.16, 0.30), edge * 0.9);
      // liseré clair juste à l'intérieur des arêtes (épaisseur du verre)
      float rim = smoothstep(0.004, 0.008, e) * (1.0 - smoothstep(0.008, 0.03, e));
      col = mix(col, vec3(0.9, 0.98, 1.0), rim * 0.35);
      float alpha = uBack > 0.5 ? 0.6 : 0.74;
      if (uBack > 0.5) col = mix(col, deep, 0.35);
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
