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
