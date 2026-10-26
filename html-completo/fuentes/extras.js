/* =============== EXTRAS: revisión, motor, foto, El parche =============== */
// ---- Revisión técnico-mecánica (guía orientativa) ----
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

// ---- Prender la moto: sonido sintetizado ----
let ac = null, eng = null, rpm = 0, throttle = false;
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
  $('rpm').textContent = Math.round(rpm/50)*50 + ' rpm';
  $('rpmbar').style.width = Math.min(100, rpm/90) + '%';
}
function setEngineUI(){ const on = !!eng; $('eng-on').setAttribute('aria-pressed', on); $('eng-on').textContent = on ? 'Apagar' : 'Prender moto'; $('eng-gas').disabled = !on; $('tach').hidden = !on; if (!on){ const o = activeObj(); if (o){ o.rotation.x = 0; o.rotation.z = 0; } } }
$('eng-on').onclick = ()=>{ if (eng) engineOff(); else engineOn(); setEngineUI(); };
const gasDown = (e)=>{ if (!eng) return; e.preventDefault(); throttle = true; $('eng-gas').setAttribute('aria-pressed','true'); };
const gasUp = ()=>{ throttle = false; $('eng-gas').setAttribute('aria-pressed','false'); };
$('eng-gas').addEventListener('pointerdown', gasDown); ['pointerup','pointerleave','pointercancel'].forEach(ev=> $('eng-gas').addEventListener(ev, gasUp));
$('eng-gas').addEventListener('keydown', e=>{ if (e.key===' ' || e.key==='Enter'){ gasDown(e); } });
$('eng-gas').addEventListener('keyup', e=>{ if (e.key===' ' || e.key==='Enter') gasUp(); });

