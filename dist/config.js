/* ==========================================================================
   CONFIGURACIÓN DE RUNTIME DE LA API
   --------------------------------------------------------------------------
   Los cinco tableros conectados (comparativo bancario, Atlas vial, Marketing y
   clientes, Pulso comercial y Walmart M5) piden sus datos a la API del portafolio. Este
   archivo resuelve la base de esa API en tiempo de ejecución, para que el mismo
   artefacto sirva en local y en producción:

   * Producción (valor por omisión): `/api`, la ruta que publica el proxy. Sitio
     y API comparten origen, así que el navegador no hace peticiones
     cross-origin y CORS no necesita el dominio público.
   * Local: define `window.PORTFOLIO_API_BASE` antes de cargar este archivo
     (por ejemplo con un `config.local.js` no versionado) o sirve el sitio
     detrás del mismo proxy de `deploy/`.
   * Las verificaciones de navegador fijan directamente `window.PORTFOLIO_*_API`;
     si esas variables ya existen, este archivo no las toca.

   Aquí no hay ninguna URL absoluta ni ningún host local: por eso el artefacto
   publicado nunca apunta a una máquina de desarrollo.
   ========================================================================== */
(function () {
  'use strict';

  var BASE_POR_OMISION = '/api';

  var base = window.PORTFOLIO_API_BASE;
  if (typeof base !== 'string' || !base.trim()) base = BASE_POR_OMISION;
  base = base.trim().replace(/\/+$/, '');

  window.PORTFOLIO_API_BASE = base;

  /* Ruta real de cada servicio en la API (`/api/v1/...`). */
  var RUTAS = {
    PORTFOLIO_BANCA_API: '/v1/cnbv/banca-multiple',
    PORTFOLIO_ATLAS_API: '/v1/atlas-vial',
    PORTFOLIO_MARKETING_API: '/v1/marketing',
    PORTFOLIO_WALMEX_API: '/v1/walmex',
    PORTFOLIO_COMERCIAL_API: '/v1/comercial/m5'
  };

  Object.keys(RUTAS).forEach(function (nombre) {
    var actual = window[nombre];
    if (typeof actual === 'string' && actual.trim()) return;
    window[nombre] = base + RUTAS[nombre];
  });
})();
