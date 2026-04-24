# Services Invoice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Factura de Servicios" invoice type alongside the existing hourly invoice, with a home screen to pick between them, saved company info, client fields, and IVA 21% breakdown.

**Architecture:** `App.js` becomes a thin shell holding a `currentView` state. A new `HomeScreen` renders two large cards to start each invoice type. The existing hourly invoice logic moves to `HourlyInvoice.js`. The new `ServicesInvoice.js` has line items (name / description / price), IVA 21%, and totals. Both share a `CompanySettingsPanel` that reads/writes company info from localStorage, and a `useLocalStorage` hook.

**Tech Stack:** React 19, Tailwind CSS 3, React Testing Library, Jest (via CRA / react-scripts)

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/hooks/useLocalStorage.js` | Generic useState backed by localStorage |
| Modify | `src/lib/utils.js` | Add `getNextInvoiceNumber` + `formatInvoiceNumber` |
| Create | `src/components/CompanySettingsPanel.js` | View/edit panel for saved company info |
| Create | `src/components/HomeScreen.js` | Two-card home screen |
| Create | `src/components/HourlyInvoice.js` | Existing invoice logic + company/client/invoice# |
| Create | `src/components/ServicesInvoice.js` | New invoice: line items, IVA, totals |
| Modify | `src/App.js` | Thin shell — renders one view based on currentView state |
| Create | `src/hooks/useLocalStorage.test.js` | Hook unit tests |
| Create | `src/components/CompanySettingsPanel.test.js` | Panel render + interaction tests |
| Create | `src/components/HomeScreen.test.js` | Home screen tests |
| Create | `src/components/ServicesInvoice.test.js` | Line items + totals tests |

---

## Task 1: `useLocalStorage` hook

**Files:**
- Create: `src/hooks/useLocalStorage.js`
- Create: `src/hooks/useLocalStorage.test.js`

- [ ] **Step 1: Write the failing test**

Create `src/hooks/useLocalStorage.test.js`:

```js
import { renderHook, act } from '@testing-library/react';
import useLocalStorage from './useLocalStorage';

beforeEach(() => {
  localStorage.clear();
});

test('returns initial value when nothing is stored', () => {
  const { result } = renderHook(() => useLocalStorage('test_key', { a: 1 }));
  expect(result.current[0]).toEqual({ a: 1 });
});

test('persists value to localStorage on set', () => {
  const { result } = renderHook(() => useLocalStorage('test_key', null));
  act(() => { result.current[1]({ x: 99 }); });
  expect(JSON.parse(localStorage.getItem('test_key'))).toEqual({ x: 99 });
});

test('reads existing localStorage value on mount', () => {
  localStorage.setItem('test_key', JSON.stringify({ saved: true }));
  const { result } = renderHook(() => useLocalStorage('test_key', null));
  expect(result.current[0]).toEqual({ saved: true });
});

