import assert from 'node:assert/strict';
import { readFile, writeFile, readdir, access } from 'node:fs/promises';
import { resolve, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { parseHTML } from 'linkedom';

const require = createRequire(import.meta.url);
const { marked } = require('../pages/controlling-generative-ai-for-game-content/vendor/marked-17.0.5.umd.js');
export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const categories = ['professional-work', 'personal-games', 'software-rnd', 'art-visual'];
const reports = ['/cg22/report.html', '/SuperVoxel/index.html', '/shuffling/story.html'];
const escape = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const read = path => readFile(path, 'utf8').then(text => text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n'));

function insert(template, marker, content) {
  assert.equal(template.split(marker).length, 2, `Expected one ${marker} in template`);
  // Use a callback so Markdown containing $& or $' stays literal.
  return template.replace(marker, () => content);
}

function webUrl(value) {
  assert.equal(typeof value, 'string', 'Expected a URL string');
  const url = new URL(value, 'https://portfolio.invalid/');
  assert.ok(['http:', 'https:'].includes(url.protocol), `Unsupported URL: ${value}`);
  return escape(value);
}

export function renderCards(data, category) {
  assert.ok(Array.isArray(data.order) && data.projects, `Invalid category: ${category}`);
  assert.equal(new Set(data.order).size, data.order.length, `Duplicate project in ${category}`);
  return data.order.map(id => {
    const project = data.projects[id];
    assert.ok(project && typeof project.title === 'string' && Array.isArray(project.chips), `Invalid project: ${id}`);
    assert.ok(project.link || project.detail, `Missing destination: ${id}`);
    const classes = ['work-card', category === 'professional-work' ? 'work-card--pro' : '',
      project.feature ? 'work-card--feature' : '', project.creative ? 'work-card--creative' : '', project.archive ? 'work-card--archive' : ''].filter(Boolean).join(' ');
    assert.ok(!project.previewFit || ['cover', 'contain'].includes(project.previewFit), `Invalid previewFit: ${id}`);
    const mediaClass = `work-card__media${project.previewFit ? ` work-card__media--${project.previewFit}` : ''}`;
    const media = project.preview
      ? `<div class="${mediaClass}"><img src="${webUrl(project.preview)}" alt="${escape(project.title)} preview" /></div>`
      : '<div class="work-card__media" aria-hidden="true"></div>';
    const tag = project.link ? 'a' : 'button';
    const destination = project.link ? `href="${webUrl(project.link)}"` : `type="button" data-detail="${escape(project.detail)}"`;
    return `
            <${tag} class="${classes}" ${destination} data-project-id="${escape(id)}">
              ${media}
              <div class="work-card__body">
                <h3 class="work-card__title">${escape(project.title)}</h3>
                <p class="work-card__meta">${escape(project.meta || '')}</p>
                <p class="work-card__desc">${escape(project.summary || '')}</p>
                <div class="work-card__chips">${project.chips.map(chip => `<span>${escape(chip)}</span>`).join('')}</div>
              </div>
            </${tag}>`;
  }).join('\n').trimStart();
}

export function renderArticle(markdown) {
  // Articles are repository-authored content, including intentional figure/iframe HTML.
  const { document } = parseHTML('<html><body><div id="content"></div></body></html>');
  const content = document.getElementById('content');
  content.innerHTML = marked.parse(markdown, { gfm: true });
  assert.equal(content.querySelectorAll('h1').length, 1, 'Each article must have exactly one H1');
  for (const paragraph of [...content.children].filter(element => element.tagName === 'P')) {
    if (!paragraph.querySelector('img') || paragraph.textContent.trim()) continue;
    const figure = document.createElement('figure');
    const next = paragraph.nextElementSibling;
    while (paragraph.firstChild) figure.append(paragraph.firstChild);
    paragraph.replaceWith(figure);
    if (next?.matches('p') && next.children.length === 1 && next.firstElementChild.tagName === 'EM') {
      const caption = document.createElement('figcaption');
      while (next.firstChild) caption.append(next.firstChild);
      figure.append(caption);
      next.remove();
    }
  }
  for (const row of content.querySelectorAll('figure > div')) {
    if (row.querySelectorAll('img').length > 1) row.classList.add('figure-pair');
  }
  for (const [index, image] of [...content.querySelectorAll('img')].entries()) {
    assert.ok(image.hasAttribute('alt'), `Missing image alt: ${image.getAttribute('src')}`);
    image.setAttribute('decoding', 'async');
    image.setAttribute('loading', index === 0 ? 'eager' : 'lazy');
    let link = image.closest('a');
    if (!link) {
      link = document.createElement('a');
      link.setAttribute('href', image.getAttribute('src'));
      image.replaceWith(link);
      link.append(image);
    }
    link.classList.add('image-expand');
    link.setAttribute('aria-label', `Enlarge: ${image.getAttribute('alt') || 'illustration'}`);
  }
  return content.innerHTML;
}

function addMetadata(html, route, origin, type, image) {
  const { document } = parseHTML(html);
  const title = document.querySelector('title')?.textContent.trim();
  const description = document.querySelector('meta[name="description"]')?.getAttribute('content');
  assert.ok(title && description, `Missing title or description: ${route}`);
  assert.equal(document.querySelectorAll('h1').length, 1, `Expected one H1: ${route}`);
  const canonical = new URL(route, origin).href;
  const metadata = [
    `<link rel="canonical" href="${escape(canonical)}">`,
    ...Object.entries({ type, title, description, url: canonical, image: new URL(image, canonical).href })
      .map(([property, value]) => `<meta property="og:${property}" content="${escape(value)}">`),
  ].join('\n    ');
  return insert(html, '<!-- SEO -->', metadata)
    .replace(/<!doctype html>/i, '<!doctype html>\n<!-- Generated by npm run build. Edit the template, Markdown or card JSON sources. -->');
}

async function validateResources(html, route, origin, directory, outputs) {
  const { document } = parseHTML(html);
  for (const element of document.querySelectorAll('[href], [src]')) {
    for (const attribute of ['href', 'src']) {
      const value = element.getAttribute(attribute);
      if (!value || /^(mailto:|tel:|data:|#)/.test(value)) continue;
      const url = new URL(value, new URL(route, origin));
      assert.ok(['https:', 'http:'].includes(url.protocol), `Unsupported ${attribute}: ${value}`);
      if (url.origin !== origin) continue;
      const path = decodeURIComponent(url.pathname).replace(/^\//, '') + (url.pathname.endsWith('/') ? 'index.html' : '');
      const target = resolve(directory, path);
      assert.ok(target.startsWith(resolve(directory) + sep), `Path outside site: ${value}`);
      if (!outputs.has(path)) await access(target).catch(() => { throw new Error(`Missing resource in ${route}: ${value}`); });
    }
  }
}

export async function generate(directory = root) {
  const hostname = (await read(resolve(directory, 'CNAME'))).trim();
  assert.match(hostname, /^[a-z0-9.-]+$/i, 'Invalid CNAME');
  const origin = `https://${hostname}`;
  const outputs = new Map();
  let home = await read(resolve(directory, 'templates/home.html'));
  for (const category of categories) {
    const data = JSON.parse(await read(resolve(directory, `cards/${category}.json`)));
    for (const id of data.order) {
      const detail = data.projects[id]?.detail;
      if (detail) {
        const path = resolve(directory, 'cards', detail);
        assert.ok(path.startsWith(resolve(directory, 'cards') + sep), `Invalid fragment path: ${detail}`);
        await access(path);
      }
    }
    home = insert(home, `<!-- CARDS:${category} -->`, renderCards(data, category));
  }
  outputs.set('index.html', addMetadata(home, '/', origin, 'website', './resources/profile.jpg'));
  const routes = ['/'];
  for (const entry of (await readdir(resolve(directory, 'pages'), { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isDirectory()) continue;
    const path = `pages/${entry.name}`;
    let markdown;
    try { markdown = await read(resolve(directory, path, 'article.md')); }
    catch (error) { if (error.code === 'ENOENT') continue; throw error; }
    const template = await read(resolve(directory, path, 'template.html'));
    const content = renderArticle(markdown);
    const { document } = parseHTML(content);
    const image = document.querySelector('img')?.getAttribute('src') || '../../resources/profile.jpg';
    const route = `/${path}/`;
    outputs.set(`${path}/index.html`, addMetadata(insert(template, '<!-- ARTICLE -->', content), route, origin, 'article', image));
    routes.push(route);
  }
  for (const route of reports) {
    await access(resolve(directory, route.slice(1)));
    routes.push(route);
  }
  outputs.set('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes.map(route => `  <url><loc>${escape(new URL(route, origin).href)}</loc></url>`).join('\n')}\n</urlset>\n`);
  outputs.set('robots.txt', `User-agent: *\nDisallow:\n\nSitemap: ${origin}/sitemap.xml\n`);
  for (const [file, html] of outputs) {
    if (file.endsWith('.html')) await validateResources(html, `/${file}`, origin, directory, outputs);
  }
  return outputs;
}

export async function build({ directory = root, check = false } = {}) {
  // Finish generation and validation before replacing any published HTML.
  const outputs = await generate(directory);
  const changed = [];
  for (const [file, content] of outputs) {
    let existing;
    try { existing = await read(resolve(directory, file)); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (existing === content) continue;
    changed.push(file);
    if (!check) await writeFile(resolve(directory, file), content, 'utf8');
  }
  if (check && changed.length) throw new Error(`Generated files are stale. Run npm run build:\n${changed.join('\n')}`);
  return changed;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    assert.ok(process.argv.slice(2).every(argument => argument === '--check'), 'Usage: node scripts/build.mjs [--check]');
    const changed = await build({ check: process.argv.includes('--check') });
    console.log(process.argv.includes('--check') ? 'Generated files and local resources are up to date.' : `Built site: ${changed.length} file(s) updated.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
