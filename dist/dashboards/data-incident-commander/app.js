const NS='http://www.w3.org/2000/svg';
const SNAPSHOT=JSON.parse(document.querySelector('#snapshot-data').textContent);
const SERVER_RUNS=new Map();
const PARAMS=new URLSearchParams(location.search);
const FORCE_LOCAL=PARAMS.get('local')==='1';
// Producción: mismo origen (`/api`, que el nginx del sitio reenvía al backend).
// Desarrollo: backend local en :8010 salvo que ya sirva el propio API (8010/8001)
// o que la URL traiga `?api=...`.
const API_BASE=(()=>{const override=PARAMS.get('api');if(override!==null)return override.replace(/\/+$/,'');if(location.port==='8010'||location.port==='8001')return '';if(['127.0.0.1','localhost','[::1]'].includes(location.hostname))return 'http://127.0.0.1:8010';return '';})();
const apiUrl=(path)=>`${API_BASE}/api/v1/incident-commander${path}`;
const scenarios={
 missing:{title:'Observación 2025 ausente',description:'El snapshot conserva 2019–2024 para PIB, pero falta el periodo 2025 esperado en el contrato de carga.',rule:'period_coverage = 100%',expected:'7 años',actual:'6 años',quality:'94.8',delta:'−5.2 pts',impact:'3',products:'2 productos',severity:'SEV 2',proposal:'Reconsultar periodo 2025',proposalDesc:'Validar respuesta oficial y cargar en copia temporal.',rulePct:85.7,affected:'2 reportes + 1 servicio',source:'API World Bank',fix:'Recargar el periodo faltante',plan:'quarantine',facts:'Una observación anual falta respecto al contrato de siete periodos.'},
 duplicate:{title:'Clave anual duplicada',description:'La llave país · indicador · año aparece repetida en la tabla temporal. El conteo supera el universo esperado.',rule:'unique(country, code, year)',expected:'21 llaves únicas',actual:'24 filas · 3 duplicadas',quality:'98.1',delta:'−1.9 pts',impact:'2',products:'2 productos',severity:'SEV 3',proposal:'Aislar claves repetidas',proposalDesc:'Comparar origen y staging; nunca deduplicar por regla arbitraria.',rulePct:92,affected:'1 mart + 1 tablero',source:'Staging WDI',fix:'Aislar y reconciliar duplicados',plan:'quarantine',facts:'Tres filas duplicadas inyectadas en la copia local para probar idempotencia.'},
 schema:{title:'Contrato de esquema alterado',description:'El campo indicator_code cambió de tipo en la carga. Dos consumidores rechazan el contrato publicado.',rule:'schema_contract = compatible',expected:'6 campos tipados',actual:'5 válidos · 1 drift',quality:'91.2',delta:'−8.8 pts',impact:'4',products:'3 productos',severity:'SEV 2',proposal:'Normalizar tipo en staging',proposalDesc:'Validar catálogo permitido antes de regenerar el snapshot.',rulePct:78,affected:'2 jobs + 2 tableros',source:'Staging WDI',fix:'Restaurar tipo esperado y validar',plan:'quarantine',facts:'Cambio de tipo simulado; no ocurrió en el origen oficial.'}
};
const plans=[
 {id:'quarantine',name:'Cuarentena + recarga de fuente',label:'RECOMENDADO',copy:'Aislamiento alto · traza completa · cero escritura externa',values:[96,95,77,98,99],color:'#4b55ff'},
 {id:'backfill',name:'Backfill desde réplica',label:'ALTERNATIVA',copy:'Recuperación rápida · depende de réplica fresca',values:[76,74,92,82,77],color:'#9586bd'},
 {id:'fullreload',name:'Recarga integral',label:'ALTERNATIVA',copy:'Cobertura amplia · mayor radio y costo de cómputo',values:[90,81,48,42,87],color:'#7180b8'},
 {id:'forward',name:'Imputar valor anterior',label:'NO APROBABLE',copy:'Rápido, pero inventa continuidad y rompe la semántica',values:[51,29,99,56,36],color:'#c77935'}
];
const dims=['Éxito','Seguridad','Rapidez','Aislamiento','Trazabilidad'];
const checks=['Reconciliación','Idempotencia','Alcance acotado','Rollback','Linaje preservado','Revisión humana'];
const checkGrid=[['P','P','P','F'],['P','P','P','P'],['P','P','W','P'],['P','P','P','W'],['P','P','W','F'],['P','P','P','P']];
let current='missing',selectedPlan='quarantine',runStatus='pending',runStarted=null,traceItems=[],approved=false;
function el(id){return document.getElementById(id)}
function svgEl(tag,attrs={},text){const e=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));if(text!==undefined)e.textContent=text;return e}
function setText(id,text){el(id).textContent=text}
function drawSankey(){const s=scenarios[current],svg=el('sankey');svg.replaceChildren();svg.append(svgEl('text',{x:48,y:22,class:'svg-kicker'},'FUENTE'),svgEl('text',{x:252,y:22,class:'svg-kicker'},'INGESTA'),svgEl('text',{x:478,y:22,class:'svg-kicker'},'TRANSFORMACIÓN'),svgEl('text',{x:741,y:22,class:'svg-kicker'},'PRODUCTOS'));const nodes=[{x:42,y:128,w:148,h:82,cls:'hot',title:s.source,sub:'snapshot · 21 obs.',tag:'ORIGEN'},{x:251,y:119,w:154,h:98,cls:'hot',title:'bronze.wdi_mx',sub:'copia aislada · 21 filas',tag:'STAGING'},{x:482,y:114,w:164,h:108,cls:'hot',title:'silver.indicators',sub:'contrato · '+s.rule.split(' ')[0],tag:'VALIDACIÓN'},{x:741,y:53,w:152,h:60,cls:'out',title:'mart.economía',sub:'serie anual',tag:'CONSUMIDOR'},{x:741,y:139,w:152,h:60,cls:'out',title:'briefing ejecutivo',sub:'3 indicadores',tag:'CONSUMIDOR'},{x:741,y:225,w:152,h:60,cls:'out',title:'API de consultas',sub:'NL-to-SQL',tag:'CONSUMIDOR'}];const links=[['M190 166 C216 166 224 166 251 166',13,'hot'],['M405 166 C432 166 450 166 482 166',13,'hot'],['M646 153 C687 153 698 83 741 83',8,'hot'],['M646 166 C690 166 697 169 741 169',7,'inner'],['M646 180 C687 180 698 255 741 255',6,'inner']];links.forEach(([d,w,c])=>svg.append(svgEl('path',{d,class:'sankey-link '+c,'stroke-width':w})));nodes.forEach(n=>{const g=svgEl('g');g.setAttribute('tabindex','0');g.setAttribute('role','img');g.setAttribute('aria-label',n.tag+': '+n.title+'. '+n.sub);g.append(svgEl('title',{},n.tag+': '+n.title+' · '+n.sub));g.append(svgEl('rect',{x:n.x,y:n.y,width:n.w,height:n.h,rx:8,class:n.cls==='hot'?'svg-node hot':'svg-node-output'}));g.append(svgEl('text',{x:n.x+12,y:n.y+15,class:'svg-kicker'},n.tag));g.append(svgEl('text',{x:n.x+12,y:n.y+36,class:'svg-label'},n.title));g.append(svgEl('text',{x:n.x+12,y:n.y+54,class:'svg-sub'},n.sub));svg.append(g)});svg.append(svgEl('text',{x:48,y:317,class:'svg-sub'},'Las rutas muestran dependencias declaradas, no volumen transferido. Línea naranja = ruta que requiere verificación.'));setText('edge-count','1');setText('consumer-count',current==='schema'?'4':'3')}
function drawParallel(){const svg=el('parallel');svg.replaceChildren();const W=640,H=270,left=54,right=17,top=34,bottom=28,xx=i=>left+i*(W-left-right)/(dims.length-1),yy=v=>top+(100-v)*(H-top-bottom)/100;dims.forEach((d,i)=>{svg.append(svgEl('line',{x1:xx(i),x2:xx(i),y1:top,y2:H-bottom,class:'pc-axis'}));[0,50,100].forEach(t=>{svg.append(svgEl('line',{x1:xx(i)-3,x2:xx(i)+3,y1:yy(t),y2:yy(t),class:'pc-tick'}));if(i===0)svg.append(svgEl('text',{x:xx(i)-9,y:yy(t)+3,'text-anchor':'end',class:'pc-label'},t))});svg.append(svgEl('text',{x:xx(i),y:16,'text-anchor':'middle',class:'pc-title'},d))});plans.forEach(p=>{const pts=p.values.map((v,i)=>xx(i)+','+yy(v)).join(' '),line=svgEl('polyline',{points:pts,class:'pc-line '+(p.id===selectedPlan?'selected':''),stroke:p.color,'data-plan':p.id});svg.append(line);const hit=svgEl('polyline',{points:pts,class:'pc-hit','data-plan':p.id});const choose=()=>selectPlan(p.id);hit.addEventListener('pointerenter',choose);hit.addEventListener('click',choose);hit.addEventListener('focus',choose);hit.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();choose()}});hit.setAttribute('tabindex','0');hit.setAttribute('role','button');hit.setAttribute('aria-pressed',String(p.id===selectedPlan));hit.setAttribute('aria-label',p.name+' · '+p.copy);hit.append(svgEl('title',{},p.name+' — '+p.copy));svg.append(hit)});dims.forEach((d,i)=>svg.append(svgEl('text',{x:xx(i),y:H-8,'text-anchor':'middle',class:'pc-label'},'0—100')));drawPlanOptions()}
function drawPlanOptions(){const host=el('plan-options');if(!host)return;host.replaceChildren();plans.forEach(p=>{const button=document.createElement('button');button.type='button';button.className='plan-option'+(p.id==='forward'?' blocked':'');button.dataset.planOption=p.id;button.setAttribute('aria-pressed',String(p.id===selectedPlan));button.textContent=p.id==='forward'?'Imputar (bloqueado)':p.name.replace(' + recarga de fuente','').replace(' desde réplica','').replace(' integral','');button.addEventListener('click',()=>selectPlan(p.id));host.append(button)})}
function drawHeatmap(){const svg=el('heatmap');svg.replaceChildren();const names=['Cuarentena','Backfill','Recarga total','Imputación'],x0=184,y0=51,cw=72,ch=29;names.forEach((n,i)=>svg.append(svgEl('text',{x:x0+i*cw+cw/2,y:33,'text-anchor':'middle',class:'heat-label'},n)));checks.forEach((label,r)=>{svg.append(svgEl('text',{x:0,y:y0+r*ch+13,class:'heat-label'},label));checkGrid[r].forEach((v,c)=>{const x=x0+c*cw,cls=v==='P'?'pass':v==='W'?'warn':'fail',estado=v==='P'?'pasa':v==='W'?'revisar':'bloquea',rect=svgEl('rect',{x,y:y0+r*ch,width:cw-5,height:22,rx:4,class:'heat-cell '+cls+(c===['quarantine','backfill','fullreload','forward'].indexOf(selectedPlan)?' selected-cell':''),'data-col':c});rect.setAttribute('tabindex','0');rect.setAttribute('role','img');rect.setAttribute('aria-label',label+' · '+names[c]+': '+estado);rect.append(svgEl('title',{},label+' · '+names[c]+': '+estado));svg.append(rect);svg.append(svgEl('text',{x:x+(cw-5)/2,y:y0+r*ch+14,class:'heat-text'},v==='P'?'✓':v==='W'?'!':'×'))})});svg.append(svgEl('text',{x:x0,y:244,class:'svg-sub'},'Los criterios son reglas de la demo, no certificaciones de producción.'))}
function drawTrace(){const svg=el('trace');svg.replaceChildren();const lanes=['Orquestador','Profiler SQL','Analista de linaje','Planner','Evaluador','Revisión humana'],ys=[28,66,104,142,180,218],xpoints=[137,283,429,575,721,835];ys.forEach((y,i)=>{svg.append(svgEl('text',{x:2,y:y+12,class:'trace-lane-label'},lanes[i]));svg.append(svgEl('line',{x1:122,x2:912,y1:y+20,y2:y+20,class:'trace-lane'}))});const events=traceItems.length?traceItems:[{name:'abrir run',status:'pending'},{name:'perfilado',status:'pending'},{name:'impacto',status:'pending'},{name:'propuesta',status:'pending'},{name:'6 criterios',status:'pending'},{name:'aprobación',status:'pending'}];events.forEach((it,i)=>{const y=ys[i],x=xpoints[i],state=it.status==='done'?'done':it.status==='wait'?'wait':'';if(i<events.length-1)svg.append(svgEl('path',{d:'M'+(x+94)+' '+(y+10)+' C'+(x+110)+' '+(y+10)+' '+(xpoints[i+1]-18)+' '+(ys[i+1]+10)+' '+xpoints[i+1]+' '+(ys[i+1]+10),class:'trace-connector '+(it.status==='done'?'done':'')}));const rect=svgEl('rect',{x,y,width:i===5?77:96,height:21,rx:5,class:'trace-event '+state});rect.setAttribute('tabindex','0');rect.setAttribute('role','img');rect.setAttribute('aria-label',lanes[i]+': '+it.name+'. '+(it.time||'pendiente'));rect.append(svgEl('title',{},lanes[i]+': '+it.name+' · '+(it.time||'pendiente')));svg.append(rect);svg.append(svgEl('text',{x:x+7,y:y+9,class:'trace-event-label'},it.name));svg.append(svgEl('text',{x:x+7,y:y+18,class:'trace-event-time'},it.time||'pendiente'))})}
function selectPlan(id){selectedPlan=id;const p=plans.find(x=>x.id===id);if(!p)return;setText('plan-name',p.name);setText('plan-copy',p.copy);el('plan-detail').style.borderColor=p.color+'55';el('plan-detail').style.background=p.color+'0d';el('plan-detail').querySelector('.plan-mark').style.background=p.color;el('plan-detail').querySelector('.plan-mark').style.boxShadow='0 0 10px '+p.color;document.querySelector('.recommended').textContent=p.label;document.querySelector('.recommended').style.color=p.color;const unsafe=id==='forward';setText('approval-note',unsafe?'Bloqueado por política: el agente no imputará valores al origen.':runStatus==='done'?'Disponible para revisión; solo opera en la copia temporal.':'Disponible al terminar la investigación y las pruebas.');el('approve-button').disabled=runStatus!=='done'||approved||unsafe;el('reject-button').disabled=runStatus!=='done'||approved;document.querySelectorAll('.pc-hit').forEach(node=>node.setAttribute('aria-pressed',String(node.dataset.plan===id)));drawParallel();drawHeatmap()}
function updateScenario(){SERVER_RUNS.clear();window.__dicReiniciarConsulta&&window.__dicReiniciarConsulta();const s=scenarios[current];setText('incident-title',s.title);setText('incident-description',s.description);setText('severity',s.severity);setText('rule-name',s.rule);setText('expected-value',s.expected);setText('actual-value',s.actual);setText('quality-value',s.quality);setText('quality-delta',s.delta);setText('impact-value',s.impact);setText('impact-delta',s.products);setText('proposal-title',s.proposal);setText('proposal-desc',s.proposalDesc);el('rule-progress').style.width=s.rulePct+'%';el('approve-button').disabled=true;el('reject-button').disabled=true;approved=false;runStatus='pending';traceItems=[];setText('incident-state','Investigación pendiente');setText('incident-sub','No se han ejecutado herramientas');el('incident-orb').className='status-orb';setText('duration-value','—');setText('duration-delta','estimado 42 s');setText('trace-state','LISTA PARA INICIAR');el('trace-state').className='trace-state';setText('trace-details','');const icon=document.createElement('span');icon.className='trace-icon';icon.textContent='⌁';const div=document.createElement('div');div.innerHTML='<b>Sin ejecución todavía</b><p>Inicia una investigación para ver los pasos del orquestador, las herramientas de solo lectura y las pruebas del plan.</p>';const runtime=document.createElement('span');runtime.className='trace-runtime';runtime.textContent='—';el('trace-details').append(icon,div,runtime);setText('approval-note','Disponible al terminar la investigación y las pruebas.');el('approve-button').disabled=true;setText('edge-count','1');setText('incident-sub','No se han ejecutado herramientas');setText('artifact-json',JSON.stringify(makeArtifact(),null,2));drawSankey();drawParallel();drawHeatmap();drawTrace()}
function makeArtifact(){const s=scenarios[current],p=plans.find(x=>x.id===selectedPlan);return{run_id:SERVER_RUNS.get('run_id')||'DI-2026-0417',scenario:current,mode:'local_simulation',source:'World Bank WDI · '+SNAPSHOT.observations.length+' observaciones reales · corte '+SNAPSHOT.snapshot_date,injected_fault:s.facts,agent_mode:'deterministic_workflow_demo',write_authority:'none',tools:['read_only_profiler','lineage_lookup_fixture','contract_validator','sandbox_replay'],selected_plan:p.name,status:approved?'sandbox_simulation_completed':runStatus,tests:runStatus==='done'?{passed:12,failed:0,scope:'in_memory_copy'}:{status:'not_run'},human_approval:approved,external_writes:0}}
function showToast(msg){const t=el('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2400)}
function wait(ms){return new Promise(r=>setTimeout(r,ms))}
async function runInvestigation(){if(runStatus==='running')return;runStatus='running';runStarted=performance.now();el('run-button').disabled=true;try{if(!FORCE_LOCAL){const res=await fetch(apiUrl('/runs'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({scenario_id:current})});if(res.ok){const payload=await res.json();SERVER_RUNS.set('run_id',payload.run_id);window.__dicHabilitarConsulta&&window.__dicHabilitarConsulta();}}}catch{}el('run-button').textContent='Investigando…';setText('incident-state','Investigación en curso');setText('incident-sub','5 pasos · herramientas de solo lectura');el('incident-orb').className='status-orb running';el('trace-state').className='trace-state active';setText('trace-state','EJECUCIÓN EN CURSO');const labels=['abrir run','perfilado SQL','impacto de linaje','plan versionado','12 validaciones','aprobación humana'],notes=['Run local creado; autoridad de escritura = ninguna.',(SNAPSHOT.observations.length+(current==='missing'?-1:current==='duplicate'?3:0))+' filas en copia; defecto reproducido en fixture.','3 dependencias rastreadas; 2 productos requieren verificación.','Propuesta con datos de entrada y alcance acotado.','Contrato, unicidad, rollback y trazabilidad aprobados.','El flujo se pausa hasta la decisión de una persona.'];for(let i=0;i<labels.length-1;i++){traceItems=labels.map((name,j)=>({name,status:j<i?'done':j===i?'wait':'pending',time:j<i?'00:'+String((j+1)*4).padStart(2,'0'):j===i?'activo':'—'}));drawTrace();setText('trace-details','');const icon=document.createElement('span');icon.className='trace-icon';icon.textContent='↳';const div=document.createElement('div');div.innerHTML='<b>'+labels[i]+': '+(i===0?'iniciado':'completado')+'</b><p>'+notes[i]+'</p>';const runtime=document.createElement('span');runtime.className='trace-runtime';runtime.textContent='paso '+(i+1)+' / 5';el('trace-details').append(icon,div,runtime);await wait(470)}traceItems=labels.map((name,j)=>({name,status:j<5?'done':'wait',time:j<5?'00:'+String((j+1)*4).padStart(2,'0'):'paused'}));drawTrace();runStatus='done';const sec=((performance.now()-runStarted)/1000).toFixed(1);setText('duration-value',sec);setText('duration-delta','6 pasos trazados');setText('incident-state','Diagnóstico completo');setText('incident-sub','Pausado antes de cualquier escritura');el('incident-orb').className='status-orb done';el('trace-state').className='trace-state complete';setText('trace-state','HUMAN-IN-THE-LOOP · PAUSADO');setText('trace-details','');const ic=document.createElement('span');ic.className='trace-icon';ic.textContent='✓';const dv=document.createElement('div');dv.innerHTML='<b>Plan listo para revisión humana</b><p>'+scenarios[current].proposal+' · 12 validaciones pasan · sin escritura externa.</p>';const rt=document.createElement('span');rt.className='trace-runtime';rt.textContent=sec+' s';el('trace-details').append(ic,dv,rt);el('approve-button').disabled=selectedPlan==='forward';el('reject-button').disabled=false;setText('approval-note',selectedPlan==='forward'?'Bloqueado por política: el agente no imputará valores al origen.':'La autoridad del agente sigue limitada a la copia de demostración.');setText('artifact-json',JSON.stringify(makeArtifact(),null,2));el('run-button').disabled=false;el('run-button').innerHTML='Investigación completada <span>✓</span>'}
async function approve(){
 el('approval-modal').hidden=true;let receipt='RCPT-0417';
 if(selectedPlan==='forward'){showToast('La política bloqueó la imputación; no se ejecutó.');return}
 const rid=SERVER_RUNS.get('run_id');
 if(rid){try{const res=await fetch(apiUrl('/runs/'+encodeURIComponent(rid)+'/approve'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({approved:true,plan_id:selectedPlan})});if(!res.ok)throw new Error('approval api');const result=await res.json();receipt=result.receipt||receipt}catch{showToast('La API no confirmó la aprobación; no se ejecutó el sandbox.');return}}
 approved=true;runStatus='done';setText('incident-state','Sandbox validado');setText('incident-sub','Copia temporal aprobada · origen intacto');el('incident-orb').className='status-orb done';setText('quality-value','100');setText('quality-delta','12 / 12 checks');el('quality-delta').className='delta';setText('duration-delta','ejecución aislada');setText('trace-state','RECIBO · SOLO DEMO');el('trace-state').className='trace-state complete';setText('trace-details','');const ic=document.createElement('span');ic.className='trace-icon';ic.textContent='↻';const d=document.createElement('div');d.innerHTML='<b>Recibo de simulación generado</b><p>La copia en memoria pasó las reglas; ningún archivo o sistema externo fue modificado.</p>';const rt=document.createElement('span');rt.className='trace-runtime';rt.textContent=receipt;el('trace-details').append(ic,d,rt);traceItems[5]={name:'sandbox · recibo',status:'done',time:receipt};drawTrace();el('approve-button').disabled=true;el('reject-button').disabled=true;el('approve-button').innerHTML='<span>✓</span> Simulación completada';setText('approval-note','Recibo reproducible · 0 escrituras externas.');setText('artifact-json',JSON.stringify(makeArtifact(),null,2));showToast('Sandbox simulado; la fuente permanece intacta.')
}
async function rejectProposal(){const rid=SERVER_RUNS.get('run_id');if(rid){try{const res=await fetch(apiUrl('/runs/'+encodeURIComponent(rid)+'/approve'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({approved:false,plan_id:selectedPlan})});if(!res.ok)throw new Error('reject api')}catch{showToast('No se confirmó el rechazo en el servicio local.');return}}runStatus='rejected';setText('incident-state','Propuesta rechazada');setText('incident-sub','Sin efecto · 0 escrituras');setText('trace-state','RECHAZO · SIN EFECTO');el('trace-state').className='trace-state';el('approve-button').disabled=true;el('reject-button').disabled=true;setText('approval-note','El rechazo quedó en la traza; no se modificó la copia ni el origen.');setText('artifact-json',JSON.stringify(makeArtifact(),null,2));showToast('Propuesta rechazada; no hubo cambios.')}
const sourceNote=el('snapshot-note');if(sourceNote)sourceNote.textContent=SNAPSHOT.observations.length+' observaciones reales · snapshot '+SNAPSHOT.snapshot_date+' · México 2019–2025';const sourceLink=el('source-link');if(sourceLink&&SNAPSHOT.sources?.length)sourceLink.href=SNAPSHOT.sources[0].url;
el('reject-button').addEventListener('click',rejectProposal);
function syncScenarioTabs(focus=false){const tabs=[...document.querySelectorAll('[role="tab"][data-scenario]')];tabs.forEach(tab=>{const active=tab.dataset.scenario===current;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;tab.classList.toggle('active',active)});const panel=el('incident-panel');const active=document.querySelector('[role="tab"][data-scenario="'+current+'"]');if(panel&&active)panel.setAttribute('aria-labelledby',active.id);if(focus&&active){active.focus();const strip=active.closest('.scenario-tabs');if(strip){const left=active.offsetLeft;const right=left+active.offsetWidth;if(left<strip.scrollLeft)strip.scrollLeft=left;else if(right>strip.scrollLeft+strip.clientWidth)strip.scrollLeft=right-strip.clientWidth}}}
function selectScenario(scenario,focus=false){current=scenario;selectedPlan='quarantine';el('run-button').disabled=false;el('run-button').innerHTML='Iniciar investigación <span>↗</span>';syncScenarioTabs(focus);updateScenario()}
const scenarioTabs=document.querySelector('.scenario-tabs');
scenarioTabs?.addEventListener('keydown',event=>{if(!['ArrowRight','ArrowLeft','Home','End'].includes(event.key))return;const tabs=[...document.querySelectorAll('[role="tab"][data-scenario]')];const index=tabs.findIndex(tab=>tab.dataset.scenario===current);if(index<0)return;event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:event.key==='ArrowRight'?(index+1)%tabs.length:(index-1+tabs.length)%tabs.length;if(tabs[next])selectScenario(tabs[next].dataset.scenario,true)});
document.querySelectorAll('[role="tab"][data-scenario]').forEach(tab=>tab.addEventListener('click',()=>selectScenario(tab.dataset.scenario)));
syncScenarioTabs();
el('run-button').addEventListener('click',runInvestigation);el('approve-button').addEventListener('click',()=>{el('approval-modal').hidden=false;el('confirm-approval').focus()});el('cancel-approval').addEventListener('click',()=>el('approval-modal').hidden=true);el('confirm-approval').addEventListener('click',approve);el('approval-modal').addEventListener('click',e=>{if(e.target===el('approval-modal'))el('approval-modal').hidden=true});document.addEventListener('keydown',e=>{if(e.key==='Escape')el('approval-modal').hidden=true});el('copy-json').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(el('artifact-json').textContent);showToast('Run artifact copiado.')}catch{showToast('Selecciona el JSON para copiarlo.')}});updateScenario();

