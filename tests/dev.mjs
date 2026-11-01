import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { root } from '../scripts/build.mjs';

const base = process.env.SITE_URL || 'http://127.0.0.1:8000';
const source = resolve(root, 'content/home.md');
const original = await readFile(source);
const marker = '<!-- dev-rebuild-smoke-20261101 -->';
const changed = Buffer.concat([original, Buffer.from('\n'+marker+'\n')]);
const controller = new AbortController();
let events = '';
const stream = await fetch(base+'/_dev/events', { signal: controller.signal });
const reader = stream.body.getReader();
const consume = (async () => {
  try { while (true) { const {done,value} = await reader.read(); if (done) break; events += new TextDecoder().decode(value); } }
  catch (error) { if (error.name !== 'AbortError') throw error; }
})();
async function until(predicate, label) {
  const limit = Date.now()+6000;
  while (Date.now()<limit) { if (await predicate()) return; await new Promise(r=>setTimeout(r,100)); }
  throw new Error(label);
}
try {
  assert.equal((await fetch(base)).status, 200);
  assert.equal((await fetch(base+'/assets/gateway.css')).status, 200);
  for (const path of ['/.git/config','/package.json','/node_modules/linkedom/package.json','/templates/home.html','/content/home.md']) assert.equal((await fetch(base+path)).status,404,path);
  await new Promise(r=>setTimeout(r,350));
  assert.ok(!events.includes('data: reload'), 'Reading resources must not trigger a reload');
  await writeFile(source,changed);
  await until(async ()=>(await readFile(resolve(root,'index.html'),'utf8')).includes(marker),'Markdown did not rebuild');
  await until(()=>events.includes('data: reload'),'No live reload notification');
  assert.ok((await (await fetch(base)).text()).includes(marker));
  console.log('Dev server passed: public resources, source isolation, Markdown rebuild and live reload.');
} finally {
  const current = await readFile(source);
  if (current.equals(changed)) await writeFile(source,original);
  else assert.ok(current.equals(original),'Source changed externally; preserved rather than overwriting.');
  await until(async () => !(await readFile(resolve(root,'index.html'),'utf8')).includes(marker),'Restored Markdown did not rebuild');
  controller.abort(); await consume;
}
