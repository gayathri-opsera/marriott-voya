# Styling Guide

## Tailwind CSS Version

This project uses **Tailwind CSS v3.4.x** with the following toolchain:

| Package | Version | Purpose |
|---------|---------|---------|
| `tailwindcss` | ^3.4.17 | Utility-first CSS framework |
| `tailwindcss-animate` | ^1.0.7 | Overlay motion utilities (`animate-in`, `animate-out`, slide/fade) |
| `postcss` | ^8.x | CSS processing |
| `autoprefixer` | ^10.x | Vendor prefixing |

## Configuration

- **Config file**: `tailwind.config.ts` — uses v3 idiom (`theme.extend`, `plugins` array)
- **Global styles**: `app/globals.css` — uses v3 directives (`@tailwind base/components/utilities`)
- **Design tokens**: CSS custom properties in `:root` within `globals.css`, referenced by Tailwind color/radius keys in `tailwind.config.ts`
- **Token manifest**: `lib/tokens-manifest.ts` — canonical list of token names and CSS variables

## Design Tokens

Use semantic token classes instead of raw Tailwind palette utilities:

| Instead of | Use |
|------------|-----|
| `text-gray-500` | `text-text-muted` |
| `text-gray-900` | `text-text-primary` |
| `bg-white` | `bg-surface-default` |
| `bg-gray-50` | `bg-surface-subtle` |
| `text-blue-600` | `text-brand-primary` |
| `bg-blue-600` | `bg-brand-primary` |
| `text-red-500` | `text-danger` |
| `bg-green-100` | `bg-success-light` |
| `border-gray-200` | `border-border-default` |

## Migration Notes (WO-010)

Raw palette utilities (`gray-*`, `blue-*`, `red-*`, `green-*`, `yellow-*`, `slate-*`, `zinc-*`, `emerald-*`) have been replaced with semantic tokens across `components/` and `app/`. The `lint:tokens` script enforces this going forward.

Legacy aliases (`bg-brand-500`, `text-brand-600`) remain supported via Tailwind config mappings to CSS variables but prefer the semantic names above.

## Lint Gates

```bash
pnpm lint:tokens       # Fails on raw hex colors or palette utilities in components/app
pnpm lint:workspace    # Workspace + frontend styling/contract rules
```

## Overlay Animations

Modal and Drawer components use `tailwindcss-animate` utilities:

- `data-[state=open]:animate-in` / `data-[state=closed]:animate-out`
- `fade-in-0` / `fade-out-0` for overlays
- `slide-in-from-right` / `slide-out-to-right` for drawers
- `zoom-in-95` / `zoom-out-95` for modal content
