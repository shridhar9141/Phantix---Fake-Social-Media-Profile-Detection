import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAYwHbLX1HEPIuovsXdafa6uOHkA9mWAnU",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "fake-social-media-detect-4bf0a.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "fake-social-media-detect-4bf0a",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "fake-social-media-detect-4bf0a.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "382068959219",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:382068959219:web:f01741f1c608c82ecf9486"
};

// Initialize Firebase with fallback defaults and environment overrides
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export default app;
