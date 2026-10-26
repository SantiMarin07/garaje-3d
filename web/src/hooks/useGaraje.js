import { createContext, useContext, useSyncExternalStore } from 'react';

// El motor 3D (src/engine/garaje.js) guarda el estado y avisa cada cambio.
// useGaraje() devuelve el motor y vuelve a dibujar el componente cuando algo cambia.
export const GarajeContext = createContext(null);

export function useGaraje() {
  const g = useContext(GarajeContext);
  useSyncExternalStore(g.subscribe, g.getVersion);
  return g;
}
