'use client';

import { useState, useEffect } from 'react';

interface AuthState {
  isAuthenticated: boolean;
  email: string | null;
  token: string | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    email: null,
    token: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing authentication on mount
    const storedEmail = localStorage.getItem('auth_email');
    const storedToken = localStorage.getItem('auth_token');
    
    if (storedEmail && storedToken) {
      setAuthState({
        isAuthenticated: true,
        email: storedEmail,
        token: storedToken
      });
    }
    
    setLoading(false);
  }, []);

  const authenticate = (email: string, token: string) => {
    localStorage.setItem('auth_email', email);
    localStorage.setItem('auth_token', token);
    setAuthState({
      isAuthenticated: true,
      email,
      token
    });
  };

  const logout = () => {
    localStorage.removeItem('auth_email');
    localStorage.removeItem('auth_token');
    setAuthState({
      isAuthenticated: false,
      email: null,
      token: null
    });
  };

  const getUserId = (): string => {
    if (authState.email) {
      // Use email as the user ID (normalize it)
      return `email_${authState.email.toLowerCase()}`;
    }
    return '';
  };

  return {
    ...authState,
    loading,
    authenticate,
    logout,
    getUserId
  };
}