// ---- Compartir: foto del build y El parche ----
let downloads = null, db = null, user = null, me = null, builds = [], likes = {}, communityReady = false;
function buildFields(){
  const paint = {}; if (isHand()) HAND_ZONES.forEach(z=> paint[z.k] = st.paint[z.k]);
  return {model: st.model, paint, parts: Object.assign({}, st.parts), acc: Object.assign({}, st.acc), designs: decals.filter(d=> d.userData.model===st.model).length};
}
function shareOpen(){ if (!activeObj()){ toast('Primero carga la moto'); return; } $('share').hidden = false; $('bname').focus(); drawPhoto(); }
$('share-btn').onclick = shareOpen;
$('share-close').onclick = ()=>{ $('share').hidden = true; };
$('share').addEventListener('keydown', e=>{ if (e.key==='Escape') $('share').hidden = true; });
$('bname').addEventListener('input', ()=> drawPhoto());
function drawPhoto(){
  if (!renderer) return;
  renderer.render(scene, camera);
  const src = renderer.domElement, W = 1080, H = 1350, c = $('photo'); c.width = W; c.height = H; const g = c.getContext('2d');
  g.fillStyle = '#0b0c0f'; g.fillRect(0,0,W,H);
  const ih = 1000, r = Math.max(W/src.width, ih/src.height), sw = W/r, sh = ih/r;
  g.drawImage(src, (src.width-sw)/2, (src.height-sh)/2, sw, sh, 0, 0, W, ih);
  const grd = g.createLinearGradient(0, ih-260, 0, ih); grd.addColorStop(0,'rgba(11,12,15,0)'); grd.addColorStop(1,'rgba(11,12,15,1)'); g.fillStyle = grd; g.fillRect(0, ih-260, W, 260);
  const m = curModel(), name = ($('bname').value || 'Mi build').slice(0,28);
  g.fillStyle = '#FF5B1F'; g.save(); g.translate(64, 70); g.transform(1,0,-.32,1,0,0); g.fillRect(0,0,18,18); g.restore();
  g.fillStyle = '#F3F1EC'; g.font = '800 italic 54px "Saira Extra Condensed", "Arial Narrow", Impact, sans-serif'; g.textBaseline = 'top'; g.fillText('GARAJE', 100, 52);
  g.font = '600 26px "Barlow", system-ui, sans-serif'; g.fillStyle = '#B4B9C2'; g.fillText(m.brand.toUpperCase()+' · '+m.model.toUpperCase(), 64, ih-170);
  g.fillStyle = '#F3F1EC'; g.font = '800 italic 110px "Saira Extra Condensed", "Arial Narrow", Impact, sans-serif'; g.fillText(name.toUpperCase(), 60, ih-136, W-120);
  let x = 64, y = ih+40; g.font = '600 26px "Barlow", system-ui, sans-serif';
  const ch = changes(); (ch.length ? ch : ['De fábrica']).slice(0,8).forEach(t=>{ const w = g.measureText(t).width + 36; if (x + w > W-64){ x = 64; y += 62; } g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(x, y, w, 48); g.strokeStyle = 'rgba(255,255,255,.22)'; g.lineWidth = 2; g.strokeRect(x+1, y+1, w-2, 46); g.fillStyle = '#F3F1EC'; g.fillText(t, x+18, y+10); x += w + 12; });
  const rv = revSummary(); if (rv){ g.font = '600 24px "Barlow", system-ui, sans-serif'; g.fillStyle = rv.w ? '#F2C230' : '#3FD08A'; g.fillText((rv.w ? '● ' : '● ')+'Tecnomecánica: '+rv.txt, 64, H-78); }
  g.fillStyle = '#B4B9C2'; g.font = '500 24px "JetBrains Mono", monospace'; g.textAlign = 'right'; g.fillText('[TU-DOMINIO]', W-64, H-78); g.textAlign = 'left';
}
$('dl').onclick = async ()=>{
  drawPhoto();
  const blob = await new Promise(res=> $('photo').toBlob(res, 'image/png'));
  if (!downloads || !blob){ toast('Aquí no se puede descargar. Mantén presionada la imagen para guardarla'); return; }
  const fname = 'garaje-' + (slug($('bname').value || 'mi-build') || 'mi-build') + '.png';
  try { await downloads.save({filename: fname, data: blob}); toast('Foto guardada'); }
  catch(e){ if (e && e.code==='declined') return; toast('No se pudo guardar la foto'); }
};
$('pub').onclick = async ()=>{
  if (!db || !me){ toast('Para publicar en El parche tienes que entrar con tu cuenta'); return; }
  const name = ($('bname').value || '').trim().slice(0,40);
  if (!name){ toast('Ponle un nombre a tu build'); $('bname').focus(); return; }
  try { await db.collection('builds').doc(me).set(Object.assign({by: me, name, updatedAt: new Date().toISOString()}, buildFields())); toast('Publicado en El parche'); $('share').hidden = true; st.tab = 'parche'; render(); }
  catch(e){ toast('No se pudo publicar. Intenta de nuevo en un rato'); }
};
const HEX = /^#[0-9a-f]{6}$/i;
function likeCount(id){ return Object.values(likes).filter(m=> m && m[id]).length; }
function parcheHTML(){
  if (!communityReady) return `<div class="empty"><b>El parche no está disponible aquí</b><span>La galería de builds funciona cuando abres la página con tu cuenta de Claude.</span></div>`;
  if (!builds.length) return `<div class="empty"><b>Todavía nadie ha publicado su build</b><span>Arma el tuyo, dale Compartir y publícalo. Aparece aquí para que el parche lo vea y le dé like.</span></div>`;
  const mine = me ? (likes[me]||{}) : {};
  const sorted = builds.slice().sort((a,b)=> likeCount(b.id) - likeCount(a.id));
  return `<div class="olist">${sorted.map((b,i)=>{
    const mod = MODELS.find(m=> m.id===b.model); const dots = Object.values(b.paint||{}).filter(p=> Array.isArray(p) && HEX.test(p[0])).slice(0,5).map(p=> `<span class="dot" style="background:${p[0]}"></span>`).join('');
    const nParts = Object.values(b.parts||{}).filter(v=> v==='biker').length, nAcc = Object.values(b.acc||{}).filter(Boolean).length;
    return `<div class="bcard">${i===0 && likeCount(b.id) ? '<span class="crown">Build de la semana</span>' : ''}
      <div class="row"><span class="on">${esc(String(b.name||'Sin nombre').slice(0,40))}</span><span class="dots">${dots}</span></div>
      <span class="od">${mod ? esc(mod.brand+' '+mod.model) : 'Moto'} · por <span class="who" data-uid="${esc(b.by||'')}">alguien del parche</span></span>
      <span class="tags"><span class="tag">${nParts} piezas</span><span class="tag">${nAcc} accesorios</span>${b.designs?`<span class="tag">${+b.designs||0} diseños</span>`:''}</span>
      <span class="row2"><button class="btn" data-try="${esc(b.id)}">Probar este build</button><button class="btn" data-like="${esc(b.id)}" aria-pressed="${!!mine[b.id]}">${mine[b.id] ? 'Te gusta' : 'Me gusta'} · ${likeCount(b.id)}</button></span></div>`; }).join('')}</div>`;
}
async function fillNames(){
  if (!user) return; const els = [...document.querySelectorAll('.who[data-uid]')]; const ids = [...new Set(els.map(e=> e.dataset.uid).filter(Boolean))]; if (!ids.length) return;
  const ps = await user.profiles(ids); els.forEach(e=>{ const p = ps[e.dataset.uid]; if (p) e.textContent = p.isMe ? 'ti' : (p.name || 'alguien del parche'); });
}
function tryBuild(id){
  const b = builds.find(x=> x.id===id); if (!b || !MODELS.some(m=> m.id===b.model)) return;
  st.model = b.model;
  Object.entries(b.paint||{}).forEach(([k,p])=>{ if (HAND_ZONES.some(z=> z.k===k) && Array.isArray(p) && HEX.test(p[0]) && FIN[p[1]]) st.paint[k] = [p[0], p[1]]; });
  Object.keys(st.parts).forEach(k=>{ const v = (b.parts||{})[k]; st.parts[k] = v==='biker' ? 'biker' : 'stock'; });
  st.acc = {}; ACCS.forEach(a=>{ if ((b.acc||{})[a.k]) st.acc[a.k] = true; });
  st.combo = null; st.showOrig = false; st.tab = 'pintura'; render(); go(VIEWS.tq,'tq'); setSpin(!reduce); toast('Probando: '+String(b.name||'build').slice(0,40));
}
async function toggleLike(id){
  if (!db || !me){ toast('Entra con tu cuenta para dar like'); return; }
  const cur = Object.assign({}, likes[me]||{}); if (cur[id]) delete cur[id]; else cur[id] = true;
  try { await db.collection('likes').doc(me).set({liked: cur}); } catch(e){ toast('No se pudo guardar el like'); }
}
(async ()=>{
  if (!window.claude || !window.claude.use) return;
  [downloads, db, user] = await Promise.all(['downloads','db','user'].map(n=> window.claude.use(n).catch(()=> null)));
  if (!downloads) $('dl').hidden = true;
  if (!db){ $('pub').hidden = true; return; }
  me = user ? await user.id() : null;
  if (!me) $('pub').hidden = true;
  communityReady = true;
  db.collection('builds').orderBy('updatedAt','desc').limit(100).onSnapshot(s=>{ builds = s.docs.map(d=> Object.assign({}, d.data()||{}, {id: d.id})); if (st.tab==='parche') render(); });
  db.collection('likes').onSnapshot(s=>{ likes = {}; s.docs.forEach(d=>{ const v = (d.data()||{}).liked; likes[d.id] = (v && typeof v==='object') ? v : {}; }); if (st.tab==='parche') render(); });
  if (st.tab==='parche') render();
})();
