(() => {
  const root=document.documentElement,body=document.body,hero=document.querySelector('.hero');
  const effect=body.dataset.effect,full=body.classList.contains('full-page');
  const fine=matchMedia('(pointer:fine)'),reduced=matchMedia('(prefers-reduced-motion:reduce)');
  const canvas=hero.querySelector('canvas'),ctx=canvas.getContext('2d');
  const composition=hero.querySelector('.hero-composition'),name=hero.querySelector('.name');
  const colors=['#eeb9a2','#a9c6ef','#d6b9e8'];
  const random=i=>{const n=Math.sin(i*13.37+79.14)*43758.2;return n-Math.floor(n);};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  let heroVisible=true,frame=0,lastFrame=0,elapsed=0,introElapsed=0;
  let w=innerWidth,h=innerHeight,mx=w/2,my=h/2,targetX=0,targetY=0,px=0,py=0,power=0,targetPower=0;
  let direction=1,lastScroll=scrollY,scrollFrame=0;
  const canMove=()=>!reduced.matches;

  // Section targets are hidden before intersection, never after an already-visible frame.
  const targets=[...document.querySelectorAll('[data-enter]')],entrances=new Map();
  function arm(el){
    if(!canMove()||!el.animate)return;
    entrances.get(el)?.cancel();entrances.delete(el);el.dataset.state='armed';
  }
  function reveal(el){
    if(!canMove()||!el.animate){el.dataset.state='visible';return;}
    if(el.dataset.state!=='armed')return;
    entrances.get(el)?.cancel();
    const kind=el.dataset.enter,section=el.closest('.content-section');
    const siblings=[...(section||document).querySelectorAll('[data-enter="'+kind+'"]')];
    const i=Math.max(0,siblings.indexOf(el));
    let x=0,y=35*direction,rotate=0,scale=.985,delay=Math.min(i%3*65,130),duration=760;
    if(kind==='card'){x=(i%3-1)*48*direction;y=45*direction;rotate=(i%3-1)*1.1*direction;}
    if(kind==='heading'){x=-70*direction;y=0;delay=300;duration=850;scale=1;}
    if(kind==='copy'){x=35*direction;y=0;delay=240;duration=720;scale=1;}
    if(kind==='portrait'){x=0;y=35*direction;delay=0;duration=620;scale=1;}
    if(!fine.matches){x*=.55;y*=.75;rotate=0;scale=1;delay=Math.min(delay,160);duration=Math.min(duration,680);}
    const a=el.animate([{opacity:0,transform:`translate3d(${x}px,${y}px,0) rotate(${rotate}deg) scale(${scale})`},{opacity:1,transform:'translate3d(0,0,0) rotate(0deg) scale(1)'}],{duration,delay,easing:'cubic-bezier(.16,1,.3,1)',fill:'both'});
    entrances.set(el,a);el.dataset.state='playing';
    a.finished.then(()=>{
      if(entrances.get(el)!==a)return;
      el.dataset.state='visible';entrances.delete(el);a.cancel();
      // Check again after removing our own transform, in case scrolling left it offscreen.
      const r=el.getBoundingClientRect();if(r.bottom<=0||r.top>=innerHeight)arm(el);
    },()=>{});
  }
  function revealAll(){entrances.forEach(a=>a.cancel());entrances.clear();targets.forEach(el=>el.dataset.state='visible');}
  const revealObserver='IntersectionObserver'in window?new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting&&(fine.matches||entry.intersectionRatio>=.12))reveal(entry.target);
      else if(entry.target.dataset.state!=='playing'&&(entry.boundingClientRect.bottom<=0||entry.boundingClientRect.top>=innerHeight))arm(entry.target);
    });
  },{threshold:[0,.12]}):null;
  targets.forEach(el=>{el.dataset.state='armed';revealObserver?.observe(el);});
  root.classList.add('motion-ready');root.classList.remove('reveal-boot');clearTimeout(window.revealWatchdog);
  if(!revealObserver||!canMove())revealAll();
  document.addEventListener('focusin',e=>{if(e.target.matches('h1,h2'))return;const el=e.target.closest('[data-enter]');if(el){entrances.get(el)?.cancel();entrances.delete(el);el.dataset.state='visible';}});

  const heroEntrances=[];
  function intro(){
    heroEntrances.splice(0).forEach(a=>a.cancel());introElapsed=0;
    if(!canMove()||!name.animate)return;
    // Each solid letter face is revealed once by a horizontal scan; no flashing.
    hero.querySelectorAll('.name-line').forEach((line,i)=>{
      const options={duration:1250,delay:i*150,easing:'cubic-bezier(.22,.6,.25,1)',fill:'backwards'};
      const reveal=line.animate([{clipPath:'inset(0 100% 0 0)'},{clipPath:'inset(0 0% 0 0)'}],options);
      const beam=line.querySelector('.name-scan');
      heroEntrances.push(reveal);
      if(beam)heroEntrances.push(beam.animate([
        {transform:'translateX(-50%)',opacity:0},
        {opacity:.8,offset:.08},
        {transform:'translateX(50%)',opacity:0}
      ],options));
    });requestFrame();
  }

  // Transform children separately from the wrappers used for entrance motion.
  const areas=[];
  function reactiveArea(region,letterSelector,groupSelector){
    if(!region)return;
    const area={region,visible:true,power:0,target:0,x:0,y:0};
    area.letters=[...region.querySelectorAll(letterSelector)].map(el=>({el,x:0,y:0,vx:0,vy:0,cx:0,cy:0}));
    area.groups=[...region.querySelectorAll(groupSelector)].map(el=>({el,x:0,y:0,cx:0,cy:0,sign:Number(el.dataset.force||1)}));
    area.measure=()=>{
      const r=region.getBoundingClientRect();
      [...area.letters,...area.groups].forEach(p=>{const q=p.el.getBoundingClientRect();p.cx=q.left-r.left+q.width/2-p.x;p.cy=q.top-r.top+q.height/2-p.y;});
    };
    region.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')area.measure();});
    region.addEventListener('pointermove',e=>{
      if(e.pointerType!=='mouse'||!canMove())return;
      const r=region.getBoundingClientRect();area.x=e.clientX-r.left;area.y=e.clientY-r.top;area.target=1;requestFrame();
    });
    region.addEventListener('pointerleave',()=>{area.target=0;requestFrame();});
    if('IntersectionObserver'in window)new IntersectionObserver(entries=>{
      area.visible=entries[0].isIntersecting;if(!area.visible)area.target=0;requestFrame();
    }).observe(region);
    areas.push(area);
  }
  reactiveArea(composition,'.letter','.role-word,.note-word');
  reactiveArea(document.querySelector('.about-layout'),'.letter','.about-word,.reactive-copy');
  function reactiveFrame(){
    let unsettled=false;
    areas.forEach(a=>{
      a.power+=(a.target-a.power)*.18;
      a.letters.forEach(p=>{
        const dx=p.cx-a.x,dy=p.cy-a.y,d2=dx*dx+dy*dy,f=Math.exp(-d2/17000)*a.power;
        const tx=dx/Math.sqrt(d2+1900)*23*f,ty=dy/Math.sqrt(d2+1900)*23*f;
        p.vx=(p.vx+(tx-p.x)*.16)*.66;p.vy=(p.vy+(ty-p.y)*.16)*.66;p.x+=p.vx;p.y+=p.vy;
        p.el.style.transform=`translate3d(${p.x}px,${p.y}px,0)`;
        p.el.style.filter=`blur(${Math.min(.3,Math.hypot(p.vx,p.vy)*.07)}px)`;
        if(true){
          const split=f*(a.region===composition?6:3.2),sy=(a.x-p.cx)/180*f;
          p.el.style.textShadow=f>.002?`${-split}px ${sy}px #dfa3a5,${split}px ${-sy}px #9bc9e8`:"none";
        }
        unsettled ||= Math.abs(p.x-tx)+Math.abs(p.y-ty)+Math.abs(p.vx)+Math.abs(p.vy)>.08;
      });
      a.groups.forEach(p=>{
        const dx=a.x-p.cx,dy=a.y-p.cy,f=Math.exp(-(dx*dx+dy*dy)/65000)*a.power;
        const isCopy=p.el.classList.contains('reactive-copy'),strength=isCopy?.065:.11;
        const limit=isCopy?14:17,tx=clamp(dx*strength*f,-limit,limit)*p.sign,ty=clamp(dy*strength*f,-limit,limit)*p.sign;
        p.x+=(tx-p.x)*.15;p.y+=(ty-p.y)*.15;p.el.style.transform=`translate3d(${p.x}px,${p.y}px,0)`;
        unsettled ||= Math.abs(p.x-tx)+Math.abs(p.y-ty)>.06;
      });
      unsettled ||= Math.abs(a.target-a.power)>.002;
    });return unsettled;
  }

  const particles=Array.from({length:86},(_,i)=>({phase:random(i),lane:random(i+800),speed:(.028+random(i+1600)*.018)*.75,dx:0,dy:0,vx:0,vy:0,color:colors[i%3]}));
  const links=new Map();
  function bend(x,y,radius=27000,amount=80){
    const dx=x-mx,dy=y-my,d2=dx*dx+dy*dy,f=Math.exp(-d2/radius)*power*amount;
    return [dx/Math.sqrt(d2+2000)*f,dy/Math.sqrt(d2+2000)*f];
  }
  function flowPoint(p,i,t,stream=false){
    const life=(p.phase+t*p.speed)%1,travel=i%2?1-life:life;
    const lane=stream?(i%11+.5)/11:p.lane;
    const x=-65+(w+130)*travel;
    const y=75+lane*(h-150)+Math.sin(travel*6.28+lane*4)*23+(travel-.5)*h*.1;
    return {x,y,life};
  }
  function drawParticles(t,intro,move,dt=33){
    const desktop=fine.matches&&w>900,count=fine.matches?particles.length:42,points=[];
    const stream=effect==='streams',network=effect==='neighbours';
    if(stream){
      ctx.lineWidth=.65;
      for(let lane=0;lane<11;lane++){
        ctx.strokeStyle=colors[lane%3];ctx.globalAlpha=.115*intro;ctx.beginPath();
        for(let k=0;k<=60;k++){
          const u=k/60,x=-65+(w+130)*u,l=(lane+.5)/11;
          const y=75+l*(h-150)+Math.sin(u*6.28+l*4)*23+(u-.5)*h*.1;
          const [dx,dy]=bend(x,y,29000,42);k?ctx.lineTo(x+dx,y+dy):ctx.moveTo(x+dx,y+dy);
        }ctx.stroke();
      }
    }
    for(let i=0;i<count;i++){
      const p=particles[i];let {x,y,life}=flowPoint(p,i,t,stream);
      if(network){
        life=(p.phase+t*(.012+random(i+2100)*.004))%1;
        const travel=i%2?1-life:life;
        x=-25+travel*(w+50);
        y=70+p.lane*(h-140)+Math.sin(t*.3+i)*32+Math.sin(travel*Math.PI*2+i)*12;
      }
      const [fx,fy]=bend(x,y);
      if(move){p.vx=(p.vx+(fx-p.dx)*.12)*.75;p.vy=(p.vy+(fy-p.dy)*.12)*.75;p.dx+=p.vx;p.dy+=p.vy;}
      points.push({x:x+p.dx,y:y+p.dy,alpha:Math.pow(Math.sin(life*Math.PI),1.2)*(.48+(i%3)*.09)*intro*(desktop?1.28:1),color:p.color,r:(.85+Math.pow(random(i+3100),2)*2.9)*(desktop?1.6:1)});
    }
    if(network){
      const wanted=new Set(),radius=Math.min(165,w*.23);
      points.forEach((p,i)=>{
        const closest=points.map((q,j)=>({q,j,d:Math.hypot(p.x-q.x,p.y-q.y)})).filter(v=>v.j!==i&&v.d<radius).sort((a,b)=>a.d-b.d).slice(0,2);
        closest.forEach(({q,j,d})=>{
          const key=Math.min(i,j)+':'+Math.max(i,j);if(wanted.has(key)||d<.1)return;wanted.add(key);
          if(!links.has(key))links.set(key,{i,j,weight:move?0:1});
        });
      });
      links.forEach((link,key)=>{
        const selected=wanted.has(key),target=selected?1:0;
        link.weight=move?link.weight+(target-link.weight)*(1-Math.exp(-dt/(selected?240:170))):target;
        if(link.weight<.002&&!selected){links.delete(key);return;}
        const p=points[link.i],q=points[link.j];if(!p||!q){links.delete(key);return;}
        const distance=Math.hypot(p.x-q.x,p.y-q.y);
        const gradient=ctx.createLinearGradient(p.x,p.y,q.x,q.y);gradient.addColorStop(0,p.color);gradient.addColorStop(1,q.color);
        ctx.strokeStyle=gradient;ctx.globalAlpha=Math.max(0,1-distance/radius)*Math.min(p.alpha,q.alpha)*(desktop?.9:.68)*link.weight;
        if(distance<.1)return;
        ctx.beginPath();
        if(desktop){
          const nx=-(q.y-p.y)/distance,ny=(q.x-p.x)/distance;
          const a=.4+p.r*.24,b=.4+q.r*.24;
          ctx.fillStyle=gradient;
          ctx.moveTo(p.x+nx*a,p.y+ny*a);ctx.lineTo(q.x+nx*b,q.y+ny*b);
          ctx.lineTo(q.x-nx*b,q.y-ny*b);ctx.lineTo(p.x-nx*a,p.y-ny*a);ctx.closePath();ctx.fill();
        }else{ctx.lineWidth=.95;ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();}
      });
    }
    if(desktop){
      // Clear links beneath translucent dots so no edge shows through their faces.
      ctx.globalCompositeOperation='destination-out';ctx.globalAlpha=1;ctx.beginPath();
      for(const p of points){ctx.moveTo(p.x+p.r+.25,p.y);ctx.arc(p.x,p.y,p.r+.25,0,Math.PI*2);}
      ctx.fill();ctx.globalCompositeOperation='source-over';
    }
    for(const p of points){ctx.globalAlpha=p.alpha;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();}
  }
  function drawBackground(move,dt=33){
    if(!ctx)return;ctx.clearRect(0,0,w,h);const t=elapsed/1000,intro=canMove()?clamp(introElapsed/1000,0,1):1;
    drawParticles(t,intro,move,dt);
    ctx.globalAlpha=1;
  }
  function requestFrame(){if(!frame&&!document.hidden&&canMove())frame=requestAnimationFrame(render);}
  function render(now){
    frame=0;if(document.hidden||!canMove())return;
    if(lastFrame&&now-lastFrame<32){requestFrame();return;}
    const dt=Math.min(60,lastFrame?now-lastFrame:33);lastFrame=now;
    if(heroVisible){
      elapsed+=dt;introElapsed+=dt;px+=(targetX-px)*.1;py+=(targetY-py)*.1;power+=(targetPower-power)*.14;
      composition.style.transform=`translate3d(${px*13}px,${py*9}px,0)`;
      drawBackground(true,dt);
    }
    const unsettled=reactiveFrame();if(heroVisible||unsettled)requestFrame();
  }
  function measure(){
    const r=hero.getBoundingClientRect();w=r.width;h=r.height;
    if(ctx){const dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);}
    areas.forEach(a=>a.measure());drawBackground(false);syncScroll();requestFrame();
  }
  hero.addEventListener('pointermove',e=>{
    if(!canMove()||e.pointerType!=='mouse')return;
    const r=hero.getBoundingClientRect();mx=e.clientX-r.left;my=e.clientY-r.top;targetX=(mx/w-.5)*2;targetY=(my/h-.5)*2;targetPower=1;requestFrame();
  });
  hero.addEventListener('pointerleave',()=>{targetX=targetY=targetPower=0;requestFrame();});
  if('IntersectionObserver'in window)new IntersectionObserver(entries=>{
    const wasVisible=heroVisible;heroVisible=entries[0].isIntersecting;
    if(heroVisible){if(!wasVisible){lastFrame=0;intro();}requestFrame();}
    else{targetX=targetY=targetPower=0;}
  },{threshold:.01}).observe(hero);

  // Actual scroll position is the only progress source, including fast reverse scrolling.
  function syncScroll(){
    scrollFrame=0;if(!full)return;
    if(Math.abs(scrollY-lastScroll)>2)direction=scrollY>lastScroll?1:-1;lastScroll=scrollY;
    const max=Math.max(0,root.scrollHeight-innerHeight),progress=max?clamp(scrollY/max,0,1):0;
    root.style.setProperty('--progress',scrollY<1?0:max-scrollY<1?1:progress);
    let id='home';document.querySelectorAll('.content-section').forEach(s=>{if(s.getBoundingClientRect().top<innerHeight*.4)id=s.id;});
    if(max>0&&max-scrollY<2)id='contact';
    document.querySelectorAll('.section-links a').forEach(a=>{if(a.hash==='#'+id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
  }
  addEventListener('scroll',()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(syncScroll);},{passive:true});
  let transitioning=false,transitionTarget=0,releaseTimer=0;
  function headerHeight(){return document.querySelector('.site-header').offsetHeight;}
  function sectionTop(id){const el=document.getElementById(id);return Math.max(0,el.getBoundingClientRect().top+scrollY-headerHeight());}
  function aboutEnd(){
    // Taller presentations remain freely scrollable before their next guided step.
    return Math.max(sectionTop('about'),sectionTop('software')-(innerHeight-headerHeight()));
  }
  function overlayOpen(){return body.classList.contains('work-overlay-open')||Boolean(document.querySelector('dialog[open]'));}
  function releaseTransition(){transitioning=false;clearTimeout(releaseTimer);releaseTimer=0;}
  function navigate(el,focus=false){
    if(!el)return;
    const top=Math.max(0,el.getBoundingClientRect().top+scrollY-(el===hero?0:headerHeight()));
    if(canMove())crossBoundary(top,false);else scrollTo({top,behavior:'instant'});
    if(focus)el.querySelector('h1,h2')?.focus({preventScroll:true});
  }
  function crossBoundary(target,lock=true){
    releaseTransition();transitioning=lock&&fine.matches;transitionTarget=target;
    scrollTo({top:transitionTarget,behavior:'smooth'});
    releaseTimer=setTimeout(releaseTransition,1200);
  }
  document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{
    if(e.ctrlKey||e.metaKey||e.altKey||e.shiftKey)return;
    const el=document.getElementById(a.hash.slice(1));if(!el)return;e.preventDefault();releaseTransition();navigate(el,true);
  }));
  function boundaryFor(delta,y=scrollY){
    const about=sectionTop('about'),projects=sectionTop('software'),end=aboutEnd();
    if(delta>0){
      if(y<about-8)return about;
      if(y>=end-8&&y<projects-8)return projects;
    }
    if(delta<0){
      if(y>8&&y<=about+35)return 0;
      if(y>end+8&&y<=projects+35)return end;
      // Re-enter the guided introduction as soon as a gesture crosses its edge.
      if(y>projects+35&&y+delta<=projects)return end;
    }
    return null;
  }
  addEventListener('wheel',e=>{
    if(!fine.matches||!canMove()||overlayOpen()||e.ctrlKey||e.metaKey||e.altKey||e.shiftKey||Math.abs(e.deltaX)>Math.abs(e.deltaY)||!e.deltaY)return;
    if(e.target.closest('input,textarea,select,[contenteditable=true]'))return;
    const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?innerHeight:1);
    if(releaseTimer&&Math.abs(scrollY-transitionTarget)<8){
      // Preserve a wheel gesture that arrives while the browser finishes smooth scrolling.
      const start=transitionTarget;releaseTransition();e.preventDefault();
      const next=boundaryFor(delta,start);
      if(next!==null)crossBoundary(next);else scrollTo({top:start+delta,behavior:'instant'});
      return;
    }
    if(transitioning){
      e.preventDefault();
      return;
    }
    const target=boundaryFor(delta);if(target===null)return;
    e.preventDefault();crossBoundary(target);
  },{passive:false});
  addEventListener('keydown',e=>{
    if(!canMove()||overlayOpen()||e.ctrlKey||e.metaKey||e.altKey||e.target.closest('button,a,input,textarea,select,[contenteditable=true]'))return;
    const delta=['ArrowDown','PageDown'].includes(e.key)||e.key===' '&&!e.shiftKey?1:['ArrowUp','PageUp'].includes(e.key)||e.key===' '&&e.shiftKey?-1:0;
    if(delta&&transitioning){e.preventDefault();return;}
    const target=boundaryFor(delta);if(!delta||target===null)return;e.preventDefault();crossBoundary(target);
  });
  addEventListener('scrollend',releaseTransition);
  addEventListener('pointerdown',e=>{if(e.pointerType==='mouse')releaseTransition();});

  function stopMotion(){
    cancelAnimationFrame(frame);frame=0;lastFrame=0;heroEntrances.splice(0).forEach(a=>a.cancel());revealAll();
    targetX=targetY=px=py=power=targetPower=0;composition.style.transform='none';name.style.transform='none';
    areas.forEach(a=>{a.target=a.power=0;[...a.letters,...a.groups].forEach(p=>{p.x=p.y=p.vx=p.vy=0;p.el.style.transform='none';p.el.style.filter='none';p.el.style.textShadow='none';});});
    releaseTransition();drawBackground(false);
  }
  function applyMotion(){
    body.classList.toggle('motion-off',!canMove());
    if(!canMove())stopMotion();else{lastFrame=0;requestFrame();}
    document.dispatchEvent(new CustomEvent('portfolio:motion',{detail:{paused:!canMove()}}));
  }
  function suspendFrame(){cancelAnimationFrame(frame);frame=0;lastFrame=0;}
  function resumeFrame(){suspendFrame();syncScroll();requestFrame();}
  document.addEventListener('visibilitychange',()=>{if(document.hidden)suspendFrame();else resumeFrame();});
  addEventListener('pagehide',()=>{releaseTransition();suspendFrame();});
  reduced.addEventListener('change',applyMotion);fine.addEventListener('change',measure);
  addEventListener('resize',measure);addEventListener('pageshow',()=>{releaseTransition();resumeFrame();});
  if(document.fonts)document.fonts.ready.then(measure);
  measure();intro();applyMotion();
})();
