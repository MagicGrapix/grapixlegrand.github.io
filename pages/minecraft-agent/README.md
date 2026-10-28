# Minecraft article

The page follows the existing OZWE article reader and shares its vendored Markdown renderer. It uses static SVG diagrams and author-provided PNG screenshots; Mermaid is not loaded by visitors.

## Edit

- `article.md`: article text, image paths and captions.
- `diagrams/*.mmd`: editable Mermaid sources.
- `diagrams/mermaid-config.json`: diagram colours and typography.
- `diagrams/render-examples.mjs`: dependency-free SVG renderer for the voxel, shelter and recipe examples, with fixture assertions.
- `diagrams/render-trace.mjs` and `diagrams/trace-example.json`: renderer and minimal recorded data for the campaign summary and simplified inspector.
- `images/*.svg`: generated diagrams. Regenerate them after editing a source.
- `../../cards/software-rnd.json`: portfolio card. Its diagram preview can later be replaced by a real screenshot.

## Completion checklist

- [x] World Controller diagram, with a different generated Minecraft-style character.
- [x] Voxel volume on the left and matching ASCII layers on the right.
- [x] Blueprint / preparation / algorithmic construction workflow.
- [x] Four horizontal shelter layers, matching static scene 4.
- [x] Collection loop with the original bot character.
- [x] Author-provided wooden axe recipe image alongside the actual recipe text format.
- [x] Campaign overview: full grouped timeline, tool histogram and elapsed time from the recorded ten-minute trial.
- [x] Scene 1: author-provided wood-gathering scene for the introduction.
- [x] Scene 2: author-provided loose-log scene illustrating the distinction between breaking and collecting.
- [x] Scene 3: author-provided crafting setup beside a table, furnace and logs.
- [x] Scene 4: author-provided in-game shelter matching the illustrated Blueprint.
- [x] Simplified inspector: four recorded tool calls, with the missing-harvesting-tool error selected and short prompt excerpts.
- [x] Conclusion drafted from the project's progression, tradeoffs and remaining limitations; ready for the author's review.

The four game screenshots are `images/scene1.png` through `images/scene4.png`. They are staged illustrations, not evidence of an autonomous run. The loose-log image does not show a confirmed inventory gain, and the crafting image does not prove the held tool was crafted. The original files are displayed without cropping or alteration and can be opened at full size.

The UI capture placeholders have been replaced by compact SVG views derived from a saved trial. No further screenshots are required for the current draft. The Architect workshop remains described in the article without an additional screenshot. Keep actual execution evidence distinct from staged scenes. No gameplay or LLM execution was performed during this integration.

## Recorded trial visuals

Run from `pages/minecraft-agent`:

```powershell
node ./diagrams/render-trace.mjs
```

This regenerates `images/campaign-summary.svg` and `images/debug-inspector.svg` from the small checked-in `diagrams/trace-example.json`. No dependencies, game server or model are needed. To re-extract the original saved report, pass its local path as the only argument. The script checks the scenario, counts, selected calls and prompt excerpts before writing the fixture. This is deliberately an illustration of one specific trial, not a general report-export framework.

Source: `campaign_1792497383278_f1e7505b/report-en.html`, scenario `craft_iron_pickaxe_from_world`, recorded on 2026-10-20. The fixture stores the report SHA-256 for provenance. It retains only timings, counts, four tool results and short prompt excerpts; full prompts, private reasoning, local machine paths and tool-call IDs are not copied into the website.

- Campaign: one 600-second timeout, 33 LLM calls (including the final aborted call), 31 tool calls and 2 tool errors. All 64 non-internal activities are shown on a shared time axis, grouped by role. Very short calls are ticks. The 61 internal operations are omitted, not counted a second time. Delegations overlap their children and must not be added to their durations. The histogram includes delegation tools and labels green as “No error recorded,” not “task succeeded.”
- Inspector: real calls #12–15, with #13 selected. It requested 11 cobblestone, found 14 sources, collected none and returned `MISSING_ITEM` / `HARVEST_TOOL_MISSING`. Inventory stayed at one oak log. Calls #14 and #15 returned empty results successfully. Prompt and error excerpts are verbatim; the request heading is shortened. The SVG is an editorial reconstruction of the inspector layout, not a screenshot of the live UI.

The generator includes assertions for count totals, source records and the selected failure. The existing full report and the Minecraft debug UI are unchanged. Clicking either SVG in the article opens the full-size view.

The article now follows the chronology in the author's Google Doc, from asynchronous control to sequential execution, specialised agents, observations, scenarios, construction, collection, recipes and deterministic checks. It is approximately 12 minutes of reading. Model comparisons and speed improvements are not presented as benchmark results.

## Export diagrams

With Node.js installed, run this from `pages/minecraft-agent` in PowerShell:

```powershell
./diagrams/render.ps1
```

The script exports all seven `.mmd` files with Mermaid CLI 12.0.0 and embeds local PNG cutouts. This keeps the exported SVG self-contained when displayed as an image. The first invocation downloads the CLI and its browser into the user's cache. No global install or site build dependency is required. The SVG files are already generated for this draft. If using an installed Chrome instead, pass `-PuppeteerConfig path/to/puppeteer-config.json` with an `executablePath` in that JSON. To regenerate only selected diagrams, use `-Names world-controller,build-workflow,collect-resource`.

