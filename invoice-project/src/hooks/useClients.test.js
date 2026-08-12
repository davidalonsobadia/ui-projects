// Unit tests for the per-user clients hook. `firebase/firestore`, the shared
// `db` instance, and the auth context are mocked so no real Firebase is
// touched; we assert the wiring: the current user's `clients` collection is
// read, `addClient` writes through `addDoc` and resolves with the new id, and
// two different users never share a subscription path.
//
// Note: variables referenced inside a jest.mock() factory must be prefixed with
// `mock` (Jest hoists the factory above the imports).
let snapshotCallback = null;
const mockUnsubscribe = jest.fn();
const mockCollection = jest.fn((...segments) => ({ path: segments.slice(1).join('/') }));
const mockOnSnapshot = jest.fn((ref, cb) => {
  snapshotCallback = cb;
  return mockUnsubscribe;
});
const mockAddDoc = jest.fn(() => Promise.resolve({ id: 'new-id' }));

let mockUser = { uid: 'user-1' };

jest.mock('firebase/firestore', () => ({
  collection: (...args) => mockCollection(...args),
  onSnapshot: (...args) => mockOnSnapshot(...args),
  addDoc: (...args) => mockAddDoc(...args),
}));
jest.mock('../lib/firebase', () => ({ db: { __brand: 'db' } }));
jest.mock('../context/AuthProvider', () => ({ useAuth: () => ({ user: mockUser }) }));

import { renderHook, act } from '@testing-library/react';
import useClients from './useClients';

// Build a Firestore query-snapshot stand-in from plain `{ id, ...data }` rows.
const snapshot = (rows) => ({
  docs: rows.map(({ id, ...data }) => ({ id, data: () => data })),
});

beforeEach(() => {
  // CRA's Jest preset resets mock implementations before each test; restore them.
  snapshotCallback = null;
  mockUser = { uid: 'user-1' };
  mockCollection.mockImplementation((...segments) => ({ path: segments.slice(1).join('/') }));
  mockOnSnapshot.mockImplementation((ref, cb) => {
    snapshotCallback = cb;
    return mockUnsubscribe;
  });
  mockAddDoc.mockImplementation(() => Promise.resolve({ id: 'new-id' }));
});

test('subscribes to the current user\'s clients collection and starts loading', () => {
  const { result } = renderHook(() => useClients());
  expect(mockCollection).toHaveBeenCalledWith({ __brand: 'db' }, 'users', 'user-1', 'clients');
  expect(mockOnSnapshot).toHaveBeenCalledTimes(1);
  expect(result.current.loading).toBe(true);
  expect(result.current.clients).toEqual([]);
});

test('maps the snapshot to `{ id, nombre, nif, direccion }[]` and clears loading', () => {
  const { result } = renderHook(() => useClients());
  act(() =>
    snapshotCallback(
      snapshot([
        { id: 'c1', nombre: 'Acme SL', nif: 'B123', direccion: 'Calle 1' },
        { id: 'c2', nombre: 'Globex', nif: 'B456', direccion: 'Calle 2' },
      ]),
    ),
  );
  expect(result.current.clients).toEqual([
    { id: 'c1', nombre: 'Acme SL', nif: 'B123', direccion: 'Calle 1' },
    { id: 'c2', nombre: 'Globex', nif: 'B456', direccion: 'Calle 2' },
  ]);
  expect(result.current.loading).toBe(false);
});

test('addClient writes the client fields via addDoc and resolves with the new id', async () => {
  const { result } = renderHook(() => useClients());
  act(() => snapshotCallback(snapshot([])));

  const input = { nombre: 'Nueva SL', nif: 'B789', direccion: 'Calle 3' };
  let created;
  await act(async () => {
    created = await result.current.addClient(input);
  });

  expect(mockAddDoc).toHaveBeenCalledWith(
    expect.objectContaining({ path: 'users/user-1/clients' }),
    input,
  );
  expect(created).toEqual({ id: 'new-id', ...input });
});

test('addClient only persists the client fields, ignoring extras', async () => {
  const { result } = renderHook(() => useClients());
  act(() => snapshotCallback(snapshot([])));

  await act(async () => {
    await result.current.addClient({
      nombre: 'Solo Campos',
      nif: 'B111',
      direccion: 'Calle 4',
      id: 'should-be-ignored',
      extra: 'nope',
    });
  });

  expect(mockAddDoc).toHaveBeenCalledWith(expect.anything(), {
    nombre: 'Solo Campos',
    nif: 'B111',
    direccion: 'Calle 4',
  });
});

test('two different users subscribe to independent client paths', () => {
  const { rerender } = renderHook(() => useClients());
  expect(mockCollection).toHaveBeenCalledWith({ __brand: 'db' }, 'users', 'user-1', 'clients');

  mockUser = { uid: 'user-2' };
  rerender();
  expect(mockCollection).toHaveBeenCalledWith({ __brand: 'db' }, 'users', 'user-2', 'clients');
});

test('unsubscribes from the snapshot listener on unmount', () => {
  const { unmount } = renderHook(() => useClients());
  unmount();
  expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
});

test('without a signed-in user, exposes an empty list and does not subscribe', () => {
  mockUser = null;
  const { result } = renderHook(() => useClients());
  expect(mockOnSnapshot).not.toHaveBeenCalled();
  expect(result.current.clients).toEqual([]);
  expect(result.current.loading).toBe(false);
});
