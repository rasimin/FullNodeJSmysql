import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const response = await api.get('/auth/me');
          setUser(response.data);
        } catch (error) {
          console.error('Failed to fetch user', error);
          logout();
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, [token]);

  // Idle Timer Logic
  useEffect(() => {
    if (!token) return;

    let timeoutId;
    let events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    let attachedResetTimer = null;

    const setup = async () => {
      let timeoutMins = 15;
      try {
        const res = await api.get('/settings');
        const timeoutSetting = res.data.find(s => s.key === 'security_inactivity_timeout');
        if (timeoutSetting) timeoutMins = parseInt(timeoutSetting.value);
      } catch (e) {}

      attachedResetTimer = () => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          if (localStorage.getItem('token')) {
            logout();
            alert(`Sesi Anda telah berakhir karena tidak ada aktivitas selama ${timeoutMins} menit.`);
            window.location.href = '/login';
          }
        }, timeoutMins * 60 * 1000);
      };

      events.forEach(event => document.addEventListener(event, attachedResetTimer));
      attachedResetTimer(); // start initially
    };

    setup();

    return () => {
      if (attachedResetTimer) {
        events.forEach(event => document.removeEventListener(event, attachedResetTimer));
      }
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [token]);

  // (Setup logic handled in useEffect above)

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, user } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setToken(token);
    setUser(user);
    return user;
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch (e) {}
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
