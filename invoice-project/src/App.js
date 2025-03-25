import React, { useRef, useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './components/ui/card';

const InvoiceGenerator = () => {
  // Parsed work data
  const workData = [
    { date: '26/02/2025', hours: 2, task: 'Diseño' },
    { date: '27/02/2025', hours: 2, task: 'Diseño' },
    { date: '28/02/2025', hours: 1, task: 'Diseño' },
    { date: '02/03/2025', hours: 1, task: 'Prototipo' },
    { date: '02/03/2025', hours: 1, task: 'Programacion' },
    { date: '02/03/2025', hours: 2, task: 'Prototipo' },
    { date: '03/03/2025', hours: 2, task: 'Prototipo' },
    { date: '05/03/2025', hours: 2, task: 'Prototipo' },
    { date: '06/03/2025', hours: 1, task: 'Documentacion' },
    { date: '10/03/2025', hours: 2, task: 'Prototipo' },
    { date: '10/03/2025', hours: 3, task: 'Programacion' },
    { date: '11/03/2025', hours: 2, task: 'Programacion' },
    { date: '11/03/2025', hours: 1, task: 'Programacion' },
    { date: '13/03/2025', hours: 3, task: 'Programacion' },
    { date: '14/03/2025', hours: 3, task: 'Programacion' },
    { date: '17/03/2025', hours: 2, task: 'Programacion' },
    { date: '20/03/2025', hours: 3, task: 'Programacion' },
    { date: '22/03/2025', hours: 3, task: 'Programacion' },
    { date: '24/03/2025', hours: 3, task: 'Programacion' }
  ];

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
        <button 
          onClick={handlePrint} 
          className="mb-4 bg-blue-500 text-white px-4 py-2 rounded print:hidden hover:bg-blue-600"
        >
          Imprimir/Descargar PDF
        </button>
        <p className="text-sm text-gray-500 mb-4 print:hidden">
          Para mejores resultados, seleccione "Guardar como PDF" en el diálogo de impresión. 
          <strong>Importante:</strong> Desactive las opciones de "Encabezados y pies de página" en la configuración de impresión.
        </p>

        <div id="invoice-content">
          <header className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Factura</h1>
            <p className="text-gray-600">Fecha: 25/03/2025</p>
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
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-left">Fecha</th>
                    <th className="border p-2 text-left">Tarea</th>
                    <th className="border p-2 text-right">Horas</th>
                  </tr>
                </thead>
                <tbody>
                  {workData.map((entry, index) => (
                    <tr key={index}>
                      <td className="border p-2">{entry.date}</td>
                      <td className="border p-2">{entry.task}</td>
                      <td className="border p-2 text-right">{entry.hours}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                      <td className="border p-2 text-right" style={{width: "100px"}}>{totalHours}</td>
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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Improved print styles */}
      <style jsx global>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          @page {
            size: auto;
            margin: 10mm;
          }
          
          /* Attempt to hide headers and footers */
          @page :first {
            margin-top: 0;
          }
          @page :left {
            margin-left: 0;
          }
          @page :right {
            margin-right: 0;
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
    </div>
  );
};

export default InvoiceGenerator;
