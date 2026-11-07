import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AttachedFile } from '../Composer';
import { api } from '../../services/api';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileAttached: (file: AttachedFile) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onFileAttached }) => {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProcessFile = (file: File) => {
    setError(null);
    if (file.size > 2 * 1024 * 1024) {
      setError('File size exceeds the 2MB limit. Please upload a smaller document.');
      return;
    }

    const allowedExtensions = ['.txt', '.md', '.json', '.csv', '.js', '.ts', '.py', '.html', '.css', '.pdf'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      setError(`Unsupported file type (${ext}). Please upload plain text, code, or markdown files.`);
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const textContent = reader.result as string;
        // Verify with server endpoint via api client
        const data = await api.uploadFile(file.name, textContent, file.type);
        onFileAttached({
          name: file.name,
          size: file.size,
          content: data.content,
        });
        setIsProcessing(false);
        onClose();
      } catch (err: unknown) {
        setIsProcessing(false);
        setError(err instanceof Error ? err.message : 'Failed to extract readable text');
      }
    };

    reader.onerror = () => {
      setIsProcessing(false);
      setError('Could not read file contents from device.');
    };

    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
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
          aria-labelledby="upload-heading"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            className="w-full max-w-[460px] rounded-[22px] p-6 border shadow-2xl"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--text)',
            }}
          >
        <div className="flex items-center justify-between pb-3 border-b mb-4" style={{ borderColor: 'var(--border)' }}>
          <h2 id="upload-heading" className="text-lg font-semibold flex items-center gap-2">
            <UploadCloud size={18} style={{ color: 'var(--primary)' }} />
            <span>Attach Document</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            style={{ color: 'var(--text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div
            className="mb-4 p-3 rounded-xl border flex items-start gap-2.5 text-xs"
            style={{
              backgroundColor: 'var(--error-surface)',
              borderColor: 'var(--error)',
              color: 'var(--error)',
            }}
          >
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div
          onDragOver={e => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-150 flex flex-col items-center justify-center
            ${dragOver ? 'scale-[1.01]' : 'hover:border-[var(--primary)]'}
          `}
          style={{
            borderColor: dragOver ? 'var(--primary)' : 'var(--border-strong)',
            backgroundColor: dragOver ? 'var(--surface-subtle)' : 'transparent',
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.json,.csv,.js,.ts,.py,.html,.css,.pdf"
            className="hidden"
            onChange={e => {
              if (e.target.files && e.target.files[0]) {
                handleProcessFile(e.target.files[0]);
              }
            }}
          />

          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
            style={{ backgroundColor: 'var(--surface-subtle)', color: 'var(--primary)' }}
          >
            <FileText size={24} />
          </div>

          <h3 className="text-sm font-semibold mb-1">
            {isProcessing ? 'Extracting text…' : 'Drop a file or browse'}
          </h3>
          <p className="text-xs max-w-[28ch] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Supports Markdown, Text, Code (.py, .js, .ts, .json, .csv) up to 2MB.
          </p>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium border cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
            style={{ borderColor: 'var(--border-strong)' }}
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
    )}
  </AnimatePresence>
  );
};
