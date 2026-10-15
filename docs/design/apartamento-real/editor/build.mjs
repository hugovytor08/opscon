import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {validate} from './geometry-core.mjs';
const root=new URL('./',import.meta.url);
const [template,css,core,app,geometry]=await Promise.all(['index.html','editor.css','geometry-core.mjs','editor.mjs','../geometria.json'].map(path=>readFile(new URL(path,root),'utf8')));
const script=core.replace(/^export /gm,'')+'\n'+app.replace(/^import .+;\r?\n/,'');
const data=JSON.stringify(validate(JSON.parse(geometry))).replace(/</g,'\\u003c');
const html=template.replace('<!-- EDITOR_STYLE -->','<style>'+css+'</style>').replace('<!-- EDITOR_BASELINE -->','<script type="application/json" id="baseline-model">'+data+'</script>').replace('<!-- EDITOR_SCRIPT -->','<script type="module">'+script+'</script>');
await mkdir(new URL('dist/',root),{recursive:true});await writeFile(new URL('dist/index.html',root),html);
console.log('Editor independente gerado: '+new URL('dist/index.html',root).pathname);
