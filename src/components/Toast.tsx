import React from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ToastProps {
  message: string | null;
  type?: 'success' | 'info' | 'error';
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'info' }) => {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 16, x: '-50%', scale: 0.95 }}
          animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }}
          exit={{ opacity: 0, y: 10, x: '-50%', scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="fixed bottom-24 left-1/2 z-50 px-4 py-2.5 rounded-xl border shadow-xl flex items-center gap-2.5 text-xs sm:text-sm font-medium max-w-[90vw]"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border-strong)',
            color: 'var(--text)',
          }}
          role="status"
        >
          {type === 'success' && <CheckCircle2 size={16} style={{ color: 'var(--primary)' }} />}
          {type === 'error' && <AlertCircle size={16} style={{ color: 'var(--error)' }} />}
          {type === 'info' && <Info size={16} style={{ color: 'var(--primary)' }} />}
          <span>{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
