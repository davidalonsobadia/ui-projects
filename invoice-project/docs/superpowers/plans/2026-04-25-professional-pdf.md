# Professional PDF Layout & Default Company Data — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pre-fill Koalvia's company data as the default and replace the form-like print output with a clean, minimal/modern professional invoice layout for both invoice types.

**Architecture:** Two isolated changes. (1) `CompanySettingsPanel` replaces its empty default with Koalvia's data — `useLocalStorage` handles the rest. (2) Both invoice components get a `hidden print:block` sibling div that renders a professional print layout reading from the same React state, while the existing edit UI is wrapped in `print:hidden`.

**Tech Stack:** React 19, Tailwind CSS 3, React Testing Library, Jest (CRA / react-scripts)

---

## File Map

| Action | Path | Change |
|--------|------|--------|
| Modify | `src/components/CompanySettingsPanel.js` | Replace `EMPTY` default with Koalvia data |
| Modify | `src/components/CompanySettingsPanel.test.js` | Update test that checked empty default |
| Modify | `src/components/ServicesInvoice.js` | Wrap edit UI in `print:hidden`, add professional print div |
| Modify | `src/components/HourlyInvoice.js` | Wrap edit UI in `print:hidden`, add professional print div |

---

## Task 1: Pre-fill Koalvia company data

**Files:**
- Modify: `src/components/CompanySettingsPanel.js`
- Modify: `src/components/CompanySettingsPanel.test.js`

- [ ] **Step 1: Update the test to reflect new default**

In `src/components/CompanySettingsPanel.test.js`, the first test currently checks that the panel opens in edit mode when nothing is saved. With Koalvia as default, first load should show **view mode** (not edit) because `nombre` is pre-filled. Update the test:

```js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CompanySettingsPanel from './CompanySettingsPanel';

beforeEach(() => { localStorage.clear(); });

test('opens in view mode with Koalvia defaults on first load', () => {
  render(<CompanySettingsPanel />);
  expect(screen.getByText('Koalvia Technologies SL')).toBeInTheDocument();
  expect(screen.queryByLabelText(/Nombre \/ Empresa/i)).not.toBeInTheDocument();
});

test('shows saved company name in view mode', () => {
  localStorage.setItem('company_settings', JSON.stringify({
    nombre: 'Acme SL', nif: 'B123', direccion: 'Calle 1', email: 'a@b.com', telefono: ''
  }));
  render(<CompanySettingsPanel />);
  expect(screen.getByText('Acme SL')).toBeInTheDocument();
});

test('clicking Editar switches to edit mode', () => {
  render(<CompanySettingsPanel />);
  fireEvent.click(screen.getByText('Editar'));
  expect(screen.getByLabelText(/Nombre \/ Empresa/i)).toBeInTheDocument();
});

test('saving in edit mode updates displayed values', () => {
  render(<CompanySettingsPanel />);
  fireEvent.click(screen.getByText('Editar'));
  fireEvent.change(screen.getByLabelText(/Nombre \/ Empresa/i), { target: { value: 'Mi Empresa' } });
  fireEvent.click(screen.getByText('Guardar'));
  expect(screen.getByText('Mi Empresa')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/davidalonso/SoftwareProjects/ui-projects/invoice-project && CI=true npm test -- --watchAll=false --testPathPattern=CompanySettingsPanel
```

Expected: FAIL — first test fails because panel still opens in edit mode.

- [ ] **Step 3: Update `CompanySettingsPanel.js`**

Replace the `EMPTY` constant and its usage with `KOALVIA_DEFAULT`:

