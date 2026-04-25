import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CompanySettingsPanel from './CompanySettingsPanel';

beforeEach(() => { localStorage.clear(); });

test('opens in edit mode when no company data is saved', () => {
  render(<CompanySettingsPanel />);
  expect(screen.getByLabelText(/Nombre \/ Empresa/i)).toBeInTheDocument();
});

test('shows saved company name in view mode', () => {
  localStorage.setItem('company_settings', JSON.stringify({
    nombre: 'Acme SL', nif: 'B123', direccion: 'Calle 1', email: 'a@b.com', telefono: ''
  }));
  render(<CompanySettingsPanel />);
  expect(screen.getByText('Acme SL')).toBeInTheDocument();
});

test('clicking Editar switches to edit mode', () => {
  localStorage.setItem('company_settings', JSON.stringify({
    nombre: 'Acme SL', nif: '', direccion: '', email: '', telefono: ''
  }));
  render(<CompanySettingsPanel />);
  fireEvent.click(screen.getByText('Editar'));
  expect(screen.getByLabelText(/Nombre \/ Empresa/i)).toBeInTheDocument();
});

test('saving in edit mode updates displayed values', () => {
  render(<CompanySettingsPanel />);
  fireEvent.change(screen.getByLabelText(/Nombre \/ Empresa/i), { target: { value: 'Mi Empresa' } });
  fireEvent.click(screen.getByText('Guardar'));
  expect(screen.getByText('Mi Empresa')).toBeInTheDocument();
});
