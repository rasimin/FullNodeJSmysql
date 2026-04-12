import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

const DynamicIsland = ({ status, message, onConfirm, onCancel }) => {
  if (status === 'idle') return null;
  return (
    <div className="fixed top-4 left-0 right-0 flex justify-center z-[100] pointer-events-none">
      <AnimatePresence mode="wait">
        {status === 'confirm' && (
          <motion.div key="confirm"
            initial={{ y: -36, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -24, opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="card shadow-xl w-72 p-5 flex flex-col items-center gap-3.5 pointer-events-auto"
          >
            <div className="w-10 h-10 rounded-full bg-yellow-50 dark:bg-yellow-950 flex items-center justify-center">
              <AlertTriangle size={20} className="text-yellow-500" />
            </div>
            <p className="text-sm font-medium text-gray-800 dark:text-white text-center">{message}</p>
            <div className="flex gap-2 w-full">
              <button onClick={onCancel} className="btn flex-1 text-sm py-2">Cancel</button>
              <button onClick={onConfirm} className="btn-danger flex-1 text-sm py-2">Delete</button>
            </div>
          </motion.div>
        )}
        {status === 'loading' && (
          <motion.div key="loading"
            initial={{ y: -24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -16, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-2.5 px-5 py-2.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-full shadow-lg pointer-events-auto"
          >
            <Loader2 size={15} className="animate-spin" />
            <span className="text-sm font-medium">{message || 'Processing...'}</span>
          </motion.div>
        )}
        {status === 'success' && (
          <motion.div key="success"
            initial={{ y: -24, opacity: 0, scale: 0.96 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: -16, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-2.5 px-5 py-2.5 bg-green-600 text-white rounded-full shadow-lg pointer-events-auto"
          >
            <CheckCircle size={15} />
            <span className="text-sm font-medium">{message || 'Success!'}</span>
          </motion.div>
        )}
        {status === 'error' && (
          <motion.div key="error"
            initial={{ y: -24, opacity: 0, scale: 0.96 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: -16, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-2.5 px-5 py-2.5 bg-red-600 text-white rounded-full shadow-lg pointer-events-auto"
          >
            <AlertTriangle size={15} />
            <span className="text-sm font-medium">{message || 'Error!'}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DynamicIsland;
