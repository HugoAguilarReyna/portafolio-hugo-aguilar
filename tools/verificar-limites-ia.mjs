/**
 * Verificación del límite temporal de IA (HTTP 429 + `Retry-After`) en las
 * demos que consultan al modelo: Briefing Banxico, Copiloto NL-to-SQL y Data
 * Incident Commander.
 *
 *   node tools/verificar-limites-ia.mjs
 *
 * Levanta `dist/` en el puerto 8010 (el mismo que usa la API de desarrollo, de
 * modo que las demos apuntan al mismo origen) y responde las rutas
 * `/api/v1/...` con errores simulados: no llama a la API real ni gasta cuota.
 * Comprueba el mensaje en español, la espera legible, el bloqueo/cuenta
 * regresiva del botón y que no haya errores de JavaScript.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(RAIZ, 'dist');
const PUERTO = Number(process.env.PORT || 8123);
const BASE = `http://127.0.0.1:${PUERTO}`;
const API_FIJA = process.env.API_FIJA || 'http://127.0.0.1:8010';
const ESPERA_BRIEFING = 95;   // 1 min 35 s: espera corta, bloquea el botón
const ESPERA_COPILOTO = 300;  // 5 minutos: espera larga, respaldo local activo
const ESPERA_AGENTE = 45;

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2'
};

const servidor = http.createServer((req, res) => {
  const ruta = path.resolve(DIST, '.' + decodeURIComponent(new URL(req.url, BASE).pathname));
  if (!ruta.startsWith(DIST + path.sep) && ruta !== DIST) {
    res.writeHead(403).end();
    return;
  }
  const destino = fs.existsSync(ruta) && fs.statSync(ruta).isDirectory()
    ? path.join(ruta, 'index.html')
    : ruta;
  fs.readFile(destino, (error, datos) => {
    if (error) {
      res.writeHead(404).end();
      return;
    }
    res.setHeader('Content-Type', TIPOS[path.extname(destino)] || 'application/octet-stream');
    res.end(datos);
  });
});

await new Promise((resolve, reject) => {
  servidor.once('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`El puerto ${PUERTO} está ocupado; define PORT con otro libre.`);
    }
    reject(error);
  });
  servidor.listen(PUERTO, '127.0.0.1', resolve);
});

const ok = [];
const fallos = [];
const errores = [];
const comprobar = (condicion, mensaje) => (condicion ? ok : fallos).push(mensaje);

const { chromium } = await import('@playwright/test');
const navegador = await chromium.launch({ headless: true });
const paginas = [];

async function nuevaPagina() {
  const contexto = await navegador.newContext({ viewport: { width: 1440, height: 1000 } });
  const pagina = await contexto.newPage();
  pagina.on('pageerror', (error) => errores.push(`JS: ${error.message}`));
  pagina.on('console', (mensaje) => {
    const texto = mensaje.text();
    // Un 429 es la respuesta legítima que se está verificando: el navegador lo
    // registra como recurso fallido, no como error de la aplicación.
    if (mensaje.type() === 'error' && !/Failed to load resource.*429/.test(texto)) {
      errores.push(`consola: ${texto}`);
    }
  });
  paginas.push(contexto);
  return pagina;
}

function responder(route, estado, cuerpo, espera = null) {
  const cabeceras = {
    'Access-Control-Allow-Origin': '*',
    // `Retry-After` no es una cabecera CORS de lectura simple: la prueba sirve
    // la API simulada desde otro origen, así que hay que exponerla.
    'Access-Control-Expose-Headers': 'Retry-After'
  };
  if (espera !== null) cabeceras['Retry-After'] = String(espera);
  return route.fulfill({
    status: estado,
    headers: cabeceras,
    contentType: 'application/json; charset=utf-8',
    body: JSON.stringify(cuerpo)
  });
}

async function simularApi(pagina, esperaQuery) {
  await pagina.route('**/api/v1/**', async (route) => {
    if (route.request().method() === 'OPTIONS') {
      return route.fulfill({
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Accept'
        }
      });
    }
    const { pathname } = new URL(route.request().url());
    if (pathname.endsWith('/health')) {
      return responder(route, 200, {
        ok: true,
        atlas: { enabled: false, reachable: false },
        mongo: { target: 'local', reachable: true, chunks: 3 },
        atlas_chunks: 3,
        llm: { configured: true },
        observations: 21
      });
    }
    if (pathname.endsWith('/corpus')) return responder(route, 200, { sources: [], chunks: [] });
    if (pathname.endsWith('/runs')) return responder(route, 200, { run_id: 'run-limite-ia' });
    if (pathname.endsWith('/query')) {
      return responder(route, 429, {
        detail: 'Se agotó el presupuesto diario de IA; vuelve a medianoche UTC.'
      }, esperaQuery);
    }
    if (pathname.endsWith('/analysis')) {
      return responder(route, 429, {
        detail: 'El portafolio agotó sus consultas de hoy; el cupo se renueva a medianoche UTC.'
      }, ESPERA_AGENTE);
    }
    return responder(route, 404, { detail: 'Ruta simulada sin contrato en la verificación.' });
  });
}

/* 1 · Briefing Banxico: espera corta (bloquea el botón con cuenta regresiva). */
{
  const pagina = await nuevaPagina();
  await simularApi(pagina, ESPERA_BRIEFING);
  await pagina.goto(`${BASE}/dashboards/briefing-banxico/index.html`, { waitUntil: 'load' });
  await pagina.waitForFunction(
    () => !/Comprobando/i.test(document.querySelector('#api-status')?.textContent || ''),
    null,
    { timeout: 15_000 }
  );
  await pagina.fill('#question', '¿Cuál fue la inflación en 2024?');
  await pagina.click('#ask');
  await pagina.waitForFunction(
    () => /LÍMITE DE IA/.test(document.querySelector('#answer-status')?.textContent || ''),
    null,
    { timeout: 15_000 }
  );
  const estado = await pagina.textContent('#api-status');
  comprobar(/Límite temporal de IA alcanzado/.test(estado), 'briefing: anuncia el límite temporal');
  comprobar(/Reintenta en 1 min \d+ s/.test(estado), 'briefing: muestra la espera legible');
  const boton = await pagina.evaluate(() => ({
    disabled: document.querySelector('#ask').disabled,
    texto: document.querySelector('#ask').textContent
  }));
  comprobar(boton.disabled, 'briefing: deshabilita el botón durante la espera');
  comprobar(/Reintenta en 1 min \d+ s/.test(boton.texto), 'briefing: el botón muestra la cuenta regresiva');
  const contenido = await pagina.textContent('#answer-content');
  comprobar(/corpus local/.test(contenido), 'briefing: explica el respaldo del corpus local');
  await pagina.context().close();
}

