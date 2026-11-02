import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
const base=process.env.SITE_URL||'http://127.0.0.1:8000';
const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true});
const out='test-results/native-scroll';await mkdir(out,{recursive:true});
const errors=[];
try{
 const phone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 phone.on('pageerror',e=>errors.push(e.message));
 await phone.goto(base);await phone.evaluate(()=>document.fonts.ready);
 assert.equal(await phone.locator('.motion-controls,.motion-pause,.motion-replay').count(),0);
 const targets=await phone.evaluate(()=>Object.fromEntries(['about','software'].map(id=>[id,document.getElementById(id).getBoundingClientRect().top+scrollY-document.querySelector('.site-header').offsetHeight])));
 const cdp=await phone.context().newCDPSession(phone);
 async function drag(start,end,pause=25,hold=false){
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:190,y:start}]});
  for(let i=1;i<=10;i++){
   await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:190,y:start+(end-start)*i/10}]});
   await phone.waitForTimeout(pause);
  }
  const during=await phone.evaluate(()=>scrollY);
  if(hold)await phone.waitForTimeout(160);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  return during;
 }
 const during=await drag(650,430,45,true);
 assert.ok(during>60&&during<targets.about-100,'Content follows a slow finger drag before touchend');
 await phone.waitForTimeout(1100);
 const settled=await phone.evaluate(()=>scrollY);
 assert.ok([0,targets.about].some(y=>Math.abs(y-settled)<3),'A partial drag settles on an introduction stop');
 await phone.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await phone.waitForTimeout(100);
 await drag(700,220,15);await phone.waitForTimeout(1100);
 assert.ok(Math.abs(await phone.evaluate(()=>scrollY)-targets.about)<3,'A full swipe advances to About');
 await phone.screenshot({path:out+'/mobile-about.png'});
 await phone.locator('.continue-work').tap();
 await phone.waitForFunction(y=>Math.abs(scrollY-y)<3,targets.software);
 const immediate=await drag(600,400,20,true);
 assert.ok(immediate>targets.software+70,'Touch scrolling works immediately on arrival at projects');
 await phone.waitForTimeout(1400);
 assert.ok(await phone.evaluate(y=>scrollY>y+70,targets.software),'No delayed correction pulls the page back to projects');
 await phone.evaluate(()=>scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'}));await phone.waitForTimeout(200);
 assert.ok(await phone.evaluate(()=>Math.abs(scrollY+innerHeight-document.documentElement.scrollHeight)<3),'The whole work area and contact remain reachable');
 await phone.close();

 const page=await browser.newPage({viewport:{width:1440,height:900}});
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  const proto=CanvasRenderingContext2D.prototype;
  for(const name of ['clearRect','beginPath','moveTo','lineTo','arc','fill']){
   const original=proto[name];proto[name]=function(...args){
    if(this.canvas.classList.contains('hero-canvas')){
     if(name==='clearRect')window.canvasDraws=[];
     if(name==='beginPath')this.trace=[];
     if(['moveTo','lineTo','arc'].includes(name))this.trace?.push({name,args});
     if(name==='fill')window.canvasDraws.push({mode:this.globalCompositeOperation,alpha:this.globalAlpha,path:this.trace,color:this.fillStyle instanceof CanvasGradient?'gradient':this.fillStyle});
    }
    return original.apply(this,args);
   };
  }
 });
 await page.goto(base);await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(1500);
 assert.equal(await page.locator('.motion-controls').count(),0);
 const draws=await page.evaluate(()=>window.canvasDraws);
 const mask=draws.findIndex(d=>d.mode==='destination-out');
 assert.ok(mask>0&&mask<draws.length-1,'Connections are cleared beneath dots, then dots paint last');
 const polygons=draws.slice(0,mask).filter(d=>d.path.length===4);
 assert.ok(polygons.length>10&&polygons.every(d=>d.color==='gradient'),'Connections retain endpoint color gradients');
 assert.ok(polygons.some(d=>{
  const [p,q,r,s]=d.path.map(step=>step.args);
  return Math.abs(Math.hypot(p[0]-s[0],p[1]-s[1])-Math.hypot(q[0]-r[0],q[1]-r[1]))>.5;
 }),'Edges taper continuously between unequal dot sizes');
 const alphaChecks=await page.evaluate(()=>{
  const canvas=document.querySelector('.hero-canvas'),ctx=canvas.getContext('2d'),scale=canvas.width/canvas.clientWidth;
  const dots=window.canvasDraws.filter(d=>d.mode==='source-over'&&d.path.length===1&&d.path[0].name==='arc');
  return dots.filter(d=>d.path[0].args[2]>4&&d.alpha>.4).filter(d=>{
   const [x,y]=d.path[0].args;
   return dots.every(other=>other===d||Math.hypot(x-other.path[0].args[0],y-other.path[0].args[1])>other.path[0].args[2]+2);
  }).map(d=>{const [x,y]=d.path[0].args;return Math.abs(ctx.getImageData(Math.round(x*scale),Math.round(y*scale),1,1).data[3]/255-d.alpha);});
 });
 assert.ok(alphaChecks.length>3&&alphaChecks.every(delta=>delta<.02),'No connection remains visible through translucent dot centers');
 await page.screenshot({path:out+'/desktop-particles.png'});
 await page.locator('.enter-work').click();await page.waitForTimeout(1100);
 await page.locator('.continue-work').click();
 await page.waitForFunction(()=>Math.abs(scrollY-(document.querySelector('#software').offsetTop-document.querySelector('.site-header').offsetHeight))<3);
 const projectY=await page.evaluate(()=>scrollY);await page.mouse.move(30,450);await page.mouse.wheel(0,180);await page.waitForTimeout(200);
 assert.ok(await page.evaluate(y=>scrollY>y+80,projectY),'Desktop wheel is accepted immediately after arrival');
 await page.close();assert.deepEqual(errors,[]);
 console.log('PASS: progressive native touch, partial/full swipes, immediate continuation, free work scroll, removed controls and tapered/occluded particle edges.');
}finally{await browser.close();}
