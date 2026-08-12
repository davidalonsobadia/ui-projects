import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Company settings come from Firestore via `useCompanySettings`; invoice numbers
// are now allocated atomically via `allocateInvoiceNumber` (a Firestore
// transaction). Mock the hook, the auth context, the shared `db`, and the
// allocator so the component can be exercised without touching Firebase.
//
// Note: variables referenced inside a jest.mock() factory must be prefixed with
// `mock` (Jest hoists the factory above the imports).
let mockCompany;
let mockAllocate;
let mockUser;

jest.mock('../hooks/useCompanySettings', () => {
  const ReactModule = require('react');
  return {
    __esModule: true,
    default: (defaultValue) => {
      const [company, setCompany] = ReactModule.useState(
        mockCompany !== undefined ? mockCompany : defaultValue,
      );
      return [company, setCompany, { loading: false }];
    },
  };
});
jest.mock('../lib/firebase', () => ({ db: { __brand: 'db' } }));
jest.mock('../context/AuthProvider', () => ({ useAuth: () => ({ user: mockUser }) }));
jest.mock('../lib/invoiceNumber', () => ({
  allocateInvoiceNumber: (...args) => mockAllocate(...args),
}));

import HourlyInvoice from './HourlyInvoice';

const YEAR = new Date().getFullYear();

beforeEach(() => {
  mockCompany = undefined;
  mockUser = { uid: 'user-1' };
  mockAllocate = jest.fn(() => Promise.resolve({ year: YEAR, counter: 7 }));
  window.print = jest.fn();
  localStorage.clear();
});

// Add a work entry so the print button is enabled.
const addWork = () => {
  fireEvent.change(screen.getByPlaceholderText(/Pega tus datos aquí/i), {
    target: { value: '7/11/2025, 5, Programacion, Bug' },
  });
  fireEvent.click(screen.getByText(/Importar Datos/i));
};

test('renders the paste area on first load', () => {
  render(<HourlyInvoice onBack={() => {}} />);
  expect(screen.getByText(/Pegar Datos de Trabajo/i)).toBeInTheDocument();
});

test('renders back button', () => {
  render(<HourlyInvoice onBack={() => {}} />);
  expect(screen.getByText(/Volver al inicio/i)).toBeInTheDocument();
});

test('renders invoice number field with a provisional hint', () => {
  render(<HourlyInvoice onBack={() => {}} />);
  expect(screen.getByLabelText(/Nº Factura/i)).toBeInTheDocument();
  expect(screen.getByText(/se asignará al imprimir/i)).toBeInTheDocument();
});

test('print layout contains company name and FACTURA heading', () => {
  mockCompany = {
    nombre: 'Koalvia Technologies SL', nif: 'B26886952',
    direccion: 'c/ Arbúcies 17', email: 'david.alonso@koalvia.com', telefono: ''
  };
  render(<HourlyInvoice onBack={() => {}} />);
  expect(screen.getByTestId('print-layout')).toBeInTheDocument();
  expect(screen.getByTestId('print-company-name')).toHaveTextContent('Koalvia Technologies SL');
});

test('printing allocates a number atomically and shows the formatted result', async () => {
  render(<HourlyInvoice onBack={() => {}} />);
  addWork();
  fireEvent.click(screen.getByText(/Imprimir\/Descargar PDF/i));

  await waitFor(() => expect(window.print).toHaveBeenCalled());
  expect(mockAllocate).toHaveBeenCalledWith({ __brand: 'db' }, 'user-1');
  expect(screen.getByLabelText(/Nº Factura/i)).toHaveValue(`${YEAR}-0007`);
});

test('a manually overridden number is printed as-is without allocating', async () => {
  render(<HourlyInvoice onBack={() => {}} />);
  addWork();
  fireEvent.change(screen.getByLabelText(/Nº Factura/i), { target: { value: '2024-0123' } });
  fireEvent.click(screen.getByText(/Imprimir\/Descargar PDF/i));

  await waitFor(() => expect(window.print).toHaveBeenCalled());
  expect(mockAllocate).not.toHaveBeenCalled();
  expect(screen.getByLabelText(/Nº Factura/i)).toHaveValue('2024-0123');
});

test('shows a Spanish error and does not print when allocation fails', async () => {
  mockAllocate = jest.fn(() => Promise.reject(new Error('offline')));
  render(<HourlyInvoice onBack={() => {}} />);
  addWork();
  fireEvent.click(screen.getByText(/Imprimir\/Descargar PDF/i));

  await waitFor(() =>
    expect(screen.getByRole('alert')).toHaveTextContent(/No se pudo asignar el número de factura/i),
  );
  expect(window.print).not.toHaveBeenCalled();
});

test('a double-click allocates only one number and opens one print dialog', async () => {
  // Allocation only resolves once we release it, so both clicks land while the
  // first is still in flight.
  let release;
  mockAllocate = jest.fn(
    () => new Promise((resolve) => { release = () => resolve({ year: YEAR, counter: 7 }); }),
  );
  render(<HourlyInvoice onBack={() => {}} />);
  addWork();
  const button = screen.getByText(/Imprimir\/Descargar PDF/i);
  fireEvent.click(button);
  fireEvent.click(button);
  release();

  await waitFor(() => expect(window.print).toHaveBeenCalledTimes(1));
  expect(mockAllocate).toHaveBeenCalledTimes(1);
});
