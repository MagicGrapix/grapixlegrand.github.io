import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium, webkit } from 'playwright';
const base=process.env.SITE_URL||'http://127.0.0.1:8000';
const out='test-results/header-progress';await mkdir(out,{recursive:true});
for(const engine of [chromium,webkit]){
 const browser=await engine.launch({headless:true,...(engine===chromium?{channel:process.env.BROWSER_CHANNEL||'msedge'}:{})});
 try{
  const errors=[],page=await browser.newPage({viewport:{width:1440,height:900}});
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(1500);
  const header=await page.locator('.site-header').boundingBox();
  const clip={x:0,y:header.height-3,width:1440,height:3};
  for(const fraction of [0,.4]){
   await page.mouse.move(20,350);
   await page.evaluate(f=>scrollTo({top:(document.documentElement.scrollHeight-innerHeight)*f,behavior:'instant'}),fraction);await page.waitForTimeout(1300);
   const before=await page.screenshot({clip});
   const cv=await page.locator('.cv-link').boundingBox();
   await page.mouse.move(cv.x+cv.width/2,cv.y+cv.height/2);
   for(let frame=0;frame<8;frame++){
    const during=await page.screenshot({clip});
    assert.ok(before.equals(during),`${engine.name()}: CV hover must not repaint either progress or header separator`);
   }
  }
  await page.mouse.move(20,350);
  await page.evaluate(()=>scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'}));await page.waitForTimeout(1300);
  await page.evaluate(()=>{
   window.progressSamples=[];
   addEventListener('scroll',()=>requestAnimationFrame(()=>{
    const track=document.querySelector('.page-progress'),bar=track.firstElementChild;
    const max=document.documentElement.scrollHeight-innerHeight;
    window.progressSamples.push({y:scrollY,max,width:bar.getBoundingClientRect().width,track:track.clientWidth});
   }));
  });
  await page.locator('.back-top').click();await page.waitForFunction(()=>scrollY===0);await page.waitForTimeout(250);
  const samples=await page.evaluate(()=>window.progressSamples);
  assert.ok(samples.length>5,'Return to top remains animated');
  for(const sample of samples){
   const expected=sample.y<1?0:sample.max-sample.y<1?sample.track:sample.y/sample.max*sample.track;
   assert.ok(Math.abs(sample.width-expected)<1,`${engine.name()}: progress must follow scroll without a trailing animation`);
  }
  assert.equal(await page.locator('.page-progress i').evaluate(el=>el.getBoundingClientRect().width),0,'No residual orange bar at the top');
  await page.screenshot({path:`${out}/${engine.name()}-fixed-header.png`,clip:{x:0,y:0,width:1440,height:90}});
  assert.deepEqual(errors,[]);
  console.log(`PASS ${engine.name()}: pixel-stable CV hover, progress synchronized during Back to the top, empty at the top.`);
 }finally{await browser.close();}
}
