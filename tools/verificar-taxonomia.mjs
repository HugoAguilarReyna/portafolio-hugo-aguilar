/**
 * Verifica la taxonomía del sitio integrador en un navegador real.
 *
 *   node tools/verificar-taxonomia.mjs
 *
 * Comprueba, contra el sitio servido:
 *   1. las cuatro áreas, en orden, con su número, nombre y etiqueta;
 *   2. que la galería declare recuento de casos y categorías por área;
 *   3. el número de fichas esperado en cada área y que cada una muestre estado
 *      y categoría visible;
 *   4. los enlaces a repositorio y a demo, con pestaña nueva y rel seguro;
 *   5. que los enlaces sean clicables por encima de la capa `card-hit`;
 *   6. el tratamiento de roadmap: visible, atenuado y con distintivo;
 *   7. ausencia de errores de consola.
 *
 * Sale con código 1 si alguna comprobación falla. Guarda capturas en
 * `evidencias/taxonomia/`.
 */
import { mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.SITE_BASE || 'http://127.0.0.1:8000';
const SALIDA = path.join(RAIZ, 'evidencias', 'taxonomia');

let playwright;
try {
  playwright = await import('@playwright/test');
} catch {
  const ruta = path.join(RAIZ, 'dashboards', 'clientes-campanas', 'node_modules', '@playwright', 'test', 'index.mjs');
  await import(pathToFileURL(ruta).href);
  playwright = await import(pathToFileURL(ruta).href);
}
const { chromium } = playwright;

mkdirSync(SALIDA, { recursive: true });

const AREAS = [
  { numero: '01', id: 'dashboards', nombre: 'Dashboards y visualización', etiqueta: 'Visualización', casos: 6 },
  { numero: '02', id: 'ciencia-de-datos', nombre: 'Ciencia de datos y Machine Learning', etiqueta: 'Ciencia de datos', casos: 5 },
  { numero: '03', id: 'ia-generativa', nombre: 'IA generativa y LLMs', etiqueta: 'IA generativa', casos: 2 },
  { numero: '04', id: 'agentes', nombre: 'Agentes y sistemas de decisión', etiqueta: 'Agentes', casos: 5 }
];

const CON_REPO = [
  'comparativo-bancario', 'atlas-vial', 'marketing-clientes', 'pulso-comercial',
  'vidas-en-transito', 'orbita', 'atlas-comercial', 'clientes-campanas',
  'clientes-en-movimiento', 'gaza-observatorio', 'retailops', 'asistente-investigacion',
  'copiloto-nl-sql', 'data-incident-commander', 'the-ripple-room', 'kilometro-cero', 'dockmind'
];
const CON_DEMO = [
  'vidas-en-transito', 'orbita', 'clientes-campanas', 'clientes-en-movimiento',
  'gaza-observatorio', 'retailops', 'asistente-investigacion', 'copiloto-nl-sql',
  'data-incident-commander', 'the-ripple-room', 'kilometro-cero', 'dockmind'
];
const PREVISTOS = ['analista-asistido'];
const ESTADOS = ['Publicado', 'En desarrollo', 'Próximamente'];

const fallos = [];
let ok = 0;
function comprobar(condicion, mensaje) {
  if (condicion) { ok++; return; }
  fallos.push(mensaje);
  console.log('FALLO: ' + mensaje);
}

const navegador = await chromium.launch();
const pagina = await navegador.newPage({ viewport: { width: 1440, height: 1000 } });
const errores = [];
pagina.on('pageerror', (e) => errores.push('JS: ' + e.message));
pagina.on('console', (m) => { if (m.type() === 'error') errores.push('consola: ' + m.text()); });

/* ---------------------------------------------------------------- galería */
await pagina.goto(BASE + '/#portafolio', { waitUntil: 'networkidle' });
await pagina.waitForSelector('#area-link-dashboards');

const tarjetas = await pagina.$$eval('#projects .card[data-category]', (nodos) => nodos.map((n) => ({
  categoria: n.getAttribute('data-category'),
  meta: n.querySelector('.card-meta')?.textContent?.trim() || '',
  titulo: n.querySelector('h3')?.textContent?.trim() || '',
  conteo: n.querySelector('.card-counts')?.textContent?.trim() || '',
  cats: [...n.querySelectorAll('.card-cats .tag')].map((t) => t.textContent.trim())
})));

comprobar(tarjetas.length === 4, `la galería debe mostrar 4 áreas, muestra ${tarjetas.length}`);
AREAS.forEach((area, i) => {
  const t = tarjetas[i];
  if (!t) { fallos.push(`falta la tarjeta del área ${area.numero}`); return; }
  comprobar(t.categoria === area.id, `posición ${i + 1}: se esperaba ${area.id}, hay ${t.categoria}`);
  comprobar(t.titulo.startsWith(area.nombre), `área ${area.numero}: título inesperado «${t.titulo}»`);
  comprobar(t.meta.includes('Área ' + area.numero), `área ${area.numero}: falta el número en la tarjeta`);
  comprobar(t.meta.includes(area.etiqueta), `área ${area.numero}: falta la etiqueta «${area.etiqueta}»`);
  comprobar(/^\d+ casos?/.test(t.conteo), `área ${area.numero}: falta el recuento de casos (hay «${t.conteo}»)`);
  comprobar(t.conteo.includes(String(area.casos)), `área ${area.numero}: el recuento no coincide con ${area.casos} casos`);
});

/* Recorre la página para que las escenas de portada se revelen: su animación
   depende de un IntersectionObserver y una captura fullPage sin recorrido las
   deja sin dibujar. */
async function recorrer(pagina) {
  await pagina.evaluate(async () => {
    const paso = Math.round(window.innerHeight * 0.75);
    for (let y = 0; y < document.body.scrollHeight; y += paso) {
      window.scrollTo(0, y);
      await new Promise((listo) => setTimeout(listo, 70));
    }
    window.scrollTo(0, 0);
    await new Promise((listo) => setTimeout(listo, 250));
  });
}

const galeria390 = await navegador.newPage({ viewport: { width: 390, height: 900 } });
await galeria390.goto(BASE + '/#portafolio', { waitUntil: 'networkidle' });
const desborde390 = await galeria390.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
comprobar(desborde390 <= 1, `galería a 390 px con desborde horizontal de ${desborde390} px`);
await recorrer(galeria390);
await galeria390.screenshot({ path: path.join(SALIDA, 'galeria-390.png') });
await galeria390.close();

await recorrer(pagina);

/* Las cuatro portadas de área son escenas conceptuales: deben haberse montado. */
const escenas = await pagina.$$eval('#projects .card[data-category] .cover', (nodos) =>
  nodos.map((n) => !!n.querySelector('svg')));
comprobar(escenas.length === 4, `se esperaban 4 portadas de área, hay ${escenas.length}`);
escenas.forEach((tiene, i) => comprobar(tiene, `la portada del área ${i + 1} no montó su escena`));

await pagina.screenshot({ path: path.join(SALIDA, 'galeria-1440.png') });

/* ------------------------------------------------------------ por área */
let totalRepo = 0;
let totalDemo = 0;
for (const area of AREAS) {
  await pagina.goto(`${BASE}/#/area/${area.id}`, { waitUntil: 'networkidle' });
  await pagina.waitForSelector('.project-list');

  /* Las capturas se decodifican en diferido: sin esta espera la comprobación de
     portadas depende del orden de llegada de las imágenes. */
  await pagina.waitForFunction(
    () => [...document.querySelectorAll('.project-list .cover img')].every((i) => i.complete && i.naturalWidth > 0),
    null,
    { timeout: 15000 }
  ).catch(() => {});

  const fichas = await pagina.$$eval('.project-card', (nodos) => nodos.map((li) => {
    const card = li.querySelector('article.card');
    return {
      id: li.getAttribute('data-proyecto'),
      estadoAtributo: li.getAttribute('data-estado'),
      chip: card?.querySelector('.chip')?.textContent?.trim() || '',
      categoria: card?.querySelector('.card-meta span')?.textContent?.trim() || '',
      enlaces: [...card.querySelectorAll('.card-links .card-link')].map((a) => ({
        href: a.getAttribute('href'),
        target: a.getAttribute('target'),
        rel: a.getAttribute('rel'),
        texto: a.textContent.trim()
      })),
      previsto: card?.classList.contains('card--previsto'),
      roadmap: card?.querySelector('.roadmap-badge')?.textContent?.trim() || '',
      visible: !!card?.offsetParent,
      opacidadCover: card ? getComputedStyle(card.querySelector('.cover')).opacity : null
    };
  }));

  comprobar(fichas.length === area.casos, `área ${area.numero}: se esperaban ${area.casos} fichas, hay ${fichas.length}`);

  for (const f of fichas) {
    comprobar(f.visible, `${area.numero}/${f.id}: la ficha no está visible`);
    comprobar(ESTADOS.includes(f.chip), `${area.numero}/${f.id}: estado no reconocido «${f.chip}»`);
    comprobar(!!f.categoria, `${area.numero}/${f.id}: falta la categoría visible`);

    const repo = f.enlaces.filter((e) => /^https:\/\/github\.com\/(Dev-HugoAguilar|HugoAguilarReyna)\//.test(e.href || ''));
    const demo = f.enlaces.filter((e) => (e.href || '').startsWith('dashboards/'));
    totalRepo += repo.length;
    totalDemo += demo.length;

    if (CON_REPO.includes(f.id)) {
      comprobar(repo.length === 1, `${f.id}: falta el enlace al repositorio`);
    } else {
      comprobar(repo.length === 0, `${f.id}: no debería enlazar a un repositorio todavía`);
    }
    if (CON_DEMO.includes(f.id)) {
      comprobar(demo.length === 1, `${f.id}: falta el enlace a la demo`);
    }
    for (const e of [...repo, ...demo]) {
      comprobar(e.target === '_blank', `${f.id}: el enlace «${e.texto}» no abre en pestaña nueva`);
      comprobar((e.rel || '').includes('noopener'), `${f.id}: el enlace «${e.texto}» no declara rel=noopener`);
    }

    if (PREVISTOS.includes(f.id)) {
      comprobar(f.previsto === true, `${f.id}: debería llevar la clase de roadmap`);
      comprobar(f.roadmap === 'Roadmap', `${f.id}: falta el distintivo de roadmap`);
      comprobar(Number(f.opacidadCover) < 1, `${f.id}: la portada de roadmap debería estar atenuada`);
    } else {
      comprobar(f.previsto !== true, `${f.id}: no debería atenuarse como roadmap`);
    }
  }

  /* Cada portada debe mostrar algo: una captura cargada o la escena del área. */
  const portadas = await pagina.$$eval('.project-card', (nodos) => nodos.map((li) => {
    const cover = li.querySelector('.cover');
    const img = cover?.querySelector('img');
    return {
      id: li.getAttribute('data-proyecto'),
      ok: !!((img && img.complete && img.naturalWidth > 0) || cover?.querySelector('svg'))
    };
  }));
  portadas.forEach((m) => comprobar(m.ok, `${area.numero}/${m.id}: la portada no muestra captura ni escena`));

  /* Captura de viewport sobre la lista: una captura fullPage coloca los
     elementos fijos a mitad de la imagen y no prueba lo que ve una persona. */
  await pagina.evaluate(() => {
    document.querySelector('.project-list')?.scrollIntoView({ block: 'start', behavior: 'instant' });
  });
  await pagina.waitForTimeout(450);
  await pagina.screenshot({ path: path.join(SALIDA, `area-${area.id}-1440.png`) });
}

comprobar(totalRepo === CON_REPO.length, `enlaces a repositorio: ${totalRepo} de ${CON_REPO.length}`);
comprobar(totalDemo === CON_DEMO.length, `enlaces a demo: ${totalDemo} de ${CON_DEMO.length}`);

/* ------------------------------------------- los enlaces no están tapados */
await pagina.goto(`${BASE}/#/area/ciencia-de-datos`, { waitUntil: 'networkidle' });
await pagina.waitForSelector('#project-link-retailops');
const clicable = await pagina.evaluate(() => {
  const enlace = document.querySelector('[data-proyecto="retailops"] .card-link');
  if (!enlace) return { encontrado: false };
  // Debe estar dentro del viewport: fuera de él, elementFromPoint devuelve null.
  enlace.scrollIntoView({ block: 'center', behavior: 'instant' });
  const caja = enlace.getBoundingClientRect();
  const encima = document.elementFromPoint(caja.left + caja.width / 2, caja.top + caja.height / 2);
  return {
    encontrado: true,
    esElEnlace: !!(encima && (encima === enlace || enlace.contains(encima))),
    encima: encima ? encima.tagName + '.' + encima.className : null
  };
});
comprobar(clicable.encontrado, 'no se encontró el enlace del proyecto retailops');
comprobar(clicable.esElEnlace === true, `la capa de la tarjeta tapa el enlace de la demo (encima: ${clicable.encima})`);

await pagina.screenshot({ path: path.join(SALIDA, 'enlaces-tarjeta-1440.png') });

/* La misma área en móvil: sin desborde y con los enlaces presentes. */
const movil = await navegador.newPage({ viewport: { width: 390, height: 900 } });
await movil.goto(`${BASE}/#/area/ciencia-de-datos`, { waitUntil: 'networkidle' });
await movil.waitForSelector('.project-list');
const desbordeArea = await movil.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
comprobar(desbordeArea <= 1, `área a 390 px con desborde horizontal de ${desbordeArea} px`);
const enlacesMovil = await movil.$$eval('.card-link', (nodos) => nodos.length);
comprobar(enlacesMovil >= 5, `área a 390 px: se esperaban al menos 5 enlaces, hay ${enlacesMovil}`);
await movil.evaluate(() => {
  document.querySelector('.project-list')?.scrollIntoView({ block: 'start', behavior: 'instant' });
});
await movil.waitForTimeout(400);
await movil.screenshot({ path: path.join(SALIDA, 'area-ciencia-de-datos-390.png') });
await movil.close();

/* --------------------------------------------------------------- cierre */
comprobar(errores.length === 0, `errores de consola: ${errores.join(' | ')}`);
await navegador.close();

console.log(`\n${ok} OK · ${fallos.length} fallos · capturas en evidencias/taxonomia/`);
process.exitCode = fallos.length ? 1 : 0;
