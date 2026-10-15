import {clone,validate,bounds,changeDimension,moveLine,planViewBox,renderPlan,renderIso,regions,escapeXML} from './geometry-core.mjs';
const STORAGE_KEY='casa-serena-plan-editor-v1';
const $=id=>document.getElementById(id);
const baseline=validate(JSON.parse($('baseline-model').textContent));
let model=clone(baseline),selected='vis-sala',undo=[],redo=[],zoom=1,drag=null;
const mobileQuery=matchMedia('(max-width:700px)');$('more-options').open=!mobileQuery.matches;mobileQuery.addEventListener('change',e=>$('more-options').open=!e.matches);
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function tell(message){$('message').textContent=message;$('message').hidden=false;}
function storageWarning(message){$('storage-alert').textContent=message;$('storage-alert').hidden=false;$('save-status').textContent='Alterações só nesta aba; baixe o projeto';}
try{
 const raw=localStorage.getItem(STORAGE_KEY);
 if(raw){if(raw.length>2500000)throw Error('Rascunho grande demais');const saved=JSON.parse(raw);model=validate(saved.model);if(model.rooms.some(r=>r.id===saved.selected))selected=saved.selected;undo=(saved.undo??[]).slice(-30).map(validate);redo=(saved.redo??[]).slice(-30).map(validate);$('save-status').textContent='Rascunho recuperado neste navegador';}
}catch{model=clone(baseline);undo=[];redo=[];storageWarning('O rascunho salvo não pôde ser aberto. Você pode abrir uma cópia JSON ou baixar a versão desta aba.');}
function save(){
 try{localStorage.setItem(STORAGE_KEY,JSON.stringify({version:1,model,selected,undo:undo.slice(-30),redo:redo.slice(-30)}));$('storage-alert').hidden=true;$('save-status').textContent='Salvo neste navegador · '+new Intl.DateTimeFormat('pt-BR',{hour:'2-digit',minute:'2-digit',timeZone:'America/Sao_Paulo'}).format(new Date());}
 catch{storageWarning('Não foi possível salvar neste navegador. Suas alterações continuam nesta aba; use “Baixar projeto” para guardá-las.');}
}
function commit(before,notice=''){
 try{validate(model);}catch(error){model=before;render();tell(error.message);return false;}
 if(!same(before,model)){undo.push(clone(before));undo=undo.slice(-30);redo=[];model.editor={...model.editor,version:1,editedBy:'usuario',editedAt:new Date().toISOString()};save();}
 render();if(notice)tell(notice);return true;
}
function selectRoom(id){if(!model.rooms.some(r=>r.id===id))return;selected=id;render();save();}
function proportions(axis){const room=model.rooms.find(r=>r.id===selected),original=baseline.rooms.find(r=>r.id===selected),b=bounds(room.polygon),a=bounds(original.polygon);return (b[axis+2]-b[axis])/(a[axis+2]-a[axis])*100;}
function draw(){
 $('plan-viewport').innerHTML=renderPlan(model,{selected,handles:true,viewBox:drag?.viewBox});
 $('iso-viewport').innerHTML=renderIso(model,{selected,furniture:$('show-furniture').checked});
 for(const id of ['plan-viewport','iso-viewport'])$(id).querySelector('svg').style.width=(zoom*100)+'%';
 $('plan-viewport').classList.toggle('is-zoomed',zoom>1);
 $('zoom-value').textContent=Math.round(zoom*100)+'%';
}
function render(){
 const room=model.rooms.find(r=>r.id===selected);
 $('selected-title').textContent=room.name;$('room-name').value=room.name;$('paper-area').textContent=new Intl.NumberFormat('pt-BR',{minimumFractionDigits:2}).format(room.declaredArea?.value??0)+' m²';
 $('room-select').innerHTML=model.rooms.map(r=>`<option value="${r.id}" ${r.id===selected?'selected':''}>${r.number}. ${escapeXML(r.name)}</option>`).join('');
 $('room-list').innerHTML=model.rooms.map(r=>`<button type="button" data-room="${r.id}" aria-pressed="${r.id===selected}"><b>${r.number}</b>${escapeXML(r.name)}</button>`).join('');
 $('room-width').value=proportions(0).toFixed(1);$('room-depth').value=proportions(1).toFixed(1);$('undo').disabled=undo.length===0;$('redo').disabled=redo.length===0;draw();
}
function resizeRoom(axis,percent){const before=clone(model);try{const result=changeDimension(model,baseline,selected,axis,percent);model=result.model;commit(before,result.limited?'A parede chegou ao limite do ambiente vizinho. Ajuste a parede vizinha primeiro, se precisar ampliar mais.':'Proporção ajustada. Os ambientes vizinhos acompanharam a parede compartilhada.');}catch(error){tell(error.message);render();}}
function pointerPoint(event){const svg=$('plan-viewport').querySelector('svg'),p=new DOMPoint(event.clientX,event.clientY);return p.matrixTransform(svg.getScreenCTM().inverse());}
const viewport=$('plan-viewport');
viewport.addEventListener('pointerdown',event=>{
 if(event.button!==0||drag)return;const handle=event.target.closest('[data-handle]');
 if(!handle){const room=event.target.closest('.room[data-room-id]');if(zoom>1){event.preventDefault();drag={kind:'pan',pointerId:event.pointerId,client:[event.clientX,event.clientY],scroll:[viewport.scrollLeft,viewport.scrollTop],roomId:room?.dataset.roomId,moved:false};viewport.setPointerCapture(event.pointerId);}else if(room)selectRoom(room.dataset.roomId);return;}
 event.preventDefault();const start=pointerPoint(event),before=clone(model),room=model.rooms.find(r=>r.id===selected);
 drag={before,start,viewBox:planViewBox(model),pointerId:event.pointerId,kind:handle.dataset.handle,axis:Number(handle.dataset.axis),at:Number(handle.dataset.at),corner:room.polygon[Number(handle.dataset.index)],moved:false,limited:false};
 viewport.setPointerCapture(event.pointerId);$('message').hidden=true;
});
viewport.addEventListener('pointermove',event=>{
 if(!drag||drag.pointerId!==event.pointerId)return;event.preventDefault();
 if(drag.kind==='pan'){const dx=event.clientX-drag.client[0],dy=event.clientY-drag.client[1];viewport.scrollLeft=drag.scroll[0]-dx;viewport.scrollTop=drag.scroll[1]-dy;if(Math.abs(dx)+Math.abs(dy)>4)drag.moved=true;return;}
 const p=pointerPoint(event),dx=p.x-drag.start.x,dy=p.y-drag.start.y;if(Math.abs(dx)+Math.abs(dy)<.01)return;
 try{
  if(drag.kind==='wall'){const result=moveLine(drag.before,drag.axis,drag.at,drag.at+(drag.axis===0?dx:dy));model=result.model;drag.limited=result.limited;}
  else{const first=moveLine(drag.before,0,drag.corner[0],drag.corner[0]+dx);const second=moveLine(first.model,1,drag.corner[1],drag.corner[1]+dy);model=second.model;drag.limited=first.limited||second.limited;}
  drag.moved=true;draw();$('room-width').value=proportions(0).toFixed(1);$('room-depth').value=proportions(1).toFixed(1);
 }catch(error){tell(error.message);}
});
function finishDrag(event,cancel=false){if(!drag||event.pointerId!==drag.pointerId)return;const old=drag;drag=null;if(viewport.hasPointerCapture(event.pointerId))viewport.releasePointerCapture(event.pointerId);if(old.kind==='pan'){if(!old.moved&&old.roomId&&!cancel)selectRoom(old.roomId);return;}if(cancel){model=old.before;render();return;}if(old.moved)commit(old.before,old.limited?'O ajuste parou antes de cruzar a parede vizinha.':'Parede ajustada.');else render();}
viewport.addEventListener('pointerup',event=>finishDrag(event));viewport.addEventListener('pointercancel',event=>finishDrag(event,true));
$('room-select').onchange=e=>selectRoom(e.target.value);
$('room-list').onclick=e=>{const b=e.target.closest('[data-room]');if(b)selectRoom(b.dataset.room);};
$('room-name').onchange=e=>{const name=e.target.value.trim();if(!name){tell('Dê um nome ao ambiente.');render();return;}const before=clone(model);model.rooms.find(r=>r.id===selected).name=name;commit(before,'Nome atualizado só neste projeto da planta.');};
$('room-width').onchange=e=>resizeRoom(0,Number(e.target.value));$('room-depth').onchange=e=>resizeRoom(1,Number(e.target.value));
document.querySelector('.quick-actions').onclick=e=>{const b=e.target.closest('[data-size-axis]');if(b)resizeRoom(Number(b.dataset.sizeAxis),proportions(Number(b.dataset.sizeAxis))+Number(b.dataset.delta));};
$('undo').onclick=()=>{if(!undo.length)return;redo.push(clone(model));model=undo.pop();save();render();tell('Último ajuste desfeito.');};
$('redo').onclick=()=>{if(!redo.length)return;undo.push(clone(model));model=redo.pop();save();render();tell('Ajuste refeito.');};
$('reset-project').onclick=()=>{const before=clone(model);model=clone(baseline);commit(before,'Planta inicial restaurada. Você pode desfazer esta ação.');};
function setZoom(value){zoom=Math.max(1,Math.min(3,value));draw();}
$('zoom-in').onclick=()=>setZoom(zoom+.25);$('zoom-out').onclick=()=>setZoom(zoom-.25);$('zoom-fit').onclick=()=>setZoom(1);$('show-furniture').onchange=draw;
function switchView(view){document.querySelector('.stage').dataset.view=view;for(const type of ['plan','iso']){$('tab-'+type).setAttribute('aria-selected',String(view===type));$('tab-'+type).tabIndex=view===type?0:-1;}}
for(const view of ['plan','iso']){$('tab-'+view).onclick=()=>switchView(view);$('tab-'+view).onkeydown=e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();const other=view==='plan'?'iso':'plan';switchView(other);$('tab-'+other).focus();}};}
switchView('plan');
function download(name,data,type){const blob=new Blob([data],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);}
function exportedModel(){const copy=clone(model);copy.projection.viewBox=regions(copy).viewBox;copy.representedState.contextVisibleByDefault=$('show-furniture').checked;return copy;}
$('export-project').onclick=()=>{download('minha-planta.json',JSON.stringify(exportedModel(),null,2),'application/json');tell('Projeto baixado. Você pode reabrir esse JSON neste editor.');};
$('download-original').onclick=e=>{e.preventDefault();download('planta-inicial.json',JSON.stringify(baseline,null,2),'application/json');};
$('export-drawings').onclick=()=>$('export-dialog').showModal();$('close-export').onclick=()=>$('export-dialog').close();
document.querySelector('.export-options').onclick=e=>{const b=e.target.closest('[data-export]');if(!b)return;const kind=b.dataset.export;if(kind==='plan')download('planta-2d.svg',renderPlan(model),'image/svg+xml');if(kind==='iso')download('casa-isometrica.svg',renderIso(model,{furniture:$('show-furniture').checked}),'image/svg+xml');if(kind==='regions')download('areas-interativas.json',JSON.stringify(regions(model),null,2),'application/json');$('export-dialog').close();tell('Arquivo exportado da versão atual.');};
$('import-project').onclick=()=>$('project-file').click();
$('project-file').onchange=async event=>{const file=event.target.files[0];if(!file)return;try{if(file.size>2000000)throw Error('Use um projeto de até 2 MB.');const imported=validate(JSON.parse(await file.text()));const before=clone(model);model=clone(imported);commit(before,'Projeto aberto. Seus IDs visuais foram preservados.');}catch(error){tell('Não foi possível abrir o arquivo: '+error.message+' A planta atual foi preservada.');}finally{event.target.value='';}};
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'&&!['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)){e.preventDefault();$(e.shiftKey?'redo':'undo').click();}});
window.__plantEditor={snapshot:()=>clone(model),storageKey:STORAGE_KEY};
render();
