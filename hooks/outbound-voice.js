#!/usr/bin/env node
/**
 * outbound-voice.js
 * UserPromptSubmit hook: fires ONLY when the prompt is about writing a message
 * a human will read (WhatsApp, mail, LinkedIn, Teams, reply, caption, letter).
 *
 * It does two things the skill file alone cannot guarantee:
 *   1. Pins the register (chat / mail / public) from the channel word in the prompt,
 *      so the voice profile is applied automatically instead of on request.
 *   2. Pins the output contract: the final text only, no before/after, no
 *      "what changed", no bullets about the edit.
 *
 * Everything else (code, config, tickets, docs, questions) passes through
 * untouched: that is the whole point, the humanizer must not tax normal work.
 *
 * Fail-open: any error, no output, exit 0.
 */

const VOICE = '~/.claude/voices/voice.md';

// Channel words decide the register. Order matters: first hit wins.
const CHANNELS = [
  { re: /\b(whats?app|wapp|appje|app'?je|sms|imessage|telegram|signal|teams[- ]?bericht|dm|dm'?en|chatbericht)\b/i, register: 'one-on-one', channel: 'chat' },
  { re: /\b(mail|mailtje|e-?mail|outlook|inbox|brief|sollicitatiebrief|nieuwsbrief|newsletter)\b/i, register: 'email', channel: 'mail' },
  { re: /\b(linkedin|inmail|post|posten|caption|tweet|x-post|bio|landing|website-?tekst|advertentie|ad copy)\b/i, register: 'public', channel: 'public' },
  { re: /\b(teams|slack)\b/i, register: 'one-on-one', channel: 'chat' },
];

// An action that produces text somebody receives.
const ACTIONS = /\b(schrijf|schrijven|stuur|sturen|verstuur|opstellen|stel .{0,12}op|formuleer|concept|draft|reageer|reactie|antwoord|beantwoord|reply|herschrijf|rewrite|humanize|humaniseer|verbeter (de|deze|die|dit) (tekst|bericht|mail|zin)|maak (een|de|het|dit|er|hier|hiervan)|vertaal naar|zeg (dit|het) tegen)\b/i;

// Explicit humanizer calls always count, whatever channel.
const EXPLICIT = /\b(humanize|humaniseer|humanizer|minder ai|less ai|ai-?slop|klinkt als ai|in mijn stijl|in mijn eigen woorden|mijn schrijfstijl)\b/i;

// Hard negatives: technical work that happens to use the word "message" or "post".
const CODE_CONTEXT = /\b(commit|refactor|stack ?trace|traceback|compile|typescript|python|endpoint|api-?call|POST \/|http post|migration|unit ?test|deploy de|pull request|merge)\b/i;

let input = '';
process.stdin.on('data', c => (input += c));
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input || '{}');
    const prompt = String(data.prompt || '');
    if (!prompt.trim()) return done();

    const hit = CHANNELS.find(c => c.re.test(prompt));
    const explicit = EXPLICIT.test(prompt);
    const wantsText = ACTIONS.test(prompt);

    // Fire only on (channel + action) or an explicit humanize request.
    if (!explicit && !(hit && wantsText)) return done();
    if (!explicit && CODE_CONTEXT.test(prompt)) return done();

    const register = hit ? hit.register : 'one-on-one';
    const channel = hit ? hit.channel : 'chat';

    const lines = [
      '<outbound-voice>',
      'Deze prompt levert tekst op die een mens leest. Twee dingen liggen daarmee vast:',
      '',
      `1. STEM. Lees ${VOICE} en schrijf in register **${register}**. De registertabel bovenin dat bestand wint van elke algemene stijlregel, ook van de humanizer-skill. Draai daarna de humanizer-pass (~/.claude/skills/humanizer/) op het resultaat: eerst PATTERNS.md, dan de structurele tells, dan EVAL.md als poort. Al dat werk is intern.`,
      '',
      '2. OUTPUT. Alleen de definitieve tekst. Geen originele versie ernaast, geen diff, geen "wat ik veranderd heb", geen bulletjes over de bewerking, geen inleiding, geen afsluiter. Wil hij toelichting, dan vraagt hij erom.',
    ];

    if (channel === 'chat') {
      lines.push(
        '',
        'Rendering: moet er een letterlijke opsomming in een chatbericht, lever het bericht dan in een code-block, anders vertaalt de renderer de streepjes naar bolletjes.'
      );
    }

    lines.push('</outbound-voice>');
    process.stdout.write(lines.join('\n') + '\n');
  } catch (_) {}
  done();
});

function done() {
  process.exit(0);
}
