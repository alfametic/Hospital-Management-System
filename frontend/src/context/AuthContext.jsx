import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('hms_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('hms_profile');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('hms_token') || null);
  const [loading, setLoading] = useState(true);

  // Sync session on initial app load
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('hms_token');
      if (savedToken) {
        try {
          const res = await authAPI.getMe();
          if (res.data.success) {
            setUser(res.data.user);
            setProfile(res.data.profile);
            localStorage.setItem('hms_user', JSON.stringify(res.data.user));
            if (res.data.profile) {
              localStorage.setItem('hms_profile', JSON.stringify(res.data.profile));
            }
          }
        } catch (err) {
          console.warn('[Auth] Session validation failed:', err.message);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    if (res.data.success) {
      const { token: receivedToken, user: receivedUser, profile: receivedProfile } = res.data;
      setToken(receivedToken);
      setUser(receivedUser);
      setProfile(receivedProfile);

      localStorage.setItem('hms_token', receivedToken);
      localStorage.setItem('hms_user', JSON.stringify(receivedUser));
      if (receivedProfile) {
        localStorage.setItem('hms_profile', JSON.stringify(receivedProfile));
      }
      return res.data;
    }
    throw new Error(res.data.message || 'Login failed');
  };

  const registerPatient = async (patientFormData) => {
    const res = await authAPI.registerPatient(patientFormData);
    if (res.data.success) {
      const { token: receivedToken, user: receivedUser, patientProfile } = res.data;
      setToken(receivedToken);
      setUser(receivedUser);
      setProfile(patientProfile);

      localStorage.setItem('hms_token', receivedToken);
      localStorage.setItem('hms_user', JSON.stringify(receivedUser));
      localStorage.setItem('hms_profile', JSON.stringify(patientProfile));
      return res.data;
    }
    throw new Error(res.data.message || 'Registration failed');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setProfile(null);
    localStorage.removeItem('hms_token');
    localStorage.removeItem('hms_user');
    localStorage.removeItem('hms_profile');
  };

  const updateStoredProfile = (updatedProfile) => {
    setProfile(updatedProfile);
    localStorage.setItem('hms_profile', JSON.stringify(updatedProfile));
  };

  const value = {
    user,
    profile,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    role: user ? user.role : null,
    login,
    registerPatient,
    logout,
    updateStoredProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
