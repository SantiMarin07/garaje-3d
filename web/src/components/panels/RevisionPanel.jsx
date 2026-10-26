import { useGaraje } from '../../hooks/useGaraje.js';

export default function RevisionPanel() {
  const g = useGaraje();
  const it = g.revItems(), rv = g.revSummary();
  return (
    <>
      <div className={'revtop ' + (rv.w ? 'warn' : 'ok')}><b>{rv.txt}</b><span>{rv.w ? 'Arregla esto antes de ir al CDA.' : 'Con lo que tiene, tu moto debería pasar.'}</span></div>
      <div className="olist">
        {it.map(i => (
          <div key={i.n} className={'rv ' + i.s}><span className="rvd" aria-hidden="true"></span><span><b>{i.n}</b><span>{i.d}</span></span><span className="rvs">{i.s === 'ok' ? 'Bien' : 'Revisar'}</span></div>
        ))}
      </div>
      <p className="note">Es una guía para orientarte. La decisión final la toma el CDA en la revisión.</p>
    </>
  );
}
