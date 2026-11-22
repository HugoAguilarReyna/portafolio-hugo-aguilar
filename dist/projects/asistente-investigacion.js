/* ==========================================================================
   PROYECTO · Briefing con evidencia · Banco de México
   Área: IA generativa y LLMs
   --------------------------------------------------------------------------
   La demo es una página autónoma en
   `dist/dashboards/briefing-banxico/index.html`: corpus local, recuperación
   léxica, citas trazables y gráfica D3. Se integra en la ficha con un marco del
   mismo origen y altura ajustada al contenido, como los demás tableros.

   La API local es opcional: el navegador llama a /api/v1/briefing-banxico y, si
   no responde, usa corpus.json. No hay claves ni URI de MongoDB en el cliente.
   ========================================================================== */

(function () {
  'use strict';

  if (!window.PORTFOLIO_PROJECTS) return;

  var PAGINA = 'dashboards/briefing-banxico/index.html';
  var ALTO_MINIMO = 780;
  var ALTO_RESPALDO = 4200;

  function ajustarAlto(marco) {
    var documento = null;
    try {
      documento = marco.contentDocument;
    } catch (error) {
      return;
    }
    if (!documento || !documento.body) return;
    /* `documentElement.scrollHeight` nunca es menor que el alto del marco: si se
       usa como medida, el marco se queda en su altura de respaldo y no encoge.
       El cuerpo de la demo sí declara su altura real, así que esa es la medida. */
    var alto = Math.max(
      documento.body.scrollHeight,
      Math.ceil(documento.body.getBoundingClientRect().height),
    );
    if (!alto) return;
    var nuevo = Math.max(ALTO_MINIMO, Math.ceil(alto) + 8);
    if (Math.abs(parseInt(marco.style.height || '0', 10) - nuevo) > 4) {
      marco.style.height = nuevo + 'px';
    }
  }

  window.PORTFOLIO_PROJECTS.register({
    id: 'asistente-investigacion',
    areaId: 'ia-generativa',
    titulo: 'Briefing con evidencia · Banco de México',

    mount: function (host, api) {
      var marco = document.createElement('iframe');
      var observador = null;
      var temporizador = null;
      var vivo = true;

      host.innerHTML = '';
      host.style.padding = '0';

      if (api && typeof api.el === 'function') {
        var espera = api.el('p', '', 'Cargando el briefing documental…');
        espera.style.padding = '18px';
        espera.style.color = '#596273';
        espera.style.fontFamily = 'Inter, system-ui, sans-serif';
        host.appendChild(espera);
      }

      var limpiarEspera = function () {
        var aviso = host.querySelector('p');
        if (aviso && aviso !== marco) aviso.remove();
      };

      var alRedimensionar = function () {
        if (vivo) ajustarAlto(marco);
      };

      marco.src = new URL(PAGINA, document.baseURI).toString();
      marco.title = 'Briefing con evidencia · Banco de México';
      marco.setAttribute('loading', 'eager');
      marco.setAttribute('scrolling', 'no');
      marco.style.width = '100%';
      marco.style.border = '0';
      marco.style.display = 'block';
      marco.style.height = ALTO_RESPALDO + 'px';
      marco.style.background = '#f2f4fb';

      marco.addEventListener('load', function () {
        if (!vivo) return;
        limpiarEspera();
        if (marco.contentDocument) {
          marco.contentDocument.documentElement.classList.add('embedded');
          if (marco.contentDocument.fonts) marco.contentDocument.fonts.ready.then(alRedimensionar);
        }
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
        }, 1200);
      });

      window.addEventListener('resize', alRedimensionar);

      host.appendChild(marco);

      return {
        destroy: function () {
          vivo = false;
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
