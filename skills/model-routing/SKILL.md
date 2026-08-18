---
name: model-routing
description: >-
  Route subagent tasks to the right Claude model (Fable 5, Opus 4.8, Sonnet 4.6, Haiku 4.5) when spawning agents or building multi-agent workflows. Use BEFORE any Agent/Workflow fan-out and whenever a model parameter is chosen. Triggers: "delegeer", "route dit", "welk model", "spawn agents", "multi-agent", "verdeel dit werk", "bespaar credits".
---

# Model Routing

Policy for delegating tasks to the right model in multi-agent work. The main session stays on Fable 5, always. Routing happens only at subagent spawn time: the Agent tool `model` param, workflow `agent()` opts.model, or agent frontmatter.

This skill is the detailed reference; the CLAUDE.md routing summary is the authoritative source. On a policy change, update both this skill and CLAUDE.md (plus any agent frontmatters), or the three drift apart.

## Hard rules

1. Never switch the main-session model. Prompt caches are model-scoped: a mid-session switch invalidates the full cache and costs more than it saves.
2. Route at spawn time only. One model per subagent, chosen before launch.
3. When in doubt, route one tier up. A misroute down costs a redo; a misroute up costs cents.
4. Scale `effort` within a model before switching models (low/medium for simple subagent work). Haiku has no effort parameter.

## Routing table

| Model param | Tier | Use for | Never for |
|---|---|---|---|
| omit (inherits Fable 5) | top | Orchestration, critical implementation, final verification, anything ambiguous | - |
| `opus` (Opus 4.8) | deep | Architecture, ambiguous requirements, complex review/debugging, legal/compliance analysis, research synthesis | Mechanical bulk work |
| `sonnet` (Sonnet 4.6) | worker | Scoped implementation, first-pass code review, writing tests, summaries, research subagents | Final say on architecture or risk |
| `haiku` (Haiku 4.5) | ant | Micro-tasks only: bulk file reads/extraction, format conversion, simple classification, fan-out lookups, mechanical checks with a fully specified spec | Any reasoning or judgment: legal, security, architecture, ambiguity, user-facing text |

## Valid model IDs

`claude-fable-5` (main session, locked) · `claude-opus-4-8` · `claude-sonnet-4-6` · `claude-haiku-4-5-20251001`. Use the short param (`opus` / `sonnet` / `haiku`) when spawning a subagent; reach for the full id only where one is required (agent frontmatter that pins an exact model, a config field). Validate ids before deploy: a non-existent id 400s. Suffix-dates you did not copy verbatim usually do not exist.

## Decision procedure (3 questions per task)

1. Does the task need judgment (weighing options, interpreting ambiguity, assessing risk)? Yes: route by where the judgment sits. Driving the pipeline, the critical path, or final say over subagent output: inherit (Fable 5). Standalone deep analysis (architecture, ambiguous spec, complex debugging, legal): `opus`. No judgment needed: continue.
2. Is it fully specified, mechanical, and cheap to verify? Yes: `haiku`. No: `sonnet`.
3. Is the blast radius of a wrong answer high (production, legal, money, security)? Route one tier up regardless of 1-2.

## Haiku constraints (why ants only)

- Weakest reasoning of the lineup. Built as a fast, cheap executor, not a judge.
- 200K context, same as Sonnet 4.6; only Opus 4.8 and Fable 5 carry 1M. No `effort` parameter (request errors on it).
- Verify haiku batch output before using it: spot-check a sample via a sonnet agent or run a deterministic check.

## Drift-audit (het beleid wordt aantoonbaar niet vanzelf gevolgd)

Mining 2026-07-06 vond in één subagent-omgeving 2053x Opus tegenover 0x expliciete Fable-matches, recht tegen dit beleid in. Drift ontstaat stil, via oude frontmatters en generatoren. Audit-recept (draai bij elke beleidswijziging, beleidsdatum: 2026-06-10):

```bash
# 1. Frontmatters horen GEEN model-parameter te hebben (erven = Fable)
grep -rln "^model:" ~/.claude/agents/
# 2. Generatoren en templates sweepen, niet alleen bestaande definities
grep -rln "claude-opus\|claude-sonnet\|model:" ~/.claude/skills/*/SKILL.md ~/.claude/commands/ | grep -v model-routing
```

Elke hit is een routing-beslissing die ooit hardcoded is; toets hem tegen de tabel hierboven of verwijder de pin. Check 1 moet leeg zijn. Klaar wanneer beide checks schoon zijn of elke resterende hit een bewuste, gedocumenteerde keuze is.

## Anti-patterns

- A cheap router model that picks the model per question. The router call itself costs tokens and latency, and the weakest model then makes the decision that determines quality. Use this static table instead.
- Re-running failed haiku work on haiku. One failure means respec the task or route up.
- Splitting one coherent reasoning task across many micro-agents to save credits. Coordination overhead eats the saving; one sonnet or Fable agent is cheaper.
- Spawning any agent for work the main session can do in a few tool calls. The cheapest agent is no agent.
