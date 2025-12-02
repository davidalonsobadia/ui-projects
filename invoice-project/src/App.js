import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './components/ui/card';

const InvoiceGenerator = () => {
  // State for work data (starts empty)
  const [workData, setWorkData] = useState([]);
  const [pasteText, setPasteText] = useState('');
  const [showPasteArea, setShowPasteArea] = useState(true);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editForm, setEditForm] = useState({ date: '', hours: '', task: '', description: '' });
  const [invoiceDate, setInvoiceDate] = useState(new Date().toLocaleDateString('es-ES'));
  const [invoiceComment, setInvoiceComment] = useState('Por favor, realizar transferencia a la cuenta IBAN: ES00 0000 0000 0000 0000 0000');

  // Parse pasted text into work data entries
  const handleParse = () => {
    const lines = pasteText.trim().split('\n').filter(line => line.trim());
    const parsed = [];

    for (const line of lines) {
      // Support tab-separated (from spreadsheets) or comma/semicolon/pipe separated
      let parts;
      if (line.includes('\t')) {
        parts = line.split('\t').map(p => p.trim());
      } else {
        parts = line.split(/[,;|]/).map(p => p.trim());
      }

      if (parts.length >= 3) {
        const hours = parseFloat(parts[1]);
        if (!isNaN(hours)) {
          parsed.push({
            date: parts[0],
            hours: hours,
            task: parts[2] || '',
            description: parts[3] || '' // Optional description column
          });
        }
      }
    }

    if (parsed.length > 0) {
      setWorkData(prev => [...prev, ...parsed]);
      setPasteText('');
      setShowPasteArea(false);
    }
  };

  // Delete an entry
  const handleDelete = (index) => {
    setWorkData(prev => prev.filter((_, i) => i !== index));
  };

  // Start editing an entry
  const handleEditStart = (index) => {
    setEditingIndex(index);
    const entry = workData[index];
    setEditForm({
      date: entry.date,
      hours: entry.hours.toString(),
      task: entry.task,
      description: entry.description || ''
    });
  };

  // Save edited entry
  const handleEditSave = () => {
    const hours = parseFloat(editForm.hours);
    if (!isNaN(hours) && editForm.date && editForm.task) {
      setWorkData(prev => prev.map((entry, i) =>
        i === editingIndex ? {
          date: editForm.date,
          hours,
          task: editForm.task,
          description: editForm.description || ''
        } : entry
      ));
      setEditingIndex(null);
    }
  };

  // Cancel editing
  const handleEditCancel = () => {
    setEditingIndex(null);
  };

  // Clear all entries
  const handleClearAll = () => {
    setWorkData([]);
    setShowPasteArea(true);
  };

  // Calculate total hours
  const totalHours = workData.reduce((sum, entry) => sum + entry.hours, 0);
  const hourlyRate = 40;
  const totalAmount = totalHours * hourlyRate;

  const handlePrint = () => {
    window.print();
  };

  // Group data by task for summary
  const taskSummary = workData.reduce((acc, entry) => {
    if (!acc[entry.task]) {
      acc[entry.task] = 0;
    }
    acc[entry.task] += entry.hours;
    return acc;
  }, {});

  return (
    <div className="p-6 bg-white">
      <div className="max-w-4xl mx-auto">
        {/* Paste Area - hidden when printing */}
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
            <button
              onClick={() => setShowPasteArea(true)}
              className="text-blue-500 hover:text-blue-700 text-sm"
            >
              + Añadir más entradas
            </button>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mb-4 print:hidden">
          <button
            onClick={handlePrint}
            disabled={workData.length === 0}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-300"
          >
            Imprimir/Descargar PDF
          </button>
          {workData.length > 0 && (
            <button
              onClick={handleClearAll}
              className="bg-red-100 text-red-600 px-4 py-2 rounded hover:bg-red-200"
            >
              Borrar Todo
            </button>
          )}
        </div>

        <p className="text-sm text-gray-500 mb-4 print:hidden">
          Para mejores resultados, seleccione "Guardar como PDF" en el diálogo de impresión.
          <strong>Importante:</strong> Desactive las opciones de "Encabezados y pies de página" en la configuración de impresión.
        </p>

        <div id="invoice-content">
          <header className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Factura</h1>
            <p className="text-gray-600">
              Fecha:{' '}
              <input
                type="text"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="border-b border-gray-300 focus:border-blue-500 outline-none bg-transparent print:border-none"
                style={{ width: '100px' }}
              />
            </p>
          </header>

          <Card className="bg-white shadow-md">
            <CardHeader>
              <CardTitle>
                <div className="flex justify-between">
                  <span className="text-right">David Alonso</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Data table without totals */}
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
                              <input
                                type="text"
                                value={editForm.date}
                                onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                                className="w-full p-1 border rounded text-sm"
                              />
                            </td>
                            <td className="border p-1">
                              <input
                                type="text"
                                value={editForm.task}
                                onChange={(e) => setEditForm({ ...editForm, task: e.target.value })}
                                className="w-full p-1 border rounded text-sm"
                              />
                            </td>
                            <td className="border p-1">
                              <input
                                type="text"
                                value={editForm.description}
                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                className="w-full p-1 border rounded text-sm"
                              />
                            </td>
                            <td className="border p-1">
                              <input
                                type="number"
                                value={editForm.hours}
                                onChange={(e) => setEditForm({ ...editForm, hours: e.target.value })}
                                className="w-full p-1 border rounded text-sm text-right"
                                step="0.5"
                              />
                            </td>
                            <td className="border p-1 text-center print:hidden">
                              <button
                                onClick={handleEditSave}
                                className="text-green-600 hover:text-green-800 mr-2 text-sm"
                              >
                                ✓
                              </button>
                              <button
                                onClick={handleEditCancel}
                                className="text-gray-600 hover:text-gray-800 text-sm"
                              >
                                ✕
                              </button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="border p-2">{entry.date}</td>
                            <td className="border p-2">{entry.task}</td>
                            <td className="border p-2">{entry.description}</td>
                            <td className="border p-2 text-right">{entry.hours}</td>
                            <td className="border p-2 text-center print:hidden">
                              <button
                                onClick={() => handleEditStart(index)}
                                className="text-blue-600 hover:text-blue-800 mr-2 text-sm"
                              >
                                ✎
                              </button>
                              <button
                                onClick={() => handleDelete(index)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                ✕
                              </button>
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

          {/* Separate summary page that will only show at the end */}
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
                    {Object.entries(taskSummary).map(([task, hours], index) => (
                      <tr key={index}>
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
                      <td className="border p-2 text-right" style={{ width: "100px" }}>{totalHours}</td>
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

                {/* Comment section - hidden in print when empty */}
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

      {/* Improved print styles */}
      <style jsx global>{`
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          @page {
            size: A4;
            margin: 15mm 15mm 15mm 15mm;
          }

          /* Force page break before summary page */
          .summary-page {
            page-break-before: always;
          }

          /* Table settings */
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
          }
          thead {
            display: table-header-group;
          }
        }
      `}</style>

      {/* Note about browser headers/footers */}
      <p className="text-xs text-gray-400 mt-4 print:hidden">
        💡 Para quitar encabezados y pies de página del PDF: en el diálogo de impresión,
        busca "Más opciones" o "Configuración" y desmarca "Encabezados y pies de página".
      </p>
    </div>
  );
};

export default InvoiceGenerator;
