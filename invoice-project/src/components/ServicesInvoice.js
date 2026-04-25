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
                  <td className="p-2 text-right border border-t-2 border-t-gray-400">TOTAL</td>
                  <td className="p-2 text-right border border-t-2 border-t-gray-400 text-lg">€ {formatEUR(total)}</td>
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
