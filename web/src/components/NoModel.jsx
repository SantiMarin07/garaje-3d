import { useGaraje } from '../hooks/useGaraje.js';

export default function NoModel() {
  const g = useGaraje();
  const m = g.curModel();
  return (
    <>
      {g.ui.webglError && <div className="err">Tu navegador no pudo iniciar WebGL, así que el garaje 3D no se puede mostrar aquí.</div>}
      <div className="nomodel glass" id="nomodel" hidden={!!g.activeObj()}>
        <span className="kick">Falta el modelo 3D</span>
        <b id="nm-name">{m.brand + ' ' + m.model}</b>
        <span>Esta moto todavía no está en 3D. Escanéala con el celular y sube el archivo, o mira cómo funciona con la Gixxer 150 de prueba.</span>
        <span className="row2"><label htmlFor="glb" className="btn primary">Cargar escaneo (.glb)</label><button className="btn" id="nm-test" onClick={g.actions.useTestModel}>Ver la de prueba</button></span>
      </div>
    </>
  );
}
