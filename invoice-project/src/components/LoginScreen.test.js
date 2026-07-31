// Unit tests for the login screen. The auth context is mocked so we can drive
// `signIn` outcomes directly without a real Firebase app.
//
// Note: variables referenced inside a jest.mock() factory must be prefixed with
// `mock` (Jest hoists the factory above the imports).
const mockSignIn = jest.fn();
jest.mock('../context/AuthProvider', () => ({
  useAuth: () => ({ signIn: mockSignIn }),
}));

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import LoginScreen from './LoginScreen';

beforeEach(() => {
  mockSignIn.mockReset();
});

const fillCredentials = (email, password) => {
  fireEvent.change(screen.getByLabelText(/Correo electrónico/i), {
    target: { value: email },
  });
  fireEvent.change(screen.getByLabelText(/Contraseña/i), {
    target: { value: password },
  });
};

test('renders email and password fields and a submit button', () => {
  render(<LoginScreen />);
  expect(screen.getByLabelText(/Correo electrónico/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/Contraseña/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Iniciar sesión/i })).toBeInTheDocument();
});

test('submitting calls signIn with the entered email and password', async () => {
  mockSignIn.mockResolvedValue({});
  render(<LoginScreen />);
  fillCredentials('user@example.com', 'secret');
  fireEvent.click(screen.getByRole('button', { name: /Iniciar sesión/i }));
  await waitFor(() =>
    expect(mockSignIn).toHaveBeenCalledWith('user@example.com', 'secret'),
  );
});

test('shows a Spanish error message when sign-in fails', async () => {
  mockSignIn.mockRejectedValue(new Error('auth/wrong-password'));
  render(<LoginScreen />);
  fillCredentials('user@example.com', 'wrong');
  fireEvent.click(screen.getByRole('button', { name: /Iniciar sesión/i }));
  expect(await screen.findByRole('alert')).toHaveTextContent(/incorrectos/i);
});

test('keeps the user on the login screen after a failed sign-in', async () => {
  mockSignIn.mockRejectedValue(new Error('auth/wrong-password'));
  render(<LoginScreen />);
  fillCredentials('user@example.com', 'wrong');
  fireEvent.click(screen.getByRole('button', { name: /Iniciar sesión/i }));
  await screen.findByRole('alert');
  expect(screen.getByRole('button', { name: /Iniciar sesión/i })).toBeInTheDocument();
});

test('disables the submit button and shows a loading label while signing in', async () => {
  let resolveSignIn;
  mockSignIn.mockReturnValue(
    new Promise((resolve) => {
      resolveSignIn = resolve;
    }),
  );
  render(<LoginScreen />);
  fillCredentials('user@example.com', 'secret');
  fireEvent.click(screen.getByRole('button', { name: /Iniciar sesión/i }));

  const button = screen.getByRole('button', { name: /Iniciando sesión/i });
  expect(button).toBeDisabled();

  await act(async () => {
    resolveSignIn({});
  });
});
