import React, { useState } from 'react';
import { Copy, Check, RotateCw, AlertCircle, ArrowDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MarkdownRenderer } from './MarkdownRenderer';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  status?: 'complete' | 'stopped' | 'error';
  requestId?: string;
  error?: string;
}

interface ConversationViewProps {
  messages: Message[];
  isStreaming: boolean;
  streamingText: string;
  isWaiting: boolean;
  isTakingLonger: boolean;
  onRegenerate: () => void;
  onRetryError: (errorMsg: Message) => void;
  showJumpToBottom: boolean;
  onJumpToBottom: () => void;
}

function formatRelativeTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return 'Just now';
  }
}

export const ConversationView: React.FC<ConversationViewProps> = ({
  messages,
  isStreaming,
  streamingText,
  isWaiting,
  isTakingLonger,
  onRegenerate,
  onRetryError,
  showJumpToBottom,
  onJumpToBottom,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyMessage = async (id: string, text: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2200);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  return (
    <div className="py-4 space-y-6 max-w-[900px] mx-auto w-full relative">
      {messages.map((msg, index) => {
        const isLastAssistant =
          msg.role === 'assistant' &&
          (index === messages.length - 1 ||
            (index === messages.length - 2 && messages[messages.length - 1].role === 'user'));

        if (msg.role === 'user') {
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="flex justify-end"
            >
              <span className="sr-only">You:</span>
              <div
                className="max-w-[85%] sm:max-w-[78%] px-4 sm:px-5 py-3 rounded-[18px] text-[15px] sm:text-base leading-relaxed break-words whitespace-pre-wrap shadow-xs"
                style={{
                  backgroundColor: 'var(--user-msg)',
                  color: 'var(--text)',
                }}
              >
                {msg.content}
              </div>
            </motion.div>
          );
        }

        // Assistant Message
        if (msg.status === 'error') {
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="space-y-2"
            >
              <span className="sr-only">Assistant:</span>
              <div
                className="p-4 sm:p-5 rounded-2xl border flex items-start gap-3.5 max-w-[74ch]"
                style={{
                  backgroundColor: 'var(--error-surface)',
                  borderColor: 'var(--error)',
                }}
                role="alert"
              >
                <AlertCircle size={20} className="shrink-0 mt-0.5" style={{ color: 'var(--error)' }} />
                <div className="space-y-2 flex-1 min-w-0">
                  <h4 className="text-sm sm:text-base font-semibold" style={{ color: 'var(--error)' }}>
                    Generation Encountered an Error
                  </h4>
                  <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
                    {msg.error || 'The model took too long to respond or service is temporarily busy. Your input was preserved.'}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      onClick={() => onRetryError(msg)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                      style={{
                        backgroundColor: 'var(--primary)',
                        color: 'var(--on-primary)',
                      }}
                    >
                      <RotateCw size={13} />
                      <span>Retry</span>
                    </button>
                    {msg.requestId && (
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Reference: <code>{msg.requestId}</code>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        }

        return (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="group space-y-2"
          >
            <span className="sr-only">Assistant:</span>
            <div className="max-w-[74ch] text-sm sm:text-base leading-relaxed">
              <MarkdownRenderer content={msg.content} />
            </div>

            {msg.status === 'stopped' && (
              <div
                className="flex items-center gap-2 text-xs sm:text-sm font-medium py-1 px-2.5 rounded-md inline-flex border"
                style={{
                  borderColor: 'var(--amber)',
                  color: 'var(--text)',
                  backgroundColor: 'var(--surface-subtle)',
                }}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--amber)' }} />
                <span>Stopped. This response is incomplete.</span>
              </div>
            )}

            {/* Message Action Row with Copy to Clipboard */}
            <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleCopyMessage(msg.id, msg.content)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer shadow-2xs hover:shadow-xs"
                style={{
                  backgroundColor: copiedId === msg.id ? 'var(--surface-subtle)' : 'var(--surface)',
                  borderColor: copiedId === msg.id ? 'var(--primary)' : 'var(--border)',
                  color: copiedId === msg.id ? 'var(--primary)' : 'var(--text)',
                }}
                title="Copy to Clipboard"
                aria-label="Copy to Clipboard"
              >
                {copiedId === msg.id ? (
                  <>
                    <Check size={14} style={{ color: 'var(--primary)' }} />
                    <span className="font-semibold" style={{ color: 'var(--primary)' }}>Copied to Clipboard</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} style={{ color: 'var(--text-muted)' }} />
                    <span>Copy to Clipboard</span>
                  </>
                )}
              </motion.button>

              {isLastAssistant && !isStreaming && (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={onRegenerate}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-muted)',
                  }}
                  title="Regenerate response"
                  aria-label="Regenerate response"
                >
                  <RotateCw size={13} />
                  <span>Regenerate</span>
                </motion.button>
              )}

              <time
                dateTime={msg.timestamp}
                className="text-xs ml-auto"
                style={{ color: 'var(--text-muted)' }}
                title={new Date(msg.timestamp).toLocaleString()}
              >
                {formatRelativeTime(msg.timestamp)}
              </time>
            </div>
          </motion.div>
        );
      })}

      {/* Real-time Streaming Turn */}
      {isStreaming && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <span className="sr-only">Assistant:</span>
          <div className="max-w-[74ch] text-sm sm:text-base leading-relaxed relative">
            <MarkdownRenderer content={streamingText} />
            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="inline-block w-2 h-4 align-middle ml-1 rounded-xs"
              style={{ backgroundColor: 'var(--primary)' }}
              aria-hidden="true"
            />
          </div>
        </motion.div>
      )}

      {/* Waiting Indicator with Smooth Wave Pulse */}
      {isWaiting && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className="space-y-2"
        >
          <span className="sr-only">Assistant:</span>
          <div
            className="flex items-center gap-3 text-sm py-2"
            style={{ color: 'var(--text-muted)' }}
            role="status"
          >
            <div className="inline-flex items-center gap-1.5" aria-hidden="true">
              {[0, 0.16, 0.32].map((delay, i) => (
                <motion.span
                  key={i}
                  animate={{
                    y: [0, -4, 0],
                    opacity: [0.4, 1, 0.4],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay,
                    ease: 'easeInOut',
                  }}
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: 'var(--primary)' }}
                />
              ))}
            </div>
            <span>Thinking…</span>
            {isTakingLonger && (
              <span className="text-xs px-2 py-0.5 rounded border" style={{ borderColor: 'var(--border)' }}>
                Taking longer than usual
              </span>
            )}
          </div>
        </motion.div>
      )}

      {/* Jump to bottom Floating Pill with Spring Entrance */}
      <AnimatePresence>
        {showJumpToBottom && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="sticky bottom-4 flex justify-center z-20 pointer-events-none"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
              onClick={onJumpToBottom}
              className="pointer-events-auto shadow-md border rounded-full px-4 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border-strong)',
                color: 'var(--text)',
              }}
            >
              <ArrowDown size={14} />
              <span>Jump to latest</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
