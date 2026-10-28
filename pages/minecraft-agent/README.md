# Minecraft article

The page follows the existing OZWE article reader and shares its vendored Markdown renderer. It uses static SVG images; Mermaid is not loaded by visitors.

## Edit

- `article.md`: article text, image paths and captions.
- `diagrams/*.mmd`: editable Mermaid sources.
- `diagrams/mermaid-config.json`: diagram colours and typography.
- `images/*.svg`: generated diagrams. Regenerate them after editing a source.
- `../../cards/software-rnd.json`: portfolio card. Its diagram preview can later be replaced by a real screenshot.

Five visible capture/render placeholders remain: gameplay result, web inspector, voxel observations and pickup, campaign report, and Blueprint/build comparison. Replace each with a Markdown image followed by an italic caption, as in the other articles. Document the task and supplied materials for gameplay; include scenario and result for reports. Label illustrative renders separately from executed builds. Do not add a nonexistent image path.

The article now follows the chronology in the author's Google Doc, from asynchronous control to sequential execution, specialised agents, observations, scenarios, construction, collection, recipes and deterministic checks. It is approximately 12 minutes of reading. Model comparisons and speed improvements are not presented as benchmark results.

## Export diagrams

With Node.js installed, run this from `pages/minecraft-agent` in PowerShell:

```powershell
./diagrams/render.ps1
```

The script exports four diagrams with Mermaid CLI 12.0.0 and embeds the character PNG into the capabilities SVG. This keeps the exported SVG self-contained when displayed as an image. The first invocation downloads the CLI and its browser into the user's cache. No global install or site build dependency is required. The SVG files are already generated for this draft. If using an installed Chrome instead, pass `-PuppeteerConfig path/to/puppeteer-config.json` with an `executablePath` in that JSON.

See [Mermaid CLI](https://github.com/mermaid-js/mermaid-cli) for PNG/PDF output and browser configuration, and [Mermaid image nodes](https://mermaid.js.org/syntax/flowchart.html#image-shape) for the character integration. The text-only diagrams can also be pasted into [Mermaid Live Editor](https://mermaid.live/). The capabilities diagram needs the local PNG embedded by the export script.

## Character illustration

`images/minecraft-bot.png` was generated using the built-in image tool with transparency, then copied into this project. The image is illustrative, not evidence of a bot run. The diagram's labels, layout and arrows come from Mermaid.

Generation prompt:

> Use case: stylized-concept. Asset type: a small character cutout to embed in a technical Mermaid diagram for a Minecraft bot article. Primary request: one Minecraft player character, full body, standing in a neutral pose, slight three-quarter view, familiar blocky cubic proportions and pixel textures, turquoise shirt and blue trousers. Clean readable silhouette at small size. Genuinely transparent background, no scenery, no platform or ground plane, no floating items, no labels, no text, no diagram or arrows, no watermark. Center the entire character with modest transparent padding; do not crop head or feet. This is an explanatory illustration, not a screenshot from a real bot run.

## Local preview

From the repository root:

```powershell
py -m http.server 8000 --bind 127.0.0.1
```

Open http://127.0.0.1:8000/pages/minecraft-agent/. Opening `index.html` directly with `file://` cannot load the Markdown reader's fetch request.

Nothing in this folder publishes the site. Review the article, replace the screenshot placeholders and approve the changes before pushing.
