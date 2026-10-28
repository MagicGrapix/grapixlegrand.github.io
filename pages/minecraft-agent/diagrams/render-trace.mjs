// Two static editorial views of one recorded trial. No Minecraft or LLM calls.
// Import: node diagrams/render-trace.mjs path/to/report-en.html
// Render again from the small checked-in dataset: node diagrams/render-trace.mjs
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname } from 'node:path';

const fixture = new URL('./trace-example.json', import.meta.url);
const selectedNumbers = [12, 13, 14, 15];
const expectedScenario = 'craft_iron_pickaxe_from_world';

function extract(source) {
  const html = readFileSync(source, 'utf8');
  const match = html.match(/<script id="data" type="application\/json">([\s\S]*?)<\/script>/);
  assert(match, 'Missing report data');
  const { trials } = JSON.parse(match[1]);
  assert.equal(trials.length, 1, 'This illustration documents one trial');
  const { result, statistics: s } = trials[0];
  assert.equal(result.scenario, expectedScenario);
  const selected = selectedNumbers.map(number => {
    const call = s.activities.find(a => a.kind === 'tool' && a.details.actionNumber === number);
    assert(call, `Missing call #${number}`);
    const { actionNumber, tool, context, result: raw, before, after } = call.details;
    return { actionNumber, tool, startMs: call.startMs, durationMs: call.durationMs,
      status: call.status, arguments: JSON.parse(context.arguments), result: JSON.parse(raw), before, after };
  });
  const failure = selected[1];
  const llm = s.activities.filter(a => a.kind === 'llm' && a.startMs < failure.startMs).at(-1);
  const proposed = llm.details.response.choices[0].message.tool_calls[0].function;
  assert.equal(proposed.name, failure.tool);
  assert.deepEqual(JSON.parse(proposed.arguments), failure.arguments);
  const messages = llm.details.request.messages;
  const systemLine = 'You control a Minecraft bot through the supplied tools.';
  const rule = 'After a failure, retry only with new evidence or a relevant change.';
  assert(messages.find(m => m.role === 'system').content.includes(systemLine));
  assert(messages.find(m => m.role === 'system').content.includes(rule));
  // Only allowlisted display data goes into the website, never the full traces,
  // private reasoning, machine paths, tool-call identifiers or complete prompts.
  return {
    source: { campaign: basename(dirname(source)), report: basename(source),
      sha256: createHash('sha256').update(html).digest('hex'), date: result.startedAt.slice(0, 10) },
    scenario: result.scenario, status: result.status, durationMs: result.durationMs,
    counts: { llm: s.llmCalls, tools: s.toolCalls, failedTools: s.failedTools, internal: s.internalOperations },
    tools: s.tools,
    activities: s.activities.filter(a => a.kind !== 'internal').map(a => ({
      kind: a.kind, agent: a.agent, label: a.label, startMs: a.startMs,
      durationMs: a.durationMs, status: a.status,
      ...(a.kind === 'tool' ? { tool: a.details.tool } : {}),
      ...(a.kind === 'llm' && a.details.error ? { errorCode: a.details.error.code } : {}),
    })),
    selected,
    prompt: { system: [systemLine, rule], user: messages.findLast(m => m.role === 'user').content },
    final: { completedSteps: result.final.completedSteps, planSteps: result.final.planSteps,
      stonePickaxes: result.final.inventory.stone_pickaxe ?? 0,
      ironPickaxes: result.final.inventory.iron_pickaxe ?? 0 },
  };
}

const data = process.argv[2] ? extract(process.argv[2]) : JSON.parse(readFileSync(fixture, 'utf8'));
assert.equal(data.scenario, expectedScenario);
assert.equal(data.status, 'timeout');
assert(Math.abs(data.durationMs - 600000) < 10);
const toolEntries = Object.entries(data.tools).sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0]));
assert.equal(toolEntries.reduce((n, [, t]) => n + t.count, 0), data.counts.tools);
assert.equal(toolEntries.reduce((n, [, t]) => n + t.failed, 0), data.counts.failedTools);
assert.equal(data.activities.filter(a => a.kind === 'llm').length, data.counts.llm);
assert.equal(data.activities.filter(a => a.kind === 'tool').length, data.counts.tools);
assert.equal(data.selected.length, 4);
assert.deepEqual(data.selected.map(a => a.actionNumber), selectedNumbers);
assert.deepEqual(data.selected[1].arguments, { item: 'cobblestone', quantity: 11 });
assert.equal(data.selected[1].result.error.code, 'MISSING_ITEM');
assert.deepEqual(data.selected[1].before, data.selected[1].after);
assert.deepEqual(data.selected[1].before, { oak_log: 1 });
assert.equal(data.final.stonePickaxes, 0);
assert.equal(data.final.ironPickaxes, 0);
assert.equal(data.selected[0].result.value.collected, 1);
assert.deepEqual(data.selected[2].result.value, []);
assert.deepEqual(data.selected[3].result.value, []);
assert(data.activities.every(a => Number.isFinite(a.startMs) && a.startMs >= 0 && Number.isFinite(a.durationMs) && a.durationMs >= 0));
assert.equal(data.activities.findLast(a => a.kind === 'llm').errorCode, 'ABORTED');
if (process.argv[2]) writeFileSync(fixture, JSON.stringify(data, null, 2) + '\n');

