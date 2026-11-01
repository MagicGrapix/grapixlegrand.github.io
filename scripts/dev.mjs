import { createServer } from 'node:http';
import { readFile, stat, realpath } from 'node:fs/promises';
import { watch } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import { networkInterfaces } from 'node:os';
import { build, root } from './build.mjs';
import { watchSite } from './watch.mjs';

const port = Number(process.env.PORT || 8000);
const host = process.env.HOST || '0.0.0.0';
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Choose a PORT between 1024 and 65535.');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.pdf': 'application/pdf', '.mp4': 'video/mp4', '.webm': 'video/webm', '.mp3': 'audio/mpeg', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8' };
const publicFolders = new Set(['assets', 'resources', 'pages', 'cards', 'cg22', 'SuperVoxel', 'shuffling', 'hosting']);
const clients = new Set();
const reload = () => { for (const client of clients) client.write('data: reload\n\n'); };
const injected = `<script>new EventSource('/_dev/events').onmessage=function(e){if(e.data==='reload')location.reload()};</script>`;
await build();
const siteRoot = await realpath(root);
const server = createServer(async (req, res) => {
  try {
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405).end(); return; }
    const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (path === '/_dev/events') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive' });
      res.write(': connected\n\n'); clients.add(res); req.on('close', () => clients.delete(res)); return;
    }
    const segments = path.split('/').filter(Boolean);
    if (segments.some(s => s.startsWith('.') || s.includes('\\') || s.includes(':')) || (segments.length > 1 && !publicFolders.has(segments[0]))) { res.writeHead(404).end('Not found'); return; }
    let file = resolve(root, '.' + path);
    if (file !== root && !file.startsWith(root + sep)) { res.writeHead(404).end(); return; }
    let info = await stat(file);
    if (info.isDirectory()) {
      if (!path.endsWith('/')) { res.writeHead(301, { Location: path + '/' }).end(); return; }
      file = resolve(file, 'index.html');
    }
    const actual = await realpath(file);
    if (!actual.startsWith(siteRoot + sep)) { res.writeHead(404).end(); return; }
    const extension = extname(file).toLowerCase();
    if (!types[extension] || /(?:^|\/)(?:template\.html|package(?:-lock)?\.json)$/.test(path) || (segments[0] === 'cards' && extension === '.json')) { res.writeHead(404).end(); return; }
    let content = await readFile(file);
    if (extension === '.html') content = Buffer.from(content.toString('utf8').replace('</body>', injected + '</body>'));
    res.writeHead(200, { 'Content-Type': types[extension], 'Content-Length': content.length, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'X-Robots-Tag': 'noindex' });
    res.end(req.method === 'HEAD' ? undefined : content);
  } catch (error) {
    res.writeHead(error.code === 'ENOENT' || error.code === 'ENOTDIR' || error instanceof URIError ? 404 : 500).end('Not found');
  }
});
server.on('error', error => { console.error(error.message); process.exit(1); });
await new Promise(resolve => server.listen(port, host, resolve));
console.log(`Local: http://127.0.0.1:${port}/`);
for (const addresses of Object.values(networkInterfaces())) for (const address of addresses || []) {
  if (address.family === 'IPv4' && !address.internal) console.log(`Network: http://${address.address}:${port}/`);
}
const stopWatcher = watchSite({ onBuild: changed => { if (changed.length) reload(); } });
let reloadTimer;
const staticWatcher = watch(root, { recursive: true }, (_, filename) => {
  const path = String(filename || '').replaceAll('\\', '/');
  if (!/^(assets\/|resources\/|style\.css$|cards\/.*\.html$)/.test(path)) return;
  clearTimeout(reloadTimer); reloadTimer = setTimeout(reload, 180);
});
const heartbeat = setInterval(() => { for (const client of clients) client.write(': keepalive\n\n'); }, 20000);
function shutdown() {
  stopWatcher(); staticWatcher.close(); clearTimeout(reloadTimer); clearInterval(heartbeat);
  for (const client of clients) client.end(); server.close(() => process.exit());
}
process.on('SIGINT', shutdown); process.on('SIGTERM', shutdown);
console.log('Markdown and templates rebuild automatically; browsers reload after changes. Ctrl+C to stop.');
