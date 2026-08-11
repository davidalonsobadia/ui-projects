// Atomic, per-user invoice-number allocation backed by Firestore.
//
// The counter lives at `users/{uid}/meta/invoiceCounter` as `{ year, counter }`
// and is advanced inside a Firestore transaction so two devices printing at the
// same time can never receive the same number: the transaction re-runs if the
// document changed between the read and the write. The year-rollover + padding
// logic stays in `src/lib/utils.js` (`getNextInvoiceNumber`) as the single
// source of truth and is simply reused here inside the transaction.
import { doc, runTransaction } from 'firebase/firestore';
import { getNextInvoiceNumber } from './utils';

// Location of the per-user invoice-counter document. Centralized here so the
// transaction always reads and writes the exact same Firestore path.
const counterDocRef = (db, uid) => doc(db, 'users', uid, 'meta', 'invoiceCounter');

// Allocate the next invoice number for `uid`, atomically. Reads the stored
// `{ year, counter }` (or none), computes the next value via
// `getNextInvoiceNumber` (which resets the counter to 1 on a new calendar
// year), writes it back within the same transaction, and returns the allocated
// `{ year, counter }`. Callers format it with `formatInvoiceNumber`.
export async function allocateInvoiceNumber(db, uid) {
  const ref = counterDocRef(db, uid);
  return runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(ref);
    const stored = snapshot.exists() ? snapshot.data() : null;
    const next = getNextInvoiceNumber(stored);
    transaction.set(ref, next);
    return next;
  });
}

export default allocateInvoiceNumber;
