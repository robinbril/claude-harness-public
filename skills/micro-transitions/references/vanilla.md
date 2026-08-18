# Vanilla HTML/CSS/JS vertaling

Geen Motion beschikbaar (Wix, statische HTML, WordPress). Zelfde spring-gevoel via cubic-bezier easings uit de SKILL.md-tabel, zelfde geometrie uit `card-layouts.md`.

## 1. Hover-lift knop (button-layout spring, 500/25)

```css
.btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 0 24px;
  height: 36px;
  border-radius: 40px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.05);
  color: #e3e3e3;
  cursor: pointer;
  transition: background-color 220ms cubic-bezier(0.22, 1, 0.36, 1),
              transform 150ms cubic-bezier(0.22, 1, 0.36, 1),
              padding 220ms cubic-bezier(0.22, 1, 0.36, 1);
}
.btn:hover { background: rgba(255,255,255,0.06); padding: 0 28px; transform: scale(1.02); }
.btn:active { transform: scale(0.96); }

@media (prefers-reduced-motion: reduce) {
  .btn { transition: none; }
}
```

Icon-swap bij hover (slide-arrow equivalent) met twee `<span>`s, geen JS nodig:
```css
.btn .icon-a, .btn .icon-b { transition: opacity 200ms cubic-bezier(0.34,1.56,0.64,1), transform 200ms cubic-bezier(0.34,1.56,0.64,1); }
.btn .icon-b { position: absolute; opacity: 0; transform: translateX(10px); }
.btn .icon-a { opacity: 1; transform: translateX(0); }
.btn:hover .icon-a { opacity: 0; transform: translateX(-10px); }
.btn:hover .icon-b { opacity: 1; transform: translateX(0); }
```

## 2. Arc-fan kaarten op hover (CardArc5 1:1, spring 180/20/0.8)

CSS-only met `nth-child`, geen JS. Container `w-32 h-44 (128x176px)`, 5 kaarten absoluut gestapeld.

```css
.arc-fan { position: relative; width: 128px; height: 176px; }
.arc-fan .card {
  position: absolute; inset: 0; border-radius: 16px;
  background: #262626; border: 1px solid rgba(255,255,255,0.05);
  box-shadow: 0 4px 10px -2px rgba(0,0,0,0.15);
  transform-origin: 50% 100%;
  transition: transform 400ms cubic-bezier(0.16, 1, 0.3, 1);
}
/* dist -2 .. +2, angle=30 gap=70 yOffset=10 (zelfde constanten als card-arc-5) */
.arc-fan:hover .card:nth-child(1) { transform: rotate(-30deg) translate(-70px, 10px); z-index: 1; }
.arc-fan:hover .card:nth-child(2) { transform: rotate(-15deg) translate(-35px, -2px); z-index: 2; }
.arc-fan:hover .card:nth-child(3) { transform: rotate(0deg)   translate(0, -10px) scale(1.05); z-index: 3; }
.arc-fan:hover .card:nth-child(4) { transform: rotate(15deg)  translate(35px, -2px); z-index: 2; }
.arc-fan:hover .card:nth-child(5) { transform: rotate(30deg)  translate(70px, 10px); z-index: 1; }
```

Voor een andere arc-variant: herbereken `rotate = dist * (angle/center)` en `translate-x = dist * (gap/center)` met de constanten uit `card-layouts.md`, en zet ze als vaste waarden per `nth-child` neer (CSS kan geen state-afhankelijke berekening doen, dus de formule wordt eenmalig uitgerekend).

## 3. Scroll-snap swipe-rail (carousel-vervanger)

Geen 3D-coverflow in pure CSS zonder JS-per-frame, maar een scroll-snap rail dekt de meeste use-cases (project-kaarten, cases) en werkt beter op mobiel dan een JS-carousel.

```html
<div class="rail" id="rail">
  <div class="rail-item"><img src="…" alt=""></div>
  <div class="rail-item"><img src="…" alt=""></div>
  <!-- … -->
</div>
<div class="dots" id="dots"></div>
```

```css
.rail {
  display: flex; gap: 16px; overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  padding: 0 40%; /* zodat het eerste/laatste item ook centreert */
}
.rail-item {
  flex: 0 0 60%; scroll-snap-align: center;
  transition: transform 400ms cubic-bezier(0.16, 1, 0.3, 1), opacity 400ms cubic-bezier(0.16, 1, 0.3, 1);
  transform: scale(0.85); opacity: 0.6;
}
.rail-item.is-active { transform: scale(1); opacity: 1; }
```

```js
const rail = document.getElementById('rail');
const items = [...rail.children];
const dotsEl = document.getElementById('dots');
items.forEach((_, i) => {
  const dot = document.createElement('button');
  dot.className = 'dot';
  dot.addEventListener('click', () => items[i].scrollIntoView({ behavior: 'smooth', inline: 'center' }));
  dotsEl.appendChild(dot);
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    const i = items.indexOf(entry.target);
    entry.target.classList.toggle('is-active', entry.intersectionRatio > 0.6);
    dotsEl.children[i]?.classList.toggle('is-active', entry.intersectionRatio > 0.6);
  });
}, { root: rail, threshold: [0, 0.6, 1] });
items.forEach((item) => observer.observe(item));
```

`IntersectionObserver` i.p.v. een `scroll`-listener: geen `requestAnimationFrame`-throttling nodig en werkt correct ook als de rail nog niet geverfd is (zie `browser-verification-balance`-les: rAF-gedreven scroll-handlers draaien niet in een verborgen/onzichtbare tab, IntersectionObserver wel).

## 4. Stagger-reveal (cascade-stagger equivalent, Web Animations API)

```js
const cards = document.querySelectorAll('.stagger-card');
const centerIndex = Math.floor(cards.length / 2);

cards.forEach((card, i) => {
  const dist = i - centerIndex;
  card.animate(
    [
      { transform: `translate(0, ${dist * 2}px) rotate(0deg)`, offset: 0 },
      { transform: `translate(${dist * 14}px, ${dist * -28 - 14}px) rotate(${dist * 6}deg)`, offset: 1 }
    ],
    {
      duration: 450,
      delay: Math.abs(dist) * 40, // stagger: verder van het midden = iets later
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)', // spring 200/22/0.9-gevoel
      fill: 'forwards'
    }
  );
});
```

Trigger dit `forEach`-blok op `mouseenter` van de container, en speel de omgekeerde keyframes (offset 0 en 1 verwisseld) af op `mouseleave`. Web Animations API geeft je `.pause()`/`.reverse()` zonder een losse animatiebibliotheek.
