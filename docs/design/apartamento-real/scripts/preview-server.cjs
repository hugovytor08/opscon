const http=require('node:http');const fs=require('node:fs');const path=require('node:path');
const root=path.resolve(__dirname,'..');const types={'.html':'text/html; charset=utf-8','.svg':'image/svg+xml','.json':'application/json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.md':'text/plain; charset=utf-8','.csv':'text/csv; charset=utf-8'};
http.createServer((req,res)=>{
 try{let route=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);if(route==='/')route='/conferencia.html';const file=path.resolve(root,'.'+route);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});fs.createReadStream(file).pipe(res);}catch{res.writeHead(400);res.end();}
}).listen(8868,'127.0.0.1',()=>console.log('Prévia local: http://127.0.0.1:8868/'));
