# Accessibility Test Gate

Automated axe-core accessibility scanning runs on all primary route pages.

## Running the gate

```bash
pnpm --filter @travel/frontend test test/accessibility
```

## Coverage

The `all-routes.test.tsx` suite imports each route page component and runs `jest-axe` with `toHaveNoViolations()`. Mock data is injected for API-dependent routes so pages render without a live backend.

## Routes covered

| Route group | Test file |
|---|---|
| Landing (`/`) | `all-routes.test.tsx` |
| Search (`/search`) | `all-routes.test.tsx` |
| Listings (`/listings/[id]`) | `all-routes.test.tsx` |
| Checkout (`/checkout`) | `all-routes.test.tsx` |
| Assistant (`/assistant`) | `all-routes.test.tsx` |
| Dashboard (`/dashboard`) | `all-routes.test.tsx` |
| Profile (`/profile`) | `all-routes.test.tsx` |
| Auth (`/auth/login`) | `all-routes.test.tsx`, `login.test.tsx` |

## Additional suites

- `focus.test.tsx` — keyboard focus trap, live regions, toast roles
- `contrast.test.ts` — WCAG 4.5:1 contrast on text/surface token pairs

## CI integration

Add the accessibility test step to your pipeline before merge. Any axe violation fails the build.
