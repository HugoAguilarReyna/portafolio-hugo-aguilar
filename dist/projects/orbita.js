/* ==========================================================================
   PROYECTO · ORBITA
   Área: Dashboards y visualización
   --------------------------------------------------------------------------
   El artefacto UI 26 se sirve como recurso estático en
   `dist/dashboards/orbita/index.html`. No se importa al bundle: se carga en un
   iframe same-origin al abrir la ficha, con altura medida desde su documento.
   La ficha monta la demo directamente, sin barra superior ni CTA duplicada.
   ========================================================================== */

(function () {
  'use strict';

  if (!window.PORTFOLIO_PROJECTS) return;

  var PAGINA = 'dashboards/orbita/index.html';
  /* Icono de la pestaña mientras la ficha está abierta: red neuronal con la
     paleta de datos del proyecto, sin fondo. Se restituye al salir. */
  var ICONO_ORBITA = 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2032%2032%22%3E%3Cg%20stroke%3D%22%23408e7a%22%20stroke-width%3D%221.9%22%20stroke-linecap%3D%22round%22%3E%3Cpath%20d%3D%22M6%2010%2016%206M6%2010%2016%2016M6%2022%2016%2016M6%2022%2016%2026M16%206%2026%2010M16%2016%2026%2010M16%2016%2026%2022M16%2026%2026%2022%22%2F%3E%3C%2Fg%3E%3Ccircle%20cx%3D%226%22%20cy%3D%2210%22%20r%3D%222.9%22%20fill%3D%22%23a36bd3%22%2F%3E%3Ccircle%20cx%3D%226%22%20cy%3D%2222%22%20r%3D%222.9%22%20fill%3D%22%23a36bd3%22%2F%3E%3Ccircle%20cx%3D%2216%22%20cy%3D%226%22%20r%3D%222.9%22%20fill%3D%22%23a36bd3%22%2F%3E%3Ccircle%20cx%3D%2216%22%20cy%3D%2216%22%20r%3D%223.3%22%20fill%3D%22%23e98239%22%2F%3E%3Ccircle%20cx%3D%2216%22%20cy%3D%2226%22%20r%3D%222.9%22%20fill%3D%22%23a36bd3%22%2F%3E%3Ccircle%20cx%3D%2226%22%20cy%3D%2210%22%20r%3D%222.9%22%20fill%3D%22%23a36bd3%22%2F%3E%3Ccircle%20cx%3D%2226%22%20cy%3D%2222%22%20r%3D%222.9%22%20fill%3D%22%23a36bd3%22%2F%3E%3C%2Fsvg%3E';
  var enlaceIcono = null;
  var iconoAnterior = null;

  var ALTO_MINIMO = 900;
  var ALTO_RESPALDO = 6200;


  /* El tablero vive en un iframe: el icono que ve el navegador es el del
     documento del portafolio. Se cambia solo mientras dura esta ficha. */
  function usarIconoDelProyecto() {
    var enlace = document.querySelector('link[rel~="icon"]');
    if (!enlace || enlaceIcono) return;
    enlaceIcono = enlace;
    iconoAnterior = {
      href: enlace.getAttribute('href'),
      type: enlace.getAttribute('type'),
      sizes: enlace.getAttribute('sizes'),
    };
    enlace.setAttribute('type', 'image/svg+xml');
    enlace.setAttribute('sizes', 'any');
    enlace.setAttribute('href', ICONO_ORBITA);
  }

  function restituirIcono() {
    if (!enlaceIcono) return;
    if (iconoAnterior.href === null) enlaceIcono.removeAttribute('href');
    else enlaceIcono.setAttribute('href', iconoAnterior.href);
    if (iconoAnterior.type === null) enlaceIcono.removeAttribute('type');
    else enlaceIcono.setAttribute('type', iconoAnterior.type);
    if (iconoAnterior.sizes === null) enlaceIcono.removeAttribute('sizes');
    else enlaceIcono.setAttribute('sizes', iconoAnterior.sizes);
    enlaceIcono = null;
    iconoAnterior = null;
  }

  function ajustarAlto(marco) {
    var documento = null;
    try {
      documento = marco.contentDocument;
    } catch (error) {
      return;
    }
    if (!documento || !documento.body) return;
    var alto = Math.max(
      documento.body.scrollHeight,
      Math.ceil(documento.body.getBoundingClientRect().height),
    );
    if (!alto) return;
    var nuevo = Math.max(ALTO_MINIMO, Math.ceil(alto) + 2);
    if (Math.abs(parseInt(marco.style.height || '0', 10) - nuevo) > 4) {
      marco.style.height = nuevo + 'px';
    }
  }

  window.PORTFOLIO_PROJECTS.register({
    id: 'orbita',
    areaId: 'dashboards',
    titulo: 'ORBITA',

    mount: function (host) {
      var marco = document.createElement('iframe');
      var observador = null;
      var temporizador = null;
      var vivo = true;

      usarIconoDelProyecto();

      host.innerHTML = '';
      host.style.padding = '0';

      marco.src = new URL(PAGINA, document.baseURI).toString();
      marco.title = 'ORBITA · explorador orbital';
      marco.allow = 'fullscreen';
      marco.setAttribute('allowfullscreen', '');
      marco.setAttribute('loading', 'eager');
      marco.style.cssText = 'display:block;width:100%;border:0;background:#f1f3fb;height:' + ALTO_RESPALDO + 'px;';
      marco.tabIndex = 0;

      marco.addEventListener('load', function () {
        if (!vivo) return;
        ajustarAlto(marco);
        try {
          if ('ResizeObserver' in window && marco.contentDocument && marco.contentDocument.body) {
            observador = new ResizeObserver(function () {
              ajustarAlto(marco);
            });
            observador.observe(marco.contentDocument.body);
          }
        } catch (error) {
          observador = null;
        }
        temporizador = window.setInterval(function () {
          if (vivo) ajustarAlto(marco);
        }, 1000);
      });

      var alRedimensionar = function () {
        if (vivo) ajustarAlto(marco);
      };
      window.addEventListener('resize', alRedimensionar);

      host.appendChild(marco);

      return {
        destroy: function () {
          vivo = false;
          restituirIcono();
          window.removeEventListener('resize', alRedimensionar);
          if (temporizador) window.clearInterval(temporizador);
          if (observador) observador.disconnect();
          temporizador = null;
          observador = null;
          host.innerHTML = '';
        },
        onResize: function () {
          ajustarAlto(marco);
        }
      };
    }
  });
})();