```js
import React, { useState } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';

const KOALVIA_DEFAULT = {
  nombre: 'Koalvia Technologies SL',
  nif: 'B26886952',
  direccion: 'c/ Arbúcies 17. 08173 Sant Cugat del Vallès. Barcelona',
  email: 'david.alonso@koalvia.com',
  telefono: '',
};

const FIELDS = [
  { key: 'nombre', label: 'Nombre / Empresa', span: false },
  { key: 'nif', label: 'NIF/CIF', span: false },
  { key: 'direccion', label: 'Dirección', span: true },
  { key: 'email', label: 'Email', span: false },
  { key: 'telefono', label: 'Teléfono (opcional)', span: false },
];

const CompanySettingsPanel = () => {
  const [company, setCompany] = useLocalStorage('company_settings', KOALVIA_DEFAULT);
  const [editing, setEditing] = useState(!company.nombre);
  const [draft, setDraft] = useState(company);

  const handleSave = () => {
    setCompany(draft);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="border border-blue-200 rounded-lg p-4 mb-4 bg-blue-50">
        <div className="font-semibold text-xs text-slate-500 uppercase tracking-wide mb-3">
          Mis datos
        </div>
        <div className="grid grid-cols-2 gap-3">
          {FIELDS.map(({ key, label, span }) => (
            <div key={key} className={span ? 'col-span-2' : ''}>
              <label htmlFor={`company-${key}`} className="text-xs text-slate-400 block mb-1">
                {label}
              </label>
              <input
                id={`company-${key}`}
                value={draft[key]}
                onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
          ))}
        </div>
        <button
          onClick={handleSave}
          className="mt-3 bg-blue-500 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-600"
        >
          Guardar
        </button>
      </div>
    );
  }

  return (
    <div className="border border-slate-200 rounded-lg p-4 mb-4 bg-slate-50">
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold text-xs text-slate-500 uppercase tracking-wide">
          Mis datos
        </span>
        <button
          onClick={() => { setDraft(company); setEditing(true); }}
          className="text-xs text-blue-500 hover:text-blue-700 print:hidden"
        >
          Editar
        </button>
      </div>
      <div className="grid grid-cols-2 gap-1.5 text-sm">
        <div><span className="text-slate-400 text-xs">Empresa</span><br />{company.nombre}</div>
        <div><span className="text-slate-400 text-xs">NIF/CIF</span><br />{company.nif}</div>
        <div className="col-span-2">
          <span className="text-slate-400 text-xs">Dirección</span><br />{company.direccion}
        </div>
        <div><span className="text-slate-400 text-xs">Email</span><br />{company.email}</div>
        {company.telefono && (
          <div><span className="text-slate-400 text-xs">Teléfono</span><br />{company.telefono}</div>
        )}
      </div>
    </div>
  );
};

export default CompanySettingsPanel;
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /Users/davidalonso/SoftwareProjects/ui-projects/invoice-project && CI=true npm test -- --watchAll=false --testPathPattern=CompanySettingsPanel
```

