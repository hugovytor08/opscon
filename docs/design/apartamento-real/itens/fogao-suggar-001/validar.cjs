const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const sharp=require('C:/Users/hugov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=__dirname;
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
(async()=>{
 const image='fogao-frente-direita-v2.png',file=path.join(root,image),m=await sharp(file).metadata();
 assert.equal(m.format,'png');assert.equal(m.hasAlpha,true);
 const {data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let zero=0,partial=0,opaque=0,nearOpaque=0,borderMax=0,x0=info.width,y0=info.height,x1=-1,y1=-1;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){
  const a=data[(y*info.width+x)*4+3];
  if(a===0)zero++;else if(a===255)opaque++;else partial++;
  if(a>=250)nearOpaque++;
  if(x===0||y===0||x===info.width-1||y===info.height-1)borderMax=Math.max(borderMax,a);
  if(a>8){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y)}
 }
 assert.ok(zero>info.width*info.height*.2);assert.ok(nearOpaque>1000);assert.ok(partial>0);
 // Alfa 1/255 residual é tolerado na borda; silhueta visível deve ter margem.
 assert.ok(borderMax<=1);assert.ok(x0>0&&y0>0&&x1<info.width-1&&y1<info.height-1);
 const refs=[
  ['fontes/frontal.jpg','C:/Users/hugov/AppData/Local/Temp/codex-clipboard-fad802ba-8baa-4e34-baa1-1bb7129dab78.jpg'],
  ['fontes/superior.jpg','C:/Users/hugov/AppData/Local/Temp/codex-clipboard-db1a2c68-befc-405a-85ce-5fc59f7a6cf0.jpg']
 ];
 for(const [local,original]of refs)assert.equal(hash(path.join(root,local)),hash(original));
 const styleReference='../../estudo-visual-2026-10-15/apartamento-sem-moveis-v2.png';
 const out={
  schemaVersion:1,id:'vis-item-fogao-suggar-001',name:'Fogão preto Suggar Best Cook — quatro bocas',
  artifactType:'illustrated_object_sprite',status:'visual_approved_by_user',visualApprovalEvidence:'Usuário afirmou que a extração ficou excelente e pediu colocação editável na planta.',tool:'image_gen built-in',
  image,prompt:'prompt-v2.txt',sha256:hash(file),pixels:{width:info.width,height:info.height},
  alpha:{realTransparency:true,fullyTransparentPixels:zero,partiallyTransparentPixels:partial,
   fullyOpaquePixels:opaque,nearOpaquePixelsAlphaAtLeast250:nearOpaque,borderMaxAlpha:borderMax,
   visibleBounds:{left:x0,top:y0,right:x1,bottom:y1},
   note:'Alfa entregue pelo gerador preservado; corpo predominantemente em 252–253/255 e resíduos de até 1/255 na borda.'},
  sources:refs.map(([file])=>({file,sha256:hash(path.join(root,file))})),
  styleReference,styleReferenceSha256:hash(path.resolve(root,styleReference)),
  orientation:'frente e lateral direita; vista elevada',availableOrientations:1,
  camera:{guideElevationDegrees:60,guideAzimuthDegrees:20,projection:'orthographic_reference',rasterCorrespondence:'aproximada, conferida visualmente'},
  physicalDimensionsCm:null,assignedRoomId:null,floorAnchor:{status:'approximate_for_local_editor',normalized:[.5,.7]},editorIntegration:'local_furniture_editor',
  visualReview:{burners:4,knobsOnHorizontalCooktop:5,curvedSilverHandle:true,blackGlassOvenDoor:true,shortBlackFeet:true,visibleExtraObjects:0,
   notes:'Câmera elevada na v2. Lateral inferida de forma conservadora; traseira não reconstruída. Textos pequenos ilustrativos.'},
  limitations:['Raster com aparência tridimensional; não contém malha 3D.','Medidas não fornecidas; escala relativa ajustável em etapa posterior.','Outras orientações, registro no piso e oclusão pelas paredes pendentes.']
 };
 fs.writeFileSync(path.join(root,'item.json'),JSON.stringify(out,null,2)+'\n');
 console.log(JSON.stringify({status:'PASS',pixels:out.pixels,alpha:out.alpha,sourceCopiesIdentical:true,sha256:out.sha256},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
