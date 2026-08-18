# Blind peer-review prompt template (fresh subagent per reviewer, authors stripped, order shuffled)

```text
Below are anonymized positions from a decision council on this question:

[question]

Positions (authors hidden):
[A] ...
[B] ...
[C] ...
[D] ...

For each position, score 1 to 5 on:
- Soundness: is the reasoning valid and well-supported?
- Insight: does it surface something non-obvious?
- Risk-honesty: does it own its own downside?

Then: name the single strongest position and the single weakest, and say in one line what the strongest one gets right that the others miss. Do not try to guess who wrote what.
```

Aggregate the scores across reviewers. A position that scores high with reviewers who did not write it is a real signal, not just a confident author.
