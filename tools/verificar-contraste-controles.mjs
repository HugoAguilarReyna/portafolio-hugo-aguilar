import {chromium} from '@playwright/test';
import fs from 'node:fs';
import assert from 'node:assert/strict';

const styles=['dist/style.css','dist/dashboards/atlas-vial/app.css','dist/dashboards/atlas-comercial/app.css','dist/dashboards/marketing-clientes/app.css'];
const browser=await chromium.launch();
const luminance=rgb=>rgb.slice(0,3).map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((v,x,i)=>v+x*[.2126,.7152,.0722][i],0);
const rgb=s=>s.match(/[\d.]+/g).map(Number);
let checked=0;
try {
 for(const width of [390,1440]) for(const order of [styles,[...styles].reverse()]) {
  const page=await browser.newPage({viewport:{width,height:900}});
  // Controles reales y sus clases: probar juntos los bundles que comparten nombres.
  await page.setContent('<main class="demo-host"><section class="at-app"><div class="at-segmentado" data-con-capsula><span class="at-seg-capsula" data-medida="si"></span><button class="at-seg is-activa">Escala común</button><button class="at-seg">Por métrica</button></div></section><section class="ac-app"><div class="at-segmentado" data-con-capsula><span class="at-seg-capsula" data-medida="si"></span><button class="at-seg is-activa">10 colonias</button><button class="at-seg">20 colonias</button></div></section></main>');
  for(const file of order) await page.addStyleTag({content:fs.readFileSync(file,'utf8')});
  for(const root of ['.at-app','.ac-app']) {
   const button=page.locator(root+' button.is-activa');
   for(const state of ['normal','hover','focus']) {
    if(state==='hover') await button.hover();
    if(state==='focus') await button.focus();
    const c=await button.evaluate(el=>{const s=getComputedStyle(el);return {text:s.color,background:s.backgroundColor};});
    const a=luminance(rgb(c.text)),b=luminance(rgb(c.background));
    const ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
    assert.ok(rgb(c.background)[3]!==0,'La superficie seleccionada debe ser explícita');
    assert.ok(ratio>=4.5,`${root} ${state} ${width}px: contraste ${ratio.toFixed(2)}:1`);
    checked++;
   }
  }
  await page.close();
 }
 console.log(`Contraste aprobado: ${checked} estados, móvil/escritorio y ambos órdenes de carga.`);
} finally {await browser.close();}
