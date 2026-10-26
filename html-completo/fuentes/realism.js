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
  scene.traverse(o=>{ if (!o.isMesh || o.userData.isDecal) return; [].concat(o.material).forEach(m=>{ if (m && m.isMeshStandardMaterial){ m.envMap = envTex; m.envMapIntensity = intensity; m.needsUpdate = true; } }); });
}
if (renderer && THREE.EXRLoader && window.fflate){
  try {
    new THREE.EXRLoader().setDataType(THREE.HalfFloatType).load('workshop.exr', tex=>{
      const pm = new THREE.PMREMGenerator(renderer); pm.compileEquirectangularShader();
      envTex = pm.fromEquirectangular(tex).texture; tex.dispose(); pm.dispose();
      applyEnv(night ? .18 : .75);
    }, undefined, ()=>{});
  } catch(e){}
}

// Postproceso: oclusión ambiental (sombras en rincones y entre piezas), brillo en luces y antialias
let composer = null, saoPass = null, bloomPass = null, quality = 'alta';
const FinalShader = {
  uniforms:{tDiffuse:{value:null}, exposure:{value:1.05}},
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
    Object.assign(saoPass.params, {saoBias:.5, saoIntensity:.012, saoScale:3.2, saoKernelRadius:28, saoMinResolution:0, saoBlur:true, saoBlurRadius:6, saoBlurStdDev:3, saoBlurDepthCutoff:.01});
    const ro = saoPass.renderOverride.bind(saoPass);
    saoPass.renderOverride = function(){ const hidden = []; scene.traverse(o=>{ if (o.isReflector || (o.material && o.material.isShadowMaterial) || o.isSprite){ if (o.visible){ hidden.push(o); o.visible = false; } } }); ro.apply(null, arguments); hidden.forEach(o=> o.visible = true); };
    c.addPass(saoPass);
    bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(w, h), .55, .5, .92); c.addPass(bloomPass);
    c.addPass(new THREE.ShaderPass(FinalShader));
    if (THREE.SMAAPass){ c.addPass(new THREE.SMAAPass(w*pr, h*pr)); }
    return c;
  } catch(e){ return null; }
}
function setQuality(q){
  quality = q; $('q-alta').setAttribute('aria-pressed', q==='alta'); $('q-rapida').setAttribute('aria-pressed', q==='rapida');
  if (q==='alta' && !composer){ composer = buildComposer(); if (!composer){ quality = 'rapida'; $('q-alta').setAttribute('aria-pressed','false'); $('q-rapida').setAttribute('aria-pressed','true'); toast('Este equipo no soporta la calidad realista'); } else resizeComposer(); }
}
function resizeComposer(){ if (!composer) return; const w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return; composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(w, h); }
function renderFrame(){ if (quality==='alta' && composer) composer.render(); else renderer.render(scene, camera); }
$('q-alta').onclick = ()=> setQuality('alta');
$('q-rapida').onclick = ()=> setQuality('rapida');
