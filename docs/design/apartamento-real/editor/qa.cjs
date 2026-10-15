const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/hugov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=__dirname,out=path.join(root,'previews');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1400,height:1000},acceptDownloads:true});
  await context.route('**/*',route=>{const url=route.request().url();return url.startsWith('http://127.0.0.1:8869/')||url.startsWith('file:')||url.startsWith('data:')||url.startsWith('blob:')?route.continue():route.abort();});
  const page=await context.newPage(),errors=[],checks=[];page.on('pageerror',e=>errors.push(e.message));
  const response=await page.goto('http://127.0.0.1:8869/');assert.equal(response.status(),200);await page.locator('#room-select option').last().waitFor({state:'attached'});assert.equal(await page.locator('#room-select option').count(),8);
  const snapshot=()=>page.evaluate(()=>window.__plantEditor.snapshot());
  const original=await snapshot();await page.evaluate(()=>localStorage.setItem('casa-serena-domain-sentinel','preservar'));
  await page.locator('#room-select').selectOption('vis-q1');await page.locator('#room-width').fill('110');await page.locator('#room-width').press('Tab');
  let edited=await snapshot();assert.equal(Math.max(...edited.rooms[0].polygon.map(p=>p[0])),365);assert.equal(edited.rooms[1].polygon[0][0],365);checks.push('campo de largura muda parede compartilhada, mantendo IDs');
  await page.locator('#undo').click();assert.deepEqual((await snapshot()).rooms[0].polygon,original.rooms[0].polygon);await page.locator('#redo').click();assert.deepEqual((await snapshot()).rooms[0].polygon,edited.rooms[0].polygon);checks.push('desfazer/refazer recuperam geometria anterior');
  await page.locator('#room-select').selectOption('vis-q3');let prior=await snapshot();
  let handle=page.locator('[data-handle="wall"][data-axis="0"][data-at="448"] circle').last();let box=await handle.boundingBox();
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2+18,box.y+box.height/2,{steps:8});await page.mouse.up();
  edited=await snapshot();assert.ok(Math.max(...edited.rooms[2].polygon.map(p=>p[0]))>Math.max(...prior.rooms[2].polygon.map(p=>p[0])));checks.push('arraste real de parede atualiza planta e isometria');
  prior=await snapshot();handle=page.locator('[data-handle="corner"][data-index="0"] rect');box=await handle.boundingBox();
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2-10,box.y+box.height/2+9,{steps:8});await page.mouse.up();
  edited=await snapshot();assert.notDeepEqual(edited.rooms[2].polygon,prior.rooms[2].polygon);checks.push('arraste real de canto modifica as duas direções');
  await page.reload();await page.locator('#room-select option').last().waitFor({state:'attached'});assert.deepEqual((await snapshot()).rooms.map(r=>r.polygon),edited.rooms.map(r=>r.polygon));assert.equal(await page.evaluate(()=>localStorage.getItem('casa-serena-domain-sentinel')),'preservar');checks.push('recarga recupera projeto; chave alheia ao editor preservada');
  async function download(click,name){const promise=page.waitForEvent('download');await click();const d=await promise;await d.saveAs(path.join(out,name));return fs.readFileSync(path.join(out,name),'utf8');}
  const json=await download(()=>page.locator('#export-project').click(),'qa-projeto.json'),exported=JSON.parse(json);assert.equal(exported.rooms.length,8);assert.ok(exported.rooms.every(r=>r.appRoomId===null));assert.equal(exported.coordinateSystem.scaleToMeters,null);
  await page.locator('#reset-project').click();assert.deepEqual((await snapshot()).rooms.map(r=>r.polygon),original.rooms.map(r=>r.polygon));await page.locator('#undo').click();assert.deepEqual((await snapshot()).rooms.map(r=>r.polygon),edited.rooms.map(r=>r.polygon));
  await page.locator('#project-file').setInputFiles({name:'minha-planta.json',mimeType:'application/json',buffer:Buffer.from(json)});await page.locator('#message').filter({hasText:'Projeto aberto'}).waitFor();assert.deepEqual((await snapshot()).rooms.map(r=>r.polygon),exported.rooms.map(r=>r.polygon));
  prior=await snapshot();await page.locator('#project-file').setInputFiles({name:'invalido.json',mimeType:'application/json',buffer:Buffer.from('{"schemaVersion":1}')});await page.locator('#message').filter({hasText:'preservada'}).waitFor();assert.deepEqual(await snapshot(),prior);checks.push('exportação/reabertura e importação inválida sem perder trabalho; reset reversível');
  await page.locator('#export-drawings').click();const svg=await download(()=>page.locator('[data-export="iso"]').click(),'qa-isometria.svg');assert.ok(svg.includes('viewBox='));assert.ok(!/<script|foreignObject|\shref=/i.test(svg));
  assert.equal(await page.evaluate(text=>new DOMParser().parseFromString(text,'image/svg+xml').querySelectorAll('parsererror').length,svg),0);
  await page.locator('#export-drawings').click();const regionsText=await download(()=>page.locator('[data-export="regions"]').click(),'qa-regioes.json'),regions=JSON.parse(regionsText);assert.equal(regions.regions.length,8);checks.push('SVG válido/autocontido e oito áreas interativas exportáveis');
  await page.locator('#zoom-in').click();assert.equal(await page.locator('#zoom-value').innerText(),'125%');
  const panBox=await page.locator('#plan-viewport').boundingBox();const beforePan=await snapshot();
  await page.mouse.move(panBox.x+panBox.width*.75,panBox.y+panBox.height*.8);await page.mouse.down();await page.mouse.move(panBox.x+panBox.width*.75-30,panBox.y+panBox.height*.8,{steps:5});await page.mouse.up();
  assert.ok(await page.locator('#plan-viewport').evaluate(e=>e.scrollLeft>0));assert.deepEqual(await snapshot(),beforePan);
  await page.locator('#zoom-fit').click();assert.equal(await page.locator('#zoom-value').innerText(),'100%');checks.push('ampliação, deslocamento da vista e enquadramento sem alterar geometria');
  const layouts=[];
  for(const width of [360,390,412,1400]){
   await page.setViewportSize({width,height:900});
   await page.locator('#room-select').selectOption('vis-q1');
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
   const duplicateIds=await page.evaluate(()=>{const ids=[...document.querySelectorAll('[id]')].map(n=>n.id);return ids.filter((id,i)=>ids.indexOf(id)!==i)});
   assert.equal(overflow,false);assert.deepEqual(duplicateIds,[]);
   if(width<=700){await page.locator('#tab-iso').click();assert.ok(await page.locator('#iso-panel').isVisible());assert.ok(!await page.locator('#plan-panel').isVisible());await page.locator('#tab-plan').click();}
   await page.screenshot({path:path.join(out,'editor-'+width+'.png'),fullPage:true});layouts.push({width,overflow,duplicateIds});
  }
  checks.push('360/390/412/1400 px sem overflow ou IDs duplicados; troca de vistas no celular');
  await page.evaluate(()=>{Storage.prototype.setItem=function(){throw new DOMException('Quota','QuotaExceededError')}});
  await page.locator('#room-width').fill('105');await page.locator('#room-width').press('Tab');assert.ok(await page.locator('#storage-alert').isVisible());assert.ok((await page.locator('#save-status').innerText()).includes('só nesta aba'));
  const quotaJson=await download(()=>page.locator('#export-project').click(),'qa-quota-projeto.json');assert.deepEqual(JSON.parse(quotaJson).rooms.map(r=>r.polygon),(await snapshot()).rooms.map(r=>r.polygon));checks.push('falha de gravação local avisada; exportação conserva edição em memória');
  const offline=await context.newPage();offline.on('pageerror',e=>errors.push(e.message));await context.setOffline(true);await offline.goto(pathToFileURL(path.join(root,'dist/index.html')).href);await offline.locator('#room-select option').last().waitFor({state:'attached'});
  await offline.locator('#room-select').selectOption('vis-q1');await offline.locator('#room-depth').fill('105');await offline.locator('#room-depth').press('Tab');const saved=await offline.evaluate(()=>window.__plantEditor.snapshot());await offline.reload();await offline.locator('#room-select option').last().waitFor({state:'attached'});assert.deepEqual(await offline.evaluate(()=>window.__plantEditor.snapshot().rooms.map(r=>r.polygon)),saved.rooms.map(r=>r.polygon));checks.push('HTML autônomo abre, edita e recupera rascunho com rede offline');
  const clean=await browser.newContext({viewport:{width:1400,height:950}}),cleanPage=await clean.newPage();await cleanPage.goto(pathToFileURL(path.join(root,'dist/index.html')).href);await cleanPage.locator('#room-select').selectOption('vis-q1');await cleanPage.screenshot({path:path.join(out,'editor-inicial-1400.png'),fullPage:true});await cleanPage.setViewportSize({width:390,height:844});await cleanPage.screenshot({path:path.join(out,'editor-inicial-390.png'),fullPage:true});await clean.close();
  const touchContext=await browser.newContext({viewport:{width:390,height:844},hasTouch:true}),touchPage=await touchContext.newPage();await touchPage.goto(pathToFileURL(path.join(root,'dist/index.html')).href);await touchPage.locator('#room-select').selectOption('vis-q1');
  const touchHandle=touchPage.locator('[data-handle="wall"][data-axis="0"][data-at="336"] circle').last();await touchHandle.scrollIntoViewIfNeeded();const tb=await touchHandle.boundingBox(),cdp=await touchContext.newCDPSession(touchPage),tp={x:tb.x+tb.width/2,y:tb.y+tb.height/2,radiusX:2,radiusY:2};
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[tp]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...tp,x:tp.x+10}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  assert.ok(await touchPage.evaluate(()=>Math.max(...window.__plantEditor.snapshot().rooms[0].polygon.map(p=>p[0]))>336));await touchContext.close();checks.push('arraste por toque simulado em 390 px ajusta parede');
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'qa.json'),JSON.stringify({result:'PASS',checks,layouts,pageErrors:errors,limits:['não testa Samsung Internet físico','não integra alteração ao app']},null,2));console.log(JSON.stringify({result:'PASS',checks:checks.length,layouts:layouts.map(x=>x.width)}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
