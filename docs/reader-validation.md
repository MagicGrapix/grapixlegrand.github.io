# Gateway reading pages — 1 November 2026

Local review on `design/gateway`. No commit, push or publication.

## Changed surfaces

- Three Markdown article templates: Minecraft Agent, Controlling Generative AI for Game Content, LevekGL. Generated HTML rebuilt by the existing watcher.
- All homepage project sheets, media galleries and archive subcards share `assets/project-sheets.css`.
- CG22, Shuffling and both SuperVoxel report URLs share `assets/reader.css`.
- Palette and local fonts extracted to `assets/gateway-base.css`; homepage composition and animation retained.

## Completed checks

- `npm test`: seven generation/content/metadata tests passed.
- `npm run check`: generated files and referenced local resources current.
- `node tests/browser.mjs --functional-only`: three articles, ten sheets, image enlargement and image/video galleries passed at 1440 and 390px.
- `npm run test:readers`: seven routes passed at 1440 and 390px, no document overflow or local resource errors, one H1, common typography, comparator pointer response and image/frame geometry, content readable without JavaScript.
- `npm run test:gateway`: repeated intro/projects boundary, native content scroll, About lettering, overlay, progress, reduced motion, mobile and no-JS checks passed after the shared-style extraction.
- `git diff --check`: passed.

Screenshots: `test-results/readers/`, `test-results/after/`, `test-results/gateway/` (ignored by Git). Desktop/mobile reader starts and the CG22 comparator were inspected together; the mobile sheet now uses the available width. No production assets were replaced.

## Existing archive limitations

Three CG22 illustrations had incorrect `.jpeg` paths; corrected to the existing `.png` files. The comparator's old hardcoded 800px geometry was made responsive.

Shuffling's `story_pictures/save/story_4_3.png` is absent in the repository and returns 404 on the current public site. Its caption remains beside an explicit unavailable-illustration notice; no substitute data or chart was invented.

External video players were excluded from automated tests. Third-party embedded 3D viewer internals were preserved, not redesigned. Current phone access was confirmed by the user before this reskin; this pass used browser mobile emulation rather than a physical-device interaction test. Impeccable's launcher was unavailable earlier in the session, so no automated design detector ran.

## Independent finish and documentation

The fresh Impeccable finish review returned **ship** for local review after inspecting the 16 requested desktop/mobile captures and representative source. No material findings or further captures were requested.

The documenter compared the extension with the incumbent system: all eight palette values and both local font families match `DESIGN.md`. Readers deliberately use 16px/1.85 text (1.8 on mobile), 74ch prose and a 1120px media canvas; sheets use 16px/1.8 with square, shadow-free frames. The three article templates and four static report routes load `reader.css`; the homepage loads `project-sheets.css` after Gateway. `DESIGN.md` and `.impeccable/design.json` were preserved. No material token drift was found in the sampled evidence. Documentation is complete for this extension.
