# Responsive Layout Breakpoints

Voya uses Tailwind CSS breakpoints defined in `tailwind.config.ts`.

| Breakpoint | Min width | Typical use |
|---|---|---|
| `xs` | 475px | Large phones |
| `sm` | 640px | Small tablets |
| `md` | 768px | Tablets — desktop nav appears |
| `lg` | 1024px | Laptops — side filter panel |
| `2xl` | 1536px | Large desktops |

## Certified range

Layouts are tested from **375px** (mobile) to **1536px** (desktop) in `test/responsive/layouts.test.tsx`.

## Key responsive patterns

- **Site header**: hamburger menu below `md`, full nav at `md+`
- **Search filters**: full-width stacked below `lg`, fixed side panel at `lg+`
- **Landing cards**: single column below `sm`, two columns at `sm+`
- **Assistant**: sidebar hidden below `md`, visible at `md+`

## Testing

```bash
pnpm --filter @travel/frontend test test/responsive
```
