const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');

// Guia de geometria para o render. Alturas em UR ilustrativas, sem calibração métrica.
const root = __dirname;
const source = path.resolve(root, '../../geometria.json');
const g = JSON.parse(fs.readFileSync(source, 'utf8'));
const H = 290, SILL = 112, HEAD = 240;
const mesh = [], meshLines = [];
const project = ([x,y,z=0]) => [0.939693*x-0.342020*y, 0.296198*x+0.813798*y-0.5*z];
const depthOf = ([x,y,z=0]) => 0.171010*x+0.469846*y+0.866025*z;
function face(ps, fill) {
  mesh.push({ps,fill});
}
function line(ps, color) {
  meshLines.push({ps,color});
}
function prism(a,b,t,z0,z1,palette=['#dddcd5','#f1f0e9','#fffef8']) {
  const dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy);
  if(len<0.01||z1<=z0)return;
  const nx=-dy/len*t/2,ny=dx/len*t/2;
  const q=[[a[0]+nx,a[1]+ny],[b[0]+nx,b[1]+ny],[b[0]-nx,b[1]-ny],[a[0]-nx,a[1]-ny]];
  for(let i=0;i<4;i++){
    const u=q[i],v=q[(i+1)%4],normal=[u[1]-v[1],v[0]-u[0]];
    if(normal[0]*.171010+normal[1]*.469846 > 0.001)face([[...u,z0],[...v,z0],[...v,z1],[...u,z1]],Math.abs(normal[0])>Math.abs(normal[1])?palette[0]:palette[1]);
  }
  face(q.map(p=>[...p,z1]),palette[2]);
}
const mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];

for(const room of g.rooms){
  const rects=room.id==='vis-sala'?[[625,315,1136,695],[995,695,1136,797]]:[[
    Math.min(...room.polygon.map(p=>p[0])),Math.min(...room.polygon.map(p=>p[1])),
    Math.max(...room.polygon.map(p=>p[0])),Math.max(...room.polygon.map(p=>p[1]))
  ]];
  for(const [x0,y0,x1,y1] of rects){
    mesh.push({ps:[[x0,y0,0],[x1,y0,0],[x1,y1,0],[x0,y1,0]],fill:'#c9c7be'});
    for(let x=Math.floor(x0/52)*52;x<x1;x+=52)for(let y=Math.floor(y0/52)*52;y<y1;y+=52){
      const l=Math.max(x0,x+.5),r=Math.min(x1,x+51.5),t=Math.max(y0,y+.5),b=Math.min(y1,y+51.5);
      if(l<r&&t<b)mesh.push({ps:[[l,t,.1],[r,t,.1],[r,b,.1],[l,b,.1]],fill:'#f2f0e9'});
    }
  }
}

for(const wall of g.walls){
  const a=wall.a,b=wall.b,len=Math.hypot(b[0]-a[0],b[1]-a[1]);
  const openings=g.openings.filter(o=>o.wallId===wall.id);
  const tOf=p=>((p[0]-a[0])*(b[0]-a[0])+(p[1]-a[1])*(b[1]-a[1]))/(len*len);
  const intervals=openings.map(o=>({o,t0:Math.min(tOf(o.a),tOf(o.b)),t1:Math.max(tOf(o.a),tOf(o.b))}));
  // Cortes nos limites dos vãos; todos os trechos de alvenaria chegam ao mesmo topo.
  const cuts=[0,1,...intervals.flatMap(v=>[v.t0,v.t1])];
  for(let d=36;d<len;d+=36)cuts.push(d/len);
  const ts=[...new Set(cuts)].sort((x,y)=>x-y);
  for(let i=0;i<ts.length-1;i++){
    const t0=ts[i],t1=ts[i+1],mid=(t0+t1)/2;
    const opening=intervals.find(v=>mid>v.t0&&mid<v.t1)?.o;
    const p=mix(a,b,t0),q=mix(a,b,t1);
    if(!opening)prism(p,q,wall.thickness,0,H);
    else{
      if(opening.kind==='window')prism(p,q,wall.thickness,0,SILL);
      prism(p,q,wall.thickness,HEAD,H);
    }
  }
}

