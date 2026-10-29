import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DeleteDialogProps {
  isOpen: boolean;
  title: string;
  isAll?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteDialog: React.FC<DeleteDialogProps> = ({
  isOpen,
  title,
  isAll = false,
  onConfirm,
  onCancel,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
          style={{ backgroundColor: 'var(--scrim)' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-title"
          aria-describedby="dialog-desc"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            className="w-full max-w-[420px] rounded-[20px] p-6 border shadow-2xl"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--text)',
            }}
          >
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              backgroundColor: 'var(--error-surface)',
              color: 'var(--error)',
            }}
          >
            <AlertTriangle size={20} />
          </div>
          <h2 id="dialog-title" className="text-lg font-semibold">
            {isAll ? 'Clear all conversations?' : `Delete “${title}”?`}
          </h2>
        </div>

        <p id="dialog-desc" className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-muted)' }}>
          {isAll
            ? 'This will permanently delete all stored chat sessions and their messages. This action cannot be reversed.'
            : 'This permanently deletes the conversation and its entire history. This action cannot be undone.'}
        </p>

        <div className="flex items-center justify-end gap-2.5">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm font-medium border transition-colors hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            style={{
              borderColor: 'var(--border-strong)',
              color: 'var(--text)',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
            style={{
              backgroundColor: 'var(--error)',
              color: 'var(--on-error)',
            }}
          >
            {isAll ? 'Delete all' : 'Delete'}
          </button>
        </div>
      </motion.div>
    </motion.div>
    )}
  </AnimatePresence>
  );
};
