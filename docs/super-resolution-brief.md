# Image super-resolution — local article and archive

Status, 5 November 2026: after testing on iPhone, the owner reported better scrolling, considered this version publishable and explicitly authorized publication. Deployment is still to be performed and verified at this documentation update.

## Purpose and placement

Explain Quentin’s May 2023 ETH Zurich MFCGV23 exercise as a short engineering article: building a ×2 PyTorch training pipeline, adding a residual connection, testing learning rates and examining input-degradation limits. The article presents archived observations, not a new benchmark.

The six selected software projects on the homepage are unchanged. The More Projects link sits below that grid and leads to `/projects/`. `templates/projects.html` and `cards/more-projects.json` generate `projects/index.html`; the archive currently contains one article card. Use root-relative article links and previews in that JSON. The article route is `/pages/image-super-resolution/`, with return links to the archive.

## Content and provenance

Edit `pages/image-super-resolution/article.md` for the prose, semantic figures, captions and two comparison blocks; `template.html` owns metadata and reader navigation. The generated `index.html` requires no runtime Markdown fetch.

The parrot comparison shows either bicubic interpolation or the low-resolution input against the residual CNN. The Bicubic / Low resolution buttons expose their selection through `aria-pressed` and change only the left panel; the CNN result stays fixed on the right. The castle comparison shows the residual CNN against the original reference. Neither presents the reference as a second model result. A four-step training pipeline, three learning-rate examples and two original training plots support the narrative. Plot captions identify curve colors and axes without altering the source data.

All ten WebP images are lossless panel extractions from the original report. `images/sources.json` records source paths, crop boxes, dimensions and processing; each `*.webp.json` sidecar repeats its provenance. Preserve these records alongside the assets. No pixels were generated, sharpened or color-adjusted. Some source panels differ by one pixel in width; the comparisons retain the complete scene framing. `docs/super-resolution-sources.md` records the report/code basis and review findings. The source repository is private, so the article does not offer an inaccessible public code link.

No training was rerun. Learning-rate runs used unequal epoch budgets, which the article discloses. The archived evaluation accumulated batch metrics and logged `1 − SSIM` as “SSIM”; its aggregate table is omitted. Independent split construction and the shallow state-dictionary copy also need correction before any fresh benchmark, as recorded in the sources note.

## Gateway extension and interaction

Keep the existing graphite palette, local JetBrains headings, Manrope prose, square card edges, thin borders and shared `assets/reader.css` navigation. The archive reuses the existing card renderer and responsive grid. `assets/projects.css` adds archive spacing and the More Projects link. `assets/super-resolution.css` adds figure layouts; it does not establish a new visual identity. `DESIGN.md` and `.impeccable/design.json` are preserved.

`assets/image-compare.js` progressively enhances two visible images into a horizontal reveal. The lower native range control is removed: the divider is now a labeled `role="slider"` with a full-height 48px hit area, visible focus and announced reveal value. It supports arrows, Shift+arrows, Home, End, Page Up and Page Down. Pointer capture begins on pointerdown so a fast drag can leave the frame and reverse without losing control. The handle uses `touch-action: none`; the image body keeps `pan-y pinch-zoom`, so ordinary vertical touch still scrolls the article. With JavaScript disabled, both default panels remain visible side by side and the mode buttons stay hidden.

## Build and review

`npm run build` generates the archive, all four Markdown articles, metadata and sitemap. The current contract is thirteen homepage cards, ten interactive sheets, six selected software projects, one archive card, two new comparators and nine sitemap routes. `npm run watch` observes article Markdown/templates, card JSON and templates; `npm run dev` shares that rebuild path and serves `/projects/` with live reload. Image-only edits under `pages/<slug>/images/` still require a manual browser reload.

`npm run test:super-resolution` covers the archive/article in Chromium and WebKit on desktop/mobile, comparison controls, no-JavaScript content, overflow and JavaScript errors. Chromium CDP gestures check horizontal comparison, fast diagonal drags leaving the frame and reversing, and ordinary vertical scrolling. The final suite passes in both engines on desktop/mobile; `npm test` and `npm run check` also pass. Screenshots are in `test-results/super-resolution/`. The older browser suite still covers three legacy articles, and the reader suite still covers seven legacy reader URLs; they do not replace the new suite. Both `test:super-resolution` and `test:intro` default to port 8002; set `SITE_URL` when the dev server uses another port.

The earlier read-only visual reviewer approved the article’s use of Gateway. The owner has now authorized publication after the iPhone test. For the current intro-scroll behavior and the distinction between engine tests and physical-device feedback, see `docs/gateway-brief.md`; screenshots for that regression are in `test-results/mobile-intro/`.
