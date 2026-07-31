// Single Firebase entry point for the app. Initializes the modular SDK once
// (guarded against CRA fast-refresh re-init) and exports the shared `auth` and
// `db` instances. Config comes only from REACT_APP_FIREBASE_* env vars — never
// hardcode values. In CI these come from repository secrets; for local dev put
// them in an untracked `.env.local` (see README).
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// Reuse the already-initialized app if one exists so re-imports (fast-refresh)
// don't double-initialize.
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
