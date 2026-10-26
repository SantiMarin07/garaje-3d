# Garaje 3D (React + Vite + Three.js)

## Correr
    npm install
    npm run dev        # http://localhost:5173
    npm run build      # genera /dist para subir al hosting

## Estructura
- `src/config.js` → textos y ajustes internos (dominio, precio, moneda, claves de localStorage, URL del HDRI, API_URL).
- `src/engine/garaje.js` → motor 3D (Three.js): moto, pintura, diseños, piezas, cámara, audio. Expone `createGaraje(stage)`.
- `src/engine/three.js` → Three r128 + addons (OrbitControls, GLTFLoader, EXR, postprocesado).
- `src/hooks/useGaraje.js` → hook que conecta el motor con React.
- `src/components/` → toda la interfaz (TopBar, Rail, Panel + `panels/*`, Views, BuildBar, ShareModal...).
- `src/services/community.js` → "El parche" (hoy usa localStorage).
- `public/workshop.exr` → ambiente HDRI del taller.

## Conectar tu backend (Node + MySQL)
Crea otro servicio con la misma interfaz que `createLocalCommunity()` (`get, subscribe, publish, toggleLike, profiles`),
que llame a tu API (`CONFIG.API_URL`), y cámbialo en `App.jsx`. Ver `docs/BACKEND.md`.

## Tu escaneo
Botón "Cargar escaneo (.glb)". Para pintar por zonas y cambiar piezas el .glb debe venir separado en partes con nombre (Blender).
