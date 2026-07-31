// Unit tests for the auth context. `firebase/auth` and the shared `auth`
// instance from `src/lib/firebase` are mocked so no real Firebase app is
// created; we only assert the provider wiring and exposed API.
//
// Note: variables referenced inside a jest.mock() factory must be prefixed with
// `mock` (Jest hoists the factory above the imports).
let authStateCallback = null;
const mockUnsubscribe = jest.fn();
const mockOnAuthStateChanged = jest.fn();
const mockSignInWithEmailAndPassword = jest.fn();
const mockSignOut = jest.fn();

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: (...args) => mockOnAuthStateChanged(...args),
  signInWithEmailAndPassword: (...args) => mockSignInWithEmailAndPassword(...args),
  signOut: (...args) => mockSignOut(...args),
}));
jest.mock('../lib/firebase', () => ({ auth: { __brand: 'auth' } }));

import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { auth as mockAuth } from '../lib/firebase';
import { AuthProvider, useAuth } from './AuthProvider';

const Consumer = () => {
  const { user, loading, signIn, signOut } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="user">{user ? user.uid : 'none'}</span>
      <button onClick={() => signIn('user@example.com', 'secret')}>signin</button>
      <button onClick={() => signOut()}>signout</button>
    </div>
  );
};

beforeEach(() => {
  // CRA's Jest preset resets mock implementations before each test; restore them.
  authStateCallback = null;
  mockOnAuthStateChanged.mockImplementation((authInstance, cb) => {
    authStateCallback = cb;
    return mockUnsubscribe;
  });
  mockSignInWithEmailAndPassword.mockResolvedValue({});
  mockSignOut.mockResolvedValue();
});

test('subscribes to auth state and starts in a loading state', () => {
  render(
    <AuthProvider>
      <Consumer />
    </AuthProvider>,
  );
  expect(mockOnAuthStateChanged).toHaveBeenCalledWith(mockAuth, expect.any(Function));
  expect(screen.getByTestId('loading')).toHaveTextContent('true');
  expect(screen.getByTestId('user')).toHaveTextContent('none');
});

test('exposes the signed-in user and clears loading once auth resolves', () => {
  render(
    <AuthProvider>
      <Consumer />
    </AuthProvider>,
  );
  act(() => authStateCallback({ uid: 'user-1' }));
  expect(screen.getByTestId('loading')).toHaveTextContent('false');
  expect(screen.getByTestId('user')).toHaveTextContent('user-1');
});

test('clears loading with no user when signed out', () => {
  render(
    <AuthProvider>
      <Consumer />
    </AuthProvider>,
  );
  act(() => authStateCallback(null));
  expect(screen.getByTestId('loading')).toHaveTextContent('false');
  expect(screen.getByTestId('user')).toHaveTextContent('none');
});

test('signIn delegates to signInWithEmailAndPassword with the shared auth', () => {
  render(
    <AuthProvider>
      <Consumer />
    </AuthProvider>,
  );
  fireEvent.click(screen.getByText('signin'));
  expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
    mockAuth,
    'user@example.com',
    'secret',
  );
});

test('signOut delegates to firebase signOut with the shared auth', () => {
  render(
    <AuthProvider>
      <Consumer />
    </AuthProvider>,
  );
  fireEvent.click(screen.getByText('signout'));
  expect(mockSignOut).toHaveBeenCalledWith(mockAuth);
});

test('unsubscribes from the auth listener on unmount', () => {
  const { unmount } = render(
    <AuthProvider>
      <Consumer />
    </AuthProvider>,
  );
  unmount();
  expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
});

test('useAuth throws when used outside an AuthProvider', () => {
  const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
  expect(() => render(<Consumer />)).toThrow(/useAuth must be used within an AuthProvider/);
  spy.mockRestore();
});
