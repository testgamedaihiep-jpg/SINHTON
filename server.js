'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const port=Number(process.env.PORT)||8080,root=__dirname;
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.md':'text/plain; charset=utf-8'};
const server=http.createServer((req,res)=>{let url;try{url=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);res.end('Bad request');return;}const target=path.resolve(root,'.'+(url==='/'?'/index.html':url));if(!target.startsWith(root+path.sep)){res.writeHead(403);res.end('Forbidden');return;}fs.readFile(target,(err,data)=>{if(err){res.writeHead(404);res.end('Not found');return;}res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});res.end(data);});});
server.listen(port,'127.0.0.1',()=>console.log('Game H5: http://127.0.0.1:'+port));
server.on('error',err=>{console.error(err.code==='EADDRINUSE'?'Cổng '+port+' đang được dùng. Đặt PORT để chọn cổng khác.':err.message);process.exitCode=1;});
