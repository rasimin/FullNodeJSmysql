import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { Phone, MapPin, Save, Globe, Info, MousePointer2 } from 'lucide-react';
import api from '../../services/api';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { OpenStreetMapProvider, GeoSearchControl } from 'leaflet-geosearch';
import 'leaflet-geosearch/dist/geosearch.css';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet marker icon issue in React
import markerIcon from 'leaflet/dist/images/marker-icon.png?url';
import markerShadow from 'leaflet/dist/images/marker-shadow.png?url';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Map Event Handler to capture click coordinates
const LocationMarker = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position ? <Marker position={position} /> : null;
};

// Component to handle map view changes when markerPos updates
const ChangeView = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, map.getZoom());
    }
  }, [center, map]);
  return null;
};

const ContactSettingsTab = ({ setting, onUpdate, notify }) => {
  const [formData, setFormData] = useState({
    use_default_contact: setting?.use_default_contact ?? true,
    contact_content: setting?.contact_content || '',
    latitude: setting?.latitude || '-6.200000', // Default Jakarta
    longitude: setting?.longitude || '106.816666'
  });
  
  const [saving, setSaving] = useState(false);
  const [markerPos, setMarkerPos] = useState([
    parseFloat(setting?.latitude || '-6.200000'),
    parseFloat(setting?.longitude || '106.816666')
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const provider = new OpenStreetMapProvider();

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const results = await provider.search({ query });
      setSearchResults(results);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  const selectLocation = (result) => {
    const { x, y, label } = result;
    setMarkerPos([y, x]);
    setSearchQuery(label);
    setSearchResults([]);
  };

  // Update formData when marker moves
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      latitude: markerPos[0].toString(),
      longitude: markerPos[1].toString()
    }));
  }, [markerPos]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    notify('loading', 'Menyimpan setelan kontak...');
    try {
      const res = await api.put(`/showroom-settings/${setting.id}`, {
        ...formData,
        // Send other existing fields to avoid nullifying
        slug: setting.slug,
        title: setting.title,
        description: setting.description,
        is_published: setting.is_published,
        theme_color: setting.theme_color,
        about_content: setting.about_content
      });
      
      onUpdate(res.data.setting);
      notify('success', 'Setelan kontak berhasil diperbarui');
    } catch (err) {
      notify('error', err.response?.data?.message || 'Gagal menyimpan setelan kontak');
    } finally {
      setSaving(false);
    }
  };

  const defaultContactTemplate = `
    <h3>Hubungi Kami</h3>
    <p>Silakan hubungi kami melalui kontak di bawah ini untuk informasi lebih lanjut mengenai unit kendaraan yang Anda minati.</p>
    <br/>
    <p><strong>WhatsApp:</strong> 0812-XXXX-XXXX</p>
    <p><strong>Email:</strong> info@showroom-anda.com</p>
  `;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="card p-6 md:p-8 space-y-8">
        {/* Source Switcher */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <Globe size={18} />
            <h3 className="text-xs font-black uppercase tracking-widest">Sumber Informasi Kontak</h3>
          </div>
          
          <div className="p-4 bg-gray-50 dark:bg-white/[0.02] rounded-2xl border border-gray-100 dark:border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${formData.use_default_contact ? 'bg-blue-500/10 text-blue-500' : 'bg-orange-500/10 text-orange-500'}`}>
                {formData.use_default_contact ? <Phone size={20} /> : <Info size={20} />}
              </div>
              <div>
                <p className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight">Gunakan Data Kantor</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase italic">
                  {formData.use_default_contact ? 'Mengambil data otomatis dari profil kantor' : 'Menggunakan konten kustom di bawah'}
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={formData.use_default_contact}
                onChange={e => setFormData({ ...formData, use_default_contact: e.target.checked })}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        {/* Manual Content (Visible if use_default_contact is false) */}
        {!formData.use_default_contact && (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                Konten Kontak Kustom (WYSIWYG)
              </label>
              <button 
                type="button"
                onClick={() => setFormData({ ...formData, contact_content: defaultContactTemplate })}
                className="text-[10px] font-bold text-blue-500 hover:text-blue-600 uppercase tracking-widest transition-colors"
              >
                Reset ke Default
              </button>
            </div>
            <div className="quill-container bg-white dark:bg-white/5 rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10">
              <ReactQuill 
                theme="snow"
                value={formData.contact_content}
                onChange={(val) => setFormData({ ...formData, contact_content: val })}
                placeholder="Tuliskan informasi kontak tambahan di sini..."
                modules={{
                  toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    ['clean']
                  ],
                }}
              />
            </div>
          </div>
        )}

        {/* Map Picker Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <MapPin size={18} />
            <h3 className="text-xs font-black uppercase tracking-widest">Titik Lokasi Showroom (Peta)</h3>
          </div>
          
          <div className="space-y-1">
             <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Koordinat (Latitude, Longitude)</label>
             <div className="relative group">
                <input 
                  type="text" 
                  className="input h-12 text-xs font-bold pr-12 transition-all group-focus-within:border-blue-500" 
                  placeholder="-6.12345, 106.12345"
                  value={`${formData.latitude}, ${formData.longitude}`} 
                  onChange={e => {
                    const value = e.target.value;
                    const parts = value.split(',').map(p => p.trim());
                    
                    if (parts.length === 2) {
                      const lat = parseFloat(parts[0]);
                      const lng = parseFloat(parts[1]);
                      
                      setFormData(prev => ({ 
                        ...prev, 
                        latitude: parts[0], 
                        longitude: parts[1] 
                      }));
                      
                      if (!isNaN(lat) && !isNaN(lng)) {
                        setMarkerPos([lat, lng]);
                      }
                    } else {
                      // Allow typing even if not yet valid
                      setFormData(prev => ({ ...prev, latitude: value, longitude: '' }));
                    }
                  }}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <MapPin size={16} />
                </div>
             </div>
             <p className="text-[9px] text-gray-400 italic ml-1">Tips: Salin koordinat langsung dari Google Maps (contoh: -6.18, 106.82)</p>
          </div>

          {/* Search Address Field */}
          <div className="space-y-1 relative">
             <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Cari Berdasarkan Alamat</label>
             <div className="relative group">
                <input 
                  type="text" 
                  className="input h-12 text-xs font-bold pr-12 transition-all group-focus-within:border-blue-500" 
                  placeholder="Ketik alamat (contoh: Jl. Sudirman Jakarta)"
                  value={searchQuery}
                  onChange={e => handleSearch(e.target.value)}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                  {searching ? (
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <MapPin size={16} />
                  )}
                </div>
             </div>
             
             {/* Search Results Dropdown */}
             {searchResults.length > 0 && (
               <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white dark:bg-[#1c1f26] border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                 {searchResults.map((result, idx) => (
                   <button
                    key={idx}
                    type="button"
                    onClick={() => selectLocation(result)}
                    className="w-full text-left px-4 py-3 text-[11px] font-medium text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-500/10 border-b border-gray-50 dark:border-white/5 last:border-0 transition-colors"
                   >
                     {result.label}
                   </button>
                 ))}
               </div>
             )}
          </div>

          <div className="relative w-full h-[300px] rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-inner group">
            <MapContainer 
              center={markerPos} 
              zoom={13} 
              scrollWheelZoom={true} 
              className="w-full h-full z-0"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <ChangeView center={markerPos} />
              <LocationMarker position={markerPos} setPosition={setMarkerPos} />
            </MapContainer>
            
            <div className="absolute top-4 right-4 z-10 pointer-events-none group-hover:opacity-100 transition-opacity">
               <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md p-2 rounded-xl border border-gray-200 dark:border-white/10 flex items-center gap-2 shadow-xl">
                  <MousePointer2 size={12} className="text-blue-500 animate-bounce" />
                  <span className="text-[9px] font-black text-gray-900 dark:text-white uppercase tracking-tight">Klik Peta Untuk Memilih Titik</span>
               </div>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 font-medium italic px-1 flex items-center gap-1.5">
            <Info size={12} /> Koordinat ini akan digunakan untuk memunculkan navigasi Google Maps di halaman publik.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="btn-primary w-full h-12 gap-2 uppercase tracking-widest text-xs font-black disabled:opacity-50 disabled:grayscale"
        >
          <Save size={18} /> {saving ? 'Menyimpan...' : 'Simpan Setelan Kontak'}
        </button>
      </div>
    </form>
  );
};

export default ContactSettingsTab;
