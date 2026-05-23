import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Lock, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const isDev = import.meta.env.DEV;
  const [email, setEmail] = useState(isDev ? 'admin@example.com' : '');
  const [password, setPassword] = useState(isDev ? 'admin123' : '');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      setLoginSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 1200);
    } catch {
      setError('Kredensial tidak valid');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Mesh Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute w-[350px] h-[350px] rounded-full bg-blue-500/10 dark:bg-blue-600/15 blur-[120px] top-[-50px] left-[-50px]"></div>
        <div className="absolute w-[400px] h-[400px] rounded-full bg-indigo-500/10 dark:bg-purple-600/15 blur-[120px] bottom-[-80px] right-[-50px]"></div>
      </div>

      <button onClick={toggleTheme} className="btn-icon absolute top-4 right-4 z-10">
        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
      </button>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="card w-full max-w-sm p-8 z-10"
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
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"} required value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input pr-10" placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
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

      {/* Success Splash Screen Overlay */}
      <AnimatePresence>
        {loginSuccess && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-md text-white"
          >
            <motion.div 
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.4, ease: 'easeOut' }}
              className="flex flex-col items-center max-w-md text-center p-6"
            >
              <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/30">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2">Otentikasi Sukses!</h2>
              <p className="text-gray-300">Mempersiapkan Ruang Dashboard...</p>
              <div className="mt-6 flex gap-1 justify-center">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Login;
