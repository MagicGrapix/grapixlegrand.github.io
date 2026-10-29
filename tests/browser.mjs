import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const baseline = process.argv.includes('--baseline');
const base = process.env.SITE_URL || 'http://127.0.0.1:8000';
const output = `test-results/${baseline ? 'before' : 'after'}`;
const articles = ['minecraft-agent', 'controlling-generative-ai-for-game-content', 'levekgl'];
const browser = await chromium.launch({
  channel: process.env.BROWSER_CHANNEL || (process.platform === 'win32' ? 'msedge' : undefined),
  headless: true,
});
const failures = [];
const requests = [];
const snapshots = {};
await mkdir(output, { recursive: true });

async function makeContext(options = {}) {
  const context = await browser.newContext(options);
  // External video players are independent of the site's HTML and can delay QA.
  await context.route(/https:\/\/(www\.)?(youtube(-nocookie)?\.com|itch\.io)\/embed/, route => route.abort());
  context.on('page', page => {
    page.on('pageerror', error => failures.push(error.message));
    page.on('request', request => {
      if (request.url().startsWith(base)) requests.push(new URL(request.url()).pathname);
    });
    page.on('response', response => {
      if (response.url().startsWith(base) && response.status() >= 400 && !response.url().endsWith('/favicon.ico')) {
        failures.push(`${response.status()} ${response.url()}`);
      }
    });
  });
  return context;
}

async function ready(page, article = false) {
  await page.waitForFunction(isArticle => isArticle
    ? !!document.querySelector('#article-content h1')
    : document.querySelectorAll('.work-card').length === 13, article);
  await page.addStyleTag({ content: '* { animation: none !important; transition: none !important; }' });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].filter(image => image.getAttribute('src')).map(image => {
      image.loading = 'eager';
      if (image.complete) return;
      return new Promise(resolve => { image.onload = resolve; image.onerror = resolve; });
    }));
  });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, 'Horizontal overflow');
  const broken = await page.evaluate(() => [...document.images]
    .filter(image => image.getAttribute('src') && new URL(image.src).origin === location.origin && !image.naturalWidth)
    .map(image => image.getAttribute('src')));
  assert.deepEqual(broken, [], 'Broken local images');
}

try {
  for (const width of [1440, 390]) {
    const context = await makeContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    for (const slug of ['home', ...articles]) {
      await page.goto(`${base}/${slug === 'home' ? '' : `pages/${slug}/`}`, { waitUntil: 'domcontentloaded' });
      await ready(page, slug !== 'home');
      snapshots[`${slug}-${width}`] = await page.locator('.work-card, #article-content > *').evaluateAll(elements => elements.map(element => {
        const box = element.getBoundingClientRect();
        return { tag: element.tagName, text: element.textContent.replace(/\s+/g, ' ').trim(), x: box.x, y: box.y, width: box.width, height: box.height };
      }));
      await page.screenshot({ path: `${output}/${slug}-${width}.png`, fullPage: slug === 'home' });
      if (slug !== 'home') {
        assert.equal(await page.locator('h1').count(), 1);
        const opener = page.locator('#article-content a.image-expand').first();
        await opener.click();
        await page.waitForFunction(() => document.querySelector('#image-dialog').open);
        await page.keyboard.press('Escape');
        await page.waitForFunction(() => !document.querySelector('#image-dialog').open);
        assert.equal(await opener.evaluate(element => document.activeElement === element), true, 'Image opener focus restored');
      }
    }
    {
      await page.goto(base, { waitUntil: 'domcontentloaded' });
      await ready(page);
      const ids = await page.locator('button.work-card').evaluateAll(cards => cards.map(card => card.dataset.projectId));
      assert.equal(ids.length, 10, 'Existing overlay cards remain buttons');
      for (const id of ids) {
        await page.locator(`button.work-card[data-project-id="${id}"]`).click();
        await page.locator('#work-detail .work-detail__title').waitFor();
        if (width === 1440) snapshots[`overlay-${id}`] = await page.locator('#work-detail').evaluate(element => element.textContent.replace(/\s+/g, ' ').trim());
        assert.equal(page.url().replace(/\/$/, ''), base.replace(/\/$/, ''), 'Overlay must not navigate');
        if (id === 'backroom' || id === 'village') {
          const slides = page.locator('#work-detail .media-gallery__slide');
          await page.locator('#work-detail .media-gallery__btn--next').click();
          assert.match(await slides.nth(1).getAttribute('class'), /is-active/);
          await page.locator('#work-detail .media-gallery__btn--prev').click();
          assert.match(await slides.first().getAttribute('class'), /is-active/);
        }
        if (id === 'painting') {
          await page.locator('.painting-gallery__item').first().click();
          assert.equal(await page.locator('#painting-lightbox').isVisible(), true);
          await page.keyboard.press('Escape');
        }
        if (id === 'thesis') await page.screenshot({ path: `${output}/thesis-overlay${width === 1440 ? '' : '-mobile'}.png` });
        await page.keyboard.press('Escape');
        await page.waitForFunction(() => document.querySelector('#work-overlay').hidden);
      }
    }
    await context.close();
  }

  if (!baseline) {
    const context = await makeContext({ javaScriptEnabled: false, viewport: { width: 390, height: 900 } });
    const page = await context.newPage();
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    assert.equal(await page.locator('.work-card').count(), 13);
    assert.equal(await page.locator('button.work-card').count(), 10);
    assert.equal(await page.locator('a.work-card').count(), 3);
    for (const slug of articles) {
      await page.goto(base, { waitUntil: 'domcontentloaded' });
      await page.locator(`a.work-card[href$="/${slug}/"]`).click();
      assert.equal(page.url(), `${base}/pages/${slug}/`, 'Native article navigation without JavaScript');
      assert.equal(await page.locator('#article-content h1').count(), 1);
      assert.ok((await page.locator('#article-content').textContent()).length > 1000);
      assert.ok(await page.locator('#article-content figure').count() > 0);
      assert.equal(await page.locator('text=Loading article…').count(), 0);
    }
    await context.close();
    assert.equal(requests.some(path => path.endsWith('/article.md') || /^\/cards\/.*\.json$/.test(path)), false, 'No client-side content generation');
    let before;
    try { before = JSON.parse(await readFile('test-results/before/layout.json', 'utf8')); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (before) {
      for (const [key, snapshot] of Object.entries(snapshots)) {
        if (typeof snapshot === 'string') { assert.equal(snapshot, before[key], key); continue; }
        assert.equal(snapshot.length, before[key].length, `${key}: element count`);
        snapshot.forEach((element, index) => {
          const old = before[key][index];
          assert.equal(element.tag, old.tag, `${key} #${index}: tag`);
          assert.equal(element.text, old.text, `${key} #${index}: text`);
          for (const dimension of ['x', 'y', 'width', 'height']) {
            assert.ok(Math.abs(element[dimension] - old[dimension]) <= 1, `${key} #${index}: ${dimension} changed (${old[dimension]} → ${element[dimension]})`);
          }
        });
      }
      console.log('Before/after: matching content and layout at 1440px and 390px; ten overlay contents unchanged.');
    }
  }
  assert.deepEqual(failures, [], 'Browser errors or failed local resources');
  await writeFile(`${output}/layout.json`, JSON.stringify(snapshots, null, 2));
  console.log(`${baseline ? 'Baseline' : 'Browser tests'} passed: three articles, ten overlays, image dialogs, image/video galleries, desktop and mobile.`);
} finally {
  await browser.close();
}
