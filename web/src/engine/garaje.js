// MOTOR 3D DEL GARAJE (Three.js). No toca la interfaz: avisa los cambios con subscribe()/emit()
// y React los dibuja. Todo el estado vive en `st` (build) y `ui` (cámara, luces, motor, mensajes).
import { THREE } from './three.js';
import { CONFIG } from '../config.js';

export function createGaraje(stage) {
const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const ui = { spinning: !reduce, view: 'tq', night: false, quality: 'alta', engOn: false, gas: false, rpm: 0, toast: null, webglError: false };
const listeners = new Set();
let ver = 0;
function emit(){ ver++; listeners.forEach(f=> f()); }

let renderer = null;
try { renderer = new THREE.WebGLRenderer({antialias:true, powerPreference:'high-performance', preserveDrawingBuffer:true}); }
catch(e){ ui.webglError = true; }

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0c0f);
scene.fog = new THREE.Fog(0x0b0c0f, 9, 16);
const camera = new THREE.PerspectiveCamera(34, 1, .05, 60);
const lights = {};
let controls = null;
if (renderer){
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  stage.prepend(renderer.domElement);
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = .07;
  controls.minDistance = 1.3; controls.maxDistance = 7.6;
  controls.maxPolarAngle = Math.PI*.48; controls.minPolarAngle = .3;
  controls.enablePan = false;
}

/* =============== MATERIALES =============== */
// Reflejos de estudio en un cubemap dibujado (funciona en cualquier navegador, sin PMREM)
const ENV = (()=>{
  const face = (kind)=>{ const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
    if (kind==='top'){ g.fillStyle = '#121214'; g.fillRect(0,0,256,256); g.fillStyle = '#f3efe9'; g.fillRect(48,88,160,80); return c; }
    if (kind==='floor'){ g.fillStyle = '#1b1b1d'; g.fillRect(0,0,256,256); return c; }
    const gr = g.createLinearGradient(0,0,0,256); gr.addColorStop(0,'#3a3b3f'); gr.addColorStop(.48,'#121315'); gr.addColorStop(.52,'#0c0c0e'); gr.addColorStop(1,'#26262a');
    g.fillStyle = gr; g.fillRect(0,0,256,256);
    if (kind==='key'){ g.fillStyle = '#f6f2ec'; g.fillRect(96,30,64,150); }
    if (kind==='warm'){ g.fillStyle = '#d99a62'; g.fillRect(100,40,56,140); }
    if (kind==='soft'){ g.fillStyle = '#8f9093'; g.fillRect(30,60,196,40); }
    return c; };
  const t = new THREE.CubeTexture([face('key'),face('warm'),face('top'),face('floor'),face('soft'),face('wall')]);
  t.encoding = THREE.sRGBEncoding; t.needsUpdate = true; return t;
})();
const phong = (color, refl, spec, shin, extra)=>{ const m = new THREE.MeshPhongMaterial(Object.assign({color, specular:spec||0xffffff, shininess:shin||120, envMap:ENV, reflectivity:refl, combine:THREE.MixOperation}, extra||{})); m.userData.refl = refl; return m; };

const DS = THREE.DoubleSide;
const std = (color, metalness, roughness, extra)=> new THREE.MeshStandardMaterial(Object.assign({color, metalness, roughness}, extra||{}));
const M = {
  paint:  std(0x6e4224,.62,.3,{side:DS}),
  accent: std(0x6e4224,.62,.3,{side:DS}),
  rim:    std(0x0f0f10,.4,.42,{side:DS}),
  gloss:  phong(0x0b0b0c,.1,0x555555,90,{side:DS}),
  plastic:std(0x141415,.05,.55,{side:DS}),
  grey:   std(0x2a2b2e,.15,.5,{side:DS}),
  frame:  std(0x131315,.35,.42),
  engine: std(0x151517,.35,.5),
  fin:    std(0x1d1d1f,.5,.45),
  cover:  std(0x1c1d20,.6,.35),
  chrome: phong(0x1a1a1a,.92,0xffffff,220,{side:DS}),
  alu:    phong(0x8e9196,.5,0xdddddd,80,{side:DS}),
  steel:  phong(0x57534f,.35,0x999999,60),
  rubber: std(0x121212,0,.86,{side:DS}),
  seat:   std(0x080808,0,.95),
  leather:std(0x4a2c19,.05,.52),
  piping: std(0xc58a50,.8,.3),
  gold:   phong(0xc4921f,.28,0xffd27a,90),
  spring: std(0xc41e1e,.35,.38),
  exBlack:phong(0x141415,.12,0x666666,50,{side:DS}),
  ti:     phong(0x7d6b62,.45,0xd8b9a8,120,{side:DS}),
  carbon: std(0x101012,.3,.35,{side:DS}),
  lcd:    std(0x050a0d,0,.15,{emissive:0x7fb6c9, emissiveIntensity:.35}),
  lens:   std(0xffffff,0,.05,{emissive:0xfff1dd, emissiveIntensity:1.4}),
  halo:   std(0xffffff,0,.2,{emissive:0xe4f4ff, emissiveIntensity:2.4}),
  tail:   std(0x2a0000,0,.25,{emissive:0xff2a12, emissiveIntensity:1.3}),
  amber:  std(0x2a1800,0,.3,{emissive:0xff9a1a, emissiveIntensity:.6}),
  amberLens: std(0xdfe3e6,.1,.08,{transparent:true, opacity:.55}),
  pink:   std(0xd98ea2,.85,.3),
  stitch: std(0xa8a39a,0,.7),
  redRing:std(0xc3281c,.3,.35),
  green:  std(0x2fd36a,.6,.3),
};
function canvasTex(w,h,draw){ const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'),w,h); const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t; }
M.plate = std(0xffffff,.1,.5,{map:canvasTex(340,200,(g)=>{
  g.fillStyle = '#e6be1e'; g.fillRect(0,0,340,200); g.strokeStyle = '#111'; g.lineWidth = 10; g.strokeRect(8,8,324,184);
  g.fillStyle = '#111'; g.textAlign = 'center'; g.font = '800 78px Archivo, Arial Narrow, sans-serif'; g.fillText('SMD', 170, 92); g.fillText('07G', 170, 170);
})});
// Banda de rodadura
function treadTex(){ return canvasTex(2048,128,(g,w,h)=>{
  g.fillStyle = '#1b1b1b'; g.fillRect(0,0,w,h);
  g.strokeStyle = '#060606'; g.lineCap = 'round';
  for (let x=0;x<w;x+=34){
    g.lineWidth = 5; g.beginPath(); g.moveTo(x,2); g.lineTo(x+22,16); g.stroke();
    g.beginPath(); g.moveTo(x+17,h-2); g.lineTo(x+39,h-16); g.stroke();
    g.lineWidth = 3; g.beginPath(); g.moveTo(x+8,20); g.lineTo(x+16,28); g.stroke();
    g.beginPath(); g.moveTo(x+25,h-20); g.lineTo(x+33,h-28); g.stroke();
  }
}); }
M.tread = std(0xffffff,0,.85,{map:treadTex(), side:DS});
// Tapas de rin con llamas (como las de la foto)
function flameTex(color, alt){ return canvasTex(512,512,(g)=>{
  g.fillStyle = '#0b0b0c'; g.beginPath(); g.arc(256,256,256,0,Math.PI*2); g.fill();
  const P = (r,a)=>[256+Math.cos(a)*r*250, 256-Math.sin(a)*r*250];
  [0, Math.PI].forEach((a0,k)=>{
    g.fillStyle = k && alt ? alt : color;
    const up = [], lo = [];
    for (let i=0;i<=24;i++){ const t = i/24, r = .97-.6*t, c = a0+.75*t, w = .3*Math.pow(1-t,.75)+.01, z = (i%2?1:-1)*.07*(1-t);
      up.push(P(r, c+w+z)); lo.push(P(r+(i%3===0?.05:0)*(1-t), c-w*.55)); }
    g.beginPath(); up.forEach((p,i)=> i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1])); lo.reverse().forEach(p=>g.lineTo(p[0],p[1])); g.closePath(); g.fill();
  });
}); }
M.coverF = std(0xffffff,.25,.3,{map:flameTex('#e8304f')});
M.coverR = std(0xffffff,.25,.3,{map:flameTex('#e9e6ea','#f2b6c8')});
M.honey = std(0xffffff,.1,.6,{map:canvasTex(256,256,(g)=>{ g.fillStyle = '#161617'; g.fillRect(0,0,256,256); g.strokeStyle = '#2e2e30'; g.lineWidth = 2;
  for (let y=0;y<14;y++) for (let x=0;x<14;x++){ const cx = x*20+(y%2)*10, cy = y*17.3; g.beginPath(); for (let k=0;k<6;k++){ const a = k/6*Math.PI*2+Math.PI/6; g.lineTo(cx+Math.cos(a)*9, cy+Math.sin(a)*9); } g.closePath(); g.stroke(); } })});
M.honey.map.wrapS = M.honey.map.wrapT = THREE.RepeatWrapping; M.honey.map.repeat.set(12,12);
// Camuflado digital del sillín (como el tuyo)
M.camo = std(0xffffff,0,.68,{map:canvasTex(512,512,(g)=>{
  g.fillStyle = '#121213'; g.fillRect(0,0,512,512);
  const cols = ['#202022','#2b2b2e','#38383c','#18181a']; let seed = 7; const rnd = ()=> (seed = (seed*9301+49297)%233280)/233280;
  for (let i=0;i<260;i++){ g.fillStyle = cols[i%4]; const x = rnd()*512, y = rnd()*512, n = 3+Math.floor(rnd()*5);
    for (let k=0;k<n;k++) g.fillRect(x+(rnd()-.5)*36, y+(rnd()-.5)*24, 8+rnd()*22, 6+rnd()*14); }
})});
M.camo.map.wrapS = M.camo.map.wrapT = THREE.RepeatWrapping; M.camo.map.repeat.set(9,9);
M.visor = std(0xffffff,.15,.45,{map:canvasTex(256,256,(g)=>{ g.fillStyle = '#131314'; g.fillRect(0,0,256,256); g.strokeStyle = '#3c3d40'; g.lineWidth = 5; g.lineCap = 'round';
  for (let i=0;i<22;i++){ const y0 = i*12; g.beginPath(); g.moveTo(-10,y0); for (let x=0;x<=270;x+=18) g.lineTo(x, y0 + Math.sin(x*.07+i)*6 + (x%36?4:-4)); g.stroke(); } })});
M.visor.map.wrapS = M.visor.map.wrapT = THREE.RepeatWrapping; M.visor.map.repeat.set(9,9);
M.lensStock = phong(0xc9cdd0,.45,0xffffff,160,{transparent:true, opacity:.78, emissive:0xfff1dd, emissiveIntensity:.05});
M.gripRail = std(0x070707,.15,.32);
M.yoke = std(0x17181a,.55,.38);
M.carbonTape = std(0xffffff,.2,.45,{map:canvasTex(128,128,(g)=>{ for (let y=0;y<16;y++) for (let x=0;x<16;x++){ g.fillStyle = (x+y)%2 ? '#2b2b2d' : '#18181a'; g.fillRect(x*8,y*8,8,8);} })});
M.carbonTape.map.wrapS = M.carbonTape.map.wrapT = THREE.RepeatWrapping; M.carbonTape.map.repeat.set(10,10);

/* =============== HELPERS =============== */
const V = (x,y,z)=> new THREE.Vector3(x,y,z||0);
const UP = V(0,1,0);
function finish(m){ m.castShadow = true; m.receiveShadow = true; return m; }
function mesh(geo, mat, x,y,z, rx,ry,rz){ const m = new THREE.Mesh(geo, mat); m.position.set(x||0,y||0,z||0); m.rotation.set(rx||0,ry||0,rz||0); return finish(m); }
function axis(obj, a, b){ obj.position.copy(a); obj.quaternion.setFromUnitVectors(UP, new THREE.Vector3().subVectors(b,a).normalize()); return obj; }
function rod(a,b,r,mat,seg){ const len = a.distanceTo(b); const g = new THREE.CylinderGeometry(r,r,len,seg||16); g.translate(0,len/2,0); return finish(axis(new THREE.Mesh(g,mat),a,b)); }
function curve(pts,r,mat,seg){ return finish(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),seg||60,r,12,false),mat)); }
function shape(pts, smooth){
  const s = new THREE.Shape(); s.moveTo(pts[0][0],pts[0][1]);
  if (smooth) s.splineThru(pts.slice(1).concat([pts[0]]).map(p=>new THREE.Vector2(p[0],p[1])));
  else pts.slice(1).forEach(p=>s.lineTo(p[0],p[1]));
  s.closePath(); return s;
}
// Panel extruido en el plano lateral (x,y). Pivote en su centro para inclinarlo. UV = coordenadas del perfil.
function panel(pts, depth, bevel, mat, z, ry, rx, smooth, segs){
  const g = new THREE.ExtrudeGeometry(shape(pts, smooth),{depth, bevelEnabled:bevel>0, bevelThickness:bevel, bevelSize:bevel*.85, bevelSegments:segs||5, curveSegments:48});
  g.computeBoundingBox(); const c = new THREE.Vector3(); g.boundingBox.getCenter(c);
  g.translate(-c.x,-c.y,-c.z);
  const m = new THREE.Mesh(g, mat); m.position.set(c.x,c.y,z||0); m.rotation.set(rx||0, ry||0, 0, 'YXZ');
  return finish(m);
}
const at = (o,x,y,z)=>{ o.position.set(x,y,z||0); return o; };
// Pieza vista de frente: perfil en (z,y), extruida hacia adelante (+x)
function facePanel(pts, depth, bevel, mat){ const m = panel(pts.map(([u,v])=>[-u,v]), depth, bevel, mat, 0, Math.PI/2, 0, false, 3); m.position.set(0, m.position.y, -m.position.x); m.position.x = 0; return m; }
function lathe(pts, mat, segs, phiS, phiL){ return finish(new THREE.Mesh(new THREE.LatheGeometry(pts.map(p=>new THREE.Vector2(p[0],p[1])), segs||56, phiS||0, phiL||Math.PI*2), mat)); }
function latheZ(pts, mat, segs, phiS, phiL){ const m = lathe(pts,mat,segs,phiS,phiL); m.geometry.rotateX(Math.PI/2); return m; }
function slab(w,d,h,r,mat){
  const s = new THREE.Shape(), x=-w/2, y=-d/2;
  s.moveTo(x+r,y); s.lineTo(x+w-r,y); s.quadraticCurveTo(x+w,y,x+w,y+r); s.lineTo(x+w,y+d-r); s.quadraticCurveTo(x+w,y+d,x+w-r,y+d);
  s.lineTo(x+r,y+d); s.quadraticCurveTo(x,y+d,x,y+d-r); s.lineTo(x,y+r); s.quadraticCurveTo(x,y,x+r,y);
  const g = new THREE.ExtrudeGeometry(s,{depth:h,bevelEnabled:true,bevelThickness:Math.min(h*.4,.01),bevelSize:Math.min(r,h)*.5,bevelSegments:4,curveSegments:10});
  g.rotateX(-Math.PI/2); g.translate(0,-h/2,0);
  return finish(new THREE.Mesh(g,mat));
}
function circleShape(r){ const s = new THREE.Shape(); s.absarc(0,0,r,0,Math.PI*2,false); return s; }
function holePath(x,y,r){ const p = new THREE.Path(); p.absarc(x,y,r,0,Math.PI*2,true); return p; }
function extrudeC(sh, depth, bevel, mat){ const g = new THREE.ExtrudeGeometry(sh,{depth, bevelEnabled:bevel>0, bevelThickness:bevel, bevelSize:bevel*.85, bevelSegments:3, curveSegments:48}); g.translate(0,0,-depth/2); return finish(new THREE.Mesh(g,mat)); }
// Calcomanía: textura dibujada en coordenadas del perfil
function decalTex(pts, draw){
  let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9; pts.forEach(p=>{ x0=Math.min(x0,p[0]); x1=Math.max(x1,p[0]); y0=Math.min(y0,p[1]); y1=Math.max(y1,p[1]); });
  const W = 1024, H = Math.round(1024*(y1-y0)/(x1-x0));
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  const P = (x,y)=>[(x-x0)/(x1-x0)*W, (y1-y)/(y1-y0)*H];
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4;
  t.repeat.set(1/(x1-x0), 1/(y1-y0)); t.offset.set(-x0/(x1-x0), -y0/(y1-y0));
  t.redraw = (opts)=>{ g.clearRect(0,0,W,H); draw(g,P,W,H,opts); t.needsUpdate = true; };
  return t;
}
function poly(g,P,pts){ g.beginPath(); pts.forEach((p,i)=>{ const q = P(p[0],p[1]); i?g.lineTo(q[0],q[1]):g.moveTo(q[0],q[1]); }); g.closePath(); g.fill(); }
function band2(g,P,a,b,w1,w2){ // franja que se afina de a hacia b
  const dx=b[0]-a[0], dy=b[1]-a[1], L=Math.hypot(dx,dy), nx=-dy/L, ny=dx/L;
  poly(g,P,[[a[0]+nx*w1,a[1]+ny*w1],[b[0]+nx*w2,b[1]+ny*w2],[b[0]-nx*w2,b[1]-ny*w2],[a[0]-nx*w1,a[1]-ny*w1]]);
}
const glowTex = canvasTex(128,128,(g)=>{ const r = g.createRadialGradient(64,64,0,64,64,64); r.addColorStop(0,'rgba(255,255,255,1)'); r.addColorStop(.2,'rgba(255,255,255,.5)'); r.addColorStop(1,'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0,0,128,128); });
const glows = [];
function glow(color, size, x,y,z){
  const s = new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex, color, blending:THREE.AdditiveBlending, depthWrite:false, transparent:true, opacity:.3}));
  s.scale.set(size,size,1); s.position.set(x,y,z||0); s.userData.base = size; s.userData.day = color===0xff9a1a ? 0 : .22; glows.push(s); return s;
}
function indicator(a, b, r){ // direccional: cuerpo negro + lente ámbar
  const g = new THREE.Group();
  const L = a.distanceTo(b);
  const body = lathe([[0,0],[r*.55,0],[r*.8,L*.3],[r,L*.75],[r*.95,L],[0,L]], M.amberLens, 18); axis(body,a,b); g.add(body);
  const tip = lathe([[0,0],[r*.96,0],[r*.9,L*.18],[0,L*.22]], M.amber, 18); axis(tip, b.clone().lerp(a,.02), b.clone().add(b.clone().sub(a).normalize().multiplyScalar(.01))); g.add(tip);
  const gl = glow(0xff9a1a, .07, b.x, b.y, b.z); g.add(gl);
  return g;
}

/* =============== MOTO =============== */
const bike = new THREE.Group(); bike.name = 'gixxer'; scene.add(bike);
const base = new THREE.Group(); base.name = 'moto_comun'; bike.add(base);
// Piezas: cada sección de la moto se agrupa con nombre propio (se ve así en Blender). base.add() mete lo nuevo en la pieza activa.
const PIEZAS = {}; let curPart = base; const _add = THREE.Object3D.prototype.add;
function pieza(name){ if (!name){ curPart = base; return base; } if (!PIEZAS[name]){ const g = new THREE.Group(); g.name = name; _add.call(base, g); PIEZAS[name] = g; } curPart = PIEZAS[name]; return curPart; }
base.add = function(){ for (let i=0;i<arguments.length;i++) _add.call(curPart, arguments[i]); return this; };
const nm = (o,n)=>{ o.name = n; return o; };
const slots = {};
function slot(name){ const s = {stock:new THREE.Group(), biker:new THREE.Group()}; s.stock.name = name+'_stock'; s.biker.name = name+'_biker'; bike.add(s.stock, s.biker); slots[name] = s; return s; }
const XR = -.665, XF = .665, RR = .30, RF = .296;
const RAKE = 25*Math.PI/180;
const FD = V(-Math.sin(RAKE), Math.cos(RAKE)); // dirección de la barra hacia arriba
const fp = t=> V(XF + FD.x*t, RF + FD.y*t);      // punto a lo largo de la barra (t en metros)

