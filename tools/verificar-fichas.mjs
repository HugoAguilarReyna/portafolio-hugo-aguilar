/** Browser verification v4.1. Default: deterministic, test-only empty/error API.
 * npm ci && npx playwright install chromium; npm run serve; npm run verificar
 * --piloto: one project. --api-real: adds an isolated real-API phase. No text classifiers.
 *
 * La batería se ejecuta en dos fases independientes:
 *
 *   1. `determinista` — 96 casos con la API simulada (vacía, error de red y
 *      reintento). Es la única fase que corre en CI sin infraestructura.
 *   2. `real` — 8 casos con `--api-real`, en un navegador recién lanzado, con su
 *      propio contexto por caso. Se separa de la fase anterior porque en una
 *      corrida conjunta los casos reales agotaban su espera por contención
 *      (96 contextos previos) y no por el componente.
 *
 * Cada caso registra las peticiones a `/api/v1/...` con URL, origen, estado HTTP
 * y la cabecera CORS efectiva cuando el navegador la expone.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {emptyApi,fixturePaths} from './qa/empty-api.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const BASE=process.env.SITE_BASE||'http://127.0.0.1:8000', API=process.env.API_BASE||'http://127.0.0.1:8010';
const OUTPUT=path.resolve(process.env.VERIFICATION_OUTPUT||path.join(ROOT,'artifacts/verificacion-fichas.json'));
const PILOT=process.argv.includes('--piloto'), REAL=process.argv.includes('--api-real');
const VPS={escritorio:{width:1440,height:900},movil:{width:390,height:844}};
const IDS=['comparativo-bancario','atlas-vial','marketing-clientes','pulso-comercial'];
const FIELDS={problema:'Problema',destinatario:'Destinatario',contribucion:'Mi contribución',fuentes:'Fuentes y datos',metodo:'Método y decisiones técnicas',resultados:'Resultados publicados',limitaciones:'Limitaciones'};
const norm=v=>String(v??'').replace(/\u00a0/g,' ').replace(/\s+/g,' ').trim();
const runId=crypto.randomUUID(), start=Date.now(), rows=[], plan=[], contexts=new Set();
let browser,fatal=null,git={},projects=[],currentPage=null,currentInfo=null,currentSnapshot=null,realPreflight=null;
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const routeOf=p=>`#/area/${p.area}/${p.id}`;
function add(fase,p,vp,scenario,run){plan.push({fase,p,vp,scenario,run});}
async function launch(){const {chromium}=await import('@playwright/test');browser=await chromium.launch({headless:true});}
async function open(vp,initial='empty'){
 const ctx=await browser.newContext({viewport:VPS[vp]});contexts.add(ctx);let mode=initial;
 const page=await ctx.newPage(), errors=[], network=[], missing=[], requests=[]; currentPage=page; currentInfo={errors,network,requests};
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')network.push({type:'console',text:m.text()});});
 page.on('requestfailed',r=>network.push({type:'requestfailed',url:r.url(),reason:r.failure()?.errorText}));
 page.on('response',async r=>{
  const url=r.url(); if(!/\/api\/v1\//.test(url))return;
  let headers={}; try{headers=r.headers();}catch(_e){headers={};}
  requests.push({url,origin:new URL(url).origin,status:r.status(),cors:headers['access-control-allow-origin']??null});
 });
 await ctx.addInitScript(api=>{
  window.PORTFOLIO_BANCA_API=window.PORTAFOLIO_BANCA_API=api+'/api/v1/cnbv/banca-multiple';
  window.PORTFOLIO_ATLAS_API=api+'/api/v1/atlas-vial';
  window.PORTFOLIO_MARKETING_API=api+'/api/v1/marketing';
  window.PORTFOLIO_WALMEX_API=api+'/api/v1/walmex';
 },API);
 /* `DESBORDE_CONTROLADO=1` fuerza 15 px de desbordamiento para comprobar que un
    fallo de desbordamiento sale con el nodo responsable en el diagnóstico. */
 if(process.env.DESBORDE_CONTROLADO) await ctx.addInitScript(()=>{
  document.addEventListener('DOMContentLoaded',()=>{
   const estilo=document.createElement('style');
   estilo.textContent='.wrap{min-width:calc(100vw + 15px)}';
   document.head.appendChild(estilo);
  });
 });
 await ctx.route('**/api/v1/**',async route=>{
  if(mode==='real')return route.continue();
  if(mode==='error')return route.abort('failed');
  const fixture=emptyApi(route.request().url());
  if(fixture!==null)return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(fixture)});
  missing.push(new URL(route.request().url()).pathname);
  return route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({detail:'API no disponible en este escenario de prueba.'})});
 });
 return {page,errors,network,missing,requests,mode:value=>{mode=value;},close:async()=>{await ctx.close();contexts.delete(ctx);}};
}
async function editorial(page,p){
 const [title,...subtitle]=p.titulo.split(/\s+—\s+/);
 await page.waitForFunction(value=>document.querySelector('#project-view-title')?.textContent.trim()===value,title,{timeout:12000});
 assert.equal(norm(await page.locator('#project-view-title').innerText()),norm(title));
 assert.equal(norm(await page.locator('.view-subtitle').count() ? await page.locator('.view-subtitle').innerText() : ''),norm(subtitle.join(' — ')));
 const actual=await page.evaluate(()=>{
  const de=document.documentElement,ancho=de.clientWidth,desbordes=[];
  /* Inventario de desbordes por elemento: se toma antes de afirmar nada, para
     que un fallo por desbordamiento siempre traiga el nodo responsable. */
  for(const el of document.querySelectorAll('body *')){
   const r=el.getBoundingClientRect(); if(r.width<=0)continue;
   const propio=el.scrollWidth-el.clientWidth;
   if(Math.round(r.right)>ancho+1||propio>1)desbordes.push({
    tag:el.tagName, clase:String(el.className||'').slice(0,60), id:el.id||'',
    ancho:Math.round(r.width), derecha:Math.round(r.right), exceso:Math.round(r.right-ancho),
    exceso_contenido:propio, font:getComputedStyle(el).fontFamily.slice(0,60),
    texto:String(el.textContent||'').trim().slice(0,60)
   });
  }
  /* Los apartados pueden ir en un <details> (fichas con método plegable): el
     título vive en `.plegable-titulo` y el texto en `.plegable-cuerpo`, así que
     se recogen aparte para comprobar igual el contenido. */
  const plegables=[...document.querySelectorAll('.field--plegable')].map(el=>[
    el.querySelector('.plegable-titulo')?.textContent.trim()??'',
    el.querySelector('.plegable-cuerpo')?.textContent??''
  ]);
  return{url:location.href,hash:location.hash,fields:[...document.querySelectorAll('dt')].map(dt=>[dt.textContent.trim(),dt.nextElementSibling?.textContent??'']).concat(plegables),host:!!document.querySelector('[data-testid="hallazgos-host"]'),viewport:{ancho_visible:ancho,innerWidth:window.innerWidth,scrollWidth:de.scrollWidth},overflow:de.scrollWidth-ancho,desbordes};
 });
 currentSnapshot=actual;
 assert.equal(actual.hash,routeOf(p),'Ruta incorrecta');
 const fields=Object.fromEntries(actual.fields.map(([k,v])=>[k,norm(v)]));
 for(const[key,label]of Object.entries(FIELDS)){assert.ok(Object.hasOwn(fields,label),`Falta ${label}`);assert.equal(fields[label],norm(p[key]),`Texto diferente: ${label}`);}
 assert.ok(fields.Tecnologías?.length,'Faltan tecnologías');
 assert.equal(actual.host,IDS.includes(p.id),'Host incorrecto');
 assert.ok(actual.overflow<=1,`Desbordamiento: ${actual.overflow}px`);
}
async function state(page,expected){
 await page.waitForFunction(value=>{const h=document.querySelector('[data-testid="hallazgos-host"]');const n=h?.querySelector('[data-state]');return n?.getAttribute('data-state')===value&&n.textContent.trim().length>0;},expected,{timeout:20000});
 return page.locator('[data-testid="hallazgos-host"]').innerText();
}
async function diagnose(){
 /* Parte del inventario tomado en el momento de la medición: cuando el caso ya
    cerró su contexto, el estado en vivo no está disponible pero el desborde
    medido sí. */
 const base=currentSnapshot?{url:currentSnapshot.url,viewport:currentSnapshot.viewport,overflow:currentSnapshot.overflow,desbordes:currentSnapshot.desbordes}:{};
 const extra={errors:(currentInfo?.errors||[]).slice(0,8),network:(currentInfo?.network||[]).slice(0,12),requests:(currentInfo?.requests||[]).slice(0,20),api:API};
 try{
  if(!currentPage)return{...base,...extra,error:'sin pagina'};
  const page=currentPage;
  const d=await page.evaluate(()=>{
   const hosts=[...document.querySelectorAll('[data-testid="hallazgos-host"]')];
   const h=hosts[0];
   const st=h?h.querySelector('[data-state]'):null;
   return{
    url:location.href, origin:location.origin,
    hosts:hosts.length,
    dataState:st?st.getAttribute('data-state'):(h?'missing':'sin-host'),
    montado:!!document.querySelector('#project-view-title'),
    texto:(h?h.innerText:'').slice(0,300),
    html:(h?h.innerHTML:'').slice(0,600),
    apiBase:{banca:window.PORTFOLIO_BANCA_API||null,atlas:window.PORTFOLIO_ATLAS_API||null,marketing:window.PORTFOLIO_MARKETING_API||null,walmex:window.PORTFOLIO_WALMEX_API||null}
   };
  });
  return{...base,...d,...extra};
 }catch(e){return{...base,...extra,error:'estado en vivo no disponible: '+String(e.message||e)};}
}
async function runPhase(fase){
 const items=plan.filter(x=>x.fase===fase);
 if(!items.length)return;
 await launch();
 try{
  for(const test of items){
   const began=Date.now();
   let evidence=null;
   try{
    currentInfo=null;
    evidence=await test.run();
    rows.push({fase,project_id:test.p.id,viewport:test.vp,escenario:test.scenario,estado:'APROBADO',duration_ms:Date.now()-began,evidence});
   }catch(e){
    let _d=null;try{_d=await diagnose();}catch(_e){_d={error:'diagnostico fallido'};}
    rows.push({fase,project_id:test.p.id,viewport:test.vp,escenario:test.scenario,estado:'FALLIDO',duration_ms:Date.now()-began,error:String(e.stack||e),diagnostico:_d,evidence});
    console.log('DIAGNOSTICO '+JSON.stringify(_d));
   }
   console.log(`${rows.at(-1).estado}: ${test.p.id} ${test.vp} ${test.scenario} (${fase})`);
  }
 }finally{
  for(const ctx of [...contexts])await ctx.close().catch(()=>{});
  if(browser)await browser.close().catch(()=>{});
  browser=null;contexts.clear();
 }
}
async function preflightCors(){
 /* La fase real pide datos al navegador: si el origen del sitio no está en
    ALLOWED_ORIGINS de la API, el navegador bloquea la respuesta y el caso
    acabaría en un timeout de 20 s que no describe la causa. */
 const origen=BASE;
 try{
  const r=await fetch(API+'/api/v1/health/live',{headers:{Origin:origen},signal:AbortSignal.timeout(8000)});
  const permitido=r.headers.get('access-control-allow-origin');
  const mismoOrigen=new URL(origen).origin===new URL(API).origin;
  return{origen,estado:r.status,allow_origin:permitido,bloqueado:!permitido&&!mismoOrigen,motivo:permitido||mismoOrigen?null:`el origen ${origen} no está en ALLOWED_ORIGINS de la API (${API})`};
 }catch(e){
  return{origen,error:String(e.message||e),bloqueado:true,motivo:`la API no respondió en ${API}: ${String(e.message||e)}`};
 }
}
/* Estado del árbol de trabajo. En este repositorio hay archivos versionados con
   fin de línea CRLF: al hacer checkout en Linux con `* text=auto eol=lf` git los
   reporta como modificados aunque el contenido sea idéntico. Se separan los
   cambios reales de los que solo difieren en fin de línea para que `dirty` no
   señale un árbol sucio donde no lo está. */
