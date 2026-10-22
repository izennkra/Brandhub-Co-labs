// Rendu de l'infini de Möbius (ruban de métal en huit, avec sa demi-torsion) en 3D avec three.js,
// dans un Chromium sans fenêtre. Illustration « Infini de Möbius » de la bibliothèque.
// Usage : node scripts/render-mobius.mjs . reference/illustrations/infini-mobius.png
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const [projectArg, out] = process.argv.slice(2);
const project = resolve(projectArg);
const require = createRequire(join(project, 'package.json'));
const { chromium } = require('@playwright/test');
const threePath = join(project, 'node_modules/three/build/three.min.js');

const SIZE = 1600;
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader'] });
const page = await browser.newPage({ viewport: { width: SIZE, height: SIZE } });
await page.setContent('<html><body style="margin:0;background:#fff"></body></html>');
await page.addScriptTag({ path: threePath });

const dataUrl = await page.evaluate((SIZE) => {
  const THREE = window.THREE;
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(SIZE, SIZE);
  renderer.setClearColor(0xffffff, 1);
  document.body.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 100);
  camera.position.set(0, 10.5, 8.2);
  camera.lookAt(0, 0, 0.15);

  // Ruban : un huit couché (lemniscate de Bernoulli) ; au croisement, un brin passe au-dessus de
  // l'autre. La largeur reste dressée sur les boucles et fait un demi-tour au croisement (Möbius).
  const N = 900,
    W = 0.7,
    A = 2.7;
  const curve = (t) => {
    const s = Math.sin(t),
      c = Math.cos(t),
      d = 1 + s * s;
    return new THREE.Vector3((-A * c) / d, 0.32 * s, (A * s * c) / d); // croisement en « / »
  };
  const smooth = (e0, e1, x) => {
    const k = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
    return k * k * (3 - 2 * k);
  };
  const positions = [],
    across = [],
    index = [];
  for (let i = 0; i <= N; i++) {
    const t = (i / N) * Math.PI * 2;
    const p = curve(t);
    const tangent = curve(t + 1e-3)
      .sub(curve(t - 1e-3))
      .normalize();
    const side = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();
    const vertical = new THREE.Vector3().crossVectors(side, tangent).normalize();
    const angle = Math.PI * smooth(Math.PI / 2 - 1.05, Math.PI / 2 + 1.05, t);
    const width = vertical.multiplyScalar(Math.cos(angle)).add(side.multiplyScalar(Math.sin(angle)));
    for (const k of [-1, 1]) {
      const q = p.clone().addScaledVector(width, (k * W) / 2);
      positions.push(q.x, q.y, q.z);
      across.push(k);
    }
    if (i < N) {
      const a = i * 2;
      index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('across', new THREE.Float32BufferAttribute(across, 1));
  geo.setIndex(index);
  geo.computeVertexNormals();

  // Métal brossé : le reflet d'un studio photo (haut clair, sol sombre, deux bandes de lumière),
  // calculé directement dans le shader.
  const metal = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    vertexShader: `attribute float across; varying float vAcross; varying vec3 vN; varying vec3 vW;
      void main(){
        vAcross = across;
        vN = normalize(mat3(modelMatrix) * normal);
        vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: `uniform vec3 uCam; varying float vAcross; varying vec3 vN; varying vec3 vW;
      vec3 studio(vec3 d){
        float y = d.y;
        float az = atan(d.z, d.x);
        vec3 col = mix(vec3(0.05), vec3(0.3), smoothstep(-1.0, 0.7, y));
        // panneaux lumineux tout autour (boîtes à lumière) : le ruban passe du sombre au clair
        float p = 0.0;
        p += 1.4 * exp(-pow((az - 0.6) * 2.2, 2.0));
        p += 0.9 * exp(-pow((az + 1.9) * 2.6, 2.0));
        p += 1.1 * exp(-pow((az - 2.6) * 2.4, 2.0));
        p += 0.6 * exp(-pow((az + 0.5) * 3.0, 2.0));
        col += vec3(p * 0.85) * smoothstep(-1.3, -0.7, y) * (1.0 - smoothstep(0.6, 0.9, y));
        col += vec3(0.45) * smoothstep(0.75, 0.98, y);
        return col;
      }
      void main(){
        vec3 n = normalize(vN);
        vec3 v = normalize(vW - uCam);
        if (dot(n, v) > 0.0) n = -n;
        vec3 r = reflect(v, n);
        vec3 col = studio(r) * vec3(0.86, 0.88, 0.91);
        // léger brossé : stries le long du ruban
        col *= 0.985 + 0.015 * sin(vAcross * 40.0);
        col = col / (col + vec3(0.55)) * 1.42;
        // métal clair, jamais blanc pur, et un fin liseré sombre sur les bords du ruban :
        // la forme reste lisible une fois traduite en pastilles
        col = mix(vec3(0.1), vec3(0.92), clamp(col, 0.0, 1.0));
        col *= 1.0 - 0.3 * smoothstep(0.88, 1.0, abs(vAcross));
        gl_FragColor = vec4(pow(clamp(col, 0.0, 1.0), vec3(1.0 / 1.1)), 1.0);
      }`,
    uniforms: { uCam: { value: camera.position } },
  });
  const ribbon = new THREE.Mesh(geo, metal);
  scene.add(ribbon);

  renderer.render(scene, camera);

  // recadrage serré (6 % de marge), fond blanc
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
  const outCanvas = document.createElement('canvas');
  outCanvas.width = x1 - x0 + 2 * m;
  outCanvas.height = y1 - y0 + 2 * m;
  const ox = outCanvas.getContext('2d');
  ox.fillStyle = '#fff';
  ox.fillRect(0, 0, outCanvas.width, outCanvas.height);
  ox.drawImage(
    src,
    x0 - m,
    y0 - m,
    outCanvas.width,
    outCanvas.height,
    0,
    0,
    outCanvas.width,
    outCanvas.height,
  );
  return outCanvas.toDataURL('image/png');
}, SIZE);

writeFileSync(out, Buffer.from(dataUrl.split(',')[1], 'base64'));
await browser.close();
console.log('écrit :', out);
