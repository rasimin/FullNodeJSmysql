import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

/**
 * DrawerPanel — slides in from the right side, full-height.
 * Props:
 *   isOpen    : boolean
 *   onClose   : () => void
 *   title     : string
 *   children  : ReactNode
 *   width     : tailwind max-w class, default 'max-w-4xl'
 */
const DrawerPanel = ({ isOpen, onClose, title, children, width = 'max-w-4xl' }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Backdrop */}
        <motion.div
          key="drawer-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Drawer panel */}
        <motion.div
          key="drawer-panel"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 340, damping: 38 }}
          className={`relative flex flex-col w-full ${width} h-full bg-white dark:bg-gray-900 shadow-2xl z-50`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 shrink-0">
            <div className="flex items-center gap-3">
              {/* Decorative accent bar */}
              <div className="w-1 h-6 bg-blue-600 rounded-full" />
              <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">
                {title}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {children}
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

export default DrawerPanel;
