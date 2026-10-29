import React from 'react';
import { X, Moon, Sun, Trash2, Cpu, SlidersHorizontal, Command, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
  responseStyle: 'concise' | 'balanced' | 'detailed';
  setResponseStyle: (s: 'concise' | 'balanced' | 'detailed') => void;
  responseLanguage: string;
  setResponseLanguage: (l: string) => void;
  onClearAllHistory: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  theme,
  setTheme,
  responseStyle,
  setResponseStyle,
  responseLanguage,
  setResponseLanguage,
  onClearAllHistory,
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
          aria-labelledby="settings-heading"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="w-full max-w-[500px] rounded-[22px] p-6 border shadow-2xl max-h-[90vh] overflow-y-auto"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--text)',
            }}
          >
        <div className="flex items-center justify-between pb-4 border-b mb-5" style={{ borderColor: 'var(--border)' }}>
          <h2 id="settings-heading" className="text-xl font-semibold">Settings</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Close settings"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-6 text-sm">
          {/* Appearance Theme */}
          <div>
            <label className="block font-semibold mb-2 flex items-center gap-2">
              <Sun size={16} style={{ color: 'var(--primary)' }} />
              <span>Theme Appearance</span>
            </label>
            <div
              className="grid grid-cols-2 gap-2 p-1 rounded-xl border relative"
              style={{
                backgroundColor: 'var(--bg)',
                borderColor: 'var(--border)',
              }}
            >
              <button
                type="button"
                onClick={() => setTheme('light')}
                className="relative flex items-center justify-center gap-2 py-2 rounded-lg font-medium transition-colors cursor-pointer z-10"
                style={{
                  color: theme === 'light' ? 'var(--text)' : 'var(--text-muted)',
                  fontWeight: theme === 'light' ? 600 : 400,
                }}
              >
                {theme === 'light' && (
                  <motion.span
                    layoutId="activeThemeModalTab"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    className="absolute inset-0 rounded-lg -z-10 shadow-xs"
                    style={{
                      backgroundColor: 'var(--surface)',
                      boxShadow: 'var(--shadow)',
                    }}
                  />
                )}
                <Sun size={15} style={{ color: theme === 'light' ? 'var(--amber)' : 'inherit' }} />
                <span>Light</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className="relative flex items-center justify-center gap-2 py-2 rounded-lg font-medium transition-colors cursor-pointer z-10"
                style={{
                  color: theme === 'dark' ? 'var(--text)' : 'var(--text-muted)',
                  fontWeight: theme === 'dark' ? 600 : 400,
                }}
              >
                {theme === 'dark' && (
                  <motion.span
                    layoutId="activeThemeModalTab"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    className="absolute inset-0 rounded-lg -z-10 shadow-xs"
                    style={{
                      backgroundColor: 'var(--surface)',
                      boxShadow: 'var(--shadow)',
                    }}
                  />
                )}
                <Moon size={15} style={{ color: theme === 'dark' ? 'var(--primary)' : 'inherit' }} />
                <span>Dark</span>
              </button>
            </div>
          </div>

          {/* Response Style Preference */}
          <div>
            <label className="block font-semibold mb-2 flex items-center gap-2">
              <SlidersHorizontal size={16} style={{ color: 'var(--primary)' }} />
              <span>Response Style</span>
            </label>
            <p className="text-xs mb-2.5" style={{ color: 'var(--text-muted)' }}>
              Controls how detailed or direct the assistant's answers should be.
            </p>
            <div
              className="grid grid-cols-3 gap-1.5 p-1 rounded-xl border text-xs relative"
              style={{
                backgroundColor: 'var(--bg)',
                borderColor: 'var(--border)',
              }}
            >
              {(['concise', 'balanced', 'detailed'] as const).map(style => (
                <button
                  key={style}
                  type="button"
                  onClick={() => setResponseStyle(style)}
                  className="relative py-2 capitalize font-medium rounded-lg transition-colors cursor-pointer z-10"
                  style={{
                    color: responseStyle === style ? 'var(--primary)' : 'var(--text-muted)',
                    fontWeight: responseStyle === style ? 600 : 400,
                  }}
                >
                  {responseStyle === style && (
                    <motion.span
                      layoutId="activeResponseStyleTab"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      className="absolute inset-0 rounded-lg -z-10 shadow-xs"
                      style={{
                        backgroundColor: 'var(--surface)',
                        boxShadow: 'var(--shadow)',
                      }}
                    />
                  )}
                  {style}
                </button>
              ))}
            </div>
          </div>

          {/* Preferred Response Language */}
          <div>
            <label className="block font-semibold mb-2 flex items-center gap-2">
              <Globe size={16} style={{ color: 'var(--primary)' }} />
              <span>Preferred Language</span>
            </label>
            <p className="text-xs mb-2.5" style={{ color: 'var(--text-muted)' }}>
              Instruct the assistant to prioritize responses in your chosen language.
            </p>
            <select
              value={responseLanguage}
              onChange={e => setResponseLanguage(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border text-xs outline-none cursor-pointer"
              style={{
                backgroundColor: 'var(--bg)',
                borderColor: 'var(--border-strong)',
                color: 'var(--text)',
              }}
            >
              <option value="auto">Auto-detect (Match prompt language)</option>
              <option value="English">English</option>
              <option value="Spanish">Español (Spanish)</option>
              <option value="French">Français (French)</option>
              <option value="German">Deutsch (German)</option>
              <option value="Japanese">日本語 (Japanese)</option>
              <option value="Chinese (Simplified)">简体中文 (Chinese)</option>
              <option value="Arabic">العربية (Arabic)</option>
              <option value="Urdu">اردو (Urdu)</option>
              <option value="Hindi">हिन्दी (Hindi)</option>
            </select>
          </div>

          {/* Model Information */}
          <div>
            <label className="block font-semibold mb-2 flex items-center gap-2">
              <Cpu size={16} style={{ color: 'var(--primary)' }} />
              <span>Model Provider</span>
            </label>
            <div
              className="p-3 rounded-xl border space-y-1.5"
              style={{
                backgroundColor: 'var(--surface-subtle)',
                borderColor: 'var(--border)',
              }}
            >
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold">Google Gemini 3.8 Flash</span>
                <span
                  className="px-2 py-0.5 rounded text-[11px] font-semibold"
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: 'var(--on-primary)',
                  }}
                >
                  Active
                </span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Configured with server-side proxy security, fast streaming, and context retention.
              </p>
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <div>
            <label className="block font-semibold mb-2 flex items-center gap-2">
              <Command size={16} style={{ color: 'var(--primary)' }} />
              <span>Keyboard Shortcuts</span>
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg border flex justify-between items-center" style={{ borderColor: 'var(--border)' }}>
                <span>Focus message</span>
                <kbd className="px-1.5 py-0.5 rounded border font-mono text-[11px]" style={{ borderColor: 'var(--border)' }}>/</kbd>
              </div>
              <div className="p-2 rounded-lg border flex justify-between items-center" style={{ borderColor: 'var(--border)' }}>
                <span>New chat</span>
                <kbd className="px-1.5 py-0.5 rounded border font-mono text-[11px]" style={{ borderColor: 'var(--border)' }}>Alt+N</kbd>
              </div>
              <div className="p-2 rounded-lg border flex justify-between items-center" style={{ borderColor: 'var(--border)' }}>
                <span>Search history</span>
                <kbd className="px-1.5 py-0.5 rounded border font-mono text-[11px]" style={{ borderColor: 'var(--border)' }}>Ctrl+K</kbd>
              </div>
              <div className="p-2 rounded-lg border flex justify-between items-center" style={{ borderColor: 'var(--border)' }}>
                <span>Toggle sidebar</span>
                <kbd className="px-1.5 py-0.5 rounded border font-mono text-[11px]" style={{ borderColor: 'var(--border)' }}>Ctrl+\</kbd>
              </div>
            </div>
          </div>

          {/* Data Management: Clear All */}
          <div className="pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
            <label className="block font-semibold mb-2 text-sm" style={{ color: 'var(--error)' }}>
              Data Management
            </label>
            <button
              onClick={() => {
                onClose();
                onClearAllHistory();
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition-colors"
              style={{
                borderColor: 'var(--error)',
                color: 'var(--error)',
                backgroundColor: 'var(--error-surface)',
              }}
            >
              <Trash2 size={14} />
              <span>Delete all conversations</span>
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
    )}
  </AnimatePresence>
  );
};
