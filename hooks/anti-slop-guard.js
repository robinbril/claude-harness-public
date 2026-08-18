// anti-slop-guard.js
// PostToolUse hook (Write|Edit|MultiEdit): na een wijziging aan .ts/.tsx/.js/.jsx
// draait dit de gevendorde anti-slop Oxlint-plugin (tools/oxlint/anti-slop/index.ts,
// geinstalleerd door de Claude-skill install-anti-slop) als de repo hem heeft.
// Geen plugin in de repo: stil exit 0. Wel plugin en violations: blokkeert de
// beurt met de diagnostics zodat Claude ze fixt, zelfde patroon als
// verified-claim-guard.js (JSON stdout met decision:"block").
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

let input;
try { input = JSON.parse(fs.readFileSync(0, 'utf8')); } catch (_) { process.exit(0); }

const tool = input.tool_name;
if (!['Write', 'Edit', 'MultiEdit'].includes(tool)) process.exit(0);

const filePath = input.tool_input && input.tool_input.file_path;
if (!filePath) process.exit(0);

const ext = path.extname(filePath).toLowerCase();
if (!['.ts', '.tsx', '.js', '.jsx'].includes(ext)) process.exit(0);

function findRepoRoot(startDir) {
  let dir = startDir;
  while (dir && dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, '.git'))) return dir;
    dir = path.dirname(dir);
  }
  return null;
}

const repoRoot = findRepoRoot(path.dirname(filePath));
if (!repoRoot) process.exit(0);

const pluginEntry = path.join(repoRoot, 'tools', 'oxlint', 'anti-slop', 'index.ts');
if (!fs.existsSync(pluginEntry)) process.exit(0);

// Resolve the vendored oxlint binary's JS entry point directly (walk up for
// hoisted monorepo installs, works the same under npm/pnpm/yarn since each
// still resolves node_modules/oxlint via a real dir or symlink). Invoking it
// straight through `node` sidesteps the platform shell entirely: no npx/pnpm
// .cmd wrapper (which needs shell:true on Windows and breaks with EINVAL
// otherwise), no argument-injection surface for a crafted file path.
function resolveOxlintBin(startDir) {
  let dir = startDir;
  while (dir && dir !== path.dirname(dir)) {
    const bin = path.join(dir, 'node_modules', 'oxlint', 'bin', 'oxlint');
    if (fs.existsSync(bin)) return bin;
    dir = path.dirname(dir);
  }
  return null;
}

const oxlintBin = resolveOxlintBin(repoRoot);
if (!oxlintBin) process.exit(0); // anti-slop gevendord, oxlint nog niet geinstalleerd

const relFile = path.relative(repoRoot, filePath);

const r = spawnSync(process.execPath, [oxlintBin, '-f', 'json', relFile], {
  cwd: repoRoot,
  timeout: 30000,
  stdio: 'pipe',
});

let diagnostics = [];
try {
  const parsed = JSON.parse((r.stdout || Buffer.from('')).toString());
  diagnostics = Array.isArray(parsed.diagnostics) ? parsed.diagnostics : [];
} catch (_) {
  process.exit(0); // oxlint-run of parse mislukt: fail-open, geen ruis
}

const hits = diagnostics.filter((d) => typeof d.code === 'string' && d.code.startsWith('anti-slop('));
if (!hits.length) process.exit(0);

const ruleOf = (d) => d.code.slice('anti-slop('.length, -1);

// Baseline: bestaande schuld mag geen edits blokkeren, nieuwe slop wel. Zonder
// baseline-bestand blokkeert elke violation (verse repo, dan is dat correct).
// Vergelijking op AANTAL per rule per bestand, niet op regelnummer, want een
// edit hogerop schuift regels op zonder dat er iets bij komt.
let baseline = null;
try {
  const bp = path.join(repoRoot, 'tools', 'oxlint', 'anti-slop-baseline.json');
  const key = relFile.replace(/\\/g, '/');
  baseline = (JSON.parse(fs.readFileSync(bp, 'utf8'))[key]) || {};
} catch (_) { baseline = null; }

let report = hits;
if (baseline) {
  const current = {};
  for (const d of hits) current[ruleOf(d)] = (current[ruleOf(d)] || 0) + 1;
  const regressed = Object.keys(current).filter((rule) => current[rule] > (baseline[rule] || 0));
  if (!regressed.length) process.exit(0); // niets nieuws: stil door
  report = hits.filter((d) => regressed.includes(ruleOf(d)));
}

const lines = report.slice(0, 20).map((d) => {
  const loc = d.labels && d.labels[0] && d.labels[0].span;
  const pos = loc ? `${d.filename}:${loc.line}:${loc.column}` : d.filename;
  return `${pos} ${d.code}: ${d.message}`;
});

process.stdout.write(JSON.stringify({
  decision: 'block',
  reason: `[anti-slop] ${baseline ? 'NIEUWE' : ''} violation(s) in ${relFile} (${report.length}):\n${lines.join('\n')}\n` +
    'Los op volgens de aangewezen regel (inference/const/satisfies/boundary parsing i.p.v. unknown/any/reflect-hacks). ' +
    'Geen rule verzwakken, onderdrukken of wegcasten.' +
    (baseline ? ' Bestaande schuld in dit bestand blokkeert niet; dit is nieuw.' : ''),
}));
process.exit(0);
