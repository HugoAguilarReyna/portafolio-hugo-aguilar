/* ==========================================================================
   HUGO AGUILAR — PORTAFOLIO
   app.js — presentación e interacciones
   --------------------------------------------------------------------------
   Este archivo no contiene textos del portafolio: el contenido vive en
   content.js (window.PORTAFOLIO).

   Bloques:
     1. Utilidades
     2. Ilustración de portada (red de datos animada)
     3. Escenas animadas del portafolio (reproductor; el dibujo está en scenes.js)
     4. Galería, filtros y franja de áreas
     5. Ficha emergente con URL enlazable
     6. Copiar correo
     7. Arranque
   ========================================================================== */

(function () {
  'use strict';

  /* ============ 1. UTILIDADES ============ */

  var DATA = window.PORTAFOLIO;
  if (!DATA || !Array.isArray(DATA.areas) || !DATA.areas.length) return;

  var AREAS = DATA.areas;
  var ESTADOS = DATA.estados || {};
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $$(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* Generador pseudoaleatorio con semilla: la red es siempre la misma */
  function rng(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  function num(n) {
    return Math.round(n * 10) / 10;
  }

  /* ============ 2. ILUSTRACIÓN DE PORTADA: RED DE DATOS ANIMADA ============
     Una sola red reutilizable: tres comunidades alrededor de un núcleo azul que
     forma parte de la red. Los pulsos recorren conexiones reales, llegan al
     núcleo y, a veces, continúan hacia otra comunidad.
     Sin dependencias: SVG + requestAnimationFrame.
     La animación se detiene si la ilustración sale del viewport, si la pestaña
     se oculta, si el usuario la pausa o si prefiere movimiento reducido.

     `initNetwork()` acepta opciones para montar la misma red en otro sitio:
       svg     elemento SVG anfitrión (por omisión, #network)
       toggle  botón de pausa (por omisión, #net-toggle; null si no hay)
       nucleo  false para la composición sin núcleo ni monograma
       semilla semilla del generador pseudoaleatorio
       ajustar true encuadra la vista al dibujo (sin margen muerto)
     ======================================================================== */

  function initNetwork(opciones) {
    var opts = opciones || {};
    var svg = opts.svg || document.getElementById('network');
    if (!svg) return;

    var toggle = opts.toggle !== undefined ? opts.toggle : document.getElementById('net-toggle');
    var conNucleo = opts.nucleo !== false;
    var semilla = opts.semilla || 20260411;
    var ajustar = !!opts.ajustar;

    var NS = 'http://www.w3.org/2000/svg';
    /* El centro está desplazado respecto al centro geométrico del lienzo porque
       una de las comunidades queda arriba: así el conjunto pesa igual arriba y
       abajo y los márgenes salen parejos. */
    var CENTER = { x: 260, y: 288 };

    var CORE_R = 7;                       /* núcleo: algo mayor que los nodos */
    var CORE_GROW = 0.32;                 /* cuánto crece al recibir una señal */
    var CORE_PULSE = 0.55;                /* duración del crecimiento */
    var CORE_CLEAR = 24;                  /* ningún enlace cruza el núcleo sin tocarlo */
    var ACTIVATION = 0.5;                 /* activación de un nodo secundario */
    var HALO = 0.6;                       /* duración del halo de activación */

    var reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    var toggleText = toggle ? toggle.querySelector('.net-toggle-text') : null;

    /* Paleta aprobada: mismos valores que los tokens de style.css */
    var C = {
      link: '#DDE2EB',
      node: '#596273',
      main: '#3458F5',
      secondary: '#8066E8',
      support: '#087F8C',
      ink: '#111318'
    };

    var nodes = [];
    var links = [];
    var pulses = [];
    var hits = [];
    var adjacency = [];
    var neighbors = {};
    var layer = {};
    var focusRing = null;

    var coreIndex = -1;
    var coreNeighbors = [[], [], []];

    var compact = false;
    var hoverIndex = -1;
    var focusIndex = -1;
    var pinnedIndex = -1;
    var appliedIndex = -2;
    var dirty = [];
    var clock = 0;
    var lastFrame = 0;
    var rafId = 0;
    var paused = false;
    var inView = true;
    var pageVisible = true;
    var ready = false;
    var rebuildTimer = 0;

    /* ---- utilidades de construcción ---- */

    function mk(tag, attrs) {
      var element = document.createElementNS(NS, tag);
      if (attrs) {
        for (var key in attrs) {
          if (Object.prototype.hasOwnProperty.call(attrs, key)) {
            element.setAttribute(key, attrs[key]);
          }
        }
      }
      return element;
    }

    function addLayer(className) {
      var group = mk('g', { 'class': className });
      svg.appendChild(group);
      return group;
    }

    /* Conserva <title> y <desc>; borra capas y nodos de texto sobrantes */
    function clearLayers() {
      var children = Array.prototype.slice.call(svg.childNodes);
      children.forEach(function (child) {
        var tag = child.nodeType === 1 ? child.tagName.toLowerCase() : '';
        if (tag === 'title' || tag === 'desc') return;
        svg.removeChild(child);
      });
    }

    /* ---- geometría ---- */

    /* Ningún enlace que no toque el núcleo puede pasar por encima de él. Sin
       núcleo el centro queda libre y las conexiones pueden cruzarlo. */
    function clearOfCore(a, b) {
      if (!conNucleo) return true;
      if (a === coreIndex || b === coreIndex) return true;

      var ax = nodes[a].bx;
      var ay = nodes[a].by;
      var dx = nodes[b].bx - ax;
      var dy = nodes[b].by - ay;
      var lengthSq = dx * dx + dy * dy;
      var t = lengthSq ? ((CENTER.x - ax) * dx + (CENTER.y - ay) * dy) / lengthSq : 0;
      t = Math.max(0, Math.min(1, t));
      var px = ax + dx * t;
      var py = ay + dy * t;
      return Math.hypot(px - CENTER.x, py - CENTER.y) > CORE_CLEAR;
    }

    /* ---- construcción ---- */

    /* Encuadre al dibujo: cuando se pide, ajusta el `viewBox` a la caja real de
       los nodos para que la red llene su espacio. No mueve ningún nodo. El
       margen es mínimo para que el borde superior del SVG coincida con el primer
       nodo visible (si no, queda una franja vacía dentro del lienzo). */
    function ajustarVista() {
      if (!ajustar || !layer.nodes) return;
      var caja = layer.nodes.getBBox();
      if (!caja || !caja.width || !caja.height) return;
      var pad = 2;
      svg.setAttribute('viewBox',
        num(caja.x - pad) + ' ' + num(caja.y - pad) + ' ' +
        num(caja.width + pad * 2) + ' ' + num(caja.height + pad * 2));
    }

    function build() {
      clearLayers();

      nodes = [];
      links = [];
      pulses = [];
      hits = [];
      adjacency = [];
      neighbors = {};
      coreNeighbors = [[], [], []];
      coreIndex = -1;
      hoverIndex = -1;
      focusIndex = -1;
      pinnedIndex = -1;
      appliedIndex = -2;
      dirty = [];
      clock = 0;

      compact = window.innerWidth < 640;

      var rand = rng(semilla);

      /* Comunidades algo más cerca del centro: la red se lee como un conjunto.
         En móvil hay menos nodos, así que el conjunto ocupa más lienzo para
         conservar la misma proporción. */
      var clusters = [
        { angle: -90, dist: compact ? 122 : 116, spread: compact ? 54 : 62, count: compact ? 12 : 22 },
        { angle: 32, dist: compact ? 128 : 122, spread: compact ? 58 : 68, count: compact ? 13 : 24 },
        { angle: 156, dist: compact ? 126 : 120, spread: compact ? 52 : 60, count: compact ? 11 : 20 }
      ];

      /* Nodos de las comunidades */
      clusters.forEach(function (cluster, ci) {
        var angle = (cluster.angle * Math.PI) / 180;
        var gx = CENTER.x + Math.cos(angle) * cluster.dist;
        var gy = CENTER.y + Math.sin(angle) * cluster.dist;

        for (var i = 0; i < cluster.count; i++) {
          var direction = rand() * Math.PI * 2;
          var radius = Math.sqrt(rand()) * cluster.spread;
          var big = rand() > 0.8;
          var support = rand() < 0.15;

          nodes.push({
            cluster: ci,
            isCore: false,
            bx: gx + Math.cos(direction) * radius,
            by: gy + Math.sin(direction) * radius,
            x: gx + Math.cos(direction) * radius,
            y: gy + Math.sin(direction) * radius,
            r: big ? 4.4 + rand() * 1.2 : 2 + rand() * 1.6,
            big: big,
            fill: support ? C.support : C.node,
            baseOpacity: 0.6 + rand() * 0.3,
            phase: rand() * Math.PI * 2,
            amp: 2 + rand() * 2.2,
            w1: 0.16 + rand() * 0.13,
            w2: 0.12 + rand() * 0.11,
            el: null,
            hit: null,
            group: null,
            lastFill: '',
            lastRadius: -1,
            lastOpacity: -1,
            activeUntil: 0,
            coreUntil: 0
          });
        }
      });

      /* Núcleo: un nodo más de la red, fijo y sin oscilación. La variante sin
         núcleo (página «Sobre mí») dibuja solo las comunidades. */
      if (conNucleo) {
        coreIndex = nodes.length;
        nodes.push({
          cluster: -1,
          isCore: true,
          bx: CENTER.x,
          by: CENTER.y,
          x: CENTER.x,
          y: CENTER.y,
          r: CORE_R,
          big: false,
          fill: C.main,
          baseOpacity: 1,
          phase: 0,
          amp: 0,
          w1: 0,
          w2: 0,
          el: null,
          hit: null,
          group: null,
          lastFill: '',
          lastRadius: -1,
          lastOpacity: -1,
          activeUntil: 0,
          coreUntil: 0
        });
      }

      nodes.forEach(function (node, index) { adjacency[index] = []; });

      /* Capas, en orden de apilado */
      layer.links = addLayer('net-links');
      layer.nodes = addLayer('net-nodes');
      layer.signals = addLayer('net-signals');
      layer.label = addLayer('net-label');
      layer.hits = addLayer('net-hits');

      buildLinks(rand, clusters);
      createNodeElements();
      if (conNucleo) drawCoreLabel();
      createHits();
      createPulses();
      paintAll();
      ajustarVista();

      ready = true;
    }

    function addLink(a, b, options) {
      var opts = options || {};
      var dashed = !!opts.dashed;
      var width = opts.width || (dashed ? 1.1 : 1.4);

      var element = mk('line', {
        stroke: C.link,
        'stroke-width': width,
        'stroke-opacity': dashed ? 0.9 : 1,
        'stroke-linecap': 'round'
      });
      if (dashed) element.setAttribute('stroke-dasharray', '3 6');
      layer.links.appendChild(element);

      links.push({
        a: a, b: b,
        dashed: dashed,
        el: element,
        color: C.link,
        width: width
      });

      if (clearOfCore(a, b)) {
        adjacency[a].push(links.length - 1);
        adjacency[b].push(links.length - 1);
      }
    }

    function buildLinks(rand, clusters) {
      var threshold = compact ? 50 : 42;

      /* Dentro de cada comunidad: líneas estructurales continuas */
      for (var i = 0; i < nodes.length; i++) {
        for (var j = i + 1; j < nodes.length; j++) {
          if (nodes[i].cluster !== nodes[j].cluster) continue;
          if (nodes[i].cluster < 0) continue;
          if (Math.hypot(nodes[i].bx - nodes[j].bx, nodes[i].by - nodes[j].by) < threshold) {
            addLink(i, j, { width: 1.4 });
          }
        }
      }

      /* Puentes entre comunidades vecinas: los más cercanos. Los dos primeros
         son estructurales; el resto, relaciones secundarias discontinuas. */
      for (var c = 0; c < clusters.length; c++) {
        var nextCluster = (c + 1) % clusters.length;
        var pairs = [];

        nodes.forEach(function (nodeA, indexA) {
          if (nodeA.cluster !== c) return;
          nodes.forEach(function (nodeB, indexB) {
            if (nodeB.cluster !== nextCluster) return;
            pairs.push({
              a: indexA,
              b: indexB,
              d: Math.hypot(nodeA.bx - nodeB.bx, nodeA.by - nodeB.by)
            });
          });
        });

        pairs.sort(function (p, q) { return p.d - q.d; });

        /* Se toman los pares más cercanos, repartiendo para que ningún nodo
           acumule demasiadas conexiones hacia la otra comunidad */
        var accepted = [];
        var usage = {};

        for (var k = 0; k < pairs.length && accepted.length < 4; k++) {
          var pair = pairs[k];
          var usedA = usage[pair.a] || 0;
          var usedB = usage[pair.b] || 0;
          if (usedA >= 2 || usedB >= 2) continue;
          usage[pair.a] = usedA + 1;
          usage[pair.b] = usedB + 1;
          accepted.push(pair);
        }

        accepted.forEach(function (pair, position) {
          if (position < 2) addLink(pair.a, pair.b, { width: 1.2 });
          else addLink(pair.a, pair.b, { dashed: true });
        });
      }

      /* El núcleo se conecta con los nodos más cercanos de cada comunidad */
      if (conNucleo) {
        clusters.forEach(function (cluster, ci) {
          var pool = [];
          nodes.forEach(function (node, index) {
            if (node.cluster === ci) {
              pool.push({
                index: index,
                d: Math.hypot(node.bx - CENTER.x, node.by - CENTER.y)
              });
            }
          });

          pool.sort(function (p, q) { return p.d - q.d; });

          for (var k = 0; k < Math.min(3, pool.length); k++) {
            addLink(coreIndex, pool[k].index, { width: 1.6 });
            coreNeighbors[ci].push(pool[k].index);
          }
        });
      }
    }

    function createNodeElements() {
      nodes.forEach(function (node) {
        var circle = mk('circle', {
          cx: num(node.x), cy: num(node.y), r: num(node.r),
          fill: node.fill, 'fill-opacity': node.baseOpacity
        });
        layer.nodes.appendChild(circle);
        node.el = circle;
      });
    }

    function drawCoreLabel() {
      /* En el hueco entre la comunidad superior y la derecha: libre de líneas */
      var text = mk('text', {
        x: CENTER.x + 13,
        y: CENTER.y - 7,
        'class': 'net-mark',
        fill: C.ink,
        'aria-hidden': 'true'
      });
      text.textContent = 'HA';
      layer.label.appendChild(text);
    }

    /* ---- nodos interactivos (ratón y teclado) ---- */

    function createHits() {
      var byCluster = [[], [], []];
      nodes.forEach(function (node, index) {
        /* El núcleo no es una parada de teclado: es el ancla de la red */
        if (node.big && !node.isCore && node.cluster >= 0) byCluster[node.cluster].push(index);
      });

      var chosen = [];
      byCluster.forEach(function (list, ci) {
        if (!list.length) return;
        list.sort(function (a, b) { return nodes[b].r - nodes[a].r; });
        chosen = chosen.concat(list.slice(0, ci === 0 ? 3 : 2));
      });
      chosen = chosen.slice(0, 7);

      chosen.forEach(function (index, order) {
        var node = nodes[index];
        var group = mk('g', {
          'class': 'net-node-hit',
          role: 'button',
          tabindex: order === 0 ? '0' : '-1',
          'aria-pressed': 'false',
          'aria-label': 'Nodo ' + (order + 1) + ' de ' + chosen.length + '. ' +
            adjacency[index].length + ' conexiones.'
        });

        var circle = mk('circle', {
          cx: num(node.x), cy: num(node.y),
          r: Math.max(13, node.r + 9),
          fill: 'transparent', 'pointer-events': 'all'
        });
        group.appendChild(circle);
        layer.hits.appendChild(group);

        node.group = group;
        node.hit = circle;

        group.addEventListener('pointerenter', function () {
          hoverIndex = index;
          applyHighlight();
        });
        group.addEventListener('pointerleave', function () {
          if (hoverIndex === index) {
            hoverIndex = -1;
            applyHighlight();
          }
        });
        group.addEventListener('focus', function () {
          setTabStop(group);
          focusIndex = index;
          applyHighlight();
        });
        group.addEventListener('blur', function () {
          if (focusIndex === index) {
            focusIndex = -1;
            applyHighlight();
          }
        });
        group.addEventListener('keydown', function (event) {
          onNodeKeydown(event, index);
        });
        group.addEventListener('click', function (event) {
          event.preventDefault();
          togglePin(index);
        });

        hits.push({ group: group, index: index });
      });

      focusRing = mk('circle', {
        'class': 'net-focus-ring', r: 10, opacity: 0,
        fill: 'none', stroke: C.main, 'stroke-width': 2,
        'pointer-events': 'none'
      });
      layer.hits.appendChild(focusRing);
    }

    function setTabStop(active) {
      hits.forEach(function (item) {
        item.group.setAttribute('tabindex', item.group === active ? '0' : '-1');
      });
    }

    function onNodeKeydown(event, index) {
      var key = event.key;

      if (key === 'ArrowRight' || key === 'ArrowDown') {
        moveFocus(index, 1);
        event.preventDefault();
      } else if (key === 'ArrowLeft' || key === 'ArrowUp') {
        moveFocus(index, -1);
        event.preventDefault();
      } else if (key === 'Enter' || key === ' ' || key === 'Spacebar') {
        togglePin(index);
        event.preventDefault();
      } else if (key === 'Escape' && pinnedIndex >= 0) {
        pinnedIndex = -1;
        updatePressed();
        applyHighlight();
      }
    }

    function moveFocus(index, direction) {
      var position = 0;
      for (var i = 0; i < hits.length; i++) {
        if (hits[i].index === index) position = i;
      }
      var next = (position + direction + hits.length) % hits.length;
      hits[next].group.focus();
    }

    function togglePin(index) {
      pinnedIndex = pinnedIndex === index ? -1 : index;
      updatePressed();
      applyHighlight();
    }

    function updatePressed() {
      hits.forEach(function (item) {
        item.group.setAttribute('aria-pressed', pinnedIndex === item.index ? 'true' : 'false');
      });
    }

    /* ---- resaltado ---- */

    function highlightIndex() {
      if (pinnedIndex >= 0) return pinnedIndex;
      if (hoverIndex >= 0) return hoverIndex;
      return focusIndex;
    }

    function applyHighlight() {
      var index = highlightIndex();
      if (index === appliedIndex) return;
      appliedIndex = index;

      neighbors = {};
      if (index >= 0) {
        var list = adjacency[index];
        for (var k = 0; k < list.length; k++) {
          var item = links[list[k]];
          neighbors[item.a === index ? item.b : item.a] = true;
        }
      }

      for (var l = 0; l < links.length; l++) {
        var link = links[l];
        var active = index >= 0 && (link.a === index || link.b === index);
        link.el.setAttribute('stroke', active ? C.main : link.color);
        link.el.setAttribute('stroke-width', active ? 1.8 : link.width);
        link.el.setAttribute('stroke-opacity', index < 0 ? (link.dashed ? 0.9 : 1) : (active ? 1 : 0.25));
      }

      for (var i = 0; i < nodes.length; i++) paintNode(i);
    }

    function paintNode(index) {
      var node = nodes[index];
      var highlighted = highlightIndex();

      /* El núcleo mantiene siempre su color; solo late al recibir una señal */
      if (node.isCore) {
        var remaining = node.coreUntil - clock;
        var bump = remaining > 0
          ? Math.sin(Math.PI * Math.min(1, Math.max(0, 1 - remaining / CORE_PULSE)))
          : 0;
        var coreRadius = CORE_R * (1 + CORE_GROW * bump);

        if (coreRadius !== node.lastRadius) {
          node.el.setAttribute('r', num(coreRadius));
          node.lastRadius = coreRadius;
        }
        if (node.lastFill !== C.main) {
          node.el.setAttribute('fill', C.main);
          node.lastFill = C.main;
        }
        if (node.lastOpacity !== 1) {
          node.el.setAttribute('fill-opacity', 1);
          node.lastOpacity = 1;
        }
        return;
      }

      var fill = node.fill;
      var opacity = node.baseOpacity;

      if (node.activeUntil > clock) {
        fill = C.secondary;
        opacity = 1;
      } else if (highlighted === index) {
        fill = C.main;
        opacity = 1;
      } else if (highlighted >= 0 && neighbors[index]) {
        fill = C.support;
        opacity = 1;
      } else if (highlighted >= 0) {
        opacity = 0.25;
      }

      if (fill !== node.lastFill) {
        node.el.setAttribute('fill', fill);
        node.lastFill = fill;
      }
      if (opacity !== node.lastOpacity) {
        node.el.setAttribute('fill-opacity', opacity);
        node.lastOpacity = opacity;
      }

      var radius = highlighted === index ? node.r + 1.5 : node.r;
      if (radius !== node.lastRadius) {
        node.el.setAttribute('r', num(radius));
        node.lastRadius = radius;
      }
    }

    /* ---- señales ---- */

    function linkableNodes() {
      var pool = [];
      for (var i = 0; i < nodes.length; i++) {
        if (i === coreIndex) continue;
        if (adjacency[i].length >= 2) pool.push(i);
      }
      return pool;
    }

    /* Vecinos de un nodo dentro de su misma comunidad (el núcleo aparte) */
    function neighborsWithin(index, cluster) {
      var list = adjacency[index];
      var out = [];

      for (var k = 0; k < list.length; k++) {
        var item = links[list[k]];
        var other = item.a === index ? item.b : item.a;
        if (other === coreIndex) continue;
        if (nodes[other].cluster !== cluster) continue;
        out.push(other);
      }

      return out;
    }

    /* Recorrido local: se queda dentro de una comunidad */
    function makeRoute(start) {
      var route = [start];
      var current = start;
      var previous = -1;
      var steps = 3 + Math.floor(Math.random() * 2);

      for (var step = 0; step < steps; step++) {
        var list = adjacency[current];
        var candidates = [];
        var sameGroup = [];

        for (var k = 0; k < list.length; k++) {
          var item = links[list[k]];
          var other = item.a === current ? item.b : item.a;
          if (other === previous || other === coreIndex) continue;
          candidates.push(other);
          if (nodes[other].cluster === nodes[current].cluster) sameGroup.push(other);
        }

        if (!candidates.length) break;

        var pool = (sameGroup.length && Math.random() < 0.72) ? sameGroup : candidates;
        var next = pool[Math.floor(Math.random() * pool.length)];

        route.push(next);
        previous = current;
        current = next;
      }

      return route;
    }

    /* Recorrido que pasa por el núcleo: entra desde una comunidad y, a veces,
       continúa hacia otra. Las conexiones son las que existen en la red. */
    function makeCoreRoute() {
      var available = [];
      for (var c = 0; c < coreNeighbors.length; c++) {
        if (coreNeighbors[c].length) available.push(c);
      }
      if (!available.length) return null;

      var from = available[Math.floor(Math.random() * available.length)];
      var others = available.filter(function (c) { return c !== from; });
      var to = others.length ? others[Math.floor(Math.random() * others.length)] : from;

      var entry = coreNeighbors[from][Math.floor(Math.random() * coreNeighbors[from].length)];
      var route = [entry];

      var lead = neighborsWithin(entry, from);
      if (lead.length) {
        var first = lead[Math.floor(Math.random() * lead.length)];
        route.unshift(first);

        var second = neighborsWithin(first, from).filter(function (index) { return index !== entry; });
        if (second.length && Math.random() < 0.5) {
          route.unshift(second[Math.floor(Math.random() * second.length)]);
        }
      }

      route.push(coreIndex);

      if (to !== from && coreNeighbors[to].length && Math.random() < 0.7) {
        var exit = coreNeighbors[to][Math.floor(Math.random() * coreNeighbors[to].length)];
        route.push(exit);

        var after = neighborsWithin(exit, to);
        if (after.length && Math.random() < 0.5) {
          route.push(after[Math.floor(Math.random() * after.length)]);
        }
      }

      return route;
    }

    /* Nueva ruta según el modo del pulso */
    function nextRoute(pulse, fromIndex) {
      if (pulse.mode === 'core') {
        var coreRoute = makeCoreRoute();
        if (coreRoute && coreRoute.length >= 2) return coreRoute;
      }

      var start = fromIndex;
      if (start == null || start === coreIndex) {
        var pool = linkableNodes();
        start = pool.length ? pool[Math.floor(Math.random() * pool.length)] : 0;
      }

      var route = makeRoute(start);
      if (route.length < 2) {
        var fallback = linkableNodes();
        if (fallback.length) route = makeRoute(fallback[Math.floor(Math.random() * fallback.length)]);
      }

      return route;
    }

    function createPulses() {
      var count = compact ? 2 : 3;
      var pool = linkableNodes();
      if (!pool.length) return;

      var dotRadius = compact ? 4 : 3.4;

      for (var p = 0; p < count; p++) {
        /* Estela: hace perceptible el tramo que la señal está recorriendo */
        var trail = mk('line', {
          'class': 'net-pulse-trail',
          stroke: C.main, 'stroke-width': 1.8, 'stroke-opacity': 0.26,
          'stroke-linecap': 'round', opacity: 0, 'pointer-events': 'none'
        });
        var halo = mk('circle', {
          'class': 'net-pulse-halo',
          r: 7, fill: 'none', stroke: C.secondary, 'stroke-width': 1.6,
          opacity: 0, 'pointer-events': 'none'
        });
        var glow = mk('circle', {
          'class': 'net-pulse-glow',
          r: compact ? 10 : 9, fill: C.main, opacity: 0, 'pointer-events': 'none'
        });
        var dot = mk('circle', {
          'class': 'net-pulse-dot',
          r: dotRadius, fill: C.main, opacity: 0, 'pointer-events': 'none'
        });

        layer.signals.appendChild(trail);
        layer.signals.appendChild(halo);
        layer.signals.appendChild(glow);
        layer.signals.appendChild(dot);

        /* Unas señales buscan el núcleo; otras recorren una comunidad. Sin
           núcleo, todas las señales hacen recorridos locales. */
        var pulse = {
          mode: conNucleo && p % 2 === 0 ? 'core' : 'local',
          route: [],
          seg: 0,
          t: 0,
          speed: 46 + p * 6,
          wait: 0.3 + p * 1.15,      /* tiempos de inicio distintos */
          hidden: false,
          trail: trail,
          halo: halo,
          glow: glow,
          dot: dot,
          haloEnd: 0,
          haloDuration: HALO,
          haloBase: 7,
          haloGrow: 14,
          haloOpacity: 0.5
        };

        var start = pool[Math.floor(Math.random() * pool.length)];
        pulse.route = nextRoute(pulse, start);
        pulses.push(pulse);
      }
    }

    function activate(index, pulse) {
      var node = nodes[index];
      if (!node) return;

      if (node.isCore) {
        /* El núcleo late: crece un poco y vuelve, con un halo azul tenue */
        node.coreUntil = clock + CORE_PULSE;
        if (dirty.indexOf(index) < 0) dirty.push(index);
        paintNode(index);

        pulse.halo.setAttribute('stroke', C.main);
        pulse.halo.setAttribute('stroke-width', 1.4);
        pulse.halo.setAttribute('cx', num(node.x));
        pulse.halo.setAttribute('cy', num(node.y));
        pulse.halo.setAttribute('r', CORE_R + 2);
        pulse.halo.setAttribute('opacity', 0.3);
        pulse.haloBase = CORE_R + 2;
        pulse.haloGrow = 15;
        pulse.haloOpacity = 0.3;
        pulse.haloDuration = CORE_PULSE;
        pulse.haloEnd = clock + CORE_PULSE;
        return;
      }

      node.activeUntil = clock + ACTIVATION;
      if (dirty.indexOf(index) < 0) dirty.push(index);
      paintNode(index);

      /* Los nodos secundarios solo cambian de color un instante: sin ondas */
      pulse.halo.setAttribute('opacity', 0);
      pulse.haloEnd = 0;
    }

    function stepPulse(pulse, delta) {
      var route = pulse.route;
      if (route.length < 2) return;

      if (pulse.wait > 0) {
        pulse.wait -= delta;
        pulse.trail.setAttribute('opacity', 0);
        if (pulse.hidden) return;

        /* pausa breve sobre el nodo recién alcanzado */
        var stay = nodes[route[pulse.seg]];
        if (stay) {
          pulse.dot.setAttribute('cx', num(stay.x));
          pulse.dot.setAttribute('cy', num(stay.y));
          pulse.glow.setAttribute('cx', num(stay.x));
          pulse.glow.setAttribute('cy', num(stay.y));
        }
        return;
      }

      var from = nodes[route[pulse.seg]];
      var to = nodes[route[pulse.seg + 1]];
      var distance = Math.max(1, Math.hypot(to.x - from.x, to.y - from.y));
      pulse.t += (delta * pulse.speed) / distance;

      if (pulse.t >= 1) {
        pulse.t = 0;
        pulse.seg += 1;
        activate(route[pulse.seg], pulse);

        if (pulse.seg >= route.length - 1) {
          /* fin del recorrido: nueva ruta tras una pausa más larga */
          pulse.route = nextRoute(pulse, route[route.length - 1]);
          pulse.seg = 0;
          pulse.wait = 1 + Math.random() * 1.8;
          pulse.hidden = true;
          pulse.dot.setAttribute('opacity', 0);
          pulse.glow.setAttribute('opacity', 0);
          pulse.trail.setAttribute('opacity', 0);
          return;
        }

        pulse.wait = 0.16;
        pulse.hidden = false;
        from = nodes[route[pulse.seg]];
        to = nodes[route[pulse.seg + 1]];
      }

      var eased = pulse.t * pulse.t * (3 - 2 * pulse.t);
      var x = from.x + (to.x - from.x) * eased;
      var y = from.y + (to.y - from.y) * eased;

      pulse.dot.setAttribute('cx', num(x));
      pulse.dot.setAttribute('cy', num(y));
      pulse.dot.setAttribute('opacity', 1);
      pulse.glow.setAttribute('cx', num(x));
      pulse.glow.setAttribute('cy', num(y));
      pulse.glow.setAttribute('opacity', 0.18);

      /* estela corta sobre el tramo que está recorriendo */
      var span = Math.min(0.45, 15 / distance);
      var back = Math.max(0, eased - span);
      pulse.trail.setAttribute('x1', num(from.x + (to.x - from.x) * back));
      pulse.trail.setAttribute('y1', num(from.y + (to.y - from.y) * back));
      pulse.trail.setAttribute('x2', num(x));
      pulse.trail.setAttribute('y2', num(y));
      pulse.trail.setAttribute('opacity', 1);
    }

    /* ---- pintado y bucle ---- */

    function placeNode(node) {
      /* Redondeo a 0.25 px: evita escrituras de DOM cuando el cambio es
         imperceptible, que es la mayor parte del tiempo con este movimiento */
      var qx = Math.round(node.x * 4) / 4;
      var qy = Math.round(node.y * 4) / 4;

      if (qx !== node.qx) {
        node.el.setAttribute('cx', qx);
        node.qx = qx;
      }
      if (qy !== node.qy) {
        node.el.setAttribute('cy', qy);
        node.qy = qy;
      }
      if (node.hit) {
        if (qx !== node.hx) {
          node.hit.setAttribute('cx', qx);
          node.hx = qx;
        }
        if (qy !== node.hy) {
          node.hit.setAttribute('cy', qy);
          node.hy = qy;
        }
      }
    }

    function updateLinks() {
      for (var i = 0; i < links.length; i++) {
        var link = links[i];
        var a = nodes[link.a];
        var b = nodes[link.b];

        if (a.qx !== link.x1) { link.el.setAttribute('x1', a.qx); link.x1 = a.qx; }
        if (a.qy !== link.y1) { link.el.setAttribute('y1', a.qy); link.y1 = a.qy; }
        if (b.qx !== link.x2) { link.el.setAttribute('x2', b.qx); link.x2 = b.qx; }
        if (b.qy !== link.y2) { link.el.setAttribute('y2', b.qy); link.y2 = b.qy; }
      }
    }

    function updateFocusRing() {
      if (!focusRing) return;

      if (focusIndex < 0) {
        if (focusRing.getAttribute('opacity') !== '0') focusRing.setAttribute('opacity', 0);
        return;
      }

      var node = nodes[focusIndex];
      focusRing.setAttribute('cx', num(node.x));
      focusRing.setAttribute('cy', num(node.y));
      focusRing.setAttribute('r', num(node.r + 5.5));
      focusRing.setAttribute('opacity', 1);
    }

    function updateActivations() {
      for (var p = 0; p < pulses.length; p++) {
        var pulse = pulses[p];
        if (!pulse.haloEnd) continue;

        if (clock >= pulse.haloEnd) {
          pulse.halo.setAttribute('opacity', 0);
          pulse.haloEnd = 0;
        } else {
          var duration = pulse.haloDuration || HALO;
          var progress = (clock - (pulse.haloEnd - duration)) / duration;
          pulse.halo.setAttribute('r', num(pulse.haloBase + pulse.haloGrow * progress));
          pulse.halo.setAttribute('opacity', num(pulse.haloOpacity * (1 - progress)));
        }
      }

      /* El núcleo se repinta mientras dura su latido */
      for (var k = 0; k < dirty.length; k++) {
        if (nodes[dirty[k]] && nodes[dirty[k]].isCore) paintNode(dirty[k]);
      }

      for (var d = dirty.length - 1; d >= 0; d--) {
        var index = dirty[d];
        var node = nodes[index];
        var until = node.isCore ? node.coreUntil : node.activeUntil;

        if (until <= clock) {
          dirty.splice(d, 1);
          paintNode(index);
        }
      }
    }

    function paintAll() {
      nodes.forEach(placeNode);
      updateLinks();
      for (var i = 0; i < nodes.length; i++) paintNode(i);
      updatePressed();
      updateFocusRing();
    }

    function tick(delta) {
      clock += delta;

      /* 1. movimiento ambiental: amplitud pequeña y lenta */
      for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        node.x = node.bx + Math.sin(clock * node.w1 + node.phase) * node.amp;
        node.y = node.by + Math.cos(clock * node.w2 + node.phase * 1.7) * node.amp;
        placeNode(node);
      }

      /* 2. las conexiones siguen la posición real de sus nodos */
      updateLinks();

      /* 3. señales */
      for (var p = 0; p < pulses.length; p++) stepPulse(pulses[p], delta);

      /* 4. activaciones y anillo de foco */
      updateActivations();
      updateFocusRing();
    }

    function frame(now) {
      rafId = window.requestAnimationFrame(frame);

      if (!lastFrame) {
        lastFrame = now;
        return;
      }

      var delta = (now - lastFrame) / 1000;
      /* En pantallas pequeñas el ritmo se limita a ~30 fps */
      if (delta < (compact ? 1 / 34 : 1 / 90)) return;

      lastFrame = now;
      tick(Math.min(0.06, delta));
    }

    /* ---- versión estática (movimiento reducido) ---- */

    function paintStatic() {
      for (var i = 0; i < nodes.length; i++) {
        nodes[i].x = nodes[i].bx;
        nodes[i].y = nodes[i].by;
        placeNode(nodes[i]);
      }
      updateLinks();

      for (var p = 0; p < pulses.length; p++) {
        var pulse = pulses[p];
        var route = pulse.route;
        if (route.length < 2) continue;

        var from = nodes[route[0]];
        var to = nodes[route[1]];
        var t = 0.32 + p * 0.16;
        var x = from.x + (to.x - from.x) * t;
        var y = from.y + (to.y - from.y) * t;

        pulse.dot.setAttribute('cx', num(x));
        pulse.dot.setAttribute('cy', num(y));
        pulse.dot.setAttribute('opacity', 1);
        pulse.glow.setAttribute('cx', num(x));
        pulse.glow.setAttribute('cy', num(y));
        pulse.glow.setAttribute('opacity', 0.18);
        pulse.halo.setAttribute('opacity', 0);
        pulse.trail.setAttribute('opacity', 0);
      }

      updateFocusRing();
    }

    /* ---- ciclo de vida ---- */

    function shouldRun() {
      return ready && !paused && !reduceQuery.matches && inView && pageVisible;
    }

    function sync() {
      if (shouldRun()) {
        if (!rafId) {
          lastFrame = 0;
          rafId = window.requestAnimationFrame(frame);
        }
      } else if (rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
    }

    function setPaused(value) {
      paused = value;
      if (toggle) {
        toggle.setAttribute('data-paused', value ? 'true' : 'false');
        toggle.setAttribute('aria-label', value
          ? 'Reanudar la animación de la red'
          : 'Pausar la animación de la red');
      }
      if (toggleText) toggleText.textContent = value ? 'Reanudar' : 'Pausar';
      sync();
    }

    function onMotionPreference() {
      if (reduceQuery.matches) {
        if (rafId) {
          window.cancelAnimationFrame(rafId);
          rafId = 0;
        }
        paintStatic();
        if (toggle) toggle.hidden = true;
      } else {
        if (toggle) toggle.hidden = false;
        if (!paused) sync();
      }
    }

    function scheduleRebuild() {
      if (rebuildTimer) window.clearTimeout(rebuildTimer);
      rebuildTimer = window.setTimeout(function () {
        rebuildTimer = 0;
        var shouldBeCompact = window.innerWidth < 640;
        if (shouldBeCompact === compact) return;

        build();
        if (toggle) toggle.hidden = reduceQuery.matches;
        if (reduceQuery.matches) paintStatic();
        sync();
      }, 260);
    }

    /* ---- arranque ---- */

    build();

    function alPulsarToggle() {
      setPaused(!paused);
    }

    if (toggle) {
      toggle.setAttribute('aria-label', 'Pausar la animación de la red');
      toggle.addEventListener('click', alPulsarToggle);
      toggle.hidden = reduceQuery.matches;
    }

    var observador = null;
    if ('IntersectionObserver' in window) {
      observador = new IntersectionObserver(function (entries) {
        for (var i = 0; i < entries.length; i++) inView = entries[i].isIntersecting;
        sync();
      }, { threshold: 0 });
      observador.observe(svg);
    }

    function alCambiarVisibilidad() {
      pageVisible = !document.hidden;
      sync();
    }
    document.addEventListener('visibilitychange', alCambiarVisibilidad);

    if (reduceQuery.addEventListener) reduceQuery.addEventListener('change', onMotionPreference);
    else if (reduceQuery.addListener) reduceQuery.addListener(onMotionPreference);

    window.addEventListener('resize', scheduleRebuild);

    if (reduceQuery.matches) paintStatic();
    else sync();

    /* Desmontaje completo: al salir de la vista no quedan frames, temporizadores
       ni listeners vivos. Se conservan <title> y <desc> (los referencia
       aria-labelledby/aria-describedby) y se borra el resto para poder montar de
       nuevo el mismo SVG sin duplicar identificadores. */
    return {
      destroy: function () {
        if (rafId) {
          window.cancelAnimationFrame(rafId);
          rafId = 0;
        }
        if (rebuildTimer) {
          window.clearTimeout(rebuildTimer);
          rebuildTimer = 0;
        }
        if (observador) {
          observador.disconnect();
          observador = null;
        }
        document.removeEventListener('visibilitychange', alCambiarVisibilidad);
        if (reduceQuery.removeEventListener) reduceQuery.removeEventListener('change', onMotionPreference);
        else if (reduceQuery.removeListener) reduceQuery.removeListener(onMotionPreference);
        window.removeEventListener('resize', scheduleRebuild);
        if (toggle) toggle.removeEventListener('click', alPulsarToggle);
        nodes = [];
        links = [];
        pulses = [];
        hits = [];
        clearLayers();
      }
    };
  }

  /* ============ 2 bis. RECORRIDO DE «CÓMO TRABAJO» (SCROLL) ============
     Las cinco etapas están en el HTML; aquí se decide cuál está activa y dónde
     se dibuja cada momento del esquema.

     - El esquema ocupa la MISMA altura que la lista: el lienzo (viewBox) se
       calcula con la proporción real del contenedor, así que la ilustración se
       escala sin deformarse y sin dejar franjas vacías.
     - Cada momento se centra en su paso —se miden los cinco textos y se traslada
       su grupo a esa altura— para que la lectura del esquema vaya en paralelo.
     - La etapa activa la marca el scroll con un IntersectionObserver sobre la
       franja central: automático, sin tocar el scroll ni pedir clics.
     - En móvil el esquema va después de la lista y usa el lienzo de referencia,
       con la altura que pide su contenido.
     - Con movimiento reducido los estados cambian sin transición (CSS).
     ===================================================================== */

  function initRecorrido() {
    var recorrido = document.querySelector('.journey');
    if (!recorrido) return null;

    var svg = recorrido.querySelector('.jr-svg');
    var panel = recorrido.querySelector('.journey-visual');
    var marco = recorrido.querySelector('.journey-frame');
    var espina = recorrido.querySelector('.jr-spine');
    var pasos = Array.prototype.slice.call(recorrido.querySelectorAll('.journey-step'));
    if (!svg || !panel || !marco || !pasos.length) return null;

    var grupos = Array.prototype.slice.call(svg.querySelectorAll('.jr-etapa'));

    /* Lienzo de referencia: cinco bandas iguales (el mismo que dibuja el HTML).
       Es también lo que se ve si el navegador no puede medir. */
    var DISENO = 660;
    var BANDA = DISENO / 5;

    var LIMITE = 1000;
    var etapa = 1;
    var observador = null;
    var temporizador = 0;
    var movil = window.innerWidth <= LIMITE;

    function estadoDe(indice, activa) {
      if (indice < activa - 1) return 'hecho';
      if (indice === activa - 1) return 'activa';
      return 'pendiente';
    }

    function aplicar(n) {
      etapa = n;
      grupos.forEach(function (grupo, i) {
        grupo.setAttribute('data-estado', estadoDe(i, n));
      });
      pasos.forEach(function (paso, i) {
        paso.setAttribute('data-estado', estadoDe(i, n));
      });
    }

    /* Coloca cada momento en su altura (en unidades del lienzo) */
    function colocar(centros) {
      grupos.forEach(function (grupo, i) {
        var y = Math.round(centros[Math.min(i, centros.length - 1)] * 10) / 10;
        grupo.setAttribute('transform', 'translate(0,' + y + ')');
      });
      if (espina) {
        espina.setAttribute('y1', Math.round(centros[0] * 10) / 10);
        espina.setAttribute('y2', Math.round(centros[centros.length - 1] * 10) / 10);
      }
    }

    function componer() {
      if (movil) {
        svg.setAttribute('viewBox', '0 0 440 ' + DISENO);
        colocar(grupos.map(function (grupo, i) { return BANDA * (i + 0.5); }));
        return;
      }

      var ancho = marco.clientWidth;
      var alto = marco.clientHeight;
      if (!ancho || !alto) return;

      /* El lienzo copia la proporción real del contenedor: escala uniforme, sin
         deformación, y el dibujo llega hasta el último píxel. */
      var escala = 440 / ancho;
      svg.setAttribute('viewBox', '0 0 440 ' + (Math.round(alto * escala * 10) / 10));

      var caja = marco.getBoundingClientRect();
      colocar(pasos.map(function (paso) {
        var cajaPaso = paso.getBoundingClientRect();
        return (cajaPaso.top + cajaPaso.height / 2 - caja.top) * escala;
      }));
    }

    /* Etapa cuyo texto está más cerca de la franja central de la ventana. */
    function medir() {
      var centro = window.innerHeight / 2;
      var alto = window.innerHeight;
      var mejor = 0;
      var distancia = Infinity;

      pasos.forEach(function (paso, i) {
        var caja = paso.getBoundingClientRect();
        if (caja.bottom < 0 || caja.top > alto) return;
        var medio = caja.top + caja.height / 2;
        var d = Math.abs(medio - centro);
        if (d < distancia) {
          distancia = d;
          mejor = i + 1;
        }
      });

      if (mejor && mejor !== etapa) aplicar(mejor);
    }

    function montarObservador() {
      desmontarObservador();
      if (!('IntersectionObserver' in window)) return;
      observador = new IntersectionObserver(medir, {
        rootMargin: '-42% 0px -42% 0px',
        threshold: 0
      });
      pasos.forEach(function (paso) { observador.observe(paso); });
    }

    function desmontarObservador() {
      if (!observador) return;
      observador.disconnect();
      observador = null;
    }

    function ajustarModo() {
      movil = window.innerWidth <= LIMITE;
      componer();
      medir();
    }

    function alRedimensionar() {
      if (temporizador) window.clearTimeout(temporizador);
      temporizador = window.setTimeout(function () {
        temporizador = 0;
        ajustarModo();
      }, 200);
    }

    aplicar(1);
    componer();
    montarObservador();
    medir();
    window.addEventListener('resize', alRedimensionar);

    /* Con las tipografías cargadas los textos pueden cambiar de alto */
    if (document.fonts && document.fonts.ready && document.fonts.ready.then) {
      document.fonts.ready.then(function () { componer(); });
    }

    return {
      destroy: function () {
        desmontarObservador();
        if (temporizador) {
          window.clearTimeout(temporizador);
          temporizador = 0;
        }
        window.removeEventListener('resize', alRedimensionar);
      }
    };
  }

  /* ============ 3. ESCENAS ANIMADAS DEL PORTAFOLIO ============
     Las cinco portadas las dibuja scenes.js. Aquí solo se decide cuándo se
     reproducen y qué hace el cursor sobre ellas:

     - Cada escena arranca sola cuando una parte suficiente de su tarjeta entra
       en pantalla, con un desfase pequeño entre las tarjetas de la misma fila.
     - No requiere clic. Termina en una composición estable y no se repite en
       bucle: solo vuelve a empezar cuando el cursor entra de nuevo en la
       tarjeta (o el foco de teclado) y ha pasado un tiempo mínimo.
     - Se pausa al salir de la vista o al ocultarse la pestaña.
     - Con prefers-reduced-motion se muestra directamente el resultado final.
     ========================================================== */

  var scenePlayers = [];
  var entryObserver = null;
  var entryTimer = 0;

  function createScenePlayer(card, scene, delay) {
    var phase = 'idle';            /* idle | playing | paused | done */
    var time = 0;
    var rafId = 0;
    var lastFrame = 0;
    var inView = false;
    var startTimer = 0;
    var lastReplay = 0;
    var pointerFrame = 0;
    var lastPoint = null;
    var observer = null;

    function stopLoop() {
      if (rafId) window.cancelAnimationFrame(rafId);
      rafId = 0;
      lastFrame = 0;
    }

    function redraw() {
      scene.render(time);
    }

    function step(now) {
      rafId = window.requestAnimationFrame(step);

      if (!lastFrame) {
        lastFrame = now;
        return;
      }

      var delta = Math.min(90, now - lastFrame);
      lastFrame = now;
      time = Math.min(scene.duration, time + delta);
      scene.render(time);

      if (time >= scene.duration) {
        phase = 'done';
        stopLoop();
      }
    }

    function start() {
      if (reduceMotion.matches || document.hidden || !inView) return;
      if (phase === 'playing') return;
      if (phase === 'done') return;
      phase = 'playing';
      lastFrame = 0;
      if (!rafId) rafId = window.requestAnimationFrame(step);
    }

    function scheduleStart(wait) {
      if (reduceMotion.matches || phase !== 'idle') return;
      if (startTimer) window.clearTimeout(startTimer);
      startTimer = window.setTimeout(function () {
        startTimer = 0;
        start();
      }, Math.max(0, wait));
    }

    function pause() {
      if (startTimer) {
        window.clearTimeout(startTimer);
        startTimer = 0;
      }
      if (phase !== 'playing') return;
      phase = 'paused';
      stopLoop();
    }

    function resume() {
      if (phase !== 'paused' || !inView || document.hidden || reduceMotion.matches) return;
      phase = 'playing';
      lastFrame = 0;
      if (!rafId) rafId = window.requestAnimationFrame(step);
    }

    /* Volver a empezar: solo al entrar de nuevo en la tarjeta y con espera */
    function restart() {
      if (reduceMotion.matches || document.hidden || !inView) return;
      var now = Date.now();
      if (now - lastReplay < 1200) return;
      if (startTimer) {
        window.clearTimeout(startTimer);
        startTimer = 0;
      }
      lastReplay = now;
      time = 0;
      phase = 'playing';
      lastFrame = 0;
      scene.render(0);
      if (!rafId) rafId = window.requestAnimationFrame(step);
    }

    function onEnter() {
      if (phase === 'idle') {
        scheduleStart(0);
      } else if (phase === 'done') {
        restart();
      }
    }

    /* Punto del cursor en unidades del viewBox (0 0 480 300) */
    function scenePoint(event) {
      var svg = scene.svg;
      if (!svg) return null;
      var box = svg.getBoundingClientRect();
      if (!box.width || !box.height) return null;
      if (event.clientX < box.left || event.clientX > box.right) return null;
      if (event.clientY < box.top || event.clientY > box.bottom) return null;
      var scale = Math.min(box.width / 480, box.height / 300);
      return {
        x: (event.clientX - box.left - (box.width - 480 * scale) / 2) / scale,
        y: (event.clientY - box.top - (box.height - 300 * scale) / 2) / scale
      };
    }

    function onPointerMove(event) {
      lastPoint = event;
      if (pointerFrame) return;
      pointerFrame = window.requestAnimationFrame(function () {
        pointerFrame = 0;
        if (!lastPoint) return;
        scene.pointer(scenePoint(lastPoint));
        redraw();
      });
    }

    function onPointerLeave() {
      if (pointerFrame) window.cancelAnimationFrame(pointerFrame);
      pointerFrame = 0;
      lastPoint = null;
      scene.pointer(null);
      redraw();
    }

    function onFocusIn(event) {
      onEnter();
      var stopNode = event.target && event.target.closest ? event.target.closest('[data-stop]') : null;
      scene.focus(stopNode ? stopNode.getAttribute('data-stop') : null);
      redraw();
    }

    function onFocusOut(event) {
      var next = event.relatedTarget;
      if (next && card.contains(next)) {
        var stopNode = next.closest ? next.closest('[data-stop]') : null;
        scene.focus(stopNode ? stopNode.getAttribute('data-stop') : null);
      } else {
        scene.focus(null);
      }
      redraw();
    }

    function setInView(value) {
      inView = value;
      if (!value) {
        pause();
        return;
      }
      if (phase === 'idle') scheduleStart(delay);
      else resume();
    }

    /* Con movimiento reducido se muestra el resultado final, ya completo */
    function applyMotionPreference() {
      stopLoop();
      if (startTimer) {
        window.clearTimeout(startTimer);
        startTimer = 0;
      }

      if (reduceMotion.matches) {
        time = scene.duration;
        phase = 'done';
        scene.render(scene.duration);
      } else if (phase === 'done') {
        scene.render(time);
      } else if (phase === 'playing') {
        scene.render(time);
      } else {
        time = 0;
        phase = 'idle';
        scene.render(0);
        if (inView) scheduleStart(delay);
      }
    }

    function destroy() {
      stopLoop();
      if (startTimer) window.clearTimeout(startTimer);
      if (pointerFrame) window.cancelAnimationFrame(pointerFrame);
      startTimer = 0;
      pointerFrame = 0;
      card.removeEventListener('pointerenter', onEnter);
      card.removeEventListener('pointermove', onPointerMove);
      card.removeEventListener('pointerleave', onPointerLeave);
      card.removeEventListener('focusin', onFocusIn);
      card.removeEventListener('focusout', onFocusOut);
      if (observer) observer.disconnect();
      observer = null;
      if (scene.destroy) scene.destroy();
    }

    scene.render(reduceMotion.matches ? scene.duration : 0);
    if (reduceMotion.matches) {
      time = scene.duration;
      phase = 'done';
    }

    card.addEventListener('pointerenter', onEnter);
    card.addEventListener('pointermove', onPointerMove);
    card.addEventListener('pointerleave', onPointerLeave);
    card.addEventListener('focusin', onFocusIn);
    card.addEventListener('focusout', onFocusOut);

    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(function (entries) {
        setInView(entries[0].isIntersecting);
      }, { threshold: 0.3 });
      observer.observe(card);
    } else {
      setInView(true);
    }

    return {
      card: card,
      scene: scene,
      setInView: setInView,
      pause: pause,
      resume: resume,
      applyMotionPreference: applyMotionPreference,
      destroy: destroy,
      phase: function () { return phase; }
    };
  }

  function playerOf(node) {
    for (var i = 0; i < scenePlayers.length; i++) {
      if (scenePlayers[i].card === node) return scenePlayers[i];
    }
    return null;
  }

  /* Entrada breve de la tarjeta: ilustración, categoría, título y descripción.
     Todo es CSS; esta clase solo dispara la transición cuando la tarjeta se ve. */
  function revealCard(node) {
    if (node.classList.contains('is-in')) return;
    node.classList.add('is-in');
  }

  function mountScenes() {
    var scenes = window.PORTFOLIO_SCENES;
    if (!scenes || !projectsEl) return;

    scenePlayers.forEach(function (player) { player.destroy(); });
    scenePlayers = [];

    var cards = $$('.card[data-category]', projectsEl);

    /* Desfase por columna: las tarjetas de la misma fila no arrancan a la vez */
    var lefts = cards.map(function (card) {
      return Math.round(card.getBoundingClientRect().left);
    });

    cards.forEach(function (card, index) {
      var area = findArea(card.getAttribute('data-category'));
      var cover = $('.cover', card);
      if (!area || !cover) return;

      var column = lefts.indexOf(lefts[index]);
      var scene = scenes.build(area.ilustracion, cover, {
        label: area.escenaAlt || ('Ilustración conceptual del área ' + area.nombre)
      });
      if (!scene) return;

      scenePlayers.push(createScenePlayer(card, scene, column * 160));
    });

    if ('IntersectionObserver' in window && !entryObserver) {
      entryObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            revealCard(entry.target);
            entryObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12 });
    }

    $$('.card, .note-card', projectsEl).forEach(function (node) {
      if (entryObserver) entryObserver.observe(node);
      else revealCard(node);
    });

    /* Red de seguridad: si un observador no llegara a dispararse, la galería
       se muestra igualmente. Nunca deja contenido oculto. */
    if (entryTimer) window.clearTimeout(entryTimer);
    entryTimer = window.setTimeout(function () {
      entryTimer = 0;
      $$('.card, .note-card', projectsEl).forEach(revealCard);
    }, 2000);
  }

  /* Al filtrar, las tarjetas ocultas dejan de ser enfocables (hidden) y sus
     escenas se detienen. */
  function pauseHiddenScenes() {
    scenePlayers.forEach(function (player) {
      if (player.card.hidden) {
        player.pause();
        player.setInView(false);
      }
    });
  }

  function onSceneMotionChange() {
    scenePlayers.forEach(function (player) {
      player.applyMotionPreference();
    });
  }

  function destroyScenes() {
    scenePlayers.forEach(function (player) { player.destroy(); });
    scenePlayers = [];
    if (entryObserver) entryObserver.disconnect();
    entryObserver = null;
    if (entryTimer) window.clearTimeout(entryTimer);
    entryTimer = 0;
  }


  /* ============ 4. GALERÍA, FILTROS Y FRANJA ============ */

  var projectsEl = $('#projects');
  var filtersEl = $('#filters');
  var stripEl = $('#areas-strip');
  var statusEl = $('#filter-status');
  var state = { filter: 'all' };
  var pillEl = null;             /* superficie azul del filtro activo */
  var reflowTimer = 0;           /* limpieza de los estilos de la reorganización */

  function estadoOf(area) {
    var list = area.proyectos || [];
    if (list.some(function (p) { return p.estado === 'publicado'; })) return 'publicado';
    if (list.some(function (p) { return p.estado === 'desarrollo'; })) return 'desarrollo';
    return 'previsto';
  }

  function estadoEtiqueta(key) {
    return (ESTADOS[key] && ESTADOS[key].etiqueta) || 'Próximamente';
  }

  function chip(key) {
    return '<span class="chip" data-estado="' + esc(key) + '">' + esc(estadoEtiqueta(key)) + '</span>';
  }

  function tags(list) {
    return (list || []).map(function (t) {
      return '<span class="tag">' + esc(t) + '</span>';
    }).join('');
  }

  /* Enlaces de la tarjeta: repositorio público y demo publicada. La tarjeta es
     clicable por una capa absoluta (`card-hit`, z-index 2), así que estos
     enlaces llevan z-index propio en la hoja de estilos y nunca se anidan
     dentro de esa capa. Se abren en pestaña nueva; un campo vacío no dibuja
     ningún enlace. `codigoEtiqueta` permite que el enlace diga «Demo publicada»
     cuando el destino es la carpeta del artefacto y no código fuente. */
  function enlaceExterno(href, etiqueta, descripcion) {
    return '<a class="card-link" href="' + esc(href) + '"' +
      ' target="_blank" rel="noopener noreferrer"' +
      ' aria-label="' + esc(descripcion) + ' (pestaña nueva)">' +
      esc(etiqueta) +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 16 16 8M9 8h7v7"/></svg>' +
      '</a>';
  }

  function enlacesProyecto(project, titulo) {
    var items = [];
    if (project.codigoUrl) {
      var etiquetaCodigo = project.codigoEtiqueta || 'Código';
      var descripcionCodigo = project.codigoEtiqueta
        ? 'Abrir la demo publicada de ' + titulo
        : 'Ver el repositorio de ' + titulo + ' en GitHub';
      items.push(enlaceExterno(project.codigoUrl, etiquetaCodigo, descripcionCodigo));
    }
    if (project.demoUrl) {
      items.push(enlaceExterno(project.demoUrl, 'Abrir demo',
        'Abrir la demo de ' + titulo));
    }
    return items.length ? '<p class="card-links">' + items.join('') + '</p>' : '';
  }

  /* Recuento por estado de los casos de un área, para la tarjeta de la
     galería: ahí se decide qué área abrir, y conviene saber cuánto hay dentro
     sin entrar. */
  function recuentoCasos(projects) {
    var publicados = 0;
    var desarrollo = 0;
    projects.forEach(function (p) {
      if (p.estado === 'publicado') publicados++;
      else if (p.estado === 'desarrollo') desarrollo++;
    });
    var previstos = projects.length - publicados - desarrollo;
    var partes = [projects.length + (projects.length === 1 ? ' caso' : ' casos')];
    if (publicados) partes.push(publicados + (publicados === 1 ? ' publicado' : ' publicados'));
    if (desarrollo) partes.push(desarrollo + ' en desarrollo');
    if (previstos) partes.push(previstos + ' próximamente');
    return partes.join(' · ');
  }

  /* Categorías visibles del área, sin repetir y en el orden en que aparecen. */
  function categoriasDeArea(projects) {
    var vistas = [];
    projects.forEach(function (p) {
      if (p.categoria && vistas.indexOf(p.categoria) < 0) vistas.push(p.categoria);
    });
    return vistas;
  }


  /* Tecnologías agrupadas por función: la función es el término de la lista y
     las tecnologías su descripción. Solo se dibuja cuando el proyecto declara
     los grupos; el resto de fichas conserva sus etiquetas. */
  function tecnologiasAgrupadas(grupos) {
    if (!grupos || !grupos.length) return '';
    var filas = grupos.map(function (grupo) {
      var items = (grupo.items || []).join(' · ');
      return '<div class="tec-row">' +
        '<dt class="tec-funcion">' + esc(grupo.funcion) + '</dt>' +
        '<dd class="tec-items">' + esc(items) + '</dd>' +
        '</div>';
    }).join('');
    return '<dl class="tec-grupos">' + filas + '</dl>';
  }

  function renderFeatured() {
    var host = document.getElementById('featured-projects');
    if (!host) return;
    var choices = [
      ['atlas-comercial', 'Pronóstico de demanda', 'LightGBM y baseline semanal, evaluación temporal y error por horizonte.', 'Los cortes finales fueron consultados para confirmar la publicación; no son un holdout intacto.'],
      ['clientes-campanas', 'Clientes y campañas', 'Segmentación, propensión y un benchmark independiente de incrementalidad.', 'La propensión ordena clientes; el experimento comercial sigue pendiente.'],
      ['asistente-investigacion', 'Briefing con evidencia', 'Consulta documental con recuperación léxica y fuentes que se pueden inspeccionar.', 'Corpus acotado. La demo y la evaluación del sistema son alcances distintos.']
    ];
    host.innerHTML = choices.map(function (choice) {
      var area, project;
      DATA.areas.some(function (a) {
        return a.proyectos.some(function (p) {
          if (p.id !== choice[0]) return false;
          area = a; project = p; return true;
        });
      });
      if (!project) return '';
      return '<article class="featured-card">' +
        '<p class="micro-label">' + esc(area.etiqueta) + '</p>' +
        '<h3>' + esc(choice[1]) + '</h3>' + chip(project.estado) +
        '<p>' + esc(choice[2]) + '</p>' +
        '<p class="featured-limit">' + esc(choice[3]) + '</p>' +
        '<div class="featured-links"><a href="#/area/' + esc(area.id) + '/' + esc(project.id) + '">Ver caso</a>' +
        (project.demoUrl ? '<a href="' + esc(project.demoUrl) + '" target="_blank" rel="noopener noreferrer">Demo</a>' : '') +
        (project.codigoUrl ? '<a href="' + esc(project.codigoUrl) + '" target="_blank" rel="noopener noreferrer">Código</a>' : '') +
        '</div></article>';
    }).join('');
  }

  function renderStrip() {
    if (!stripEl) return;
    stripEl.innerHTML = AREAS.map(function (area) {
      return '<li><button type="button" data-jump="' + esc(area.id) + '"' +
        ' aria-label="Ir al área: ' + esc(area.nombre) + '">' +
        '<span class="strip-num">' + esc(area.numero) + '</span>' + esc(area.etiqueta) + '</button></li>';
    }).join('');
  }

  function renderFilters() {
    if (!filtersEl) return;
    var html = '<button type="button" data-filter="all" aria-pressed="true">Todas las áreas</button>';
    AREAS.forEach(function (area) {
      html += '<button type="button" data-filter="' + esc(area.id) + '" aria-pressed="false">' +
        esc(area.etiqueta) + '</button>';
    });
    filtersEl.innerHTML = html;

    /* Superficie azul que se desliza hasta la opción elegida */
    pillEl = document.createElement('span');
    pillEl.className = 'filters-pill';
    pillEl.setAttribute('aria-hidden', 'true');
    filtersEl.insertBefore(pillEl, filtersEl.firstChild);
    filtersEl.classList.add('has-pill');
  }

  /* Coloca la superficie azul bajo la opción activa. Sin animación al arrancar
     ni al redimensionar; con transición al cambiar de filtro. */
  function movePill(animate) {
    if (!pillEl || !filtersEl) return;
    var active = $('button[aria-pressed="true"]', filtersEl);
    if (!active) return;

    var row = filtersEl.getBoundingClientRect();
    var box = active.getBoundingClientRect();
    if (!box.width) return;

    if (!animate) pillEl.style.transition = 'none';
    pillEl.style.width = box.width + 'px';
    pillEl.style.height = box.height + 'px';
    pillEl.style.transform = 'translate(' + (box.left - row.left) + 'px,' + (box.top - row.top) + 'px)';

    if (!animate) {
      /* fuerza el cálculo y devuelve la transición de la hoja de estilos */
      void pillEl.offsetWidth;
      pillEl.style.transition = '';
    }
  }

  function renderCards() {
    if (!projectsEl) return;

    var html = AREAS.map(function (area) {
      var id = 'area-titulo-' + area.id;
      var proyectos = area.proyectos || [];
      var categorias = categoriasDeArea(proyectos);
      return '<article class="card" data-category="' + esc(area.id) + '">' +
        '<a class="card-hit" id="area-link-' + esc(area.id) + '"' +
        ' href="' + esc(areaHash(area)) + '" aria-labelledby="' + esc(id) + '"></a>' +
        '<div class="cover"></div>' +
        '<p class="card-meta"><span>Área ' + esc(area.numero) + ' · ' + esc(area.etiqueta) + '</span>' +
        chip(estadoOf(area)) + '</p>' +
        '<h3 id="' + esc(id) + '">' + esc(area.nombre) +
        '<svg class="card-arrow" viewBox="0 0 24 24" aria-hidden="true">' +
        '<path d="M4 12h15M13 6l6 6-6 6"/></svg></h3>' +
        '<p class="card-text">' + esc(area.resumen) + '</p>' +
        '<p class="card-counts">' + esc(recuentoCasos(proyectos)) + '</p>' +
        (categorias.length
          ? '<p class="card-cats">' + categorias.map(function (c) {
              return '<span class="tag">' + esc(c) + '</span>';
            }).join('') + '</p>'
          : '') +
        '</article>';
    }).join('');

    /* Nota que cierra la galería y explica los estados */
    var legend = ['previsto', 'desarrollo', 'publicado'].map(function (key) {
      return '<div>' + chip(key) + '<span>' + esc((ESTADOS[key] && ESTADOS[key].detalle) || '') + '</span></div>';
    }).join('');

    html += '<aside class="note-card" aria-labelledby="note-card-title">' +
      '<div>' +
      '<h3 id="note-card-title">Cómo leer estas fichas</h3>' +
      '<p>Cada área es una categoría de trabajo; los casos llegarán uno por uno con su problema, ' +
      'método, hallazgos del análisis y limitaciones. Las ilustraciones de las áreas son ' +
      'conceptuales: explican la idea del trabajo con un ejemplo fijo, no datos reales ni ' +
      'resultados de un caso publicado.</p>' +
      '</div>' +
      '<div class="state-legend">' + legend + '</div>' +
      '</aside>';

    projectsEl.innerHTML = html;
  }

  /* Reorganización breve al filtrar: cada tarjeta viaja de su posición anterior
     a la nueva y las que aparecen entran con un fundido. Sin movimiento de
     sobra cuando la tarjeta no se ha movido. */
  function reflowGrid(previous) {
    var items = $$('#projects > *');
    if (reflowTimer) window.clearTimeout(reflowTimer);

    items.forEach(function (node, index) {
      if (node.hidden) return;
      var before = previous[index];
      var after = node.getBoundingClientRect();
      var isNew = !before || (!before.width && !before.height);
      var dx = isNew ? 0 : before.left - after.left;
      var dy = isNew ? 0 : before.top - after.top;

      node.style.transition = 'none';
      if (isNew) {
        node.style.opacity = '0';
        node.style.transform = 'translateY(10px)';
      } else if (dx || dy) {
        node.style.opacity = '';
        node.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      } else {
        return;
      }

      /* fuerza el cálculo antes de animar */
      void node.offsetWidth;
      node.style.transition = 'transform .26s cubic-bezier(.22,.68,.28,1), opacity .26s cubic-bezier(.22,.68,.28,1)';
      node.style.transform = 'none';
      node.style.opacity = '1';
    });

    reflowTimer = window.setTimeout(function () {
      reflowTimer = 0;
      items.forEach(function (node) {
        node.style.transition = '';
        node.style.transform = '';
        node.style.opacity = '';
      });
    }, 300);
  }

  function setFilter(id, options) {
    options = options || {};
    var animate = !reduceMotion.matches && options.animate !== false;
    var previous = animate ? $$('#projects > *').map(function (node) {
      return node.getBoundingClientRect();
    }) : null;

    state.filter = id;

    if (filtersEl) {
      $$('button', filtersEl).forEach(function (btn) {
        btn.setAttribute('aria-pressed', btn.getAttribute('data-filter') === id ? 'true' : 'false');
      });
    }

    var total = AREAS.length;
    var shown = 0;
    $$('.card[data-category]', projectsEl).forEach(function (card) {
      var visible = id === 'all' || card.getAttribute('data-category') === id;
      card.hidden = !visible;
      if (visible) shown++;
    });

    /* Las tarjetas ocultas dejan de ser enfocables y sus escenas se detienen */
    pauseHiddenScenes();

    movePill(animate);

    if (animate) {
      reflowGrid(previous);
    } else {
      $$('#projects > *').forEach(function (node) {
        node.style.transition = '';
        node.style.transform = '';
        node.style.opacity = '';
      });
    }

    if (statusEl) {
      statusEl.textContent = id === 'all'
        ? 'Mostrando las ' + total + ' áreas del portafolio.'
        : 'Mostrando 1 de ' + total + ' áreas del portafolio.';
    }

    if (options.focusFilters && filtersEl) {
      var target = $('button[data-filter="' + id + '"]', filtersEl);
      if (target) target.focus({ preventScroll: true });
    }

    return shown;
  }

  /* La franja lleva al área: es un destino del propio portafolio */
  function jumpToArea(id) {
    window.location.hash = '#/area/' + id;
  }

  /* ============ 5. NAVEGACIÓN INTERNA: GALERÍA → ÁREA → PROYECTO ============
     Todo ocurre dentro del portafolio. Las áreas abren su galería de proyectos
     y cada proyecto abre su vista con la aplicación montada en la propia
     página: no se sale a otro sitio ni se abre nada en otra pestaña.
     Rutas hash, para enlaces directos y para Atrás/Adelante:

       #portafolio                      galería de áreas
       #/area/<id>                      proyectos del área
       #/area/<id>/<proyecto>           proyecto integrado y su aplicación
     ====================================================================== */

  var BASE_TITLE = document.title;

  var pageHome = $('#page-home');
  var pageAbout = $('#page-about');
  var navAbout = $('#nav-about');
  var navPortfolio = $('#nav-portfolio');

  /* Piezas que solo existen en Inicio: hero (con la red animada), franja de
     áreas y contacto. Fuera de Inicio se ocultan y la red se desmonta. */
  var seccionHero = $('#inicio');
  var franjaAreas = $('.areas-strip');
  var seccionPortafolio = $('#portafolio');
  var seccionContacto = $('#contacto');

  var viewGallery = $('#view-gallery');
  var viewArea = $('#view-area');
  var viewProject = $('#view-project');
  var viewError = $('#view-error');
  var demoDialog = $('#demo-dialog');
  var demoSlot = $('#demo-slot');
  var mountedProject = null;      /* módulo activo: { destroy, onResize } */
  var demoHost = null;            /* contenedor de la aplicación en la vista */
  var demoObserver = null;
  var lastTriggerId = null;       /* enlace desde el que se entró, para el foco */
  var redHero = null;             /* controlador de la animación de Inicio */
  var redSobreMi = null;          /* mismo componente, montado en «Sobre mí» */
  var recorrido = null;           /* controlador del recorrido de «cómo trabajo» */
  var contextoAreas = {};         /* id de área → posición de su galería */
  var ultimoNivel = null;
  var areaActual = null;

  var FIELD_LABELS = [
    ['problema', 'Problema'],
    ['destinatario', 'Destinatario'],
    ['contribucion', 'Mi contribución'],
    ['fuentes', 'Fuentes y datos'],
    ['metodo', 'Método y decisiones técnicas'],
    ['resultados', 'Resultados publicados'],
    ['hallazgos', 'Hallazgos del análisis'],
    ['limitaciones', 'Limitaciones']
  ];

  function arrowIcon() {
    return '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">' +
      '<path d="M4 12h15M13 6l6 6-6 6"/></svg>';
  }

  /**
   * Bloque técnico opcional de la ficha (`project.demoTecnica`): cifras medidas
   * del entorno local y la aclaración de lo que no se ha desplegado. Se declara
   * solo en los proyectos que lo traen, así que el resto de fichas no cambia.
   */
  function demoTecnicaHtml(project) {
    var bloque = project.demoTecnica;
    if (!bloque || !bloque.puntos || !bloque.puntos.length) return '';

    var items = bloque.puntos.map(function (punto) {
      return '<li>' + esc(punto) + '</li>';
    }).join('');

    return '<div class="field field--demo">' +
      '<dt>' + esc(bloque.titulo || 'Demo local') + '</dt>' +
      '<dd>' +
        (bloque.intro ? '<p class="demo-intro">' + esc(bloque.intro) + '</p>' : '') +
        '<ul class="demo-lista">' + items + '</ul>' +
        (bloque.nota ? '<p class="demo-nota">' + esc(bloque.nota) + '</p>' : '') +
      '</dd></div>';
  }

  function areaHash(area) { return '#/area/' + area.id; }
  function projectHash(area, project) { return '#/area/' + area.id + '/' + project.id; }

  function findArea(id) {
    for (var i = 0; i < AREAS.length; i++) {
      if (AREAS[i].id === id) return AREAS[i];
    }
    return null;
  }

  function findProject(area, id) {
    var list = area.proyectos || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  function parseRoute() {
    var hash = window.location.hash || '';

    /* Página interna de presentación */
    if (hash === '#/sobre-mi') return { level: 'about' };

    /* Inicio: presentación con la red animada (anclas de la propia página) */
    if (hash === '' || hash === '#' || hash === '#inicio') {
      return { level: 'home', ancla: 'inicio' };
    }
    if (hash === '#portafolio') return { level: 'gallery' };
    if (hash === '#contacto') return { level: 'home', ancla: 'contacto' };

    var match = /^#\/area\/([a-z0-9-]+)(?:\/([a-z0-9-]+))?$/.exec(hash);
    if (match) {
      var area = findArea(match[1]);
      if (!area) return { level: 'error', ruta: hash };
      if (!match[2]) return { level: 'area', area: area };

      var project = findProject(area, match[2]);
      if (!project) return { level: 'error', ruta: hash, area: area };
      return { level: 'project', area: area, project: project };
    }

    /* Cualquier otra ancla que exista en la página vuelve a Inicio */
    if (hash.length > 1 && hash.charAt(1) !== '/') {
      var destino = document.getElementById(hash.slice(1));
      if (destino) return { level: 'home', ancla: hash.slice(1) };
    }

    /* Ruta desconocida: estado explícito, nunca un regreso silencioso a Inicio */
    return { level: 'error', ruta: hash || '(sin ruta)' };
  }

  /* ---- piezas compartidas ---- */

  function crumbs(items) {
    var parts = items.map(function (item, index) {
      if (index === items.length - 1) {
        return '<span aria-current="page">' + esc(item.label) + '</span>';
      }
      return '<a href="' + esc(item.href) + '">' + esc(item.label) + '</a>';
    });

    return '<nav class="crumbs" aria-label="Ruta de navegación">' +
      parts.join('<span aria-hidden="true">/</span>') + '</nav>';
  }

  /* ---- nivel 2: proyectos del área ----

     Las áreas marcadas como catálogo (`area.catalogo === 'tableros'`) presentan
     sus tableros publicados directamente bajo «Explorar tableros», sin la lista
     de alcance ni la etiqueta «Área NN / Portafolio», y con el título en el azul
     principal. El resto de áreas mantiene su encabezado y su alcance. */

  function renderAreaView(area) {
    var proyectos = area.proyectos || [];
    var catalogo = area.catalogo === 'tableros';

    /* Tableros reales: los que ya se pueden abrir (tienen captura). Sirven para
       decidir si los filtros tienen sentido. */
    var tableros = proyectos.filter(function (project) { return !!project.captura; });
    var conFiltros = catalogo && tableros.length > 1;

    /* En el catálogo el título es el único elemento del encabezado: sin
       entradilla y sin segunda columna vacía. El estado y la etiqueta del área
       van justo debajo, pegados al título. */
    var encabezado = '<header class="section-head view-head' +
        (catalogo ? ' view-head--catalogo' : '') + '">' +
        '<div>' +
          (catalogo
            ? ''
            : '<p class="eyebrow">Área ' + esc(area.numero) + ' / Portafolio</p>') +
          '<h2 id="area-view-title" tabindex="-1">' + esc(area.nombre) + '</h2>' +
        '</div>' +
        (catalogo
          ? ''
          : '<p class="section-intro">' + esc(area.descripcion || area.resumen) + '</p>') +
      '</header>' +
      '<p class="view-chips">' + chip(estadoOf(area)) +
        '<span class="micro-label">' + esc(area.etiqueta) + '</span></p>';

    var lista = proyectos.length
      ? '<ul class="project-list" id="catalogo-tableros">' + proyectos.map(function (project) {
          return projectRow(area, project);
        }).join('') + '</ul>'
      : '<p class="note-inline">Todavía no hay tableros en esta área.</p>';

    var cuerpo = catalogo
      ? '<div class="view-block">' +
          '<p class="micro-label">Explorar tableros</p>' +
          (conFiltros ? catalogoFiltros(tableros) : '') +
          lista +
          (conFiltros ? '<p class="sr-only" role="status" id="catalogo-status"></p>' : '') +
        '</div>'
      : (area.alcance && area.alcance.length
          ? '<div class="view-block"><p class="micro-label">Alcance del área</p>' +
            '<div class="tag-list">' + tags(area.alcance) + '</div></div>'
          : '') +
        '<div class="view-block">' +
          '<p class="micro-label">Proyectos de esta área</p>' + lista +
        '</div>';

    viewArea.innerHTML = encabezado +
      '<div class="view-grid"><div class="view-main">' + cuerpo + '</div></div>';

    /* Los proyectos sin captura muestran la ilustración conceptual de su área
       (la misma escena del portafolio), ya en su composición final: decorativa,
       sin paradas de teclado y sin movimiento que tape nada. */
    var escenas = window.PORTFOLIO_SCENES;
    if (escenas) {
      $$('.cover-ilustracion', viewArea).forEach(function (host) {
        var kind = host.getAttribute('data-escena');
        if (!kind) return;
        escenas.build(kind, host, { label: area.escenaAlt, estatica: true });
      });
    }

    if (conFiltros) wireCatalogo();
  }

  /* Texto comparable: sin mayúsculas ni acentos, para la búsqueda */
  function comparable(value) {
    return String(value == null ? '' : value)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  /**
   * Filtros del catálogo: categoría, estado y búsqueda. Solo se dibujan cuando
   * hay más de un tablero real; con uno solo la categoría va como dato en la
   * ficha y la vista previa manda. Cada grupo aparece únicamente si tiene al
   * menos dos valores reales que elegir.
   */
  function catalogoFiltros(tableros) {
    var categorias = [];
    var estados = [];
    tableros.forEach(function (project) {
      if (project.categoria && categorias.indexOf(project.categoria) === -1) {
        categorias.push(project.categoria);
      }
      if (estados.indexOf(project.estado) === -1) estados.push(project.estado);
    });

    function grupo(id, titulo, campo, valores) {
      if (valores.length < 2) return '';
      return '<div class="catalogo-grupo">' +
        '<p class="micro-label" id="' + id + '">' + esc(titulo) + '</p>' +
        '<div class="filters-row" role="group" aria-labelledby="' + id + '">' +
          '<button type="button" data-filtro="' + campo + '" data-valor="todos"' +
            ' aria-pressed="true">Todos</button>' +
          valores.map(function (valor) {
            return '<button type="button" data-filtro="' + campo + '"' +
              ' data-valor="' + esc(valor) + '" aria-pressed="false">' +
              esc(campo === 'estado' ? estadoEtiqueta(valor) : valor) +
              '</button>';
          }).join('') +
        '</div>' +
      '</div>';
    }

    return '<div class="catalogo-filtros">' +
        '<div class="catalogo-grupo">' +
          '<label class="micro-label" for="catalogo-buscar">Buscar</label>' +
          '<input class="catalogo-buscar" id="catalogo-buscar" type="search"' +
            ' placeholder="Nombre, categoría o descripción" autocomplete="off">' +
        '</div>' +
        grupo('catalogo-categoria', 'Categoría', 'categoria', categorias) +
        grupo('catalogo-estado', 'Estado', 'estado', estados) +
      '</div>';
  }

  /* Comportamiento de esos filtros: oculta las fichas que no cumplen y anuncia
     cuántas quedan. Los botones conservan el foco; no hay controles anidados. */
  function wireCatalogo() {
    var lista = $('#catalogo-tableros', viewArea);
    var barra = $('.catalogo-filtros', viewArea);
    var status = $('#catalogo-status', viewArea);
    if (!lista || !barra) return;

    var estado = { categoria: '', estado: '', texto: '' };

    function aplicar() {
      var visibles = 0;
      $$('.project-card', lista).forEach(function (item) {
        var ok = (!estado.categoria || item.getAttribute('data-categoria') === estado.categoria) &&
          (!estado.estado || item.getAttribute('data-estado') === estado.estado) &&
          (!estado.texto || (item.getAttribute('data-texto') || '').indexOf(estado.texto) !== -1);
        item.hidden = !ok;
        if (ok) visibles++;
      });
      if (status) {
        status.textContent = visibles === 1
          ? 'Un tablero en el catálogo.'
          : visibles + ' tableros en el catálogo.';
      }
    }

    barra.addEventListener('click', function (event) {
      var boton = event.target.closest ? event.target.closest('button[data-filtro]') : null;
      if (!boton) return;
      var campo = boton.getAttribute('data-filtro');
      var valor = boton.getAttribute('data-valor');
      estado[campo] = valor === 'todos' ? '' : valor;
      $$('button[data-filtro="' + campo + '"]', barra).forEach(function (otro) {
        otro.setAttribute('aria-pressed', otro === boton ? 'true' : 'false');
      });
      aplicar();
    });

    var buscador = $('.catalogo-buscar', barra);
    if (buscador) {
      buscador.addEventListener('input', function () {
        estado.texto = comparable(buscador.value).trim();
        aplicar();
      });
    }

    aplicar();
  }

  /**
   * Ficha de la galería de un área: el mismo formato que las tarjetas del
   * portafolio. Arriba, el contenedor blanco a todo el ancho con la captura real
   * y completa del tablero o, si el caso todavía no la tiene, la ilustración
   * conceptual de su área. Debajo, ya sobre el fondo de la página, la categoría
   * con su estado, el título con la flecha y la descripción. Un único enlace
   * cubre la ficha entera, así que la imagen y el título abren la ruta interna
   * del proyecto sin duplicar accesos ni botones.
   */
  function projectRow(area, project) {
    var href = esc(projectHash(area, project));
    var tituloId = 'proyecto-titulo-' + project.id;
    var titulo = String(project.titulo).split(/\s+—\s+/)[0];
    var resumen = project.resumen || project.descripcion;
    var categoria = project.categoria || area.etiqueta || 'Proyecto';

    /* La captura puede declarar sus dimensiones y su proporción: con el mismo
       alto/ancho que la imagen, `object-fit: contain` no deja bandas vacías y el
       navegador reserva el hueco antes de descargarla (sin saltos de maquetación). */
    var medidas = project.capturaAncho && project.capturaAlto
      ? ' width="' + esc(project.capturaAncho) + '" height="' + esc(project.capturaAlto) + '"'
      : '';
    var media = project.captura
      ? '<img src="' + esc(project.captura) + '" decoding="async"' + medidas +
        ' alt="' + esc(project.capturaAlt || ('Captura del tablero de ' + titulo)) + '">'
      : '<span class="cover-ilustracion" data-escena="' +
        esc(area.ilustracion || '') + '"></span>';
    var proporcion = project.capturaRatio
      ? ' style="aspect-ratio: ' + esc(project.capturaRatio) + '"'
      : '';

    /* Clase compartida para las portadas de tablero (`capturaAjuste`): todas las
       capturas de un área deben ocupar contenedores con la misma geometría, así
       que el ajuste se declara una vez en la hoja de estilos y no tarjeta a
       tarjeta. */
    var claseCover = 'cover' + (project.capturaAjuste ? ' cover-' + esc(project.capturaAjuste) : '');

    /* Los casos «próximamente» se mantienen visibles, pero atenuados y con un
       distintivo de roadmap: el caso está definido y todavía no se puede abrir. */
    var esPrevisto = project.estado === 'previsto';

    return '<li class="project-card"' +
        ' data-proyecto="' + esc(project.id || '') + '"' +
        ' data-categoria="' + esc(project.categoria || '') + '"' +
        ' data-estado="' + esc(project.estado || '') + '"' +
        ' data-texto="' + esc(comparable(titulo + ' ' + resumen + ' ' + categoria)) + '">' +
      '<article class="card' + (esPrevisto ? ' card--previsto' : '') + '">' +
        '<a class="card-hit" id="project-link-' + esc(project.id) + '"' +
          ' href="' + href + '" aria-labelledby="' + esc(tituloId) + '"></a>' +
        '<div class="' + claseCover + '"' + proporcion + '>' + media + '</div>' +
        '<p class="card-meta"><span>' + esc(categoria) + '</span>' + chip(project.estado) +
          (esPrevisto ? '<span class="roadmap-badge">Roadmap</span>' : '') + '</p>' +
        '<h3 id="' + esc(tituloId) + '">' + esc(titulo) +
        '<svg class="card-arrow" viewBox="0 0 24 24" aria-hidden="true">' +
        '<path d="M4 12h15M13 6l6 6-6 6"/></svg></h3>' +
        '<p class="card-text">' + esc(resumen) + '</p>' +
        enlacesProyecto(project, titulo) +
      '</article>' +
      '</li>';
  }

  /* ---- ruta desconocida: estado explícito, nunca un regreso silencioso ---- */

  function renderErrorView(route) {
    if (!viewError) return;

    var detalle = route.area
      ? 'El proyecto que buscas no existe dentro de «' + esc(route.area.nombre) + '».'
      : 'La dirección no corresponde a ninguna página del portafolio.';

    viewError.innerHTML =
      crumbs([{ label: 'Portafolio', href: '#portafolio' }, { label: 'Ruta no encontrada' }]) +
      '<header class="view-head">' +
        '<p class="eyebrow">Error 404</p>' +
        '<h2 id="error-view-title" tabindex="-1">Esta ruta no existe</h2>' +
        '<p class="view-lead">' + detalle + '</p>' +
        '<p class="view-lead"><code class="mono">' + esc(route.ruta || '') + '</code></p>' +
        '<p class="view-chips">' +
          '<a class="btn btn-primary" href="#portafolio">Ir al portafolio' + arrowIcon() + '</a>' +
          '<a class="btn btn-ghost" href="#inicio">Volver al inicio</a>' +
        '</p>' +
      '</header>';
  }

  /* ---- nivel 3: proyecto integrado y su aplicación ---- */

  function renderProjectView(area, project) {
    var rows = '';

    FIELD_LABELS.forEach(function (pair) {
      /* «Hallazgos del análisis» se genera desde el estado de la aplicación: el
         contenedor se reserva aquí, antes del dashboard, y el módulo lo rellena. */
      if (pair[0] === 'hallazgos') {
        if (project.hallazgos === undefined || project.hallazgos === null) return;
        /* Mismo formato que el resto de apartados: celda normal de la cuadrícula
           (columna derecha, bajo «Fuentes y datos»), sin tarjeta ni iconos. */
        rows += '<div class="field">' +
          '<dt>' + esc(pair[1]) + '</dt>' +
          '<dd class="hallazgos-host" id="hallazgos-host" data-testid="hallazgos-host">' +
          '<p class="hallazgos-espera" role="status">Calculando hallazgos con los datos publicados…</p>' +
          '</dd></div>';
        return;
      }

      /* Detalle metodológico plegable: cuando la ficha lo declara, el texto
         largo del método se guarda en un <details> y el resto de apartados
         —incluidas las limitaciones— sigue visible. */
      if (pair[0] === 'metodo' && project.metodoEnDetalle && project.metodo) {
        rows += '<div class="field field--plegable"><details>' +
          '<summary><span class="plegable-titulo">' + esc(pair[1]) + '</span>' +
            '<span class="plegable-hint">Detalle metodológico</span></summary>' +
          '<div class="plegable-cuerpo"><p>' + esc(project.metodo) + '</p></div>' +
          '</details></div>';
        return;
      }

      var value = project[pair[0]];
      if (value) {
        rows += '<div><dt>' + esc(pair[1]) + '</dt><dd>' + esc(value) + '</dd></div>';
      }
    });

    /* Bloque técnico opcional (demo local) antes de las tecnologías. */
    var bloqueDemo = demoTecnicaHtml(project);
    if (bloqueDemo) rows += bloqueDemo;

    /* Tecnologías: lista agrupada por función (sin píldoras ni tarjetas). Si el
       proyecto no declara grupos, se mantienen las etiquetas de siempre. */
    if (project.tecnologias && project.tecnologias.length) {
      var gruposTecnologias = tecnologiasAgrupadas(project.tecnologiasGrupos);
      rows += '<div class="field-tecnologias"><dt>Tecnologías</dt><dd>' +
        (gruposTecnologias ||
          '<div class="tag-list">' + tags(project.tecnologias) + '</div>') +
        '</dd></div>';
    }

    var pendiente = project.estado !== 'publicado';
    var etiquetaCategoria = project.etiquetaCategoria || area.etiqueta;
    var resumenFicha = project.resumenFicha && project.resumen
      ? '<p class="view-summary">' + esc(project.resumen) + '</p>'
      : '';

    /* Sin migas ni franja «Aplicación»: la navegación de esta vista vive en la
       cabecera del dashboard (Portafolio / Visualización) y la única acción de
       ampliación es su icono junto a «Fuentes». */
    /* Encabezado de la ficha: misma familia y mismo acento azul que los
       apartados. El dato del proyecto llega como «Título — Subtítulo»; aquí se
       separa en título principal y subtítulo sin tocar el contenido original. */
    var partesTitulo = String(project.titulo).split(/\s+—\s+/);
    var tituloPrincipal = partesTitulo[0];
    var subtituloPrincipal = partesTitulo.length > 1 ? partesTitulo.slice(1).join(' — ') : null;

    /* Resumen de métricas clave (opcional): se lee antes del detalle, con el
       mismo lenguaje visual que los apartados de la ficha. */
    var metricas = project.resumenMetricas
      ? '<dl class="fields project-fields ficha-metricas"><div>' +
          '<dt>Métricas clave</dt><dd>' + esc(project.resumenMetricas) + '</dd>' +
        '</div></dl>'
      : '';

    var html = '<header class="view-head view-head--proyecto">' +
        '<p class="eyebrow">Proyecto / Área ' + esc(area.numero) + '</p>' +
        '<h1 class="view-title" id="project-view-title" tabindex="-1">' + esc(tituloPrincipal) + '</h1>' +
        (subtituloPrincipal ? '<p class="view-subtitle">' + esc(subtituloPrincipal) + '</p>' : '') +
        resumenFicha +
        '<p class="view-lead">' + esc(project.descripcion) + '</p>' +
        '<p class="view-chips">' + chip(project.estado) +
          '<span class="micro-label">' + esc(etiquetaCategoria) + '</span></p>' +
      '</header>' +
      metricas +
      (rows ? '<dl class="fields project-fields">' + rows + '</dl>' : '') +
      /* El dashboard se monta directamente, sin marco ni barra externa. */
      '<div class="demo-body" id="demo-back">' +
        '<div class="demo-host" id="demo-host"></div>' +
      /* El aviso del final depende del estado real: un caso previsto se anuncia como
         planificación; uno en desarrollo puede tener ya la aplicación y carecer solo
         de los datos, y eso es lo que dice `notaEstado`. */
      (pendiente
        ? '<p class="ficha-note">' + esc(
            project.notaEstado ||
              'Ficha de planificación. Los datos, resultados, capturas y la ' +
                'aplicación se incorporarán cuando el caso esté desarrollado y revisado.'
          ) + '</p>'
        : '') +
      '<nav class="view-nav" aria-label="Navegación del proyecto">' +
        '<a class="view-back" href="' + esc(areaHash(area)) + '">' +
          '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">' +
            '<path d="M20 12H5M11 18l-6-6 6-6"/></svg>' +
          'Volver a ' + esc(area.nombre) +
        '</a>' +
        nextProjectLink(area, project) +
      '</nav>';

    viewProject.innerHTML = html;

    demoHost = $('#demo-host');
    mountProject(project);
  }

  function nextProjectLink(area, project) {
    var list = area.proyectos || [];
    if (list.length < 2) return '';

    var index = list.indexOf(project);
    var next = list[(index + 1) % list.length];

    return '<a class="view-next" href="' + esc(projectHash(area, next)) + '">' +
      esc(next.titulo) + arrowIcon() + '</a>';
  }

  /* ---- montaje de la aplicación del proyecto ---- */

  function destroyProject() {
    if (demoObserver) {
      demoObserver.disconnect();
      demoObserver = null;
    }

    if (mountedProject && typeof mountedProject.destroy === 'function') {
      try {
        mountedProject.destroy();
      } catch (err) {
        /* el módulo no pudo limpiarse; se sigue con la navegación */
      }
    }

    mountedProject = null;
  }

  function mountProject(project) {
    destroyProject();
    if (!demoHost) return;

    var registry = window.PORTFOLIO_PROJECTS;
    var module = registry ? registry.get(project.id) : null;

    if (module && typeof module.mount === 'function') {
      try {
        mountedProject = module.mount(demoHost, registry) || null;
      } catch (err) {
        demoHost.innerHTML = '';
        mountedProject = null;
      }
    }

    /* Si el proyecto todavía no tiene aplicación, se muestra el espacio reservado */
    if (!mountedProject && registry) {
      mountedProject = registry.placeholder(demoHost, { titulo: project.titulo });
    }

    if ('ResizeObserver' in window && demoHost) {
      demoObserver = new ResizeObserver(function (entries) {
        if (!mountedProject || typeof mountedProject.onResize !== 'function') return;
        var rect = entries[0].contentRect;
        try {
          mountedProject.onResize({ width: rect.width, height: rect.height });
        } catch (err) {
          /* el módulo decide qué hacer */
        }
      });
      demoObserver.observe(demoHost);
    }
  }

  /* ---- ampliar la aplicación dentro de la página ---- */

  function expandDemo() {
    if (!demoDialog || !demoSlot || !demoHost) return;

    demoSlot.appendChild(demoHost);
    /* Marcamos el modo ampliado para que el contenedor exterior no reserve el
       hueco entre la ficha y la aplicación. */
    document.body.classList.add('demo-ampliado');
    if (typeof demoDialog.showModal === 'function') demoDialog.showModal();
  }

  function reduceDemo() {
    if (demoDialog && demoDialog.open) demoDialog.close();
  }

  /* Único mecanismo de ampliación: lo usa el icono de la cabecera del dashboard. */
  function initDemoApi() {
    window.PORTFOLIO_DEMO = {
      ampliar: expandDemo,
      reducir: reduceDemo,
      alternar: function () {
        if (demoDialog && demoDialog.open) reduceDemo();
        else expandDemo();
      },
      ampliado: function () {
        return Boolean(demoDialog && demoDialog.open);
      }
    };
  }

  function initDemoDialog() {
    if (!demoDialog) return;

    /* Cierre al pulsar fuera de la aplicación */
    demoDialog.addEventListener('click', function (event) {
      if (event.target !== demoDialog) return;
      var rect = demoDialog.getBoundingClientRect();
      var outside = event.clientX < rect.left || event.clientX > rect.right ||
        event.clientY < rect.top || event.clientY > rect.bottom;
      if (outside) demoDialog.close();
    });

    /* Al cerrar —acción del dashboard, Escape o fondo— vuelve a su sitio */
    demoDialog.addEventListener('close', function () {
      document.body.classList.remove('demo-ampliado');
      if (!demoHost) return;

      var back = $('#demo-back');
      if (back && demoHost.parentNode !== back) back.appendChild(demoHost);
    });
  }

  /* ---- vistas, páginas y rutas ---- */

  function showView(level) {
    if (viewGallery) viewGallery.hidden = level !== 'gallery';
    if (viewArea) viewArea.hidden = level !== 'area';
    if (viewProject) viewProject.hidden = level !== 'project';
    if (viewError) viewError.hidden = level !== 'error';
  }

  /* La red del hero solo vive en Inicio: se monta al entrar y se destruye al
     salir (frames, observadores y listeners incluidos). */
  function montarRedHero() {
    if (redHero) return;
    var svg = document.getElementById('network');
    if (!svg) return;
    redHero = initNetwork();
  }

  function desmontarRedHero() {
    if (!redHero) return;
    if (typeof redHero.destroy === 'function') redHero.destroy();
    redHero = null;
  }

  /* La misma red, en «Sobre mí»: composición sin núcleo ni monograma (no lleva
     círculo central superpuesto) y sin botón de pausa propio. Se monta solo
     mientras la página está visible, con su propio SVG y sus propios ids, así
     que nunca hay dos animaciones corriendo ni identificadores duplicados. */
  function montarRedSobreMi() {
    if (redSobreMi) return;
    var svg = document.getElementById('network-sobre-mi');
    if (!svg) return;
    redSobreMi = initNetwork({
      svg: svg,
      toggle: null,
      nucleo: false,
      semilla: 20260412,
      ajustar: true
    });
  }

  function desmontarRedSobreMi() {
    if (!redSobreMi) return;
    if (typeof redSobreMi.destroy === 'function') redSobreMi.destroy();
    redSobreMi = null;
  }

  /* El recorrido de «cómo trabajo» también vive solo en «Sobre mí»: se monta al
     entrar y se destruye al salir (observador y esquemas de móvil incluidos). */
  function montarRecorrido() {
    if (recorrido) return;
    recorrido = initRecorrido();
  }

  function desmontarRecorrido() {
    if (!recorrido) return;
    if (typeof recorrido.destroy === 'function') recorrido.destroy();
    recorrido = null;
  }

  /**
   * Qué se ve en cada nivel. Solo cabecera, navegación y pie son compartidos:
   *  - Inicio: hero + red animada + franja de áreas + contacto;
   *  - Portafolio (galería), área y proyecto: solo la sección del portafolio,
   *    con la vista que corresponda;
   *  - Sobre mí: solo su página;
   *  - Ruta desconocida: estado explícito.
   */
  function showPage(level) {
    var esInicio = level === 'home';
    var esPortafolio = level === 'gallery' || level === 'area' || level === 'project';
    var esError = level === 'error';
    var esSobreMi = level === 'about';

    document.body.setAttribute('data-vista', level);

    if (pageHome) pageHome.hidden = esSobreMi;
    if (pageAbout) pageAbout.hidden = !esSobreMi;

    var destacados = document.querySelector('.featured');
    if (destacados) destacados.hidden = !esInicio;
    if (seccionHero) seccionHero.hidden = !esInicio;
    if (franjaAreas) franjaAreas.hidden = !esInicio;
    if (seccionContacto) seccionContacto.hidden = !esInicio;
    if (seccionPortafolio) seccionPortafolio.hidden = !(esPortafolio || esError);

    if (esInicio) montarRedHero();
    else desmontarRedHero();

    if (esSobreMi) montarRedSobreMi();
    else desmontarRedSobreMi();

    if (esSobreMi) montarRecorrido();
    else desmontarRecorrido();

    return esPortafolio;
  }

  function viewFor(level) {
    if (level === 'area') return viewArea;
    if (level === 'project') return viewProject;
    if (level === 'error') return viewError;
    return viewGallery;
  }

  /* Ancla de sección del inicio (inicio, portafolio, contacto) */
  function sectionAnchor() {
    var hash = window.location.hash || '';
    if (hash.length < 2 || hash.charAt(1) === '/') return null;
    return document.getElementById(hash.slice(1));
  }

  function settle(route, options) {
    var level = route.level;
    var target = viewFor(level);
    var suave = (options.instant || reduceMotion.matches) ? 'auto' : 'smooth';

    if (level === 'home') {
      /* Inicio: se respeta el ancla pedida (inicio, contacto…). */
      var ancla = document.getElementById(options.ancla || 'inicio');
      if (ancla) ancla.scrollIntoView({ behavior: suave, block: 'start' });
      else if (!options.initial) window.scrollTo({ top: 0, behavior: suave });
    } else if (level === 'area' && route.area && contextoAreas[route.area.id] != null) {
      /* Al volver de un proyecto se recupera la posición de esa galería. */
      var guardado = contextoAreas[route.area.id];
      delete contextoAreas[route.area.id];
      window.scrollTo({ top: guardado, behavior: 'auto' });
    } else if (target) {
      var rect = target.getBoundingClientRect();
      var offscreen = rect.top < 0 || rect.top > window.innerHeight * 0.55;

      /* En la carga inicial se respeta el sitio donde aterriza el visitante:
         solo se coloca la vista cuando el enlace es interno. */
      if (offscreen && !(options.initial && level === 'gallery')) {
        target.scrollIntoView({ behavior: suave, block: 'start' });
      }
    }

    if (!options.focus) return;

    /* Si la vista se abrió desde un enlace, devolvemos allí el foco */
    if (lastTriggerId) {
      var trigger = document.getElementById(lastTriggerId);
      if (trigger && target && target.contains(trigger)) {
        trigger.focus({ preventScroll: true });
        lastTriggerId = null;
        return;
      }
    }

    var heading = target ? target.querySelector('h1[tabindex="-1"], h2[tabindex="-1"]') : null;
    if (!heading && level === 'home') heading = document.getElementById('hero-title');
    if (heading) heading.focus({ preventScroll: true });
  }

  /* Página interna «Sobre mí»: se abre arriba, como una página aparte */
  function settleAbout(options) {
    if (!pageAbout) return;

    if (!options.initial) {
      window.scrollTo({
        top: 0,
        behavior: (options.instant || reduceMotion.matches) ? 'auto' : 'smooth'
      });
    }

    if (!options.focus) return;

    var title = $('#about-title');
    if (title) title.focus({ preventScroll: true });
  }

  function renderRoute(route, options) {
    var opts = options || {};
    var level = route.level;

    /* Contexto de la galería del área: se recuerda al entrar a un proyecto. */
    if (ultimoNivel === 'area' && areaActual && level === 'project' &&
        route.area && route.area.id === areaActual) {
      contextoAreas[areaActual] = window.scrollY;
    }

    showPage(level);

    if (navAbout) {
      if (level === 'about') navAbout.setAttribute('aria-current', 'page');
      else navAbout.removeAttribute('aria-current');
    }
    if (navPortfolio) {
      if (level === 'gallery' || level === 'area' || level === 'project') {
        navPortfolio.setAttribute('aria-current', 'page');
      } else {
        navPortfolio.removeAttribute('aria-current');
      }
    }

    if (level === 'about') {
      destroyProject();
      showView('about');
      document.title = 'Sobre mí · Hugo Aguilar';
      areaActual = null;
      ultimoNivel = level;
      settleAbout(opts);
      return;
    }

    if (level === 'home') {
      destroyProject();
      showView('home');
      document.title = BASE_TITLE;
      areaActual = null;
      ultimoNivel = level;
      settle(route, opts);
      return;
    }

    if (level === 'error') {
      destroyProject();
      renderErrorView(route);
      showView('error');
      document.title = 'Ruta no encontrada · Hugo Aguilar';
      areaActual = null;
      ultimoNivel = level;
      settle(route, opts);
      return;
    }

    if (level === 'project') {
      renderProjectView(route.area, route.project);
      showView('project');
      document.title = route.project.titulo + ' · Hugo Aguilar';
      areaActual = route.area.id;
      registrarVistaProyecto(route.area, route.project);
    } else if (level === 'area') {
      destroyProject();
      renderAreaView(route.area);
      showView('area');
      document.title = route.area.nombre + ' · Hugo Aguilar';
      areaActual = route.area.id;
    } else {
      destroyProject();
      showView('gallery');
      document.title = 'Portafolio · Hugo Aguilar';
      areaActual = null;
    }

    ultimoNivel = level;
    settle(route, opts);
  }

  function initRouter() {
    initDemoDialog();
    initDemoApi();

    /* Recordar el enlace que inicia la navegación, para devolver el foco al volver.
       Los enlaces sin id (migas, «volver») no borran la referencia anterior. */
    document.addEventListener('click', function (event) {
      var link = event.target.closest ? event.target.closest('a[href^="#/"], [data-jump]') : null;
      if (!link || !link.id) return;
      lastTriggerId = link.id;
    });

    window.addEventListener('hashchange', function () {
      renderRoute(parseRoute(), { focus: true });
    });

    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    renderRoute(parseRoute(), { focus: false, instant: true, initial: true });
  }


  /* ============ 6. COPIAR CORREO ============ */

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      try {
        var field = document.createElement('textarea');
        field.value = text;
        field.setAttribute('readonly', '');
        field.style.position = 'fixed';
        field.style.top = '-1000px';
        field.style.opacity = '0';
        document.body.appendChild(field);
        field.select();
        var ok = document.execCommand && document.execCommand('copy');
        document.body.removeChild(field);
        if (ok) resolve();
        else reject(new Error('copy'));
      } catch (err) {
        reject(err);
      }
    });
  }

  function selectEmail() {
    var link = $('.email');
    if (!link) return;
    try {
      var range = document.createRange();
      range.selectNodeContents(link);
      var selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      link.focus();
    } catch (err) {
      /* Sin selección: el mensaje de error ya indica qué hacer */
    }
  }

  function initCopy() {
    var button = $('#copy');
    var status = $('#copy-status');
    if (!button || !status) return;

    var text = button.getAttribute('data-copy') || '';
    var timer = null;

    function say(message, kind) {
      status.textContent = message;
      if (kind) status.setAttribute('data-state', kind);
      else status.removeAttribute('data-state');
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(function () {
        status.textContent = '';
        status.removeAttribute('data-state');
      }, 7000);
    }

    button.addEventListener('click', function () {
      copyText(text).then(function () {
        say('Correo copiado al portapapeles.', 'ok');
      }).catch(function () {
        say('No se pudo copiar automáticamente. El correo quedó seleccionado: usa Ctrl+C o ⌘+C.', 'error');
        selectEmail();
      });
    });
  }

  /* ============ 7. ARRANQUE ============ */

  /* Cabecera fija: el velo aparece de forma gradual con el desplazamiento. El
     progreso (0 arriba del todo → 1 desplazado) lo consume el CSS para el fondo,
     el desenfoque y el divisor, así que la transición es continua y la altura de
     la barra no cambia: el contenido nunca se mueve. */
  function initHeaderState() {
    var cabecera = document.querySelector('.site-header');
    if (!cabecera) return;

    var RANGO = 96;              /* píxeles hasta el velo completo */
    var pendiente = 0;

    function pintar() {
      pendiente = 0;
      var progreso = Math.min(1, Math.max(0, window.scrollY / RANGO));
      cabecera.style.setProperty('--hdr-p', String(Math.round(progreso * 100) / 100));
    }

    function alDesplazar() {
      if (pendiente) return;
      pendiente = window.requestAnimationFrame(pintar);
    }

    window.addEventListener('scroll', alDesplazar, { passive: true });
    window.addEventListener('resize', pintar, { passive: true });
    pintar();
  }

  /* ============ 16. TELEMETRÍA ANÓNIMA ============
     Contadores del pie y ranking de proyectos sobre /api/v1/visitas. El sitio
     funciona igual sin la API: cualquier fallo deja el bloque oculto, sin
     mensajes ni excepciones. La sesión evita contar dos veces la misma visita
     o el mismo proyecto. No se usan cookies. */

  var CLAVE_VISITA = 'portafolio_visita_registrada';
  var MAXIMO_TELEMETRIA = 5;

  function telemetriaBase() {
    var config = window.PORTAFOLIO_CONFIG;
    var base = (config && config.apiBaseUrl) || window.PORTAFOLIO_API_BASE || '/api';
    return String(base).replace(/\/+$/, '');
  }

  function telemetriaUrl(ruta) {
    return telemetriaBase() + '/v1/visitas' + (ruta || '');
  }

  function leerSesion(clave) {
    try {
      return window.sessionStorage.getItem(clave);
    } catch (error) {
      return null;
    }
  }

  function guardarSesion(clave, valor) {
    try {
      window.sessionStorage.setItem(clave, valor);
      return true;
    } catch (error) {
      return false;
    }
  }

  function pedirTelemetria(url, opciones) {
    return fetch(url, opciones).then(function (respuesta) {
      if (!respuesta || !respuesta.ok) return null;
      return respuesta.json().then(function (datos) {
        return datos && typeof datos === 'object' ? datos : null;
      }, function () {
        return null;
      });
    }).catch(function () {
      return null;
    });
  }

  function formatearMetrica(valor) {
    var numero = Number(valor);
    if (!isFinite(numero) || numero < 0) numero = 0;
    return numero.toLocaleString('es-MX');
  }

  function registrarVisitaPortafolio() {
    var opciones = { cache: 'no-store', headers: { Accept: 'application/json' } };
    if (leerSesion(CLAVE_VISITA) === '1') {
      return pedirTelemetria(telemetriaUrl(''), opciones);
    }
    return pedirTelemetria(telemetriaUrl('/registrar'), {
      method: 'POST',
      headers: { Accept: 'application/json' }
    }).then(function (registro) {
      /* Sin respuesta válida no se insiste con el GET: la API no está ahí y el
         pie debe quedarse oculto con una sola petición fallida. */
      if (!registro || typeof registro.visitas_totales !== 'number') return null;
      guardarSesion(CLAVE_VISITA, '1');
      return pedirTelemetria(telemetriaUrl(''), opciones).then(function (estado) {
        return estado || registro;
      });
    });
  }

  function buscarProyectoTelemetria(id) {
    for (var i = 0; i < AREAS.length; i += 1) {
      var area = AREAS[i];
      var proyectos = area.proyectos || [];
      for (var j = 0; j < proyectos.length; j += 1) {
        if (proyectos[j].id === id) return { area: area, project: proyectos[j] };
      }
    }
    return null;
  }

  function pintarTelemetria(datos) {
    var contenedor = document.getElementById('telemetria');
    var cifras = document.getElementById('telemetria-cifras');
    var panel = document.getElementById('telemetria-panel');
    var lista = document.getElementById('telemetria-top');
    if (!contenedor || !cifras || !lista) return;

    var visitas = Number(datos.visitas_totales);
    if (!isFinite(visitas) || visitas <= 0) {
      contenedor.hidden = true;
      return;
    }
    var unicos = Number(datos.visitantes_unicos);
    if (!isFinite(unicos) || unicos < 0) unicos = 0;
    cifras.textContent = formatearMetrica(unicos) + ' visitantes · ' +
      formatearMetrica(visitas) + ' vistas';

    var top = Array.isArray(datos.top_proyectos) ? datos.top_proyectos : [];
    var filas = [];
    for (var i = 0; i < top.length && filas.length < MAXIMO_TELEMETRIA; i += 1) {
      var entrada = top[i] || {};
      var proyecto = buscarProyectoTelemetria(entrada.proyecto_id);
      var vistas = Number(entrada.vistas);
      if (!proyecto || !isFinite(vistas) || vistas <= 0) continue;
      filas.push({ area: proyecto.area, project: proyecto.project, vistas: vistas });
    }

    if (!filas.length) {
      if (panel) panel.hidden = true;
      contenedor.hidden = false;
      return;
    }

    var maximo = 0;
    filas.forEach(function (fila) {
      if (fila.vistas > maximo) maximo = fila.vistas;
    });

    var fragmento = document.createDocumentFragment();
    filas.forEach(function (fila) {
      var item = document.createElement('li');
      item.className = 'telemetry-item';

      var enlace = document.createElement('a');
      enlace.className = 'telemetry-link';
      enlace.href = '#/area/' + fila.area.id + '/' + fila.project.id;
      enlace.title = fila.project.titulo;

      var nombre = document.createElement('span');
      nombre.className = 'telemetry-name';
      nombre.textContent = String(fila.project.titulo || fila.project.id)
        .split(/\s+—\s+/)[0];

      var conteo = document.createElement('span');
      conteo.className = 'telemetry-count';
      conteo.textContent = formatearMetrica(fila.vistas);

      var barra = document.createElement('span');
      barra.className = 'telemetry-bar';
      barra.setAttribute('aria-hidden', 'true');
      var relleno = document.createElement('span');
      relleno.style.width = Math.max(6, Math.round((fila.vistas / maximo) * 100)) + '%';
      barra.appendChild(relleno);

      enlace.appendChild(nombre);
      enlace.appendChild(conteo);
      enlace.appendChild(barra);
      item.appendChild(enlace);
      fragmento.appendChild(item);
    });

    lista.replaceChildren(fragmento);
    if (panel) panel.hidden = false;
    contenedor.hidden = false;
  }

  function registrarVistaProyecto(area, project) {
    if (!area || !project || !project.id) return;
    var clave = 'portafolio_visto_' + project.id;
    if (leerSesion(clave) === '1') return;
    guardarSesion(clave, '1');
    pedirTelemetria(telemetriaUrl('/proyecto'), {
      method: 'POST',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({ proyecto_id: project.id, area_id: area.id })
    });
  }

  function iniciarTelemetria() {
    registrarVisitaPortafolio().then(function (datos) {
      if (datos) pintarTelemetria(datos);
    }, function () {
      /* La API no respondió: el pie permanece oculto. */
    });
  }

  function init() {
    /* Sin JavaScript (o si este archivo falla) el contenido queda visible: las
       entradas de la galería solo se preparan cuando esta clase existe. */
    document.documentElement.classList.add('has-js');

    /* La red del hero la monta el router: solo existe en Inicio. */
    renderFeatured();
    renderStrip();
    renderFilters();
    renderCards();
    mountScenes();
    initRouter();
    initCopy();
    iniciarTelemetria();

    /* La cabecera fija pasa a fondo opaco al desplazarse: con el velo
       translúcido se leía el contenido que circula por debajo. */
    initHeaderState();

    /* Las escenas se pausan al ocultar la pestaña */
    document.addEventListener('visibilitychange', function () {
      scenePlayers.forEach(function (player) {
        if (document.hidden) player.pause();
        else player.resume();
      });
    });

    /* Y cambian de comportamiento si cambia la preferencia de movimiento */
    if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', onSceneMotionChange);
    else if (reduceMotion.addListener) reduceMotion.addListener(onSceneMotionChange);

    /* Al cambiar el ancho, la superficie del filtro se recoloca sin animar */
    var resizeTimer = 0;
    window.addEventListener('resize', function () {
      if (resizeTimer) window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(movePill, 140);
    }, { passive: true });

    /* Al cerrar la página se sueltan observadores, eventos y animaciones */
    window.addEventListener('pagehide', destroyScenes);

    /* Delegación: filtros de la galería y saltos a un área */
    document.addEventListener('click', function (event) {
      var target = event.target;
      if (!target.closest) return;

      var filter = target.closest('[data-filter]');
      if (filter) {
        setFilter(filter.getAttribute('data-filter'));
        return;
      }

      var jump = target.closest('[data-jump]');
      if (jump) {
        jumpToArea(jump.getAttribute('data-jump'));
      }
    });

    /* Primera colocación del filtro: sin transición */
    setFilter('all', { animate: false });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();





