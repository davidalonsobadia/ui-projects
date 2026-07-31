# Professional PDF Layout & Default Company Data — Design Spec
Date: 2026-04-25

## Overview

Two improvements to the invoice app:

1. **Pre-fill company data** — seed `localStorage` with Koalvia's details so the app is ready to use on first open, without requiring the user to fill in their own info manually.
2. **Professional PDF layout** — replace the form-like print view with a clean, minimal/modern invoice layout (Style B). The edit screen is unchanged; only the printed/PDF output is redesigned.

---

## Change 1: Pre-fill Company Data

**File:** `src/components/CompanySettingsPanel.js`

Replace the `EMPTY` default object with:

```js
const KOALVIA_DEFAULT = {
  nombre: 'Koalvia Technologies SL',
  nif: 'B26886952',
  direccion: 'c/ Arbúcies 17. 08173 Sant Cugat del Vallès. Barcelona',
  email: 'david.alonso@koalvia.com',
  telefono: ''
};
```

`useLocalStorage('company_settings', KOALVIA_DEFAULT)` only applies the default when no value is stored. Users who previously saved data are unaffected.

The panel opens in **view mode** on first load (because `nombre` is non-empty), showing the pre-filled data immediately.

---

## Change 2: Professional PDF Layout

### Approach

Both `HourlyInvoice.js` and `ServicesInvoice.js` use the same technique:

- Wrap the existing edit UI in `<div className="print:hidden">` (no change to edit experience)
- Add a sibling `<div className="hidden print:block">` containing the professional print-only markup
- The print div reads from the exact same React state — no data duplication, no logic changes

### Print Layout Structure (Style B — Minimal/Modern)

```
┌─────────────────────────────────────────────────────────────┐
│  Koalvia Technologies SL          FACTURA                   │
│  c/ Arbúcies 17, Sant Cugat...    Nº 2026-0001              │
│  B26886952 · email                Fecha: 25/04/2026         │
│  ─────────────────────────────────────────── (2px accent)   │
│                                                             │
│  Facturado a:                                               │
│  Cliente S.A. · NIF: A87654321                              │
│  Calle del Cliente 5, Barcelona                             │
│                                                             │
│  CONCEPTO / DESCRIPCIÓN                       IMPORTE       │
│  ─────────────────────────────────────────────────────      │
│  Diseño web                                                 │
│  Landing page y sistema de diseño         € 1.200,00        │
│                                                             │
│                          Base imponible   € 1.200,00        │
│                              IVA (21%)   €   252,00         │
│                          ════════════════════════════       │
│                                 TOTAL    € 1.452,00         │
│                                                             │
│  Por favor, realizar transferencia a IBAN: ES00 ...         │
└─────────────────────────────────────────────────────────────┘
```

### Visual Details

- **Header:** Two-column flex. Left: company name (bold, large) + address + NIF·email (small, muted). Right: "FACTURA" (bold, navy, letter-spaced) + invoice number + date.
- **Divider:** 2px solid navy line (`#1e3a5f`) separating header from body.
- **"Facturado a" section:** Small uppercase label, client name bold, NIF + address in muted text. No border/box.
- **Items table:** No filled header background. Column headers are small uppercase muted labels (`DESCRIPCIÓN`, `IMPORTE`). Each row: concept name bold, description below in muted text, price right-aligned.
- **Totals:** Right-aligned. Base and IVA rows in muted text. TOTAL row: 2px top border (navy), bold, larger font.
- **Payment comment:** Small muted text at the bottom, only shown if non-empty.
- **No borders, no background panels** — white page throughout.
- **Font:** Inherits system sans-serif (no external fonts needed).
- **Color palette:** `#1e3a5f` (navy accent), `#1e293b` (near-black text), `#64748b` (muted), `#94a3b8` (labels).

### HourlyInvoice print differences

The hourly invoice has a work detail table (date / task / description / hours) instead of the services line items. The print layout is identical in structure but the items section shows:

- Columns: Fecha | Tarea | Descripción | Horas
- Summary section below: task hours breakdown + hourly rate (€40) + total amount

The HourlyInvoice does **not** show IVA (existing behaviour preserved — hourly invoices don't include IVA in the current design).

### Scope

- `src/components/CompanySettingsPanel.js` — default data change only
- `src/components/ServicesInvoice.js` — add print layout div, adjust `@media print` styles
- `src/components/HourlyInvoice.js` — add print layout div, adjust `@media print` styles
- No new files, no new dependencies

---

## What Does NOT Change

- Edit screen UI for both invoice types — completely unchanged
- All existing state, logic, and localStorage keys
- `useLocalStorage` hook, `utils.js`, `HomeScreen`, `App.js`
- Print styles already in place (`@page`, page-break rules) — extended, not replaced
