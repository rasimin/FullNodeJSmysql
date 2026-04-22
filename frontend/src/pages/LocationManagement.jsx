import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../services/api';
import { API_URL } from '../config';
import { 
  Search, Plus, MapPin, Trash2, Edit, Map, Navigation, Hash, 
  ChevronRight, ChevronDown, FolderTree, Settings, User, 
  LayoutGrid, Building2, MapPinned, MoreHorizontal, LayoutList,
  RefreshCcw, Loader2
} from 'lucide-react';
import Modal from '../components/Modal';
import DynamicIsland from '../components/DynamicIsland';
import Input from '../components/ui/Input';
import { motion, AnimatePresence } from 'framer-motion';
import { useRef } from 'react';

const LocationManagement = () => {
  const [locations, setLocations] = useState([]); // Flat list of loaded nodes
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [formData, setFormData] = useState({
    name: '', type: 'PROVINCE', parent_id: '', postal_code: '', region_code: ''
  });
  const [notification, setNotification] = useState({ status: 'idle', message: '' });
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState({});
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ percent: 0, message: '' });
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeActionsId, setActiveActionsId] = useState(null);
  const [loadingNodes, setLoadingNodes] = useState({}); // Tracking which nodes are fetching children
  const eventSourceRef = useRef(null);

  // Debouncing effect for search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  const notify = (status, message, delay = 2000) => {
    setNotification({ status, message });
    if (status !== 'loading') setTimeout(() => setNotification({ status: 'idle' }), delay);
  };

  // Optimized Fetch: Supports root only or search results
  const fetchLocations = useCallback(async (parentId = null, query = '') => {
    if (!parentId && !query) setLoading(true);
    if (parentId) setLoadingNodes(prev => ({ ...prev, [parentId]: true }));

    try {
      const params = {};
      if (query) params.search = query;
      else params.parent_id = parentId;

      const r = await api.get('/locations', { params });
      
      if (query) {
        // Search results: set them and expand all
        setLocations(r.data);
        const allIds = {};
        r.data.forEach(item => allIds[item.id] = true);
        setExpanded(allIds);
      } else {
        // Lazy load results are appended
        setLocations(prev => {
          const existingIds = new Set(prev.map(l => l.id));
          const newItems = r.data.filter(item => !existingIds.has(item.id));
          return [...prev, ...newItems];
        });
      }
    } catch { 
      notify('error', 'Gagal memuat data wilayah'); 
    } finally {
      setLoading(false);
      if (parentId) setLoadingNodes(prev => ({ ...prev, [parentId]: false }));
    }
  }, []);

  // Initial load: Only provinces
  useEffect(() => {
    if (!debouncedSearch) {
      setLocations([]); // Reset when clearing search
      fetchLocations(null);
    } else {
      fetchLocations(null, debouncedSearch);
    }
  }, [debouncedSearch, fetchLocations]);

  const toggleExpand = async (node) => {
    const id = node.id;
    const isExpanding = !expanded[id];
    setExpanded(prev => ({ ...prev, [id]: isExpanding }));

    // If expanding and no children loaded yet, fetch them
    if (isExpanding && node.type !== 'POSTAL_CODE') {
        const hasChildrenLoaded = locations.some(l => l.parent_id === id);
        if (!hasChildrenLoaded) {
            await fetchLocations(id);
        }
    }
  };

  const collapseAll = () => setExpanded({});

  // Stats calculation
  const stats = useMemo(() => ({
    provinces: 34, 
    cities: 514,
    districts: 87687
  }), []);

  const buildTree = (items) => {
    const map = {};
    const roots = [];
    items.forEach(item => map[item.id] = { ...item, children: [] });
    items.forEach(item => {
      if (item.parent_id && map[item.parent_id]) {
        map[item.parent_id].children.push(map[item.id]);
      } else if (!item.parent_id || !map[item.parent_id]) {
        if (!roots.some(r => r.id === item.id)) roots.push(map[item.id]);
      }
    });
    return roots;
  };

  const treeData = useMemo(() => buildTree(locations), [locations]);

  const openModal = (loc = null, typeHint = 'PROVINCE', parentHint = '') => {
    setEditingLocation(loc);
    setFormData(loc ? { 
      name: loc.name, type: loc.type, parent_id: loc.parent_id || '', postal_code: loc.postal_code || '', region_code: loc.region_code || '' 
    } : { 
      name: '', type: typeHint, parent_id: parentHint, postal_code: '', region_code: '' 
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    notify('loading', editingLocation ? 'Sinkronisasi...' : 'Membuat...');
    try {
      const payload = { ...formData, parent_id: formData.parent_id || null };
      editingLocation ? await api.put(`/locations/${editingLocation.id}`, payload) : await api.post('/locations', payload);
      notify('success', 'Data wilayah diperbarui'); 
      setIsModalOpen(false); 
      fetchLocations(formData.parent_id || null);
    } catch { notify('error', 'Transaksi gagal'); }
  };

  const handleDelete = async () => {
    notify('loading', 'Menghapus...');
    try { 
      await api.delete(`/locations/${confirmDeleteId}`); 
      setLocations(prev => prev.filter(l => l.id !== confirmDeleteId));
      setConfirmDeleteId(null); 
      notify('success', 'Dihapus'); 
    } catch { notify('error', 'Kesalahan integritas'); }
  };

  const handleSync = () => {
    setIsSyncing(true);
    setSyncProgress({ percent: 0, message: 'Menghubungkan...' });
    const token = localStorage.getItem('token');
    const es = new EventSource(`${API_URL}/locations/sync?token=${token}`);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.error) {
        notify('error', data.error);
        es.close();
        setIsSyncing(false);
      } else {
        setSyncProgress({ percent: data.percent, message: data.message });
        if (data.percent === 100) {
          notify('success', 'Sinkronisasi Selesai');
          es.close();
          setTimeout(() => {
            setIsSyncing(false);
            window.location.reload();
          }, 1000);
        }
      }
    };

    es.onerror = () => {
      notify('error', 'Koneksi terputus');
      es.close();
      setIsSyncing(false);
    };
  };

  const stopSync = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsSyncing(false);
      notify('error', 'Sinkronisasi dihentikan oleh user');
      window.location.reload();
    }
  };

  const TreeItem = ({ node, level = 0 }) => {
    const isExpanded = expanded[node.id];
    const isLoading = loadingNodes[node.id];
    const canHaveChildren = node.type !== 'POSTAL_CODE';
    const hasLoadedChildren = node.children && node.children.length > 0;

    const Icon = node.type === 'PROVINCE' ? Map : node.type === 'CITY' ? Building2 : node.type === 'DISTRICT' ? MapPin : Hash;
    const iconColor = node.type === 'PROVINCE' ? 'text-blue-500' : node.type === 'CITY' ? 'text-emerald-500' : node.type === 'DISTRICT' ? 'text-orange-500' : 'text-slate-500';

    const getNextType = (type) => {
      if (type === 'PROVINCE') return 'CITY';
      if (type === 'CITY') return 'DISTRICT';
      if (type === 'DISTRICT') return 'POSTAL_CODE';
      return null;
    };

    return (
      <div className="flex flex-col">
        <motion.div 
          layout
          className={`group relative flex items-center h-10 md:h-12 px-2 md:px-4 rounded-xl transition-all duration-200 cursor-pointer select-none ${
            isExpanded ? 'bg-blue-500/[0.03] dark:bg-blue-500/[0.05]' : 'hover:bg-slate-500/5 dark:hover:bg-white/[0.02]'
          }`}
          onClick={(e) => { e.stopPropagation(); toggleExpand(node); }}
        >
          <div className="flex items-center gap-1.5 md:gap-4 flex-1 min-w-0" style={{ paddingLeft: `calc(${level} * (window.innerWidth < 768 ? 10 : 28) * 1px)` }}>
            <div className={`shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-90' : 'rotate-0'} ${!canHaveChildren ? 'opacity-0' : 'text-slate-400 dark:text-gray-500'}`}>
              <ChevronRight size={12} />
            </div>
            
            <div className={`shrink-0 w-6 h-6 md:w-8 md:h-8 rounded-lg flex items-center justify-center ${iconColor} bg-current/10 dark:bg-current/[0.05]`}>
               {isLoading ? <Loader2 size={12} className="animate-spin" /> : <Icon size={12} />}
            </div>

            <span className={`text-[12px] md:text-[13px] font-semibold truncate leading-tight ${node.type === 'PROVINCE' ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}`}>
              <div className="flex flex-col">
                <div className="flex items-center">
                  <span className="opacity-40 text-[9px] mr-1.5 font-mono">{node.region_code || '---'}</span>
                  {node.name} {node.postal_code && <span className="ml-1 md:ml-2 text-[9px] md:text-[10px] text-gray-400 font-normal">[{node.postal_code}]</span>}
                </div>
                {node.type === 'POSTAL_CODE' && !search && <span className="text-[8px] text-gray-400 font-normal uppercase opacity-60 leading-none">Kelurahan</span>}
              </div>
            </span>
          </div>

          <div className="flex items-center gap-2 md:gap-6 shrink-0 relative">
            <div className="flex items-center">
              <div className="hidden md:flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all duration-200">
                {canHaveChildren && (
                    <button onClick={(e) => { e.stopPropagation(); openModal(null, getNextType(node.type), node.id); }} className="w-8 h-8 flex items-center justify-center hover:bg-blue-500/10 text-blue-500 rounded-lg cursor-pointer transition-colors">
                      <Plus size={14} />
                    </button>
                )}
                <button onClick={(e) => { e.stopPropagation(); openModal(node); }} className="btn-edit w-8 h-8">
                    <Edit size={14} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(node.id); }} className="btn-delete w-8 h-8">
                    <Trash2 size={14} />
                </button>
              </div>

              <div className="md:hidden relative">
                <button 
                  onClick={(e) => { e.stopPropagation(); setActiveActionsId(activeActionsId === node.id ? null : node.id); }}
                  className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${activeActionsId === node.id ? 'bg-blue-500 text-white' : 'text-gray-400 hover:bg-gray-100'}`}
                >
                  <MoreHorizontal size={16} />
                </button>

                <AnimatePresence>
                   {activeActionsId === node.id && (
                     <>
                       <div className="fixed inset-0 z-[90] bg-black/20 md:bg-transparent backdrop-blur-[1px] md:backdrop-blur-0" onClick={(e) => { e.stopPropagation(); setActiveActionsId(null); }} />
                       <motion.div 
                         initial={{ opacity: 0, scale: 0.9, y: 10 }}
                         animate={{ opacity: 1, scale: 1, y: 0 }}
                         exit={{ opacity: 0, scale: 0.9, y: 10 }}
                         className="fixed md:absolute inset-x-10 md:inset-auto md:right-0 top-1/2 md:top-full mt-2 -translate-y-1/2 md:translate-y-0 w-auto md:w-40 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl md:rounded-xl shadow-2xl z-[100] overflow-hidden"
                       >
                         {canHaveChildren && (
                           <button onClick={(e) => { e.stopPropagation(); setActiveActionsId(null); openModal(null, getNextType(node.type), node.id); }} className="w-full flex items-center justify-center md:justify-start gap-3 px-6 py-4 md:px-4 md:py-3 text-[12px] md:text-[11px] font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                             <Plus size={16} /> Tambah
                           </button>
                         )}
                         <button onClick={(e) => { e.stopPropagation(); setActiveActionsId(null); openModal(node); }} className="w-full flex items-center justify-center md:justify-start gap-3 px-6 py-4 md:px-4 md:py-3 text-[12px] md:text-[11px] font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors border-t border-gray-50 dark:border-gray-700">
                           <Edit size={16} /> Edit
                         </button>
                         <button onClick={(e) => { e.stopPropagation(); setActiveActionsId(null); setConfirmDeleteId(node.id); }} className="w-full flex items-center justify-center md:justify-start gap-3 px-6 py-4 md:px-4 md:py-3 text-[12px] md:text-[11px] font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-t border-gray-50 dark:border-gray-700">
                           <Trash2 size={16} /> Delete
                         </button>
                         <button onClick={(e) => { e.stopPropagation(); setActiveActionsId(null); }} className="md:hidden w-full py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-t border-gray-100 dark:border-gray-700 bg-gray-50/50">Close</button>
                       </motion.div>
                     </>
                   )}
                 </AnimatePresence>
              </div>
            </div>

            {hasLoadedChildren && (
               <span className="w-6 h-5 md:w-7 md:h-6 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 text-[9px] md:text-[10px] font-bold border border-gray-200 dark:border-gray-700">
                  {node.children.length}
               </span>
            )}
          </div>
        </motion.div>

        <AnimatePresence>
          {isExpanded && hasLoadedChildren && (
            <div 
              className="overflow-hidden border-l border-gray-100 dark:border-gray-800 ml-3 md:ml-8 mt-0.5"
              style={{ marginLeft: `calc((${level} * (window.innerWidth < 768 ? 10 : 28) + (window.innerWidth < 768 ? 12 : 36)) * 1px)` }}
            >
              <div className="py-0">
                {node.children.map(child => <TreeItem key={child.id} node={child} level={level + 1} />)}
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-transparent md:bg-gray-50 dark:bg-transparent md:dark:bg-gray-950 text-gray-600 dark:text-gray-400 font-inter p-2 md:p-8 lg:p-12 transition-colors duration-500">
      <DynamicIsland 
        status={confirmDeleteId ? 'confirm' : notification.status} 
        message={confirmDeleteId ? 'Hapus wilayah ini?' : notification.message} 
        onConfirm={handleDelete} onCancel={() => setConfirmDeleteId(null)} 
      />

      <div className="max-w-4xl mx-auto space-y-3 md:space-y-8">
        <div className="relative group">
           <div className="absolute left-3 md:left-8 top-0 bottom-0 flex items-center justify-center text-gray-400 dark:text-gray-500 group-focus-within:text-blue-500 transition-colors pointer-events-none z-10 w-8 md:w-10">
              <Search size={18} md={22} />
           </div>
           <input 
              type="text" 
              style={{ paddingLeft: window.innerWidth < 768 ? '40px' : '84px' }}
              className="w-full h-12 md:h-16 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl md:rounded-2xl pr-4 text-[11px] md:text-sm font-medium focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all outline-none text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 shadow-sm" 
              placeholder="Cari lokasi (minimal 3 karakter)..." 
              value={search} onChange={(e) => setSearch(e.target.value)} 
           />
        </div>

        <div className="flex flex-row gap-1.5 md:gap-4">
           {[
              { val: stats.provinces, label: 'PROV', fullLabel: 'PROVINSI', color: 'text-blue-500' },
              { val: stats.cities, label: 'KAB', fullLabel: 'KAB / KOTA', color: 'text-emerald-500' },
              { val: stats.districts, label: 'KEC', fullLabel: 'KECAMATAN', color: 'text-orange-500' }
           ].map((s, i) => (
              <div key={i} className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl md:rounded-2xl p-2 md:p-6 flex flex-col items-start space-y-0 hover:border-blue-500/30 transition-all shadow-sm cursor-default overflow-hidden">
                 <div className={`text-base md:text-3xl font-black ${s.color}`}>{s.val}</div>
                 <div className="text-[7px] md:text-[10px] font-bold text-gray-400 dark:text-gray-500 tracking-wider truncate w-full">
                    <span className="hidden md:inline">{s.fullLabel}</span>
                    <span className="md:hidden">{s.label}</span>
                 </div>
              </div>
           ))}
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl md:rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none relative z-0">
           <div className="px-3 py-3 md:px-6 md:py-5 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 md:gap-3 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md sticky top-0 z-10">
              <h2 className="text-[10px] md:text-sm font-bold text-gray-900 dark:text-white uppercase tracking-tight">Wilayah Indonesia</h2>
              <div className="flex flex-wrap gap-1 md:gap-2 w-full sm:w-auto">
                <button onClick={handleSync} disabled={isSyncing} className={`h-7 md:h-9 px-2 md:px-4 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-bold transition-all border flex items-center gap-1.5 md:gap-2 cursor-pointer ${isSyncing ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50'}`}>
                   <RefreshCcw size={10} md={12} className={isSyncing ? 'animate-spin' : ''} />
                   <span className="hidden md:inline">{isSyncing ? 'Sinkronisasi...' : 'Sinkronisasi Data'}</span>
                </button>
                <button onClick={collapseAll} className="h-7 md:h-9 px-2 md:px-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-bold transition-all border border-gray-200 dark:border-none cursor-pointer">Tutup Semua</button>
                <button onClick={() => openModal()} className="h-7 md:h-9 px-3 md:px-6 bg-blue-600 hover:bg-blue-400 text-white rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-wider transition-all shadow-lg shadow-blue-500/20 active:scale-95 text-center flex items-center justify-center cursor-pointer ml-auto sm:ml-0">+ BARU</button>
              </div>
           </div>

           <div className="relative min-h-[400px]">
              {(loading || isSyncing) && (
                <div className="absolute inset-x-0 top-0 z-20 bg-white/60 dark:bg-gray-900/60 backdrop-blur-[1px] border-b border-gray-100 dark:border-gray-800">
                  <div className="h-1 w-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <motion.div 
                      className="h-full bg-blue-500"
                      initial={{ width: 0 }}
                      animate={isSyncing ? { width: `${syncProgress.percent}%` } : { width: '100%' }}
                      transition={isSyncing ? { type: 'spring', bounce: 0 } : { duration: 2, repeat: Infinity }}
                    />
                  </div>
                  <div className="px-4 py-2 flex justify-between items-center text-[9px] font-black tracking-widest uppercase">
                    <span className="text-blue-600 dark:text-blue-400 animate-pulse">
                      {isSyncing ? syncProgress.message : 'Memuat Data Wilayah...'}
                    </span>
                    <div className="flex items-center gap-4">
                      {isSyncing && (
                        <button 
                          onClick={stopSync}
                          className="px-2 py-0.5 bg-red-500 hover:bg-red-600 text-white rounded text-[8px] font-black transition-colors"
                        >
                          STOP SINKRONISASI
                        </button>
                      )}
                      {(isSyncing && syncProgress.percent > 0) && (
                        <span className="text-blue-600 dark:text-blue-400">{syncProgress.percent}%</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="p-2 overflow-y-auto max-h-[60vh] custom-scrollbar pb-40">
                {loading && treeData.length === 0 ? (
                  <div className="py-24 text-center space-y-4">
                      <div className="w-8 h-8 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto" />
                      <p className="text-[9px] uppercase font-bold tracking-[0.3em] text-gray-300 dark:text-gray-700">Sinkronisasi Data Wilayah...</p>
                  </div>
                ) : treeData.length === 0 ? (
                  <div className="py-24 text-center text-gray-300 dark:text-gray-800 text-[10px] font-bold uppercase tracking-[0.4em]">
                    {search ? 'Lokasi tidak ditemukan' : 'Wilayah Kosong'}
                  </div>
                ) : (
                  <div className={`space-y-0 ${(loading || isSyncing) ? 'opacity-40 grayscale pointer-events-none transition-all duration-300' : ''}`}>
                    {treeData.map(node => (
                      <TreeItem key={node.id} node={node} />
                    ))}
                  </div>
                )}
              </div>
           </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Sinkronisasi Wilayah">
        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          {/* Form remains mostly the same, but parent selection could also be optimized if needed */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Tipe Wilayah</label>
              <select className="w-full h-12 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 text-xs font-bold uppercase text-gray-900 dark:text-white focus:border-blue-500 outline-none transition-all" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value, parent_id: ''})}>
                <option value="PROVINCE">Provinsi</option>
                <option value="CITY">Kota / Kabupaten</option>
                <option value="DISTRICT">Kecamatan</option>
                <option value="POSTAL_CODE">Kelurahan / Kode Pos</option>
              </select>
            </div>
            {formData.type !== 'PROVINCE' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Parent ID</label>
                <input 
                  type="text" required className="w-full h-12 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 text-xs font-bold text-gray-900 dark:text-white focus:border-blue-500 outline-none transition-all" 
                  value={formData.parent_id} onChange={e => setFormData({...formData, parent_id: e.target.value})} 
                  placeholder="ID Wilayah Induk"
                />
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nama Wilayah" icon={Navigation} required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} placeholder="MISAL: YOGYAKARTA" className="h-12 rounded-xl bg-gray-50 dark:bg-gray-900" />
            <Input label="Region Code (BPS)" icon={Hash} value={formData.region_code} onChange={e => setFormData({...formData, region_code: e.target.value})} placeholder="E.G. 31.71" className="h-12 rounded-xl bg-gray-50 dark:bg-gray-900" />
          </div>
          
          {formData.type === 'POSTAL_CODE' && (
            <Input label="Kode Pos" icon={Hash} value={formData.postal_code} onChange={e => setFormData({...formData, postal_code: e.target.value})} placeholder="MISAL: 55121" className="h-12 rounded-xl bg-gray-50 dark:bg-gray-900" />
          )}
          
          <button type="submit" className="w-full h-14 bg-gray-900 dark:bg-white hover:opacity-90 text-white dark:text-gray-900 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-xl shadow-black/10 cursor-pointer">Commit Registry</button>
        </form>
      </Modal>
    </div>
  );
};

export default LocationManagement;
