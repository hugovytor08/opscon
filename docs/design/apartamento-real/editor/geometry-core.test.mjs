import {test} from 'node:test';import assert from 'node:assert/strict';import {readFile}from'node:fs/promises';
import {validate,clone,bounds,moveLine,changeDimension,regions,renderPlan,renderIso,project}from'./geometry-core.mjs';
const original=JSON.parse(await readFile(new URL('../geometria.json',import.meta.url),'utf8'));
test('original permanece intacto; ampliar quarto conserva oito IDs, portas e paredes compartilhadas',()=>{
 const saved=JSON.stringify(original),edited=changeDimension(original,original,'vis-q1',0,110).model;validate(edited);assert.equal(JSON.stringify(original),saved);
 assert.equal(bounds(edited.rooms.find(r=>r.id==='vis-q1').polygon)[2],365);assert.equal(edited.rooms.find(r=>r.id==='vis-q2').polygon[0][0],365);
 assert.deepEqual(edited.rooms.map(r=>r.id),original.rooms.map(r=>r.id));assert.equal(edited.rooms.length,8);assert.ok(edited.rooms.every(r=>r.appRoomId===null));assert.equal(edited.coordinateSystem.scaleToMeters,null);
});
test('limite impede cruzar parede vizinha, inclusive pedidos extremos',()=>{
 const result=changeDimension(original,original,'vis-q1',0,500);assert.ok(result.limited);validate(result.model);assert.ok(bounds(result.model.rooms.find(r=>r.id==='vis-q1').polygon)[2]<448);
 const zero=moveLine(original,0,336,336);assert.deepEqual(zero.model,original);
});
test('sequência de mudanças em cantos/linhas mantém perímetro, elementos e aberturas',()=>{
 let edited=clone(original);for(const [axis,at,delta]of[[0,336,22],[1,427,19],[0,1136,70],[1,950,44],[0,448,-15],[1,37,-20]]){edited=moveLine(edited,axis,at,at+delta).model;validate(edited);}
 const area=regions(edited);for(const r of edited.rooms)assert.deepEqual(area.regions.find(a=>a.id===r.id).polygon,r.polygon.map(p=>project(edited,p)));
 assert.equal(edited.declaredTotalArea.value,53.05);
});
test('modelos quebrados, invasão de cômodos e vínculo a dados reais são rejeitados',()=>{
 for(const mutate of [m=>m.rooms.pop(),m=>m.rooms[0].appRoomId='room-1',m=>m.rooms[0].polygon[0]=[NaN,0],m=>m.openings[0].a=[800,800],m=>m.rooms[0].polygon[1][0]-=20,m=>m.contextFurniture[0].polygon[0]=[2000,2000],m=>m.coordinateSystem.scaleToMeters=.01]){const invalid=clone(original);mutate(invalid);assert.throws(()=>validate(invalid));}
});
test('SVGs autocontidos, nomes escapados e regiões iguais à geometria desenhada',()=>{
 const edited=clone(original);edited.rooms[0].name='<img onerror="alert(1)"> & sala';validate(edited);const svg=renderIso(edited,{furniture:false});
 assert.ok(svg.includes('&lt;img onerror=&quot;alert(1)&quot;&gt; &amp; sala'));assert.ok(!svg.includes('<img'));assert.ok(!/<script|foreignObject|\shref=/i.test(svg));
 assert.equal((svg.match(/class="room /g)||[]).length,8);assert.ok(renderPlan(edited).includes('plan-vis-q1'));assert.ok(svg.includes('display:none'));assert.ok(svg.includes('id="iso-mobiliario-contextual"'));
});
