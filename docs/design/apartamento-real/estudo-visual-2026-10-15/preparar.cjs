const fs=require('node:fs');const path=require('node:path');const crypto=require('node:crypto');
const sharp=require('C:/Users/hugov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=__dirname;
(async()=>{
 const svgPath='C:/Users/hugov/Downloads/casa-isometrica.svg';
 const stylePath='C:/Users/hugov/AppData/Local/Temp/codex-clipboard-f22d7679-2734-4c3c-8d29-a175c1bddc5c.png';
 const original=fs.readFileSync(svgPath,'utf8');fs.mkdirSync(path.join(root,'fontes'),{recursive:true});
 fs.copyFileSync(svgPath,path.join(root,'fontes/casa-isometrica-enviada.svg'));
 fs.copyFileSync(stylePath,path.join(root,'fontes/referencia-design.png'));
 const {chromium}=require('C:/Users/hugov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
  const page=await browser.newPage();await page.setContent('<div id="source"></div>');
  const clean=await page.evaluate(svg=>{
   const doc=new DOMParser().parseFromString(svg,'image/svg+xml');
   for(const id of ['iso-elementos-fixos','iso-mobiliario-contextual'])doc.getElementById(id)?.remove();
   const title=doc.querySelector('title');if(title)title.textContent='Apartamento ajustado: estrutura vazia para referência visual';
   return new XMLSerializer().serializeToString(doc);
  },original);
  fs.writeFileSync(path.join(root,'estrutura-vazia.svg'),clean);
  await sharp(Buffer.from(clean)).resize({width:1800}).flatten({background:'#ededeb'}).png().toFile(path.join(root,'estrutura-vazia.png'));
  const comparison=await page.evaluate(({a,b})=>{
   const da=new DOMParser().parseFromString(a,'image/svg+xml'),db=new DOMParser().parseFromString(b,'image/svg+xml');
   const floors=d=>[...d.querySelectorAll('.room[data-room-id]')].map(n=>({id:n.getAttribute('data-room-id'),points:n.querySelector('.room-surface').getAttribute('points')}));
   return {viewBoxPreserved:da.documentElement.getAttribute('viewBox')===db.documentElement.getAttribute('viewBox'),roomsBefore:floors(da),roomsAfter:floors(db),structurePreserved:da.getElementById('iso-estrutura').outerHTML===db.getElementById('iso-estrutura').outerHTML,noFurniture:!db.getElementById('iso-mobiliario-contextual'),noFixtures:!db.getElementById('iso-elementos-fixos')};
  },{a:original,b:clean});
  if(!comparison.viewBoxPreserved||!comparison.structurePreserved||!comparison.noFurniture||!comparison.noFixtures||JSON.stringify(comparison.roomsBefore)!==JSON.stringify(comparison.roomsAfter))throw Error('Geometria alterada indevidamente');
  comparison.sourceSha256=crypto.createHash('sha256').update(original).digest('hex');
  fs.writeFileSync(path.join(root,'integridade-fontes.json'),JSON.stringify(comparison,null,2));
  console.log('Estrutura vazia: 8 ambientes e projeção preservados; fontes arquivadas.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
