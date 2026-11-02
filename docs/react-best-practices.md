# React File Structure & Quality Audit

Status: draft for manual investigation

This doc maps the current `platform-atlas` source tree against accepted
React/TypeScript best practices, points out the gaps, and lists the exact
skills, tools, and checks to run before refactoring.

It is a **validation plan**, not a refactor. The goal is to give Frank a
concrete checklist to investigate, confirm, and then execute.

---

## 1. Current state

```
src/
├── App.tsx                  # View state machine + top-level wiring
├── main.tsx                 # React entry
├── styles.css               # All styles, one file
├── roadmap.ts               # Pure data: phases/milestones
├── vite-env.d.ts
│
├── catalog/                 # ✅ Pure data module, no React imports
│   ├── index.ts             # Barrel re-exports
│   ├── types.ts
│   ├── products.ts
│   ├── categories.ts
│   ├── domains.ts
│   ├── edges.ts
│   ├── icons.ts
│   ├── brand-icons.ts
│   ├── product-links.ts
│   ├── recommendations.ts
│   └── validate.ts
│
├── map/                     # ✅ Canvas renderer + layout, isolated
│   ├── layout.ts
│   └── render.ts
│
├── DomainNav.tsx
├── DomainPanel.tsx
├── CategoryPanel.tsx
├── ProductDetail.tsx
├── ProductGuidePage.tsx
├── RoadmapPage.tsx
└── Onboarding.tsx
```

### What is already good

- `catalog/` is a pure data boundary: no React, no DOM, no side effects.
- `map/` is the only place that touches the canvas.
- View is a 3-state machine (`map | roadmap | guide`).
- Strict TypeScript, explicit interfaces, no `any`.
- One component per file, PascalCase naming.

---

## 2. Gaps vs. modern React standards

### 2.1 File organization

| Standard                                                        | Current                      | Gap                                                                                                                       |
| --------------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Feature-based folders** (Bulletproof React / Vercel patterns) | Flat `src/` components       | Each feature (map, browse, roadmap, guide, onboarding) should own its components, styles, tests, and types.               |
| **Colocated tests**                                             | No test infra                | `Component.test.tsx` next to the component, or `__tests__/` inside the feature folder.                                    |
| **Colocated styles**                                            | One monolithic `styles.css`  | At minimum split by feature (`map/map.css`, `guide/guide.css`). CSS modules or plain CSS per feature are both acceptable. |
| **Component barrel index**                                      | None                         | `features/map/index.ts` re-exports the public surface of the feature. Keeps imports stable.                               |
| **Public API boundary**                                         | `App.tsx` imports everything | `features/` folders expose only what other features need.                                                                 |

### 2.2 Lint / format

| Standard                              | Current | Gap                                                   |
| ------------------------------------- | ------- | ----------------------------------------------------- |
| ESLint with React + TS + a11y plugins | None    | No static analysis beyond `tsc`.                      |
| Prettier                              | None    | No enforced formatting.                               |
| Import-order / no-circular-deps check | None    | `eslint-plugin-import` can catch cycles at lint time. |

### 2.3 Testing

| Standard                 | Current | Gap                                                                                                 |
| ------------------------ | ------- | --------------------------------------------------------------------------------------------------- |
| Unit / integration tests | None    | `npm run typecheck` + `npm run validate` are correctness gates, but they do not exercise behaviour. |
| Component tests          | None    | React Testing Library + Vitest is the standard pair for this stack.                                 |
| E2E                      | None    | Playwright or Cypress for the canvas interactions, search, panel open/close.                        |

### 2.4 CI / quality gates

| Standard            | Current | Gap                                                                        |
| ------------------- | ------- | -------------------------------------------------------------------------- |
| CI on push          | None    | `typecheck`, `validate`, `lint`, `test`, `build` should run on every push. |
| Bundle size budget  | None    | Visualizer + CI check prevents accidental bloat.                           |
| Accessibility audit | None    | `eslint-plugin-jsx-a11y` + axe in E2E.                                     |

---

## 3. Skills to investigate and validate

These are existing Hermes skills. Load each one and read the full doc before
deciding what to adopt.

| Skill                         | Why it matters                                                      | What to validate                                                                                      |
| ----------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `vercel-react-best-practices` | Vercel's official React/Next.js performance and structure guidance. | File colocation rules, server/client boundaries, bundle-splitting advice.                             |
| `vercel-composition-patterns` | Composition patterns that scale.                                    | Whether the current detail/panel/guide hierarchy should use compound components or render props.      |
| `frontend-composition`        | Lifted state, prop-forwarding, context scope.                       | Whether the current `App.tsx` prop-drilling to panels is still acceptable or should use context.      |
| `ui-design-patterns`          | CSS design systems.                                                 | Whether the single `styles.css` is still defensible or should migrate to CSS modules / design tokens. |
| `web-design-guidelines`       | Web Interface Guidelines compliance.                                | Accessibility, keyboard nav, focus management in panels/modals.                                       |
| `plan`                        | Bite-sized implementation plans.                                    | Use to draft the refactor plan once gaps are confirmed.                                               |
| `project-gap-audit`           | Audit current state against target.                                 | Run as the structured gap-analysis step.                                                              |

