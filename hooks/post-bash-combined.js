#!/usr/bin/env node
/**
 * post-bash-combined.js  (PostToolUse: Bash)
 * Bundelt bash-fail-hint + pr-url-reminder in ÉÉN node-proces i.p.v. twee,
 * zodat elke Bash-call maar één keer node hoeft te starten. Gedrag identiek aan
 * de twee losse hooks: fail-hints naar stderr, PR/branch-URL naar stdout,
 * raw-passthrough behouden. Beide checks fail-open; nooit blokkerend.
 */
'use strict';

const { execSync } = require('node:child_process');

// --- bash-fail-hint ---
const HINTS = [
  { re: /python3(\.exe)?:? (is not recognized|command not found)|python3.*Microsoft Store/i,
    hint: 'python3 is een Windows Store-stub; gebruik `python`.' },
  { re: /\bnode\b.*(command not found|is not recognized)/i,
    hint: 'node zit niet in PATH van deze shell; gebruik het volledige pad "/c/Program Files/nodejs/node.exe" of herstel PATH.' },
  { re: /\b(wc|ls|head|tail|grep|sed|cat)\b: command not found/i,
    hint: 'PATH van de shell is stuk (bekend na een sessie-resume); zet PATH opnieuw of gebruik node/PowerShell met volledige paden.' },
  { re: /powershell\b.*(is not recognized|command not found)/i,
    hint: 'gebruik de volledige naam powershell.exe; kaal "powershell" valt buiten PATH in sommige shells.' },
  { re: /=: command not found|syntax error near unexpected token .?&/,
    hint: 'commands met = of & horen via `powershell -File script.ps1`, niet door bash.' },
  { re: /unexpected EOF while looking for matching/,
    hint: 'apostrofen in de command-body breken de Bash-wrapper; gebruik een heredoc zonder apostrofen (max ~15 regels).' },
  { re: /Compress-Archive/i,
    hint: 'Compress-Archive maakt niet-portable zips (backslash-paden); gebruik System.IO.Compression.ZipArchive met forward slashes.' },
  { re: /is not recognized as (an internal or external command|the name of a cmdlet)/i,
    hint: 'Windows kent dit command niet in deze shell: check exe-naam voluit (.exe), PATH, of draai het via powershell -File dan wel het absolute pad.' },
  { re: /: command not found/,
    hint: 'command niet in PATH van deze Git Bash; gebruik het absolute pad of herstel PATH (bekend na sessie-resume).' },
];

function failHint(data) {
  const resp = data.tool_response || {};
  const out = [resp.stdout, resp.stderr, resp.output, typeof resp === 'string' ? resp : '']
    .filter(Boolean).join('\n');
  if (!out) return;
  const fired = [];
  for (const { re, hint } of HINTS) {
    if (re.test(out)) fired.push(hint);
    if (fired.length >= 2) break;
  }
  if (fired.length) {
    process.stderr.write('[bash-fail-hint] bekende fout, bekende fix:\n' +
      fired.map(h => '  - ' + h).join('\n') + '\n');
  }
}

// --- pr-url-reminder ---
function sh(cmd, cwd) {
  return execSync(cmd, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 8000 }).trim();
}
function repoSlug(cwd) {
  const url = sh('git remote get-url origin', cwd);
  const m = url.match(/github\.com[/:]([^/]+)\/(.+?)(?:\.git)?$/);
  return m ? `${m[1]}/${m[2]}` : null;
}
function prReminder(data) {
  const cmd = String(data?.tool_input?.command || '');
  const cwd = data?.cwd || process.cwd();
  const isPush = /\bgit\s+push\b/.test(cmd);
  const isPr = /\bgh\s+pr\s+(create|edit|view|ready|reopen)\b/.test(cmd);
  if (!isPush && !isPr) return;
  let slug;
  try { slug = repoSlug(cwd); } catch { return; }
  if (!slug) return;
  let branch;
  try { branch = sh('git rev-parse --abbrev-ref HEAD', cwd); } catch { return; }
  const lines = [];
  let prUrl = '';
  try { prUrl = sh(`gh pr list --head ${branch} --state open --json url --jq ".[0].url // empty"`, cwd); } catch { /* gh missing */ }
  if (prUrl) {
    lines.push(`PR:     ${prUrl}`);
  } else {
    lines.push(`branch: https://github.com/${slug}/tree/${branch}`);
    lines.push('(no open PR for this branch yet)');
  }
  console.log(`[pr-url-reminder] Give the user this URL verbatim in your reply:\n  ${lines.join('\n  ')}`);
}

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', c => { raw += c; });
process.stdin.on('end', () => {
  let data = {};
  try { data = JSON.parse(raw); } catch (_) { process.stdout.write(raw); process.exit(0); }
  try { prReminder(data); } catch (_) {}
  try { failHint(data); } catch (_) {}
  process.stdout.write(raw); // passthrough (zoals bash-fail-hint deed)
  process.exit(0);
});