/* 2 · Copiloto NL-to-SQL: espera larga (el respaldo local sigue disponible). */
{
  const pagina = await nuevaPagina();
  await simularApi(pagina, ESPERA_COPILOTO);
  await pagina.goto(`${BASE}/dashboards/copiloto-nl-sql/index.html`, { waitUntil: 'load' });
  await pagina.waitForFunction(
    () => !/Comprobando/i.test(document.querySelector('#api-status')?.textContent || ''),
    null,
    { timeout: 15_000 }
  );
  await pagina.fill('#question', '¿Cuál fue la inflación en 2024?');
  await pagina.click('#run');
  await pagina.waitForFunction(
    () => /límite temporal de IA/i.test(document.querySelector('#summary')?.textContent || ''),
    null,
    { timeout: 15_000 }
  );
  const resumen = await pagina.textContent('#summary');
  comprobar(/disponible en 5 minutos/.test(resumen), 'copiloto: muestra la espera en minutos');
  comprobar(/snapshot local/.test(resumen), 'copiloto: explica el respaldo local');
  comprobar(
    (await pagina.textContent('#mode')).trim() === 'LÍMITE DE IA · MODO LOCAL',
    'copiloto: marca el modo local en la píldora de estado'
  );
  const estado = await pagina.textContent('#api-status');
  comprobar(/Límite temporal de IA alcanzado/.test(estado), 'copiloto: anuncia el límite en el estado');
  const deshabilitado = await pagina.evaluate(() => document.querySelector('#run').disabled);
  comprobar(!deshabilitado, 'copiloto: con espera larga el botón local sigue disponible');
  await pagina.context().close();
}

/* 3 · Data Incident Commander: la consulta al modelo se bloquea con espera. */
{
  const pagina = await nuevaPagina();
  await simularApi(pagina, ESPERA_AGENTE);
  await pagina.goto(`${BASE}/dashboards/data-incident-commander/index.html`, { waitUntil: 'load' });
  await pagina.click('#run-button');
  await pagina.waitForFunction(
    () => !document.querySelector('#llm-button').disabled,
    null,
    { timeout: 20_000 }
  );
  await pagina.click('#llm-button');
  await pagina.waitForFunction(
    () => /Límite de IA/.test(document.querySelector('#toast')?.textContent || ''),
    null,
    { timeout: 15_000 }
  );
  const nota = await pagina.textContent('#llm-note');
  comprobar(/Límite de IA alcanzado/.test(nota), 'agente: explica el límite en la nota');
  comprobar(/Reintenta en 4[0-9] segundos/.test(nota), 'agente: indica cuánto esperar');
  const boton = await pagina.evaluate(() => ({
    disabled: document.querySelector('#llm-button').disabled,
    texto: document.querySelector('#llm-button').textContent
  }));
  comprobar(boton.disabled, 'agente: deshabilita la consulta durante la espera');
  comprobar(/Reintenta en 4[0-9] segundos/.test(boton.texto), 'agente: muestra la cuenta regresiva');
  await pagina.context().close();
}

await navegador.close();
await new Promise((resolve) => servidor.close(resolve));

for (const mensaje of errores) fallos.push(`error de JavaScript: ${mensaje}`);
console.log(`Comprobaciones correctas: ${ok.length}`);
for (const mensaje of ok) console.log(`  ✓ ${mensaje}`);
if (fallos.length) {
  console.error(`Fallos: ${fallos.length}`);
  for (const mensaje of fallos) console.error(`  ✗ ${mensaje}`);
}
process.exitCode = fallos.length ? 1 : 0;
