import { watch } from 'node:fs';
import { resolve } from 'node:path';
import { build, root } from './build.mjs';

let timer;
let running = false;
let pending = false;
async function rebuild() {
  pending = true;
  if (running) return;
  running = true;
  while (pending) {
    pending = false;
    try { console.log(`Built site: ${(await build()).length} file(s) updated. Refresh your browser.`); }
    catch (error) { console.error(`Build failed: ${error.message}`); }
  }
  running = false;
}

const watchers = ['pages', 'cards', 'templates'].map(folder => watch(resolve(root, folder), { recursive: true }, (_, filename) => {
  const path = String(filename || '').replaceAll('\\', '/');
  if (!(folder === 'templates' || (folder === 'cards' && path.endsWith('.json')) || /(^|\/)(article\.md|template\.html)$/.test(path))) return;
  clearTimeout(timer);
  timer = setTimeout(rebuild, 100);
}));
for (const watcher of watchers) watcher.on('error', error => { console.error(error); process.exitCode = 1; });
process.on('SIGINT', () => { watchers.forEach(watcher => watcher.close()); clearTimeout(timer); });
await rebuild();
console.log('Watching article Markdown, templates and card JSON. Ctrl+C to stop.');
