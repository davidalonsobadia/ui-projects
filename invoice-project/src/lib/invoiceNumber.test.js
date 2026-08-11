// Unit tests for atomic invoice-number allocation. `firebase/firestore` is
// mocked so no real Firebase is touched; `runTransaction` is driven with a fake
// transaction whose `get`/`set` we control, letting us assert the counter doc
// is read, the next value is computed via `getNextInvoiceNumber`, written back,
// and returned. Year-rollover and sequential-allocation behavior is checked too.
//
// Note: variables referenced inside a jest.mock() factory must be prefixed with
// `mock` (Jest hoists the factory above the imports).
const mockDoc = jest.fn((...segments) => ({ path: segments.slice(1).join('/') }));
const mockRunTransaction = jest.fn();

jest.mock('firebase/firestore', () => ({
  doc: (...args) => mockDoc(...args),
  runTransaction: (...args) => mockRunTransaction(...args),
}));

import { allocateInvoiceNumber } from './invoiceNumber';

const DB = { __brand: 'db' };
const YEAR = new Date().getFullYear();

const makeSnapshot = (data) => ({
  exists: () => data !== null && data !== undefined,
  data: () => data,
});

// Build a runTransaction implementation backed by a mutable in-memory doc so we
// can observe reads/writes and simulate persistence across calls.
const withStore = (initial) => {
  const store = { value: initial };
  const set = jest.fn((ref, value) => { store.value = value; });
  const get = jest.fn(async () => makeSnapshot(store.value));
  mockRunTransaction.mockImplementation((db, updateFn) => updateFn({ get, set }));
  return { store, get, set };
};

beforeEach(() => {
  // CRA's Jest preset resets mock implementations before each test; restore them.
  mockDoc.mockImplementation((...segments) => ({ path: segments.slice(1).join('/') }));
  mockRunTransaction.mockReset();
});

test('runs the transaction on the per-user counter doc', async () => {
  withStore(null);
  await allocateInvoiceNumber(DB, 'user-1');
  expect(mockDoc).toHaveBeenCalledWith(DB, 'users', 'user-1', 'meta', 'invoiceCounter');
  expect(mockRunTransaction).toHaveBeenCalledTimes(1);
  expect(mockRunTransaction).toHaveBeenCalledWith(DB, expect.any(Function));
});

test('starts at counter 1 for the current year when nothing is stored', async () => {
  const { get, set } = withStore(null);
  const allocated = await allocateInvoiceNumber(DB, 'user-1');
  expect(get).toHaveBeenCalledWith(expect.objectContaining({ path: 'users/user-1/meta/invoiceCounter' }));
  expect(allocated).toEqual({ year: YEAR, counter: 1 });
  expect(set).toHaveBeenCalledWith(
    expect.objectContaining({ path: 'users/user-1/meta/invoiceCounter' }),
    { year: YEAR, counter: 1 },
  );
});

test('increments the stored counter within the same year', async () => {
  const { set } = withStore({ year: YEAR, counter: 5 });
  const allocated = await allocateInvoiceNumber(DB, 'user-1');
  expect(allocated).toEqual({ year: YEAR, counter: 6 });
  expect(set).toHaveBeenCalledWith(expect.anything(), { year: YEAR, counter: 6 });
});

test('resets the counter to 1 on a new calendar year', async () => {
  const { set } = withStore({ year: 2020, counter: 99 });
  const allocated = await allocateInvoiceNumber(DB, 'user-1');
  expect(allocated).toEqual({ year: YEAR, counter: 1 });
  expect(set).toHaveBeenCalledWith(expect.anything(), { year: YEAR, counter: 1 });
});

test('two sequential allocations return consecutive counters', async () => {
  withStore({ year: YEAR, counter: 5 });
  const first = await allocateInvoiceNumber(DB, 'user-1');
  const second = await allocateInvoiceNumber(DB, 'user-1');
  expect(first).toEqual({ year: YEAR, counter: 6 });
  expect(second).toEqual({ year: YEAR, counter: 7 });
});

test('numbering is independent per user', async () => {
  const stores = { 'user-a': { year: YEAR, counter: 10 }, 'user-b': null };
  mockRunTransaction.mockImplementation((db, updateFn) => {
    // `doc` is called with the uid as the third segment; route to that store.
    const uid = mockDoc.mock.calls[mockDoc.mock.calls.length - 1][2];
    const tx = {
      get: async () => makeSnapshot(stores[uid]),
      set: (ref, value) => { stores[uid] = value; },
    };
    return updateFn(tx);
  });
  const a = await allocateInvoiceNumber(DB, 'user-a');
  const b = await allocateInvoiceNumber(DB, 'user-b');
  expect(a).toEqual({ year: YEAR, counter: 11 });
  expect(b).toEqual({ year: YEAR, counter: 1 });
});
