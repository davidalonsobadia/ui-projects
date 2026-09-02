import React, { useEffect, useRef, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import CompanySettingsPanel, { KOALVIA_DEFAULT } from './CompanySettingsPanel';
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

const HourlyInvoice = ({ onBack }) => {
  const { user } = useAuth();
  const uid = user ? user.uid : null;
  const [company, setCompany] = useCompanySettings(KOALVIA_DEFAULT);

  const [workData, setWorkData] = useState([]);
  const [pasteText, setPasteText] = useState('');
  const [showPasteArea, setShowPasteArea] = useState(true);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editForm, setEditForm] = useState({ date: '', hours: '', task: '', description: '' });
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
  const base = totalHours * hourlyRate;
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
            type: 'hourly',
            issueDate: invoiceDate,
            client,
            lineItems: workData,
            amounts: { base, iva, total },
          });
        } catch (saveErr) {
          console.error(saveErr);
          setSaveError('No se pudo guardar la factura en tu historial.');
        }
      }
      // Defer window.print() to the effect below so the freshly allocated number
      // is committed to the DOM before the print dialog captures it.
      setPrinting(true);
    } catch (err) {
      console.error(err);
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
            <button onClick={handlePrint} disabled={workData.length === 0 || allocating} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-300">
              {allocating ? 'Asignando número…' : 'Imprimir/Descargar PDF'}
            </button>
            {workData.length > 0 && (
              <button onClick={handleClearAll} className="bg-red-100 text-red-600 px-4 py-2 rounded hover:bg-red-200">
                Borrar Todo
              </button>
            )}
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
            <div className="flex gap-6 mt-2 text-sm">
              <div>
                <label htmlFor="hourly-invoice-number" className="text-xs text-slate-400 block">Nº Factura</label>
                <input id="hourly-invoice-number" type="text" value={invoiceNumber} onChange={handleInvoiceNumberChange} className="border-b border-gray-300 focus:border-blue-500 outline-none bg-transparent text-sm" style={{ width: '90px' }} />
                {!numberOverridden && (
                  <span className="text-[10px] text-slate-400 block mt-0.5">se asignará al imprimir</span>
                )}
              </div>
              <div>
                <label className="text-xs text-slate-400 block">Fecha</label>
                <input type="text" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className="border-b border-gray-300 focus:border-blue-500 outline-none bg-transparent text-sm" style={{ width: '100px' }} />
              </div>
            </div>
          </header>

          <CompanySettingsPanel company={company} onSave={setCompany} />

          <ClientPicker value={client} onChange={setClient} />

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
                    <tr><td className="border p-2 text-right text-gray-600">Base imponible</td><td className="border p-2 text-right">€ {formatEUR(base)}</td></tr>
                    <tr><td className="border p-2 text-right text-gray-600">IVA (21%)</td><td className="border p-2 text-right">€ {formatEUR(iva)}</td></tr>
                    <tr className="font-bold bg-gray-100"><td className="border p-2 text-right">Total:</td><td className="border p-2 text-right">€ {formatEUR(total)}</td></tr>
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
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
          <div style={{ minWidth: '240px' }}>
            {Object.entries(taskSummary).map(([task, hours]) => (
              <div key={task} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '12px', color: '#64748b' }}>
                <span>{task}</span><span>{hours}h</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '12px', color: '#64748b', borderTop: '1px solid #e2e8f0', marginTop: '4px' }}>
              <span>Total horas</span><span>{totalHours}h × €40</span>
            </div>
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
          [data-testid="print-layout"] { padding: 0 15mm !important; }
          @page { size: A4; margin: 15mm 0; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; }
          thead { display: table-header-group; }
        }
      `}</style>
    </div>
  );
};

export default HourlyInvoice;
