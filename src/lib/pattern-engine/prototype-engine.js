// GÉNÉRÉ par scripts/extract-engine.mjs — NE PAS MODIFIER À LA MAIN (npm run engine:extract).
// Bloc moteur copié octet pour octet depuis reference/prototype.html, lignes 852 à 2616.
// SHA-256 du bloc : 72457c2f2f502d888e2cbbab06f6ed6993bc69d66d3c7494d00f784662f66715
/* eslint-disable */
// @ts-nocheck
export function runPrototypeEngine(env) {
  // Noms que le reste du prototype (ou le navigateur) fournissait ; ils viennent de la couche d’adaptation.
  let { DL, THREE, dlApplyView, libreTick, onLibraryChanged, recState, requestAnimationFrame, syncers, toast } = env;
// ===== DÉBUT DU BLOC MOTEUR (identique au prototype, ne pas modifier) =====
/* ------------------------------------------------------------------ */
/*  Palette et associations (planche couleur)                          */
/* ------------------------------------------------------------------ */
const PALETTE = [
  {id:'brun',   name:'Brun',   hex:'#431604'},
  {id:'orange', name:'Orange', hex:'#EC5F14'},
  {id:'taupe',  name:'Taupe',  hex:'#C2B1A2'},
  {id:'grege',  name:'Grège',  hex:'#C0B0A1'},
  {id:'lin',    name:'Lin',    hex:'#F1E2DA'},
  {id:'sauge',  name:'Sauge',  hex:'#91BB7B'},
  {id:'ciel',   name:'Ciel',   hex:'#90D7EB'},
];
const HEX = {}; const PAL = {};
PALETTE.forEach(p=>{ HEX[p.id]=p.hex; const c=new THREE.Color(p.hex); PAL[p.id]=[c.r,c.g,c.b]; });
const NAME = id => (PALETTE.find(p=>p.id===id)||PALETTE[0]).name;
// toutes les couleurs de la charte se combinent librement
const PAIRS = [];
const ALLOWED = {};
PALETTE.forEach(p=>ALLOWED[p.id]=new Set(PALETTE.map(q=>q.id)));
const DARK_BG = new Set(['brun']);

/* ------------------------------------------------------------------ */
/*  Réglages                                                           */
/* ------------------------------------------------------------------ */
// Deux variantes : 0 = aérée (un seul fil directeur bouclé, ponctué de synapses), 1 = dense (réseau tramé)
const VARIANTS = [
  {neurons:10, maxLinks:16, synapses:5, births:0.8, life:18, grow:1.0, density:2.0, strands:4, bundle:1.0, dotSize:1.1, linePx:1.0, fusion:0.35, nodes:false, lines:true, colorMode:2, relief:0, flow:1.0, maxPx:80, fov:38, depthThin:0},
  {neurons:48, maxLinks:60, synapses:6, births:2.2, life:24, grow:1.0, density:2.6, strands:6, bundle:1.0, dotSize:1.0, linePx:1.0, fusion:0.6, nodes:true, lines:false, colorMode:1, relief:0, flow:1.0, maxPx:80, fov:38, depthThin:0},
  {grow:1.5, dotSize:0.6, fusion:0, colorMode:2, relief:0.7, flow:1.2, nodes:false, lines:false, qCount:30000, tubeR:1.7, fill:0.15, swirl:0.35, twinkle:0.45, jitter:0.25, maxPx:9},
];
const S = Object.assign({
  variant:0, paused:false, autoRotate:true, rotSpeed:1.0, sway:0.3, flow:1.0,
  aspect:2.0, contrast:0.7, nodeSize:1.0,
  qCount:30000, tubeR:1.7, fill:0.15, swirl:0.35, twinkle:0.45, jitter:0.25, relief:0, maxPx:80,
  pinches:0, pinchDepth:0.8, pinchWidth:0.035, pinchSpeed:1.0, bulge:0,
  qStruct:0, thin:0.06, junction:1.0, lobes:5, lobeLen:4.5, neckDensity:0.55, fov:38, depthThin:0,
  lineMode:0, lineData:'12, 80', lineUnit:'%', lineLabels:true, lineWave:0.3,
  lineTexts:'Lorem Ipsum\nLorem Ipsum', infoScale:1, infoGap:1, lineLen:56, figmaMode:0, lobeContrast:0.5, linePath:null, linePathLen:0, lineFade:0.6, dataContrast:1, procSteps:4, procLabel:'Étape', procMin:0.12, procCurve:1.3,
  procTexts:'Lorem ipsum dolor sit amet, consectetur adipiscing elit.\nSed do eiusmod tempor incididunt ut labore et dolore magna aliqua.\nUt enim ad minim veniam, quis nostrud exercitation ullamco.\nDuis aute irure dolor in reprehenderit in voluptate velit esse.',
  shapeMode:0, bg:'brun', dots:new Set(['orange','sauge','lin']), lineColor:'brun', fog:0
}, VARIANTS[0]);
S.hoverOn=true; S.hoverMode=0; S.hoverRadius=150; S.hoverForce=1; S.hoverIn=0.35; S.hoverOut=1.2;
S.loopPath=null; S.loopNormal=null;
S.expTab=0; S.expSize=1; S.expFmt=0; S.expBg=false;
S.app='motif'; S.imgCols=194; S.imgLoop=false; S.videoBuild=false; S.imgInvert=false; S.imgRelief=0.8; S.imgHold=2.5; S.imgTrans=2.4; S.imgScatter=1; S.imgSmooth=0.5; S.videoDur=8;
S.imgBright=0; S.imgContr=10; S.imgGamma=1; S.imgLow=8; S.imgHigh=94; S.imgBlur=1; S.imgAngle=45; S.imgMin=0; S.imgMax=118;
S.noiseAmp=1.5; S.noiseSpeed=1; S.noiseDis=60; S.noiseSize=6;
// Réglage de base de la Membrane (aussi appliqué quand on choisit « Membrane »)
const MEMBRANE_BASE={fill:0, fusion:0.43, tubeR:1.6, qCount:97000, swirl:0.26, twinkle:0.81, jitter:0, pinches:0, bulge:0,
  relief:4, fov:77, depthThin:1, neckDensity:0.2, autoRotate:true,
  lobes:3, lobeLen:7.9, junction:1.69, thin:0.23,
  dotSize:1.5, aspect:2, contrast:0.71, maxPx:2};
// À l'ouverture : Quantique › Membrane › Nœud
Object.assign(S, VARIANTS[2], {variant:2, qStruct:1, shapeMode:0}, MEMBRANE_BASE);

/* ------------------------------------------------------------------ */
/*  Hasard                                                             */
/* ------------------------------------------------------------------ */
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
let rng = mulberry32((Math.random()*1e9)|0);
function hash3(a,b,c){
  let h = Math.imul(a|0,0x27d4eb2d) ^ Math.imul(b|0,0x165667b1) ^ Math.imul(c|0,0x9e3779b1);
  h = Math.imul(h ^ (h>>>15), 0x85ebca6b); h = Math.imul(h ^ (h>>>13), 0xc2b2ae35); h ^= h>>>16;
  return (h>>>0)/4294967296;
}
function randUnit(r){ const u=r()*2-1, th=r()*Math.PI*2, s=Math.sqrt(1-u*u); return new THREE.Vector3(s*Math.cos(th),u,s*Math.sin(th)); }
function gauss(r){return Math.sqrt(-2*Math.log(r()+1e-9))*Math.cos(2*Math.PI*r());}

/* ------------------------------------------------------------------ */
/*  Rendu                                                              */
/*  1. les pastilles (gélules) sont dessinées dans une texture avec un */
/*     halo doux ; 2. un seuil net les redessine à l'écran : là où     */
/*     deux halos se touchent, les pastilles fusionnent comme sur la   */
/*     trame imprimée.                                                 */
/* ------------------------------------------------------------------ */
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, 2));
renderer.autoClear = false;
const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 600);
const pillScene = new THREE.Scene(), lineScene = new THREE.Scene(), quadScene = new THREE.Scene();
const quadCam = new THREE.OrthographicCamera(-1,1,1,-1,0,1);
const rt = new THREE.WebGLRenderTarget(4,4,{depthBuffer:false, stencilBuffer:false, minFilter:THREE.LinearFilter, magFilter:THREE.LinearFilter});

const pillMat = new THREE.ShaderMaterial({
  uniforms:{ uScale:{value:1}, uFogNear:{value:30}, uFogFar:{value:80}, uFog:{value:S.fog},
             uAspect:{value:S.aspect}, uFusion:{value:S.fusion}, uBg:{value:new THREE.Color()}, uLinePx:{value:1}, uPR:{value:1}, uRefZ:{value:50}, uRelief:{value:0}, uMaxPx:{value:80}, uThin:{value:0} },
  vertexShader:`
    attribute float aSize; attribute float aSeed; attribute vec3 aColor;
    uniform float uScale; uniform float uFogNear; uniform float uFogFar; uniform float uFog;
    uniform float uAspect; uniform float uFusion; uniform vec3 uBg; uniform float uLinePx; uniform float uPR; uniform float uRefZ; uniform float uRelief; uniform float uMaxPx; uniform float uThin;
    varying vec3 vC; varying float vW; varying float vAr; varying float vHalo; varying float vPS;
    void main(){
      vec4 mv = modelViewMatrix*vec4(position,1.0);
      gl_Position = projectionMatrix*mv;
      float w = aSize*uScale/max(-mv.z,0.001);
      bool fil = aSeed < 0.0;
      if (fil) w = uLinePx*uPR*clamp(uRefZ/max(-mv.z,0.001), 0.6, 1.6);
      // relief mesuré par rapport à une distance de référence fixe : en zoom, les pastilles
      // lointaines ne s'effondrent pas, les proches sont tenues par le plafond ci-dessous
      if (!fil) w *= pow(clamp(max(uRefZ,45.0)/max(-mv.z,0.001), 0.25, 4.0), uRelief*1.6);
      // plafond doux : en zoom très proche, les pastilles restent des particules
      if (!fil){ float mx = uMaxPx*uPR; w = mx*(1.0-exp(-w/mx)); }
      // raréfaction en profondeur : les pastilles lointaines s'éclaircissent
      if (!fil && uThin>0.0){ float dz=smoothstep(uFogNear,uFogFar,-mv.z); if (aSeed < uThin*dz) w=0.0; }
      float ar = fil ? 1.0 : max(1.0, uAspect*(0.82+0.36*aSeed));
      float r = w/(2.0*ar);
      float halo = max(0.8, uFusion*r*1.6);
      float ps = w + 2.0*halo + 2.0;
      vW = w; vAr = ar; vHalo = halo; vPS = ps;
      gl_PointSize = (!fil && w < 0.9) ? 0.0 : ps;
      vC = mix(aColor, uBg, uFog*smoothstep(uFogNear,uFogFar,-mv.z));
    }`,
  fragmentShader:`
    varying vec3 vC; varying float vW; varying float vAr; varying float vHalo; varying float vPS;
    void main(){
      vec2 pp = (gl_PointCoord-0.5)*vPS;
      float r = vW/(2.0*vAr);
      float h = max(vW*0.5 - r, 0.0);
      vec2 q = vec2(max(abs(pp.x)-h, 0.0), pp.y);
      float d = length(q) - r;
      float a = clamp(0.5 - d/(2.0*vHalo), 0.0, 1.0);
      if (a < 0.003) discard;
      gl_FragColor = vec4(vC*a, a);
    }`,
  transparent:true, depthTest:false, depthWrite:false,
  blending:THREE.CustomBlending, blendEquation:THREE.AddEquation,
  blendSrc:THREE.OneFactor, blendDst:THREE.OneMinusSrcAlphaFactor,
  blendSrcAlpha:THREE.OneFactor, blendDstAlpha:THREE.OneMinusSrcAlphaFactor
});

const quadMat = new THREE.ShaderMaterial({
  uniforms:{ tMap:{value:rt.texture}, uPool:{value:Array.from({length:9},()=>new THREE.Vector3())}, uPoolN:{value:1}, uSnap:{value:1} },
  vertexShader:`varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }`,
  fragmentShader:`uniform sampler2D tMap; uniform vec3 uPool[9]; uniform int uPoolN; uniform float uSnap; varying vec2 vUv;
    void main(){
      vec4 c = texture2D(tMap, vUv);
      float fw = max(fwidth(c.a), 0.004)*0.8;
      float a = smoothstep(0.5-fw, 0.5+fw, c.a);
      if (a < 0.002) discard;
      vec3 col = c.rgb/max(c.a,0.001);
      if (uSnap > 0.5){
        // on ramène chaque pixel à la couleur de palette la plus proche : aplats purs, pas de mélange
        vec3 best = uPool[0]; float bd = 1e9;
        for (int i=0;i<9;i++){ if (i>=uPoolN) break; vec3 d3 = col-uPool[i]; float d = dot(d3,d3); if (d<bd){ bd=d; best=uPool[i]; } }
        col = best;
      }
      gl_FragColor = vec4(col, a);
    }`,
  transparent:true, depthTest:false, depthWrite:false
});
quadMat.extensions = {derivatives:true};
quadScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2), quadMat));

/* Tampons des pastilles (triés de l'arrière vers l'avant chaque image) */
const MAXD = 150000;
const dGeo = new THREE.BufferGeometry();
const dPos = new Float32Array(MAXD*3), dSize = new Float32Array(MAXD), dSeed = new Float32Array(MAXD), dCol = new Float32Array(MAXD*3);
const sPos = new Float32Array(MAXD*3), sSize = new Float32Array(MAXD), sSeed = new Float32Array(MAXD), sCol = new Float32Array(MAXD*3);
const keys = new Uint16Array(MAXD); const NB = 4096; const counts = new Uint32Array(NB);
function dynAttr(arr,n){ const a=new THREE.BufferAttribute(arr,n); a.setUsage(THREE.DynamicDrawUsage); return a; }
dGeo.setAttribute('position', dynAttr(dPos,3));
dGeo.setAttribute('aSize', dynAttr(dSize,1));
dGeo.setAttribute('aSeed', dynAttr(dSeed,1));
dGeo.setAttribute('aColor', dynAttr(dCol,3));
const pills = new THREE.Points(dGeo, pillMat); pills.frustumCulled = false; pillScene.add(pills);

/* Filaments (facultatifs) */
const SAMPLES = 96, MAXL = 220, MAXLV = MAXL*(SAMPLES-1)*2;
const lGeo = new THREE.BufferGeometry();
const lPos = new Float32Array(MAXLV*3), lCol = new Float32Array(MAXLV*3);
lGeo.setAttribute('position', dynAttr(lPos,3));
lGeo.setAttribute('aColor', dynAttr(lCol,3));
const lMat = new THREE.ShaderMaterial({
  uniforms:{ uFogNear:{value:30}, uFogFar:{value:80}, uFog:{value:S.fog}, uBg:{value:new THREE.Color()} },
  vertexShader:`attribute vec3 aColor; uniform float uFogNear; uniform float uFogFar; uniform float uFog;
    varying vec3 vC; varying float vFog;
    void main(){ vec4 mv=modelViewMatrix*vec4(position,1.0); gl_Position=projectionMatrix*mv; vC=aColor; vFog=uFog*smoothstep(uFogNear,uFogFar,-mv.z); }`,
  fragmentShader:`uniform vec3 uBg; varying vec3 vC; varying float vFog;
    void main(){ gl_FragColor = vec4(mix(vC,uBg,vFog), 0.45*(1.0-vFog*0.6)); }`,
  transparent:true, depthWrite:false
});
const linesObj = new THREE.LineSegments(lGeo, lMat); linesObj.frustumCulled=false; lineScene.add(linesObj);

/* ------------------------------------------------------------------ */
/*  Réseau                                                             */
/* ------------------------------------------------------------------ */
let nodes = [], links = [], linkKeys = new Set(), linkId = 1, spawnAcc = 0, worldR = 14;
const NODE_K = 42;

function buildNodes(){
  nodes = []; links = []; linkKeys.clear(); spawnAcc = 0;
  const n = S.neurons;
  worldR = S.variant===0 ? 13 : 10 + Math.sqrt(n)*0.9;
  const nc = 3 + Math.floor(rng()*4), centers = [];
  for (let i=0;i<nc;i++){
    const v = randUnit(rng).multiplyScalar(worldR*(0.25+rng()*0.6)); v.x*=1.35; v.y*=0.75;
    centers.push({p:v, s:worldR*(0.18+rng()*0.22)});
  }
  for (let i=0;i<n;i++){
    let p;
    if (S.variant===1 && rng()<0.78){ const c=centers[Math.floor(rng()*nc)]; p=new THREE.Vector3(gauss(rng),gauss(rng),gauss(rng)).multiplyScalar(c.s).add(c.p); }
    else { p=randUnit(rng).multiplyScalar(worldR*Math.cbrt(rng())); p.x*=1.35; p.y*=0.75; }
    // amas de pastilles : une petite sphère tramée
    const off = new Float32Array(NODE_K*3), wt = new Float32Array(NODE_K);
    for (let k=0;k<NODE_K;k++){
      const v = randUnit(rng).multiplyScalar(Math.cbrt(rng()));
      off[k*3]=v.x*1.25; off[k*3+1]=v.y*0.9; off[k*3+2]=v.z;
      wt[k] = 1 - 0.55*v.length() + (rng()-0.5)*0.25;
    }
    nodes.push({p, deg:0, pulse:0, r1:rng(), size:0.8+rng()*0.5, off, wt, id:i+1});
  }
  const cen = new THREE.Vector3(); nodes.forEach(N=>cen.add(N.p)); cen.divideScalar(nodes.length||1); nodes.forEach(N=>N.p.sub(cen));
  for (const a of nodes) a.nb = nodes.filter(b=>b!==a).map(b=>({b,d:a.p.distanceTo(b.p)})).sort((x,y)=>x.d-y.d).slice(0,8).map(o=>o.b);
}

function bezier(p0,p1,p2,p3,t,out){
  const u=1-t, a=u*u*u, b=3*u*u*t, c=3*u*t*t, d=t*t*t;
  return out.set(a*p0.x+b*p1.x+c*p2.x+d*p3.x, a*p0.y+b*p1.y+c*p2.y+d*p3.y, a*p0.z+b*p1.z+c*p2.z+d*p3.z);
}
function buildCurve(A,B,P1,P2){
  const d = A.distanceTo(B);
  const airy = S.variant===0;
  const ext = ()=> airy ? d*(0.5+rng()*0.9)+worldR*(0.2+rng()*0.5) : d*(0.35+rng()*0.9);
  const p1 = P1 || A.clone().add(randUnit(rng).multiplyScalar(ext()));
  const p2 = P2 || B.clone().add(randUnit(rng).multiplyScalar(ext()));
  const RAW=200, raw=[], cum=[0], tmp=new THREE.Vector3();
  for (let i=0;i<=RAW;i++){ raw.push(bezier(A,p1,p2,B,i/RAW,tmp).clone()); if(i>0) cum.push(cum[i-1]+raw[i].distanceTo(raw[i-1])); }
  const len = cum[RAW], pts=[];
  let k=0;
  for (let i=0;i<SAMPLES;i++){
    const target=len*i/(SAMPLES-1);
    while (k<RAW-1 && cum[k+1]<target) k++;
    const f=Math.min(1,Math.max(0,(target-cum[k])/((cum[k+1]-cum[k])||1)));
    pts.push(raw[k].clone().lerp(raw[k+1],f));
  }
  const pos=new Float32Array(SAMPLES*3), nrm=new Float32Array(SAMPLES*3), bin=new Float32Array(SAMPLES*3);
  const T=[]; for (let i=0;i<SAMPLES;i++) T.push(pts[Math.min(SAMPLES-1,i+1)].clone().sub(pts[Math.max(0,i-1)]).normalize());
  let nPrev=new THREE.Vector3(0,1,0); if (Math.abs(nPrev.dot(T[0]))>0.9) nPrev.set(1,0,0);
  for (let i=0;i<SAMPLES;i++){
    const t=T[i]; let n=nPrev.clone().sub(t.clone().multiplyScalar(nPrev.dot(t)));
    if (n.lengthSq()<1e-8) n=nPrev.clone(); n.normalize();
    const b=new THREE.Vector3().crossVectors(t,n).normalize();
    pos.set([pts[i].x,pts[i].y,pts[i].z],i*3); nrm.set([n.x,n.y,n.z],i*3); bin.set([b.x,b.y,b.z],i*3);
    nPrev=n;
  }
  return {pos,nrm,bin,len};
}
// Faisceaux : en variante dense, toute la connexion est un tube de brins.
// En variante aérée, le filament s'ouvre par endroits en quelques brins en éventail.
function makeBundles(L){
  if (S.variant===1) return [{ta:0, tb:1, tube:true, mul:L.strMul}];
  const out=[], r=rng();
  const nb = r<0.15 ? 0 : r<0.7 ? 1 : 2;
  const slots = nb===2 ? [[0.06,0.46],[0.54,0.94]] : [[0.08,0.92]];
  for (let i=0;i<nb;i++){
    const [lo,hi]=slots[i], span=Math.min(hi-lo, 0.16+rng()*0.3);
    const ta=lo+rng()*(hi-lo-span);
    out.push({ta, tb:ta+span, tube:false, mul:0.6+rng()*0.9,
      rad:L.len*span*(0.09+rng()*0.12), ang:rng()*TAU, twist:(rng()-0.5)*2.2, arc:Math.PI*(0.5+rng()*0.6)});
  }
  return out;
}
function spawnLink(){
  if (nodes.length<2) return;
  for (let attempt=0;attempt<24;attempt++){
    let a;
    if (links.length && rng()<0.55){ const L=links[Math.floor(rng()*links.length)]; a=rng()<0.5?L.A:L.B; }
    else a=nodes[Math.floor(rng()*nodes.length)];
    const near = S.variant===1 ? 0.8 : 0.3;
    const b = rng()<near ? a.nb[Math.floor(rng()*a.nb.length)] : nodes[Math.floor(rng()*nodes.length)];
    if (!b || a===b) continue;
    const key=Math.min(a.id,b.id)+'-'+Math.max(a.id,b.id);
    if (linkKeys.has(key)) continue;
    const L = Object.assign(buildCurve(a.p,b.p), {
      id:linkId++, A:a, B:b, key, state:0, progress:0, die:0, age:0,
      life:S.life*(0.6+rng()*0.8), flow:rng(),
      radius:0.3+Math.pow(rng(),1.4)*1.7, strMul:0.5+rng(), densMul:0.8+rng()*0.4,
      thick:0.65+rng()*0.7, cr:rng(), speed:0.75+rng()*0.5,
      toneF:6+rng()*18, tonePh:rng()*6.283
    });
    L.bundles = makeBundles(L);
    links.push(L); linkKeys.add(key); a.deg++; b.deg++; a.pulse=Math.max(a.pulse,0.7);
    return;
  }
}

/* ------------------------------------------------------------------ */
/*  Couleurs                                                           */
/* ------------------------------------------------------------------ */
let pool=[], bgCol=PAL.taupe, lineCol=PAL.brun;
function refreshColors(){
  // couleurs inconnues (anciens préréglages) : retour aux couleurs de la charte
  if (!HEX[S.bg]) S.bg='taupe';
  for (const id of [...S.dots]) if (!HEX[id]) S.dots.delete(id);
  if (!S.dots.size) S.dots.add('brun');
  pool = PALETTE.map(p=>p.id).filter(id=>S.dots.has(id)).map(id=>PAL[id]);
  if (!HEX[S.lineColor]) S.lineColor = PALETTE.map(p=>p.id).find(id=>S.dots.has(id));
  lineCol = PAL[S.lineColor];
  const snap = pool.concat([lineCol]);
  snap.forEach((c,i)=>quadMat.uniforms.uPool.value[i].set(c[0],c[1],c[2]));
  quadMat.uniforms.uPoolN.value = snap.length;
  bgCol = PAL[S.bg];
  { const c=new THREE.Color(HEX[S.bg]); document.body.classList.toggle('light-stage', 0.2126*c.r+0.7152*c.g+0.0722*c.b>0.5); }
  [pillMat,lMat].forEach(m=>m.uniforms.uBg.value.setRGB(...bgCol));
  document.documentElement.style.setProperty('--mark-ink', DARK_BG.has(S.bg) ? '#EBE3DB' : '#431602');
}

/* ------------------------------------------------------------------ */
/*  Caméra / navigation                                                */
/* ------------------------------------------------------------------ */
const orbit = {theta:0.5, phi:1.25, radius:58, target:new THREE.Vector3(), vt:0, vp:0};
function updateCamera(){
  orbit.phi=Math.min(Math.PI-0.05,Math.max(0.05,orbit.phi));
  orbit.radius=Math.min(180,Math.max(5,orbit.radius));
  const s=Math.sin(orbit.phi);
  camera.position.set(orbit.target.x+orbit.radius*s*Math.sin(orbit.theta), orbit.target.y+orbit.radius*Math.cos(orbit.phi), orbit.target.z+orbit.radius*s*Math.cos(orbit.theta));
  camera.lookAt(orbit.target);
}
let recording=false;
function panelShift(w){ return 0; }   // la scène n'est plus recouverte par l'éditeur
function resetView(){ if (Math.abs(camera.fov-S.fov)>0.01){ camera.fov=S.fov; resize(); }
  if (S.app==='image'){ orbit.theta=0; orbit.phi=Math.PI/2; orbit.radius=74; orbit.target.set(0,0,0); orbit.vt=orbit.vp=0; return; } if (isLine()){ orbit.theta=0; orbit.phi=Math.PI/2-0.1; orbit.radius=74; orbit.target.set(0,0,0); orbit.vt=orbit.vp=0; return; } orbit.theta=0.5; orbit.phi=1.25; orbit.radius=S.variant===0?50:S.variant===2?62:worldR*3.4; orbit.target.set(0,0,0); orbit.vt=orbit.vp=0; }
const pointers=new Map(); let dragMode=null, lastPinch=0, lastX=0, lastY=0;
canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('pointerdown',e=>{
  if (lineDraw.armed) return;
  canvas.setPointerCapture(e.pointerId); pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if (pointers.size===2){ const [a,b]=[...pointers.values()]; lastPinch=Math.hypot(a.x-b.x,a.y-b.y); dragMode='pinch'; lastX=(a.x+b.x)/2; lastY=(a.y+b.y)/2; }
  else { dragMode=(e.button===2||e.shiftKey)?'pan':'rotate'; lastX=e.clientX; lastY=e.clientY; }
  orbit.vt=orbit.vp=0; canvas.classList.add('dragging');
});
canvas.addEventListener('pointermove',e=>{
  if (!pointers.has(e.pointerId)) return;
  pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if (dragMode==='pinch' && pointers.size>=2){
    const [a,b]=[...pointers.values()]; const d=Math.hypot(a.x-b.x,a.y-b.y);
    if (lastPinch>0) orbit.radius*=lastPinch/d; lastPinch=d;
    const mx=(a.x+b.x)/2,my=(a.y+b.y)/2; pan(mx-lastX,my-lastY); lastX=mx; lastY=my;
  } else if (dragMode==='rotate'){
    const dx=e.clientX-lastX,dy=e.clientY-lastY; lastX=e.clientX; lastY=e.clientY;
    orbit.vt=-dx*0.0055; orbit.vp=-dy*0.0055; orbit.theta+=orbit.vt; orbit.phi+=orbit.vp;
  } else if (dragMode==='pan'){ pan(e.clientX-lastX,e.clientY-lastY); lastX=e.clientX; lastY=e.clientY; }
});
function endPointer(e){
  pointers.delete(e.pointerId);
  if (!pointers.size){ dragMode=null; canvas.classList.remove('dragging'); }
  else if (pointers.size===1){ const p=[...pointers.values()][0]; dragMode='rotate'; lastX=p.x; lastY=p.y; orbit.vt=orbit.vp=0; }
}
canvas.addEventListener('pointerup',endPointer); canvas.addEventListener('pointercancel',endPointer);
function pan(dx,dy){
  const k=orbit.radius*0.0016;
  orbit.target.addScaledVector(new THREE.Vector3().setFromMatrixColumn(camera.matrix,0),-dx*k).addScaledVector(new THREE.Vector3().setFromMatrixColumn(camera.matrix,1),dy*k);
}
canvas.addEventListener('wheel',e=>{ e.preventDefault(); orbit.radius*=Math.exp(e.deltaY*0.0012); },{passive:false});
canvas.addEventListener('dblclick',()=>{ if (!lineDraw.armed) resetView(); });