/* ---- Ruedas ---- */
function tireProfile(rOut, hh, hw, e){
  const rc = rOut - hh, pts = [];
  for (let i=0;i<=48;i++){ const t = i/48*Math.PI*2, c = Math.cos(t), s = Math.sin(t); pts.push([rc + hh*Math.sign(c)*Math.pow(Math.abs(c),e), hw*Math.sign(s)*Math.pow(Math.abs(s),e)]); }
  return pts;
}
function rimHoop(g, hw, mat){
  const rw = hw*.8;
  g.add(nm(latheZ([[.198,-rw],[.222,-rw],[.222,-rw+.007],[.207,-rw+.012],[.203,0],[.207,rw-.012],[.222,rw-.007],[.222,rw],[.198,rw],[.198,-rw]], mat, 96),'rin_aro'));
  return rw;
}
function wheelStock(x, rOut, hw, coverMat, front){
  const g = new THREE.Group(); g.position.set(x, rOut, 0);
  g.add(nm(latheZ(tireProfile(rOut, (rOut-.216)/2, hw, .55), M.tread, 120),'neumatico'));
  const rw = rimHoop(g, hw, M.gloss);
  [-1,1].forEach(s=>{ const c = mesh(new THREE.CircleGeometry(.199,64), Array.isArray(coverMat) ? coverMat[s>0?0:1] : coverMat, 0,0,s*(rw-.006), 0, s<0?Math.PI:0, 0); g.add(c); });
  g.add(nm(latheZ([[0,-.07],[.028,-.07],[.03,-.05],[.03,.05],[.028,.07],[0,.07]], M.alu, 24),'buje'));
  // válvula verde
  g.add(mesh(new THREE.CylinderGeometry(.006,.006,.014,10), M.green, -.06, -.13, rw-.004, Math.PI/2));
  return g;
}
function wheelSpoked(x, rOut, hw){
  const g = new THREE.Group(); g.position.set(x, rOut, 0);
  g.add(latheZ(tireProfile(rOut, (rOut-.216)/2, hw, .55), M.rubber, 96));
  const N = 46;
  for (let i=0;i<N;i++){
    const a = i/N*Math.PI*2, z = (i%2?1:-1)*hw*.42;
    g.add(mesh(new THREE.BoxGeometry(.036,.016,hw*.62), M.rubber, Math.cos(a)*(rOut+.004), Math.sin(a)*(rOut+.004), z, 0,0,a-Math.PI/2));
    if (i%2===0) g.add(mesh(new THREE.BoxGeometry(.03,.014,hw*.5), M.rubber, Math.cos(a+.07)*(rOut-.012), Math.sin(a+.07)*(rOut-.012), (i%4?1:-1)*hw*.92, 0,0,a-Math.PI/2));
  }
  rimHoop(g, hw, M.rim);
  g.add(latheZ([[0,-.06],[.03,-.06],[.04,-.04],[.048,-.02],[.048,.02],[.04,.04],[.03,.06],[0,.06]], M.rim, 32));
  for (let i=0;i<5;i++){
    const a = i/5*Math.PI*2 + .3;
    [-1,1].forEach(s=>{
      const ai = a + s*.05, ao = a + s*.13;
      const p0 = [Math.cos(ai)*.045, Math.sin(ai)*.045], p1 = [Math.cos(ao)*.2, Math.sin(ao)*.2];
      const dx = p1[0]-p0[0], dy = p1[1]-p0[1], L = Math.hypot(dx,dy), nx = -dy/L, ny = dx/L;
      g.add(extrudeC(shape([[p0[0]+nx*.011,p0[1]+ny*.011],[p1[0]+nx*.006,p1[1]+ny*.006],[p1[0]-nx*.006,p1[1]-ny*.006],[p0[0]-nx*.011,p0[1]-ny*.011]], false), .014, .004, M.rim));
    });
  }
  return g;
}
const llantas = slot('llantas');
llantas.stock.add(nm(wheelStock(XR, RR, .07, [M.coverR, M.coverF]),'rueda_trasera'), nm(wheelStock(XF, RF, .05, [M.coverF, M.coverR], true),'rueda_delantera'));
llantas.biker.add(nm(wheelSpoked(XR, RR+.006, .074),'rueda_trasera_radios'), nm(wheelSpoked(XF, RF+.006, .054),'rueda_delantera_radios'));

pieza('freno_delantero');
/* ---- Frenos (común) ---- */
function disc(r, rin, holes){
  const s = circleShape(r); s.holes.push(holePath(0,0,rin));
  for (let i=0;i<holes;i++){ const a = i/holes*Math.PI*2; s.holes.push(holePath(Math.cos(a)*(r*.55+rin*.45), Math.sin(a)*(r*.55+rin*.45), .0045)); }
  for (let i=0;i<holes;i++){ const a = (i+.5)/holes*Math.PI*2; s.holes.push(holePath(Math.cos(a)*(r*.8+rin*.2), Math.sin(a)*(r*.8+rin*.2), .0045)); }
  return extrudeC(s, .005, 0, M.steel);
}
const fd = disc(.133,.085,24); fd.position.set(XF,RF,.062); base.add(fd);
const carrier = circleShape(.088); carrier.holes.push(holePath(0,0,.036));
for (let i=0;i<6;i++){ const a = i/6*Math.PI*2+.26; carrier.holes.push(holePath(Math.cos(a)*.062,Math.sin(a)*.062,.016)); }
const fc = extrudeC(carrier,.006,.002,M.steel); fc.position.set(XF,RF,.064); base.add(fc);
for (let i=0;i<6;i++){ const a = i/6*Math.PI*2; base.add(mesh(new THREE.CylinderGeometry(.006,.006,.012,8),M.alu,XF+Math.cos(a)*.04,RF+Math.sin(a)*.04,.068,Math.PI/2)); }
// Caliper dorado de dos pistones (detrás y arriba del eje, como en la foto)
(function(){
  const g = new THREE.Group(); g.position.set(XF-.09, RF+.085, .075); g.rotation.z = .85;
  g.add(panel([[-.045,-.024],[.045,-.03],[.055,-.006],[.052,.02],[.03,.034],[-.03,.034],[-.052,.018]], .036, .007, M.gold, 0));
  [-.02,.022].forEach(x=> g.add(mesh(new THREE.CylinderGeometry(.017,.017,.012,20),M.gold,x,.0,.024,Math.PI/2)));
  [-.036,.036].forEach(x=> g.add(mesh(new THREE.CylinderGeometry(.006,.006,.05,8),M.alu,x,-.02,0,Math.PI/2)));
  base.add(g);
  base.add(curve([V(XF-.07,RF+.12,.085),V(XF-.12,RF+.25,.1),V(fp(.42).x-.03,fp(.42).y,.11),V(fp(.62).x-.04,fp(.62).y,.1)],.005,M.plastic,40));
})();
pieza('freno_trasero');
// Tambor trasero (lado derecho) con brazo, varilla y resorte
(function(){
  base.add(at(latheZ([[0,.02],[.075,.02],[.08,.03],[.08,.07],[.07,.085],[0,.085]], M.cover, 40),XR,RR,0));
  const arm = panel([[0,0],[.012,0],[.04,-.085],[.026,-.09]], .008, .002, M.alu, 0); arm.position.set(XR+.015,RR-.04,.095); base.add(arm);
  const a = V(XR+.04,RR-.125,.1), b = V(-.24,.28,.135);
  base.add(rod(a,b,.0045,M.alu,8));
  class Helix extends THREE.Curve { constructor(r,l,t){ super(); this.r=r; this.l=l; this.t=t; } getPoint(u,tg){ tg = tg||new THREE.Vector3(); const an = u*this.t*Math.PI*2; return tg.set(Math.cos(an)*this.r, u*this.l, Math.sin(an)*this.r); } }
  const sp = finish(new THREE.Mesh(new THREE.TubeGeometry(new Helix(.008,.09,14),160,.0016,6,false),M.alu));
  axis(sp, a.clone().lerp(b,.03), b); base.add(sp);
  base.add(rod(V(XR,RR,.09),V(-.42,.31,.11),.006,M.alu,8)); // tirante
})();
pieza('cadena_transmision');
// Piñón (lado izquierdo) y cadena
(function(){ const s = new THREE.Shape(); const N = 41; for (let i=0;i<=N*2;i++){ const a = i/(N*2)*Math.PI*2, r = i%2 ? .094 : .1; if (!i) s.moveTo(Math.cos(a)*r,Math.sin(a)*r); else s.lineTo(Math.cos(a)*r,Math.sin(a)*r); }
  s.holes.push(holePath(0,0,.05)); for (let i=0;i<5;i++){ const a = i/5*Math.PI*2; s.holes.push(holePath(Math.cos(a)*.072,Math.sin(a)*.072,.011)); }
  const sp = extrudeC(s,.006,0,M.steel); sp.position.set(XR,RR,-.1); base.add(sp); })();
base.add(rod(V(.0,.355,-.1),V(XR,RR+.097,-.1),.0065,M.fin,8));
base.add(rod(V(.0,.27,-.1),V(XR,RR-.097,-.1),.0065,M.fin,8));
base.add(curve([V(XR,RR+.097,-.1),V(XR-.07,RR+.07,-.1),V(XR-.097,RR,-.1),V(XR-.07,RR-.07,-.1),V(XR,RR-.097,-.1)],.0065,M.fin,30));
base.add(panel([[-.02,.385],[-.55,.425],[-.56,.41],[-.02,.365]],.01,.003,M.plastic,-.115)); // cubre cadena

pieza('horquilla');
/* ---- Suspensión delantera ---- */
const FL = .74; // largo barra eje→tope
[-1,1].forEach(s=>{
  const z = s*.095;
  const low = lathe([[0,-.035],[.024,-.035],[.034,-.01],[.034,.05],[.033,.3],[.031,.33],[.024,.34],[0,.34]], M.plastic, 40);
  axis(low, V(XF,RF,z), V(XF+FD.x,RF+FD.y,z)); base.add(low);
  const st = lathe([[0,0],[.0205,0],[.0205,FL-.3],[0,FL-.3]], M.chrome, 32);
  axis(st, V(fp(.32).x,fp(.32).y,z), V(fp(1).x,fp(1).y,z)); base.add(st);
  const cap = lathe([[0,0],[.023,0],[.023,.018],[.012,.028],[0,.028]], M.alu, 24); axis(cap, V(fp(FL).x,fp(FL).y,z), V(fp(FL+1).x,fp(FL+1).y,z)); base.add(cap);
});
const FT = fp(FL-.04), FB = fp(FL-.17);
[[FB,.034,M.plastic],[FT,.03,M.yoke]].forEach(([p,h,m])=>{ const c = slab(m===M.yoke?.095:.07,.26,h,.03,m); c.name = m===M.yoke?'tija_superior_placa':'tija_inferior_placa'; c.position.set(p.x-.01,p.y,0); c.rotation.z = RAKE; base.add(c); });
base.add(mesh(new THREE.CylinderGeometry(.009,.009,.24,10),M.alu,XF,RF,0,Math.PI/2));
pieza('guardabarro_delantero');
// Guardabarro delantero bronce
const ffend = latheZ([[.322,-.06],[.336,-.058],[.343,-.03],[.346,0],[.343,.03],[.336,.058],[.322,.06]], M.paint, 64, Math.PI*.56, Math.PI*.44);
ffend.position.set(XF,RF,0); ffend.rotation.z = .52; ffend.scale.set(1,1,1); base.add(ffend);
[-1,1].forEach(s=>{ const br = panel([[0,0],[.06,.05],[.07,.04],[.02,-.01]],.006,.002,M.plastic,s*.068); br.position.x = XF-.02; br.position.y = RF+.31; base.add(br); });
pieza('guardabarro_trasero');
// Guardabarro trasero (hugger)
const hug = latheZ([[.33,-.085],[.345,-.08],[.352,0],[.345,.08],[.33,.085]], M.plastic, 48, Math.PI*.62, Math.PI*.44);
hug.position.set(XR,RR,0); base.add(hug);

pieza('chasis_basculante');
/* ---- Chasis ---- */
const HEAD_A = V(FB.x-.04, FB.y-.02), HEAD_B = V(FT.x-.04, FT.y-.02);
base.add(rod(HEAD_A, HEAD_B, .03, M.frame, 20));
[-1,1].forEach(s=>{
  const z = s*.085;
  base.add(curve([V(HEAD_B.x,HEAD_B.y-.02,z*.4),V(.22,.84,z),V(.02,.78,z),V(-.14,.7,z),V(-.2,.58,z),V(-.2,.43,z)],.019,M.frame));
  base.add(curve([V(HEAD_A.x,HEAD_A.y,z*.4),V(.3,.62,z*.8),V(.27,.36,z),V(.12,.2,z),V(-.1,.19,z),V(-.19,.3,z),V(-.2,.43,z)],.016,M.frame));
  base.add(rod(V(-.13,.7,s*.07),V(-.8,.82,s*.065),.012,M.frame,10));
  base.add(rod(V(-.2,.47,s*.08),V(-.58,.8,s*.07),.011,M.frame,10));
  // basculante de sección cuadrada
  base.add(panel([[-.2,.455],[-.4,.41],[-.63,.338],[-.69,.322],[-.705,.3],[-.69,.278],[-.63,.268],[-.4,.36],[-.2,.398]],.03,.007,M.frame,s*.1));
  base.add(mesh(new THREE.BoxGeometry(.035,.018,.012),M.alu,XR-.03,RR,s*.12));
});
base.add(mesh(new THREE.CylinderGeometry(.022,.022,.25,16),M.alu,-.2,.43,0,Math.PI/2));
pieza('amortiguador_trasero');
// Amortiguador trasero
(function(){
  const a = V(-.15,.64), b = V(-.31,.39); const g = new THREE.Group(); axis(g, b, a); const L = a.distanceTo(b);
  g.add(mesh(new THREE.CylinderGeometry(.018,.018,L,16),M.chrome,0,L/2,0));
  g.add(mesh(new THREE.CylinderGeometry(.03,.03,.05,20),M.cover,0,L-.04,0));
  class Helix extends THREE.Curve { constructor(r,l,t){ super(); this.r=r; this.l=l; this.t=t; } getPoint(u,tg){ tg = tg||new THREE.Vector3(); const an = u*this.t*Math.PI*2; return tg.set(Math.cos(an)*this.r, u*this.l, Math.sin(an)*this.r); } }
  const sp = finish(new THREE.Mesh(new THREE.TubeGeometry(new Helix(.03,L*.62,7),240,.0065,8,false),M.spring)); sp.position.y = .03; g.add(sp);
  base.add(g);
})();

pieza('motor');
/* ---- Motor (155 cc enfriado por aire) ---- */
base.add(panel([[-.16,.42],[.0,.465],[.13,.455],[.22,.39],[.235,.27],[.17,.2],[.0,.19],[-.13,.22],[-.185,.31]],.15,.03,M.engine,0,0,0,true,6));
const clutch = panel([[0,.1],[.085,.06],[.1,-.02],[.06,-.09],[-.04,-.1],[-.1,-.03],[-.09,.06]],.026,.014,M.engine,.115,0,0,true,6);
clutch.position.x = .08; clutch.position.y = .315; base.add(clutch);
base.add(mesh(new THREE.CylinderGeometry(.03,.03,.02,24),M.cover,.13,.39,.135,Math.PI/2)); // tapón de aceite
for (let i=0;i<8;i++){ const a = i/8*Math.PI*2; base.add(mesh(new THREE.CylinderGeometry(.006,.006,.012,8),M.alu,.08+Math.cos(a)*.088,.315+Math.sin(a)*.085,.148,Math.PI/2)); }
const mag = extrudeC(circleShape(.082),.024,.012,M.engine); mag.position.set(-.07,.335,-.112); base.add(mag);
base.add(mesh(new THREE.CylinderGeometry(.035,.035,.03,24),M.engine,.03,.36,-.1,Math.PI/2));
const cyl = new THREE.Group(); cyl.position.set(.1,.42,0); cyl.rotation.z = -.3;
cyl.add(mesh(new THREE.CylinderGeometry(.058,.062,.22,24),M.engine,0,.11,0));
for (let i=0;i<9;i++){ const f = slab(.2-i*.003,.19-i*.003,.006,.025,M.fin); f.position.y = .028+i*.021; cyl.add(f); }
const hd = slab(.18,.18,.055,.035,M.engine); hd.position.y = .23; cyl.add(hd);
const cam = slab(.13,.14,.035,.035,M.fin); cam.position.y = .275; cyl.add(cam);
cyl.add(mesh(new THREE.CylinderGeometry(.012,.015,.06,12),M.plastic,-.05,.22,.1,Math.PI/2.4)); // capuchón bujía
base.add(cyl);
base.add(mesh(new THREE.CylinderGeometry(.035,.035,.1,16),M.cover,-.05,.56,0,0,0,Math.PI/2.3)); // carburador
pieza('escape_colector');
// Tubo de escape (header)
base.add(curve([V(.24,.58,.03),V(.31,.5,.06),V(.32,.33,.09),V(.25,.2,.11),V(.06,.185,.12),V(-.1,.2,.135),V(-.16,.222,.15)],.02,M.steel,90));
pieza('estriberas_pedales');
// Estriberas: piloto con porta-estribo plateado; pasajero con soporte tubular negro
[-1,1].forEach(s=>{
  base.add(panel([[-.11,.47],[-.06,.44],[-.15,.3],[-.25,.29],[-.27,.33],[-.2,.38]],.012,.004,M.alu,s*.135));
  const rp = at(lathe([[0,0],[.014,0],[.014,.1],[0,.1]],M.rubber,16),-.21,.33,s*.14); rp.rotation.x = s*Math.PI/2; base.add(rp);
  base.add(curve([V(-.36,.66,s*.075),V(-.42,.56,s*.13),V(-.46,.48,s*.15)],.011,M.frame,30));
  base.add(curve([V(-.46,.48,s*.15),V(-.55,.5,s*.14),V(-.62,.6,s*.1),V(-.6,.72,s*.07)],.011,M.frame,30));
  base.add(panel([[-.43,.53],[-.4,.5],[-.49,.43],[-.53,.46]],.01,.004,M.alu,s*.155));
  const pp = lathe([[0,0],[.011,0],[.011,.07],[0,.07]],M.rubber,14); pp.position.set(-.48,.455,s*.16); pp.rotation.x = s*Math.PI/2; base.add(pp);
});
base.add(curve([V(-.14,.36,.15),V(-.04,.33,.16),V(.06,.3,.165)],.007,M.alu)); // pedal de freno
base.add(curve([V(-.16,.36,-.15),V(-.06,.34,-.155),V(.02,.31,-.16)],.007,M.alu)); // cambios

