import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize user from localStorage & verify session
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('civic_access_token');
      const storedUser = localStorage.getItem('civic_user');

      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          // Verify with backend
          const res = await authApi.getMe();
          if (res.data?.data?.user) {
            setUser(res.data.data.user);
            localStorage.setItem('civic_user', JSON.stringify(res.data.data.user));
          }
        } catch (error) {
          console.warn('Initial session validation failed, clearing token');
          localStorage.removeItem('civic_access_token');
          localStorage.removeItem('civic_refresh_token');
          localStorage.removeItem('civic_user');
          setUser(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    const response = await authApi.login({ email, password });
    const { user: loggedInUser, accessToken, refreshToken } = response.data.data;

    localStorage.setItem('civic_access_token', accessToken);
    localStorage.setItem('civic_refresh_token', refreshToken);
    localStorage.setItem('civic_user', JSON.stringify(loggedInUser));

    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const register = useCallback(async (userData) => {
    const response = await authApi.register(userData);
    const { user: registeredUser, accessToken, refreshToken } = response.data.data;

    localStorage.setItem('civic_access_token', accessToken);
    localStorage.setItem('civic_refresh_token', refreshToken);
    localStorage.setItem('civic_user', JSON.stringify(registeredUser));

    setUser(registeredUser);
    return registeredUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('civic_access_token');
      localStorage.removeItem('civic_refresh_token');
      localStorage.removeItem('civic_user');
      setUser(null);
    }
  }, []);

  const updateUser = useCallback((updatedData) => {
    setUser((prev) => {
      const nextUser = { ...prev, ...updatedData };
      localStorage.setItem('civic_user', JSON.stringify(nextUser));
      return nextUser;
    });
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === 'admin',
    isCitizen: user?.role === 'citizen',
    login,
    register,
    logout,
    updateUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
