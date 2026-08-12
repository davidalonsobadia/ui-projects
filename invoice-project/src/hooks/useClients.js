import { useCallback, useEffect, useRef, useState } from 'react';
import { addDoc, collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthProvider';

// Location of the per-user clients collection. Centralized here so every
// consumer reads and writes the exact same Firestore path.
const clientsCollectionRef = (uid) => collection(db, 'users', uid, 'clients');

// Per-user reusable clients backed by Firestore (`users/{uid}/clients`), scoped
// to the signed-in user from the auth context. Kept in sync with `onSnapshot`,
// mirroring the data-layer style of `useCompanySettings`. Returns
// `{ clients, loading, addClient }`:
//   - `clients`   — the user's clients as `[{ id, nombre, nif, direccion }]`.
//   - `loading`   — true until the first read resolves.
//   - `addClient` — creates a new client document for the current user and
//                   resolves with the created `{ id, ...client }` so a caller
//                   can immediately select it.
//
// All client access goes through this hook; components must not read or write
// the `clients` collection directly (see CLAUDE.md).
function useClients() {
  const { user } = useAuth();
  const uid = user ? user.uid : null;

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      // No signed-in user: expose an empty list and stop loading so consumers
      // render sensibly instead of hanging or crashing.
      setClients([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    const unsubscribe = onSnapshot(clientsCollectionRef(uid), (snapshot) => {
      setClients(
        snapshot.docs.map((docSnapshot) => ({
          id: docSnapshot.id,
          ...docSnapshot.data(),
        })),
      );
      setLoading(false);
    });

    return unsubscribe;
  }, [uid]);

  // Keep the latest uid available to `addClient` without re-creating the
  // callback (and its consumers) whenever an unrelated render happens.
  const uidRef = useRef(uid);
  uidRef.current = uid;

  const addClient = useCallback(async ({ nombre, nif, direccion }) => {
    const currentUid = uidRef.current;
    if (!currentUid) {
      throw new Error('Cannot add a client without a signed-in user');
    }
    const client = { nombre, nif, direccion };
    const created = await addDoc(clientsCollectionRef(currentUid), client);
    return { id: created.id, ...client };
  }, []);

  return { clients, loading, addClient };
}

export default useClients;
