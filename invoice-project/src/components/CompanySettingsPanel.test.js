import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

import CompanySettingsPanel, { KOALVIA_DEFAULT } from './CompanySettingsPanel';

// `company` is now a controlled prop owned by the parent invoice screen (see
// CLAUDE.md / HourlyInvoice.js, ServicesInvoice.js) instead of a separate
// `useCompanySettings` call inside this panel, so tests render it the same
// way the invoice screens do: pass `company` in, assert what `onSave` gets.

test('opens in view mode with Koalvia defaults on first load', () => {
  render(<CompanySettingsPanel company={KOALVIA_DEFAULT} onSave={() => {}} />);
  expect(screen.getByText('Koalvia Technologies SL')).toBeInTheDocument();
  expect(screen.queryByLabelText(/Nombre \/ Empresa/i)).not.toBeInTheDocument();
});

test('shows the given company name in view mode', () => {
  const company = {
    nombre: 'Acme SL', nif: 'B123', direccion: 'Calle 1', email: 'a@b.com', telefono: ''
  };
  render(<CompanySettingsPanel company={company} onSave={() => {}} />);
  expect(screen.getByText('Acme SL')).toBeInTheDocument();
});

test('opens in edit mode when the company has no name yet', () => {
  const empty = { nombre: '', nif: '', direccion: '', email: '', telefono: '' };
  render(<CompanySettingsPanel company={empty} onSave={() => {}} />);
  expect(screen.getByLabelText(/Nombre \/ Empresa/i)).toBeInTheDocument();
});

test('clicking Editar switches to edit mode', () => {
  render(<CompanySettingsPanel company={KOALVIA_DEFAULT} onSave={() => {}} />);
  fireEvent.click(screen.getByText('Editar'));
  expect(screen.getByLabelText(/Nombre \/ Empresa/i)).toBeInTheDocument();
});

test('saving in edit mode calls onSave with the edited values', () => {
  const handleSave = jest.fn();
  render(<CompanySettingsPanel company={KOALVIA_DEFAULT} onSave={handleSave} />);
  fireEvent.click(screen.getByText('Editar'));
  fireEvent.change(screen.getByLabelText(/Nombre \/ Empresa/i), { target: { value: 'Mi Empresa' } });
  fireEvent.click(screen.getByText('Guardar'));
  expect(handleSave).toHaveBeenCalledWith(expect.objectContaining({ nombre: 'Mi Empresa' }));
});

// The panel is a controlled component: it displays whatever `company` prop it
// is given, and expects its owner to feed the saved value back down (exactly
// as HourlyInvoice.js/ServicesInvoice.js do via their own `useCompanySettings`
// state) — this wrapper exercises that full round trip.
test('saving in edit mode updates displayed values once the owner echoes them back', () => {
  const Wrapper = () => {
    const [company, setCompany] = React.useState(KOALVIA_DEFAULT);
    return <CompanySettingsPanel company={company} onSave={setCompany} />;
  };
  render(<Wrapper />);
  fireEvent.click(screen.getByText('Editar'));
  fireEvent.change(screen.getByLabelText(/Nombre \/ Empresa/i), { target: { value: 'Mi Empresa' } });
  fireEvent.click(screen.getByText('Guardar'));
  expect(screen.getByText('Mi Empresa')).toBeInTheDocument();
});
