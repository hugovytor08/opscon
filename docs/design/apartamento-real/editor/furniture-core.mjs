export const FORMAT='casa-serena-furniture-project';
export const BASE_ID='apartamento-v2-8cff27b8892a';
export const LIMITS={assets:24,items:100,projectBytes:24000000,assetChars:5600000,minWidth:28,maxWidth:600};
export const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
export const copy=v=>JSON.parse(JSON.stringify(v));
export function validateFurniture(value,builtins){
 if(!value||value.format!==FORMAT||value.version!==1||value.baseId!==BASE_ID)throw Error('Este arquivo não é um projeto de móveis desta planta.');
 if(!Array.isArray(value.assets)||!Array.isArray(value.items)||value.assets.length>LIMITS.assets||value.items.length>LIMITS.items)throw Error('O projeto ultrapassa o limite de peças.');
 const assets=[],ids=new Set();let totalImageChars=0;
 for(const a of value.assets){
  if(!a||typeof a.id!=='string'||!/^[a-zA-Z0-9_-]{1,90}$/.test(a.id)||ids.has(a.id))throw Error('Identificação de peça inválida ou repetida.');
  ids.add(a.id);
  if(builtins.some(b=>b.id===a.id)){assets.push({id:a.id,builtin:true});continue;}
  if(typeof a.name!=='string'||!a.name.trim()||a.name.length>80||typeof a.dataUrl!=='string'||a.dataUrl.length>LIMITS.assetChars||!/^data:image\/(png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(a.dataUrl))throw Error('Use peças em PNG ou WebP, sem links externos.');
  if(!Number.isInteger(a.width)||!Number.isInteger(a.height)||a.width<1||a.height<1||a.width>4096||a.height>4096)throw Error('Imagem com dimensões inválidas.');
  totalImageChars+=a.dataUrl.length;if(totalImageChars>LIMITS.projectBytes-100000)throw Error('As imagens ultrapassam o limite do projeto.');
  assets.push({id:a.id,name:a.name.trim(),dataUrl:a.dataUrl,width:a.width,height:a.height,anchor:[.5,.75]});
 }
 const itemIds=new Set();
 const items=value.items.map(i=>{
  if(!i||typeof i.id!=='string'||!/^[a-zA-Z0-9_-]{1,90}$/.test(i.id)||itemIds.has(i.id)||!ids.has(i.assetId))throw Error('Objeto inválido ou peça ausente no projeto.');
  itemIds.add(i.id);
  if(![i.x,i.y,i.width].every(Number.isFinite)||i.x<0||i.x>1265||i.y<0||i.y>1243||i.width<LIMITS.minWidth||i.width>LIMITS.maxWidth)throw Error('Posição ou tamanho fora dos limites.');
  return {id:i.id,assetId:i.assetId,x:i.x,y:i.y,width:i.width,respectWalls:i.respectWalls!==false};
 });
 return {format:FORMAT,version:1,baseId:BASE_ID,assets,items};
}
export function initialFurniture(builtins){return {format:FORMAT,version:1,baseId:BASE_ID,assets:builtins.map(a=>({id:a.id,builtin:true})),items:[]};}
// Registro aproximado da vista do guia no raster aprovado. Não é escala métrica.
export const projectPoint=([x,y,z=0])=>[302+.90125*(x-46)-.38754*(y-37),27+.32602*(x-46)+.78116*(y-37)+.46*(290-z)];
export function floorPoint([px,py]){
 const a=px-302,b=py-27-.46*290,d=.90125*.78116+.38754*.32602;
 return [46+(a*.78116+.38754*b)/d,37+(.90125*b-.32602*a)/d];
}
export function pointInPolygon([x,y],ps){let inside=false;for(let i=0,j=ps.length-1;i<ps.length;j=i++){const [xi,yi]=ps[i],[xj,yj]=ps[j];if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)inside=!inside;}return inside;}
export function roomFor(item,geometry){const point=floorPoint([item.x,item.y]);return geometry.rooms.find(r=>pointInPolygon(point,r.polygon))||null;}
export function itemBox(item,asset){const h=item.width*asset.height/asset.width;return {x:item.x-item.width*asset.anchor[0],y:item.y-h*asset.anchor[1],w:item.width,h};}
// Contornos conservadores traçados no PNG aprovado. O guia gerativo não coincide
// pixel a pixel com a projeção: usar prismas projetados cortava partes do piso.
// Neste incremento o recorte cobre as paredes externas em primeiro plano.
export const RASTER_OCCLUDERS={
 'wall-ext-4':[[[1197,632],[1206,637],[1206,763],[1015,1148],[1008,1143],[1008,1015]]],
 'wall-ext-6':[[[879,948],[891,954],[891,1080],[822,1228],[810,1231],[808,1105]]],
 'wall-ext-7':[[[465,944],[802,1090],[807,1107],[807,1228],[455,1050],[455,949]]],
 'wall-ext-9':[
  [[44,540],[422,706],[422,840],[44,674]],
  [[461,723],[554,764],[554,898],[461,857]],
  [[422,706],[461,723],[461,744],[422,727]],
  [[422,782],[461,798],[461,857],[422,840]]
 ]
};
export function wallMasks(item,geometry){
 if(!item.respectWalls)return [];
 const at=floorPoint([item.x,item.y]),polys=[];
 for(const w of geometry.walls){
  const vertical=w.a[0]===w.b[0],fixed=vertical?0:1;
  if(w.a[fixed]<=at[fixed]+3)continue;
  polys.push(...(RASTER_OCCLUDERS[w.id]||[]));
 }
 return polys;
}
