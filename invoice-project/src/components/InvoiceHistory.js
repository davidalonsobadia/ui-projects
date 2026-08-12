import React from 'react';
import { Card, CardContent } from './ui/card';
import useInvoices from '../hooks/useInvoices';

// Money formatter, matching the local `formatEUR` pattern used in the invoice
// forms (thousands dot, comma decimals; the `€` symbol is prefixed at the call
// site). Duplicated here rather than imported because it is a per-component
// helper in `HourlyInvoice.js`/`ServicesInvoice.js`, not a shared export.
const formatEUR = (num) => {
  const parts = (num || 0).toFixed(2).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return parts.join(',');
};

// Spanish labels for the stored invoice `type`.
const TYPE_LABELS = {
  hourly: 'Por horas',
  services: 'Servicios',
};

// Read-only, newest-first list of the signed-in user's saved invoices. Data
// comes from `useInvoices` (already ordered by `createdAt` desc). No edit,
// delete, reload, or re-print controls — this is an audit/reference view only.
const InvoiceHistory = ({ onBack }) => {
  const { invoices, loading } = useInvoices();

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Historial de facturas
          </h1>
          <button
            onClick={onBack}
            className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            Volver al inicio
          </button>
        </div>

        {loading ? (
          <p className="text-gray-500 text-center py-10">Cargando facturas…</p>
        ) : invoices.length === 0 ? (
          <p className="text-gray-500 text-center py-10">
            Todavía no tienes facturas guardadas.
          </p>
        ) : (
          <ul className="space-y-3">
            {invoices.map((invoice) => (
              <li key={invoice.id}>
                <Card>
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800">
                          {invoice.number}
                        </span>
                        <span className="text-xs text-gray-500 border rounded px-1.5 py-0.5">
                          {TYPE_LABELS[invoice.type] || invoice.type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1 truncate">
                        {invoice.client?.nombre || 'Sin cliente'} · {invoice.issueDate}
                      </p>
                    </div>
                    <div className="text-right font-semibold text-gray-800 whitespace-nowrap">
                      € {formatEUR(invoice.amounts?.total)}
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default InvoiceHistory;
