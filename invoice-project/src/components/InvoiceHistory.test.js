// InvoiceHistory tests. `useInvoices` is mocked so we can drive the loading
// state, an empty list, and a fixed list of invoices without a real Firestore.
const mockUseInvoices = jest.fn();
jest.mock('../hooks/useInvoices', () => ({
  __esModule: true,
  default: (...args) => mockUseInvoices(...args),
}));

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import InvoiceHistory from './InvoiceHistory';

const invoices = [
  {
    id: 'a',
    number: '2026-0002',
    type: 'services',
    issueDate: '2 de agosto de 2026',
    client: { nombre: 'Cliente Dos' },
    amounts: { base: 1000, iva: 210, total: 1210 },
  },
  {
    id: 'b',
    number: '2026-0001',
    type: 'hourly',
    issueDate: '1 de agosto de 2026',
    client: { nombre: 'Cliente Uno' },
    amounts: { base: 500, iva: 105, total: 605 },
  },
];

beforeEach(() => {
  mockUseInvoices.mockReset();
});

test('shows the loading state while invoices load', () => {
  mockUseInvoices.mockReturnValue({ invoices: [], loading: true });
  render(<InvoiceHistory onBack={() => {}} />);
  expect(screen.getByText(/Cargando facturas/i)).toBeInTheDocument();
});

test('shows the empty state when there are no invoices', () => {
  mockUseInvoices.mockReturnValue({ invoices: [], loading: false });
  render(<InvoiceHistory onBack={() => {}} />);
  expect(screen.getByText(/Todavía no tienes facturas guardadas/i)).toBeInTheDocument();
});

test('renders a row per invoice with number, type, date, client and total', () => {
  mockUseInvoices.mockReturnValue({ invoices, loading: false });
  render(<InvoiceHistory onBack={() => {}} />);

  expect(screen.getByText('2026-0002')).toBeInTheDocument();
  expect(screen.getByText('2026-0001')).toBeInTheDocument();
  expect(screen.getByText('Servicios')).toBeInTheDocument();
  expect(screen.getByText('Por horas')).toBeInTheDocument();
  expect(screen.getByText(/Cliente Dos/)).toBeInTheDocument();
  expect(screen.getByText(/2 de agosto de 2026/)).toBeInTheDocument();
  // Totals use the formatEUR pattern (thousands dot, comma decimals).
  expect(screen.getByText(/1\.210,00/)).toBeInTheDocument();
  expect(screen.getByText(/605,00/)).toBeInTheDocument();
});

test('calls onBack when the back control is clicked', () => {
  mockUseInvoices.mockReturnValue({ invoices: [], loading: false });
  const onBack = jest.fn();
  render(<InvoiceHistory onBack={onBack} />);
  fireEvent.click(screen.getByText(/Volver al inicio/i));
  expect(onBack).toHaveBeenCalledTimes(1);
});
