/** Comprobación de comportamiento del build de producción.
 *
 * Sirve `dist/` en un puerto efímero, abre las cuatro fichas conectadas SIN
 * inyectar ninguna variable y observa a dónde van las peticiones de la API:
 *
 *   * ninguna petición sale hacia una API local (127.0.0.1:8010 y similares);
 *   * todas las peticiones `/api/v1/...` van al mismo origen que sirve el sitio
 *     (la ruta relativa `/api` que resuelve `dist/config.js`);
 *   * las cuatro fichas se montan igual que en producción.
 *
 * La API no está detrás del servidor de prueba: las peticiones responden 404.
 * Eso es lo esperado y no es un fallo: lo que se verifica es el destino.
 *
 *   node tools/verificar-produccion.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(RAIZ, 'dist');
const FICHAS = [
  ['comparativo-bancario', 'dashboards'],
  ['atlas-vial', 'dashboards'],
  ['marketing-clientes', 'dashboards'],
  ['pulso-comercial', 'dashboards'],
  ['atlas-comercial', 'ciencia-de-datos']
];

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.csv': 'text/csv; charset=utf-8'
};

/* Servidor estático mínimo: no hay proxy `/api`, y eso es deliberado. Con
   `SITE_BASE` se apunta a un sitio ya servido (por ejemplo el stack de
   `deploy/docker-compose.yml`) y no se levanta nada. */
let servidor = null;
let ORIGEN;

if (process.env.SITE_BASE) {
  ORIGEN = process.env.SITE_BASE.replace(/\/+$/, '');
} else {
  servidor = http.createServer((peticion, respuesta) => {
    const ruta = decodeURIComponent(new URL(peticion.url, 'http://x').pathname);
    const archivo = path.join(DIST, ruta === '/' ? 'index.html' : ruta);
    if (!archivo.startsWith(DIST)) {
      respuesta.writeHead(403).end('prohibido');
      return;
    }
    fs.readFile(archivo, (error, datos) => {
      if (error) {
        respuesta.writeHead(404, {'content-type': 'text/plain; charset=utf-8'}).end('no encontrado');
        return;
      }
      respuesta.writeHead(200, {'content-type': TIPOS[path.extname(archivo)] || 'application/octet-stream'}).end(datos);
    });
  });
  await new Promise(resolver => servidor.listen(0, '127.0.0.1', resolver));
  ORIGEN = `http://127.0.0.1:${servidor.address().port}`;
}

const {chromium} = await import('@playwright/test');
const navegador = await chromium.launch({headless: true});
const resultados = [];
const fallos = [];

try {
  for (const [id, area] of FICHAS) {
    const contexto = await navegador.newContext({viewport: {width: 1440, height: 900}});
    const pagina = await contexto.newPage();
    const peticiones = [];
    const erroresConsola = [];
    pagina.on('request', peticion => {
      const url = peticion.url();
      if (/\/api\/v1\//.test(url)) peticiones.push({url, origen: new URL(url).origin});
    });
    pagina.on('pageerror', error => erroresConsola.push(error.message));

    await pagina.goto(`${ORIGEN}/#/area/${area}/${id}`, {waitUntil: 'domcontentloaded'});
    await pagina.waitForSelector('#project-view-title', {timeout: 15000});
    /* Margen para que el módulo del tablero se cargue y dispare su consulta. */
    await pagina.waitForTimeout(2500);

    const apiBase = await pagina.evaluate(() => ({
      base: window.PORTFOLIO_API_BASE,
      banca: window.PORTFOLIO_BANCA_API,
      atlas: window.PORTFOLIO_ATLAS_API,
      marketing: window.PORTFOLIO_MARKETING_API,
      walmex: window.PORTFOLIO_WALMEX_API,
      comercial: window.PORTFOLIO_COMERCIAL_API,
      origen: location.origin
    }));

    const registro = {
      ficha: id,
      origen: apiBase.origen,
      base_resuelta: apiBase.base,
      extremos: {
        banca: apiBase.banca,
        atlas: apiBase.atlas,
        marketing: apiBase.marketing,
        walmex: apiBase.walmex,
        comercial: apiBase.comercial
      },
      peticiones_api: peticiones.slice(0, 10),
      errores_consola: erroresConsola.slice(0, 5)
    };

    try {
      assert.equal(apiBase.base, '/api', `la base resuelta es ${apiBase.base}`);
      for (const [clave, valor] of Object.entries(registro.extremos)) {
        assert.ok(valor && valor.startsWith('/api/v1/'), `${clave} no es relativa: ${valor}`);
      }
      const fueraDeOrigen = peticiones.filter(p => p.origen !== apiBase.origen);
      assert.deepEqual(
        fueraDeOrigen,
        [],
        'peticiones de API fuera del origen del sitio: ' + fueraDeOrigen.map(p => p.url).join(', ')
      );
      const locales = peticiones.filter(p => /(?:127\.0\.0\.1|localhost):8010/.test(p.url));
      assert.deepEqual(locales, [], 'peticiones a la API local: ' + locales.map(p => p.url).join(', '));
      resultados.push({...registro, estado: 'APROBADO'});
      console.log(`APROBADO: ${id} · base ${apiBase.base} · ${peticiones.length} peticiones /api/v1 en el origen del sitio`);
    } catch (error) {
      resultados.push({...registro, estado: 'FALLIDO', motivo: String(error.message || error)});
      fallos.push(id);
      console.log(`FALLIDO: ${id} · ${error.message}`);
    } finally {
      await contexto.close();
    }
  }
} finally {
  await navegador.close();
  if (servidor) servidor.close();
}

const informe = {
  version: '1.0.0',
  origen_prueba: ORIGEN,
  fecha: new Date().toISOString(),
  fichas: resultados,
  fallos,
  ok: fallos.length === 0
};
const destino = path.resolve(process.env.VERIFICATION_OUTPUT || path.join(RAIZ, 'artifacts/verificacion-produccion.json'));
fs.mkdirSync(path.dirname(destino), {recursive: true});
fs.writeFileSync(destino, JSON.stringify(informe, null, 2));
console.log(JSON.stringify({output: destino, fichas: resultados.length, fallos}));
if (fallos.length) process.exitCode = 1;
