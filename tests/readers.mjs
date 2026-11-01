import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = process.env.SITE_URL || 'http://127.0.0.1:8000';
const output = 'test-results/readers';
const routes = [
  ['minecraft', '/pages/minecraft-agent/'],
  ['genai', '/pages/controlling-generative-ai-for-game-content/'],
  ['levekgl', '/pages/levekgl/'],
  ['rendering', '/cg22/report.html'],
  ['supervoxel', '/SuperVoxel/index.html'],
  ['supervoxel-archive', '/SuperVoxel/SuperVoxel.html'],
  ['shuffling', '/shuffling/story.html'],
];
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: process.platform === 'win32' ? 'msedge' : undefined, headless: true });
const results = [];
const failures = [];
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    await context.route(/https:\/\/(www\.)?(youtube(-nocookie)?\.com|itch\.io)\/embed|https:\/\/godbolt.org\/e/, route => route.abort());
    const page = await context.newPage();
    page.on('pageerror', error => failures.push(error.message));
    page.on('response', response => { if (response.url().startsWith(base) && response.status() >= 400 && !response.url().endsWith('favicon.ico')) failures.push(`${response.status()} ${response.url()}`); });
    for (const [name, route] of routes) {
      await page.goto(base + route, { waitUntil: 'load' });
      await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all([...document.images].filter(image => image.getBoundingClientRect().top < innerHeight).map(image => image.decode().catch(() => {})));
      });
      await page.waitForTimeout(300);
      assert.equal(await page.locator('h1').count(), 1, `${name}: one title`);
      assert.equal(await page.locator('.reader-header').count(), 1);
      const geometry = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - innerWidth,
        background: getComputedStyle(document.body).backgroundColor,
        family: getComputedStyle(document.body).fontFamily,
        heading: document.querySelector('h1').textContent,
      }));
      assert.ok(geometry.overflow <= 1, `${name} at ${width}px: horizontal overflow ${geometry.overflow}`);
      assert.equal(geometry.background, 'rgb(25, 30, 40)');
      assert.ok(geometry.family.includes('Manrope'));
      assert.equal(await page.locator('.reader-return').first().getAttribute('href'), route.startsWith('/pages/') ? '../../#software' : '../#software');
      await page.screenshot({ path: `${output}/${name}-${width}.png` });
      if (name === 'rendering') {
        const comparison = page.locator('.twentytwenty-container').first();
        await comparison.scrollIntoViewIfNeeded();
        await page.waitForFunction(() => !!document.querySelector('.twentytwenty-overlay'));
        const image = comparison.locator('img').first();
        const box = await comparison.boundingBox();
        const initial = await image.evaluate(el => el.style.clip);
        const imageBox = await image.boundingBox();
        assert.ok(Math.abs(box.height - imageBox.height) < 4, 'Comparison frame fits its rendered images');
        await page.mouse.move(box.x + box.width * .75, box.y + box.height * .3, { steps: 8 });
        assert.notEqual(await image.evaluate(el => el.style.clip), initial, 'Rendering comparison responds to pointer');
        await page.screenshot({ path: `${output}/rendering-comparison-${width}.png` });
      }
      results.push({ name, width, ...geometry });
    }
    await context.close();
  }
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  for (const [, route] of routes) {
    await page.goto(base + route, { waitUntil: 'domcontentloaded' });
    assert.ok((await page.locator('#article-content').innerText()).length > 1500, `${route}: readable without JavaScript`);
  }
  await context.close();
  assert.deepEqual(failures, [], 'Browser or local resource failures');
  await writeFile(`${output}/results.json`, JSON.stringify(results, null, 2));
  console.log('Seven reader routes pass on desktop and mobile, comparison drag works, content remains available without JavaScript.');
} finally { await browser.close(); }
