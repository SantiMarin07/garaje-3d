import { useGaraje } from '../hooks/useGaraje.js';
import { CONFIG } from '../config.js';
import MotoPanel from './panels/MotoPanel.jsx';
import PinturaPanel from './panels/PinturaPanel.jsx';
import DisenosPanel from './panels/DisenosPanel.jsx';
import { PiezasPanel, AccesoriosPanel } from './panels/PiezasAccesorios.jsx';
import RevisionPanel from './panels/RevisionPanel.jsx';
import ParchePanel from './panels/ParchePanel.jsx';

export function Empty({ title, children, withLoad }) {
  return (
    <div className="empty"><b>{title}</b><span>{children}</span>
      {withLoad && <label htmlFor="glb" className="btn">Cargar escaneo (.glb)</label>}
    </div>
  );
}

export default function Panel({ community }) {
  const g = useGaraje();
  const { st } = g;
  const hand = g.isHand(), obj = g.activeObj();
  const H = {
    moto: ['Paso 1', 'Busca tu moto', 'Marcas y modelos que se venden en Colombia.'],
    pintura: ['Paso 2', 'Pintura', hand ? 'Escoge la zona y dale el color y el acabado que quieras.' : 'En un escaneo el color se aplica como tinte sobre la textura real.'],
    disenos: ['Paso 3', 'Diseños', 'Escoge un diseño o sube tu imagen y tócala sobre la moto para pegarla.'],
    piezas: ['Paso 4', 'Piezas', 'Cambia piezas de fábrica por piezas de otras referencias.'],
    accesorios: ['Paso 5', 'Accesorios', 'Lo que más le meten los moteros en Colombia.'],
    revision: ['Antes de salir', 'Tecnomecánica', 'Revisa si tu build pasa la revisión técnico-mecánica.'],
    parche: ['Comunidad', 'El parche', 'Builds de otros moteros. Pruébalos en tu moto y dales like.'],
  }[st.tab];

  let body;
  if (st.tab === 'moto') body = <MotoPanel />;
  else if (st.tab === 'parche') body = <ParchePanel community={community} />;
  else if (!obj) body = <Empty title="Primero carga esta moto en 3D" withLoad>Escanéala con el celular y sube el archivo .glb, o mira la Gixxer 150 de prueba.</Empty>;
  else if (st.tab === 'revision') body = <RevisionPanel />;
  else if (st.tab === 'pintura') body = <PinturaPanel />;
  else if (st.tab === 'disenos') body = <DisenosPanel />;
  else if (st.tab === 'piezas') body = <PiezasPanel />;
  else if (st.tab === 'accesorios') body = <AccesoriosPanel />;

  return (
    <section className="panel glass" aria-label="Opciones">
      <div className="ph">
        <span className="kick" id="p-kick">{H[0]}</span>
        <h3 id="p-name">{H[1]}</h3>
        <p id="p-hint">{H[2]}</p>
      </div>
      <div className="opts" id="opts" role="group">{body}</div>
      <div className="pf"><small id="p-note">Los precios aparecen cuando conectemos los talleres y tiendas.</small></div>
    </section>
  );
}
