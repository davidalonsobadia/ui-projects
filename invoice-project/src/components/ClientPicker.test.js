import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// The picker reads saved clients and adds new ones through `useClients` (the
// shared Firestore data layer). Mock the hook so no real Firebase is touched and
// we can assert the wiring: selecting a saved client, and the inline-add path.
//
// Note: variables referenced inside a jest.mock() factory must be prefixed with
// `mock` (Jest hoists the factory above the imports).
let mockClients;
let mockAddClient;
let mockLoading;

jest.mock('../hooks/useClients', () => ({
  __esModule: true,
  default: () => ({ clients: mockClients, loading: mockLoading, addClient: mockAddClient }),
}));

import ClientPicker from './ClientPicker';

const EMPTY = { nombre: '', nif: '', direccion: '' };

beforeEach(() => {
  mockClients = [
    { id: 'c1', nombre: 'Acme SL', nif: 'B123', direccion: 'Calle 1' },
    { id: 'c2', nombre: 'Globex', nif: 'B456', direccion: 'Calle 2' },
  ];
  mockAddClient = jest.fn(({ nombre, nif, direccion }) =>
    Promise.resolve({ id: 'new-id', nombre, nif, direccion }),
  );
  mockLoading = false;
});

test('lists the saved clients in the selector', () => {
  render(<ClientPicker value={EMPTY} onChange={() => {}} />);
  expect(screen.getByRole('option', { name: 'Acme SL' })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: 'Globex' })).toBeInTheDocument();
});

test('selecting a saved client calls onChange with its fields', () => {
  const onChange = jest.fn();
  render(<ClientPicker value={EMPTY} onChange={onChange} />);

  fireEvent.change(screen.getByLabelText(/Cliente/i), { target: { value: 'c2' } });

  expect(onChange).toHaveBeenCalledWith({ nombre: 'Globex', nif: 'B456', direccion: 'Calle 2' });
});

test('the inline add path persists the client and then selects it', async () => {
  const onChange = jest.fn();
  render(<ClientPicker value={EMPTY} onChange={onChange} />);

  fireEvent.click(screen.getByText(/Nuevo cliente/i));
  fireEvent.change(screen.getByLabelText(/Nombre \/ Empresa/i), { target: { value: 'Nueva SL' } });
  fireEvent.change(screen.getByLabelText(/NIF\/CIF/i), { target: { value: 'B789' } });
  fireEvent.change(screen.getByLabelText(/Dirección/i), { target: { value: 'Calle 3' } });
  fireEvent.click(screen.getByText(/Guardar cliente/i));

  await waitFor(() =>
    expect(mockAddClient).toHaveBeenCalledWith({ nombre: 'Nueva SL', nif: 'B789', direccion: 'Calle 3' }),
  );
  expect(onChange).toHaveBeenCalledWith({ nombre: 'Nueva SL', nif: 'B789', direccion: 'Calle 3' });
});

test('does not persist when the new client has no name', () => {
  render(<ClientPicker value={EMPTY} onChange={() => {}} />);

  fireEvent.click(screen.getByText(/Nuevo cliente/i));
  // Save button is disabled with an empty name, so a click is a no-op.
  fireEvent.click(screen.getByText(/Guardar cliente/i));

  expect(mockAddClient).not.toHaveBeenCalled();
});

test('shows the selected client fields passed via value', () => {
  render(
    <ClientPicker
      value={{ nombre: 'Acme SL', nif: 'B123', direccion: 'Calle 1' }}
      onChange={() => {}}
    />,
  );
  // `nif`/`direccion` are unique to the preview (the selector shows names only).
  expect(screen.getByText('B123')).toBeInTheDocument();
  expect(screen.getByText('Calle 1')).toBeInTheDocument();
});
