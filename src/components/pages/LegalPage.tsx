import React from 'react';
import { ShieldCheck, FileText, Cookie } from 'lucide-react';

interface LegalPageProps {
  docType: 'privacy' | 'terms' | 'cookies';
  onNavigateContact: () => void;
}

export const LegalPage: React.FC<LegalPageProps> = ({ docType, onNavigateContact }) => {
  const getHeaderInfo = () => {
    switch (docType) {
      case 'privacy':
        return {
          icon: <ShieldCheck size={20} />,
          title: 'Privacy Policy',
          subtitle: 'How Chatora AI protects user prompts, conversations, uploaded files, and personal data.',
          updated: 'October 27, 2026',
        };
      case 'terms':
        return {
          icon: <FileText size={20} />,
          title: 'Terms & Conditions',
          subtitle: 'Acceptable use guidelines, AI model limitations, and terms of service.',
          updated: 'October 27, 2026',
        };
      case 'cookies':
        return {
          icon: <Cookie size={20} />,
          title: 'Cookies Policy',
          subtitle: 'Understanding essential session cookies, theme preferences, and optional analytics.',
          updated: 'October 27, 2026',
        };
    }
  };

  const header = getHeaderInfo();

  return (
    <article className="space-y-8 text-left">
      {/* Page Header */}
      <div className="space-y-3 border-b pb-6" style={{ borderColor: 'var(--border)' }}>
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border"
          style={{ backgroundColor: 'var(--surface-subtle)', borderColor: 'var(--border)', color: 'var(--primary)' }}
        >
          {header.icon}
          <span>Legal &amp; Policy Documentation</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
          {header.title}
        </h1>
        <p className="text-sm opacity-80 max-w-2xl leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          {header.subtitle}
        </p>
        <p className="text-xs opacity-60">Last updated: {header.updated}</p>
      </div>

      {/* Render Document Content */}
      <div className="space-y-6 text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
        {docType === 'privacy' && (
          <>
            <section className="space-y-2">
              <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>1. Overview &amp; Commitment</h2>
              <p className="opacity-80">
                At Chatora AI, privacy is an architectural priority. This Privacy Policy details how we collect, handle, store, and protect information when you interact with the Chatora AI web application, API client, and document analysis tools.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>2. Information We Collect</h2>
              <ul className="list-disc pl-5 space-y-1 opacity-80">
                <li><strong>Account Credentials:</strong> If you register, email addresses and salted PBKDF2-SHA512 password hashes are stored in instance storage. Plaintext passwords are never logged or stored.</li>
                <li><strong>User Prompts &amp; Messages:</strong> Questions, text prompts, and uploaded document contents submitted during chat sessions.</li>
                <li><strong>Session &amp; Preference State:</strong> Theme choices (light/dark), response styles (concise/balanced/detailed), response language, and pinned conversations stored in local storage and server JSON persistence.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>3. AI Model Processing (Google Gemini)</h2>
              <p className="opacity-80">
                Prompts and document contents are transmitted securely over HTTPS to the official Google Gemini API (model: <code>gemini-3.8-flash</code>) solely to generate real-time responses. Gemini API terms dictate that customer data submitted via official developer API keys is not used to train Google's public models.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>4. Document Uploads &amp; Analysis</h2>
              <p className="opacity-80">
                Uploaded text files (.txt, .md, .csv, .json, code files) are processed server-side solely to extract text snippets up to 15,000 characters. Files are never stored publicly or executed.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>5. User Rights &amp; Data Deletion</h2>
              <p className="opacity-80">
                You maintain complete control over your chat data. You may delete individual conversations at any time via the sidebar or click "Clear all history" in Settings to permanently wipe all stored messages.
              </p>
            </section>

            <section className="space-y-2 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
              <h2 className="text-base font-bold">Contact Privacy Officer</h2>
              <p className="opacity-80">
                For privacy requests or compliance questions, please contact us via our{' '}
                <button onClick={onNavigateContact} className="underline font-semibold" style={{ color: 'var(--primary)' }}>
                  Feedback &amp; Support form
                </button>{' '}
                or email <code>[PRIVACY_CONTACT_EMAIL]</code>.
              </p>
            </section>
          </>
        )}

        {docType === 'terms' && (
          <>
            <section className="space-y-2">
              <h2 className="text-lg font-bold">1. Agreement to Terms</h2>
              <p className="opacity-80">
                By accessing or using Chatora AI, you agree to be bound by these Terms &amp; Conditions and our Privacy Policy. If you do not agree, please discontinue using the service.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold">2. Acceptable Use Policy</h2>
              <p className="opacity-80">You agree not to use Chatora AI to:</p>
              <ul className="list-disc pl-5 space-y-1 opacity-80">
                <li>Generate illegal, abusive, harmful, or fraudulent content.</li>
                <li>Attempt automated spamming, reverse engineering, or denial-of-service attacks.</li>
                <li>Attempt path-traversal attacks or upload malicious executable scripts.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold">3. AI Output Disclaimer</h2>
              <p className="opacity-80">
                Chatora AI uses large language models to generate responses. AI output can contain inaccuracies or errors. Responses do not constitute professional legal, medical, financial, or engineering advice. Always verify critical facts independently.
              </p>
            </section>

            <section className="space-y-2 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
              <h2 className="text-base font-bold">Questions Regarding Terms?</h2>
              <p className="opacity-80">
                Contact our support team through the{' '}
                <button onClick={onNavigateContact} className="underline font-semibold" style={{ color: 'var(--primary)' }}>
                  Contact Page
                </button>.
              </p>
            </section>
          </>
        )}

        {docType === 'cookies' && (
          <>
            <section className="space-y-2">
              <h2 className="text-lg font-bold">1. How We Use Cookies</h2>
              <p className="opacity-80">
                Chatora AI uses small text files stored on your browser to maintain application state, preserve user settings, and ensure session security.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold">2. Types of Cookies We Use</h2>
              <div className="space-y-2">
                <div className="p-3 rounded-xl border" style={{ backgroundColor: 'var(--surface-subtle)', borderColor: 'var(--border)' }}>
                  <p className="font-semibold text-xs">Essential Session Cookies (Strictly Necessary)</p>
                  <p className="opacity-75 text-[11px] mt-0.5">Used for theme settings (`chatora-theme`), active sidebar state, and authentication tokens.</p>
                </div>

                <div className="p-3 rounded-xl border" style={{ backgroundColor: 'var(--surface-subtle)', borderColor: 'var(--border)' }}>
                  <p className="font-semibold text-xs">Optional Analytics Cookies</p>
                  <p className="opacity-75 text-[11px] mt-0.5">Anonymous metrics used to monitor model response latency. Completely disabled until you opt in via the Cookie Consent banner.</p>
                </div>
              </div>
            </section>

            <section className="space-y-2 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
              <h2 className="text-base font-bold">Managing Preferences</h2>
              <p className="opacity-80">
                You can update or revoke your cookie preferences at any time using the Cookie Preferences link in the website footer.
              </p>
            </section>
          </>
        )}
      </div>
    </article>
  );
};
