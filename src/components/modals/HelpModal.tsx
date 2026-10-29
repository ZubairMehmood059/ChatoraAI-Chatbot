import React from 'react';
import { X, ShieldCheck, Lock, FileCode, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
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
          aria-labelledby="help-heading"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            className="w-full max-w-[520px] rounded-[22px] p-6 border shadow-2xl max-h-[90vh] overflow-y-auto"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--text)',
            }}
          >
        <div className="flex items-center justify-between pb-4 border-b mb-5" style={{ borderColor: 'var(--border)' }}>
          <h2 id="help-heading" className="text-xl font-semibold">Help &amp; Privacy</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Close help"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 text-sm">
          {/* Privacy Notice */}
          <div className="space-y-3">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <ShieldCheck size={18} style={{ color: 'var(--primary)' }} />
              <span>Privacy &amp; Data Transparency</span>
            </h3>
            <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Chatora AI handles your messages with strict security and privacy standards:
            </p>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="shrink-0 mt-0.5" style={{ color: 'var(--primary)' }} />
                <span>
                  <strong>Server-Side Security:</strong> Provider API credentials never touch browser JavaScript and reside exclusively on the secure backend.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="shrink-0 mt-0.5" style={{ color: 'var(--primary)' }} />
                <span>
                  <strong>Data Ownership:</strong> Your conversations and messages remain your own. You can export, rename, or permanently delete them at any time.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="shrink-0 mt-0.5" style={{ color: 'var(--primary)' }} />
                <span>
                  <strong>Zero Fabrication:</strong> Responses are generated in real-time from the configured Gemini model. No fake answers or mock placeholders.
                </span>
              </li>
            </ul>
          </div>

          {/* Quick Guide */}
          <div className="pt-4 border-t space-y-2.5" style={{ borderColor: 'var(--border)' }}>
            <h3 className="font-semibold flex items-center gap-2">
              <FileCode size={16} style={{ color: 'var(--primary)' }} />
              <span>Tips for Best Results</span>
            </h3>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              • Use <strong>Shift + Enter</strong> to add multi-line instructions or paste code blocks.<br />
              • Click the <strong>Copy</strong> button on code snippets to grab clean syntax without line numbers.<br />
              • Use <strong>Export as Markdown</strong> to save meeting notes, research, or documents for your personal files.<br />
              • Hit <strong>Stop generating</strong> at any time to halt a lengthy response.
            </p>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
              style={{
                backgroundColor: 'var(--primary)',
                color: 'var(--on-primary)',
              }}
            >
              Got it
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
    )}
  </AnimatePresence>
  );
};
