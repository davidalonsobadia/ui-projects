import React from 'react';
import { render, screen } from '@testing-library/react';

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

import HourlyInvoice from './HourlyInvoice';

beforeEach(() => { mockCompany = undefined; localStorage.clear(); });

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
