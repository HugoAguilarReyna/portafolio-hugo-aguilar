import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
const base=process.env.SITE_BASE || 'http://127.0.0.1:8000';
const browser=await chromium.launch();
try {
  for (const width of [390,1440]) {
    const page=await browser.newPage({viewport:{width,height:1000}});
    await page.goto(base);
    const cards=page.locator('#featured-projects article');
    await cards.first().waitFor();
    assert.equal(await cards.count(),3);
    assert.ok(await cards.nth(0).getByRole('link',{name:'Ver caso'}).getAttribute('href'));
    assert.ok(await cards.nth(1).getByRole('link',{name:'Código'}).getAttribute('href'));
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await cards.nth(2).getByRole('link',{name:'Ver caso'}).click();
    await page.waitForURL('**/#/area/ia-generativa/asistente-investigacion');
    assert.equal(await page.locator('.featured').isVisible(),false);
    assert.match(await page.locator('#project-view-title').innerText(),/Briefing con evidencia/);
    await page.close();
  }
  console.log('Tres casos destacados, enlaces y móvil verificados.');
} finally { await browser.close(); }
