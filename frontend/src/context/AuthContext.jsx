import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const [idleTimer, setIdleTimer] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const response = await api.get('/auth/me');
          setUser(response.data);
          setupIdleTimer();
        } catch (error) {
          console.error('Failed to fetch user', error);
          logout();
        }
      }
      setLoading(false);
    };

    fetchUser();
    return () => clearIdleTimer();
  }, [token]);

  const clearIdleTimer = () => {
    if (idleTimer) clearTimeout(idleTimer);
  };

  const setupIdleTimer = async () => {
    clearIdleTimer();
    
    try {
      // Get timeout from settings (default to 15 mins if fails)
      const res = await api.get('/settings');
      const timeoutSetting = res.data.find(s => s.key === 'security_inactivity_timeout');
      const timeoutMins = timeoutSetting ? parseInt(timeoutSetting.value) : 15;
      
      const timeoutMs = timeoutMins * 60 * 1000;

      const resetTimer = () => {
        clearIdleTimer();
        const timer = setTimeout(() => {
          console.log('Inactivity timeout reached. Logging out...');
          logout();
          alert('Sesi Anda telah berakhir karena tidak ada aktivitas selama ' + timeoutMins + ' menit.');
        }, timeoutMs);
        setIdleTimer(timer);
      };

      // Events to track
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
      events.forEach(event => document.addEventListener(event, resetTimer));
      
      resetTimer(); // Initialize

      return () => {
        events.forEach(event => document.removeEventListener(event, resetTimer));
        clearIdleTimer();
      }
    } catch (err) {
      console.warn('Could not fetch activity timeout, using default 15m');
      // Default fallback if settings can't be fetched
    }
  };

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
    clearIdleTimer();
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