const C = { bg: '#101722', panel: '#151f2e', edge: '#334155', text: '#e5e7eb',
  muted: '#aab8cc', cyan: '#67e8f9', green: '#5dd6a0', red: '#ff8991', redBg: '#2b1e2b' };
const esc = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const text = (x, y, s, size = 22, fill = C.text, extra = '') => `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" ${extra}>${esc(s)}</text>`;
const rect = (x, y, w, h, fill = C.panel, stroke = C.edge, r = 10) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}"/>`;
const line = (x1, y1, x2, y2, stroke = C.edge, extra = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" ${extra}/>`;
const mono = 'font-family="Consolas, monospace"';
const time = ms => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`;
const seconds = ms => (ms / 1000).toFixed(ms < 1000 ? 3 : 2) + ' s';
function wrap(s, max) {
  const lines = [''];
  for (const word of s.split(/\s+/)) {
    if (lines.at(-1).length + word.length + 1 > max) lines.push('');
    lines[lines.length - 1] += (lines.at(-1) ? ' ' : '') + word;
  }
  return lines;
}
function lines(x, y, content, size = 22, fill = C.text, gap = 31, extra = '') {
  return content.map((s, i) => text(x, y + i * gap, s, size, fill, extra)).join('');
}
function save(name, width, height, title, description, body) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title description">
<title id="title">${esc(title)}</title><desc id="description">${esc(description)}</desc>
<rect width="100%" height="100%" rx="16" fill="${C.bg}"/>
<g font-family="Segoe UI, sans-serif">${body}</g></svg>\n`;
  assert(!svg.includes('NaN') && !svg.includes('undefined'));
  writeFileSync(new URL(`../images/${name}`, import.meta.url), svg);
  console.log(`Rendered ${name}`);
}

// Campaign overview: exact timestamps on a shared axis, grouped into five lanes.
let campaign = text(34, 49, 'Ten minutes, one unfinished objective', 34, C.text, 'font-weight="600"')
  + text(34, 84, `Recorded trial · ${data.source.date} · ${data.scenario}`, 21, C.muted)
  + rect(1350, 25, 215, 50, C.redBg, C.red)
  + text(1458, 58, 'TIME LIMIT', 22, C.red, 'text-anchor="middle" font-weight="600"');
const metrics = [ ['Elapsed time', time(data.durationMs)], ['LLM calls', data.counts.llm],
  ['Tool calls', data.counts.tools], ['Tool errors', data.counts.failedTools] ];
metrics.forEach(([label, value], i) => {
  const x = 34 + i * 389;
  campaign += text(x, 135, label, 21, C.muted) + text(x, 184, value, 38, i === 3 ? C.red : C.text, 'font-weight="600"');
});
campaign += line(34, 211, 1565, 211)
  + rect(28, 236, 900, 590) + rect(950, 236, 622, 590)
  + text(52, 275, 'Full timeline', 27, C.text, 'font-weight="600"')
  + text(52, 306, 'LLM calls and tools · time since request acceptance', 21, C.muted);
const x0 = 240, plotW = 650, top = 362, rowH = 58;
const lanes = [ ['Coordinator', a => a.kind === 'llm' && a.agent === 'coordinator'],
  ['Planner', a => a.kind === 'llm' && a.agent === 'planner'],
  ['Action agent', a => a.kind === 'llm' && a.agent === 'actioner'],
  ['Delegations', a => a.kind === 'tool' && ['ask_planner', 'run_step'].includes(a.tool)],
  ['Other tools', a => a.kind === 'tool' && !['ask_planner', 'run_step'].includes(a.tool)] ];
