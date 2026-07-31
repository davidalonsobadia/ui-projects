import React from 'react';

const HomeScreen = ({ onSelect, onSignOut }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
    <div className="max-w-2xl w-full">
      {onSignOut && (
        <div className="flex justify-end mb-4">
          <button
            onClick={onSignOut}
            className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      )}
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
