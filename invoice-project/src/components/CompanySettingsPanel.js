import React, { useState } from 'react';

export const KOALVIA_DEFAULT = {
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

// `company` is owned by the parent invoice screen (a single `useCompanySettings`
// call there) and passed down, so this panel and the printed invoice always
// read the exact same value. This used to call `useCompanySettings` itself,
// which created a second, independent Firestore-backed state that could
// diverge from the print layout's — see the 2026-09-02 "company name missing
// on the printed invoice" incident, caused by exactly that divergence.
const CompanySettingsPanel = ({ company, onSave }) => {
  const [editing, setEditing] = useState(!company.nombre);
  const [draft, setDraft] = useState(company);

  const handleSave = () => {
    onSave?.(draft);
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
