import React, { useState } from 'react';
import { Search, ChevronDown, HelpCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FAQItem {
  id: string;
  category: 'General' | 'Features' | 'Privacy & Storage' | 'Troubleshooting';
  question: string;
  answer: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'General',
    question: 'What is Chatora AI?',
    answer: 'Chatora AI is a premium, privacy-focused AI chatbot web application built on Google Gemini 3.8 Flash. It features real-time Server-Sent Events (SSE) streaming, Bento Grid starter prompts, document text extraction, and customizable response styles.',
  },
  {
    id: 'faq-2',
    category: 'Features',
    question: 'How do starter prompts and Bento cards work?',
    answer: 'The Welcome Screen features categorized Bento cards across Study, Coding, Writing, Research, and Productivity. Clicking any card populates the message composer with bracketed placeholder text for you to quickly edit, or click "Ask now" to execute immediately.',
  },
  {
    id: 'faq-3',
    category: 'Features',
    question: 'How do response language settings work?',
    answer: 'In Settings, you can select your preferred response language (e.g., English, Spanish, French, German, Japanese, Chinese, Arabic, Urdu, Hindi). Chatora AI dynamically injects system instructions so the model responds consistently in your selected language.',
  },
  {
    id: 'faq-4',
    category: 'Features',
    question: 'How does conversation pinning work?',
    answer: 'Click the 3-dots context menu next to any conversation in the sidebar and select "Pin chat". Pinned conversations remain prioritized at the top of your sidebar list for quick access and persist across sessions.',
  },
  {
    id: 'faq-5',
    category: 'Privacy & Storage',
    question: 'How are my chat history and account data stored?',
    answer: 'Your conversations are stored on your local device and instance persistence layer (`instance/conversations.json`). We do not train public AI models on your private conversations or sell user data.',
  },
  {
    id: 'faq-6',
    category: 'Privacy & Storage',
    question: 'How can I delete my conversation history?',
    answer: 'You can delete individual conversations from the sidebar context menu or click "Clear all history" in Settings to erase all stored chats with safety confirmation.',
  },
  {
    id: 'faq-7',
    category: 'Features',
    question: 'What document formats can I upload?',
    answer: 'Chatora AI supports plain text, Markdown (.md), JSON, CSV, Python, JavaScript, TypeScript, HTML, CSS, and PDF text documents up to 2MB. Extracted text is safely attached to your prompt context.',
  },
  {
    id: 'faq-8',
    category: 'Troubleshooting',
    question: 'Can AI output contain mistakes?',
    answer: 'Yes. Like all large language models, Gemini 3.8 Flash can occasionally generate inaccurate information or hallucinations. Always verify critical facts, code snippets, or medical/legal guidance independently.',
  },
  {
    id: 'faq-9',
    category: 'Troubleshooting',
    question: 'What should I do if an AI response is unavailable or times out?',
    answer: 'If upstream Google services experience high capacity (HTTP 503), Chatora AI automatically retries via gemini-flash-latest. If a timeout occurs, your message is preserved and a "Retry" button appears on the message block.',
  },
  {
    id: 'faq-10',
    category: 'Privacy & Storage',
    question: 'How do privacy preferences and cookies work?',
    answer: 'Chatora AI uses essential cookies strictly for theme preferences and session security. Non-essential analytics are completely disabled by default until you grant explicit consent in the Cookie Preferences modal.',
  },
];

export const FAQPage: React.FC<{ onNavigateContact: () => void }> = ({ onNavigateContact }) => {
  const [search, setSearch] = useState('');
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({ 'faq-1': true, 'faq-2': true });
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const toggleAccordion = (id: string) => {
    setOpenIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const categories = ['All', 'General', 'Features', 'Privacy & Storage', 'Troubleshooting'];

  const filteredFaqs = FAQ_DATA.filter(faq => {
    const matchesCategory = activeCategory === 'All' || faq.category === activeCategory;
    const matchesSearch =
      faq.question.toLowerCase().includes(search.toLowerCase()) ||
      faq.answer.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_DATA.map(f => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answer,
      },
    })),
  };

  return (
    <div className="space-y-8">
      {/* Inject Schema.org FAQPage structured data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {/* Hero Header */}
      <div className="space-y-3">
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border"
          style={{ backgroundColor: 'var(--surface-subtle)', borderColor: 'var(--border)', color: 'var(--primary)' }}
        >
          <HelpCircle size={14} />
          <span>Help &amp; Documentation</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
          Frequently Asked Questions
        </h1>
        <p className="text-sm opacity-80 max-w-2xl leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Everything you need to know about Chatora AI features, conversation storage, response styling, and privacy policies.
        </p>
      </div>

      {/* Search & Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-50" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search questions or keywords..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border-strong)',
              color: 'var(--text)',
            }}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                activeCategory === cat ? 'ring-1' : 'opacity-75 hover:opacity-100'
              }`}
              style={{
                backgroundColor: activeCategory === cat ? 'var(--primary)' : 'var(--surface)',
                color: activeCategory === cat ? 'var(--on-primary)' : 'var(--text)',
                borderColor: 'var(--border)',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Accordion List */}
      <div className="space-y-3">
        {filteredFaqs.length > 0 ? (
          filteredFaqs.map(faq => {
            const isOpen = Boolean(openIds[faq.id]);
            return (
              <div
                key={faq.id}
                className="rounded-2xl border transition-colors overflow-hidden"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border)',
                }}
              >
                <button
                  onClick={() => toggleAccordion(faq.id)}
                  className="w-full text-left p-4 flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <span className="font-semibold text-sm sm:text-base" style={{ color: 'var(--text)' }}>
                    {faq.question}
                  </span>
                  <ChevronDown
                    size={18}
                    className={`shrink-0 transition-transform duration-200 opacity-60 ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div
                        className="px-4 pb-4 pt-2 text-xs sm:text-sm leading-relaxed border-t"
                        style={{
                          borderColor: 'var(--border)',
                          color: 'var(--text-muted)',
                        }}
                      >
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-xs border rounded-2xl" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
            No questions match "{search}". Try searching for terms like "privacy", "pinning", "Gemini", or "file upload".
          </div>
        )}
      </div>

      {/* Contact CTA */}
      <div className="p-6 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 mt-8" style={{ backgroundColor: 'var(--surface-subtle)', borderColor: 'var(--border)' }}>
        <div>
          <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>Still have questions?</h3>
          <p className="text-xs opacity-80" style={{ color: 'var(--text-muted)' }}>Our support team is ready to answer your questions and take feature requests.</p>
        </div>
        <button
          onClick={onNavigateContact}
          className="px-4 py-2 rounded-xl text-xs font-semibold shrink-0 cursor-pointer"
          style={{ backgroundColor: 'var(--primary)', color: 'var(--on-primary)' }}
        >
          Contact Support
        </button>
      </div>
    </div>
  );
};
