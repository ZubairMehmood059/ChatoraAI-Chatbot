import React from 'react';
import { Compass, MessageSquarePlus, Home } from 'lucide-react';

interface NotFoundPageProps {
  onNavigate: (path: string) => void;
  onNewChat?: () => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onNavigate, onNewChat }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 md:py-20 space-y-6">
      {/* Icon Badge */}
      <div
        className="w-20 h-20 rounded-3xl flex items-center justify-center border shadow-sm"
        style={{
          backgroundColor: 'var(--surface-subtle)',
          borderColor: 'var(--border)',
          color: 'var(--primary)',
        }}
      >
        <Compass size={40} />
      </div>

      {/* Title & Message */}
      <div className="space-y-2 max-w-md">
        <span
          className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border"
          style={{
            backgroundColor: 'var(--error-surface)',
            borderColor: 'var(--error)',
            color: 'var(--error)',
          }}
        >
          404 — Page Not Found
        </span>
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
          Lost in the conversation?
        </h1>
        <p className="text-sm opacity-80 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          The link or route you opened doesn't exist on Chatora AI. You can head back to the main workspace or start a new conversation right away.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap justify-center gap-3 pt-2">
        <button
          onClick={() => onNavigate('/')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs cursor-pointer transition-transform active:scale-95 shadow-sm"
          style={{ backgroundColor: 'var(--primary)', color: 'var(--on-primary)' }}
        >
          <Home size={16} />
          <span>Return to Chat</span>
        </button>

        {onNewChat && (
          <button
            onClick={() => {
              onNewChat();
              onNavigate('/');
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs border cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
          >
            <MessageSquarePlus size={16} />
            <span>Start a New Chat</span>
          </button>
        )}
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-xl pt-8 border-t" style={{ borderColor: 'var(--border)' }}>
        <button
          onClick={() => onNavigate('/faq')}
          className="p-3.5 rounded-xl border text-left hover:border-strong transition-colors cursor-pointer"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <p className="font-semibold text-xs" style={{ color: 'var(--primary)' }}>FAQ &amp; Help</p>
          <p className="text-[11px] opacity-75 mt-1">Answers to common questions</p>
        </button>

        <button
          onClick={() => onNavigate('/contact')}
          className="p-3.5 rounded-xl border text-left hover:border-strong transition-colors cursor-pointer"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <p className="font-semibold text-xs" style={{ color: 'var(--primary)' }}>Contact &amp; Feedback</p>
          <p className="text-[11px] opacity-75 mt-1">Send a message to support</p>
        </button>

        <button
          onClick={() => onNavigate('/privacy')}
          className="p-3.5 rounded-xl border text-left hover:border-strong transition-colors cursor-pointer"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <p className="font-semibold text-xs" style={{ color: 'var(--primary)' }}>Privacy Policy</p>
          <p className="text-[11px] opacity-75 mt-1">Read our data practices</p>
        </button>
      </div>
    </div>
  );
};
