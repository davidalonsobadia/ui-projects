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

import ServicesInvoice from './ServicesInvoice';

const YEAR = new Date().getFullYear();

beforeEach(() => {
  mockCompany = undefined;
  mockUser = { uid: 'user-1' };
  mockAllocate = jest.fn(() => Promise.resolve({ year: YEAR, counter: 7 }));
  window.print = jest.fn();
  localStorage.clear();
});

// Fill in a concept so the print button is enabled.
const addConcept = () => {
  fireEvent.change(screen.getByPlaceholderText(/concepto/i), { target: { value: 'Consultoría' } });
};

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

test('renders a provisional invoice-number hint', () => {
  render(<ServicesInvoice onBack={() => {}} />);
  expect(screen.getByText(/se asignará al imprimir/i)).toBeInTheDocument();
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

test('printing allocates a number atomically and shows the formatted result', async () => {
  render(<ServicesInvoice onBack={() => {}} />);
  addConcept();
  fireEvent.click(screen.getByText(/Imprimir \/ Guardar PDF/i));

  await waitFor(() => expect(window.print).toHaveBeenCalled());
  expect(mockAllocate).toHaveBeenCalledWith({ __brand: 'db' }, 'user-1');
  expect(screen.getByLabelText(/Nº Factura/i)).toHaveValue(`${YEAR}-0007`);
});

test('a manually overridden number is printed as-is without allocating', async () => {
  render(<ServicesInvoice onBack={() => {}} />);
  addConcept();
  fireEvent.change(screen.getByLabelText(/Nº Factura/i), { target: { value: '2024-0123' } });
  fireEvent.click(screen.getByText(/Imprimir \/ Guardar PDF/i));

  await waitFor(() => expect(window.print).toHaveBeenCalled());
  expect(mockAllocate).not.toHaveBeenCalled();
  expect(screen.getByLabelText(/Nº Factura/i)).toHaveValue('2024-0123');
});

test('shows a Spanish error and does not print when allocation fails', async () => {
  mockAllocate = jest.fn(() => Promise.reject(new Error('offline')));
  render(<ServicesInvoice onBack={() => {}} />);
  addConcept();
  fireEvent.click(screen.getByText(/Imprimir \/ Guardar PDF/i));

  await waitFor(() =>
    expect(screen.getByRole('alert')).toHaveTextContent(/No se pudo asignar el número de factura/i),
  );
  expect(window.print).not.toHaveBeenCalled();
});

test('a double-click allocates only one number and opens one print dialog', async () => {
  let release;
  mockAllocate = jest.fn(
    () => new Promise((resolve) => { release = () => resolve({ year: YEAR, counter: 7 }); }),
  );
  render(<ServicesInvoice onBack={() => {}} />);
  addConcept();
  const button = screen.getByText(/Imprimir \/ Guardar PDF/i);
  fireEvent.click(button);
  fireEvent.click(button);
  release();

  await waitFor(() => expect(window.print).toHaveBeenCalledTimes(1));
  expect(mockAllocate).toHaveBeenCalledTimes(1);
});
