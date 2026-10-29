import React, { useState, useEffect, useRef } from 'react';
import { Edit3 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RenameDialogProps {
  isOpen: boolean;
  currentTitle: string;
  onSave: (newTitle: string) => void;
  onCancel: () => void;
}

export const RenameDialog: React.FC<RenameDialogProps> = ({
  isOpen,
  currentTitle,
  onSave,
  onCancel,
}) => {
  const [title, setTitle] = useState(currentTitle);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitle(currentTitle);
    if (isOpen) {
      setTimeout(() => inputRef.current?.select(), 50);
    }
  }, [isOpen, currentTitle]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onSave(title.trim());
    }
  };

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
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              backgroundColor: 'var(--surface-subtle)',
              color: 'var(--primary)',
            }}
          >
            <Edit3 size={18} />
          </div>
          <h2 className="text-lg font-semibold">Rename conversation</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
              Conversation title
            </label>
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-colors"
              style={{
                backgroundColor: 'var(--bg)',
                borderColor: 'var(--border-strong)',
                color: 'var(--text)',
              }}
              required
              maxLength={60}
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
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
              type="submit"
              disabled={!title.trim()}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer disabled:opacity-40"
              style={{
                backgroundColor: 'var(--primary)',
                color: 'var(--on-primary)',
              }}
            >
              Save title
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
    )}
  </AnimatePresence>
  );
};
