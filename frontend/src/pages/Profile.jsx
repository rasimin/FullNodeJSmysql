import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Input from '../components/ui/Input';
import { User, Lock, Camera, Save, Mail } from 'lucide-react';
import DynamicIsland from '../components/DynamicIsland';

const Profile = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ 
    name: user?.name || '', 
    email: user?.email || '',
    username: user?.username || '',
    password: '', 
    confirmPassword: '' 
  });
  const [avatar, setAvatar] = useState(null);
  const [preview, setPreview] = useState(user?.avatar ? `http://localhost:5001${user.avatar}` : null);
  const [notification, setNotification] = useState({ status: 'idle', message: '' });

  const notify = (status, message) => {
    setNotification({ status, message });
    if (status !== 'loading') {
      setTimeout(() => setNotification({ status: 'idle' }), 3000);
    }
  };

  useEffect(() => {
    if (user) {
      setFormData(prev => ({ ...prev, name: user.name, email: user.email, username: user.username }));
      if (user.avatar) setPreview(`http://localhost:5001${user.avatar}`);
    }
  }, [user]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) { setAvatar(file); setPreview(URL.createObjectURL(file)); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Submit button clicked');

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

      console.log('Sending request to /auth/me with email:', formData.email);
      
      const response = await api.put('/auth/me', data, { 
        headers: { 'Content-Type': 'multipart/form-data' } 
      });

      console.log('Response received:', response.data);

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

      <h1 className="text-base font-bold text-gray-900 dark:text-white">My Profile</h1>

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
