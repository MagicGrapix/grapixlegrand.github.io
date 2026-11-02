import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = process.env.SITE_URL || 'http://127.0.0.1:8000';
const out = 'test-results/platform-motion';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge', headless: true });
const errors = [];
async function settle(page) { await page.waitForTimeout(1200); }
async function entrance(page, selector) {
  await page.waitForFunction(selector => document.querySelector(selector).getAnimations().some(a => a.playState === 'running'), selector);
  const result = await page.locator(selector).first().evaluate(el => {
    const animation = el.getAnimations()[0], css = getComputedStyle(el);
    return { timing: animation.effect.getTiming(), frames: animation.effect.getKeyframes(), transform: css.transform, opacity: Number(css.opacity) };
  });
  assert.ok(result.timing.duration >= 500, `${selector}: perceptible entrance`);
  assert.notEqual(result.frames[0].transform, result.frames.at(-1).transform, `${selector}: actual movement`);
  assert.ok(result.opacity < 1, `${selector}: visible fade in progress`);
}
try {
  for (const [label, width, height, touch] of [['desktop',1440,900,false],['mobile',390,844,true],['short-mobile',375,667,true]]) {
    const page = await browser.newPage({ viewport: { width, height }, isMobile: touch, hasTouch: touch });
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(base); await page.evaluate(() => document.fonts.ready); await settle(page);
    const first = await page.locator('.enter-work').boundingBox();
    await page.screenshot({ path: `${out}/${label}-hero.png` });
    await page.locator('.enter-work').click();
    await entrance(page, '#about-title');
    await settle(page);
    const second = await page.locator('.step-arrow').boundingBox();
    assert.ok(Math.abs(first.y + first.height / 2 - second.y - second.height / 2) < 2, `${label}: arrows share the same vertical position`);
    assert.ok(await page.locator('#about').evaluate(el => el.offsetHeight <= innerHeight - document.querySelector('.site-header').offsetHeight + 2), `${label}: About fits the screen`);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${label}: no horizontal overflow`);
    await page.screenshot({ path: `${out}/${label}-about.png` });
    if (touch && label === 'mobile') {
      await page.locator('.continue-work').click();
      await entrance(page, '#software .project-card');
      await settle(page);
      assert.equal(await page.locator('#software .project-card').first().evaluate(el => getComputedStyle(el).opacity), '1');
      await page.evaluate(() => scrollTo({top: document.querySelector('#about').offsetTop - document.querySelector('.site-header').offsetHeight, behavior:'instant'}));
      await settle(page);
      await page.locator('.continue-work').click();
      await entrance(page, '#software .project-card');
      await settle(page);
      await page.screenshot({ path: `${out}/mobile-projects.png` });
    }
    await page.close();
  }
  const reduced = await browser.newPage({ viewport: {width:390,height:844}, isMobile:true, hasTouch:true, reducedMotion:'reduce' });
  await reduced.goto(base); await reduced.locator('.enter-work').click();
  assert.equal(await reduced.locator('#about-title').evaluate(el => getComputedStyle(el).opacity), '1');
  assert.equal(await reduced.locator('#about-title').evaluate(el => el.getAnimations().length), 0, 'Reduced motion stays static');
  await reduced.close();
  assert.deepEqual(errors, []);
  console.log('PASS: aligned arrows at three sizes, mobile text/card entrances and re-entry, reduced motion, no overflow or script errors.');
} finally { await browser.close(); }
