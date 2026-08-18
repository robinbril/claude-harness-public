#!/usr/bin/env node
/**
 * bash-precheck.js
 * One PreToolUse(Bash) guard that runs a set of safety checks in a SINGLE node
 * process. The first hard finding wins (exit 2 + stderr). Fail-open: a crash in
 * any check lets the command through, because a broken guard must never block the
 * whole terminal.
 *
 * Checks (in order):
 *   1. dangerous git ops (force-push, hard-reset, clean -f)
 *   2. self-merge block (Claude never merges its own PR)
 *   3. environment guards (sed -i on a mounted/config file, non-portable zips,
 *      an OAuth seat-token used straight against the API)
 *   4. environment warnings (python3 Store-stub, Get-Content -Raw without -Encoding)
 *   5. credential in the command string itself (warn, do not block)
 *   6. secrets / temp files staged for a commit (block)
 */
'use strict';

const { execFileSync } = require('child_process');

// ── check 1: dangerous git ops ──────────────────────────────────────
const DANGEROUS = [
  { re: /git push.*--force/, reason: 'force-push blocked' },
  { re: /git reset --hard/, reason: 'hard-reset blocked' },
  { re: /git clean -f/, reason: 'git clean -f blocked' },
];
function checkDangerous(cmd) {
  for (const { re, reason } of DANGEROUS) if (re.test(cmd)) return reason;
  return null;
}

// ── check 2: self-merge block ───────────────────────────────────────
// A PR gets merged by a human reviewer, never by the agent. stripComments is
// defined below (hoisted) so a documented example in a comment never blocks.
function checkProtectedBranch(cmd) {
  const active = stripComments(cmd);
  if (/\bgh\s+pr\s+merge\b/.test(active)) {
    return 'gh pr merge blocked: never self-merge. Open the PR and let a human review and merge it.';
  }
  return null;
}

// ── check 6: secrets / temp files staged for commit ─────────────────
const SECRET = [
  { re: /sk-ant-[A-Za-z0-9_-]{12,}/, label: 'Anthropic API key' },
  // Hyphens must be included: the current OpenAI format is sk-proj-<rest>, and
  // [A-Za-z0-9]{24,} broke on that hyphen and let those keys through unseen.
  { re: /\bsk-[A-Za-z0-9_-]{24,}\b/, label: 'OpenAI-style API key' },
  { re: /\bgh[posru]_[A-Za-z0-9]{20,}\b/, label: 'GitHub token' },
  { re: /\bAKIA[0-9A-Z]{16}\b/, label: 'AWS access key id' },
  { re: /\bxox[baprs]-[A-Za-z0-9-]{10,}/, label: 'Slack token' },
  { re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/, label: 'private key' },
  { re: /\b(password|passwd|secret|api[_-]?key|access[_-]?token)\b\s*[:=]\s*['"][^'"\s]{6,}['"]/i, label: 'hardcoded credential' },
];
const EMAIL = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;
const EMDASH = /—/;
const TEMP_PATH = /(^|\/)(\.env(\.local|\.production)?$|[^/]*\.(tmp|bak|orig|swp|swo|log)$|[^/]*~$|\.DS_Store$|Thumbs\.db$|node_modules\/|__pycache__\/|[^/]*\.pyc$)/i;
const BINARY_EXT = /\.(png|jpe?g|gif|webp|ico|pdf|zip|gz|tar|woff2?|ttf|mp4|mov)$/i;

function git(args) {
  try {
    return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 16 * 1024 * 1024 });
  } catch (_) { return ''; }
}
function loadBlocklist() {
  // Optional per-repo blocklist: one regex per line in a committed
  // `.harness-blocklist` file. Lets a repo add its own forbidden strings.
  const out = [];
  const txt = git(['show', ':./.harness-blocklist']);
  for (const line of txt.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    try { out.push({ re: new RegExp(t, 'i'), label: `blocklist "${t}"` }); } catch (_) {}
  }
  return out;
}
function checkCommitSecrets(cmd) {
  if (!/\bgit\b[^\n]*\bcommit\b/.test(cmd)) return null;
  const staged = git(['diff', '--cached', '--name-only']).split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  if (!staged.length) return null;

  const blocklist = loadBlocklist();
  const blocks = [], warns = [];
  const tempFiles = staged.filter(f => TEMP_PATH.test(f));
  tempFiles.forEach(f => blocks.push(`temp/scratch file staged: ${f}`));

  for (const f of staged) {
    if (BINARY_EXT.test(f)) continue;
    const content = git(['show', `:${f}`]);
    if (!content) continue;
    for (const { re, label } of SECRET) if (re.test(content)) blocks.push(`${label} in ${f}`);
    for (const { re, label } of blocklist) if (re.test(content)) blocks.push(`${label} in ${f}`);
    const em = content.match(EMAIL);
    if (em) warns.push(`email ${em[0]} in ${f}`);
    if (/\.(md|txt|mdx|rst)$/i.test(f) && EMDASH.test(content)) warns.push(`em dash (AI slop) in ${f}`);
  }
  if (warns.length) {
    process.stderr.write('[bash-precheck] commit warnings (not blocking):\n');
    warns.slice(0, 12).forEach(w => process.stderr.write(`  - ${w}\n`));
  }
  if (!blocks.length) return null;
  let msg = '[bash-precheck] BLOCKED git commit. These must not be committed:\n';
  msg += blocks.slice(0, 20).map(b => `  - ${b}`).join('\n') + '\n';
  if (tempFiles.length) msg += `[bash-precheck] unstage temp files: git restore --staged ${tempFiles.join(' ')}\n`;
  return msg;
}

