import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app);

export const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/tasks",
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/gmail.send",
];

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => {
  provider.addScope(scope);
});
// Request offline access prompt if needed to get refreshed token
provider.setCustomParameters({
  prompt: "select_account",
});

// Flag to indicate if we are in the middle of a sign-in flow.
let isSigningIn = false;

// Persist the access token so users don't have to log in on every page reload
const TOKEN_STORAGE_KEY = "smart_schedule_google_access_token";
const TOKEN_EXPIRY_KEY = "smart_schedule_google_token_expiry";
let cachedAccessToken: string | null = null;

export function saveCachedToken(token: string, expiresInSeconds: number = 3600) {
  cachedAccessToken = token;
  const expiry = Date.now() + (expiresInSeconds - 60) * 1000;
  try {
    sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    sessionStorage.setItem(TOKEN_EXPIRY_KEY, String(expiry));
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    localStorage.setItem(TOKEN_EXPIRY_KEY, String(expiry));
  } catch (e) {}
}

export function loadCachedToken(): string | null {
  if (cachedAccessToken) return cachedAccessToken;
  try {
    const token =
      sessionStorage.getItem(TOKEN_STORAGE_KEY) ||
      localStorage.getItem(TOKEN_STORAGE_KEY);
    const expiry =
      sessionStorage.getItem(TOKEN_EXPIRY_KEY) ||
      localStorage.getItem(TOKEN_EXPIRY_KEY);
    if (token && expiry && Date.now() < Number(expiry)) {
      cachedAccessToken = token;
      return token;
    }
  } catch (e) {}
  return null;
}

export function clearCachedToken() {
  cachedAccessToken = null;
  try {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(TOKEN_EXPIRY_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
  } catch (e) {}
}

// Initialize auth state listener. Call this on app load.
export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void,
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      const token = loadCachedToken();
      if (token) {
        cachedAccessToken = token;
        if (onAuthSuccess) onAuthSuccess(user, token);
      } else if (!isSigningIn) {
        // User is logged into Firebase Auth, token expired or needs fresh sign-in
        if (onAuthSuccess) onAuthSuccess(user, null);
      }
    } else {
      clearCachedToken();
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Must be called from a button click or user interaction
export const googleSignIn = async (): Promise<{
  user: User;
  accessToken: string;
} | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Không thể lấy Google Access Token. Vui lòng thử lại.");
    }

    cachedAccessToken = credential.accessToken;
    saveCachedToken(credential.accessToken);
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error("Sign in error:", error);

    // Cung cấp thông báo lỗi thân thiện hơn
    if (error?.code === "auth/popup-blocked") {
      throw new Error(
        "Trình duyệt đã chặn popup đăng nhập. Vui lòng cho phép popup từ trang này và thử lại.",
      );
    }
    if (error?.code === "auth/unauthorized-domain") {
      throw new Error(
        "Domain này chưa được phép đăng nhập Google. Vui lòng kiểm tra cấu hình Firebase Console.",
      );
    }
    if (error?.code === "auth/network-request-failed") {
      throw new Error(
        "Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại.",
      );
    }
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return loadCachedToken();
};

export const logout = async () => {
  await signOut(auth);
  clearCachedToken();
};
