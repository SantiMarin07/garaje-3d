import { useEffect, useState } from 'react';
import { useGaraje } from '../../hooks/useGaraje.js';
import { Empty } from '../Panel.jsx';

const HEX = /^#[0-9a-f]{6}$/i;

export default function ParchePanel({ community }) {
  const g = useGaraje();
  const { builds, likes, ready, me } = g.community();
  const [names, setNames] = useState({});
  const ids = builds.map(b => b.by || '').filter(Boolean).join(',');
  useEffect(() => {
    if (!community || !ids) return;
    let live = true;
    community.profiles([...new Set(ids.split(','))]).then(ps => { if (live) setNames(ps); }).catch(() => {});
    return () => { live = false; };
  }, [community, ids]);

  if (!ready) return <Empty title="El parche no está disponible aquí">La galería de builds necesita el servicio de comunidad conectado.</Empty>;
  if (!builds.length) return <Empty title="Todavía nadie ha publicado su build">Arma el tuyo, dale Compartir y publícalo. Aparece aquí para que el parche lo vea y le dé like.</Empty>;

  const likeCount = id => Object.values(likes).filter(m => m && m[id]).length;
  const mine = me ? (likes[me] || {}) : {};
  const sorted = builds.slice().sort((a, b) => likeCount(b.id) - likeCount(a.id));
  return (
    <div className="olist">
      {sorted.map((b, i) => {
        const mod = g.MODELS.find(m => m.id === b.model);
        const dots = Object.values(b.paint || {}).filter(p => Array.isArray(p) && HEX.test(p[0])).slice(0, 5);
        const nParts = Object.values(b.parts || {}).filter(v => v === 'biker').length, nAcc = Object.values(b.acc || {}).filter(Boolean).length;
        const who = names[b.by];
        return (
          <div className="bcard" key={b.id}>
            {i === 0 && likeCount(b.id) ? <span className="crown">Build de la semana</span> : null}
            <div className="row"><span className="on">{String(b.name || 'Sin nombre').slice(0, 40)}</span><span className="dots">{dots.map((p, k) => <span key={k} className="dot" style={{ background: p[0] }}></span>)}</span></div>
            <span className="od">{mod ? mod.brand + ' ' + mod.model : 'Moto'} · por <span className="who">{who ? (who.isMe ? 'ti' : (who.name || 'alguien del parche')) : 'alguien del parche'}</span></span>
            <span className="tags"><span className="tag">{nParts} piezas</span><span className="tag">{nAcc} accesorios</span>{b.designs ? <span className="tag">{+b.designs || 0} diseños</span> : null}</span>
            <span className="row2">
              <button className="btn" onClick={() => g.actions.tryBuild(b)}>Probar este build</button>
              <button className="btn" aria-pressed={!!mine[b.id]} onClick={() => community.toggleLike(b.id).catch(() => g.actions.toast('No se pudo guardar el like'))}>{mine[b.id] ? 'Te gusta' : 'Me gusta'} · {likeCount(b.id)}</button>
            </span>
          </div>
        );
      })}
    </div>
  );
}
