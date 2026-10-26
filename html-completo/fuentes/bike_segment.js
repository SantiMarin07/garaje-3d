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

