import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import HomeScreen from './HomeScreen';

test('renders both invoice type cards', () => {
  render(<HomeScreen onSelect={() => {}} />);
  expect(screen.getByText(/Factura por Horas/i)).toBeInTheDocument();
  expect(screen.getByText(/Factura de Servicios/i)).toBeInTheDocument();
});

test('calls onSelect("hourly") when hourly card clicked', () => {
  const onSelect = jest.fn();
  render(<HomeScreen onSelect={onSelect} />);
  fireEvent.click(screen.getByText(/Factura por Horas/i));
  expect(onSelect).toHaveBeenCalledWith('hourly');
});

test('calls onSelect("services") when services card clicked', () => {
  const onSelect = jest.fn();
  render(<HomeScreen onSelect={onSelect} />);
  fireEvent.click(screen.getByText(/Factura de Servicios/i));
  expect(onSelect).toHaveBeenCalledWith('services');
});

test('calls onSelect("history") when the history entry point is clicked', () => {
  const onSelect = jest.fn();
  render(<HomeScreen onSelect={onSelect} />);
  fireEvent.click(screen.getByText(/Ver historial de facturas/i));
  expect(onSelect).toHaveBeenCalledWith('history');
});

test('renders a sign-out control and calls onSignOut when clicked', () => {
  const onSignOut = jest.fn();
  render(<HomeScreen onSelect={() => {}} onSignOut={onSignOut} />);
  fireEvent.click(screen.getByRole('button', { name: /Cerrar sesión/i }));
  expect(onSignOut).toHaveBeenCalledTimes(1);
});

test('omits the sign-out control when no onSignOut is provided', () => {
  render(<HomeScreen onSelect={() => {}} />);
  expect(screen.queryByRole('button', { name: /Cerrar sesión/i })).not.toBeInTheDocument();
});
