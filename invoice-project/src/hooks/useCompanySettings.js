import { useCallback, useEffect, useRef, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthProvider';

// Legacy per-browser key used before company settings moved to Firestore. Kept
// only so a returning user's data can be seeded once (see migration below).
const LEGACY_STORAGE_KEY = 'company_settings';

// Location of the per-user company-settings document. Centralized here so every
// consumer reads and writes the exact same Firestore path.
const companyDocRef = (uid) => doc(db, 'users', uid, 'settings', 'company');

// Per-user company settings backed by Firestore (`users/{uid}/settings/company`),
// scoped to the signed-in user from the auth context. Mirrors the old
// `useLocalStorage('company_settings', default)` API so the settings panel and
// the invoice screens can swap over without changing their call sites: returns
// `[company, setCompany, { loading }]`.
//
// One-time migration: the first time a user has no Firestore doc yet but still
// carries the legacy `localStorage['company_settings']` value from before this
// change, the doc is seeded from it once. After that Firestore is the single
// source of truth.
function useCompanySettings(defaultValue) {
  const { user } = useAuth();
  const uid = user ? user.uid : null;

  const [company, setCompanyState] = useState(defaultValue);
  const [loading, setLoading] = useState(true);

  // Track the latest values without forcing the subscription/callback to
  // re-create when the caller passes a fresh object literal each render.
  const defaultRef = useRef(defaultValue);
  defaultRef.current = defaultValue;
  const companyRef = useRef(company);
  companyRef.current = company;

  useEffect(() => {
    if (!uid) {
      // No signed-in user: fall back to the default shape and stop loading so
      // consumers render sensibly instead of hanging or crashing.
      setCompanyState(defaultRef.current);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    const ref = companyDocRef(uid);
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      if (snapshot.exists()) {
        setCompanyState(snapshot.data());
        setLoading(false);
        return;
      }

      // Doc absent: seed once from the legacy localStorage value if present,
      // otherwise fall back to the caller's default shape.
      let legacy = null;
      try {
        const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
        legacy = raw !== null ? JSON.parse(raw) : null;
      } catch {
        legacy = null;
      }

      if (legacy !== null) {
        setCompanyState(legacy);
        setDoc(ref, legacy, { merge: true }).catch((err) => console.error(err));
      } else {
        setCompanyState(defaultRef.current);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [uid]);

  const setCompany = useCallback(
    (next) => {
      const value = next instanceof Function ? next(companyRef.current) : next;
      setCompanyState(value);
      if (uid) {
        setDoc(companyDocRef(uid), value, { merge: true }).catch((err) => console.error(err));
      }
    },
    [uid],
  );

  return [company, setCompany, { loading }];
}

export default useCompanySettings;
