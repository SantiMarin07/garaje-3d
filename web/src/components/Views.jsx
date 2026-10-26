import { useGaraje } from '../hooks/useGaraje.js';

const VIEWS = [['taller', 'Taller'], ['tq', '3/4'], ['lado', 'Lado'], ['frente', 'Frente'], ['atras', 'Atrás']];

export function Views() {
  const { ui, actions: a } = useGaraje();
  return (
    <div className="views glass" role="group" aria-label="Cámara">
      {VIEWS.map(([k, n]) => <button key={k} data-v={k} aria-pressed={ui.view === k} onClick={() => a.goView(k)}>{n}</button>)}
      <button id="spin" aria-pressed={ui.spinning} onClick={a.toggleSpin}>Girar plataforma</button>
    </div>
  );
}

export function EngineBar() {
  const { ui, actions: a } = useGaraje();
  const down = e => { if (!ui.engOn) return; e.preventDefault(); a.setGas(true); };
  const up = () => a.setGas(false);
  return (
    <div className="engine glass" role="group" aria-label="Motor">
      <button id="eng-on" aria-pressed={ui.engOn} onClick={a.toggleEngine}>{ui.engOn ? 'Apagar' : 'Prender moto'}</button>
      <button id="eng-gas" aria-pressed={ui.gas} disabled={!ui.engOn}
        onPointerDown={down} onPointerUp={up} onPointerLeave={up} onPointerCancel={up}
        onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') down(e); }}
        onKeyUp={e => { if (e.key === ' ' || e.key === 'Enter') up(); }}>Acelerar (mantén)</button>
      <span className="tach" id="tach" hidden={!ui.engOn}>
        <span className="tbar"><span id="rpmbar" style={{ width: Math.min(100, ui.rpm / 90) + '%' }}></span></span>
        <b id="rpm">{Math.round(ui.rpm / 50) * 50} rpm</b>
      </span>
    </div>
  );
}