/* ------------------------------------------------------------------ */
/*  Boucle                                                             */
/* ------------------------------------------------------------------ */
const panel=document.getElementById('panel'), openBtn=document.getElementById('openPanel');
// Le panneau et la page ne doivent jamais défiler eux-mêmes (seule la zone des réglages défile) :
// un champ qui prend le focus pouvait décaler tout le panneau et laisser un grand vide.
panel.addEventListener('scroll',()=>{ if (panel.scrollTop||panel.scrollLeft){ panel.scrollTop=0; panel.scrollLeft=0; } });
window.addEventListener('scroll',()=>{ if (window.scrollX||window.scrollY) window.scrollTo(0,0); });
document.body.addEventListener('scroll',()=>{ if (document.body.scrollTop) document.body.scrollTop=0; });
let VW=window.innerWidth, VH=window.innerHeight, VX=0, VY=0;
function resize(){
  const rc=canvas.getBoundingClientRect();
  VW=Math.max(1,Math.round(rc.width)); VH=Math.max(1,Math.round(rc.height)); VX=rc.left; VY=rc.top;
  const lab=document.getElementById('labels'); if (lab){ lab.style.left=VX+'px'; lab.style.top=VY+'px'; lab.style.width=VW+'px'; lab.style.height=VH+'px'; lab.style.right='auto'; lab.style.bottom='auto'; }
  const w=VW, h=VH, pr=renderer.getPixelRatio();
  renderer.setSize(w,h,false);
  rt.setSize(Math.round(w*pr), Math.round(h*pr));
  const shift=panelShift(w);
  camera.aspect=(w+shift)/h;
  if (shift) camera.setViewOffset(w+shift,h,shift,0,w,h); else camera.clearViewOffset();
  camera.updateProjectionMatrix();
  pillMat.uniforms.uScale.value = h*pr/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov)/2));
}
window.addEventListener('resize',resize);
window.addEventListener('resize',()=>{ if (S.app==='libre') dlApplyView(); });
if (window.ResizeObserver) new ResizeObserver(()=>resize()).observe(canvas);

const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduceMotion) S.autoRotate=false;
let LSTEP=0.03, lastN=0, lastFog={near:30,far:80};
const TAU=Math.PI*2;

