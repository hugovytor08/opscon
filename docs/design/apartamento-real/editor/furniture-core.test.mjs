import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {initialFurniture,validateFurniture,projectPoint,floorPoint,wallMasks,roomFor,itemBox} from './furniture-core.mjs';
const builtin=[{id:'fogao'}],geometry=JSON.parse(readFileSync(new URL('../geometria.json',import.meta.url)));
const item={id:'item-1',assetId:'fogao',x:750,y:1010,width:100,respectWalls:true};
const project=()=>({...initialFurniture(builtin),items:[{...item}]});
test('projeto de móveis mantém recurso e objeto separados, sem alterar fonte',()=>{
 const p=project(),source=JSON.stringify(p);assert.deepEqual(validateFurniture(p,builtin),p);assert.equal(JSON.stringify(p),source);
});
test('importação rejeita IDs repetidos, recurso ausente, links externos e coordenadas não finitas',()=>{
 for(const mutate of [p=>p.items.push({...p.items[0]}),p=>p.assets=[],p=>p.items[0].width=0,p=>p.items[0].x=Infinity,p=>p.assets.push({id:'externo',name:'x',dataUrl:'https://example.com/p.png',width:10,height:10}),p=>p.assets.push({id:'svg',name:'x',dataUrl:'data:image/svg+xml;base64,PHN2Zz4=',width:10,height:10})]){const p=project();mutate(p);assert.throws(()=>validateFurniture(p,builtin));}
});
test('projeto de proporções e outra base são recusados',()=>{
 assert.throws(()=>validateFurniture(geometry,builtin));const p=project();p.baseId='outra-planta';assert.throws(()=>validateFurniture(p,builtin));
});
test('registro de piso é reversível e classifica o ponto inicial na cozinha',()=>{
 for(const p of [[46,37],[995,950],[752,800]]){const q=floorPoint(projectPoint(p));assert.ok(Math.abs(q[0]-p[0])<1e-8&&Math.abs(q[1]-p[1])<1e-8);}
 assert.equal(roomFor(item,geometry).id,'vis-cozinha');
});
test('escala preserva proporção e âncora do objeto',()=>{
 const a={width:1170,height:1344,anchor:[.5,.7]},b=itemBox(item,a),c=itemBox({...item,width:200},a);assert.equal(c.w,b.w*2);assert.equal(c.h,b.h*2);assert.equal(c.x+c.w*.5,item.x);assert.equal(c.y+c.h*.7,item.y);
});
test('oclusão usa somente paredes em frente; modo livre remove recorte',()=>{
 assert.ok(wallMasks(item,geometry).length>0);assert.deepEqual(wallMasks({...item,respectWalls:false},geometry),[]);
 const far={...item,...Object.fromEntries(['x','y'].map((k,n)=>[k,projectPoint([1200,1000])[n]]))};assert.deepEqual(wallMasks(far,geometry),[]);
});
