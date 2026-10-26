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
function shelf(x){ const g = new THREE.Group(); g.position.set(x,MZ+.08,ZB+.35); scene.add(g); [-.7,.7].forEach(dx=> g.add(mesh(new THREE.BoxGeometry(.04,1.6,.04), dkSteel, dx,.8,-.2)), g.add(mesh(new THREE.BoxGeometry(.04,1.6,.04), dkSteel, dx,.8,.2)));
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
box(.0001,.0001,.0001,dkSteel,0,0,0);
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

