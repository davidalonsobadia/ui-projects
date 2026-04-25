import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ServicesInvoice from './ServicesInvoice';

beforeEach(() => { localStorage.clear(); });

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
  expect(screen.getByText('€ 1.000,00')).toBeInTheDocument();
  expect(screen.getByText('€ 210,00')).toBeInTheDocument();
  expect(screen.getByText('€ 1.210,00')).toBeInTheDocument();
});

test('renders back button', () => {
  render(<ServicesInvoice onBack={() => {}} />);
  expect(screen.getByText(/Volver al inicio/i)).toBeInTheDocument();
});
