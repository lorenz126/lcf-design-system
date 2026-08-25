# flechtenmacher-font

Typography foundation for a personal design framework. SF Pro, systematised.

## What's here

- **`tokens/type.css`** — the artifact. An 11-step type ramp where each step
  couples size + line-height + weight + tracking as one bundle, plus weights,
  families, a tracking formula for off-ramp sizes, and tabular-numeral and
  measure utilities.
- **`specimen/type.html`** — a specimen page for judging the ramp on screen.
  Disposable scaffolding, not part of the system.

## Principles

1. **A type step is not a font-size.** Size, line-height, weight and tracking
   are not independently choosable in SF, so they travel together. Never set
   `font-size` alone.
2. **Hand-tuned, not modular.** Ratio-generated scales produce values like
   12.8px that land off the pixel grid and render soft. Every step is a whole
   number.
3. **Line-height ratio tightens as size grows** — 1.47 at body, 1.06 at
   display. A single global line-height always leaves headlines loose.
4. **Tracking follows SF's curve** — positive below 13px, zero at 13,
   increasingly negative above. `.t-auto` applies the fitted curve to any
   ad-hoc size.
5. **Four weights, not nine.** More than four makes hierarchy read as
   accidental.

## Fonts

No font files are shipped. `-apple-system` resolves to real SF Pro on Apple
devices, with Inter as the cross-platform fallback. Note that Apple's SF
license covers development for Apple platforms, not general webfont
redistribution — self-hosting SF for a public site falls outside it.

## Viewing the specimen

```
python3 -m http.server 8931
```

Then open `http://localhost:8931/specimen/type.html`.
