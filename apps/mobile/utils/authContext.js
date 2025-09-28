import React, { createContext, useState, useEffect, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authAPI } from './api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load stored user data on app start
  useEffect(() => {
    loadStoredUser();
  }, []);

  const loadStoredUser = async () => {
    try {
      const storedUser = await SecureStore.getItemAsync('userData');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        
        // Verify session is still valid
        try {
          const currentUser = await authAPI.getCurrentUser();
          setUser(currentUser);
          await SecureStore.setItemAsync('userData', JSON.stringify(currentUser));
        } catch (error) {
          // Session expired, clear stored data
          await logout();
        }
      }
    } catch (error) {
      console.error('Error loading stored user:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authAPI.login(email, password);
      setUser(response.user);
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Login failed. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authAPI.register(userData);
      setUser(response.user);
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Registration failed. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const replitAuth = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await authAPI.replitAuth();
      if (response.user) {
        setUser(response.user);
        await SecureStore.setItemAsync('userData', JSON.stringify(response.user));
        return { success: true };
      }
      return { success: false, error: 'Replit authentication failed' };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Replit authentication failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setError(null);
      await SecureStore.deleteItemAsync('userData');
      await SecureStore.deleteItemAsync('authToken');
      await SecureStore.deleteItemAsync('sessionId');
      setLoading(false);
    }
  };

  const updateUser = async (userData) => {
    setUser(userData);
    await SecureStore.setItemAsync('userData', JSON.stringify(userData));
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    replitAuth,
    logout,
    updateUser,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};