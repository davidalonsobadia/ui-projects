import { doc, runTransaction } from 'firebase/firestore';
import { getNextInvoiceNumber } from './utils';

// Location of the per-user invoice-counter document. Centralized here so every
// caller reads and writes the exact same Firestore path.
const counterDocRef = (db, uid) => doc(db, 'users', uid, 'meta', 'invoiceCounter');

// Atomically allocate the next invoice number for `uid`.
//
// Runs a Firestore transaction on `users/{uid}/meta/invoiceCounter`: it reads
// the stored `{ year, counter }` (or none on first use), computes the next value
// via `getNextInvoiceNumber` in `./utils` (the single source of truth for the
// year-rollover + counter logic — reused, never duplicated), writes it back
// within the same transaction, and returns the allocated `{ year, counter }`.
//
// Because the read+write happens inside one transaction, two concurrent
// allocations can never receive the same number: Firestore retries the losing
// transaction against the committed value, so callers always get distinct,
// consecutive numbers.
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
