# Humanizer

A Claude Code skill that strips signs of AI writing from text and rewrites it toward a named voice, instead of toward a generic "clean".

Originally [blader/humanizer](https://github.com/blader/humanizer), built on [Wikipedia's "Signs of AI writing"](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing). Since v3 it carries the structural tells that word lists cannot catch, and since v5.1 the editor-desk patterns from [petergyang/no-ai-slop](https://github.com/petergyang/no-ai-slop) (MIT).

## Files

| File | What it is |
|---|---|
| `SKILL.md` | The runtime. Process, the modern structural tells, the voice layer, the output contract. Source of truth. |
| `PATTERNS.md` | 46 numbered lexical patterns with before/after examples. 30-35 are Dutch translation artefacts, 36-40 human-editor patterns, 41-46 editor-desk patterns. |
| `EVAL.md` | The internal gate. 20 pass/fail checks run on the rewrite before it goes out. Never part of the output. |
| `README.md` | This file. |

The voice itself is **not** in here. It is data and lives in `~/.claude/voices/<name>.md`, one file per writer. The skill is the mechanism; hardcoding one person's habits into it makes it unshareable and turns a preference into a universal rule.

## Usage

```
/humanizer

[paste your text here]
```

Or just ask. In this harness two hooks pull it in automatically:

- `outbound-voice` (UserPromptSubmit) fires when a prompt asks for a message a human receives (WhatsApp, mail, LinkedIn, Teams, a reply). It pins the register from the voice profile and pins the output contract, so the profile applies without anyone invoking the skill.
- `humanizer-guard` (PreToolUse on Write/Edit) blocks hard tells in prose-dominant `.md`/`.txt`/`.mdx` files outside code, harness and docs trees. Code and technical files are deliberately out of scope.

## Two jobs

**Edit (default).** A draft in, the rewritten text out. Nothing else: no original alongside it, no diff, no "what changed", no preamble. The draft, self-audit, revision and EVAL passes all happen internally. Exceptions are a detect request, an explicit ask for the changes, and one question when a fact is missing.

**Detect.** Name each pattern that appears, quote the line, give the fix in a few words. No rewrite, no score, no claim about who wrote it. Detectors guess; named patterns are evidence the reader can check.

## What it actually watches

Three layers, in order of how much they matter in 2026:

1. **Structure.** Metronomic sentence length, symmetric paragraphs, the founder-post arc, fragment-for-effect spam, the tricolon reflex. A text with zero banned words still reads as AI when the shape gives it away, and sentence-rhythm work alone accounts for most of the achievable improvement.
2. **Performed humanity.** Fake candor, observer openers, no lived specifics, everything resolved, no tangents. AI imitating "authentic" is itself the tell.
3. **Vocabulary.** The classic list: `delve`, `tapestry`, em dashes, importance puffery, weasel attribution. Still worth removing, no longer worth trusting as a signal. Since November 2025 the mainstream models honor an instruction to drop em dashes, so their absence proves nothing.

The minimum effective edit is the governing principle. Cutting proportional to the actual slop; a rough line with a real voice survives, a smooth line that says nothing does not. Sanding the writer off looks like an improvement, which is why it is the failure mode that ships.

## Version history

- **5.1.0** - Editor-desk patterns 41-46, `EVAL.md` as the internal gate, detect mode, the minimum-effective-edit principle, final-text-only output contract, automatic register selection
- **5.0.0** - Split into SKILL/PATTERNS, voice layer, modern structural tells (2025-2026), Dutch translation artefacts, human-editor patterns
- **2.2.0** - Final "obviously AI generated" audit plus second-pass rewrite
- **2.0.0** - Rewrite based on the raw Wikipedia article

## License

MIT
