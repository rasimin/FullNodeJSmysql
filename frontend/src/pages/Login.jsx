import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sun, Moon, Lock } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch {
      setError('Kredensial tidak valid');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center p-4 relative">
      <button onClick={toggleTheme} className="btn-icon absolute top-4 right-4">
        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
      </button>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="card w-full max-w-sm p-8"
      >
        {/* Icon + Title */}
        <div className="flex flex-col items-center mb-7">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
            <Lock size={22} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Masuk Ke Akun</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Panel Administrasi</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email / Nama Pengguna</label>
            <input
              type="text" required value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input" placeholder="admin@example.com atau admin"
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
              <button 
                type="button" 
                onClick={() => alert('Please contact your Super Admin to reset your password.')}
                className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 hover:underline"
              >
                Lupa Kata Sandi?
              </button>
            </div>
            <input
              type="password" required value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input" placeholder="••••••••"
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="btn-primary w-full py-2.5 mt-1"
            style={{ opacity: loading ? 0.7 : 1 }}
          >
            {loading ? (
              <span className="flex items-center gap-2 justify-center">
                <motion.span
                  className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                />
                Masuk...
              </span>
            ) : 'Masuk Sekarang'}
          </button>
        </form>

        <p className="text-xs text-center text-gray-400 mt-5">
          Use your admin credentials to access the panel
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
