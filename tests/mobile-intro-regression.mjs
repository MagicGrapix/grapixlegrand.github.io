import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium,webkit} from 'playwright';
const base=process.env.SITE_URL||'http://127.0.0.1:8002';
const out='test-results/mobile-intro';await mkdir(out,{recursive:true});
for(const engine of [chromium,webkit]){
 const browser=await engine.launch({headless:true,...(engine===chromium?{channel:process.env.BROWSER_CHANNEL||'msedge'}:{})});
 try{
  const errors=[],p=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});p.on('pageerror',e=>errors.push(e.message));
  await p.goto(base);await p.evaluate(()=>document.fonts.ready);
  const top=id=>p.evaluate(id=>Math.max(0,document.getElementById(id).getBoundingClientRect().top+scrollY-(id==='home'?0:document.querySelector('.site-header').offsetHeight)),id);
  const at=async id=>p.waitForFunction(y=>Math.abs(scrollY-y)<3,await top(id),{timeout:3500});
  await p.locator('.enter-work').tap();await at('about');
  assert.equal(await p.locator('.enter-work').isVisible(),false,'Title arrow cannot peek through on About');
  assert.equal(await p.locator('.continue-work').isVisible(),true);
  await p.waitForTimeout(1400);await p.screenshot({path:`${out}/${engine.name()}-about.png`});
  // A gesture can span the intro boundary and several work sections before its end event.
  await p.evaluate(()=>{const e=new Event('touchstart');Object.defineProperty(e,'touches',{value:[{clientX:180,clientY:700}]});dispatchEvent(e);});
  await p.evaluate(y=>scrollTo({top:y,behavior:'instant'}),await top('software'));await p.waitForTimeout(60);
  await p.evaluate(()=>scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'}));
  await p.evaluate(()=>{const e=new Event('touchend');Object.defineProperties(e,{touches:{value:[]},changedTouches:{value:[{clientX:180,clientY:180}]}});dispatchEvent(e);});
  await p.waitForTimeout(1800);
  assert.ok(await p.evaluate(()=>Math.abs(scrollY+innerHeight-document.documentElement.scrollHeight)<24),'A completed gesture from About cannot pull the footer back to Projects');
  await p.screenshot({path:`${out}/${engine.name()}-footer.png`});
  for(let cycle=0;cycle<3;cycle++){
   await p.locator('.back-top').dispatchEvent('click');await p.waitForTimeout(60);
   await p.locator('.enter-work').dispatchEvent('click');await p.waitForTimeout(60);
   await p.locator('.continue-work').dispatchEvent('click');await at('software');
   await p.evaluate(()=>scrollBy({top:280,behavior:'instant'}));await p.waitForTimeout(700);
   assert.ok(await p.evaluate(y=>scrollY>y+200,await top('software')),'No stale arrow destination after reaching projects');
  }
  await p.locator('.back-top').dispatchEvent('click');await at('home');
  await p.evaluate(()=>{
   const start=new Event('touchstart');Object.defineProperty(start,'touches',{value:[{clientY:200}]});dispatchEvent(start);
   const move=new Event('touchmove');Object.defineProperty(move,'touches',{value:[{clientY:340}]});dispatchEvent(move);
   const end=new Event('touchend');Object.defineProperty(end,'touches',{value:[]});dispatchEvent(end);
  });
  await p.waitForTimeout(600);
  assert.equal(await p.locator('.page-progress i').evaluate(el=>el.getBoundingClientRect().width),0,'Pull-to-refresh has no article progress');
  await p.reload();await p.waitForTimeout(700);
  assert.equal(await p.locator('.page-progress i').evaluate(el=>el.getBoundingClientRect().width),0);
  if(engine===chromium){
   const cdp=await p.context().newCDPSession(p);
   async function drag(a,z,delay=18){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:180,y:a}]});for(let i=1;i<=12;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:180,y:a+(z-a)*i/12}]});await p.waitForTimeout(delay);}const during=await p.evaluate(()=>scrollY);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});return during;}
   await drag(700,220);await at('about');
   await drag(700,220);await at('software');
   await drag(250,730);await at('about');
   await drag(250,730);await at('home');
   await p.locator('.enter-work').tap();await at('about');
   await drag(700,220);await at('software');
   await drag(700,300);await p.waitForTimeout(700);
   assert.ok(await p.evaluate(y=>scrollY>y+150,await top('software')));
   await p.locator('.back-top').dispatchEvent('click');await at('home');
   await p.locator('.enter-work').tap();await p.waitForTimeout(100);
   await drag(700,220);await p.waitForTimeout(900);
   const interrupted=await p.evaluate(()=>scrollY);
   assert.ok([await top('about'),await top('software')].some(y=>Math.abs(y-interrupted)<3),'An interrupted arrow settles where the new gesture goes');
  }
  // Delayed instant writes model compositor lag: navigation must not depend on a
  // per-frame requested position matching the last delivered scroll position.
  const lag=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await lag.addInitScript(()=>{
   const nativeScroll=window.scrollTo.bind(window);window.navigationCalls=[];
   window.scrollTo=(...args)=>{
    window.navigationCalls.push({behavior:args[0]?.behavior,snap:getComputedStyle(document.documentElement).scrollSnapType});
    if(args[0]?.behavior==='instant')requestAnimationFrame(()=>requestAnimationFrame(()=>nativeScroll(...args)));
    else nativeScroll(...args);
   };
  });
  await lag.goto(base);await lag.evaluate(()=>document.fonts.ready);
  const lagAt=async id=>{
   const y=await lag.evaluate(id=>Math.max(0,document.getElementById(id).getBoundingClientRect().top+scrollY-(id==='home'?0:document.querySelector('.site-header').offsetHeight)),id);
   await lag.waitForFunction(y=>Math.abs(scrollY-y)<1,y,{timeout:4500});
  };
  await lag.locator('.enter-work').tap();await lagAt('about');
  await lag.locator('.continue-work').tap();await lagAt('software');
  await lag.evaluate(()=>scrollTo({top:document.documentElement.scrollHeight,behavior:'smooth'}));
  await lag.waitForFunction(()=>Math.abs(scrollY+innerHeight-document.documentElement.scrollHeight)<2);
  await lag.evaluate(()=>{window.navigationCalls=[];});
  await lag.locator('.back-top').tap();
  await lag.waitForTimeout(80);
  await lag.evaluate(()=>dispatchEvent(new Event('scrollend')));
  await lagAt('home');
  const calls=await lag.evaluate(()=>window.navigationCalls);
  assert.deepEqual(calls,[{behavior:'smooth',snap:'none'}],'Back to top is one native scroll, with snapping disabled throughout');
  await lag.close();
  assert.deepEqual(errors,[]);console.log(`PASS ${engine.name()}: gesture crossing to footer, rapid mixed navigation, arrow visibility, pull-to-refresh and ${engine===chromium?'native bidirectional gestures':'WebKit lifecycle'}.`);
 }finally{await browser.close();}
}
