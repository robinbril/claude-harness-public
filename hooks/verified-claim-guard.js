// verified-claim-guard.js
// Stop-hook. Handhaaft het VERIFIED/UNVERIFIED-artefact uit CLAUDE.md:
// eindigt een beurt met een klaar-claim terwijl er in die beurt gemuteerd is
// (Write/Edit/Bash-schrijfwerk) en het slotbericht geen VERIFIED:/UNVERIFIED:
// label draagt, dan blokkeert de stop één keer met de opdracht om te bewijzen.
// stop_hook_active voorkomt een loop. Fail-open bij elke parse-fout.
'use strict';

const fs = require('fs');

const CLAIM = /\b(klaar|gereed|gefixt|opgelost|afgerond|gelukt|werkt( nu)?|staat (live|erin|online)|is (live|gedeployed|gebouwd|gemerged)|deployed|done|fixed|shipped)\b/i;
const LABEL = /\b(VERIFIED|UNVERIFIED)\s*:/;
const MUTATING_TOOLS = new Set(['Write', 'Edit', 'NotebookEdit']);
const MUTATING_BASH = /(>>?|\bSet-Content\b|\bOut-File\b|\bNew-Item\b|\bmkdir\b|\bgit\s+(commit|push|merge|apply)\b|\bnpm\s+(install|run|publish)\b|\bpip\s+install\b|\bdocker\b|\bscp\b|\bssh\b|\bmv\b|\bcp\b|\brm\b|\bdel\b)/;

function isRealUserEntry(e) {
  if (!e || !e.message || e.message.role !== 'user' || e.isMeta) return false;
  const c = e.message.content;
  if (typeof c === 'string') return c.trim().length > 0;
  if (Array.isArray(c)) return c.some(b => b && b.type === 'text') && !c.some(b => b && b.type === 'tool_result');
  return false;
}

function main(raw) {
  let input;
  try { input = JSON.parse(raw); } catch (_) { return 0; }
  if (input.stop_hook_active) return 0;
  const tp = input.transcript_path;
  if (!tp || !fs.existsSync(tp)) return 0;

  let entries = [];
  try {
    entries = fs.readFileSync(tp, 'utf8').split('\n').filter(Boolean).map(l => {
      try { return JSON.parse(l); } catch (_) { return null; }
    }).filter(Boolean);
  } catch (_) { return 0; }

  let lastUser = -1;
  for (let i = entries.length - 1; i >= 0; i--) {
    if (isRealUserEntry(entries[i])) { lastUser = i; break; }
  }
  if (lastUser < 0) return 0;
  const turn = entries.slice(lastUser + 1);

  let mutated = false;
  let lastText = '';
  let turnText = ''; // alle assistant-tekst van de beurt, voor de label-check
  for (const e of turn) {
    if (!e.message || e.message.role !== 'assistant' || !Array.isArray(e.message.content)) continue;
    for (const b of e.message.content) {
      if (b && b.type === 'tool_use') {
        if (MUTATING_TOOLS.has(b.name)) mutated = true;
        else if (b.name === 'Bash' && b.input && MUTATING_BASH.test(b.input.command || '')) mutated = true;
      }
      if (b && b.type === 'text' && b.text) { lastText = b.text; turnText += b.text + '\n'; }
    }
  }

  // De klaar-claim beoordeel je op het slotbericht (dat is wat de gebruiker leest),
  // maar het VERIFIED-artefact telt overal in de beurt: iemand kan bewijzen en
  // daarna nog een korte afsluiter zonder het label typen. Anders vuurt de guard vals.
  if (mutated && CLAIM.test(lastText) && !LABEL.test(turnText)) {
    process.stdout.write(JSON.stringify({
      decision: 'block',
      reason: 'Klaar-claim zonder VERIFIED:/UNVERIFIED:-artefact terwijl deze beurt muteerde. ' +
        'Draai een tool call die de claim bewijst (test, curl, render, query) en sluit af met een regel ' +
        '`VERIFIED: <wat draaide> -> <echte output>`, of markeer eerlijk `UNVERIFIED: <waarom niet>`.'
    }));
    return 0;
  }
  return 0;
}

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', c => { raw += c; });
process.stdin.on('end', () => {
  let code = 0;
  try { code = main(raw); } catch (_) {}
  process.exit(code);
});
