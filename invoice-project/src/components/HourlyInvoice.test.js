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
