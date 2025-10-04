"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  getIdToken
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { setAuthCookie, getAuthCookie, clearAuthCookie, refreshAuthCookie, isTokenExpired, AuthCookie } from '@/lib/auth-utils';

interface UserRole {
  role: 'user' | 'production';
  displayName?: string;
  email: string;
}

interface AuthContextType {
  currentUser: User | null;
  userRole: UserRole | null;
  loading: boolean;
  signup: (email: string, password: string, role: 'user' | 'production', displayName?: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user from cookie on mount
  useEffect(() => {
    const loadUserFromCookie = async () => {
      const authCookie = getAuthCookie();
      if (authCookie && !isTokenExpired(authCookie.expiresAt)) {
        // Set user data from cookie
        setUserRole({
          role: authCookie.role,
          displayName: authCookie.displayName,
          email: authCookie.email
        });
        
        // Try to get the actual user object from Firebase
        try {
          // This will trigger onAuthStateChanged if user is still valid
          const user = auth.currentUser;
          if (user && user.uid === authCookie.uid) {
            setCurrentUser(user);
          }
        } catch (error) {
          console.error('Error loading user from cookie:', error);
          clearAuthCookie();
        }
      }
      setLoading(false);
    };

    loadUserFromCookie();
  }, []);

  async function signup(email: string, password: string, role: 'user' | 'production', displayName?: string) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update user profile with display name
      if (displayName) {
        await updateProfile(user, { displayName });
      }
      
      // Save user role to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        role,
        displayName: displayName || '',
        email: user.email,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      });
      
      // Get ID token and set cookie
      const token = await getIdToken(user);
      setAuthCookie(user, role, displayName || '', token);
      
      setUserRole({ role, displayName, email: user.email || '' });
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  }

  async function login(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Fetch user role from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Update last login time
        await setDoc(doc(db, 'users', user.uid), {
          ...userData,
          lastLoginAt: new Date().toISOString()
        }, { merge: true });
        
        // Get ID token and set cookie
        const token = await getIdToken(user);
        setAuthCookie(user, userData.role, userData.displayName || '', token);
        
        setUserRole({
          role: userData.role,
          displayName: userData.displayName,
          email: userData.email
        });
      }
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  }

  async function logout() {
    try {
      await signOut(auth);
      clearAuthCookie();
      setUserRole(null);
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  }

  async function refreshToken() {
    try {
      if (currentUser) {
        const token = await getIdToken(currentUser, true); // Force refresh
        const authCookie = getAuthCookie();
        if (authCookie) {
          refreshAuthCookie(currentUser, authCookie.role, authCookie.displayName, token);
        }
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      // If token refresh fails, logout user
      await logout();
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        
        // Check if we already have user role from cookie
        const authCookie = getAuthCookie();
        if (authCookie && authCookie.uid === user.uid) {
          setUserRole({
            role: authCookie.role,
            displayName: authCookie.displayName,
            email: authCookie.email
          });
        } else {
          // Fetch user role from Firestore if not in cookie
          try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              setUserRole({
                role: userData.role,
                displayName: userData.displayName,
                email: userData.email
              });
              
              // Set cookie with fresh data
              const token = await getIdToken(user);
              setAuthCookie(user, userData.role, userData.displayName || '', token);
            }
          } catch (error) {
            console.error('Error fetching user role:', error);
          }
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
        clearAuthCookie();
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Auto-refresh token every 50 minutes (tokens expire in 1 hour)
  useEffect(() => {
    if (currentUser) {
      const interval = setInterval(() => {
        refreshToken();
      }, 50 * 60 * 1000); // 50 minutes

      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const value = {
    currentUser,
    userRole,
    loading,
    signup,
    login,
    logout,
    refreshToken
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