for(const o of g.openings.filter(o=>o.kind==='window')){
  const a=o.a,b=o.b,mid=mix(a,b,.5),silver=['#919a9c','#b6bfc0','#e2e6e4'];
  // Mesmo modelo: duas folhas e montante central. O vão permanece o da planta.
  prism(a,b,11,SILL-2,SILL+3,['#8e918b','#a4a69f','#d0d1c8']);
  for(const z of [SILL+4,HEAD-4])prism(a,b,6,z-2,z+2,silver);
  for(const p of [a,mid,b])prism([p[0]-1.3,p[1]],[p[0]+1.3,p[1]],5,SILL+4,HEAD-4,silver);
  const len=Math.hypot(b[0]-a[0],b[1]-a[1]),dx=(b[0]-a[0])/len,dy=(b[1]-a[1])/len;
  const normal=[-dy,dx],offset=normal[0]+normal[1]>0?2.5:-2.5;
  for(const [t0,t1] of [[.018,.49],[.51,.982]]){
    const p=mix(a,b,t0),q=mix(a,b,t1);
    face([[p[0]+normal[0]*offset,p[1]+normal[1]*offset,SILL+7],[q[0]+normal[0]*offset,q[1]+normal[1]*offset,SILL+7],[q[0]+normal[0]*offset,q[1]+normal[1]*offset,HEAD-7],[p[0]+normal[0]*offset,p[1]+normal[1]*offset,HEAD-7]],'#e3e8e5',{stroke:'#a5afb0',width:.65});
  }
  const p=[mid[0]+normal[0]*(offset+1),mid[1]+normal[1]*(offset+1),170];
  line([[p[0],p[1],163],[p[0],p[1],177]],'#555e5f',1.8);
}

for(const o of g.openings.filter(o=>o.kind==='door')){
  const palette=o.id==='door-entrada'?['#a56d39','#bd8247','#d9a36a']:['#e2e1da','#f0efe8','#faf9f1'];
  const h=o.swing.hinge,end=o.swing.openEnd;
  const leafEnd=o.id==='door-entrada'?o.a:end;
  prism(h,leafEnd,4,3,HEAD-4,palette);
  // Batentes com verga horizontal de mesma altura em todos os vãos.
  prism(o.a,o.b,18,HEAD-3,HEAD+3,o.id==='door-entrada'?palette:['#d6d5cc','#e7e6dd','#f7f6ed']);
  for(const p of [o.a,o.b]){
    const along=mix(p,p===o.a?o.b:o.a,.028);
    prism(p,along,18,0,HEAD,palette);
  }
  const p=mix(h,leafEnd,.87);
  line([[p[0]-2,p[1]-2,108],[p[0]+4,p[1]-2,108]],'#8d9290',2.4);
  if(o.id==='door-entrada'){
    const dx=leafEnd[0]-h[0],dy=leafEnd[1]-h[1],length=Math.hypot(dx,dy),n=[-dy/length,dx/length];
    const front=n[0]+n[1]>0?2.2:-2.2;
    const onLeaf=(t,z)=>[h[0]+dx*t+n[0]*front,h[1]+dy*t+n[1]*front,z];
    line([onLeaf(.71,4),onLeaf(.85,55),onLeaf(.91,110),onLeaf(.86,170),onLeaf(.70,232)],'#66472c',1.5);
    for(const z of [48,96,144,192])line([onLeaf(.02,z),onLeaf(z<100?.87:.88,z)],'#725236',1.3);
    line([onLeaf(.49,155),onLeaf(.5,155)],'#594631',2);
  }
}

