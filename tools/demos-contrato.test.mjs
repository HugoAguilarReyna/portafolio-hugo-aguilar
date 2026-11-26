/**
 * Contrato de demos de las fichas publicadas.
 *
 * No abre un navegador: comprueba que cada demo declarada tiene un artefacto
 * real y que las cinco demos montadas dentro de la ficha declaran su modo y
 * fecha de verificación. Las pruebas de navegador viven en
 * tools/verificar-*.mjs.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(RAIZ, 'dist', 'content.js'), 'utf8'), ctx, {
  timeout: 1000,
});
const proyectos = ctx.window.PORTAFOLIO.areas.flatMap((area) =>
  area.proyectos.map((proyecto) => ({ ...proyecto, area: area.id })),
);
const porId = new Map(proyectos.map((proyecto) => [proyecto.id, proyecto]));
const EMBEBIDAS = [
  'comparativo-bancario',
  'atlas-vial',
  'marketing-clientes',
  'pulso-comercial',
  'atlas-comercial',
];

test('catálogo de fichas y áreas', () => {
  assert.equal(ctx.window.PORTAFOLIO.areas.length, 5);
  assert.equal(proyectos.length, 19);
  assert.equal(new Set(proyectos.map((p) => p.id)).size, proyectos.length);
});

test('cada demo declarada tiene un artefacto real', () => {
  for (const proyecto of proyectos) {
    if (!proyecto.demoUrl) continue;
    const archivo = path.resolve(RAIZ, 'dist', proyecto.demoUrl);
    assert.ok(archivo.startsWith(path.join(RAIZ, 'dist') + path.sep), proyecto.id);
    assert.ok(fs.existsSync(archivo), `${proyecto.id}: falta ${proyecto.demoUrl}`);
  }
});

test('las cinco demos embebidas declaran modo ficha y verificación', () => {
  for (const id of EMBEBIDAS) {
    const proyecto = porId.get(id);
    assert.ok(proyecto, `falta ${id}`);
    assert.equal(proyecto.estado, 'publicado', id);
    assert.equal(proyecto.demoUrl, null, id);
    assert.equal(proyecto.demo?.modo, 'ficha', id);
    assert.match(proyecto.demo?.verificado || '', /^\d{4}-\d{2}-\d{2}$/, id);
    assert.ok(
      fs.existsSync(path.join(RAIZ, 'dist', 'projects', `${id}.js`)),
      `${id}: falta el módulo de montaje`,
    );
  }
});

test('ninguna ficha publicada queda sin demo declarada', () => {
  for (const proyecto of proyectos.filter((p) => p.estado === 'publicado')) {
    assert.ok(
      Boolean(proyecto.demoUrl) || proyecto.demo?.modo === 'ficha',
      `${proyecto.id}: publicada sin demo`,
    );
  }
});
