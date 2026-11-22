/** Verificación del build de producción.
 *
 * Comprueba que el artefacto publicado resuelve la API en una ruta relativa
 * (`/api`), que no queda ninguna URL de API local en el código que gobierna el
 * runtime, y que la configuración local sigue funcionando cuando se fija
 * `window.PORTFOLIO_API_BASE`.
 *
 *   node tools/verificar-config-produccion.mjs
 */
import fs from 'node:fs';
import { validarGaza } from './artefacto-publico.mjs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = rel => fs.readFileSync(path.join(RAIZ, rel), 'utf8');

/* Archivos que gobiernan el runtime del sitio: aquí una URL de API local sí es
   un defecto. Los bundles compilados de los tableros (`dist/dashboards/`) son
   artefactos de terceros generados: su valor por omisión queda inalcanzable
   porque `dist/config.js` siempre inyecta `apiBase`; eso se comprueba en
   `tools/verificar-produccion.mjs` observando las peticiones reales. */
const ARCHIVOS_RUNTIME = [
  'dist/index.html',
  'dist/config.js',
  'dist/app.js',
  'dist/projects.js',
  'deploy/nginx.conf'
];

/* Configuración de despliegue: un healthcheck contra el loopback del propio contenedor es correcto; lo que no puede aparecer es el puerto de la API de desarrollo. */
const ARCHIVOS_DESPLIEGUE = ['deploy/docker-compose.yml', 'deploy/Dockerfile.sitio', 'deploy/nginx.conf', 'deploy/LEEME.md'];
const API_DE_DESARROLLO = /(?:127\.0\.0\.1|localhost):(?:8010|8017|8000\/(?!api\/v1\/health))/g;

const LOCAL = /(?:https?:\/\/)?(?:127\.0\.0\.1|localhost)(?::\d+)?/g;

