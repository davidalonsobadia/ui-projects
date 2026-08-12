import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthProvider';

// Location of the per-user invoices collection. Centralized here so every
// consumer reads the exact same Firestore path (mirrors `src/lib/invoices.js`).
const invoicesCollectionRef = (uid) => collection(db, 'users', uid, 'invoices');

// Per-user saved invoices backed by Firestore (`users/{uid}/invoices`), scoped
// to the signed-in user from the auth context. Kept in sync with `onSnapshot`,
// mirroring the data-layer style of `useClients`. Returns `{ invoices, loading }`:
//   - `invoices` — the user's saved invoices as `[{ id, number, type, ... }]`,
//                  ordered newest-first by `createdAt`.
//   - `loading`  — true until the first read resolves.
//
// Ordering is a single-field `orderBy('createdAt', 'desc')`, so no composite
// index is required. Writes go through `saveInvoice` in `src/lib/invoices.js`;
// this hook is read-only.
function useInvoices() {
  const { user } = useAuth();
  const uid = user ? user.uid : null;

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      // No signed-in user: expose an empty list and stop loading so consumers
      // render sensibly instead of hanging or crashing.
      setInvoices([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    const invoicesQuery = query(
      invoicesCollectionRef(uid),
      orderBy('createdAt', 'desc'),
    );
    const unsubscribe = onSnapshot(invoicesQuery, (snapshot) => {
      setInvoices(
        snapshot.docs.map((docSnapshot) => ({
          id: docSnapshot.id,
          ...docSnapshot.data(),
        })),
      );
      setLoading(false);
    });

    return unsubscribe;
  }, [uid]);

  return { invoices, loading };
}

export default useInvoices;
