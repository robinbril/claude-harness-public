# AGENTS.md

How an agent should operate inside this harness. The skills in `skills/` give an
agent capabilities. This file governs how it decides and how it proves its work.
The rules that matter are not aspirational: they are enforced by hooks in
`hooks/`, so an agent cannot quietly skip them under load.

## The core problem

A model reviewing its own plan is a yes-man. It wrote the plan, so it likes the
plan. You get confident output and no adversary. Two failure modes follow. The
agent claims work is finished without running it, and the agent commits to a
direction without a second opinion. This harness is built to make both of those
hard to do by accident.

## Decision artifacts

A rule in a bulleted list gets skipped when the context is long and the model is
loaded. A rule that forces the model to emit a specific line of text at a
decision point does not, because it cannot proceed without writing that line
first. So the rules that carry the most weight here are artifacts, not prose.
Emit the line, then continue.

| Artifact | Fires when | What it forces |
| --- | --- | --- |
| `ROUTE:` | A strategy, architecture, or large build is about to start | Consult a different model first, before your own take |
| `INTENT:` | Code and a spec disagree | Name what the code does, what the spec says, and the gap. Change nothing yet. |
| `VERIFIED:` / `UNVERIFIED:` | Any claim that work is finished | The command that ran and its real output, or an honest reason it did not |
| `BLAST RADIUS:` | A destructive or outward-facing step | What dies, the collateral scope, whether it reverses |
| `READ vs INFERRED:` | Analysis of a named source | Whether you opened it or are guessing |

Two of these are enforced, not trusted:

- `hooks/verified-claim-guard.js` blocks the end of a turn that changed files and
  claims success without a `VERIFIED:` or `UNVERIFIED:` line.
- `hooks/stop-render-audit.js` blocks a finished CSS or markup change when no
  render was viewed after the edit.

The design rule behind all of this: anything that keeps failing in practice gets
rewritten from a directive into an artifact. If a model ignores a sentence, stop
writing sentences.

## Consult a different model before it matters

`ROUTE` earns its own section because it is the one people skip. For anything
strategic, architectural, or expensive, consult a model that is not the one
answering, and do it before giving your own take. Offering a second opinion after
you have already decided is the failure mode, not the fix.

How to run it:

- Spawn a subagent with an explicit model override. Hand it the full context and
  a hostile brief: tell it to refute the plan, not to bless it.
- Verify what comes back against the real code. A second model can be wrong too,
  so relay only what survives that check.
- The requirement is a different model, not a particular brand. Whichever other
  model the harness offers counts. The `model-routing` skill helps pick one, and
  the `council` skill runs several against each other and synthesizes the result.

If no second model is reachable, say so in one line and mark your take
`unrouted`. Never block a turn waiting for a route you cannot take. Silence is
the only wrong answer here.

## Heavy plan, light execution

One long run that plans, builds, and integrates everything tends to die on
context or session limits, and it drifts as it goes. The harness splits the work.

1. Plan once, thoroughly. A capable model writes frozen interface contracts, a
   file tree, and a work partition that can be built in parallel. The `supergoal`
   and `keten-loop` skills drive this.
2. Execute light. A fresh worker builds each unit against those contracts and is
   verified exactly once. The loop skills (`bouw-loop`, `fix-loop`, `speur-loop`,
   `polijst-loop`) are the execution engine.
3. Integrate and verify by running. The orchestrator proves the result against
   the running artifact, never by reading the code its own children wrote.

Step three is the one agents get wrong. Reading your worker's diff and declaring
it correct is self-review with extra steps. Run the thing.

## Delegate by default

The main session is an orchestrator, not a laborer. It plans, it verifies, and it
does the small things that are cheaper to do than to hand off. Everything
substantial, the reading, building, refactoring, and auditing, goes to a fresh
worker with its own context. This is not about speed. A single session that does
all the work fills its own context with the work's debris and reasons worse for
it. A worker returns a result; its scratch reasoning dies with it. When in doubt
whether a task is worth delegating, delegate it. Keep only the conversational
replies and the trivial edits in the main session.

## Route work by tier, not by name

