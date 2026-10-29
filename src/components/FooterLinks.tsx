import React from 'react';

interface FooterLinksProps {
  onNavigate: (path: string) => void;
  onOpenCookieSettings?: () => void;
}

export const FooterLinks: React.FC<FooterLinksProps> = ({
  onNavigate,
  onOpenCookieSettings,
}) => {
  return (
    <footer className="mt-8 pt-6 pb-4 border-t w-full text-center text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-3">
        <button
          onClick={() => onNavigate('/')}
          className="hover:underline cursor-pointer transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          Chat Home
        </button>
        <button
          onClick={() => onNavigate('/faq')}
          className="hover:underline cursor-pointer transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          FAQ
        </button>
        <button
          onClick={() => onNavigate('/privacy')}
          className="hover:underline cursor-pointer transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          Privacy Policy
        </button>
        <button
          onClick={() => onNavigate('/terms')}
          className="hover:underline cursor-pointer transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          Terms &amp; Conditions
        </button>
        <button
          onClick={() => onNavigate('/cookies')}
          className="hover:underline cursor-pointer transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          Cookies Policy
        </button>
        <button
          onClick={() => onNavigate('/contact')}
          className="hover:underline cursor-pointer transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          Feedback &amp; Support
        </button>
        {onOpenCookieSettings && (
          <button
            onClick={onOpenCookieSettings}
            className="hover:underline cursor-pointer transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            Cookie Preferences
          </button>
        )}
      </div>
      <p className="text-xs opacity-75">
        &copy; {new Date().getFullYear()} Chatora AI. Built with privacy-first streaming clarity.
      </p>
    </footer>
  );
};
