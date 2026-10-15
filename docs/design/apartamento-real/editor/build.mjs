import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {validate} from './geometry-core.mjs';
import {createHash} from 'node:crypto';
const root=new URL('./',import.meta.url);
const [template,css,core,app,geometry]=await Promise.all(['index.html','editor.css','geometry-core.mjs','editor.mjs','../geometria.json'].map(path=>readFile(new URL(path,root),'utf8')));
const script=core.replace(/^export /gm,'')+'\n'+app.replace(/^import .+;\r?\n/,'');
const data=JSON.stringify(validate(JSON.parse(geometry))).replace(/</g,'\\u003c');
const html=template.replace('<!-- EDITOR_STYLE -->','<style>'+css+'</style>').replace('<!-- EDITOR_BASELINE -->','<script type="application/json" id="baseline-model">'+data+'</script>').replace('<!-- EDITOR_SCRIPT -->','<script type="module">'+script+'</script>');
await mkdir(new URL('dist/',root),{recursive:true});await writeFile(new URL('dist/index.html',root),html);
console.log('Editor independente gerado: '+new URL('dist/index.html',root).pathname);
const [fTemplate,fCss,fCore,fApp,base,stove,manifest]=await Promise.all([
 'furniture.html','furniture.css','furniture-core.mjs','furniture.mjs',
 '../estudo-visual-2026-10-15/apartamento-sem-moveis-v2.png',
 '../itens/fogao-suggar-001/fogao-frente-direita-v2.png','../itens/fogao-suggar-001/item.json'
].map((p,i)=>readFile(new URL(p,root),i===4||i===5?undefined:'utf8')));
const digest=b=>createHash('sha256').update(b).digest('hex');
if(digest(base)!=='8cff27b8892ae51cf679b6aed5fd8648d19420e95eb652224ad6a82456fe579d')throw Error('Base aprovada foi alterada.');
const item=JSON.parse(manifest);if(digest(stove)!==item.sha256)throw Error('Peça do fogão não corresponde ao manifesto.');
const bundle={base:{dataUrl:'data:image/png;base64,'+base.toString('base64')},geometry:JSON.parse(geometry),assets:[{
 id:item.id,name:'Fogão Suggar',dataUrl:'data:image/png;base64,'+stove.toString('base64'),
 width:item.pixels.width,height:item.pixels.height,anchor:item.floorAnchor.normalized
}]};
const fScript=fCore.replace(/^export /gm,'')+'\n'+fApp.replace(/^import .+;\r?\n/,'');
const fData=JSON.stringify(bundle).replace(/</g,'\\u003c');
const fHtml=fTemplate.replace('<!-- FURNITURE_STYLE -->','<style>'+fCss+'</style>')
 .replace('<!-- FURNITURE_DATA -->','<script type="application/json" id="furniture-data">'+fData+'</script>')
 .replace('<!-- FURNITURE_SCRIPT -->','<script type="module">'+fScript+'</script>');
await writeFile(new URL('dist/moveis.html',root),fHtml);
console.log('Editor de móveis independente gerado: '+new URL('dist/moveis.html',root).pathname);
