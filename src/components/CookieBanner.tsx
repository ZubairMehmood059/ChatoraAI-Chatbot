import React, { useState, useEffect } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CookieConsentState {
  essential: boolean;
  analytics: boolean;
  timestamp: string;
}

export const CookieBanner: React.FC<{
  isOpenModalForce?: boolean;
  onCloseModalForce?: () => void;
}> = ({ isOpenModalForce, onCloseModalForce }) => {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [analyticsAllowed, setAnalyticsAllowed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('chatora-cookie-consent');
    if (saved) {
      try {
        const parsed: CookieConsentState = JSON.parse(saved);
        setAnalyticsAllowed(Boolean(parsed.analytics));
      } catch {
        setShowBanner(true);
      }
    } else {
      setShowBanner(true);
    }
  }, []);

  const saveConsent = (analytics: boolean) => {
    const consent: CookieConsentState = {
      essential: true,
      analytics,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('chatora-cookie-consent', JSON.stringify(consent));
    setAnalyticsAllowed(analytics);
    setShowBanner(false);
    setShowPreferences(false);
    if (onCloseModalForce) onCloseModalForce();

    // Trigger Google Analytics initialization if analytics allowed and GA ID present
    const gaId = (import.meta as any).env?.VITE_GA_MEASUREMENT_ID;
    if (analytics && gaId && typeof window !== 'undefined') {
      if (!document.getElementById('ga-script')) {
        const script = document.createElement('script');
        script.id = 'ga-script';
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
        document.head.appendChild(script);

        (window as any).dataLayer = (window as any).dataLayer || [];
        function gtag(...args: any[]) {
          (window as any).dataLayer.push(args);
        }
        gtag('js', new Date());
        gtag('config', gaId, { anonymize_ip: true });
      }
    }
  };

  const isModalVisible = isOpenModalForce || showPreferences;

  return (
    <>
      {/* Bottom Floating Consent Banner */}
      <AnimatePresence>
        {showBanner && !isModalVisible && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md p-4 rounded-2xl border shadow-xl z-50"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border-strong)',
              color: 'var(--text)',
            }}
            role="region"
            aria-label="Cookie Privacy Consent"
          >
            <div className="flex items-start gap-3">
              <div
                className="p-2 rounded-xl shrink-0"
                style={{ backgroundColor: 'var(--surface-subtle)', color: 'var(--primary)' }}
              >
                <ShieldCheck size={20} />
              </div>
              <div className="flex-1 text-xs">
                <h3 className="font-semibold text-sm mb-1">Privacy &amp; Cookie Notice</h3>
                <p className="opacity-80 leading-relaxed mb-3">
                  Chatora AI uses essential cookies for session persistence and theme settings. Non-essential analytics help us improve model performance.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => saveConsent(true)}
                    className="px-3 py-1.5 rounded-xl font-medium text-xs cursor-pointer transition-opacity hover:opacity-90"
                    style={{ backgroundColor: 'var(--primary)', color: 'var(--on-primary)' }}
                  >
                    Accept All
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => saveConsent(false)}
                    className="px-3 py-1.5 rounded-xl font-medium text-xs border cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
                    style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                  >
                    Essential Only
                  </motion.button>
                  <button
                    onClick={() => setShowPreferences(true)}
                    className="px-2 py-1.5 text-xs opacity-75 hover:opacity-100 cursor-pointer underline"
                  >
                    Preferences
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cookie Preferences Modal */}
      <AnimatePresence>
        {isModalVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
            style={{ backgroundColor: 'var(--scrim)' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ type: 'spring', stiffness: 420, damping: 28 }}
              className="w-full max-w-md rounded-2xl border p-5 shadow-2xl space-y-4"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border)',
                color: 'var(--text)',
              }}
            >
              <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} style={{ color: 'var(--primary)' }} />
                  <h3 className="font-semibold text-base">Cookie &amp; Privacy Preferences</h3>
                </div>
                <button
                  onClick={() => {
                    setShowPreferences(false);
                    if (onCloseModalForce) onCloseModalForce();
                  }}
                  className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl border flex items-center justify-between" style={{ backgroundColor: 'var(--surface-subtle)', borderColor: 'var(--border)' }}>
                  <div>
                    <p className="font-semibold text-sm">Essential Cookies</p>
                    <p className="opacity-75 text-xs mt-0.5">Required for theme, active session, and conversation persistence.</p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded border" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--primary)' }}>
                    Always Active
                  </span>
                </div>

                <div className="p-3 rounded-xl border flex items-center justify-between" style={{ backgroundColor: 'var(--surface-subtle)', borderColor: 'var(--border)' }}>
                  <div className="pr-3">
                    <p className="font-semibold text-sm">Performance &amp; Analytics</p>
                    <p className="opacity-75 text-xs mt-0.5">Anonymous metrics to monitor AI streaming reliability (disabled by default).</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={analyticsAllowed}
                    onChange={e => setAnalyticsAllowed(e.target.checked)}
                    className="w-4 h-4 cursor-pointer rounded"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => saveConsent(analyticsAllowed)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                  style={{ backgroundColor: 'var(--primary)', color: 'var(--on-primary)' }}
                >
                  Save Preferences
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
