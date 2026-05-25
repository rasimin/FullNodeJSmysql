import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Input from '../components/ui/Input';
import { User, Lock, Camera, Save, Mail, Smartphone, MapPin, AlignLeft } from 'lucide-react';
import DynamicIsland from '../components/DynamicIsland';
import { IMAGE_BASE_URL } from '../config';

const Profile = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ 
    name: user?.name || '', 
    email: user?.email || '',
    username: user?.username || '',
    password: '', 
    confirmPassword: '',
    sales_phone: user?.SalesAgent?.phone || '',
    sales_email: user?.SalesAgent?.email || '',
    sales_address: user?.SalesAgent?.address || '',
    sales_bio: user?.SalesAgent?.bio || '',
    sales_sync_avatar: true
  });

  const [avatar, setAvatar] = useState(null);
  const [preview, setPreview] = useState(user?.avatar ? `${IMAGE_BASE_URL}${user.avatar}` : null);
  const [salesAvatar, setSalesAvatar] = useState(null);
  const [salesPreview, setSalesPreview] = useState(user?.SalesAgent?.avatar_url ? `${IMAGE_BASE_URL}${user.SalesAgent.avatar_url}` : null);
  const [notification, setNotification] = useState({ status: 'idle', message: '' });

  const notify = (status, message) => {
    setNotification({ status, message });
    if (status !== 'loading') {
      setTimeout(() => setNotification({ status: 'idle' }), 3000);
    }
  };

  useEffect(() => {
    if (user) {
      const isSynced = user.SalesAgent ? (user.SalesAgent.avatar_url === user.avatar) : true;
      setFormData(prev => ({ 
        ...prev, 
        name: user.name, 
        email: user.email || '', 
        username: user.username,
        sales_phone: user.SalesAgent?.phone || '',
        sales_email: user.SalesAgent?.email || '',
        sales_address: user.SalesAgent?.address || '',
        sales_bio: user.SalesAgent?.bio || '',
        sales_sync_avatar: isSynced
      }));
      if (user.avatar) setPreview(`${IMAGE_BASE_URL}${user.avatar}`);
      if (user.SalesAgent?.avatar_url) {
        setSalesPreview(`${IMAGE_BASE_URL}${user.SalesAgent.avatar_url}`);
      }
    }
  }, [user]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) { 
      setAvatar(file); 
      setPreview(URL.createObjectURL(file)); 
    }
  };

  const handleSalesFileChange = (e) => {
    const file = e.target.files[0];
    if (file) { 
      setSalesAvatar(file); 
      setSalesPreview(URL.createObjectURL(file)); 
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password && formData.password !== formData.confirmPassword) {
      return notify('error', 'Passwords do not match');
    }

    notify('loading', 'Updating profile...');

    try {
      const data = new FormData();
      data.append('email', formData.email.trim());
      data.append('name', formData.name);
      if (formData.password) data.append('password', formData.password);
      if (avatar) data.append('avatar', avatar);

      // Append Sales Agent fields if user is a sales agent
      if (user?.SalesAgent) {
        data.append('sales_phone', formData.sales_phone);
        data.append('sales_email', formData.sales_email);
        data.append('sales_address', formData.sales_address);
        data.append('sales_bio', formData.sales_bio);
        data.append('sales_sync_avatar', formData.sales_sync_avatar);
        if (salesAvatar && !formData.sales_sync_avatar) {
          data.append('sales_avatar', salesAvatar);
        }
      }

      const response = await api.put('/auth/me', data, { 
        headers: { 'Content-Type': 'multipart/form-data' } 
      });

      // Update Local Storage
      const updatedUser = { ...user, ...response.data.user };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      notify('success', 'Profile updated successfully!');
      
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (err) {
      console.error('Update profile error:', err);
      const msg = err.response?.data?.message || 'Update failed. Check connection.';
      notify('error', msg);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <DynamicIsland status={notification.status} message={notification.message} />

      <h1 className="text-base font-bold text-gray-900 dark:text-white">Profil Saya</h1>

      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Avatar */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 overflow-hidden shadow-inner">
                {preview
                  ? <img src={preview} alt="Avatar" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-gray-400"><User size={36} /></div>
                }
              </div>
              <label className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors shadow-lg border-2 border-white dark:border-gray-900">
                <Camera size={14} className="text-white" />
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
              </label>
            </div>
            <p className="text-xs text-gray-400">JPG, PNG — max 5MB</p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <Input label="Full Name" icon={User} required value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Your name" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Username" icon={User} required disabled value={formData.username}
              className="opacity-70" placeholder="your_username" />
            
            <Input label="Email (Optional)" icon={Mail} type="email" value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})} placeholder="your@email.com" />
          </div>

          {/* Password */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Account Security</h3>
              <span className="text-[10px] text-gray-400 font-medium bg-gray-50 dark:bg-gray-900 px-2 py-0.5 rounded border border-gray-100 dark:border-gray-800">Password is optional</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="New Password" icon={Lock} type="password" value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})} placeholder="Leave blank to keep current" />
              <Input label="Confirm Password" icon={Lock} type="password" value={formData.confirmPassword}
                onChange={e => setFormData({...formData, confirmPassword: e.target.value})} placeholder="Re-type password" />
            </div>
          </div>

          {/* Sales Agent Details (Only shown if user is a Sales Agent) */}
          {user?.SalesAgent && (
            <div className="border-t border-gray-100 dark:border-gray-800 pt-5 space-y-5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Detail Profil Sales Agent</span>
              </div>
              
              {/* Sales Avatar Sync & Upload */}
              <div className="flex flex-col items-center gap-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800/80">
                <label className="flex items-center gap-2 cursor-pointer select-none self-start">
                  <input 
                    type="checkbox" 
                    checked={formData.sales_sync_avatar}
                    onChange={e => setFormData({ ...formData, sales_sync_avatar: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                  />
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Samakan foto sales dengan foto profil utama</span>
                </label>

                {!formData.sales_sync_avatar ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full bg-gray-155 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 overflow-hidden shadow-inner">
                        {salesPreview
                          ? <img src={salesPreview} alt="Sales Avatar" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-gray-400"><User size={24} /></div>
                        }
                      </div>
                      <label className="absolute bottom-0 right-0 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors shadow-lg border-2 border-white dark:border-gray-900">
                        <Camera size={12} className="text-white" />
                        <input type="file" className="hidden" accept="image/*" onChange={handleSalesFileChange} />
                      </label>
                    </div>
                    <p className="text-[10px] text-gray-400">Foto Khusus Sales Agent</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3 w-full bg-blue-50/20 dark:bg-blue-900/10 border border-blue-100/30 dark:border-blue-900/30 rounded-lg">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-blue-500/20 shadow-sm shrink-0">
                      {preview ? <img src={preview} className="w-full h-full object-cover" alt="" /> : <User size={16} />}
                    </div>
                    <div className="text-left">
                      <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400">Foto Profil Utama Disinkronkan</p>
                      <p className="text-[10px] text-gray-450 dark:text-gray-500 mt-0.5">Foto sales akan otomatis sama dengan foto profil utama saat disimpan.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Sales Text Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800/80">
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Kode Sales</span>
                  <p className="text-xs font-bold text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-150 dark:border-gray-850 font-mono select-all">
                    {user.SalesAgent.sales_code || 'Belum diatur'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Nomor Telepon Sales</span>
                  <input
                    type="text"
                    required
                    value={formData.sales_phone}
                    onChange={e => setFormData({ ...formData, sales_phone: e.target.value })}
                    className="input w-full py-1.5 px-3 text-xs font-bold transition-all focus:border-blue-500"
                    placeholder="Contoh: 081234567890"
                  />
                </div>
                <div className="md:col-span-2">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Alamat Email Sales</span>
                  <input
                    type="email"
                    required
                    value={formData.sales_email}
                    onChange={e => setFormData({ ...formData, sales_email: e.target.value })}
                    className="input w-full py-1.5 px-3 text-xs font-bold transition-all focus:border-blue-500"
                    placeholder="Contoh: sales@example.com"
                  />
                </div>
                <div className="md:col-span-2">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Alamat Lengkap</span>
                  <textarea
                    required
                    value={formData.sales_address}
                    onChange={e => setFormData({ ...formData, sales_address: e.target.value })}
                    className="input w-full py-2 px-3 text-xs font-medium transition-all focus:border-blue-500 min-h-[60px] resize-none"
                    placeholder="Tulis alamat sales lengkap..."
                  />
                </div>
                <div className="md:col-span-2">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Bio / Deskripsi Penjualan</span>
                  <textarea
                    required
                    value={formData.sales_bio}
                    onChange={e => setFormData({ ...formData, sales_bio: e.target.value })}
                    className="input w-full py-2 px-3 text-xs font-medium transition-all focus:border-blue-500 min-h-[60px] resize-none"
                    placeholder="Tulis bio singkat sales di sini..."
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button 
              type="submit" 
              disabled={notification.status === 'loading'}
              className="btn-primary px-8 py-2.5 gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50"
            >
              <Save size={16} /> Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