// ── check 3/4: environment guards ───────────────────────────────────
// sed -i on a mounted/config file: only block with an ssh/docker context or a
// known config filename in the same command, not every local sed -i.
const SED_I = /\bsed\s+(-\w+\s+)*-i\b/;
const SED_I_CONTEXT = /\bssh\b|\bdocker\s+(exec|compose)\b/;
const SED_I_CONFIG_PATH = /Caddyfile|docker-compose[^\s]*\.ya?ml|\.env\b/;
const COMPRESS_ARCHIVE = /\bCompress-Archive\b/;
// An OAuth seat-token used straight against the API.
const SEAT_TOKEN = /sk-ant-oat01-[A-Za-z0-9_-]+/;
const HTTP_CALL = /\bcurl\b|\bInvoke-WebRequest\b|\bInvoke-RestMethod\b|\bfetch\(|\brequests\./;
// python3 is a Store stub on Windows.
const PYTHON3 = /(^|[\s;&|])python3\b/;
// Get-Content -Raw without -Encoding.
const GET_CONTENT_RAW = /Get-Content\b(?![^\n]*-Encoding)[^\n]*-Raw\b/;

// Strip line comments (# ... to end of line) before matching, so a term that
// only appears in a comment for documentation does not cause a false block.
function stripComments(cmd) {
  return cmd
    .split(/\r?\n/)
    .map(line => line.replace(/#.*$/, ''))
    .join('\n');
}

function checkEnvGuardsBlock(cmd) {
  const active = stripComments(cmd);
  if (SED_I.test(active) && (SED_I_CONTEXT.test(active) || SED_I_CONFIG_PATH.test(active))) {
    return 'sed -i on a (possibly) mounted file: a bind-mount does not follow an inode swap. Truncate in place: cat > file.';
  }
  if (COMPRESS_ARCHIVE.test(active)) {
    return "Compress-Archive makes non-portable zips (backslash entries). Use System.IO.Compression.ZipArchive with -replace '\\\\','/'.";
  }
  if (SEAT_TOKEN.test(active) && HTTP_CALL.test(active)) {
    return 'An OAuth seat-token straight against the API = 429 + flag risk. Route via CLAUDE_CODE_OAUTH_TOKEN + claude -p.';
  }
  return null;
}

function checkEnvGuardsWarn(cmd) {
  const warns = [];
  if (PYTHON3.test(cmd)) warns.push('python3 is a Store stub on Windows; use python.');
  if (GET_CONTENT_RAW.test(cmd)) warns.push('Get-Content -Raw without -Encoding UTF8 gives mojibake + double-encoding on write-back.');
  return warns;
}

// ── check 5: credentials in the command string itself ───────────────
// The SECRET array only runs over staged files at commit time. A token that sits
// directly in argv ends up in shell history and the transcript. Warn, do not
// block: an env-var reference is legitimate. Emit only the label to stderr, never
// the value, otherwise the warning itself leaks the token into the transcript.
const VAR_REF = /[$%]|\benv\b/i;

function checkCommandSecrets(cmd) {
  const active = stripComments(cmd);
  const found = new Set();
  for (const { re, label } of SECRET) {
    const m = active.match(re);
    if (m && !VAR_REF.test(m[0])) found.add(label);
  }
  return [...found];
}

// ── dispatch ────────────────────────────────────────────────────────
function main(raw) {
  let data = {};
  try { data = JSON.parse(raw); } catch (_) { process.stdout.write(raw); return 0; }
  if ((data.tool_name || '') !== 'Bash') { process.stdout.write(raw); return 0; }
  const cmd = (data.tool_input && data.tool_input.command) || '';

  try { const r = checkDangerous(cmd); if (r) { process.stderr.write('[bash-precheck] ' + r + '\n'); return 2; } } catch (_) {}
  try { const r = checkProtectedBranch(cmd); if (r) { process.stderr.write('[bash-precheck] ' + r + '\n'); return 2; } } catch (_) {}
  try { const r = checkEnvGuardsBlock(cmd); if (r) { process.stderr.write('[bash-precheck] ' + r + '\n'); return 2; } } catch (_) {}
  try {
    const warns = checkEnvGuardsWarn(cmd);
    if (warns.length) process.stderr.write('[bash-precheck] (warn) ' + warns.join(' ') + '\n');
  } catch (_) {}
  try {
    const secrets = checkCommandSecrets(cmd);
    if (secrets.length) {
      process.stderr.write(
        `[bash-precheck] (warn) credential in the command itself: ${secrets.join(', ')}. ` +
        'This stays in shell history and the transcript. Put it in an env-var.\n'
      );
    }
  } catch (_) {}
  try { const r = checkCommitSecrets(cmd); if (r) { process.stderr.write(r); return 2; } } catch (_) {}

  process.stdout.write(raw);
  return 0;
}

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', c => { raw += c; });
process.stdin.on('end', () => {
  let code = 0;
  try { code = main(raw); } catch (_) { try { process.stdout.write(raw); } catch (_) {} }
  process.exit(code);
});
