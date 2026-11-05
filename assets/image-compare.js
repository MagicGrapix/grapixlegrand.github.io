(() => {
  for (const figure of document.querySelectorAll('[data-compare]')) {
    const stage=figure.querySelector('.compare-images'),handle=figure.querySelector('.compare-divider');
    let value=50,start=null;
    const update=next=>{
      value=Math.max(0,Math.min(100,Math.round(next)));
      figure.style.setProperty('--compare',`${100-value}%`);
      handle.setAttribute('aria-valuenow',value);
      handle.setAttribute('aria-valuetext',`${value}% of the right-hand image revealed`);
    };
    handle.removeAttribute('aria-hidden');handle.tabIndex=0;
    handle.setAttribute('role','slider');handle.setAttribute('aria-orientation','horizontal');
    handle.setAttribute('aria-valuemin','0');handle.setAttribute('aria-valuemax','100');
    figure.classList.add('is-ready');update(value);
    handle.addEventListener('keydown',e=>{
      const step=e.shiftKey?10:1;
      const next={ArrowRight:value+step,ArrowUp:value+step,ArrowLeft:value-step,ArrowDown:value-step,Home:0,End:100,PageUp:value+10,PageDown:value-10}[e.key];
      if(next!==undefined){e.preventDefault();update(next);}
    });
    const move=e=>{const box=stage.getBoundingClientRect();update(100*(1-(e.clientX-box.left)/box.width));};
    stage.addEventListener('pointerdown',e=>{
      if(!e.isPrimary||e.button!==0)return;
      start={x:e.clientX,y:e.clientY,id:e.pointerId,drag:e.pointerType==='mouse'||handle.contains(e.target)};
      // Capture before the first move, so a fast gesture can leave the image safely.
      stage.setPointerCapture(e.pointerId);
      if(start.drag){handle.focus({preventScroll:true});move(e);}
    });
    stage.addEventListener('pointermove',e=>{
      if(!start||e.pointerId!==start.id)return;
      const dx=Math.abs(e.clientX-start.x),dy=Math.abs(e.clientY-start.y);
      if(!start.drag&&dx>4&&dx>dy)start.drag=true;
      if(start.drag)move(e);
    });
    const release=e=>{
      if(!start||e.pointerId!==start.id)return;
      if(e.type==='pointerup'&&start.drag)move(e);
      start=null;
      if(stage.hasPointerCapture(e.pointerId))stage.releasePointerCapture(e.pointerId);
    };
    for(const event of ['pointerup','pointercancel','lostpointercapture'])stage.addEventListener(event,release);

    const modes=figure.querySelector('.compare-modes');
    if(modes){
      modes.hidden=false;
      const images=[...stage.querySelectorAll('[data-reference]')],label=figure.querySelector('[data-reference-label]');
      for(const button of modes.querySelectorAll('button'))button.addEventListener('click',()=>{
        for(const image of images)image.hidden=image.dataset.reference!==button.dataset.reference;
        label.textContent=button.dataset.label;
        for(const option of modes.querySelectorAll('button'))option.setAttribute('aria-pressed',String(option===button));
      });
    }
  }
})();