---

## 4. Tools to install and run for quality validation

### 4.1 Static analysis

| Tool                                                                                                                                        | Install                  | What it validates                                             |
| ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | ------------------------------------------------------------- |
| **ESLint** + `@typescript-eslint` + `eslint-plugin-react` + `eslint-plugin-react-hooks` + `eslint-plugin-jsx-a11y` + `eslint-plugin-import` | `npm i -D eslint ...`    | TS correctness, React rules, hooks deps, a11y, import cycles. |
| **Prettier**                                                                                                                                | `npm i -D prettier`      | Formatting consistency.                                       |
| **Type-coverage**                                                                                                                           | `npm i -D type-coverage` | % of code with explicit types. Target: >= 95%.                |
| **Knip**                                                                                                                                    | `npm i -D knip`          | Unused files, exports, dependencies.                          |
| **Depcheck**                                                                                                                                | `npm i -D depcheck`      | Unused dependencies.                                          |

### 4.2 Testing

| Tool                                                                          | Install                                      | What it validates                                   |
| ----------------------------------------------------------------------------- | -------------------------------------------- | --------------------------------------------------- |
| **Vitest** + `@testing-library/react` + `@testing-library/jest-dom` + `jsdom` | `npm i -D vitest @testing-library/react ...` | Unit and component tests.                           |
| **Playwright** or **Cypress**                                                 | `npm i -D @playwright/test`                  | E2E: canvas zoom, panel open, search, theme toggle. |

### 4.3 Bundle / performance

| Tool                                            | Install                 | What it validates                                            |
| ----------------------------------------------- | ----------------------- | ------------------------------------------------------------ |
| **rollup-plugin-visualizer** (already via Vite) | Add to `vite.config.ts` | Bundle composition, size, duplicates.                        |
| **Lighthouse** (CI mode)                        | `npm i -D lighthouse`   | Performance, a11y, best-practices score on the deployed URL. |
| **axe-core** + `jest-axe` or Playwright axe     | `npm i -D axe-core`     | Automated a11y violations in tests.                          |

### 4.4 Type-level checks

| Tool                             | What it validates             |
| -------------------------------- | ----------------------------- |
| `tsc --noEmit` (already present) | Type correctness.             |
| `tsc --noEmit --declaration`     | Declaration emit cleanliness. |

---

## 5. Manual validation checklist

Run these in order. Do not skip ahead to refactoring until the baseline is
documented.

### 5.1 Baseline audit

- [ ] Run `npm run build`. Record bundle size (`dist/assets/*.js`).
- [ ] Run `tsc --noEmit`. Record error count.
- [ ] Run `npm run validate`. Record catalog integrity status.
- [ ] Run `git ls-files | wc -l` and `cloc src/` (if available) for LOC baseline.
- [ ] Open `dist/` in a browser and run Lighthouse. Record scores.

### 5.2 Structure review

- [ ] Read `vercel-react-best-practices` skill. Note file-colocation advice.
- [ ] Read `vercel-composition-patterns` skill. Note whether `ProductDetail` +
      `CategoryPanel` + `DomainPanel` would benefit from compound components.
- [ ] Read `frontend-composition` skill. Note whether the prop chains from
      `App.tsx` → panels are still acceptable or need context.
- [ ] Decide on target structure:
  - Option A: **Feature folders** — `src/features/map/`, `src/features/browse/`,
    `src/features/roadmap/`, `src/features/guide/`.
  - Option B: **Keep flat + split CSS** — components stay in `src/`, styles move
    to `src/features/*.css`.
  - Option C: **Atomic Design** — `atoms/`, `molecules/`, `organisms/`, `templates/`.
- [ ] Document the chosen option and why in `docs/design.md`.

### 5.3 Tooling setup

- [ ] Install ESLint + plugins. Run `npx eslint src/ --ext .ts,.tsx`. Record
      error count.
- [ ] Install Prettier. Run `npx prettier --check src/`. Record unformatted files.
- [ ] Install type-coverage. Run `npx type-coverage`. Record %.
- [ ] Install Knip. Run `npx knip`. Record unused files/exports.
- [ ] Install Vitest + RTL. Create one smoke test (`App.tsx` renders) and run it.
- [ ] Install Playwright. Create one smoke test (toolbar visible, map canvas
      present). Run it against `npm run preview`.

### 5.4 Refactor gate

Only after 5.1–5.3 are complete:

- [ ] Write the refactor plan in `docs/` or a GitHub issue.
- [ ] Break the plan into atomic commits (one concern per commit).
- [ ] Refactor one feature folder at a time.
- [ ] After each commit: `typecheck`, `lint`, `test`, `build`, `validate` all
      pass.
- [ ] Run Lighthouse after each major structural change.

---

## 6. Recommended reading order

1. `docs/CONTRIBUTING.md` — current conventions.
2. `docs/design.md` — why the app is built this way.
3. Skills: `vercel-react-best-practices`, `frontend-composition`, `ui-design-patterns`.
4. This doc.
5. Skills: `plan`, `project-gap-audit` — when you are ready to draft the refactor.
