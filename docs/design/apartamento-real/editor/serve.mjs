import http from 'node:http';import {readFile} from 'node:fs/promises';
const files={'/':'index.html','/index.html':'index.html','/moveis.html':'moveis.html'};
http.createServer(async(req,res)=>{
 const name=files[new URL(req.url,'http://127.0.0.1').pathname];if(!name){res.writeHead(404);res.end();return;}
 try{const html=await readFile(new URL('dist/'+name,import.meta.url));res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(html);}catch{res.writeHead(503);res.end('Editor ainda não gerado.');}
}).listen(8869,'127.0.0.1',()=>console.log('Editor local: http://127.0.0.1:8869/'));