pieza('tanque');
/* ---- Tanque bronce + flancos con franjas ---- */
const TANK = [[.37,.83],[.355,.875],[.3,.9],[.2,.912],[.08,.91],[-.02,.885],[-.1,.825],[-.135,.79],[-.08,.77],[.1,.77],[.3,.78]];
const tankMesh = panel(TANK,.18,.05,M.paint,0,0,0,true,8); base.add(tankMesh);
// huecos negros de rodilla en la parte de arriba
[-1,1].forEach(s=>{
  const p = mesh(new THREE.SphereGeometry(1,40,16),M.plastic,.11,.835,s*.168); p.rotation.set(-s*.25,-s*.06,-.12,'YXZ'); p.scale.set(.11,.032,.008); base.add(p);
  const badge = slab(.085,.005,.02,.006,M.gold); badge.position.set(.27,.845,s*.172); badge.rotation.set(-s*.2,-s*.06,-.1,'YXZ'); base.add(badge);
});
// Calcomanías que se pegan a la forma del tanque (vista desde arriba: x a lo largo, z a lo ancho)
tankMesh.updateMatrixWorld(true);
const ray = new THREE.Raycaster(), DOWN = V(0,-1,0);
function tankY(x,z){ ray.set(V(x,2,z), DOWN); const h = ray.intersectObject(tankMesh, false)[0]; return h ? h.point.y : null; }
function topDecal(x0,x1,z0,z1,draw){
  const W = 512, H = Math.max(64, Math.round(512*(z1-z0)/(x1-x0)));
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  const P = (x,z)=>[(x-x0)/(x1-x0)*W, (z-z0)/(z1-z0)*H];
  draw(g,P,W,H);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4;
  const geo = new THREE.PlaneGeometry(x1-x0, z1-z0, 36, 18); geo.rotateX(-Math.PI/2); geo.translate((x0+x1)/2, 0, (z0+z1)/2);
  const pos = geo.attributes.position; let last = .9;
  for (let i=0;i<pos.count;i++){ const y = tankY(pos.getX(i), pos.getZ(i)); if (y !== null) last = y; pos.setY(i, (y === null ? last - .02 : y) + .0025); }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({map:t, transparent:true, alphaTest:.4, roughness:.55, metalness:.15, polygonOffset:true, polygonOffsetFactor:-2}));
  m.receiveShadow = true; base.add(m); return m;
}
const fill = (g,P,pts,col)=>{ g.fillStyle = col; g.beginPath(); pts.forEach((p,i)=>{ const q = P(p[0],p[1]); i ? g.lineTo(q[0],q[1]) : g.moveTo(q[0],q[1]); }); g.closePath(); g.fill(); };
const grit = (g,W,H,base)=>{ g.save(); g.globalCompositeOperation = 'source-atop'; for (let i=0;i<W*H/60;i++){ g.fillStyle = Math.random()<.5 ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.25)'; g.fillRect(Math.random()*W, Math.random()*H, 2, 2); } g.restore(); };
// tapa de gasolina con anillo decorativo rojo y plata
topDecal(.165,.295,-.065,.065,(g,P,W,H)=>{
  const [cx,cy] = P(.23,0), R = W*.48;
  g.fillStyle = '#c9cdd1'; g.beginPath(); g.arc(cx,cy,R,0,Math.PI*2); g.fill();
  g.fillStyle = '#151515'; g.beginPath(); g.arc(cx,cy,R*.9,0,Math.PI*2); g.fill();
  for (let k=0;k<6;k++){ const a0 = k/6*Math.PI*2+.12, a1 = a0+Math.PI*2/6-.24; g.fillStyle = '#c3221a'; g.beginPath(); g.arc(cx,cy,R*.86,a0,a1); g.arc(cx,cy,R*.64,a1,a0,true); g.closePath(); g.fill(); }
  g.fillStyle = '#9da1a5'; g.beginPath(); g.arc(cx,cy,R*.6,0,Math.PI*2); g.fill();
  g.strokeStyle = '#c3221a'; g.lineWidth = R*.06; g.beginPath(); g.arc(cx,cy,R*.52,0,Math.PI*2); g.stroke();
  g.fillStyle = '#b9bdc1'; g.beginPath(); g.arc(cx,cy,R*.46,0,Math.PI*2); g.fill();
  g.fillStyle = '#a3a7ab'; g.fillRect(cx-R*.12, cy-R*.36, R*.24, R*.72); g.fillRect(cx-R*.3, cy-R*.12, R*.6, R*.24);
});
// pads negros de agarre a los lados de la tapa
[-1,1].forEach(s=>{
  const z0 = s>0 ? .055 : -.14, z1 = s>0 ? .14 : -.055;
  topDecal(.08,.33,z0,z1,(g,P,W,H)=>{
    const zi = s*.065, zo = s*.135;
    fill(g,P,[[.31,zi+s*.01],[.32,zo-s*.03],[.27,zo],[.12,zo],[.09,zo-s*.02],[.1,zi],[.2,zi-s*.005]],'#1b1b1c'); grit(g,W,H);
  });
});
// pad central negro con rayo dorado y franja roja, del tapón hacia el sillín
topDecal(-.15,.16,-.06,.06,(g,P,W,H)=>{
  fill(g,P,[[.15,-.045],[.15,.045],[.0,.05],[-.12,.038],[-.145,.0],[-.12,-.038],[.0,-.05]],'#161617');
  fill(g,P,[[.14,-.04],[.14,.0],[.02,.04],[-.04,.04]],'#c3261c');
  fill(g,P,[[.12,.0],[.12,.03],[.05,.012],[.06,.035],[-.06,.0],[.03,.0],[.0,-.025]],'#d7b45a');
  g.strokeStyle = 'rgba(120,80,40,.9)'; g.lineWidth = 4; [-.028,.028].forEach(z=>{ const a = P(-.1,z), b = P(-.01,z*1.2); g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.stroke(); });
  grit(g,W,H);
});
// pads de las esquinas traseras con franjas roja y dorada
[-1,1].forEach(s=>{
  const z0 = s>0 ? .06 : -.14, z1 = s>0 ? .14 : -.06;
  topDecal(-.14,.1,z0,z1,(g,P,W,H)=>{
    fill(g,P,[[.09,s*.065],[.07,s*.135],[-.08,s*.13],[-.13,s*.09],[-.1,s*.065]],'#141415');
    fill(g,P,[[.07,s*.13],[.05,s*.135],[-.1,s*.075],[-.07,s*.07]],'#c3261c');
    fill(g,P,[[.045,s*.135],[.025,s*.135],[-.12,s*.09],[-.11,s*.078]],'#d7b45a');
    grit(g,W,H);
  });
});
// pernos plateados del pad central
[[.13,.06],[.13,-.06],[-.03,.055],[-.03,-.055],[-.13,.04],[-.13,-.04]].forEach(([x,z])=>{ const y = tankY(x,z); if (y !== null) base.add(at(mesh(new THREE.CylinderGeometry(.007,.007,.006,12),M.alu),x,y+.002,z)); });
// botón de la tapa
{ const y = tankY(.23,0); if (y !== null) base.add(at(lathe([[0,0],[.022,0],[.024,.005],[.018,.01],[0,.011]],M.alu,28),.23,y,0)); }
pieza('flancos_tanque');
const FLANK = [[0.39,0.87],[0.42,0.825],[0.39,0.757],[0.33,0.69],[0.27,0.665],[0.18,0.69],[0.05,0.73],[-0.08,0.76],[-0.155,0.781],[-0.15,0.825],[-0.06,0.849],[0.1,0.87],[0.26,0.88]];
const DECAL = [[0.25,0.705],[0.18,0.7],[0.05,0.738],[-0.08,0.766],[-0.15,0.784],[-0.146,0.824],[-0.06,0.842],[0.05,0.825],[0.17,0.777]];
const decalT = decalTex(DECAL, (g,P,W,H,o)=>{
  g.fillStyle = '#121213'; g.fillRect(0,0,W,H);
  g.fillStyle = o.line; band2(g,P,[-.15,.823],[.24,.712],.004,.002);
  g.fillStyle = o.band; poly(g,P,[[-.16,.798],[-.02,.781],[.12,.750],[.14,.755],[0,.81],[-.16,.813]]);
  g.fillStyle = o.cream; band2(g,P,[-.16,.790],[.06,.758],.005,.002); band2(g,P,[-.16,.781],[.0,.760],.004,.0015); band2(g,P,[-.16,.774],[-.06,.762],.003,.001);
  g.fillStyle = o.line; poly(g,P,[[-.08,.824],[-.02,.812],[-.0,.816],[-.06,.829]]);
});
M.decal = std(0xffffff,.3,.32,{map:decalT, side:DS});
[-1,1].forEach(s=>{
  base.add(panel(FLANK,.014,.008,M.accent,s*.152,-s*.06,s*.08,false,4));
  base.add(panel(DECAL,.002,0,[M.decal,M.decal],s*.163,-s*.06,s*.08,false));
  // pieza bronce con pernos bajo el tanque (frente)
  base.add(panel([[.3,.69],[.36,.69],[.36,.63],[.3,.63]],.01,.003,M.accent,s*.11));
  base.add(mesh(new THREE.CylinderGeometry(.007,.007,.012,10),M.alu,.33,.66,s*.118,Math.PI/2));
});

pieza('tapas_laterales');
/* ---- Tapas laterales ---- */
[-1,1].forEach(s=>{
  // gris oscura debajo del tanque (la del sticker SEP) + calcomanía plateada
  base.add(panel([[.3,.63],[.14,.6],[-.05,.605],[-.16,.66],[-.19,.745],[-.11,.775],[.05,.735],[.2,.68]],.012,.006,s>0 ? M.grey : M.gloss,s*.15,-s*.04));
  base.add(mesh(new THREE.PlaneGeometry(.075,.022),phong(0x9ea2a6,.5,0xffffff,80,{side:DS}),-.0,.655,s*.158,0,s<0?Math.PI:0,.1));
  // panel de panal detrás del cilindro (caja filtro)
  base.add(panel([[.06,.6],[-.15,.63],[-.2,.52],[-.08,.46],[.03,.5]],.01,.004,M.honey,s*.13));
  // negra brillante debajo del sillín (triangular)
  base.add(panel([[-.11,.75],[-.47,.785],[-.51,.76],[-.38,.69],[-.27,.6],[-.21,.5],[-.165,.53],[-.14,.66]],.014,.006,M.gloss,s*.128,s*.03));
  // franja bronce entre el panel y el sillín, hasta la cola
  base.add(panel([[-.12,.765],[-.47,.775],[-.62,.80],[-.8,.86],[-.845,.885],[-.83,.86],[-.62,.775],[-.47,.748],[-.12,.742]],.01,.004,M.paint,s*.122,s*.03));
});

/* ---- FARO ---- */
const faro = slot('faro');
// Tablero digital (común), rehecho con el diagrama del manual (pág. 316): barra de rpm arriba, velocidad grande a la izquierda,
// reloj + marcha, trip/odómetro, medidor de gasolina vertical, indicadores a los lados y los botones SEL / ADJ abajo
pieza('tablero_digital');
M.cluster = (()=>{ const t = canvasTex(1024,526,(g,W,H)=>{
  const ON = '#e6faff', OFF = '#0f262e', LAB = '#9fd0de';
  const rr = (x,y,w,h,r)=>{ g.beginPath(); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath(); };
  const D = ['abcdef','bc','abdeg','abcdg','bcfg','acdfg','acdefg','abc','abcdefg','abcdfg'];
  const seg7 = (x,y,w,h,ch,on)=>{
    const t = Math.max(2,h*.13), lh = w-t*1.15, lv = h/2-t*1.15, Y0 = y+h;
    const hs = (cx,cy,l)=>[[cx-l/2,cy],[cx-l/2+t/2,cy-t/2],[cx+l/2-t/2,cy-t/2],[cx+l/2,cy],[cx+l/2-t/2,cy+t/2],[cx-l/2+t/2,cy+t/2]];
    const vs = (cx,cy,l)=>[[cx,cy-l/2],[cx+t/2,cy-l/2+t/2],[cx+t/2,cy+l/2-t/2],[cx,cy+l/2],[cx-t/2,cy+l/2-t/2],[cx-t/2,cy-l/2+t/2]];
    const S = {a:hs(x+w/2,y+t/2,lh), g:hs(x+w/2,y+h/2,lh), d:hs(x+w/2,y+h-t/2,lh), f:vs(x+t/2,y+h/4,lv), b:vs(x+w-t/2,y+h/4,lv), e:vs(x+t/2,y+3*h/4,lv), c:vs(x+w-t/2,y+3*h/4,lv)};
    const lit = ch>=0 && ch<=9 ? D[ch] : '';
    g.save(); g.translate(0,Y0); g.transform(1,0,-.14,1,0,0); g.translate(0,-Y0);
    Object.keys(S).forEach(k=>{ g.fillStyle = (on && lit.indexOf(k)>=0) ? ON : OFF; g.beginPath(); S[k].forEach((p,i)=> i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1])); g.closePath(); g.fill(); });
    g.restore();
  };
  const ghost = (x,y,w,h,gap,vals)=> vals.forEach((v,i)=>{ seg7(x+i*(w+gap),y,w,h,8,false); if (v>=0) seg7(x+i*(w+gap),y,w,h,v,true); });
  const text = (s,x,y,px,col,bold,al)=>{ g.fillStyle = col; g.font = (bold?'800 ':'600 ')+px+'px Arial, sans-serif'; g.textAlign = al||'left'; g.fillText(s,x,y); };
  // carcasa y cristal de la pantalla
  g.fillStyle = '#0a0c0e'; g.fillRect(0,0,W,H);
  rr(W*.20,H*.07,W*.60,H*.58,26); g.fillStyle = '#03080b'; g.fill(); g.strokeStyle = '#1a2d34'; g.lineWidth = 3; g.stroke();
  // barra de rpm con escala 0-12 (x1000 r/min)
  for (let i=0;i<=60;i++){ const x = W*.235+i*(W*.53/60); g.fillStyle = i<=14 ? ON : OFF; g.fillRect(x,H*.10,i%5===0?5:3,H*.075); }
  for (let n=0;n<=12;n++) text(String(n), W*.235+n*(W*.53/12), H*.25, 17, LAB, true, 'center');
  text('x1000r/min', W*.225, H*.29, 14, LAB, true);
  // velocidad: un 1 inicial + dos dígitos grandes, enciende 0
  seg7(W*.215,H*.325,W*.045,H*.26,-1,false); seg7(W*.215+0,H*.325,W*.045,H*.26,1,false);
  ghost(W*.275,H*.325,W*.095,H*.26,W*.018,[-1,0]);
  text('km/h', W*.40, H*.615, 22, ON, true);
  // reloj y marcha
  ghost(W*.445,H*.305,W*.028,H*.105,W*.008,[1,0]); g.fillStyle = ON; g.fillRect(W*.51,H*.335,4,4); g.fillRect(W*.51,H*.375,4,4); ghost(W*.525,H*.305,W*.028,H*.105,W*.008,[1,0]);
  text('GEAR', W*.665, H*.315, 13, LAB, true); g.fillStyle = ON; g.font = '800 70px Arial, sans-serif'; g.textAlign = 'left'; g.fillText('N', W*.67, H*.46);
  // trip y odómetro
  text('TRIP A', W*.46, H*.495, 14, LAB, true); text('TRIP B', W*.56, H*.495, 14, LAB, true);
  ghost(W*.45,H*.515,W*.024,H*.095,W*.006,[0,1,2,4,8,0]); text('km', W*.67, H*.60, 15, LAB, true);
  // medidor de gasolina vertical + bomba
  for (let i=0;i<7;i++){ g.fillStyle = i<5 ? ON : OFF; g.fillRect(W*.745+i*.4, H*.58-i*H*.052, W*.022, H*.036); }
  text('F', W*.775, H*.20, 15, LAB, true); text('1/2', W*.775, H*.37, 13, LAB, true); text('E', W*.775, H*.58, 15, LAB, true);
  // indicadores fuera de la pantalla
  const box = (cx,cy)=>{ rr(cx-W*.032,cy-H*.058,W*.064,H*.116,12); g.fillStyle = '#12181b'; g.fill(); g.strokeStyle = '#3a4b52'; g.lineWidth = 3; g.stroke(); };
  const arrow = (cx,cy,dir,col)=>{ g.fillStyle = col; g.beginPath(); g.moveTo(cx+dir*W*.022,cy); g.lineTo(cx-dir*W*.004,cy-H*.04); g.lineTo(cx-dir*W*.004,cy-H*.014); g.lineTo(cx-dir*W*.022,cy-H*.014); g.lineTo(cx-dir*W*.022,cy+H*.014); g.lineTo(cx-dir*W*.004,cy+H*.014); g.lineTo(cx-dir*W*.004,cy+H*.04); g.closePath(); g.fill(); };
  box(W*.07,H*.23); arrow(W*.07,H*.23,-1,'#1d5d37'); box(W*.93,H*.23); arrow(W*.93,H*.23,1,'#1d5d37');
  box(W*.07,H*.41); g.strokeStyle = '#1c3f8a'; g.lineWidth = 4; g.beginPath(); g.ellipse(W*.075,H*.41,W*.017,H*.038,0,-Math.PI/2,Math.PI/2); g.stroke(); [-.025,0,.025].forEach(d=>{ g.beginPath(); g.moveTo(W*.05,H*(.41+d)); g.lineTo(W*.032,H*(.41+d)); g.stroke(); });
  text('RPM', W*.855, H*.395, 17, LAB, true, 'center'); rr(W*.90,H*.335,W*.064,H*.09,18); g.strokeStyle = '#3a4b52'; g.lineWidth = 3; g.stroke();
  box(W*.93,H*.52); text('N', W*.93, H*.56, 36, '#2fd36a', true, 'center');
  // botones SEL / ADJ en la parte baja de la carcasa
  text('SEL', W*.19, H*.72, 17, LAB, true); text('ADJ', W*.74, H*.72, 17, LAB, true);
  [[.27,'#1b1f22'],[.73,'#1b1f22']].forEach(([cx,col])=>{ g.fillStyle = col; g.beginPath(); g.ellipse(W*cx,H*.84,W*.13,H*.065,0,0,Math.PI*2); g.fill(); g.strokeStyle = '#2d3a40'; g.lineWidth = 3; g.stroke(); });
}); return std(0xffffff,0,.28,{map:t, emissive:0xffffff, emissiveMap:t, emissiveIntensity:.8}); })();
M.glassC = phong(0x000000,.35,0xffffff,300,{transparent:true, opacity:.18});
// plano orientado sobre una pendiente lateral (x,y) con normal hacia el piloto
function onSlope(geo, mat, cx, cy, a, off){ const m = new THREE.Mesh(geo, mat); m.rotation.order = 'ZYX'; m.rotation.set(0,-Math.PI/2,-(Math.PI/2-a)); m.position.set(cx-Math.sin(a)*off, cy+Math.cos(a)*off, 0); return finish(m); }
(function(){
  const g = new THREE.Group(); g.name = 'tablero_carcasa'; g.position.set(FT.x+.098, FT.y+.072, 0);
  const P = [[-.052,0],[.056,0],[.062,.06],[.056,.098],[-.052,.036]];
  g.add(panel(P,.17,.01,M.plastic,0,0,0,false,4));
  const a = Math.atan2(.062,.108), c = V(.002,.067);
  const face = onSlope(new THREE.PlaneGeometry(.148,.076), M.cluster, c.x, c.y, a, .0092); face.name = 'tablero_pantalla'; g.add(face);
  g.add(onSlope(new THREE.PlaneGeometry(.148,.076), M.glassC, c.x, c.y, a, .0104));
  [-1,1].forEach(s=> g.add(mesh(new THREE.CylinderGeometry(.0042,.0042,.012,10),M.alu,-.044,.03,s*.07,0,0,Math.PI/2))); // tornillos traseros
  base.add(g);
  [-1,1].forEach(s=> base.add(rod(V(FT.x+.082,FT.y+.074,s*.055),V(FT.x+.044,FT.y+.012,s*.055),.008,M.plastic,10)));
  // tija superior: chapa de la llave (adelante del manubrio, al centro) y tuerca de la dirección (atrás), como en el manual
  pieza('tija_superior');
  const fwd = V(Math.cos(RAKE), Math.sin(RAKE)), onYoke = (f,h)=> V(FT.x+FD.x*(.0165+h)+fwd.x*f, FT.y+FD.y*(.0165+h)+fwd.y*f);
  base.add(rod(onYoke(.032,0), onYoke(.032,.016), .0165, M.plastic, 24));
  base.add(rod(onYoke(.032,.016), onYoke(.032,.0172), .0128, M.chrome, 20));
  base.add(rod(onYoke(.032,.0172), onYoke(.032,.0179), .0034, M.plastic, 8));
  base.add(rod(onYoke(-.036,0), onYoke(-.036,.013), .021, M.alu, 6));
  base.add(rod(onYoke(-.036,.013), onYoke(-.036,.0145), .009, M.plastic, 12));
  pieza();
})();
// Carcasa original: laterales bronce, centro negro y farola angular
(function(){
  const g = faro.stock;
  const SIDE = [[.45,.99],[.55,.975],[.615,.87],[.66,.765],[.632,.71],[.5,.725],[.455,.82]];
  [-1,1].forEach(s=> g.add(panel(SIDE,.012,.006,M.accent,s*.098,s*.04,0,false,3)));
  g.add(panel([[.462,.975],[.548,.958],[.608,.86],[.648,.768],[.624,.722],[.505,.735],[.462,.82]],.19,.006,M.plastic,0,0,0,false,3));
  // vista de frente: lente en forma de escudo que termina en punta abajo, visera negra con dos tornillos arriba
  const head = new THREE.Group(); head.position.set(.6,.81,0); head.rotation.z = .42; g.add(head);
  const LENS = [[-.095,.075],[0,.035],[.095,.075],[.088,.0],[.04,-.075],[0,-.1],[-.04,-.075],[-.088,.0]];
  const VISOR = [[-.1,.083],[0,.041],[.1,.083],[.09,.15],[.02,.165],[-.02,.165],[-.09,.15]];
  const lensM = facePanel(LENS,.035,.006,M.lensStock); head.add(lensM);
  const lensIn = facePanel(LENS.map(([u,v])=>[u*.8,v*.8-.005]),.004,0,phong(0xe9edf0,.6,0xffffff,200,{transparent:true,opacity:.45})); lensIn.position.x = .03; head.add(lensIn);
  const vis = facePanel(VISOR,.022,.006,M.visor); vis.position.x = .012; head.add(vis);
  [-1,1].forEach(s=> head.add(mesh(new THREE.CylinderGeometry(.007,.007,.01,10),M.alu,.03,.115,s*.035,0,0,Math.PI/2)));
  g.add(glow(0xfff1dd,.35,.64,.8,0));
  [-1,1].forEach(s=>{ g.add(indicator(V(.5,.88,s*.11), V(.53,.89,s*.21), .016)); });
  [-1,1].forEach(s=> g.add(rod(V(fp(.6).x,fp(.6).y,s*.09),V(.47,.84,s*.08),.007,M.frame,8)));
})();
// Faro redondo LED 7"
(function(){
  const g = faro.biker;
  const c = V(.6,.88);
  const bucket = lathe([[0,0],[.05,0],[.075,.02],[.092,.06],[.1,.1],[.102,.115],[.096,.118],[0,.118]],M.plastic,48);
  axis(bucket, V(c.x-.115,c.y), V(c.x+.1,c.y)); g.add(bucket);
  g.add(mesh(new THREE.TorusGeometry(.098,.007,12,64),M.chrome,c.x+.002,c.y,0,0,Math.PI/2,0));
  g.add(mesh(new THREE.CircleGeometry(.092,64),M.lens,c.x+.004,c.y,0,0,Math.PI/2,0));
  g.add(mesh(new THREE.TorusGeometry(.07,.005,8,64),M.halo,c.x+.006,c.y,0,0,Math.PI/2,0));
  g.add(mesh(new THREE.SphereGeometry(.03,24,16),M.chrome,c.x-.006,c.y,0));
  g.add(glow(0xfff1dd,.55,c.x+.03,c.y,0));
  [-1,1].forEach(s=>{ g.add(rod(V(fp(.55).x,fp(.55).y,s*.098),V(c.x-.06,c.y,s*.08),.009,M.cover,10)); g.add(indicator(V(FT.x,FT.y,s*.12), V(FT.x+.04,FT.y,s*.2), .011)); });
  const beam = new THREE.SpotLight(0xfff1dd,0,8,.42,.6,1.3); beam.position.set(c.x+.02,c.y,0); beam.target.position.set(3.4,0,0); scene.add(beam.target); g.add(beam); lights.beam = beam;
})();

