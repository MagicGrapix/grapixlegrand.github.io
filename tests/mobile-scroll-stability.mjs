import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium, webkit } from 'playwright';
const base=process.env.SITE_URL||'http://127.0.0.1:8000';
const out='test-results/mobile-scroll-stability';await mkdir(out,{recursive:true});
for(const engine of [webkit,chromium]){
 const browser=await engine.launch({headless:true,...(engine===chromium?{channel:process.env.BROWSER_CHANNEL||'msedge'}:{})});
 const errors=[];
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base);await page.evaluate(()=>document.fonts.ready);
  const top=id=>page.evaluate(id=>{const el=document.getElementById(id);return Math.max(0,el.getBoundingClientRect().top+scrollY-(id==='home'?0:document.querySelector('.site-header').offsetHeight));},id);
  async function at(id){
   const expected=await top(id);
   try{await page.waitForFunction(y=>Math.abs(scrollY-y)<2,expected,{timeout:4000});}
   catch(error){console.log(engine.name(),id,{expected,...await page.evaluate(()=>({y:scrollY,reduced:matchMedia('(prefers-reduced-motion:reduce)').matches})),errors});throw error;}
  }
  await page.locator('.enter-work').tap();await at('about');
  await page.locator('.continue-work').tap();await at('software');
  await page.waitForTimeout(120);
  await page.evaluate(()=>scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'}));await page.waitForTimeout(1700);
  assert.ok(await page.evaluate(()=>Math.abs(scrollY+innerHeight-document.documentElement.scrollHeight)<24),`${engine.name()}: bottom remains at contact`);
  await page.evaluate(()=>scrollBy({top:500,behavior:'instant'}));await page.waitForTimeout(350);
  assert.ok(await page.evaluate(()=>Math.abs(scrollY+innerHeight-document.documentElement.scrollHeight)<24),'Scrolling beyond the bottom cannot return to projects');
  await page.setViewportSize({width:390,height:740});await page.waitForTimeout(200);
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(600);
  assert.ok(await page.evaluate(()=>scrollY>document.documentElement.scrollHeight-innerHeight-500),'Viewport changes keep the reader near the footer');
  await page.screenshot({path:`${out}/${engine.name()}-footer.png`});

  for(const [landing,arrow,destination] of [['about','.continue-work','software'],['home','.enter-work','about']]){
   await page.evaluate(y=>scrollTo({top:y+500,behavior:'instant'}),await top('software'));
   await page.evaluate(y=>scrollTo({top:y,behavior:'smooth'}),await top(landing));await page.waitForTimeout(80);
   // Dispatch during movement: Playwright's normal tap waits for a stable element.
   await page.locator(arrow).dispatchEvent('click');await at(destination);await page.waitForTimeout(1400);
   assert.ok(Math.abs(await page.evaluate(()=>scrollY)-await top(destination))<2,`${engine.name()}: arrow replaces an unfinished reverse scroll`);
  }
  await page.locator('.continue-work').dispatchEvent('click');await page.waitForTimeout(60);
  await page.locator('.back-top').dispatchEvent('click');await page.waitForTimeout(60);
  await page.locator('.enter-work').dispatchEvent('click');await at('about');await page.waitForTimeout(1400);
  assert.ok(Math.abs(await page.evaluate(()=>scrollY)-await top('about'))<2,'The latest of three quick navigation requests wins');
  await page.screenshot({path:`${out}/${engine.name()}-about.png`});

  await page.locator('.continue-work').dispatchEvent('click');await page.waitForTimeout(80);
  const free=await top('software')+300;
  await page.evaluate(y=>{document.body.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerType:'touch'}));scrollTo({top:y,behavior:'instant'});},free);
  await page.waitForTimeout(1500);
  assert.ok(Math.abs(await page.evaluate(()=>scrollY)-free)<2,'A new gesture cancels navigation without a later forced return');
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.waitForFunction(()=>document.body.classList.contains('motion-off'));
  await page.locator('.enter-work').dispatchEvent('click');await at('about');
  assert.deepEqual(errors,[]);
  console.log(`PASS ${engine.name()}: footer and resize stability, quick arrows during reverse scrolling, latest request, interruption and reduced motion.`);
 }finally{await browser.close();}
}
