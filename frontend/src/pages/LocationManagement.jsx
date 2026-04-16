import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { API_URL } from '../config';
import { 
  Search, Plus, MapPin, Trash2, Edit, Map, Navigation, Hash, 
  ChevronRight, ChevronDown, FolderTree, Settings, User, 
  LayoutGrid, Building2, MapPinned, MoreHorizontal, LayoutList,
  RefreshCcw
} from 'lucide-react';
import Modal from '../components/Modal';
import DynamicIsland from '../components/DynamicIsland';
import Input from '../components/ui/Input';
import { motion, AnimatePresence } from 'framer-motion';

const LocationManagement = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [formData, setFormData] = useState({
    name: '', type: 'PROVINCE', parent_id: '', postal_code: ''
  });
  const [notification, setNotification] = useState({ status: 'idle', message: '' });
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState({});
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ percent: 0, message: '' });
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debouncing effect to prevent laggy typing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const notify = (status, message, delay = 2000) => {
    setNotification({ status, message });
    if (status !== 'loading') setTimeout(() => setNotification({ status: 'idle' }), delay);
  };

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const r = await api.get('/locations');
      setLocations(r.data);
    } catch { notify('error', 'Registry access failed'); }
    setLoading(false);
  };

  useEffect(() => { fetchLocations(); }, []);

  const toggleExpand = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const allIds = {};
    locations.forEach(l => allIds[l.id] = true);
    setExpanded(allIds);
  };

  const collapseAll = () => setExpanded({});

  const buildTree = (items) => {
    const map = {};
    const roots = [];
    items.forEach(item => map[item.id] = { ...item, children: [] });
    items.forEach(item => {
      if (item.parent_id && map[item.parent_id]) map[item.parent_id].children.push(map[item.id]);
      else if (!item.parent_id) roots.push(map[item.id]);
    });
    return roots;
  };

  const treeData = useMemo(() => buildTree(locations), [locations]);

  // Pre-calculate which nodes should be visible or expanded based on search
  const searchResults = useMemo(() => {
    if (!debouncedSearch) return { matchedIds: new Set(), parentIdsToExpand: new Set() };
    
    const matchedIds = new Set();
    const parentIdsToExpand = new Set();
    const query = debouncedSearch.toLowerCase();

    const traverse = (items, path = []) => {
      let branchHasMatch = false;
      for (const item of items) {
        const selfMatch = item.name.toLowerCase().includes(query) || 
                         (item.postal_code && item.postal_code.includes(query));
        
        const childrenMatch = item.children?.length > 0 ? traverse(item.children, [...path, item.id]) : false;
        
        if (selfMatch || childrenMatch) {
          matchedIds.add(item.id);
          path.forEach(pid => parentIdsToExpand.add(pid)); // Mark all ancestors for expansion
          branchHasMatch = true;
        }
      }
      return branchHasMatch;
    };

    traverse(treeData);
    return { matchedIds, parentIdsToExpand };
  }, [debouncedSearch, treeData]);

  // Stats calculation
  const stats = {
    provinces: locations.filter(l => l.type === 'PROVINCE').length,
    cities: locations.filter(l => l.type === 'CITY').length,
    districts: locations.filter(l => l.type === 'DISTRICT' || l.type === 'POSTAL_CODE').length
  };

  const openModal = (loc = null, typeHint = 'PROVINCE', parentHint = '') => {
    setEditingLocation(loc);
    setFormData(loc ? { 
      name: loc.name, type: loc.type, parent_id: loc.parent_id || '', postal_code: loc.postal_code || '' 
    } : { 
      name: '', type: typeHint, parent_id: parentHint, postal_code: '' 
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    notify('loading', editingLocation ? 'Syncing...' : 'Creating...');
    try {
      const payload = { ...formData, parent_id: formData.parent_id || null };
      editingLocation ? await api.put(`/locations/${editingLocation.id}`, payload) : await api.post('/locations', payload);
      notify('success', 'Registry updated'); setIsModalOpen(false); fetchLocations();
    } catch { notify('error', 'Transaction failed'); }
  };

  const handleDelete = async () => {
    notify('loading', 'Revoking...');
    try { 
      await api.delete(`/locations/${confirmDeleteId}`); 
      setConfirmDeleteId(null); notify('success', 'Purged'); fetchLocations(); 
    } catch { notify('error', 'Integrity error'); }
  };

  const handleSync = () => {
    setIsSyncing(true);
    setSyncProgress({ percent: 0, message: 'Menghubungkan...' });
    
    // We need to use native EventSource for SSE, adding token manually
    const token = localStorage.getItem('token');
    const eventSource = new EventSource(`${API_URL}/locations/sync?token=${token}`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.error) {
        notify('error', data.error);
        eventSource.close();
        setIsSyncing(false);
      } else {
        setSyncProgress({ percent: data.percent, message: data.message });
        if (data.percent === 100) {
          notify('success', 'Sinkronisasi Selesai');
          eventSource.close();
          setTimeout(() => {
            setIsSyncing(false);
            fetchLocations();
          }, 1000);
        }
      }
    };

    eventSource.onerror = () => {
      notify('error', 'Koneksi terputus');
      eventSource.close();
      setIsSyncing(false);
    };
  };


  const TreeItem = ({ node, level = 0 }) => {
    const isExpanded = (debouncedSearch && searchResults.parentIdsToExpand.has(node.id)) || expanded[node.id];
    const hasChildren = node.children && node.children.length > 0;

    // If we have a search term, only show if this node is in the matched set
    if (debouncedSearch && !searchResults.matchedIds.has(node.id)) return null;

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
          className={`group relative flex items-center h-12 px-4 rounded-xl transition-all duration-200 cursor-pointer select-none ${
            isExpanded ? 'bg-blue-500/[0.03] dark:bg-blue-500/[0.05]' : 'hover:bg-slate-500/5 dark:hover:bg-white/[0.02]'
          }`}
          onClick={(e) => { e.stopPropagation(); toggleExpand(node.id); }}
        >
          {/* Action Row Layout */}
          <div className="flex items-center gap-4 flex-1 min-w-0" style={{ paddingLeft: `${level * 28}px` }}>
            <div className={`shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-90' : 'rotate-0'} ${!hasChildren ? 'opacity-0' : 'text-slate-400 dark:text-gray-500'}`}>
              <ChevronRight size={14} />
            </div>
            
            <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${iconColor} bg-current/10 dark:bg-current/[0.05]`}>
               <Icon size={16} />
            </div>

            <span className={`text-[13px] font-semibold truncate ${node.type === 'PROVINCE' ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}`}>
              {node.name} {node.postal_code && <span className="ml-2 text-[10px] text-gray-400 font-normal">[{node.postal_code}]</span>}
            </span>
          </div>

          <div className="flex items-center gap-6 shrink-0">
            {/* Actions Cluster */}
            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0">
               {node.type !== 'POSTAL_CODE' && (
                  <button onClick={(e) => { e.stopPropagation(); openModal(null, getNextType(node.type), node.id); }} className="w-8 h-8 flex items-center justify-center hover:bg-blue-500/10 text-blue-500 rounded-lg cursor-pointer transition-colors">
                     <Plus size={14} />
                  </button>
               )}
               <button onClick={(e) => { e.stopPropagation(); openModal(node); }} className="w-8 h-8 flex items-center justify-center hover:bg-emerald-500/10 text-emerald-500 rounded-lg cursor-pointer transition-colors">
                  <Edit size={14} />
               </button>
               <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(node.id); }} className="w-8 h-8 flex items-center justify-center hover:bg-red-500/10 text-red-500 rounded-lg cursor-pointer transition-colors">
                  <Trash2 size={14} />
               </button>
            </div>

            {hasChildren && (
               <span className="w-7 h-6 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 text-[10px] font-bold border border-gray-200 dark:border-gray-700">
                  {node.children.length}
               </span>
            )}
          </div>
        </motion.div>

        <AnimatePresence>
          {isExpanded && hasChildren && (
            <div 
              className="overflow-hidden border-l border-gray-200 dark:border-gray-800 ml-8 mt-0.5"
              style={{ marginLeft: `${level * 28 + 36}px` }}
            >
              <div className="py-0.5">
                {node.children.map(child => <TreeItem key={child.id} node={child} level={level + 1} />)}
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-600 dark:text-gray-400 font-inter p-6 md:p-8 lg:p-12 transition-colors duration-500">
      <DynamicIsland 
        status={confirmDeleteId ? 'confirm' : notification.status} 
        message={confirmDeleteId ? 'Revoke this node?' : notification.message} 
        onConfirm={handleDelete} onCancel={() => setConfirmDeleteId(null)} 
      />

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Precision Search */}
        <div className="relative group">
           <div className="absolute left-8 top-0 bottom-0 flex items-center justify-center text-gray-400 dark:text-gray-500 group-focus-within:text-blue-500 transition-colors pointer-events-none z-10 w-10">
              <Search size={22} />
           </div>
           <input 
              type="text" 
              style={{ paddingLeft: '84px' }}
              className="w-full h-16 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl pr-6 text-sm font-medium focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all outline-none text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 shadow-sm" 
              placeholder="Cari provinsi, kab/kota, atau kecamatan..." 
              value={search} onChange={(e) => setSearch(e.target.value)} 
           />
        </div>

        {/* Dynamic Stats - Forced Horizontal Row */}
        <div className="flex flex-row gap-3 md:gap-4">
           {[
              { val: stats.provinces, label: 'PROV', fullLabel: 'PROVINSI', color: 'text-blue-500' },
              { val: stats.cities, label: 'KOTA', fullLabel: 'KAB / KOTA', color: 'text-emerald-500' },
              { val: stats.districts, label: 'KEC', fullLabel: 'KECAMATAN', color: 'text-orange-500' }
           ].map((s, i) => (
              <div key={i} className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-3 md:p-6 flex flex-col items-start space-y-0.5 md:space-y-1 hover:border-blue-500/30 transition-all shadow-sm cursor-default overflow-hidden">
                 <div className={`text-xl md:text-3xl font-black ${s.color}`}>{s.val}</div>
                 <div className="text-[8px] md:text-[10px] font-bold text-gray-400 dark:text-gray-500 tracking-wider truncate w-full">
                    <span className="hidden md:inline">{s.fullLabel}</span>
                    <span className="md:hidden">{s.label}</span>
                 </div>
              </div>
           ))}
        </div>

        {/* Master Registry Container */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden shadow-xl shadow-gray-200/50 dark:shadow-none">
           <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white/95 dark:bg-gray-900/95 backdrop-blur-md sticky top-0 z-10">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">Hierarki Wilayah Indonesia</h2>
              <div className="flex gap-2">
                <button onClick={handleSync} disabled={isSyncing} className={`h-9 px-4 rounded-xl text-[10px] font-bold transition-all border flex items-center gap-2 cursor-pointer ${isSyncing ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50'}`}>
                   <RefreshCcw size={12} className={isSyncing ? 'animate-spin' : ''} />
                   {isSyncing ? 'Syncing...' : 'Sync Data'}
                </button>
                <button onClick={expandAll} className="h-9 px-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl text-[10px] font-bold transition-all border border-gray-200 dark:border-none cursor-pointer">Buka semua</button>
                <button onClick={collapseAll} className="h-9 px-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl text-[10px] font-bold transition-all border border-gray-200 dark:border-none cursor-pointer">Tutup semua</button>
                <button onClick={() => openModal()} className="h-9 px-6 bg-blue-600 hover:bg-blue-400 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ml-2 shadow-lg shadow-blue-500/20 active:scale-95 text-center flex items-center justify-center cursor-pointer">+ NEW</button>
              </div>
 
            {isSyncing && (
                <div className="bg-blue-500/5 border-b border-blue-500/10 px-6 py-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{syncProgress.message}</span>
                    <span className="text-[10px] font-black text-blue-600">{syncProgress.percent}%</span>
                  </div>
                  <div className="w-full bg-blue-500/10 rounded-full h-1.5 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${syncProgress.percent}%` }}
                      className="bg-blue-500 h-full"
                    />
                  </div>
                </div>
            )}
           </div>

           <div className="p-4 overflow-y-auto max-h-[60vh] custom-scrollbar">
              {loading ? (
                 <div className="py-24 text-center space-y-4 animate-pulse">
                    <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto" />
                    <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-gray-300 dark:text-gray-700">Synchronizing Registry...</p>
                 </div>
              ) : treeData.length === 0 ? (
                 <div className="py-24 text-center text-gray-300 dark:text-gray-800 text-[11px] font-bold uppercase tracking-[0.4em]">Empty Registry</div>
              ) : (
                <div className="space-y-0.5">
                  {treeData.map(node => (
                    <TreeItem key={node.id} node={node} />
                  ))}
                </div>
              )}
           </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Registry Sync">
        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Context Type</label>
              <select className="w-full h-12 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 text-xs font-bold uppercase text-gray-900 dark:text-white focus:border-blue-500 outline-none transition-all" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value, parent_id: ''})}>
                <option value="PROVINCE">Province</option>
                <option value="CITY">Kab / Kota</option>
                <option value="DISTRICT">Kecamatan</option>
                <option value="POSTAL_CODE">Kel / Zip</option>
              </select>
            </div>
            {formData.type !== 'PROVINCE' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Parent Entity</label>
                <select className="w-full h-12 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 text-xs font-bold text-gray-900 dark:text-white focus:border-blue-500 outline-none transition-all" value={formData.parent_id} required onChange={e => setFormData({...formData, parent_id: e.target.value})}>
                  <option value="">Select Parent...</option>
                  {locations.filter(l => (formData.type === 'CITY' ? l.type === 'PROVINCE' : formData.type === 'DISTRICT' ? l.type === 'CITY' : l.type === 'DISTRICT')).map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
            )}
          </div>
          <Input label="Registry Identity" icon={Navigation} required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} placeholder="E.G. YOGYAKARTA" className="h-12 rounded-xl bg-gray-50 dark:bg-gray-900" />
          
          {formData.type === 'POSTAL_CODE' && (
            <Input label="Zip Code" icon={Hash} required value={formData.postal_code} onChange={e => setFormData({...formData, postal_code: e.target.value})} placeholder="E.G. 55121" className="h-12 rounded-xl bg-gray-50 dark:bg-gray-900" />
          )}
          
          <button type="submit" className="w-full h-14 bg-gray-900 dark:bg-white hover:opacity-90 text-white dark:text-gray-900 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-xl shadow-black/10 cursor-pointer">Commit Registry</button>
        </form>
      </Modal>
    </div>
  );
};

export default LocationManagement;
