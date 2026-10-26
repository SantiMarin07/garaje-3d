import { useGaraje } from '../../hooks/useGaraje.js';
import { CONFIG } from '../../config.js';
import { Empty } from '../Panel.jsx';

export function PiezasPanel() {
  const g = useGaraje();
  const { st, actions: a } = g;
  if (!g.isHand()) return <Empty title="Las piezas se cambian por partes">Para cambiar piezas de tu escaneo hay que separarlo en partes con nombre (farola, exhosto, cola…). Mientras tanto puedes pintarlo y ponerle diseños.</Empty>;
  return g.PARTS.map(p => (
    <div key={p.k}>
      <div className="lab2">{p.n}</div>
      <div className="olist">
        {p.o.map((o, i) => { const v = i ? 'biker' : 'stock'; return (
          <button key={v} className="opt" aria-pressed={st.parts[p.k] === v} onClick={() => a.setPart(p.k, v)}>
            <span className="row"><span className="on">{o[0]}</span><span className="pr">{i ? CONFIG.PRICE_TEXT : 'De fábrica'}</span></span>
            <span className="od">{o[1]}</span>
          </button>); })}
      </div>
    </div>
  ));
}

export function AccesoriosPanel() {
  const g = useGaraje();
  const { st, actions: a } = g;
  if (!g.isHand()) return <Empty title="Los accesorios necesitan puntos de anclaje">Cuando separemos tu escaneo por partes, cada accesorio sabrá dónde montarse.</Empty>;
  return (
    <div className="olist">
      {g.ACCS.map(x => (
        <button key={x.k} className="opt acc" aria-pressed={!!st.acc[x.k]} onClick={() => a.toggleAcc(x.k)}>
          <span className="row"><span className="on">{x.n}</span><span className="pr">{st.acc[x.k] ? 'Puesto' : CONFIG.PRICE_TEXT}</span></span>
          <span className="od">{x.d}</span>
          <span className="tags"><span className="tag">{x.tag}</span></span>
        </button>
      ))}
    </div>
  );
}
