import http from 'node:http';import {readFile} from 'node:fs/promises';
const file=new URL('dist/index.html',import.meta.url);
http.createServer(async(req,res)=>{
 if(!['/','/index.html'].includes(new URL(req.url,'http://127.0.0.1').pathname)){res.writeHead(404);res.end();return;}
 try{const html=await readFile(file);res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(html);}catch{res.writeHead(503);res.end('Editor ainda não gerado.');}
}).listen(8869,'127.0.0.1',()=>console.log('Editor local: http://127.0.0.1:8869/'));
