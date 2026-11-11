import { useGaraje } from '../hooks/useGaraje.js';
import { CONFIG } from '../config.js';

export default function BuildBar({ onShare }) {
  const g = useGaraje();
  const { actions: a } = g;
  const ch = g.changes();
  return (
    <footer className="bottom glass">
      <div className="bc"><span className="lab">Tu build</span>
        <b id="b-count">{!g.activeObj() ? 'Moto sin modelo 3D' : (ch.length === 1 ? '1 cambio' : ch.length + ' cambios')}</b></div>
      <div className="chips" id="chips">{ch.map(t => <span className="chip" key={t}>{t}</span>)}</div>
      <div className="total"><span className="lab">Total aprox.</span><b>{/\d/.test(CONFIG.TOTAL_TEXT) ? `${CONFIG.TOTAL_TEXT} ${CONFIG.CURRENCY}` : CONFIG.TOTAL_TEXT}</b></div>
      <div className="acts">
        <button className="btn" id="reset" onClick={a.resetBuild}>Volver a original</button>
        <button className="btn" id="save" onClick={a.saveBuild}>Guardar</button>
        <button className="btn primary" id="share-btn" onClick={onShare}>Compartir build</button>
      </div>
    </footer>
  );
}