/* ---- MANUBRIO ---- */
const man = slot('manubrio');
function bar(g, y, half, sweep, barMat, ends, stockLook){
  const cx = FT.x - .005, gx = cx - sweep, ye = y + .026;
  g.add(nm(curve([V(gx,ye,-half),V(cx-sweep*.55,y+.014,-half*.62),V(cx-sweep*.12,y+.002,-half*.3),V(cx,y,-half*.14),V(cx,y,half*.14),V(cx-sweep*.12,y+.002,half*.3),V(cx-sweep*.55,y+.014,half*.62),V(gx,ye,half)],.0111,barMat,100),'barra_manubrio'));
  [-1,1].forEach(s=>{
    const pe = V(gx,ye,s*half), pp = V(cx-sweep*.55,y+.014,s*half*.62), d = pe.clone().sub(pp).normalize();
    const at = t=> pe.clone().add(d.clone().multiplyScalar(t));          // t<0: hacia el centro
    const th = Math.atan2(s*d.x, Math.abs(d.z));
    const place = (o,p)=>{ o.position.copy(p); o.rotation.y = th; return o; };
    const sub = n=>{ const q = new THREE.Group(); q.name = n+(s>0?'_der':'_izq'); g.add(q); return q; };
    const gCl = sub('abrazadera'), gGr = sub('puno'), gLe = sub('palanca'), gCt = sub('mando'), gMi = sub('espejo'), gCb = sub('cables_mangueras');
    // abrazadera de dos tornillos sobre un poste corto
    const zc = s*.075;
    gCl.add(rod(V(FT.x,FT.y+.012,zc),V(cx,y-.012,zc),.017,M.plastic,14));
    const cap = slab(.054,.036,.018,.008,M.plastic); cap.position.set(cx,y+.016,zc); gCl.add(cap);
    [-.017,.017].forEach(dx=>{ gCl.add(mesh(new THREE.CylinderGeometry(.0068,.0068,.008,6),M.alu,cx+dx,y+.029,zc)); gCl.add(mesh(new THREE.CylinderGeometry(.0028,.0028,.009,6),M.plastic,cx+dx,y+.0296,zc)); });
    // puño con nervaduras y contrapeso
    const grip = lathe([[0,0],[.017,0],[.019,.01],[.019,.1],[.016,.11],[0,.11]],M.rubber,24); axis(grip,at(-.1),at(.012)); gGr.add(grip);
    const q = new THREE.Quaternion().setFromUnitVectors(V(0,0,1), d);
    for (let i=0;i<7;i++){ const r = new THREE.Mesh(new THREE.TorusGeometry(.0193,.0017,6,24),M.rubber); r.position.copy(at(-.088+i*.0135)); r.quaternion.copy(q); gGr.add(finish(r)); }
    gGr.add(nm(rod(at(.008),at(.024),.0165,M.alu,16),'contrapeso'));
    // palanca corta de dos dedos: pivote adelante del manubrio, la hoja curva hacia el piloto
    const back = V(-1,0,0), Pv = at(-.125).add(V(.02,-.006,0));
    const bl = [Pv, Pv.clone().add(back.clone().multiplyScalar(.032)).add(d.clone().multiplyScalar(.018)).add(V(0,-.022,0)), Pv.clone().add(back.clone().multiplyScalar(.075)).add(d.clone().multiplyScalar(.05)).add(V(0,-.03,0)), Pv.clone().add(back.clone().multiplyScalar(.1)).add(d.clone().multiplyScalar(.08)).add(V(0,-.026,0))];
    gLe.add(curve(bl,.0058,M.alu,24)); gLe.add(mesh(new THREE.SphereGeometry(.0092,14,10),M.alu,bl[3].x,bl[3].y,bl[3].z));
    gLe.add(mesh(new THREE.CylinderGeometry(.0065,.0065,.014,12),M.alu,Pv.x,Pv.y,Pv.z)); // pivote
    // soporte de la palanca
    gLe.add(place(slab(.044,.036,.034,.011,M.plastic), at(-.125).add(V(.006,-.002,0))));
    if (s>0){
      // derecha: puño del acelerador, bomba de freno con depósito, mando de arranque
      gGr.add(nm(rod(at(-.098),at(-.07),.0235,M.plastic,18),'carcasa_acelerador'));
      const res = lathe([[0,0],[.0145,0],[.0155,.012],[.0155,.026],[0,.026]],M.plastic,20); res.position.copy(at(-.14).add(V(.006,.012,0))); res.name = 'deposito_freno'; gLe.add(res);
      gLe.add(mesh(new THREE.CylinderGeometry(.0158,.0158,.004,20),M.grey,res.position.x,res.position.y+.028,res.position.z));
      const cg = new THREE.Group(); cg.position.copy(at(-.2)); cg.rotation.y = th; gCt.add(cg);
      const cb = slab(.048,.05,.046,.012,M.plastic); cb.position.y = .002; cg.add(cb);
      cg.add(mesh(new THREE.BoxGeometry(.0065,.009,.032),M.grey,-.027,.012,0));                                  // balancín de paro
      cg.add(mesh(new THREE.CylinderGeometry(.0085,.0085,.006,14),M.redRing,-.027,-.009,0,0,0,Math.PI/2));       // arranque
      gCb.add(curve([at(-.2).add(V(.008,-.024,0)),at(-.2).add(V(.03,-.07,-s*.03)),V(FT.x+.01,FT.y+.03,s*.07),V(FT.x+.028,FT.y+.012,s*.05)],.0036,M.plastic,28));
      // manguera del freno hacia el caliper
      gCb.add(nm(curve([at(-.14).add(V(.012,-.014,0)),at(-.14).add(V(.03,-.07,-s*.02)),V(fp(.78).x+.02,fp(.78).y+.02,.11),V(fp(.62).x-.04,fp(.62).y,.1)],.0046,M.plastic,40),'manguera_freno'));
    } else {
      // izquierda: bloque de luces/direccionales/pito y cable del clutch
      const cg = new THREE.Group(); cg.position.copy(at(-.2)); cg.rotation.y = th; gCt.add(cg);
      const cb = slab(.048,.05,.046,.012,M.plastic); cb.position.y = .002; cg.add(cb);
      cg.add(mesh(new THREE.BoxGeometry(.006,.008,.03),M.grey,-.027,.012,0));                                    // direccionales
      [.011,-.011].forEach(dz=> cg.add(mesh(new THREE.CylinderGeometry(.0055,.0055,.005,12),M.alu,-.027,-.009,dz,0,0,Math.PI/2))); // pito y luz alta
      gLe.add(mesh(new THREE.CylinderGeometry(.0052,.0052,.022,10),M.alu,Pv.x+.014,Pv.y,Pv.z,0,0,Math.PI/2)); // regulador del cable
      gCb.add(nm(curve([Pv.clone().add(V(.02,-.004,0)),Pv.clone().add(V(.04,-.05,-s*.02)),V(fp(.62).x-.035,fp(.62).y+.01,s*.09),V(fp(.45).x-.05,fp(.45).y,s*.085),V(.2,.88,s*.09)],.0035,M.plastic,40),'cable_clutch'));
      gCb.add(curve([at(-.2).add(V(.008,-.024,0)),at(-.2).add(V(.03,-.07,-s*.03)),V(FT.x+.01,FT.y+.03,s*.07),V(FT.x+.028,FT.y+.012,s*.05)],.0036,M.plastic,28));
    }
    if (ends){
      const e0 = at(.012), e1 = e0.clone().add(V(-.007,.03,s*.045)), e2 = e1.clone().add(V(0,.012,s*.025));
      gMi.add(rod(e0,e1,.008,M.plastic,10)); gMi.add(rod(e1,e2,.008,M.plastic,10));
      const mh = lathe([[0,0],[.042,0],[.045,.01],[.043,.016],[0,.016]],M.plastic,40); axis(mh,e2,e2.clone().add(V(-.05,0,0))); gMi.add(mh);
      gMi.add(mesh(new THREE.CircleGeometry(.04,40),M.chrome,e2.x-.017,e2.y,e2.z,0,-Math.PI/2,0));
    } else {
      // espejos angulares negros que salen del soporte de la palanca
      const m0 = at(-.125).add(V(.0,.018,0)), m1 = m0.clone().add(V(-.014,.13,s*.05)), m2 = m1.clone().add(V(-.004,.032,s*.05));
      gMi.add(rod(m0,m1,.006,M.plastic,10)); gMi.add(rod(m1,m2,.006,M.plastic,10));
      const MIR = [[0,.022],[.028,-.006],[.15,-.006],[.172,.034],[.145,.074],[.022,.074]];
      const mb = facePanel(MIR.map(([u,v])=>[s*u,v]),.012,.004,M.plastic); mb.position.add(V(m2.x-.012, m2.y-.005, m2.z)); mb.name = 'espejo_carcasa'; gMi.add(mb);
      const mg = facePanel(MIR.map(([u,v])=>[s*(u*.86+.007),v*.8+.004]),.002,0,phong(0x40505c,1,0xffffff,250)); mg.position.add(V(m2.x-.024, m2.y-.005, m2.z)); mg.name = 'espejo_luna'; gMi.add(mg);
    }
  });
}
bar(man.stock, 1.02, .37, .08, M.alu, false, true);
bar(man.biker, .99, .4, .02, M.plastic, true);

/* ---- ASIENTO + COLÍN ---- */
const as = slot('asiento');
// puesto del piloto: costados camuflados, encima negro con costura y óvalo camuflado
as.stock.add(panel([[-.1,.83],[-.16,.82],[-.3,.79],[-.42,.795],[-.47,.815],[-.47,.78],[-.36,.75],[-.2,.75],[-.11,.77]],.2,.03,M.camo,0,0,0,true,6));
as.stock.add(panel([[-.1,.856],[-.16,.846],[-.3,.818],[-.42,.823],[-.46,.836],[-.45,.8],[-.3,.79],[-.15,.81]],.17,.016,M.seat,0,0,0,true,5));
const oval = mesh(new THREE.SphereGeometry(1,40,12),M.camo,-.29,.83,0); oval.scale.set(.1,.006,.05); oval.rotation.z = .04; as.stock.add(oval);
[-1,1].forEach(s=> as.stock.add(curve([V(-.11,.872,s*.1),V(-.2,.856,s*.102),V(-.3,.834,s*.102),V(-.43,.84,s*.1)],.0022,M.stitch,40)));
// puesto del pasajero más alto, termina en punta
as.stock.add(panel([[-.46,.79],[-.47,.845],[-.5,.862],[-.7,.875],[-.8,.87],[-.83,.85],[-.7,.83],[-.5,.805]],.17,.025,M.camo,0,0,0,true,6));
as.stock.add(panel([[-.47,.872],[-.5,.888],[-.7,.9],[-.79,.893],[-.78,.872],[-.5,.856]],.13,.014,M.seat,0,0,0,true,5));
[-1,1].forEach(s=> as.stock.add(curve([V(-.49,.903,s*.079),V(-.62,.912,s*.081),V(-.76,.908,s*.073)],.0022,M.stitch,30)));
// cola negra en punta + stop
as.stock.add(panel([[-.6,.845],[-.75,.905],[-.86,.965],[-.878,.95],[-.845,.905],[-.72,.845],[-.62,.815]],.12,.01,M.gloss,0,0,0,false,4));
as.stock.add(panel([[-.8,.9],[-.85,.925],[-.86,.895],[-.81,.87]],.1,.008,M.tail,0));
as.stock.add(glow(0xff2a12,.2,-.86,.905,0));
// manijas separadas tipo cuerno, negras
[-1,1].forEach(s=> as.stock.add(curve([V(-.5,.84,s*.125),V(-.62,.87,s*.13),V(-.74,.905,s*.122),V(-.82,.935,s*.095),V(-.85,.945,s*.07)],.013,M.gripRail,40)));
// altura de sillín de la ficha técnica: 780 mm
as.stock.position.y = -.045;
// monoplaza de cuero + colín pintado
as.biker.add(panel([[-.08,.855],[-.12,.89],[-.28,.872],[-.44,.882],[-.5,.9],[-.52,.87],[-.42,.83],[-.22,.805],[-.1,.81]],.2,.035,M.leather,0,0,0,true,6));
[-1,1].forEach(s=> as.biker.add(curve([V(-.12,.893,s*.128),V(-.28,.876,s*.129),V(-.44,.886,s*.129),V(-.5,.902,s*.124)],.0035,M.piping,40)));
for (let i=0;i<6;i++){ const st = slab(.003,.2,.002,.001,M.seat); st.position.set(-.16-i*.055,.907-i*.0012,0); as.biker.add(st); }
as.biker.add(panel([[-.5,.84],[-.52,.905],[-.58,.945],[-.7,.94],[-.79,.9],[-.81,.858],[-.72,.83],[-.58,.82]],.15,.038,M.paint,0,0,0,true,8));
as.biker.add(panel([[-.8,.866],[-.815,.866],[-.81,.85],[-.795,.85]],.16,.004,M.tail,0));
as.biker.add(glow(0xff2a12,.2,-.82,.858,0));
[-1,1].forEach(s=> as.biker.add(panel([[-.44,.8],[-.56,.83],[-.74,.83],[-.8,.82],[-.62,.79],[-.47,.765]],.012,.006,M.plastic,s*.085,s*.04)));

as.biker.position.y = -.05;

/* ---- COLA / PORTA PLACA ---- */
const cola = slot('cola');
// guardabarro trasero largo y facetado, como el tuyo: sostiene luz de placa, reflector, placa y direccionales
cola.stock.add(panel([[-.62,.785],[-.82,.795],[-.94,.75],[-.985,.67],[-.99,.56],[-.955,.525],[-.915,.56],[-.86,.64],[-.76,.71],[-.62,.74]],.13,.01,M.plastic,0,0,0,false,3));
{ const pts = []; for (let a=140;a<=194;a+=6){ const t = a*Math.PI/180; pts.push([XR+.372*Math.cos(t), RR+.372*Math.sin(t)]); }
  for (let a=194;a>=140;a-=6){ const t = a*Math.PI/180; pts.push([XR+.332*Math.cos(t), RR+.332*Math.sin(t)]); }
  cola.stock.add(panel(pts,.1,.008,M.plastic,0,0,0,false,3)); }
cola.stock.add(at(slab(.05,.1,.045,.01,M.plastic),-.985,.685,0));
cola.stock.add(mesh(new THREE.BoxGeometry(.004,.022,.085),std(0x5a0a06,.1,.3,{emissive:0x400000}),-1.006,.655,0));
const p1 = mesh(new THREE.PlaneGeometry(.2,.11),M.plate,-1.0,.585,0,0,-Math.PI/2,0); p1.rotateX(.18); cola.stock.add(p1);
cola.stock.add(mesh(new THREE.BoxGeometry(.004,.02,.1),M.cover,-.994,.518,0));
[-1,1].forEach(s=>{ cola.stock.add(indicator(V(-.965,.7,s*.055),V(-.975,.705,s*.135),.012)); });
cola.biker.add(curve([V(-.72,.8,0),V(-.78,.74,0),V(-.8,.69,0)],.012,M.plastic,20));
cola.biker.add(panel([[-.75,.715],[-.83,.72],[-.84,.66],[-.76,.66]],.05,.006,M.plastic,0,0,0,true,3));
const p2 = mesh(new THREE.PlaneGeometry(.15,.088),M.plate,-.845,.645,0,0,-Math.PI/2,0); p2.rotateX(.12); cola.biker.add(p2);
[-1,1].forEach(s=>{ cola.biker.add(rod(V(-.77,.72,s*.04),V(-.79,.72,s*.1),.006,M.plastic,8)); cola.biker.add(indicator(V(-.79,.72,s*.1),V(-.85,.72,s*.105),.009)); });

