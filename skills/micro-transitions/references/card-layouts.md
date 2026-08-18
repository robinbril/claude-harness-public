# Card-layout geometrie (Amicro, alle 13 varianten)

Basis-canvas in de bron: `w-[8rem] h-[11rem]` (128x176px), 5 kaarten tenzij anders vermeld, container heeft `onMouseEnter/onMouseLeave` -> `isHovered` state, alle kaarten liggen op `absolute inset-0` gestapeld. Rust-toestand (niet hovered) = alles op `x:0 y:0 rotate:0`, tenzij vermeld. Spring is overal `stiffness 180, damping 20, mass 0.8` tenzij anders genoteerd.

## 1. Arc (5 kaarten) - `card-arc-5`
`angle=30, gap=70, yOffset=10`, center-index 2 (5 kaarten, indices 0-4).
- `dist = i - 2`
- `rotate = dist * (angle/2)` -> uiterste kaarten ±30°
- `x = dist * (gap/2)` -> uiterste kaarten ±70px
- `y`: `|dist|==2` -> `+yOffset`, `|dist|==1` -> `-0.2*yOffset`, `dist==0` -> `-yOffset`
- `scale`: center 1.05, rest 1
- `zIndex = 3 - |dist|`, `originX 0.5, originY 1` (waaiert vanaf de onderkant-midden, zoals speelkaarten in de hand)

## 2. Arc (7 kaarten) - `card-arc-7`
`angle=45, gap=110, yOffset=30`, center-index 3 (7 kaarten).
- Zelfde formule, maar `y`-tiers: `|dist|==3` -> `+yOffset`, `|dist|==2` -> `0.33*yOffset`, `|dist|==1` -> `-0.17*yOffset`, `dist==0` -> `-0.5*yOffset`
- `zIndex = 4 - |dist|`

## 3. Long Arc (5 kaarten) - `card-long-arc-5`
`angle=15, gap=140, yOffset=20` (lagere hoek, brede horizontale sweep). Zelfde structuur als Arc-5, `y`-tiers: `|dist|==2` -> `+yOffset`, `|dist|==1` -> `0.25*yOffset`, `dist==0` -> `-0.25*yOffset`.

## 4. Linear Spread - `card-linear-spread`
`gap=90`. Alleen `x = dist * (gap/2)`, geen rotate, geen y. Puur horizontaal uitschuiven, `zIndex = 3 - |dist|`.

## 5. Corner Fan - `card-corner-fan`
`angle=40`, 5 kaarten, geen center-concept: `offsetRatio = i / (total-1)`, `startAngle = -10`.
- `rotate = startAngle + offsetRatio * angle` (dus -10° tot +30° lineair over de reeks)
- Alleen middelste kaart (`i===2`) krijgt `scale 1.03`
- `zIndex = 5 - i`, `originX 0, originY 1` -> waaiert vanuit de linkeronderhoek, geen x/y-translatie nodig, puur rotatie om het anker

## 6. Stamp Arc (instelbaar) - `card-stamp-arc`
`arc=25, spread=180, yOffset=40`, 5 losse "postzegel"-kaarten (harde per-index waarden, niet formule-gebaseerd):
- i=0: `rotate -arc, x -spread, y +yOffset`
- i=1: `rotate -0.48*arc, x -0.5*spread, y 0.25*yOffset`
- i=2 (center): `rotate 0, x 0, y -0.25*yOffset`
- i=3: `rotate 0.48*arc, x 0.5*spread, y 0.25*yOffset`
- i=4: `rotate arc, x spread, y yOffset`
- Rand: `border-2 border-dashed` i.p.v. de standaard `border border-white/5`, refereert aan perforatie. Slider-props (`arc`, `spread`, `yOffset`) zijn bewust live instelbaar in de bron, dat patroon is het overnemen waard als je een instelbare demo bouwt.

## 7. Cascade Stagger Fan - `card-cascade-stagger`
Geen hover-toggle op nul: rust-state is al licht gestapeld (`y: dist*2`), pas op hover ontvouwt het diagonaal.
- Rust: `y = dist * 2, x 0, rotate 0`
- Hover: `y = dist * -28 - 14`, `x = dist * 14`, `rotate = dist * 6`
- `scale`: center 1.05, rest 0.98
- Spring: `stiffness 200, damping 22, mass 0.9` (net iets strakker dan de rest)
- `zIndex = 5 - |dist|`

