# Quality Baseline — Platform Atlas

Date: 2026-11-02

This doc records the state of the quality tooling stack after initial setup.
Run the commands below to reproduce each gate.

## Commands

```bash
npm run lint          # ESLint: 0 errors, 0 warnings
npm run typecheck     # tsc --noEmit: clean
npm run validate      # catalog integrity: passing
npm run build         # typecheck + Vite build
npm run type-coverage # 99.84%
npx knip              # unused exports/types (to be reviewed)
npx prettier --check . # formatting baseline
npm run test          # 14 component tests passing
npm run e2e           # Playwright smoke tests (2 passed)
```

## Results

| Gate | Tool | Baseline | Target |
| --- | --- | --- | --- |
| Lint | ESLint + React + TS + a11y + import | 0 errors, 0 warnings | 0 errors |
| Typecheck | tsc --noEmit | Clean | Clean |
| Type coverage | type-coverage | 99.84% (7270/7281) | ≥ 95% |
| Catalog integrity | validate-catalog.ts | Passing | Passing |
| Build | tsc + Vite | 481.07 kB JS, 20.35 kB CSS | — |
| Format | Prettier | 290 files formatted | 0 unformatted |
| Dead code | Knip | Exports/types unused (to review) | 0 unused |
| Unit tests | Vitest | 14 component tests passing | 1+ smoke tests |
| E2E tests | Playwright | 2 smoke tests passing | 1+ smoke tests |

## Knip findings (to review)

- Unused exported types/interfaces in `src/catalog/types.ts`, `src/catalog/products.ts`, `src/map/layout.ts`, `src/roadmap.ts`
- Duplicate export: `MODEL_COLORS_LIGHT` and `MODEL_COLORS` in `src/catalog/icons.ts`

These are not necessarily bugs — they may be part of the public API. Review before removing.

## ESLint config

Created `eslint.config.js` (flat config) with:
- `@typescript-eslint/parser` + plugin
- `eslint-plugin-react` + `react-hooks` + `jsx-a11y` + `import`
- TypeScript resolver for import resolution

Warnings fixed:
- Added `clusterAt` and `domainAt` to click handler deps
- Wrapped `focusProduct`, `clusterAt`, `domainAt` in `useCallback`
- Fixed `target="_blank"` → `rel="noreferrer"` in RoadmapPage
- Added `role="presentation"` to backdrop divs
- Added `sr-only` text to scrim button

## Prettier config

Created `.prettierrc.json` and `.prettierignore`.
Formatted 290 files to establish baseline.

## Vitest config

Created `vitest.config.ts` with jsdom environment.
Tests: 14 component tests across App, ProductDetail, CategoryPanel, and DomainNav.

## Playwright config

Created `playwright.config.ts` with Chromium.
Smoke tests cover: toolbar brand rendering, canvas visibility, Roadmap/Suggest buttons.
Tests: 2 E2E smoke tests passing.

## Next steps

1. Review Knip findings and decide which exports to keep/remove.
2. Run Lighthouse on deployed URL and record scores.
