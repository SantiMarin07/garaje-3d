import { useGaraje } from '../../hooks/useGaraje.js';

export default function PinturaPanel() {
  const g = useGaraje();
  const { st, actions: a } = g;
  const hand = g.isHand(), Z = g.zones();
  const z = Z.find(z => z.k === st.zone) || Z[0];
  const p = z ? (st.paint[z.k] || [z.hex, z.fin]) : null;
  return (
    <>
      {hand && <>
        <div className="lab2">Combinaciones rápidas</div>
        <div className="chiprow">{Object.entries(g.COMBOS).map(([k, c]) => <button key={k} className="pill" aria-pressed={st.combo === k} onClick={() => a.applyCombo(k)}>{c.n}</button>)}</div>
      </>}
      <div className="lab2">Zona</div>
      <div className="zlist">
        {Z.map(zz => { const pp = st.paint[zz.k] || [zz.hex, zz.fin]; return (
          <button key={zz.k} className="zrow" aria-pressed={st.zone === zz.k} onClick={() => a.selectZone(zz.k)}>
            <span className="dot" style={{ background: pp[0] }}></span><span>{zz.n}</span><span className="zf">{g.FIN[pp[1]][0]}</span>
          </button>); })}
      </div>
      {z && <>
        <div className="lab2">Color de {z.n.toLowerCase()}</div>
        <div className="swgrid">{g.SWATCH.map(h => <button key={h} className="swb" aria-label={'Color ' + h} aria-pressed={p[0].toLowerCase() === h} style={{ background: h }} onClick={() => a.setColor(h)} />)}</div>
        <div className="pick">
          <input type="color" id="cpick" value={p[0]} aria-label="Escoger cualquier color" onChange={e => a.setColor(e.target.value)} />
          <label htmlFor="cpick">Cualquier color</label><span className="hex">{p[0].toUpperCase()}</span>
        </div>
        <div className="lab2">Acabado</div>
        <div className="seg2" role="group" aria-label="Acabado">{Object.entries(g.FIN).map(([k, f]) => <button key={k} aria-pressed={p[1] === k} onClick={() => a.setFinish(k)}>{f[0]}</button>)}</div>
        <button className="btn ghost" id="z-reset" onClick={a.resetZone}>Dejar esta zona de fábrica</button>
      </>}
    </>
  );
}
