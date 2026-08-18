# claude-harness

Skills, hooks, and MCP notes for agentic coding with Claude Code. These are the
reusable parts of a working setup, stripped of anything project- or
company-specific. Take what fits, adapt the rest.

## Overview

Skills are invoked by name to plan and drive multi-step work, review code, and
shape writing. Hooks run automatically and enforce a few quality contracts. The
components are independent, so you can install one skill, one hook, or the whole
set.

`AGENTS.md` is the operating contract: how an agent should decide and prove its
work. Read it first if you want the reasoning behind the hooks.

## What's included

| Path | Contents |
| --- | --- |
| `skills/` | Original skills: orchestration loops, verification, code review, writing, and a design and animation set |
| `skills/vendor/` | Third-party skills grouped by author, each with its own license |
| `hooks/` | Node hooks that enforce the quality contracts, all fail open |
| `AGENTS.md` | The operating contract: how an agent decides and proves its work |

## Before you begin

You need Claude Code installed and Node.js on your `PATH`, since the hooks are
Node scripts.

## Install

1. Clone this repository.
2. Copy the directories under `skills/` into `~/.claude/skills/`, or symlink them.
3. Copy the files in `hooks/` into `~/.claude/hooks/`.
4. Wire the hooks you want into `~/.claude/settings.json`. Each hook's header
   comment names the event it belongs on. A minimal wiring:

```json
{
  "hooks": {
    "PostToolUse": [
      { "matcher": "Write|Edit|MultiEdit", "hooks": [
        { "type": "command", "command": "node ~/.claude/hooks/watermark-strip.js" },
        { "type": "command", "command": "node ~/.claude/hooks/anti-slop-guard.js" }
      ]}
    ],
    "Stop": [
      { "hooks": [
        { "type": "command", "command": "node ~/.claude/hooks/verified-claim-guard.js" },
        { "type": "command", "command": "node ~/.claude/hooks/stop-render-audit.js" }
      ]}
    ]
  }
}
```

## Hooks

Every hook fails open. An error inside a hook never blocks your work.

| Hook | Event | Description |
| --- | --- | --- |
| `verified-claim-guard.js` | Stop | Blocks a success claim after a turn that changed files unless the turn includes a `VERIFIED:` or `UNVERIFIED:` line. |
| `stop-render-audit.js` | Stop | Blocks finishing a CSS or markup change when no render was viewed after the edit. |
| `anti-slop-guard.js` | Write, Edit | Rejects common AI-slop patterns in code and comments. |
| `watermark-strip.js` | Write, Edit | Removes invisible watermark characters (zero-width, word joiners, the tag range) from files just written, and normalizes exotic spaces. |
| `bash-precheck.js` | PreToolUse | Warns on known-bad shell invocations before they run. |
| `post-bash-combined.js` | PostToolUse | Converts a known shell error into a one-line fix hint. |
| `outbound-voice.js` | UserPromptSubmit | Applies a voice profile and output contract when a prompt writes a human-facing message. Point it at your own voice file. |

## Skills

The original skills group into four areas.

| Area | Skills |
| --- | --- |
| Orchestration | `supergoal`, `keten-loop`, `bouw-loop`, `fix-loop`, `speur-loop`, `polijst-loop`, `waak-loop`, `createloopprompt`, `model-routing` |
| Engineering | `verificatie-voor-klaar`, `frontend-gotchas`, `council`, `skill-finder` |
| Writing | `humanizer` |
| Design and animation | `apple-design`, `better-typography`, `better-colors`, `better-ui`, `emil-design-eng`, `find-animation-opportunities`, `improve-animations`, `animation-vocabulary`, `micro-transitions` |

The `skills/vendor/` directory holds third-party skills grouped by author. From
mattpocock: engineering and productivity skills such as `tdd`, `code-review`,
`diagnosing-bugs`, `domain-modeling`, `grilling`, `write-a-skill`, and
`setup-pre-commit`. From other authors: `agent-browser` (vercel-labs),
`minimalist-ui` (leonxlnx), and `requesting-code-review` (obra). Each author
directory carries the original license, and `ATTRIBUTION.md` lists every source.

Some skill descriptions are written in Dutch. The instructions and file names are
in English, so they work regardless of the language you prompt in.

## MCP servers

A lean set of generic, public servers pairs well with this harness. Add them to
your client's MCP config as you need them, and keep tokens in environment
variables rather than in the config.

| Server | What it adds |
| --- | --- |
| `context7` | Up-to-date library and framework docs |
| `sequential-thinking` | A scratchpad for structured multi-step reasoning |
| `filesystem` | Scoped read and write to a project directory |
| `github` | Issues, pull requests, and repo operations |
| `chrome-devtools` | Drive a real browser: DOM, network, screenshots |
| `playwright` | Browser automation across Chromium, Firefox, and WebKit |
| `fetch` | Fetch a URL and return its content |
| `memory` | A persistent knowledge graph across sessions |

Keep the fleet small. Every server is a process your client cold-starts, so a
dozen rarely-used servers slow every session's boot.

## License and attribution

Original skills and all hooks are MIT-licensed (see `LICENSE`). Some design and
animation skills adapt work by Matt Pocock, Emil Kowalski, Apple, and ibelick,
and the vendored skills carry their own licenses. See `ATTRIBUTION.md`.