/* ============================================================================
   CONSULTA CONSULTIVA A OPENAI  (opcional, no ejecuta nada)
   ----------------------------------------------------------------------------
   Solo se ofrece cuando el run existe en la API (POST /runs respondió), y su
   resultado es una segunda opinión: no aprueba, no ejecuta y no modifica la
   copia. La aprobación humana y la simulación en memoria siguen siendo la única
   vía de cambio. Cada consulta puede generar cargos en la cuenta del proveedor.
   ========================================================================== */
(() => {
  const boton = el('llm-button');
  if (!boton) return; /* HTML antiguo en caché: sin panel no hay nada que enganchar. */

  const AVISOS = {
    404: 'El run ya no existe en el servicio; vuelve a iniciar la investigación.',
    422: 'El plan propuesto no es aplicable a este incidente.',
    502: 'El proveedor no devolvió una recomendación válida. No se muestra nada.',
    503: 'La consulta a OpenAI no está configurada en este despliegue.',
  };

  function reiniciarConsulta() {
    const resultado = el('llm-result');
    if (resultado) resultado.hidden = true;
    boton.disabled = true;
    boton.textContent = '◈ Consultar OpenAI';
    const nota = el('llm-note');
    if (nota) nota.textContent = 'Disponible al iniciar un run conectado a la API. La consulta puede generar cargos y no aprueba ni ejecuta nada.';
  }

  function habilitarConsulta() {
    if (!SERVER_RUNS.get('run_id')) return;
    boton.disabled = false;
    const nota = el('llm-note');
    if (nota) nota.textContent = 'Run conectado a la API. La consulta es una segunda opinión: puede generar cargos y no aprueba ni ejecuta nada.';
  }

  function pintarConsulta(datos) {
    const plan = datos.recommendation || {};
    el('llm-result').hidden = false;
    const insignia = el('llm-badge');
    insignia.textContent = plan.plan || '—';
    insignia.dataset.plan = plan.plan || '';
    setText('llm-plan', plan.name || '—');
    const tokens = datos.usage && datos.usage.total_tokens ? ' · ' + datos.usage.total_tokens + ' tokens' : '';
    setText('llm-meta', (datos.model || 'proveedor') + tokens + ' · ' + (datos.consultation_id || ''));
    setText('llm-justification', datos.justification || '');
    el('llm-evidence').replaceChildren(...(datos.evidence || []).map((texto) => {
      const item = document.createElement('li');
      item.textContent = texto;
      return item;
    }));
    el('llm-risks').replaceChildren(...(datos.risks || []).map((texto) => {
      const item = document.createElement('li');
      item.textContent = texto;
      return item;
    }));
    setText('llm-disclaimer', 'Recomendación consultiva de ' + (datos.model || 'el proveedor') + '. No aprueba, no ejecuta y no modifica la copia: la aprobación sigue siendo humana y la simulación ocurre en memoria. La consulta puede generar cargos.');
  }

  async function consultarOpenAI() {
    const runId = SERVER_RUNS.get('run_id');
    if (!runId) {
      showToast('Inicia un run conectado a la API para consultar.');
      return;
    }
    const etiqueta = boton.textContent;
    boton.disabled = true;
    boton.textContent = 'Consultando…';
    try {
      const res = await fetch(apiUrl('/runs/' + encodeURIComponent(runId) + '/analysis'), {
        method: 'POST',
        headers: { Accept: 'application/json' },
      });
      const datos = await res.json().catch(() => null);
      if (!res.ok || !datos) {
        showToast(AVISOS[res.status] || 'No se pudo completar la consulta.');
        return;
      }
      pintarConsulta(datos);
      showToast('Consulta completada: ' + ((datos.recommendation && datos.recommendation.name) || 'recomendación recibida') + '.');
    } catch (error) {
      showToast('La consulta falló; no se modificó nada.');
    } finally {
      boton.textContent = etiqueta;
      boton.disabled = !SERVER_RUNS.get('run_id');
    }
  }

  window.__dicHabilitarConsulta = habilitarConsulta;
  window.__dicReiniciarConsulta = reiniciarConsulta;
  boton.addEventListener('click', consultarOpenAI);
})();