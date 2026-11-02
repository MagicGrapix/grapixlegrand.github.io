// Decorative code stays local to the portrait and shares the page's motion control.
(() => {
  const canvas = document.querySelector('.portrait-code');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  const colors = ['#eeb9a2', '#a9c6ef', '#d6b9e8'];
  const glyphs = '{}[]01<>/=;():+';
  let width = 0, height = 0, elapsed = 0, last = 0, frame = 0;
  let visible = false, paused = reduced.matches;
  const rand = i => { const n = Math.sin(i * 13.7 + 91) * 42758; return n - Math.floor(n); };
  function draw() {
    ctx.clearRect(0, 0, width, height);
    ctx.font = '14px JetBrains, monospace';
    ctx.textAlign = 'center';
    const t = elapsed / 1000;
    // Six streams flank the bust; the portrait itself occludes the inner strokes.
    [.06, .15, .25, .75, .85, .94].forEach((lane, col) => {
      const head = (rand(col) * (height + 160) + t * (35 + col * 3)) % (height + 160) - 80;
      for (let row = 0; row < 9; row++) {
        const raw = head - row * 21;
        const y = col % 3 === 0 ? height - raw : raw;
        if (y < 12 || y > height - 12) continue;
        const fade = Math.min(1, y / 40, (height - y) / 40);
        ctx.globalAlpha = (.7 - row * .065) * fade;
        ctx.fillStyle = colors[(col + Math.floor(row / 3)) % 3];
        const index = Math.floor(rand(col * 131 + row * 19 + Math.floor(t * 7)) * glyphs.length);
        ctx.fillText(glyphs[index], width * lane + Math.sin(t * .3 + col) * 3, y);
      }
    });
    ctx.globalAlpha = 1;
  }
  function request() {
    if (!frame && visible && !paused && !document.hidden) frame = requestAnimationFrame(tick);
  }
  function tick(now) {
    frame = 0;
    if (!visible || paused || document.hidden) return;
    if (last && now - last < 32) { request(); return; }
    elapsed += Math.min(60, last ? now - last : 33);
    last = now; draw(); request();
  }
  function stop() { cancelAnimationFrame(frame); frame = 0; last = 0; }
  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = rect.width; height = rect.height;
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); draw(); request();
  }
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (visible) request(); else stop();
  }).observe(canvas);
  document.addEventListener('portfolio:motion', e => {
    paused = e.detail.paused || reduced.matches;
    if (paused) { stop(); draw(); } else request();
  });
  reduced.addEventListener('change', () => {
    paused = reduced.matches;
    if (paused) stop(); else request();
  });
  document.addEventListener('visibilitychange', () => { stop(); if (!document.hidden) request(); });
  addEventListener('pagehide', stop);
  addEventListener('pageshow', () => { stop(); resize(); });
  addEventListener('resize', resize);
  document.fonts?.ready.then(resize);
  resize();
})();
