import React, { useRef, useEffect, useState } from 'react';
import { ArrowUp, Square, Paperclip, X, FileText, Mic, MicOff, ChevronDown, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface AttachedFile {
  name: string;
  size: number;
  content: string;
}

interface ComposerProps {
  input: string;
  setInput: (val: string | ((prev: string) => string)) => void;
  onSend: () => void;
  onStop: () => void;
  isBusy: boolean;
  attachedFile: AttachedFile | null;
  onAttachClick: () => void;
  onRemoveAttachment: () => void;
  onOpenPrivacy: () => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  responseStyle?: 'concise' | 'balanced' | 'detailed';
  onSetResponseStyle?: (style: 'concise' | 'balanced' | 'detailed') => void;
}

export const Composer: React.FC<ComposerProps> = ({
  input,
  setInput,
  onSend,
  onStop,
  isBusy,
  attachedFile,
  onAttachClick,
  onRemoveAttachment,
  onOpenPrivacy,
  textareaRef,
  responseStyle = 'balanced',
  onSetResponseStyle,
}) => {
  const charLimit = 8000;
  const isNearLimit = input.length > charLimit * 0.8;
  const isOverLimit = input.length > charLimit;
  const canSend = (input.trim().length > 0 || attachedFile !== null) && !isOverLimit && !isBusy;

  // Speech Recognition state
  const [isListening, setIsListening] = useState(false);
  const [styleDropdownOpen, setStyleDropdownOpen] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Auto-resize textarea height
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    const newHeight = Math.min(ta.scrollHeight, 180);
    ta.style.height = `${Math.max(newHeight, 38)}px`;
  }, [input, textareaRef]);

  // Handle Speech Recognition
  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      return;
    }

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let finalChunk = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalChunk += event.results[i][0].transcript;
          }
        }
        if (finalChunk.trim()) {
          setInput(prev => (prev ? prev + ' ' + finalChunk.trim() : finalChunk.trim()));
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    } catch {
      setIsListening(false);
    }
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (canSend) {
        onSend();
      }
    }
  };

  const styleLabels: Record<'concise' | 'balanced' | 'detailed', string> = {
    balanced: 'Normal',
    detailed: 'Deep Think',
    concise: 'Concise',
  };

  return (
    <div className="w-full max-w-[900px] mx-auto pb-3 pt-1 px-3 sm:px-0">
      {/* Attached file chip */}
      <AnimatePresence>
        {attachedFile && (
          <motion.div
            key={attachedFile.name}
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mb-2 flex items-center gap-2"
          >
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border-strong)',
                color: 'var(--text)',
              }}
            >
              <FileText size={14} style={{ color: 'var(--primary)' }} />
              <span className="font-medium truncate max-w-[200px]">{attachedFile.name}</span>
              <span style={{ color: 'var(--text-muted)' }}>
                ({(attachedFile.size / 1024).toFixed(1)} KB)
              </span>
              <button
                type="button"
                onClick={onRemoveAttachment}
                className="p-0.5 rounded-md hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer ml-1"
                title="Remove attachment"
                aria-label="Remove attachment"
              >
                <X size={13} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Composer Box */}
      <form
        onSubmit={e => {
          e.preventDefault();
          if (isBusy) {
            onStop();
          } else if (canSend) {
            onSend();
          }
        }}
        className="relative flex flex-col rounded-[22px] p-2.5 pl-4 border shadow-sm transition-all duration-150 focus-within:ring-2 focus-within:ring-[var(--primary)]/20"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border-strong)',
        }}
      >
        {/* Top / Main Input Row */}
        <div className="flex items-end gap-2.5">
          {/* Attach File Button */}
          <motion.button
            type="button"
            onClick={onAttachClick}
            disabled={isBusy}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-9 h-9 shrink-0 flex items-center justify-center rounded-xl transition-colors cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed mb-0.5"
            style={{ color: 'var(--text-muted)' }}
            title="Attach document or text file"
            aria-label="Attach file"
          >
            <Paperclip size={18} />
          </motion.button>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? 'Listening… speak clearly into your microphone' : 'Ask Anything...'}
            rows={1}
            aria-label="Message Chatora AI"
            className="flex-1 bg-transparent border-0 border-none outline-none ring-0 shadow-none focus:border-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 resize-none py-1.5 text-[15px] sm:text-base leading-relaxed min-w-0 max-h-[180px]"
            style={{
              color: 'var(--text)',
              border: 'none',
              outline: 'none',
              boxShadow: 'none',
            }}
          />

          {/* Character Counter if near limit */}
          {isNearLimit && (
            <span
              className="text-xs mb-2 shrink-0 font-mono"
              style={{ color: isOverLimit ? 'var(--error)' : 'var(--text-muted)' }}
            >
              {input.length}/{charLimit}
            </span>
          )}

          {/* Voice Input Button */}
          <motion.button
            type="button"
            onClick={toggleListening}
            disabled={isBusy}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`w-9 h-9 shrink-0 flex items-center justify-center rounded-xl transition-all cursor-pointer mb-0.5 ${
              isListening ? 'ring-2 ring-amber-500 animate-pulse' : 'hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            style={{
              color: isListening ? 'var(--amber)' : 'var(--text-muted)',
              backgroundColor: isListening ? 'var(--surface-subtle)' : 'transparent',
            }}
            title={isListening ? 'Stop listening' : 'Dictate with voice'}
            aria-label={isListening ? 'Stop listening' : 'Dictate with voice'}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </motion.button>

          {/* Send / Stop Button with morph transition */}
          <AnimatePresence mode="wait" initial={false}>
            {isBusy ? (
              <motion.button
                key="stop-btn"
                type="button"
                onClick={onStop}
                initial={{ scale: 0.8, rotate: -25, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                exit={{ scale: 0.8, rotate: 25, opacity: 0 }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center cursor-pointer shadow-sm mb-0.5"
                style={{
                  backgroundColor: 'var(--primary)',
                  color: 'var(--on-primary)',
                }}
                title="Stop generating"
                aria-label="Stop generating"
              >
                <Square size={13} fill="currentColor" />
              </motion.button>
            ) : (
              <motion.button
                key="send-btn"
                type="submit"
                disabled={!canSend}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                whileHover={canSend ? { scale: 1.06 } : undefined}
                whileTap={canSend ? { scale: 0.94 } : undefined}
                transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center cursor-pointer shadow-sm disabled:cursor-not-allowed disabled:opacity-40 mb-0.5"
                style={{
                  backgroundColor: canSend ? 'var(--primary)' : 'var(--surface-subtle)',
                  color: canSend ? 'var(--on-primary)' : 'var(--text-muted)',
                  border: canSend ? 'none' : '1px solid var(--border)',
                }}
                title="Send message"
                aria-label="Send message"
              >
                <ArrowUp size={18} strokeWidth={2.2} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Chips Bar: Style Selector (Normal / Deep Think / Concise) */}
        {onSetResponseStyle && (
          <div className="flex items-center gap-2 pt-2 border-t mt-1 text-xs" style={{ borderColor: 'var(--border)' }}>
            <div className="relative">
              <button
                type="button"
                onClick={() => setStyleDropdownOpen(!styleDropdownOpen)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                style={{
                  backgroundColor: 'var(--surface-subtle)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)',
                }}
                title="Select response depth"
              >
                <Sparkles size={12} style={{ color: 'var(--primary)' }} />
                <span>{styleLabels[responseStyle]}</span>
                <ChevronDown size={12} className="opacity-60" />
              </button>

              {styleDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setStyleDropdownOpen(false)}
                  />
                  <div
                    className="absolute left-0 bottom-full mb-1 w-36 rounded-xl border p-1 shadow-lg z-40 text-xs"
                    style={{
                      backgroundColor: 'var(--surface)',
                      borderColor: 'var(--border)',
                      color: 'var(--text)',
                    }}
                  >
                    {(['balanced', 'detailed', 'concise'] as const).map(style => (
                      <button
                        key={style}
                        type="button"
                        onClick={() => {
                          onSetResponseStyle(style);
                          setStyleDropdownOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-left"
                        style={{
                          fontWeight: responseStyle === style ? 600 : 400,
                          color: responseStyle === style ? 'var(--primary)' : 'var(--text)',
                        }}
                      >
                        <span>{styleLabels[style]}</span>
                        {responseStyle === style && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--primary)' }} />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <span className="text-[11px] select-none" style={{ color: 'var(--text-muted)' }}>
              {responseStyle === 'detailed'
                ? 'Deep reasoning & thorough explanation'
                : responseStyle === 'concise'
                ? 'Direct bulleted answers'
                : 'Balanced clarity & speed'}
            </span>
          </div>
        )}
      </form>

      {/* Footer Hints & Privacy Notice */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 text-xs pt-2 px-2" style={{ color: 'var(--text-muted)' }}>
        <p>
          Chatora AI generates intelligent answers via Google Gemini.{' '}
          <button
            type="button"
            onClick={onOpenPrivacy}
            className="underline underline-offset-2 hover:opacity-85 cursor-pointer"
            style={{ color: 'var(--primary)' }}
          >
            Privacy details
          </button>
        </p>
        <span className="hidden sm:inline">Enter to send · Shift+Enter for new line</span>
      </div>
    </div>
  );
};