/* ------------------------------------------------------------------ */
/*  Variante aérée : un fil directeur fermé (le départ rejoint         */
/*  l'arrivée, sans trou) sur lequel s'ouvrent des synapses.           */
/*  Dans une synapse, le fil disparaît : il devient des brins de       */
/*  pastilles.                                                         */
/* ------------------------------------------------------------------ */
const LN = 1400;
let loop=null, syn=[], synId=1, synAcc=0, drawP=0, loopShape=0;
// Adoucissement local des coudes : la forme d'origine (croisements compris) est gardée,
// seuls les virages plus serrés que l'épaisseur du conduit sont arrondis sur place.
function fairLoop(pts, minRc, target){
  const n=pts.length;
  let P=new Float64Array(n*3);
  for (let i=0;i<n;i++){ P[i*3]=pts[i].x; P[i*3+1]=pts[i].y; P[i*3+2]=pts[i].z; }
  // rééchantillonnage à pas constant (sur place)
  const cum=new Float64Array(n+1), R2=new Float64Array(n*3);
  const resample=()=>{
    cum[0]=0;
    for (let i=1;i<=n;i++){ const a=(i-1)*3, b=(i%n)*3; cum[i]=cum[i-1]+Math.hypot(P[b]-P[a],P[b+1]-P[a+1],P[b+2]-P[a+2]); }
    let k=0;
    for (let i=0;i<n;i++){
      const tg=cum[n]*i/n; while (k<n-1 && cum[k+1]<tg) k++;
      const f=(tg-cum[k])/((cum[k+1]-cum[k])||1), a=k*3, b=((k+1)%n)*3;
      R2[i*3]=P[a]+(P[b]-P[a])*f; R2[i*3+1]=P[a+1]+(P[b+1]-P[a+1])*f; R2[i*3+2]=P[a+2]+(P[b+2]-P[a+2])*f;
    }
    P.set(R2); return cum[n]/n;
  };
  const cr=(ia,ib,ic)=>{
    const abx=P[ib]-P[ia], aby=P[ib+1]-P[ia+1], abz=P[ib+2]-P[ia+2], bcx=P[ic]-P[ib], bcy=P[ic+1]-P[ib+1], bcz=P[ic+2]-P[ib+2];
    const cx=aby*bcz-abz*bcy, cy=abz*bcx-abx*bcz, cz=abx*bcy-aby*bcx, c=Math.sqrt(cx*cx+cy*cy+cz*cz);
    if (c<1e-12) return 1e9;
    const acx=P[ic]-P[ia], acy=P[ic+1]-P[ia+1], acz=P[ic+2]-P[ia+2];
    return Math.sqrt(abx*abx+aby*aby+abz*abz)*Math.sqrt(bcx*bcx+bcy*bcy+bcz*bcz)*Math.sqrt(acx*acx+acy*acy+acz*acz)/(2*c);
  };
  // flou gaussien le long du conduit, appliqué seulement autour des coudes trop vifs ;
  // si un coude résiste, on élargit le flou uniquement à cet endroit
  const mask=new Float32Array(n), G=new Float64Array(n*3), lsig=new Float32Array(n), need=new Float32Array(n);
  let ds=resample(), changed=false;
  const base=Math.max(minRc,3.5)*0.8;
  for (let round=0; round<14; round++){
    const st=Math.max(2,Math.round(0.6/ds));
    mask.fill(0); need.fill(0);
    let bad=false;
    for (let i=0;i<n;i++){
      if (cr(((i-st+n)%n)*3, i*3, ((i+st)%n)*3) >= minRc) continue;
      bad=true;
      const sg=Math.min(n/10, Math.max(lsig[i]*1.35, base/ds)); lsig[i]=sg;
      const K=Math.ceil(sg*2.5), W=K+Math.ceil(minRc/ds);
      for (let d=-W;d<=W;d++){
        const j=(i+d+n)%n, v=Math.abs(d)<K?1:0.5+0.5*Math.cos(Math.PI*(Math.abs(d)-K)/(W-K+1));
        if (v>mask[j]) mask[j]=v;
        if (sg>need[j]) need[j]=sg;
      }
    }
    if (!bad) break;
    changed=true;
    for (let i=0;i<n;i++){
      const o=i*3;
      if (!mask[i]){ G[o]=P[o]; G[o+1]=P[o+1]; G[o+2]=P[o+2]; continue; }
      const sg=need[i], K=Math.ceil(sg*2.5);
      let x=0,y=0,z=0,ws=0;
      for (let d=-K;d<=K;d++){ const j=((i+d)%n+n)%n*3, w=Math.exp(-0.5*(d/sg)*(d/sg)); x+=P[j]*w; y+=P[j+1]*w; z+=P[j+2]*w; ws+=w; }
      const m=mask[i];
      G[o]=P[o]+m*(x/ws-P[o]); G[o+1]=P[o+1]+m*(y/ws-P[o+1]); G[o+2]=P[o+2]+m*(z/ws-P[o+2]);
    }
    P.set(G); resample();
    // le lissage rétrécit un peu la boucle : on la recentre et on la remet à l'échelle
    let cx=0,cy=0,cz=0; for (let i=0;i<n;i++){ cx+=P[i*3]; cy+=P[i*3+1]; cz+=P[i*3+2]; } cx/=n; cy/=n; cz/=n;
    let mr=0; for (let i=0;i<n;i++){ P[i*3]-=cx; P[i*3+1]-=cy; P[i*3+2]-=cz; mr=Math.max(mr,Math.hypot(P[i*3],P[i*3+1],P[i*3+2])); }
    const sc=target/mr; for (let i=0;i<n*3;i++) P[i]*=sc;
    ds=resample();
  }
  if (!changed) return pts;
  const out=[]; for (let i=0;i<n;i++) out.push(new THREE.Vector3(P[i*3],P[i*3+1],P[i*3+2]));
  const cen=new THREE.Vector3(); out.forEach(p=>cen.add(p)); cen.divideScalar(n); out.forEach(p=>p.sub(cen));
  const m=Math.max(...out.map(p=>p.length())); out.forEach(p=>p.multiplyScalar(target/m));
  return out;
}
function loopMinCurv(arr){
  const n=arr.length; let ds=0; for (let i=0;i<n;i++) ds+=arr[i].distanceTo(arr[(i+1)%n]); ds/=n;
  const st=Math.max(2,Math.round(0.6/ds)); let m=1e9;
  for (let i=0;i<n;i++){
    const a=arr[(i-st+n)%n], b=arr[i], c=arr[(i+st)%n];
    const abx=b.x-a.x, aby=b.y-a.y, abz=b.z-a.z, bcx=c.x-b.x, bcy=c.y-b.y, bcz=c.z-b.z;
    const cx=aby*bcz-abz*bcy, cy=abz*bcx-abx*bcz, cz=abx*bcy-aby*bcx, cr=Math.sqrt(cx*cx+cy*cy+cz*cz);
    if (cr<1e-12) continue;
    m=Math.min(m, Math.hypot(abx,aby,abz)*Math.hypot(bcx,bcy,bcz)*a.distanceTo(c)/(2*cr));
  }
  return m;
}
function isMembrane(){ return S.variant===2 && S.qStruct===1; }
function isLine(){ return S.variant===2 && S.qStruct===2; }
function loopMinRc(){
  // Membrane : aucun virage plus serré que le rayon le plus épais que le conduit peut prendre.
  // Les autres variantes gardent la boucle exactement comme avant (0 = aucun adoucissement).
  if (!isMembrane()) return 0;
  const rMax=S.tubeR*(S.thin+(S.junction-S.thin)*Math.pow(1.3,1.7));
  return Math.max(2.5, rMax*1.08);
}
// Nœuds lisses pour la Membrane : de vrais croisements (trèfle, nœud en huit, nœud torique,
// huit dans l'espace), larges et sans coude, rendus organiques par une légère déformation.
// mode : 0 Nœud (toutes les familles), 1 Ample (nœuds étirés et ouverts),
//        2 Simple (trèfle ou huit dans l'espace, épurés), 3 Hasard
function makeKnot(mode=0){
  if (mode===3) mode=Math.floor(rng()*3);
  const fam = mode===2 ? [0,3][Math.floor(rng()*2)] : mode===1 ? [0,1,3][Math.floor(rng()*3)] : Math.floor(rng()*4);
  const s = mode===1 ? [1.45+rng()*0.35, 0.55+rng()*0.2, 0.75+rng()*0.25] : [1+rng()*0.3, 0.7+rng()*0.3, 0.85+rng()*0.3];
  const na = mode===2 ? 0.08 : 0.22;
  const nz=[]; for (let k=1;k<=2;k++) nz.push({k, a:[0,1,2].map(()=>(rng()-0.5)*na), p:[0,1,2].map(()=>rng()*TAU)});
  const e=new THREE.Euler(rng()*TAU, rng()*TAU, rng()*TAU), M=new THREE.Matrix4().makeRotationFromEuler(e), v=new THREE.Vector3();
  return th=>{
    let x,y,z;
    if (fam===0){ x=Math.sin(th)+2*Math.sin(2*th); y=Math.cos(th)-2*Math.cos(2*th); z=-1.3*Math.sin(3*th); }
    else if (fam===1){ const r=2+Math.cos(2*th); x=r*Math.cos(3*th); y=r*Math.sin(3*th); z=1.2*Math.sin(4*th); }
    else if (fam===2){ const r=2+0.8*Math.cos(5*th); x=r*Math.cos(2*th); y=r*Math.sin(2*th); z=0.8*Math.sin(5*th); }
    else { x=2.6*Math.sin(th); y=1.3*Math.sin(2*th); z=1.6*Math.cos(th)+0.4*Math.cos(2*th); }
    for (const q of nz){ x+=3*q.a[0]*Math.cos(q.k*th+q.p[0]); y+=3*q.a[1]*Math.cos(q.k*th+q.p[1]); z+=3*q.a[2]*Math.cos(q.k*th+q.p[2]); }
    v.set(x*s[0],y*s[1],z*s[2]).applyMatrix4(M);
    return [v.x,v.y,v.z];
  };
}
function buildLoop(){
  syn=[]; synAcc=0; drawP=0;
  // trois familles de formes, même logique : une boucle fermée et lisse
  const shape = S.shapeMode===3 ? Math.floor(rng()*3) : (S.shapeMode===4 ? 0 : S.shapeMode);
  loopShape = shape;
  // plusieurs tirages si besoin : on garde la première forme sans coude trop vif
  let pts=null, bestRc=-1; const minRcL=loopMinRc();
  // forme dessinée à la souris : le tracé fermé, avec un relief en profondeur pour que
  // les croisements du dessin passent l'un devant l'autre comme un vrai nœud
  let customGen=null;
  if (S.shapeMode===4 && S.loopPath && S.loopPath.length>3){
    const C=new THREE.CatmullRomCurve3(S.loopPath.map(a=>new THREE.Vector3(a[0],a[1],a[2])),true,'centripetal');
    const nv=new THREE.Vector3(...(S.loopNormal||[0,0,1])).normalize();
    let rr=0; const cc=new THREE.Vector3(); S.loopPath.forEach(a=>cc.add(new THREE.Vector3(a[0],a[1],a[2]))); cc.divideScalar(S.loopPath.length);
    S.loopPath.forEach(a=>{ rr=Math.max(rr, Math.hypot(a[0]-cc.x,a[1]-cc.y,a[2]-cc.z)); });
    const ph1=rng()*TAU, ph2=rng()*TAU, A=rr*0.32, v=new THREE.Vector3();
    customGen=th=>{ const t=th/TAU; C.getPoint(t,v); const d=A*(Math.sin(2*th+ph1)+0.45*Math.sin(3*th+ph2)); return [(v.x+nv.x*d)/14,(v.y+nv.y*d)/14,(v.z+nv.z*d)/14]; };
  }
  for (let attempt=0; attempt<(minRcL>0?8:1) && bestRc<minRcL; attempt++){
    const terms=[];
    if (shape===0){        // nœud : boucles qui se croisent
      for (let k=1;k<=3;k++){
        const amp=[1,0.68,0.42][k-1]*(0.75+rng()*0.5);
        terms.push({k, ax:amp*(0.9+rng()*0.4), ay:amp*(0.35+rng()*0.35), az:amp*(0.6+rng()*0.6), px:rng()*TAU, py:rng()*TAU, pz:rng()*TAU});
      }
    } else if (shape===1){ // ample : grandes courbes ouvertes, très étirées
      for (let k=1;k<=3;k++){
        const amp=[1,0.3,0.12][k-1]*(0.8+rng()*0.4);
        terms.push({k, ax:amp*(1.5+rng()*0.3), ay:amp*(0.2+rng()*0.25), az:amp*(0.7+rng()*0.3), px:rng()*TAU, py:rng()*TAU, pz:rng()*TAU});
      }
    }
    // simple : courbe étoilée autour d'un axe, elle ne se recoupe jamais
    const sp={a2:0.1+rng()*0.2, a3:0.05+rng()*0.12, f2:rng()*TAU, f3:rng()*TAU, h2:0.2+rng()*0.25, h3:0.08+rng()*0.15, g2:rng()*TAU, g3:rng()*TAU, sx:1.15+rng()*0.4};
    const knotGen = customGen ? null : (isMembrane() ? makeKnot(S.shapeMode) : null);
    const pointAt=(th)=>{
      if (customGen) return customGen(th);
      if (knotGen) return knotGen(th);
      if (shape===2){
        const r=1+sp.a2*Math.sin(2*th+sp.f2)+sp.a3*Math.sin(3*th+sp.f3);
        return [r*Math.cos(th)*sp.sx, sp.h2*Math.sin(2*th+sp.g2)+sp.h3*Math.sin(3*th+sp.g3), r*Math.sin(th)];
      }
      let x=0,y=0,z=0;
      for (const t of terms){ x+=t.ax*Math.cos(t.k*th+t.px); y+=t.ay*Math.cos(t.k*th+t.py); z+=t.az*Math.cos(t.k*th+t.pz); }
      return [x,y,z];
    };
    const R0=14, RAW=4000, raw=[], cum=[0];
    for (let i=0;i<RAW;i++){
      const th=i/RAW*TAU; const [x,y,z]=pointAt(th);
      raw.push(new THREE.Vector3(x*R0,y*R0,z*R0));
    }
    for (let i=1;i<=RAW;i++) cum.push(cum[i-1]+raw[i%RAW].distanceTo(raw[i-1]));
    const cand=[];
    let k=0;
    for (let i=0;i<LN;i++){
      const target=cum[RAW]*i/LN;
      while (k<RAW-1 && cum[k+1]<target) k++;
      const f=(target-cum[k])/((cum[k+1]-cum[k])||1);
      cand.push(raw[k].clone().lerp(raw[(k+1)%RAW],f));
    }
    const cen=new THREE.Vector3(); cand.forEach(p=>cen.add(p)); cen.divideScalar(LN); cand.forEach(p=>p.sub(cen));
    { const target=shape===1?34:20; const m=Math.max(...cand.map(p=>p.length())); cand.forEach(p=>p.multiplyScalar(target/m)); worldR=target;
      const faired=fairLoop(cand, loopMinRc(), target); if (faired!==cand) for (let i=0;i<LN;i++) cand[i]=faired[i]; }
    const rc=loopMinCurv(cand); if (rc>bestRc){ bestRc=rc; pts=cand; }
  }
  const T=pts.map((p,i)=>pts[(i+1)%LN].clone().sub(pts[(i-1+LN)%LN]).normalize());
  // repères par transport parallèle, puis correction de l'écart à la fermeture
  const Ns=[]; let nP=new THREE.Vector3(0,1,0); if (Math.abs(nP.dot(T[0]))>0.9) nP.set(1,0,0);
  nP.sub(T[0].clone().multiplyScalar(nP.dot(T[0]))).normalize();
  for (let i=0;i<LN;i++){ let nn=nP.clone().sub(T[i].clone().multiplyScalar(nP.dot(T[i]))); if (nn.lengthSq()<1e-9) nn=nP.clone(); nn.normalize(); Ns.push(nn); nP=nn; }
  const nEnd=nP.clone().sub(T[0].clone().multiplyScalar(nP.dot(T[0]))).normalize();
  const gap=Math.atan2(new THREE.Vector3().crossVectors(nEnd,Ns[0]).dot(T[0]), nEnd.dot(Ns[0]));
  let len=0; for (let i=0;i<LN;i++) len+=pts[i].distanceTo(pts[(i+1)%LN]);
  const pos=new Float32Array(LN*3), nrm=new Float32Array(LN*3), bin=new Float32Array(LN*3);
  for (let i=0;i<LN;i++){
    const a=gap*i/LN, tb=new THREE.Vector3().crossVectors(T[i],Ns[i]);
    const nn=Ns[i].clone().multiplyScalar(Math.cos(a)).add(tb.multiplyScalar(Math.sin(a))).normalize();
    const bb=new THREE.Vector3().crossVectors(T[i],nn);
    pos.set([pts[i].x,pts[i].y,pts[i].z],i*3); nrm.set([nn.x,nn.y,nn.z],i*3); bin.set([bb.x,bb.y,bb.z],i*3);
  }
  // dégagement : distance de chaque point au reste du fil (hors voisinage immédiat)
  const clear=new Float32Array(LN), W=Math.floor(LN*0.06);
  for (let i=0;i<LN;i++){
    let m=1e9; const xi=pos[i*3], yi=pos[i*3+1], zi=pos[i*3+2];
    for (let j=0;j<LN;j+=2){
      let d=Math.abs(i-j); d=Math.min(d,LN-d); if (d<W) continue;
      const dx=pos[j*3]-xi, dy=pos[j*3+1]-yi, dz=pos[j*3+2]-zi, dd=dx*dx+dy*dy+dz*dz;
      if (dd<m) m=dd;
    }
    clear[i]=Math.sqrt(m);
  }
  loop={pos,nrm,bin,len,clear};
}
function loopIdx(u){ let i=Math.floor(u*LN)%LN; if (i<0) i+=LN; return i; }
function spawnSyn(){
  if (!loop) return;
  const P=loop.pos, B=S.bundle;
  for (let a=0;a<40;a++){
    const span=0.045+rng()*0.06;
    if (drawP<span+0.02) return;
    const ta=rng()*(drawP-span);
    if (syn.some(o=>ta<o.ta+o.span+0.03 && ta+span+0.03>o.ta)) continue;
    const rad=loop.len*span*(0.1+rng()*0.08)*(a>20?0.6:1);
    const reach=rad*B*1.3;
    // le fil ne doit pas repasser à travers l'éventail
    let ok=true;
    for (let q=0;q<=12 && ok;q++) if (loop.clear[loopIdx(ta+span*q/12)] < reach*1.6+1.2) ok=false;
    // ni croiser une autre synapse
    for (let oi=0; oi<syn.length && ok; oi++){
      const o=syn[oi], need=reach+o.rad*B*1.3+1.5;
      for (let q=0;q<=8 && ok;q++){
        const i=loopIdx(ta+span*q/8)*3;
        for (let r=0;r<=8;r++){
          const j=loopIdx(o.ta+o.span*r/8)*3;
          const dx=P[i]-P[j], dy=P[i+1]-P[j+1], dz=P[i+2]-P[j+2];
          if (dx*dx+dy*dy+dz*dz < need*need){ ok=false; break; }
        }
      }
    }
    if (!ok) continue;
    syn.push({id:synId++, ta, span, g:0, state:0, age:0, life:S.life*(0.6+rng()*0.8),
      mul:0.6+rng()*0.9, rad, ang:rng()*TAU, arc:Math.PI*(0.45+rng()*0.6),
      twist:(rng()-0.5)*2.2, flow:rng(), thick:0.7+rng()*0.6, toneF:6+rng()*18, tonePh:rng()*TAU,
      br:0.15+rng()*0.06, gap:0.03+rng()*0.015});
    return;
  }
}
// point du fil en u (0..1, périodique), décalé de (ca, sa) dans le repère local
function loopPoint(u,ca,sa,o){
  const L=loop; let s_=u*LN; s_-=Math.floor(s_/LN)*LN;
  const i0=s_|0, i1=(i0+1)%LN, f=s_-i0, a3=i0*3, b3=i1*3;
  for (let q=0;q<3;q++){
    const nn=L.nrm[a3+q]+(L.nrm[b3+q]-L.nrm[a3+q])*f, bb=L.bin[a3+q]+(L.bin[b3+q]-L.bin[a3+q])*f;
    sPos[o+q]=L.pos[a3+q]+(L.pos[b3+q]-L.pos[a3+q])*f+nn*ca+bb*sa;
  }
}
function airyStep(sim){
  if (!loop) return 0;
  const L=loop;
  drawP=Math.min(1, drawP+sim*S.grow/12);
  synAcc+=sim*S.births*(syn.length<S.synapses*0.5?2:1);
  while (synAcc>=1){ synAcc-=1; if (syn.length<S.synapses) spawnSyn(); }
  for (let i=syn.length-1;i>=0;i--){
    const y=syn[i];
    y.flow+=sim*S.flow*2.6/(L.len*y.span);
    if (y.state===0){ y.g+=sim*S.grow*0.45; if (y.g>=1){ y.g=1; y.state=1; } }
    else if (y.state===1){ y.age+=sim; if ((S.life<60 && y.age>y.life) || syn.length>S.synapses) y.state=2; }
    else { y.g-=sim*S.grow*0.45; if (y.g<=0) syn.splice(i,1); }
  }
  const P=pool, PL=pool.length, mode=S.colorMode, cl=lineCol;
  const dsz=S.dotSize*0.5, contrast=S.contrast, lw=0, lstep=LSTEP;
  let n=0;
  // le fil directeur, interrompu au cœur de chaque synapse ouverte
  if (S.lines){
    const cnt=Math.ceil(L.len/lstep), jmax=Math.floor(drawP*cnt);
    for (let j=0;j<=jmax && n<MAXD;j++){
      const u=j/cnt;
      let hidden=false;
      for (let q=0;q<syn.length;q++){
        const y=syn[q], tl=(u-y.ta)/y.span;
        if (tl<=0||tl>=1) continue;
        const h=sstep((y.g-0.05)/0.4)*0.5;
        if (Math.abs(tl-0.5)<h){ hidden=true; break; }
      }
      if (hidden) continue;
      const o=n*3; loopPoint(u,0,0,o);
      sSize[n]=lw; sSeed[n]=-1; sCol[o]=cl[0]; sCol[o+1]=cl[1]; sCol[o+2]=cl[2]; n++;
    }
  }
  // les synapses : le fil se dédouble en autant de brins que de files de pastilles,
  // laisse un léger vide, puis les pastilles circulent ; symétrique à la sortie
  for (const y of syn){
    const nStr=Math.max(2,Math.round(S.strands*y.mul));
    const br=y.br, p0=br+y.gap, pz=1-2*p0;
    const count=Math.max(3,Math.round(L.len*y.span*pz*S.density));
    const gs=sstep(y.g*1.4);
    for (let k=0;k<nStr && n<MAXD;k++){
      const kSeed=y.id*37+k, hk=hash3(kSeed,1,7), hk2=hash3(kSeed,2,13), hk3=hash3(kSeed,3,3);
      const u01=(k/(nStr-1))+(hk2-0.5)*0.3/nStr;
      const ang0=y.ang+(u01-0.5)*y.arc, R=y.rad*S.bundle*(0.75+0.5*hk3)*y.g;
      const off=(tl,o)=>{
        const e=Math.pow(Math.sin(Math.PI*tl),0.85), an=ang0+y.twist*tl;
        loopPoint(y.ta+tl*y.span, Math.cos(an)*R*e, Math.sin(an)*R*e, o);
      };
      if (S.lines){
        const cnt=Math.ceil(L.len*y.span*br/lstep);
        for (let j=0;j<=cnt && n<MAXD-1;j++){
          const o=n*3; off(br*j/cnt,o);
          sSize[n]=lw; sSeed[n]=-1; sCol[o]=cl[0]; sCol[o+1]=cl[1]; sCol[o+2]=cl[2]; n++;
        }
        for (let j=0;j<=cnt && n<MAXD-1;j++){
          const o=n*3; off(1-br+br*j/cnt,o);
          sSize[n]=lw; sSeed[n]=-1; sCol[o]=cl[0]; sCol[o+1]=cl[1]; sCol[o+2]=cl[2]; n++;
        }
      }
      const fl=y.flow*(0.82+0.36*hk3)/pz+hk, cStr=Math.floor(hash3(kSeed,5,21)*PL);
      for (let j=0;j<count;j++){
        let tp=j/count+fl; tp-=Math.floor(tp);
        const tl=p0+tp*pz, o=n*3; off(tl,o);
        const hj=hash3(kSeed,j,5), tone=0.5+0.5*Math.sin(tl*y.toneF+y.tonePh+k*0.9);
        sSize[n]=dsz*y.thick*((1-contrast)+contrast*(0.5*tone+0.5*hj))*(0.3+0.7*Math.sin(Math.PI*tp))*gs;
        sSeed[n]=hash3(kSeed,j,11);
        const col=P[mode===0?Math.floor(hash3(y.id,0,9)*PL):mode===1?cStr:Math.floor(hash3(kSeed,j,9)*PL)];
        sCol[o]=col[0]; sCol[o+1]=col[1]; sCol[o+2]=col[2];
        if (++n>=MAXD) break;
      }
    }
  }
  return n;
}
// Variante quantique : la même boucle devient un tube en volume, fait d'un nuage
// de petites pastilles qui glissent le long du tube et tourbillonnent autour de son axe
let qTime=0, pinches=[];
let QMUL=1, PXK=1;   // PXK : pixels rendus par pixel du calque (aperçu = export réduit)   // part des pastilles rendues (aperçus du Design libre)
// Pincements : des étranglements (ou gonflements) qui naissent, glissent le long du tube et s'effacent
function newPinch(){
  return {e:0, c:Math.random(), w:(0.5+Math.random())*S.pinchWidth, d:0.55+Math.random()*0.45,
    bulge:Math.random()<S.bulge, v:(Math.random()<0.25?-1:1)*(0.5+Math.random()),
    g:0, state:0, age:0, life:3+Math.random()*7};
}
function updatePinches(sim){
  const target=S.pinches|0;
  let alive=0; for (const p of pinches) if (p.state<2) alive++;
  while (alive<target){ pinches.push(newPinch()); alive++; }
  for (const p of pinches) if (alive>target && p.state<2){ p.state=2; alive--; }
  for (let i=pinches.length-1;i>=0;i--){
    const p=pinches[i];
    p.c+=sim*S.pinchSpeed*p.v*0.02; p.c-=Math.floor(p.c);
    if (p.state===0){ p.g+=sim/1.5; if (p.g>=1){ p.g=1; p.state=1; } }
    else if (p.state===1){ p.age+=sim; if (p.age>p.life) p.state=2; }
    else { p.g-=sim/1.5; if (p.g<=0) pinches.splice(i,1); }
  }
}
function pinchAt(u,e){
  let m=1; e=e|0;
  for (let i=0;i<pinches.length;i++){
    const p=pinches[i];
    if ((p.e|0)!==e) continue;
    let x=u-p.c; x-=Math.round(x); x/=p.w;
    if (x>-1 && x<1){ const k=1-x*x, f=k*k*p.g*S.pinchDepth*p.d; m*= p.bulge ? 1+0.8*f : 1-0.95*f; }
  }
  return m;
}
function quantumStep(sim){
  if (!loop) return 0;
  const L=loop;
  drawP=Math.min(1, drawP+sim*S.grow/8);
  qTime+=sim;
  updatePinches(sim);
  updateLobes(sim);
  if (S.qStruct===2){ updateLineLobes(sim); return membraneParticles(); }
  if (S.qStruct===1) return membraneParticles();
  const N=Math.min(MAXD, (S.qCount*QMUL)|0), P=pool, PL=pool.length, mode=S.colorMode;
  const R=S.tubeR, fill=S.fill, sw=S.swirl, tw=S.twinkle, jit=S.jitter, contrast=S.contrast;
  const dsz=S.dotSize*0.25, fl=qTime*S.flow*2.6/L.len, T=qTime;
  let n=0;
  for (let i=0;i<N;i++){
    const h1=hash3(i,1,3), h2=hash3(i,2,5), h3=hash3(i,3,7), h4=hash3(i,4,11), h5=hash3(i,5,13);
    let u=h1+fl*(0.55+0.9*h3); u-=Math.floor(u);
    if (u>drawP) continue;
    const a=h2*TAU + T*sw*(0.4+1.2*h4);
    let rr=R*(1-fill+fill*Math.sqrt(h5))*pinchAt(u);
    rr*=1+jit*0.18*Math.sin(T*(1.5+4*h3)+h1*60);
    const o=n*3; loopPoint(u, Math.cos(a)*rr, Math.sin(a)*rr, o);
    let sz=dsz*((1-contrast)+contrast*h4);
    if (tw>0){ const f=0.5+0.5*Math.sin(T*(1.5+5*h5)+h2*40); sz*=Math.max(0,1-tw*1.15*f*f); }
    if (drawP<1) sz*=sstep((drawP-u)/0.02);
    sSize[n]=sz; sSeed[n]=h3;
    const ci = mode===0 ? Math.floor((u*3)%1*PL) : mode===1 ? Math.floor(((a/TAU)%1+1)%1*PL) : Math.floor(hash3(i,6,17)*PL);
    const c=P[Math.min(PL-1,ci)];
    sCol[o]=c[0]; sCol[o+1]=c[1]; sCol[o+2]=c[2];
    n++;
  }
  return n;
}
// Structure « membrane » : un seul conduit directeur dont l'épaisseur est modelée
// par de longs renflements organiques séparés par des cols très fins. Les renflements
// sont toujours étirés le long du conduit (jamais des sphères) et leurs flancs sont
// concaves : le col s'évase brusquement, comme une membrane tendue.
// Les renflements occupent des emplacements régulièrement répartis sur le conduit
// (2 = face à face, 3 = tous les tiers, …). Ces emplacements glissent ensemble le long
// du conduit : l'écart entre renflements reste maximal et ils ne se touchent jamais.
// Un renflement qui s'efface libère sa place ; le suivant n'y naît qu'une fois la place vide.
let lobes=[], lobePhase=Math.random(), lobeN=0;
function newLobe(slot){
  return {slot, c:lobePhase+slot/Math.max(1,S.lobes|0), w:0.55+Math.random()*0.75, g:0, state:0, age:0, life:10+Math.random()*16,
    ph:Math.random()*TAU, bf:0.6+Math.random()*0.8, ge:0, half:0, amp:0, fast:false};
}
function updateLobes(sim){
  const N=Math.max(0,S.lobes|0);
  if (N!==lobeN){
    // nombre changé : les renflements hors des nouvelles places s'effacent vite
    for (const l of lobes) if (l.slot>=N && l.state<2){ l.state=2; l.fast=true; }
    lobeN=N;
  }
  // naissance uniquement dans une place entièrement libre
  const used=new Set(lobes.map(l=>l.slot));
  for (let k=0;k<N;k++) if (!used.has(k)) lobes.push(newLobe(k));
  lobePhase+=sim*S.pinchSpeed*0.006*(0.55+0.45*Math.sin(qTime*0.23)); lobePhase-=Math.floor(lobePhase);
  for (let i=lobes.length-1;i>=0;i--){
    const l=lobes[i];
    if (l.slot<N){
      // place cible + légère oscillation bornée, rejointe en douceur
      const tgt=lobePhase+l.slot/N+(0.1/N)*Math.sin(qTime*0.2*l.bf+l.ph);
      let d=tgt-l.c; d-=Math.round(d);
      l.c+=d*Math.min(1,sim*0.8); l.c-=Math.floor(l.c);
    }
    if (l.state===0){ l.g+=sim/7; if (l.g>=1){ l.g=1; l.state=1; } }
    else if (l.state===1){ l.age+=sim; if (l.age>l.life) l.state=2; }
    else { l.g-=sim/(l.fast?1.5:7); if (l.g<=0) lobes.splice(i,1); }
  }
}
const MB=720, mbR=new Float32Array(MB+1), mbC=new Float32Array(MB+1);
// Ligne : les extrémités s'effilent et s'éclaircissent progressivement (0 au bout, 1 ailleurs)
function lineFadeE(){ const L=loop; return L ? Math.min(0.3, S.lineFade*16/Math.max(1,L.len)) : 0; }
function lineTaper(u){
  const L=loop; if (!L) return 1;
  const e=lineFadeE(); if (e<=0) return 1;
  const ss=x=>{ x=Math.min(1,Math.max(0,x)); return x*x*(3-2*x); };
  return ss(u/e)*ss((1-u)/e);
}
function membraneParticles(){
  const L=loop, R=S.tubeR, thin=S.thin, thick=S.junction, line=isLine(), LB=line?lineLobes:lobes;
  const dataMode=line && S.lineMode>=1;
  // chaque renflement naît comme une longue ondulation à peine visible, puis gonfle
  // et se raccourcit en douceur (courbe d'aisance lente), et respire légèrement
  if (!line) for (const l of lobes){
    const g=Math.min(1,Math.max(0,l.g)), ge=g*g*g*(g*(g*6-15)+10);
    const breath=1+0.1*Math.sin(qTime*0.45*l.bf+l.ph)+0.05*Math.sin(qTime*1.1*l.bf+l.ph*2);
    l.ge=ge; l.amp=l.w*ge*breath;
    l.half=Math.min(Math.max(R*l.w*thick*S.lobeLen*(1.9-0.9*ge)*(1+0.06*Math.sin(qTime*0.37*l.bf+l.ph*3)), 1e-3)/L.len, 0.4/Math.max(1,S.lobes|0));
  }
  // profil d'épaisseur le long du conduit
  for (let m=0;m<=MB;m++){
    const u=m/MB; let b3=0;
    for (const l of LB){
      const half=l.half;
      let x=u-l.c; if (!line) x-=Math.round(x); x/=half;
      if (x>-1 && x<1){ const k=1-x*x, v=l.amp*k*k; b3+=v*v*v; }
    }
    const B=Math.cbrt(b3);
    // en mode Données, l'épaisseur du renflement est proportionnelle à la valeur
    mbR[m]= dataMode ? R*(thin+(thick*1.6-thin)*Math.min(B,1.2)) : R*(thin+(thick-thin)*Math.pow(Math.min(B,1.6),1.7));
    if (line) mbR[m]*=0.15+0.85*lineTaper(u);
  }
  // abscisse « de masse » : les particules ralentissent dans les renflements, comme un fluide
  // poids par longueur : fort dans les renflements, très faible dans les cols
  const Rr=R*thick, pe=2.4-1.4*S.neckDensity, fl0=(0.002+0.03*S.neckDensity)*R;
  // sur la Ligne, la densité diminue en douceur jusqu'à zéro au bout du conduit
  const tpw=m=>line?Math.pow(lineTaper(m/MB),1.6):1;
  let wPrev=(Rr*Math.pow(mbR[0]/Rr,pe)+fl0)*tpw(0);
  mbC[0]=0; for (let m=1;m<=MB;m++){ const wm=(Rr*Math.pow(mbR[m]/Rr,pe)+fl0)*tpw(m); mbC[m]=mbC[m-1]+0.5*(wm+wPrev); wPrev=wm; }
  const tot=mbC[MB];
  const N=Math.min(MAXD, (S.qCount*QMUL)|0), P=pool, PL=pool.length, mode=S.colorMode;
  const fill=S.fill, sw=S.swirl, tw=S.twinkle, jit=S.jitter, contrast=S.contrast, T=qTime;
  const dsz=S.dotSize*0.25, fl=T*S.flow*2.6/L.len;
  let n=0;
  for (let i=0;i<N;i++){
    const h1=hash3(i,1,3), h2=hash3(i,2,5), h3=hash3(i,3,7), h4=hash3(i,4,11), h5=hash3(i,5,13);
    let sm=h1+fl*(0.55+0.9*h3); sm-=Math.floor(sm); sm*=tot;
    let lo=0, hi=MB; while (hi-lo>1){ const mid=(lo+hi)>>1; if (mbC[mid]<sm) lo=mid; else hi=mid; }
    const f=(sm-mbC[lo])/((mbC[hi]-mbC[lo])||1), u=(lo+f)/MB;
    if (u>drawP) continue;
    const rad=mbR[lo]+(mbR[hi]-mbR[lo])*f;
    let rr=rad*(1-fill+fill*Math.sqrt(h5));
    rr*=1+jit*0.15*Math.sin(T*(1.5+4*h3)+h1*60);
    const a=h2*TAU+T*sw*(0.4+1.2*h4);
    const o=n*3; loopPoint(line?Math.min(u,(LN-1.001)/LN):u,Math.cos(a)*rr,Math.sin(a)*rr,o);
    let sz=dsz*((1-contrast)+contrast*h4)*(0.45+0.55*Math.min(1,rad/R));
    if (line) sz*=0.35+0.65*lineTaper(u);
    if (tw>0){ const q=0.5+0.5*Math.sin(T*(1.5+5*h5)+h2*40); sz*=Math.max(0,1-tw*1.15*q*q); }
    if (drawP<1) sz*=sstep((drawP-u)/0.02);
    sSize[n]=sz; sSeed[n]=h3;
    const ci = mode===0 ? Math.floor((u*3)%1*PL) : mode===1 ? Math.floor(((a/TAU)%1+1)%1*PL) : Math.floor(hash3(i,6,17)*PL);
    const c=P[Math.min(PL-1,ci)];
    sCol[o]=c[0]; sCol[o+1]=c[1]; sCol[o+2]=c[2];
    n++;
  }
  return n;
}
// --- Variante « Ligne » : le même conduit-membrane, ouvert et horizontal -----------
// Mode aléatoire : les renflements glissent le long de la ligne, à intervalles réguliers,
// naissent à gauche et s'effacent à droite. Mode données : un renflement par valeur,
// dont l'épaisseur est proportionnelle à la valeur (graphique).
let linePh=null;
let lineLobes=[], linePhase=0, lineVals=[], lineValsKey='';
function parseLineData(){
  const key=S.lineData+'|'+S.lineUnit;
  if (key===lineValsKey) return lineVals;
  lineValsKey=key;
  lineVals=(String(S.lineData).match(/-?\d+(?:[.,]\d+)?/g)||[]).slice(0,16).map(t=>Math.max(0,parseFloat(t.replace(',','.'))));
  return lineVals;
}
function updateLineLobes(sim){
  const L=loop; if (!L) return;
  const R=S.tubeR, thick=S.junction;
  if (S.lineMode>=1){
    // Données : valeurs saisies. Process : tailles progressives, de la plus petite à la plus grande.
    let vals, ref;
    if (S.lineMode===2){
      const n=Math.max(2,S.procSteps|0);
      vals=[]; for (let k=0;k<n;k++) vals.push(100*(S.procMin+(1-S.procMin)*Math.pow(k/(n-1),S.procCurve)));
      ref=100;
    } else { vals=parseLineData(); ref=Math.max(100, ...vals, 1); }
    const N=vals.length, gam = S.lineMode===1 ? S.dataContrast : 1;
    while (lineLobes.length<N) lineLobes.push({c:(lineLobes.length+0.5)/Math.max(1,N), amp:0, half:0.01, ph:Math.random()*TAU, val:0});
    lineLobes.length=N;
    lineLobes.forEach((l,k)=>{
      // le contraste accentue les écarts sans jamais changer l'ordre des tailles
      // les repères restent hors des extrémités effilées : aucun renflement n'est coupé par le fondu
      const fe=lineFadeE()*0.6, tc=fe+(1-2*fe)*(k+0.5)/N, tgt=Math.pow(vals[k]/ref, gam);
      l.c+= (tc-l.c)*Math.min(1,sim*2.5+0.0001);
      const breath=1+0.03*Math.sin(qTime*0.6+l.ph);
      l.amp+= (tgt*breath-l.amp)*Math.min(1,sim*1.8+0.0001);
      l.val=vals[k];
      const lenW=R*thick*S.lobeLen*(0.55+0.45*Math.min(1,tgt))*1.4/L.len;
      l.half=Math.max(0.004, Math.min(lenW, 0.44*(1-2*fe)/N));
    });
    return;
  }
  const N=Math.max(1,S.lobes|0);
  linePhase+=sim*S.pinchSpeed*0.012*(0.6+0.4*Math.sin(qTime*0.21)); 
  while (lineLobes.length<N) lineLobes.push({r:Math.random(), ph:Math.random()*TAU, bf:0.6+Math.random()*0.8, last:0, c:0, amp:0, half:0.01});
  // contraste : 0 = tous les renflements de même taille, 1 = très différents
  const lobeW=r=>{ const k=S.lobeContrast; return 0.9*(1-k)+k*(0.12+1.35*r); };
  lineLobes.length=N;
  lineLobes.forEach((l,k)=>{
    let c=linePhase+k/N; c-=Math.floor(c);
    if (c<l.last-0.5) { l.r=Math.random(); l.ph=Math.random()*TAU; }  // nouveau passage : nouveau renflement
    const w=lobeW(l.r);
    l.last=c;
    const ss=x=>{ x=Math.min(1,Math.max(0,x)); return x*x*(3-2*x); };
    const env=ss(c/0.16)*ss((1-c)/0.16);
    const breath=1+0.1*Math.sin(qTime*0.45*l.bf+l.ph);
    l.c=c; l.amp=w*env*breath;
    l.half=Math.min(Math.max(R*Math.max(w,0.3)*thick*S.lobeLen/L.len,1e-3), 0.4/N);
  });
}
// keep : on garde l'état (renflements, tracé, ondulation) et on ne fait que réajuster la ligne
function buildLine(keep){
  const LL=S.lineLen;
  if (!keep){ syn=[]; synAcc=0; drawP=0; lineLobes=[]; }
  worldR=Math.max(20,LL/2);
  if (!keep || !linePh) linePh=[rng()*TAU,rng()*TAU,rng()*TAU];
  const n=LN, wv=S.lineWave, ph=linePh, pts=[];
  if (S.linePath && S.linePath.length>3){
    // courbe tracée à la souris : mise à l'échelle par « Longueur », ondulation en profondeur
    const P=S.linePath.map(a=>new THREE.Vector3(a[0],a[1],a[2]));
    const cen=P.reduce((c,p)=>c.add(p),new THREE.Vector3()).divideScalar(P.length);
    const k=LL/Math.max(1e-3,S.linePathLen||LL);
    P.forEach(p=>p.sub(cen).multiplyScalar(k).add(cen));
    const sp=new THREE.CatmullRomCurve3(P,false,'centripetal').getSpacedPoints(n-1);
    let mr=0;
    sp.forEach((p,i)=>{ const t=i/(n-1); p.z+=wv*1.8*Math.sin(t*TAU*0.7+ph[2]); pts.push(p); mr=Math.max(mr,p.distanceTo(cen)); });
    worldR=Math.max(20,mr);
  } else {
    for (let i=0;i<n;i++){
      const t=i/(n-1), x=(t-0.5)*LL;
      const y=wv*(2.2*Math.sin(t*TAU*0.9+ph[0])+0.9*Math.sin(t*TAU*2.1+ph[1]));
      const z=wv*1.8*Math.sin(t*TAU*0.7+ph[2]);
      pts.push(new THREE.Vector3(x,y,z));
    }
  }
  const T=pts.map((p,i)=>pts[Math.min(n-1,i+1)].clone().sub(pts[Math.max(0,i-1)]).normalize());
  const pos=new Float32Array(n*3), nrm=new Float32Array(n*3), bin=new Float32Array(n*3);
  let nP=Math.abs(T[0].y)>0.9?new THREE.Vector3(0,0,1):new THREE.Vector3(0,1,0); nP.sub(T[0].clone().multiplyScalar(nP.dot(T[0]))).normalize();
  let len=0;
  for (let i=0;i<n;i++){
    let nn=nP.clone().sub(T[i].clone().multiplyScalar(nP.dot(T[i]))); if (nn.lengthSq()<1e-9) nn=nP.clone(); nn.normalize(); nP=nn;
    const bb=new THREE.Vector3().crossVectors(T[i],nn);
    pos.set([pts[i].x,pts[i].y,pts[i].z],i*3); nrm.set([nn.x,nn.y,nn.z],i*3); bin.set([bb.x,bb.y,bb.z],i*3);
    if (i) len+=pts[i].distanceTo(pts[i-1]);
  }
  loop={pos,nrm,bin,len,clear:new Float32Array(n).fill(1e9)};
}
// --- Infographie du mode Données ----------------------------------------------
// Pour chaque renflement : une pastille avec la valeur en haut, une tige pointillée à
// trois points (le point du milieu suit le centre du renflement), une légende en bas.
// Le même modèle sert à l'écran (SVG en surimpression), à l'export PNG, à l'export SVG
// et au copier-coller vers Figma (textes éditables).
const labelsEl=document.getElementById('labels');
let lastInfo=null, lastInfoMarkup='';
const INFO_FONT='Geist, "Helvetica Neue", Helvetica, Arial, sans-serif';
const measureCx=document.createElement('canvas').getContext('2d');
const wrapCache=new Map();
function wrapText(t, px, maxW, wt=400){
  const key=t+'|'+px+'|'+maxW+'|'+wt; if (wrapCache.has(key)) return wrapCache.get(key);
  measureCx.font=`${wt} ${px}px ${INFO_FONT}`;
  const words=t.split(/\s+/).filter(Boolean), lines=[]; let cur='';
  for (const wd of words){ const tst=cur?cur+' '+wd:wd; if (cur && measureCx.measureText(tst).width>maxW){ lines.push(cur); cur=wd; } else cur=tst; }
  if (cur) lines.push(cur);
  if (wrapCache.size>400) wrapCache.clear(); wrapCache.set(key,lines); return lines;
}
function infoColors(){
  const lightBg=['lin','ciel'].includes(S.bg), darkBg=DARK_BG.has(S.bg);
  return {accent: lightBg?HEX.brun:HEX.lin, badgeText: lightBg?HEX.lin:HEX.brun, text: darkBg?HEX.lin:HEX.brun};
}
function computeInfo(){
  if (S.app==='image' || !(isLine() && S.lineMode>=1 && S.lineLabels && loop && lineLobes.length)) return null;
  const proc=S.lineMode===2;
  const w=VW, h=VH, v=new THREE.Vector3(), P=loop.pos;
  const texts=String((proc?S.procTexts:S.lineTexts)||'').split('\n');
  const items=lineLobes.map((l,k)=>{
    const u=Math.min(l.c,(LN-1.001)/LN), s_=u*LN, i0=s_|0, f=s_-i0, a=i0*3, b=Math.min(LN-1,i0+1)*3;
    v.set(P[a]+(P[b]-P[a])*f, P[a+1]+(P[b+1]-P[a+1])*f, P[a+2]+(P[b+2]-P[a+2])*f).project(camera);
    const top = proc ? `${(S.procLabel||'').trim()} ${String(k+1).padStart(2,'0')}`.trim() : fmtVal(l.val)+(S.lineUnit||'');
    return {x:(v.x+1)/2*w, y:(1-v.y)/2*h, on:drawP>l.c, topText:top, text:(texts[k]||'').trim(), n:k+1};
  });
  const sc=S.infoScale, avg=items.reduce((t,i)=>t+i.y,0)/items.length;
  const I={kind:proc?'process':'data', items, sc, top:avg-128*sc*S.infoGap, bot:avg+105*sc*S.infoGap, col:infoColors()};
  // jamais plus large que l'écart entre deux repères (pas de chevauchement)
  let gapX=1e9; for (let i=1;i<items.length;i++) gapX=Math.min(gapX, Math.abs(items[i].x-items[i-1].x));
  const T={fs:(proc?16:14)*sc, fw:500, h:(proc?36:28)*sc, padX:(proc?16:12)*sc};
  measureCx.font=`${T.fw} ${T.fs}px ${INFO_FONT}`;
  items.forEach(it=>{
    it.top={...T, w:measureCx.measureText(it.topText).width+2*T.padX};
    if (proc){
      const cw=Math.max(110*sc, Math.min(250*sc, gapX*0.92)), padX=20*sc, padY=16*sc, fs=14*sc, lh=fs*1.32;
      const lines=it.text?wrapText(it.text, fs, cw-2*padX, 500):[];
      it.bot={kind:'card', lines, fs, fw:500, lh, w:cw, padX, padY, h:2*padY+Math.max(1,lines.length)*lh};
    } else {
      const fs=13*sc;
      it.bot={kind:'text', lines:it.text?wrapText(it.text, fs, Math.max(56, Math.min(170*sc, gapX*0.9))):[], fs, fw:400, lh:fs*1.35, w:Math.max(56, Math.min(170*sc, gapX*0.9))};
    }
  });
  return I;
}
const escXml=t=>String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const SVG_FONT="Geist, 'Helvetica Neue', Helvetica, Arial, sans-serif";
// géométrie commune à l'écran, au PNG, au SVG et au plugin Figma
function infoGeom(I, it){
  const sc=I.sc, dTop=I.top+it.top.h/2+9*sc, dBot=I.bot;
  const g={dTop, dBot, topY:I.top-it.top.h/2, topBase:I.top+it.top.fs*0.36};
  if (it.bot.kind==='card'){ g.cardY=dBot+12*sc; g.base=j=>g.cardY+it.bot.padY+j*it.bot.lh+it.bot.lh*0.5+it.bot.fs*0.36; }
  else { g.base=j=>dBot+21*sc+j*it.bot.lh; }
  return g;
}
// k : facteur d'échelle (1 = pixels de l'écran)
function infoSVG(I, k=1){
  const c=I.col, sc=I.sc, f=x=>Math.round(x*k*10)/10, out=[];
  out.push(`<g id="Infographie">`);
  I.items.forEach((it,i)=>{
    if (!it.on) return;
    const g=infoGeom(I,it), B=it.bot;
    out.push(`<g id="Repère ${i+1}">`);
    out.push(`<line id="Tige" x1="${f(it.x)}" y1="${f(g.dTop)}" x2="${f(it.x)}" y2="${f(g.dBot)}" stroke="${c.accent}" stroke-width="${f(sc)}" stroke-linecap="round" stroke-dasharray="${f(0.5*sc)} ${f(3.2*sc)}"/>`);
    out.push(`<circle id="Point haut" cx="${f(it.x)}" cy="${f(g.dTop)}" r="${f(2.4*sc)}" fill="${c.accent}"/>`);
    out.push(`<circle id="Point centre" cx="${f(it.x)}" cy="${f(it.y)}" r="${f(3*sc)}" fill="${c.accent}"/>`);
    out.push(`<circle id="Point bas" cx="${f(it.x)}" cy="${f(g.dBot)}" r="${f(2.4*sc)}" fill="${c.accent}"/>`);
    out.push(`<rect id="Bouton" x="${f(it.x-it.top.w/2)}" y="${f(g.topY)}" width="${f(it.top.w)}" height="${f(it.top.h)}" rx="${f(it.top.h/2)}" fill="${c.accent}"/>`);
    out.push(`<text id="${I.kind==='process'?'Étape':'Valeur'}" x="${f(it.x)}" y="${f(g.topBase)}" text-anchor="middle" font-family="${SVG_FONT}" font-weight="${it.top.fw}" font-size="${f(it.top.fs)}" fill="${c.badgeText}">${escXml(it.topText)}</text>`);
    if (B.kind==='card') out.push(`<rect id="Carte" x="${f(it.x-B.w/2)}" y="${f(g.cardY)}" width="${f(B.w)}" height="${f(B.h)}" rx="${f(3*sc)}" fill="${c.accent}"/>`);
    if (B.lines.length){
      const col = B.kind==='card' ? c.badgeText : c.text;
      out.push(`<text id="${B.kind==='card'?'Texte':'Légende'}" x="${f(it.x)}" y="${f(g.base(0))}" text-anchor="middle" font-family="${SVG_FONT}" font-weight="${B.fw}" font-size="${f(B.fs)}" fill="${col}">`+
        B.lines.map((ln,j)=>`<tspan x="${f(it.x)}" y="${f(g.base(j))}">${escXml(ln)}</tspan>`).join('')+`</text>`);
    }
    out.push(`</g>`);
  });
  out.push(`</g>`);
  return out.join('');
}
function rrect(ctx,x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.arcTo(x+w,y,x+w,y+r,r); ctx.lineTo(x+w,y+h-r); ctx.arcTo(x+w,y+h,x+w-r,y+h,r); ctx.lineTo(x+r,y+h); ctx.arcTo(x,y+h,x,y+h-r,r); ctx.lineTo(x,y+r); ctx.arcTo(x,y,x+r,y,r); ctx.closePath(); }
function drawInfoCanvas(ctx, I, k){
  const c=I.col, sc=I.sc;
  ctx.save();
  for (const it of I.items){
    if (!it.on) continue;
    const g=infoGeom(I,it), B=it.bot;
    ctx.strokeStyle=c.accent; ctx.lineWidth=sc*k; ctx.lineCap='round'; ctx.setLineDash([0.5*sc*k,3.2*sc*k]);
    ctx.beginPath(); ctx.moveTo(it.x*k,g.dTop*k); ctx.lineTo(it.x*k,g.dBot*k); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle=c.accent;
    for (const [yy,r] of [[g.dTop,2.4],[it.y,3],[g.dBot,2.4]]){ ctx.beginPath(); ctx.arc(it.x*k,yy*k,r*sc*k,0,TAU); ctx.fill(); }
    rrect(ctx,(it.x-it.top.w/2)*k,g.topY*k,it.top.w*k,it.top.h*k,it.top.h*k/2); ctx.fill();
    if (B.kind==='card'){ rrect(ctx,(it.x-B.w/2)*k,g.cardY*k,B.w*k,B.h*k,3*sc*k); ctx.fill(); }
    ctx.textAlign='center'; ctx.textBaseline='alphabetic';
    ctx.fillStyle=c.badgeText; ctx.font=`${it.top.fw} ${it.top.fs*k}px ${INFO_FONT}`; ctx.fillText(it.topText, it.x*k, g.topBase*k);
    ctx.fillStyle=B.kind==='card'?c.badgeText:c.text; ctx.font=`${B.fw} ${B.fs*k}px ${INFO_FONT}`;
    B.lines.forEach((ln,j)=>ctx.fillText(ln, it.x*k, g.base(j)*k));
  }
  ctx.restore();
}
function updateLabels(){
  lastInfo=computeInfo();
  const w=VW, h=VH;
  const mk=lastInfo ? `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="font-family:${INFO_FONT.replace(/"/g,"'")}">${infoSVG(lastInfo)}</svg>` : '';
  if (mk!==lastInfoMarkup){ labelsEl.innerHTML=mk; lastInfoMarkup=mk; }
}
if (document.fonts && document.fonts.load){ document.fonts.load(`500 14px Geist`).then(()=>wrapCache.clear()).catch(()=>{}); document.fonts.load(`400 13px Geist`).catch(()=>{}); }
// --- Tracer la ligne à la souris ----------------------------------------------
const lineDraw={armed:false, active:false, pts:[], id:null, target:'line'};
const drawSvg=document.createElementNS('http://www.w3.org/2000/svg','svg');
drawSvg.setAttribute('style','position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:2');
const drawPoly=document.createElementNS('http://www.w3.org/2000/svg','polyline');
drawPoly.setAttribute('fill','none'); drawPoly.setAttribute('stroke-width','2.5'); drawPoly.setAttribute('stroke-linecap','round'); drawPoly.setAttribute('stroke-linejoin','round');
drawSvg.appendChild(drawPoly); document.body.appendChild(drawSvg);
function drawPreview(){ drawPoly.setAttribute('stroke',HEX.orange); drawPoly.setAttribute('points', lineDraw.pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ')); }
canvas.addEventListener('pointerdown',e=>{
  if (!lineDraw.armed) return;
  e.preventDefault(); lineDraw.active=true; lineDraw.id=e.pointerId; lineDraw.pts=[[e.clientX,e.clientY]];
  canvas.setPointerCapture(e.pointerId); drawPreview();
});
canvas.addEventListener('pointermove',e=>{
  if (!lineDraw.active || e.pointerId!==lineDraw.id) return;
  const l=lineDraw.pts[lineDraw.pts.length-1];
  if (Math.hypot(e.clientX-l[0],e.clientY-l[1])>=3){ lineDraw.pts.push([e.clientX,e.clientY]); drawPreview(); }
});
function finishDraw(){
  if (!lineDraw.active) return;
  lineDraw.active=false;
  const sp=lineDraw.pts;
  let plen=0; for (let i=1;i<sp.length;i++) plen+=Math.hypot(sp[i][0]-sp[i-1][0],sp[i][1]-sp[i-1][1]);
  if (sp.length<6 || plen<60){ toast('Trace une courbe un peu plus longue.'); lineDraw.pts=[]; drawPreview(); return; }
  // lissage léger du geste
  const sm=sp.map((p,i)=>{ let x=0,y=0,c=0; for (let d=-3;d<=3;d++){ const q=sp[Math.min(sp.length-1,Math.max(0,i+d))]; x+=q[0]; y+=q[1]; c++; } return [x/c,y/c]; });
  // projection sur le plan face à la caméra qui passe par le centre de la scène
  camera.updateMatrixWorld();
  const rc=new THREE.Raycaster(), nrm=camera.getWorldDirection(new THREE.Vector3());
  const plane=new THREE.Plane().setFromNormalAndCoplanarPoint(nrm, orbit.target), out=[];
  for (const [cx,cy] of sm){
    rc.setFromCamera({x:(cx-VX)/VW*2-1, y:-((cy-VY)/VH)*2+1}, camera);
    const hit=new THREE.Vector3(); if (rc.ray.intersectPlane(plane,hit)) out.push(hit);
  }
  if (out.length<6){ lineDraw.pts=[]; drawPreview(); return; }
  if (lineDraw.target==='loop'){
    // forme fermée : le tracé se referme tout seul, puis devient le conduit de la membrane
    const P=new THREE.CatmullRomCurve3(out,true,'centripetal').getSpacedPoints(160).slice(0,160);
    S.loopPath=P.map(p=>[+p.x.toFixed(3),+p.y.toFixed(3),+p.z.toFixed(3)]);
    S.loopNormal=[+nrm.x.toFixed(4),+nrm.y.toFixed(4),+nrm.z.toFixed(4)];
    S.shapeMode=4; lineDraw.armed=false; lineDraw.target='line'; lineDraw.pts=[]; drawPreview();
    syncers.forEach(f=>f()); rng=mulberry32((Math.random()*1e9)|0); regenerate();
    toast('Forme créée : la membrane suit ton tracé. « Nouvelle forme » change son relief en profondeur.');
    return;
  }
  const pts=new THREE.CatmullRomCurve3(out,false,'centripetal').getSpacedPoints(119);
  let wl=0; for (let i=1;i<pts.length;i++) wl+=pts[i].distanceTo(pts[i-1]);
  S.linePath=pts.map(p=>[+p.x.toFixed(3),+p.y.toFixed(3),+p.z.toFixed(3)]);
  S.linePathLen=wl; S.lineLen=Math.round(wl);
  lineDraw.armed=false; lineDraw.pts=[]; drawPreview();
  syncers.forEach(f=>f());
  buildLine(true); drawP=0;
  toast('Ligne tracée. « Longueur de la ligne » l’agrandit ou la réduit, « Ligne droite » revient au départ.');
}
canvas.addEventListener('pointerup',e=>{ if (e.pointerId===lineDraw.id) finishDraw(); });
canvas.addEventListener('pointercancel',e=>{ if (e.pointerId===lineDraw.id) finishDraw(); });
function fmtVal(x){ return Number.isInteger(x)?String(x):x.toLocaleString('fr-FR',{maximumFractionDigits:2}); }
// ============================================================================
//  Illustration image : une image devient une trame de pastilles en 3D.
//  Chaque point de la grille prend une taille selon le ton de l'image (foncé = grosse
//  pastille) et avance en profondeur selon le « relief des tons ». Avec plusieurs
//  images, les pastilles se déconstruisent puis se reconstruisent d'une image à l'autre,
//  en boucle. Toutes les images ont le même nombre de pastilles (complétées par des
//  pastilles invisibles), ce qui rend les transitions stables quel que soit le nombre d'images.
// ============================================================================
const IMG_KEYS=['dotSize','aspect','fusion','contrast','maxPx','relief','depthThin','fov','autoRotate','rotSpeed','sway','colorMode','bg','dots'];
const IMAGE_DEFAULTS={dotSize:1, aspect:1.92, fusion:0.3, contrast:0, maxPx:80, relief:0, bg:'taupe', dots:new Set(['brun']), depthThin:0, fov:35, autoRotate:false, rotSpeed:0.6, sway:0.2, colorMode:1};
let imgList=[], imgSets=[], imgN=0, imgTime=0, imgDirty=true, motifStash=null, imageStash=null;
let curImg=0, selImg=0, imgTr=null;   // image affichée, image en cours de réglage, transition manuelle
const TONE_KEYS=['imgBright','imgContr','imgGamma','imgLow','imgHigh','imgBlur','imgInvert'];
const toneFromS=()=>{ const t={}; TONE_KEYS.forEach(k=>t[k]=S[k]); return t; };
// ---------------------------------------------------------------------------
//  Stockage partagé : préréglages et images visibles par toutes les personnes
//  qui ont le lien. 1) espace partagé de l'artefact Claude, 2) API du site
//  (/api/store, Vercel + Upstash Redis), 3) à défaut, ce navigateur seulement.
// ---------------------------------------------------------------------------
const Store={kind:'local', db:null, readOnly:false,
  async init(){
    try{ if (window.claude && typeof window.claude.use==='function'){ const db=await window.claude.use('db'); if (db){ this.db=db; this.kind='claude'; return; } } }catch(e){}
    try{ const r=await fetch('/api/store?ping=1',{cache:'no-store'}); if (r.ok){ const j=await r.json(); if (j && j.ok){ this.kind='api'; return; } } }catch(e){}
    this.kind='local';
  },
  _lk(col){ return 'bhc.store.'+col; },
  _lread(col){ try{ return JSON.parse(localStorage.getItem(this._lk(col))||'{}')||{}; }catch(e){ return {}; } },
  _lwrite(col,o){ try{ localStorage.setItem(this._lk(col),JSON.stringify(o)); return true; }catch(e){ return false; } },
  async list(col){
    if (this.kind==='claude'){ const q=await this.db.collection(col).get(); return q.docs.map(d=>({id:d.id, data:d.data()})).filter(x=>x.data); }
    if (this.kind==='api'){ const r=await fetch('/api/store?col='+col,{cache:'no-store'}); const j=await r.json(); if (!j.ok) throw new Error(j.error||'api'); return j.items; }
    const o=this._lread(col); return Object.keys(o).map(id=>({id, data:o[id]}));
  },
  async get(col,id){
    if (this.kind==='claude'){ const d=await this.db.collection(col).doc(id).get(); return d.exists?d.data():null; }
    if (this.kind==='api'){ const r=await fetch('/api/store?col='+col+'&id='+encodeURIComponent(id),{cache:'no-store'}); const j=await r.json(); return j.ok && j.item ? j.item.data : null; }
    return this._lread(col)[id]||null;
  },
  async put(col,id,data){
    if (this.readOnly) throw Object.assign(new Error('lecture seule'),{code:'readonly'});
    if (this.kind==='claude'){
      try{ await this.db.collection(col).doc(id).set(data); return; }
      catch(e){ if (e && e.code==='invalid_argument'){ this.readOnly=true; } throw e; }
    }
    if (this.kind==='api'){ const r=await fetch('/api/store',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({col,id,data})}); const j=await r.json().catch(()=>({})); if (!r.ok || !j.ok) throw new Error(j.error||('HTTP '+r.status)); return; }
    const o=this._lread(col); o[id]=data; if (!this._lwrite(col,o)) throw Object.assign(new Error('plein'),{code:'quota'});
  },
  async del(col,id){
    if (this.kind==='claude'){ await this.db.collection(col).doc(id).delete(); return; }
    if (this.kind==='api'){ await fetch('/api/store?col='+col+'&id='+encodeURIComponent(id),{method:'DELETE'}); return; }
    const o=this._lread(col); delete o[id]; this._lwrite(col,o);
  }
};
const storeReady=Store.init();
const newId=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
// image compressée pour le stockage partagé (une image = un document de moins de ~230 Ko)
function packImage(canvas){
  let max=1000, q=0.86, url='';
  for (let i=0;i<8;i++){
    const s=Math.min(1,max/Math.max(canvas.width,canvas.height)), c=document.createElement('canvas');
    c.width=Math.max(1,Math.round(canvas.width*s)); c.height=Math.max(1,Math.round(canvas.height*s));
    const x=c.getContext('2d'); x.fillStyle='#fff'; x.fillRect(0,0,c.width,c.height); x.drawImage(canvas,0,0,c.width,c.height);
    url=c.toDataURL('image/jpeg',q); if (url.length<230000) return url;
    max*=0.82; q=Math.max(0.6,q-0.05);
  }
  return url;
}
function canvasFromSrc(src){ return new Promise((res,rej)=>{ const im=new Image(); im.onload=()=>{ const c=document.createElement('canvas'); c.width=im.naturalWidth; c.height=im.naturalHeight; const x=c.getContext('2d'); x.fillStyle='#fff'; x.fillRect(0,0,c.width,c.height); x.drawImage(im,0,0); res(c); }; im.onerror=rej; im.src=src; }); }
const saveTimers={};
function saveImageMeta(im){
  if (!im || !im.id) return;
  clearTimeout(saveTimers[im.id]);
  saveTimers[im.id]=setTimeout(()=>{ Store.put('images', im.id, {name:im.name, tone:im.tone, inLoop:im.inLoop!==false, t:im.t||Date.now()}).catch(()=>{}); }, 600);
}
async function saveImage(im){
  im.id=im.id||newId(); im.t=im.t||Date.now();
  const src=im.src||packImage(im.canvas); im.src=src;
  await Store.put('imagesrc', im.id, {src});
  await Store.put('images', im.id, {name:im.name, tone:im.tone, inLoop:im.inLoop!==false, t:im.t});
}
async function loadLibrary(){
  await storeReady;
  let metas=[];
  try{ metas=await Store.list('images'); }catch(e){ metas=[]; }
  if (!metas.length){
    // première ouverture : la bibliothèque partagée démarre avec les trois images de référence
    const base=await defaultsReady;
    imgList=base.map((d,k)=>({name:d.name, canvas:d.canvas, src:d.src, tone:Object.assign(toneFromS(),{}), inLoop:true, t:Date.now()+k}));
    for (const im of imgList){ try{ await saveImage(im); }catch(e){ break; } }
  } else {
    metas.sort((a,b)=>(a.data.t||0)-(b.data.t||0));
    const out=[];
    for (const m of metas){
      try{
        const d=await Store.get('imagesrc', m.id); if (!d || !d.src) continue;
        out.push({id:m.id, name:m.data.name||'Image', src:d.src, canvas:await canvasFromSrc(d.src), tone:Object.assign(toneFromS(), m.data.tone||{}), inLoop:m.data.inLoop!==false, t:m.data.t||0});
      }catch(e){}
    }
    if (out.length) imgList=out;
  }
  curImg=selImg=0; imgTr=null; imgDirty=true; imgTime=0;
  if (typeof onLibraryChanged==='function') onLibraryChanged();
}
function shadeCanvas(fn){
  const n=360, c=document.createElement('canvas'); c.width=c.height=n;
  const x=c.getContext('2d'), id=x.createImageData(n,n), L=[-0.55,-0.6,0.58], ll=Math.hypot(...L);
  for (let j=0;j<n;j++) for (let i=0;i<n;i++){
    const nv=fn((i+0.5)/n*2-1, (j+0.5)/n*2-1);
    let v=1; if (nv){ const d=(nv[0]*L[0]+nv[1]*L[1]+nv[2]*L[2])/ll; v=0.08+0.88*Math.max(0,d); }
    const o=(j*n+i)*4; id.data[o]=id.data[o+1]=id.data[o+2]=Math.round(v*255); id.data[o+3]=255;
  }
  x.putImageData(id,0,0); return c;
}
const DEFAULT_IMAGES=[{"name": "Cadenas", "src": "data:image/jpeg;base64,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"}, {"name": "Microscope", "src": "data:image/jpeg;base64,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"}, {"name": "Échinacée", "src": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAQDAwQDAwQEBAQFBQQFBwsHBwYGBw4KCggLEA4RERAOEA8SFBoWEhMYEw8QFh8XGBsbHR0dERYgIh8cIhocHRz/2wBDAQUFBQcGBw0HBw0cEhASHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBz/wAARCAK8ArwDASIAAhEBAxEB/8QAHQABAAIDAQEBAQAAAAAAAAAAAAYHBAUIAwECCf/EAEYQAAICAQIEBAMFBgMHAgYDAQABAgMEBREGEiExBxNBUSJhcQgUMoGRFSNCobHBM1JiFiRygtHh8ENTFyU0kqLxJkRjsv/EABsBAQACAwEBAAAAAAAAAAAAAAADBAIFBgEH/8QANREBAAIBAwMCBQEHBAMBAQAAAAECAwQRIQUSMRNBBiIyUWEUI0JxgZGh8BWxweEz0fEkUv/aAAwDAQACEQMRAD8A7+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA1+r61g6HjSyM2+NUFGUkvWWy3ey9ehgcX8XadwbpEtQ1K1wq5uRcseaTfyS6vZdXt6I4n4q461fi7Us6WTmz8tUXZOP5c9ouabXPHr06bdOz3+exQ12vppK7zzLedG6Jk6leedqx5l0zd9orhOOfj4tDvv86xQVsVtBJpvm3fZLle7fREa077Vug5EK5ZOn31JzW8oPmXlS6Rmv+bo1+ZydqOoYUYSdW068rCjVCabarn13hP6vf82/ToajPzLcmObGEJ11TxqoypfdTTfK4yXp09P0NLXrea08Q7anwdoIrzMz/ku1a/tQcO+TiStxrVK3zfMUW2oKG+23TrzLbb6/IzNO+0rw7mcjnhZkFZt5bjyy5ntu49H3S6+3zOD7c/Ik7pSulKMv3svRNwSi0vbrv0/qeTz8pW/u5OpucpSjWu7S6Rj9Uu+/5FiOqZWM/B+imOJn+r+kOk+MfCWrXRqjqConKCsi71yxcWt+/YmmHqWHqFMLsXJquqs35ZQknufzDwNWzK/vH7zmcFTYpLvDlfVJ9m+/T/oTbh3j/VdHzVkY2bbVViXT5HOXStvruop922k9+/Qkx9ZiJ2yQ1+p+CJmO7TX3/i/ogDnbw2+0PDMhTicR8lMFGMI5Tk5Stn1ct/blXc6CwsyjUMWrJxrFZRbFShJeqfY3GLPTLG9JcZren59Ff089dnuACVSAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACB6z4q6TpV19dVGRlrHm67J1R2jGS7x3fdo9is2naEmLDfNbtxxvKeH4utjRTO2clGEIuTbeySINpfjDwpqk/LjnSouS3cLoNPb3+nzJNk6zpGRp1lluZj2YVi5JyU047Pvv7I9tS1fMJMmlzYp2y0mP5KT4+4j0LxD0K+UMvaijeGfTHm8zDlGT8rKjt12jJbPb0fXtscXarqeRRfHGocY51qsVOTX/AIeQmn6L8/puyyPFrF13wp4tzNOuy7fumpOc8TOoe07aLPxNPtzLopJ9JbJ9yhNV1KzUMTFupylLJ0+yxc9Mfg3XVSS/h3X6r6HM6ql8+b548Oz0M10mH9lfetuW9xdahl49s41722JRzcRtLaa/jW3ru+w0/iJZ0aL7F8Ndqkl2ThCL2ILPXbtTvWTiylRnxTc6E1GPMtpN/Tb3GPqlmVotGZp8V+0sJWQvqi91KMpPaTj69JPqYToI23mE0dZy/TE7x/v/APG+lqk8q2EZSf7qKt2kttlZJ+/ze5JcVO9wlXbGUXXzW2v+CUO63+iZXmq6lTqd2PHT4qEZYVP3htP93y9/59fyN9j6pi2Oz4mtIwLlOzZ9bnyrmT918PT33Mc2k3j5U2n65etpm6TZuT9xwq8quM5xsmo41PLtKx79ZteiS6/obHB1fHy5anQ74+dO6qD5Xts13m/p0XzbIU+IJNUaxfKctWym68PEit/Lj6SS9Ut/Xv8AkZWNVix1LD02lQr1Ci+WTmyguaMVFb9fl6bL1ZBOk2ptPlcjrl5v3V/z7f1Whh2Soea6oynzXOqPKuZx5ltNR/1bdN/nudOfZx4zzb3kaPmKcqbJN0WTs3SUUk1H3SSXb13OReF9R+/VrKssyLHkTkvulfTp12536Lbrt329VsXf4U6lpeg5D1bUNYqyNRdnJVhRn5dcY9/yriur26yeyPOm5LYdR22nhl1zNi1+itHb83+f5LtgGLpuZDUMDHyYNONsFLdLb+RlHYvlcxtO0gADwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEN4t8UeGuDVKvOz4WZiW/wB1oanZ+a9PzKE4s+0zqubesXRKa8GM21FJedfP02S9/XomZ1x2t4bDSdL1Oqn9nXj7z4dS5edjYFMrsrIqoqj3nbNRS/NlJ+JPGPBVtWVZhahKGqzjyu/FgpVTfpz83wz2/X03KN1KPEmrzV/EGpZeC7fihXdLzsma94Urfo/d7I8atOswMlV6NolS1Ge0VkarP7zlzXyqW8K9+/XbsW8WnmJ33dHouhVwWjJfJvP44j+rCyv23C6nVcfTacvHrlzK6uEq5SW/VKLfd+sV0+p54/G1F1lld92Xhya5bIzq5lJb/hai1svy+puLPDPVtavWbxTrmW0+9at2lt7bL8P1MjI4Q0XAx504Om88eXld182m1/xPdl2KTb6oddjnDkjttG/+yB8W8L4fGVdclqqvnRVyUyjk7+XH8Si65vZJdezKR4h4Y1fgvV6811OzTpT5rtot8/TpJwaW7Sffsy9Nc0HSNLwcrUMu/wArHxYOUlQubbfsk5d5N9l+fRFay0HjHiTCvshy4mkynJOebc0oe3WS+J7f5N1ua7U6bHPERzKn1DT6aa+nH1e2ymciS0vVqcmmakptTg1+GcH3j9H16M/WbOek5OX9yf7jJgtuvaLfRfqXRpn2csvWqYPJz506dTOU5Z99bi9vWNdfdv6v2JBnfZ80i+7FxqI5VGPWueU8ifPdOK/FKe3SKfblXv7FSNBlmOYc1XpOqtNtoj/PLnrUc67Kt/3LlhD7vGu/ZKDlt1a2Ml+Rm3QWPNVafjxi7YN9Xt6fPu0bfxN4Sy+FvETXNLw8R/db7Y/dIJPeVbimkvfZbrf5H3g3w713iPSczUaK3Thym417fivuW+1cF7pbtt9F36la2mtv2xHKnXHktk9OK7z/AMwwLdTjn6tn6226YUKNWHTHpv6Q29unVntp90sDFvw7Ip6zqUtldvzvlfrv6tvbb0JpV4D8VZmk6Zfp2kyzIxjKV2PTJedPputoyaTS7dOvyIVVo2o6hPKn5VlWrVz8qyE4uE8ZfhalF9eqWxHfT2jiapYpkpbttWe7/N5TTA1eVOM6ci6VeFVX5cqcdc0rW+rhv677byfrtsdB+AnCum8RVWZup3w0/RMa2NcKU08zMsfVVwS+JRa6vbrv+pyhDTszCrox6nGu2hSd33luPkrf8Uvn7en5nSfgB4n8N+HepzzcjTo5d+WowlqMquSqrbo41Sb6N936spU0mOuWJmFrLqct8M4sETFo/q/oFptFeNg0VVY6xqoQSjSv4F7GUaDhfjPReMMKvK0rNruhNb8qa5l+RvzduPyUtS0xeNpAAGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEO8QPEHA4F02Vl0o2Z1kX5NDe2792/RCI3Z48dslopSN5luOJeKtK4R06efq2VGimPZd5TftFerOV/ET7Qet8TyswtBlLTtPlul5e7usX+qS/D9Ft9SAcWcW654j65Od2RKzf8AD02iopvsv4V8+79Nyd8E+GVGHGGXnSU4L4nzrrPp/wDjH592i7iwR5s6/Q9JxaWsZs/zW+3siHDfhxrvFVvm33ywdOlJysyJPmsnuvTfs/n6E+rx+F/DnG8rS64w1K5KH3nl83Jua9IfP6dEePE3iBZdlx0HhutW2fgnfFLy69unReqX6GRw3wg8S55uVN5Wp3Ped1j32+UV6L6F6lI2bzstavdm4j2iDTtIzdRlPJzHZplNr5/JrmpZd3zst/h+kX+Zt4ZeLouJ5WDTTjUR/hr/AI/rLu3v9TaX4fw7OfO33jFfCn/c+16DXZJTsSlL/NL0RJvEIvUp5siWRn5+bNKmjab6byXb8v8AqZOLwdZkuV+qZMnGK5uV/givmvX6E0o0ymlctEY8sersku30PzOP3mKlFOONXLeEWv8AEa7yfyPN5twxtq5n5cfCI8Q8G6FnvEry8SOTXiPnowpf4Kk1/iWR/ia22W/TZnnp/DC1XMWZkN21Vd75dpf6YLsl6b7G9lU9RnZDqqd9pzT2lY/b6GfkXRhTHGx4KEfwJR7fREkVpXzzJW844nt8z5lqsuiiycpRrX3LGW1daXd9unz36L3MWrS01k3WJee4bvb+F7dv0NrOjklGtxTrx1zTa9ZP0/Lo/qzLtx/Lx0pL95dJb/I8tx4e1zzWNolzp4m8ErVvGnhmyFU5WW6K57t7xhKM+RfD6dN/qWjoHDGPiummFSjRh1uFS5V0X8Uu3dv19Tb6lTRPjv7zKMZW42DDHbf+WU3JI3GHDy8qK2/HXP8AXoQ48Fa72nyywz6WOZiOZ53Y+FpnkYylXHklTLeLXVrbr/1IR4k8H4X+0Wj8VU49Ublco5b5V+8qlspqXvunv9VuWYpS2+F7JbSfzNXqmEtV0G7Hnyvo9v57/wAjK1YtHKOtpnJF7IFrnhbp1tkcaeLXZj7748m+WUN+/JNdYv5fh+REs7w8fDldk7cevI0K5bX3So5nX125cipentZDb3Lr4Xf7X4erxsreWRiv7vNy6y5o/hb+bWzM/Giq7nTdFSns49VurI9nGW/dkc46e9WV9TNZ2mI3j+6kdL4I1ngrNWocMatfplSa/dWzd2Jb06NNfFBeza/M6A4D8asmF2NpPG2LHAybto0agnvj3Pbs5dk/qad8Ow0nHitKbhSk4+RNuUNvSOz7Jent8zCjptGVRZCrHqlXPdX4FqTg38k/6mN9LS8cKmsw4ddj+eOfvHl0nCcbIqUWpRkt012Z9KZ4J1uXDdMcTGyLZ6entHEyZOTqfqoyfXb5PctrT9Tx9Sq56pfEvxQf4o/U1uXDbHPLjdVo8mnttaOPuzAARKgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAANXxDr2Jw1pGVqWZNRpoi5dX+J+iRxfxZrOpeI/FEnF2WO2e3J15XHbdLp/D26dG/wBS7fGSGt8QcS42kU41tWk41Xm/ebVtQ5v8Um/VxXZfMjmmYWncI4N7xq5ylDaV2TbH8XbaUtuu3XpGJPipM8uj6ThjHT1dt5lqtE4O0zgvTf2rrWTXCMVvOU9vil6fX5RXbsaDXOJdW41vWm6TRdh4k48093s4x9HP5+0f1M+VeZxpxErJu54lEellta8ulLvKL7Ssl09Gl6b7ExwdMx6Y8lFcasSD9P4vq/U2OKsz5dFhitJ778y1HCfB+DoWMmtrLpL95dL1ZJFcoR/dx5Yfzf19kY1mTzNVwSUYLZQS7fVGXXGOOoztjKT7KC6uf1RZjZ7lta3zXlkxdar8618q99uv5IzsXGv1KUIVUtVt7RhHu/mZGicOZes2xt5N+u3mP/Dh9Pcn33PD4T0q3K2U7oR255d5P2XsVMueKfLXmWk1evrinsx82QXWNMWC6sa+cHst51RfRv0T+RodRteTL7vU0oRX7yxdopei+bMjPzsjNyZ2W7u+7qv9JizqhjY81Hr6vr3ZZxxtWO7yvafHaKxOSeXgnDFpl5a2k9oqPt8j9YtMnN3OLbr6Q3X8XoeUK5Snyey55S92+yNvDH5FVCT3UE5N+72/sjKfusZLbRt93nXjqqSjJPdy55P13/7s+PHVuTGMnvGldOvdnpLIjVGVr2c5v4Pn7I1mpZP7J0XIunL97s1H3c5P/qYSipEzMQhy1GGXxLrdm+8fg5WvVQexLMeXJdjSl1jJtb/8Uen8yAV//LlhZckuR2+TbP3jLpv+uxMabbJ40Yb7Simlt6Si91/Q9ieG01GLtpEQ3lCi4fE+kkl9Hv2POMHC3KqUW+ffp7br/sHdGXxJbQk1dHp3T7n7tfJnx2b2sjun+Ynhr2i0+ctO1qGSpOOHqtajPr+C1L4Zfmun1JHdT948xSa3335Y/L+67mm+4Ry9OycZ9E7Jxi/WHXdNfmkz86Pql2dhQynFLLxm6Muv1U0+/wCa6/meWhlkjunuSTT73cpUTe9iW6l/7kff8vVHhn4e8/Pq3hdB7cy9fk/dH7xra+SFya5F8W6/hb9f+pn2Rls7FtyS6P8A0/Iw3mFOd6X3aiWMs6uUk/Jyk9pJdd/k/kZ2jazk6blRhc3TfWukl1W390eF9NldqnDbmXRbevy/7mRBU6rTyuSjYuza6pmdoreu0vckRavbfmFp6NrtWq18r2jel1j6S+aNsUxp+Zk6XkRqscouL3jNdl9C1NH1WGo07Nx82K67Pv8AM1WowenO8eHM67QzgnurzWWzABWa4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADC1PVcfScfzb57b9IwXeT9kZpiT07HtzPvVkOezkUEpdUlvv0XuHsbb8q4za9V4pzHd90m69/3db6Qgvdt92aLX+GcvEy8fHzMWU6LOqsT3jKXpHp2RdySS2SSXyPHMx/vWNdTuoucXFS235W13J655rx7Nph6pfFMRWIiIULWoZNtmNjxjVp2NLllNdFOXtFeyGTKV/7mmO1UekYbbLf3b+RudT0//ZvDy8nIon+z9OkqfNUG05Pbqo92t2uvUimncWXcS6hHD4e0y3LvtaStt+CqHu5fJeq6MvxqK7buhx6qlq+pv4bvT9Om7IbQlbdJfu6o9XL5v/v2JxoPAc52xy9U6PbpSn1X1a/sSPhnh1aHib3TjdnW9brVHZb+0fZG9KmXV2txVodX1bJkma452h+Kaa8euNdUIwritlGK2SK+4/1XzsqnT4S+Cnayz6+iJ/kXwxqLLptKFcXJt/IpXMyLNQyLb598ix2Ny9IjR0777z7Mek4fUzd9vEPJJ2fvV/iW9Y791E8spK22uit9n8T2/Uy5yddakot22LaCX8KMCeXGrUasOHxWyostbXq00kv5mztbaXSRfl6YdTtv5ml1lu9vRLojO5ZSt5U3vJ9X7H6wqfJpskuVtLZPbo9+x6Kqdde+7lbbHZL/ACr1bPJlhkyb22YbqWVkp8vLVR0S93/2K71fiKHEurX14kl+zdOn5Ks9Lrv4mvlHt9TccUcT+Xgajiaa3JUVSjK5L8c2tlGPz69SH6Rpj0rGhiQUpeWuSUkvxTl+J/ruY1nedmx0OHee+3skGXgxy9Gox419bFKTj6t+j/XqZmmZHPCtpuVjW0l7zh0a+psFjpahjY+zUa6o7p+m73NZS44epSrk0o5cnOO/ZTXZ/oST4T+r37t7jXRhHkW0oVLn/wCKuXdfkzIsg/Kolv0ps5X9H2MOtupKxR61py5H05ob/EvyfU9rLvLnJc3PTbB+W/fbqmv/AD0RjvupWj5uGbTBK3Jjumo2bvb8mQvAus03i/JlBN42bLktW/TmXaX5EuxbYytslDZ12Pmct+/QimRi81eqXS+GSm64ST6uUtn0/TYxtbaGWPaItumFdcdOy3s98S3f4X/D/wBupu8J+WnTY/gfb5ojel5kbqcLTtRthXn20qSr39fVL5bI3dCnGHk2v97S3/zR9zytovChk+bifLInRJKdTXxQ6r25TDcVXJ3V9Gn8Wxn2y5aoW7c3lySfzTMe2tV380N/Lkl39v8Az+h7X7Swpb2lleWtSxVKtx82K6b/AND9aNqV2BkxnBNOL2lX8zHxHPFvlHdOt9UbGyqu9qyCXO/xL/MeXiJjtlDkiNprbmJWRh5dWdjV31SUoTX6HuQjhzUJYOR5Ns15U+jfu/cm6e63RqcuOaW2c1qMM4r7ewACNAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAxdSwaNSwMjEyK42UXQcZQfZo0nCXDmm6VgYt9GNSspVyg7YRSezlu106dySNbpp+p54+PXi1KqqPLBdke7s4vMV7d3qADxgjHHGW6tKWLDfnyZcvT2XVlewgrFNvrCC67ey9CS8a6lCWpTr51y4lS5lv2cn3+R68KcPRz6Vl3xccfb93F95y/zP5L0L+HJGLHu3+ly102m7590C1HUHHI+71yX3uyMnJLr5UNt/wA212RGqNYxsDWIX5cmqrqOTm77bvmW/wBdjea14YcVaFkZufhQq1WtWuyMapbX2RlvuuV7LdfUhfE+lzwsx4N0LIzrVdclY922ku/zI8ea2S+0txosuLUW7K2TrT+KKcijzruXHpndyQU3s5b9u/q/Q8tT4gycu+eJTBwraSsku7Xoov0+fv6Gn0nBhPGndZFNqS25uuzi+mx75W9Er5Vrmyrmqqq13c2+xc3Wpw4qWmfs89E4d+/05126dOnwV9rXRSuluox/JGFVhtTjutt749F0XT/uXLj8Nf7N+H+VjSSeXbHzbpP/ADNrp+XYrPHw/wDeMXfZ7zk39fcx09u+ZmEfT9d605JjxE8f0ZFEFbn6jkp7xrfKnv06R6r9SP8AFeBZdLFrp3jZ0knH026kp0il/drXKK2tscvruz8Z2C78+TTXLCPV7fhLUzwmx5e2+0sjh7S8nivFvvxsd15GNBK3f8FkvTb1327kb1GjMxbM7F8jIrrxq1kRn5b/AHXxbOLfsm109mXrwJpP7K0CnmildkN2ze2z69v5EitorvrsrshGULYuM01+JP0Zq7am0WlzlutXxZbRWN678ObtHvtqxK/vLrlkVxam6m2m127rfqvT07Gh4r1+PD9OnYdtcp/e5u+c1t8MU9lt89y7c3wl0iq9ZGNlX4eHVX8WOnvDddXNt9dznbWc9caa5ZRp0ldRXZ5OL5C8yVyW62il7923se5NVE12huNN1LBqLcTt992ulq12u8Qw1ajzqo0r/dVs9+ZNfFt/L57/ACLw0LVqtax4XTcYZtC8vJriu0vX+ZHOG/CDiKGThrKwo41dzh5litW+PCL37LvJp9Nuz6syvEHSf9kfETT83C568PMrkrK1vyylt6/XZ/yPceeI4Y5dVg1GWMOOeUsS3flvrGXwvr6Gdpul2alpllle8rsV7Si1+JepDXxRjxTunZCFdMHZZ7xivl/ItjgTHf7JnmNvkzZebDf1h6P8yXNl7axNZ5Ueo3tp6Rb3Qp178sfi3XWMvf6mVVzSjzQS3XV7PqSXiTQvLcsyhPk33sgv6kaqTqsi1KXJZ0+cfp8zOmaL1Y49RXNj7o8vVzU1zxfWPptsTnQNSWdhxi3+9rWzT7kDxnfk5OVjxpayMRKU4pb88X2lH3Rn6FqP3bVseCT57n5bj6/p8u5XzRF6zKpqsdcuOZieYWGACk0gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA12RoOm5csyV2HVOWZBV3trrZFdk/oZmNjVYePVj0QVdNUVCEF2il2R6gPZmZ4kKE8UNKtp4kyLbOVQvcLa2vWO20t/zXQvsjPGfBuNxdgeVKzyMytPychR5uRv3XqjPHfsndf6bq40meMk+FL42RDF0+pScGlFz7dJSf8+n9Sf8AcFXSya9c1Stw2XNi0TXxR3/AI5fM2nDnhfp2i5EsnLunqFymp1K2KUKtl0Siuj+rJ2SZM02jaFzX9V9WJx4eIny1+uY/wB50jMq/wA1bKaopUlXPZfDVKW/57F6NJpp9mU5q1UMH7/GtPatz2X1ZNo77bw86PlmJtSHjg1tY+PD1+Fv6d2Zug4H7W1CcOR7Ss2b9Gl3MCF3I1yb7Qr3fT16LYnfAumunGnkTTbXwxb9/VlnLk7Mcthrc04sVre8pfCCrhGMVtGK2SP0Aalyg1utn2MLF0fT8G6y7Fwcai6zrOdVUYyl9WkZoBuFfeL/AA9LV+FrczHT++ae1fDb+JLuunyLBPk4RshKEkpRktmn2aG+3hLgyzhyVyV9nHmlYMuIuLsLT6k5fe7I7uHVKHq/ptudf42PDFx6qKoqNdUVCKXoktkR3hfw/wBC4RyMvJ03EUcrKk3O6x80ox33UIv+GK36JEnPI38yu9S1/wCsyRaI2iHxpSTTW6fdEG4j0eOHdGcN1j3PZb9ov2/MnRg6vplesafbh2znCFu28od1136ElL9sqmnzTivv7ItXaqatO1uv8eK1i5e38Vbe2/5PZkt/Z+I8qGWqK/vEU1GxLqkzX4nDuPp+n5+JU52VZTnLlse/Luuy+RsNMptx9Pxqr5c1sK1GT+iPLTvO8Mclom0zVlAAxRAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA+xz7rnEuNLUMii22qrzrpQm7ZbRgoS2bb9uq/U6AskowlJ9kjkHi2UFw7xRNtzhm5koRW3r5m3f8/oVdTrJ0u1oWtJqp09+6IWJp2XHUdZ/ZOJKFuTLIUZR3/Cl1bf8AX2L1w8aGHjVUVraMFsVP4V6FjYl+JmrGgs+zEhHIyGt5z26RTl7bFvlmmqnUUi0pddrJ1No24iAAHqgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPDOlyYWRJ9o1yf8AI5A4khVfwjGFjU3fqG0YxXxTg7G+n6nWuvXKjRdQsfaNE3/JnKGo4ts8HhLGrhFOzLU2n1aS6L6/Q0vV5+mB0P4f4ix6Y7R/w6YQbT367E5I1wZUo4V1ijtz2bfkiSmx0de3DWAABZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABHOPsiWNwbrVkXtNY0uXb32OeI4s7uI+D8Vp7JSt5vffbmRePi5lPF4HznHm5pyhDaPdpySZT+g48rePNPhytxxcCLknt0lLf3+iNH1TnJEPXQvD9Do02tPvJt7e3U2hi6bUqcDHgltywSMo3OONqRDwABmAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAafiHifTeGMT7xqOQq+bfkrXWU37JHsRM8QypS17RWkbzLcAozUvH+dWTXZi6bH7g31lOW8n16rp2Zceiazi8QaVi6lhzU8fIgpxft7p/NGd8V6RvaFzV9N1OkrW+au0W8NgA3st32NfqGtYWn0W2WZNKnCLkoc63f5GERMztCnWlrztWN2ZbfVQt7LIwXvJ7Cq+u5b1zjNe6e5SWocVWZ+ZO6y2Uq4y5fxfC37JG70/iCePCLjZyy9NjZT0zJFd58tvfo2WuOLb8rWBDrPEXSseuEZTdl+3xRh12ZrbPE6DlJVYsWl7zKtdHmt4qp16dqbeKSsMEGxfEaubSuxJJf5oST2JNpuvYWqJeTZtL/LLozDJp8mP6oRZdJmxc3rshfjJNy0DCxo782RlQhsvX1/sV9wXB5nHurXVVuTjj1U9X0T2T2+XdsmfjDdOWRoGNXNwbv5231W3Z9PzI94XUSnxDr11UFGuzM5IyfXdR6f2Oc1cd+qiP4IF6V7ckdu2x+j5FcqSXZH03rwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPt07gD5KUYreTSXzKt40r8Qsi216dGurCX4Y4k15jXz3RUesV8d485PLyNTqXtkrmi/zj2LGLT+p+9EN5oui/qqxb1qx+N+XVE83HrTcr6lt7zRx34ra1qfEfFmXZm+ZR90scMWKbUfL916NnnPXdWxd5ZmNa2v8A1aZuX5uLMTP4ltyMO22l2ZVlC5nXUtrPo4SLuPS1xb3tO7r+i9B/QZ/Wm0Waaes014M7Lm/Ol8FlT/8AU9FJfPck3CXjNrfCfD37LxIUSrlfZNRnNuyEHHbaL9Pj267dEU9la3Xk5mVbKyc4ThFS51tsm3LZrutu2632aIXrPF9mKrVDJbs5nJ9otRa5mk1t16Lqu5y3UOqZ9RacWDjZ0PVKaGcHbqdpjfde+T4s8UaniZ0NT1rLdTlKv91JfvISr5XOPL6J/F06p7mkwtZ1TE1TFzr9QvzM2ElVJ2T5lFSTUZJdnvHt9CjKuN8u+bgrpxdf7yEYb9Gv4kl8m916rc32n6k8/E8z73bRVRHeSXauqNrl0+UYqS377ySNXa+tpaLd+2yhotX0+d66fHEOhNB8RK7crGp1GjyoRq5/O6KPNvs01777fqSGzi+/UrJrHg40puKfbme+2+xzTiaxbg4d8r4W2WRhLJnCUN1W7Zp01vfrzPo9vmWpwtrMdI0vHpzslW5l0udKEduVbb9X7HZ9E6tfN+yzzyt/p9Nl+bFHP2Wbhytm15lm09+yWxuaKt224/LeSIpha/jSblXXOxtvafK5I2sc2q+Sd0LNvVOzZP8AI6naduFHPhvH7uyUQysPHi3fmQht/Al1f5I3/CudZlahXHDjbJ8y/Fsunv8AI0HDP+yyub1KuUY79PLlutvm112Lp0F6M8WL0hYyq2/9JLf8/U1Ou1M03p2/zcl1XVejE4+yZ/PsrDxUvV/GmgYs38FVU7ZR+e3R/wAj08GsTmpyMpPeF+RZbB+6fr/M1PiFmxs8Rchzr3hhYDmmlu90t2v0JR4LYsquGcWblv8ADJr6N/8A6OG+vW8uUlaAAN2xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8cmdFdM55Mq40xW8pWNKKXz3K34t8WliZ1ui8J6dbr+uwfLOOOm6cd/wCufbf5EGzvDXj7jqH3njPXsfAwfxPGjN8tf/LFqP6tmUV+7YafQxeIvmvFI/PM/wAojlveM/FDwzwrbabKI6plw3TWBTzKL+c10OYfE7i3TNZtrs0PQcjSJ0OLjkvK5nH4vWK2bXzW/dFzZmjeEvB+1eTmZmtZUPhdeNL4U/VLbZL6bnO3jvr3D2rWYstA4dv09qLVVrt382L23Sa9u+z/ACZ5qZtGKYpMu16XTFpaxkx0yTH3niv9Fda9rGRlZF+bOyDnG1LmsjJJPq9pPbpzRbe31IrnYmVZOp3zSptrhGV26koqK2g2+z6vlcvyZnPWrVCC6ylBSULVe3Ll3TaUu1nr8MlzGLl6nRkZPmO6CU4rnnOEXGE994ylypc0JLeMntv7mlx0tWd0Ovy11PNpYGk6TNZca43yjdKSjvul5TafMt/ddOnotvclnD1ltVkOeSgrZYyahHdylampV7Pp1iuf26dCK33yjlOC5qZ2RUPKlJczi4Sa2l2kt9tt/i22R6x1Vfd4xcbKY2OE5b0tuULoKDktui5WnGHr8RLkxzeOWvwZaYPp4TKWoyksWlWLOu3r5kulELuST822f8c4pdF6bFqcG1VS4m0/h/I1eebmZGJRvqsIc+PXB9VzT7KEYvv05pNr0ZQWbdmVU0zzaciFeSpqFebBV1RjFJQlGtdZPkW2/q/oWD4cT1LV8fIqpzsfHwJyjbk5OTNLnntt0ivxbdvbv0MMGO2K8WrOzd6DVXy5PSrftm3vDqnV8bw60V/dq9f1HVsv8LePFSjuvdroavH1DSub9zp+UobdHZOLbItgaPpGNVV5+v4LfTo6p9PyjHZEp0vhnT9Qi5Ymt6JY2/wtpS+nxbHcaXLFaxa1vLZ+ng09f2ma1p95n/42+Fm6eujoyYf8CTJBg59GNdG3Gzr6bvST+F/yMHF8LdWnX51OJj3wX8VPK/6M9p8J6tgQ/f6dk1wS6yVb2/Vblqc2C/HdEtZmy6PN8tckT/P/AIZHEGBk6hLVNWU3lZuRjOp017PmSW269nsWp4aYqo0DHaculcY8sls19fmU9GV2I0lJw7Nc28d127v1JLoPGmq6XJRUlbT3lCfr+ZpNR0Ws5fXwue13Re+O/BMT+F4AiGi+IGBqUo1ZCeLe+m0vwt/Ul0ZRnFSi04vs0U8mK+Odrxs5vNgyYZ7ckbPoAI0QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD8W2woqnbbOMK4JylKT2SS9SE6tO3ijFtszMy3SeF49Jz5/KuzF/xd4Qfy+J/IjfiB4p6VpWp3afepX0YWznRB9ci70g/9Ee7939CiuLeP9e43yubNyHThQf7vFqXwR+a9G/TdkuPFNpdH0n4f1OsmL7dtfv/AOoWprPjRoPCOP8AsfgvS6PLr+GNihy1t+6S6yfzfcpziXjniDim1ftTU7boyk+XHi+WEflsun67kbzMrG0uMndZyTl1lBPedhonmanrSlHDrWHhfxWy7y+j9S1FKV4h9E0HRdDoIia17rfeeZ/6bPM6XwxlfVC2f4lzdYL3lL0Nfx1ovD/7Bm8DKu1bUpx5Lrba/Ixsfo9pxlJpyafy9Xuj3oxKsHHcaam+brO274pz99/7E24B8OsXjW2VutK6GmT+Gucf8S7/ADNJ9IwXrL37ditqtu3ln1rJjrp+7LkmtY8RHvP2cb6nqULsi22mmGPByUozUpKKlHpt0/Fv8+vbqfM2rLwsbDzb1dTi5dTsxrpS82KjvtKEotbuPN79voW944cJ8KYGsZM+D4v9n4qaszLLpWuTjuuk5dHu/RL2233ZRORp2pY84rLpuqs5U1Xatvha3Xwt+u+/v1NbWI9nzPPfNT5r0nnw2GNj3W4WpSjOiqGJX95uoyJqVFrl8MVX7S+LovkY+ZdpioorwZZP3nyI1ZPLZy1zujJvdLrzRa279n2NaseSjBxfNKL3e0eil7P06fM3HD3Cmqa/kzhhYk7baOS17LfeLlsml6vf+Fddk2jO3bWs2tPDX21FpjeI/i9qNWz9VvxMO+XPRS1RRDJe/JWnuoJvbbr037rfui4+CNKwoJ2Qdim5Nzpk1NQe/Vbe/T8yP8OcCZWka9bPOVVzlKUY5FT54Ke/WOzX4Wt+69S5XhYus0O3HonVdVGO04x5X16Lfbpv06rttsZYKd94iI4fRfhfS5NNaM2au8W8S2OJguVcZY204eqpm04/8vqzPq0bFyZ/voRjav8A3I8kl8uZepFse/JwMtU5VkqMl7KGRD+L+z+jJppnEiqnGnVsaPJ0jHLrW9cv+KP8J0eC9JjttDqNX6lYma8w2Wm4mtaLNZGk6tm4ji90oz54P8l/dFj6H4w8R6ZHy9bxqs/H7ebVHlmvy7MidmmThVHKxY2wol2uxXzRf5GNTqd9TatjHJhF7OUVtNf8UfQnyaXFlhzGp02n13GWkTP9JhmYOu51kq416hKNuRqK5lNczlW+rTT3277dC/cPg3RtRwKLp4flWSju+VtPcofFjp2pveD8i9NbSg9pbp7otng7jvJolXp2sbW1JbQzoensrI+n1XQ1N9Bn01ptW0zDlOp9Ozaf5tNado9vdt8jw6oUubEyZQ/02R5kZ2k6Rq2ipxhdC+nf8Db7fL2JRGSkk000+qa9T6Q21GS0dtp3aC+szZK9t53/AIvKi6N8d10kukovumep+I1QjZKxLacls37n7IFaQAB4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQ/wAQ+M4cI6Q5U7T1LJ3hj193v6y29kTAifGHBFPF12JK2/yFRvvOME5vf0W/ZHsLOk9KM1Zz/T7uVc/HnkZdmVnWebdbJ2SfeU2+7ZGs/Nuscq9Pp5Vvs7dt4r5L0bLg8UNP4c4b/wDlekKyepRallZM7N+Rekfbd+xV9eye8ZxrrS35p9Jv8vT69zYUnurGz6103V11OCLYqzWPZocbh6MbVdnWSvyZ9eVd19fmbWylPlhCMXNJ9ltGPyMhVu66uNafmTfLGEE3Ob+hY2LwdhcFaVDWeLK4TypR5sTSubZyf+ex+kex7PbT+KfV6/Fo5iLc2nxEeZRbQeC8GODLiDijI+6aHSt05vlllP8AyQ26te7NJxj4galxFjrT8OtaLw8lyrFq+C2+C7eZL0h7x6bo/XEGsZ/FeVVqepveqKaxcZLlrgl68r6L/wAZVXE+sS1DJnh49m9e/wC8mu0/f/l9vfuV8sR9VkGHRTnvGo1nM+1faP8Av8sqFtGuZ9WmafXD7rjy3nlyim0+nSrftLbopPsux5arwvh5mq2Tsj5tzhK+ydj5uRfw9+7k+r99jbaFpS0bS2/L5bZw5pvs/lH5d1ubTMo+7zykopWuPX67JPb22baIf00WjdubabDl/wDNWOUY0vw+0XH4CvoeJTPXNQ1RV3ZM25ThSq2+RJ9Nm5rd/JextuFOH9Hw9NtpycOMqMqiFM7oT5bK+u6a6pbppdX9D30+anxJm0tKUIU8669U/c3GFTVGvyLIc1MlKEq1/En/ANNiDPoYyYrRVpdf8Pae2hzYcUczzBp/DGZhafk4+fKdl9eRZGuycHF21bKUH1+XR+qf5Hlizsw8mcqujckpQ3aU1t3+vuWBTl36nwXZg5MnPO0ayM1J9Oap9FNfVPZkNysSbtbraXmLeLfZvuyXptu7DH3rxKP4Z1Vsuhrjy/VSdpZVuJi6xhRupSnBP4q/Wt+5qqbMjS5Oq5uzG9Jtdfz9z6p5GnZUc3EX4nyW0PtNr0+u3YkNVmFrGJGcEnGz+GX8L9kbWdr8+7ed8149mdwpxdk8L2qzDmp4U/8AExLetU17fJ/MtPVI8HcVcN265iR+75WPy+fjRfLbU37bf1KKytMyNNs5q978aXXlfdL/AKn4xNRvxeaULX93sW3O+q9Phn7+5FfviO7H5hpOpdLrqJ9fTW7Mkfb3/ErEnpsfhspyo5dEoKcFauSfK/VSX90ZOmZuRiyUXOTbe0I29JS+UZLpL6Hp4a016/xdjZNMa4wjTCmUJ/H1XdP5F8ax4daLqkZOuhYlzX4qUuV/WHZkek6pktvXNXbbhyuTrdsNv0+spzHu0vAXGCtrhhZM/wB31jCcuji/Zr0/oWQVh/8ADbNwJc+NfXa47crl0bX+V7+n9CccMzyp6PQs2uVeRBuLjN7yST2W79ehDqJpa3dRznUIwWt6mCeJbcAFdrQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAI/xprr4d4dy82G/nbKurZb/HLoiQGDrGk4+uadfgZSk6LltLlezX0YSYprW9ZvG8b8uOtZruyLbrcqW7lLnkpS3X1k3/AOfI2PCXAGu8XZEXp2G68X+LMvhyUx+m/wCN/T+R0jp/hfwzgWq16fHJsi94yyX5mz+j6Eoy8nH0rBuyLXGrGx4OctuijFInjPMV7Yddn+K7RjjFpabe2/8A0qdaDw34L6L+0Lox1DXrk4VWWpc9k/8ASv4Yr1ZQWua5n8YatbqGoWOyjm36vpNruuvaK9jbcccTZnG/EN2VbOSxpxcaoeldafb2+bfq/oaPLsqxMSTlFRx6Y7yT/iaJ8dNo7reW+6J061YjVamd72+/t+EU424hlVT5MW42zW0YrtCH/Vvt8iOcLaNHIttzL4OddTi5L/NP+GH9X9FsfcXFyeKNenv1c3zzcu0W32f5dCfVYFOFjLGqb8vGhLr2cpS7zf8AT8iOKze28uk3iJh80vRrtWy3Cp/u6IPJvs7qMY9X9e+3zb6mG6JX7WzX+NZF/lzFtcJ6HPR/CbiLXZ173ZrhRVuu1aa32+Tb/kVrTBxxMacVu3at/b8TJ6zExOypodfOqzZO36azsiuI41ceXwjsueMq307/AA77fqiSOnl5kujrns9unfZ/1IzcvJ45ckn1yY9fk9ib1QcsnJq3S5o783+pf/s8xw2c24ZWn5Twr8fOblOurbDy1HrzVWJuEl78p91HElTlWYm/NOMuaEt+m67f2PxiYiy4SxLekc6qWNLbootLeDfttJIY+RZqvD+Pkv8A+uwmsa/3Uovp+r3/AJlKk+hqppPi/wDvH/ty2G0aLqVsU/Tljf8AnDzxseGdV5kq/j6wnF9m/mjBrxfuWSsiCfk2t+fD32fVr2ZscXIVWTzyaSs3UvZSXcz8uCXJsk67fhlKHdN+v0NpFd+XQWvMPlj+6Vx8181M+sLGvT0/MxLtNx5J2NV1qXwq30ftzL+5uNPvjPEvw76VZOlprb1j8v6/kzCyaMjS489S8/Fm2pV7bvZdHs/4kRfqcNsvoTO1lCdXT1PQmdrMDQM3V+Adfoz8WrzpUT5uSL3Vtfqv0OzOH9dxOJdHxNUwbFPHyYKSa9H6p/NPoci6bm0XVOqfNLAj/wDfR7P3cS2fC3Wp8Oal+z7bFPS9QlvCSfwwm+zXyfZr0ZHqccTHdDmviXQfqKevEfPXz+Y/6XoNtgCi4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAp7xw4rePhVcP4slK7K+K+Me/L6R/NluZORXiY9t9slGuqLnJv0SOUte1G3VNSztXyZLzsqblV135Ut1Hb8jPHEd3Le9A0cajUxe3iv+6NvH5F5ct3bJp2ST7pfwr6fyIhxlmycKtPx1OydjTajHdyS6dPz9SaY+Dl63n0abp9NluTa3FeX123/El/17L5n51DhKPD/EGRjZfJbn1NRbr/DVBLflj82+7Lk2ieIfR66nFF/Si29vsj2jaXDhnQHOfLLNntzT27z9l8j30/Cu1TKxMKmLlLJsikm9t231bR6apcsrLrrfJ5ND3fK+jfuvku35Fp+A3Cn7Y1+7X7698bB+GltdHN/12XUTMUrKPqGtpptLfNf7cfxTbxR0+rhrwqxNLr/BU663t05mlu/1ZzljKK0zDe+635m/fdv+h0n9oOx18GUf5XkpP/7JHNWJvLS9Pil3bX5LcwwT8rWfCNptpbWmeZtP/CIaklVxPGaX4Lo9flsmT+qlRzISe3fkfz/86EL1ijm1a+e+/LfX1S90kv6E4vg6syyqScW/iX0777/Umx8WdRMxvMbvfJplW7Jw/wDTlG5f1Z80791xnnYSjvi6zWrob9EpyXb5dd+vzMu6fNCE+XmVi5e3Roj+p5ixruHsqH+LjWyqnu+/xJpfybNf1n5MMZo/dndyvxFE009dVXzjnd9yKZ4+bLHt54c89nzrZqS/82f0Nnpditrlj5O/+V+3yaJ94qcIQydM0/ifFhP7rl1Rlc4dq7WvxP5P3KrxrWrN5OXmwjtJr+Je7/qbDBn76xb7tv07qGPqGmjJSeUkVksK2nIj/iUvaUfePqvmtja57tr0vh7HlKL5vNv5YpJOHM+q9tkupqK5rKphfGSm2uSTit047dH+Z8nYsnFptk5cuFVbRLbvyNdJfluabreGNo1WPi1fdz/xHprTjjVY52tT3bGnQY5Whf7QRsqxfKko2NT3W8um3+pPv7s22i4GVi5mHpdtVlNep/8A0eya5ZvrvCT7Jrq0+x+L6rcbw8wMeU4/vs2tTcXupKMX129nui+vD7EU+CtDWTSnKutSrU47uPV8rW/bpsa7p3U82oyThv7Rvu5mPiHU2rOLJG6TYddlOJRXdPnthBRlPbbmaXc9wDcNJM78gADwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABFfEGvPy+H5afp2PK6/PtjQ9nsoRfVyb9FstvzKUl4e6jrHFWRo9Mq5/deWN2RGL8qlbbtN+r/wBKOgNd17G0Gimd6nO7In5VFNcW5Wz2b5V+hW1XjJRpeo5WPn6NLHj5r3lU/i3/ANSfeRWzarFgtHqW2X9J1TJoqzGPjdN+EOBtL4Lw3XiQ8zImt7cmxfHP5fJfJHMOtamsrVtd1KT3U758spe3Nsl+q/kXrneN3D/l21U051kpwfK1Wlu2unTfc57zFC/HpnzpQ813z6bbz/hW3ffdmeLX4Zt8t4lt/h7VVnPkzZbbzs1ulaHma/q2JpGHVKzMyJqC6bcrX4pP2ST6+79jszhThvF4U0LE0vFXwUx+KXrOT7yf1ZVvg9j8PcK6ddl5udXHV8x7yVy2dMN+kE/m+r+bLhw9VwtQipYuXTdF/wCSaZPbU0yztWyDrvVp1mX06T8lf7/lXP2gMR5Hhzl2R70XVzf0b2f9TmXR5b4mInLrs4yfpzL0+p2Vx1o3+0HCGs6ctua/Gmob+kkt1/NHGmiwseHhQn8MpXSXV9d/T+hYwXiI2l0HwhqI9G+Kfad2JLEnquv4un0razMzqqt9u/XZfo3uTLibBnpuvzx5Q+KuzyZbr23PnhNpdms+KGmQa3hiWW5Njfsuz/VliePPDzxcmOq1VydeQlKTj6Tj3/Vf3M4vFb7Nrl6pWnU400+Jj+6t8b4sR1zjt5E2uq7fP9GRLiTlpwY8kk3Xmwk132+GS/rsyXYcVO/o3JZNak0+m/oyL8UYso42dLZxSlCb32f8SSKvWNraLJ+Iedb2tossfh1n4axo4g8N8HGyoRux51SonCS6NJ7FBeJHAWVwPrULIRnPAtb8m2K35o/5X81/QuzwHyHfwLVFv8FjW35InuuaHhcRabdgZ9SsotW3zi/dP0ZW6dmn9Pjt+IfP+kdTvoMkW81nzDj/AEqxVtuDbxrO+y6b79l+p75cFTDKhybxyIqL2f8AqXVfluSXjTw9y+DMlVr97hZHM6702k5L3XaL2/U02NCWoV0zhJO2MlXP5PdJMk6lmjJp7Ul3Gr1mHV6K9sc8TErs4O4IxdY0jRMjMXNhY3NasdrbzbHsk5fJbdvdlpQhGuMYxSjGK2SS6JGq4Zo+76Dgw2Sflp7LsbYh0uCmLHEVh80mOQAFkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGv1bW8DQ8Z352RCmHpzPrL6FScReJ2ucQWSwuFNMyLYPo7oxfb3b9vkvp0IcuemPieZ+zybRC19V4j0rRIOeoZ9GPFLd880in+LvtARpk6OHMON2/4cvJ/DJe8YLq18+xpa/BPirii1ZOs6jTjSk9+e1O2yK9ox7L8yc6X4A8L4tVX3+WXqF1ceXmts5Y7d9uWPZfIo5LazNxjjsj7z5RW9Sfp4UVrniFxrxDRC27U83HhKb8v7tHkjJJdVvHr8u73XsQ18QanJycdXzLmpbXpTk5J+je/Xfqd3YmjafhYlWJRh0Qx6ltCHImkY2ZwtomfGccjSsOan+J+Uk3+a6lXJ0Wcsb5cm8sZwTbzLiOrWtQscFLIm9+9mRQ5NL232PSjOzJSobyKYxo/wAHm6Rr3fp02e51Pq/grw9qNkrcazMwptbctdrnWv8Allvt+RWPEX2eeI6oSelazi5lKbflWVKmbXot1un9Spbot8X0MIx5cc/JKuI8Sa1fUo/tGUp7uKgrd+r+W5scLirVNPlCV+RkOa6qO8Xs10ez9V8+xpdW4I1jhzrrWlZGJV0i5zhKcfrvHdbfoR3LyM/Q8lVxfPiyXwqxc9VnzW/f8tmvU1OfTZqT4mJQTF6zuvfRvGrNom4WZUbaIx2ba50vf4fxNe73fyRW+RtDNtnFxnXLKnauVbKSlu016rv67diBz1T71bDkpsxpS6eZU3KCl7tPqvobXB4ieK/LlZGyXNs9obpNd2n/AH9i3oOqajTW21E71b3oPWI0OebZfEuhvs98PJZmua7OPqsSptf809vlu0vyLV474bjxTw1mYPKnfy89TfpJf9exyfwvxhrGBkTWlZ0q4tt8lU+0n7Rff6FmYfjTxDjw5cr7u3HZNSq+J/oza4viPTXna8TDzVdU9XVzqazzvwgmLjyxo01WxlC7GtcJ994xb22/UxeOcBQ0PPve6W1T99m7F0JhrGt6XrupS1GutUPMjtfBPmhzPpzx91/Pcj3iqr9I0KWFOymxZd0IVzqnGfPXD4nJpdm+m25Nruq4s2lyenbiYdRq+tYc+ittPMwuP7PT/wD4bbHm3au6/oW4U/8AZ2mp8G3NbbO7+39S4C10ud9Hj/g4yPENdr2Hh52j5lOfTXdiuuTnCa3XRHKHC+LGzUcGUXeoZknZKDlvFRUtknt136dNzp3j7N/Z/Beu5KezrxLNn89tjn/w9wJZWs6dQ5LeNdfWPXbrv1+ZW6reYmlInzKzjy5KY7RWeJdOYUPLw6IbbbQS2X0Pc+RW0UvZH028RtGyuAA9AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACO8Qa9l48lg6PiPM1KxdP/bqXvJ+n0Npk1ZOXY6ozdGMvxSi/jn8l7fUyMbFpxK1XTWoR+Xr9fcxneeIFeY3hTXqmfHUuKM+7UshdVj8zVMfy9SwsXCx8GqNWNRXVXHoowjske4MaYqY/ph5sAAkegAAAAD8zhGyLjOKlF9Gmt0yI654Y8Na7XkRu06uqd/Wc6ls212e3bcmAMbVraNrQ8mN/Llfi37MOtY2U8vQdZjqGKpc33PLgq5xXtGSWz/NFSajw1l6VK3D1XEv0/Ni5PkyYODkt+0ZdVJfmf0DNbrXD+mcQ4ssXVMGjKpktuW2CexrNT0nFlie3hDbT1nw4BULMaK50kl1i9vn6rv8ApsbXD1zKpthVzvJoTXNCxqXKv9Mn1T9l7l08cfZttqjdk8J5q8t7tYGZvOCf+mXdI591jE1fha67E17BngWxlvFtbQk/9L7NbHKavpeTTbzNeFS+K1Epq1nBthJyjbiTTfLztzj37uUeqa23226P1MPjG+yzh/Cst6t5G/Ott5/Cvi3Xff3IzRqULtlzcykuia7r/wA/obHXJKXBmmWVveE8+1b83qox/lvuavBWZ7o/D3HO7onwH4y03ROGq8TOnOqWVe+WbXwp9ur9DoKMozipRacX1TXqcI6ZmTxdM02cd0nGa+Lfbum+i/qWvwd4zXcNUunKjPKxOX4anLdxl7Qk/Reu50fS+u0w7aXNxERxKxXPFZ7bLU8cLra/DnVKseqy7IyHXVXVXFylNuS6bLqynvDiWZw/qUdR1femuuSUaI9bZ9Ozjv8AD79f0Nlq3HGs8XqN87vu2G5Py64OSj9OnXf5v9DFoxk1CViUrOu7munbvsum39yr1PrMZc0WwRxX3Zfq+O2q0LvFO3JnNYWFCFa7Tul3X5dv5mu/+Jmqyk5LyeXfbZVdv7kE+8wpslW0+et7dV1Sfo16vufqFteVb0kvh6uKab/7Faeta7Lbi+yP1rT4WNT4kZ8ZpW10yjs322b2+W5vcHj+GQ152HKKf8UX0/RlZ4NLttrhWt7JP4Iw6uTa7df7FsaJwhj4cK7cpeZfsm4N7xi/7nQdOya7NzN+ElLXlIsXJhl0xtr35Jdt1sex8SUUklsl6H06OPHKcAB6AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABouJeD9G4twrMTVcKq+ua23lFNm9BjasWja0bwTG7j3xA+zPn8Ozsz+HLLszTk3J4neUPp7r5fzK54ixb9N4Q4dx8hSjdPJyHZDbbrzbdvTsf0IOQPtcSpwOINCVVUIuVLm1Fbbvm7nPdR6ZjxY7ZcXCGcMb7wrfTabs6/Cw4eZ5cq+efV9F8vaS9NiT3afz2uO8fLcUo1Jbrp6Je319Ty4Grdmi5mXGveyb8qK3W/wpNJb9E213N/nYsd7JUJ7UfBFxeyl05uz6d9+nocpfbDMxPlr9TSYvsy+H8yMZKMuVScfiTbfw/Nf0RsL9YUp1wo2d8t5KLl8Wz6OUum262+mxEY6tGiCy5KNMYtR57o7uUtvww9ZS277dPdo8/vss+Up2eZiYj7w5lvY11W/v19Oyf6le3HNmEW2jaW9lnW3pqqDUXvHz3LlTXfaPql8/0N7wXo2VxDqyw8Dm+D/FnN/DBe72/ojTcM6NqfF2etN0iqShslddttCuO/eW/r13SR05whwjgcHaVDCw48038V18l8VsvVv/AKehuej9LyarJ6uSNqR/dawYptPdPh+tA4S07h+KlRVz5LXxXT6yf09jfAHdUpWle2sbQvRGwADN6AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAfHJLq2gPoMDL1rTsBP7znY9W3+axIj+q+J/C2kUysv1SuSj3VacmYWy0r9UxDybRHlLwVBqH2hdBxXy06fqNstnL4qnDp79TVw+0TCVEsj9hT8jm5Ivzl1ftv2TKt+o6anm6Oc1I915goez7Q+RdCM8Phycoy/9y5I0mT9ojX7bWqdIx6YQb5kt7H079mRz1XTRG/dv/JhbVY493SYOccL7R+px2++6VjJy7Jc0G179TOq+0Tmyu5paLjyxl0koXNTT36b7mP8ArGkjzb+xGqxz7ugAU1ifaH0i2E3k6VmVOC3kk03t77PY2MfH7hZPa6GdU/nUn/R/Mkr1TSW8ZIZxmxz7rUBWs/HXg+vynLKyYxsko8zoklHf1b9ieabrWnavSrcDNx8mv3qsUtvkyzj1GLL/AOO0T/NnW9beJZxyd9sLSnkZ3DmSlunXOt+3SSf9zrE54+1pi83C2kZajvKnIlHf2Tj/ANit1OJnS32ezv7Kk8M6HHRfJi52W25cI/Ftuo77v8ktzZ6xZjcP2yhkX/f8jKnJ42n0pxiottKy2b/BB+y6y6dkR/wo1HbC1T7vCy3VbpVYuJCMtt3Z06P0bfT6bk5408MeIuCOHr+JM/UMey6TjG6rCo3cFt0XM+66JPocZj02XLS2etd9lfLi3pN/Moaqr8qX7SzrY2ZEa0tuRRqrjs/gjHso/Tvvu9yZ8EeG2scf3xyJRjiaJut8hx3jL3UF6v59vrsV3hZUdVqwcyNllll9kZP72+aS29Nl0ez267bpHbXBePHG4ZwIRiopw5tl26v02LXSulV1GXu1HMRyjx6OY+a7J4d4c07hfTa8DTaFVVHrKXeU5espP1ZtgDtq1isdtY2hdiNuIACLcbcVw4a09qEo/e7YSlFP+GMV8UvyPL3rSs2t4h5MxEbylEZxmt4yTS6dGfTknN42y6ZSeHnZcIzUp80bevV936b7mZheLnF+BJQlmTs2S2jfXFto0dviHT0t23if5cq8aqjqoHPWL9oXUcWC++6XVdNtJcjcP6m9wPH+m6Nk8vR50wjFyUo2qXb5e3YtYutaPL9N/wC0s4z0+66AUZqHj/k4dXm1aJTfWmlNxyGnXv25o8u639+xn6R9oDC1FbWaPfXKKUm4WqS2ft06ktOqaW89sX/3I1GOeN1yA1mi6/gcQYzvwblZFPaUX0lF+zRsy/ExMbwmid/AAD0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA877oY9Nl1klGuuLlJv0SPQxNSxXm4k6Fs1NrmT7Nb9UeSID5HF3GmT96hkPRdEl/hVPfzrY+knt1W5tKfD+flyhl61l5UZek+n9yaJbJLtt7H0wjFHmeXmyDZHhjg5OJ91sy7vKW/LKPScN/aW+5Eo+B+ZiZU7MXiKydL6qrJqVi39H17P5ouYGFtNit5h5NKyp3/4TarC6Ft2oRzYQ3k6rUmpPbbs/T5MhebwTk4uR5Wboz82G/K4xlGqS9Gmt1vt7rv67HSwa3WzIbaDDMbRCOcFZcqw0jEvWTHysuq+MdnC2PM4P36d/l7GDDhOTvtqwcvHvydlGEL5eX83sv+51Tl6Jp2f1yMOqb225uXZ/qjSah4e6HqMY+Zip2QfNCcnzOLILdNpMbQitpYly5ncO24l06MyO16e8qprrJ+7Xv7bdPmR3MxVgwlYnGuUZR/dNvm2ba3S6ty6NPfpudI67wBqOJi2uy+nOwMVeZRLZwvpj6x3/AIvk/wBUyls/gXad+VLInlWucpycpQjPb0SW/TZenq+pptboIxxsqZNPNUJlLzkoyjZBuEk1XNKTW7a6NPu0+z+hgKNltzgr3VGx/FzV7qPotnHv6d12NzdhZE5XL7llQpg+WEpUNpvfum10Zh3OG6hKDi4N7LmfV7/xbd9uz7M5z9Lesqk0n3YEb743wfl1zlUmpOmakopdG3Fej+m5naZr1+Ld52NlXUTrSUXRPkmpbdYvbu+3p09zxlRGiuF0oy+9OW9M0+qa7vp19u39iQ8OcKafmYdupZ8bMuNc1GFMpbR32UpKe23NBPrt79dyfFitW20TMSUraJ+WUp4Q8cOIdHzKZ5GY9Qw5JJ4+TJuXL7qe34t+3uSzxz4v0fjvwqjlabkKV1dsLLKd/jq33Wz+e5Xs9J03ULJ+XVViZfVxlW/hTb6Nxfd/Pff2NPquNk0cM63VZL94qF0XVLaS677dN1vtv1exuKa3JTFbDknuiV/Blvv2zO71+zHp/wB/47rbgpxpcbpb9dnDfZ7/AJnXviLhQ1DgfXceceZSxZtL5pbnLf2RJKPGGp1uP/8AXbi/o9mdX8az8rhHW5/5cS1//iza9Jpto7b++7Yx4iHDvh/XjKqhXQlzyylXzuX4YbttfLsd18NxUdC09JJLylsl6H8+eDtTUc+muSjySu52/l7n9A+Ft/8AZvSt+Xf7vD8PbsYdGja95S33iIbcAG/RhzX4z8T59eualhZCgsKHLjqDX465RT337pp7vp09zpQ5n+0T91/aEpwt542VpW8i3dU4/P6Nbmu6rv8Ap52QamdqSp3N1+Cyt4U1WUVtRU5puxtdpN77fRGoysiyrGd8pTdls9+d7tS26qX6dzUahmSxb1anG2m18ligttpL+m66/kYf7bljKyHNVfTbLp1fwyfVL3X9Dh+3utO8NP3Tu2kNX2TipT5JbyaU2kmu3f5mxp4kWPQnKG0+by1Ge7cN1u3t7v2/8WrxeHtb162f7L0jPyU2nGKr5kt9t9n7f2LM4X+zhxnrUXZn1VabjWR35bbOaafyXp/4ixpum5bW+SJTVxXt4h54WJPP0yjDrdOPDOoVtjbad0ufeMYei2Ud377kj0PhhY1HNbdOupfFJx+FfD6L5Hnxz4TahwbonD2C9WqsuohYldKPlxtk5buKl/D09+nTb1NBesrJxMXH1XUnTZVGXNj1xn5l0d+62+FrZ7btv6epucenphnsvHMHZNJ+ZeXhxe3rsaMDIjZCtbXuLUum3aW3RfT3LpOf/A/j3S8GxcNZWFVhZNjbx8mD3jkL03fpL+6fyOgDfaO9L4o7J3bPBMTTiQAFpMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMTUc2WBR5sca/Ie+3JTHdkTzOJ+JLeZYPD7r9pZEn/RIm4I70tbxbZ4qvOy/EPKSdUK6F/lrrW/6s0mpaR4iZlTctRyUv8kF5b/NxLvBTv0+Mn1ZLf1edv5crarpXEMt45uXnWzT+OvzW90vTZ9yPVaDOc0pTae2/+8Q2j37qXp+fsdjW0VXR5bK4Tj7SW5R3jHwrqOBnY+s6ThxuwbFy5NUKnJ1y/wA2yf4Wt/zNRn6DET6lbzP8UN8XuqHK0/VdOvlyTuruX4lC9vdf5lFvb+RgX6vqDqjDLsyORbcvmdJR37bTS39jYY2q5PKuTKbhGTbxsySujFe0ZPaS+nXbsZmRnVT70KN8UpNUWc0ZL2cXs9vojS6jpl6zvSZVJrEohlLJyI+Zh6ldG74n5eUvNrfq9pbbx/5t911bS6kw0OrMx+CsNZNEKciy2yc3XBRj+Lbfp0lvt3XpsYaw8DU71CucaM2zdwnXJLm27tx6KSWz37GbpmvY08b9kTjNVU7+RNR6z6Ntt+nVt7PsmeaWbY77Zf6o5iKxuwL9OrjW78eHNNfh+Lq/fc2F2j1a3oOoZVOQqMyVU8eay58kZvZLaTe20tvV+jMCq5xlOPPGFEHzz2muiS36b9Gvl0NZ+0pa9kKuVMpYu/7urb4VH0/6rfqbSkUiPm8yjpftndleDmVh+F3F9uo5+pY2VQ8aVbjity5t9uqfbbdbb/JF/wCqceZ3EfCmtZ9el1x0OnFnOx2yad0dn8K9t/cq3hDh/QLde0rDyoOVmTaoJbrd99ppem+xeHipjY+leE/ElOLVCqmrBmowitkbbp9bVw2iJ45bTDN782fz04alHJ1SyMG+ti6OTa69k18uiP6caBDy9D02CTW2NWtn/wAKP5i8CU2W6nvZNuyd72jD6pJH9QtOW2n4i222qh0/JDpVdpuu5Y2iIZIBUPiz4s5fDedj8N8N48cniDJXPbbZ/hYdf+aT9ZeyNpky1xV7rzwgmdkn444zw9Jb0uOpUY2ZZDnsfOvMrrfTdL0b93+W5zP4iY/EPEWnY1ukUfecP7xBVyri4btt83SXouj3fXq99yX8F+Cuq8QXZOpa7l3ZE8615Ftk7JQhZJ9lt+KSSfTfZfIv7RuDNN0mNcpVrIugklKaXLHb/LHtEoZcV9ZXaeIRWxzfy5L4K+zNruvv7xq9yx8OyTflwTScX7t9X+nz3L14Q+zhwdwt5dk8T75kRW3mXfE/1ZcKWy2QM8HTMGH23n8lcFK+zDwdKwtMrVeJi1UwXZQikZgBfiIjiEzT8S8L6ZxbpstP1TH82hvmi0+WUJeji11TKX4v8GsjTdPshgSs1DA25l5i3vpmu0ltsml8v5nQAIM+mx5o+aOUd8dbxtLgmNeXpWpuNqdV9Uo7OO6lzb9Jdff+fyO2OC9Ylr3C2mZ9koytuqXO4vo5Lo/5o5M8T8TVcHi7XVOCjBZUrfgjyzUGk9013il1/Jl1/Z94uwc/htaLLImtTx5zslROHIkm99oe6677r3NP07bBqb4faVHS27MlscrmAB0DZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHyUVKLjJJxfRp+p9AFReKPhDjcQws1XScauOowjvOmK5fN27OLXaSOY78KWi5yebjytvpm4w+8S+GiXq2vdL3O+St/EnwmwuNqp5WJKOJq/Lt5iXw2r2kv7lPUabv+anlXy4e7mvlzZgao8+7Nm40XSpxpTqsh1UG3GPV91um/8Aoa7KhFTlNWtWL8Vm/Luk919V/X1N0uB8vgF5OLk4l2Mr5xUIWbfFy788otd18UdvbZ7Ghz2qqpZCipQc1CL/AIZyfZ9fT169ehyWs3jNtaNtmrz7xOzCys2LsjjuHLOXW+UXsuaT3227J+/zZveH4Ytcsed8XXjSsUVU5Pmtl1X5R937EW8mvT4W5uZc6sSt+XdZyuTnNvZRXpKUn6+nr2N7n0Q3wte0vKuu0bOUceqM47W48oJ80JL36Pv3/MgxZL2+aPDzBTe3LH4N1vKp8SK7b7d8mOfBN9PSezivZbfyOq/H3K+6eEPFNvtjJfrJHGMspYviNdbTyxq+8xyIPfZpS2kt/wAmdbfaLy1HwP1ux/8ArU1L9ZRZvuj2n0ckWlusXiHDHhw/N4jxIWNSlblRXWHRJzSX5n9K+IuIcfhHh+WoZMJTjTGMI1xeznJ9FHd9j+avhRkZE+LdK5JzjVflVwny+sfM6b/L/qdmfaT40o0zA0fhur95nZ18ciUE9tq4Ppu+3WXv6bmWny+hp8uWvn/lY1E7eGD4keO+oZONZpnB1XkZ8ZVwvyshL4HP+GG3r8/0JJ4W+F11MHr3E11udq2a43WPI6ylJLo2vTbtsvzK+8FuCsR+dxbrs669Ew5uWPK5bfeLm/it+cfSK9l8yVcX+OVuTKWJoEXRQ99smSTsml7R/hTfZvq/REGPVRFI1Wvt/Cv/ADspzkikd15Xfn6pgaPR5mbl4+LTFd7JqK2INq/jdwjpM5Q+9X5Uo9/u1Llt/wBvmcy6hruVn5rtzcqeXkSb5o2SlZs0+kdvTfs09kaucbZza38qXZ83xTXX3fQ1+p+K777YabfxVL66f3IdG3/aN0SE+WrS82b35UpSjHd/Lv7o8avtIaXOfLLRsmMVvu/Oi9knszm6blGSlGXLOdafNXsm9t23zenXq/y6dT0tlKvHbd/NG3Z/ElJbr377SXZL0T9SjPxJrpniY/ohnW5XWWgeNnDWt2qmyd2Fa+q8+Pwte+69PrsWBiZ2Nn1Rtxciq6uXaVclJfyODMbKrndTTO6uim2SUrYPfnX4lvHfrH6bNexINM4mztGlVkYWXkY0uvxuPLFvut3F83b9S/pvinJXjUU3/MJaa+f3odtgoLhPx3yfNVGqY6zMZJf7zR0s+rg9nt+SLq0TiHTeIsSOTp2VXfW+6T+KPya7o6jR9R0+rjfFbn7e6/jy1yRvWUZ8Q/D7T+LcVZ3lSjq+FFzouqe0pbbtRfv8t/U5f4fzMvhHW8fLw04qm5Sphvs4esqZJ90+vK333+p2yVvx54UaNxBTl59GLKrUXHnkqXsrtuvbtzez9yHqGinLtkxcWhDnwd216+YTrRdVo1zScPUsZt0ZVcbI7rZrddmZxUvgrxdHJ0+XDeXFQzcF2Ome/wDjVc77r0kt9mi2i9p8sZccXj/JWKW7qxIACZkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAfJSUIuUntGK3b9gOcfHjUZZXFNOH1ccWiMeno5dd/6fkVVonDep8Xat9y0qiVt3ZJ7qCX8Vk3/NP8kWNnabn+KvHOYsKudNNs3G65r4cehfDzb+spbPZHQXDHCWk8I4EMPS8WFUVFKU+857erfqc1HT51uotltO1d/wCqh+n9bJN7eHDPGema3wPxDVj6vpUliVxlBYtj3ry6NtpN/wALk313XZpGt4Wonp+q26HHOlfp2t8lmJfLdyeyk6rt/VxntCe3o5bnaPjF4ePxC4Y8jF5I6thTV+JOfTd+sN/Tdevukco6RoS0biPF0vXMDIxrsDOWVhzvg65VXNrmr5ktnCe2626br5lXWaO2jyxNI3rLG+m2tHb4RHjON+J4g8t9car5V1uyEdlFS5Fvt8t10+SOjftHay19nfTrW95ZksSD29en/Y5t8YtRyq/EGU8vHVMotJSTTU4c26mtuyaa6ehZXj3xBLI8A/D3Eh8X3ix77vq/Lh7fmWunzEVy7fZfp5Ur4carTo+r6Ze1s6smqyUV0fwtS2W/v6MtDXtYyfEjjDM1bPsnXXeua+Ve8lRjwfw01r/NLtv9fRFP8BaZLOyMaMEnkzt5I7S26PZPd+2yfX5/It3KWPgUfsnFc3VVYvMk31yLuvRbdvh7fLr6mp1WW0x6VZ4NVmrTH+W31njXJ1KqnT+b7tpOEvJx8Sqfwx22/wDul/q9fTYj9uRZkS8yUkq5SUIJ7pt+79Uml2X69T84WmZuoZUK4VzlZOKjGpQ6yj/pit307fl3LV4Z8CuItW5brqq9Orkt/Oyutn5Vpv07Nv8AIrV6dqdXbeYmf+GnjFkzTurerl8qarSUGuZzmtoy6bbPv19d2j7j492o2qvErsyJLdeZDfbbp05uvXp677nTmg+AXD2m8k8+d2oXR2e83yrdeuyLG07QNM0qpVYmFRVBddowRtdN8M7Tvlss00P/APTkfSvC7ifVYxrwdIdUObzJXZMeXr8o+v1Jnpv2etfvsU87VFXKXWU+SDb+uy6/mdLpbLZdgbnH0XS0/d3WK6THChaPs4eSm1ry52mntiwXfv22fYwr/s0WuSnXrUJOO+0eR1x3226pdzocEtuk6S3mkMv02L7OeI+A2fhwUYRqu5OsHG78D/Ndf/Oxjx4A4r4by452nyyvMrfNFpbPff12/Evr3OjwVv8AQdLW3dj3rP4efpaRzHDQcH6nqeq6NXdq+E8XMi3GS7Ke38SXpub8A3FKzWsRM7rEKW4x4Xs4M4uxeLtOpl9yhap5EavRSfxpr2e+629d0+hc1VkbqoWQe8JxUk/kz85GPXl0W0XQU6rYuMotdGmfjBxvueHTj77qqKgn8l2IcWCMV7TXxbn+bGtIrvsyAAWGQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB45WTXhY12Rc9qqoucn7JdwPYGj0HjDQ+Jsfz9L1LHyIJ7NRltKL9mmbzfc8iYnw8id/AAD16Gr4hwMrU9IycPDvhRdfHk82S35Yvv0+htAeTG8bDT8N8M4HC2nrEwa9uZ81tsus7Zbbc0mbgAREVjaANTxHw9hcTaRl6dm0wsrvg4pyXWEvSSfdNPqbYCYiY2kfzd+0Hp2bp+raPPOUoZ0MV493Mus5Vyceb81FNP5mH4i8TvUuBOAtO2kvu2LkWSe/Kt5z2i9/T8LRaP226asbXtHuioqdmO3L59duvyKZ4e17AydK0iWZhU5+pYsnXj0+XzONae7bT6dW+je+23Y5jLP6e96R4MdN+5l8GZVfB+mRz8j4c6VSlRRs1ZCE+8+263T2S79d2i9PCXwp4m43lTqupy/ZmiuTajy7WWL2S/h36dV8up7+B3hXTxTxNlaxxLtK+ja6WAuqTf4XY+/M16d9vbc66qqhRXCuqEYVwW0YxWyS9kifQdOrl/bZPHsr1w872abh7hHSOGMeNWn4ddcktpWtbzn83LuzeAHQRWKxtCeI28AAPXoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAfiy2upb2TjBe8nsYGu69gcN6bdqGo5EKMetd5PrJ+iXu2cieJPiNn8Z6qsmani4NCcKqOZpcj9Ze7b2e69tinq9bTTV3nmfsiy5q445dH8U+MXC3Ctjx7c373m7b+RirnfyTfZP5blF8WeOfEHE6sxMSWPpmnWtwnVGPmWTh7ufTb8kVE7Pv866XkQU4t7TkuVLd+r/M/M8CWdB00VJNR+KUnt5j99l2Rzebq2ozztTiGvyau1uI4b2nOniY+bZjWShY2lZLn5Xsnt0a9ujftuZukcd8RaLk70arm19fh5bXKDXz36P2277sj+izyY5zg6uayyEouHK+aLX1ey/Pv0Nzgacs+u6vG2jOMfgb2UXYt04yg+z23XzM8eeb8RbaUMWt7Sn+P488YabfXK62jLp9YzpSTXp1XVf8AUt7gnxs0niR14upx/Zmoy6KFj+CT9k/R/J+6OVYafkZNDhjStlFfDCNy+OmUerTl7/yMnCzacSNdmZKqxVx5Z04s1ZKxrs9uy3T2bfbv0J8evz4b7XneE2PU5Kzzy7xTUkmnun6nydkK1vOUYr3b2OO9A8ceIeH8aWNiRhOmK2jHKtdqr67LZvbdfmYWs+MXEPEOmzo1DOjOlLmarrUd9916dfbp7Gw/1jBtx5XP1Ndt3XP+12g/ePu/7ZwPP325PPjvv+puK7IWxU4SjKL7OL3R/Nl6q8mc43ONOTXu+at8tbSXt1fNv6M3Wj+ImvcOS5tM4gysTkW6r8xuM3v25OqXzfsUafENe7a9OPwijW135h/Q4HF/Cn2kOK9JzY3atetUxLN04XKME9tt3FxXR9dkn0Z1rwnxTp/GehYusaZY5Y166xl+KEl0cX80zb6TX4dVH7Oefss481cn0uTPtn015WvaJTPdc2O47rst36/IqLg7SaeFOHc7iCyMZ5sVHGw+ddFdPtJr2SjJ/ki2vtgWqXGek1ue3LixkouO+/xFb6k7Fw9wtp8241333Zctn+Jx2jH9OpzvUL//AKLx+WUWmLTEOrPszaXPD4P1DLt5pW5eXJysk93NpdZN+u7fcu0gfg3py03w60av1sg7X136ybZPDp9JTsw1r+GYACwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB2IDx54p6bwdS6qI/f9TkulFT3Vf+qbXZfzMMmSuOvdedoeTMRzKfNpLd9iteNvGnQeEpTx6W9QzYdJRpa5K3/ql/Zb/kUZxD4t8T8TeZj232V4stlKjFj5cXv/AAuXd/mRR04mPDmys6uu9c0VVKPOn6dYx3cfq+hotR1qJia4Y/nKpk1PtRuOI+Itf8QNTlm5LlbTByUK4vaEI+vLH3XR9euz3I3bjN/usi98sn8acekn6bex6afxLi4zjDCouym3y1wjtVHdv82+u/8AIypXZuTaq4YFdmRN7KMo2XWRT/zSWy3+WxqYy+pbutzKrNZvzKP5PDttfmW0tTjP4ZKHVrb/AP62PmNp+pzi5qmVUY7SU7doKX/M+ify33LF0vgDjHPTdGNlUqW2zrjGuPy25f7tM3+L4D8V6hZGWVZVTU/xK2acpfN7N/oWI0eTJzWkwRppn2V9plvNbK226nHuUXHnr+PlS7JrbaT9nuavJ1x058rMRL7wpPeUI89lvRbfCvhWzXT89y/IfZ2tthVC7WIV1R/FXXXupf0X6mxr+z/9zproweILKKI7uUPu0G5P699izHTM0x42SxprbOasu/Ozr3Zk05t7n3jKuS5/XstkaeUc+zHnPIxo4/NPaEb5qvaP8zpfK+z7rNfmSwNfwueSa5rsaXO/lzKW230RCNa+zlxjmKStt066CS+Kpy5vmlu99n+pjfpeSI35l5bT3j2Uo78VU2b6lgeTUubacp8s5Pv/AA7vt0Xy6nnRlQnGimedRkOybdiScVb16KO6XVdOnQmGpeAvEOBkf73gZMaF03hHmXKvT/uQ/WdLjpHPG/FvjlY+0KqZRcILdfic33fyRTnSXpzaqH0rR5hgajp2TfqHmYk67MWUJbKNsZTUt10cV1fqum/R9djQu3Js1CdLqshbQ9rE+jivb25T1x8PF2yrbcmuOTyKuNNEk7K038Tl/l/r16m6d2LqMK67q4vyVyRsjLadS26bN+nTs9yOcNJQ2x7sKr4N43S+OSltHfu9nt1Xbb9EdC/Z/wDEuvg/7/pmdXZLBzHGyn41tG7bZpt/5ku/bdFHYijpkXO6mq/HXX7zs25e28X2f6I32JxDkaVjq7Hpoouko10tQUp8+ykkk+mz7d+iZhprfpMkZYlLin0p7kh+09q+PxB4haZdRKUYSwa2lN7dG312IxrMJX5XDeIoz/c6fvLbtvOxy3+pkeMXEEOLeMsDV64R5MvApnzR6Q5nHaSX0luvXsZuBiPUuOMDDshbtXjYtCaXbom3+pJnv62otaJ33lt8cd07w7q4VxPuPDWk4+2zrxq018+VG3POmHl01w/yxS/keh2tY2iIZAAPQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAArvj/AMWdP4NvWnY9X3/WZpNY8ZbRgm9k5P8Asupk+LnH68OuD8jU64RszrZxx8WEk2nZLonsur29kUT4feF2tca5t2qajfZXK6ankZlu0pVy/ijX6Sk9+sv4ei6tFHVZ8kTGLDG9p/sjvaY4r5azxA8bteuhOnJylCr+OrCsdMIrf8Ll1k36PsvYgug8Va7nTdGl6fTKy17R2xnbZJv4t299+y6r57o7Q0jwx4U0WpQo0bFss7yuvgrJzfu2yRU6VgY9qupw8eu1LZThWk1+aRSv0rJmnuy5Efo2t9UuP9G8LuN+JLZTu07LqxW/ijOcaIzf6dfq0T7RPs76nauXUMjAwKE+1Kd9rXtzPaP8jo4E+LpOnx+eWVcFIVnpPgbwxpqh5kb8jl/hcuSL+qjsTfB4Z0fTVFYunY1fL0T5E2vzZtQX6YcdPprEJIrEeIEtuwAJWQAAAAAdzWahw9pWqQlHM0/HuUu/NBbv8zZg8mInyKQ4w+zPwtrrtv03Hpwcm1NS/drZ+vdbNHOXiB9nfiXhGyWRjNZmHDdrzVvzL/j7L8zvw/FtNd9cq7YRnXJbOMlumUc3T8WTmI2lFfDW0P5VYWu6lw9qFtGpYU65cu9lNm7jNJ9l8vn9Gb7FhVHVZynZNYuVD7zj2cqfwyf4X9OzOvvF77PGDxVp+Vk6FVCrLkm54r6Qs+j7p/mcp5ekZvCWnX4WbW5ZmnZXP++h+9rpceXb5NSUe2/TZ9jntfpcmONrx/Nr8umvX34Ymt1yWVpNkEob1TqgpP8AAoy/D/8AkWXwJj25njFGmj4qYZdVdknLfdQUf5FZ35VGp3aRfC9T5LpV21SSWzm04tP1T2fotnt7l0+E+LOfjNV5kUlflWXLb1Ua1s/7kWkx92WsfmGw0c/JLssAHapQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD82WRqrlZOSjCCcpSfZJep+iO8eZ/7M4N1zK235MWa/Vbf3MbW7YmRQmmVZPjh4l5l2XfN6RpFilVCL+HGju+Xb/8A0ltvu+yOlcHBx9NxKcTFqjVj0x5YQiuiRW3gFoFGjcAUZFdXJfqV08m2b7ze/LFv8ootEr6TH2075825ljWPcABaZAAAAAAAAAAAAAAAAAAAFIfaE8PatV0K3iXT8eD1TT4t3JLbzqvVP3a+Zd5r9dwHqui5+Ens8iida+rWxFmxVy0mloeTG8bP5daK44HFFmDUnKjLcLcRv15XvKtem/fZHUPg9bHM8VsK2E42VWQtnBrslGO3T9digtZ4MsxNdycHMaoyMLIl5VkHyyajLfd79E1/MvnwIwaszxN0vVIzkoY+BfVXVybKU5tOyxfJ7bcr7e/U0ekrHrRG3hjgiKxMOuAAdCzAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAANBxvptmr8I6zhVLey7GnGKXq9t9v5G/BjavdE1n3EJ8JM+OdwDpKjDkljRljTXtKDcX/NE2NBwvoM+H1qWPzReNblSuo27xjLq0/o9zfmOGs1xxWfYAASAAAAAAAAAAAAAAAAAAAAAA4S+0tp8tC8SMnkTdeYoZEI99t+/80TH7Nmer+KdNhKbdkMW1bNrs33X6Hn9tPTfJyNC1KKUXOudTn9Huv7kP+zfqsMTjHTJuces5Vvrt6ehz+SPS1sT7bot9rbO8AAdAlAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAc4/bI0lZvh5i5SSc8fI5U2u3Mvf07dzlLwj1t6Zq+NLn53VZGzftvt06r079Pod0faH0b9teFGt1LdTqjG1Sj3js+r/Q/nRwxcsHWYxc2uaTjJ/PfoaHqUduWLorfU/rBpuVHN0/FyYS5o21xmn77oyiu/BHW3rnh9p05TcrMdyok33TXp/MsQ3eK/fSLfdKAAzAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABpOMNMWs8K6zgNb/eMWyH58rP5Y5dc69Rya7IqF+PY0+Xq5NdUv0T6n9aJJSTTW6fRn8vfF/SpcOeJ2s1qqryK8mblGUmk05brfbrts/Q1fUsfdWNkWXjaXXH2SeIp6xw5q+Kq+WjGthZv68047/2OiypPs5cE18G+G2DN02VZWq/77ZCxbSgpL4Iv6R2/Utsu6ak0xVrKadt+AAE7wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADmTXPs/wBXiN456hrerNrhrT512Tp7PLu2T5P+FdHJ+vRHTZ8UVHfZJb9Xt6mF6Rfbf2eTET5fIQjXCMIJRjFbJL0R+gDN6AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/9k="}];
let defaultImgs=null;
const defaultsReady=Promise.all(DEFAULT_IMAGES.map(d=>canvasFromSrc(d.src).then(c=>({name:d.name, canvas:c, src:d.src, demo:true})).catch(()=>null)))
  .then(arr=>{ defaultImgs=arr.filter(Boolean); return defaultImgs; });
function demoImages(){
  if (defaultImgs && defaultImgs.length) return defaultImgs.map(d=>({name:d.name, canvas:d.canvas, src:d.src, tone:toneFromS(), inLoop:true, demo:true}));
  const sphere=shadeCanvas((u,v)=>{ const r=0.88, d2=u*u+v*v; if (d2>r*r) return null; return [u/r,v/r,Math.sqrt(1-d2/(r*r))]; });
  const ring=shadeCanvas((u,v)=>{ const d=Math.hypot(u,v), R=0.58, a=0.3, q=(d-R)/a; if (Math.abs(q)>=1) return null; const nz=Math.sqrt(1-q*q); return [q*u/(d||1), q*v/(d||1), nz]; });
  return [{name:'Sphère (démo)', canvas:sphere, demo:true},{name:'Anneau (démo)', canvas:ring, demo:true}];
}
// carte de luminance de l'image (calculée une fois), floutée à la demande
function lumMap(im){
  if (!im.lum){
    const c=im.canvas, sc=Math.min(1,700/Math.max(c.width,c.height)), w=Math.max(2,Math.round(c.width*sc)), h=Math.max(2,Math.round(c.height*sc));
    const t=document.createElement('canvas'); t.width=w; t.height=h;
    const x=t.getContext('2d',{willReadFrequently:true}); x.imageSmoothingQuality='high'; x.fillStyle='#fff'; x.fillRect(0,0,w,h); x.drawImage(c,0,0,w,h);
    const d=x.getImageData(0,0,w,h).data, L=new Float32Array(w*h);
    for (let i=0;i<w*h;i++) L[i]=(0.2126*d[i*4]+0.7152*d[i*4+1]+0.0722*d[i*4+2])/255;
    im.lum={L,w,h,ar:c.width/c.height}; im.blurR=-1;
  }
  return im.lum;
}
function boxBlur(L,w,h,r){
  if (r<1) return L;
  const a=new Float32Array(w*h), b=new Float32Array(w*h), n=2*r+1;
  for (let y=0;y<h;y++){ let acc=0; for (let x=-r;x<=r;x++) acc+=L[y*w+Math.min(w-1,Math.max(0,x))];
    for (let x=0;x<w;x++){ a[y*w+x]=acc/n; acc+=L[y*w+Math.min(w-1,x+r+1)]-L[y*w+Math.max(0,x-r)]; } }
  for (let x=0;x<w;x++){ let acc=0; for (let y=-r;y<=r;y++) acc+=a[Math.min(h-1,Math.max(0,y))*w+x];
    for (let y=0;y<h;y++){ b[y*w+x]=acc/n; acc+=a[Math.min(h-1,y+r+1)*w+x]-a[Math.max(0,y-r)*w+x]; } }
  return b;
}
function sampleLum(M,L,nx,ny){
  const fx=Math.min(M.w-1.001,Math.max(0,nx*M.w-0.5)), fy=Math.min(M.h-1.001,Math.max(0,ny*M.h-0.5));
  const x0=fx|0, y0=fy|0, tx=fx-x0, ty=fy-y0, i=y0*M.w+x0;
  return (L[i]*(1-tx)+L[i+1]*tx)*(1-ty)+(L[i+M.w]*(1-tx)+L[i+M.w+1]*tx)*ty;
}
function buildImageSets(){
  imgDirty=false;
  if (!imgList.length) imgList=demoImages();
  const cols=Math.round(S.imgCols), BOX=40, raw=[];
  const mn=S.imgMin/100, mx=S.imgMax/100;
  const ang=S.imgAngle*Math.PI/180, ca=Math.cos(ang), sa=Math.sin(ang);
  let maxN=1;
  for (const im of imgList){
    // réglages de lumière propres à chaque image : contraste, luminosité, gamma, niveaux
    const TN=Object.assign(toneFromS(), im.tone||{});
    const c=Math.min(0.99,Math.max(-0.99,TN.imgContr/100)), fC=Math.tan((c+1)*Math.PI/4), bB=TN.imgBright/200, gI=1/TN.imgGamma;
    const tone=v=>{ v=(v-0.5)*fC+0.5+bB; v=v<0?0:v>1?1:v; return Math.pow(v,gI); };
    const low=TN.imgLow/100, high=Math.max(low+0.001,TN.imgHigh/100), inv=!!TN.imgInvert;
    const M=lumMap(im), ar=M.ar;
    const W=ar>=1?BOX:BOX*ar, H=ar>=1?BOX/ar:BOX, cell=W/cols;
    const r=Math.round(TN.imgBlur*(M.w/cols)*0.8);
    if (im.blurR!==r){ im.blurL=boxBlur(M.L,M.w,M.h,r); im.blurR=r; }
    const L=im.blurL, tapx=cell*0.3/W, tapy=cell*0.3/H, R=Math.hypot(W,H)/2, n=Math.ceil(R/cell)+1, pts=[];
    for (let j=-n;j<=n;j++) for (let i=-n;i<=n;i++){
      const gx=i*cell, gy=j*cell, x=ca*gx-sa*gy, y=sa*gx+ca*gy;
      if (x<-W/2||x>W/2||y<-H/2||y>H/2) continue;
      const nx=x/W+0.5, ny=0.5-y/H;
      let v=(sampleLum(M,L,nx,ny)+sampleLum(M,L,nx+tapx,ny)+sampleLum(M,L,nx-tapx,ny)+sampleLum(M,L,nx,ny+tapy)+sampleLum(M,L,nx,ny-tapy))*0.2;
      v=tone(v);
      const dk=inv?v:1-v;
      if (dk<low || dk<=0.0005) continue;
      const t=Math.min(1,(dk-low)/(high-low)), sz=mn+(mx-mn)*Math.sqrt(t);
      if (sz<0.004) continue;
      pts.push([x,y,sz,dk]);
    }
    raw.push({pts,W,H,cell}); maxN=Math.max(maxN,pts.length);
  }
  const N=Math.min(maxN, MAXD-16);
  imgSets=raw.map((st,ii)=>{
    const Rg=mulberry32(9173+ii*101), P=st.pts;
    for (let i=P.length-1;i>0;i--){ const j=Math.floor(Rg()*(i+1)); const t=P[i]; P[i]=P[j]; P[j]=t; }
    const px=new Float32Array(N), py=new Float32Array(N), ps=new Float32Array(N), pd=new Float32Array(N);
    for (let k=0;k<N;k++){
      if (k<P.length){ px[k]=P[k][0]; py[k]=P[k][1]; ps[k]=P[k][2]; pd[k]=P[k][3]; }
      else { px[k]=(Rg()-0.5)*st.W; py[k]=(Rg()-0.5)*st.H; ps[k]=0; pd[k]=0; }   // pastille invisible
    }
    return {px,py,ps,pd,W:st.W,H:st.H,cell:st.cell};
  });
  imgN=N; worldR=Math.max(20,BOX*0.7);
}
// bruit de valeur 3D rapide (animation organique)
function hn3(i,j,k){ let h=Math.imul(i|0,374761393)^Math.imul(j|0,668265263)^Math.imul(k|0,1442695041); h=Math.imul(h^(h>>>13),1274126177); return ((h^(h>>>16))>>>0)/4294967296; }
function vnoise3(x,y,z){
  const xi=Math.floor(x), yi=Math.floor(y), zi=Math.floor(z), xf=x-xi, yf=y-yi, zf=z-zi;
  const u=xf*xf*(3-2*xf), v=yf*yf*(3-2*yf), w=zf*zf*(3-2*zf);
  const a=hn3(xi,yi,zi)+(hn3(xi+1,yi,zi)-hn3(xi,yi,zi))*u, b=hn3(xi,yi+1,zi)+(hn3(xi+1,yi+1,zi)-hn3(xi,yi+1,zi))*u;
  const c=hn3(xi,yi,zi+1)+(hn3(xi+1,yi,zi+1)-hn3(xi,yi,zi+1))*u, d=hn3(xi,yi+1,zi+1)+(hn3(xi+1,yi+1,zi+1)-hn3(xi,yi+1,zi+1))*u;
  return (a+(b-a)*v)+((c+(d-c)*v)-(a+(b-a)*v))*w;
}
function vnoise1(x){ const i=Math.floor(x), f=x-i, u=f*f*(3-2*f); const a=hn3(i,7,3), b=hn3(i+1,7,3); return a+(b-a)*u; }
function loopList(){ const L=[]; imgList.forEach((im,k)=>{ if (im.inLoop!==false) L.push(k); }); return L; }
function imgLoopDur(){ const L=loopList(); return (S.imgLoop && L.length>1) ? L.length*(S.imgHold+S.imgTrans) : S.videoDur; }
function showImage(k){
  if (k<0 || k>=imgList.length) return;
  if (S.imgLoop){ selImg=k; return; }
  if (imgTr){ curImg=imgTr.to; imgTr=null; }
  if (k!==curImg && imgSets.length>Math.max(k,curImg)) imgTr={from:curImg, to:k, p:0}; else curImg=k;
  selImg=k;
}
let imgClock=0;
const IMG_DREF=74;   // distance de la caméra de face : le relief est compensé pour cette vue
function imageStep(sim){
  if (imgDirty || !imgSets.length) buildImageSets();
  imgTime+=sim; imgClock+=sim;
  const n=imgSets.length, H=S.imgHold, Tt=Math.max(0.2,S.imgTrans), cyc=H+Tt;
  if (curImg>=n) curImg=0; if (selImg>=n) selImg=0;
  let a=curImg, b=curImg, p=0;
  const L=loopList();
  if (S.imgLoop && L.length>1){
    // boucle sur les images cochées, à l'infini
    const m=L.length, tt=imgTime%(m*cyc), ai=Math.floor(tt/cyc)%m, loc=tt-ai*cyc;
    a=L[ai]; b=L[(ai+1)%m]; p=loc<H?0:Math.min(1,(loc-H)/Tt); curImg=a; imgTr=null;
  } else if (imgTr){
    imgTr.p+=sim/Tt; a=imgTr.from; b=imgTr.to; p=Math.min(1,imgTr.p);
    if (imgTr.p>=1){ curImg=imgTr.to; imgTr=null; }
  }
  if (a>=n) a=0; if (b>=n) b=0;
  const A=imgSets[a], B=imgSets[b], N=imgN, P=pool, PL=pool.length, mode=S.colorMode;
  const rel=S.imgRelief*6, sm=S.imgSmooth, scat=S.imgScatter*16*(1-0.4*sm), dsz=S.dotSize*1.5, contrast=S.contrast;
  const span=0.08+0.5*(1-sm);
  const amp=S.noiseAmp*0.35, dis=S.noiseDis/100, sv=S.noiseSize/100, T=imgClock*S.noiseSpeed, zt=T*0.4;
  let cnt=0;
  for (let k=0;k<N && cnt<MAXD;k++){
    const ax=A.px[k], ay=A.py[k];
    let x=ax, y=ay, s=A.ps[k], dk=A.pd[k], cell=A.cell, e=0;
    let z=dk*rel;
    if (p>0){
      // la déconstruction balaie la forme de gauche à droite ; « Douceur » réduit le décalage et adoucit les départs
      const d=0.55*hash3(k,1,77)+0.45*Math.min(1,Math.max(0,ax/A.W+0.5));
      let q=(p-d*span)/(1-span); q=q<0?0:q>1?1:q;
      const e1=q*q*q*(q*(q*6-15)+10); e=e1+(0.5-0.5*Math.cos(Math.PI*e1)-e1)*sm;
      const bx=B.px[k], by=B.py[k], bz=B.pd[k]*rel;
      const h1=hash3(k,2,5), h2=hash3(k,3,9), h3=hash3(k,4,13);
      const th=h1*TAU, cph=2*h2-1, sph=Math.sqrt(1-cph*cph), rr=scat*(0.35+0.65*h3);
      const dx=sph*Math.cos(th)*rr, dy=sph*Math.sin(th)*rr, dz=cph*rr;
      const u=1-e, c0=u*u*u, c1=3*u*u*e, c2=3*u*e*e, c3=e*e*e;
      x=c0*ax+c1*(ax+dx)+c2*(bx-dy)+c3*bx;
      y=c0*ay+c1*(ay+dy)+c2*(by+dx)+c3*by;
      z=c0*z+c1*(z+dz)+c2*(bz-dz)+c3*bz;
      s=s+(B.ps[k]-s)*e; dk=dk+(B.pd[k]-dk)*e; cell=A.cell+(B.cell-A.cell)*e;
      s*=1-0.4*(1-0.6*sm)*Math.sin(Math.PI*e);
    }
    if (s<0.004) continue;
    // animation organique (bruit), comme dans la trame d'origine
    let sMul=1;
    if (amp>0){ const f=1/(cell*5), q1=hash3(k,8,1), q2=hash3(k,9,2);
      x+=amp*cell*(vnoise3(x*f+q1*dis*9, y*f, zt)*2-1)*1.5;
      y+=amp*cell*(vnoise3(x*f+57.1, y*f+q2*dis*9, zt+13.7)*2-1)*1.5; }
    if (sv>0) sMul=1+sv*(vnoise1(T*1.6+hash3(k,10,3)*97.3)*2-1);
    // relief des tons compensé : de face, l'image reste exactement la même
    const comp=(IMG_DREF-z)/IMG_DREF;
    const o=cnt*3, hj=hash3(k,6,1);
    sPos[o]=x*comp; sPos[o+1]=y*comp; sPos[o+2]=z;
    sSize[cnt]=cell*dsz*s*sMul*comp*((1-contrast)+contrast*(0.5+hj));
    sSeed[cnt]=hj;
    const ci = mode===2 ? Math.floor(hash3(k,7,3)*PL) : Math.min(PL-1, Math.floor((1-Math.min(1,dk))*PL));
    const cc=P[ci]; sCol[o]=cc[0]; sCol[o+1]=cc[1]; sCol[o+2]=cc[2];
    cnt++;
  }
  return cnt;
}
async function loadImageFile(f){
  let src=null;
  try { src=await createImageBitmap(f); }
  catch(e){ src=await new Promise((res,rej)=>{ const im=new Image(); const u=URL.createObjectURL(f); im.onload=()=>{ URL.revokeObjectURL(u); res(im); }; im.onerror=()=>{ URL.revokeObjectURL(u); rej(new Error('illisible')); }; im.src=u; }); }
  const w=src.width||src.naturalWidth, h=src.height||src.naturalHeight, s=Math.min(1,1400/Math.max(w,h));
  const c=document.createElement('canvas'); c.width=Math.max(1,Math.round(w*s)); c.height=Math.max(1,Math.round(h*s));
  const x=c.getContext('2d'); x.fillStyle='#fff'; x.fillRect(0,0,c.width,c.height); x.drawImage(src,0,0,c.width,c.height);
  return c;
}
async function addImages(files){
  const arr=[...files].filter(f=>f.type.startsWith('image/'));
  if (!arr.length){ toast('Choisis des fichiers image (JPG, PNG, WebP, SVG…).'); return; }
  let added=0, saved=0, last=-1;
  for (const f of arr){
    try {
      const im={name:f.name.replace(/\.[^.]+$/,''), canvas:await loadImageFile(f), tone:Object.assign(toneFromS(),{imgBright:0,imgContr:10,imgGamma:1,imgLow:8,imgHigh:94,imgBlur:1,imgInvert:false}), inLoop:true, t:Date.now()};
      imgList.push(im); last=imgList.length-1; added++;
      try{ await saveImage(im); saved++; }catch(e){}
    } catch(e){ toast('Image illisible : '+f.name); }
  }
  if (!added) return;
  imgDirty=true; buildImageSets(); showImage(last);
  if (typeof onLibraryChanged==='function') onLibraryChanged();
  toast(saved===added ? (added>1?added+' images ajoutées et enregistrées.':'Image ajoutée et enregistrée.') : 'Image ajoutée (non enregistrée : stockage indisponible).');
}
// ============================================================================
//  Survol : la forme se déconstruit sous le curseur (zone) ou en entier, puis se
//  reconstruit quand la souris s'éloigne. Fonctionne pour les Motifs et l'Illustration.
// ============================================================================
const hover={x:-1e4,y:-1e4,sx:-1e4,sy:-1e4,inside:false,amt:0,over:false};
const _hm=new THREE.Matrix4(), _hr=new THREE.Vector3(), _hu=new THREE.Vector3();
function applyHover(n, dt){
  const whole=S.hoverMode===1;
  const active=hover.inside && !dragMode && !lineDraw.armed;
  const target=(active && hover.over) ? 1 : 0;
  const tau=target>hover.amt ? Math.max(0.05,S.hoverIn) : Math.max(0.05,S.hoverOut);
  hover.amt+=(target-hover.amt)*Math.min(1, dt*2.5/tau);
  if (hover.sx<-9e3){ hover.sx=hover.x; hover.sy=hover.y; }
  hover.sx+=(hover.x-hover.sx)*Math.min(1,dt*9); hover.sy+=(hover.y-hover.sy)*Math.min(1,dt*9);
  camera.updateMatrixWorld();
  _hm.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
  const e=_hm.elements, W=VW, H=VH;
  _hr.setFromMatrixColumn(camera.matrixWorld,0); _hu.setFromMatrixColumn(camera.matrixWorld,1);
  const R=S.hoverRadius, R2=R*R, amt=hover.amt, force=S.hoverForce*Math.max(6, worldR*0.4);
  const mx=hover.sx, my=hover.sy;
  let minX=1e9,minY=1e9,maxX=-1e9,maxY=-1e9, near=0;
  for (let i=0;i<n;i++){
    const o=i*3, x=sPos[o], y=sPos[o+1], z=sPos[o+2];
    const cw=e[3]*x+e[7]*y+e[11]*z+e[15]; if (cw<=0.0001) continue;
    const px=((e[0]*x+e[4]*y+e[8]*z+e[12])/cw+1)*0.5*W, py=(1-(e[1]*x+e[5]*y+e[9]*z+e[13])/cw)*0.5*H;
    if (px<minX) minX=px; if (px>maxX) maxX=px; if (py<minY) minY=py; if (py>maxY) maxY=py;
    const dx=px-mx, dy=py-my, d2=dx*dx+dy*dy;
    if (d2<R2) near++;
    if (amt<0.002) continue;
    let f;
    if (whole) f=amt;
    else { if (d2>=R2) continue; const q=1-d2/R2; f=q*q*amt; }
    // direction propre à chaque pastille, stable d'une image à l'autre
    const sd=Math.abs(sSeed[i])+i*0.000137, a1=(sd*91.73)%1, a2=(sd*47.31)%1, a3=(sd*13.17)%1;
    const th=a1*TAU, cz=2*a2-1, sz=Math.sqrt(1-cz*cz);
    const d=Math.sqrt(d2)+0.001, ux=dx/d, uy=dy/d;
    const mag=force*f*(0.45+0.55*a3);
    const pxw=_hr.x*ux-_hu.x*uy, pyw=_hr.y*ux-_hu.y*uy, pzw=_hr.z*ux-_hu.z*uy;
    sPos[o]  =x+(pxw*0.75+sz*Math.cos(th)*0.6)*mag;
    sPos[o+1]=y+(pyw*0.75+sz*Math.sin(th)*0.6)*mag;
    sPos[o+2]=z+(pzw*0.75+cz*0.6)*mag;
    sSize[i]*=1-0.3*f;
  }
  // la forme réagit quand le curseur est dessus (zone) ou dans son cadre (forme entière)
  const pad=24;
  hover.over = whole ? (hover.x>minX-pad && hover.x<maxX+pad && hover.y>minY-pad && hover.y<maxY+pad) : near>0;
}
canvas.addEventListener('pointermove',e=>{ if (e.pointerType==='mouse' || e.buttons===0){ hover.x=e.clientX-VX; hover.y=e.clientY-VY; hover.inside=true; } });
canvas.addEventListener('pointerleave',()=>{ hover.inside=false; });
window.addEventListener('blur',()=>{ hover.inside=false; });
function regenerate(){
  if (S.app==='libre'){ if (typeof DL!=='undefined' && DL.live){ DL.live.eng=null; DL.live.dirty=true; } return; }
  if (S.app==='image'){ imgTime=0; imgDirty=true; return; }
  if (isLine()){ links=[]; nodes=[]; buildLine(); lobes=[]; return; } if (S.variant!==1){ links=[]; nodes=[]; buildLoop(); lobes=[]; } else { loop=null; syn=[]; buildNodes(); } }
function sstep(x){ x=x<0?0:x>1?1:x; return x*x*(3-2*x); }
const camDir=new THREE.Vector3();
let last=performance.now();

function frame(now){
  requestAnimationFrame(frame);
  const dt=Math.min(0.05,(now-last)/1000); last=now;
  if (S.app==='libre'){ try{ libreTick(dt, now); }catch(e){ console.error(e); } return; }
  stepRender(dt, now, false);
}
// LM : rendu d'un calque du Design libre (pas d'inertie, d'enregistrement, de survol ni d'étiquettes)
function stepRender(dt, now, LM){
  if (!dragMode && !LM){
    orbit.theta+=orbit.vt; orbit.phi+=orbit.vp; orbit.vt*=0.92; orbit.vp*=0.92;
    if (S.autoRotate){
      orbit.theta+=dt*0.06*S.rotSpeed;
      orbit.phi+=dt*S.sway*0.5*0.25*Math.cos(now*0.00025);
    }
  }
  updateCamera();
  {
    const wpp=camera.position.distanceTo(orbit.target)/pillMat.uniforms.uScale.value;
    LSTEP=Math.max(0.006, S.linePx*renderer.getPixelRatio()*wpp*0.5);
    pillMat.uniforms.uLinePx.value=S.linePx; pillMat.uniforms.uPR.value=LM?PXK:renderer.getPixelRatio();
    pillMat.uniforms.uRefZ.value=camera.position.distanceTo(orbit.target); pillMat.uniforms.uRelief.value=S.relief; pillMat.uniforms.uMaxPx.value=S.maxPx; pillMat.uniforms.uThin.value=S.depthThin;
    if (Math.abs(camera.fov-S.fov)>0.01){ const k=Math.tan(THREE.MathUtils.degToRad(camera.fov)/2)/Math.tan(THREE.MathUtils.degToRad(S.fov)/2); orbit.radius*=k; camera.fov=S.fov; if (LM){ camera.updateProjectionMatrix(); pillMat.uniforms.uScale.value=VH*renderer.getPixelRatio()/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov)/2)); } else resize(); }
  }
  if (LM){ if (S.autoRotate && dt>0){ orbit.theta+=dt*0.06*S.rotSpeed; } updateCamera(); }
  const sim = LM ? dt : (S.paused?0:dt);

  let n=0;
  if (recState && !LM){
    recState.t+=sim;
    if (recState.build){
      // construction de A à Z : on enregistre jusqu'à ce que la forme soit complète, puis quelques secondes
      if (drawP>=1) recState.tail+=sim;
      if (Math.floor(recState.t)!==Math.floor(recState.t-sim)) toast('Enregistrement de la construction… '+Math.round(recState.t)+' s');
      if ((recState.tail>=4 || recState.t>=120) && recState.done){ const d=recState.done; recState.done=null; d(); }
    } else {
      if (Math.floor(recState.t)!==Math.floor(recState.t-sim)) toast('Enregistrement… '+Math.min(Math.round(recState.t),Math.round(recState.dur))+' / '+Math.round(recState.dur)+' s');
      if (recState.t>=recState.dur && recState.done){ const d=recState.done; recState.done=null; d(); }
    }
  }
  if (S.app==='image'){ n=imageStep(sim); }
  else if (S.variant===0){ n=airyStep(sim); }
  else if (S.variant===2){ n=quantumStep(sim); }
  else {
  if (sim>0){
    spawnAcc += sim*S.births*(links.length<S.maxLinks*0.3?2.2:1);
    while (spawnAcc>=1){ spawnAcc-=1; if (links.length<S.maxLinks) spawnLink(); }
  }
  for (let i=links.length-1;i>=0;i--){
    const L=links[i], g=sim*S.grow*7/L.len;
    L.flow += sim*S.flow*2.6*L.speed/L.len;
    if (L.state===0){ L.progress+=g; if (L.progress>=1){ L.progress=1; L.state=1; L.B.pulse=1; } }
    else if (L.state===1){ L.age+=sim; if ((S.life<60 && L.age>L.life) || links.length>S.maxLinks) L.state=2; }
    else { L.die+=g*0.8; if (L.die>=1){ links.splice(i,1); linkKeys.delete(L.key); L.A.deg--; L.B.deg--; } }
  }

  /* -- génération des pastilles -- */
  const P=pool, PL=pool.length, mode=S.colorMode;
  const dsz=S.dotSize*0.5, contrast=S.contrast, bundle=S.bundle;
  const lw=0, lstep=LSTEP;
  n=0;
  for (let li=0; li<links.length && n<MAXD; li++){
    const L=links[li];
    const v0=L.state===2?L.die:0, v1=L.state===0?L.progress:1;
    const pos=L.pos, nr=L.nrm, bn=L.bin, id=L.id, cConn=Math.floor(L.cr*PL);
    const cl=lineCol;
    // filament principal
    if (S.lines){
      const cnt=Math.ceil(L.len/lstep);
      for (let j=Math.floor(v0*cnt); j<=v1*cnt && n<MAXD; j++){
        const s_=Math.min(1,j/cnt)*(SAMPLES-1); let i0=s_|0; if (i0>=SAMPLES-1) i0=SAMPLES-2; const f=s_-i0, a3=i0*3, b3=a3+3, o=n*3;
        sPos[o]=pos[a3]+(pos[b3]-pos[a3])*f; sPos[o+1]=pos[a3+1]+(pos[b3+1]-pos[a3+1])*f; sPos[o+2]=pos[a3+2]+(pos[b3+2]-pos[a3+2])*f;
        sSize[n]=lw; sSeed[n]=-1; sCol[o]=cl[0]; sCol[o+1]=cl[1]; sCol[o+2]=cl[2]; n++;
      }
    }
    for (let bi=0; bi<L.bundles.length && n<MAXD; bi++){
      const B=L.bundles[bi], span=B.tb-B.ta;
      const nStr=Math.max(1,Math.round(S.strands*B.mul));
      const count=Math.max(3,Math.round(L.len*span*S.density*L.densMul));
      for (let k=0;k<nStr && n<MAXD;k++){
        const kSeed=(id*8+bi)*37+k;
        const hk=hash3(kSeed,1,7), hk2=hash3(kSeed,2,13), hk3=hash3(kSeed,3,3);
        let R, ang0, twist;
        if (B.tube){
          const rk = nStr===1?0:(k===0?0.12:0.3+0.7*hk2);
          R=L.radius*bundle*rk; ang0=hk*TAU; twist=(hash3(kSeed,4,17)-0.5)*5;
        } else {
          // brins répartis sur un arc : l'éventail reste lisible sous tous les angles
          const u01 = nStr===1?0.5:(k/(nStr-1)) + (hk2-0.5)*0.3/nStr;
          ang0=B.ang+(u01-0.5)*B.arc; R=B.rad*bundle*(0.75+0.5*hk3); twist=B.twist;
        }
        const fl=L.flow*(0.82+0.36*hk3)/span+hk;
        const cStr=Math.floor(hash3(kSeed,5,21)*PL);
        const ePow = B.tube?0.6:0.85;
        // décalage du brin à la position locale tl
        const place=(tl,o)=>{
          const t=B.ta+tl*span;
          const s_=t*(SAMPLES-1); let i0=s_|0; if (i0>=SAMPLES-1) i0=SAMPLES-2; const f=s_-i0, a3=i0*3, b3=a3+3;
          const e=Math.pow(Math.sin(Math.PI*tl),ePow), an=ang0+twist*tl, c=Math.cos(an), sn=Math.sin(an);
          let ca, sa;
          ca=c*R*e; sa=sn*R*e;
          for (let q=0;q<3;q++){
            const nn=nr[a3+q]+(nr[b3+q]-nr[a3+q])*f, bb=bn[a3+q]+(bn[b3+q]-bn[a3+q])*f;
            sPos[o+q]=pos[a3+q]+(pos[b3+q]-pos[a3+q])*f+nn*ca+bb*sa;
          }
          return e;
        };
        // filament de chaque brin (variante aérée)
        if (S.lines && !B.tube && nStr>1){
          const cnt=Math.ceil(L.len*span/lstep);
          for (let j=0;j<=cnt && n<MAXD;j++){
            const tl=j/cnt, t=B.ta+tl*span;
            if (t<v0||t>v1) continue;
            const o=n*3; place(tl,o);
            sSize[n]=lw; sSeed[n]=-1; sCol[o]=cl[0]; sCol[o+1]=cl[1]; sCol[o+2]=cl[2]; n++;
          }
        }
        // pastilles qui circulent
        for (let j=0;j<count;j++){
          let tl=j/count+fl; tl-=Math.floor(tl);
          const t=B.ta+tl*span;
          if (t<v0||t>v1) continue;
          const o=n*3, e=place(tl,o);
          const hj=hash3(kSeed,j,5);
          const tone=0.5+0.5*Math.sin(t*L.toneF+L.tonePh+k*0.9);
          let sz=dsz*L.thick*((1-contrast)+contrast*(0.5*tone+0.5*hj))*(B.tube?(0.35+0.65*e):(0.12+0.88*e));
          if (L.state===0) sz*=sstep((v1-t)/0.05); else if (L.state===2) sz*=sstep((t-v0)/0.05);
          sSize[n]=sz; sSeed[n]=hash3(kSeed,j,11);
          const col=P[mode===0?cConn:mode===1?cStr:Math.floor(hash3(kSeed,j,9)*PL)];
          sCol[o]=col[0]; sCol[o+1]=col[1]; sCol[o+2]=col[2];
          if (++n>=MAXD) break;
        }
      }
    }
  }
  // neurones : amas de pastilles
  if (S.nodes){
    for (const N of nodes){
      N.pulse*=Math.pow(0.12,dt);
      const act = N.deg>0 ? 1 : 0.45;
      const rad = S.nodeSize*N.size*(0.55+0.1*Math.min(N.deg,8))*act*(1+N.pulse*0.35);
      const col = P[Math.floor(N.r1*PL)];
      const kk = N.deg>0 ? NODE_K : 10;
      for (let k=0;k<kk && n<MAXD;k++){
        const o=n*3;
        sPos[o]=N.p.x+N.off[k*3]*rad; sPos[o+1]=N.p.y+N.off[k*3+1]*rad; sPos[o+2]=N.p.z+N.off[k*3+2]*rad;
        sSize[n]=dsz*1.25*Math.max(0.15,N.wt[k])*(0.7+0.3*act)*S.nodeSize;
        sSeed[n]=hash3(N.id,k,3);
        sCol[o]=col[0]; sCol[o+1]=col[1]; sCol[o+2]=col[2];
        n++;
      }
    }
  }

  }
  if (S.hoverOn && !LM) applyHover(n, dt);
  // tri arrière → avant (tri par paquets, en O(n))
  camera.getWorldDirection(camDir);
  const cx=camera.position.x, cy=camera.position.y, cz=camera.position.z;
  const dist=camera.position.distanceTo(orbit.target);
  const zNear=Math.max(0.1,dist-worldR*2.2), zFar=dist+worldR*2.2, zr=(NB-1)/(zFar-zNear);
  counts.fill(0);
  for (let i=0;i<n;i++){
    const z=(sPos[i*3]-cx)*camDir.x+(sPos[i*3+1]-cy)*camDir.y+(sPos[i*3+2]-cz)*camDir.z;
    let k=((zFar-z)*zr)|0; k=k<0?0:k>=NB?NB-1:k;
    keys[i]=k; counts[k]++;
  }
  let acc=0; for (let b=0;b<NB;b++){ const c=counts[b]; counts[b]=acc; acc+=c; }
  for (let i=0;i<n;i++){
    const d=counts[keys[i]]++, o=i*3, p=d*3;
    dPos[p]=sPos[o]; dPos[p+1]=sPos[o+1]; dPos[p+2]=sPos[o+2];
    dCol[p]=sCol[o]; dCol[p+1]=sCol[o+1]; dCol[p+2]=sCol[o+2];
    dSize[d]=sSize[i]; dSeed[d]=sSeed[i];
  }
  dGeo.setDrawRange(0,n); lastN=n;
  for (const name of ['position','aSize','aSeed','aColor']){ const at=dGeo.attributes[name]; at.updateRange.offset=0; at.updateRange.count=n*at.itemSize; at.needsUpdate=true; }

  const lv=0;
  const fNear=Math.max(0.1,dist-worldR*0.9), fFar=dist+worldR*1.6; lastFog={near:fNear,far:fFar};
  [pillMat,lMat].forEach(m=>{ m.uniforms.uFogNear.value=fNear; m.uniforms.uFogFar.value=fFar; m.uniforms.uFog.value=S.fog; });
  quadMat.uniforms.uSnap.value = S.fog<0.005 ? 1 : 0;
  pillMat.uniforms.uAspect.value=S.aspect; pillMat.uniforms.uFusion.value=S.fusion;

  // 1. champ des pastilles
  renderer.setRenderTarget(rt);
  renderer.setClearColor(0x000000,0); renderer.clear();
  renderer.render(pillScene,camera);
  // 2. fond + filaments + seuil
  renderer.setRenderTarget(null);
  if (LM) renderer.setClearColor(0x000000,0); else renderer.setClearColor(new THREE.Color(bgCol[0],bgCol[1],bgCol[2]),1);
  renderer.clear();
  if (lv) renderer.render(lineScene,camera);
  renderer.render(quadScene,quadCam);
  if (!LM) updateLabels();
}

