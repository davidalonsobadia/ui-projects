import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

beforeEach(() => { localStorage.clear(); });

test('renders home screen by default', () => {
  render(<App />);
  expect(screen.getByText(/Generador de Facturas/i)).toBeInTheDocument();
});

test('navigates to hourly invoice', () => {
  render(<App />);
  fireEvent.click(screen.getByText(/Factura por Horas/i));
  expect(screen.getByText(/Pegar Datos de Trabajo/i)).toBeInTheDocument();
});

test('navigates to services invoice', () => {
  render(<App />);
  fireEvent.click(screen.getByText(/Factura de Servicios/i));
  expect(screen.getByText(/Añadir concepto/i)).toBeInTheDocument();
});

test('back button returns to home screen', () => {
  render(<App />);
  fireEvent.click(screen.getByText(/Factura de Servicios/i));
  fireEvent.click(screen.getByText(/Volver al inicio/i));
  expect(screen.getByText(/Generador de Facturas/i)).toBeInTheDocument();
});
