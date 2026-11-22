// serve.ts — a tiny static server for game/ while developing:
//   node serve.ts            -> http://localhost:8080
//   node serve.ts --port 9000
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('./game', import.meta.url)));
const args = process.argv.slice(2);
const portIndex = args.indexOf('--port');
const requested = portIndex === -1 ? 8080 : Number(args[portIndex + 1]);
const port = Number.isInteger(requested) && requested > 0 && requested < 65536 ? requested : 8080;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.json': 'application/json; charset=utf-8',
};

const server = createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  const path = resolve(join(root, normalize(url).replace(/^(\.\.[/\\])+/, '')));
  if (!path.startsWith(root + sep) && path !== root) {
    res.writeHead(403);
    res.end('forbidden');
    return;
  }
  let file = path === root ? join(root, 'index.html') : path;
  try {
    if (statSync(file).isDirectory()) file = join(file, 'index.html');
    const stream = createReadStream(file);
    res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' });
    stream.pipe(res);
  } catch {
    res.writeHead(404);
    res.end('not found');
  }
});

server.listen(port, () => console.log(`serving game/ at http://localhost:${port}`));
