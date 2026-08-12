// App tests. `firebase/auth` and the shared `auth` instance are mocked so we can
// drive the auth state (loading / signed-out / signed-in) and assert the gate
// around the existing view-switcher.
//
// Note: variables referenced inside a jest.mock() factory must be prefixed with
// `mock` (Jest hoists the factory above the imports).
let authStateCallback = null;
const mockUnsubscribe = jest.fn();
const mockOnAuthStateChanged = jest.fn();
const mockSignInWithEmailAndPassword = jest.fn();
const mockSignOut = jest.fn();
// The invoice screens read company settings from Firestore via
// `useCompanySettings`; mock `firebase/firestore` (and expose `db`) so those
// screens render without a real Firestore. `onSnapshot` never fires here, so
// the forms fall back to their default company shape — enough for navigation.
// The invoice screens also mount the client picker, which reads clients from
// Firestore via `useClients` (`collection` + `addDoc`). Stub those too so the
// forms render; `onSnapshot` never fires, so the client list stays empty.
const mockDoc = jest.fn(() => ({}));
const mockCollection = jest.fn(() => ({}));
const mockOnSnapshot = jest.fn(() => jest.fn());
const mockSetDoc = jest.fn(() => Promise.resolve());
const mockAddDoc = jest.fn(() => Promise.resolve({ id: 'new-id' }));

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: (...args) => mockOnAuthStateChanged(...args),
  signInWithEmailAndPassword: (...args) => mockSignInWithEmailAndPassword(...args),
  signOut: (...args) => mockSignOut(...args),
}));
jest.mock('firebase/firestore', () => ({
  doc: (...args) => mockDoc(...args),
  collection: (...args) => mockCollection(...args),
  onSnapshot: (...args) => mockOnSnapshot(...args),
  setDoc: (...args) => mockSetDoc(...args),
  addDoc: (...args) => mockAddDoc(...args),
}));
jest.mock('./lib/firebase', () => ({ auth: { __brand: 'auth' }, db: { __brand: 'db' } }));

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { auth as mockAuth } from './lib/firebase';
import App from './App';
import { AuthProvider } from './context/AuthProvider';

const renderApp = () =>
  render(
    <AuthProvider>
      <App />
    </AuthProvider>,
  );

// Drive the auth listener to report a given user (or null for signed-out).
const resolveAuth = (user) => {
  act(() => authStateCallback(user));
};

beforeEach(() => {
  localStorage.clear();
  authStateCallback = null;
  // CRA's Jest preset resets mock implementations before each test; restore them.
  mockOnAuthStateChanged.mockImplementation((authInstance, cb) => {
    authStateCallback = cb;
    return mockUnsubscribe;
  });
  mockSignInWithEmailAndPassword.mockResolvedValue({});
  mockSignOut.mockResolvedValue();
  mockDoc.mockImplementation(() => ({}));
  mockCollection.mockImplementation(() => ({}));
  mockOnSnapshot.mockImplementation(() => jest.fn());
  mockSetDoc.mockImplementation(() => Promise.resolve());
  mockAddDoc.mockImplementation(() => Promise.resolve({ id: 'new-id' }));
});

test('shows a loading state until auth resolves', () => {
  renderApp();
  expect(screen.getByText(/Cargando/i)).toBeInTheDocument();
});

test('shows the login screen when no user is signed in', () => {
  renderApp();
  resolveAuth(null);
  expect(screen.getByRole('button', { name: /Iniciar sesión/i })).toBeInTheDocument();
});

test('renders the home screen once a user is signed in', () => {
  renderApp();
  resolveAuth({ uid: 'user-1' });
  expect(screen.getByText(/Generador de Facturas/i)).toBeInTheDocument();
  expect(screen.getByText(/Factura por Horas/i)).toBeInTheDocument();
});

test('navigates to hourly invoice when signed in', () => {
  renderApp();
  resolveAuth({ uid: 'user-1' });
  fireEvent.click(screen.getByText(/Factura por Horas/i));
  expect(screen.getByText(/Pegar Datos de Trabajo/i)).toBeInTheDocument();
});

test('navigates to services invoice when signed in', () => {
  renderApp();
  resolveAuth({ uid: 'user-1' });
  fireEvent.click(screen.getByText(/Factura de Servicios/i));
  expect(screen.getByText(/Añadir concepto/i)).toBeInTheDocument();
});

test('back button returns to home screen', () => {
  renderApp();
  resolveAuth({ uid: 'user-1' });
  fireEvent.click(screen.getByText(/Factura de Servicios/i));
  fireEvent.click(screen.getByText(/Volver al inicio/i));
  expect(screen.getByText(/Generador de Facturas/i)).toBeInTheDocument();
});

test('signing out returns the user to the login screen', () => {
  renderApp();
  resolveAuth({ uid: 'user-1' });
  fireEvent.click(screen.getByRole('button', { name: /Cerrar sesión/i }));
  expect(mockSignOut).toHaveBeenCalledWith(mockAuth);
  // Firebase would then fire onAuthStateChanged(null); simulate that.
  resolveAuth(null);
  expect(screen.getByRole('button', { name: /Iniciar sesión/i })).toBeInTheDocument();
});