The three exact grid examples use code rather than image generation:

```powershell
node ./diagrams/render-examples.mjs
```

This generates `voxel-view.svg`, `shelter-layers.svg` and `crafting-recipe.svg`. The script checks dimensions, block counts, entrance/window coordinates and recipe ingredient counts before completing. The voxel projection and ASCII rows share one data structure. These are small fixed illustrations, not a second Minecraft simulation or a runtime dependency of the site.

`crafting-recipe.svg` embeds the author-provided `images/wooden_axe_recipe.jpg` on the left, preserving its aspect ratio and full contents. The recipe text on the right is generated by the script. The former generated axe cutout is no longer used in this diagram.

Reference data checked against the Minecraft project:

- `src/world/VoxelView.ts`: real observation size 5×5×4, horizontal slices, north-to-south rows and west-to-east columns. The article diagram deliberately uses a smaller 3×3×3 example (14 solid cells and 13 air cells).
- `src/devworld/scenes/shelter.ts`: 5×5×4 shelter, 79 oak planks, south entrance (1×2), west window (1×1), no door item.
- `recipes/wooden_axe.json` and the recipe renderer: 3 oak planks, 2 sticks, one wooden axe per craft, 3×3 crafting-table grid. The SVG preserves the rendered text, including the warning that catalog knowledge is not a live inventory/access check.

See [Mermaid CLI](https://github.com/mermaid-js/mermaid-cli) for PNG/PDF output and browser configuration, and [Mermaid image nodes](https://mermaid.js.org/syntax/flowchart.html#image-shape) for the character integration. The text-only diagrams can also be pasted into [Mermaid Live Editor](https://mermaid.live/). The capabilities diagram needs the local PNG embedded by the export script.

## Character illustration

`images/minecraft-bot.png` was generated using the built-in image tool with transparency, then copied into this project. The image is illustrative, not evidence of a bot run. The diagram's labels, layout and arrows come from Mermaid.

Generation prompt:

> Use case: stylized-concept. Asset type: a small character cutout to embed in a technical Mermaid diagram for a Minecraft bot article. Primary request: one Minecraft player character, full body, standing in a neutral pose, slight three-quarter view, familiar blocky cubic proportions and pixel textures, turquoise shirt and blue trousers. Clean readable silhouette at small size. Genuinely transparent background, no scenery, no platform or ground plane, no floating items, no labels, no text, no diagram or arrows, no watermark. Center the entire character with modest transparent padding; do not crop head or feet. This is an explanatory illustration, not a screenshot from a real bot run.

## Additional generated cutouts

Both cutouts below were generated with the built-in image tool, with `transparent_background: true`, and copied into the project. No external image-generation script or API was used. Only the decorative cutouts are generated: labels, arrows, coordinates, voxel cells and recipe cells come from Mermaid or SVG code.

### World Controller

- Asset: `images/world-controller-character.png`
- Used in: `images/world-controller.svg`
- Original generation filename: `exec-fd974588-ba84-4c85-b203-00e236832616.png`

Generation prompt:

> Use case: stylized-concept. Asset type: isolated character cutout for a technical diagram in an English Minecraft R&D article. Create one Minecraft-style player character, full body, neutral standing pose, three-quarter view, cubic limbs and pixel textures, a green work jacket, tan trousers, brown boots and orange hair. The character must look clearly different from the turquoise-shirt, blue-trouser player used elsewhere. Friendly practical world-builder appearance. Entire head and feet visible, generous transparent padding, simple silhouette readable at 180 pixels high. Soft even studio light, sharp clean edges. Genuinely transparent background, no ground plane, no glow, no shadow halo, no scenery, no extra objects, no tool held, no text, no arrows, no watermark. This is an explanatory illustration, not a real gameplay screenshot.

### Wooden axe and crafting table (replaced)

- Asset: `images/wooden-axe-crafting.png`
- Status: retained source asset, replaced in `images/crafting-recipe.svg` by the author's `wooden_axe_recipe.jpg`.
- Original generation filename: `exec-a6eeddf5-cd37-4464-8744-b59fc2d4ec1c.png`

Generation prompt:

> Use case: stylized-concept. Asset type: Minecraft crafting illustration cutout for an educational diagram. Show a single Minecraft crafting table cube in a clear three-quarter isometric view, with a recognisable pixelated wooden axe hovering just above it, axe handle pointing downward diagonally and chunky brown wooden axe head. Match the familiar blocky Minecraft voxel proportions and pixel-art textures, warm oak wood, no realistic rounded edges. Entire cube and axe visible with ample padding. Clean even light, transparent background, no ground plane, no glow or halo, no characters, no UI or crafting grid, no text, no labels, no other ingredients or objects, no watermark. Technical layout and exact recipe grid will be added separately in SVG, so this image must contain only the table and the wooden axe. An illustrative render, not a screenshot of gameplay.

## Local preview

From the repository root:

```powershell
py -m http.server 8000 --bind 127.0.0.1
```

Open http://127.0.0.1:8000/pages/minecraft-agent/. Opening `index.html` directly with `file://` cannot load the Markdown reader's fetch request.

Nothing in this folder publishes the site. Review the article, replace the screenshot placeholders and approve the changes before pushing.
