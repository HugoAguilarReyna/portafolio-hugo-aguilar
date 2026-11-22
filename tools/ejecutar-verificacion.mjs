import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
const root = path.resolve('dist');
const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2'};
/* Puerto fijo y documentado (8000) en lugar de uno efímero: el origen del sitio
   forma parte del contrato de CORS de la API, y con un puerto aleatorio las
   peticiones reales se bloquean y el caso acaba en un timeout engañoso. */
const PORT = Number(process.env.PORT || 8000);
const server = http.createServer((req,res)=>{
  const file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if (!file.startsWith(root + path.sep) && file !== root) { res.writeHead(403).end(); return; }
  const target = fs.existsSync(file) && fs.statSync(file).isDirectory() ? path.join(file,'index.html') : file;
  fs.readFile(target,(err,data)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',mime[path.extname(target)] || 'application/octet-stream');res.end(data);});
});
await new Promise((resolve,reject)=>{
  server.once('error',error=>{
    if(error.code==='EADDRINUSE') console.error(`El puerto ${PORT} está ocupado: define PORT con un origen autorizado en ALLOWED_ORIGINS de la API.`);
    reject(error);
  });
  server.listen(PORT,'127.0.0.1',resolve);
});
const child=spawn(process.execPath,['tools/verificar-fichas.mjs',...process.argv.slice(2)],{stdio:'inherit',env:{...process.env,SITE_BASE:`http://127.0.0.1:${PORT}`}});
let code=await new Promise(resolve=>{child.once('error',()=>resolve(2));child.once('exit',code=>resolve(code ?? 2));});
if (code === 0) {
  const featured = spawn(process.execPath, ['tools/verificar-destacados.mjs'], {
    stdio: 'inherit', env: {...process.env, SITE_BASE: `http://127.0.0.1:${PORT}`}
  });
  code = await new Promise(resolve => {
    featured.once('error', () => resolve(2)); featured.once('exit', value => resolve(value ?? 2));
  });
}
if (code === 0) {
  const banxico = spawn(process.execPath, ['tools/verificar-banxico-embebido.mjs'], {
    stdio: 'inherit', env: {...process.env, SITE_BASE: `http://127.0.0.1:${PORT}`}
  });
  code = await new Promise(resolve => {
    banxico.once('error', () => resolve(2)); banxico.once('exit', value => resolve(value ?? 2));
  });
}
await new Promise(resolve=>server.close(resolve));
process.exitCode=code;
