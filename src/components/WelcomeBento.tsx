import React, { useState } from 'react';
import {
  BookOpen,
  Code2,
  PenTool,
  SearchCode,
  CheckSquare,
  ArrowRight,
  Send,
  Wallet,
  PiggyBank,
  TrendingUp,
  Clock,
  Sparkles,
  MessageSquare,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CommunitySection } from './CommunitySection';
import { FooterLinks } from './FooterLinks';
import { SpotlightCard } from './ui/SpotlightCard';
import { AiBreathingOrb } from './ui/AiBreathingOrb';
import { ConversationSummary } from '../services/api';

interface PromptItem {
  id: string;
  category: 'finance' | 'study' | 'coding' | 'writing' | 'research' | 'productivity';
  title: string;
  subtitle?: string;
  description: string;
  prompt: string;
  isHero?: boolean;
}

const ALL_PROMPTS: PromptItem[] = [
  {
    id: 'p-budget',
    category: 'finance',
    title: 'Smart Budget Plan',
    subtitle: 'Create My Budget',
    description: 'Design a personalized 50/30/20 monthly budget tailored to your income and savings goals.',
    prompt: 'Help me create a smart monthly budget plan based on an income of [$4,500/mo], optimizing expenses and savings.',
    isHero: true,
  },
  {
    id: 'p-saving',
    category: 'finance',
    title: 'Set a Saving Goal',
    subtitle: 'Set a Goal',
    description: 'Calculate monthly milestones and emergency fund targets with compounding growth.',
    prompt: 'Calculate a realistic 12-month savings roadmap to build a [$10,000 emergency fund], with actionable monthly milestones.',
  },
  {
    id: 'p-expenses',
    category: 'finance',
    title: 'Track My Expenses',
    subtitle: 'Monitor Spending',
    description: 'Audit recurring subscriptions and identify immediate areas to reduce burn rate.',
    prompt: 'Help me review and optimize common household subscriptions and recurring expenses to cut monthly costs.',
  },
  {
    id: 'p-study',
    category: 'study',
    title: 'Study & Learn',
    subtitle: 'Master Concepts',
    description: 'Explain difficult topics simply with intuitive everyday analogies and key takeaways.',
    prompt: 'Explain [topic] in simple language with an intuitive everyday analogy and 3 key takeaways.',
  },
  {
    id: 'p-coding',
    category: 'coding',
    title: 'Coding & Architecture',
    subtitle: 'Write Clean Code',
    description: 'Debug functions, optimize algorithms, and architect scalable TypeScript solutions.',
    prompt: 'Write a clean, modular implementation of [feature or function] with comments and edge case handling.',
  },
  {
    id: 'p-research',
    category: 'research',
    title: 'Deep Research',
    subtitle: 'Evaluate Tradeoffs',
    description: 'Analyze tradeoffs, synthesize reports, and evaluate technical decisions.',
    prompt: 'Analyze the pros, cons, and performance tradeoffs between [Option A] and [Option B].',
  },
  {
    id: 'p-writing',
    category: 'writing',
    title: 'Writing & Editing',
    subtitle: 'Draft Clear Copy',
    description: 'Draft compelling emails, proposals, memos, and executive summaries.',
    prompt: 'Help me draft a clear, professional, and friendly email regarding [subject].',
  },
];

interface WelcomeBentoProps {
  onSelectPrompt: (promptText: string) => void;
  onSendPrompt?: (promptText: string) => void;
  onNavigate?: (path: string) => void;
  onOpenCookieSettings?: () => void;
  recentConversations?: ConversationSummary[];
  onSelectConversation?: (id: string) => void;
  onViewAllConversations?: () => void;
}

function formatRelativeTime(dateStr: string) {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
}

