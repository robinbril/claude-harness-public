# Humanizer eval (internal gate)

Run this on the rewrite before it goes out. Every check is pass or fail; one fail means fix and run again. This never appears in the output, it is the reason the output is short.

Adapted from the no-ai-slop eval (petergyang/no-ai-slop, MIT), merged with the structural tells in SKILL.md.

## Meaning and voice

1. Is the writer's point intact, with no claim, number, example, quote or opinion added that was not in the draft?
2. Are their vocabulary, cadence, bluntness, humor, uncertainty and digressions still there?
3. Were strong human sentences left alone rather than tidied for consistency?
4. Is the cutting proportional to the actual slop, with no compression that strips character?
5. Would the named writer send this unedited, or does it read as a cleaned-up version of them?
6. Does it sit in the right register for this audience (chat / mail / public), with the profile's register rules winning over general style rules?

## Lexical

7. Are the banned words, filler phrases, empty adverbs and inflated claims gone, unless quoted as examples?
8. For non-English text: are the translation artefacts gone (patterns 30-35)?

## Structural

9. Sentence-length spread measured, not estimated? A metronome (min and max inside 8-22) is a fail.
10. Are binary contrasts, negative listings, rhetorical setups and throat-clearing openers gone?
11. Are faux-insight setups, colon reveals, superficial `-ing` analysis, fake-strong verbs, synonym cycling and dramatic fragments fixed?
12. Is importance puffery replaced with plain fact, and weasel attribution either sourced or flagged to the user?
13. Is the fake-profound kicker deleted rather than rewritten into a better metaphor?
14. Is the summary-recap ending cut, so the piece ends on a concrete point, takeaway or next action?
15. Is decorative formatting gone: emoji headings, mid-sentence bold, bullets where prose reads better, headers over two-sentence sections?
16. Em dashes: none in short copy, at most one or two in a long draft where they clearly beat a comma?
17. Is there one concrete checkable detail (a name, a number, a real moment) a generator could not have invented?
18. Does it avoid the founder-post arc, the closing question and the tidy bow?

## Output

19. Is the response the final text alone, with no original alongside it, no diff, no "what changed", no preamble, no closing offer?
20. Detect request: does the response name each pattern with a quoted line and a short fix, without rewriting, scoring, or claiming AI authorship?
