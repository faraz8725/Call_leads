import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api.js';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(() => {
    const saved = localStorage.getItem('voice_platform_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => {
    return localStorage.getItem('voice_platform_token') || null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setAdmin(res.data.admin);
            localStorage.setItem('voice_platform_user', JSON.stringify(res.data.admin));
          }
        } catch (err) {
          console.error('Auth verification failed:', err.message);
          setAdmin(null);
          setToken(null);
          localStorage.removeItem('voice_platform_token');
          localStorage.removeItem('voice_platform_user');
        }
      }
      setLoading(false);
    };

    verifyAuth();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      const { token: receivedToken, admin: adminData } = res.data;
      setToken(receivedToken);
      setAdmin(adminData);
      localStorage.setItem('voice_platform_token', receivedToken);
      localStorage.setItem('voice_platform_user', JSON.stringify(adminData));
      return res.data;
    }
    throw new Error(res.data.message || 'Login failed');
  };

  const logout = async () => {
    try {
      if (token) {
        await api.post('/auth/logout');
      }
    } catch {
      // Ignore network errors on logout
    } finally {
      setAdmin(null);
      setToken(null);
      localStorage.removeItem('voice_platform_token');
      localStorage.removeItem('voice_platform_user');
    }
  };

  const updateAdmin = (updatedAdmin) => {
    setAdmin(updatedAdmin);
    localStorage.setItem('voice_platform_user', JSON.stringify(updatedAdmin));
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        token,
        isAuthenticated: Boolean(token && admin),
        loading,
        login,
        logout,
        updateAdmin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
