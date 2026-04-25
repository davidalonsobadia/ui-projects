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
                            <td className="border p-1"><input type="text" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} className="w-full p-1 border rounded text-sm" /></td>
                            <td className="border p-1"><input type="text" value={editForm.task} onChange={(e) => setEditForm({ ...editForm, task: e.target.value })} className="w-full p-1 border rounded text-sm" /></td>
                            <td className="border p-1"><input type="text" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="w-full p-1 border rounded text-sm" /></td>
                            <td className="border p-1"><input type="number" value={editForm.hours} onChange={(e) => setEditForm({ ...editForm, hours: e.target.value })} className="w-full p-1 border rounded text-sm text-right" step="0.5" /></td>
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
