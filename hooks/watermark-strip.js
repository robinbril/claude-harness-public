#!/usr/bin/env node
/**
 * watermark-strip.js  (PostToolUse: Write|Edit)
 * Lightweight remover of invisible "watermark" Unicode from a file just written:
 * zero-width space/non-joiner, word joiner, invisible math operators, BOM,
 * soft hyphen, combining grapheme joiner, the steganographic tag range, and the
 * variation-selector supplement. Also normalizes exotic spaces to a plain space.
 *
 * On purpose it does NOT touch ZWJ (U+200D), emoji variation selectors
 * (U+FE00-FE0F) or bidi/RTL marks, so emoji sequences and right-to-left text
 * survive intact. Rewrites the file only when something changed. Fails open:
 * any error leaves the file untouched.
 *
 * Regexes are built at runtime from codepoint numbers so this source file
 * contains no invisible characters of its own.
 */
'use strict';
const fs = require('fs');

// Invisible / format codepoints with no legitimate role in code or prose.
const STRIP_CPS = [
  0x00AD, 0x034F, 0x061C, 0x115F, 0x1160, 0x17B4, 0x17B5,
  0x180B, 0x180C, 0x180D, 0x180E,
  0x200B, 0x200C, 0x2060, 0x2061, 0x2062, 0x2063, 0x2064,
  0xFEFF, 0xFFF9, 0xFFFA, 0xFFFB, 0xE0001,
];
const STRIP_RANGES = [[0xE0020, 0xE007F], [0xE0100, 0xE01EF]];
// Space homoglyphs that substitute for a normal space (U+0020).
const SPACE_CPS = [
  0x00A0, 0x1680, 0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006,
  0x2007, 0x2008, 0x2009, 0x200A, 0x202F, 0x205F, 0x3000,
];

const esc = cp => '\\u{' + cp.toString(16) + '}';
const single = cps => cps.map(esc).join('');
const ranges = rs => rs.map(([a, b]) => esc(a) + '-' + esc(b)).join('');
const STRIP = new RegExp('[' + single(STRIP_CPS) + ranges(STRIP_RANGES) + ']', 'gu');
const SPACES = new RegExp('[' + single(SPACE_CPS) + ']', 'gu');

const SKIP_PATH = /[\\/](node_modules|\.git|dist|build|\.venv)[\\/]/;
const MAX_BYTES = 2 * 1024 * 1024;

function main(raw) {
  let data;
  try { data = JSON.parse(raw); } catch { return; }
  const fp = data && data.tool_input && data.tool_input.file_path;
  if (!fp || SKIP_PATH.test(fp)) return;
  let buf;
  try { buf = fs.readFileSync(fp); } catch { return; }
  if (buf.length > MAX_BYTES || buf.includes(0)) return; // skip large or binary
  const text = buf.toString('utf8');
  const cleaned = text.replace(STRIP, '').replace(SPACES, ' ');
  if (cleaned !== text) {
    try { fs.writeFileSync(fp, cleaned); } catch { /* fail open */ }
  }
}

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', c => { raw += c; });
process.stdin.on('end', () => { try { main(raw); } catch {} process.exit(0); });
