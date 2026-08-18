---
name: micro-transitions
description: Bouwen van micro-interactions, hover/press/enter/exit transities, project- of feature-kaarten (arc/fan/carousel/stagger) en swipe-rails, in React+Motion of vanilla HTML/CSS/JS
---

# Micro-transitions

Bron: [Amicro](https://github.com/Subhan-code/Amicro--Micro-transitions-) door Subhan-code (Syed Subhan), MIT-licentie. Destillatie van hun spring-configs, arc/fan-geometrie en stagger-timings naar herbruikbare principes, React+Motion recepten en vanilla CSS/JS-equivalenten.

## Wanneer dit gebruiken

- Een knop met hover/press-microstate nodig (icon-swap, morph, pulse, magnetic, glare).
- Een set kaarten (project-kaarten, features, testimonials) die tot een arc, fan of stack transformeren op hover.
- Een carousel/coverflow/stack-scrubber voor cases of media.
- Een swipe-rail, stagger-reveal of hover-lift in vanilla HTML/CSS/JS omdat React+Motion niet beschikbaar is.

## Kernprincipes (framework-agnostisch)

Springkeuze (welke stiffness/damping, spring vs CSS-easing) en het AnimatePresence enter/exit-patroon staan niet hier: die horen bij `to-spring-or-not-to-spring` en `mastering-animate-presence`. Deze skill gaat over de geometrie die daaronder zit.

Universele press-feedback op alles wat klikbaar is: `whileHover={{ scale: 1.02 }}`, `whileTap={{ scale: 0.96 }}` (CSS: `:hover { scale: 1.02 }`, `:active { scale: 0.96 }`, transition 150ms).

**Arc/fan-geometrie** (kaarten): elke kaart krijgt een `dist = index - centerIndex`. Dan:
- `rotate = dist * (maxAngle / centerIndex)`
- `x = dist * (maxGap / centerIndex)`
- `y` = trapsgewijs per `|dist|`-tier (kleinste dist het hoogst, grootste dist het laagst, of omgekeerd afhankelijk van layout)
- `z-index = totalCards - |dist|` (middelste kaart altijd bovenop)
- Getransformeerd punt (`originX/originY`) bepaalt of het een fan (origin onderaan-midden of onderaan-hoek) of parallelle spread (geen origin-verschuiving) is.

Volledige numerieke tabel met alle 13 layouts (arc-5, arc-7, long-arc-5, linear-spread, corner-fan, stamp-arc, cascade-stagger, scatter-spread, wheel-fan, carousel, cover-flow, time-machine): `references/card-layouts.md`.

## React + Motion

Kant-en-klare, ingekorte snippets voor AnimatedButton-varianten en de 6 sterkste card-layouts (Arc5, CascadeStagger, CornerFan, Carousel, CoverFlow, TimeMachine), met exacte Motion-props: `references/react-motion.md`.

Package: `motion/react` (Motion, voorheen Framer Motion v12) of `framer-motion` (identieke API, oudere naam). Geen extra dependency nodig behalve `motion` en optioneel `lucide-react` voor iconen.

## Vanilla HTML/CSS/JS

Voor sites zonder React (Wix, statische HTML, WordPress): pure CSS-transitions/keyframes + minimale JS-equivalenten van hover-lift knop, arc-fan-kaarten-op-hover, en een scroll-snap swipe-rail als carousel-vervanger: `references/vanilla.md`.

## Regels bij toepassen

- Voor springkeuze en timing: `to-spring-or-not-to-spring`. Voor enter/exit: `mastering-animate-presence`.
- Middelste/actieve element blijft altijd los van de rest schaalbaar (`scale: 1.05` bij hover-center), dat is de "focus"-read van de hele library.
- `prefers-reduced-motion`: respecteren in vanilla-implementaties (`@media (prefers-reduced-motion: reduce) { transition: none !important }`); in Motion via `useReducedMotion()`.
- Geen dependencies installeren of buiten de skill-map schrijven, dit is een naslagwerk, geen framework.
