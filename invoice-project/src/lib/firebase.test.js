// Unit tests for the Firebase entry point. The real SDK is fully mocked so no
// network/app is created; we only assert wiring: config is read from env, the
// app initializes exactly once, and `auth`/`db` are exported.
//
// Note: variables referenced inside a jest.mock() factory must be prefixed with
// `mock` (Jest hoists the factory above the imports).
const mockApp = { name: "[DEFAULT]" };
const mockAuthInstance = { __brand: "auth" };
const mockDbInstance = { __brand: "db" };

const mockInitializeApp = jest.fn(() => mockApp);
const mockGetApps = jest.fn(() => []);
const mockGetApp = jest.fn(() => mockApp);
const mockGetAuth = jest.fn(() => mockAuthInstance);
const mockGetFirestore = jest.fn(() => mockDbInstance);

jest.mock("firebase/app", () => ({
  initializeApp: mockInitializeApp,
  getApps: mockGetApps,
  getApp: mockGetApp,
}));
jest.mock("firebase/auth", () => ({ getAuth: mockGetAuth }));
jest.mock("firebase/firestore", () => ({ getFirestore: mockGetFirestore }));

const ENV = {
  REACT_APP_FIREBASE_API_KEY: "test-api-key",
  REACT_APP_FIREBASE_AUTH_DOMAIN: "test.firebaseapp.com",
  REACT_APP_FIREBASE_PROJECT_ID: "test-project",
  REACT_APP_FIREBASE_STORAGE_BUCKET: "test.appspot.com",
  REACT_APP_FIREBASE_MESSAGING_SENDER_ID: "1234567890",
  REACT_APP_FIREBASE_APP_ID: "1:1234567890:web:abcdef",
};

describe("lib/firebase", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env = { ...originalEnv, ...ENV };
    // CRA's Jest preset enables resetMocks, which clears implementations before
    // each test — restore them here so the module wires up correctly on require.
    mockGetApps.mockReturnValue([]);
    mockInitializeApp.mockReturnValue(mockApp);
    mockGetApp.mockReturnValue(mockApp);
    mockGetAuth.mockReturnValue(mockAuthInstance);
    mockGetFirestore.mockReturnValue(mockDbInstance);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test("initializes the app with config built from REACT_APP_FIREBASE_* env vars", () => {
    require("./firebase");

    expect(mockInitializeApp).toHaveBeenCalledTimes(1);
    expect(mockInitializeApp).toHaveBeenCalledWith({
      apiKey: "test-api-key",
      authDomain: "test.firebaseapp.com",
      projectId: "test-project",
      storageBucket: "test.appspot.com",
      messagingSenderId: "1234567890",
      appId: "1:1234567890:web:abcdef",
    });
  });

  test("exports non-null auth and db instances", () => {
    const mod = require("./firebase");

    expect(mod.auth).toBe(mockAuthInstance);
    expect(mod.db).toBe(mockDbInstance);
    expect(mockGetAuth).toHaveBeenCalledWith(mockApp);
    expect(mockGetFirestore).toHaveBeenCalledWith(mockApp);
  });

  test("reuses the existing app instead of re-initializing when one already exists", () => {
    mockGetApps.mockReturnValue([mockApp]);

    const mod = require("./firebase");

    expect(mockInitializeApp).not.toHaveBeenCalled();
    expect(mockGetApp).toHaveBeenCalledTimes(1);
    expect(mod.default).toBe(mockApp);
  });
});
