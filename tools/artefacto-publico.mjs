import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

export const SECCIONES = ['coverage', 'humano', 'personas', 'salud', 'evolucion',
  'territorio', 'evidencia', 'archivo', 'respuesta', 'referencias', 'experimento'];

export function validarGaza(bytes, procedencia) {
  const html = bytes.toString('utf8');
  for (const id of SECCIONES) {
    assert.match(html, new RegExp(`id=["']${id}["']`), `falta la sección agregada ${id}`);
  }
  for (const marca of ['const DATA=', 'window.GRUPOS_TERRITORIO=', 'window.SITIOS_TERRITORIO=']) {
    assert.ok(html.includes(marca), `falta ${marca}`);
  }
  assert.doesNotMatch(html, /id\s*=\s*["']memoria["']|personas\.json|(?:const|let|var)\s+(?:MEMORIA\w*|people)\s*=|window\.MEMORIA\w*\s*=/i,
    'el artefacto público contiene una sección o un dataset nominal');
  // Umbral secundario. La estructura y el hash de procedencia son obligatorios.
  assert.ok(bytes.length < 6 * 1024 * 1024, 'se excedió el presupuesto de 6 MiB');
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  assert.equal(procedencia.tipo, 'agregados-sin-lista-nominal');
  assert.equal(procedencia.bytes, bytes.length, 'tamaño distinto al manifiesto');
  assert.equal(procedencia.sha256, sha256, 'el artefacto no coincide con el build verificado');
  return { bytes: bytes.length, sha256 };
}
