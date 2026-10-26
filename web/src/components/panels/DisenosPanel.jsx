import { useGaraje } from '../../hooks/useGaraje.js';

export default function DisenosPanel() {
  const g = useGaraje();
  const { st, actions: a } = g;
  // el texto del número vive en el motor (se usa al dibujar el diseño)
  return (
    <>
      <div className="dgrid">
        {g.DESIGNS.map(d => <button key={d.k} className="dsg" aria-pressed={st.design === d.k} onClick={() => a.pickDesign(d.k)}><img src={d.thumb} alt="" /><span>{d.n}</span></button>)}
        <label className="dsg up" htmlFor="dimg"><span className="plus" aria-hidden="true">+</span><span>Sube tu diseño</span></label>
      </div>
      <input type="file" id="dimg" accept="image/png,image/jpeg,image/webp" className="vh"
        onChange={e => { a.loadDesignImage(e.target.files && e.target.files[0]); e.target.value = ''; }} />
      {st.design === 'numero' && <>
        <label className="lab2" htmlFor="dnum">Tu número</label>
        <input id="dnum" className="inp" type="text" maxLength={3} defaultValue="07" onChange={e => a.setNumTxt(e.target.value)} />
      </>}
      <label className="lab2" htmlFor="dsize">Tamaño · {Math.round(st.dsize * 100)} cm</label>
      <input type="range" id="dsize" min="6" max="40" value={Math.round(st.dsize * 100)} onChange={e => a.setDesignSize(+e.target.value)} />
      <label className="lab2" htmlFor="drot">Giro · {Math.round(st.drot)}°</label>
      <input type="range" id="drot" min="-180" max="180" value={Math.round(st.drot)} onChange={e => a.setDesignRot(+e.target.value)} />
      <button className="btn primary wide" id="place" aria-pressed={st.placing} onClick={a.togglePlace}>{st.placing ? 'Toca la moto para pegarlo' : 'Pegar en la moto'}</button>
      <div className="row2"><button className="btn" id="d-undo" onClick={a.undoDecal}>Quitar el último</button><button className="btn" id="d-clear" onClick={a.clearDecals}>Quitar todos</button></div>
      <p className="note">Tip: acércate con la cámara a la zona antes de pegarlo. Las fotos o logos de otras marcas solo si tienes permiso de usarlos.</p>
    </>
  );
}
