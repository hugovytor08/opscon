import {FORMAT,BASE_ID,LIMITS,clamp,copy,validateFurniture,initialFurniture,projectPoint,roomFor,itemBox,wallMasks} from './furniture-core.mjs';
const $=id=>document.getElementById(id),ns='http://www.w3.org/2000/svg';
const bundle=JSON.parse($('furniture-data').textContent),builtins=bundle.assets,geometry=bundle.geometry;
const clone=p=>({...p,assets:p.assets.map(a=>({...a})),items:p.items.map(i=>({...i}))});
let model=initialFurniture(builtins),selected=null,undo=[],redo=[],db=null,saveQueue=Promise.resolve(),revision=0,ready=false;
let view={cx:632.5,cy:621.5,zoom:1},gesture=null,pinch=null,pointers=new Map(),messageTimer;
const svg=$('canvas'),defs=$('defs');
function element(tag,attrs={},text){const n=document.createElementNS(ns,tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,v);if(text!==undefined)n.textContent=text;return n;}
function notify(text){$('message').textContent=text;$('message').hidden=false;clearTimeout(messageTimer);messageTimer=setTimeout(()=>$('message').hidden=true,6000);}
function storageWarning(){ $('notice').textContent='Não foi possível guardar uma cópia neste navegador. Sua edição continua nesta aba: use Baixar projeto para preservá-la.';$('notice').hidden=false; }
function assets(){return model.assets.map(a=>a.builtin?builtins.find(b=>b.id===a.id):a);}
function assetFor(id){return assets().find(a=>a.id===id);}
function current(){return model.items.find(i=>i.id===selected);}
function newId(prefix){return prefix+'-'+(globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2));}
function openStore(){return new Promise((resolve,reject)=>{
 const request=indexedDB.open('casa-serena-furniture-editor-v1',1);const timer=setTimeout(()=>reject(Error('Armazenamento indisponível')),2500);
 request.onupgradeneeded=()=>request.result.createObjectStore('drafts');
 request.onsuccess=()=>{clearTimeout(timer);resolve(request.result)};request.onerror=()=>{clearTimeout(timer);reject(request.error)};request.onblocked=()=>{clearTimeout(timer);reject(Error('Armazenamento bloqueado'))};
});}
function readDraft(){return new Promise((resolve,reject)=>{const tx=db.transaction('drafts','readonly'),req=tx.objectStore('drafts').get('current');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)});}
function writeDraft(value){return new Promise((resolve,reject)=>{const tx=db.transaction('drafts','readwrite');tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);tx.onerror=()=>reject(tx.error);tx.objectStore('drafts').put(value,'current');});}
function save(){const at=++revision,value=clone(model);$('save-status').textContent='Guardando neste navegador…';saveQueue=saveQueue.catch(()=>{}).then(async()=>{
 try{if(!db)throw Error('Sem armazenamento');await writeDraft(value);if(at===revision)$('save-status').textContent='Salvo neste navegador';}
 catch{storageWarning();if(at===revision)$('save-status').textContent='Edição só nesta aba · baixe o projeto';}
});}
function commit(before){if(JSON.stringify(before)===JSON.stringify(model))return;undo.push(before);if(undo.length>30)undo.shift();redo=[];render();save();}
function change(fn){const before=clone(model);fn();commit(before);}
function updateView(){const w=1265/view.zoom,h=1243/view.zoom;svg.setAttribute('viewBox',[view.cx-w/2,view.cy-h/2,w,h].join(' '));$('zoom-value').textContent=Math.round(view.zoom*100)+'%';renderSelection();}
function screenPoint(x,y){const point=svg.createSVGPoint();point.x=x;point.y=y;const p=point.matrixTransform(svg.getScreenCTM().inverse());return [p.x,p.y];}
function zoomTo(z,client){const old=client?screenPoint(...client):[view.cx,view.cy];view.zoom=clamp(z,1,5);updateView();if(client){const p=screenPoint(...client);view.cx+=old[0]-p[0];view.cy+=old[1]-p[1];updateView();}}
function loadTextures(){defs.replaceChildren();defs.append(element('image',{id:'base-bitmap',href:bundle.base.dataUrl,width:1265,height:1243}));for(const a of assets())defs.append(element('image',{id:'texture-'+a.id,href:a.dataUrl,width:a.width,height:a.height}));}
function renderObjects(){
 for(const mask of defs.querySelectorAll('[data-wallmask]'))mask.remove();$('objects').replaceChildren();
 const sorted=model.items.map((item,index)=>({item,index})).sort((a,b)=>a.item.y-b.item.y||a.index-b.index);
 for(const {item}of sorted){
  const a=assetFor(item.assetId),b=itemBox(item,a),id='mask-'+item.id;
  const mask=element('mask',{id,'data-wallmask':'',maskUnits:'userSpaceOnUse',x:0,y:0,width:1265,height:1243,'mask-type':'luminance'});mask.append(element('rect',{x:0,y:0,width:1265,height:1243,fill:'white'}));
  for(const ps of wallMasks(item,geometry))mask.append(element('polygon',{points:ps.map(p=>p.join(',')).join(' '),fill:'black'}));defs.append(mask);
  const g=element('g',{'data-object-id':item.id,tabindex:0,role:'button','aria-label':a.name+', mover com as setas'});
  const masked=element('g',{mask:`url(#${id})`});masked.append(element('use',{href:'#texture-'+a.id,transform:`translate(${b.x} ${b.y}) scale(${b.w/a.width})`,'pointer-events':'none'}));g.append(masked);
  g.append(element('rect',{x:b.x,y:b.y,width:b.w,height:b.h,fill:'transparent','data-hit':'','pointer-events':'all'}));$('objects').append(g);
 }
 renderSelection();
}
function renderSelection(){
 $('selection').replaceChildren();const i=current();if(!i)return;const b=itemBox(i,assetFor(i.assetId));const scale=svg.getScreenCTM()?.a||1;
 $('selection').append(element('rect',{x:b.x,y:b.y,width:b.w,height:b.h,fill:'none',stroke:'#245c48','stroke-width':1.5/scale,'stroke-dasharray':`${5/scale} ${3/scale}`,'pointer-events':'none'}));
 const handle=element('g',{'data-resize':i.id});handle.append(element('circle',{cx:b.x+b.w,cy:b.y+b.h,r:22/scale,fill:'transparent'}));handle.append(element('circle',{cx:b.x+b.w,cy:b.y+b.h,r:6/scale,fill:'#fffefa',stroke:'#245c48','stroke-width':2/scale}));$('selection').append(handle);
}
function renderCatalog(){
 $('catalog').replaceChildren();$('catalog-count').textContent=assets().length+' '+(assets().length===1?'peça':'peças');
 for(const a of assets()){
  const card=document.createElement('div');card.className='piece';const img=document.createElement('img');img.src=a.dataUrl;img.alt='';const info=document.createElement('div'),name=document.createElement('strong'),button=document.createElement('button');name.textContent=a.name;button.textContent='Adicionar à planta';button.dataset.add=a.id;button.disabled=!ready;button.addEventListener('click',()=>addItem(a.id));info.append(name,button);card.append(img,info);$('catalog').append(card);
 }
}
function renderInspector(){
 const i=current();$('empty-selection').hidden=!!i;$('item-controls').hidden=!i;
 if(i){const a=assetFor(i.assetId),room=roomFor(i,geometry);$('item-name').textContent=a.name;$('item-room').textContent=room?.name||'Posição livre';$('size').value=i.width;$('size-value').textContent=Math.round(i.width)+'%';$('respect-walls').checked=i.respectWalls;}
 $('item-list').replaceChildren();
 if(!model.items.length){const p=document.createElement('p');p.className='hint';p.textContent='Suas peças aparecerão aqui.';$('item-list').append(p);}
 for(const item of model.items){const button=document.createElement('button');button.textContent=assetFor(item.assetId).name;button.dataset.select=item.id;button.setAttribute('aria-pressed',item.id===selected);button.addEventListener('click',()=>{selected=item.id;render();focusItem()});$('item-list').append(button);}
 $('count').textContent=model.items.length+' '+(model.items.length===1?'item na planta':'itens na planta');$('undo').disabled=!undo.length;$('redo').disabled=!redo.length;
}
function render(){renderObjects();renderInspector();}
function addItem(assetId){if(!ready)return;if(model.items.length>=LIMITS.items)return notify('Limite de 100 itens por projeto.');const i={id:newId('item'),assetId,x:750,y:1010,width:100,respectWalls:true};change(()=>{model.items.push(i);selected=i.id});if(innerWidth<850)focusItem();notify('Peça adicionada. Arraste para escolher a posição.');}
function focusItem(){const i=current();if(!i)return;view={cx:i.x,cy:i.y-20,zoom:3};updateView();if(innerWidth<850)$('viewport').scrollIntoView({block:'center',behavior:'instant'});}
function resize(width){const i=current();if(!i)return;change(()=>i.width=clamp(width,LIMITS.minWidth,LIMITS.maxWidth));}
function move(dx,dy){const i=current();if(!i)return;change(()=>{i.x=clamp(i.x+dx,0,1265);i.y=clamp(i.y+dy,0,1243)});}
function remove(){if(!current())return;change(()=>{model.items=model.items.filter(i=>i.id!==selected);selected=null});}
function history(direction){if(gesture)return;const from=direction==='undo'?undo:redo,to=direction==='undo'?redo:undo;if(!from.length)return;to.push(clone(model));model=clone(from.pop());if(!current())selected=null;loadTextures();renderCatalog();render();save();}
function stopGesture(cancel=false){if(!gesture)return;if(gesture.type!=='pan'){if(cancel)model=gesture.before;else commit(gesture.before);}gesture=null;svg.classList.remove('is-dragging');render();}
svg.addEventListener('focusin',event=>{const object=event.target.closest('[data-object-id]');if(object){selected=object.dataset.objectId;renderInspector();renderSelection();}});
svg.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){const object=event.target.closest('[data-object-id]');if(object){event.preventDefault();selected=object.dataset.objectId;renderInspector();renderSelection();}}});
svg.addEventListener('pointerdown',event=>{
 if(!ready||event.button>0)return;svg.setPointerCapture(event.pointerId);pointers.set(event.pointerId,[event.clientX,event.clientY]);
 if(pointers.size===2){stopGesture(true);const p=[...pointers.values()];pinch={distance:Math.hypot(p[0][0]-p[1][0],p[0][1]-p[1][1]),zoom:view.zoom};return;}
 if(pointers.size>1)return;const handle=event.target.closest('[data-resize]'),object=event.target.closest('[data-object-id]');
 if(object||handle){selected=object?.dataset.objectId||handle.dataset.resize;const item=current(),p=screenPoint(event.clientX,event.clientY);gesture={type:handle?'resize':'move',before:clone(model),start:p,item:{...item},distance:Math.hypot(p[0]-item.x,p[1]-item.y)};render();}
 else{selected=null;gesture={type:'pan',client:[event.clientX,event.clientY],view:{...view},scale:svg.getScreenCTM().a};render();}
 svg.classList.add('is-dragging');event.preventDefault();
});
svg.addEventListener('pointermove',event=>{
 if(!pointers.has(event.pointerId))return;pointers.set(event.pointerId,[event.clientX,event.clientY]);
 if(pinch&&pointers.size===2){const p=[...pointers.values()],distance=Math.hypot(p[0][0]-p[1][0],p[0][1]-p[1][1]);zoomTo(pinch.zoom*distance/Math.max(1,pinch.distance),[(p[0][0]+p[1][0])/2,(p[0][1]+p[1][1])/2]);return;}
 if(!gesture)return;
 if(gesture.type==='pan'){view.cx=gesture.view.cx-(event.clientX-gesture.client[0])/gesture.scale;view.cy=gesture.view.cy-(event.clientY-gesture.client[1])/gesture.scale;updateView();return;}
 const item=current(),p=screenPoint(event.clientX,event.clientY);if(!item)return;
 if(gesture.type==='move'){item.x=clamp(gesture.item.x+p[0]-gesture.start[0],0,1265);item.y=clamp(gesture.item.y+p[1]-gesture.start[1],0,1243);}else item.width=clamp(gesture.item.width*Math.hypot(p[0]-item.x,p[1]-item.y)/Math.max(1,gesture.distance),LIMITS.minWidth,LIMITS.maxWidth);
 renderObjects();renderInspector();
});
for(const type of ['pointerup','pointercancel','lostpointercapture'])svg.addEventListener(type,event=>{pointers.delete(event.pointerId);if(pinch){if(pointers.size<2)pinch=null;return;}stopGesture(type!=='pointerup');});
svg.addEventListener('wheel',event=>{event.preventDefault();zoomTo(view.zoom*Math.exp(-event.deltaY*.0015),[event.clientX,event.clientY]);},{passive:false});
$('undo').onclick=()=>history('undo');$('redo').onclick=()=>history('redo');$('zoom-in').onclick=()=>zoomTo(view.zoom*1.3);$('zoom-out').onclick=()=>zoomTo(view.zoom/1.3);$('fit').onclick=()=>{view={cx:632.5,cy:621.5,zoom:1};updateView()};
$('focus-item').onclick=focusItem;$('smaller').onclick=()=>resize(current().width-10);$('larger').onclick=()=>resize(current().width+10);$('remove').onclick=remove;
$('duplicate').onclick=()=>{const i=current();if(!i||model.items.length>=LIMITS.items)return;change(()=>{const n={...i,id:newId('item'),x:clamp(i.x+18,0,1265),y:clamp(i.y+18,0,1243)};model.items.push(n);selected=n.id});};
let sliderBefore=null;$('size').addEventListener('input',()=>{const i=current();if(!i)return;sliderBefore??=clone(model);i.width=Number($('size').value);renderObjects();$('size-value').textContent=i.width+'%';});$('size').addEventListener('change',()=>{if(sliderBefore){commit(sliderBefore);sliderBefore=null;}});
$('respect-walls').onchange=()=>{if(current())change(()=>current().respectWalls=$('respect-walls').checked)};
for(const b of document.querySelectorAll('[data-nudge]'))b.onclick=()=>move(...b.dataset.nudge.split(',').map(Number));
document.addEventListener('keydown',event=>{
 if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;
 if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'){event.preventDefault();history(event.shiftKey?'redo':'undo');return;}
 if(event.key==='Escape'){stopGesture(true);selected=null;render();return;}
 if(!current())return;const directions={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]};
 if(directions[event.key]){event.preventDefault();move(...directions[event.key].map(v=>v*(event.shiftKey?15:3)));}
 if(event.key==='Delete'||event.key==='Backspace'){event.preventDefault();remove();}
});
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}
$('download').onclick=()=>{download(new Blob([JSON.stringify(model,null,2)],{type:'application/json'}),'minha-casa-moveis.json');notify('Projeto baixado. Use Abrir projeto para continuar a edição.');};
function decodeImage(dataUrl){return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error('A imagem está danificada ou não é compatível.'));image.src=dataUrl});}
async function inspectImage(a){
 const image=await decodeImage(a.dataUrl),w=image.naturalWidth,h=image.naturalHeight;if(w!==a.width||h!==a.height||w>4096||h>4096)throw Error('As dimensões da peça não correspondem à imagem.');
 const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);const data=ctx.getImageData(0,0,w,h).data;let transparent=false,visible=false;for(let n=3;n<data.length;n+=4){if(data[n]<20)transparent=true;if(data[n]>100)visible=true;if(transparent&&visible)break;}if(!transparent||!visible)throw Error('Use uma peça visível com fundo transparente em PNG ou WebP.');
}
$('open').onclick=()=>$('project-file').click();$('project-file').onchange=async()=>{
 const file=$('project-file').files[0];$('project-file').value='';if(!file)return;
 try{if(file.size>LIMITS.projectBytes)throw Error('Projeto muito grande. Limite de 24 MB.');const next=validateFurniture(JSON.parse(await file.text()),builtins);for(const a of next.assets.filter(a=>!a.builtin))await inspectImage(a);const before=clone(model);model=next;selected=null;loadTextures();renderCatalog();commit(before);render();notify('Projeto aberto. Você pode continuar editando.');}
 catch(error){notify('Não foi possível abrir: '+(error instanceof SyntaxError?'JSON inválido.':error.message));}
};
$('import-image').onclick=()=>$('image-file').click();$('image-file').onchange=async()=>{
 const file=$('image-file').files[0];$('image-file').value='';if(!file)return;
 try{
  if(!['image/png','image/webp'].includes(file.type)||file.size>4000000)throw Error('Use PNG ou WebP de até 4 MB.');if(model.assets.length>=LIMITS.assets)throw Error('Limite de 24 peças na biblioteca.');
  const dataUrl=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('Não foi possível ler a imagem.'));reader.readAsDataURL(file)});
  if(model.assets.reduce((sum,a)=>sum+(a.dataUrl?.length||0),0)+dataUrl.length>LIMITS.projectBytes-100000)throw Error('A biblioteca atingiu o limite de imagens deste projeto.');
  const image=await decodeImage(dataUrl),a={id:newId('piece'),name:file.name.replace(/\.[^.]+$/,'').slice(0,80)||'Minha peça',dataUrl,width:image.naturalWidth,height:image.naturalHeight,anchor:[.5,.75]};await inspectImage(a);
  const before=clone(model);model.assets.push(a);loadTextures();renderCatalog();commit(before);notify('Peça adicionada à biblioteca. Toque em Adicionar à planta para posicioná-la.');
 }catch(error){notify(error.message);}
};
$('export-image').onclick=async()=>{
 const button=$('export-image');button.disabled=true;
 try{const clone=svg.cloneNode(true);clone.querySelector('#selection').remove();for(const n of clone.querySelectorAll('[data-hit]'))n.remove();clone.setAttribute('viewBox','0 0 1265 1243');clone.setAttribute('width','1265');clone.setAttribute('height','1243');clone.removeAttribute('class');const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)],{type:'image/svg+xml'}));
  try{const image=await decodeImage(url),canvas=document.createElement('canvas');canvas.width=1265;canvas.height=1243;canvas.getContext('2d').drawImage(image,0,0);const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('Falha ao gerar imagem.');download(blob,'minha-casa-mobiliada.png');notify('Imagem exportada. Baixe também o projeto para conservar a edição.');}finally{URL.revokeObjectURL(url);}
 }catch(error){notify('Não foi possível exportar: '+error.message);}finally{button.disabled=false;}
};
window.addEventListener('resize',renderSelection);
window.__furnitureEditor={snapshot:()=>copy(model),whenSaved:()=>saveQueue,view:()=>({...view}),ready:()=>ready};
for(const id of ['open','import-image','download','export-image'])$(id).disabled=true;
loadTextures();renderCatalog();render();updateView();
try{db=await openStore();const draft=await readDraft();if(draft){const next=validateFurniture(draft,builtins);for(const a of next.assets.filter(a=>!a.builtin))await inspectImage(a);model=next;loadTextures();renderCatalog();render();$('save-status').textContent='Projeto recuperado deste navegador';}else $('save-status').textContent='Pronto para adicionar suas peças';}
catch{storageWarning();$('save-status').textContent='Edição só nesta aba · baixe o projeto';}
ready=true;for(const id of ['open','import-image','download','export-image'])$(id).disabled=false;renderCatalog();render();
