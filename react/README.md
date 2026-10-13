# LCF Design System — React

Components, tokens and a locale layer for internal tools. MIT.

```bash
pnpm add "github:lorenz126/lcf-design-system#v0.4.0&path:/react"
```

```tsx
import '@lcf/design/css'
import { LcfProvider } from '@lcf/design/components/LcfProvider'
import { Button } from '@lcf/design/components/Button'

<LcfProvider locale="de-CH">
  <Button color="primary">Offerte speichern</Button>
</LcfProvider>
```

- **Documentation:** `pnpm storybook` — Overview, Installation, Locale
  and format, Colors, and a page per component with its props.
- **For an agent in a consuming app:** [`CONSUMING.md`](CONSUMING.md).
- **For work on this library:** [`AGENTS.md`](AGENTS.md).
- **What is next:** [`ROADMAP.md`](ROADMAP.md).
- **Changes:** [`CHANGELOG.md`](CHANGELOG.md).

The Nuxt layer, `0.1.0`–`0.3.x`, lives at the repository root and its
tags stay installable.
