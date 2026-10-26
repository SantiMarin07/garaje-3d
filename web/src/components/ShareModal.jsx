import { useEffect, useRef, useState } from 'react';
import { useGaraje } from '../hooks/useGaraje.js';

export default function ShareModal({ open, onClose, community }) {
  const g = useGaraje();
  const cv = useRef(null);
  const [name, setName] = useState('');
  useEffect(() => { if (open && cv.current) g.drawPhoto(cv.current, name); }, [open, name]);
  useEffect(() => {
    if (!open) return;
    const k = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [open, onClose]);
  if (!open) return null;
  const download = () => cv.current.toBlob(b => {
    const u = URL.createObjectURL(b), a = document.createElement('a');
    a.href = u; a.download = (g.slug(name) || 'mi-build') + '.png'; a.click(); setTimeout(() => URL.revokeObjectURL(u), 2000);
  }, 'image/png');
  const publish = async () => {
    try { await community.publish(Object.assign({ name: name || 'Mi build' }, g.buildFields())); g.actions.toast('Publicado en El parche'); onClose(); g.actions.selectTab('parche'); }
    catch (e) { g.actions.toast('No se pudo publicar'); }
  };
  return (
    <div className="modal open" id="share" role="dialog" aria-modal="true" aria-label="Compartir build" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="mbox glass">
        <div className="mh"><div><span className="kick">Compartir</span><h3>Tu build</h3></div><button className="btn" aria-label="Cerrar" onClick={onClose}>✕</button></div>
        <div className="mgrid">
          <canvas id="photo" ref={cv} width="1080" height="1350"></canvas>
          <div className="mside">
            <label className="lab2" htmlFor="bname">Ponle nombre</label>
            <input id="bname" className="inp" maxLength={28} placeholder="Ej. La Bronce Nocturna" value={name} onChange={e => setName(e.target.value)} />
            <p className="note">La foto se arma con el ángulo y los colores que tienes ahora.</p>
            <button className="btn primary wide" id="dl" onClick={download}>Descargar foto</button>
            <button className="btn wide" id="pub" onClick={publish}>Publicar en El parche</button>
          </div>
        </div>
      </div>
    </div>
  );
}
