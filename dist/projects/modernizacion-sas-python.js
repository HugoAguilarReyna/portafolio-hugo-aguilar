/* ==========================================================================
   PROYECTO · Modernización SAS → Python
   Área: Ingeniería de datos
   --------------------------------------------------------------------------
   Módulo independiente. Cuando el proyecto se desarrolle, mount() dibujará la
   aplicación dentro del portafolio y devolverá { destroy, onResize }.
   ========================================================================== */

(function () {
  'use strict';

  if (!window.PORTFOLIO_PROJECTS) return;

  window.PORTFOLIO_PROJECTS.register({
    id: 'modernizacion-sas-python',
    areaId: 'ingenieria-de-datos',
    titulo: 'Modernización SAS → Python',

    mount: function (host, api) {
      return api.placeholder(host, {
        titulo: 'Modernización SAS → Python',
        puntos: [
          'Entregable siguiente: datos sintéticos con el contrato de entrada',
          'Comparador celda por celda entre el proceso original y el migrado',
          'Tiempos de ejecución y reglas sin equivalente, documentados'
        ]
      });
    }
  });
})();
