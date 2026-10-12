import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../app/', import.meta.url));
const port = Number(process.argv.find(v => v.startsWith('--port='))?.split('=')[1] ?? 8767);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid port');
const server = createServer(async (req, res) => {
  const filename = path.resolve(root, decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\/+/, '') || 'index.html');
  if (!filename.startsWith(root)) { res.writeHead(403).end(); return; }
  try {
    const content = await readFile(filename);
    const type = { '.js': 'text/javascript', '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.json': 'application/json' }[path.extname(filename)] ?? 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff' }); res.end(content);
  } catch { res.writeHead(404).end(); }
});
// No request logging: auth callback URLs can contain one-time credentials.
server.listen(port, '127.0.0.1', () => console.log(`Casa Serena preview: http://127.0.0.1:${port}/ (local only)`));
