import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../dist/dashboards/copiloto-nl-sql/app.js',import.meta.url),'utf8')
  .replace(/\nstart\(\);\s*$/, '\n');
const context = vm.createContext({ URLSearchParams, location:{search:'?local=1',hostname:'localhost',port:'8000'} });
vm.runInContext(source,context,{timeout:1000});
const parse = q => vm.runInContext(`parseQuestion(${JSON.stringify(q)})`,context,{timeout:1000});
test('la demo local rechaza variantes de unidad, frecuencia y escritura',()=>{
  for (const q of ['PIB per cápita en 2020','PIB trimestral en 2020','Haz un backfill de todo el PIB sin aprobación','Borra los datos de desempleo', 'Inflación mensual en 2022']) {
    assert.throws(()=>parse(q));
  }
});
test('conserva las consultas anuales de lectura y parametriza el intento SQL',()=>{
  assert.equal(parse('PIB de México en 2020').start_year,2020);
  assert.equal(parse('¿En qué año fue mayor la inflación entre 2019 y 2025?').kind,'ranking');
  assert.equal(parse('PIB 2020; DROP TABLE observations; --').kind,'trend');
});
