import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import path from 'node:path';
const root = path.resolve(fileURLToPath(new URL('../app/', import.meta.url)));
export async function withApp(run) {
  const server = createServer(async (req, res) => {
    const filename = path.resolve(root, new URL(req.url, 'http://localhost').pathname.replace(/^\/+/, '') || 'index.html');
    if (!filename.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    try {
      const body = await readFile(filename);
      res.writeHead(200, { 'Content-Type': { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' }[path.extname(filename)] ?? 'application/octet-stream' }); res.end(body);
    } catch { res.writeHead(404).end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    const require = createRequire(import.meta.url);
    const { chromium } = require(process.env.CASA_PLAYWRIGHT_MODULE || 'C:/Users/hugov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
    browser = await chromium.launch({ executablePath: process.env.CASA_CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await context.route('https://**', route => route.abort());
    const page = await context.newPage();
    await run({ page, context, url: `http://127.0.0.1:${server.address().port}/` });
  } finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); }
}
