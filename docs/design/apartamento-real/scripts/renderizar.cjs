const fs=require('node:fs');const path=require('node:path');
const {chromium}=require('C:/Users/hugov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const page=await browser.newPage({viewport:{width:1240,height:1200},deviceScaleFactor:1});
 for(const name of ['planta-2d','casa-isometrica']){
  const svg=fs.readFileSync(path.join(root,name+'.svg'),'utf8');
  await page.setContent('<style>body{margin:0;background:#f5f2eb}svg{display:block;width:1240px;height:auto}</style>'+svg);
  await page.locator('svg').screenshot({path:path.join(root,'previews',name+'-ampla.png')});
 }
 const g=JSON.parse(fs.readFileSync(path.join(root,'geometria.json'),'utf8'));
 const regions=JSON.parse(fs.readFileSync(path.join(root,'areas-interativas.json'),'utf8')).regions;
 let plan=fs.readFileSync(path.join(root,'planta-2d.svg'),'utf8').replace('viewBox="0 0 1240 1180"','viewBox="0 0 1240 1000"');
 plan=plan.replace(/(?<=\s)id="/g,'id="review-plan-').replace('aria-labelledby="svg-title svg-desc"','aria-labelledby="review-plan-svg-title review-plan-svg-desc"');
 let iso=fs.readFileSync(path.join(root,'casa-isometrica.svg'),'utf8').replace(/(?<=\s)id="/g,'id="review-iso-').replaceAll('url(#tile)','url(#review-iso-tile)').replace('aria-labelledby="svg-title svg-desc"','aria-labelledby="review-iso-svg-title review-iso-svg-desc"');
 const pins=(kind)=>regions.map(r=>{const a=kind==='iso'?r.labelPosition:r.labelPosition2d;const width=kind==='iso'?1280:1240;const height=kind==='iso'?1080:1000;return `<span class="pin" data-room="${r.id}" style="left:${a[0]/width*100}%;top:${a[1]/height*100}%" aria-hidden="true">${r.number}</span>`}).join('');
 const items=regions.map(r=>`<button type="button" data-select="${r.id}" aria-pressed="false"><b>${r.number}</b> ${r.name}</button>`).join('');
 const html=`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Apartamento · conferência visual</title><style>
 *{box-sizing:border-box}body{margin:0;background:#f5f2eb;color:#173e31;font:16px/1.5 Arial,sans-serif}main{max-width:1200px;margin:auto;padding:24px}h1{font-size:28px;line-height:1.2;margin:0 0 10px}h2{font-size:20px;margin:0 0 12px}p{max-width:70ch;margin:8px 0 18px;color:#435849}.maps{display:grid;grid-template-columns:1fr 1fr;gap:24px}.map{position:relative;overflow:hidden;background:#fffefa;border:1px solid #d0d6c8;border-radius:18px}.map>svg{width:100%;height:auto;display:block}.map .room-label{display:none}.pin{position:absolute;transform:translate(-50%,-50%);width:24px;height:24px;display:grid;place-items:center;border:1.5px solid #245c48;background:#fffefa;border-radius:50%;color:#173e31;font-size:12px;font-weight:bold;pointer-events:none}.pin.selected{border-style:dashed;background:#245c48;color:white;outline:2px solid #fffefa}ul{list-style:none;padding:0;margin:16px 0;display:grid;grid-template-columns:repeat(4,1fr);gap:8px}button{font:inherit;text-align:left;color:#173e31;background:#fffefa;border:1px solid #ccd5c5;border-radius:10px;padding:10px;min-height:44px;cursor:pointer}button b{display:inline-grid;place-items:center;width:24px;height:24px;margin-right:3px;border-radius:50%;background:#edf2e9}button[aria-pressed=true]{outline:2px dashed #245c48}button:focus-visible{outline:3px solid #245c48}.tools{display:flex;flex-wrap:wrap;gap:10px;margin:16px 0}.tools label{display:flex;align-items:center;gap:8px}.tools input{width:20px;height:20px}.caption{font-size:14px}.map.zoomed svg{width:180%;max-width:none}.map.zoomed{overflow:auto}.map.zoomed .pin{display:none}@media(max-width:700px){main{padding:16px}h1{font-size:24px}.maps{grid-template-columns:1fr;gap:20px}ul{grid-template-columns:repeat(2,1fr)}h2{font-size:18px}.pin{width:22px;height:22px;font-size:12px}.caption{font-size:14px}}@media(prefers-reduced-motion:reduce){.room-surface{transition:none!important}}
 </style><main><h1>Apartamento · conferência visual</h1><p>Traçado relativo da planta de 53,05 m². Janela da sala: aproximadamente 1,60 m, informado pelo usuário. A geometria continua sem escala dimensional confiável.</p><div class="maps"><section><h2>Planta 2D</h2><div class="map" id="plan-preview">${plan}${pins('plan')}</div></section><section><h2>Isometria</h2><div class="map" id="iso-preview">${iso}${pins('iso')}</div></section></div><ul>${items.split('</button>').filter(Boolean).map(s=>'<li>'+s+'</button></li>').join('')}</ul><div class="tools"><label><input id="context" type="checkbox" ${g.representedState.contextVisibleByDefault?'checked':''}>Mobiliário atual observado nas fotos</label><button id="zoom" type="button">Ampliar para conferir</button></div><p class="caption">Fotos confirmadas pelo usuário como estado atual; vídeo completo usado para estrutura. Posição e dimensões dos móveis continuam estimadas. Os números ligam mapa e lista. Nenhum ambiente foi cadastrado no aplicativo.</p></main><script>
 (()=>{const select=id=>{document.querySelectorAll('.room[data-room-id]').forEach(g=>g.classList.toggle('is-selected',g.dataset.roomId===id));document.querySelectorAll('[data-select]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.select===id)));document.querySelectorAll('.pin').forEach(p=>p.classList.toggle('selected',p.dataset.room===id));};
 document.querySelectorAll('[data-select]').forEach(b=>b.onclick=()=>select(b.dataset.select));document.querySelectorAll('.room[data-room-id]').forEach(g=>g.onclick=()=>select(g.dataset.roomId));
 document.querySelector('#context').onchange=e=>document.querySelector('#review-iso-iso-mobiliario-contextual').style.display=e.target.checked?'inline':'none';
 document.querySelector('#zoom').onclick=()=>document.querySelectorAll('.map').forEach(m=>m.classList.toggle('zoomed'));})();
 </script></html>`;
 fs.writeFileSync(path.join(root,'conferencia.html'),html);
 const checks=[];
 for(const width of [360,390,412,1200]){
  await page.setViewportSize({width,height:900});await page.setContent(html);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  const duplicateIds=await page.evaluate(()=>{const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);return ids.filter((id,i)=>ids.indexOf(id)!==i)});
  const collisions=await page.evaluate(()=>{const out=[];for(const m of document.querySelectorAll('.map')){const boxes=[...m.querySelectorAll('.pin')].map(p=>p.getBoundingClientRect());for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];if(a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top)out.push([i,j])}}return out;});
  await page.screenshot({path:path.join(root,'previews','conferencia-'+width+'.png'),fullPage:true});
  for(const name of ['plan','iso'])await page.locator('#'+name+'-preview').screenshot({path:path.join(root,'previews',(name==='plan'?'planta-2d':'casa-isometrica')+'-'+width+'.png')});
  await page.locator('[data-select="vis-banho"]').click();
  const selected=await page.locator('.room.is-selected').count();
  await page.locator('#context').uncheck();const contextHidden=await page.locator('#review-iso-iso-mobiliario-contextual').evaluate(e=>getComputedStyle(e).display==='none');
  await page.locator('#context').check();const contextVisible=await page.locator('#review-iso-iso-mobiliario-contextual').evaluate(e=>getComputedStyle(e).display!=='none');
  await page.locator('#iso-preview').screenshot({path:path.join(root,'previews','casa-isometrica-selecao-'+width+'.png')});
  checks.push({width,overflow,duplicateIds,collisions,selected,contextHidden,contextVisible});
  if(overflow||duplicateIds.length||collisions.length||selected!==2||!contextHidden||!contextVisible)throw new Error('Falha QA: '+JSON.stringify(checks.at(-1)));
 }
 fs.writeFileSync(path.join(root,'previews/qa-navegador.json'),JSON.stringify(checks,null,2));
 console.log('QA',JSON.stringify(checks));await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1});
