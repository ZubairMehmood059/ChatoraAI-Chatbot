import React from 'react';
import { CheckCircle2, ArrowLeft, MessageSquare } from 'lucide-react';

interface ThankYouPageProps {
  referenceId: string | null;
  onNavigate: (path: string) => void;
}

export const ThankYouPage: React.FC<ThankYouPageProps> = ({ referenceId, onNavigate }) => {
  // Guard against unsubmitted page hits
  if (!referenceId) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-sm opacity-80" style={{ color: 'var(--text-muted)' }}>
          No feedback submission recorded. Please submit feedback using the Contact page first.
        </p>
        <button
          onClick={() => onNavigate('/contact')}
          className="px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
          style={{ backgroundColor: 'var(--primary)', color: 'var(--on-primary)' }}
        >
          Go to Contact Page
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto text-center py-12 space-y-6 animate-in fade-in duration-200">
      {/* Success Badge */}
      <div
        className="w-16 h-16 mx-auto rounded-3xl flex items-center justify-center border shadow-sm"
        style={{
          backgroundColor: 'var(--surface-subtle)',
          borderColor: 'var(--border)',
          color: 'var(--primary)',
        }}
      >
        <CheckCircle2 size={36} />
      </div>

      <div className="space-y-2">
        <span
          className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border"
          style={{
            backgroundColor: 'var(--surface-subtle)',
            borderColor: 'var(--border)',
            color: 'var(--primary)',
          }}
        >
          Submission Confirmed
        </span>
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
          Thank You for Your Feedback!
        </h1>
        <p className="text-sm opacity-80 leading-relaxed max-w-md mx-auto" style={{ color: 'var(--text-muted)' }}>
          Your message has been successfully received and logged to our internal queue. We appreciate your insights to help improve Chatora AI.
        </p>
      </div>

      {/* Reference Card */}
      <div className="p-4 rounded-2xl border text-center space-y-1" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
        <p className="text-xs opacity-60 uppercase tracking-wider">Submission Reference ID</p>
        <p className="font-mono font-bold text-sm" style={{ color: 'var(--primary)' }}>
          {referenceId}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap justify-center gap-3 pt-2">
        <button
          onClick={() => onNavigate('/')}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-xs cursor-pointer shadow-sm"
          style={{ backgroundColor: 'var(--primary)', color: 'var(--on-primary)' }}
        >
          <ArrowLeft size={16} />
          <span>Return to Chat</span>
        </button>

        <button
          onClick={() => onNavigate('/faq')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs border cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
          style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
        >
          <MessageSquare size={16} />
          <span>Explore FAQ</span>
        </button>
      </div>
    </div>
  );
};
