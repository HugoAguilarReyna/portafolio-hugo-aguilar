/**
 * Exporta el catálogo cerrado de identificadores que usa la telemetría de la API.
 *
 *   node tools/exportar-catalogo-ids.mjs
 *   node tools/exportar-catalogo-ids.mjs --salida ../portfolio-api/app/data/catalogo_ids.json
 *
 * La fuente única es `dist/content.js`, el mismo contenido que ve el visitante:
 * un id nuevo en una ficha entra al catálogo la próxima vez que se sincronice.
 * El JSON resultante se copia a `app/data/catalogo_ids.json` en portfolio-api.
 * La API rechaza (422) cualquier proyecto o área que no esté en este catálogo.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENIDO = path.join(RAIZ, 'dist', 'content.js');

const contexto = { window: {} };
vm.runInNewContext(fs.readFileSync(CONTENIDO, 'utf8'), contexto, { timeout: 1000 });
const datos = contexto.window.PORTAFOLIO;
if (!datos || !Array.isArray(datos.areas)) {
  throw new Error('dist/content.js no expone window.PORTAFOLIO.areas');
}

const PATRON = /^[a-zA-Z0-9-]{2,64}$/;
const areas = [];
const proyectos = [];
const proyectoArea = {};
for (const area of datos.areas) {
  if (!PATRON.test(area.id)) throw new Error(`Área con id inválido: ${area.id}`);
  areas.push(area.id);
  for (const proyecto of area.proyectos || []) {
    if (!PATRON.test(proyecto.id)) {
      throw new Error(`Proyecto con id inválido: ${proyecto.id}`);
    }
    if (proyectoArea[proyecto.id] && proyectoArea[proyecto.id] !== area.id) {
      throw new Error(`Proyecto duplicado en dos áreas: ${proyecto.id}`);
    }
    proyectos.push(proyecto.id);
    proyectoArea[proyecto.id] = area.id;
  }
}

proyectos.sort();
areas.sort();
const ordenado = {};
for (const proyecto of Object.keys(proyectoArea).sort()) {
  ordenado[proyecto] = proyectoArea[proyecto];
}

const salida = {
  generado_desde: 'dist/content.js',
  actualizado: datos.actualizado || null,
  areas,
  proyectos,
  proyecto_area: ordenado
};

const indice = process.argv.indexOf('--salida');
const destino = indice >= 0 ? process.argv[indice + 1] : null;
const texto = JSON.stringify(salida, null, 2) + '\n';
if (destino) {
  fs.writeFileSync(path.resolve(destino), texto);
  console.log(
    `Catálogo exportado: ${proyectos.length} proyectos y ${areas.length} áreas → ${destino}`
  );
} else {
  process.stdout.write(texto);
}
