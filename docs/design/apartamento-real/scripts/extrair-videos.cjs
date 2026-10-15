const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/hugov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const page=await browser.newPage();
 await page.goto('about:blank');
 const rows=JSON.parse(fs.readFileSync(path.join(root,'evidencias/fontes.json'),'utf8')).filter(r=>r.tipo==='video');
 const manifest=[];
 for(const row of rows){
  const buffer=fs.readFileSync(path.join(root,row.copia));
  await page.setContent('<video id="v" muted preload="auto"></video><canvas id="c"></canvas>');
  const meta=await page.evaluate(async data=>{
   const v=document.querySelector('#v');v.src='data:video/mp4;base64,'+data;
   await new Promise((resolve,reject)=>{v.onloadedmetadata=resolve;v.onerror=()=>reject(new Error('Video decode error '+v.error?.code));});
   return {duration:v.duration,width:v.videoWidth,height:v.videoHeight};
  },buffer.toString('base64'));
  const times=[];for(let t=0;t<meta.duration;t+=2)times.push(Math.min(Math.max(t,.05),meta.duration-.05));
  if(row.id==='VID-002')times.push(13,15,17,19,21,23,25,27,29);
  times.push(Math.max(.05,meta.duration-.2));times.sort((a,b)=>a-b);
  const frames=[];
  for(const time of times){
   const data=await page.evaluate(async time=>{
    const v=document.querySelector('#v');
    await new Promise(resolve=>{v.onseeked=resolve;v.currentTime=time;});
    const c=document.querySelector('#c');c.width=v.videoWidth;c.height=v.videoHeight;c.getContext('2d').drawImage(v,0,0);
    return c.toDataURL('image/jpeg',.9).split(',')[1];
   },time);
   const id=row.id+'-'+String(Math.round(time*1000)).padStart(6,'0');
   const file='evidencias/quadros/'+id+'.jpg';fs.writeFileSync(path.join(root,file),Buffer.from(data,'base64'));
   frames.push({id,videoId:row.id,timeSeconds:Number(time.toFixed(3)),timeLabel:String(Math.floor(time/60)).padStart(2,'0')+':'+String(Math.floor(time%60)).padStart(2,'0'),file});
  }
  manifest.push({id:row.id,source:row.copia,...meta,method:'Chrome HTMLVideoElement: amostragem sequencial a cada 2 s, sem áudio',frames});
  console.log(row.id,JSON.stringify(meta),'frames',frames.length);
 }
 fs.writeFileSync(path.join(root,'evidencias/videos.json'),JSON.stringify(manifest,null,2));
 await browser.close();
})().catch(error=>{console.error(error);process.exitCode=1});