Think in three roles, not in model brands. A strong reasoner for architecture,
ambiguous requirements, and any call that carries real judgment. A cheap bulk
worker for mechanical sweeps and large reads where the answer is legwork, not
thought. A judge seat for final verification and adversarial review, where being
wrong is expensive. Pick the cheapest tier that can do the job without losing
quality, and no cheaper. The one hard error is letting the weakest model make a
judgment call: a cheap model deciding a hard question, or gating a route, is worse
than no router at all. A static routing policy beats a cheap model deciding the
route on every turn, and it also spares the prompt cache, which a per-turn model
swap invalidates. Map the tiers onto whatever your harness offers: a stronger
model override for architecture and ambiguity, a mid one for scoped
implementation and review, the cheapest only for mechanical microtasks with no
judgment in them.

## Keep sensitive work on your own seat

Anything private, personal data, customer or candidate records, medical
information, secrets, never leaves for a third-party model or rail you do not
control. It stays on the seat you trust, even when a cheaper tier could handle the
mechanics. This rule wins over cost and over convenience. A leak is not a bug you
fix later.

## When a rail fails

Delegation depends on infrastructure, and infrastructure falls over. When a worker
rail is unreachable or errors out, say so in one line, name the fallback, and take
it. One attempt per rail, then move; a retry loop just burns turns on a dead path.
Have the fallback order decided in advance so the choice is not improvised under
load, and let the native session model be the last resort, never the first. The
sensitive-seat rule holds through every fallback: a broken rail is never a reason
to force private work onto a model that should not see it.

## Verify by running

"Done" requires a tool call that proves it. A deploy is proven by fetching the
served asset, not by a clean push. A visual change is proven by a render in the
state you claim, not by the DOM or a grep. A count is proven by the query, not by
an estimate. That is what `VERIFIED:` records and what `verified-claim-guard.js`
enforces. A known problem you shipped anyway is worse than one you never found,
so name an open issue in the delivery rather than letting it ride.

## Verify what a person will see

A passing typecheck and green unit tests do not tell you how an interface looks
or feels. A visual or interactive change is proven by looking at a real render,
in the state you claim, taken after the change. Read a concrete value out of that
render that you named as an expectation first: a number, a label, a position.
"Looks good" is not proof, it is a hope.

Two tools for two jobs:

- A browser extension attached to a real, logged-in browser is for the actual
  look and interaction: the render, hover and focus states, whether a click lands
  where you expect. This is the default for anything visual.
- Chrome DevTools, over the DevTools protocol, is for what genuinely needs it:
  performance traces, network waterfalls, Lighthouse, heap snapshots. Reach for
  it only when a plain render cannot answer the question.

`hooks/stop-render-audit.js` enforces the timing. A render viewed before the edit
proves nothing about the edit.

## Verify in batches, not constantly

Verification spends time and context, so spend it where it pays. Do not re-prove
every micro-step. Prove a deliverable when it is finished, and when several land
together, verify them in one pass instead of one at a time. The goal is a real
check at each real boundary, not ceremony at every keystroke.

## The critic pass

For anything with taste in it, a UI, a page, a written document, self-review is
worth little, because the builder is attached to its own work. Hand it to a
critic that never watched it being built: a subagent with fresh context, the most
relevant design skill in this harness loaded (for example `apple-design`,
`better-typography`, `tufte-data-viz`, or `improve-ui`), and a brief to be harsh.
It grades against the skill's standard rather than a vibe, and it reports what is
wrong before what is fine. The fresh context is the point. An adversary that
shares the builder's assumptions is not an adversary.

## No slop

Anything a person reads should read as deliberate, not as machine filler.
`hooks/anti-slop-guard.js` rejects the common tells of machine-written code and
comments before they land. `hooks/outbound-voice.js` pins a voice profile when a
prompt writes a human-facing message. Match the surrounding code, write plain
prose, and do not narrate your own process inside a deliverable. The work is the
work.

## Honest limits

This harness does not give you:

- A guarantee that the second model is right. It gives you an adversary, which is
  worth more than agreement, but the adversary's output still has to be verified.
- Token-level streaming from plain subagents. What you see from a dispatched
  agent is progress, not its full reasoning, so treat a quiet agent as working
  rather than stuck.
- Enforcement beyond the hooks. The artifacts a hook does not cover depend on the
  agent actually emitting them. The hooks close the two that cost the most when
  skipped, and the rest is discipline.

The rules here earn their place by catching real failures. When one stops
catching anything, cut it.
