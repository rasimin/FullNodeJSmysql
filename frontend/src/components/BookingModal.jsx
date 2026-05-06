import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, CheckCircle, CheckCircle2, Upload, FileText, PlusCircle, Plus, 
  Camera, Image as ImageIcon, Bookmark, Smartphone, User as UserIcon,
  CreditCard, XCircle, Clock, Maximize2, Hash, ChevronRight, Eye, Trash2
} from 'lucide-react';
import Modal from './Modal';
import Input from './ui/Input';
import Select from './ui/Select';
import api from '../services/api';
import { IMAGE_BASE_URL } from '../config';

const BookingModal = ({ 
  isOpen, 
  onClose, 
  vehicle, 
  existingBooking = null,
  actionType = 'booking', // 'booking', 'sold', 'cancel'
  salesAgents = [],
  bookingDocumentTypes = [],
  onSuccess,
  notify,
  handlePrintDoc
}) => {
  const [formStep, setFormStep] = useState(1);
  const [bookingData, setBookingData] = useState({
    vehicle_id: '', customer_name: '', customer_phone: '', id_number: '',
    booking_date: new Date().toISOString().split('T')[0], down_payment: '', notes: '', sales_agent_id: '',
    payment_method: 'Cash', nik: ''
  });
  const [selectedBookingDocs, setSelectedBookingDocs] = useState({});
  const [selectedExtraBookingDocs, setSelectedExtraBookingDocs] = useState([]);
  const [tempBookingId, setTempBookingId] = useState(null);
  const [dealPhoto, setDealPhoto] = useState(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [activeBookingDocs, setActiveBookingDocs] = useState([]);
  
  const [printReceipt, setPrintReceipt] = useState(localStorage.getItem('pref_print_receipt') === 'true');
  const [printInvoice, setPrintInvoice] = useState(localStorage.getItem('pref_print_invoice') === 'true');
  const [printDealProof, setPrintDealProof] = useState(localStorage.getItem('pref_print_deal') === 'true');

  const activeBooking = existingBooking;

  useEffect(() => {
    if (isOpen) {
      setFormStep(1);
      setTempBookingId(null);
      setDealPhoto(null);
      setCancellationReason('');
      setSelectedBookingDocs({});
      setSelectedExtraBookingDocs([]);
      
      if (activeBooking) {
        const formatDate = (ds) => (!ds || ds.startsWith('0000')) ? '' : ds.split('T')[0];
        setBookingData({
          vehicle_id: vehicle?.id || '',
          customer_name: activeBooking.customer_name || '',
          customer_phone: activeBooking.customer_phone || '',
          id_number: activeBooking.id_number || '',
          nik: activeBooking.id_number || '',
          booking_date: formatDate(activeBooking.booking_date) || new Date().toISOString().split('T')[0],
          down_payment: activeBooking.down_payment || '',
          notes: activeBooking.notes || '',
          sales_agent_id: activeBooking.sales_agent_id || '',
          payment_method: activeBooking.payment_method || 'Cash'
        });
        fetchBookingDocuments(activeBooking.id);
      } else if (vehicle) {
        setBookingData(prev => ({ 
          ...prev, 
          vehicle_id: vehicle.id,
          customer_name: '', customer_phone: '', nik: '', down_payment: '', notes: '', sales_agent_id: ''
        }));
        setActiveBookingDocs([]);
      }
    }
  }, [isOpen, vehicle, activeBooking]);

  const fetchBookingDocuments = async (bookingId) => {
    try {
      const r = await api.get(`/documents/booking/${bookingId}`);
      setActiveBookingDocs(r.data);
    } catch (e) { console.error('Fetch booking docs error:', e); }
  };

  const sanitizePhone = (val) => val.replace(/[^0-9+]/g, '');

  const handleCurrencyChange = (field, val) => {
    const num = val.replace(/\D/g, '');
    setBookingData(prev => ({ ...prev, [field]: num }));
  };

  const displayCurrency = (val) => {
    if (val === null || val === undefined || val === '') return '';
    return parseInt(val).toLocaleString('id-ID');
  };

  const formatPrice = (price) => {
    if (!price && price !== 0) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
  };

  const handleUploadBookingDocs = async (bookingId) => {
    const docTypeIds = Object.keys(selectedBookingDocs);
    const otherType = bookingDocumentTypes.find(t => ['OTHER', 'LAINNYA'].includes(t.code?.toUpperCase()));

    // 1. Upload mandatory/standard docs
    for (const typeId of docTypeIds) {
      const file = selectedBookingDocs[typeId];
      if (!file) continue;
      
      try {
        const docFormData = new FormData();
        docFormData.append('document', file);
        docFormData.append('document_type_id', typeId);
        await api.post(`/documents/booking/${bookingId}`, docFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } catch (err) {
        const msg = err.response?.data?.message || err.message;
        console.error(`Failed to upload doc type ${typeId}:`, msg);
      }
    }

    // 2. Upload extra docs (multiple)
    const otherTypeFinal = otherType;
    if (selectedExtraBookingDocs.length > 0 && otherTypeFinal) {
      for (const file of selectedExtraBookingDocs) {
        try {
          const docFormData = new FormData();
          docFormData.append('document', file);
          docFormData.append('document_type_id', otherTypeFinal.id);
          await api.post(`/documents/booking/${bookingId}`, docFormData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        } catch (err) {
          console.error(`Failed to upload extra doc:`, err);
        }
      }
    }
  };

  const handleBookingSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!bookingData.customer_name || !bookingData.customer_phone) {
      return notify('error', 'Nama dan Nomor Telepon wajib diisi!');
    }

    notify('loading', activeBooking ? 'Memperbarui reservasi...' : 'Memproses reservasi...');
    try {
      let bookingId = activeBooking?.id;
      const payload = { ...bookingData, id_number: bookingData.nik };

      if (formStep === 1) {
        if (activeBooking) {
          await api.put(`/bookings/${activeBooking.id}`, payload);
        } else {
          const res = await api.post('/bookings', payload);
          bookingId = res.data.id;
          setTempBookingId(bookingId);
        }
        setFormStep(2);
        notify('success', 'Data reservasi disimpan! Lanjutkan ke unggah dokumen.');
        return;
      }

      // Step 2: Finalize
      const finalId = bookingId || tempBookingId;
      if (finalId) {
        await handleUploadBookingDocs(finalId);
      }

      notify('success', 'Reservasi berhasil!');
      onSuccess();
      onClose();

      if (printReceipt && finalId) handlePrintDoc(finalId, 'receipt');
    } catch (err) {
      notify('error', err.response?.data?.message || 'Gagal memproses reservasi');
    }
  };

  const handleConfirmSale = async () => {
    notify('loading', 'Memproses penjualan...');
    try {
      let bookingId = activeBooking?.id || tempBookingId;
      
      if (formStep === 1) {
        const formData = new FormData();
        Object.keys(bookingData).forEach(key => {
          if (bookingData[key]) formData.append(key, bookingData[key]);
        });
        if (bookingData.nik) formData.append('id_number', bookingData.nik);
        
        const res = await api.put(`/bookings/vehicle/${vehicle.id}/sold`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        bookingId = res.data.id || activeBooking?.id;
        setTempBookingId(bookingId);
        setFormStep(2);
        notify('success', 'Penjualan disimpan! Sekarang silakan unggah dokumen.');
        return;
      }

      // Step 2: Finalize
      if (bookingId) {
        await handleUploadBookingDocs(bookingId);
        if (dealPhoto) {
          const photoFormData = new FormData();
          photoFormData.append('delivery_photo', dealPhoto);
          await api.put(`/bookings/${bookingId}/delivery-photo`, photoFormData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        }
      }
      
      notify('success', 'Transaksi berhasil diselesaikan!');
      onSuccess();
      onClose();

      if (printDealProof && bookingId) handlePrintDoc(bookingId, 'deal-proof');
    } catch (e) {
      notify('error', e.response?.data?.message || 'Penjualan gagal');
    }
  };

  const handleCancelBooking = async (type) => {
    if (!cancellationReason.trim()) {
      return notify('error', 'Harap berikan alasan pembatalan');
    }
    notify('loading', 'Memproses pembatalan...');
    try {
      await api.put(`/bookings/vehicle/${vehicle.id}/cancel`, { 
        type,
        remark: cancellationReason 
      });
      notify('success', 'Status pemesanan diperbarui'); 
      onSuccess();
      onClose();
    } catch (e) { 
      notify('error', e.response?.data?.message || 'Gagal membatalkan'); 
    }
  };

  const handleDeleteBookingDocument = async (bookingId, docId) => {
    notify('loading', 'Menghapus dokumen...');
    try {
      await api.delete(`/documents/booking/${bookingId}/${docId}`);
      notify('success', 'Dokumen dihapus');
      fetchBookingDocuments(bookingId);
    } catch (err) {
      notify('error', 'Gagal menghapus dokumen');
    }
  };

  return (
    <>
      {/* BOOKING MODAL */}
      {actionType === 'booking' && (
        <Modal isOpen={isOpen} onClose={onClose} title="Formulir Reservasi Unit">
          <form onSubmit={handleBookingSubmit} className="space-y-6">
            <div className="flex gap-2 px-1">
              <div className={`h-1.5 flex-1 rounded-full transition-all ${formStep >= 1 ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-800'}`} />
              <div className={`h-1.5 flex-1 rounded-full transition-all ${formStep >= 2 ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-800'}`} />
            </div>

            <div className="p-5 bg-gray-900 text-white rounded-[32px] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full -mr-16 -mt-16 blur-3xl" />
              <div className="relative flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5">Unit Reservasi</p>
                  <h3 className="text-lg font-black tracking-tight leading-tight uppercase">
                    {vehicle?.brand} {vehicle?.model}
                    <span className="block text-xs font-bold text-gray-400 mt-1">{vehicle?.plate_number} • {vehicle?.year}</span>
                  </h3>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5">Harga Unit</p>
                  <p className="text-xl font-black text-blue-400 tracking-tighter">{formatPrice(vehicle?.price)}</p>
                </div>
              </div>
            </div>

            {formStep === 1 ? (
              <div className="space-y-6">
                <div className="space-y-4">
                  <Input label="Nama Pelanggan" value={bookingData.customer_name} onChange={e => setBookingData({ ...bookingData, customer_name: e.target.value })} required />
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="NIK (Nomor ID)" placeholder="16-digit NIK" value={bookingData.nik} onChange={e => setBookingData({ ...bookingData, nik: e.target.value.replace(/\D/g, '').slice(0, 16) })} required />
                    <Input label="Nomor Telepon" placeholder="+62..." value={bookingData.customer_phone} onChange={e => setBookingData({ ...bookingData, customer_phone: sanitizePhone(e.target.value) })} required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Uang Muka (DP)" value={displayCurrency(bookingData.down_payment)} onChange={e => handleCurrencyChange('down_payment', e.target.value)} />
                    <Select 
                      label="Metode Pembayaran" 
                      value={bookingData.payment_method} 
                      onChange={e => setBookingData({ ...bookingData, payment_method: e.target.value })} 
                      options={[
                        { value: 'Cash', label: 'Cash (Tunai)' },
                        { value: 'Credit', label: 'Credit (Leasing)' },
                        { value: 'Tukar Tambah', label: 'Tukar Tambah (Trade-in)' }
                      ]} 
                      required 
                    />
                  </div>
                  <Select
                    label="Agen Penjualan (Opsional)"
                    value={bookingData.sales_agent_id}
                    onChange={e => setBookingData({ ...bookingData, sales_agent_id: e.target.value })}
                    options={[{ value: '', label: '-- Pilih Sales (Opsional) --' }, ...salesAgents.map(a => ({ value: a.id, label: `${a.name} [${a.sales_code}] - ${a.Office?.name || 'Tidak Diketahui'}` }))]}
                  />
                  <textarea
                    className="input min-h-[80px] p-3 text-xs"
                    placeholder="Catatan / informasi tambahan..."
                    value={bookingData.notes}
                    onChange={e => setBookingData({ ...bookingData, notes: e.target.value })}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {bookingDocumentTypes.length > 0 && (
                  <div className="space-y-4 p-5 bg-gray-50 dark:bg-gray-800/40 rounded-[32px] border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText size={14} className="text-indigo-600" />
                      <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Dokumen Legalitas Pelanggan (Opsional)</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {bookingDocumentTypes
                        .filter(t => !['OTHER', 'LAINNYA'].includes(t.code?.toUpperCase()))
                        .map(type => {
                          const existingDoc = activeBookingDocs.find(d => d.document_type_id === type.id);
                          const isSelected = selectedBookingDocs[type.id];
                        return (
                          <div key={type.id} className="space-y-1">
                            <label className="text-[9px] font-black text-gray-400 uppercase ml-1">{type.name}</label>
                            {existingDoc ? (
                              <div className="flex items-center gap-2 p-2 rounded-xl border-2 border-solid bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 transition-all">
                                <div className="flex items-center gap-2 flex-1 cursor-pointer min-w-0" onClick={() => window.open(`${IMAGE_BASE_URL}${existingDoc.file_path}`, '_blank')}>
                                  <CheckCircle size={14} className="text-blue-500 shrink-0" />
                                  <span className="text-[10px] font-bold truncate">Terunggah (Klik Lihat)</span>
                                </div>
                                <div className="flex items-center gap-2 px-1">
                                  <button type="button" onClick={() => window.open(`${IMAGE_BASE_URL}${existingDoc.file_path}`, '_blank')} className="text-blue-400 hover:text-blue-600 transition-colors">
                                    <Eye size={12} />
                                  </button>
                                  <button type="button" onClick={() => handleDeleteBookingDocument(activeBooking.id, existingDoc.id)} className="text-red-400 hover:text-red-600 transition-colors">
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <label className={`flex items-center gap-2 p-2 rounded-xl border-2 border-dashed transition-all cursor-pointer ${isSelected ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-indigo-400'}`}>
                                {isSelected ? <CheckCircle size={14} /> : <Upload size={14} className="text-gray-300" />}
                                <span className="text-[10px] font-bold truncate flex-1">{isSelected ? isSelected.name : 'Unggah File'}</span>
                                <input type="file" className="hidden" onChange={(e) => setSelectedBookingDocs({ ...selectedBookingDocs, [type.id]: e.target.files[0] })} />
                              </label>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="space-y-4 p-5 bg-purple-50/50 dark:bg-purple-900/10 rounded-[32px] border border-purple-100 dark:border-purple-900/30">
                  <div className="flex items-center gap-2 mb-1">
                    <PlusCircle size={14} className="text-purple-600" />
                    <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Dokumen Lainnya (Maks 5)</p>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {[...Array(5)].map((_, i) => {
                      const otherType = bookingDocumentTypes.find(t => ['OTHER', 'LAINNYA'].includes(t.code?.toUpperCase()));
                      const existingOtherDocs = activeBookingDocs.filter(d => d.document_type_id === otherType?.id);
                      
                      const existingDoc = existingOtherDocs[i];
                      const doc = !existingDoc ? selectedExtraBookingDocs[i - existingOtherDocs.length] : null;
                      
                      return (
                        <div key={i} className={`aspect-square rounded-xl border-2 transition-all relative ${existingDoc ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 border-solid cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30' : doc ? 'bg-white dark:bg-gray-800 border-purple-200 border-dashed' : 'bg-gray-50/50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800 border-dashed hover:border-purple-400'}`}>
                          {existingDoc ? (
                            <div className="w-full h-full p-1 flex flex-col items-center justify-center text-center relative group">
                              <div className="cursor-pointer" onClick={() => window.open(`${IMAGE_BASE_URL}${existingDoc.file_path}`, '_blank')}>
                                <FileText size={18} className="text-blue-500 mb-1 mx-auto" />
                                <p className="text-[6px] font-black truncate w-full px-1 text-blue-600 uppercase tracking-tighter">Lihat</p>
                                <p className="text-[5px] font-bold text-blue-400 uppercase mt-0.5 tracking-tighter">Terunggah</p>
                              </div>
                              <button 
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleDeleteBookingDocument(activeBooking.id, existingDoc.id); }}
                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-sm hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity z-20"
                              >
                                <Trash2 size={8} />
                              </button>
                            </div>
                          ) : doc ? (
                            <div className="w-full h-full p-1 flex flex-col items-center justify-center">
                              <FileText size={18} className="text-purple-400 mb-1" />
                              <p className="text-[6px] font-bold truncate w-full text-center px-1 text-gray-500">{doc.name}</p>
                              <button onClick={() => setSelectedExtraBookingDocs(prev => prev.filter((_, idx) => idx !== (i - existingOtherDocs.length)))} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-sm hover:bg-red-600 transition-colors z-10">
                                <X size={10} />
                              </button>
                            </div>
                          ) : (
                            <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                              <Plus size={16} className="text-gray-300" />
                              <input 
                                type="file" 
                                className="hidden" 
                                accept=".jpg,.jpeg,.png,.pdf" 
                                onChange={(e) => {
                                  const file = e.target.files[0];
                                  if (file) setSelectedExtraBookingDocs(prev => [...prev, file]);
                                }} 
                              />
                            </label>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all cursor-pointer" onClick={() => {
                  const newVal = !printReceipt;
                  setPrintReceipt(newVal);
                  localStorage.setItem('pref_print_receipt', newVal);
                }}>
                  <input type="checkbox" checked={printReceipt} onChange={() => {}} className="w-4 h-4 rounded text-blue-600" />
                  <span className="text-[10px] font-black text-gray-400 uppercase">Cetak Kwitansi setelah simpan</span>
                </div>
              </div>
            )}
            <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black transition-all active:scale-95 uppercase text-xs tracking-widest">
              {formStep === 1 ? 'SIMPAN & LANJUT KE UNGGAH' : 'SELESAI'}
            </button>
          </form>
        </Modal>
      )}

      {/* CONFIRM ACTION MODAL (SOLD/CANCEL) */}
      {(actionType === 'sold' || actionType === 'cancel') && (
        <Modal isOpen={isOpen} onClose={onClose} title="Konfirmasi Transaksi">
          <div className="space-y-6">
            {actionType === 'sold' && (
              <div className="flex gap-2 px-1">
                <div className={`h-1.5 flex-1 rounded-full transition-all ${formStep >= 1 ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-800'}`} />
                <div className={`h-1.5 flex-1 rounded-full transition-all ${formStep >= 2 ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-800'}`} />
              </div>
            )}
            
            {actionType === 'sold' && (
              <div className="space-y-6">
                <div className="p-5 bg-gray-900 text-white rounded-[32px] shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full -mr-16 -mt-16 blur-3xl" />
                  <div className="relative flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5">Unit Transaksi</p>
                      <h3 className="text-lg font-black tracking-tight leading-tight uppercase">
                        {vehicle?.brand} {vehicle?.model}
                        <span className="block text-xs font-bold text-gray-400 mt-1">{vehicle?.plate_number} • {vehicle?.year}</span>
                      </h3>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5">Harga Jual</p>
                      <p className="text-xl font-black text-blue-400 tracking-tighter">{formatPrice(vehicle?.price)}</p>
                    </div>
                  </div>
                </div>

                {formStep === 1 ? (
                  <div className="space-y-6">
                    {!activeBooking ? (
                      <div className="space-y-4 p-5 bg-gray-50/80 dark:bg-gray-800/60 rounded-[32px] border-2 border-dashed border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2 mb-1">
                          <UserIcon size={14} className="text-orange-500" />
                          <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Data Pelanggan Jual Langsung</p>
                        </div>
                        <Input label="Nama Pelanggan" value={bookingData.customer_name} onChange={e => setBookingData({ ...bookingData, customer_name: e.target.value })} required />
                        <div className="grid grid-cols-2 gap-4">
                          <Input label="NIK (Nomor ID)" value={bookingData.nik} onChange={e => setBookingData({ ...bookingData, nik: e.target.value.replace(/\D/g, '').slice(0, 16) })} required />
                          <Input label="Nomor Telepon" value={bookingData.customer_phone} onChange={e => setBookingData({ ...bookingData, customer_phone: sanitizePhone(e.target.value) })} required />
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                          <Select 
                            label="Metode Pembayaran" 
                            value={bookingData.payment_method} 
                            onChange={e => setBookingData({ ...bookingData, payment_method: e.target.value })} 
                            options={[
                              { value: 'Cash', label: 'Cash (Tunai)' },
                              { value: 'Credit', label: 'Credit (Leasing)' },
                              { value: 'Tukar Tambah', label: 'Tukar Tambah (Trade-in)' }
                            ]} 
                            required 
                          />
                        </div>
                        <textarea 
                          className="input min-h-[80px] p-3 text-xs" 
                          placeholder="Catatan transaksi tambahan..." 
                          value={bookingData.notes} 
                          onChange={e => setBookingData({ ...bookingData, notes: e.target.value })} 
                        />
                      </div>
                    ) : (
                      <div className="p-4 bg-blue-600 dark:bg-blue-900/30 text-white rounded-2xl shadow-lg shadow-blue-600/20 dark:shadow-none border border-transparent dark:border-blue-800/50">
                        <p className="text-[9px] font-black text-blue-200 dark:text-blue-400 uppercase mb-1">Menjual ke Pelanggan Reservasi:</p>
                        <p className="text-base font-black uppercase tracking-tight text-white dark:text-blue-100">{activeBooking.customer_name}</p>
                        <p className="text-xs font-medium opacity-80 dark:text-blue-300/80">{activeBooking.customer_phone}</p>
                      </div>
                    )}
                    <Select label="Eksekutif Penjualan" value={bookingData.sales_agent_id} onChange={e => setBookingData({ ...bookingData, sales_agent_id: e.target.value })} options={salesAgents.map(a => ({ value: a.id, label: `${a.name} [${a.sales_code}] - ${a.Office?.name || 'Tidak Diketahui'}` }))} required />
                  </div>
                ) : (
                  <div className="space-y-6">
                    {bookingDocumentTypes.length > 0 && (
                      <div className="space-y-4 p-5 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-[32px] border border-indigo-100 dark:border-indigo-900/30">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText size={14} className="text-indigo-600" />
                          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Dokumen Legalitas Pelanggan</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {bookingDocumentTypes
                            .filter(t => !['OTHER', 'LAINNYA'].includes(t.code?.toUpperCase()))
                            .map(type => {
                              const existingDoc = activeBookingDocs.find(d => d.document_type_id === type.id);
                              const isSelected = selectedBookingDocs[type.id];
                            return (
                              <div key={type.id} className="space-y-1">
                                <label className="text-[9px] font-black text-gray-400 uppercase ml-1">{type.name}</label>
                                {existingDoc ? (
                                  <div 
                                    onClick={() => window.open(`${IMAGE_BASE_URL}${existingDoc.file_path}`, '_blank')}
                                    className="flex items-center gap-2 p-2 rounded-xl border-2 border-solid bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 transition-all cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30"
                                  >
                                    <CheckCircle size={14} className="text-blue-500" />
                                    <span className="text-[10px] font-bold truncate flex-1">Terunggah (Klik Lihat)</span>
                                    <Eye size={12} className="opacity-40" />
                                  </div>
                                ) : (
                                  <label className={`flex items-center gap-2 p-2 rounded-xl border-2 border-dashed transition-all cursor-pointer ${isSelected ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-indigo-400'}`}>
                                    {isSelected ? <CheckCircle size={14} /> : <Upload size={14} className="text-gray-300" />}
                                    <span className="text-[10px] font-bold truncate flex-1">{isSelected ? isSelected.name : 'Unggah File'}</span>
                                    <input type="file" className="hidden" onChange={(e) => setSelectedBookingDocs({ ...selectedBookingDocs, [type.id]: e.target.files[0] })} />
                                  </label>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="space-y-4 p-5 bg-purple-50/50 dark:bg-purple-900/10 rounded-[32px] border border-purple-100 dark:border-purple-900/30">
                      <div className="flex items-center gap-2 mb-1">
                        <PlusCircle size={14} className="text-purple-600" />
                        <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Dokumen Lainnya (Maks 5)</p>
                      </div>
                      <div className="grid grid-cols-5 gap-2">
                        {[...Array(5)].map((_, i) => {
                          const otherType = bookingDocumentTypes.find(t => ['OTHER', 'LAINNYA'].includes(t.code?.toUpperCase()));
                          const existingOtherDocs = activeBookingDocs.filter(d => d.document_type_id === otherType?.id);
                          
                          const existingDoc = existingOtherDocs[i];
                          const doc = !existingDoc ? selectedExtraBookingDocs[i - existingOtherDocs.length] : null;
                          
                          return (
                            <div key={i} className={`aspect-square rounded-xl border-2 transition-all relative ${existingDoc ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 border-solid cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30' : doc ? 'bg-white dark:bg-gray-800 border-purple-200 border-dashed' : 'bg-gray-50/50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800 border-dashed hover:border-purple-400'}`}>
                              {existingDoc ? (
                                <div className="w-full h-full p-1 flex flex-col items-center justify-center text-center" onClick={() => window.open(`${IMAGE_BASE_URL}${existingDoc.file_path}`, '_blank')}>
                                  <FileText size={18} className="text-blue-500 mb-1" />
                                  <p className="text-[6px] font-black truncate w-full px-1 text-blue-600 uppercase tracking-tighter">Lihat</p>
                                  <p className="text-[5px] font-bold text-blue-400 uppercase mt-0.5 tracking-tighter">Terunggah</p>
                                </div>
                              ) : doc ? (
                                <div className="w-full h-full p-1 flex flex-col items-center justify-center">
                                  <FileText size={18} className="text-purple-400 mb-1" />
                                  <p className="text-[6px] font-bold truncate w-full text-center px-1 text-gray-500">{doc.name}</p>
                                  <button onClick={() => setSelectedExtraBookingDocs(prev => prev.filter((_, idx) => idx !== (i - existingOtherDocs.length)))} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-sm hover:bg-red-600 transition-colors z-10">
                                    <X size={10} />
                                  </button>
                                </div>
                              ) : (
                                <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                                  <Plus size={16} className="text-gray-300" />
                                  <input 
                                    type="file" 
                                    className="hidden" 
                                    accept=".jpg,.jpeg,.png,.pdf" 
                                    onChange={(e) => {
                                      const file = e.target.files[0];
                                      if (file) setSelectedExtraBookingDocs(prev => [...prev, file]);
                                    }} 
                                  />
                                </label>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="space-y-2 mt-4">
                      <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Camera size={14} className="text-blue-500" /> Foto Bukti Penyerahan
                      </label>
                      <div className="relative group aspect-video bg-gray-100 dark:bg-gray-900 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 hover:border-blue-500 transition-all overflow-hidden flex items-center justify-center">
                        {dealPhoto ? (
                          <>
                            <img src={URL.createObjectURL(dealPhoto)} className="w-full h-full object-cover" alt="Proof" />
                            <button onClick={() => setDealPhoto(null)} className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full shadow-lg"><X size={14} /></button>
                          </>
                        ) : (
                          <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                            <ImageIcon size={32} className="text-gray-300 mb-2" />
                            <p className="text-[10px] font-black text-gray-400 uppercase">Klik untuk unggah foto bersama pelanggan</p>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => setDealPhoto(e.target.files[0])} />
                          </label>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all cursor-pointer" onClick={() => {
                      const newVal = !printDealProof;
                      setPrintDealProof(newVal);
                      localStorage.setItem('pref_print_deal', newVal);
                    }}>
                      <input type="checkbox" checked={printDealProof} onChange={() => {}} className="w-4 h-4 rounded text-blue-600" />
                      <span className="text-[10px] font-black text-gray-400 uppercase">Cetak Kwitansi Penjualan setelah simpan</span>
                    </div>
                  </div>
                )}
                <button onClick={handleConfirmSale} className={`w-full py-4 ${formStep === 1 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-500'} text-white rounded-2xl font-black transition-all active:scale-95 uppercase text-xs tracking-widest`}>
                  {formStep === 1 ? 'SIMPAN & LANJUT KE UNGGAH' : 'SELESAI & CETAK DOKUMEN'}
                </button>
              </div>
            )}

            {actionType === 'cancel' && (
              <div className="space-y-4">
                <div className="p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-2xl">
                  <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                      <Hash size={14} className="text-orange-500" />
                      <p className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest">Verifikasi Data</p>
                    </div>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                      <div className="space-y-0.5">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Nomor Plat</p>
                        <p className="text-xs font-bold text-gray-900 dark:text-white uppercase">{vehicle?.plate_number}</p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Nama Pelanggan</p>
                        <p className="text-xs font-bold text-gray-900 dark:text-white uppercase truncate">{activeBooking?.customer_name || '-'}</p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">NIK / Nomor ID</p>
                        <p className="text-xs font-bold text-gray-900 dark:text-white">{activeBooking?.id_number || activeBooking?.nik || '-'}</p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Total Uang Muka (DP)</p>
                        <p className="text-sm font-black text-orange-600">{formatPrice(activeBooking?.down_payment || 0)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 ml-1">
                      <Edit size={14} className="text-blue-500" />
                      <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Alasan Pembatalan / Catatan</label>
                      <span className="text-[9px] font-bold text-red-500 ml-auto uppercase opacity-60">* Wajib</span>
                    </div>
                    <textarea 
                      value={cancellationReason}
                      onChange={(e) => setCancellationReason(e.target.value)}
                      placeholder="Ketik alasan mengapa pemesanan ini dibatalkan..."
                      className="w-full p-4 bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-2xl text-xs focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none min-h-[120px] resize-none shadow-sm transition-all placeholder:text-gray-300"
                    />
                  </div>
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-orange-600 uppercase text-center tracking-[0.2em] opacity-80">Pilih Hasil Akhir</p>
                    <div className="grid grid-cols-1 gap-3">
                      <button 
                        onClick={() => handleCancelBooking('Cancelled')}
                        className="p-5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-red-500 rounded-2xl text-left transition-all group shadow-md active:bg-gray-100 dark:active:bg-gray-700 active:scale-[0.98] flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                             <XCircle size={16} className="text-red-600" />
                             <p className="text-sm font-black text-red-600 uppercase tracking-tight">Batal (Tanpa Refund)</p>
                          </div>
                          <p className="text-[10px] text-gray-500 font-bold uppercase leading-relaxed max-w-[280px]">Dana DP hangus dan menjadi komponen pendapatan kantor.</p>
                        </div>
                        <ChevronRight size={18} className="text-gray-300 group-hover:text-red-500 transition-colors ml-2" />
                      </button>
                      <button 
                        onClick={() => handleCancelBooking('Refunded')}
                        className="p-5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 rounded-2xl text-left transition-all group shadow-md active:bg-gray-100 dark:active:bg-gray-700 active:scale-[0.98] flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle2 size={16} className="text-blue-600" />
                            <p className="text-sm font-black text-blue-600 uppercase tracking-tight">Refund (Pengembalian Penuh)</p>
                          </div>
                          <p className="text-[10px] text-gray-500 font-bold uppercase leading-relaxed max-w-[280px]">Dana DP dikembalikan sepenuhnya kepada customer.</p>
                        </div>
                        <ChevronRight size={18} className="text-gray-300 group-hover:text-blue-500 transition-colors ml-2" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <button onClick={onClose} className="w-full py-3 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all uppercase text-xs tracking-widest">KEMBALI KE DASHBOARD</button>
          </div>
        </Modal>
      )}
    </>
  );
};

export default BookingModal;
