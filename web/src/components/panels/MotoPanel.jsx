import { useGaraje } from '../../hooks/useGaraje.js';

export default function MotoPanel() {
  const g = useGaraje();
  const { st, actions: a } = g;
  const q = st.q.trim().toLowerCase();
  const list = g.MODELS.filter(x => (st.brand === 'Todas' || x.brand === st.brand) && (st.type === 'Todas' || x.kind === st.type) && (!q || (x.brand + ' ' + x.model).toLowerCase().includes(q)));
  return (
    <>
      <label className="lab2" htmlFor="q">Buscar marca o modelo</label>
      <input id="q" className="inp" type="search" placeholder="Ej. Pulsar NS 200" value={st.q} autoComplete="off" onChange={e => a.setQuery(e.target.value)} />
      <div className="chiprow scroll" role="group" aria-label="Marca">
        {['Todas'].concat(g.CAT.map(c => c[0])).map(b => <button key={b} className="pill" aria-pressed={st.brand === b} onClick={() => a.setBrand(b)}>{b}</button>)}
      </div>
      <div className="chiprow scroll" role="group" aria-label="Tipo">
        {g.TYPES.map(t => <button key={t} className="pill sm" aria-pressed={st.type === t} onClick={() => a.setType(t)}>{t}</button>)}
      </div>
      <div className="mlist">
        {list.length ? list.map(x => {
          const ready = g.isLoaded(x.id), test = x.id === g.GIX;
          const badge = ready ? <span className="bd ok">3D listo</span> : (test ? <span className="bd test">Modelo de prueba</span> : <span className="bd">Falta el 3D</span>);
          return (
            <button key={x.id} className="mrow" aria-pressed={st.model === x.id} onClick={() => a.selectModel(x.id)}>
              <span className="mt"><span className="mb">{x.brand}</span><span className="mm">{x.model}</span></span>
              <span className="mi"><span>{x.cc} cc · {x.kind}</span>{badge}</span>
              {x.top ? <span className="topn">Top {x.top} en ventas</span> : null}
            </button>
          );
        }) : <p className="note">No encontré esa moto. Revisa cómo la escribiste o quita los filtros.</p>}
      </div>
      <p className="note">Las marcas y modelos aparecen solo para que ubiques tu moto. Los modelos 3D oficiales se consiguen con escaneos o con acuerdos con cada marca.</p>
    </>
  );
}
