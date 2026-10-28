// Static article illustrations, not screenshots or records of an agent run.
// Run: node diagrams/render-examples.mjs (no dependencies).
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';

const image = (name) => new URL(`../images/${name}`, import.meta.url);
const esc = (s) => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const text = (x, y, value, size = 22, color = '#e5e7eb', extra = '') =>
  `<text x="${x}" y="${y}" font-size="${size}" fill="${color}" ${extra}>${esc(value)}</text>`;
const rect = (x, y, w, h, fill, stroke = '#334155', radius = 12) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="${fill}" stroke="${stroke}"/>`;
const line = (x1, y1, x2, y2, color = '#64748b', extra = '') =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" ${extra}/>`;
function save(name, width, height, title, description, body) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-labelledby="title description">
<title id="title">${esc(title)}</title><desc id="description">${esc(description)}</desc>
<defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#22d3ee"/></marker></defs>
<rect width="100%" height="100%" fill="#101722" rx="16"/>
<g font-family="Segoe UI, sans-serif">${body}</g></svg>\n`;
  writeFileSync(image(name), svg);
  console.log(`Rendered ${name}`);
}

// Indexed [y][z][x]. The projection and text use the exact same cells.
const voxels = [
  ['SSS', 'SSD', 'DDD'],
  ['SS.', '.L.', '..D'],
  ['...', '.L.', '...'],
];
assert.equal(voxels.length, 3);
assert(voxels.every(layer => layer.length === 3 && layer.every(row => /^[SDL.]{3}$/.test(row))));
assert.equal(voxels.flat().join('').replaceAll('.', '').length, 14);
const palette = {
  S: ['#aab4c4', '#7e899b', '#626d7f'],
  D: ['#c68d5d', '#996444', '#70462e'],
  L: ['#e6bc79', '#b58345', '#8e612f'],
};
const project = (x, y, z) => [285 + (x - z) * 57, 300 + (x + z) * 28.5 - y * 61];
const polygon = (points, fill) => `<polygon points="${points.map(p => p.join(',')).join(' ')}" fill="${fill}" stroke="#101722" stroke-width="1.5"/>`;
function cube(x, y, z, symbol) {
  const p = (dx, dy, dz) => project(x + dx, y + dy, z + dz);
  const colors = palette[symbol];
  return polygon([p(0, 1, 0), p(1, 1, 0), p(1, 1, 1), p(0, 1, 1)], colors[0])
    + polygon([p(1, 0, 0), p(1, 0, 1), p(1, 1, 1), p(1, 1, 0)], colors[1])
    + polygon([p(0, 0, 1), p(1, 0, 1), p(1, 1, 1), p(0, 1, 1)], colors[2]);
}
let voxelSvg = text(32, 44, 'From blocks to horizontal slices', 28)
  + text(32, 78, 'Simplified 3 × 3 × 3 example · 14 solid blocks, 13 air cells', 20, '#aab8cc')
  + rect(28, 98, 520, 450, '#151f2e') + rect(574, 98, 538, 450, '#151f2e');
const cells = [];
voxels.forEach((layer, y) => layer.forEach((row, z) => [...row].forEach((s, x) => {
  if (s !== '.') cells.push({ x, y, z, s });
})));
cells.sort((a, b) => a.y - b.y || (a.x + a.z) - (b.x + b.z));
voxelSvg += cells.map(c => cube(c.x, c.y, c.z, c.s)).join('');
// The wireframe outlines the full volume, including air above the solids.
for (const y of [0, 3]) {
  const corners = [[0, y, 0], [3, y, 0], [3, y, 3], [0, y, 3]];
  corners.forEach((a, i) => {
    const b = corners[(i + 1) % 4];
    voxelSvg += line(...project(...a), ...project(...b), '#94a3b8', 'stroke-dasharray="4 6" opacity=".6"');
  });
}
for (const [x, z] of [[0, 0], [3, 0], [3, 3], [0, 3]]) {
  voxelSvg += line(...project(x, 0, z), ...project(x, 3, z), '#94a3b8', 'stroke-dasharray="4 6" opacity=".6"');
}
voxelSvg += text(316, 486, '+X east', 18, '#67e8f9') + text(132, 486, '+Z south', 18, '#67e8f9')
  + text(61, 155, '+Y up', 18, '#67e8f9')
  + line(85, 225, 85, 170, '#22d3ee', 'marker-end="url(#arrow)"')
  + text(600, 130, 'Top-down rows: north → south', 19, '#aab8cc')
  + text(600, 159, 'Columns: west → east', 19, '#aab8cc');
voxels.forEach((layer, y) => {
  const start = 203 + y * 114;
  voxelSvg += text(605, start + 28, `y = ${y}`, 23, '#67e8f9');
  layer.forEach((row, z) => {
    voxelSvg += text(740, start + z * 29, [...row].join('  '), 27, '#e5e7eb', 'font-family="Consolas, monospace" xml:space="preserve"');
  });
  voxelSvg += text(945, start + 28, ['Bottom', 'Middle', 'Top'][y], 19, '#aab8cc');
});
voxelSvg += text(34, 587, 'S  stone', 21, '#cbd5e1') + text(217, 587, 'D  dirt', 21, '#edbb93')
  + text(380, 587, 'L  oak_log', 21, '#e6bc79') + text(600, 587, '.  air', 21, '#aab8cc');
save('voxel-view.svg', 1140, 620, 'One voxel volume, three top-down layers',
  'A half-filled three by three by three voxel volume on the left and the matching ASCII layers on the right. S is stone, D dirt, L oak log and dot air. The real observation tool uses a five by five by four volume.', voxelSvg);

// Same geometry as MinecraftLLM/src/devworld/scenes/shelter.ts, scene 4.
const shelter = [
  ['AAAAA', 'AAAAA', 'AAAAA', 'AAAAA', 'AAAAA'],
  ['AAAAA', 'A...A', 'A...A', 'A...A', 'AA.AA'],
  ['AAAAA', 'A...A', '....A', 'A...A', 'AA.AA'],
  ['AAAAA', 'AAAAA', 'AAAAA', 'AAAAA', 'AAAAA'],
];
assert(shelter.every(layer => layer.length === 5 && layer.every(row => /^[A.]{5}$/.test(row))));
assert.equal(shelter[1][4][2], '.');
assert.equal(shelter[2][4][2], '.');
assert.equal(shelter[1][2][0], 'A');
assert.equal(shelter[2][2][0], '.');
assert.equal(shelter.flat().join('').replaceAll('.', '').length, 79);
let shelterSvg = text(30, 42, 'A shelter drawn layer by layer', 28)
  + text(30, 77, '5 × 5 × 4 · top-down views · north at the top · east to the right · bottom → top', 21, '#aab8cc');
shelter.forEach((layer, y) => {
  const x = 30 + y * 290;
  shelterSvg += rect(x, 105, 270, 337, '#151f2e')
    + text(x + 20, 140, `y = ${y}  ·  ${['Floor', 'Lower walls', 'Upper walls', 'Roof'][y]}`, 21)
    + text(x + 30, 174, '+X →', 17, '#aab8cc');
  layer.forEach((row, z) => [...row].forEach((symbol, col) => {
    const cx = x + 32 + col * 41;
    const cy = 188 + z * 41;
    shelterSvg += rect(cx, cy, 40, 40, symbol === 'A' ? '#b88a51' : '#0f172a', '#334155', 0)
      + text(cx + 20, cy + 28, symbol, 25, symbol === 'A' ? '#141a22' : '#cbd5e1', 'text-anchor="middle" font-family="Consolas, monospace"');
    if ((y === 1 || y === 2) && z === 4 && col === 2) {
      shelterSvg += `<rect x="${cx + 2}" y="${cy + 2}" width="36" height="36" fill="none" stroke="#67e8f9" stroke-width="3"/>`;
    }
    if (y === 2 && z === 2 && col === 0) {
      shelterSvg += `<rect x="${cx + 2}" y="${cy + 2}" width="36" height="36" fill="none" stroke="#fde68a" stroke-width="3"/>`;
    }
  }));
  shelterSvg += text(x + 32, 424, ['Solid foundation', 'Entrance: lower half', 'Entrance + 1 × 1 window', 'Solid cover'][y], 18, '#aab8cc');
});
shelterSvg += text(32, 478, 'A  oak_planks', 21, '#edc995') + text(242, 478, '.  required air', 21, '#cbd5e1')
  + text(470, 478, '□  entrance: 1 wide × 2 high', 20, '#67e8f9')
  + text(844, 478, '□  west window: 1 × 1', 20, '#fde68a');
save('shelter-layers.svg', 1200, 510, 'Four horizontal layers of a wooden shelter',
  'An illustrative blueprint matching the static shelter scene: a floor, two wall layers and a roof, made from 79 oak planks. A two-block-high entrance is in the south wall. A one-block window is in the west wall. Dots are required air, not unspecified cells. No door item is used.', shelterSvg);

// Matches recipes/wooden_axe.json and the human-readable recipe renderer.
const recipeRows = ['AA.', 'AB.', '.B.'];
assert.equal(recipeRows.join('').split('A').length - 1, 3);
assert.equal(recipeRows.join('').split('B').length - 1, 2);
const recipeImage = readFileSync(image('wooden_axe_recipe.jpg')).toString('base64');
let recipeSvg = text(32, 44, 'A recipe the planner can read', 28)
  + text(32, 78, 'Wooden axe · 3 oak planks + 2 sticks → 1 item', 21, '#aab8cc')
  + rect(28, 103, 437, 519, '#151f2e') + rect(490, 103, 622, 519, '#151f2e')
  + `<image href="data:image/jpeg;base64,${recipeImage}" x="44" y="128" width="405" height="470" preserveAspectRatio="xMidYMid meet"/>`;
const recipeLines = [
  ['wooden_axe x1 per craft', 23, '#67e8f9'],
  ['Variant 1/1: Oak planks', 20, '#aab8cc'],
  ['Grid: 3x3 | Station: crafting_table', 20, '#e5e7eb'],
  ['', 20, '#e5e7eb'],
  ['A = oak_planks x3', 22, '#edc995'],
  ['B = stick x2', 22, '#edc995'],
  ['', 20, '#e5e7eb'],
  ...recipeRows.map(row => [[...row].map(c => `[${c === '.' ? ' ' : c}]`).join(' '), 30, '#e5e7eb']),
];
recipeLines.forEach(([content, size, color], i) => {
  recipeSvg += text(522, 151 + i * 37, content, size, color, 'font-family="Consolas, monospace" xml:space="preserve"');
});
recipeSvg += text(522, 549, 'Catalog knowledge only; not a check of', 19, '#aab8cc')
  + text(522, 579, 'current ingredients or station access.', 19, '#aab8cc');
save('crafting-recipe.svg', 1140, 650, 'Wooden axe recipe image and catalog text',
  'The author-provided wooden axe recipe image appears beside the recipe catalog text. The three by three grid has planks in the top-left, top-middle and middle-left cells, and sticks in the middle-middle and bottom-middle cells. The other cells are empty.', recipeSvg);
