import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
const base = process.env.SITE_URL || 'http://127.0.0.1:8000';
const out = 'test-results/gateway';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge', headless: true });
const errors = [];
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await context.addInitScript(() => {
  const clear = CanvasRenderingContext2D.prototype.clearRect, arc = CanvasRenderingContext2D.prototype.arc;
  CanvasRenderingContext2D.prototype.clearRect = function (...args) {
    if (this.canvas.classList.contains('hero-canvas')) window.particleFrame = [];
    return clear.apply(this, args);
  };
  CanvasRenderingContext2D.prototype.arc = function (...args) {
    if (this.canvas.classList.contains('hero-canvas')) window.particleFrame.push(args.slice(0, 2));
    return arc.apply(this, args);
  };
});
context.on('page', page => page.on('pageerror', e => errors.push(e.message)));
const page = await context.newPage();
async function ready(p) {
  await p.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].filter(i => i.getAttribute('src')).map(i => { i.loading = 'eager'; return i.decode().catch(() => {}); }));
  });
  assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, 'No horizontal overflow');
  assert.deepEqual(await p.evaluate(() => [...document.images].filter(i => i.getAttribute('src') && !i.naturalWidth).map(i => i.src)), [], 'Images loaded');
}
const top = (id = 'software') => page.evaluate(id => document.getElementById(id).getBoundingClientRect().top + scrollY - document.querySelector('.site-header').offsetHeight, id);
async function at(y) {
  try { await page.waitForFunction(value => Math.abs(scrollY - value) < 3, y); }
  catch (error) { console.log('Navigation failure', { expected: y, ...await page.evaluate(() => ({ y: scrollY, active: document.activeElement.outerHTML.slice(0,160) })) }); throw error; }
  await page.waitForTimeout(900);
}
try {
  await page.goto(base); await ready(page); await page.waitForTimeout(1500);
  assert.equal(await page.locator('h1').count(), 1);
  assert.equal(await page.locator('.work-card').count(), 13);
  assert.notEqual(await page.locator('.name .letter').first().evaluate(e => getComputedStyle(e).color), 'rgba(0, 0, 0, 0)');
  assert.deepEqual(await page.locator('.portfolio-content > section').evaluateAll(elements => elements.map(el => el.id)), ['about','software','art','experience','games','contact']);
  assert.equal(await page.locator('#about .stack-band,.about-background').count(), 0);
  const nav = await page.locator('.section-links').boundingBox();
  assert.ok(Math.abs(nav.x + nav.width / 2 - 720) < 2, 'Centered desktop navigation');
  assert.equal(await page.locator('#contact .portrait, #contact .about-title').count(), 0);
  await page.locator('.motion-replay').click();
  await page.locator('.motion-replay').evaluate(e => e.blur());
  await page.waitForTimeout(250);
  assert.notEqual(await page.locator('.name-line').first().evaluate(e => getComputedStyle(e).clipPath), 'none', 'Finite scan reveal runs');
  await page.screenshot({ path: `${out}/desktop-scan.png` });
  await page.waitForTimeout(1450);
  const particlesBefore = await page.evaluate(() => window.particleFrame);
  await page.waitForTimeout(700);
  const particleDirections = await page.evaluate(before => window.particleFrame.map((point, i) => point[0] - before[i][0]), particlesBefore);
  assert.ok(particleDirections.filter(dx => dx > 4 && dx < 100).length > 15, 'Rendered particles flow right');
  assert.ok(particleDirections.filter(dx => dx < -4 && dx > -100).length > 15, 'Rendered particles flow left');
  await page.screenshot({ path: `${out}/desktop-hero.png` });
  await page.mouse.move(550, 380);
  for (let round = 0; round < 2; round++) {
    await page.mouse.wheel(0, 280); await at(await top('about'));
    await page.mouse.wheel(0, 280); await at(await top());
    await page.mouse.wheel(0, -280); await at(await top('about'));
    await page.mouse.wheel(0, -280); await at(0);
  }
  await page.keyboard.press('PageDown'); await at(await top('about'));
  await page.screenshot({ path: `${out}/desktop-about.png` });
  assert.ok(await page.locator('#about .continue-work').evaluate(e => e.getBoundingClientRect().bottom < innerHeight), 'Desktop presentation fits in one screen');
  await page.keyboard.press('PageDown'); await at(await top());
  await page.keyboard.press('PageUp'); await at(await top('about'));
  await page.keyboard.press('PageUp'); await at(0);
  await page.locator('.section-links a[href="#software"]').click(); await at(await top());
  await page.screenshot({ path: `${out}/desktop-projects.png` });
  const before = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, 240); await page.waitForTimeout(450);
  assert.ok(await page.evaluate(y => scrollY > y + 100 && scrollY < y + 500, before), 'Native scrolling below the introduction');
  await page.locator('button[data-project-id="thesis"]').click();
  await page.locator('#work-detail .work-detail__title').waitFor();
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => document.getElementById('work-overlay').hidden);
  await page.locator('.section-links a[href="#about"]').click();
  await at(await top('about'));
  const letter = page.locator('.about-title .letter').first();
  const bounds = await letter.boundingBox();
  await page.mouse.move(bounds.x + bounds.width / 2 - 10, bounds.y + bounds.height / 2);
  await page.waitForTimeout(400);
  assert.notEqual(await letter.evaluate(e => getComputedStyle(e).textShadow), 'none', 'About title chromatic pointer response');
  await page.locator('.section-links a[href="#contact"]').click();
  await page.waitForTimeout(1400);
  await page.screenshot({ path: `${out}/desktop-contact.png` });
  await page.locator('.motion-pause').click();
  assert.equal(await page.locator('body').evaluate(e => e.classList.contains('motion-off')), true);
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await page.waitForTimeout(200);
  assert.equal(await page.evaluate(() => document.documentElement.style.getPropertyValue('--progress')), '1');
  await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(200);
  assert.equal(await page.evaluate(() => document.documentElement.style.getPropertyValue('--progress')), '0');
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  const phone = await mobile.newPage(); phone.on('pageerror', e => errors.push(e.message));
  await phone.goto(base); await ready(phone);
  await phone.screenshot({ path: `${out}/mobile-hero.png` });
  await phone.screenshot({ path: `${out}/mobile-full.png`, fullPage: true });
  await phone.locator('.enter-work').click(); await phone.waitForTimeout(150);
  assert.ok(await phone.evaluate(() => scrollY > 100));
  await phone.screenshot({ path: `${out}/mobile-about.png` });
  await phone.locator('.continue-work').scrollIntoViewIfNeeded();
  await phone.screenshot({ path: `${out}/mobile-about-bottom.png` });
  await phone.locator('.continue-work').click(); await phone.waitForTimeout(150);
  await phone.screenshot({ path: `${out}/mobile-projects.png` });
  assert.equal(await phone.locator('.compact-projects').isVisible(), false);
  assert.equal(await phone.locator('.wordmark').isVisible(), false);
  assert.equal(await phone.locator('.socials a').count(), 5);
  await mobile.close();
  const touchContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const touchPage = await touchContext.newPage();
  touchPage.on('pageerror', e => errors.push(e.message));
  await touchPage.goto(base); await ready(touchPage);
  const cdp = await touchContext.newCDPSession(touchPage);
  async function swipe(up = true) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 200, y: up ? 650 : 300 }] });
    for (let step = 1; step <= 8; step++) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 200, y: up ? 650 - step * 20 : 300 + step * 20 }] });
      await touchPage.waitForTimeout(25);
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await touchPage.waitForTimeout(1100);
  }
  const mobileTop = id => touchPage.evaluate(id => document.getElementById(id).getBoundingClientRect().top + scrollY - document.querySelector('.site-header').offsetHeight, id);
  await swipe();
  assert.ok(Math.abs(await touchPage.evaluate(() => scrollY) - await mobileTop('about')) < 5, 'Touch guides intro to About');
  assert.ok(await touchPage.locator('#about').evaluate(el => el.offsetHeight <= innerHeight - document.querySelector('.site-header').offsetHeight + 2), 'Mobile About fits the screen');
  await swipe();
  assert.ok(Math.abs(await touchPage.evaluate(() => scrollY) - await mobileTop('software')) < 5, 'Touch guides About to projects');
  await swipe(false);
  assert.ok(Math.abs(await touchPage.evaluate(() => scrollY) - await mobileTop('about')) < 5, 'Touch guides projects back to About');
  await swipe(false);
  assert.ok(await touchPage.evaluate(() => scrollY < 5), 'Touch returns to the title');
  await touchContext.close();
  const staticContext = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const staticPage = await staticContext.newPage(); await staticPage.goto(base);
  assert.equal(await staticPage.locator('.work-card').count(), 13);
  assert.ok((await staticPage.locator('.about-paragraphs').textContent()).includes('software engineer'));
  await staticPage.locator('a.work-card[href$="/minecraft-agent/"]').click();
  assert.ok((await staticPage.locator('#article-content').textContent()).length > 1000);
  await staticContext.close();
  assert.deepEqual(errors, [], 'No JavaScript errors');
  console.log('Gateway passed: intro/About/projects order, repeated wheel and keyboard boundaries, free content scroll, finite name scan, chromatic About, images, overlay, progress, mobile, reduced motion and no-JS content.');
} finally { await browser.close(); }
