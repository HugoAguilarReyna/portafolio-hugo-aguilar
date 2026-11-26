/** Genera el inventario desde las mismas fichas que ve el visitante.
 * node tools/generar-evidencia.mjs [--check]
 * Inventaría declaraciones y hashes; no certifica resultados de modelos.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'dist/content.js'), 'utf8'), ctx, {timeout:1000});
const data = ctx.window.PORTAFOLIO;
const rows = data.areas.flatMap(area => area.proyectos.map(p => {
  const file = p.demoUrl ? path.resolve(root, 'dist', p.demoUrl) : null;
  if (file && !file.startsWith(path.join(root, 'dist') + path.sep)) throw new Error('Demo fuera de dist');
  if (file && !fs.existsSync(file)) throw new Error(`Demo ausente: ${p.id}`);
  return {
    project_id:p.id, area:area.nombre, estado:p.estado, codigo_url:p.codigoUrl || '',
    demo_url:p.demoUrl || '', demo_modo:p.demo?.modo || (p.demoUrl ? 'url' : ''),
    demo_verificado:p.demo?.verificado || '',
    resultados_declarados:p.resultados || '',
    limites_declarados:p.limitaciones || '',
    demo_sha256:file ? createHash('sha256').update(fs.readFileSync(file)).digest('hex') : '',
  };
}));
const quote = x => '"' + String(x).replaceAll('"', '""') + '"';
const keys = Object.keys(rows[0]);
const csv = keys.join(',') + '\n' + rows.map(r => keys.map(k=>quote(r[k])).join(',')).join('\n')+'\n';
const json = JSON.stringify({
  actualizado:data.actualizado,
  alcance:'Inventario generado de fichas y hashes de demos. No reentrena modelos ni certifica resultados declarados.',
  proyectos:rows,
},null,2)+'\n';
let failed = false;
for (const [rel, content] of [['docs/MATRIZ_EVIDENCIA_PROYECTOS.csv',csv], ['docs/EVIDENCIA_PROYECTOS.json',json]]) {
  const file = path.join(root,rel);
  if (process.argv.includes('--check')) {
    if (!fs.existsSync(file) || fs.readFileSync(file,'utf8') !== content) {
      console.error(`${rel} desactualizado: ejecuta node tools/generar-evidencia.mjs`);
      failed = true;
    }
  } else fs.writeFileSync(file,content);
}
process.exitCode=failed ? 1:0;
if (!failed) console.log(`Inventario coherente: ${rows.length} fichas; fecha ${data.actualizado}.`);
