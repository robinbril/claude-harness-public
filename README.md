# claude-harness

Skills, hooks, and MCP configuration for agentic coding with Claude Code.

## Overview

claude-harness is a set of reusable components you drop into a Claude Code
setup. Skills are invoked by name to plan and drive multi-step work, review
code, and shape writing. Hooks run automatically and enforce a small number of
quality contracts. The MCP templates show how to wire a lean set of generic
servers.

The components are independent. You can install one skill, one hook, or the
whole set, and remove anything that does not fit your workflow.

## What's included

| Path | Contents |
| --- | --- |
| `skills/` | Original skills: orchestration loops, verification, code review, writing, and a design and animation set |
| `skills/vendor/` | Third-party skills, each under its author (mattpocock, vercel-labs, leonxlnx, obra) with the original license |
| `hooks/` | Node hooks that enforce the quality contracts |
| `mcp/` | Example MCP server configuration and notes |
| `voices/` | A voice-profile template for the outbound-message hook |
| `settings.example.json` | Shows how the hooks attach to `~/.claude/settings.json` |
| `AGENTS.md` | The operating contract: how an agent decides and proves its work |

## Before you begin

You need Claude Code installed and Node.js available on your `PATH`, because the
hooks are Node scripts.

## Install

1. Clone this repository.
2. Copy the directories under `skills/` into `~/.claude/skills/`, or symlink
   them.
3. Copy the files in `hooks/` into `~/.claude/hooks/`.
4. Merge the hook blocks you want from `settings.example.json` into
   `~/.claude/settings.json`, and correct the paths to match your machine.
5. To add MCP servers, copy the entries you want from `mcp/mcp.example.json`
   into your client's MCP configuration.

Skills become available by name in Claude Code. The hooks take effect the next
time a session starts.

## Hooks reference

Every hook fails open. An error inside a hook never blocks your work.

| Hook | Event | Description |
| --- | --- | --- |
| `verified-claim-guard.js` | Stop | Blocks a success claim after a turn that changed files unless the turn includes a `VERIFIED:` or `UNVERIFIED:` line. |
| `stop-render-audit.js` | Stop | Blocks finishing a CSS or markup change when no render was viewed after the edit. |
| `anti-slop-guard.js` | Write, Edit | Rejects common AI-slop patterns in code and comments. |
| `bash-precheck.js` | PreToolUse | Warns on known-bad shell invocations before they run. |
| `post-bash-combined.js` | PostToolUse | Converts a known shell error into a one-line fix hint. |
| `outbound-voice.js` | UserPromptSubmit | Applies a voice profile and output contract when a prompt writes a human-facing message. |
| `watermark-strip.js` | Write, Edit | Removes invisible watermark characters (zero-width, word joiners, the tag range) from files just written, and normalizes exotic spaces to a plain space. |

## Skills

The original skills group into four areas.

| Area | Skills |
| --- | --- |
| Orchestration | `supergoal`, `keten-loop`, `bouw-loop`, `fix-loop`, `speur-loop`, `polijst-loop`, `waak-loop`, `createloopprompt`, `model-routing` |
| Engineering | `verificatie-voor-klaar`, `frontend-gotchas`, `council`, `skill-finder` |
| Writing | `humanizer` |
| Design and animation | `apple-design`, `better-typography`, `better-colors`, `better-ui`, `emil-design-eng`, `find-animation-opportunities`, `improve-animations`, `animation-vocabulary`, `micro-transitions` |

The `skills/vendor/` directory holds third-party skills grouped by author.
From mattpocock: engineering and productivity skills such as `tdd`,
`code-review`, `diagnosing-bugs`, `domain-modeling`, `grilling`, `write-a-skill`,
and `setup-pre-commit`. From other authors: `agent-browser` (browser automation,
vercel-labs), `minimalist-ui` (leonxlnx), and `requesting-code-review` (obra).
Each author directory carries the original license, and `ATTRIBUTION.md` lists
every source.

Some skill descriptions are written in Dutch. The instructions and file names
are in English, so they work regardless of the language you prompt in.

## License and attribution

Original skills and all hooks are MIT-licensed (see `LICENSE`). Some design and
animation skills adapt work by Matt Pocock, Emil Kowalski, Apple, and ibelick,
and are included with credit. See `ATTRIBUTION.md` for the full breakdown.
