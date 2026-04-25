import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CompanySettingsPanel from './CompanySettingsPanel';

beforeEach(() => { localStorage.clear(); });

test('opens in view mode with Koalvia defaults on first load', () => {
  render(<CompanySettingsPanel />);
  expect(screen.getByText('Koalvia Technologies SL')).toBeInTheDocument();
  expect(screen.queryByLabelText(/Nombre \/ Empresa/i)).not.toBeInTheDocument();
});

test('shows saved company name in view mode', () => {
  localStorage.setItem('company_settings', JSON.stringify({
    nombre: 'Acme SL', nif: 'B123', direccion: 'Calle 1', email: 'a@b.com', telefono: ''
  }));
  render(<CompanySettingsPanel />);
  expect(screen.getByText('Acme SL')).toBeInTheDocument();
});

test('clicking Editar switches to edit mode', () => {
  render(<CompanySettingsPanel />);
  fireEvent.click(screen.getByText('Editar'));
  expect(screen.getByLabelText(/Nombre \/ Empresa/i)).toBeInTheDocument();
});

test('saving in edit mode updates displayed values', () => {
  render(<CompanySettingsPanel />);
  fireEvent.click(screen.getByText('Editar'));
  fireEvent.change(screen.getByLabelText(/Nombre \/ Empresa/i), { target: { value: 'Mi Empresa' } });
  fireEvent.click(screen.getByText('Guardar'));
  expect(screen.getByText('Mi Empresa')).toBeInTheDocument();
});
