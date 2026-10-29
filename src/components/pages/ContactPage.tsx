import React, { useState } from 'react';
import { Send, MessageSquare, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';

interface ContactPageProps {
  onSuccessSubmitted: (refId: string) => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ onSuccessSubmitted }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState<'bug' | 'feature' | 'general' | 'praise'>('general');
  const [message, setMessage] = useState('');
  const [hpWebsite, setHpWebsite] = useState(''); // Honeypot field for spam protection
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim() || name.trim().length < 2) {
      setErrorMsg('Please enter a valid name (at least 2 characters).');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (!message.trim() || message.trim().length < 10) {
      setErrorMsg('Message must be at least 10 characters long.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await api.submitFeedback({
        name: name.trim(),
        email: email.trim(),
        category,
        message: message.trim(),
        hp_website: hpWebsite,
      });

      if (res.success && res.referenceId) {
        onSuccessSubmitted(res.referenceId);
      } else {
        setErrorMsg('Submission failed. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while submitting feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 text-left">
      {/* Header */}
      <div className="space-y-2">
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border"
          style={{ backgroundColor: 'var(--surface-subtle)', borderColor: 'var(--border)', color: 'var(--primary)' }}
        >
          <MessageSquare size={14} />
          <span>Feedback &amp; Product Support</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
          Get in Touch
        </h1>
        <p className="text-sm opacity-80 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Have a feature request, bug report, or idea for Chatora AI? Fill out the form below and our engineering team will log it directly.
        </p>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div
          className="p-3.5 rounded-xl border flex items-center gap-3 text-xs font-medium animate-in fade-in duration-150"
          style={{
            backgroundColor: 'var(--error-surface)',
            borderColor: 'var(--error)',
            color: 'var(--error)',
          }}
          role="alert"
        >
          <AlertCircle size={18} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4 p-6 rounded-2xl border" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
        {/* Honeypot Field for Spam Bots (Hidden from human users) */}
        <div className="hidden" aria-hidden="true">
          <label htmlFor="hp_website">Website</label>
          <input
            type="text"
            id="hp_website"
            name="hp_website"
            value={hpWebsite}
            onChange={e => setHpWebsite(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text)' }}>
              Your Name <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Alex Morgan"
              className="w-full px-3.5 py-2 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-2"
              style={{
                backgroundColor: 'var(--bg)',
                borderColor: 'var(--border-strong)',
                color: 'var(--text)',
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text)' }}>
              Email Address <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="e.g. alex@example.com"
              className="w-full px-3.5 py-2 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-2"
              style={{
                backgroundColor: 'var(--bg)',
                borderColor: 'var(--border-strong)',
                color: 'var(--text)',
              }}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text)' }}>
            Category <span style={{ color: 'var(--error)' }}>*</span>
          </label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value as any)}
            className="w-full px-3.5 py-2 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-2 cursor-pointer"
            style={{
              backgroundColor: 'var(--bg)',
              borderColor: 'var(--border-strong)',
              color: 'var(--text)',
            }}
          >
            <option value="general">General Feedback</option>
            <option value="feature">Feature Request</option>
            <option value="bug">Bug Report</option>
            <option value="praise">Praise / Testimonial</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text)' }}>
            Your Message <span style={{ color: 'var(--error)' }}>*</span>
          </label>
          <textarea
            required
            rows={5}
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Describe your feedback, request, or issue in detail..."
            className="w-full px-3.5 py-2 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-2 resize-y"
            style={{
              backgroundColor: 'var(--bg)',
              borderColor: 'var(--border-strong)',
              color: 'var(--text)',
            }}
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-transform active:scale-95 disabled:opacity-50"
            style={{ backgroundColor: 'var(--primary)', color: 'var(--on-primary)' }}
          >
            <Send size={15} />
            <span>{isSubmitting ? 'Submitting...' : 'Submit Feedback'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
