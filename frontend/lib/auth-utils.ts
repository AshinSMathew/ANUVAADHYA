import Cookies from 'js-cookie';
import { User } from 'firebase/auth';

export interface AuthCookie {
  uid: string;
  email: string;
  role: 'user' | 'production';
  displayName: string;
  token: string;
  expiresAt: number;
}

const COOKIE_NAME = 'cinehack_auth';
const COOKIE_EXPIRY_DAYS = 7; // 7 days

export const setAuthCookie = (user: User, role: 'user' | 'production', displayName: string, token: string) => {
  const expiresAt = Date.now() + (COOKIE_EXPIRY_DAYS * 24 * 60 * 60 * 1000); // 7 days from now
  
  const authData: AuthCookie = {
    uid: user.uid,
    email: user.email || '',
    role,
    displayName,
    token,
    expiresAt
  };

  Cookies.set(COOKIE_NAME, JSON.stringify(authData), {
    expires: COOKIE_EXPIRY_DAYS,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/'
  });
};

export const getAuthCookie = (): AuthCookie | null => {
  try {
    const cookieData = Cookies.get(COOKIE_NAME);
    if (!cookieData) return null;

    const authData: AuthCookie = JSON.parse(cookieData);
    
    // Check if token is expired
    if (Date.now() > authData.expiresAt) {
      clearAuthCookie();
      return null;
    }

    return authData;
  } catch (error) {
    console.error('Error parsing auth cookie:', error);
    clearAuthCookie();
    return null;
  }
};

export const clearAuthCookie = () => {
  Cookies.remove(COOKIE_NAME, { path: '/' });
};

export const isTokenExpired = (expiresAt: number): boolean => {
  return Date.now() > expiresAt;
};

export const refreshAuthCookie = (user: User, role: 'user' | 'production', displayName: string, token: string) => {
  clearAuthCookie();
  setAuthCookie(user, role, displayName, token);
};
