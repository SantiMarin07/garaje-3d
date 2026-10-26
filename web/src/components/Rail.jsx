import { useGaraje } from '../hooks/useGaraje.js';

export default function Rail() {
  const g = useGaraje();
  const { st, actions: a } = g;
  return (
    <nav className="rail glass" aria-label="Categorías">
      <h2>Arma tu moto</h2>
      {g.TABS.map(t => (
        <button key={t.k} data-k={t.k}
          className={'cat' + (t.k === st.tab ? ' on' : '') + (g.tabMod(t.k) ? ' mod' : '')}
          aria-pressed={t.k === st.tab} onClick={() => a.selectTab(t.k)}>
          <span><span className="n">{t.n}</span><span className="s">{g.tabSub(t.k)}</span></span>
          <span className="m" aria-hidden="true"></span>
        </button>
      ))}
    </nav>
  );
}
