import { useGaraje } from '../hooks/useGaraje.js';

function Seg({ label, items, value, onChange }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {items.map(([id, text, val]) => (
        <button key={id} id={id} aria-pressed={value === val} onClick={() => onChange(val)}>{text}</button>
      ))}
    </div>
  );
}

export default function TopBar() {
  const g = useGaraje();
  const { ui, st, actions: a } = g;
  const m = g.curModel();
  return (
    <header className="top glass">
      <div className="logo">GARAJE<i></i></div>
      <button className="moto" id="moto-btn" aria-label="Cambiar de moto" onClick={a.goMotoTab}>
        <small>{m.brand}</small><b>{m.model}</b><span className="chg">Cambiar</span>
      </button>
      <span className="sp"></span>
      <Seg label="Calidad de imagen" value={ui.quality} onChange={a.setQuality}
        items={[['q-alta', 'Realista', 'alta'], ['q-rapida', 'Rápida', 'rapida']]} />
      <Seg label="Luces del garaje" value={ui.night} onChange={a.setNight}
        items={[['l-dia', 'Luces prendidas', false], ['l-noche', 'Modo noche', true]]} />
      <Seg label="Comparar" value={st.showOrig} onChange={a.setShowOrig}
        items={[['c-orig', 'Original', true], ['c-build', 'Mi build', false]]} />
      <input type="file" id="glb" accept=".glb,.gltf,model/gltf-binary"
        onChange={e => { a.loadGlb(e.target.files && e.target.files[0]); e.target.value = ''; }} />
      <label htmlFor="glb" className="btn" id="glb-label">Cargar escaneo</label>
    </header>
  );
}
