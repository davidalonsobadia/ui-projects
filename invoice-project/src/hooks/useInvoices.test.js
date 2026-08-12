// Unit tests for the per-user saved-invoices hook. `firebase/firestore`, the
// shared `db` instance, and the auth context are mocked so no real Firebase is
// touched; we assert the wiring: a query ordered by `createdAt` desc is built for
// the current user's `invoices` collection, snapshot docs are mapped to invoice
// objects, `loading` clears after the first read, and two users never share a
// subscription path.
//
// Note: variables referenced inside a jest.mock() factory must be prefixed with
// `mock` (Jest hoists the factory above the imports).
let snapshotCallback = null;
const mockUnsubscribe = jest.fn();
const mockCollection = jest.fn((...segments) => ({ path: segments.slice(1).join('/') }));
const mockOrderBy = jest.fn((field, direction) => ({ __orderBy: { field, direction } }));
const mockQuery = jest.fn((ref, ...constraints) => ({ ref, constraints }));
const mockOnSnapshot = jest.fn((ref, cb) => {
  snapshotCallback = cb;
  return mockUnsubscribe;
});

let mockUser = { uid: 'user-1' };

jest.mock('firebase/firestore', () => ({
  collection: (...args) => mockCollection(...args),
  orderBy: (...args) => mockOrderBy(...args),
  query: (...args) => mockQuery(...args),
  onSnapshot: (...args) => mockOnSnapshot(...args),
}));
jest.mock('../lib/firebase', () => ({ db: { __brand: 'db' } }));
jest.mock('../context/AuthProvider', () => ({ useAuth: () => ({ user: mockUser }) }));

import { renderHook, act } from '@testing-library/react';
import useInvoices from './useInvoices';

// Build a Firestore query-snapshot stand-in from plain `{ id, ...data }` rows.
const snapshot = (rows) => ({
  docs: rows.map(({ id, ...data }) => ({ id, data: () => data })),
});

beforeEach(() => {
  snapshotCallback = null;
  mockUser = { uid: 'user-1' };
  mockCollection.mockImplementation((...segments) => ({ path: segments.slice(1).join('/') }));
  mockOrderBy.mockImplementation((field, direction) => ({ __orderBy: { field, direction } }));
  mockQuery.mockImplementation((ref, ...constraints) => ({ ref, constraints }));
  mockOnSnapshot.mockImplementation((ref, cb) => {
    snapshotCallback = cb;
    return mockUnsubscribe;
  });
});

test('subscribes to a createdAt-desc query on the current user\'s invoices and starts loading', () => {
  const { result } = renderHook(() => useInvoices());

  expect(mockCollection).toHaveBeenCalledWith({ __brand: 'db' }, 'users', 'user-1', 'invoices');
  expect(mockOrderBy).toHaveBeenCalledWith('createdAt', 'desc');
  expect(mockQuery).toHaveBeenCalledWith(
    expect.objectContaining({ path: 'users/user-1/invoices' }),
    { __orderBy: { field: 'createdAt', direction: 'desc' } },
  );
  expect(mockOnSnapshot).toHaveBeenCalledTimes(1);
  expect(result.current.loading).toBe(true);
  expect(result.current.invoices).toEqual([]);
});

test('maps snapshot docs to invoice objects and clears loading', () => {
  const { result } = renderHook(() => useInvoices());
  act(() =>
    snapshotCallback(
      snapshot([
        { id: 'i2', number: '2026-0002', type: 'services', amounts: { base: 300, iva: 63, total: 363 } },
        { id: 'i1', number: '2026-0001', type: 'hourly', amounts: { base: 400, iva: 84, total: 484 } },
      ]),
    ),
  );

  expect(result.current.invoices).toEqual([
    { id: 'i2', number: '2026-0002', type: 'services', amounts: { base: 300, iva: 63, total: 363 } },
    { id: 'i1', number: '2026-0001', type: 'hourly', amounts: { base: 400, iva: 84, total: 484 } },
  ]);
  expect(result.current.loading).toBe(false);
});

test('two different users subscribe to independent invoice paths', () => {
  const { rerender } = renderHook(() => useInvoices());
  expect(mockCollection).toHaveBeenCalledWith({ __brand: 'db' }, 'users', 'user-1', 'invoices');

  mockUser = { uid: 'user-2' };
  rerender();
  expect(mockCollection).toHaveBeenCalledWith({ __brand: 'db' }, 'users', 'user-2', 'invoices');
});

test('unsubscribes from the snapshot listener on unmount', () => {
  const { unmount } = renderHook(() => useInvoices());
  unmount();
  expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
});

test('without a signed-in user, exposes an empty list and does not subscribe', () => {
  mockUser = null;
  const { result } = renderHook(() => useInvoices());
  expect(mockOnSnapshot).not.toHaveBeenCalled();
  expect(result.current.invoices).toEqual([]);
  expect(result.current.loading).toBe(false);
});
