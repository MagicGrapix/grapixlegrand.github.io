import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { resolve, dirname, sep } from 'node:path';
import { parseHTML } from 'linkedom';
import { build, generate, renderArticle, renderCards, root } from '../scripts/build.mjs';

const categories = ['professional-work', 'personal-games', 'software-rnd', 'art-visual'];

async function fixture(t) {
  const parent = resolve(root, 'test-results');
  await mkdir(parent, { recursive: true });
  const directory = await mkdtemp(resolve(parent, 'build-fixture-'));
  t.after(async () => {
    assert.ok(resolve(directory).startsWith(parent + sep));
    await rm(directory, { recursive: true, force: true });
  });
  const files = {
    CNAME: 'www.example.com',
    'resources/profile.jpg': 'image fixture',
    'templates/home.html': `<!doctype html><html><head><title>Portfolio</title><meta name="description" content="Projects"><!-- SEO --></head><body><h1>Portfolio</h1>${categories.map(category => `<!-- CARDS:${category} -->`).join('')}</body></html>`,
    'pages/example/template.html': '<!doctype html><html><head><title>Example</title><meta name="description" content="An article"><!-- SEO --></head><body><!-- ARTICLE --></body></html>',
    'pages/example/article.md': '# Example\n\nInitial text.\n\n![Diagram](image.svg)\n',
    'pages/example/image.svg': '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
    'cg22/report.html': '<h1>Report</h1>',
    'SuperVoxel/index.html': '<h1>SuperVoxel</h1>',
    'shuffling/story.html': '<h1>Story</h1>',
  };
  for (const category of categories) {
    files[`cards/${category}.json`] = JSON.stringify({ order: ['example'], projects: { example: { title: 'Example', chips: [], link: './pages/example/' } } });
  }
  for (const [path, content] of Object.entries(files)) {
    await mkdir(dirname(resolve(directory, path)), { recursive: true });
    await writeFile(resolve(directory, path), content);
  }
  return directory;
}

test('Markdown retains authored HTML, literal replacement tokens, figures and captions', () => {
  const html = renderArticle("# Title\n\nLiteral $& and $' text.\n\n![One](one.svg)\n\n*Caption*\n\n![Two](two.svg)\n\n<details><summary>More</summary>Details</details>\n");
  const { document } = parseHTML(`<html><body>${html}</body></html>`);
  assert.ok(document.body.textContent.includes("Literal $& and $' text."));
  assert.equal(document.querySelectorAll('figure').length, 2);
  assert.equal(document.querySelector('figcaption').textContent, 'Caption');
  assert.equal(document.querySelector('details summary').textContent, 'More');
  assert.equal(document.querySelector('img').getAttribute('loading'), 'eager');
  assert.equal(document.querySelectorAll('img')[1].getAttribute('loading'), 'lazy');
  assert.equal(document.querySelectorAll('a.image-expand').length, 2);
  assert.throws(() => renderArticle('No heading'), /one H1/);
  assert.throws(() => renderArticle('# One\n\n# Two'), /one H1/);
  assert.throws(() => renderArticle('# Title\n\n<img src="x.svg">'), /Missing image alt/);
});

test('cards preserve buttons and ordinary article links, with escaped source text', () => {
  const data = { order: ['detail', 'article'], projects: {
    detail: { title: '<img onerror="bad()">', summary: 'A & B', chips: ['<tag>'], detail: 'detail.html' },
    article: { title: 'Article', chips: [], link: './pages/example/' },
  } };
  const { document } = parseHTML(renderCards(data, 'software-rnd'));
  assert.equal(document.querySelectorAll('button[data-detail="detail.html"]').length, 1);
  assert.equal(document.querySelectorAll('a[href="./pages/example/"]').length, 1);
  assert.equal(document.querySelector('.work-card__title').textContent, '<img onerror="bad()">');
  assert.equal(document.querySelector('.work-card__desc').textContent, 'A & B');
  assert.equal(document.querySelectorAll('[onerror]').length, 0);
  data.projects.article.link = 'javascript:bad()';
  assert.throws(() => renderCards(data, 'software-rnd'), /Unsupported URL/);
});

test('build is repeatable; check detects stale files without writing them', async t => {
  const directory = await fixture(t);
  assert.equal((await build({ directory })).length, 4);
  assert.deepEqual(await build({ directory }), []);
  assert.deepEqual(await build({ directory, check: true }), []);
  const output = resolve(directory, 'pages/example/index.html');
  const before = await readFile(output, 'utf8');
  await writeFile(resolve(directory, 'pages/example/article.md'), "# Example\n\nChanged $& and $' text.\n");
  await assert.rejects(build({ directory, check: true }), /Generated files are stale/);
  assert.equal(await readFile(output, 'utf8'), before);
  assert.deepEqual(await build({ directory }), ['pages/example/index.html']);
  const { document } = parseHTML(await readFile(output, 'utf8'));
  assert.ok(document.body.textContent.includes("Changed $& and $' text."));
});

test('invalid resources or template markers leave published HTML untouched', async t => {
  const directory = await fixture(t);
  await build({ directory });
  const output = resolve(directory, 'pages/example/index.html');
  const before = await readFile(output, 'utf8');
  await writeFile(resolve(directory, 'pages/example/article.md'), '# Example\n\n![Missing](missing.svg)\n');
  await assert.rejects(build({ directory }), /Missing resource/);
  assert.equal(await readFile(output, 'utf8'), before);
  await writeFile(resolve(directory, 'pages/example/article.md'), '# Example\n\nValid text.\n');
  const template = resolve(directory, 'pages/example/template.html');
  await writeFile(template, (await readFile(template, 'utf8')).replace('<!-- ARTICLE -->', ''));
  await assert.rejects(build({ directory }), /Expected one <!-- ARTICLE -->/);
  assert.equal(await readFile(output, 'utf8'), before);
});

test('real site exposes three articles and thirteen cards with canonical metadata', async () => {
  const outputs = await generate();
  const home = parseHTML(outputs.get('index.html')).document;
  assert.equal(home.querySelectorAll('a.work-card').length, 3);
  assert.equal(home.querySelectorAll('button.work-card[data-detail]').length, 10);
  const articles = [...outputs].filter(([path]) => path.startsWith('pages/'));
  assert.equal(articles.length, 3);
  for (const [path, html] of articles) {
    const { document } = parseHTML(html);
    assert.equal(document.querySelectorAll('#article-content h1').length, 1);
    assert.ok(document.querySelector('#article-content').textContent.length > 1000);
    assert.ok(!html.includes('Loading article'));
    assert.equal(document.querySelectorAll('link[rel="canonical"]').length, 1);
    const canonical = `https://www.quentinguignard.com/${path.replace(/index\.html$/, '')}`;
    assert.equal(document.querySelector('link[rel="canonical"]').getAttribute('href'), canonical);
    assert.equal(document.querySelector('meta[property="og:url"]').getAttribute('content'), canonical);
    assert.ok(document.querySelector('meta[property="og:image"]').getAttribute('content').startsWith('https://www.quentinguignard.com/'));
    assert.equal(document.querySelectorAll('script[src*="marked"]').length, 0);
  }
  assert.equal((outputs.get('sitemap.xml').match(/<loc>/g) || []).length, 7);
  assert.equal(outputs.get('robots.txt'), 'User-agent: *\nDisallow:\n\nSitemap: https://www.quentinguignard.com/sitemap.xml\n');
});
