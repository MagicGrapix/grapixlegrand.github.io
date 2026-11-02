import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = process.env.SITE_URL || 'http://127.0.0.1:8000';
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || (process.platform === 'win32' ? 'msedge' : undefined), headless: true });
const out = 'test-results/mobile-interactions';
await mkdir(out, { recursive: true });
const errors = [];
const styles = element => {
  const css = getComputedStyle(element), image = element.querySelector('.project-media img');
  return { color: css.color, background: css.backgroundColor, border: css.borderColor, transform: image ? getComputedStyle(image).transform : css.transform };
};
async function forceHover(page, selector, enabled) {
  const session = await page.context().newCDPSession(page);
  await session.send('DOM.enable'); await session.send('CSS.enable');
  const { root } = await session.send('DOM.getDocument');
  const { nodeId } = await session.send('DOM.querySelector', { nodeId: root.nodeId, selector });
  await session.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: enabled ? ['hover'] : [] });
  return session;
}
async function swipe(page, start, end) {
  const session = await page.context().newCDPSession(page);
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [start] });
  for (let step = 1; step <= 10; step++) {
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: start.x + (end.x - start.x) * step / 10, y: start.y + (end.y - start.y) * step / 10 }] });
    await page.waitForTimeout(20);
  }
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(950); await session.detach();
}
try {
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  mobile.on('page', p => p.on('pageerror', e => errors.push(e.message)));
  await mobile.addInitScript(() => {
    const request = requestAnimationFrame, cancel = cancelAnimationFrame, pending = new Set();
    window.requestAnimationFrame = callback => {
      const id = request(time => { pending.delete(id); callback(time); }); pending.add(id); return id;
    };
    window.cancelAnimationFrame = id => { pending.delete(id); cancel(id); };
    window.discardFrames = () => { for (const id of pending) cancel(id); pending.clear(); };
    window.paintCounts = { hero: 0, portrait: 0 };
    const clear = CanvasRenderingContext2D.prototype.clearRect;
    CanvasRenderingContext2D.prototype.clearRect = function (...args) {
      if (this.canvas.matches('.hero-canvas')) window.paintCounts.hero++;
      if (this.canvas.matches('.portrait-code')) window.paintCounts.portrait++;
      return clear.apply(this, args);
    };
  });
  await mobile.route('https://www.linkedin.com/**', route => route.fulfill({ contentType: 'text/html', body: '<p>External destination fixture</p>' }));
  const page = await mobile.newPage(); await page.goto(base); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(1500);
  for (const selector of ['.social[aria-label="LinkedIn"]', '.social[aria-label="GitHub"]', '.cv-link', '.enter-work']) {
    const button = page.locator(selector), before = await button.evaluate(styles);
    const forced = await forceHover(page, selector, true); await page.waitForTimeout(500);
    assert.deepEqual(await button.evaluate(styles), before, `Touch must not retain hover styling: ${selector}`);
    await forced.detach();
  }
  const linkedin = page.locator('.social[aria-label="LinkedIn"]'), beforeLink = await linkedin.evaluate(styles);
  const popupReady = mobile.waitForEvent('page'); await linkedin.tap(); const popup = await popupReady;
  await popup.waitForLoadState('domcontentloaded'); await popup.close(); await page.bringToFront(); await page.waitForTimeout(500);
  assert.deepEqual(await linkedin.evaluate(styles), beforeLink, 'Returning from an external link clears touch highlighting');
  async function restoredAnimation(key) {
    await page.evaluate(() => { window.discardFrames(); dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })); });
    const before = await page.evaluate(key => window.paintCounts[key], key);
    await page.waitForTimeout(250);
    assert.ok(await page.evaluate(({ key, before }) => window.paintCounts[key] > before + 2, { key, before }), `${key} rendering resumes after restoring cached page`);
  }
  await restoredAnimation('hero');
  await page.locator('.enter-work').tap(); await page.waitForTimeout(1100);
  await restoredAnimation('portrait');
  assert.ok(await page.locator('#about').evaluate(el => el.offsetHeight <= innerHeight - document.querySelector('.site-header').offsetHeight + 2), 'Updated About still fits a mobile screen');
  await page.screenshot({ path: `${out}/about-mobile.png` });
  await page.locator('.continue-work').tap(); await page.waitForTimeout(1100);
  for (const id of ['minecraft', 'thesis']) {
    const selector = `[data-project-id="${id}"]`, card = page.locator(selector);
    await card.evaluate(el => scrollTo({ top: el.getBoundingClientRect().top + scrollY - 110, behavior: 'instant' })); await page.waitForTimeout(500);
    const before = await card.evaluate(styles), forced = await forceHover(page, selector, true); await page.waitForTimeout(700);
    assert.deepEqual(await card.evaluate(styles), before, 'Touch hover does not select or zoom a card');
    await forced.detach();
    const scrollBefore = await page.evaluate(() => scrollY), urlBefore = page.url();
    await swipe(page, { x: 190, y: 430 }, { x: 190, y: 210 });
    assert.ok(await page.evaluate(y => scrollY > y + 30, scrollBefore), 'Swiping a card scrolls normally');
    assert.equal(page.url(), urlBefore); assert.equal(await page.locator('#work-overlay').isVisible(), false, 'A drag never opens a project');
  }
  const thesis = page.locator('[data-project-id="thesis"]'); await thesis.tap();
  await page.locator('.work-detail__title').waitFor(); assert.equal(await page.locator('.work-detail__title').innerText(), 'Master Thesis', 'A deliberate tap still opens the card');
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto(base + '/#about'); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(1200);
  assert.ok(await page.locator('#about').evaluate(el => el.offsetHeight <= innerHeight - document.querySelector('.site-header').offsetHeight + 2), 'About also fits a short mobile screen');
  await page.screenshot({ path: `${out}/about-mobile-short.png` });
  await page.goto(base + '/pages/levekgl/');
  const returnLink = page.locator('.reader-header .reader-return'), returnBefore = await returnLink.evaluate(styles);
  const readerHover = await forceHover(page, '.reader-header .reader-return', true); await page.waitForTimeout(400);
  assert.deepEqual(await returnLink.evaluate(styles), returnBefore, 'Reader controls do not keep touch hover'); await readerHover.detach();
  await mobile.close();

  const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  await desktop.goto(base);
  const social = desktop.locator('.social[aria-label="GitHub"]'), normal = await social.evaluate(styles);
  await social.hover(); assert.notEqual((await social.evaluate(styles)).color, normal.color, 'Mouse hover remains active');
  await desktop.mouse.move(0, 700); await desktop.keyboard.press('Tab');
  assert.equal(await desktop.evaluate(() => document.activeElement.matches(':focus-visible')), true, 'Keyboard focus remains visible');
  await desktop.locator('.enter-work').click(); await desktop.screenshot({ path: `${out}/about-desktop.png` });
  await desktop.close();
  assert.deepEqual(errors, []);
  await writeFile(`${out}/results.json`, JSON.stringify({ status: 'passed', errors, checks: ['touch hover', 'external-link return', 'canvas restore', 'card drag versus tap', 'reader controls', 'desktop hover', 'keyboard focus'], devices: 'Chromium desktop and touch emulation; physical iPhone not verified' }, null, 2));
  console.log('PASS: touch styling, link return, restored animations, swipe/tap separation, desktop hover and keyboard focus.');
} finally { await browser.close(); }
