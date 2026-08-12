import React, { useState } from 'react';
import useClients from '../hooks/useClients';

// Client selector for the invoice forms. Controlled component: `value` is the
// invoice's current client `{ nombre, nif, direccion }` and `onChange` is called
// with that same shape whenever the user picks a saved client or adds a new one
// inline. Saved clients come from `useClients` (the shared Firestore data layer);
// this component never touches the Firestore SDK directly (see CLAUDE.md).
//
// User-facing copy is in Spanish per CLAUDE.md; code identifiers stay in English.

const EMPTY_DRAFT = { nombre: '', nif: '', direccion: '' };

const ClientPicker = ({ value, onChange }) => {
  const { clients, loading, addClient } = useClients();
  // Which saved client is currently selected in the dropdown. Kept locally so a
  // re-render from `value` alone does not reset the selection.
  const [selectedId, setSelectedId] = useState('');
  // Inline "add new client" state.
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSelect = (e) => {
    const id = e.target.value;
    setSelectedId(id);
    const chosen = clients.find((c) => c.id === id);
    if (chosen) {
      // Pass only the three fields the invoice forms and print layouts consume.
      onChange({ nombre: chosen.nombre, nif: chosen.nif, direccion: chosen.direccion });
    }
  };

  const startAdding = () => {
    setDraft(EMPTY_DRAFT);
    setError(null);
    setAdding(true);
  };

  const cancelAdding = () => {
    setAdding(false);
    setDraft(EMPTY_DRAFT);
    setError(null);
  };

  const handleConfirm = async () => {
    if (!draft.nombre.trim()) return;
    setSaving(true);
    setError(null);
    try {
      // Persist to the reusable clients collection, then select the new client
      // for the current invoice.
      const created = await addClient({
        nombre: draft.nombre,
        nif: draft.nif,
        direccion: draft.direccion,
      });
      setSelectedId(created.id);
      onChange({ nombre: created.nombre, nif: created.nif, direccion: created.direccion });
      setAdding(false);
      setDraft(EMPTY_DRAFT);
    } catch (err) {
      setError('No se pudo guardar el cliente. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const hasSelection = Boolean(value.nombre || value.nif || value.direccion);

  return (
    <div className="border border-slate-200 rounded-lg p-4 mb-6">
      <div className="font-semibold text-xs text-slate-500 uppercase tracking-wide mb-3">Datos del cliente</div>

      {adding ? (
        <div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="client-new-nombre" className="text-xs text-slate-400 block mb-1">Nombre / Empresa</label>
              <input id="client-new-nombre" value={draft.nombre} onChange={(e) => setDraft({ ...draft, nombre: e.target.value })} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label htmlFor="client-new-nif" className="text-xs text-slate-400 block mb-1">NIF/CIF</label>
              <input id="client-new-nif" value={draft.nif} onChange={(e) => setDraft({ ...draft, nif: e.target.value })} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" />
            </div>
            <div className="col-span-2">
              <label htmlFor="client-new-direccion" className="text-xs text-slate-400 block mb-1">Dirección</label>
              <input id="client-new-direccion" value={draft.direccion} onChange={(e) => setDraft({ ...draft, direccion: e.target.value })} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" />
            </div>
          </div>
          {error && <p role="alert" className="text-sm text-red-600 mt-2">{error}</p>}
          <div className="flex gap-2 mt-3">
            <button type="button" onClick={handleConfirm} disabled={!draft.nombre.trim() || saving} className="bg-blue-500 text-white px-4 py-1.5 rounded hover:bg-blue-600 disabled:bg-gray-300 text-sm">
              {saving ? 'Guardando…' : 'Guardar cliente'}
            </button>
            <button type="button" onClick={cancelAdding} className="bg-gray-100 text-gray-600 px-4 py-1.5 rounded hover:bg-gray-200 text-sm">
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label htmlFor="client-picker-select" className="text-xs text-slate-400 block mb-1">Cliente</label>
              <select
                id="client-picker-select"
                value={selectedId}
                onChange={handleSelect}
                disabled={loading}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm bg-white"
              >
                <option value="">{loading ? 'Cargando clientes…' : 'Selecciona un cliente…'}</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
            <button type="button" onClick={startAdding} className="text-blue-500 hover:text-blue-700 text-sm py-1.5">
              + Nuevo cliente
            </button>
          </div>

          {hasSelection && (
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <div className="text-xs text-slate-400 mb-1">Nombre / Empresa</div>
                <div className="text-sm">{value.nombre || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-1">NIF/CIF</div>
                <div className="text-sm">{value.nif || '—'}</div>
              </div>
              <div className="col-span-2">
                <div className="text-xs text-slate-400 mb-1">Dirección</div>
                <div className="text-sm">{value.direccion || '—'}</div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ClientPicker;
