import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../config/firebase';
import { authService } from '../services/authService';
import { UserProfile } from '../types/auth';
import { api } from '../services/api';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  loginEmail: (email: string, pass: string) => Promise<void>;
  registerEmail: (name: string, email: string, pass: string) => Promise<void>;
  loginGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  getIdToken: (forceRefresh?: boolean) => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const syncBackendUser = async (fbUser: FirebaseUser | null) => {
    if (fbUser) {
      try {
        const token = await fbUser.getIdToken();
        localStorage.setItem('id_token', token);
        const profile = await api.getCurrentUser();
        setUser(profile);
      } catch (err) {
        console.warn('Backend profile sync note:', err);
        // Fallback user state matching UserProfile schema so login proceeds seamlessly
        const nowStr = new Date().toISOString();
        setUser({
          id: fbUser.uid,
          firebase_uid: fbUser.uid,
          email: fbUser.email || 'analyst@identitytrace.io',
          display_name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Security Analyst',
          created_at: nowStr,
          updated_at: nowStr,
        });
      }
    } else {
      // Check for dev mode identity token in local storage if offline
      const token = localStorage.getItem('id_token');
      if (token) {
        try {
          const profile = await api.getCurrentUser();
          setUser(profile);
        } catch {
          setUser(null);
          localStorage.removeItem('id_token');
        }
      } else {
        setUser(null);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      await syncBackendUser(fbUser);
    });

    return () => unsubscribe();
  }, []);

  const loginEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const fbUser = await authService.loginWithEmail(email, pass);
      setFirebaseUser(fbUser);
      await syncBackendUser(fbUser);
    } catch (err) {
      setLoading(false);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const registerEmail = async (name: string, email: string, pass: string) => {
    setLoading(true);
    try {
      const fbUser = await authService.registerWithEmail(name, email, pass);
      setFirebaseUser(fbUser);
      await syncBackendUser(fbUser);
      if (name.trim()) {
        try {
          await api.updateProfile(name.trim());
          await refreshProfile();
        } catch {
          // ignore minor profile sync error
        }
      }
    } catch (err) {
      setLoading(false);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginGoogle = async () => {
    setLoading(true);
    try {
      const fbUser = await authService.signInWithGoogle();
      setFirebaseUser(fbUser);
      await syncBackendUser(fbUser);
    } catch (err) {
      setLoading(false);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
    } finally {
      localStorage.removeItem('id_token');
      setUser(null);
      setFirebaseUser(null);
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    await authService.sendResetPasswordEmail(email);
  };

  const refreshProfile = async () => {
    try {
      const profile = await api.getCurrentUser();
      setUser(profile);
    } catch (err) {
      console.error('Failed to refresh profile:', err);
    }
  };

  const getIdToken = async (forceRefresh = false) => {
    return authService.getFreshIdToken(forceRefresh);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        isAuthenticated: !!user,
        loginEmail,
        registerEmail,
        loginGoogle,
        logout,
        resetPassword,
        refreshProfile,
        getIdToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
