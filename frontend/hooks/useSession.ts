"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAuthCookie, isTokenExpired } from '@/lib/auth-utils';

export interface SessionInfo {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: {
    uid: string;
    email: string;
    role: 'user' | 'production';
    displayName: string;
  } | null;
  tokenExpiry: number | null;
  timeUntilExpiry: number | null;
}

export function useSession(): SessionInfo {
  const { currentUser, userRole, loading } = useAuth();
  const [sessionInfo, setSessionInfo] = useState<SessionInfo>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    tokenExpiry: null,
    timeUntilExpiry: null
  });

  useEffect(() => {
    const updateSessionInfo = () => {
      const authCookie = getAuthCookie();
      
      if (currentUser && userRole && authCookie) {
        const timeUntilExpiry = authCookie.expiresAt - Date.now();
        
        setSessionInfo({
          isAuthenticated: true,
          isLoading: false,
          user: {
            uid: currentUser.uid,
            email: userRole.email,
            role: userRole.role,
            displayName: userRole.displayName || ''
          },
          tokenExpiry: authCookie.expiresAt,
          timeUntilExpiry: timeUntilExpiry > 0 ? timeUntilExpiry : 0
        });
      } else {
        setSessionInfo({
          isAuthenticated: false,
          isLoading: loading,
          user: null,
          tokenExpiry: null,
          timeUntilExpiry: null
        });
      }
    };

    updateSessionInfo();

    // Update every minute to check token expiry
    const interval = setInterval(updateSessionInfo, 60000);

    return () => clearInterval(interval);
  }, [currentUser, userRole, loading]);

  return sessionInfo;
}

export function useTokenExpiry() {
  const { refreshToken } = useAuth();
  const [timeUntilExpiry, setTimeUntilExpiry] = useState<number | null>(null);

  useEffect(() => {
    const checkTokenExpiry = () => {
      const authCookie = getAuthCookie();
      if (authCookie) {
        const timeLeft = authCookie.expiresAt - Date.now();
        setTimeUntilExpiry(timeLeft > 0 ? timeLeft : 0);
        
        // Auto-refresh token when it's about to expire (5 minutes before)
        if (timeLeft > 0 && timeLeft < 5 * 60 * 1000) {
          refreshToken();
        }
      } else {
        setTimeUntilExpiry(null);
      }
    };

    checkTokenExpiry();
    const interval = setInterval(checkTokenExpiry, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [refreshToken]);

  return timeUntilExpiry;
}
