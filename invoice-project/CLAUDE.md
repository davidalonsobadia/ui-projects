# invoice-project

> This file describes `invoice-project/` only. The git repo (`ui-projects`) is a
> monorepo that also contains `my-dashboard/`, an unrelated project — every path
> below is relative to this directory, which is `invoice-project/`'s own root.

Invoice generator for Koalvia. Lets you fill in an hourly-rate or a
services-based invoice, prints/exports it as a clean A4 PDF, and remembers
your company data and invoice numbering between visits.

## Stack

- **Create React App** (`react-scripts`), React 19, plain JS (no TypeScript).
- **Tailwind CSS** + small shadcn-style UI primitives (`@radix-ui/react-slot`,
  `class-variance-authority`, `clsx`, `tailwind-merge`) under `src/components/ui/`.
- **Single package at repo root** — there is no `frontend/`/`backend/` split.
  Everything lives under `src/`.
- No backend yet. Data (company settings, last invoice number) is persisted
  client-side only, via `src/hooks/useLocalStorage.js`. This is the known
  limitation the login + database work (see below) exists to fix.

## Commands (run from repo root)

- `npm start` — dev server.
- `npm test -- --watchAll=false` — run the Jest/Testing Library suite once
  (use `--watchAll=false` in CI/non-interactive runs; plain `npm test` is fine
  interactively).
- `npm run build` — production build (CRA's built-in `eslint-config-react-app`
  runs as part of this; there is no separate `lint` script).

There is no `frontend/` or `backend/` working directory to `cd` into — all
npm commands run from the repo root.

## Structure

```
src/
  App.js                 thin view-switcher (home / hourly / services), no router
  components/
    HomeScreen.js         landing screen, picks invoice type
    HourlyInvoice.js       hourly-rate invoice form + print layout
    ServicesInvoice.js     line-item services invoice form + print layout
    CompanySettingsPanel.js  edit/display the issuing company's data
    ui/                   small shared primitives (e.g. card.js), shadcn-style
  hooks/
    useLocalStorage.js     the only persistence mechanism today
  lib/
    utils.js               `cn()` class-merge helper + invoice-numbering logic
                            (`getNextInvoiceNumber`/`formatInvoiceNumber`:
                            year + zero-padded counter, e.g. `2026-0007`)
```

## Conventions

- Function components, hooks-based state, no class components.
- Every source file under `src/` has a sibling `*.test.js` in the same folder
  (e.g. `HourlyInvoice.js` + `HourlyInvoice.test.js`). Add/update that sibling
  test file for any behavior you change — do not create a separate `__tests__/`
  tree.
- Styling is Tailwind utility classes plus a few inline styles already present
  in the invoice print layouts (kept inline because they target `@media print`
  pixel-perfect A4 output) — match whichever pattern the surrounding code in
  that file already uses.
- Money is formatted with the local `formatEUR` helper pattern already used in
  `HourlyInvoice.js` (thousands dot, comma decimals, `€` prefix) — reuse it
  rather than inventing another formatter.
- Invoice numbering (`getNextInvoiceNumber`) resets the counter every calendar
  year and must stay a single source of truth — do not duplicate this logic
  in a component.
- Everything user-facing (labels, screens) is in Spanish; that's intentional
  and should stay that way. Code identifiers, comments, commit messages, PRs,
  and agent output are in English per the agent instructions below.

## Where design/planning docs live

This repo already has a human-driven planning convention (via the
`superpowers` Claude Code skill) that predates the automated agent pipeline:

- `docs/superpowers/specs/<date>-<feature>-design.md` — design spec.
- `docs/superpowers/plans/<date>-<feature>.md` — implementation plan.

Skim the most recent ones before planning new work in an area they cover;
match their level of detail if you add new ones.

## In-flight initiative: login + database (Firebase)

The project is moving from "all state in `localStorage`" to a real backend:
**Firebase** — Firebase Authentication for login, Firestore for clients,
invoices, and invoice numbering (so numbering is correct across devices/users
instead of per-browser). This is a Backend-as-a-Service choice specifically
to avoid standing up and operating a custom server. Until this lands:

- Do not invent a custom backend (no Express/FastAPI/etc.) — the intended
  direction is Firebase.
- Treat any task that depends on auth/shared data as blocked on this
  initiative unless the issue says otherwise.

## Autonomous agent pipeline

This repo uses a Planner → Implementer → Reviewer GitHub Actions pipeline
(see `.claude/agents/*.md` and `.github/workflows/agent-*.yml`). Read the
relevant agent file for your role's exact rules before acting.