test('supports functional update', () => {
  const { result } = renderHook(() => useLocalStorage('count', 0));
  act(() => { result.current[1](prev => prev + 1); });
  expect(result.current[0]).toBe(1);
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
CI=true npm test -- --watchAll=false --testPathPattern=useLocalStorage
```

Expected: FAIL — `useLocalStorage` not found.

- [ ] **Step 3: Implement the hook**

Create `src/hooks/useLocalStorage.js`:

```js
import { useState } from 'react';

function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item !== null ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}

export default useLocalStorage;
```

- [ ] **Step 4: Run test to verify it passes**

```bash
CI=true npm test -- --watchAll=false --testPathPattern=useLocalStorage
```

Expected: PASS — 4 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useLocalStorage.js src/hooks/useLocalStorage.test.js
git commit -m "feat: add useLocalStorage hook"
```

---

## Task 2: Invoice number utilities

**Files:**
- Modify: `src/lib/utils.js`

- [ ] **Step 1: Write the failing test**

Create `src/lib/utils.test.js`:

```js
import { getNextInvoiceNumber, formatInvoiceNumber } from './utils';

const YEAR = new Date().getFullYear();

test('returns counter 1 when nothing stored', () => {
  expect(getNextInvoiceNumber(null)).toEqual({ year: YEAR, counter: 1 });
});

test('increments counter when same year', () => {
  expect(getNextInvoiceNumber({ year: YEAR, counter: 5 })).toEqual({ year: YEAR, counter: 6 });
});

test('resets counter to 1 when year changes', () => {
  expect(getNextInvoiceNumber({ year: 2020, counter: 99 })).toEqual({ year: YEAR, counter: 1 });
});

test('formats number as YYYY-NNNN', () => {
  expect(formatInvoiceNumber({ year: 2026, counter: 3 })).toBe('2026-0003');
  expect(formatInvoiceNumber({ year: 2026, counter: 100 })).toBe('2026-0100');
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
CI=true npm test -- --watchAll=false --testPathPattern=lib/utils
```

Expected: FAIL — `getNextInvoiceNumber` is not exported.

- [ ] **Step 3: Add the functions to `src/lib/utils.js`**

```js
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function getNextInvoiceNumber(stored) {
  const currentYear = new Date().getFullYear();
  if (!stored || stored.year !== currentYear) {
    return { year: currentYear, counter: 1 };
  }
  return { year: stored.year, counter: stored.counter + 1 };
}

export function formatInvoiceNumber({ year, counter }) {
  return `${year}-${String(counter).padStart(4, '0')}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
CI=true npm test -- --watchAll=false --testPathPattern=lib/utils
```

Expected: PASS — 4 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/lib/utils.js src/lib/utils.test.js
git commit -m "feat: add invoice number utilities"
```

---

## Task 3: `CompanySettingsPanel` component

**Files:**
- Create: `src/components/CompanySettingsPanel.js`
- Create: `src/components/CompanySettingsPanel.test.js`

- [ ] **Step 1: Write the failing test**

Create `src/components/CompanySettingsPanel.test.js`:

```js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CompanySettingsPanel from './CompanySettingsPanel';

beforeEach(() => { localStorage.clear(); });

test('opens in edit mode when no company data is saved', () => {
  render(<CompanySettingsPanel />);
  expect(screen.getByLabelText(/Nombre \/ Empresa/i)).toBeInTheDocument();
});

test('shows saved company name in view mode', () => {
  localStorage.setItem('company_settings', JSON.stringify({
    nombre: 'Acme SL', nif: 'B123', direccion: 'Calle 1', email: 'a@b.com', telefono: ''
  }));
  render(<CompanySettingsPanel />);
  expect(screen.getByText('Acme SL')).toBeInTheDocument();
});

test('clicking Editar switches to edit mode', () => {
  localStorage.setItem('company_settings', JSON.stringify({
    nombre: 'Acme SL', nif: '', direccion: '', email: '', telefono: ''
  }));
  render(<CompanySettingsPanel />);
  fireEvent.click(screen.getByText('Editar'));
  expect(screen.getByLabelText(/Nombre \/ Empresa/i)).toBeInTheDocument();
});

test('saving in edit mode updates displayed values', () => {
  render(<CompanySettingsPanel />);
  fireEvent.change(screen.getByLabelText(/Nombre \/ Empresa/i), { target: { value: 'Mi Empresa' } });
  fireEvent.click(screen.getByText('Guardar'));
  expect(screen.getByText('Mi Empresa')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
CI=true npm test -- --watchAll=false --testPathPattern=CompanySettingsPanel
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the component**

Create `src/components/CompanySettingsPanel.js`:

```jsx
import React, { useState } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';

const EMPTY = { nombre: '', nif: '', direccion: '', email: '', telefono: '' };

const FIELDS = [
  { key: 'nombre', label: 'Nombre / Empresa', span: false },
  { key: 'nif', label: 'NIF/CIF', span: false },
  { key: 'direccion', label: 'Dirección', span: true },
  { key: 'email', label: 'Email', span: false },
  { key: 'telefono', label: 'Teléfono (opcional)', span: false },
];

const CompanySettingsPanel = () => {
  const [company, setCompany] = useLocalStorage('company_settings', EMPTY);
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

- [ ] **Step 4: Run test to verify it passes**

```bash
CI=true npm test -- --watchAll=false --testPathPattern=CompanySettingsPanel
```

Expected: PASS — 4 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/components/CompanySettingsPanel.js src/components/CompanySettingsPanel.test.js
git commit -m "feat: add CompanySettingsPanel component"
```

---

## Task 4: `HomeScreen` component

**Files:**
- Create: `src/components/HomeScreen.js`
- Create: `src/components/HomeScreen.test.js`

- [ ] **Step 1: Write the failing test**

Create `src/components/HomeScreen.test.js`:

```js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import HomeScreen from './HomeScreen';

test('renders both invoice type cards', () => {
  render(<HomeScreen onSelect={() => {}} />);
  expect(screen.getByText(/Factura por Horas/i)).toBeInTheDocument();
  expect(screen.getByText(/Factura de Servicios/i)).toBeInTheDocument();
});

test('calls onSelect("hourly") when hourly card clicked', () => {
  const onSelect = jest.fn();
  render(<HomeScreen onSelect={onSelect} />);
  fireEvent.click(screen.getByText(/Factura por Horas/i));
  expect(onSelect).toHaveBeenCalledWith('hourly');
});

test('calls onSelect("services") when services card clicked', () => {
  const onSelect = jest.fn();
  render(<HomeScreen onSelect={onSelect} />);
  fireEvent.click(screen.getByText(/Factura de Servicios/i));
  expect(onSelect).toHaveBeenCalledWith('services');
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
CI=true npm test -- --watchAll=false --testPathPattern=HomeScreen
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the component**

Create `src/components/HomeScreen.js`:

```jsx
import React from 'react';

const HomeScreen = ({ onSelect }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
    <div className="max-w-2xl w-full">
      <h1 className="text-3xl font-bold text-gray-800 text-center mb-2">
        Generador de Facturas
      </h1>
      <p className="text-gray-500 text-center mb-10">
        ¿Qué tipo de factura quieres crear?
      </p>
      <div className="grid grid-cols-2 gap-6">
        <button
          onClick={() => onSelect('hourly')}
          className="bg-white border-2 border-slate-200 rounded-xl p-8 text-left hover:border-blue-400 hover:shadow-lg transition-all group"
        >
          <div className="text-4xl mb-4">⏱</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600">
            Factura por Horas
          </h2>
          <p className="text-sm text-gray-500">
            Importa entradas de trabajo con fecha, horas y tarea. Calcula el total automáticamente.
          </p>
        </button>
        <button
          onClick={() => onSelect('services')}
          className="bg-white border-2 border-slate-200 rounded-xl p-8 text-left hover:border-blue-400 hover:shadow-lg transition-all group"
        >
          <div className="text-4xl mb-4">📋</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600">
            Factura de Servicios
          </h2>
          <p className="text-sm text-gray-500">
            Añade conceptos con nombre, descripción y precio. Incluye IVA al 21%.
          </p>
        </button>
      </div>
    </div>
  </div>
);

export default HomeScreen;
```

- [ ] **Step 4: Run test to verify it passes**

```bash
CI=true npm test -- --watchAll=false --testPathPattern=HomeScreen
```

Expected: PASS — 3 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/components/HomeScreen.js src/components/HomeScreen.test.js
git commit -m "feat: add HomeScreen component"
```

---

## Task 5: `HourlyInvoice` component

Move all existing `App.js` logic here and add company panel, client section, and invoice number.

**Files:**
- Create: `src/components/HourlyInvoice.js`

- [ ] **Step 1: Write a smoke test**

Create `src/components/HourlyInvoice.test.js`:

```js
import React from 'react';
import { render, screen } from '@testing-library/react';
import HourlyInvoice from './HourlyInvoice';

beforeEach(() => { localStorage.clear(); });

test('renders the paste area on first load', () => {
  render(<HourlyInvoice onBack={() => {}} />);
  expect(screen.getByText(/Pegar Datos de Trabajo/i)).toBeInTheDocument();
});

test('renders back button', () => {
  render(<HourlyInvoice onBack={() => {}} />);
  expect(screen.getByText(/Volver al inicio/i)).toBeInTheDocument();
});

test('renders invoice number field', () => {
  render(<HourlyInvoice onBack={() => {}} />);
  expect(screen.getByLabelText(/Nº Factura/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
CI=true npm test -- --watchAll=false --testPathPattern=HourlyInvoice
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the component**

Create `src/components/HourlyInvoice.js`:

```jsx
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import CompanySettingsPanel from './CompanySettingsPanel';
import useLocalStorage from '../hooks/useLocalStorage';
import { getNextInvoiceNumber, formatInvoiceNumber } from '../lib/utils';

const HourlyInvoice = ({ onBack }) => {
  const [lastInvoiceNumber, setLastInvoiceNumber] = useLocalStorage('last_invoice_number', null);
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
    <div className="p-6 bg-white">
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="text-blue-500 hover:text-blue-700 text-sm mb-4 print:hidden">
          ← Volver al inicio
        </button>

        <div className="print:hidden mb-6">
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
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="Pega tus datos aquí..."
                className="w-full h-32 p-2 border rounded font-mono text-sm"
              />
              <button
                onClick={handleParse}
                disabled={!pasteText.trim()}
                className="mt-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-300"
              >
                Importar Datos
              </button>
            </div>
          ) : (
            <button onClick={() => setShowPasteArea(true)} className="text-blue-500 hover:text-blue-700 text-sm">
              + Añadir más entradas
            </button>
          )}
        </div>

        <div className="flex gap-2 mb-4 print:hidden">
          <button
            onClick={handlePrint}
            disabled={workData.length === 0}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-300"
          >
            Imprimir/Descargar PDF
          </button>
          {workData.length > 0 && (
            <button onClick={handleClearAll} className="bg-red-100 text-red-600 px-4 py-2 rounded hover:bg-red-200">
              Borrar Todo
            </button>
          )}
        </div>

        <p className="text-sm text-gray-500 mb-4 print:hidden">
          Para mejores resultados, seleccione "Guardar como PDF" en el diálogo de impresión.
          <strong> Importante:</strong> Desactive las opciones de "Encabezados y pies de página".
        </p>

        <div id="invoice-content">
          <header className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Factura</h1>
            <div className="flex gap-6 mt-2 text-gray-600 text-sm">
              <div>
                <label htmlFor="hourly-invoice-number" className="text-xs text-slate-400 block">Nº Factura</label>
                <input
                  id="hourly-invoice-number"
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="border-b border-gray-300 focus:border-blue-500 outline-none bg-transparent print:border-none text-sm"
                  style={{ width: '90px' }}
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block">Fecha</label>
                <input
                  type="text"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="border-b border-gray-300 focus:border-blue-500 outline-none bg-transparent print:border-none text-sm"
                  style={{ width: '100px' }}
                />
              </div>
            </div>
          </header>

          <CompanySettingsPanel />

          <div className="border border-slate-200 rounded-lg p-4 mb-6">
            <div className="font-semibold text-xs text-slate-500 uppercase tracking-wide mb-3 print:hidden">
              Datos del cliente
            </div>
            <div className="font-semibold text-sm text-slate-700 mb-3 hidden print:block">Facturar a:</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Nombre / Empresa</label>
                <input
                  value={client.nombre}
                  onChange={(e) => setClient({ ...client, nombre: e.target.value })}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm print:border-none print:bg-transparent"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">NIF/CIF</label>
                <input
                  value={client.nif}
                  onChange={(e) => setClient({ ...client, nif: e.target.value })}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm print:border-none print:bg-transparent"
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-slate-400 block mb-1">Dirección</label>
                <input
                  value={client.direccion}
                  onChange={(e) => setClient({ ...client, direccion: e.target.value })}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm print:border-none print:bg-transparent"
                />
              </div>
            </div>
          </div>

          <Card className="bg-white shadow-md">
            <CardHeader>
              <CardTitle>Detalle de trabajo</CardTitle>
            </CardHeader>
            <CardContent>
              {workData.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No hay datos. Pega tus entradas arriba para comenzar.
                </p>
              ) : (
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2 text-left">Fecha</th>
                      <th className="border p-2 text-left">Tarea</th>
                      <th className="border p-2 text-left">Descripción</th>
                      <th className="border p-2 text-right">Horas</th>
                      <th className="border p-2 text-center print:hidden" style={{ width: '100px' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workData.map((entry, index) => (
                      <tr key={index}>
                        {editingIndex === index ? (
                          <>
                            <td className="border p-1">
                              <input type="text" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} className="w-full p-1 border rounded text-sm" />
                            </td>
                            <td className="border p-1">
                              <input type="text" value={editForm.task} onChange={(e) => setEditForm({ ...editForm, task: e.target.value })} className="w-full p-1 border rounded text-sm" />
                            </td>
                            <td className="border p-1">
                              <input type="text" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="w-full p-1 border rounded text-sm" />
                            </td>
                            <td className="border p-1">
                              <input type="number" value={editForm.hours} onChange={(e) => setEditForm({ ...editForm, hours: e.target.value })} className="w-full p-1 border rounded text-sm text-right" step="0.5" />
                            </td>
                            <td className="border p-1 text-center print:hidden">
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
                            <td className="border p-2 text-center print:hidden">
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

          <div className="summary-page">
            <h2 className="text-2xl font-bold mt-8 mb-4">Resumen</h2>
            <Card className="bg-white shadow-md">
              <CardContent className="pt-6">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2 text-left">Tarea</th>
                      <th className="border p-2 text-right">Horas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(taskSummary).map(([task, hours], i) => (
                      <tr key={i}>
                        <td className="border p-2">{task}</td>
                        <td className="border p-2 text-right">{hours}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <table className="w-full border-collapse mt-6">
                  <tbody>
                    <tr className="font-bold">
                      <td className="border p-2 text-right">Total Horas:</td>
                      <td className="border p-2 text-right" style={{ width: '100px' }}>{totalHours}</td>
                    </tr>
                    <tr className="font-bold">
                      <td className="border p-2 text-right">Tarifa por Hora:</td>
                      <td className="border p-2 text-right">€40</td>
                    </tr>
                    <tr className="font-bold bg-gray-100">
                      <td className="border p-2 text-right">Total:</td>
                      <td className="border p-2 text-right">€{totalAmount}</td>
                    </tr>
                  </tbody>
                </table>
                <div className={`mt-6 p-3 bg-gray-50 rounded border ${!invoiceComment.trim() ? 'print:hidden' : ''}`}>
                  <label className="text-sm text-gray-600 print:hidden block mb-1">Comentario (opcional):</label>
                  <textarea
                    value={invoiceComment}
                    onChange={(e) => setInvoiceComment(e.target.value)}
                    className="w-full p-2 border rounded text-sm print:border-none print:bg-transparent print:p-0 resize-none"
                    rows={2}
                    placeholder="Añadir comentario..."
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          html, body { margin: 0 !important; padding: 0 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .print\\:hidden { display: none !important; }
          @page { size: A4; margin: 15mm; }
          .summary-page { page-break-before: always; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; }
          thead { display: table-header-group; }
        }
      `}</style>

      <p className="text-xs text-gray-400 mt-4 print:hidden">
        Para quitar encabezados y pies de página del PDF: en el diálogo de impresión,
        busca "Más opciones" o "Configuración" y desmarca "Encabezados y pies de página".
      </p>
    </div>
  );
};

export default HourlyInvoice;
```

- [ ] **Step 4: Run test to verify it passes**

```bash
CI=true npm test -- --watchAll=false --testPathPattern=HourlyInvoice
```

Expected: PASS — 3 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/components/HourlyInvoice.js src/components/HourlyInvoice.test.js
git commit -m "feat: add HourlyInvoice component with company/client/invoice number"
```

---

## Task 6: `ServicesInvoice` component

**Files:**
- Create: `src/components/ServicesInvoice.js`
- Create: `src/components/ServicesInvoice.test.js`

- [ ] **Step 1: Write the failing tests**

Create `src/components/ServicesInvoice.test.js`:

```js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ServicesInvoice from './ServicesInvoice';

beforeEach(() => { localStorage.clear(); });

test('renders one empty line item row on load', () => {
  render(<ServicesInvoice onBack={() => {}} />);
  const inputs = screen.getAllByPlaceholderText(/concepto/i);
  expect(inputs).toHaveLength(1);
});

test('adds a new row when "+ Añadir concepto" is clicked', () => {
  render(<ServicesInvoice onBack={() => {}} />);
  fireEvent.click(screen.getByText(/Añadir concepto/i));
  const inputs = screen.getAllByPlaceholderText(/concepto/i);
  expect(inputs).toHaveLength(2);
});

test('calculates totals correctly', () => {
  render(<ServicesInvoice onBack={() => {}} />);
  const priceInput = screen.getByPlaceholderText(/0\.00/i);
  fireEvent.change(priceInput, { target: { value: '1000' } });
  expect(screen.getByText(/1\.000,00/i)).toBeInTheDocument();
  expect(screen.getByText(/210,00/i)).toBeInTheDocument();
  expect(screen.getByText(/1\.210,00/i)).toBeInTheDocument();
});

test('renders back button', () => {
  render(<ServicesInvoice onBack={() => {}} />);
  expect(screen.getByText(/Volver al inicio/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
CI=true npm test -- --watchAll=false --testPathPattern=ServicesInvoice
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the component**

Create `src/components/ServicesInvoice.js`:

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

const ServicesInvoice = ({ onBack }) => {
  const [lastInvoiceNumber, setLastInvoiceNumber] = useLocalStorage('last_invoice_number', null);
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
    <div className="p-6 bg-white">
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="text-blue-500 hover:text-blue-700 text-sm mb-4 print:hidden">
          ← Volver al inicio
        </button>

        <div className="flex gap-2 mb-4 print:hidden">
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

        <p className="text-sm text-gray-500 mb-4 print:hidden">
          Para mejores resultados, seleccione "Guardar como PDF".
          <strong> Importante:</strong> Desactive "Encabezados y pies de página".
        </p>

        <div id="invoice-content">
          <header className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Factura</h1>
            <div className="flex gap-6 mt-2 text-gray-600 text-sm">
              <div>
                <label htmlFor="services-invoice-number" className="text-xs text-slate-400 block">Nº Factura</label>
                <input
                  id="services-invoice-number"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="border-b border-gray-300 focus:border-blue-500 outline-none bg-transparent print:border-none text-sm"
                  style={{ width: '90px' }}
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block">Fecha</label>
                <input
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="border-b border-gray-300 focus:border-blue-500 outline-none bg-transparent print:border-none text-sm"
                  style={{ width: '100px' }}
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block">Vencimiento (opcional)</label>
                <input
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  placeholder="dd/mm/aaaa"
                  className="border-b border-gray-300 focus:border-blue-500 outline-none bg-transparent print:border-none text-sm"
                  style={{ width: '100px' }}
                />
              </div>
            </div>
          </header>

          <CompanySettingsPanel />

          <div className="border border-slate-200 rounded-lg p-4 mb-6">
            <div className="font-semibold text-xs text-slate-500 uppercase tracking-wide mb-3 print:hidden">
              Datos del cliente
            </div>
            <div className="font-semibold text-sm text-slate-700 mb-3 hidden print:block">Facturar a:</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Nombre / Empresa</label>
                <input
                  value={client.nombre}
                  onChange={(e) => setClient({ ...client, nombre: e.target.value })}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm print:border-none print:bg-transparent"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">NIF/CIF</label>
                <input
                  value={client.nif}
                  onChange={(e) => setClient({ ...client, nif: e.target.value })}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm print:border-none print:bg-transparent"
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-slate-400 block mb-1">Dirección</label>
                <input
                  value={client.direccion}
                  onChange={(e) => setClient({ ...client, direccion: e.target.value })}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm print:border-none print:bg-transparent"
                />
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
                  <th className="border p-2 w-10 print:hidden"></th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td className="border p-1">
                      <input
                        value={item.nombre}
                        onChange={(e) => updateItem(item.id, 'nombre', e.target.value)}
                        placeholder="Concepto"
                        className="w-full p-1 text-sm focus:outline-none print:bg-transparent"
                      />
                    </td>
                    <td className="border p-1">
                      <input
                        value={item.descripcion}
                        onChange={(e) => updateItem(item.id, 'descripcion', e.target.value)}
                        className="w-full p-1 text-sm focus:outline-none print:bg-transparent"
                      />
                    </td>
                    <td className="border p-1">
                      <input
                        type="number"
                        value={item.precio}
                        onChange={(e) => updateItem(item.id, 'precio', e.target.value)}
                        placeholder="0.00"
                        className="w-full p-1 text-sm text-right focus:outline-none print:bg-transparent"
                        step="0.01"
                        min="0"
                      />
                    </td>
                    <td className="border p-1 text-center print:hidden">
                      <button
                        onClick={() => removeItem(item.id)}
                        disabled={items.length === 1}
                        className="text-red-500 hover:text-red-700 text-sm disabled:text-gray-300"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={addItem} className="mt-2 text-blue-500 hover:text-blue-700 text-sm print:hidden">
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
                  <td className="p-2 text-right border border-t-2">TOTAL</td>
                  <td className="p-2 text-right border border-t-2 text-lg">€ {formatEUR(total)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className={`p-3 bg-gray-50 rounded border ${!comment.trim() ? 'print:hidden' : ''}`}>
            <label className="text-sm text-gray-600 print:hidden block mb-1">Comentario (opcional):</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-2 border rounded text-sm print:border-none print:bg-transparent print:p-0 resize-none"
              rows={2}
              placeholder="Añadir comentario..."
            />
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          html, body { margin: 0 !important; padding: 0 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .print\\:hidden { display: none !important; }
          @page { size: A4; margin: 15mm; }
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

- [ ] **Step 4: Run test to verify it passes**

```bash
CI=true npm test -- --watchAll=false --testPathPattern=ServicesInvoice
```

Expected: PASS — 4 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/components/ServicesInvoice.js src/components/ServicesInvoice.test.js
git commit -m "feat: add ServicesInvoice component"
```

---

## Task 7: Refactor `App.js` into thin shell

**Files:**
- Modify: `src/App.js`
- Modify: `src/App.test.js`

- [ ] **Step 1: Update the test**

Replace `src/App.test.js` with:

```js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

beforeEach(() => { localStorage.clear(); });

test('renders home screen by default', () => {
  render(<App />);
  expect(screen.getByText(/Generador de Facturas/i)).toBeInTheDocument();
});

test('navigates to hourly invoice', () => {
  render(<App />);
  fireEvent.click(screen.getByText(/Factura por Horas/i));
  expect(screen.getByText(/Pegar Datos de Trabajo/i)).toBeInTheDocument();
});

test('navigates to services invoice', () => {
  render(<App />);
  fireEvent.click(screen.getByText(/Factura de Servicios/i));
  expect(screen.getByText(/Añadir concepto/i)).toBeInTheDocument();
});

test('back button returns to home screen', () => {
  render(<App />);
  fireEvent.click(screen.getByText(/Factura de Servicios/i));
  fireEvent.click(screen.getByText(/Volver al inicio/i));
  expect(screen.getByText(/Generador de Facturas/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
CI=true npm test -- --watchAll=false --testPathPattern=App.test
```

Expected: FAIL — current App.js doesn't render home screen.

- [ ] **Step 3: Replace `src/App.js`**

```jsx
import React, { useState } from 'react';
import HomeScreen from './components/HomeScreen';
import HourlyInvoice from './components/HourlyInvoice';
import ServicesInvoice from './components/ServicesInvoice';

const App = () => {
  const [currentView, setCurrentView] = useState('home');

  if (currentView === 'hourly') return <HourlyInvoice onBack={() => setCurrentView('home')} />;
  if (currentView === 'services') return <ServicesInvoice onBack={() => setCurrentView('home')} />;
  return <HomeScreen onSelect={setCurrentView} />;
};

export default App;
```

- [ ] **Step 4: Run all tests to verify everything passes**

```bash
CI=true npm test -- --watchAll=false
```

Expected: all test suites PASS with no failures.

- [ ] **Step 5: Start the dev server and verify in browser**

```bash
npm start
```

Check:
- Home screen shows two cards
- Clicking each card opens the right invoice
- Back button returns to home
- Company info saves across page refreshes (open DevTools → Application → localStorage → `company_settings`)
- Invoice number auto-increments after printing (check `last_invoice_number` in localStorage)
- Services invoice: add rows, enter prices, verify IVA and total update live
- Print to PDF works for both invoice types

- [ ] **Step 6: Commit**

```bash
git add src/App.js src/App.test.js
git commit -m "feat: refactor App to thin shell with home screen navigation"
```
