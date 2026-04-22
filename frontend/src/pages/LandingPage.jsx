import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, Rocket, Shield, Zap, Layout, 
  BarChart3, Smartphone, Globe, ArrowRight,
  Star, Users, Building2, Package, Sun, Moon,
  Search, MapPin, Car, Bike, ChevronRight,
  Database, TrendingUp, Layers, MousePointer2,
  Menu, X
} from 'lucide-react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const LandingPage = () => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = () => {
    if (searchTerm.trim()) {
      navigate(`/catalog?search=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      navigate('/catalog');
    }
  };

  const tiers = [
    {
      name: 'Starter',
      price: '50.000',
      description: 'Cocok untuk showroom kecil / perorangan',
      features: ['Katalog Produk (Max 20 Unit)', 'Manajemen Inventaris Dasar', '1 Akun Admin', 'Mobile Responsive View'],
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
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#050608] text-gray-900 dark:text-white transition-colors duration-500">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${isScrolled ? 'py-4 bg-white/80 dark:bg-[#050608]/80 backdrop-blur-xl border-b border-gray-100 dark:border-white/5' : 'py-6 bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20 group-hover:rotate-12 transition-transform">
              <Zap size={20} fill="currentColor" />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase">Showroom<span className="text-blue-600">Hub</span></span>
          </div>

          <div className="hidden md:flex items-center gap-8 font-bold text-[11px] uppercase tracking-widest text-gray-500 dark:text-gray-400">
            <NavLink to="/catalog" className="hover:text-blue-600 transition-colors">Catalog</NavLink>
            <a href="#solutions" className="hover:text-blue-600 transition-colors">Solutions</a>
            <a href="#pricing" className="hover:text-blue-600 transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="p-2.5 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:scale-110 transition-all active:scale-95">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="px-6 py-2.5 bg-gray-950 dark:bg-white text-white dark:text-gray-950 rounded-xl font-black text-[10px] uppercase tracking-[0.15em] hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95"
            >
              Dashboard
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-24 px-6 overflow-hidden">
        {/* Animated Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-600/10 dark:bg-blue-600/10 blur-[150px] rounded-full opacity-50" />
        <div className="absolute -top-20 -right-20 w-[500px] h-[500px] bg-purple-600/10 dark:bg-purple-600/5 blur-[120px] rounded-full" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] mb-8 border border-emerald-100 dark:border-emerald-500/20">
                <Shield size={14} className="fill-current" /> 100% Verified Showroom Units Only
              </span>
              <h1 className="text-5xl md:text-8xl font-black tracking-tight leading-[0.9] mb-8">
                Cari Unit <span className="text-blue-600">Terpercaya</span> <br />
                Langsung dari <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300 italic">Showroom.</span>
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
                Temukan ribuan kendaraan berkualitas tinggi yang telah melewati proses verifikasi ketat. <br className="hidden md:block" /> 
                Kami menjamin setiap unit berasal dari showroom resmi, bukan perorangan.
              </p>
            </motion.div>

            {/* Main Search Container */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="max-w-2xl mx-auto relative group"
            >
              <div className="absolute inset-0 bg-blue-600/20 blur-[30px] rounded-full group-hover:bg-blue-600/30 transition-all duration-500 opacity-0 group-hover:opacity-100" />
              <div className="relative bg-white/95 dark:bg-[#12141c]/95 border border-gray-200 dark:border-white/10 p-2 md:p-2 rounded-full shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] dark:shadow-none transition-all backdrop-blur-md">
                <div className="relative w-full flex items-center">
                  <Search className="absolute left-6 text-gray-400" size={22} />
                  <input
                    type="text"
                    placeholder="Cari Mobil atau Motor impian Anda..."
                    className="w-full h-14 md:h-16 bg-gray-100 dark:bg-white/5 border-none rounded-full pl-16 pr-16 text-base md:text-lg text-gray-900 dark:text-white placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <button
                    onClick={handleSearch}
                    className="absolute right-2 w-10 h-10 md:w-12 md:h-12 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-600/30"
                  >
                    <ArrowRight size={22} strokeWidth={3} />
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Verification Badges */}
            <div className="flex items-center justify-center gap-8 mt-10 opacity-60">
              <div className="flex items-center gap-2">
                <Check size={16} className="text-emerald-500" strokeWidth={3} />
                <span className="text-[10px] font-black uppercase tracking-widest">Showroom Resmi</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={16} className="text-emerald-500" strokeWidth={3} />
                <span className="text-[10px] font-black uppercase tracking-widest">Unit Terverifikasi</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={16} className="text-emerald-500" strokeWidth={3} />
                <span className="text-[10px] font-black uppercase tracking-widest">Bukan Perorangan</span>
              </div>
            </div>

            {/* Quick Links for Customers */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mr-2">Quick Access:</span>
              <button onClick={() => navigate('/catalog?type=Mobil')} className="px-5 py-2.5 rounded-full bg-gray-100 dark:bg-white/5 border border-transparent hover:border-blue-500/30 flex items-center gap-2 transition-all group">
                <Car size={16} className="text-gray-400 group-hover:text-blue-500" />
                <span className="text-[10px] font-black uppercase tracking-widest">Mobil</span>
              </button>
              <button onClick={() => navigate('/catalog?type=Motor')} className="px-5 py-2.5 rounded-full bg-gray-100 dark:bg-white/5 border border-transparent hover:border-blue-500/30 flex items-center gap-2 transition-all group">
                <Bike size={18} className="text-gray-400 group-hover:text-blue-500" />
                <span className="text-[10px] font-black uppercase tracking-widest">Motor</span>
              </button>
              <button onClick={() => navigate('/catalog')} className="px-5 py-2.5 rounded-full bg-gray-100 dark:bg-white/5 border border-transparent hover:border-blue-500/30 flex items-center gap-2 transition-all group">
                <Layers size={16} className="text-gray-400 group-hover:text-blue-500" />
                <span className="text-[10px] font-black uppercase tracking-widest">Semua Unit</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Showroom Solution Section */}
      <section id="solutions" className="relative py-32 px-6 bg-slate-50 dark:bg-[#08090d] overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-20">
            <div className="lg:w-1/2 space-y-8">
              <span className="text-blue-600 font-black uppercase text-[11px] tracking-[0.3em]">For Showroom Owners</span>
              <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1]">
                Scale Your Business <br />
                <span className="text-gray-400">With Data Precision.</span>
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed font-medium">
                Berhenti menggunakan spreadsheet manual. Kelola seluruh ekosistem bisnis Anda dari satu dashboard terpusat.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                {[
                  { icon: Database, title: 'Central Inventory', desc: 'Satu database untuk semua cabang.' },
                  { icon: TrendingUp, title: 'Sales Analytics', desc: 'Grafik performa real-time.' },
                  { icon: Users, title: 'Agent Management', desc: 'Pantau kinerja tim sales Anda.' },
                  { icon: Shield, title: 'Secure Audit', desc: 'History aktivitas yang terlindungi.' }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 group">
                    <div className="w-12 h-12 shrink-0 rounded-2xl bg-white dark:bg-white/5 flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-110 transition-transform">
                      <item.icon size={20} />
                    </div>
                    <div>
                      <h4 className="font-black text-xs uppercase tracking-wider mb-1">{item.title}</h4>
                      <p className="text-gray-400 text-[11px] font-bold leading-snug">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-8">
                <button 
                  onClick={() => navigate('/login')}
                  className="px-10 py-5 bg-blue-600 text-white rounded-[24px] font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-blue-600/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-4"
                >
                  Start Your Dashboard <ArrowRight size={18} />
                </button>
              </div>
            </div>

            <div className="lg:w-1/2 relative">
              <div className="absolute inset-0 bg-blue-600/10 blur-[100px] rounded-full" />
              {/* Fake Dashboard UI Preview */}
              <motion.div 
                initial={{ rotateY: -15, rotateX: 10 }}
                whileInView={{ rotateY: -5, rotateX: 5 }}
                transition={{ duration: 1 }}
                className="relative bg-white dark:bg-[#12141c] rounded-[40px] border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden p-8"
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  </div>
                  <div className="w-32 h-2 bg-gray-100 dark:bg-white/10 rounded-full" />
                </div>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-24 bg-blue-50 dark:bg-blue-500/10 rounded-3xl p-4 flex flex-col justify-between">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white"><TrendingUp size={14} /></div>
                      <div className="w-full h-2 bg-blue-200 dark:bg-blue-400/20 rounded-full" />
                    </div>
                    <div className="h-24 bg-gray-50 dark:bg-white/5 rounded-3xl p-4 flex flex-col justify-between">
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center text-gray-500"><Building2 size={14} /></div>
                      <div className="w-full h-2 bg-gray-200 dark:bg-white/10 rounded-full" />
                    </div>
                  </div>
                  <div className="h-40 bg-gray-50 dark:bg-white/5 rounded-[32px] p-6 relative overflow-hidden">
                     <div className="flex justify-between items-end h-full gap-2">
                        {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                          <div key={i} className="flex-1 bg-blue-600/20 rounded-t-lg relative group">
                             <div 
                                className="absolute bottom-0 left-0 right-0 bg-blue-600 rounded-t-lg transition-all duration-1000" 
                                style={{ height: `${h}%` }}
                             />
                          </div>
                        ))}
                     </div>
                  </div>
                </div>
              </motion.div>

              {/* Floating Element */}
              <motion.div 
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-10 -right-10 md:right-0 bg-white dark:bg-[#1a1c23] p-6 rounded-[32px] shadow-2xl border border-gray-100 dark:border-white/10 z-20"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                    <Star size={24} fill="white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Growth</p>
                    <p className="text-xl font-black">+142.8%</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section id="pricing" className="relative py-32 px-6 max-w-7xl mx-auto overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/5 blur-[150px] rounded-full pointer-events-none" />
        
        <div className="text-center mb-20 relative z-10">
          <span className="text-blue-600 font-black uppercase text-[11px] tracking-[0.4em] mb-4 inline-block">Pricing Strategy</span>
          <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-4 uppercase">Invest for Growth.</h2>
          <p className="text-gray-500 dark:text-gray-400 font-bold uppercase text-[10px] tracking-widest max-w-lg mx-auto leading-relaxed">Pilih paket yang sesuai dengan volume kendaraan dan kebutuhan operasional showroom Anda.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start relative z-10">
          {tiers.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative p-12 rounded-[48px] border flex flex-col transition-all duration-500 ${t.popular ? 'bg-gray-950 dark:bg-white text-white dark:text-gray-900 border-transparent shadow-[0_48px_80px_-16px_rgba(0,0,0,0.2)] dark:shadow-none scale-105 z-10' : 'bg-white dark:bg-white/5 border-gray-100 dark:border-white/5 hover:-translate-y-2'}`}
            >
              {t.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white px-8 py-2.5 rounded-full font-black uppercase text-[10px] tracking-[0.3em] shadow-xl">
                  Most Popular
                </div>
              )}
              
              <div className="mb-10">
                <h4 className="text-[11px] font-black uppercase tracking-[0.25em] opacity-50 mb-2">{t.name}</h4>
                <div className="flex items-baseline gap-1">
                  <span className="text-base font-black opacity-40">Rp</span>
                  <span className="text-6xl font-black tracking-tighter">{t.price}</span>
                  <span className="text-xs font-black opacity-30 ml-2">/mo</span>
                </div>
                <p className={`text-[11px] font-bold mt-6 leading-relaxed ${t.popular ? 'opacity-80' : 'text-gray-500'}`}>{t.description}</p>
              </div>

              <div className="space-y-5 mb-12 flex-1">
                {t.features.map((f, fi) => (
                  <div key={fi} className="flex items-center gap-4">
                    <div className={`shrink-0 p-1 rounded-full ${t.popular ? 'bg-white/20' : 'bg-blue-600/10 text-blue-600'}`}>
                      <Check size={14} strokeWidth={4} />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-wider">{f}</span>
                  </div>
                ))}
              </div>

              <button className={`w-full py-5 rounded-[24px] font-black uppercase text-[10px] tracking-[0.2em] transition-all ${t.popular ? 'bg-blue-600 text-white shadow-2xl shadow-blue-600/40' : 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white hover:bg-blue-600 hover:text-white hover:shadow-xl'}`}>
                Choose {t.name}
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-24 px-6 max-w-6xl mx-auto border-t border-gray-100 dark:border-white/5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          {[
            { label: 'Showrooms', val: '250+' },
            { label: 'Vehicles Sold', val: '12K+' },
            { label: 'Satisfaction', val: '99%' },
            { label: 'Uptime', val: '24h' }
          ].map((s, i) => (
            <div key={i}>
              <p className="text-4xl md:text-5xl font-black mb-2 tracking-tighter">{s.val}</p>
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em]">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Footer */}
      <footer className="relative py-32 px-6 text-center overflow-hidden">
         <div className="max-w-5xl mx-auto p-16 md:p-24 bg-blue-600 rounded-[64px] text-white shadow-2xl flex flex-col items-center gap-10 relative group">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-[10s]" />
            <div className="absolute -top-32 -left-32 w-64 h-64 bg-white/10 blur-[80px] rounded-full" />
            <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-black/10 blur-[80px] rounded-full" />
            
            <h3 className="text-4xl md:text-7xl font-black uppercase z-10 leading-[0.9] tracking-tighter max-w-2xl">Ready to <br /> Transform?</h3>
            <p className="text-blue-100 font-bold uppercase text-xs md:text-sm tracking-[0.3em] z-10 opacity-80 max-w-xl">
              Gabung dengan ratusan showroom lainnya dan tingkatkan efisiensi operasional Anda mulai hari ini.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 z-10">
              <button className="px-12 py-6 bg-white text-blue-600 rounded-[28px] font-black uppercase text-xs tracking-[0.25em] shadow-2xl hover:scale-105 active:scale-95 transition-all">
                Contact Sales
              </button>
              <button onClick={() => navigate('/catalog')} className="px-12 py-6 bg-blue-700 text-white border border-white/20 rounded-[28px] font-black uppercase text-xs tracking-[0.25em] hover:bg-blue-800 transition-all">
                Explore Catalog
              </button>
            </div>
         </div>
         <div className="mt-20 flex flex-col md:flex-row items-center justify-between max-w-5xl mx-auto opacity-40 gap-6">
            <p className="text-[10px] font-black uppercase tracking-[0.3em]">© 2026 ShowroomHub — Premium Solution</p>
            <div className="flex gap-8 text-[10px] font-black uppercase tracking-[0.2em]">
              <a href="#" className="hover:text-blue-600">Privacy Policy</a>
              <a href="#" className="hover:text-blue-600">Terms of Service</a>
            </div>
         </div>
      </footer>
    </div>
  );
};

export default LandingPage;

