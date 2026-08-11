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

import ServicesInvoice from './ServicesInvoice';

// Fill a concept name so the print button becomes enabled.
const fillConcept = () => {
  fireEvent.change(screen.getByPlaceholderText(/Concepto/i), { target: { value: 'Consultoría' } });
};

beforeEach(() => {
  mockCompany = undefined;
  localStorage.clear();
  mockAllocate = jest.fn().mockResolvedValue({ year: 2026, counter: 7 });
  window.print = jest.fn();
});

test('renders one empty line item row on load', () => {
  render(<ServicesInvoice onBack={() => {}} />);
  const inputs = screen.getAllByPlaceholderText(/concepto/i);
  expect(inputs).toHaveLength(1);
});

test('adds a new row when "+ Añadir concepto" is clicked', () => {
  render(<ServicesInvoice onBack={() => {}} />);
  fireEvent.click(screen.getByText(/Añadir concepto/i));
  const inputs = screen.getAllByPlaceholderText(/concepto/i);
  expect(inputs).toHaveLength(2);
});

test('calculates totals correctly', () => {
  render(<ServicesInvoice onBack={() => {}} />);
  const priceInput = screen.getByPlaceholderText(/0\.00/i);
  fireEvent.change(priceInput, { target: { value: '1000' } });
  expect(screen.getAllByText('€ 1.000,00').length).toBeGreaterThan(0);
  expect(screen.getAllByText('€ 210,00').length).toBeGreaterThan(0);
  expect(screen.getAllByText('€ 1.210,00').length).toBeGreaterThan(0);
});

test('renders back button', () => {
  render(<ServicesInvoice onBack={() => {}} />);
  expect(screen.getByText(/Volver al inicio/i)).toBeInTheDocument();
});

test('print layout contains company name and FACTURA heading', () => {
  mockCompany = {
    nombre: 'Koalvia Technologies SL', nif: 'B26886952',
    direccion: 'c/ Arbúcies 17', email: 'david.alonso@koalvia.com', telefono: ''
  };
  render(<ServicesInvoice onBack={() => {}} />);
  expect(screen.getByTestId('print-layout')).toBeInTheDocument();
  expect(screen.getByTestId('print-company-name')).toHaveTextContent('Koalvia Technologies SL');
});

test('printing allocates the next number atomically and renders it before printing', async () => {
  render(<ServicesInvoice onBack={() => {}} />);
  fillConcept();
  fireEvent.click(screen.getByText(/Imprimir \/ Guardar PDF/i));

  await waitFor(() => expect(window.print).toHaveBeenCalled());
  expect(mockAllocate).toHaveBeenCalledWith({ __brand: 'db' }, 'user-1');
  expect(screen.getByLabelText(/Nº Factura/i)).toHaveValue('2026-0007');
  expect(screen.getByTestId('print-layout')).toHaveTextContent('Nº 2026-0007');
});

test('a manually overridden number is printed as-is and does not allocate', async () => {
  render(<ServicesInvoice onBack={() => {}} />);
  fillConcept();
  fireEvent.change(screen.getByLabelText(/Nº Factura/i), { target: { value: 'RECT-2026-0003' } });
  fireEvent.click(screen.getByText(/Imprimir \/ Guardar PDF/i));

  await waitFor(() => expect(window.print).toHaveBeenCalled());
  expect(mockAllocate).not.toHaveBeenCalled();
  expect(screen.getByLabelText(/Nº Factura/i)).toHaveValue('RECT-2026-0003');
});
