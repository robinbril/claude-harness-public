# WARP.md

Guidance for WARP (warp.dev) when working in this directory.

## What this is
A Claude Code skill, written entirely in Markdown. The runtime artifact is `SKILL.md`: Claude Code reads the YAML frontmatter (name, version, description, allowed tools) and treats the rest as the prompt.

## Files and how they relate
- `SKILL.md` - the skill definition and source of truth: process, voice layer, modern structural tells, the output contract.
- `PATTERNS.md` - the 46 numbered lexical patterns with before/after examples. Numbering is referenced from `SKILL.md`, `README.md` and `EVAL.md`, so keep it stable unless you renumber deliberately.
- `EVAL.md` - the internal pass/fail gate run on a rewrite before delivery. Never shown to the user.
- `README.md` - for humans: file map, usage, version history.

The voice profiles live outside this directory, in `~/.claude/voices/`. Never move a writer's habits into this skill: the skill is the mechanism, the profile is the target.

Two hooks in `~/.claude/hooks/` depend on this skill's contract, `outbound-voice.js` and `humanizer-guard.js`. Changing the output contract or the register table means checking those too.

## Making changes safely
- Preserve valid YAML frontmatter.
- Bump `version:` in `SKILL.md` and add the matching line to the version history in `README.md`. Keep them in sync.
- New patterns go at the end of `PATTERNS.md` with a before/after pair, and get a matching check in `EVAL.md` if they need enforcing.
- If you fix a tricky failure mode (a repeated mis-edit, an unexpected tone shift), note what and why in the README version history.
