import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch();
try {
 for(const width of [390,1440]) {
  const page=await browser.newPage({viewport:{width,height:900}});
  await page.route('**/api/v1/briefing-banxico/**',r=>r.abort());
  await page.goto((process.env.SITE_BASE||'http://127.0.0.1:8000')+'/#/area/ia-generativa/asistente-investigacion');
  const iframe=page.locator('iframe[title="Briefing con evidencia · Banco de México"]');
  await iframe.waitFor();
  const frame=await (await iframe.elementHandle()).contentFrame();
  await frame.waitForSelector('html.embedded');
  assert.equal(await frame.locator('.brand-mark').count(),0);
  await frame.evaluate(()=>document.fonts.ready);
  // Esperar el ajuste después de cargar fuentes y contenido asíncrono.
  await page.waitForTimeout(1500);
  const bounds=await frame.evaluate(()=>({
   body:document.body.getBoundingClientRect().height,
   viewport:innerHeight,
   overflow:getComputedStyle(document.documentElement).overflowY,
   width:document.documentElement.scrollWidth,
   viewportWidth:innerWidth
  }));
  assert.ok(bounds.body<=bounds.viewport,`Contenido recortado: ${JSON.stringify(bounds)}`);
  assert.equal(bounds.overflow,'hidden');
  assert.ok(bounds.width<=bounds.viewportWidth+1,`Desborde horizontal: ${JSON.stringify(bounds)}`);
  console.log(`Banxico ${width}px: sin monograma ni scroll interno, contenido completo.`);
  await page.close();
 }
} finally {await browser.close();}
