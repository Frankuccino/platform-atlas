# Quality Engineering Baseline

## What this is

Quality engineering is the set of practices, tooling, and discipline that keeps a codebase correct, consistent, and safe to change. In a frontend TypeScript/React project, it covers:

- Static analysis (TypeScript, ESLint)
- Formatting (Prettier)
- Dead-code detection (Knip)
- Type coverage measurement
- Unit tests (Vitest)
- End-to-end smoke tests (Playwright)
- Continuous integration (GitHub Actions)

This is not optional polish. It is the difference between “it works on my machine” and “we can ship at any time without fear.”

## Why it must be applied

1. Defect prevention — Lint and typecheck catch bugs before they reach production.
2. Change confidence — Tests give you a safety net for refactors.
3. Consistency — Prettier and ESLint remove style debates.
4. Onboarding — New contributors can run the same commands you run.
5. Deployment safety — CI ensures every push is validated the same way.

## How to learn it

- Week 1: Read the ESLint and TypeScript docs. Run `npm run lint` and `npm run typecheck` until they are muscle memory.
- Week 2: Write one Vitest test file for an existing component. Study React Testing Library queries.
- Week 3: Add Playwright. Record a user flow, assert on it.
- Week 4: Read your CI logs. Make CI fail intentionally, then fix it.

Do not skip steps. If a tool feels magical, read its config file until it does not.

## Time investment

Plan for **15–25%** of engineering time on quality work:

- Writing and updating tests
- Fixing lint/type errors
- Maintaining CI
- Reviewing dead-code reports

This is not waste. It is an investment. Teams that skip it spend more time debugging production incidents.

## Impact on future work

- Refactors become low-risk instead of high-risk.
- PR reviews focus on logic, not formatting.
- Onboarding new engineers is faster.
- Production incidents shrink because defects are caught earlier in the stack.
- You can say “ship it” and mean it.

## The workflow every engineer should know

1. Make a change.
2. Run `npm run lint && npm run typecheck && npm run test` locally.
3. Push.
4. Let CI verify the same checks in a clean environment.
5. If CI fails, fix it before merging.

This loop should be automatic. If it is not automatic, automate it.

## Our current baseline

| Gate | Command | Purpose |
| --- | --- | --- |
| Lint | `npm run lint` | ESLint: errors, warnings, a11y hints |
| Typecheck | `npm run typecheck` | TypeScript: type safety |
| Type coverage | `npx type-coverage` | Measure how much of the code is typed |
| Format | `npx prettier --check .` | Consistent formatting |
| Dead code | `npx knip` | Unused exports, files, types |
| Catalog integrity | `npm run validate` | Data shape checks |
| Build | `npm run build` | Vite bundle sanity |
| Unit tests | `npm run test` | Vitest component tests |
| E2E smoke | `npm run e2e` | Playwright browser tests |
| CI | `.github/workflows/ci.yml` | All gates run on push/PR |

## Next steps

1. Review Knip findings quarterly.
2. Add Playwright coverage for critical user journeys.
3. Run Lighthouse on production and record scores.
4. Make CI post preview comments on pull requests.
