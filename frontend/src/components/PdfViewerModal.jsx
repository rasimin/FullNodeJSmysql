import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Download, FileText, ExternalLink, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PdfViewerModal = ({ isOpen, onClose, documents }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const checkMobile = () => {
      const ua = navigator.userAgent;
      setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua));
    };
    checkMobile();
    if (isOpen) {
      setActiveTab(0);
    }
  }, [isOpen, documents]);

  if (!documents || documents.length === 0) return null;

  const currentDoc = documents[activeTab];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={documents.length > 1 ? "Document Preview Center" : currentDoc.title}
      maxWidth="max-w-6xl"
    >
      <div className="flex flex-col h-[80vh]">
        {/* Header Actions & Tabs Row */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex-1">
            {documents.length > 1 ? (
              <div className="flex flex-wrap gap-2 p-1 bg-gray-100/50 dark:bg-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                {documents.map((doc, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveTab(idx)}
                    className={`relative px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all whitespace-nowrap overflow-hidden ${
                      activeTab === idx
                        ? 'text-white'
                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                    }`}
                  >
                    {activeTab === idx && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-blue-600 shadow-md shadow-blue-500/20"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                      <FileText size={14} />
                      {doc.title}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center border border-blue-100 dark:border-blue-800">
                  <FileText size={18} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Document Format</p>
                  <p className="text-sm font-black text-gray-900 dark:text-white uppercase">{currentDoc.filename}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 shrink-0">
            <a
              href={currentDoc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-[10px] font-black uppercase px-4 h-10 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all shadow-sm"
            >
              <ExternalLink size={14} /> New Tab
            </a>
            <a
              href={currentDoc.url}
              download={currentDoc.filename}
              className="flex items-center justify-center gap-2 text-[10px] font-black uppercase px-6 h-10 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/25 transition-all active:scale-95"
            >
              <Download size={14} /> Download
            </a>
          </div>
        </div>

        {/* PDF Iframe Container */}
        <div className="flex-1 bg-gray-900 rounded-[2rem] overflow-hidden relative border-4 border-gray-100 dark:border-gray-800 shadow-2xl flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab + (isMobile ? '-mob' : '-dt')}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full"
            >
              {isMobile ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-6">
                  <div className="w-20 h-20 bg-blue-500/20 rounded-3xl flex items-center justify-center text-blue-400 animate-pulse">
                    <FileText size={40} />
                  </div>
                  <div>
                    <h3 className="text-white font-black uppercase tracking-tight text-lg">Mobile Preview Limited</h3>
                    <p className="text-gray-400 text-xs mt-2 max-w-[250px]">Chrome on Android cannot display PDF directly inside the app. Please download to view.</p>
                  </div>
                  <a
                    href={currentDoc.url}
                    download={currentDoc.filename}
                    className="flex items-center gap-3 bg-blue-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs shadow-xl shadow-blue-500/40 active:scale-95 transition-all"
                  >
                    <Download size={18} /> Download PDF Now
                  </a>
                </div>
              ) : (
                <iframe
                  src={`${currentDoc.url}#toolbar=1&view=FitH&zoom=100`}
                  className="w-full h-full border-none"
                  title={currentDoc.title}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Minimal Footer */}
        <div className="mt-4 text-center">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em]">
            Official Showroom Document Management System
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default PdfViewerModal;
