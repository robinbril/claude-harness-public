---
name: council
description: Convene a multi-voice AI council that deliberates on a hard decision through independent positions, a blind peer-review round, and a chairman synthesis. Use for ambiguous calls with several credible paths (architecture choices, build-vs-buy, ship-vs-hold, go/no-go, vendor decisions, risk reviews) or whenever the user wants second opinions or structured dissent before committing. Triggers include "council", "second opinions", "stress-test this decision".
---

# Council

Convene a council of independent advisors for decisions where one answer is not enough. Each advisor reasons with a distinct method, positions are gathered in parallel without anchoring, the advisors rate each other blind, and a chairman synthesizes a verdict that keeps the disagreement visible.

## What makes this stronger than asking once

1. **Distinct reasoning methods, not just vibes.** Each voice is bound to a named method (first-principles, inversion, outside-view, second-order, shipping-reality). Diversity of method is what surfaces blind spots.
2. **Anti-anchoring by construction.** Advisor positions come from fresh subagents that receive only the question and minimal context, never the running conversation. The loudest framing in the chat cannot contaminate the panel.
3. **Blind peer review.** Before synthesis, each advisor rates the *other* anonymized positions on a rubric, so arguments win on merit, not on who spoke first or longest.
4. **A chairman who must show its work.** The synthesis preserves the raw positions and the strongest dissent, states a confidence level, and names what would change the verdict.

## When NOT to use

| Instead of council | Do this |
| --- | --- |
| Verifying whether an output is correct | Verify it directly or use an adversarial review pass |
| Breaking a feature into implementation steps | Plan it |
| Designing system architecture from scratch | Design it directly |
| Reviewing code for bugs or security | Run a code review |
| Straight factual questions | Just answer |
| Obvious execution tasks | Just do the task |

Council chooses between options; it does not produce the options' implementation.

## Right-size the deliberation first

Classify before convening:

- **Stakes.** High stakes = at least one of: hard or impossible to undo, touches production/money/security/contracts, or undoing costs more than a week. Everything else is low stakes.
- **Low stakes, two-way door:** do not convene. Say so and give a direct recommendation with one line of reasoning.
- **Low stakes but genuinely contested:** 3 voices, single round, skip peer review.
- **High stakes:** 5 voices, blind peer review, second round only if the panel splits (see below).

## The voices

You participate as the Chairman; the others are launched as independent subagents.

| Voice | Reasoning method | Lens |
| --- | --- | --- |
| Architect | First-principles | Correctness, maintainability, long-term structure |
| Skeptic | Outside view / base rates | Challenge the premise, propose the simplest credible alternative |
| Pragmatist | Shipping reality | Speed, user impact, operational cost, cost of delay |
| Critic | Inversion / pre-mortem | Downside risk, edge cases, the failure modes that kill this |
| Strategist (5th, high-stakes only) | Second-order effects | Knock-on consequences, incentives, what this makes true 12 months out |

## Workflow

### 1. Extract the real question

Reduce the decision to one explicit prompt: what are we deciding, which constraints are non-negotiable, what counts as success. If the question is vague, ask one sharp clarifying question before convening; a council on the wrong question wastes the whole exercise.

### 2. Gather only the necessary context

Codebase-specific decision: the few relevant files, snippets, metrics or issue text, compact. Strategic decision: skip repo detail unless it materially changes the answer. The context block must be small enough that it does not smuggle in your preferred conclusion.

### 3. Write the Chairman's prior

Before reading any advisor, write down privately: your initial position, the three strongest reasons for it, and the main risk in your preferred path. This stops the synthesis from echoing whichever advisor wrote best.

### 4. Launch the advisors in parallel

Spawn each voice as a fresh independent subagent in a single batch. Each gets the question, the compact context, and its role; none gets the conversation history. Use the prompt in [`templates/advisor-prompt.md`](templates/advisor-prompt.md), including the per-voice method emphasis.

### 5. Blind peer-review round (skip for low-stakes)

Strip the author labels, shuffle the positions, and give the anonymized set to each advisor again (fresh subagent, no history) with the prompt in [`templates/peer-review-prompt.md`](templates/peer-review-prompt.md). Aggregate the scores.

### 6. Synthesize as Chairman, with bias guardrails

You are both participant and synthesizer, so hold yourself to these:

- Do not dismiss an advisor's view without saying why.
- If an advisor changed your recommendation, say so in the verdict.
- Always include the strongest dissent, even if you reject it.
- Two voices aligned against your prior is a real signal, not noise to argue away.
- If peer review ranked a position above yours, address it head-on.
- Keep the raw positions visible before the verdict.

### 7. Present a compact verdict

Cap: the whole block fits in ~40 lines.

```markdown
## Council: [short decision title]

**Architect:** [1-2 sentence position] - [1 line why]
**Skeptic:** [1-2 sentence position] - [1 line why]
**Pragmatist:** [1-2 sentence position] - [1 line why]
**Critic:** [1-2 sentence position] - [1 line why]
[**Strategist:** ... if convened]

### Peer review
- Top-rated position: [which, and the one thing it got right]
- Lowest-rated: [which, and why]

### Verdict
- **Consensus:** [where the voices genuinely align]
- **Strongest dissent:** [the most important disagreement, stated fairly]
- **Premise check:** [did the Skeptic land a hit on the question itself?]
- **Recommendation:** [the synthesized path]
- **Confidence:** [low / medium / high]
- **What would change this:** [the specific evidence or condition that flips the call]
```

The value is not unanimity; it is making the disagreement legible before choosing.

## Second round (only when the panel genuinely splits)

Default is one round. Run a second only if the decision is a one-way door AND peer review left two positions within 1 point of each other on the aggregated rubric. Then: sharpen the question to the exact axis of disagreement, carry forward only the two contested positions, and keep one advisor (usually the Skeptic) clean of the prior round.

Stop after the second round. A panel that cannot converge in two rounds means you are missing information, not perspectives: name the missing input and stop.

## Optional: genuine model diversity

The core skill runs entirely on this agent's own subagents. If other coding-agent CLIs happen to be installed, you can route one or two advisor seats to them for cross-model diversity. Never a hard dependency: absent CLIs means the full council runs on native subagents without degradation. Do not introduce external API keys or paid routing for this.

## Anti-patterns

- Using council for code review or plain implementation work.
- Feeding the subagents the conversation transcript (defeats anti-anchoring).
- Letting author labels leak into the peer-review round.
- Hiding disagreement inside a tidy consensus.
- Convening five voices for a reversible, low-stakes call.
- Running extra rounds instead of admitting you lack information.
