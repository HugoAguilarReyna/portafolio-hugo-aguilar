/**
 * Verifica la ficha publicada de «Gaza · Vidas y territorio»: estado visible,
 * textos entregados tal cual en la tarjeta y en el detalle, secciones legibles,
 * sin desbordamientos en escritorio y móvil, y capturas de ambos.
 *
 *   node tools/verificar-ficha-gaza-publicada.mjs
 */
import { mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SALIDA = path.join(RAIZ, 'evidencias', 'gaza-observatorio', 'ficha-publicada');
const URL_AREA = 'http://127.0.0.1:8000/#/area/ciencia-de-datos';
const URL_FICHA = 'http://127.0.0.1:8000/#/area/ciencia-de-datos/gaza-observatorio';

// Las expectativas editoriales salen de la misma fuente pública de las fichas.
const { readFileSync } = await import('node:fs');
const vm = await import('node:vm');
const contextoEditorial = { window: {} };
vm.runInNewContext(readFileSync(path.join(RAIZ, 'dist/content.js'), 'utf8'), contextoEditorial);
const TEXTOS = contextoEditorial.window.PORTAFOLIO.areas
  .flatMap(area => area.proyectos).find(project => project.id === 'gaza-observatorio');

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
const ok = [];
const fallos = [];
const errores = [];
const comprobar = (c, m) => (c ? ok : fallos).push(m);
const navegador = await chromium.launch();

/* ------------------------------------------------- tarjeta en el área */
const pagina = await navegador.newPage({ viewport: { width: 1440, height: 1100 } });
pagina.on('pageerror', (e) => errores.push(`JS: ${e.message}`));
pagina.on('console', (m) => { if (m.type() === 'error') errores.push(`consola: ${m.text()}`); });
await pagina.goto(URL_AREA, { waitUntil: 'load' });
await pagina.waitForTimeout(1500);
const tarjeta = await pagina.evaluate(() => {
  const objetivo = [...document.querySelectorAll('article, li, a')].find((n) => /Gaza · Vidas y territorio/.test(n.textContent) && n.querySelector('.chip'));
  if (!objetivo) return null;
  const chip = objetivo.querySelector('.chip');
  return {
    estado: chip ? chip.textContent.trim() : '',
    estadoAttr: chip ? chip.getAttribute('data-estado') : '',
    titulo: (objetivo.querySelector('h2, h3, .card-title') || {}).textContent?.trim() || '',
    resumen: (objetivo.querySelector('.card-text') || {}).textContent?.trim() || '',
    imagen: (objetivo.querySelector('img') || {}).getAttribute?.('src') || '',
    enlace: (objetivo.closest('a') || {}).getAttribute?.('href') || objetivo.querySelector('a')?.getAttribute('href') || '',
    desborde: document.documentElement.scrollWidth - window.innerWidth,
  };
});
comprobar(!!tarjeta, 'la tarjeta de Gaza existe en Ciencia de datos');
comprobar(/Publicado/i.test(tarjeta?.estado || ''), `la tarjeta muestra el estado «${tarjeta?.estado}»`);
comprobar(tarjeta?.estadoAttr === 'publicado', `el estado del dato es publicado (${tarjeta?.estadoAttr})`);
comprobar(/Gaza · Vidas y territorio/.test(tarjeta?.titulo || ''), `nombre intacto: ${tarjeta?.titulo}`);
comprobar(/gaza-observatorio-resumen/.test(tarjeta?.imagen || ''), `se conserva la imagen (${tarjeta?.imagen})`);
comprobar(/gaza-observatorio/.test(tarjeta?.enlace || ''), `se conserva el destino (${tarjeta?.enlace})`);
await pagina.locator('article, li').filter({ hasText: 'Gaza · Vidas y territorio' }).first().screenshot({ path: path.join(SALIDA, '01-tarjeta-publicada.png'), animations: 'disabled' }).catch(() => pagina.screenshot({ path: path.join(SALIDA, '01-tarjeta-publicada.png') }));

/* ------------------------------------------------------- ficha / detalle */
await pagina.goto(URL_FICHA, { waitUntil: 'load' });
await pagina.waitForTimeout(3000);
const ficha = await pagina.evaluate(() => {
  const campos = {};
  document.querySelectorAll('.fields.project-fields > div, .project-fields dt').forEach((n) => {
    const t = n.textContent.trim();
    const m = t.match(/^([^:]{3,60}):/);
    if (m) campos[m[1].trim()] = t.slice(m[0].length).trim();
  });
  const secciones = [...document.querySelectorAll('.project-fields > div')].map((d) => ({
    titulo: (d.querySelector('dt, .field-label, h3') || {}).textContent?.trim() || '',
    largo: d.textContent.trim().length,
    alto: Math.round(d.getBoundingClientRect().height),
  }));
  return {
    titulo: document.querySelector('#project-view-title')?.textContent.trim() || '',
    subtitulo: document.querySelector('.view-subtitle')?.textContent.trim() || '',
    estado: document.querySelector('.view-chips .chip')?.textContent.trim() || '',
    campos,
    secciones,
    nota: document.querySelector('.ficha-note')?.textContent.trim() || '',
    texto: document.querySelector('#view-project')?.innerText || document.body.innerText,
    desborde: document.documentElement.scrollWidth - window.innerWidth,
    tecnologias: [...document.querySelectorAll('.tec-funcion, .tec-items')].map((t) => t.textContent.trim()),
  };
});
comprobar(ficha.titulo === 'Gaza · Vidas y territorio', `título del detalle intacto (${ficha.titulo})`);
comprobar(/Publicado/i.test(ficha.estado), `el detalle muestra el estado «${ficha.estado}»`);
comprobar(!ficha.nota, 'no queda la nota de «en desarrollo» en el detalle');
comprobar(ficha.desborde <= 0, `sin desbordamiento horizontal (${ficha.desborde})`);

const normalizar = (s) => String(s || '').replace(/\s+/g, ' ').trim();
const cuerpo = normalizar(ficha.texto);
for (const [clave, esperado] of Object.entries(TEXTOS)) {
  comprobar(cuerpo.includes(normalizar(esperado)), `el detalle reproduce el texto de «${clave}» (${esperado.length} caracteres)`);
}
for (const etiqueta of ['Problema', 'Destinatario', 'Mi contribución', 'Fuentes y datos', 'Método y decisiones técnicas', 'Resultados publicados', 'Limitaciones']) {
  comprobar(ficha.secciones.some((s) => s.titulo.toLowerCase().includes(etiqueta.toLowerCase())) || cuerpo.includes(etiqueta), `apartado «${etiqueta}» presente`);
}
comprobar(ficha.secciones.every((s) => s.alto > 0), `los apartados ocupan espacio (${ficha.secciones.length} bloques)`);
comprobar(['Datos y análisis','Interfaz','Verificación'].every((g) => ficha.tecnologias.some((t) => t.startsWith(g))) && ['MiniBatchKMeans','Fuentes abiertas','D3.js 7.9.0','Playwright'].every((t) => ficha.tecnologias.join(' ').includes(t)), `tecnologías por grupos presentes (${ficha.tecnologias.length} bloques)`);

await pagina.screenshot({ path: path.join(SALIDA, '02-ficha-escritorio.png'), animations: 'disabled' });
await pagina.locator('.project-fields').screenshot({ path: path.join(SALIDA, '03-ficha-apartados.png'), animations: 'disabled' }).catch(() => {});
await pagina.close();

/* ------------------------------------------------------------- móvil */
const movil = await navegador.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
movil.on('pageerror', (e) => errores.push(`móvil: ${e.message}`));
await movil.goto(URL_FICHA, { waitUntil: 'load' });
await movil.waitForTimeout(3000);
const movilDatos = await movil.evaluate(() => ({
  estado: document.querySelector('.view-chips .chip')?.textContent.trim() || '',
  desborde: document.documentElement.scrollWidth - window.innerWidth,
  titulo: document.querySelector('#project-view-title')?.textContent.trim() || '',
  texto: (document.querySelector('#view-project')?.innerText || '').length,
}));
comprobar(/Publicado/i.test(movilDatos.estado), `móvil: estado «${movilDatos.estado}»`);
comprobar(movilDatos.desborde <= 0, `móvil: sin desbordamiento horizontal (${movilDatos.desborde})`);
comprobar(movilDatos.texto > 3000, `móvil: el detalle conserva todo el texto (${movilDatos.texto} caracteres)`);
await movil.screenshot({ path: path.join(SALIDA, '04-ficha-movil.png'), animations: 'disabled' });
await movil.close();

await navegador.close();
console.log('\n' + ok.map((m) => '  ✓ ' + m).join('\n'));
if (fallos.length) console.log('\nFALLOS:\n' + fallos.map((m) => '  ✗ ' + m).join('\n'));
console.log('\nerrores JS:', errores.length ? errores : 'ninguno');
console.log(`\n${ok.length} comprobaciones correctas, ${fallos.length} fallos`);
process.exitCode = fallos.length || errores.length ? 1 : 0;

