import React from 'react';
import { motion } from 'framer-motion';
import { 
  Check, Rocket, Shield, Zap, Layout, 
  BarChart3, Smartphone, Globe, ArrowRight,
  Star, Users, Building2, Package, Sun, Moon
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const LandingPage = () => {
  const { theme, toggleTheme } = useTheme();
  const tiers = [
    {
      name: 'Starter',
      price: '50.000',
      description: 'Cocok untuk showroom kecil / perorangan',
      features: ['Katalog Produk (Max 20 Unit)', 'Manajemen Inventaris Dasar', '1 Akun Admin', 'Mobile Responsive View'],
      color: 'blue',
      popular: false
    },
    {
      name: 'Pro Business',
      price: '250.000',
      description: 'Paling populer untuk showroom menengah',
      features: [
        'Katalog Produk Tanpa Batas', 
        'Manajemen Multi-Branch', 
        'Statistik Penjualan & Analytics', 
        'Monitoring Sesi Aktif', 
        'Audit Trail & History',
        'Upload Gambar Premium'
      ],
      color: 'indigo',
      popular: true
    },
    {
      name: 'Showroom Elite',
      price: '1.000.000',
      description: 'Solusi lengkap untuk skala korporasi',
      features: [
        'Seluruh Fitur Pro Business',
        'API Access untuk Website Luar',
        'Prioritas Support 24/7',
        'Custom Domain Branding',
        'Laporan Pajak Otomatis',
        'Integrasi Payment Gateway'
      ],
      color: 'purple',
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0b0f] text-gray-900 dark:text-white overflow-hidden">
      {/* Theme Toggle - Floating */}
      <div className="fixed top-6 right-6 z-50">
        <button 
          onClick={toggleTheme}
          className="w-12 h-12 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-white/10 flex items-center justify-center text-gray-500 dark:text-gray-400 shadow-xl hover:scale-110 transition-all active:scale-95"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-blue-600/10 dark:bg-blue-600/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[20%] right-[-5%] w-[600px] h-[600px] bg-purple-600/10 dark:bg-purple-600/5 blur-[120px] rounded-full" />
      </div>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-6 max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest mb-6">
            <Zap size={14} /> The Next-Gen Inventory System
          </span>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-none">
            Modernize Your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300">Showroom Experience</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 font-medium">
            Kelola stok kendaraan, pantau penjualan, dan operasikan bisnis showroom Anda dengan sistem tercanggih, aman, dan user-friendly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <NavLink to="/catalog" className="px-8 py-4 bg-gray-950 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-500/20 hover:scale-105 transition-transform flex items-center gap-2 justify-center">
              View Catalog Demo <ArrowRight size={18} />
            </NavLink>
            <button className="px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Request Full Demo
            </button>
          </div>
        </motion.div>
      </section>

      {/* Feature Grid */}
      <section className="relative py-20 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: Layout, title: 'Premium Catalog', desc: 'Tampilan produk mewah dengan performa ultra-cepat.' },
            { icon: BarChart3, title: 'In-Depth Analytics', desc: 'Pantau grafik penjualan dan tren pasar secara real-time.' },
            { icon: Package, title: 'Smart Stock Management', desc: 'Kelola stok kendaraan dengan mudah, pantau unit tersedia & status booking.' }
          ].map((f, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-8 rounded-[32px] bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 hover:border-blue-500/30 transition-all group"
            >
              <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl text-blue-600 dark:text-blue-400 w-max mb-6 group-hover:scale-110 transition-transform">
                <f.icon size={24} />
              </div>
              <h3 className="text-xl font-black mb-2 uppercase">{f.title}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing Tiers */}
      <section className="relative py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black uppercase tracking-tight mb-2">Pilih Paket Showroom Anda</h2>
          <p className="text-gray-500 dark:text-gray-400 font-bold uppercase text-[10px] tracking-widest">Fleksibel & Terjangkau untuk Setiap Skala Bisnis</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {tiers.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className={`relative p-10 rounded-[40px] border flex flex-col transition-all duration-500 ${t.popular ? 'bg-gray-950 dark:bg-white text-white dark:text-gray-900 border-transparent shadow-2xl scale-105 z-10' : 'bg-white dark:bg-gray-800/20 border-gray-100 dark:border-white/5'}`}
            >
              {t.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-full font-black uppercase text-[10px] tracking-widest">
                  Most Recommended
                </div>
              )}
              
              <div className="mb-8">
                <h4 className="text-xs font-black uppercase tracking-widest opacity-60 mb-1">{t.name}</h4>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-black opacity-60">Rp</span>
                  <span className="text-5xl font-black tracking-tighter">{t.price}</span>
                  <span className="text-xs font-black opacity-40">/Bulan</span>
                </div>
                <p className={`text-xs font-medium mt-4 ${t.popular ? 'opacity-80' : 'text-gray-500'}`}>{t.description}</p>
              </div>

              <div className="space-y-4 mb-10 flex-1">
                {t.features.map((f, fi) => (
                  <div key={fi} className="flex items-center gap-3">
                    <div className={`p-1 rounded-full ${t.popular ? 'bg-white/20 dark:bg-gray-950/20' : 'bg-green-500/10 text-green-500'}`}>
                      <Check size={14} />
                    </div>
                    <span className="text-xs font-bold leading-none">{f}</span>
                  </div>
                ))}
              </div>

              <button className={`w-full py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${t.popular ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-lg' : 'bg-blue-600 text-white shadow-xl shadow-blue-500/20 hover:scale-[1.02]'}`}>
                Get Started Now
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-20 px-6 max-w-5xl mx-auto border-t border-gray-100 dark:border-white/5 mt-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          <div><p className="text-4xl font-black mb-1">250+</p><p className="text-[10px] font-black uppercase text-gray-400">Total Showrooms</p></div>
          <div><p className="text-4xl font-black mb-1">12K+</p><p className="text-[10px] font-black uppercase text-gray-400">Vehicles Sold</p></div>
          <div><p className="text-4xl font-black mb-1">99%</p><p className="text-[10px] font-black uppercase text-gray-400">Client Satisfaction</p></div>
          <div><p className="text-4xl font-black mb-1">24h</p><p className="text-[10px] font-black uppercase text-gray-400">System Uptime</p></div>
        </div>
      </section>

      {/* CTA Footer */}
      <footer className="relative py-20 px-6 text-center">
         <div className="max-w-4xl mx-auto p-12 bg-blue-600 rounded-[48px] text-white shadow-2xl flex flex-col items-center gap-6 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
            <h3 className="text-3xl md:text-5xl font-black uppercase z-10 leading-none">Ready to Scale Your Showroom?</h3>
            <p className="text-blue-100 font-bold uppercase text-xs tracking-widest z-10 opacity-80">Gabung sekarang dan rasakan kemudahan pengelolaan digital.</p>
            <button className="z-10 px-10 py-5 bg-white text-blue-600 rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:scale-105 transition-transform">
              Contact Sales Agent
            </button>
         </div>
         <p className="mt-12 text-[10px] font-black text-gray-400 uppercase tracking-widest">© 2026 AdminPanel | Premium Showroom Solution</p>
      </footer>
    </div>
  );
};

export default LandingPage;