assert(data.activities.every(a => lanes.filter(([, test]) => test(a)).length === 1));
for (let minute = 0; minute <= 10; minute += 2) {
  const x = x0 + plotW * minute / 10;
  campaign += text(x, 341, `${minute}:00`, 19, C.muted, 'text-anchor="middle"') + line(x, 351, x, 647);
}
lanes.forEach(([label, test], i) => {
  const y = top + i * rowH;
  campaign += text(52, y + 24, label, 23) + rect(x0, y, plotW, 34, C.bg, C.edge, 3);
  for (const a of data.activities.filter(test)) {
    const x = x0 + plotW * a.startMs / data.durationMs;
    const width = Math.max(0, Math.min(plotW * a.durationMs / data.durationMs, x0 + plotW - x));
    const color = a.status === 'failed' ? C.red : i === 3 ? C.muted : a.kind === 'llm' ? C.cyan : C.green;
    let mark = width < 2 ? line(x, y + 6, x, y + 28, color, 'stroke-width="3"')
      : rect(x, y + 6, width, 22, i === 3 ? C.panel : color, color, 2);
    if (a.status === 'failed' && width < 2) mark += text(x, y + 26, '×', 29, C.red, 'text-anchor="middle" font-weight="700"');
    campaign += `<g><title>${esc(`${a.label}: ${seconds(a.startMs)} + ${seconds(a.durationMs)}; ${a.status}`)}</title>${mark}</g>`;
  }
});
campaign += text(565, 677, 'Elapsed time (min:sec)', 20, C.muted, 'text-anchor="middle"')
  + rect(53, 701, 17, 17, C.cyan, C.cyan, 2) + text(80, 716, 'LLM', 20)
  + rect(173, 701, 17, 17, C.green, C.green, 2) + text(200, 716, 'Tool', 20)
  + text(295, 716, '×', 27, C.red) + text(323, 716, 'Error / abort', 20)
  + text(52, 752, 'Very short calls appear as ticks. Internal operations are hidden.', 20, C.muted)
  + text(52, 781, 'Delegations contain other calls; their durations are not additive.', 20, C.muted)
  + text(52, 810, 'The final LLM request was aborted at the time limit.', 20, C.muted);

campaign += text(974, 275, 'Calls by tool', 27, C.text, 'font-weight="600"')
  + text(974, 306, 'Recorded calls · counts, not task success', 21, C.muted);
const barX = 1288, barW = 174, maxCount = Math.max(...toolEntries.map(([, t]) => t.count));
campaign += text(974, 340, 'Tool', 18, C.muted) + text(1537, 340, 'Calls', 18, C.muted, 'text-anchor="end"');
toolEntries.forEach(([name, t], i) => {
  const y = 366 + i * 27;
  campaign += text(974, y, name, 18, C.text, mono)
    + rect(barX, y - 15, barW, 16, C.bg, C.bg, 0);
  const okWidth = barW * (t.count - t.failed) / maxCount, errorWidth = barW * t.failed / maxCount;
  if (okWidth) campaign += rect(barX, y - 15, okWidth, 16, C.green, C.green, 0);
  if (errorWidth) campaign += rect(barX + okWidth, y - 15, errorWidth, 16, C.red, C.red, 0);
  campaign += text(1480, y, t.count + (t.failed ? ` / ${t.failed} err` : ''), 18, t.failed ? C.red : C.text);
});
campaign += rect(975, 756, 15, 15, C.green, C.green, 2) + text(1000, 771, 'No error recorded', 19)
  + rect(1270, 756, 15, 15, C.red, C.red, 2) + text(1295, 771, 'Error', 19)
  + text(974, 808, 'Delegation tools are included. Internal operations are not.', 18, C.muted);
const llmIntervals = data.activities.filter(a => a.kind === 'llm').sort((a, b) => a.startMs - b.startMs);
assert(llmIntervals.every((a, i) => i === 0 || llmIntervals[i - 1].startMs + llmIntervals[i - 1].durationMs <= a.startMs), 'LLM requests must not overlap for this duration summary');
const llmMs = llmIntervals.reduce((sum, a) => sum + Math.max(0, Math.min(a.durationMs, data.durationMs - a.startMs)), 0);
campaign += text(36, 870, 'What this trial shows', 24, C.cyan, 'font-weight="600"')
  + text(36, 908, `LLM requests occupied ${seconds(llmMs)} of the 600 s trial, including the final aborted request.`, 23)
  + text(36, 943, 'The first collection error was a missing harvesting tool. Neither requested pickaxe was present at the end.', 23)
  + text(36, 980, 'One recorded trial, not a benchmark. Source: ' + data.source.campaign, 18, C.muted);
save('campaign-summary.svg', 1600, 1005, 'A ten-minute crafting trial: timeline and tool calls',
  `One trial on ${data.source.date}, stopped at ten minutes. ${data.counts.llm} LLM calls; ${data.counts.tools} tool calls including ${data.counts.failedTools} errors. The timeline shows all non-internal calls, grouped by role, with delegation intervals separate from their children. The final LLM call was aborted. Counts by tool: ${toolEntries.map(([n, t]) => `${n}: ${t.count}, ${t.failed} errors`).join('; ')}. Neither pickaxe was present at the end.`, campaign);