function estadoGit(){
 const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:ROOT,encoding:'utf8'}).trim();
 const crudo=execFileSync('git',['status','--porcelain'],{cwd:ROOT,encoding:'utf8'}).trim();
 if(!crudo)return{sha,dirty:false,cambios_reales:0,cambios_solo_fin_de_linea:0,archivos:[]};
 const rutas=crudo.split(/\r?\n/).map(linea=>linea.slice(3).trim()).filter(Boolean);
 const reales=[];let soloEol=0;
 for(const ruta of rutas){
  let diferencia='';
  try{diferencia=execFileSync('git',['diff','--ignore-cr-at-eol','--numstat','--',ruta],{cwd:ROOT,encoding:'utf8'}).trim();}catch(_e){diferencia='?';}
  if(diferencia==='')soloEol+=1;else reales.push(ruta);
 }
 return{sha,dirty:reales.length>0,cambios_reales:reales.length,cambios_solo_fin_de_linea:soloEol,archivos:reales.slice(0,20)};
}
try{
 git=estadoGit();
 const c={window:{}};vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(ROOT,'dist/content.js'),'utf8'),c,{timeout:1000});
 projects=c.window.PORTAFOLIO.areas.flatMap(a=>a.proyectos.map(p=>({...p,area:a.id})));
 assert.equal(projects.length,20,'Registro incompleto');
 if(PILOT)projects=[projects.find(p=>p.id==='comparativo-bancario')];
 for(const p of projects)for(const vp of Object.keys(VPS)){
  add('determinista',p,vp,'entrada-directa',async()=>{const t=await open(vp);try{await t.page.goto(BASE+'/'+routeOf(p),{waitUntil:'domcontentloaded'});await editorial(t.page,p);assert.deepEqual(t.errors,[],'Excepción del aplicativo');return{api:'simulada-vacia-o-no-disponible',network:t.network,requests:t.requests,requestsWithoutFixture:t.missing};}finally{await t.close();}});
  add('determinista',p,vp,'spa-clic-atras-adelante',async()=>{const t=await open(vp);try{
   const area=`#/area/${p.area}`;await t.page.goto(BASE+'/'+area,{waitUntil:'domcontentloaded'});
   await t.page.locator(`[data-proyecto="${p.id}"] .card-hit`).click();await editorial(t.page,p);
   await t.page.goBack();await t.page.waitForFunction(h=>location.hash===h&&!!document.querySelector('.project-card'),area);
   await t.page.goForward();await editorial(t.page,p);assert.deepEqual(t.errors,[],'Excepción al navegar');return{api:'simulada-vacia-o-no-disponible',network:t.network,requests:t.requests};
  }finally{await t.close();}});
 }
 for(const p of projects.filter(p=>IDS.includes(p.id)))for(const vp of Object.keys(VPS)){
  for(const scenario of ['error','empty','retry-empty'])add('determinista',p,vp,scenario,async()=>{const t=await open(vp,scenario==='empty'?'empty':'error');try{
   await t.page.goto(BASE+'/'+routeOf(p),{waitUntil:'domcontentloaded'});
   if(scenario==='retry-empty'){await state(t.page,'error');t.mode('empty');await t.page.locator('[data-testid="hallazgos-host"]').getByRole('button',{name:'Reintentar',exact:true}).click();}
   const expected=scenario==='error'?'error':'empty',text=await state(t.page,expected);
   assert.ok(!/NaN|Infinity|undefined/.test(text),'Resultado inválido');assert.deepEqual(t.errors,[],'Excepción del aplicativo');assert.deepEqual(t.missing,[],'Endpoint sin fixture explícita');
   return{expected,observed:expected,text,api:'simulada',network:t.network,requests:t.requests};
  }finally{await t.close();}});
  if(REAL)add('real',p,vp,'ready-api-real',async()=>{const t=await open(vp,'real');try{await t.page.goto(BASE+'/'+routeOf(p),{waitUntil:'domcontentloaded'});const text=await state(t.page,'ready');assert.deepEqual(t.errors,[]);return{api:'real',text,network:t.network,requests:t.requests,origin:t.page.url().split('#')[0]};}finally{await t.close();}});
 }
 if(process.argv.includes('--fallo-controlado'))throw new Error('Fallo controlado: prueba de persistencia del reporte');
 const _p=process.env.PROYECTO,_v=process.env.VIEWPORT,_s=process.env.ESCENARIO,_f=process.env.FASE;
 if(_p||_v||_s||_f){const sel=plan.filter(x=>(!_p||x.p.id===_p)&&(!_v||x.vp===_v)&&(!_s||x.scenario===_s)&&(!_f||x.fase===_f));plan.length=0;plan.push(...sel);}
 await runPhase('determinista');
 if(REAL&&plan.some(x=>x.fase==='real')){
  const pre=await preflightCors();realPreflight=pre;
  if(pre.bloqueado)console.error(`FASE REAL BLOQUEADA: ${pre.motivo}`);
  else await runPhase('real');
 }
}catch(e){fatal=String(e.stack||e);}
finally{
 for(const ctx of contexts)await ctx.close().catch(()=>{});if(browser)await browser.close().catch(()=>{});
 const resumen=fase=>rows.filter(r=>r.fase===fase).reduce((s,r)=>({...s,[r.estado]:(s[r.estado]||0)+1}),{});
 const summary=rows.reduce((s,r)=>({...s,[r.estado]:(s[r.estado]||0)+1}),{}),missing=plan.length-rows.length;
 const report={run_id:runId,version:'4.1.0',site:BASE,api:API,git,date:new Date().toISOString(),duration_ms:Date.now()-start,status:fatal?'ABORTADO':'COMPLETADO',error_fatal:fatal,expected:plan.length,executed:rows.length,missing,phases:plan.reduce((s,x)=>({...s,[x.fase]:(s[x.fase]||0)+1}),{}),summary_by_phase:{determinista:resumen('determinista'),real:resumen('real')},real_api:REAL?'fase real solicitada':'NO EJECUTADO: usar --api-real con API y datos accesibles',real_api_preflight:realPreflight,verifier_sha256:hash(fileURLToPath(import.meta.url)),fixtures_sha256:hash(path.join(ROOT,'tools/qa/empty-api.mjs')),fixturePaths,summary,rows};
 fs.mkdirSync(path.dirname(OUTPUT),{recursive:true});fs.writeFileSync(OUTPUT+'.tmp',JSON.stringify(report,null,2));fs.renameSync(OUTPUT+'.tmp',OUTPUT);
 console.log(JSON.stringify({output:OUTPUT,expected:plan.length,executed:rows.length,summary,fatal}));if(fatal||missing||!plan.length||summary.FALLIDO)process.exitCode=1;
}
