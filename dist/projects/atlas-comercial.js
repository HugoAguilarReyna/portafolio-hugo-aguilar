/* ==========================================================================
   PROYECTO: Walmart M5 — Planeación de demanda y evaluación de pronósticos
   --------------------------------------------------------------------------
   Tablero construido con React, TypeScript y D3 (carpeta
   `dashboards/atlas-comercial/`). Se compila a un módulo ESM en
   `dist/dashboards/atlas-comercial/` y este archivo solo lo carga y lo monta
   DENTRO del portafolio.

   Datos: la API del backend del portafolio (`/api/v1/comercial/m5/*`), que lee la
   versión publicada en MongoDB **local**. El navegador nunca importa CSV ni habla
   con MongoDB.

   Si todavía no hay una versión importada, el tablero lo dice («Datos pendientes
   de importar») y no muestra cifras.

   Base de la API (en orden): `opts.apiBase` → `window.PORTFOLIO_COMERCIAL_API` →
   `/api/v1/comercial/m5`.
   ========================================================================== */

(function () {
  'use strict';

  var MODULO = 'dashboards/atlas-comercial/app.js';
  var ESTILOS = 'dashboards/atlas-comercial/app.css';

  var cargaModulo = null;
  var cargandoEstilos = false;

  function asegurarEstilos() {
    if (cargandoEstilos) return;
    if (document.querySelector('link[data-atlas-comercial]')) return;
    cargandoEstilos = true;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = ESTILOS;
    link.setAttribute('data-atlas-comercial', '');
    document.head.appendChild(link);
  }

  function cargarAplicacion() {
    if (!cargaModulo) {
      cargaModulo = import(new URL(MODULO, document.baseURI).toString());
    }
    return cargaModulo;
  }

  function mensaje(host, titulo, detalle) {
    host.innerHTML = '';
    var caja = document.createElement('div');
    caja.className = 'ac-app';
    caja.style.padding = '18px';
    caja.style.fontFamily = 'Inter, system-ui, sans-serif';

    var t = document.createElement('p');
    t.style.margin = '0 0 6px';
    t.style.fontWeight = '600';
    t.textContent = titulo;

    var p = document.createElement('p');
    p.style.margin = '0';
    p.style.fontSize = '12.5px';
    p.style.color = '#596273';
    p.textContent = detalle;

    caja.appendChild(t);
    caja.appendChild(p);
    host.appendChild(caja);
  }

  window.PORTFOLIO_PROJECTS.register({
    id: 'atlas-comercial',
    areaId: 'ciencia-de-datos',
    titulo: 'Walmart M5 — Planeación de demanda y evaluación de pronósticos',

    mount: function (host, api) {
      var vivo = true;
      var instancia = null;

      asegurarEstilos();
      host.innerHTML = '';

      if (api && typeof api.el === 'function') {
        var espera = api.el('p', '', 'Cargando la aplicación…');
        espera.style.padding = '18px';
        espera.style.color = '#596273';
        espera.style.fontFamily = 'Inter, system-ui, sans-serif';
        host.appendChild(espera);
      }

      cargarAplicacion()
        .then(function (modulo) {
          if (!vivo) return;
          host.innerHTML = '';
          instancia = modulo.mount(host, { apiBase: window.PORTFOLIO_COMERCIAL_API });
        })
        .catch(function (error) {
          if (!vivo) return;
          mensaje(
            host,
            'No se pudo cargar el tablero comercial',
            'Comprueba que exista dist/dashboards/atlas-comercial/app.js. Detalle: ' +
              (error && error.message ? error.message : 'error desconocido')
          );
        });

      return {
        destroy: function () {
          vivo = false;
          if (instancia && typeof instancia.unmount === 'function') {
            instancia.unmount();
          }
          instancia = null;
          host.innerHTML = '';
        },
        onResize: function () {
          if (instancia && typeof instancia.resize === 'function') instancia.resize();
        }
      };
    }
  });
})();
