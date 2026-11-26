/**
 * Prueba de navegador del botón `/agent` de Data Incident Commander.
 *
 * No llama a un proveedor real: intercepta `/api/v1/incident-commander/**` con
 * respuestas controladas. Comprueba que la llamada es explícita (no al cargar),
 * que el flujo exitoso pinta la recomendación y que 429/503 se comunican.
 *
 *   node tools/verificar-agent-ui.mjs
 */
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const RAIZ = path.resolve('dist');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' };
const servidor = http.createServer((req, res) => {
  const archivo = path.resolve(RAIZ, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  if (!archivo.startsWith(RAIZ + path.sep) && archivo !== RAIZ) { res.writeHead(403).end(); return; }
  const destino = fs.existsSync(archivo) && fs.statSync(archivo).isDirectory() ? path.join(archivo, 'index.html') : archivo;
  fs.readFile(destino, (error, data) => {
    if (error) { res.writeHead(404).end(); return; }
    res.setHeader('Content-Type', MIME[path.extname(destino)] || 'application/octet-stream');
    res.end(data);
  });
});
await new Promise((resolve) => servidor.listen(0, '127.0.0.1', resolve));
const BASE = `http://127.0.0.1:${servidor.address().port}`;
const PAGINA = BASE + '/dashboards/data-incident-commander/index.html';
const ok = [];
const fallos = [];
const comprobar = (condicion, mensaje) => {
  if (condicion) ok.push(mensaje);
  else fallos.push(mensaje);
};

const EXITO = {
  run_id: 'RUN-UI-1',
  modo: 'openai-tools',
  modelo: 'mock-ui-v1',
  recomendacion: {
    plan: 'quarantine',
    name: 'Cuarentena + recarga de fuente',
    allowed: true,
    forward_blocked: true,
  },
  justificacion: 'La validación y el linaje sostienen la cuarentena.',
  evidencia: ['Una validación falla en la copia temporal.'],
  riesgos: ['La fuente debe reconsultarse antes de promover.'],
  traza: [
    { paso: 1, tipo: 'herramienta', herramienta: 'validaciones' },
    { paso: 2, tipo: 'herramienta', herramienta: 'catalogo_planes' },
    { paso: 3, tipo: 'final', plan: 'quarantine' },
  ],
  pasos: 3,
  presupuesto_tokens: 23000,
  tokens_consumidos: 1234,
  solo_lectura: true,
  advisory_only: true,
  approved: false,
  executed: false,
  external_writes: 0,
};

async function prepararPagina(navegador, modo = 'exito') {
  const pagina = await navegador.newPage({ viewport: { width: 1440, height: 1100 } });
  let llamadasAgente = 0;
  const errores = [];
  pagina.on('pageerror', (error) => errores.push('JS: ' + error.message));
  pagina.on('console', (mensaje) => {
    if (mensaje.type() === 'error' && !/Failed to load resource: the server responded with a status of (429|503)/.test(mensaje.text())) errores.push('consola: ' + mensaje.text());
  });
  await pagina.route('**/api/v1/incident-commander/**', async (ruta) => {
    const peticion = ruta.request();
    const url = new URL(peticion.url());
    if (peticion.method() === 'POST' && url.pathname.endsWith('/runs')) {
      await ruta.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ run_id: 'RUN-UI-1' }),
      });
      return;
    }
    if (peticion.method() === 'POST' && url.pathname.endsWith('/agent')) {
      llamadasAgente += 1;
      if (modo === 'limite') {
        await ruta.fulfill({
          status: 429,
          headers: { 'Retry-After': '3', 'Content-Type': 'application/json' },
          body: JSON.stringify({ detail: 'Límite de evaluación alcanzado.' }),
        });
        return;
      }
      if (modo === 'sin-configurar') {
        await ruta.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'El agente no está configurado.' }),
        });
        return;
      }
      await ruta.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(EXITO),
      });
      return;
    }
    await ruta.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ detail: 'No encontrado' }),
    });
  });
  await pagina.goto(PAGINA, { waitUntil: 'load' });
  await pagina.waitForSelector('#agent-button');
  return { pagina, errores, llamadas: () => llamadasAgente };
}

async function iniciarRun(pagina) {
  await pagina.locator('#run-button').click();
  await pagina.waitForFunction(() => {
    const boton = document.querySelector('#agent-button');
    return boton && !boton.disabled;
  }, { timeout: 15000 });
}

const navegador = await chromium.launch();

try {
  {
    const { pagina, errores, llamadas } = await prepararPagina(navegador);
    comprobar(await pagina.locator('#agent-button').isDisabled(), 'el agente empieza deshabilitado');
    comprobar(await pagina.locator('#agent-result').isHidden(), 'no hay resultado antes de ejecutar');
    comprobar(llamadas() === 0, 'no se llama al agente al cargar');
    await iniciarRun(pagina);
    await pagina.locator('#agent-button').click();
    await pagina.waitForSelector('#agent-result:not([hidden])');
    comprobar(llamadas() === 1, 'una llamada explícita al endpoint /agent');
    comprobar((await pagina.locator('#agent-plan').innerText()).includes('Cuarentena'), 'pinta el plan recomendado');
    comprobar((await pagina.locator('#agent-meta').innerText()).includes('3 pasos'), 'pinta pasos y tokens');
    comprobar((await pagina.locator('#agent-disclaimer').innerText()).includes('consultiva'), 'declara la recomendación consultiva');
    comprobar((await pagina.locator('#agent-disclaimer').innerText()).includes('Escrituras externas: 0'), 'declara cero escrituras');
    comprobar(await pagina.locator('#agent-button').isDisabled(), 'bloquea una segunda ejecución accidental');
    comprobar(errores.length === 0, 'sin errores de consola en el flujo exitoso: ' + errores.join(' | '));
    await pagina.close();
  }

  {
    const { pagina, errores } = await prepararPagina(navegador, 'limite');
    await iniciarRun(pagina);
    await pagina.locator('#agent-button').click();
    await pagina.waitForFunction(() => /Límite de IA/.test(document.querySelector('#agent-note')?.textContent || ''));
    comprobar((await pagina.locator('#agent-note').innerText()).includes('Reintenta'), 'muestra el límite y el reintento');
    comprobar(await pagina.locator('#agent-button').isDisabled(), 'deshabilita el botón durante el límite');
    comprobar(errores.length === 0, 'sin errores de consola en 429: ' + errores.join(' | '));
    await pagina.close();
  }

  {
    const { pagina, errores } = await prepararPagina(navegador, 'sin-configurar');
    await iniciarRun(pagina);
    await pagina.locator('#agent-button').click();
    await pagina.waitForFunction(() => /no está configurado/.test(document.querySelector('#agent-note')?.textContent || ''));
    comprobar((await pagina.locator('#agent-note').innerText()).includes('no está configurado'), 'muestra el 503 de configuración');
    comprobar(errores.length === 0, 'sin errores de consola en 503: ' + errores.join(' | '));
    await pagina.close();
  }
} finally {
  await navegador.close();
  await new Promise((resolve) => servidor.close(resolve));
}

console.log(`OK: ${ok.length}`);
for (const mensaje of ok) console.log('  ✓ ' + mensaje);
if (fallos.length) {
  console.error(`FALLOS: ${fallos.length}`);
  for (const mensaje of fallos) console.error('  ✗ ' + mensaje);
  process.exitCode = 1;
}
