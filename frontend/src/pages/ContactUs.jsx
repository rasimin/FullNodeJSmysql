import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ChevronLeft, MapPin, Phone, Mail, Clock, Building2 } from 'lucide-react';
import api from '../services/api';

const ContactUs = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [showroomInfo, setShowroomInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        if (slug) {
          const res = await api.get(`/public/showroom/${slug}`);
          setShowroomInfo(res.data);
        }
      } catch (err) {
        console.error('Error fetching contact info:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInfo();
  }, [slug]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center dark:bg-[#0a0b0f]">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>;
  }

  const office = showroomInfo?.office;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#0a0b0f] pb-20">
      <Helmet>
        <title>Kontak Kami | {showroomInfo?.title || 'Bursa Mobil'}</title>
      </Helmet>
      
      {/* Simple Header */}
      <div className="bg-white dark:bg-[#1c1f26] border-b border-gray-200 dark:border-white/10 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Kontak Kami</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-5 mt-10">
        <div className="bg-white dark:bg-[#1c1f26] rounded-3xl p-8 md:p-12 shadow-sm border border-gray-200 dark:border-white/10">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-8">
            Hubungi Kami
          </h2>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-500 shrink-0 mt-1">
                <Building2 size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Kantor</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{office?.name || 'Kantor Pusat'}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-500 shrink-0 mt-1">
                <MapPin size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Alamat</p>
                <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                  {office?.address || 'Jl. Contoh Alamat No. 123, Kota, Provinsi'}
                  {office?.location && <><br />{office.location.name}</>}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-500 shrink-0 mt-1">
                <Phone size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Telepon</p>
                <p className="text-base text-gray-700 dark:text-gray-300">{office?.phone || '-'}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-500 shrink-0 mt-1">
                <Clock size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Jam Operasional</p>
                <p className="text-base text-gray-700 dark:text-gray-300">Senin - Sabtu: 08.00 - 17.00<br/>Minggu: Tutup</p>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