assert.equal(g.rooms.length,8);assert.equal(g.walls.length,18);
assert.equal(g.openings.filter(o=>o.kind==='window').length,6);
const projected=g.perimeter.flatMap(p=>[project([...p,-18]),project([...p,H])]);
const xs=projected.map(p=>p[0]),ys=projected.map(p=>p[1]);
const box=[Math.min(...xs)-90,Math.min(...ys)-85,Math.max(...xs)-Math.min(...xs)+180,Math.max(...ys)-Math.min(...ys)+170];
fs.mkdirSync(path.join(root,'fontes'),{recursive:true});
const refs=[
 ['planta-2d.png','C:/Users/hugov/AppData/Local/Temp/codex-clipboard-e784442f-9ed6-4d7c-80ad-4fcb0e180469.png'],
 ['janela-real.jpg','C:/Users/hugov/AppData/Local/Temp/codex-clipboard-0d85491d-c6c7-4696-b4a6-108ffc4825cd.jpg'],
 ['porta-entrada-real.jpg','C:/Users/hugov/AppData/Local/Temp/codex-clipboard-74d12721-810f-4007-bfaa-da8f58f496a6.jpg']
];
for(const [name,input] of refs)fs.copyFileSync(input,path.join(root,'fontes',name));
// O guia raster usa buffer de profundidade real.
const rgb=hex=>hex.match(/[0-9a-f]{2}/gi).map(v=>parseInt(v,16)/255);
const vertex=(p,color)=>{
  const q=project(p),depth=depthOf(p);
  return [2*(q[0]-box[0])/box[2]-1,1-2*(q[1]-box[1])/box[3],1-2*(depth+100)/1500,...rgb(color)];
};
const triangles=[];for(const f of mesh)for(let i=1;i<f.ps.length-1;i++)for(const p of [f.ps[0],f.ps[i],f.ps[i+1]])triangles.push(...vertex(p,f.fill));
const glLines=[];for(const l of meshLines)for(let i=0;i<l.ps.length-1;i++)for(const p of [l.ps[i],l.ps[i+1]])glLines.push(...vertex(p,l.color));
const html=`<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:#e9e9e7}canvas{display:block}</style><canvas id="c" width="2000" height="${Math.round(2000*box[3]/box[2])}"></canvas><script>
const gl=c.getContext('webgl',{antialias:true,preserveDrawingBuffer:true});if(!gl)throw Error('WebGL indisponível');
const shader=(type,src)=>{const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s};
const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,'attribute vec3 p;attribute vec3 color;varying vec3 v;void main(){gl_Position=vec4(p,1.0);v=color;}'));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,'precision mediump float;varying vec3 v;void main(){gl_FragColor=vec4(v,1.0);}'));gl.linkProgram(program);gl.useProgram(program);
gl.enable(gl.DEPTH_TEST);gl.clearColor(.914,.914,.906,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.viewport(0,0,c.width,c.height);
function draw(data,mode){const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);for(const [name,offset]of[['p',0],['color',12]]){const loc=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,3,gl.FLOAT,false,24,offset)}gl.drawArrays(mode,0,data.length/6)}
draw(${JSON.stringify(triangles)},gl.TRIANGLES);draw(${JSON.stringify(glLines)},gl.LINES);window.ready=true;
</script>`;
fs.writeFileSync(path.join(root,'guia-estrutura.html'),html);
fs.writeFileSync(path.join(root,'integridade-guia.json'),JSON.stringify({
 source:'../../geometria.json',sourceSha256:crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex'),
 authority:'planta 2D reenviada pelo usuário; traçado relativo do documento, anterior à deformação de 14/10',
 units:'UR; alturas ilustrativas, sem medição de campo',wallTop:H,windowSill:SILL,openingHead:HEAD,
 sameWallHeight:true,rooms:g.rooms.map(r=>({id:r.id,polygon:r.polygon})),
 walls:g.walls.map(w=>({id:w.id,a:w.a,b:w.b,thickness:w.thickness,top:H})),
 openings:g.openings.map(o=>({id:o.id,kind:o.kind,a:o.a,b:o.b})),furniture:0,fixtures:0
},null,2));
(async()=>{
 const {chromium}=require('C:/Users/hugov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{const page=await browser.newPage({viewport:{width:2000,height:Math.round(2000*box[3]/box[2])}});await page.goto(require('node:url').pathToFileURL(path.join(root,'guia-estrutura.html')).href);await page.waitForFunction(()=>window.ready===true);await page.locator('canvas').screenshot({path:path.join(root,'guia-estrutura.png')});}
 finally{await browser.close();}
 console.log('Guia: 8 ambientes, 18 paredes com topo único, 6 janelas com peitoril, 5 portas; fonte original preservada; raster com teste de profundidade.');
})().catch(e=>{console.error(e);process.exitCode=1;});
