// Configuración interna del aplicativo. Cambia aquí los textos y claves.
export const CONFIG = {
  // Texto que aparece en la foto para redes (pon tu dominio real)
  DOMAIN_TEXT: '[TU-DOMINIO]',
  // Textos de precio mientras no haya talleres/tiendas conectados
  PRICE_TEXT: '[PRECIO]',
  TOTAL_TEXT: '[TOTAL]',
  CURRENCY: 'COP',
  // Clave donde se guarda el build en el navegador
  STORAGE_KEY: 'garaje-build-v2',
  // Clave donde se guarda "El parche" local (sin servidor)
  COMMUNITY_KEY: 'garaje-parche-v1',
  // Ruta del HDRI del taller (carpeta public/)
  ENV_URL: '/workshop.exr',
  // Si tienes backend (Node + MySQL), pon aquí la URL base de tu API y cambia
  // el servicio en src/services/community.js
  API_URL: '',
};