/* ---- EXHOSTO ---- */
const ex = slot('exhosto');
(function(){ // original: cuerpo cromado con protector y punta en gota
  const a = V(-.15,.215,.155), b = V(-.6,.43,.18), L = a.distanceTo(b);
  const g = new THREE.Group(); axis(g,a,b);
  g.add(lathe([[0,0],[.022,0],[.04,.04],[.068,.1],[.078,.16],[.08,.3],[.075,L-.04],[.06,L-.01],[0,L-.01]],M.exBlack,48));
  g.add(lathe([[.081,.1],[.087,.12],[.089,.3],[.085,.34]],M.chrome,48,.2,2.4));
  const tip = lathe([[0,0],[.06,0],[.062,.03],[.05,.06],[.03,.075],[0,.08]],M.chrome,40); tip.position.y = L-.02; g.add(tip);
  [-1,1].forEach(s=> g.add(mesh(new THREE.CircleGeometry(.015,20),M.plastic,s*.026,L+.045,.035,-Math.PI/2.6)));
  ex.stock.add(g);
})();
(function(){ // slip-on corto negro con punta de titanio
  const a = V(-.15,.215,.155), b = V(-.45,.47,.168), L = a.distanceTo(b);
  const g = new THREE.Group(); axis(g,a,b);
  g.add(lathe([[0,0],[.022,0],[.026,.03],[.042,.08],[.05,.12],[.052,L-.05],[0,L-.05]],M.exBlack,48));
  g.add(lathe([[.052,L-.05],[.056,L-.045],[.058,L],[.05,L],[.05,L-.05]],M.ti,48));
  g.add(lathe([[0,L-.03],[.046,L-.03],[.046,L-.005],[.024,L-.003],[.024,L+.01],[.02,L+.01],[.02,L-.01],[0,L-.01]],M.carbon,48));
  g.add(lathe([[0,.18],[.054,.18],[.054,.205],[0,.205]],M.ti,40));
  ex.biker.add(g);
})();

pieza();
/* ---- Puntos sobre la moto ---- */
const PINS = [
  {k:'faro', l:'Faro', p:V(.6,.9,.08), cam:{p:V(1.8,1.05,.9), t:V(.5,.86,0)}},
  {k:'manubrio', l:'Manubrio', p:V(.3,1.05,.35), cam:{p:V(.9,1.55,1.3), t:V(.35,1.0,0)}},
  {k:'asiento', l:'Asiento', p:V(-.3,.9,.08), cam:{p:V(-.3,1.45,1.6), t:V(-.4,.86,0)}},
  {k:'cola', l:'Cola', p:V(-.9,.68,.08), cam:{p:V(-1.9,1.05,1.0), t:V(-.8,.72,0)}},
  {k:'exhosto', l:'Exhosto', p:V(-.42,.34,.24), cam:{p:V(-.4,.55,1.7), t:V(-.35,.33,0)}},
  {k:'llantas', l:'Rines', p:V(XF,.2,.06), cam:{p:V(1.4,.55,1.35), t:V(.62,.32,0)}},
  {k:'pintura', l:'Pintura', p:V(.16,.92,.2), cam:{p:V(1.2,1.4,1.7), t:V(.1,.85,0)}},
];


/* =============== GARAJE: taller claro de techo alto =============== */
const turn = new THREE.Group(); turn.name = 'plataforma'; scene.add(turn);
scene.remove(bike); turn.add(bike);
const RW = 12, RD = 10, RH = 6, ZB = -4.5, ZF = 5.5, XL = -6, XR2 = 6;
let seed = 11; const rnd = ()=> (seed = (seed*9301+49297)%233280)/233280;
const SIGNS = [];
function sign(w,h,draw){ const t = canvasTex(w,h,draw); SIGNS.push([t,draw]); return t; }
function box(w,h,d,mat,x,y,z,ry){ const m = mesh(new THREE.BoxGeometry(w,h,d), mat, x,y,z, 0, ry||0, 0); scene.add(m); return m; }
function plane(w,h,mat,x,y,z,ry,rx){ const m = new THREE.Mesh(new THREE.PlaneGeometry(w,h), mat); m.position.set(x,y,z); m.rotation.set(rx||0, ry||0, 0, 'YXZ'); m.receiveShadow = true; scene.add(m); return m; }

// Materiales del taller
const wallTex = canvasTex(1024,1024,(g,w,h)=>{ g.fillStyle = '#ecebe6'; g.fillRect(0,0,w,h); for (let i=0;i<9000;i++){ g.fillStyle = rnd()<.5?'rgba(0,0,0,.025)':'rgba(255,255,255,.05)'; g.fillRect(rnd()*w,rnd()*h,2,2); }
  for (let i=0;i<10;i++){ const x = rnd()*w; const gr = g.createLinearGradient(0,h*.6,0,h); gr.addColorStop(0,'rgba(80,70,60,0)'); gr.addColorStop(1,'rgba(80,70,60,.10)'); g.fillStyle = gr; g.fillRect(x,h*.6,40+rnd()*120,h*.4); } });
wallTex.wrapS = wallTex.wrapT = THREE.RepeatWrapping; wallTex.repeat.set(2,1);
const wallM = std(0xffffff,0,.88,{map:wallTex});
const redM = std(0xc4291d,.05,.55);
const baseM = std(0x8f9296,.05,.75);
const colM = std(0x3d4744,.2,.6);
const steelM = phong(0x9aa0a8,.3,0xffffff,70);
const dkSteel = std(0x3b3e43,.45,.5);
const blueM = std(0x1f5fbf,.25,.4);
const orangeM = std(0xe35a17,.15,.45);
const chestM = std(0xb3231a,.35,.4);
const ledM = new THREE.MeshBasicMaterial({color:0xffffff, toneMapped:false});
const winM = new THREE.MeshBasicMaterial({color:0xe3ecf6, toneMapped:false});

scene.background = new THREE.Color(0xd9dbde); scene.fog = null;

// Piso pintado con reflejo suave
if (renderer){
  const refl = new THREE.Reflector(new THREE.PlaneGeometry(RW,RD), {clipBias:.003, textureWidth:1024, textureHeight:1024, color:0x777777});
  refl.rotation.x = -Math.PI/2; refl.position.z = (ZB+ZF)/2; scene.add(refl);
}
const floorTex = canvasTex(2048,1707,(g,w,h)=>{
  const sx = w/RW, sz = h/RD, X = (x)=> (x-XL)*sx, Z = (z)=> (z-ZB)*sz;
  g.fillStyle = 'rgba(58,60,63,.86)'; g.fillRect(0,0,w,h);
  for (let i=0;i<50000;i++){ g.fillStyle = rnd()<.5?`rgba(255,255,255,${rnd()*.04})`:`rgba(0,0,0,${rnd()*.1})`; g.fillRect(rnd()*w,rnd()*h,1+rnd()*3,1+rnd()*3); }
  g.strokeStyle = 'rgba(226,186,52,.95)'; g.lineWidth = 12;
  g.strokeRect(X(-1.9),Z(-1.9),X(2.2)-X(-1.9),Z(2.6)-Z(-1.9));      // bahía de la plataforma
  g.strokeRect(X(-4.9),Z(-2.0),X(-2.3)-X(-4.9),Z(1.9)-Z(-2.0));     // bahía del elevador
  g.fillStyle = 'rgba(20,20,22,.9)'; g.fillRect(X(-.6),Z(3.2),X(.6)-X(-.6),Z(3.6)-Z(3.2));
  g.strokeStyle = 'rgba(120,120,125,.9)'; g.lineWidth = 3; for (let x=X(-.6)+8;x<X(.6);x+=14){ g.beginPath(); g.moveTo(x,Z(3.2)+4); g.lineTo(x,Z(3.6)-4); g.stroke(); }
  for (let i=0;i<4;i++){ const cx = X(-5+rnd()*10), cz = Z(-3+rnd()*7); const gr = g.createRadialGradient(cx,cz,0,cx,cz,40+rnd()*50); gr.addColorStop(0,'rgba(0,0,0,.28)'); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(cx-100,cz-100,200,200); }
});
const floorTop = new THREE.Mesh(new THREE.PlaneGeometry(RW,RD), new THREE.MeshStandardMaterial({map:floorTex, transparent:true, roughness:.5, metalness:.1, depthWrite:false}));
floorTop.rotation.x = -Math.PI/2; floorTop.position.set(0,.002,(ZB+ZF)/2); scene.add(floorTop);
const shadowCatch = new THREE.Mesh(new THREE.PlaneGeometry(RW,RD), new THREE.ShadowMaterial({opacity:.38}));
shadowCatch.rotation.x = -Math.PI/2; shadowCatch.position.set(0,.004,(ZB+ZF)/2); shadowCatch.receiveShadow = true; scene.add(shadowCatch);

// Paredes: blanco arriba, franja roja y zócalo gris
function wallSet(len, cx, cz, ry){
  const n = V(Math.sin(ry),0,Math.cos(ry)).multiplyScalar(.01);
  plane(len,RH,wallM, cx,RH/2,cz, ry);
  plane(len,1.0,baseM, cx+n.x,.5,cz+n.z, ry);
  plane(len,.16,redM, cx+n.x*1.5,1.08,cz+n.z*1.5, ry);
}
wallSet(RW,0,ZB,0); wallSet(RW,0,ZF,Math.PI); wallSet(RD,XL,(ZB+ZF)/2,Math.PI/2); wallSet(RD,XR2,(ZB+ZF)/2,-Math.PI/2);
[[XL+.15,ZB+.15],[XR2-.15,ZB+.15],[XL+.15,ZF-.15],[XR2-.15,ZF-.15],[XL+.15,.5],[XR2-.15,.5]].forEach(([x,z])=> box(.3,RH,.3,colM,x,RH/2,z));
plane(RW,RD,std(0xcfd2d6,0,.9), 0,RH,(ZB+ZF)/2, 0, Math.PI/2);

// Ventanas altas (entra luz de día)
function windowRow(n, len, cx, cz, ry, y){
  const dir = V(Math.cos(ry),0,-Math.sin(ry)), nrm = V(Math.sin(ry),0,Math.cos(ry));
  for (let i=0;i<n;i++){ const off = (i-(n-1)/2)*(len/n); const p = V(cx,0,cz).add(dir.clone().multiplyScalar(off)).add(nrm.clone().multiplyScalar(.02));
    plane(1.5,.62,winM, p.x,y,p.z, ry);
    const fr = new THREE.Group(); fr.position.set(p.x,y,p.z); fr.rotation.y = ry; scene.add(fr);
    [[1.6,.05,0,.33],[1.6,.05,0,-.33],[.05,.7,-.78,0],[.05,.7,.78,0],[.04,.66,-.26,0],[.04,.66,.26,0]].forEach(([w,h,x,y2])=> fr.add(mesh(new THREE.BoxGeometry(w,h,.06), dkSteel, x,y2,.02)));
  }
}
windowRow(4,10,0,ZB,0,4.95); windowRow(3,8,XL,.5,Math.PI/2,4.95); windowRow(3,8,XR2,.5,-Math.PI/2,4.95);

// Techo: claraboyas y cerchas metálicas
[[-1.2],[1.2]].forEach(([z])=>{ const p = new THREE.Mesh(new THREE.BoxGeometry(9,.04,.9), ledM); p.position.set(0,RH-.03,z); scene.add(p); box(9.2,.1,1.05,dkSteel,0,RH-.06,z); });
function truss(z){
  const y0 = 5.05, y1 = 5.75;
  box(RW-.4,.1,.12,steelM,0,y0,z); box(RW-.4,.1,.12,steelM,0,y1,z);
  for (let x=XL+.4;x<=XR2-.4+1e-6;x+=.8){ box(.05,y1-y0,.06,steelM,x,(y0+y1)/2,z); if (x+.8<=XR2-.4+1e-6) scene.add(rod(V(x,y0,z),V(x+.8,y1,z),.025,steelM,6)); }
}
[-2.6,.8,4.1].forEach(truss);

