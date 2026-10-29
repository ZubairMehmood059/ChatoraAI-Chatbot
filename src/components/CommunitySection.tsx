import React from 'react';
import { MessageSquarePlus, Sparkles, ShieldCheck } from 'lucide-react';

interface CommunitySectionProps {
  onNavigateContact: () => void;
}

export const CommunitySection: React.FC<CommunitySectionProps> = ({ onNavigateContact }) => {
  return (
    <section className="mt-8 mb-4 p-5 rounded-2xl border text-left" style={{ backgroundColor: 'var(--surface-subtle)', borderColor: 'var(--border)' }}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border mb-1" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--primary)' }}>
            <Sparkles size={12} />
            <span>Community Feedback &amp; Ideas</span>
          </div>
          <h3 className="text-base font-semibold" style={{ color: 'var(--text)' }}>
            Help shape the future of Chatora AI
          </h3>
          <p className="text-xs max-w-xl opacity-80 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Chatora AI is built around streaming response clarity, privacy-first session control, and responsive design. Share your feature requests or bug reports directly with our engineering team.
          </p>
        </div>

        <button
          onClick={onNavigateContact}
          className="btn-primary shrink-0 cursor-pointer"
        >
          <MessageSquarePlus size={15} />
          <span>Send Feedback &amp; Ideas</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="p-3 rounded-xl border" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2 text-xs font-semibold mb-1" style={{ color: 'var(--primary)' }}>
            <ShieldCheck size={14} />
            <span>Zero Data Selling</span>
          </div>
          <p className="text-xs opacity-80 leading-relaxed">Conversations are stored strictly on your device and private server instance.</p>
        </div>

        <div className="p-3 rounded-xl border" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2 text-xs font-semibold mb-1" style={{ color: 'var(--primary)' }}>
            <Sparkles size={14} />
            <span>Gemini 3.8 Flash</span>
          </div>
          <p className="text-xs opacity-80 leading-relaxed">High-throughput Google AI model with low latency and streaming clarity.</p>
        </div>

        <div className="p-3 rounded-xl border" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2 text-xs font-semibold mb-1" style={{ color: 'var(--primary)' }}>
            <MessageSquarePlus size={14} />
            <span>Open Feedback Loop</span>
          </div>
          <p className="text-xs opacity-80 leading-relaxed">Every submission receives a reference ID and is logged to our review queue.</p>
        </div>
      </div>
    </section>
  );
};
