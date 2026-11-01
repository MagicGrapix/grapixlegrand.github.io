const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const top = (page, id) => page.evaluate(id => document.getElementById(id).getBoundingClientRect().top + scrollY - document.querySelector('.site-header').offsetHeight, id);

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const results = [], errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on('pageerror', e => errors.push(e.message));
    await page.goto((process.env.SITE_URL || 'http://127.0.0.1:8000'));
    await page.evaluate(() => document.fonts.ready);
    await page.locator('.enter-work').click(); await wait(1000);
    const about = await top(page, 'about'), projects = await top(page, 'software');
    for (const project of ['thesis', 'minecraft']) {
      await page.locator('.continue-work').click(); await wait(1000);
      const card = await page.locator(`[data-project-id="${project}"]`).boundingBox();
      await page.mouse.move(card.x + card.width / 2, card.y + card.height / 2);
      await page.mouse.wheel(0, 100); await wait(250);
      const before = await page.evaluate(() => scrollY);
      await page.mouse.wheel(0, -180); await wait(1000);
      const after = await page.evaluate(() => scrollY);
      results.push({ input: 'wheel', project, before, after, expected: about, passed: Math.abs(after - about) < 4 });
      await page.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), about); await wait(1000);
    }
    await page.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), projects + 500);
    await page.mouse.move(30, 450); await page.mouse.wheel(0, -60); await wait(400);
    const free = await page.evaluate(() => scrollY);
    results.push({ input: 'wheel', project: 'within-projects', after: free, passed: free > projects && free < projects + 500 });

    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const phone = await context.newPage(); phone.on('pageerror', e => errors.push(e.message));
    await phone.goto((process.env.SITE_URL || 'http://127.0.0.1:8000')); await phone.evaluate(() => document.fonts.ready);
    const phoneAbout = await top(phone, 'about'), phoneProjects = await top(phone, 'software');
    await phone.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), phoneProjects + 100); await wait(1000);
    const session = await context.newCDPSession(phone);
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 190, y: 250 }] });
    for (let i = 1; i <= 8; i++) {
      await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 190, y: 250 + i * 40 }] }); await wait(20);
    }
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await wait(1100);
    const phoneAfter = await phone.evaluate(() => scrollY);
    results.push({ input: 'touch', after: phoneAfter, expected: phoneAbout, passed: Math.abs(phoneAfter - phoneAbout) < 4 });
    console.log(JSON.stringify({ results, errors }, null, 2));
    assert.ok(results.every(result => result.passed), 'Returning across the projects boundary must settle on About');
    assert.deepEqual(errors, []);
    fs.mkdirSync(path.join(__dirname, '../test-results'), { recursive: true });
    fs.writeFileSync(path.join(__dirname, '../test-results/scroll-return.json'), JSON.stringify({ results, errors }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
