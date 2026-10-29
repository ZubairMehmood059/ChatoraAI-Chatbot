import React, { useState } from 'react';
import { Menu, Sun, Moon, Sparkles, MoreHorizontal, Download, Printer, Trash2, Search, ChevronRight, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';

interface TopbarProps {
  onOpenMobileMenu: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  isAiConfigured: boolean;
  hasActiveConversation: boolean;
  onExport: (format: 'txt' | 'md') => void;
  onPrint: () => void;
  onDeleteCurrent: () => void;
  activeMode?: 'chat' | 'overview';
  onSelectMode?: (mode: 'chat' | 'overview') => void;
  onTriggerSearch?: () => void;
  onOpenAuthModal?: (view?: 'signin' | 'signup') => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  onOpenMobileMenu,
  theme,
  onToggleTheme,
  isAiConfigured,
  hasActiveConversation,
  onExport,
  onPrint,
  onDeleteCurrent,
  activeMode = 'chat',
  onSelectMode,
  onTriggerSearch,
  onOpenAuthModal,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, signOut } = useAuth();

  return (
    <header
      className="h-14 shrink-0 flex items-center justify-between px-3 sm:px-6 border-b transition-colors relative z-20"
      style={{
        borderColor: 'var(--border)',
        backgroundColor: 'var(--bg)',
      }}
    >
      {/* Left Area: Mobile Menu + Breadcrumbs + Mode Toggle */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile Sidebar Hamburger Toggle */}
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-xl transition-colors hover-surface-subtle cursor-pointer shrink-0"
          style={{ color: 'var(--text)' }}
          title="Open menu"
          aria-label="Open sidebar menu"
        >
          <Menu size={20} />
        </button>

        {/* Breadcrumb Trail: Home › AI Assistant */}
        <nav aria-label="Breadcrumb" className="hidden lg:flex items-center gap-1.5 text-xs select-none shrink-0" style={{ color: 'var(--text-muted)' }}>
          <span>Home</span>
          <ChevronRight size={12} className="opacity-60" />
          <span className="font-semibold" style={{ color: 'var(--text)' }}>AI Assistant</span>
        </nav>

        <div className="hidden lg:block h-4 w-px mx-1" style={{ backgroundColor: 'var(--border)' }} />

        {/* Segmented Mode Toggle: Chat Mode / Overview with smooth sliding pill */}
        <div
          className="inline-flex items-center p-0.5 rounded-xl border text-xs font-medium relative"
          style={{
            backgroundColor: 'var(--surface-subtle)',
            borderColor: 'var(--border)',
          }}
          role="tablist"
          aria-label="View mode"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeMode === 'chat'}
            onClick={() => onSelectMode?.('chat')}
            className="relative px-2.5 py-1 rounded-lg transition-colors cursor-pointer font-medium z-10"
            style={{
              color: activeMode === 'chat' ? 'var(--text)' : 'var(--text-muted)',
              fontWeight: activeMode === 'chat' ? 600 : 400,
            }}
          >
            {activeMode === 'chat' && (
              <motion.span
                layoutId="activeModeTab"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                className="absolute inset-0 rounded-lg -z-10 shadow-xs"
                style={{
                  backgroundColor: 'var(--surface)',
                  boxShadow: 'var(--shadow)',
                }}
              />
            )}
            Chat Mode
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeMode === 'overview'}
            onClick={() => onSelectMode?.('overview')}
            className="relative px-2.5 py-1 rounded-lg transition-colors cursor-pointer font-medium z-10"
            style={{
              color: activeMode === 'overview' ? 'var(--text)' : 'var(--text-muted)',
              fontWeight: activeMode === 'overview' ? 600 : 400,
            }}
          >
            {activeMode === 'overview' && (
              <motion.span
                layoutId="activeModeTab"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                className="absolute inset-0 rounded-lg -z-10 shadow-xs"
                style={{
                  backgroundColor: 'var(--surface)',
                  boxShadow: 'var(--shadow)',
                }}
              />
            )}
            Overview
          </button>
        </div>
      </div>

      {/* Right Area: Glass Status Pill + Search + Theme Switch + Options */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Glass Status Pill: AI System Running */}
        <div
          className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
            color: 'var(--text)',
          }}
          title={isAiConfigured ? 'AI System: Gemini 3.8 Flash Online' : 'API Key Setup Needed'}
        >
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: isAiConfigured ? 'var(--primary)' : 'var(--error)' }}
          />
          <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            AI Engine
          </span>
          <span
            className="px-1.5 py-0.5 rounded text-[11px] font-semibold"
            style={{
              backgroundColor: isAiConfigured ? 'var(--surface-subtle)' : 'var(--error-surface)',
              color: isAiConfigured ? 'var(--primary)' : 'var(--error)',
            }}
          >
            {isAiConfigured ? 'Active' : 'Offline'}
          </span>
        </div>

        {/* Search trigger button */}
        {onTriggerSearch && (
          <button
            onClick={onTriggerSearch}
            className="p-2 rounded-xl transition-colors hover-surface-subtle cursor-pointer"
            style={{ color: 'var(--text)' }}
            title="Search conversations (Ctrl+K)"
            aria-label="Search conversations"
          >
            <Search size={18} />
          </button>
        )}

        {/* Smooth Theme Toggle Switch */}
        <button
          type="button"
          role="switch"
          aria-checked={theme === 'dark'}
          onClick={onToggleTheme}
          className="relative inline-flex h-7.5 w-13 shrink-0 cursor-pointer items-center rounded-full border p-0.5 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{
            backgroundColor: theme === 'dark' ? 'var(--surface-subtle)' : 'var(--border)',
            borderColor: 'var(--border-strong)',
          }}
          title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          aria-label="Toggle theme appearance"
        >
          <span className="sr-only">Toggle theme</span>
          {/* Track Ambient Icons */}
          <div className="absolute inset-0 flex items-center justify-between px-1.5 pointer-events-none select-none">
            <Sun
              size={11}
              className={`transition-opacity duration-200 ${theme === 'dark' ? 'opacity-30' : 'opacity-90'}`}
              style={{ color: 'var(--amber)' }}
            />
            <Moon
              size={11}
              className={`transition-opacity duration-200 ${theme === 'dark' ? 'opacity-90' : 'opacity-30'}`}
              style={{ color: 'var(--primary)' }}
            />
          </div>
          {/* Smooth Spring Sliding Knob */}
          <motion.span
            animate={{ x: theme === 'dark' ? 22 : 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 32 }}
            className="inline-flex h-6 w-6 rounded-full shadow-md z-10 items-center justify-center pointer-events-none"
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
            }}
          >
            {theme === 'dark' ? (
              <Moon size={11} style={{ color: 'var(--primary)' }} />
            ) : (
              <Sun size={11} style={{ color: 'var(--amber)' }} />
            )}
          </motion.span>
        </button>

        {/* Conversation Options Menu (if active conversation) */}
        {hasActiveConversation && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-xl transition-colors hover-surface-subtle cursor-pointer"
              style={{ color: 'var(--text)' }}
              title="Conversation actions"
              aria-label="Conversation actions"
              aria-expanded={menuOpen}
            >
              <MoreHorizontal size={18} />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuOpen(false)}
                />
                <div
                  className="absolute right-0 mt-1 w-48 rounded-xl border p-1 shadow-lg z-50 text-xs animate-in fade-in zoom-in-95 duration-100"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border)',
                    color: 'var(--text)',
                  }}
                  role="menu"
                >
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onExport('txt');
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-left"
                    role="menuitem"
                  >
                    <Download size={13} />
                    <span>Export Text (.txt)</span>
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onExport('md');
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-left"
                    role="menuitem"
                  >
                    <Download size={13} />
                    <span>Export Markdown (.md)</span>
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onPrint();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-left"
                    role="menuitem"
                  >
                    <Printer size={13} />
                    <span>Print conversation</span>
                  </button>
                  <div className="my-1 border-t" style={{ borderColor: 'var(--border)' }} />
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onDeleteCurrent();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-red-500/10 cursor-pointer text-left"
                    style={{ color: 'var(--error)' }}
                    role="menuitem"
                  >
                    <Trash2 size={13} />
                    <span>Delete conversation</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
        {/* User Account / Sign In Menu - ChatGPT Sphere Form */}
        {user ? (
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="group flex items-center gap-2 p-1 pl-1 pr-2.5 rounded-full border transition-all hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-xs active:scale-[0.97]"
              style={{
                borderColor: 'var(--border)',
                backgroundColor: 'var(--surface-subtle)',
                color: 'var(--text)',
              }}
              title={user.email || 'Your account'}
              aria-label="User account menu"
              aria-expanded={userMenuOpen}
            >
              {/* Spherical 3D User Avatar Orb */}
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 relative overflow-hidden select-none"
                style={{
                  background: 'radial-gradient(circle at 35% 30%, #34d399 0%, #059669 55%, #064e3b 100%)',
                  boxShadow: 'inset -1.5px -1.5px 3.5px rgba(0,0,0,0.4), inset 1.5px 1.5px 3px rgba(255,255,255,0.45), 0 2px 5px rgba(5,150,105,0.25)',
                }}
              >
                {/* Specular highlight */}
                <div className="absolute top-0.5 left-1 w-2 h-1 rounded-full bg-white/55 blur-[0.4px] -rotate-45 pointer-events-none" />
                <span className="relative z-10 text-[11px] font-bold text-white drop-shadow-xs">
                  {user.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <span className="hidden sm:inline font-semibold max-w-[110px] truncate text-[11px]">
                {user.user_metadata?.name || user.email?.split('@')[0]}
              </span>
            </button>

            {userMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setUserMenuOpen(false)}
                />
                <div
                  className="absolute right-0 mt-1 w-56 rounded-xl border p-2 shadow-lg z-50 text-xs animate-in fade-in zoom-in-95 duration-100"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border)',
                    color: 'var(--text)',
                  }}
                  role="menu"
                >
                  <div className="px-2 py-1.5 border-b mb-1" style={{ borderColor: 'var(--border)' }}>
                    <p className="font-semibold truncate">{user.user_metadata?.name || 'Account'}</p>
                    <p className="text-[11px] opacity-70 truncate">{user.email}</p>
                    <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded font-mono bg-emerald-500/10 text-emerald-500">
                      Supabase Authenticated
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      signOut();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-red-500/10 cursor-pointer text-left text-red-600 dark:text-red-400 font-medium transition-colors"
                    role="menuitem"
                  >
                    <LogOut size={13} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <button
            onClick={() => onOpenAuthModal?.('signin')}
            className="group flex items-center gap-2 p-1 pl-1 pr-2.5 sm:pr-3 rounded-full border transition-all cursor-pointer font-medium hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.97] shadow-2xs"
            style={{
              backgroundColor: 'var(--surface-subtle)',
              borderColor: 'var(--border)',
              color: 'var(--text)',
            }}
            title="Sign in to your account"
            aria-label="Sign in"
          >
            {/* ChatGPT-style 3D sphere orb icon */}
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 relative overflow-hidden select-none transition-transform group-hover:scale-105"
              style={{
                background: 'radial-gradient(circle at 35% 30%, #34d399 0%, #10b981 50%, #047857 85%, #064e3b 100%)',
                boxShadow: 'inset -1.5px -1.5px 3.5px rgba(0,0,0,0.4), inset 1.5px 1.5px 3px rgba(255,255,255,0.45), 0 2px 5px rgba(16,185,129,0.3)',
              }}
            >
              {/* Specular sphere highlight */}
              <div className="absolute top-0.5 left-1 w-2 h-1 rounded-full bg-white/60 blur-[0.4px] -rotate-45 pointer-events-none" />
              <UserIcon size={12} className="relative z-10 text-white drop-shadow-xs" />
            </div>
            <span className="font-semibold text-xs tracking-tight">Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};
