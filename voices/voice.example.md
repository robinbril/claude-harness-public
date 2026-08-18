# Voice profile (template)

Copy this file to `~/.claude/voices/voice.md` and fill it in with your own voice.
It is read by the `humanizer` skill and the `outbound-voice` hook. The register
table below wins over any general style rule, including the humanizer's defaults.

One profile per writer. The skill is the mechanism; this file is the data. Do not
hardcode your habits into the skill, keep them here.

## Register table

The channel word in the request picks the row. The row's rules override everything else.

| Register | Channels | Length | Greeting / sign-off | Tone |
|---|---|---|---|---|
| one-on-one | chat, DM, WhatsApp, SMS, Teams/Slack message | 1 to 4 sentences | none, or first name only | direct, plain, warm |
| email | mail, letter, newsletter | short paragraphs | light greeting, minimal sign-off | clear, courteous, concrete |
| public | post, caption, bio, landing copy, ad copy | tight, scannable | none | confident, specific, no filler |

## Do

- Lead with the point. The first line carries the message.
- Short sentences. Plain words. One idea per sentence.
- Concrete nouns and real numbers over abstractions.
- Keep the reader's own phrasing when it already works.

## Don't

- No em dashes. Use a comma or a period.
- No emoji unless the other person used them first.
- No throat-clearing openers ("I hope this finds you well", "Great question!").
- No inflated significance ("crucial", "seamless", "robust", "in today's world").
- No rule-of-three padding or promotional adjectives.

## Example rewrites

- Before: "I wanted to reach out to kindly follow up on the matter we discussed."
- After: "Following up on what we discussed."

- Before: "This is a crucial step that will seamlessly streamline the entire workflow."
- After: "This removes two manual steps from the workflow."

## Signature phrases (optional)

List a few phrases you actually use, and a few you never use, so the voice match
has something concrete to aim at. Leave empty if you prefer.