Expected: PASS — 4 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/components/CompanySettingsPanel.js src/components/CompanySettingsPanel.test.js
git commit -m "feat: pre-fill Koalvia company data as default"
```

---

## Task 2: Professional PDF layout for ServicesInvoice

**Files:**
- Modify: `src/components/ServicesInvoice.js`

The strategy: wrap the existing `<div id="invoice-content">` and action buttons in `<div className="print:hidden">`, then add a sibling `<div className="hidden print:block">` with the professional layout. The `formatEUR` helper and all state variables are shared.

- [ ] **Step 1: Write a print-layout snapshot test**

Add to `src/components/ServicesInvoice.test.js`:

```js
test('print layout contains company name and FACTURA heading', () => {
  localStorage.setItem('company_settings', JSON.stringify({
    nombre: 'Koalvia Technologies SL', nif: 'B26886952',
    direccion: 'c/ Arbúcies 17', email: 'david.alonso@koalvia.com', telefono: ''
  }));
  render(<ServicesInvoice onBack={() => {}} />);
  // The print-only div is in the DOM even though hidden on screen
  expect(screen.getByTestId('print-layout')).toBeInTheDocument();
  expect(screen.getByTestId('print-company-name')).toHaveTextContent('Koalvia Technologies SL');
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/davidalonso/SoftwareProjects/ui-projects/invoice-project && CI=true npm test -- --watchAll=false --testPathPattern=ServicesInvoice
```

Expected: FAIL — `print-layout` testId not found.

- [ ] **Step 3: Replace `src/components/ServicesInvoice.js`**

```jsx
import React, { useState } from 'react';
import CompanySettingsPanel from './CompanySettingsPanel';
import useLocalStorage from '../hooks/useLocalStorage';
import { getNextInvoiceNumber, formatInvoiceNumber } from '../lib/utils';

const formatEUR = (num) => {
  const parts = num.toFixed(2).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return parts.join(',');
};

const NAVY = '#1e3a5f';

const ServicesInvoice = ({ onBack }) => {
  const [lastInvoiceNumber, setLastInvoiceNumber] = useLocalStorage('last_invoice_number', null);
  const [company] = useLocalStorage('company_settings', {
    nombre: '', nif: '', direccion: '', email: '', telefono: ''
  });
  const nextNum = getNextInvoiceNumber(lastInvoiceNumber);

  const [invoiceNumber, setInvoiceNumber] = useState(formatInvoiceNumber(nextNum));
  const [invoiceDate, setInvoiceDate] = useState(new Date().toLocaleDateString('es-ES'));
  const [dueDate, setDueDate] = useState('');
  const [client, setClient] = useState({ nombre: '', nif: '', direccion: '' });
  const [items, setItems] = useState([{ id: '1', nombre: '', descripcion: '', precio: '' }]);
  const [comment, setComment] = useState(
    'Por favor, realizar transferencia a la cuenta IBAN: ES00 0000 0000 0000 0000 0000'
  );

  const addItem = () =>
    setItems(prev => [...prev, { id: Date.now().toString(), nombre: '', descripcion: '', precio: '' }]);

  const removeItem = (id) =>
    setItems(prev => prev.filter(item => item.id !== id));

  const updateItem = (id, field, value) =>
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));

  const base = items.reduce((sum, item) => sum + (parseFloat(item.precio) || 0), 0);
  const iva = base * 0.21;
  const total = base + iva;

  const handlePrint = () => {
    setLastInvoiceNumber(nextNum);
    window.print();
  };

  const handleClear = () => {
    setClient({ nombre: '', nif: '', direccion: '' });
    setItems([{ id: '1', nombre: '', descripcion: '', precio: '' }]);
    setDueDate('');
  };

  return (
    <div className="bg-white">

      {/* ── EDIT UI (screen only) ── */}
      <div className="print:hidden p-6">
        <div className="max-w-4xl mx-auto">
          <button onClick={onBack} className="text-blue-500 hover:text-blue-700 text-sm mb-4">
            ← Volver al inicio
          </button>

          <div className="flex gap-2 mb-4">
            <button
              onClick={handlePrint}
              disabled={items.every(i => !i.nombre)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-300"
            >
              Imprimir / Guardar PDF
            </button>
            <button onClick={handleClear} className="bg-red-100 text-red-600 px-4 py-2 rounded hover:bg-red-200">
              Borrar todo
            </button>
          </div>

          <p className="text-sm text-gray-500 mb-4">
            Para mejores resultados, seleccione "Guardar como PDF".
            <strong> Importante:</strong> Desactive "Encabezados y pies de página".
          </p>

          <header className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Factura</h1>
            <div className="flex gap-6 mt-2 text-gray-600 text-sm">
              <div>
                <label htmlFor="services-invoice-number" className="text-xs text-slate-400 block">Nº Factura</label>
                <input
                  id="services-invoice-number"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="border-b border-gray-300 focus:border-blue-500 outline-none bg-transparent text-sm"
                  style={{ width: '90px' }}
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block">Fecha</label>
                <input
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="border-b border-gray-300 focus:border-blue-500 outline-none bg-transparent text-sm"
                  style={{ width: '100px' }}
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block">Vencimiento (opcional)</label>
                <input
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  placeholder="dd/mm/aaaa"
                  className="border-b border-gray-300 focus:border-blue-500 outline-none bg-transparent text-sm"
                  style={{ width: '100px' }}
                />
              </div>
            </div>
          </header>

          <CompanySettingsPanel />

          <div className="border border-slate-200 rounded-lg p-4 mb-6">
            <div className="font-semibold text-xs text-slate-500 uppercase tracking-wide mb-3">Datos del cliente</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Nombre / Empresa</label>
                <input value={client.nombre} onChange={(e) => setClient({ ...client, nombre: e.target.value })} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">NIF/CIF</label>
                <input value={client.nif} onChange={(e) => setClient({ ...client, nif: e.target.value })} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-slate-400 block mb-1">Dirección</label>
                <input value={client.direccion} onChange={(e) => setClient({ ...client, direccion: e.target.value })} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" />
              </div>
            </div>
          </div>

          <div className="mb-6">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left w-1/4">Concepto</th>
                  <th className="border p-2 text-left">Descripción</th>
                  <th className="border p-2 text-right w-32">Precio (€)</th>
                  <th className="border p-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td className="border p-1">
                      <input value={item.nombre} onChange={(e) => updateItem(item.id, 'nombre', e.target.value)} placeholder="Concepto" className="w-full p-1 text-sm focus:outline-none" />
                    </td>
                    <td className="border p-1">
                      <input value={item.descripcion} onChange={(e) => updateItem(item.id, 'descripcion', e.target.value)} className="w-full p-1 text-sm focus:outline-none" />
                    </td>
                    <td className="border p-1">
                      <input type="number" value={item.precio} onChange={(e) => updateItem(item.id, 'precio', e.target.value)} placeholder="0.00" className="w-full p-1 text-sm text-right focus:outline-none" step="0.01" min="0" />
                    </td>
                    <td className="border p-1 text-center">
                      <button onClick={() => removeItem(item.id)} disabled={items.length === 1} className="text-red-500 hover:text-red-700 text-sm disabled:text-gray-300">✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={addItem} className="mt-2 text-blue-500 hover:text-blue-700 text-sm">
              + Añadir concepto
            </button>
          </div>

          <div className="flex justify-end mb-6">
            <table className="border-collapse" style={{ minWidth: '280px' }}>
              <tbody>
                <tr>
                  <td className="p-2 text-right text-gray-600 border">Base imponible</td>
                  <td className="p-2 text-right border w-32">€ {formatEUR(base)}</td>
                </tr>
                <tr>
                  <td className="p-2 text-right text-gray-600 border">IVA (21%)</td>
                  <td className="p-2 text-right border">€ {formatEUR(iva)}</td>
                </tr>
                <tr className="font-bold bg-gray-100">
                  <td className="p-2 text-right border border-t-2 border-t-gray-400">TOTAL</td>
                  <td className="p-2 text-right border border-t-2 border-t-gray-400 text-lg">€ {formatEUR(total)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className={`p-3 bg-gray-50 rounded border ${!comment.trim() ? 'hidden' : ''}`}>
            <label className="text-sm text-gray-600 block mb-1">Comentario (opcional):</label>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} className="w-full p-2 border rounded text-sm resize-none" rows={2} placeholder="Añadir comentario..." />
          </div>
        </div>
      </div>

      {/* ── PRINT LAYOUT (print only) ── */}
      <div data-testid="print-layout" className="hidden print:block" style={{ fontFamily: 'system-ui, sans-serif', color: '#1e293b', padding: '0' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <div>
            <div data-testid="print-company-name" style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.3px' }}>{company.nombre}</div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>{company.direccion}</div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>
              {company.nif}{company.email ? ` · ${company.email}` : ''}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '26px', fontWeight: '800', color: NAVY, letterSpacing: '2px' }}>FACTURA</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Nº {invoiceNumber}</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Fecha: {invoiceDate}</div>
            {dueDate && <div style={{ fontSize: '12px', color: '#64748b' }}>Vencimiento: {dueDate}</div>}
          </div>
        </div>

        {/* Accent divider */}
        <div style={{ borderTop: `2px solid ${NAVY}`, marginBottom: '20px' }} />

        {/* Client */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>Facturado a</div>
          <div style={{ fontSize: '14px', fontWeight: '600' }}>{client.nombre || '—'}</div>
          {(client.nif || client.direccion) && (
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              {[client.nif, client.direccion].filter(Boolean).join(' · ')}
            </div>
          )}
        </div>

        {/* Items table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid #e2e8f0` }}>
              <th style={{ padding: '6px 4px', textAlign: 'left', fontSize: '9px', color: '#94a3b8', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Descripción</th>
              <th style={{ padding: '6px 4px', textAlign: 'right', fontSize: '9px', color: '#94a3b8', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px', width: '120px' }}>Importe</th>
            </tr>
          </thead>
          <tbody>
            {items.filter(i => i.nombre || i.precio).map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                <td style={{ padding: '10px 4px' }}>
                  <div style={{ fontWeight: '600', fontSize: '13px' }}>{item.nombre}</div>
                  {item.descripcion && <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{item.descripcion}</div>}
                </td>
                <td style={{ padding: '10px 4px', textAlign: 'right', fontSize: '13px', fontWeight: '500', verticalAlign: 'top' }}>
                  € {formatEUR(parseFloat(item.precio) || 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
          <div style={{ minWidth: '240px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '12px', color: '#64748b' }}>
              <span>Base imponible</span><span>€ {formatEUR(base)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '12px', color: '#64748b' }}>
              <span>IVA (21%)</span><span>€ {formatEUR(iva)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: `2px solid ${NAVY}`, marginTop: '4px', fontWeight: '800', fontSize: '16px', color: '#1e293b' }}>
              <span>TOTAL</span><span>€ {formatEUR(total)}</span>
            </div>
          </div>
        </div>

        {/* Payment comment */}
        {comment.trim() && (
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', fontSize: '11px', color: '#64748b' }}>
            {comment}
          </div>
        )}
      </div>

      <style>{`
        @media print {
          html, body { margin: 0 !important; padding: 0 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .print\\:hidden { display: none !important; }
          .hidden.print\\:block { display: block !important; }
          [data-testid="print-layout"] { padding: 15mm !important; }
          @page { size: A4; margin: 0; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; }
          thead { display: table-header-group; }
        }
      `}</style>
    </div>
  );
};

export default ServicesInvoice;
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /Users/davidalonso/SoftwareProjects/ui-projects/invoice-project && CI=true npm test -- --watchAll=false --testPathPattern=ServicesInvoice
```

Expected: PASS — 5 tests passing (4 existing + 1 new print-layout test).

- [ ] **Step 5: Commit**

```bash
git add src/components/ServicesInvoice.js src/components/ServicesInvoice.test.js
git commit -m "feat: add professional print layout to ServicesInvoice"
```

---

## Task 3: Professional PDF layout for HourlyInvoice

**Files:**
- Modify: `src/components/HourlyInvoice.js`

Same technique. The hourly invoice print layout shows work rows (date / task / description / hours) and a summary table (task totals + hourly rate + total amount). No IVA.

- [ ] **Step 1: Write a print-layout test**

Add to `src/components/HourlyInvoice.test.js`:

```js
test('print layout contains company name and FACTURA heading', () => {
  localStorage.setItem('company_settings', JSON.stringify({
    nombre: 'Koalvia Technologies SL', nif: 'B26886952',
    direccion: 'c/ Arbúcies 17', email: 'david.alonso@koalvia.com', telefono: ''
  }));
  render(<HourlyInvoice onBack={() => {}} />);
  expect(screen.getByTestId('print-layout')).toBeInTheDocument();
  expect(screen.getByTestId('print-company-name')).toHaveTextContent('Koalvia Technologies SL');
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/davidalonso/SoftwareProjects/ui-projects/invoice-project && CI=true npm test -- --watchAll=false --testPathPattern=HourlyInvoice
```

Expected: FAIL — `print-layout` testId not found.

- [ ] **Step 3: Replace `src/components/HourlyInvoice.js`**

```jsx
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import CompanySettingsPanel from './CompanySettingsPanel';
import useLocalStorage from '../hooks/useLocalStorage';
import { getNextInvoiceNumber, formatInvoiceNumber } from '../lib/utils';

const NAVY = '#1e3a5f';

const HourlyInvoice = ({ onBack }) => {
  const [lastInvoiceNumber, setLastInvoiceNumber] = useLocalStorage('last_invoice_number', null);
  const [company] = useLocalStorage('company_settings', {
    nombre: '', nif: '', direccion: '', email: '', telefono: ''
  });
  const nextNum = getNextInvoiceNumber(lastInvoiceNumber);

  const [workData, setWorkData] = useState([]);
  const [pasteText, setPasteText] = useState('');
  const [showPasteArea, setShowPasteArea] = useState(true);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editForm, setEditForm] = useState({ date: '', hours: '', task: '', description: '' });
  const [invoiceNumber, setInvoiceNumber] = useState(formatInvoiceNumber(nextNum));
  const [invoiceDate, setInvoiceDate] = useState(new Date().toLocaleDateString('es-ES'));
  const [invoiceComment, setInvoiceComment] = useState(
    'Por favor, realizar transferencia a la cuenta IBAN: ES00 0000 0000 0000 0000 0000'
  );
  const [client, setClient] = useState({ nombre: '', nif: '', direccion: '' });

  const handleParse = () => {
    const lines = pasteText.trim().split('\n').filter(line => line.trim());
    const parsed = [];
    for (const line of lines) {
      let parts;
      if (line.includes('\t')) {
        parts = line.split('\t').map(p => p.trim());
      } else {
        parts = line.split(/[,;|]/).map(p => p.trim());
      }
      if (parts.length >= 3) {
        const hours = parseFloat(parts[1]);
        if (!isNaN(hours)) {
          parsed.push({ date: parts[0], hours, task: parts[2] || '', description: parts[3] || '' });
        }
      }
    }
    if (parsed.length > 0) {
      setWorkData(prev => [...prev, ...parsed]);
      setPasteText('');
      setShowPasteArea(false);
    }
  };

  const handleDelete = (index) => setWorkData(prev => prev.filter((_, i) => i !== index));

  const handleEditStart = (index) => {
    setEditingIndex(index);
    const entry = workData[index];
    setEditForm({ date: entry.date, hours: entry.hours.toString(), task: entry.task, description: entry.description || '' });
  };

  const handleEditSave = () => {
    const hours = parseFloat(editForm.hours);
    if (!isNaN(hours) && editForm.date && editForm.task) {
      setWorkData(prev => prev.map((entry, i) =>
        i === editingIndex
          ? { date: editForm.date, hours, task: editForm.task, description: editForm.description || '' }
          : entry
      ));
      setEditingIndex(null);
    }
  };

  const handleClearAll = () => { setWorkData([]); setShowPasteArea(true); };

  const totalHours = workData.reduce((sum, e) => sum + e.hours, 0);
  const hourlyRate = 40;
  const totalAmount = totalHours * hourlyRate;

  const handlePrint = () => {
    setLastInvoiceNumber(nextNum);
    window.print();
  };

  const taskSummary = workData.reduce((acc, e) => {
    acc[e.task] = (acc[e.task] || 0) + e.hours;
    return acc;
  }, {});

  return (
    <div className="bg-white">

      {/* ── EDIT UI (screen only) ── */}
      <div className="print:hidden p-6">
        <div className="max-w-4xl mx-auto">
          <button onClick={onBack} className="text-blue-500 hover:text-blue-700 text-sm mb-4">
            ← Volver al inicio
          </button>

          <div className="mb-6">
            {showPasteArea || workData.length === 0 ? (
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h2 className="text-lg font-semibold mb-2">Pegar Datos de Trabajo</h2>
                <p className="text-sm text-gray-600 mb-2">
                  Formato: <code className="bg-gray-200 px-1 rounded">fecha, horas, categoría, descripción</code> (una entrada por línea)
                </p>
                <p className="text-xs text-gray-500 mb-3">
                  Soporta tabuladores (copiar desde Excel/Sheets) o comas. Ejemplo:<br />
                  7/11/2025, 5, Programacion, Bug de Comentarios<br />
                  8/11/2025, 3, Diseño, Página principal
                </p>
                <textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)} placeholder="Pega tus datos aquí..." className="w-full h-32 p-2 border rounded font-mono text-sm" />
                <button onClick={handleParse} disabled={!pasteText.trim()} className="mt-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-300">
                  Importar Datos
                </button>
              </div>
            ) : (
              <button onClick={() => setShowPasteArea(true)} className="text-blue-500 hover:text-blue-700 text-sm">
                + Añadir más entradas
              </button>
            )}
          </div>

          <div className="flex gap-2 mb-4">
            <button onClick={handlePrint} disabled={workData.length === 0} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-300">
              Imprimir/Descargar PDF
            </button>
            {workData.length > 0 && (
              <button onClick={handleClearAll} className="bg-red-100 text-red-600 px-4 py-2 rounded hover:bg-red-200">
                Borrar Todo
              </button>
            )}
          </div>

          <p className="text-sm text-gray-500 mb-4">
            Para mejores resultados, seleccione "Guardar como PDF".
            <strong> Importante:</strong> Desactive "Encabezados y pies de página".
          </p>

          <header className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Factura</h1>
            <div className="flex gap-6 mt-2 text-sm">
              <div>
                <label htmlFor="hourly-invoice-number" className="text-xs text-slate-400 block">Nº Factura</label>
                <input id="hourly-invoice-number" type="text" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} className="border-b border-gray-300 focus:border-blue-500 outline-none bg-transparent text-sm" style={{ width: '90px' }} />
              </div>
              <div>
                <label className="text-xs text-slate-400 block">Fecha</label>
                <input type="text" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className="border-b border-gray-300 focus:border-blue-500 outline-none bg-transparent text-sm" style={{ width: '100px' }} />
              </div>
            </div>
          </header>

          <CompanySettingsPanel />

          <div className="border border-slate-200 rounded-lg p-4 mb-6">
            <div className="font-semibold text-xs text-slate-500 uppercase tracking-wide mb-3">Datos del cliente</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Nombre / Empresa</label>
                <input value={client.nombre} onChange={(e) => setClient({ ...client, nombre: e.target.value })} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">NIF/CIF</label>
                <input value={client.nif} onChange={(e) => setClient({ ...client, nif: e.target.value })} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-slate-400 block mb-1">Dirección</label>
                <input value={client.direccion} onChange={(e) => setClient({ ...client, direccion: e.target.value })} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" />
              </div>
            </div>
          </div>

          <Card className="bg-white shadow-md">
            <CardHeader><CardTitle>Detalle de trabajo</CardTitle></CardHeader>
            <CardContent>
              {workData.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No hay datos. Pega tus entradas arriba para comenzar.</p>
              ) : (
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2 text-left">Fecha</th>
                      <th className="border p-2 text-left">Tarea</th>
                      <th className="border p-2 text-left">Descripción</th>
                      <th className="border p-2 text-right">Horas</th>
                      <th className="border p-2 text-center" style={{ width: '100px' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workData.map((entry, index) => (
                      <tr key={index}>
                        {editingIndex === index ? (
                          <>
                            <td className="border p-1"><input type="text" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} className="w-full p-1 border rounded text-sm" /></td>
                            <td className="border p-1"><input type="text" value={editForm.task} onChange={(e) => setEditForm({ ...editForm, task: e.target.value })} className="w-full p-1 border rounded text-sm" /></td>
                            <td className="border p-1"><input type="text" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="w-full p-1 border rounded text-sm" /></td>
                            <td className="border p-1"><input type="number" value={editForm.hours} onChange={(e) => setEditForm({ ...editForm, hours: e.target.value })} className="w-full p-1 border rounded text-sm text-right" step="0.5" /></td>
                            <td className="border p-1 text-center">
                              <button onClick={handleEditSave} className="text-green-600 hover:text-green-800 mr-2 text-sm">✓</button>
                              <button onClick={() => setEditingIndex(null)} className="text-gray-600 hover:text-gray-800 text-sm">✕</button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="border p-2">{entry.date}</td>
                            <td className="border p-2">{entry.task}</td>
                            <td className="border p-2">{entry.description}</td>
                            <td className="border p-2 text-right">{entry.hours}</td>
                            <td className="border p-2 text-center">
                              <button onClick={() => handleEditStart(index)} className="text-blue-600 hover:text-blue-800 mr-2 text-sm">✎</button>
                              <button onClick={() => handleDelete(index)} className="text-red-600 hover:text-red-800 text-sm">✕</button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>

          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Resumen</h2>
            <Card className="bg-white shadow-md">
              <CardContent className="pt-6">
                <table className="w-full border-collapse">
                  <thead><tr className="bg-gray-100"><th className="border p-2 text-left">Tarea</th><th className="border p-2 text-right">Horas</th></tr></thead>
                  <tbody>
                    {Object.entries(taskSummary).map(([task, hours], i) => (
                      <tr key={i}><td className="border p-2">{task}</td><td className="border p-2 text-right">{hours}</td></tr>
                    ))}
                  </tbody>
                </table>
                <table className="w-full border-collapse mt-6">
                  <tbody>
                    <tr className="font-bold"><td className="border p-2 text-right">Total Horas:</td><td className="border p-2 text-right" style={{ width: '100px' }}>{totalHours}</td></tr>
                    <tr className="font-bold"><td className="border p-2 text-right">Tarifa por Hora:</td><td className="border p-2 text-right">€40</td></tr>
                    <tr className="font-bold bg-gray-100"><td className="border p-2 text-right">Total:</td><td className="border p-2 text-right">€{totalAmount}</td></tr>
                  </tbody>
                </table>
                <div className={`mt-6 p-3 bg-gray-50 rounded border ${!invoiceComment.trim() ? 'hidden' : ''}`}>
                  <label className="text-sm text-gray-600 block mb-1">Comentario (opcional):</label>
                  <textarea value={invoiceComment} onChange={(e) => setInvoiceComment(e.target.value)} className="w-full p-2 border rounded text-sm resize-none" rows={2} placeholder="Añadir comentario..." />
                </div>
              </CardContent>
            </Card>
          </div>

          <p className="text-xs text-gray-400 mt-4">
            Para quitar encabezados: busca "Más opciones" y desmarca "Encabezados y pies de página".
          </p>
        </div>
      </div>

      {/* ── PRINT LAYOUT (print only) ── */}
      <div data-testid="print-layout" className="hidden print:block" style={{ fontFamily: 'system-ui, sans-serif', color: '#1e293b', padding: '0' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <div>
            <div data-testid="print-company-name" style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.3px' }}>{company.nombre}</div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>{company.direccion}</div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>
              {company.nif}{company.email ? ` · ${company.email}` : ''}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '26px', fontWeight: '800', color: NAVY, letterSpacing: '2px' }}>FACTURA</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Nº {invoiceNumber}</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Fecha: {invoiceDate}</div>
          </div>
        </div>

        {/* Accent divider */}
        <div style={{ borderTop: `2px solid ${NAVY}`, marginBottom: '20px' }} />

        {/* Client */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>Facturado a</div>
          <div style={{ fontSize: '14px', fontWeight: '600' }}>{client.nombre || '—'}</div>
          {(client.nif || client.direccion) && (
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              {[client.nif, client.direccion].filter(Boolean).join(' · ')}
            </div>
          )}
        </div>

        {/* Work detail table */}
        {workData.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid #e2e8f0` }}>
                <th style={{ padding: '6px 4px', textAlign: 'left', fontSize: '9px', color: '#94a3b8', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px', width: '90px' }}>Fecha</th>
                <th style={{ padding: '6px 4px', textAlign: 'left', fontSize: '9px', color: '#94a3b8', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px', width: '120px' }}>Tarea</th>
                <th style={{ padding: '6px 4px', textAlign: 'left', fontSize: '9px', color: '#94a3b8', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Descripción</th>
                <th style={{ padding: '6px 4px', textAlign: 'right', fontSize: '9px', color: '#94a3b8', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px', width: '60px' }}>Horas</th>
              </tr>
            </thead>
            <tbody>
              {workData.map((entry, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '8px 4px', fontSize: '12px', color: '#64748b' }}>{entry.date}</td>
                  <td style={{ padding: '8px 4px', fontSize: '12px', fontWeight: '600' }}>{entry.task}</td>
                  <td style={{ padding: '8px 4px', fontSize: '12px', color: '#64748b' }}>{entry.description}</td>
                  <td style={{ padding: '8px 4px', fontSize: '12px', textAlign: 'right' }}>{entry.hours}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Summary + total */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
          <div style={{ minWidth: '240px' }}>
            {Object.entries(taskSummary).map(([task, hours]) => (
              <div key={task} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '12px', color: '#64748b' }}>
                <span>{task}</span><span>{hours}h</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '12px', color: '#64748b', borderTop: '1px solid #e2e8f0', marginTop: '4px' }}>
              <span>Total horas</span><span>{totalHours}h × €40</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: `2px solid ${NAVY}`, marginTop: '4px', fontWeight: '800', fontSize: '16px', color: '#1e293b' }}>
              <span>TOTAL</span><span>€{totalAmount}</span>
            </div>
          </div>
        </div>

        {/* Payment comment */}
        {invoiceComment.trim() && (
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', fontSize: '11px', color: '#64748b' }}>
            {invoiceComment}
          </div>
        )}
      </div>

      <style>{`
        @media print {
          html, body { margin: 0 !important; padding: 0 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .print\\:hidden { display: none !important; }
          .hidden.print\\:block { display: block !important; }
          [data-testid="print-layout"] { padding: 15mm !important; }
          @page { size: A4; margin: 0; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; }
          thead { display: table-header-group; }
        }
      `}</style>
    </div>
  );
};

export default HourlyInvoice;
```

- [ ] **Step 4: Run all tests**

```bash
cd /Users/davidalonso/SoftwareProjects/ui-projects/invoice-project && CI=true npm test -- --watchAll=false
```

Expected: all test suites PASS, 0 failures.

- [ ] **Step 5: Start dev server and verify in browser**

```bash
npm start
```

Verify:
- Home screen loads
- Services invoice: fill in a client and 2 line items, click "Imprimir / Guardar PDF" → print preview shows the professional layout (company top-left, FACTURA top-right, accent line, clean table, totals bottom-right)
- Hourly invoice: import some rows, click print → same professional header, work detail table, summary at bottom
- Both: company info shows Koalvia's data on first open without entering anything

- [ ] **Step 6: Commit**

```bash
git add src/components/HourlyInvoice.js src/components/HourlyInvoice.test.js
git commit -m "feat: add professional print layout to HourlyInvoice"
```
