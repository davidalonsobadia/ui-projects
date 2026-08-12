// Unit tests for the per-user invoices data layer. `firebase/firestore` is
// mocked so no real Firebase is touched: we assert the wiring — `saveInvoice`
// targets the current user's `invoices` collection, writes the schema fields
// (including `type`, `createdAt`, and `amounts`), and resolves with the new id.
//
// Note: variables referenced inside a jest.mock() factory must be prefixed with
// `mock` (Jest hoists the factory above the imports).
const mockCollection = jest.fn((...segments) => ({ path: segments.slice(1).join('/') }));
const mockAddDoc = jest.fn(() => Promise.resolve({ id: 'new-invoice-id' }));
const mockServerTimestamp = jest.fn(() => ({ __brand: 'serverTimestamp' }));

jest.mock('firebase/firestore', () => ({
  collection: (...args) => mockCollection(...args),
  addDoc: (...args) => mockAddDoc(...args),
  serverTimestamp: (...args) => mockServerTimestamp(...args),
}));

import { saveInvoice } from './invoices';

const DB = { __brand: 'db' };

const hourlyInvoice = {
  number: '2026-0007',
  type: 'hourly',
  issueDate: '12/8/2026',
  client: { nombre: 'Acme SL', nif: 'B123', direccion: 'Calle 1' },
  lineItems: [{ date: '10/8/2026', hours: 4, task: 'Dev', description: 'Work' }],
  amounts: { base: 400, iva: 84, total: 484 },
};

beforeEach(() => {
  mockCollection.mockImplementation((...segments) => ({ path: segments.slice(1).join('/') }));
  mockAddDoc.mockImplementation(() => Promise.resolve({ id: 'new-invoice-id' }));
  mockServerTimestamp.mockImplementation(() => ({ __brand: 'serverTimestamp' }));
});

test('writes the invoice to the current user\'s invoices collection and resolves with the id', async () => {
  const id = await saveInvoice(DB, 'user-1', hourlyInvoice);

  expect(mockCollection).toHaveBeenCalledWith(DB, 'users', 'user-1', 'invoices');
  expect(mockAddDoc).toHaveBeenCalledWith(
    expect.objectContaining({ path: 'users/user-1/invoices' }),
    {
      number: '2026-0007',
      type: 'hourly',
      issueDate: '12/8/2026',
      client: { nombre: 'Acme SL', nif: 'B123', direccion: 'Calle 1' },
      lineItems: [{ date: '10/8/2026', hours: 4, task: 'Dev', description: 'Work' }],
      amounts: { base: 400, iva: 84, total: 484 },
      createdAt: { __brand: 'serverTimestamp' },
    },
  );
  expect(id).toBe('new-invoice-id');
});

test('stamps createdAt with serverTimestamp() for stable ordering', async () => {
  await saveInvoice(DB, 'user-1', hourlyInvoice);
  expect(mockServerTimestamp).toHaveBeenCalledTimes(1);
});

test('persists the services shape distinguished by type', async () => {
  const servicesInvoice = {
    number: '2026-0008',
    type: 'services',
    issueDate: '12/8/2026',
    client: { nombre: 'Globex', nif: 'B456', direccion: 'Calle 2' },
    lineItems: [{ nombre: 'Consultoría', descripcion: 'Auditoría', precio: 300 }],
    amounts: { base: 300, iva: 63, total: 363 },
  };

  await saveInvoice(DB, 'user-1', servicesInvoice);

  expect(mockAddDoc).toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({
      type: 'services',
      lineItems: [{ nombre: 'Consultoría', descripcion: 'Auditoría', precio: 300 }],
      amounts: { base: 300, iva: 63, total: 363 },
    }),
  );
});

test('only persists the schema fields, dropping unknown extras', async () => {
  await saveInvoice(DB, 'user-1', { ...hourlyInvoice, id: 'ignore', foo: 'bar' });

  const written = mockAddDoc.mock.calls[0][1];
  expect(Object.keys(written).sort()).toEqual(
    ['amounts', 'client', 'createdAt', 'issueDate', 'lineItems', 'number', 'type'],
  );
});

test('invoices are per user: each uid targets its own collection', async () => {
  await saveInvoice(DB, 'user-a', hourlyInvoice);
  await saveInvoice(DB, 'user-b', hourlyInvoice);
  expect(mockCollection).toHaveBeenCalledWith(DB, 'users', 'user-a', 'invoices');
  expect(mockCollection).toHaveBeenCalledWith(DB, 'users', 'user-b', 'invoices');
});

test('throws without a signed-in user and does not write', async () => {
  await expect(saveInvoice(DB, null, hourlyInvoice)).rejects.toThrow(
    'Cannot save an invoice without a signed-in user',
  );
  expect(mockAddDoc).not.toHaveBeenCalled();
});