// Mezzanine al fondo con baranda, avisos y escalera
const MZ = 2.8, MD = 2.2, MZF = ZB+MD;
box(RW-.6,.16,MD,dkSteel,0,MZ,ZB+MD/2);
box(RW-.6,.3,.08,std(0x23262a,.3,.6),0,MZ-.07,MZF+.02);
[-4.1,-1.2,1.8,4.6].forEach(x=> box(.14,MZ,.14,dkSteel,x,MZ/2,MZF-.08));
for (let x=XL+.4;x<=XR2-.4;x+=1.0) scene.add(rod(V(x,MZ+.08,MZF-.05),V(x,MZ+1.08,MZF-.05),.02,steelM,8));
[1.06,.6].forEach(h=> scene.add(rod(V(XL+.4,MZ+h,MZF-.05),V(XR2-.4,MZ+h,MZF-.05),.022,steelM,8)));
const bannerTex = sign(4096,240,(g,w,h)=>{
  const P = [['#111111','#F2C230','LLANTAS 17"'],['#F2F0EA','#111111','MOTOPARTES'],['#F2C230','#111111','ACEITE 4T'],['#111111','#F2F0EA','FRENOS · SUSPENSIÓN'],['#C4291D','#F2F0EA','GARAJE BOG']];
  const pw = w/P.length;
  P.forEach(([bg,fg,t],i)=>{ g.fillStyle = bg; g.fillRect(i*pw+6,8,pw-12,h-16); g.fillStyle = fg; g.font = '800 italic 150px "Saira Extra Condensed", "Arial Narrow", Impact, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t, i*pw+pw/2, h/2+8, pw-60); });
});
plane(RW-.8,.42,std(0xffffff,0,.6,{map:bannerTex}), 0,MZ-.42,MZF+.07, 0);
const tunTex = sign(1200,360,(g,w,h)=>{ g.fillStyle = '#16171a'; g.fillRect(0,0,w,h); g.strokeStyle = '#F2F0EA'; g.lineWidth = 10; g.strokeRect(18,18,w-36,h-36); g.fillStyle = '#F2F0EA'; g.font = '800 italic 230px "Saira Extra Condensed", "Arial Narrow", Impact, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('TUNING', w/2, h/2+10); });
plane(2.2,.66,std(0xffffff,0,.6,{map:tunTex}), -1.4,4.05,ZB+.02, 0);
// estantería, llantas y gabinete arriba
function shelf(x){ const g = new THREE.Group(); g.position.set(x,MZ+.08,ZB+.35); scene.add(g); [-.7,.7].forEach(dx=>{ g.add(mesh(new THREE.BoxGeometry(.04,1.6,.04), dkSteel, dx,.8,-.2)); g.add(mesh(new THREE.BoxGeometry(.04,1.6,.04), dkSteel, dx,.8,.2)); });
  [.3,.85,1.4].forEach(y=> g.add(mesh(new THREE.BoxGeometry(1.44,.03,.45), steelM, 0,y,0)));
  [[-.4,.36,.18,.2,0xd8c9a0],[.2,.36,.3,.2,0x8a6a44],[-.3,.91,.4,.16,0xF2C230],[.35,.93,.2,.22,0xc4291d],[0,1.46,.6,.12,0x5a5e64]].forEach(([dx,y,w,h,c])=> g.add(mesh(new THREE.BoxGeometry(w,h,.3), std(c,.1,.7), dx,y+h/2,0))); }
shelf(-4.4); shelf(3.0);
const rubberM = std(0x121212,0,.9);
function tire(x,y,z){ scene.add(mesh(new THREE.TorusGeometry(.27,.1,16,40), rubberM, x,y,z, Math.PI/2)); }
[0,1,2,3].forEach(i=> tire(-1.0,MZ+.18+i*.2,ZB+.5)); [0,1,2].forEach(i=> tire(-.3,MZ+.18+i*.2,ZB+.55));
function chest(x,y,z,w,h,ry){ const g = new THREE.Group(); g.position.set(x,y,z); g.rotation.y = ry||0; scene.add(g); g.add(mesh(new THREE.BoxGeometry(w,h,.55), chestM, 0,h/2+.06,0));
  const n = Math.max(3, Math.round(h/.14)); for (let i=0;i<n;i++){ const yy = .12+i*(h-.08)/n; g.add(mesh(new THREE.BoxGeometry(w-.06,.006,.01), std(0x111111,0,.6), 0,yy,.28)); g.add(mesh(new THREE.BoxGeometry(w*.35,.022,.03), steelM, 0,yy+.05,.29)); }
  g.add(mesh(new THREE.BoxGeometry(w,.04,.56), steelM, 0,h+.08,0)); [-1,1].forEach(sx=> [-1,1].forEach(sz=> g.add(mesh(new THREE.CylinderGeometry(.035,.035,.06,10), rubberM, sx*(w/2-.08),.03,sz*.2)))); return g; }
chest(1.4,MZ+.08,ZB+.4,1.2,.9);
// escalera por la pared izquierda
const SX0 = XL+.35, SX1 = XL+1.35, nSteps = 15, run = 3.6, zTop = MZF, zBot = MZF+run;
for (let i=0;i<nSteps;i++){ const y = (i+1)*MZ/nSteps, z = zBot - (i+.5)*run/nSteps; box(SX1-SX0-.06,.04,run/nSteps+.02,steelM,(SX0+SX1)/2,y,z); }
[SX0,SX1].forEach(x=>{ scene.add(rod(V(x,0,zBot),V(x,MZ,zTop),.04,dkSteel,6)); scene.add(rod(V(x,.95,zBot+.1),V(x,MZ+.95,zTop),.02,steelM,8)); [0,.5,1].forEach(t=>{ const z = zBot - t*run, y = t*MZ; scene.add(rod(V(x,y,z),V(x,y+.95,z),.018,steelM,6)); }); });

// Elevador azul de dos columnas
const LX = -3.6;
[-1,1].forEach(s=>{ const x = LX + s*1.05; box(.26,2.5,.3,blueM,x,1.25,-.4); box(.5,.04,.5,blueM,x,.02,-.4); box(.16,.08,.14,dkSteel,x,1.0,-.4);
  scene.add(mesh(new THREE.BoxGeometry(.9,.06,.1), blueM, x - s*.45, .5, -.05, 0, s*.5, 0)); scene.add(mesh(new THREE.BoxGeometry(.9,.06,.1), blueM, x - s*.45, .5, -.75, 0, -s*.5, 0)); });
box(2.36,.12,.2,blueM,LX,2.56,-.4);
scene.add(curve([V(LX-1.05,2.5,-.25),V(LX,2.3,-.2),V(LX+1.05,2.5,-.25)],.012,std(0x1a1a1a,0,.6),20));
// compresor naranja
(function(){ const g = new THREE.Group(); g.position.set(-5.0,0,2.4); g.rotation.y = .3; scene.add(g);
  const tank = mesh(new THREE.CylinderGeometry(.18,.18,.7,24), orangeM, 0,.28,0, 0,0,Math.PI/2); g.add(tank);
  g.add(mesh(new THREE.BoxGeometry(.32,.22,.24), std(0x4fa6c8,.2,.5), -.05,.56,0)); g.add(mesh(new THREE.CylinderGeometry(.06,.06,.06,16), steelM, .2,.5,0, Math.PI/2));
  [-.25,.25].forEach(x=> g.add(mesh(new THREE.CylinderGeometry(.06,.06,.04,16), rubberM, x,.06,.17, Math.PI/2)));
  g.add(curve([V(.3,.5,0),V(.6,.3,.2),V(.9,.05,.4),V(1.3,.02,.2)],.012,std(0x2e6fd0,.1,.5),30)); })();
// recogedor de aceite
(function(){ const g = new THREE.Group(); g.position.set(-2.1,0,1.6); scene.add(g);
  g.add(mesh(new THREE.CylinderGeometry(.2,.2,.62,24), orangeM, 0,.42,0)); g.add(mesh(new THREE.CylinderGeometry(.04,.04,.9,12), orangeM, 0,1.18,0));
  g.add(mesh(new THREE.CylinderGeometry(.24,.06,.18,24,1,true), orangeM, 0,1.68,0)); [-.15,.15].forEach(x=> g.add(mesh(new THREE.CylinderGeometry(.05,.05,.04,12), rubberM, x,.05,.12, Math.PI/2))); })();
// cilindro de gas, extintores, aviso de no fumar, rejilla
scene.add(mesh(new THREE.CylinderGeometry(.12,.12,1.3,20), std(0xf2f2ee,.2,.4), XL+.4,.65,3.6)); scene.add(mesh(new THREE.SphereGeometry(.12,16,10,0,Math.PI*2,0,Math.PI/2), std(0xf2f2ee,.2,.4), XL+.4,1.3,3.6)); scene.add(mesh(new THREE.CylinderGeometry(.03,.03,.1,10), std(0x3fb7c9,.3,.4), XL+.4,1.45,3.6));
function extinguisher(x,z,ry){ const g = new THREE.Group(); g.position.set(x,1.25,z); g.rotation.y = ry; scene.add(g); g.add(mesh(new THREE.CylinderGeometry(.075,.075,.42,16), redM, 0,0,.1)); g.add(mesh(new THREE.CylinderGeometry(.02,.03,.08,10), dkSteel, 0,.25,.1)); }
extinguisher(XL+.02,-1.6,Math.PI/2); extinguisher(XR2-.02,-1.0,-Math.PI/2); extinguisher(-2.0,ZB+.02,0);
const noTex = sign(400,520,(g,w,h)=>{ g.fillStyle = '#f7f6f2'; g.fillRect(0,0,w,h); g.strokeStyle = '#c4291d'; g.lineWidth = 34; g.beginPath(); g.arc(w/2,190,140,0,Math.PI*2); g.stroke();
  g.fillStyle = '#222'; g.fillRect(110,175,170,32); g.fillStyle = '#c96'; g.fillRect(270,175,26,32); g.beginPath(); g.moveTo(w/2-99,91); g.lineTo(w/2+99,289); g.stroke();
  g.fillStyle = '#c4291d'; g.fillRect(20,370,w-40,130); g.fillStyle = '#fff'; g.font = '700 58px "Barlow", sans-serif'; g.textAlign = 'center'; g.fillText('NO FUMAR', w/2, 455); });
plane(.4,.52,std(0xffffff,0,.7,{map:noTex}), XL+.02,1.9,-.6, Math.PI/2);
const ventTex = canvasTex(256,256,(g,w,h)=>{ g.fillStyle = '#b9bcc0'; g.fillRect(0,0,w,h); for (let y=12;y<h-8;y+=16){ g.fillStyle = '#6f7378'; g.fillRect(14,y,w-28,7); } });
plane(.7,.7,std(0xffffff,.4,.5,{map:ventTex}), XL+.02,3.6,1.6, Math.PI/2);
// avisos altos en las paredes laterales
const repTex = sign(300,1200,(g,w,h)=>{ g.fillStyle = '#E35A17'; g.fillRect(0,0,w,h); g.save(); g.translate(w/2,h/2); g.rotate(-Math.PI/2); g.fillStyle = '#111'; g.font = '800 italic 190px "Saira Extra Condensed", "Arial Narrow", Impact, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('REPUESTOS', 0, 10); g.restore(); });
plane(.5,2.0,std(0xffffff,0,.6,{map:repTex}), XL+.03,3.2,-3.4, Math.PI/2);
const serTex = sign(800,800,(g,w,h)=>{ g.fillStyle = '#F2F0EA'; g.fillRect(0,0,w,h); g.fillStyle = '#C4291D'; g.beginPath(); g.arc(w/2,h/2-40,250,0,Math.PI*2); g.fill(); g.fillStyle = '#F2F0EA'; g.font = '800 italic 190px "Saira Extra Condensed", "Arial Narrow", Impact, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('MOTO', w/2, h/2-40); g.fillStyle = '#111'; g.font = '700 90px "Barlow", sans-serif'; g.fillText('SERVICIO', w/2, h-80); });
plane(1.1,1.1,std(0xffffff,0,.6,{map:serTex}), XR2-.03,3.6,-2.6, -Math.PI/2);

// Bancos de herramientas rojos bajo el mezzanine, llantas y canecas
chest(.9,0,ZB+.4,1.3,1.0); chest(2.4,0,ZB+.4,1.1,.85); chest(-5.3,0,ZB+1.3,.9,.8,Math.PI/2);
[0,1,2].forEach(i=> tire(-.6,.1+i*.2,ZB+.55)); [0,1].forEach(i=> tire(-2.6,.1+i*.2,ZB+.5)); scene.add(mesh(new THREE.TorusGeometry(.27,.1,16,40), rubberM, -2.3,.36,ZB+.25));
function drum(x,z,c){ scene.add(mesh(new THREE.CylinderGeometry(.29,.29,.88,32), std(c,.3,.5), x,.44,z)); [.1,.44,.78].forEach(y=> scene.add(mesh(new THREE.TorusGeometry(.292,.012,6,32), std(c,.3,.45), x,y,z,Math.PI/2))); }
drum(5.2,3.9,0xe1c22a); drum(4.6,4.3,0xe1c22a); drum(5.3,-3.6,0x2a2c30);
box(.5,.4,.4,std(0xd8c9a0,0,.8),4.6,.2,3.7);
// cortina metálica en la pared derecha
const shutterTex = canvasTex(256,512,(g,w,h)=>{ for (let y=0;y<h;y+=16){ const gr = g.createLinearGradient(0,y,0,y+16); gr.addColorStop(0,'#6b7076'); gr.addColorStop(.5,'#a3a8ae'); gr.addColorStop(1,'#4a4e54'); g.fillStyle = gr; g.fillRect(0,y,w,16); } });
shutterTex.wrapS = shutterTex.wrapT = THREE.RepeatWrapping; shutterTex.repeat.set(4,3);
plane(3.2,3.1,phong(0xffffff,.25,0xaaaaaa,40,{map:shutterTex}), XR2-.03,1.55,1.5, -Math.PI/2);
box(.3,.35,3.5,dkSteel,XR2-.16,3.25,1.5); [-.1,3.1].forEach(dz=> box(.12,3.1,.12,dkSteel,XR2-.07,1.55,1.5-1.6+dz));
// letrero GARAJE (luz cálida) sobre la cortina
const neonDraw = (g,w,h)=>{ g.clearRect(0,0,w,h); g.fillStyle = '#16171a'; g.fillRect(0,0,w,h); g.font = '800 italic 200px "Saira Extra Condensed", "Arial Narrow", Impact, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = '#FF5B1F'; g.shadowBlur = 30; g.fillStyle = '#FFB089'; g.fillText('GARAJE', w/2, h/2+8); g.shadowBlur = 0; g.fillStyle = '#FFE6D8'; g.fillText('GARAJE', w/2, h/2+8); };
const neonTex = sign(1200,300,neonDraw);
plane(2.4,.6,new THREE.MeshBasicMaterial({map:neonTex, toneMapped:false}), XR2-.04,4.0,1.5, -Math.PI/2);

// Plataforma giratoria
const plat = mesh(new THREE.CylinderGeometry(1.55,1.6,.07,96), phong(0x2a2d32,.3,0x999999,90), 0,.035,0); turn.add(plat);
const ringM = new THREE.MeshBasicMaterial({color:0xff5b1f, toneMapped:false});
const ring = new THREE.Mesh(new THREE.TorusGeometry(1.585,.012,8,160), ringM); ring.rotation.x = Math.PI/2; ring.position.y = .07; scene.add(ring);
bike.position.y = .07;

// Iluminación de taller claro
lights.hemi = new THREE.HemisphereLight(0xffffff, 0x8a8580, .85); scene.add(lights.hemi);
lights.rimL = new THREE.DirectionalLight(0xfff6ea, .9); lights.rimL.position.set(1.5,6,1.2); lights.rimL.target.position.set(0,.5,0); scene.add(lights.rimL, lights.rimL.target);
lights.rimL.castShadow = true; lights.rimL.shadow.mapSize.set(2048,2048); Object.assign(lights.rimL.shadow.camera,{left:-2.5,right:2.5,top:2.5,bottom:-2.5,near:1,far:12}); lights.rimL.shadow.bias = -.0004;
function spot(x,y,z,i){ const s = new THREE.SpotLight(0xfff4e8, i, 14, .7, .8, 1.2); s.position.set(x,y,z); s.target.position.set(0,.5,0); scene.add(s, s.target); return s; }
lights.spots = [spot(0,RH-.2,2.4,.9), spot(-2,RH-.2,-1.2,.6), spot(2.2,RH-.2,-1.2,.6)];
lights.lamps = [[-3.5,1.5],[3.5,1.5],[0,4]].map(([x,z])=>{ const p = new THREE.PointLight(0xfff1e0,.35,9,2); p.position.set(x,4.6,z); scene.add(p); return p; });
lights.neon = new THREE.PointLight(0xff6a2a,.5,5,2); lights.neon.position.set(XR2-.6,3.9,1.5); scene.add(lights.neon);
lights.ring = new THREE.PointLight(0xff5b1f,.25,3,2); lights.ring.position.set(0,.25,0); scene.add(lights.ring);


/* =============== ESTADO =============== */
let tt = null;
function toast(t){ ui.toast = {t, id: Date.now()}; emit(); clearTimeout(tt); tt = setTimeout(()=>{ ui.toast = null; emit(); }, 2400); }
/* ---- Catálogo: marcas y modelos que se venden en Colombia ---- */
const TOP = {'akt-nkd-125':1,'yamaha-nmax-155':2,'bajaj-ct100':3,'honda-xr-190l':4,'yamaha-xtz-150':6};
const CAT = [
  ['AKT',[['NKD 125','125','Urbana'],['CR4 125','125','Urbana'],['TT DS 200','200','Doble propósito']]],
  ['Bajaj',[['Boxer CT100','100','Urbana','bajaj-ct100'],['CT125','125','Urbana'],['Pulsar N125','125','Naked'],['Pulsar NS 160','160','Naked'],['Pulsar NS 200','200','Naked'],['Pulsar N250','250','Naked'],['Dominar 400','373','Touring']]],
  ['Suzuki',[['Gixxer 150','155','Naked'],['Gixxer 250','249','Naked'],['GN 125','125','Urbana'],['DR 150','150','Doble propósito'],['V-Strom 160','160','Doble propósito']]],
  ['Honda',[['XR 190L','184','Doble propósito'],['XR 150L','150','Doble propósito'],['CB 125F','125','Urbana'],['CB 190R','184','Naked'],['XRE 300','286','Doble propósito']]],
  ['Yamaha',[['NMAX 155','155','Scooter'],['XTZ 150','149','Doble propósito'],['XTZ 250','249','Doble propósito'],['FZ 2.0 (FZN 150)','149','Naked'],['T115 Crypton','115','Urbana'],['YBR 125','125','Urbana'],['MT-03','321','Naked'],['R15','155','Deportiva']]],
  ['Hero',[['Hunk 125 R','125','Naked'],['Hunk 160 4V','160','Naked'],['Xpulse 200','200','Doble propósito']]],
  ['TVS',[['Raider 125','125','Urbana'],['Apache RTR 160 4V','160','Naked'],['Apache RTR 200 4V','200','Naked']]],
  ['Victory',[['MRX 150','150','Doble propósito']]],
  ['KTM',[['Duke 200','200','Naked'],['Duke 390','373','Naked']]],
  ['Royal Enfield',[['Classic 350','349','Clásica'],['Himalayan','411','Doble propósito']]],
];
const slug = (t)=> t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const MODELS = [];
CAT.forEach(([b,list])=> list.forEach(([m,cc,kind,id])=>{ const k = id || slug(b+' '+m); MODELS.push({id:k, brand:b, model:m, cc, kind, top:TOP[k]||0}); }));
const GIX = 'suzuki-gixxer-150';
const TYPES = ['Todas','Urbana','Naked','Doble propósito','Scooter','Deportiva','Touring','Clásica'];

/* ---- Pintura por zonas ---- */
const FIN = {brillante:['Brillante',.15,.25,80], mate:['Mate',.05,.85,6], metalico:['Metálico',.6,.3,120], perlado:['Perlado',.35,.18,150], cromado:['Cromado',.7,.12,240]};
const SWATCH = ['#121214','#3a3d43','#80858a','#b9bdc2','#eceae4','#6e4224','#b5652f','#c9a227','#c8b48a','#4b5634','#c1201a','#e2621a','#f2c230','#2f6fe0','#1c2a4a','#5b2c83','#d63a8c','#2fb6a8'];
const HAND_ZONES = [
  {k:'tanque', n:'Tanque y guardabarros', mats:[M.paint], hex:'#6e4224', fin:'metalico'},
  {k:'flancos', n:'Flancos y farola', mats:[M.accent], hex:'#6e4224', fin:'metalico'},
  {k:'rines', n:'Rines', mats:[M.rim], hex:'#0f0f10', fin:'brillante'},
  {k:'chasis', n:'Chasis y tijera', mats:[M.frame], hex:'#131315', fin:'mate'},
  {k:'calipers', n:'Calipers', mats:[M.gold], hex:'#c4921f', fin:'metalico'},
  {k:'resorte', n:'Resorte del amortiguador', mats:[M.spring], hex:'#c41e1e', fin:'brillante'},
];
const COMBOS = {
  bronce:{n:'Bronce de fábrica', z:{tanque:['#6e4224','metalico'], flancos:['#6e4224','metalico'], rines:['#0f0f10','brillante']}, decal:{line:'#d22a1f', band:'#c8261c', cream:'#e6d3a4'}},
  negro:{n:'Negro mate + bronce', z:{tanque:['#151516','mate'], flancos:['#9c6532','metalico'], rines:['#9c6532','metalico']}, decal:{line:'#b07a42', band:'#8a5a2c', cream:'#d9b88a'}},
  nardo:{n:'Gris nardo + naranja', z:{tanque:['#80858a','brillante'], flancos:['#161617','brillante'], rines:['#141414','brillante']}, decal:{line:'#e2621a', band:'#d2561a', cream:'#f0ece6'}},
};
function setFinish(m, hex, f){
  const F = FIN[f]; m.color.set(hex);
  if (m.isMeshStandardMaterial){ m.metalness = F[1]; m.roughness = F[2]; }
  else if (m.isMeshPhongMaterial){ m.shininess = F[3]; if (m.envMap) m.reflectivity = f==='cromado' ? .85 : (f==='mate' ? .02 : .25); }
  m.needsUpdate = true;
}

/* ---- Piezas (solo en el modelo de prueba) y accesorios ---- */
const PARTS = [
  {k:'llantas', n:'Rines y llantas', o:[['Tapas con llamas','Las que trae ahora.'],['Radios + semitaco','Sin tapas y llanta doble propósito, misma medida.']]},
  {k:'exhosto', n:'Exhosto', o:[['Original cromado','Con protector y punta en gota.'],['Slip-on corto','Negro, punta de titanio y db-killer removible.']]},
  {k:'faro', n:'Farola', o:[['Farola original','En punta, con visera.'],['Redonda LED 7"','Con halo de día, luz alta y baja.']]},
  {k:'manubrio', n:'Manubrio', o:[['Tubular + espejos hexagonales','El de fábrica.'],['Drag bar + espejos de punta','Más plano y ancho.']]},
  {k:'asiento', n:'Sillín', o:[['Doble camuflado','El que trae.'],['Monoplaza en cuero','Cuero café con colín pintado.']]},
  {k:'cola', n:'Cola', o:[['Guardabarros largo','El de fábrica.'],['Cola corta (tail tidy)','Porta placa corto, placa visible.']]},
];
const ACCS = [
  {k:'baul', n:'Baúl trasero', d:'Para el casco y el impermeable, con parrilla.', tag:'El más pedido'},
  {k:'sliders', n:'Sliders de motor', d:'Protegen el motor y las tapas en una caída.', tag:'Seguridad'},
  {k:'exploradoras', n:'Exploradoras LED', d:'Dos luces auxiliares en las barras.', tag:'Revisar norma'},
  {k:'protectores', n:'Protectores de manos', d:'Cuidan las manos y las maniguetas del viento y las caídas.', tag:'Seguridad'},
  {k:'celular', n:'Porta celular', d:'Soporte en el manubrio para el GPS.', tag:'Domiciliarios'},
];
const ACC = {};
function accG(k){ const g = new THREE.Group(); g.name = 'acc_'+k; g.visible = false; bike.add(g); ACC[k] = g; return g; }
(function(){
  const g = accG('baul');
  g.add(at(slab(.3,.26,.015,.02,M.alu),-.76,.955,0));
  [-1,1].forEach(s=> g.add(rod(V(-.6,.84,s*.1),V(-.72,.95,s*.11),.008,M.alu,8)));
  g.add(at(slab(.4,.36,.2,.07,M.plastic),-.78,1.07,0));
  g.add(at(slab(.41,.37,.09,.07,M.gloss),-.78,1.2,0));
  g.add(mesh(new THREE.BoxGeometry(.006,.03,.2), M.tail, -.985,1.08,0));
})();
(function(){ const g = accG('sliders'); [-1,1].forEach(s=>{ g.add(mesh(new THREE.CylinderGeometry(.03,.034,.09,20), M.plastic, .13,.5,s*.205, Math.PI/2)); g.add(mesh(new THREE.CylinderGeometry(.022,.022,.03,16), M.alu, .13,.5,s*.15, Math.PI/2)); }); })();
(function(){ const g = accG('exploradoras'); [-1,1].forEach(s=>{
  g.add(mesh(new THREE.CylinderGeometry(.034,.03,.07,20), M.plastic, .56,.62,s*.16, 0,0,Math.PI/2));
  g.add(mesh(new THREE.CircleGeometry(.029,24), M.lens, .596,.62,s*.16, 0,Math.PI/2,0));
  g.add(rod(V(.52,.62,s*.1),V(.54,.62,s*.15),.007,M.alu,8));
  const gl = glow(0xfff1dd,.14,.62,.62,s*.16); g.add(gl); }); })();
(function(){ const g = accG('protectores'); const cx = FT.x-.005, y = 1.02, half = .37, sw = .08;
  [-1,1].forEach(s=>{ g.add(mesh(new THREE.BoxGeometry(.014,.075,.15), M.gloss, cx-sw+.075, y+.03, s*(half-.05), 0, s*.25, 0)); g.add(mesh(new THREE.BoxGeometry(.016,.02,.15), std(0xe35a17,.1,.5), cx-sw+.078, y+.075, s*(half-.05), 0, s*.25, 0)); }); })();
(function(){ const g = accG('celular'); const x = FT.x-.03;
  g.add(mesh(new THREE.CylinderGeometry(.012,.012,.06,10), M.alu, x,1.06,0));
  const ph = new THREE.Group(); ph.position.set(x-.01,1.15,0); ph.rotation.z = -.4; g.add(ph);
  ph.add(mesh(new THREE.BoxGeometry(.012,.16,.082), M.plastic)); ph.add(mesh(new THREE.PlaneGeometry(.07,.14), M.lcd, -.007,0,0, 0,-Math.PI/2,0)); })();

/* ---- Estado ---- */
const st = {tab:'moto', model:GIX, q:'', type:'Todas', brand:'Todas', zone:'tanque', combo:'bronce',
  paint:{}, parts:{faro:'stock',manubrio:'stock',asiento:'stock',cola:'stock',exhosto:'stock',llantas:'stock'}, acc:{},
  design:'franjas', dsize:.18, drot:0, placing:false, showOrig:false};
HAND_ZONES.forEach(z=> st.paint[z.k] = [z.hex, z.fin]);
let night = false;
const loaded = {};          // modelo -> Object3D cargado desde .glb
const zoneMap = {};        // modelo -> zonas (materiales) del .glb
const decals = [];

function curModel(){ return MODELS.find(m=> m.id===st.model); }
function activeObj(){ return loaded[st.model] || (st.model===GIX ? bike : null); }
function isHand(){ return !loaded[st.model] && st.model===GIX; }
function zones(){ return isHand() ? HAND_ZONES : (zoneMap[st.model]||[]); }
let builds = [], likes = {}, communityReady = false, me = null;

function applyAll(){
  Object.values(loaded).forEach(o=> o.visible = false);
  bike.visible = false;
  const obj = activeObj(); if (obj) obj.visible = true;
  const hand = isHand(), O = st.showOrig;
  Object.entries(slots).forEach(([k,s])=>{ const b = hand && !O && st.parts[k]==='biker'; s.biker.visible = b; s.stock.visible = !b; });
  Object.entries(ACC).forEach(([k,g])=> g.visible = hand && !O && !!st.acc[k]);
  zones().forEach(z=>{ const [hex,f] = O ? [z.hex,z.fin] : (st.paint[z.k] || [z.hex,z.fin]); z.mats.forEach(m=> setFinish(m,hex,f)); });
  decals.forEach(d=> d.visible = !O && d.userData.model===st.model);
  if (lights.beam) lights.beam.intensity = hand && !O && st.parts.faro==='biker' ? (night ? 2.6 : .6) : 0;
}
function render(){ applyAll(); emit(); }
function changes(){
  const out = [];
  if (!activeObj()) return out;
  zones().forEach(z=>{ const p = st.paint[z.k]; if (p && (p[0].toLowerCase()!==z.hex.toLowerCase() || p[1]!==z.fin)) out.push('Pintura · '+z.n); });
  const nd = decals.filter(d=> d.userData.model===st.model).length; if (nd) out.push(nd===1 ? '1 diseño' : nd+' diseños');
  if (isHand()){ PARTS.forEach(p=>{ if (st.parts[p.k]==='biker') out.push(p.o[1][0]); }); ACCS.forEach(a=>{ if (st.acc[a.k]) out.push(a.n); }); }
  return out;
}
const TABS = [
  {k:'moto', n:'Tu moto'},
  {k:'pintura', n:'Pintura'},
  {k:'disenos', n:'Diseños'},
  {k:'piezas', n:'Piezas'},
  {k:'accesorios', n:'Accesorios'},
  {k:'revision', n:'Tecnomecánica'},
  {k:'parche', n:'El parche'},
];
function tabSub(k){
  const m = curModel();
  if (k==='moto') return m.brand+' '+m.model;
  if (k==='parche') return builds.length ? builds.length+(builds.length===1?' build publicado':' builds publicados') : 'Builds de la comunidad';
  if (!activeObj()) return 'Primero carga la moto';
  if (k==='pintura'){ const n = changes().filter(t=> t.startsWith('Pintura')).length; return n ? n+(n===1?' zona pintada':' zonas pintadas') : 'De fábrica'; }
  if (k==='disenos'){ const n = decals.filter(d=> d.userData.model===st.model).length; return n ? n+(n===1?' diseño':' diseños') : 'Sin diseños'; }
  if (k==='piezas'){ if (!isHand()) return 'Pronto en tu escaneo'; const n = PARTS.filter(p=> st.parts[p.k]==='biker').length; return n ? n+(n===1?' pieza nueva':' piezas nuevas') : 'De fábrica'; }
  if (k==='revision'){ const rv = revSummary(); return rv ? rv.txt : 'Primero carga la moto'; }
  if (k==='accesorios'){ if (!isHand()) return 'Pronto en tu escaneo'; const n = ACCS.filter(a=> st.acc[a.k]).length; return n ? n+(n===1?' accesorio':' accesorios') : 'Ninguno'; }
}
function tabMod(k){
  if (k==='revision'){ const rv = revSummary(); return !!(rv && rv.w); }
  if (!activeObj() || k==='moto' || k==='parche') return false;
  if (k==='pintura') return changes().some(t=> t.startsWith('Pintura'));
  if (k==='disenos') return decals.some(d=> d.userData.model===st.model);
  if (k==='piezas') return isHand() && PARTS.some(p=> st.parts[p.k]==='biker');
  if (k==='accesorios') return isHand() && ACCS.some(a=> st.acc[a.k]);
}
/* ---- Diseños (calcomanías) ---- */
let numTxt = '07';
function designCanvas(k, size){
  const c = document.createElement('canvas'); c.width = c.height = size||512; const g = c.getContext('2d'), W = c.width;
  g.clearRect(0,0,W,W);
  if (k==='franjas'){ g.fillStyle = '#f3f1ec'; g.fillRect(W*.18,0,W*.22,W); g.fillRect(W*.6,0,W*.22,W); g.fillStyle = '#c1201a'; g.fillRect(W*.45,0,W*.1,W); }
  else if (k==='llamas'){ const grd = g.createLinearGradient(0,0,W,0); grd.addColorStop(0,'#ffd23a'); grd.addColorStop(.5,'#ff7a1a'); grd.addColorStop(1,'#d3201a'); g.fillStyle = grd;
    g.beginPath(); g.moveTo(0,W*.3); for (let i=0;i<6;i++){ const y = W*(.18+i*.11); g.quadraticCurveTo(W*(.55+.08*(i%2)), y-W*.1, W*(.98-.06*i), y); g.quadraticCurveTo(W*.5, y+W*.02, W*.08, y+W*.08); } g.lineTo(0,W*.82); g.closePath(); g.fill(); }
  else if (k==='numero'){ g.fillStyle = '#f3f1ec'; g.beginPath(); g.arc(W/2,W/2,W*.46,0,Math.PI*2); g.fill(); g.lineWidth = W*.035; g.strokeStyle = '#111'; g.stroke();
    g.fillStyle = '#111'; g.font = `800 italic ${W*.5}px "Saira Extra Condensed", "Arial Narrow", Impact, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(numTxt||'07', W/2, W*.53, W*.8); }
  else if (k==='rayo'){ g.fillStyle = '#f2c230'; g.beginPath(); [[.58,.04],[.2,.56],[.46,.56],[.36,.96],[.82,.38],[.54,.38],[.7,.04]].forEach(([x,y],i)=> i ? g.lineTo(x*W,y*W) : g.moveTo(x*W,y*W)); g.closePath(); g.fill(); g.lineWidth = W*.02; g.strokeStyle = '#111'; g.stroke(); }
  else if (k==='camuflado'){ let s = 5; const r = ()=> (s = (s*9301+49297)%233280)/233280; const cols = ['#2e3324','#4b5634','#6b6a45','#1e211a']; g.save(); g.beginPath(); g.roundRect ? g.roundRect(W*.02,W*.02,W*.96,W*.96,W*.08) : g.rect(W*.02,W*.02,W*.96,W*.96); g.clip();
    g.fillStyle = '#556040'; g.fillRect(0,0,W,W); for (let i=0;i<70;i++){ g.fillStyle = cols[i%4]; g.beginPath(); const x = r()*W, y = r()*W, R = W*(.05+r()*.09); for (let a=0;a<=12;a++){ const t = a/12*Math.PI*2, rr = R*(.6+r()*.6); g.lineTo(x+Math.cos(t)*rr*1.4, y+Math.sin(t)*rr); } g.closePath(); g.fill(); } g.restore(); }
  else if (k==='carbono'){ g.save(); g.beginPath(); g.rect(W*.02,W*.02,W*.96,W*.96); g.clip(); const n = 24, q = W/n; for (let y=0;y<n;y++) for (let x=0;x<n;x++){ const grd = g.createLinearGradient(x*q,y*q,(x+1)*q,(y+1)*q); const a = (x+y)%2; grd.addColorStop(0, a?'#2b2c30':'#141517'); grd.addColorStop(1, a?'#18191c':'#2a2b2f'); g.fillStyle = grd; g.fillRect(x*q,y*q,q,q); } g.restore(); }
  else if (k==='calle'){ g.fillStyle = '#f3f1ec'; g.font = `800 italic ${W*.36}px "Saira Extra Condensed", "Arial Narrow", Impact, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = W*.03; g.strokeStyle = '#111'; g.strokeText('CALLE', W/2, W/2); g.fillText('CALLE', W/2, W/2); g.fillStyle = '#ff5b1f'; g.fillRect(W*.12,W*.7,W*.76,W*.05); }
  return c;
}
const DESIGNS = [['franjas','Franjas racing'],['llamas','Llamas'],['numero','Número'],['rayo','Rayo'],['camuflado','Camuflado'],['carbono','Fibra de carbono'],['calle','Calle']].map(([k,n])=> ({k, n, thumb: designCanvas(k,128).toDataURL()}));
let userImg = null;
function designTexture(){
  let c;
  if (st.design==='propio' && userImg){ c = document.createElement('canvas'); const s = 512; c.width = c.height = s; const g = c.getContext('2d'); const r = Math.min(s/userImg.width, s/userImg.height); const w = userImg.width*r, hh = userImg.height*r; g.drawImage(userImg,(s-w)/2,(s-hh)/2,w,hh); }
  else c = designCanvas(st.design, 512);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t;
}
const pickRay = new THREE.Raycaster(), ndc = new THREE.Vector2(), helper = new THREE.Object3D();
function decalTargets(){ const obj = activeObj(), out = []; if (!obj) return out; obj.traverse(o=>{ if (o.isMesh && !o.userData.isDecal && o.visible){ let v = true; for (let p=o; p; p=p.parent){ if (!p.visible){ v = false; break; } } if (v && !(o.material && o.material.isSpriteMaterial)) out.push(o); } }); return out; }
function placeAt(ev){
  const r = renderer.domElement.getBoundingClientRect();
  ndc.set(((ev.clientX-r.left)/r.width)*2-1, -((ev.clientY-r.top)/r.height)*2+1);
  pickRay.setFromCamera(ndc, camera);
  const hit = pickRay.intersectObjects(decalTargets(), false)[0];
  if (!hit){ toast('Toca encima de la moto'); return; }
  const n = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
  helper.position.copy(hit.point); helper.lookAt(hit.point.clone().add(n)); helper.rotateZ(st.drot*Math.PI/180);
  const sz = new THREE.Vector3(st.dsize, st.dsize, st.dsize*.9);
  const mat = new THREE.MeshStandardMaterial({map:designTexture(), transparent:true, depthTest:true, depthWrite:false, polygonOffset:true, polygonOffsetFactor:-4, roughness:.4, metalness:.1});
  const geo = new THREE.DecalGeometry(hit.object, hit.point, helper.rotation.clone(), sz);
  if (!geo.attributes.position || !geo.attributes.position.count){ toast('Ahí no se pudo pegar. Prueba en el tanque o los carenajes'); return; }
  const d = new THREE.Mesh(geo, mat); d.userData.isDecal = true; d.userData.model = st.model; d.renderOrder = 2;
  turn.updateMatrixWorld(true); d.applyMatrix4(new THREE.Matrix4().copy(turn.matrixWorld).invert()); turn.add(d); decals.push(d);
  render(); toast('Diseño pegado');
}

/* ---- Luces del garaje ---- */
function setNight(n){
  night = n; ui.night = n;
  lights.spots.forEach((s,i)=> s.intensity = n ? (i?0:.3) : (i?.6:.9));
  lights.lamps.forEach(p=> p.intensity = n ? .06 : .35);
  lights.hemi.intensity = n ? .1 : .85; lights.rimL.intensity = n ? .05 : .9;
  lights.neon.intensity = n ? 1.4 : .5; lights.ring.intensity = n ? .8 : .25;
  if (envTex) applyEnv(n ? .15 : .35);
  ledM.color.setHex(n ? 0x23262c : 0xffffff); winM.color.setHex(n ? 0x18223a : 0xe3ecf6);
  scene.background.setHex(n ? 0x0b0c0f : 0xd9dbde);
  glows.forEach(g=>{ g.material.opacity = n ? .95 : g.userData.day; const s = g.userData.base*(n?1.6:1); g.scale.set(s,s,1); });
  M.lens.emissiveIntensity = n ? 3 : 1.2; M.lensStock.emissiveIntensity = n ? 2.2 : .05; M.tail.emissiveIntensity = n ? 2.4 : 1.1; M.amber.emissiveIntensity = n ? 1.6 : .15;
  applyAll(); emit();
}

/* ---- Cámara ---- */
const VIEWS = { taller:{p:V(2.6,2.4,5.2), t:V(-.4,1.6,-1.5)}, tq:{p:V(1.9,1.25,3.8), t:V(0,.85,0)}, lado:{p:V(0,1.1,4.3), t:V(0,.8,0)}, frente:{p:V(3.6,1.3,1.4), t:V(0,.9,-.4)}, atras:{p:V(-2.6,1.5,2.9), t:V(0,1.0,0)} };
let tween = null, spinning = !reduce, turnTarget = null;
function setSpin(on){ spinning = on; ui.spinning = on; emit(); }
function markView(v){ ui.view = v; emit(); }
function go(v, name){ spinning = false; ui.spinning = false; turnTarget = 0; ui.view = name||''; emit(); if (!controls) return; if (reduce){ camera.position.copy(v.p); controls.target.copy(v.t); } else tween = {p:v.p.clone(), t:v.t.clone()}; }
function focusPart(k){
  if (!isHand()) return; const pin = PINS.find(p=> p.k===k); if (!pin) return;
  const t = pin.cam.t.clone().add(V(0,.07,0)), p = pin.cam.p.clone().sub(pin.cam.t).multiplyScalar(1.35).add(t);
  go({p, t}, '');
}
if (controls) controls.addEventListener('start', ()=>{ tween = null; markView(''); });

/* ---- Decal: tocar la moto para pegar ---- */
let downAt = null;
if (renderer){
  renderer.domElement.addEventListener('pointerdown', e=>{ downAt = [e.clientX, e.clientY]; });
  renderer.domElement.addEventListener('pointerup', e=>{ if (!st.placing || !downAt) return; if (Math.hypot(e.clientX-downAt[0], e.clientY-downAt[1]) < 6) placeAt(e); downAt = null; });
}

/* ---- Revisión técnico-mecánica (guía orientativa) ---- */
function revItems(){
  if (!activeObj()) return [];
  if (!isHand()) return [{n:'Escaneo cargado', s:'warn', d:'La revisión se calcula con las piezas. Cuando separemos tu escaneo por partes, aparece aquí.'}];
  const P = st.parts, A = st.acc, out = [];
  out.push(P.exhosto==='biker' ? {n:'Ruido del exhosto', s:'warn', d:'El slip-on pasa solo con el db-killer puesto. Llévalo instalado el día de la revisión.'} : {n:'Ruido del exhosto', s:'ok', d:'Silenciador de fábrica.'});
  out.push(P.faro==='biker' ? {n:'Farola', s:'ok', d:'LED con luz alta y baja. Que esté bien alineada para no encandilar.'} : {n:'Farola', s:'ok', d:'Farola de fábrica.'});
  out.push(A.exploradoras ? {n:'Exploradoras', s:'warn', d:'Deben ser blancas o ámbar y no encandilar. Muchos CDA las revisan con lupa.'} : {n:'Luces auxiliares', s:'ok', d:'Sin luces extra.'});
  out.push(P.cola==='biker' ? {n:'Placa', s:'ok', d:'Cola corta con la placa visible y con luz.'} : {n:'Placa', s:'ok', d:'Porta placa de fábrica.'});
  out.push(P.manubrio==='biker' ? {n:'Espejos', s:'ok', d:'Los de punta sirven si dejan ver hacia atrás por los dos lados.'} : {n:'Espejos', s:'ok', d:'Espejos a los dos lados.'});
  out.push(P.llantas==='biker' ? {n:'Llantas', s:'ok', d:'Semitaco en la misma medida de fábrica.'} : {n:'Llantas', s:'ok', d:'Medida de fábrica.'});
  return out;
}
function revSummary(){ const it = revItems(); if (!it.length) return null; const w = it.filter(i=> i.s==='warn').length; return {w, txt: w ? (w===1 ? '1 cosa por revisar' : w+' cosas por revisar') : 'Pasa la revisión'}; }

/* ---- Prender la moto: sonido sintetizado ---- */
let ac = null, eng = null, rpm = 0, throttle = false, lastRpmEmit = 0;
function engineOn(){
  if (!activeObj()){ toast('Primero carga la moto'); return false; }
  try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); } catch(e){ toast('Este navegador no deja reproducir sonido'); return false; }
  if (ac.state === 'suspended') ac.resume();
  const loud = isHand() && st.parts.exhosto==='biker';
  const o1 = ac.createOscillator(), o2 = ac.createOscillator(), g2 = ac.createGain();
  o1.type = 'sawtooth'; o2.type = 'square'; g2.gain.value = .35;
  const ws = ac.createWaveShaper(), k = loud ? 38 : 10, n = 1024, cv = new Float32Array(n);
  for (let i=0;i<n;i++){ const x = i/(n-1)*2-1; cv[i] = (1+k)*x/(1+k*Math.abs(x)); } ws.curve = cv;
  const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = loud ? 6 : 3;
  const out = ac.createGain(); out.gain.value = 0;
  const nb = ac.createBuffer(1, ac.sampleRate, ac.sampleRate), nd = nb.getChannelData(0); for (let i=0;i<nd.length;i++) nd[i] = Math.random()*2-1;
  const ns = ac.createBufferSource(); ns.buffer = nb; ns.loop = true; const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = loud ? 1500 : 900; const ng = ac.createGain(); ng.gain.value = loud ? .06 : .03;
  o1.connect(ws); o2.connect(g2); g2.connect(ws); ws.connect(lp); lp.connect(out); ns.connect(bp); bp.connect(ng); ng.connect(out); out.connect(ac.destination);
  const t = ac.currentTime; o1.frequency.setValueAtTime(3, t); o1.frequency.linearRampToValueAtTime(9, t+.7); o2.frequency.setValueAtTime(6, t); o2.frequency.linearRampToValueAtTime(18, t+.7);
  out.gain.setValueAtTime(0, t); out.gain.linearRampToValueAtTime(loud ? .32 : .22, t+.5);
  [o1,o2,ns].forEach(x=> x.start());
  eng = {o1, o2, lp, out, ns, loud, base: loud ? .32 : .22}; rpm = 1100;
  return true;
}
function engineOff(){ if (!eng) return; const e = eng, t = ac.currentTime; e.out.gain.cancelScheduledValues(t); e.out.gain.setValueAtTime(e.out.gain.value, t); e.out.gain.linearRampToValueAtTime(0, t+.35); setTimeout(()=>{ try { e.o1.stop(); e.o2.stop(); e.ns.stop(); } catch(_){} }, 450); eng = null; rpm = 0; throttle = false; }
function engineTick(dt){
  if (!eng) return;
  const target = throttle ? 9000 : 1150; rpm += (target - rpm) * Math.min(1, dt*(throttle ? 2.6 : 1.6));
  const t = ac.currentTime, f = rpm/120;
  eng.o1.frequency.setTargetAtTime(f, t, .03); eng.o2.frequency.setTargetAtTime(f*2, t, .03);
  eng.lp.frequency.setTargetAtTime((eng.loud ? 700 : 420) + rpm*(eng.loud ? .32 : .16), t, .05);
  eng.out.gain.setTargetAtTime(eng.base*(.75 + .35*(rpm/9000)), t, .08);
  const obj = activeObj(); if (obj){ const a = .0012*(.5 + rpm/4000); obj.rotation.x = (Math.random()-.5)*a; obj.rotation.z = (Math.random()-.5)*a*.6; }
  const now = performance.now(); if (now - lastRpmEmit > 90){ lastRpmEmit = now; ui.rpm = rpm; emit(); }
}
function syncEngineUI(){ ui.engOn = !!eng; if (!eng){ ui.gas = false; ui.rpm = 0; const o = activeObj(); if (o){ o.rotation.x = 0; o.rotation.z = 0; } } emit(); }

/* ---- Compartir: foto del build ---- */
function buildFields(){
  const paint = {}; if (isHand()) HAND_ZONES.forEach(z=> paint[z.k] = st.paint[z.k]);
  return {model: st.model, paint, parts: Object.assign({}, st.parts), acc: Object.assign({}, st.acc), designs: decals.filter(d=> d.userData.model===st.model).length};
}
function drawPhoto(c, bname){
  if (!renderer || !c) return;
  renderFrame();
  const src = renderer.domElement, W = 1080, H = 1350; c.width = W; c.height = H; const g = c.getContext('2d');
  g.fillStyle = '#0b0c0f'; g.fillRect(0,0,W,H);
  const ih = 1000, r = Math.max(W/src.width, ih/src.height), sw = W/r, sh = ih/r;
  g.drawImage(src, (src.width-sw)/2, (src.height-sh)/2, sw, sh, 0, 0, W, ih);
  const tg = g.createLinearGradient(0,0,0,170); tg.addColorStop(0,'rgba(11,12,15,.92)'); tg.addColorStop(1,'rgba(11,12,15,0)'); g.fillStyle = tg; g.fillRect(0,0,W,170);
  const grd = g.createLinearGradient(0, ih-260, 0, ih); grd.addColorStop(0,'rgba(11,12,15,0)'); grd.addColorStop(1,'rgba(11,12,15,1)'); g.fillStyle = grd; g.fillRect(0, ih-260, W, 260);
  const m = curModel(), name = (bname || 'Mi build').slice(0,28);
  g.fillStyle = '#FF5B1F'; g.save(); g.translate(64, 70); g.transform(1,0,-.32,1,0,0); g.fillRect(0,0,18,18); g.restore();
  g.fillStyle = '#F3F1EC'; g.font = '800 italic 54px "Saira Extra Condensed", "Arial Narrow", Impact, sans-serif'; g.textBaseline = 'top'; g.fillText('GARAJE', 100, 52);
  g.font = '600 26px "Barlow", system-ui, sans-serif'; g.fillStyle = '#B4B9C2'; g.fillText(m.brand.toUpperCase()+' · '+m.model.toUpperCase(), 64, ih-170);
  g.fillStyle = '#F3F1EC'; g.font = '800 italic 110px "Saira Extra Condensed", "Arial Narrow", Impact, sans-serif'; g.fillText(name.toUpperCase(), 60, ih-136, W-120);
  let x = 64, y = ih+40; g.font = '600 26px "Barlow", system-ui, sans-serif';
  const ch = changes(); (ch.length ? ch : ['De fábrica']).slice(0,8).forEach(t=>{ const w = g.measureText(t).width + 36; if (x + w > W-64){ x = 64; y += 62; } g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(x, y, w, 48); g.strokeStyle = 'rgba(255,255,255,.22)'; g.lineWidth = 2; g.strokeRect(x+1, y+1, w-2, 46); g.fillStyle = '#F3F1EC'; g.fillText(t, x+18, y+10); x += w + 12; });
  const rv = revSummary(); if (rv){ g.font = '600 24px "Barlow", system-ui, sans-serif'; g.fillStyle = rv.w ? '#F2C230' : '#3FD08A'; g.fillText('● Tecnomecánica: '+rv.txt, 64, H-78); }
  g.fillStyle = '#B4B9C2'; g.font = '500 24px "JetBrains Mono", monospace'; g.textAlign = 'right'; g.fillText(CONFIG.DOMAIN_TEXT, W-64, H-78); g.textAlign = 'left';
}
const HEX = /^#[0-9a-f]{6}$/i;
function tryBuild(b){
  if (!b || !MODELS.some(m=> m.id===b.model)) return;
  st.model = b.model;
  Object.entries(b.paint||{}).forEach(([k,p])=>{ if (HAND_ZONES.some(z=> z.k===k) && Array.isArray(p) && HEX.test(p[0]) && FIN[p[1]]) st.paint[k] = [p[0], p[1]]; });
  Object.keys(st.parts).forEach(k=>{ const v = (b.parts||{})[k]; st.parts[k] = v==='biker' ? 'biker' : 'stock'; });
  st.acc = {}; ACCS.forEach(a=>{ if ((b.acc||{})[a.k]) st.acc[a.k] = true; });
  st.combo = null; st.showOrig = false; st.tab = 'pintura'; render(); go(VIEWS.tq,'tq'); setSpin(!reduce); toast('Probando: '+String(b.name||'build').slice(0,40));
}

/* =============== ACCIONES (lo que la interfaz puede pedirle al motor) =============== */
function designImageLoad(file){
  if (!file) return;
  const rd = new FileReader();
  rd.onload = ()=>{ const im = new Image(); im.onload = ()=>{ userImg = im; st.design = 'propio'; st.placing = true; render(); toast('Listo. Toca la moto para pegar tu diseño'); }; im.onerror = ()=> toast('No pude abrir esa imagen'); im.src = rd.result; };
  rd.readAsDataURL(file);
}
function glbLoad(f){
  if (!f) return;
  const rd = new FileReader();
  rd.onload = ()=>{
    try {
      new THREE.GLTFLoader().parse(rd.result, '', gltf=>{
        if (loaded[st.model]) turn.remove(loaded[st.model]);
        const m = gltf.scene; const mats = new Map();
        m.traverse(o=>{ if (o.isMesh){ o.castShadow = true; o.receiveShadow = true;
          const fix = (mt)=>{ if (!mats.has(mt)) mats.set(mt, mt.clone()); return mats.get(mt); };
          o.material = Array.isArray(o.material) ? o.material.map(fix) : fix(o.material); } });
        const box = new THREE.Box3().setFromObject(m), size = new THREE.Vector3(), c = new THREE.Vector3(); box.getSize(size); box.getCenter(c);
        const long = Math.max(size.x, size.z) || 1, k = 2.05/long;
        m.scale.setScalar(k); m.position.set(-c.x*k, -box.min.y*k + .07, -c.z*k);
        loaded[st.model] = m; turn.add(m);
        const Z = zoneMap[st.model] = [...mats.values()].filter(mt=> mt.color).slice(0,16).map((mt,i)=> ({k:st.model+':g'+i, n: mt.name ? mt.name.replace(/[_.]/g,' ') : 'Material '+(i+1), mats:[mt], hex:'#'+mt.color.getHexString(), fin: mt.roughness!==undefined && mt.roughness>.6 ? 'mate' : 'brillante'}));
        Z.forEach(z=> st.paint[z.k] = [z.hex, z.fin]); st.zone = (Z[0]||{}).k;
        render(); go(VIEWS.tq, 'tq'); setSpin(!reduce); toast('Moto cargada en el taller');
      }, err=> toast('No pude abrir ese archivo. Prueba con un .glb'));
    } catch(err){ toast('No pude abrir ese archivo. Prueba con un .glb'); }
  };
  rd.readAsArrayBuffer(f);
}
function removeDecals(all){
  if (all){ for (let i=decals.length-1;i>=0;i--){ if (decals[i].userData.model===st.model){ turn.remove(decals[i]); decals[i].geometry.dispose(); decals.splice(i,1); } } }
  else { const i = decals.map(x=> x.userData.model).lastIndexOf(st.model); if (i>=0){ const x = decals.splice(i,1)[0]; turn.remove(x); x.geometry.dispose(); } }
}
const actions = {
  selectTab(k){ st.tab = k; if (k!=='disenos') st.placing = false; if (k==='disenos' || k==='pintura'){ setSpin(false); turnTarget = 0; } render(); },
  goMotoTab(){ st.tab = 'moto'; st.placing = false; render(); },
  setQuery(v){ st.q = v; emit(); },
  setBrand(b){ st.brand = b; emit(); },
  setType(t){ st.type = t; emit(); },
  selectModel(id){ if (eng){ engineOff(); syncEngineUI(); } st.model = id; st.placing = false; st.zone = (zones()[0]||{}).k; render(); go(VIEWS.tq,'tq'); setSpin(!reduce); toast(activeObj() ? 'Moto lista en el taller' : 'Esta moto todavía no tiene modelo 3D'); },
  useTestModel(){ st.model = GIX; st.tab = 'pintura'; render(); go(VIEWS.tq,'tq'); },
  applyCombo(k){ const c = COMBOS[k]; st.combo = k; Object.entries(c.z).forEach(([zk,v])=> st.paint[zk] = v.slice()); decalT.redraw(c.decal); render(); },
  selectZone(k){ st.zone = k; emit(); },
  setColor(hex){ st.paint[st.zone] = [hex, (st.paint[st.zone]||[0,'brillante'])[1]]; st.combo = null; render(); },
  setFinish(f){ const p = st.paint[st.zone] || [zones().find(z=>z.k===st.zone).hex,'brillante']; st.paint[st.zone] = [p[0], f]; st.combo = null; render(); },
  resetZone(){ const z = zones().find(z=> z.k===st.zone); if (!z) return; st.paint[z.k] = [z.hex, z.fin]; render(); },
  pickDesign(k){ st.design = k; st.placing = true; render(); },
  setDesignSize(v){ st.dsize = v/100; emit(); },
  setDesignRot(v){ st.drot = +v; emit(); },
  setNumTxt(v){ numTxt = String(v).toUpperCase(); emit(); },
  togglePlace(){ st.placing = !st.placing; if (st.placing){ setSpin(false); turnTarget = 0; } render(); },
  undoDecal(){ removeDecals(false); render(); },
  clearDecals(){ removeDecals(true); render(); },
  setPart(k, v){ st.parts[k] = v; st.showOrig = false; render(); focusPart(k); },
  toggleAcc(k){ st.acc[k] = !st.acc[k]; st.showOrig = false; render(); },
  setShowOrig(b){ st.showOrig = !!b; render(); },
  resetBuild(){ zones().forEach(z=> st.paint[z.k] = [z.hex, z.fin]); Object.keys(st.parts).forEach(k=> st.parts[k] = 'stock'); st.acc = {}; st.combo = 'bronce'; decalT.redraw(COMBOS.bronce.decal); removeDecals(true); st.showOrig = false; render(); toast('La moto volvió a como sale de fábrica'); },
  saveBuild(){ try { localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify({model:st.model, paint:st.paint, parts:st.parts, acc:st.acc})); toast('Build guardado en este navegador'); } catch(e){ toast('Este navegador no deja guardar el build'); } },
  setNight(n){ setNight(!!n); },
  setQuality(q){ setQuality(q); },
  goView(name){ go(VIEWS[name], name); },
  toggleSpin(){ setSpin(!spinning); },
  toggleEngine(){ if (eng) engineOff(); else engineOn(); syncEngineUI(); },
  setGas(on){ if (on && !eng) return; throttle = !!on; ui.gas = !!on; emit(); },
  loadGlb: glbLoad,
  loadDesignImage: designImageLoad,
  tryBuild,
  toast,
  setCommunity(c){ builds = c.builds || []; likes = c.likes || {}; communityReady = !!c.ready; me = c.me || null; emit(); },
};
// build guardado en este navegador
try { const sv = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY)||'null'); if (sv && MODELS.some(m=> m.id===sv.model)){ st.model = sv.model; Object.assign(st.paint, sv.paint||{}); Object.assign(st.parts, sv.parts||{}); st.acc = sv.acc||{}; } } catch(e){}

/* =============== REALISMO: reflejos reales, oclusión, brillo de luces =============== */
// Sombra de contacto suave bajo la moto (la ancla al piso)
(function(){
  const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d');
  const gr = g.createRadialGradient(128,64,4,128,64,124); gr.addColorStop(0,'rgba(0,0,0,.62)'); gr.addColorStop(.55,'rgba(0,0,0,.28)'); gr.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0,0,256,128);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(2.5,1.0), new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c), transparent:true, depthWrite:false}));
  m.rotation.x = -Math.PI/2; m.position.y = .073; m.renderOrder = 1; turn.add(m);
})();

