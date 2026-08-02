// Unit tests for the per-user company-settings hook. `firebase/firestore`, the
// shared `db` instance, and the auth context are mocked so no real Firebase is
// touched; we assert the wiring: the current user's doc is read, writes go
// through `setDoc`, and the legacy-localStorage migration seeds Firestore only
// when the doc is absent.
//
// Note: variables referenced inside a jest.mock() factory must be prefixed with
// `mock` (Jest hoists the factory above the imports).
let snapshotCallback = null;
const mockUnsubscribe = jest.fn();
const mockDoc = jest.fn((...segments) => ({ path: segments.slice(1).join('/') }));
const mockOnSnapshot = jest.fn((ref, cb) => {
  snapshotCallback = cb;
  return mockUnsubscribe;
});
const mockSetDoc = jest.fn(() => Promise.resolve());

let mockUser = { uid: 'user-1' };

jest.mock('firebase/firestore', () => ({
  doc: (...args) => mockDoc(...args),
  onSnapshot: (...args) => mockOnSnapshot(...args),
  setDoc: (...args) => mockSetDoc(...args),
}));
jest.mock('../lib/firebase', () => ({ db: { __brand: 'db' } }));
jest.mock('../context/AuthProvider', () => ({ useAuth: () => ({ user: mockUser }) }));

import { renderHook, act } from '@testing-library/react';
import useCompanySettings from './useCompanySettings';

const DEFAULT = { nombre: '', nif: '', direccion: '', email: '', telefono: '' };

const snapshot = (data) => ({
  exists: () => data !== null,
  data: () => data,
});

beforeEach(() => {
  // CRA's Jest preset resets mock implementations before each test; restore them.
  snapshotCallback = null;
  mockUser = { uid: 'user-1' };
  localStorage.clear();
  mockDoc.mockImplementation((...segments) => ({ path: segments.slice(1).join('/') }));
  mockOnSnapshot.mockImplementation((ref, cb) => {
    snapshotCallback = cb;
    return mockUnsubscribe;
  });
  mockSetDoc.mockImplementation(() => Promise.resolve());
});

test('subscribes to the current user\'s company doc and starts loading', () => {
  const { result } = renderHook(() => useCompanySettings(DEFAULT));
  expect(mockDoc).toHaveBeenCalledWith({ __brand: 'db' }, 'users', 'user-1', 'settings', 'company');
  expect(mockOnSnapshot).toHaveBeenCalledTimes(1);
  expect(result.current[2].loading).toBe(true);
});

test('exposes the stored doc data and clears loading once the snapshot resolves', () => {
  const { result } = renderHook(() => useCompanySettings(DEFAULT));
  const stored = { nombre: 'Acme SL', nif: 'B123', direccion: 'Calle 1', email: 'a@b.com', telefono: '' };
  act(() => snapshotCallback(snapshot(stored)));
  expect(result.current[0]).toEqual(stored);
  expect(result.current[2].loading).toBe(false);
});

test('setCompany writes the doc for the current user with merge', () => {
  const { result } = renderHook(() => useCompanySettings(DEFAULT));
  act(() => snapshotCallback(snapshot(DEFAULT)));
  const next = { ...DEFAULT, nombre: 'Mi Empresa' };
  act(() => { result.current[1](next); });
  expect(mockSetDoc).toHaveBeenCalledWith(
    expect.objectContaining({ path: 'users/user-1/settings/company' }),
    next,
    { merge: true },
  );
  expect(result.current[0]).toEqual(next);
});

test('migration seeds Firestore from localStorage when the doc is absent', () => {
  const legacy = { nombre: 'Legacy SL', nif: 'B999', direccion: 'Vieja 1', email: 'l@b.com', telefono: '' };
  localStorage.setItem('company_settings', JSON.stringify(legacy));
  const { result } = renderHook(() => useCompanySettings(DEFAULT));
  act(() => snapshotCallback(snapshot(null)));
  expect(result.current[0]).toEqual(legacy);
  expect(mockSetDoc).toHaveBeenCalledWith(
    expect.objectContaining({ path: 'users/user-1/settings/company' }),
    legacy,
    { merge: true },
  );
});

test('does not seed when the doc already exists', () => {
  const legacy = { nombre: 'Legacy SL', nif: 'B999', direccion: 'Vieja 1', email: 'l@b.com', telefono: '' };
  localStorage.setItem('company_settings', JSON.stringify(legacy));
  renderHook(() => useCompanySettings(DEFAULT));
  act(() => snapshotCallback(snapshot({ nombre: 'Firestore SL', nif: 'B1', direccion: 'x', email: 'x', telefono: '' })));
  expect(mockSetDoc).not.toHaveBeenCalled();
});

test('falls back to the default shape when neither doc nor legacy value exists', () => {
  const { result } = renderHook(() => useCompanySettings(DEFAULT));
  act(() => snapshotCallback(snapshot(null)));
  expect(result.current[0]).toEqual(DEFAULT);
  expect(mockSetDoc).not.toHaveBeenCalled();
  expect(result.current[2].loading).toBe(false);
});

test('unsubscribes from the snapshot listener on unmount', () => {
  const { unmount } = renderHook(() => useCompanySettings(DEFAULT));
  unmount();
  expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
});

test('without a signed-in user, returns the default and does not subscribe', () => {
  mockUser = null;
  const { result } = renderHook(() => useCompanySettings(DEFAULT));
  expect(mockOnSnapshot).not.toHaveBeenCalled();
  expect(result.current[0]).toEqual(DEFAULT);
  expect(result.current[2].loading).toBe(false);
});
