import { watch } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, root } from './build.mjs';

export function watchSite({ onBuild = () => {}, onError = console.error } = {}) {
let timer;
let running = false;
let pending = false;
async function rebuild() {
  pending = true;
  if (running) return;
  running = true;
  while (pending) {
    pending = false;
    try { const changed = await build(); console.log(`Built site: ${changed.length} file(s) updated.`); onBuild(changed); }
    catch (error) { onError(`Build failed: ${error.message}`); }
  }
  running = false;
}

const watchers = ['pages', 'cards', 'templates', 'content'].map(folder => watch(resolve(root, folder), { recursive: true }, (_, filename) => {
  const path = String(filename || '').replaceAll('\\', '/');
  if (!(folder === 'templates' || (folder === 'content' && path.endsWith('.md')) || (folder === 'cards' && path.endsWith('.json')) || /(^|\/)(article\.md|template\.html)$/.test(path))) return;
  clearTimeout(timer);
  timer = setTimeout(rebuild, 100);
}));
for (const watcher of watchers) watcher.on('error', onError);
rebuild();
return () => { watchers.forEach(watcher => watcher.close()); clearTimeout(timer); };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const close = watchSite();
  process.on('SIGINT', () => { close(); process.exit(); });
  console.log('Watching home/article Markdown, templates and card JSON. Ctrl+C to stop.');
}