// ============================================================================
//  Moteur multi-calques : chaque motif du Design libre garde son propre état
//  (réglages, géométrie, caméra). On l'échange avec l'état principal le temps
//  de calculer et dessiner son image, puis on remet tout en place.
// ============================================================================
function engCapture(){ return {nodes,links,linkKeys,linkId,spawnAcc,worldR,loop,syn,synId,synAcc,drawP,loopShape,qTime,pinches,lobes,lobePhase,lobeN,linePh,lineLobes,linePhase,lineVals,lineValsKey,imgSets,imgN,imgTime,imgDirty,curImg,selImg,imgTr,imgClock}; }
function engRestore(o){ ({nodes,links,linkKeys,linkId,spawnAcc,worldR,loop,syn,synId,synAcc,drawP,loopShape,qTime,pinches,lobes,lobePhase,lobeN,linePh,lineLobes,linePhase,lineVals,lineValsKey,imgSets,imgN,imgTime,imgDirty,curImg,selImg,imgTr,imgClock}=o); }
function engFresh(img){ return {nodes:[],links:[],linkKeys:new Set(),linkId:1,spawnAcc:0,worldR:14,loop:null,syn:[],synId:1,synAcc:0,drawP:0,loopShape:0,qTime:0,pinches:[],lobes:[],lobePhase:Math.random(),lobeN:0,linePh:null,lineLobes:[],linePhase:0,lineVals:[],lineValsKey:'',imgSets:[],imgN:0,imgTime:0,imgDirty:true,curImg:img|0,selImg:img|0,imgTr:null,imgClock:0}; }
function orbitGet(){ return {theta:orbit.theta, phi:orbit.phi, radius:orbit.radius, tx:orbit.target.x, ty:orbit.target.y, tz:orbit.target.z}; }
function orbitSet(o){ if (!o) return; orbit.theta=o.theta; orbit.phi=o.phi; orbit.radius=o.radius; orbit.target.set(o.tx||0,o.ty||0,o.tz||0); orbit.vt=orbit.vp=0; }
function settingsGet(){ const o={}; for (const k in S){ const v=S[k]; o[k]= v instanceof Set ? [...v] : v; } return o; }
function settingsSet(o){ for (const k in o){ if (k==='_view' || !(k in S)) continue; S[k]= k==='dots' ? new Set(o[k]) : o[k]; } }
function paletteFast(){
  pool = PALETTE.map(p=>p.id).filter(id=>S.dots.has(id)).map(id=>PAL[id]); if (!pool.length) pool=[PAL.brun];
  lineCol = PAL[S.lineColor]||PAL.brun;
  const snap = pool.concat([lineCol]);
  snap.forEach((c,i)=>quadMat.uniforms.uPool.value[i].set(c[0],c[1],c[2])); quadMat.uniforms.uPoolN.value = snap.length;
  bgCol = PAL[S.bg]||PAL.taupe; [pillMat,lMat].forEach(m=>m.uniforms.uBg.value.setRGB(...bgCol));
}
function setRenderSize(pw,ph,zf,pan){
  const pr=renderer.getPixelRatio(); zf=Math.max(1,zf||1);
  renderer.setSize(pw/pr, ph/pr, false); rt.setSize(pw, ph);
  const W=pw*zf, H=ph*zf;   // image virtuelle agrandie, dont on ne garde que la partie cadrée
  VW=W/pr; VH=H/pr;
  camera.aspect=pw/ph;
  if (zf>1.0001){ const cx=pan?pan[0]:0, cy=pan?pan[1]:0; const ox=Math.min(W-pw,Math.max(0,W/2+cx*W-pw/2)), oy=Math.min(H-ph,Math.max(0,H/2+cy*H-ph/2)); camera.setViewOffset(W,H,ox,oy,pw,ph); }
  else camera.clearViewOffset();
  camera.updateProjectionMatrix();
  pillMat.uniforms.uScale.value = H/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov)/2));
}
// L : {app, settings, cam, eng, imgIndex} ; live : les réglages du calque sont ceux de S (calque sélectionné)
function withLayer(L, live, fn){
  const mE=engCapture(), mS=live?null:settingsGet(), mO=orbitGet(), mFov=camera.fov, mApp=S.app, mVW=VW, mVH=VH, mQ=QMUL;
  try{
    if (!live) settingsSet(L.settings);
    S.app=L.app; S.paused=false;
    camera.fov=S.fov;
    if (L.eng) engRestore(L.eng);
    else { engRestore(engFresh(L.imgIndex)); if (L.app==='image'){ imgDirty=true; curImg=selImg=Math.min(L.imgIndex|0, Math.max(0,imgList.length-1)); } regenerate(); resetView(); if (!L.cam) L.cam=orbitGet(); }
    if (L.app==='image'){ const k=Math.min(L.imgIndex|0, Math.max(0,imgList.length-1)); if (curImg!==k && !imgTr){ curImg=selImg=k; } }
    orbitSet(L.cam); paletteFast();
    fn();
    L.eng=engCapture(); L.cam=orbitGet();
  } finally {
    S.app=mApp; if (!live) settingsSet(mS);
    engRestore(mE); orbitSet(mO); camera.fov=mFov; VW=mVW; VH=mVH; QMUL=mQ; paletteFast();
  }
}
function renderLayerTo(L, live, pw, ph, dt, ctx){
  const zf=Math.max(1,L.zoom||1), oldK=PXK; PXK=pw*zf/Math.max(1,L.w);
  try{ withLayer(L, live, ()=>{
    setRenderSize(pw, ph, zf, L.pan);
    stepRender(dt, performance.now(), true);
    ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
    ctx.drawImage(renderer.domElement, 0, 0, ctx.canvas.width, ctx.canvas.height);
  }); } finally { PXK=oldK; }
}
// ===== FIN DU BLOC MOTEUR =====
  return { get S() { return S; }, get canvas() { return canvas; }, get renderer() { return renderer; }, get regenerate() { return regenerate; }, get refreshColors() { return refreshColors; }, get resetView() { return resetView; }, get resize() { return resize; }, get frame() { return frame; }, get MEMBRANE_BASE() { return MEMBRANE_BASE; }, get mulberry32() { return mulberry32; }, get loadLibrary() { return loadLibrary; }, get isLine() { return isLine; }, get buildLine() { return buildLine; }, get PALETTE() { return PALETTE; }, get IMG_KEYS() { return IMG_KEYS; }, get IMAGE_DEFAULTS() { return IMAGE_DEFAULTS; }, get motifStash() { return motifStash; }, get imageStash() { return imageStash; }, get worldR() { return worldR; }, get imgList() { return imgList; }, get demoImages() { return demoImages; }, get addImages() { return addImages; }, get showImage() { return showImage; }, get saveImageMeta() { return saveImageMeta; }, get Store() { return Store; }, get TONE_KEYS() { return TONE_KEYS; }, get toneFromS() { return toneFromS; }, get curImg() { return curImg; }, get selImg() { return selImg; }, get orbit() { return orbit; }, get storeReady() { return storeReady; }, set rng(value) { rng = value; }, set lineLobes(value) { lineLobes = value; }, set motifStash(value) { motifStash = value; }, set imageStash(value) { imageStash = value; }, set worldR(value) { worldR = value; }, set imgTime(value) { imgTime = value; }, set imgDirty(value) { imgDirty = value; }, set imgList(value) { imgList = value; }, set curImg(value) { curImg = value; }, set selImg(value) { selImg = value; }, set imgTr(value) { imgTr = value; } };
}
