import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { createGaraje } from './engine/garaje.js';
import { GarajeContext, useGaraje } from './hooks/useGaraje.js';
import { createLocalCommunity } from './services/community.js';
import TopBar from './components/TopBar.jsx';
import Rail from './components/Rail.jsx';
import Panel from './components/Panel.jsx';
import { Views, EngineBar } from './components/Views.jsx';
import BuildBar from './components/BuildBar.jsx';
import Toast from './components/Toast.jsx';
import NoModel from './components/NoModel.jsx';
import ShareModal from './components/ShareModal.jsx';

function Overlay({ community }) {
  const [share, setShare] = useState(false);
  return (
    <>
      <TopBar />
      <Rail />
      <Panel community={community} />
      <Views />
      <EngineBar />
      <BuildBar onShare={() => setShare(true)} />
      <Toast />
      <ShareModal open={share} onClose={() => setShare(false)} community={community} />
    </>
  );
}

function StageInner() {
  const g = useGaraje();
  useEffect(() => {
    const el = document.getElementById('stage');
    el.classList.toggle('placing', !!g.st.placing);
  });
  return <NoModel />;
}

export default function App() {
  const stageRef = useRef(null);
  const [g, setG] = useState(null);
  const community = useMemo(() => createLocalCommunity(), []);
  useEffect(() => {
    const eng = createGaraje(stageRef.current);
    const push = () => eng.actions.setCommunity(community.get());
    push();
    const off = community.subscribe(push);
    setG(eng);
    return () => { off(); eng.dispose(); };
  }, [community]);
  return (
    <div className="app">
      <div id="stage" ref={stageRef} aria-label="Garaje 3D con tu moto. Arrastra para girar la cámara.">
        {g && <GarajeContext.Provider value={g}><StageInner /></GarajeContext.Provider>}
      </div>
      {g && <GarajeContext.Provider value={g}><Overlay community={community} /></GarajeContext.Provider>}
    </div>
  );
}
