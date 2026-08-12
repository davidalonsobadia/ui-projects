import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

// Location of the per-user invoices collection. Centralized here so every
// caller reads and writes the exact same Firestore path.
const invoicesCollectionRef = (db, uid) => collection(db, 'users', uid, 'invoices');

// Persist an emitted invoice as a document under `users/{uid}/invoices`.
//
// Writes only the defined schema fields (dropping any extras the caller passes)
// plus a server-side `createdAt` timestamp used to order the history list
// newest-first without parsing the es-ES `issueDate` string. Resolves with the
// new document id.
//
// The `invoice` shape is:
//   - `number`    — final formatted number string, e.g. `"2026-0007"`.
//   - `type`      — `"hourly"` | `"services"`.
//   - `issueDate` — the displayed es-ES issue date string.
//   - `client`    — denormalized `{ nombre, nif, direccion }` snapshot.
//   - `lineItems` — hourly: `[{ date, hours, task, description }]`;
//                   services: `[{ nombre, descripcion, precio }]`.
//   - `amounts`   — `{ base, iva, total }` as numbers.
//
// All invoice persistence goes through this module; components must not write
// the `invoices` collection directly (see CLAUDE.md).
export async function saveInvoice(db, uid, invoice) {
  if (!uid) {
    throw new Error('Cannot save an invoice without a signed-in user');
  }
  const { number, type, issueDate, client, lineItems, amounts } = invoice;
  const document = {
    number,
    type,
    issueDate,
    client,
    lineItems,
    amounts,
    createdAt: serverTimestamp(),
  };
  const created = await addDoc(invoicesCollectionRef(db, uid), document);
  return created.id;
}

export default saveInvoice;
