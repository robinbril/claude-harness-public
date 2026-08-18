# React + Motion recepten

`npm i motion lucide-react` (of `framer-motion`, identieke API onder een oudere naam). Import: `import { motion, AnimatePresence } from 'motion/react'`.

## AnimatedButton varianten

Drie representatieve interactionTypes uit de bron, de rest (pulse, rotate, shake, ring, glare, magnetic, expand-ring, text-reveal, focus-blur) volgt dezelfde spring-tabel uit SKILL.md, zie `src/components/AnimatedButton.tsx` in de bron voor de volledige switch als je een exotischer type nodig hebt.

### Slide-arrow (icon links wisselt naar icon rechts bij hover)
```tsx
function SlideArrowButton({ label, Icon1, Icon2 }: { label: string; Icon1: React.ElementType; Icon2: React.ElementType }) {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <motion.button
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      className="relative flex items-center justify-center text-white h-9 px-6 rounded-[40px] bg-white/[0.04] hover:bg-white/[0.06] border border-white/5"
    >
      <AnimatePresence mode="popLayout">
        {!isHovered && (
          <motion.div key="icon1" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
            transition={{ type: "spring", stiffness: 600, damping: 25 }} className="flex items-center mr-2.5">
            <Icon1 className="w-4 h-4" />
          </motion.div>
        )}
      </AnimatePresence>
      <span className="font-medium text-[13px]">{label}</span>
      <AnimatePresence mode="popLayout">
        {isHovered && (
          <motion.div key="icon2" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
            transition={{ type: "spring", stiffness: 600, damping: 25 }} className="flex items-center ml-2.5">
            <Icon2 className="w-4 h-4" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
```

### Morph (icon1 fade+scale naar icon2, bv. copy -> check)
```tsx
function MorphButton({ label, Icon1, Icon2 }: { label: string; Icon1: React.ElementType; Icon2: React.ElementType }) {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <motion.button
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}
      className="relative flex items-center justify-center text-white h-9 px-6 rounded-[40px] bg-white/[0.04] hover:bg-white/[0.06] border border-white/5"
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        <AnimatePresence mode="popLayout" initial={false}>
          {!isHovered ? (
            <motion.div key="icon1" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", stiffness: 600, damping: 25 }} className="absolute inset-0 flex items-center justify-center">
              <Icon1 className="w-4 h-4" />
            </motion.div>
          ) : (
            <motion.div key="icon2" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", stiffness: 600, damping: 25 }} className="absolute inset-0 flex items-center justify-center">
              <Icon2 className="w-4 h-4" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <span className="font-medium text-[13px] ml-2.5">{label}</span>
    </motion.button>
  );
}
```

### Glare (lichtstreep die diagonaal over de knop schuift bij hover)
```tsx
function GlareButton({ label, Icon }: { label: string; Icon: React.ElementType }) {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <motion.button
      onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}
      className="relative flex items-center justify-center text-white h-9 px-6 rounded-[40px] bg-white/[0.04] hover:bg-white/[0.06] border border-white/5 overflow-hidden"
    >
      <Icon className="w-4 h-4 mr-2.5" />
      <span className="font-medium text-[13px]">{label}</span>
      <motion.div
        animate={{ x: isHovered ? ['-150%', '150%'] : '-150%' }}
        transition={{ duration: 0.85, ease: "easeInOut", repeat: isHovered ? Infinity : 0, repeatDelay: 1 }}
        className="absolute top-0 bottom-0 w-[50px] skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
      />
    </motion.button>
  );
}
```

## Card layouts

Volledige geometrie in `card-layouts.md`. Twee representatieve implementaties: een hover-arc (statisch) en een gescrubde stack (interactief).

### Arc-5 (algemeen arc/fan-sjabloon, pas `angle/gap/yOffset` aan voor elke andere arc-variant uit de tabel)
```tsx
function CardArc5({ angle = 30, gap = 70, yOffset = 10 }: { angle?: number; gap?: number; yOffset?: number }) {
  const [isHovered, setIsHovered] = useState(false);
  const cards = [0, 1, 2, 3, 4];
  const center = 2;
  return (
    <div onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}
      className="relative w-32 h-44 flex items-center justify-center">
      {cards.map((i) => {
        const dist = i - center;
        const rotate = isHovered ? dist * (angle / center) : 0;
        const x = isHovered ? dist * (gap / center) : 0;
        let y = 0;
        if (isHovered) {
          if (Math.abs(dist) === 2) y = yOffset;
          else if (Math.abs(dist) === 1) y = -0.2 * yOffset;
          else y = -yOffset;
        }
        return (
          <motion.div key={i}
            animate={{ rotate, x, y, scale: isHovered ? (dist === 0 ? 1.05 : 1) : 1 }}
            transition={{ type: "spring", stiffness: 180, damping: 20, mass: 0.8 }}
            style={{ zIndex: 3 - Math.abs(dist), originX: 0.5, originY: 1 }}
            className="absolute inset-0 rounded-2xl shadow-[0_4px_10px_-2px_rgba(0,0,0,0.15)] border border-white/5 bg-neutral-800"
          />
        );
      })}
    </div>
  );
}
```

### CoverFlow (3D perspective carousel, geschikt voor project-kaarten met beeld + titel)
```tsx
function CardCoverFlow({ items }: { items: { src: string; title: string }[] }) {
  const [activeIndex, setActiveIndex] = useState(2);
  return (
    <div className="relative select-none" style={{ perspective: '1000px' }}>
      <div className="relative h-[140px] flex justify-center items-center [transform-style:preserve-3d]">
        {items.map((item, i) => {
          const offset = i - activeIndex;
          const absOffset = Math.abs(offset);
          const isActive = activeIndex === i;
          const isPast = i < activeIndex;
          return (
            <motion.div key={i} className="absolute w-20 aspect-[3/4] cursor-pointer"
              animate={{
                x: offset * 32,
                rotateY: isActive ? 0 : (isPast ? 38 : -38),
                z: isActive ? 50 : -absOffset * 50,
                scale: isActive ? 1.1 : 1 - absOffset * 0.08,
                opacity: absOffset > 2 ? 0 : 1 - absOffset * 0.25,
              }}
              transition={{ type: 'spring', stiffness: 200, damping: 25 }}
              style={{ zIndex: 100 - absOffset }}
              onClick={() => setActiveIndex(i)}
            >
              <img src={item.src} alt={item.title} className="w-full h-full object-cover rounded-xl shadow-2xl border border-white/10" />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
```

Voor Cascade Stagger, Corner Fan, Scatter Spread, Wheel Fan, Interactive Carousel en Time Machine: neem de geometrie uit `card-layouts.md` en zet die in exact hetzelfde `motion.div`-per-item skelet als hierboven (state `isHovered` of `activeIndex`, `animate` object met de formules, transition uit de spring-tabel). Het patroon is overal identiek, alleen de getallen verschillen.
