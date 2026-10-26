/* =============== ESTADO + UI =============== */
const $ = (id)=> document.getElementById(id);
function esc(t){ return String(t).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
let tt = null;
function toast(t){ const el = $('toast'); el.textContent = t; el.hidden = false; clearTimeout(tt); tt = setTimeout(()=>{ el.hidden = true; }, 2400); }

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
let glbZones = [];          // zonas (materiales) del modelo cargado
const decals = [];

function curModel(){ return MODELS.find(m=> m.id===st.model); }
function activeObj(){ return loaded[st.model] || (st.model===GIX ? bike : null); }
function isHand(){ return !loaded[st.model] && st.model===GIX; }
function zones(){ return isHand() ? HAND_ZONES : glbZones; }

function applyAll(){
  Object.values(loaded).forEach(o=> o.visible = false);
  bike.visible = false;
  const obj = activeObj(); if (obj) obj.visible = true;
  $('nomodel').hidden = !!obj;
  if (!obj){ const m = curModel(); $('nm-name').textContent = m.brand+' '+m.model; }
  const hand = isHand(), O = st.showOrig;
  Object.entries(slots).forEach(([k,s])=>{ const b = hand && !O && st.parts[k]==='biker'; s.biker.visible = b; s.stock.visible = !b; });
  Object.entries(ACC).forEach(([k,g])=> g.visible = hand && !O && !!st.acc[k]);
  zones().forEach(z=>{ const [hex,f] = O ? [z.hex,z.fin] : (st.paint[z.k] || [z.hex,z.fin]); z.mats.forEach(m=> setFinish(m,hex,f)); });
  decals.forEach(d=> d.visible = !O && d.userData.model===st.model);
  if (lights.beam) lights.beam.intensity = hand && !O && st.parts.faro==='biker' ? (night ? 2.6 : .6) : 0;
}
function changes(){
  const out = [];
  if (!activeObj()) return out;
  zones().forEach(z=>{ const p = st.paint[z.k]; if (p && (p[0].toLowerCase()!==z.hex.toLowerCase() || p[1]!==z.fin)) out.push('Pintura · '+z.n); });
  const nd = decals.filter(d=> d.userData.model===st.model).length; if (nd) out.push(nd===1 ? '1 diseño' : nd+' diseños');
  if (isHand()){ PARTS.forEach(p=>{ if (st.parts[p.k]==='biker') out.push(p.o[1][0]); }); ACCS.forEach(a=>{ if (st.acc[a.k]) out.push(a.n); }); }
  return out;
}

/* ---- Paneles ---- */
const TABS = [
  {k:'moto', n:'Tu moto'},
  {k:'pintura', n:'Pintura'},
  {k:'disenos', n:'Diseños'},
  {k:'piezas', n:'Piezas'},
  {k:'accesorios', n:'Accesorios'},
];
function tabSub(k){
  const m = curModel();
  if (k==='moto') return m.brand+' '+m.model;
  if (!activeObj()) return 'Primero carga la moto';
  if (k==='pintura'){ const n = changes().filter(t=> t.startsWith('Pintura')).length; return n ? n+(n===1?' zona pintada':' zonas pintadas') : 'De fábrica'; }
  if (k==='disenos'){ const n = decals.filter(d=> d.userData.model===st.model).length; return n ? n+(n===1?' diseño':' diseños') : 'Sin diseños'; }
  if (k==='piezas'){ if (!isHand()) return 'Pronto en tu escaneo'; const n = PARTS.filter(p=> st.parts[p.k]==='biker').length; return n ? n+(n===1?' pieza nueva':' piezas nuevas') : 'De fábrica'; }
  if (k==='accesorios'){ if (!isHand()) return 'Pronto en tu escaneo'; const n = ACCS.filter(a=> st.acc[a.k]).length; return n ? n+(n===1?' accesorio':' accesorios') : 'Ninguno'; }
}
function tabMod(k){
  if (!activeObj() || k==='moto') return false;
  if (k==='pintura') return changes().some(t=> t.startsWith('Pintura'));
  if (k==='disenos') return decals.some(d=> d.userData.model===st.model);
  if (k==='piezas') return isHand() && PARTS.some(p=> st.parts[p.k]==='biker');
  if (k==='accesorios') return isHand() && ACCS.some(a=> st.acc[a.k]);
}
const swatchBtns = (cur)=> SWATCH.map(h=> `<button class="swb" data-hex="${h}" aria-label="Color ${h}" aria-pressed="${cur.toLowerCase()===h}" style="background:${h}"></button>`).join('');
function needModel(){ return `<div class="empty"><b>Primero carga esta moto en 3D</b><span>Escanéala con el celular y sube el archivo .glb, o mira la Gixxer 150 de prueba.</span><label for="glb" class="btn">Cargar escaneo (.glb)</label></div>`; }

function renderPanel(){
  const m = curModel(), hand = isHand(), obj = activeObj();
  const H = {moto:['Paso 1','Busca tu moto','Marcas y modelos que se venden en Colombia.'],
    pintura:['Paso 2','Pintura', hand ? 'Escoge la zona y dale el color y el acabado que quieras.' : 'En un escaneo el color se aplica como tinte sobre la textura real.'],
    disenos:['Paso 3','Diseños','Escoge un diseño o sube tu imagen y tócala sobre la moto para pegarla.'],
    piezas:['Paso 4','Piezas','Cambia piezas de fábrica por piezas de otras referencias.'],
    accesorios:['Paso 5','Accesorios','Lo que más le meten los moteros en Colombia.']}[st.tab];
  $('p-kick').textContent = H[0]; $('p-name').textContent = H[1]; $('p-hint').textContent = H[2];
  let h = '';
  if (st.tab==='moto'){
    const q = st.q.trim().toLowerCase();
    const list = MODELS.filter(x=> (st.brand==='Todas' || x.brand===st.brand) && (st.type==='Todas' || x.kind===st.type) && (!q || (x.brand+' '+x.model).toLowerCase().includes(q)));
    h += `<label class="lab2" for="q">Buscar marca o modelo</label><input id="q" class="inp" type="search" placeholder="Ej. Pulsar NS 200" value="${esc(st.q)}" autocomplete="off">`;
    h += `<div class="chiprow" role="group" aria-label="Marca">${['Todas'].concat(CAT.map(c=>c[0])).map(b=> `<button class="pill" data-brand="${esc(b)}" aria-pressed="${st.brand===b}">${esc(b)}</button>`).join('')}</div>`;
    h += `<div class="chiprow" role="group" aria-label="Tipo">${TYPES.map(t=> `<button class="pill sm" data-type="${esc(t)}" aria-pressed="${st.type===t}">${esc(t)}</button>`).join('')}</div>`;
    h += `<div class="mlist">${list.length ? list.map(x=>{ const ready = !!loaded[x.id], test = x.id===GIX;
      const badge = ready ? '<span class="bd ok">3D listo</span>' : (test ? '<span class="bd test">Modelo de prueba</span>' : '<span class="bd">Falta el 3D</span>');
      return `<button class="mrow" data-model="${x.id}" aria-pressed="${st.model===x.id}"><span class="mt"><span class="mb">${esc(x.brand)}</span><span class="mm">${esc(x.model)}</span></span><span class="mi"><span>${x.cc} cc · ${esc(x.kind)}</span>${badge}</span>${x.top?`<span class="topn">Top ${x.top} en ventas</span>`:''}</button>`; }).join('') : '<p class="note">No encontré esa moto. Revisa cómo la escribiste o quita los filtros.</p>'}</div>`;
    h += `<p class="note">Las marcas y modelos aparecen solo para que ubiques tu moto. Los modelos 3D oficiales se consiguen con escaneos o con acuerdos con cada marca.</p>`;
  }
  else if (!obj){ h = needModel(); }
  else if (st.tab==='pintura'){
    if (hand) h += `<div class="lab2">Combinaciones rápidas</div><div class="chiprow">${Object.entries(COMBOS).map(([k,c])=> `<button class="pill" data-combo="${k}" aria-pressed="${st.combo===k}">${esc(c.n)}</button>`).join('')}</div>`;
    const Z = zones();
    h += `<div class="lab2">Zona</div><div class="zlist">${Z.map(z=>{ const p = st.paint[z.k]||[z.hex,z.fin]; return `<button class="zrow" data-zone="${z.k}" aria-pressed="${st.zone===z.k}"><span class="dot" style="background:${p[0]}"></span><span>${esc(z.n)}</span><span class="zf">${FIN[p[1]][0]}</span></button>`; }).join('')}</div>`;
    const z = Z.find(z=> z.k===st.zone) || Z[0];
    if (z){ const p = st.paint[z.k]||[z.hex,z.fin];
      h += `<div class="lab2">Color de ${esc(z.n.toLowerCase())}</div><div class="swgrid">${swatchBtns(p[0])}</div>`;
      h += `<div class="pick"><input type="color" id="cpick" value="${p[0]}" aria-label="Escoger cualquier color"><label for="cpick">Cualquier color</label><span class="hex">${p[0].toUpperCase()}</span></div>`;
      h += `<div class="lab2">Acabado</div><div class="seg2" role="group" aria-label="Acabado">${Object.entries(FIN).map(([k,f])=> `<button data-fin="${k}" aria-pressed="${p[1]===k}">${f[0]}</button>`).join('')}</div>`;
      h += `<button class="btn ghost" id="z-reset">Dejar esta zona de fábrica</button>`;
    }
  }
  else if (st.tab==='disenos'){
    h += `<div class="dgrid">${DESIGNS.map(d=> `<button class="dsg" data-design="${d.k}" aria-pressed="${st.design===d.k}"><img src="${d.thumb}" alt=""><span>${esc(d.n)}</span></button>`).join('')}
      <label class="dsg up" for="dimg"><span class="plus" aria-hidden="true">+</span><span>Sube tu diseño</span></label></div>
      <input type="file" id="dimg" accept="image/png,image/jpeg,image/webp" class="vh">`;
    if (st.design==='numero') h += `<label class="lab2" for="dnum">Tu número</label><input id="dnum" class="inp" type="text" maxlength="3" value="${esc(numTxt)}">`;
    h += `<label class="lab2" for="dsize">Tamaño · ${Math.round(st.dsize*100)} cm</label><input type="range" id="dsize" min="6" max="40" value="${Math.round(st.dsize*100)}">`;
    h += `<label class="lab2" for="drot">Giro · ${Math.round(st.drot)}°</label><input type="range" id="drot" min="-180" max="180" value="${Math.round(st.drot)}">`;
    h += `<button class="btn primary wide" id="place" aria-pressed="${st.placing}">${st.placing ? 'Toca la moto para pegarlo' : 'Pegar en la moto'}</button>`;
    h += `<div class="row2"><button class="btn" id="d-undo">Quitar el último</button><button class="btn" id="d-clear">Quitar todos</button></div>`;
    h += `<p class="note">Tip: acércate con la cámara a la zona antes de pegarlo. Las fotos o logos de otras marcas solo si tienes permiso de usarlos.</p>`;
  }
  else if (st.tab==='piezas'){
    if (!hand) h = `<div class="empty"><b>Las piezas se cambian por partes</b><span>Para cambiar piezas de tu escaneo hay que separarlo en partes con nombre (farola, exhosto, cola…). Mientras tanto puedes pintarlo y ponerle diseños.</span></div>`;
    else PARTS.forEach(p=>{ h += `<div class="lab2">${esc(p.n)}</div><div class="olist">${p.o.map((o,i)=> `<button class="opt" data-part="${p.k}" data-v="${i?'biker':'stock'}" aria-pressed="${st.parts[p.k]===(i?'biker':'stock')}"><span class="row"><span class="on">${esc(o[0])}</span><span class="pr">${i?'[PRECIO]':'De fábrica'}</span></span><span class="od">${esc(o[1])}</span></button>`).join('')}</div>`; });
  }
  else if (st.tab==='accesorios'){
    if (!hand) h = `<div class="empty"><b>Los accesorios necesitan puntos de anclaje</b><span>Cuando separemos tu escaneo por partes, cada accesorio sabrá dónde montarse.</span></div>`;
    else h = `<div class="olist">${ACCS.map(a=> `<button class="opt acc" data-acc="${a.k}" aria-pressed="${!!st.acc[a.k]}"><span class="row"><span class="on">${esc(a.n)}</span><span class="pr">${st.acc[a.k]?'Puesto':'[PRECIO]'}</span></span><span class="od">${esc(a.d)}</span><span class="tags"><span class="tag">${esc(a.tag)}</span></span></button>`).join('')}</div>`;
  }
  $('opts').innerHTML = h;
}
function render(){
  const m = curModel();
  $('cats').innerHTML = TABS.map(t=> `<button class="cat${t.k===st.tab?' on':''}${tabMod(t.k)?' mod':''}" data-k="${t.k}" aria-pressed="${t.k===st.tab}"><span><span class="n">${esc(t.n)}</span><span class="s">${esc(tabSub(t.k))}</span></span><span class="m" aria-hidden="true"></span></button>`).join('');
  $('moto-k').textContent = m.brand; $('moto-n').textContent = m.model;
  renderPanel();
  const ch = changes();
  $('b-count').textContent = !activeObj() ? 'Moto sin modelo 3D' : (ch.length===1 ? '1 cambio' : ch.length+' cambios');
  $('chips').innerHTML = ch.map(t=> `<span class="chip">${esc(t)}</span>`).join('');
  $('c-orig').setAttribute('aria-pressed', st.showOrig); $('c-build').setAttribute('aria-pressed', !st.showOrig);
  stage.classList.toggle('placing', st.placing);
  applyAll();
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
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), helper = new THREE.Object3D();
function decalTargets(){ const obj = activeObj(), out = []; if (!obj) return out; obj.traverse(o=>{ if (o.isMesh && !o.userData.isDecal && o.visible){ let v = true; for (let p=o; p; p=p.parent){ if (!p.visible){ v = false; break; } } if (v && !(o.material && o.material.isSpriteMaterial)) out.push(o); } }); return out; }
function placeAt(ev){
  const r = renderer.domElement.getBoundingClientRect();
  ndc.set(((ev.clientX-r.left)/r.width)*2-1, -((ev.clientY-r.top)/r.height)*2+1);
  ray.setFromCamera(ndc, camera);
  const hit = ray.intersectObjects(decalTargets(), false)[0];
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

/* ---- Eventos ---- */
$('cats').addEventListener('click', e=>{ const b = e.target.closest('.cat'); if (!b) return; st.tab = b.dataset.k; if (st.tab!=='disenos') st.placing = false; if (st.tab==='disenos' || st.tab==='pintura'){ setSpin(false); turnTarget = 0; } render(); });
$('moto-btn').onclick = ()=>{ st.tab = 'moto'; st.placing = false; render(); };
$('opts').addEventListener('input', e=>{
  const t = e.target;
  if (t.id==='q'){ st.q = t.value; const pos = t.selectionStart; renderPanel(); const q = $('q'); q.focus(); try { q.setSelectionRange(pos,pos); } catch(_){} }
  else if (t.id==='cpick'){ const z = st.zone; st.paint[z] = [t.value, (st.paint[z]||[0,'brillante'])[1]]; st.combo = null; applyAll(); const hx = t.parentNode.querySelector('.hex'); if (hx) hx.textContent = t.value.toUpperCase(); }
  else if (t.id==='dsize'){ st.dsize = t.value/100; t.previousElementSibling.textContent = 'Tamaño · '+t.value+' cm'; }
  else if (t.id==='drot'){ st.drot = +t.value; t.previousElementSibling.textContent = 'Giro · '+t.value+'°'; }
  else if (t.id==='dnum'){ numTxt = t.value.toUpperCase(); }
});
$('opts').addEventListener('change', e=>{
  const t = e.target;
  if (t.id==='cpick') render();
  if (t.id==='dimg'){ const f = t.files && t.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = ()=>{ const im = new Image(); im.onload = ()=>{ userImg = im; st.design = 'propio'; st.placing = true; render(); toast('Listo. Toca la moto para pegar tu diseño'); }; im.onerror = ()=> toast('No pude abrir esa imagen'); im.src = rd.result; }; rd.readAsDataURL(f); }
});
$('opts').addEventListener('click', e=>{
  const b = e.target.closest('button'); if (!b) return;
  const d = b.dataset;
  if (d.brand){ st.brand = d.brand; renderPanel(); }
  else if (d.type){ st.type = d.type; renderPanel(); }
  else if (d.model){ st.model = d.model; st.placing = false; st.zone = (zones()[0]||{}).k; render(); go(VIEWS.tq,'tq'); setSpin(!reduce); toast(activeObj() ? 'Moto lista en el taller' : 'Esta moto todavía no tiene modelo 3D'); }
  else if (d.combo){ const c = COMBOS[d.combo]; st.combo = d.combo; Object.entries(c.z).forEach(([k,v])=> st.paint[k] = v.slice()); decalT.redraw(c.decal); render(); }
  else if (d.zone){ st.zone = d.zone; renderPanel(); }
  else if (d.hex){ st.paint[st.zone] = [d.hex, (st.paint[st.zone]||[0,'brillante'])[1]]; st.combo = null; render(); }
  else if (d.fin){ const p = st.paint[st.zone] || [zones().find(z=>z.k===st.zone).hex,'brillante']; st.paint[st.zone] = [p[0], d.fin]; st.combo = null; render(); }
  else if (b.id==='z-reset'){ const z = zones().find(z=> z.k===st.zone); st.paint[z.k] = [z.hex, z.fin]; render(); }
  else if (d.design){ st.design = d.design; st.placing = true; render(); }
  else if (b.id==='place'){ st.placing = !st.placing; if (st.placing){ setSpin(false); turnTarget = 0; } render(); }
  else if (b.id==='d-undo'){ const i = decals.map(x=> x.userData.model).lastIndexOf(st.model); if (i>=0){ const x = decals.splice(i,1)[0]; turn.remove(x); x.geometry.dispose(); } render(); }
  else if (b.id==='d-clear'){ for (let i=decals.length-1;i>=0;i--){ if (decals[i].userData.model===st.model){ turn.remove(decals[i]); decals[i].geometry.dispose(); decals.splice(i,1); } } render(); }
  else if (d.part){ st.parts[d.part] = d.v; st.showOrig = false; render(); focusPart(d.part); }
  else if (d.acc){ st.acc[d.acc] = !st.acc[d.acc]; st.showOrig = false; render(); }
});
let downAt = null;
if (renderer){
  renderer.domElement.addEventListener('pointerdown', e=>{ downAt = [e.clientX, e.clientY]; });
  renderer.domElement.addEventListener('pointerup', e=>{ if (!st.placing || !downAt) return; if (Math.hypot(e.clientX-downAt[0], e.clientY-downAt[1]) < 6) placeAt(e); downAt = null; });
}
$('c-orig').onclick = ()=>{ st.showOrig = true; render(); };
$('c-build').onclick = ()=>{ st.showOrig = false; render(); };
$('reset').onclick = ()=>{ zones().forEach(z=> st.paint[z.k] = [z.hex, z.fin]); Object.keys(st.parts).forEach(k=> st.parts[k] = 'stock'); st.acc = {}; st.combo = 'bronce'; decalT.redraw(COMBOS.bronce.decal);
  for (let i=decals.length-1;i>=0;i--){ if (decals[i].userData.model===st.model){ turn.remove(decals[i]); decals.splice(i,1); } } st.showOrig = false; render(); toast('La moto volvió a como sale de fábrica'); };
$('copy').onclick = ()=>{
  const m = curModel(), ch = changes(); const txt = 'Mi build en GARAJE · '+m.brand+' '+m.model+'\n' + (ch.length ? ch.map(t=>'- '+t).join('\n') : '- De fábrica, sin cambios');
  const ok = ()=> toast('Resumen copiado'); const fail = ()=> toast('No se pudo copiar desde aquí');
  try { navigator.clipboard.writeText(txt).then(ok, fail); } catch(e){ fail(); }
};
$('save').onclick = ()=>{ try { localStorage.setItem('garaje-build-v2', JSON.stringify({model:st.model, paint:st.paint, parts:st.parts, acc:st.acc})); toast('Build guardado en este navegador'); } catch(e){ toast('Este navegador no deja guardar el build'); } };
try { const sv = JSON.parse(localStorage.getItem('garaje-build-v2')||'null'); if (sv && MODELS.some(m=> m.id===sv.model)){ st.model = sv.model; Object.assign(st.paint, sv.paint||{}); Object.assign(st.parts, sv.parts||{}); st.acc = sv.acc||{}; } } catch(e){}

// Luces del garaje
function setNight(n){
  night = n; $('l-dia').setAttribute('aria-pressed', !n); $('l-noche').setAttribute('aria-pressed', n);
  lights.spots.forEach((s,i)=> s.intensity = n ? (i?0:.3) : (i?.6:.9));
  lights.lamps.forEach(p=> p.intensity = n ? .06 : .35);
  lights.hemi.intensity = n ? .1 : .85; lights.rimL.intensity = n ? .05 : .9;
  lights.neon.intensity = n ? 1.4 : .5; lights.ring.intensity = n ? .8 : .25;
  ledM.color.setHex(n ? 0x23262c : 0xffffff); winM.color.setHex(n ? 0x18223a : 0xe3ecf6);
  scene.background.setHex(n ? 0x0b0c0f : 0xd9dbde);
  glows.forEach(g=>{ g.material.opacity = n ? .95 : g.userData.day; const s = g.userData.base*(n?1.6:1); g.scale.set(s,s,1); });
  M.lens.emissiveIntensity = n ? 3 : 1.2; M.lensStock.emissiveIntensity = n ? 2.2 : .05; M.tail.emissiveIntensity = n ? 2.4 : 1.1; M.amber.emissiveIntensity = n ? 1.6 : .15;
  applyAll();
}
$('l-dia').onclick = ()=> setNight(false);
$('l-noche').onclick = ()=> setNight(true);

// Cámara
const VIEWS = { taller:{p:V(2.6,2.4,5.2), t:V(-.4,1.6,-1.5)}, tq:{p:V(1.9,1.25,3.8), t:V(0,.85,0)}, lado:{p:V(0,1.1,4.3), t:V(0,.8,0)}, frente:{p:V(3.6,1.3,1.4), t:V(0,.9,-.4)}, atras:{p:V(-2.6,1.5,2.9), t:V(0,1.0,0)} };
let tween = null, spinning = !reduce, turnTarget = null;
function setSpin(on){ spinning = on; $('spin').setAttribute('aria-pressed', on); }
function markView(v){ document.querySelectorAll('.views [data-v]').forEach(b=> b.setAttribute('aria-pressed', b.dataset.v===v)); }
function go(v, name){ setSpin(false); turnTarget = 0; markView(name||''); if (!controls) return; if (reduce){ camera.position.copy(v.p); controls.target.copy(v.t); } else tween = {p:v.p.clone(), t:v.t.clone()}; }
document.querySelectorAll('.views [data-v]').forEach(b=> b.onclick = ()=> go(VIEWS[b.dataset.v], b.dataset.v));
$('spin').onclick = ()=> setSpin(!spinning);
function focusPart(k){
  if (!isHand()) return; const pin = PINS.find(p=> p.k===k); if (!pin) return;
  const t = pin.cam.t.clone().add(V(0,.07,0)), p = pin.cam.p.clone().sub(pin.cam.t).multiplyScalar(1.35).add(t);
  go({p, t}, '');
}
if (controls) controls.addEventListener('start', ()=>{ tween = null; markView(''); });
$('nm-test').onclick = ()=>{ st.model = GIX; st.tab = 'pintura'; render(); go(VIEWS.tq,'tq'); };

// Cargar una moto propia (.glb / .gltf) para el modelo escogido
$('glb').addEventListener('change', e=>{
  const f = e.target.files && e.target.files[0]; if (!f) return;
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
        glbZones = [...mats.values()].filter(mt=> mt.color).slice(0,16).map((mt,i)=> ({k:'g'+i, n: mt.name ? mt.name.replace(/[_.]/g,' ') : 'Material '+(i+1), mats:[mt], hex:'#'+mt.color.getHexString(), fin: mt.roughness!==undefined && mt.roughness>.6 ? 'mate' : 'brillante'}));
        glbZones.forEach(z=> st.paint[z.k] = [z.hex, z.fin]); st.zone = (glbZones[0]||{}).k;
        render(); go(VIEWS.tq, 'tq'); setSpin(!reduce); toast('Moto cargada en el taller');
      }, err=> toast('No pude abrir ese archivo. Prueba con un .glb'));
    } catch(err){ toast('No pude abrir ese archivo. Prueba con un .glb'); }
  };
  rd.readAsArrayBuffer(f); e.target.value = '';
});