// Mapa de entorno HDR de un taller real (Poly Haven, CC0): reflejos de verdad en pintura, cromo y vidrio
let envTex = null;
function applyEnv(intensity){
  turn.traverse(o=>{ if (!o.isMesh || o.userData.isDecal) return; [].concat(o.material).forEach(m=>{ if (m && m.isMeshStandardMaterial){ m.envMap = envTex; m.envMapIntensity = intensity; m.needsUpdate = true; } }); });
}
async function loadEnv(){
  if (!renderer) return;
  try {
    const buf = await (await fetch(CONFIG.ENV_URL)).arrayBuffer();
    const d = new THREE.EXRLoader().setDataType(THREE.HalfFloatType).parse(buf);
    const tex = new THREE.DataTexture(d.data, d.width, d.height, d.format, d.type);
    tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter; tex.generateMipmaps = false;
    if (d.flipY !== undefined) tex.flipY = d.flipY; if (d.encoding !== undefined) tex.encoding = d.encoding; tex.needsUpdate = true;
    const pm = new THREE.PMREMGenerator(renderer); pm.compileEquirectangularShader();
    envTex = pm.fromEquirectangular(tex).texture; tex.dispose(); pm.dispose();
    applyEnv(night ? .15 : .35);
  } catch(e){ console.warn('No se pudo cargar el ambiente HDR', e); }
}
loadEnv();

