import React from 'react';
import { render, screen } from '@testing-library/react';
import HourlyInvoice from './HourlyInvoice';

beforeEach(() => { localStorage.clear(); });

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
  localStorage.setItem('company_settings', JSON.stringify({
    nombre: 'Koalvia Technologies SL', nif: 'B26886952',
    direccion: 'c/ Arbúcies 17', email: 'david.alonso@koalvia.com', telefono: ''
  }));
  render(<HourlyInvoice onBack={() => {}} />);
  expect(screen.getByTestId('print-layout')).toBeInTheDocument();
  expect(screen.getByTestId('print-company-name')).toHaveTextContent('Koalvia Technologies SL');
});