export const WelcomeBento: React.FC<WelcomeBentoProps> = ({
  onSelectPrompt,
  onSendPrompt,
  onNavigate,
  onOpenCookieSettings,
  recentConversations = [],
  onSelectConversation,
  onViewAllConversations,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Greeting based on time of day (morning, afternoon, evening, night)
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good Morning, Buddy';
    if (hour >= 12 && hour < 17) return 'Good Afternoon, Buddy';
    if (hour >= 17 && hour < 22) return 'Good Evening, Buddy';
    return 'Good Night, Buddy';
  };

  const filteredPrompts = ALL_PROMPTS.filter(
    p => activeCategory === 'all' || p.category === activeCategory
  );

  return (
    <section className="py-6 sm:py-8 max-w-[900px] mx-auto w-full" aria-labelledby="welcome-heading">
      {/* Central Hero with Glass Iris Orb and Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
        className="mb-8 text-center sm:text-left"
      >
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 mb-4">
          <div className="flex-1">
            <span
              className="inline-block text-xs font-semibold tracking-wider uppercase mb-1.5"
              style={{ color: 'var(--amber)' }}
            >
              {getGreeting()}
            </span>
            <h1
              id="welcome-heading"
              className="text-3xl sm:text-4xl lg:text-[40px] font-bold leading-[1.15] tracking-tight mb-2.5"
              style={{ color: 'var(--text)' }}
            >
              WHAT&apos;S ON YOUR MIND?
            </h1>
            <p className="text-sm sm:text-base max-w-[54ch] leading-relaxed mx-auto sm:mx-0" style={{ color: 'var(--text-muted)' }}>
              Get personalized financial insights, smarter recommendations, or work through a complex challenge with Chatora AI.
            </p>
          </div>

          {/* Living Glass Orb Feature */}
          <div className="shrink-0 flex flex-col items-center gap-1.5">
            <AiBreathingOrb size={80} />
            <span className="text-[11px] font-mono tracking-tight" style={{ color: 'var(--text-muted)' }}>
              Chatora AI Active
            </span>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-3">
          {[
            { id: 'all', label: 'All suggestions' },
            { id: 'finance', label: 'Finance' },
            { id: 'study', label: 'Study' },
            { id: 'coding', label: 'Coding' },
            { id: 'research', label: 'Research' },
            { id: 'writing', label: 'Writing' },
          ].map(cat => {
            const isActive = activeCategory === cat.id;
            return (
              <motion.button
                key={cat.id}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setActiveCategory(cat.id)}
                className="px-3.5 py-1.5 rounded-full text-xs transition-colors cursor-pointer border"
                style={{
                  backgroundColor: isActive ? 'var(--primary)' : 'var(--surface)',
                  color: isActive ? 'var(--on-primary)' : 'var(--text)',
                  borderColor: isActive ? 'var(--primary)' : 'var(--border)',
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                {cat.label}
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Bento Grid with Spotlight Interaction */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5"
        >
          {filteredPrompts.map(item => {
            const isHero = item.isHero && activeCategory === 'all';

            if (isHero) {
              return (
                <SpotlightCard
                  key={item.id}
                  spotlightColor="rgba(255, 255, 255, 0.12)"
                  className="group text-left p-6 rounded-[22px] flex flex-col justify-between border sm:col-span-2 lg:col-span-2 shadow-sm hover:shadow-md cursor-pointer"
                  style={{
                    backgroundColor: 'var(--hero-bg)',
                    borderColor: 'var(--hero-bg)',
                    color: 'var(--hero-text)',
                  }}
                  onClick={() => onSelectPrompt(item.prompt)}
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-white/10 text-white">
                      <Wallet size={22} />
                    </div>
                    <span className="text-xs font-semibold text-[#D7A64A]">
                      Featured Recommendation
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold mb-1 mt-1">{item.title}</h2>
                    <p className="text-xs font-medium opacity-80 mb-2">{item.subtitle}</p>
                    <p className="text-xs sm:text-sm opacity-90 leading-relaxed max-w-[42ch]">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 flex items-center justify-between gap-2 border-t border-white/15">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectPrompt(item.prompt);
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold hover:opacity-90 cursor-pointer"
                    >
                      <span>Customize plan</span>
                      <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                    </button>

                    {onSendPrompt && (
                      <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSendPrompt(item.prompt);
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer inline-flex items-center gap-1.5"
                        title="Send sample budget prompt immediately"
                      >
                        <Send size={12} />
                        <span>Create My Budget</span>
                      </motion.button>
                    )}
                  </div>
                </SpotlightCard>
              );
            }

            // Compact Supporting Cards
            return (
              <SpotlightCard
                key={item.id}
                spotlightColor="rgba(215, 166, 74, 0.08)"
                className="group text-left p-5 rounded-[20px] flex flex-col justify-between border shadow-sm hover:shadow-md cursor-pointer hover-surface-subtle"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)',
                }}
                onClick={() => onSelectPrompt(item.prompt)}
              >
                <div>
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                    style={{ backgroundColor: 'var(--surface-subtle)', color: 'var(--primary)' }}
                  >
                    {item.category === 'finance' && item.id === 'p-saving' && <PiggyBank size={18} />}
                    {item.category === 'finance' && item.id === 'p-expenses' && <TrendingUp size={18} />}
                    {item.category === 'coding' && <Code2 size={18} />}
                    {item.category === 'writing' && <PenTool size={18} />}
                    {item.category === 'research' && <SearchCode size={18} />}
                    {item.category === 'productivity' && <CheckSquare size={18} />}
                    {item.category === 'study' && <BookOpen size={18} />}
                  </div>
                  <h2 className="text-base font-semibold mb-0.5">{item.title}</h2>
                  {item.subtitle && (
                    <span className="text-[11px] font-medium block mb-1.5" style={{ color: 'var(--amber)' }}>
                      {item.subtitle}
                    </span>
                  )}
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    {item.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 flex items-center justify-between border-t" style={{ borderColor: 'var(--border)' }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectPrompt(item.prompt);
                    }}
                    className="text-xs font-semibold inline-flex items-center gap-1 cursor-pointer hover:opacity-85"
                    style={{ color: 'var(--primary)' }}
                  >
                    <span>Use prompt</span>
                    <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                  </button>
                </div>
              </SpotlightCard>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* Recent Conversations Timeline / Tree Line */}
      {recentConversations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-8 p-5 rounded-2xl border"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <Clock size={16} style={{ color: 'var(--primary)' }} />
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                Recent Conversations
              </h3>
            </div>
            {onViewAllConversations && (
              <button
                type="button"
                onClick={onViewAllConversations}
                className="text-xs font-semibold inline-flex items-center gap-1 cursor-pointer hover:underline"
                style={{ color: 'var(--primary)' }}
              >
                <span>See More</span>
                <ArrowRight size={12} />
              </button>
            )}
          </div>

          <div className="space-y-2 relative pl-2">
            {/* Tree Line Connector */}
            <div
              className="absolute left-[13px] top-2 bottom-2 w-px"
              style={{ backgroundColor: 'var(--border)' }}
            />

            {recentConversations.slice(0, 4).map((convo, idx) => (
              <button
                key={convo.id}
                type="button"
                onClick={() => onSelectConversation?.(convo.id)}
                className="w-full relative flex items-center justify-between gap-3 p-2 rounded-xl text-left transition-colors hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer group"
                style={{ opacity: 1 - idx * 0.15 }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-2.5 h-2.5 rounded-full z-10 shrink-0 border"
                    style={{
                      backgroundColor: idx === 0 ? 'var(--primary)' : 'var(--surface)',
                      borderColor: 'var(--primary)',
                    }}
                  />
                  <span className="text-xs font-medium truncate group-hover:underline" style={{ color: 'var(--text)' }}>
                    {convo.title}
                  </span>
                </div>
                <span className="text-[11px] shrink-0 font-mono" style={{ color: 'var(--text-muted)' }}>
                  {formatRelativeTime(convo.updatedAt || convo.createdAt)}
                </span>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Community Feedback & Footer Links */}
      {onNavigate && <CommunitySection onNavigateContact={() => onNavigate('/contact')} />}
      {onNavigate && <FooterLinks onNavigate={onNavigate} onOpenCookieSettings={onOpenCookieSettings} />}
    </section>
  );
};