// Postproceso: oclusión ambiental (sombras en rincones y entre piezas), brillo en luces y antialias
let composer = null, saoPass = null, bloomPass = null, quality = 'alta';
const FinalShader = {
  uniforms:{tDiffuse:{value:null}, exposure:{value:1.0}},
  vertexShader:'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
  fragmentShader:`uniform sampler2D tDiffuse; uniform float exposure; varying vec2 vUv;
    vec3 fit(vec3 v){ vec3 a = v*(v+0.0245786)-0.000090537; vec3 b = v*(0.983729*v+0.4329510)+0.238081; return a/b; }
    vec3 aces(vec3 c){ const mat3 I = mat3(vec3(0.59719,0.07600,0.02840),vec3(0.35458,0.90834,0.13383),vec3(0.04823,0.01566,0.83777));
      const mat3 O = mat3(vec3(1.60475,-0.10208,-0.00327),vec3(-0.53108,1.10813,-0.07276),vec3(-0.07367,-0.00605,1.07602));
      c *= exposure/0.6; c = I*c; c = fit(c); c = O*c; return clamp(c,0.,1.); }
    vec3 srgb(vec3 c){ return mix(c*12.92, 1.055*pow(c, vec3(1./2.4))-0.055, step(0.0031308, c)); }
    void main(){ vec4 t = texture2D(tDiffuse, vUv); vec2 d = vUv-.5; float vig = 1. - dot(d,d)*.35; gl_FragColor = vec4(srgb(aces(t.rgb))*vig, 1.); }`
};
function buildComposer(){
  if (!renderer || !THREE.EffectComposer || !THREE.SAOPass || !THREE.UnrealBloomPass) return null;
  try {
    const w = stage.clientWidth || 800, h = stage.clientHeight || 600, pr = renderer.getPixelRatio();
    const rt = new THREE.WebGLRenderTarget(w*pr, h*pr, {type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat});
    const c = new THREE.EffectComposer(renderer, rt);
    c.addPass(new THREE.RenderPass(scene, camera));
    saoPass = new THREE.SAOPass(scene, camera, false, true);
    Object.assign(saoPass.params, {saoBias:.5, saoIntensity:.02, saoScale:2.2, saoKernelRadius:28, saoMinResolution:0, saoBlur:true, saoBlurRadius:6, saoBlurStdDev:3, saoBlurDepthCutoff:.01});
    const ro = saoPass.renderOverride.bind(saoPass);
    saoPass.renderOverride = function(){ const hidden = []; scene.traverse(o=>{ if (o.isReflector || (o.material && o.material.isShadowMaterial) || o.isSprite){ if (o.visible){ hidden.push(o); o.visible = false; } } }); ro.apply(null, arguments); hidden.forEach(o=> o.visible = true); };
    c.addPass(saoPass);
    bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(w, h), .4, .45, 1.15); c.addPass(bloomPass);
    c.addPass(new THREE.ShaderPass(FinalShader));
    if (THREE.SMAAPass){ c.addPass(new THREE.SMAAPass(w*pr, h*pr)); }
    return c;
  } catch(e){ console.error('composer', e && e.message); return null; }
}
function setQuality(q){
  quality = q; ui.quality = q;
  if (q==='alta' && !composer){ composer = buildComposer(); if (!composer){ quality = 'rapida'; ui.quality = 'rapida'; toast('Este equipo no soporta la calidad realista'); } else resizeComposer(); }
  syncToneMapping(); emit();
}
function syncToneMapping(){
  if (!renderer) return;
  const want = (quality==='alta' && composer) ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping;
  if (renderer.toneMapping === want) return;
  renderer.toneMapping = want;
  scene.traverse(o=>{ [].concat(o.material||[]).forEach(m=>{ if (m) m.needsUpdate = true; }); });
}
function resizeComposer(){ if (!composer) return; const w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return; composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(w, h); }
function renderFrame(){ if (quality==='alta' && composer) composer.render(); else renderer.render(scene, camera); }
function resize(){
  const w = stage.clientWidth, h = stage.clientHeight; if (!renderer || !w || !h) return;
  renderer.setSize(w,h,false); camera.aspect = w/h; camera.fov = w < 700 ? 54 : 44; camera.updateProjectionMatrix();
  resizeComposer();
}
const ro = new ResizeObserver(resize); ro.observe(stage); resize();
camera.position.copy(VIEWS.tq.p); if (controls) controls.target.copy(VIEWS.tq.t);
st.zone = 'tanque'; render(); setNight(false); setQuality(window.innerWidth < 900 ? 'rapida' : 'alta');
if (document.fonts && document.fonts.load){ Promise.all(['800 italic 100px "Saira Extra Condensed"','700 50px "Barlow"'].map(f=> document.fonts.load(f))).then(()=>{ SIGNS.forEach(([t,d])=>{ const c = t.image, g = c.getContext('2d'); g.clearRect(0,0,c.width,c.height); d(g,c.width,c.height); t.needsUpdate = true; }); }).catch(()=>{}); }

const clock = new THREE.Clock();
let raf = 0, alive = true;
function loop(){
  if (!alive) return;
  raf = requestAnimationFrame(loop);
  if (!renderer) return;
  const dt = Math.min(clock.getDelta(), .05);
  if (spinning) turn.rotation.y += dt*.22;
  else if (turnTarget !== null){ const a = ((turn.rotation.y % (Math.PI*2)) + Math.PI*3) % (Math.PI*2) - Math.PI; turn.rotation.y = a*(1-Math.min(1,dt*5)); if (Math.abs(turn.rotation.y) < .002){ turn.rotation.y = 0; turnTarget = null; } }
  engineTick(dt);
  if (tween){ camera.position.lerp(tween.p,.08); controls.target.lerp(tween.t,.08); if (camera.position.distanceTo(tween.p) < .004) tween = null; }
  controls.update();
  renderFrame();
}
loop();
function dispose(){
  alive = false; cancelAnimationFrame(raf); ro.disconnect(); engineOff();
  if (renderer){ renderer.dispose(); if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement); }
}

const api = {
  st, ui, actions, dispose,
  subscribe(f){ listeners.add(f); return ()=> listeners.delete(f); },
  getVersion: ()=> ver,
  // consultas
  curModel, activeObj, isHand, zones, changes, revItems, revSummary, tabSub, tabMod,
  isLoaded: (id)=> !!loaded[id],
  decalCount: ()=> decals.filter(d=> d.userData.model===st.model).length,
  buildFields, drawPhoto,
  // catálogo
  TABS, CAT, MODELS, TYPES, FIN, SWATCH, COMBOS, PARTS, ACCS, DESIGNS, GIX, slug,
  community: ()=> ({builds, likes, ready: communityReady, me}),
};
if (typeof window !== 'undefined' && (window.__GARAJE_DEBUG__ || (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV))){
  window.__g = {scene, camera, controls, renderer, go, VIEWS, setNight, st, render, bike, M, PIEZAS, api};
}
return api;
}
