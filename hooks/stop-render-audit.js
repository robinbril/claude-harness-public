#!/usr/bin/env node
/**
 * stop-render-audit.js  (Stop)
 *
 * Blokkeert het afronden van een beurt waarin markup of CSS is gewijzigd zonder
 * dat er daarna een render is bekeken. Aanleiding: een footer-menu dat als twee
 * ronde pillen van 40px rendeerde omdat een bestaande selector in dezelfde
 * container width/height/display oplegde. De HTML was geverifieerd, de render
 * niet, en dat verschil is precies waar visuele bugs leven.
 *
 * De volgorde telt: een screenshot ergens eerder in de sessie bewijst niets over
 * een CSS-wijziging die daarna kwam. Er wordt dus gekeken of er NA de laatste
 * visuele edit nog een render is opgehaald.
 *
 * Vuurt maximaal een keer per sessie, zodat "ik kan hier niet renderen, ik meld
 * het als onbewezen" altijd een uitweg blijft. Fail-open: elke fout in deze
 * guard laat de sessie gewoon door.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

let input;
try { input = JSON.parse(fs.readFileSync(0, 'utf8')); } catch (_) { process.exit(0); }

const transcriptPath = input && input.transcript_path;
if (!transcriptPath || !fs.existsSync(transcriptPath)) process.exit(0);

// Scratch- en archiefmappen zijn wegwerpwerk, daar hoeft niets van te renderen.
const EXEMPT = /[\\/](scratchpad|_archive|node_modules|\.git|dist|build)[\\/]/i;
const PURE_VISUEEL = /\.(css|scss|sass|less|html|htm)$/i;
const COMPONENT = /\.(vue|jsx|tsx|svelte|astro)$/i;
// Een componentbestand telt alleen mee als de wijziging over uiterlijk ging.
const STIJL_IN_COMPONENT = /class(Name)?\s*=|style\s*=|<style|:\s*(flex|grid|block|none|absolute|relative)\b|(margin|padding|width|height|color|background|border|font|transform|opacity|gap|z-index)\s*:/i;

const RENDER_TOOLS = /(claude-in-chrome|Claude_Browser|chrome-devtools|computer-use)__(computer|take_screenshot|screenshot)$/;

function isRender(t) {
  if (!t || !t.name) return false;
  if (/take_screenshot|__screenshot$/.test(t.name)) return true;
  if (!RENDER_TOOLS.test(t.name)) return false;
  const actie = t.input && t.input.action;
  return actie === 'screenshot' || actie === 'zoom';
}

function isVisueleEdit(t) {
  if (!t || (t.name !== 'Write' && t.name !== 'Edit')) return false;
  const f = t.input && t.input.file_path;
  if (!f || EXEMPT.test(f)) return false;
  if (PURE_VISUEEL.test(f)) return true;
  if (!COMPONENT.test(f)) return false;
  const inhoud = (t.input.content || '') + (t.input.new_string || '');
  return STIJL_IN_COMPONENT.test(inhoud);
}

let laatsteEdit = -1;
let laatsteRender = -1;
const bestanden = new Set();

try {
  const regels = fs.readFileSync(transcriptPath, 'utf8').split('\n');
  for (let i = 0; i < regels.length; i++) {
    if (!regels[i]) continue;
    let e;
    try { e = JSON.parse(regels[i]); } catch (_) { continue; }
    const calls = e && e.message && Array.isArray(e.message.content)
      ? e.message.content.filter(c => c && c.type === 'tool_use')
      : [];
    for (const t of calls) {
      if (isVisueleEdit(t)) { laatsteEdit = i; bestanden.add(t.input.file_path); }
      // Een render bewijst de edits ervoor: wis de openstaande set zodat straks
      // alleen bestanden overblijven die NA de laatste render zijn gewijzigd.
      // Zonder dit dumpt de guard elke beurt de hele sessiegeschiedenis, inclusief
      // allang gerenderde of niet door mij aangeraakte bestanden.
      else if (isRender(t)) { laatsteRender = i; bestanden.clear(); }
    }
  }
} catch (_) { process.exit(0); }

if (laatsteEdit === -1 || laatsteRender > laatsteEdit) process.exit(0);

// Eenmalig per sessie: de marker draagt de regel-index van de edit die hem liet
// vuren, zodat een volgende visuele wijziging later in dezelfde sessie opnieuw
// wordt gecontroleerd.
const sessie = path.basename(transcriptPath, '.jsonl');
const marker = path.join(os.tmpdir(), `render-audit-${sessie}.txt`);
try {
  if (fs.existsSync(marker) && Number(fs.readFileSync(marker, 'utf8')) >= laatsteEdit) process.exit(0);
  fs.writeFileSync(marker, String(laatsteEdit));
} catch (_) { process.exit(0); }

const lijst = [...bestanden].slice(0, 5).map(f => '  ' + f).join('\n');
process.stderr.write(
  '[render-audit] Je hebt markup of CSS gewijzigd en daarna geen render bekeken:\n' +
  lijst + '\n' +
  'De DOM of een grep bewijst niets over layout. Open de pagina (claude-in-chrome, ' +
  'en forceer de state als het om hover of focus gaat) en kijk, of zeg expliciet ' +
  'dat het onbewezen is. Deze guard vuurt hierna niet nog een keer voor dezelfde wijziging.\n'
);
process.exit(2);
