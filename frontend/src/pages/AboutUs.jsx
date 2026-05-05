import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ChevronLeft, Info, Building2 } from 'lucide-react';
import api from '../services/api';

const AboutUs = () => {
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
        console.error('Error fetching about us info:', err);
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

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#0a0b0f] pb-20">
      <Helmet>
        <title>Tentang Kami | {showroomInfo?.title || 'Bursa Mobil'}</title>
      </Helmet>
      
      {/* Simple Header */}
      <div className="bg-white dark:bg-[#1c1f26] border-b border-gray-200 dark:border-white/10 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Tentang Kami</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-5 mt-10">
        <div className="bg-white dark:bg-[#1c1f26] rounded-3xl p-8 md:p-12 shadow-sm border border-gray-200 dark:border-white/10">
          <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-500 mb-8">
            <Building2 size={40} />
          </div>
          
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-6">
            {showroomInfo?.title || 'Tentang Perusahaan'}
          </h2>
          
          <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-400 leading-relaxed space-y-4 text-base md:text-lg">
            {showroomInfo?.description ? (
              <p>{showroomInfo.description}</p>
            ) : (
              <>
                <p>
                  Selamat datang di platform showroom kendaraan kami. Kami berdedikasi untuk memberikan layanan terbaik dalam memenuhi kebutuhan kendaraan impian Anda.
                </p>
                <p>
                  Dengan standar kualitas yang ketat dan proses yang transparan, kami memastikan setiap unit yang kami tawarkan telah melewati inspeksi menyeluruh demi kepuasan dan ketenangan pikiran Anda.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
