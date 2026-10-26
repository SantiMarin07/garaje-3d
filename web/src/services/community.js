// "El parche": builds publicados y likes.
// Esta versión guarda todo en el navegador (localStorage) para que funcione sin servidor.
// Para producción con Node + MySQL, crea otra implementación con la misma interfaz que
// llame a tu API (CONFIG.API_URL) y úsala en App.jsx. Ver docs/BACKEND.md.
import { CONFIG } from '../config.js';

export function createLocalCommunity() {
  const me = 'yo';
  let state = { builds: [], likes: {} };
  try { const sv = JSON.parse(localStorage.getItem(CONFIG.COMMUNITY_KEY) || 'null'); if (sv) state = { builds: sv.builds || [], likes: sv.likes || {} }; } catch (e) {}
  const listeners = new Set();
  const save = () => { try { localStorage.setItem(CONFIG.COMMUNITY_KEY, JSON.stringify(state)); } catch (e) {} listeners.forEach(f => f()); };
  return {
    me,
    ready: true,
    get: () => ({ builds: state.builds, likes: state.likes, me, ready: true }),
    subscribe(f) { listeners.add(f); return () => listeners.delete(f); },
    async publish(doc) {
      const entry = Object.assign({ id: me, by: me, updatedAt: new Date().toISOString() }, doc);
      state = { ...state, builds: [entry, ...state.builds.filter(b => b.id !== me)] };
      save();
    },
    async toggleLike(id) {
      const cur = Object.assign({}, state.likes[me] || {});
      if (cur[id]) delete cur[id]; else cur[id] = true;
      state = { ...state, likes: { ...state.likes, [me]: cur } };
      save();
    },
    async profiles(ids) { const out = {}; ids.forEach(i => { out[i] = { isMe: i === me, name: i === me ? 'ti' : 'alguien del parche' }; }); return out; },
  };
}