## 8. Scatter Desk Deal - `card-scatter-spread`
Vaste offset-array (geen formule, "toevallig" gedealde hand):
```
[{x:-75,y:15,rotate:-14}, {x:-35,y:-15,rotate:-6}, {x:0,y:-30,rotate:2}, {x:35,y:-10,rotate:8}, {x:75,y:20,rotate:15}]
```
- `scale`: center (i===2) 1.05, rest 0.98
- `zIndex = 5 - |i-2|`

## 9. Wheel Radial Fan - `card-wheel-fan`
Geen `angle`-prop, hardcoded `rotate = dist * 18`.
- `y`-tiers: `|dist|==2` -> `-8`, `|dist|==1` -> `-22`, `dist==0` -> `-28` (kaarten waaieren omhoog rond een anker onder de container)
- `scale`: center 1.05, rest 0.98
- `originX 0.5, originY 1.1` (anker net onder de container, vandaar "wheel")
- `zIndex = 5 - |dist|`

## 10. Interactive Carousel - `card-carousel`
Horizontale slide-track, `activeIndex` state (default 2), `slideWidth = 160`.
- Track: `x = -activeIndex * slideWidth`, spring `{ type:'spring', bounce:0.1, duration:0.8 }` (bounce-syntax i.p.v. stiffness/damping)
- Per kaart: `diff = i - activeIndex`, `rotate = isHovered ? diff*20 : diff*5`, `scale = isActive ? 1.05 : (isHovered ? 0.65 : 0.8)`, `y = isHovered ? diff*24 : 0`
- Titel-label alleen zichtbaar op actieve kaart (`opacity/scale` CSS-transition, niet Motion)
- Navigatie: prev/next chevrons + dot-indicatoren (`w-4` actief vs `w-1` inactief, `transition-all duration-300`)

## 11. CoverFlow Carousel - `card-cover-flow`
3D perspective-track, `perspective: 1000px`, `[transform-style:preserve-3d]` op de rij.
- `offset = i - activeIndex`, `absOffset = |offset|`, `isPast = i < activeIndex`
- `x = offset * 32`
- `rotateY = isActive ? 0 : (isPast ? 38 : -38)` (klassieke coverflow-kantel)
- `z = isActive ? 50 : -absOffset * 50`
- `scale = isActive ? 1.1 : 1 - absOffset*0.08`
- `opacity = absOffset > 2 ? 0 : 1 - absOffset*0.25`
- Spring: `stiffness 200, damping 25`
- `zIndex = 100 - absOffset`

## 12. Time Machine Stack - `card-time-machine`
Apple-Photos-achtige dieptestapel met scrubber, `perspective: 800px`.
- `offset = i - activeIndex`, `isPast = i < activeIndex`
- `z = isPast ? 200 : -offset*60`, `y = isPast ? 300 : -offset*12` (verleden-kaarten schieten naar voren en vallen weg)
- `rotateX = isPast ? -20 : offset*2`
- `opacity = isPast ? 0 : 1 - |offset|*0.2`
- `scale = isPast ? 1.3 : 1`
- Spring: `stiffness 250, damping 25, mass 0.8`
- Scrubber (rechts, verticale lijst van main+sub-nodes): hoveren over een node zet `activeIndex`; geselecteerde/hovered lijn `scaleX 1.4/1.25` via spring `stiffness 400, damping 25`. Sub-lijnen (2 per interval) geven fijnmazige scrub-resolutie zonder evenveel hoofdkaarten.
- Optioneel: SVG `feGaussianBlur` + `feColorMatrix`-gooey filter op de kaartenstack voor zachte overlap (`filter: url(#gooeyFilter)`), puur decoratief, weglaatbaar.

## Mono-varianten
`card-carousel-mono`, `card-cover-flow-mono`, `card-time-machine-mono` zijn identiek aan 10-12, met een `isMonochrome` prop die de `<img>` vervangt door een effen `bg-neutral-400 dark:bg-neutral-800` blok met een cijfer erin. Handig als je nog geen beeldmateriaal hebt of een neutrale huisstijl wilt.
