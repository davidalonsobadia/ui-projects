import React, { useEffect, useRef, useState } from 'react';
import CompanySettingsPanel from './CompanySettingsPanel';
import ClientPicker from './ClientPicker';
import useCompanySettings from '../hooks/useCompanySettings';
import { useAuth } from '../context/AuthProvider';
import { db } from '../lib/firebase';
import { allocateInvoiceNumber } from '../lib/invoiceNumber';
import { saveInvoice } from '../lib/invoices';
import { getNextInvoiceNumber, formatInvoiceNumber } from '../lib/utils';

const formatEUR = (num) => {
  const parts = num.toFixed(2).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return parts.join(',');
};

const NAVY = '#1e3a5f';

const ServicesInvoice = ({ onBack }) => {
  const { user } = useAuth();
  const uid = user ? user.uid : null;
  const [company, setCompany] = useCompanySettings({
    nombre: '', nif: '', direccion: '', email: '', telefono: ''
  });

  // The number shown before printing is provisional: the real value is allocated
  // atomically from Firestore at print time. Seed the field with the current
  // year's first number via the shared numbering logic (no duplication).
  const [invoiceNumber, setInvoiceNumber] = useState(
    formatInvoiceNumber(getNextInvoiceNumber(null)),
  );
  // Set once the user edits the number by hand: a manual value (for corrections /
  // re-issues) is printed as-is and does not consume a number from the counter.
  const [numberOverridden, setNumberOverridden] = useState(false);
  // `allocating` disables the print button while a transaction is in flight;
  // `printError` surfaces a Spanish message if allocation fails.
  const [allocating, setAllocating] = useState(false);
  const [printError, setPrintError] = useState(null);
  // A persistence hiccup must not block the PDF: a failed save surfaces this
  // Spanish message but still lets the invoice print.
  const [saveError, setSaveError] = useState(null);
  const [printing, setPrinting] = useState(false);
  // Synchronous re-entry guard so a rapid double-click cannot start two
  // concurrent allocations (state updates are async and would let both through).
  const inFlightRef = useRef(false);
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

  const handlePrint = async () => {
    // Ignore re-entrant clicks while an allocation is already running.
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setAllocating(true);
    setPrintError(null);
    setSaveError(null);
    try {
      // A manual override is printed verbatim and must not touch the counter.
      let finalNumber = invoiceNumber;
      if (!numberOverridden && uid) {
        const allocated = await allocateInvoiceNumber(db, uid);
        finalNumber = formatInvoiceNumber(allocated);
        setInvoiceNumber(finalNumber);
      }
      // Record the emitted invoice under the signed-in user. This is a separate
      // write right after allocation; a save failure must not block the PDF, so
      // it only surfaces a Spanish message and still lets printing proceed.
      if (uid) {
        try {
          await saveInvoice(db, uid, {
            number: finalNumber,
            type: 'services',
            issueDate: invoiceDate,
            client,
            lineItems: items.map(({ nombre, descripcion, precio }) => ({
              nombre,
              descripcion,
              precio,
            })),
            amounts: { base, iva, total },
          });
        } catch (saveErr) {
          setSaveError('No se pudo guardar la factura en tu historial.');
        }
      }
      // Defer window.print() to the effect below so the freshly allocated number
      // is committed to the DOM before the print dialog captures it.
      setPrinting(true);
    } catch (err) {
      setPrintError(
        'No se pudo asignar el número de factura. Revisa tu conexión e inténtalo de nuevo.',
      );
    } finally {
      inFlightRef.current = false;
      setAllocating(false);
    }
  };

  useEffect(() => {
    if (!printing) return;
    window.print();
    setPrinting(false);
  }, [printing]);

  const handleInvoiceNumberChange = (e) => {
    setNumberOverridden(true);
    setInvoiceNumber(e.target.value);
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
              disabled={items.every(i => !i.nombre) || allocating}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-300"
            >
              {allocating ? 'Asignando número…' : 'Imprimir / Guardar PDF'}
            </button>
            <button onClick={handleClear} className="bg-red-100 text-red-600 px-4 py-2 rounded hover:bg-red-200">
              Borrar todo
            </button>
          </div>

          {printError && (
            <p role="alert" className="text-sm text-red-600 mb-4">{printError}</p>
          )}

          {saveError && (
            <p role="alert" className="text-sm text-red-600 mb-4">{saveError}</p>
          )}

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
                  onChange={handleInvoiceNumberChange}
                  className="border-b border-gray-300 focus:border-blue-500 outline-none bg-transparent text-sm"
                  style={{ width: '90px' }}
                />
                {!numberOverridden && (
                  <span className="text-[10px] text-slate-400 block mt-0.5">se asignará al imprimir</span>
                )}
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

          <CompanySettingsPanel onSave={setCompany} />

          <ClientPicker value={client} onChange={setClient} />

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
