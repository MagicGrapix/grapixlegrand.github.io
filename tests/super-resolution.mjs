import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium,webkit} from 'playwright';
const base=process.env.SITE_URL||'http://127.0.0.1:8002',out='test-results/super-resolution';await mkdir(out,{recursive:true});
for(const engine of [chromium,webkit]){
 const browser=await engine.launch({headless:true,...(engine===chromium?{channel:process.env.BROWSER_CHANNEL||'msedge'}:{})});
 try{for(const mobile of [false,true]){
  const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1440,height:1000},isMobile:mobile,hasTouch:mobile}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/projects/');await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.locator('.project-card').count(),1);
  await page.locator('.project-card').click();await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.locator('[data-compare].is-ready').count(),2);
  assert.equal(await page.locator('input[type="range"]').count(),0,'No extra range UI below the images');
  await page.locator('img').evaluateAll(images=>Promise.all(images.map(image=>{image.loading='eager';return image.decode();})));
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal overflow');
  for(const handle of await page.getByRole('slider').all()){
   await handle.focus();await handle.press('ArrowRight');assert.equal(await handle.getAttribute('aria-valuenow'),'51');
   await handle.press('End');assert.equal(await handle.getAttribute('aria-valuenow'),'100');
   await handle.press('Home');assert.equal(await handle.getAttribute('aria-valuenow'),'0');
   for(let i=0;i<5;i++)await handle.press('PageUp');
  }
  const first=page.locator('[data-compare]').first(),handle=first.getByRole('slider');
  await first.getByRole('button',{name:'Low resolution',exact:true}).click();
  assert.equal(await first.locator('img[data-reference="low-resolution"]').isVisible(),true);
  assert.equal(await first.locator('img[data-reference="bicubic"]').isVisible(),false);
  assert.equal(await first.locator('[data-reference-label]').innerText(),'Low-resolution input');
  assert.equal(await handle.getAttribute('aria-valuenow'),'50','Reference switching preserves divider position');
  await first.getByRole('button',{name:'Bicubic',exact:true}).click();
  assert.equal(await first.getByRole('button',{name:'Bicubic',exact:true}).getAttribute('aria-pressed'),'true');
  await page.locator('h1').click();await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
  await page.screenshot({path:`${out}/${engine.name()}-${mobile?'mobile':'desktop'}-article.png`,fullPage:true});
  await first.screenshot({path:`${out}/${engine.name()}-${mobile?'mobile':'desktop'}-comparison.png`});
  if(!mobile){
   const stage=first.locator('.compare-images'),box=await stage.boundingBox();
   await page.mouse.move(box.x+box.width*.5,box.y+50);await page.mouse.down();
   await page.mouse.move(box.x+box.width+40,box.y-20);assert.equal(await handle.getAttribute('aria-valuenow'),'0');
   await page.mouse.move(box.x-40,box.y-20);assert.equal(await handle.getAttribute('aria-valuenow'),'100');
   await page.mouse.up();await page.mouse.move(box.x+box.width*.5,box.y+50);
   assert.equal(await handle.getAttribute('aria-valuenow'),'100','Releasing outside ends dragging');
  }
  if(mobile&&engine===chromium){
   const stage=first.locator('.compare-images');await stage.scrollIntoViewIfNeeded();
   const box=await stage.boundingBox(),cdp=await page.context().newCDPSession(page);
   const touch=(type,x,y)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y}]});
   async function drag(x,y,dx,dy){await touch('touchStart',x,y);for(let i=1;i<=10;i++){await touch('touchMove',x+dx*i/10,y+dy*i/10);await page.waitForTimeout(18);}await touch('touchEnd');await page.waitForTimeout(250);}
   await drag(box.x+box.width*.25,box.y+box.height*.5,box.width*.5,0);
   assert.ok(Math.abs(Number(await handle.getAttribute('aria-valuenow'))-25)<4,'Horizontal touch over the image compares');
   await handle.press('Home');for(let i=0;i<5;i++)await handle.press('PageUp');
   const yBefore=await page.evaluate(()=>scrollY),hbox=await handle.boundingBox();
   await touch('touchStart',hbox.x+hbox.width/2,hbox.y+hbox.height/2);
   await touch('touchMove',box.x+box.width+12,box.y+box.height+20);
   await page.waitForTimeout(70);
   assert.equal(await handle.getAttribute('aria-valuenow'),'0','A single fast diagonal move beyond the image is retained');
   await touch('touchMove',box.x-12,box.y+box.height+30);await page.waitForTimeout(70);
   assert.equal(await handle.getAttribute('aria-valuenow'),'100','Reverse dragging still works outside the image');
   await touch('touchEnd');assert.ok(Math.abs(await page.evaluate(()=>scrollY)-yBefore)<2,'Dragging the handle does not scroll the page');
   await drag(box.x+box.width*.3,box.y+box.height*.65,0,-140);
   assert.ok(await page.evaluate(y=>scrollY>y+60,yBefore),'Vertical touch away from handle still scrolls the article');
   assert.equal(await handle.getAttribute('aria-valuenow'),'100');
  }
  assert.deepEqual(errors,[]);await page.close();
 }
 const staticPage=await browser.newPage({javaScriptEnabled:false,viewport:{width:390,height:844}});await staticPage.goto(base+'/pages/image-super-resolution/');
 assert.equal(await staticPage.locator('.image-compare img:visible').count(),4);
 assert.equal(await staticPage.locator('.compare-modes:visible').count(),0);
 assert.ok((await staticPage.locator('article').innerText()).includes('Learning the correction'));
 await staticPage.goto(base+'/projects/');assert.equal(await staticPage.locator('.project-card:visible').count(),1);
 console.log(`PASS ${engine.name()}: direct comparison, keyboard, reference modes, outside-image dragging, layout and no-JS content.`);
 }finally{await browser.close();}
}
