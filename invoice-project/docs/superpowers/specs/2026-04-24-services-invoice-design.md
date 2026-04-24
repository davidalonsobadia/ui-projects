# Services Invoice — Design Spec
Date: 2026-04-24

## Overview

Add a second invoice type ("Factura de Servicios") to the existing invoice app, alongside the current hourly invoice. The app gets a home screen where the user picks which invoice type to create. Both invoice types are upgraded with company info, client info, and invoice numbering.

---

## App Structure

The app is split into focused components (no routing library):

```
src/
  App.js                    — thin shell, holds currentView state
  components/
    HomeScreen.js           — two-card home screen
    HourlyInvoice.js        — existing hourly invoice (moved from App.js)
    ServicesInvoice.js      — new services invoice
    CompanySettingsPanel.js — shared panel: displays/edits company info
  hooks/
    useLocalStorage.js      — generic hook: useState backed by localStorage
  components/ui/
    card.js                 — existing (unchanged)
```

**Navigation:** `App.js` holds a `currentView` state: `'home' | 'hourly' | 'services'`. `HomeScreen` renders two large cards; clicking one sets `currentView`. Each invoice has a "← Volver al inicio" back button that resets to `'home'`.

---

## Home Screen (`HomeScreen.js`)

Two large clickable cards side by side:
- **Factura por Horas** — date, hours, task, description (existing flow)
- **Factura de Servicios** — name, description, price per line item (new)

---

## Shared: Company Info (`CompanySettingsPanel.js`)

Both invoice types include this panel at the top. It reads from / writes to `localStorage` key `company_settings`.

**Fields saved:**
- Nombre / Empresa
- NIF/CIF
- Dirección
- Email
- Teléfono (optional)

**Behaviour:** Rendered in "view" mode by default (shows saved values). An "Editar" button toggles to edit mode with text inputs. On save, values persist to localStorage. On first use (no saved data), opens directly in edit mode.

---

## Shared: Invoice Numbering

Both invoice types show an invoice number field pre-filled with an auto-incremented value. The last-used number is stored in localStorage key `last_invoice_number` as an integer.

Format: `YYYY-NNNN` (e.g. `2026-0001`). Year prefix resets the counter when the year changes (compare stored year vs. current year on load).

The field is editable — the user can override it before printing. On print/PDF, the displayed value is saved back as the new last number.

---

## Hourly Invoice (`HourlyInvoice.js`)

Existing functionality preserved exactly. Additions:
- `CompanySettingsPanel` at the top
- Client section: Nombre/Empresa, NIF/CIF, Dirección (not persisted — entered per invoice)
- Invoice number field (auto-incremented, editable)
- Invoice date field (already exists, keep as-is)

---

## Services Invoice (`ServicesInvoice.js`)

### Header
- Back button (← Volver al inicio)
- `CompanySettingsPanel`
- Invoice number (auto-incremented, editable)
- Invoice date (today by default, editable)
- Due date (optional, editable)

### Client Section
Fields: Nombre/Empresa, NIF/CIF, Dirección. Not persisted.

### Line Items Table
Columns: **Nombre** | **Descripción** | **Precio (€)**

- Rows are added with "+ Añadir concepto"
- Each row has a delete (✕) button
- Inline editing: clicking a row's cell makes it editable (or rows start editable)
- Minimum 1 row enforced before print

### Totals
```
Base imponible:   sum of all prices
IVA (21%):        base × 0.21
TOTAL:            base + IVA
```
All formatted to 2 decimal places with `€` prefix.

### Payment Comment
Editable textarea, pre-filled with the IBAN text (same as existing invoice). Hidden in print if empty.

### Actions (print:hidden)
- **Imprimir / Guardar PDF** — triggers `window.print()`
- **Borrar todo** — clears line items and client fields, resets to fresh state

### Print Layout
- Company info, client info, invoice number/date at the top
- Line items table
- Totals block aligned right
- Payment comment at the bottom
- All edit controls and action buttons hidden (`print:hidden`)
- A4 page, 15mm margins (same `@media print` setup as existing invoice)

---

## Data Model

```js
// localStorage: 'company_settings'
{
  nombre: string,
  nif: string,
  direccion: string,
  email: string,
  telefono: string
}

// localStorage: 'last_invoice_number'
{ year: number, counter: number }

// ServicesInvoice local state
{
  invoiceNumber: string,
  invoiceDate: string,
  dueDate: string,
  client: { nombre: string, nif: string, direccion: string },
  items: [{ id: string, nombre: string, descripcion: string, precio: number }],
  comment: string
}
```

---

## What Does NOT Change

- `components/ui/card.js` — unchanged
- `src/lib/utils.js` — unchanged
- The core hourly invoice parsing logic — moved to `HourlyInvoice.js` verbatim
- Print styles — reused/extended, not replaced
- No new npm dependencies
