(() => {
  const content = document.getElementById('article-content');
  const dialog = document.getElementById('image-dialog');
  const preview = document.getElementById('image-preview');
  const original = document.getElementById('image-original');
  const description = document.getElementById('image-description');
  let opener = null;

  document.getElementById('image-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('image-dialog-open');
    if (opener) opener.focus({ preventScroll: true });
  });
  for (const link of content.querySelectorAll('a.image-expand')) {
    const image = link.querySelector('img');
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || typeof dialog.showModal !== 'function') return;
      event.preventDefault();
      opener = link;
      preview.src = image.currentSrc || image.src;
      preview.alt = image.alt;
      original.href = preview.src;
      description.textContent = image.alt;
      dialog.showModal();
      document.documentElement.classList.add('image-dialog-open');
    });
  }
})();
