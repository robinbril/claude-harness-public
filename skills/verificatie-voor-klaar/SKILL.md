---
name: verificatie-voor-klaar
description: >-
  Bewijs een "klaar/werkt/live"-claim met een echte tool call vóór je hem doet. Use when: about to report a task, deploy, fix or feature as done; ending a long autonomous run or /goal batch; resuming after a context-continuation; or when a claim rests on "the API returned 200".
---

# Klaar is een feit, geen hoop

Acht sessies zijn verpest door "klaar" melden terwijl het ding niet laadde, crashte of de oude setup nog actief was. De regel: elke klaar-claim wijst naar één concrete tool-output die hem bewijst. Kun je niet verifiëren, dan zeg je dat ("we zien het bij de test"), je claimt niet.

## Bewijs per artefact-type

| Artefact | Minimaal bewijs |
|---|---|
| Webpagina / UI | URL geladen (snapshot of render), de flow doorgeklikt, geen console-errors. HTTP 200 bewijst leven, niet inhoud: client-side content vereist een render. |
| Deploy / container | Status-sweep (`docker ps --format "{{.Names}}|{{.Status}}"`) toont Up/healthy, logs zonder traceback. |
| Script / test | Zelf gedraaid, exit code gezien, de "Ran X tests"-telling klopt met het verwachte aantal (een te laag getal is stille test-uitval). |
| Data / count | Items geteld met een query of ls, niet geschat uit de vorige stap. |
| MCP-write (mail, agenda, board) | Het object teruggelezen via de bijbehorende read-tool. Een write zonder read-back is een aanname. |
| Config-wijziging | De consumerende service herstart of herladen én het nieuwe gedrag geobserveerd; een gewijzigde file die niemand herlas is geen wijziging. |

Subagent-claims tellen niet als bewijs: een worker die "klaar" rapporteert wordt hergecheckt met een eigen tool call of een verse verifier (zelfde regel als in de loop-skills).

## Lange runs en context-continuations

Uit de mining (3 continuation-sessies, 43 errors): de duurste fouten ontstaan rond context-uitputting.

1. **Persisteer werkstaat op disk, niet in de samenvatting.** Een state-file (state.md: wat DONE met bewijs, wat INCOMPLETE) overleeft de sessie; de auto-resumé vangt working-tree-staat niet.
2. **Geen sessie-gebonden IDs in een handoff.** Task/agent-IDs geven na de continuation 404; beschrijf het werk, niet het handle. Zie de handoff-skill.
3. **Bij ~80% context:** rond het lopende blok af, update de state-file, en stop met nieuwe deelprojecten starten. Een geforceerde continuation halverwege een edit kost meer dan het gestopte blok.
4. **Na een resume:** vertrouw de samenvatting niet over verifieerbare feiten; her-check de laatste geclaimde stap met één tool call voor je erop voortbouwt.

## Rapporteren

- Elke claim in het eindbericht draagt zijn bewijs: "5 pages live (verify_money_pages.py: 5x 200 + title)" in plaats van "de pages staan live".
- Wat niet geverifieerd kon worden staat expliciet als onbewezen, met wat het alsnog zou bewijzen.
- Falen rapporteer je als falen, met de output erbij. Niet herformuleren tot bijna-succes.

Verwant: de rule `verify-before-assigning.md` (geen onbewezen aannames als TODO's opvoeren), [[commit-discipline]] (werk verzamelen betekent per werkblok verifiëren), en de agent `verification-before-completion` (de generieke afsluit-gate; deze skill levert de skill-specifieke bewijstabel en continuation-regels daarbovenop, niet een tweede gate).
