import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { validarGaza, SECCIONES } from './artefacto-publico.mjs';

const agregado = SECCIONES.map(id => `<section id="${id}"></section>`).join('')
  + '<script>const DATA={};window.GRUPOS_TERRITORIO={};window.SITIOS_TERRITORIO={};</script>';
function fixture(html) {
  const bytes = Buffer.from(html);
  return [bytes, { tipo: 'agregados-sin-lista-nominal', bytes: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex') }];
}
test('acepta las secciones agregadas y su hash de procedencia', () => {
  assert.ok(validarGaza(...fixture(agregado)).sha256);
});
test('rechaza una lista nominal pequeña aunque no supere el umbral de tamaño', () => {
  for (const extra of ['<section id="memoria"></section>', '<script>const MEMORIA=[];</script>', '<script>const people = [];</script>', 'personas.json']) {
    assert.throws(() => validarGaza(...fixture(agregado + extra)), /nominal/);
  }
});
test('rechaza un documento truncado y un hash ajeno', () => {
  assert.throws(() => validarGaza(...fixture(agregado.replace('id="coverage"', 'id="otro"'))), /coverage/);
  const [bytes, manifest] = fixture(agregado);
  assert.throws(() => validarGaza(bytes, { ...manifest, sha256: '0'.repeat(64) }), /build verificado/);
});
