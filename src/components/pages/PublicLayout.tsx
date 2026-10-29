import React from 'react';
import { BrandLogo } from '../BrandLogo';
import { FooterLinks } from '../FooterLinks';
import { ArrowLeft, Sun, Moon } from 'lucide-react';
import { motion } from 'motion/react';

interface PublicLayoutProps {
  children: React.ReactNode;
  onNavigate: (path: string) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenCookieSettings?: () => void;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({
  children,
  onNavigate,
  theme,
  onToggleTheme,
  onOpenCookieSettings,
}) => {
  return (
    <div
      className="min-h-screen flex flex-col font-sans transition-colors"
      style={{
        backgroundColor: 'var(--bg)',
        color: 'var(--text)',
      }}
    >
      {/* Header Bar */}
      <header
        className="h-16 shrink-0 border-b flex items-center justify-between px-4 sm:px-8 sticky top-0 z-30 backdrop-blur-md"
        style={{
          borderColor: 'var(--border)',
          backgroundColor: 'var(--surface)',
        }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate('/')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            aria-label="Return to Chat"
          >
            <ArrowLeft size={15} />
            <span>Return to Chat</span>
          </button>
          <div onClick={() => onNavigate('/')} className="cursor-pointer">
            <BrandLogo />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            style={{ color: 'var(--text)' }}
            title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <motion.main
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-8 py-8 md:py-12"
      >
        {children}
      </motion.main>

      {/* Unified Footer */}
      <div className="max-w-4xl mx-auto w-full px-4 sm:px-8">
        <FooterLinks onNavigate={onNavigate} onOpenCookieSettings={onOpenCookieSettings} />
      </div>
    </div>
  );
};
