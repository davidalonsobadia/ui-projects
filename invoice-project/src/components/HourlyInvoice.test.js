import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Company settings come from Firestore via `useCompanySettings` and the invoice
// number is now allocated atomically via `allocateInvoiceNumber`. Both, plus the
// shared `db` and the auth context, are mocked so no real Firebase is touched.
//
// Note: variables referenced inside a jest.mock() factory must be prefixed with
// `mock` (Jest hoists the factory above the imports).
let mockCompany;
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

let mockAllocate;
jest.mock('../lib/firebase', () => ({ db: { __brand: 'db' } }));
jest.mock('../context/AuthProvider', () => ({ useAuth: () => ({ user: { uid: 'user-1' } }) }));
jest.mock('../lib/invoiceNumber', () => ({
  __esModule: true,
  allocateInvoiceNumber: (...args) => mockAllocate(...args),
  default: (...args) => mockAllocate(...args),
}));

import HourlyInvoice from './HourlyInvoice';

// Import one work entry so the print button becomes enabled.
const importWorkEntry = () => {
  fireEvent.change(screen.getByPlaceholderText(/Pega tus datos aquí/i), {
    target: { value: '7/11/2025, 5, Programacion, Bug' },
  });
  fireEvent.click(screen.getByText(/Importar Datos/i));
};

beforeEach(() => {
  mockCompany = undefined;
  localStorage.clear();
  mockAllocate = jest.fn().mockResolvedValue({ year: 2026, counter: 7 });
  window.print = jest.fn();
});

test('renders the paste area on first load', () => {
  render(<HourlyInvoice onBack={() => {}} />);
  expect(screen.getByText(/Pegar Datos de Trabajo/i)).toBeInTheDocument();
});

test('renders back button', () => {
  render(<HourlyInvoice onBack={() => {}} />);
  expect(screen.getByText(/Volver al inicio/i)).toBeInTheDocument();
});

test('renders invoice number field', () => {
  render(<HourlyInvoice onBack={() => {}} />);
  expect(screen.getByLabelText(/Nº Factura/i)).toBeInTheDocument();
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

test('printing allocates the next number atomically and renders it before printing', async () => {
  render(<HourlyInvoice onBack={() => {}} />);
  importWorkEntry();
  fireEvent.click(screen.getByText(/Imprimir\/Descargar PDF/i));

  await waitFor(() => expect(window.print).toHaveBeenCalled());
  expect(mockAllocate).toHaveBeenCalledWith({ __brand: 'db' }, 'user-1');
  // The definitive number replaces the provisional one in the field and print layout.
  expect(screen.getByLabelText(/Nº Factura/i)).toHaveValue('2026-0007');
  expect(screen.getByTestId('print-layout')).toHaveTextContent('Nº 2026-0007');
});

test('a manually overridden number is printed as-is and does not allocate', async () => {
  render(<HourlyInvoice onBack={() => {}} />);
  importWorkEntry();
  fireEvent.change(screen.getByLabelText(/Nº Factura/i), { target: { value: 'RECT-2026-0003' } });
  fireEvent.click(screen.getByText(/Imprimir\/Descargar PDF/i));

  await waitFor(() => expect(window.print).toHaveBeenCalled());
  expect(mockAllocate).not.toHaveBeenCalled();
  expect(screen.getByLabelText(/Nº Factura/i)).toHaveValue('RECT-2026-0003');
});
