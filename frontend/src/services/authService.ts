import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';

export function formatAuthError(error: any): string {
  if (!error) return 'An unknown error occurred.';
  const code = error.code || '';
  
  switch (code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact system administrators.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email address or password. If you do not have an account yet, please click "Register New Analyst Account" below.';
    case 'auth/email-already-in-use':
      return 'An analyst account with this email address already exists. Please Sign In instead.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters.';
    case 'auth/too-many-requests':
      return 'Too many unsuccessful login attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was cancelled.';
    case 'auth/popup-blocked':
      return 'Sign-in popup was blocked by your browser. Please allow popups for this domain.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with the same email address using different sign-in credentials.';
    default:
      return error.message || 'Authentication operation failed.';
  }
}

export const authService = {
  async loginWithEmail(email: string, pass: string): Promise<FirebaseUser> {
    try {
      const res = await signInWithEmailAndPassword(auth, email.trim(), pass);
      return res.user;
    } catch (err) {
      throw new Error(formatAuthError(err));
    }
  },

  async registerWithEmail(name: string, email: string, pass: string): Promise<FirebaseUser> {
    try {
      const res = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      if (name.trim()) {
        await updateProfile(res.user, { displayName: name.trim() });
      }
      return res.user;
    } catch (err) {
      throw new Error(formatAuthError(err));
    }
  },

  async signInWithGoogle(): Promise<FirebaseUser> {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      return res.user;
    } catch (err) {
      throw new Error(formatAuthError(err));
    }
  },

  async logout(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      console.error('Logout error:', err);
    }
  },

  async sendResetPasswordEmail(email: string): Promise<void> {
    try {
      await firebaseSendPasswordResetEmail(auth, email.trim());
    } catch (err) {
      throw new Error(formatAuthError(err));
    }
  },

  async getFreshIdToken(forceRefresh = false): Promise<string | null> {
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        return await currentUser.getIdToken(forceRefresh);
      } catch (err) {
        console.error('Failed to retrieve Firebase ID token:', err);
      }
    }
    return localStorage.getItem('id_token');
  }
};