// Inspector: four actual tool calls, one selected, with verbatim short excerpts.
const chosen = data.selected[1], error = chosen.result.error, progress = error.facts.progress;
let inspector = text(34, 49, 'Reading a failure, not just watching the bot', 34, C.text, 'font-weight="600"')
  + text(34, 84, `Condensed inspector · ${data.source.date} · four recorded tool calls`, 22, C.muted)
  + rect(28, 112, 1384, 78)
  + text(50, 144, 'REQUEST', 18, C.cyan, 'font-weight="600"')
  + text(50, 174, 'Craft a stone pickaxe, use a furnace, then craft an iron pickaxe from nearby resources. Start empty.', 23)
  + text(34, 236, 'Action agent · tool history', 24, C.text, 'font-weight="600"');
const cardDescriptions = ['1 oak_log collected', 'Missing harvesting tool', '0 cobblestone blocks found', '0 loose cobblestone items found'];
data.selected.forEach((a, i) => {
  const y = 259 + i * 133, selected = i === 1;
  inspector += rect(28, y, 456, 115, selected ? C.redBg : C.panel, selected ? C.red : C.edge)
    + text(47, y + 30, a.status === 'failed' ? 'ERROR · SELECTED' : 'RETURNED', 17, selected ? C.red : C.green, 'font-weight="600"')
    + text(465, y + 30, time(a.startMs), 18, C.muted, 'text-anchor="end"')
    + text(47, y + 63, `#${a.actionNumber} ${a.tool}`, 23, C.text, mono)
    + text(47, y + 94, cardDescriptions[i], 20, C.muted);
});
inspector += rect(508, 212, 904, 695)
  + text(534, 249, `#${chosen.actionNumber} ${chosen.tool}`, 29, C.text, mono)
  + text(1384, 249, 'ERROR', 21, C.red, 'text-anchor="end" font-weight="600"')
  + text(534, 282, `Action agent · ${time(chosen.startMs)} into the request · ${seconds(chosen.durationMs)}`, 21, C.muted)
  + line(534, 303, 1386, 303)
  + text(534, 338, 'PROMPT · EXCERPT', 18, C.cyan, 'font-weight="600"')
  + text(534, 372, data.prompt.system[0], 23)
  + lines(534, 406, wrap(data.prompt.system[1], 63), 23)
  + text(534, 480, 'DELEGATION', 18, C.cyan, 'font-weight="600"')
  + text(534, 514, data.prompt.user, 23)
  + text(534, 560, 'TOOL INPUT', 18, C.cyan, 'font-weight="600"')
  + text(534, 598, `item: ${chosen.arguments.item}    quantity: ${chosen.arguments.quantity}`, 25, C.text, mono)
  + rect(531, 623, 858, 195, C.redBg, '#75404f')
  + text(552, 657, error.code, 22, C.red, `font-weight="600" ${mono}`)
  + lines(552, 694, wrap(error.message, 64), 23)
  + text(552, 784, `Sources found: ${progress.sourcesFound}   ·   Collected: ${progress.collected} / ${progress.requested}`, 23)
  + text(534, 856, 'Inventory before / after: 1 oak_log → 1 oak_log', 22, C.muted)
  + text(534, 888, 'No cobblestone was collected by this call.', 22, C.muted)
  + lines(34, 833, ['A valid call can fail because', 'the bot lacks a prerequisite.'], 23, C.cyan)
  + text(34, 949, 'Layout simplified for the article. Prompt and error excerpts are from the saved trace; request wording is shortened.', 19, C.muted)
  + text(34, 981, 'Source: ' + data.source.campaign + ' · calls #12–15', 18, C.muted);
save('debug-inspector.svg', 1440, 1005, 'A simplified inspector with a missing-tool error selected',
  `Four recorded calls: #12 collect_resource collected one oak_log; #13 collect_resource requested 11 cobblestone and failed with MISSING_ITEM; #14 find_nearest_blocks returned no cobblestone blocks; #15 get_dropped_items returned no cobblestone items. Selected call #13 shows actual prompt excerpts, item cobblestone, quantity 11, and the recorded error: ${error.message} There were 14 sources but zero collected items. Inventory stayed at one oak_log. This is a condensed editorial layout, not a screenshot of the original UI.`, inspector);
console.log(`Validated ${data.activities.length} displayed activities and ${data.counts.internal} omitted internal operations; no LLM or game execution.`);
