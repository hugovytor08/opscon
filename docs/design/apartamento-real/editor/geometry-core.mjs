export const IDS=['vis-q1','vis-q2','vis-q3','vis-banho','vis-sala','vis-cozinha','vis-servico','vis-circulacao'];
export const clone=value=>JSON.parse(JSON.stringify(value));
export function bounds(points){return [Math.min(...points.map(p=>p[0])),Math.min(...points.map(p=>p[1])),Math.max(...points.map(p=>p[0])),Math.max(...points.map(p=>p[1]))];}
export function polygonArea(p){return Math.abs(p.reduce((a,v,i)=>{const n=p[(i+1)%p.length];return a+v[0]*n[1]-n[0]*v[1]},0)/2);}
export function onSegment(p,a,b){return Math.abs((p[0]-a[0])*(b[1]-a[1])-(p[1]-a[1])*(b[0]-a[0]))<1e-5&&p[0]>=Math.min(a[0],b[0])-1e-5&&p[0]<=Math.max(a[0],b[0])+1e-5&&p[1]>=Math.min(a[1],b[1])-1e-5&&p[1]<=Math.max(a[1],b[1])+1e-5;}
export function boundary(p,poly){return poly.some((a,i)=>onSegment(p,a,poly[(i+1)%poly.length]));}
export function inside(p,poly){if(boundary(p,poly))return true;let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
const point=p=>Array.isArray(p)&&p.length===2&&p.every(v=>Number.isFinite(v)&&Math.abs(v)<20000);
function polygon(p){return Array.isArray(p)&&p.length>=4&&p.length<=80&&p.every(point)&&polygonArea(p)>1&&p.every((a,i)=>{const b=p[(i+1)%p.length];return a[0]===b[0]||a[1]===b[1]});}
export function validate(model){
 if(!model||model.schemaVersion!==1||!Array.isArray(model.rooms)||model.rooms.length!==8||!Array.isArray(model.walls)||model.walls.length>100||!Array.isArray(model.openings)||model.openings.length>100||(model.fixedElements??[]).length>150||(model.contextFurniture??[]).length>150)throw Error('Abra um projeto JSON deste apartamento, com os oito ambientes.');
 if(new Set(model.rooms.map(r=>r.id)).size!==8||!IDS.every(id=>model.rooms.some(r=>r.id===id)))throw Error('Os IDs dos oito ambientes precisam ser preservados.');
 if(!polygon(model.perimeter)||!model.rooms.every(r=>polygon(r.polygon)&&point(r.labelAnchor)&&inside(r.labelAnchor,r.polygon)&&typeof r.name==='string'&&r.name.length>0&&r.name.length<=80&&r.appRoomId==null))throw Error('Há um ambiente inválido ou um vínculo de dados que não pertence ao editor.');
 const area=polygonArea(model.perimeter),sum=model.rooms.reduce((a,r)=>a+polygonArea(r.polygon),0);
 if(Math.abs(area-sum)>Math.max(1,area*.00001))throw Error('O perímetro e os ambientes precisam fechar sem lacunas.');
 // Grade deslocada e centrada: detecta lacunas/sobreposições também nas faixas menores.
 const xs=[...new Set(model.rooms.flatMap(r=>r.polygon.map(p=>p[0])))].sort((a,b)=>a-b),ys=[...new Set(model.rooms.flatMap(r=>r.polygon.map(p=>p[1])))].sort((a,b)=>a-b);
 for(let x=1;x<xs.length;x++)for(let y=1;y<ys.length;y++){
  const p=[(xs[x-1]+xs[x])/2,(ys[y-1]+ys[y])/2];const count=model.rooms.filter(r=>inside(p,r.polygon)&&!boundary(p,r.polygon)).length;
  if(count!==(inside(p,model.perimeter)?1:0))throw Error('Um ajuste deixou ambientes sobrepostos ou um espaço sem fechamento.');
 }
 if(!model.walls.every(w=>/^[\w-]{1,100}$/.test(w.id)&&point(w.a)&&point(w.b)&&Number.isFinite(w.thickness)&&w.thickness>0&&w.thickness<100&&Number.isFinite(w.renderHeight)&&w.renderHeight>0&&w.renderHeight<500))throw Error('Há uma parede inválida.');
 for(const o of model.openings){
  if(!/^[\w-]{1,100}$/.test(o.id)||!point(o.a)||!point(o.b)||!['door','window','passage','open_connection'].includes(o.kind)||!Array.isArray(o.connects))throw Error('Há uma abertura inválida.');
  if(o.wallId){const w=model.walls.find(w=>w.id===o.wallId);if(!w||!onSegment(o.a,w.a,w.b)||!onSegment(o.b,w.a,w.b))throw Error('Uma abertura saiu da parede correspondente.');}
  for(const id of o.connects){if(id==='exterior')continue;const r=model.rooms.find(r=>r.id===id);if(!r||!boundary(o.a,r.polygon)||!boundary(o.b,r.polygon))throw Error('Uma abertura perdeu a ligação com o ambiente.');}
  if(o.swing&&(!point(o.swing.hinge)||!point(o.swing.openEnd)))throw Error('Uma porta tem posição inválida.');
 }
 for(const item of [...(model.fixedElements??[]),...(model.contextFurniture??[])]){
  const r=model.rooms.find(r=>r.id===item.roomId);if(!r||!polygon(item.polygon)||!item.polygon.every(p=>inside(p,r.polygon))||!Number.isFinite(item.height)||item.height<0||item.height>500||!/^[\w-]{1,100}$/.test(item.id)||typeof item.kind!=='string')throw Error('Um elemento saiu de seu cômodo ou contém dados inválidos.');
 }
 const p=model.projection;if(!p||!Array.isArray(p.matrix)||p.matrix.length!==2||!p.matrix.every(row=>row.length===3&&row.every(Number.isFinite))||!point(p.translation)||Math.abs(p.matrix[0][0]*p.matrix[1][1]-p.matrix[0][1]*p.matrix[1][0])<.01)throw Error('A projeção é inválida.');
 if(!model.coordinateSystem||model.coordinateSystem.scaleToMeters!==null)throw Error('Este editor utiliza proporções relativas, sem calibrar metros automaticamente.');
 return model;
}
export function gridLines(model,axis){return [...new Set(model.rooms.flatMap(r=>r.polygon.map(p=>p[axis])))].sort((a,b)=>a-b);}
export function lineLimit(model,axis,at){const lines=gridLines(model,axis),i=lines.findIndex(v=>Math.abs(v-at)<1e-5);if(i<0)throw Error('Selecione um canto ou uma parede do ambiente.');return [i>0?lines[i-1]+28:Math.max(-10000,at-3000),i<lines.length-1?lines[i+1]-28:Math.min(10000,at+3000)];}
function transformPoints(model,mapper){
 for(const r of model.rooms){r.polygon=r.polygon.map(mapper);r.labelAnchor=mapper(r.labelAnchor);}
 model.perimeter=model.perimeter.map(mapper);
 for(const w of model.walls){w.a=mapper(w.a);w.b=mapper(w.b);}
 for(const o of model.openings){
  const original=o.swing?o.swing.openEnd.map((v,i)=>v-o.swing.hinge[i]):null;o.a=mapper(o.a);o.b=mapper(o.b);
  if(o.swing){o.swing.hinge=mapper(o.swing.hinge);const len=Math.hypot(o.a[0]-o.b[0],o.a[1]-o.b[1]),ol=Math.hypot(...original);o.swing.openEnd=o.swing.hinge.map((v,i)=>v+original[i]/ol*len);}
 }
 for(const item of [...(model.fixedElements??[]),...(model.contextFurniture??[])])item.polygon=item.polygon.map(mapper);
}
export function moveLine(model,axis,at,target){
 const limits=lineLimit(model,axis,at),to=Math.max(limits[0],Math.min(limits[1],target));const lines=gridLines(model,axis),i=lines.indexOf(at),previous=lines[i-1],next=lines[i+1];const result=clone(model);
 if(Math.abs(to-at)<.00001)return {model:result,limited:Math.abs(to-target)>.001,to};
 const map=value=>{if(Math.abs(value-at)<1e-6)return to;if(previous!=null&&value>previous&&value<at)return previous+(value-previous)*(to-previous)/(at-previous);if(next!=null&&value>at&&value<next)return to+(value-at)*(next-to)/(next-at);if(previous==null&&value<at)return value+(to-at);if(next==null&&value>at)return value+(to-at);return value;};
 transformPoints(result,p=>p.map((v,index)=>index===axis?Math.round(map(v)*10000)/10000:v));
 result.artifactStatus='editado_para_revisao';result.editor={...result.editor,geometryAdjusted:true};
 return {model:result,limited:Math.abs(to-target)>.001,to};
}
export function changeDimension(model,baseline,roomId,axis,percent){
 if(!Number.isFinite(percent)||percent<=0||percent>500)throw Error('Use uma proporção maior que zero, até 500%.');
 const room=model.rooms.find(r=>r.id===roomId),base=baseline.rooms.find(r=>r.id===roomId),b=bounds(room.polygon),original=bounds(base.polygon);return moveLine(model,axis,b[axis+2],b[axis]+(original[axis+2]-original[axis])*percent/100);
}
export function regions(model){return {schemaVersion:1,svg:'casa-isometrica.svg',viewBox:isoViewBox(model),projection:{...clone(model.projection),viewBox:isoViewBox(model)},coordinateSystem:'coordenadas SVG; geometria relativa editada pelo usuário',regions:model.rooms.map(r=>({id:r.id,name:r.name,number:r.number,appRoomId:null,svgGroupId:'iso-'+r.id,polygon:r.polygon.map(p=>project(model,p)),labelPosition:project(model,r.labelAnchor),labelPosition2d:r.labelAnchor,accessibleName:'Selecionar '+r.name,geometryStatus:'estimado'}))};}
export function project(model,p,z=0){const m=model.projection.matrix,t=model.projection.translation;return [m[0][0]*p[0]+m[0][1]*p[1]+m[0][2]*z+t[0],m[1][0]*p[0]+m[1][1]*p[1]+m[1][2]*z+t[1]].map(v=>Math.round(v*1000)/1000);}
export function planViewBox(model){const [x,y,a,b]=bounds(model.perimeter);return [x-55,y-55,a-x+110,b-y+110];}
export function isoViewBox(model){const [x,y,a,b]=bounds(model.perimeter.flatMap(p=>[project(model,p),project(model,p,Math.max(...model.walls.map(w=>w.renderHeight),80))]));return [x-45,y-30,a-x+90,b-y+95];}
export const escapeXML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const pts=p=>p.map(v=>v.join(',')).join(' ');
const poly=(p,fill,stroke='#a5ada2',extra='')=>`<polygon points="${pts(p)}" fill="${fill}" stroke="${stroke}" stroke-width="1.5" ${extra}/>`;
const line=(a,b,color='#173e31',width=2,extra='')=>`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${color}" stroke-width="${width}" ${extra}/>`;
function wallParts(model,w){
 const d=w.b.map((v,i)=>v-w.a[i]),length=d[0]*d[0]+d[1]*d[1],t=p=>p.reduce((a,v,i)=>a+(v-w.a[i])*d[i],0)/length;let cursor=0,out=[];
 const cuts=model.openings.filter(o=>o.wallId===w.id).map(o=>[Math.min(t(o.a),t(o.b)),Math.max(t(o.a),t(o.b))]).sort((a,b)=>a[0]-b[0]);
 for(const [start,end]of cuts){if(start>cursor)out.push([cursor,start]);cursor=Math.max(cursor,end);}if(cursor<1)out.push([cursor,1]);return out.map(([u,v])=>[w.a.map((n,i)=>n+u*d[i]),w.a.map((n,i)=>n+v*d[i])]);
}
function wallFootprint(a,b,t){const dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy),nx=-dy/len*t/2,ny=dx/len*t/2;return [[a[0]+nx,a[1]+ny],[b[0]+nx,b[1]+ny],[b[0]-nx,b[1]-ny],[a[0]-nx,a[1]-ny]];}
function prism(model,p,h,color,top=color){const sides=p.map((a,i)=>{const b=p[(i+1)%p.length];return {depth:a[0]+a[1]+b[0]+b[1],shape:poly([project(model,a),project(model,b),project(model,b,h),project(model,a,h)],color)}}).sort((a,b)=>a.depth-b.depth).map(v=>v.shape).join('');return sides+poly(p.map(v=>project(model,v,h)),top);}
function svgShell(title,viewBox,body,prefix){return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox.join(' ')}" role="img" aria-labelledby="${prefix}-title ${prefix}-description"><title id="${prefix}-title">${escapeXML(title)}</title><desc id="${prefix}-description">Apartamento em coordenadas relativas, editável. Medidas e proporções estimadas; rótulos externos correspondem aos IDs visuais.</desc><style>.room.is-selected .room-surface{fill:#c1d8c7;stroke:#245c48;stroke-width:6;stroke-dasharray:13 6}</style>${body}</svg>`;}
export function renderPlan(model,{selected='',handles=false,viewBox=null}={}){
 let out=model.rooms.map(r=>`<g id="plan-${r.id}" class="room ${selected===r.id?'is-selected':''}" data-room-id="${r.id}"><title>${escapeXML(r.name)}</title>${poly(r.polygon,r.id==='vis-circulacao'?'#e5ebdf':'#fffefa','#a5ada2','class="room-surface"')}</g>`).join('');
 out+='<g pointer-events="none">'+model.walls.flatMap(w=>wallParts(model,w).map(([a,b])=>line(a,b,'#173e31',w.thickness,'stroke-linecap="square"'))).join('');
 for(const o of model.openings){if(o.kind==='window')out+=line(o.a,o.b,'#6a8d7c',8)+line(o.a,o.b,'#fffefa',2);if(o.swing){const h=o.swing.hinge,e=o.swing.openEnd,c=o.a[0]===h[0]&&o.a[1]===h[1]?o.b:o.a,rad=Math.hypot(h[0]-e[0],h[1]-e[1]);out+=line(h,e,'#78917f',3)+`<path d="M${c.join(',')} A${rad},${rad} 0 0 1 ${e.join(',')}" fill="none" stroke="#78917f" stroke-width="2" stroke-dasharray="7 5"/>`;}}
 out+=model.rooms.map(r=>{const [x,y]=r.labelAnchor;return `<circle cx="${x}" cy="${y}" r="25" fill="#fffefa" stroke="#587762" stroke-width="2"/><text x="${x}" y="${y+11}" text-anchor="middle" fill="#173e31" font-family="Arial,sans-serif" font-size="34">${r.number}</text>`}).join('')+'</g>';
 if(handles&&selected){const room=model.rooms.find(r=>r.id===selected);out+='<g class="handles">';room.polygon.forEach((a,i)=>{const b=room.polygon[(i+1)%room.polygon.length],axis=a[0]===b[0]?0:1,pos=[(a[0]+b[0])/2,(a[1]+b[1])/2];out+=`<g data-handle="wall" data-axis="${axis}" data-at="${a[axis]}" aria-hidden="true" style="cursor:${axis===0?'ew':'ns'}-resize"><circle cx="${pos[0]}" cy="${pos[1]}" r="64" fill="transparent"/><circle cx="${pos[0]}" cy="${pos[1]}" r="18" fill="#245c48" stroke="#fffefa" stroke-width="5"/></g>`;});room.polygon.forEach((p,i)=>out+=`<g data-handle="corner" data-index="${i}" style="cursor:move" aria-hidden="true"><circle cx="${p[0]}" cy="${p[1]}" r="64" fill="transparent"/><rect x="${p[0]-17}" y="${p[1]-17}" width="34" height="34" rx="8" fill="#fffefa" stroke="#245c48" stroke-width="5"/></g>`);out+='</g>';}
 return svgShell('Planta superior do apartamento',viewBox??planViewBox(model),out,'plan-map');
}
export function renderIso(model,{selected='',furniture=true}={}){
 let out='<defs><pattern id="tile" width="55" height="55" patternUnits="userSpaceOnUse"><path d="M55 0H0V55" fill="none" stroke="#c4cbc3" stroke-width="1.2"/></pattern></defs>';
 out+='<g id="iso-base">'+poly(model.perimeter.map(p=>project(model,p,-10)),'#deded4')+'</g><g id="iso-ambientes">';
 const m=model.projection.matrix,t=model.projection.translation;
 for(const r of model.rooms)out+=`<g id="iso-${r.id}" class="room ${selected===r.id?'is-selected':''}" data-room-id="${r.id}"><title>${escapeXML(r.name)}</title>${poly(r.polygon.map(p=>project(model,p)),r.id==='vis-circulacao'?'#e5ebdf':'#f7f7f0','#a5ada2','class="room-surface"')}</g><polygon points="${pts(r.polygon)}" transform="matrix(${m[0][0]} ${m[1][0]} ${m[0][1]} ${m[1][1]} ${t[0]} ${t[1]})" fill="url(#tile)" pointer-events="none"/>`;
 out+='</g><g id="iso-estrutura" pointer-events="none">'+model.walls.flatMap(w=>wallParts(model,w).map(([a,b])=>({depth:a[0]+a[1]+b[0]+b[1],shape:prism(model,wallFootprint(a,b,w.thickness),w.renderHeight,'#deded2','#fffefa')}))).sort((a,b)=>a.depth-b.depth).map(v=>v.shape).join('');
 for(const o of model.openings)if(o.kind==='window')out+=poly([project(model,o.a,9),project(model,o.b,9),project(model,o.b,42),project(model,o.a,42)],'#c7dad5','#497762','fill-opacity=".5"');out+='</g>';
 function contents(items,id){let text=`<g id="${id}" pointer-events="none">`;for(const obj of [...items].sort((a,b)=>a.polygon.flat().reduce((a,b)=>a+b,0)-b.polygon.flat().reduce((a,b)=>a+b,0))){const color=({counter:'#384139',sofa:'#43543d',desk:'#786552',cabinet:'#51554e',stove:'#454c47',fridge:'#f6f5ec',mattress:'#dce0d6',chair:'#3c4a43','stored-stools':'#4c554c',rug:'#706757','round-table':'#e1ddc8'})[obj.kind]??'#fffefa';let shape;if(obj.kind==='electric-shower')shape=poly(obj.polygon.map(p=>project(model,p,obj.height)),color);else if(obj.kind==='shower-screen'){const a=obj.polygon[0],b=obj.polygon[1];shape=poly(obj.polygon.map(p=>project(model,p)),'#e5eee9')+poly([project(model,a),project(model,b),project(model,b,obj.height),project(model,a,obj.height)],'#bfdbd0','#5d8473','fill-opacity=".28"');}else shape=prism(model,obj.polygon,obj.height,color);text+=`<g id="iso-${obj.id}"><title>${escapeXML(obj.kind)} · dimensão estimada</title>${shape}</g>`;}return text+'</g>';}
 out+=contents(model.fixedElements??[],'iso-elementos-fixos');out+=contents(model.contextFurniture??[],'iso-mobiliario-contextual').replace('<g id="iso-mobiliario-contextual"',`<g style="display:${furniture?'inline':'none'}" id="iso-mobiliario-contextual"`);
 return svgShell('Isometria do apartamento editado',isoViewBox(model),out,'iso-map');
}
