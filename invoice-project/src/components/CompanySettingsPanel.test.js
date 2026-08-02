import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Company settings now come from Firestore via `useCompanySettings` instead of
// localStorage. The hook is mocked with a `useState`-backed stub so the panel's
// save/display behavior can be asserted without touching Firebase. Set
// `mockInitialCompany` before render to control the initial value the hook
// returns; otherwise it echoes the default the component passes in.
//
// Note: variables referenced inside a jest.mock() factory must be prefixed with
// `mock` (Jest hoists the factory above the imports).
let mockInitialCompany;
jest.mock('../hooks/useCompanySettings', () => {
  const ReactModule = require('react');
  return {
    __esModule: true,
    default: (defaultValue) => {
      const [company, setCompany] = ReactModule.useState(
        mockInitialCompany !== undefined ? mockInitialCompany : defaultValue,
      );
      return [company, setCompany, { loading: false }];
    },
  };
});

import CompanySettingsPanel from './CompanySettingsPanel';

beforeEach(() => { mockInitialCompany = undefined; });

test('opens in view mode with Koalvia defaults on first load', () => {
  render(<CompanySettingsPanel />);
  expect(screen.getByText('Koalvia Technologies SL')).toBeInTheDocument();
  expect(screen.queryByLabelText(/Nombre \/ Empresa/i)).not.toBeInTheDocument();
});

test('shows saved company name in view mode', () => {
  mockInitialCompany = {
    nombre: 'Acme SL', nif: 'B123', direccion: 'Calle 1', email: 'a@b.com', telefono: ''
  };
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