/* Quita comentarios para no confundir documentación con comportamiento. */
function sinComentarios(fuente) {
  return fuente
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

function ejecutarConfig(window) {
  const contexto = {window};
  vm.createContext(contexto);
  vm.runInContext(leer('dist/config.js'), contexto, {timeout: 1000});
  return window;
}

const fallos = [];
const comprobaciones = [];
function comprobar(nombre, fn) {
  try {
    const detalle = fn();
    comprobaciones.push({comprobacion: nombre, estado: 'APROBADO', detalle: detalle ?? ''});
  } catch (error) {
    comprobaciones.push({comprobacion: nombre, estado: 'FALLIDO', detalle: String(error.message || error)});
    fallos.push(nombre);
  }
}

comprobar('dist/config.js existe y declara la base relativa', () => {
  const archivo = path.join(RAIZ, 'dist/config.js');
  assert.ok(fs.existsSync(archivo), 'falta dist/config.js');
  assert.ok(fs.statSync(archivo).size > 0, 'dist/config.js está vacío');
  const fuente = sinComentarios(leer('dist/config.js'));
  assert.match(fuente, /['"]\/api['"]/, 'la base por omisión no es /api');
  const locales = fuente.match(LOCAL) || [];
  assert.deepEqual(locales, [], 'dist/config.js contiene una URL local: ' + locales.join(', '));
  return 'base por omisión /api, sin URLs locales';
});

comprobar('el build de producción resuelve /api/v1 sin URL absoluta', () => {
  const window = ejecutarConfig({});
  const esperado = {
    PORTFOLIO_BANCA_API: '/api/v1/cnbv/banca-multiple',
    PORTFOLIO_ATLAS_API: '/api/v1/atlas-vial',
    PORTFOLIO_MARKETING_API: '/api/v1/marketing',
    PORTFOLIO_WALMEX_API: '/api/v1/walmex'
  };
  for (const [clave, valor] of Object.entries(esperado)) {
    assert.equal(window[clave], valor, `${clave} = ${window[clave]}`);
  }
  return Object.values(esperado).join(' ');
});

comprobar('la configuración local se conserva con PORTFOLIO_API_BASE', () => {
  const window = ejecutarConfig({PORTFOLIO_API_BASE: 'http://127.0.0.1:8010/api/'});
  assert.equal(window.PORTFOLIO_MARKETING_API, 'http://127.0.0.1:8010/api/v1/marketing');
  assert.equal(window.PORTFOLIO_API_BASE, 'http://127.0.0.1:8010/api');
  return 'la base inyectada gana y se normaliza la barra final';
});

comprobar('las variables ya definidas no se sobrescriben', () => {
  const window = {PORTFOLIO_ATLAS_API: 'https://ejemplo.test/v1/atlas-vial'};
  ejecutarConfig(window);
  assert.equal(window.PORTFOLIO_ATLAS_API, 'https://ejemplo.test/v1/atlas-vial');
  assert.equal(window.PORTFOLIO_BANCA_API, '/api/v1/cnbv/banca-multiple');
  return 'respeta las variables de la verificación de navegador';
});

comprobar('index.html carga config.js antes de los tableros', () => {
  const html = leer('dist/index.html');
  const posConfig = html.indexOf('src="config.js"');
  const posProyectos = html.indexOf('src="projects.js"');
  assert.ok(posConfig > -1, 'index.html no carga config.js');
  assert.ok(posProyectos > -1, 'index.html no carga projects.js');
  assert.ok(posConfig < posProyectos, 'config.js debe cargarse antes que projects.js');
  assert.ok(html.indexOf('src="config.js"') < html.indexOf('src="projects/comparativo-bancario.js"'),
    'config.js debe cargarse antes de los módulos de tablero');
  return 'orden de carga correcto';
});

comprobar('ningún archivo de runtime apunta a una API local', () => {
  const encontrados = [];
  for (const rel of ARCHIVOS_RUNTIME) {
    const fuente = sinComentarios(leer(rel));
    for (const coincidencia of fuente.match(LOCAL) || []) {
      encontrados.push(`${rel}: ${coincidencia}`);
    }
  }
  assert.deepEqual(encontrados, [], 'URLs locales en el runtime: ' + encontrados.join(' | '));
  return ARCHIVOS_RUNTIME.length + ' archivos revisados';
});

comprobar('la configuración de despliegue no usa la API de desarrollo', () => {
  /* Los healthchecks contra el loopback del propio contenedor son correctos
     (`http://127.0.0.1/healthz`, `:8000/api/v1/health/ready`): se ejecutan
     dentro del contenedor. Lo que no puede aparecer es la API de desarrollo. */
  const encontrados = [];
  for (const rel of ARCHIVOS_DESPLIEGUE) {
    const fuente = leer(rel);
    for (const coincidencia of fuente.match(API_DE_DESARROLLO) || []) {
      encontrados.push(`${rel}: ${coincidencia}`);
    }
  }
  assert.deepEqual(encontrados, [], 'API de desarrollo en el despliegue: ' + encontrados.join(' | '));
  return ARCHIVOS_DESPLIEGUE.length + ' archivos revisados';
});

comprobar('el manifiesto publica el artefacto de Gaza sin lista nominal', () => {
  const compose = leer('deploy/docker-compose.yml');
  const dockerfile = leer('deploy/Dockerfile.sitio');
  const nginx = leer('deploy/nginx.conf');
  assert.match(dockerfile, /COPY dist \/usr\/share\/nginx\/html/, 'la imagen no copia dist/');
  assert.match(nginx, /root \/usr\/share\/nginx\/html;/, 'nginx no sirve desde la raíz esperada');
  assert.doesNotMatch(compose, /dashboards\/gaza-observatorio/, 'el manifiesto publica un artefacto suelto de Gaza');
  const gaza = path.join(RAIZ, 'dist/dashboards/gaza-observatorio/index.html');
  const procedencia = JSON.parse(leer('dist/dashboards/gaza-observatorio/provenance.json'));
  const { bytes: tamano } = validarGaza(fs.readFileSync(gaza), procedencia);
  assert.doesNotMatch(leer('dist/content.js'), /la lista nominal completa en «Cada punto, una vida», con un punto por persona/,
    'la ficha presenta la lista nominal como parte del build publicado');
  return `Gaza publicada: ${tamano} B`;
});

const salida = {comprobaciones, fallos, ok: fallos.length === 0};
for (const c of comprobaciones) console.log(`${c.estado}: ${c.comprobacion}${c.detalle ? ' → ' + c.detalle : ''}`);
if (fallos.length) {
  console.error(`\nFallaron ${fallos.length} comprobaciones: ${fallos.join(', ')}`);
  process.exitCode = 1;
} else {
  console.log(`\nBuild de producción verificado (${comprobaciones.length} comprobaciones).`);
}

