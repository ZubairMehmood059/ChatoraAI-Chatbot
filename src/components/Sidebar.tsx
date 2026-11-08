import React, { useState, useRef, useEffect } from 'react';
import {
  PanelLeft,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  Plus,
  Search,
  Sliders,
  HelpCircle,
  MoreHorizontal,
  Edit2,
  Download,
  Printer,
  Trash2,
  Pin,
  PinOff,
  LogIn,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BrandLogo } from './BrandLogo';
import { ConversationSummary } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  conversations: ConversationSummary[];
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  onRenameConversation: (id: string, currentTitle: string) => void;
  onTogglePin: (id: string, pinned: boolean) => void;
  onDeleteConversation: (id: string, title: string) => void;
  onExportConversation: (id: string, format: 'txt' | 'md') => void;
  onPrintConversation: (id: string) => void;
  onOpenAuthModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeId,
  onSelectConversation,
  onNewChat,
  isExpanded,
  onToggleExpanded,
  isMobileOpen,
  onCloseMobile,
  onOpenSettings,
  onOpenHelp,
  onRenameConversation,
  onTogglePin,
  onDeleteConversation,
  onExportConversation,
  onPrintConversation,
  onOpenAuthModal,
}) => {
  const { user, signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [menuDirection, setMenuDirection] = useState<'down' | 'up'>('down');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close open context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Filter conversations by title
  const filtered = conversations.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  // Group conversations: Pinned first, then Today, Yesterday, Previous 7 Days, Older
  const grouped = React.useMemo(() => {
    const pinned: ConversationSummary[] = [];
    const today: ConversationSummary[] = [];
    const yesterday: ConversationSummary[] = [];
    const last7: ConversationSummary[] = [];
    const older: ConversationSummary[] = [];

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 86400000;
    const startOf7Days = startOfToday - 86400000 * 7;

    filtered.forEach(c => {
      if (c.pinned) {
        pinned.push(c);
        return;
      }
      const rawDate = c.updatedAt || c.createdAt;
      const parsedTime = rawDate ? new Date(rawDate).getTime() : Date.now();
      const time = isNaN(parsedTime) ? Date.now() : parsedTime;
      if (time >= startOfToday) {
        today.push(c);
      } else if (time >= startOfYesterday) {
        yesterday.push(c);
      } else if (time >= startOf7Days) {
        last7.push(c);
      } else {
        older.push(c);
      }
    });

    return [
      { label: 'Pinned', items: pinned },
      { label: 'Today', items: today },
      { label: 'Yesterday', items: yesterday },
      { label: 'Previous 7 days', items: last7 },
      { label: 'Older', items: older },
    ].filter(g => g.items.length > 0);
  }, [filtered]);

  return (
    <>
      {/* Mobile Backdrop Scrim */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onCloseMobile}
            className="fixed inset-0 z-40 bg-black/50 md:hidden backdrop-blur-xs"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Main Sidebar Shell */}
      <aside
        className={`fixed md:relative top-0 left-0 h-full z-50 md:z-30 flex flex-col border-r transition-all duration-200 ease-out select-none
          ${isMobileOpen ? 'translate-x-0 w-[280px] shadow-2xl' : '-translate-x-full md:translate-x-0'}
          ${isExpanded ? 'md:w-[260px]' : 'md:w-[72px]'}
        `}
        style={{
          backgroundColor: 'var(--sidebar)',
          borderColor: 'var(--border)',
        }}
        aria-label="Conversation Sidebar"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between p-3.5 min-h-[58px]">
          {isExpanded || isMobileOpen ? (
            <>
              <div className="flex items-center gap-2.5 overflow-hidden">
                <BrandLogo size={28} />
                <span className="font-semibold text-base tracking-tight truncate" style={{ color: 'var(--text)' }}>
                  Chatora AI
                </span>
              </div>
              <button
                onClick={isMobileOpen ? onCloseMobile : onToggleExpanded}
                className="p-2 rounded-xl transition-all hover:bg-black/8 dark:hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
                title={isMobileOpen ? 'Turn off sidebar' : 'Turn off sidebar (Ctrl+\\)'}
                aria-label={isMobileOpen ? 'Turn off sidebar' : 'Turn off sidebar'}
              >
                {isMobileOpen ? <X size={18} /> : <PanelLeftClose size={18} />}
              </button>
            </>
          ) : (
            <div className="w-full flex items-center justify-center">
              <button
                onClick={onToggleExpanded}
                className="group relative w-10 h-10 flex items-center justify-center rounded-xl transition-all hover:bg-black/8 dark:hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
                title="Turn on sidebar (Ctrl+\\)"
                aria-label="Turn on sidebar"
              >
                <div className="group-hover:hidden transition-transform">
                  <BrandLogo size={26} />
                </div>
                <div className="hidden group-hover:flex items-center justify-center">
                  <PanelLeftOpen size={20} style={{ color: 'var(--primary)' }} />
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Action: New Chat Button */}
        <div className="p-3 pt-1">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              onNewChat();
              if (isMobileOpen) onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all cursor-pointer shadow-xs hover:shadow-sm"
            style={{
              backgroundColor: 'var(--primary)',
              color: 'var(--on-primary)',
            }}
            title="Start new chat (Alt+N)"
            aria-label="New chat"
          >
            <Plus size={18} strokeWidth={2.2} />
            {(isExpanded || isMobileOpen) && <span>New chat</span>}
          </motion.button>
        </div>

        {/* Search Field (expanded) or Search Icon (rail) */}
        {isExpanded || isMobileOpen ? (
          <div className="px-3 pb-2">
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border-strong)',
                color: 'var(--text)',
              }}
            >
              <Search size={15} style={{ color: 'var(--text-muted)' }} />
              <input
                ref={searchInputRef}
                type="search"
                placeholder="Search chats (Ctrl+K)"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-0 outline-none text-xs placeholder:text-[var(--text-muted)]"
                aria-label="Search conversations"
              />
            </div>
          </div>
        ) : (
          <div className="hidden md:flex justify-center pb-2">
            <button
              onClick={() => {
                onToggleExpanded();
                setTimeout(() => searchInputRef.current?.focus(), 150);
              }}
              className="p-2.5 rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              style={{ color: 'var(--text-muted)' }}
              title="Search conversations (Ctrl+K)"
              aria-label="Search conversations"
            >
              <Search size={18} />
            </button>
          </div>
        )}

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-4">
          {(isExpanded || isMobileOpen) ? (
            grouped.length > 0 ? (
              grouped.map(group => (
                <div key={group.label} className="space-y-1">
                  <div
                    className="px-2 pt-2 pb-1 text-xs font-semibold tracking-wider uppercase flex items-center gap-1.5"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {group.label === 'Pinned' && <Pin size={11} className="rotate-45" />}
                    <span>{group.label}</span>
                  </div>
                  {group.items.map(convo => {
                    const isActive = convo.id === activeId;
                    const isMenuOpen = activeMenuId === convo.id;

                    return (
                      <div
                        key={convo.id}
                        className="relative group rounded-xl transition-colors"
                        style={{
                          backgroundColor: isActive ? 'var(--surface)' : 'transparent',
                          boxShadow: isActive ? 'inset 0 0 0 1px var(--border)' : 'none',
                        }}
                      >
                        <button
                          onClick={() => {
                            onSelectConversation(convo.id);
                            if (isMobileOpen) onCloseMobile();
                          }}
                          className="w-full text-left py-2 px-2.5 pr-9 rounded-xl text-sm cursor-pointer transition-colors flex items-center gap-1.5 overflow-hidden"
                          style={{
                            color: 'var(--text)',
                            fontWeight: isActive ? 600 : 400,
                          }}
                          title={convo.title}
                          aria-current={isActive ? 'true' : undefined}
                        >
                          {convo.pinned && (
                            <Pin size={12} className="shrink-0 rotate-45" style={{ color: 'var(--primary)' }} />
                          )}
                          <span className="truncate">{convo.title}</span>
                        </button>

                        {/* Action Dropdown Toggle - Three dots */}
                        <div className="absolute right-1 top-1/2 -translate-y-1/2 z-10">
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              const rect = e.currentTarget.getBoundingClientRect();
                              const opensUp = rect.bottom + 230 > window.innerHeight;
                              setMenuDirection(opensUp ? 'up' : 'down');
                              setActiveMenuId(isMenuOpen ? null : convo.id);
                            }}
                            className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center
                              ${isMenuOpen
                                ? 'opacity-100 bg-black/10 dark:bg-white/15 text-[var(--text)]'
                                : isActive
                                  ? 'opacity-85 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 text-[var(--text)]'
                                  : 'opacity-65 md:opacity-35 group-hover:opacity-100 hover:!opacity-100 hover:bg-black/10 dark:hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--text)]'
                              }
                            `}
                            title="Chat options (Delete, Rename, Pin, Export)"
                            aria-label={`Options for ${convo.title}`}
                            aria-haspopup="true"
                            aria-expanded={isMenuOpen}
                          >
                            <MoreHorizontal size={15} />
                          </button>

                          {/* Context Menu Popover */}
                          <AnimatePresence>
                            {isMenuOpen && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: menuDirection === 'up' ? 4 : -4 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: menuDirection === 'up' ? 4 : -4 }}
                                transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                                onClick={e => e.stopPropagation()}
                                className={`absolute right-0 w-48 rounded-xl border p-1 shadow-2xl z-50 text-xs backdrop-blur-md
                                  ${menuDirection === 'up' ? 'bottom-full mb-1' : 'top-full mt-1'}
                                `}
                                style={{
                                  backgroundColor: 'var(--surface)',
                                  borderColor: 'var(--border)',
                                  color: 'var(--text)',
                                }}
                                role="menu"
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    onTogglePin(convo.id, !convo.pinned);
                                  }}
                                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-left transition-colors"
                                  role="menuitem"
                                >
                                  {convo.pinned ? <PinOff size={13} /> : <Pin size={13} />}
                                  <span>{convo.pinned ? 'Unpin chat' : 'Pin chat'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    onRenameConversation(convo.id, convo.title);
                                  }}
                                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-left transition-colors"
                                  role="menuitem"
                                >
                                  <Edit2 size={13} />
                                  <span>Rename</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    onExportConversation(convo.id, 'txt');
                                  }}
                                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-left transition-colors"
                                  role="menuitem"
                                >
                                  <Download size={13} />
                                  <span>Export as Text (.txt)</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    onExportConversation(convo.id, 'md');
                                  }}
                                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-left transition-colors"
                                  role="menuitem"
                                >
                                  <Download size={13} />
                                  <span>Export Markdown (.md)</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    onPrintConversation(convo.id);
                                  }}
                                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-left transition-colors"
                                  role="menuitem"
                                >
                                  <Printer size={13} />
                                  <span>Print conversation</span>
                                </button>
                                <div className="my-1 border-t" style={{ borderColor: 'var(--border)' }} />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    onDeleteConversation(convo.id, convo.title);
                                  }}
                                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-red-500/10 cursor-pointer text-left transition-colors font-medium text-red-600 dark:text-red-400"
                                  role="menuitem"
                                >
                                  <Trash2 size={13} />
                                  <span>Delete chat</span>
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                {searchQuery ? `No chats match "${searchQuery}".` : 'Your conversations will appear here.'}
              </div>
            )
          ) : (
            /* Collapsed Rail view: icons for recent items */
            <div className="flex flex-col items-center gap-2 pt-2">
              {filtered.slice(0, 8).map(convo => (
                <button
                  key={convo.id}
                  onClick={() => onSelectConversation(convo.id)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-semibold uppercase transition-colors cursor-pointer relative
                    ${convo.id === activeId ? 'ring-1' : 'opacity-70 hover:opacity-100'}
                  `}
                  style={{
                    backgroundColor: convo.id === activeId ? 'var(--surface)' : 'var(--surface-subtle)',
                    color: 'var(--text)',
                    borderColor: 'var(--border)',
                  }}
                  title={convo.title}
                >
                  {convo.pinned && (
                    <span
                      className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
                      style={{ backgroundColor: 'var(--primary)' }}
                    />
                  )}
                  {convo.title.charAt(0) || 'C'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          className="p-2 border-t flex flex-col gap-1"
          style={{ borderColor: 'var(--border)' }}
        >
          {/* User Account / Sign In Widget - ChatGPT Sphere Form */}
          {user ? (
            <div
              className={`group flex items-center gap-2.5 rounded-full transition-all border ${
                isExpanded || isMobileOpen
                  ? 'w-full py-1.5 px-2 hover:bg-black/5 dark:hover:bg-white/5'
                  : 'w-10 h-10 mx-auto justify-center p-0'
              }`}
              style={{
                backgroundColor: 'var(--surface-subtle)',
                borderColor: 'var(--border)',
              }}
            >
              {/* Spherical 3D User Avatar Orb */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 relative overflow-hidden select-none"
                style={{
                  background: 'radial-gradient(circle at 35% 30%, #34d399 0%, #059669 55%, #064e3b 100%)',
                  boxShadow: 'inset -2px -2px 4px rgba(0,0,0,0.4), inset 2px 2px 4px rgba(255,255,255,0.45), 0 2px 5px rgba(5,150,105,0.3)',
                }}
                title={user.email}
              >
                {/* Specular highlight */}
                <div className="absolute top-1 left-1.5 w-2 h-1.5 rounded-full bg-white/50 blur-[0.5px] -rotate-45 pointer-events-none" />
                <span className="relative z-10 drop-shadow-xs">
                  {user.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>

              {(isExpanded || isMobileOpen) && (
                <div className="flex-1 min-w-0 flex items-center justify-between">
                  <div className="min-w-0 pr-1 text-left">
                    <p className="text-xs font-semibold truncate leading-tight" style={{ color: 'var(--text)' }}>
                      {user.user_metadata?.name || user.email?.split('@')[0] || 'Account'}
                    </p>
                    <p className="text-[10px] opacity-70 truncate leading-tight mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {user.email}
                    </p>
                  </div>
                  <button
                    onClick={() => signOut()}
                    className="p-1.5 rounded-full hover:bg-red-500/10 hover:text-red-500 transition-colors cursor-pointer text-xs"
                    style={{ color: 'var(--text-muted)' }}
                    title="Sign Out"
                    aria-label="Sign out"
                  >
                    <LogOut size={13} />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className={`group flex items-center gap-2.5 rounded-full transition-all cursor-pointer font-medium border shadow-xs hover:shadow-sm active:scale-[0.98] ${
                isExpanded || isMobileOpen
                  ? 'w-full py-1.5 px-2 hover:bg-black/5 dark:hover:bg-white/5'
                  : 'w-10 h-10 mx-auto justify-center p-0'
              }`}
              style={{
                backgroundColor: 'var(--surface-subtle)',
                borderColor: 'var(--border)',
                color: 'var(--text)',
              }}
              title="Sign in or register"
              aria-label="Sign in"
            >
              {/* ChatGPT-style 3D sphere orb icon */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 relative overflow-hidden select-none transition-transform group-hover:scale-105"
                style={{
                  background: 'radial-gradient(circle at 35% 30%, #34d399 0%, #10b981 50%, #047857 85%, #064e3b 100%)',
                  boxShadow: 'inset -2px -2px 5px rgba(0,0,0,0.4), inset 2px 2px 4px rgba(255,255,255,0.45), 0 2px 6px rgba(16,185,129,0.35)',
                }}
              >
                {/* Specular sphere highlight */}
                <div className="absolute top-1 left-1.5 w-2.5 h-1.5 rounded-full bg-white/60 blur-[0.6px] -rotate-45 pointer-events-none" />
                <UserIcon size={14} className="relative z-10 text-white drop-shadow-xs" />
              </div>

              {(isExpanded || isMobileOpen) && (
                <div className="flex-1 min-w-0 text-left">
                  <span className="text-xs font-semibold tracking-tight block leading-tight">
                    Log in / Sign up
                  </span>
                  <span className="text-[10px] block opacity-65 leading-tight mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                    Chatora AI Account
                  </span>
                </div>
              )}
            </button>
          )}

          <button
            onClick={onOpenSettings}
            className={`flex items-center gap-3 p-2 rounded-xl transition-colors hover-surface-subtle cursor-pointer
              ${isExpanded || isMobileOpen ? 'w-full px-3' : 'justify-center w-full'}
            `}
            style={{ color: 'var(--text)' }}
            title="Settings"
            aria-label="Settings"
          >
            <Sliders size={18} style={{ color: 'var(--text-muted)' }} />
            {(isExpanded || isMobileOpen) && <span className="text-xs sm:text-sm font-medium">Settings</span>}
          </button>

          <button
            onClick={onOpenHelp}
            className={`flex items-center gap-3 p-2 rounded-xl transition-colors hover-surface-subtle cursor-pointer
              ${isExpanded || isMobileOpen ? 'w-full px-3' : 'justify-center w-full'}
            `}
            style={{ color: 'var(--text)' }}
            title="Help & Privacy"
            aria-label="Help & Privacy"
          >
            <HelpCircle size={18} style={{ color: 'var(--text-muted)' }} />
            {(isExpanded || isMobileOpen) && <span className="text-xs sm:text-sm font-medium">Help &amp; privacy</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
