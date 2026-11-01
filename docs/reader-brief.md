# Gateway — project sheets and reading pages

User request: apply the selected Gateway identity to the rest of the site so the entire portfolio can be reviewed together. This extends the approved identity; it is not a new visual direction.

Mode: Read for articles and reports, Experience for project/media sheets.

Preserve authored copy, links, images, math, videos, gallery behaviour, existing URLs and the Markdown build. Use Gateway's graphite, peach, blue and lavender tokens and locally hosted Manrope/JetBrains. Keep prose at a readable measure, use square media frames, a common return-to-projects header and responsive sheets. No animated backgrounds on reading pages. No deployment.

Scope: three generated articles; ten homepage project sheets plus their archive fragments; CG22, SuperVoxel (including its alternate URL) and Shuffling reports. Embedded third-party 3D viewer internals remain their existing scientific visualization surface.

Quality bar: legible real content on desktop and mobile, no body overflow, no constrained 65vw mobile sheets, one H1 per report, intact comparison/media interactions, usable static content without JavaScript. Code-led refinement; no new comp or concept selection required.

Implementation: shared palette/fonts in `assets/gateway-base.css`; `assets/reader.css` for reading pages; `assets/project-sheets.css` after the homepage styles. Article source stays in `pages/*/article.md`, shell in its neighbouring `template.html`. The older report exports remain static HTML.

Archive repairs: corrected three CG22 image extensions from JPEG to their existing PNG assets; removed its duplicate nested document head; responsive comparison geometry replaces an old hardcoded 800px assumption. Shuffling no longer forces a 950px container. Its missing `story_4_3.png` is absent both locally and on the published site (HTTP 404); its caption remains with an explicit unavailable-illustration notice rather than a fabricated chart.

Verification: `npm run test:readers`, `node tests/browser.mjs --functional-only`, `npm test`, `npm run check`. Evidence in `test-results/readers/` and `test-results/after/`. Reports include external academic/player dependencies; external video players are blocked during automated checks. Impeccable launcher was unavailable earlier in the session; no automated design detector ran.
