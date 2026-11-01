# Presentation-first experiment — 1 November 2026

User-approved local test on `design/gateway`: title → personal presentation → software projects, then native scrolling to a contact-only ending. Keep the direct Projects link. Additional steering requested brighter/larger opposing particle flows, more pronounced connecting lines and a scan-like name entrance.

The presentation includes the existing chromatic title, provisional portrait and code, biography, a Markdown `Background` list based on existing project descriptions, and the moved toolkit. It fits one desktop viewport and expands naturally on mobile. Mobile puts the portrait and biography before the career details. Both guided boundaries repeat in either direction; native scrolling within a tall presentation allows all of its content to be read. Pause/reduced motion disable forced scrolling and the name scan.

Particles retain the 86/42 desktop/touch counts and 30fps cap. Their rendered positions now travel both left and right; links use the endpoint colors with .95px strokes. The name scan runs for 1250ms per line with 150ms stagger. It is a finite reveal, not a flashing effect. Normal pointer-local chromatic response is retained afterward.

## Checks

- `npm test`: seven generation/metadata/content tests passed.
- `npm run check`: generated HTML and sources agree.
- `node tests/browser.mjs --functional-only`: articles, all ten project sheets and galleries passed on desktop/mobile.
- `npm run test:gateway`: passed repeated wheel transitions, PageDown/PageUp transitions, direct Projects navigation, desktop presentation fit, native project scrolling, rendered particle motion in both directions, finite scan, chromatic About response, contact position, progress endpoints, reduced motion, no-JS content and mobile layout.
- The same test uses browser touch emulation with actual dispatched touch gestures: title → About, natural scrolling inside the tall About, and its final transition → projects all passed. This is not a physical-phone interaction test.
- `git diff --check`: passed.

One intermediate navigation test timed out during a reverse keyboard sequence; an isolated reproduction and the full subsequent run passed. The final test includes failure diagnostics for scroll position and focused element. No timing relaxation or skipped assertion was used to hide the result.

Screenshots in `test-results/gateway/`: desktop hero, intentional in-progress scan, presentation, projects and contact; mobile hero, presentation top/bottom, projects and full page. The scan capture is intentionally a partial reveal and is not the final visibility state. No images, project content, public deployment or Git history were changed. The portrait remains the previously documented stock placeholder. No Impeccable detector ran because its launcher was unavailable earlier in the session.
