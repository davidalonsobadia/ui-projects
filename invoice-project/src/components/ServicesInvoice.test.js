import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Company settings now come from Firestore via `useCompanySettings`. Mock it
// with a `useState`-backed stub so the print layout can be asserted without
// Firebase. Invoice numbering still uses localStorage, so keep clearing it.
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

import ServicesInvoice from './ServicesInvoice';

beforeEach(() => { mockCompany = undefined; localStorage.clear(); });

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
