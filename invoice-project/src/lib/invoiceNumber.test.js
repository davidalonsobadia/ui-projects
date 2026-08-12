// Unit tests for the atomic per-user invoice-number allocator. `firebase/firestore`
// is mocked so no real Firebase is touched: `runTransaction` invokes the update
// callback with a fake transaction whose `get`/`set` read and mutate an in-memory
// counter, letting us assert the wiring (correct doc path, next value computed via
// the shared `getNextInvoiceNumber`, written back inside the transaction) and the
// sequential/rollover behavior.
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

// Build a runTransaction stub whose fake transaction reads/writes `store`, so a
// sequence of allocations behaves like a real, persisted counter.
let store;
let lastTx;

beforeEach(() => {
  store = null;
  lastTx = null;
  mockDoc.mockImplementation((...segments) => ({ path: segments.slice(1).join('/') }));
  mockRunTransaction.mockImplementation(async (db, updateFn) => {
    const tx = {
      get: jest.fn(() =>
        Promise.resolve({ exists: () => store !== null, data: () => store }),
      ),
      set: jest.fn((ref, value) => { store = value; }),
    };
    lastTx = tx;
    return updateFn(tx);
  });
});

test('allocates counter 1 for a brand-new user and writes it in the transaction', async () => {
  const result = await allocateInvoiceNumber(DB, 'user-1');

  expect(mockDoc).toHaveBeenCalledWith(DB, 'users', 'user-1', 'meta', 'invoiceCounter');
  expect(mockRunTransaction).toHaveBeenCalledWith(DB, expect.any(Function));
  expect(result).toEqual({ year: YEAR, counter: 1 });
  // Written back within the same transaction (not via a separate setDoc).
  expect(lastTx.set).toHaveBeenCalledWith(
    expect.objectContaining({ path: 'users/user-1/meta/invoiceCounter' }),
    { year: YEAR, counter: 1 },
  );
});

test('increments the stored counter within the same year', async () => {
  store = { year: YEAR, counter: 5 };
  const result = await allocateInvoiceNumber(DB, 'user-1');
  expect(result).toEqual({ year: YEAR, counter: 6 });
});

test('resets the counter to 1 on the first invoice of a new year', async () => {
  store = { year: 2020, counter: 99 };
  const result = await allocateInvoiceNumber(DB, 'user-1');
  expect(result).toEqual({ year: YEAR, counter: 1 });
});

test('two sequential allocations receive consecutive numbers', async () => {
  const first = await allocateInvoiceNumber(DB, 'user-1');
  const second = await allocateInvoiceNumber(DB, 'user-1');
  expect(first).toEqual({ year: YEAR, counter: 1 });
  expect(second).toEqual({ year: YEAR, counter: 2 });
});

test('numbering is per user: each uid targets its own counter doc', async () => {
  await allocateInvoiceNumber(DB, 'user-a');
  await allocateInvoiceNumber(DB, 'user-b');
  expect(mockDoc).toHaveBeenCalledWith(DB, 'users', 'user-a', 'meta', 'invoiceCounter');
  expect(mockDoc).toHaveBeenCalledWith(DB, 'users', 'user-b', 'meta', 'invoiceCounter');
});

test('propagates a rejected transaction to the caller', async () => {
  mockRunTransaction.mockImplementationOnce(() => Promise.reject(new Error('offline')));
  await expect(allocateInvoiceNumber(DB, 'user-1')).rejects.toThrow('offline');
});
