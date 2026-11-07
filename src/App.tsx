import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { WelcomeBento } from './components/WelcomeBento';
import { ConversationView } from './components/ConversationView';
import { Composer, AttachedFile } from './components/Composer';
import { DeleteDialog } from './components/modals/DeleteDialog';
import { RenameDialog } from './components/modals/RenameDialog';
import { SettingsModal } from './components/modals/SettingsModal';
import { HelpModal } from './components/modals/HelpModal';
import { UploadModal } from './components/modals/UploadModal';
import { Toast } from './components/Toast';
import { api, ConversationSummary, Message } from './services/api';
import { useAppRouter } from './hooks/useAppRouter';
import { CookieBanner } from './components/CookieBanner';
import { PublicLayout } from './components/pages/PublicLayout';
import { FAQPage } from './components/pages/FAQPage';
import { LegalPage } from './components/pages/LegalPage';
import { ContactPage } from './components/pages/ContactPage';
import { ThankYouPage } from './components/pages/ThankYouPage';
import { NotFoundPage } from './components/pages/NotFoundPage';
import { AuthModal, AuthModalView } from './components/modals/AuthModal';
import { useAuth } from './context/AuthContext';
import { MotionConfig } from 'motion/react';

export default function App() {
  // Client-side router hook
  const { currentPath, activeRoute, navigate } = useAppRouter();
  const [submittedRefId, setSubmittedRefId] = useState<string | null>(null);
  const [isCookieModalOpen, setIsCookieModalOpen] = useState(false);
  const [activeMode, setActiveMode] = useState<'chat' | 'overview'>('chat');

  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('chatora-theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('chatora-theme', theme);
  }, [theme]);

  // Sidebar state
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => {
    const saved = localStorage.getItem('chatora-sidebar');
    return saved !== null ? saved === 'true' : true;
  });

  const toggleSidebar = () => {
    setIsSidebarExpanded(prev => {
      const next = !prev;
      localStorage.setItem('chatora-sidebar', String(next));
      return next;
    });
  };

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Settings & Preferences
  const [responseStyle, setResponseStyle] = useState<'concise' | 'balanced' | 'detailed'>(() => {
    return (localStorage.getItem('chatora-response-style') as any) || 'balanced';
  });

  useEffect(() => {
    localStorage.setItem('chatora-response-style', responseStyle);
  }, [responseStyle]);

  const [responseLanguage, setResponseLanguage] = useState<string>(() => {
    return localStorage.getItem('chatora-response-language') || 'auto';
  });

  useEffect(() => {
    localStorage.setItem('chatora-response-language', responseLanguage);
  }, [responseLanguage]);

  // Health and Model status
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [modelName, setModelName] = useState<string>('gemini-3.5-flash-lite');

  useEffect(() => {
    let isMounted = true;
    const checkHealth = async () => {
      try {
        const data = await api.getHealth();
        if (isMounted) {
          if (data.status === 'ok' && data.configured) {
            setBackendStatus('online');
            if (data.model) setModelName(data.model);
          } else {
            setBackendStatus('offline');
          }
        }
      } catch {
        if (isMounted) {
          setBackendStatus('offline');
        }
      }
    };

    checkHealth();
    // Periodic health poll every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Conversations state
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  // Composer and streaming state
  const [input, setInput] = useState('');
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [isWaiting, setIsWaiting] = useState(false);
  const [isTakingLonger, setIsTakingLonger] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const waitingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Modals & Popups
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'info' | 'error'>('info');
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    id?: string;
    title: string;
    isAll?: boolean;
  }>({ isOpen: false, title: '' });
  const [renameModal, setRenameModal] = useState<{
    isOpen: boolean;
    id: string;
    title: string;
  }>({ isOpen: false, id: '', title: '' });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Authentication State & Modal
  const { user, isRecoveryMode } = useAuth();
  const [authModal, setAuthModal] = useState<{
    isOpen: boolean;
    view: AuthModalView;
  }>({ isOpen: false, view: 'signin' });

  // Scroll management
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);

  const showToast = useCallback((msg: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }, []);

  // Fetch conversations list via api service
  const loadConversations = useCallback(async () => {
    try {
      const data = await api.getConversations();
      setConversations(data);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load selected conversation
  const selectConversation = useCallback(async (id: string) => {
    try {
      const data = await api.getConversation(id);
      setActiveConversationId(data.id);
      setMessages(data.messages || []);
      setShowJumpToBottom(false);
    } catch (err) {
      console.error('Failed to load conversation details:', err);
    }
  }, []);

  // Start new chat
  const handleNewChat = useCallback(() => {
    setActiveConversationId(null);
    setMessages([]);
    setInput('');
    setAttachedFile(null);
    setShowJumpToBottom(false);
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, []);

  // Automatically switch conversations when authenticated user changes
  useEffect(() => {
    loadConversations();
    handleNewChat();
  }, [user, loadConversations, handleNewChat]);

  // Handle password recovery mode from URL hash
  useEffect(() => {
    if (isRecoveryMode) {
      setAuthModal({ isOpen: true, view: 'recovery' });
    }
  }, [isRecoveryMode]);

  // Scroll to bottom logic
  const scrollToBottom = useCallback((smooth = true) => {
    if (!scrollContainerRef.current) return;
    scrollContainerRef.current.scrollTo({
      top: scrollContainerRef.current.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto',
    });
    setShowJumpToBottom(false);
  }, []);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowJumpToBottom(distanceFromBottom > 80 && messages.length > 0);
  };

  useEffect(() => {
    if (!showJumpToBottom && (isStreaming || isWaiting)) {
      scrollToBottom(false);
    }
  }, [streamingText, isWaiting, isStreaming, showJumpToBottom, scrollToBottom]);

  // Prompt selection from Bento Grid
  const handleSelectBentoPrompt = (promptText: string) => {
    setInput(promptText);
    setTimeout(() => {
      const ta = textareaRef.current;
      if (ta) {
        ta.focus();
        const start = promptText.indexOf('[');
        const end = promptText.indexOf(']');
        if (start !== -1 && end !== -1 && end > start) {
          ta.setSelectionRange(start, end + 1);
        }
      }
    }, 50);
  };

  // Send Message with Reusable API Service Layer
  const handleSendMessage = async (directPrompt?: string) => {
    const rawInput = directPrompt !== undefined ? directPrompt : input;
    const trimmed = rawInput.trim();
    if (!trimmed && !attachedFile) return;

    let fullPrompt = trimmed;
    if (attachedFile) {
      fullPrompt = `[Attached Document: ${attachedFile.name}]\n\`\`\`\n${attachedFile.content}\n\`\`\`\n\n${trimmed || 'Please review and summarize or answer based on this document.'}`;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setInput('');
    setAttachedFile(null);
    setIsWaiting(true);
    setIsTakingLonger(false);
    setStreamingText('');

    waitingTimerRef.current = setTimeout(() => {
      setIsTakingLonger(true);
    }, 15000);

    let currentConvoId = activeConversationId;
    if (!currentConvoId) {
      currentConvoId = 'conv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      setActiveConversationId(currentConvoId);
    }

    // Immediately display conversation in sidebar so it appears without waiting for streaming to end
    const initialPreviewTitle = trimmed.slice(0, 36).replace(/\n+/g, ' ').trim() || 'New Conversation';
    setConversations(prev => {
      const existing = prev.find(c => c.id === currentConvoId);
      if (existing) {
        return prev.map(c =>
          c.id === currentConvoId
            ? { ...c, updatedAt: new Date().toISOString(), snippet: trimmed.slice(0, 80) }
            : c
        );
      }
      return [
        {
          id: currentConvoId!,
          title: initialPreviewTitle,
          pinned: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messageCount: 1,
          snippet: trimmed.slice(0, 80),
        },
        ...prev,
      ];
    });

    const userMsg: Message = {
      id: 'msg_u_' + Date.now(),
      role: 'user',
      content: fullPrompt,
      timestamp: new Date().toISOString(),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setTimeout(() => scrollToBottom(true), 50);

    try {
      await api.streamChat(
        {
          conversationId: currentConvoId,
          message: fullPrompt,
          history: nextMessages.slice(-8),
          responseStyle,
          responseLanguage,
        },
        {
          onStart: () => {
            // Stream initiated
          },
          onChunk: (chunkText) => {
            setIsWaiting(false);
            setIsStreaming(true);
            if (waitingTimerRef.current) clearTimeout(waitingTimerRef.current);
            setStreamingText(prev => prev + chunkText);
          },
          onDone: (fullText) => {
            const assistantMsg: Message = {
              id: 'msg_a_' + Date.now(),
              role: 'assistant',
              content: fullText,
              timestamp: new Date().toISOString(),
              status: 'complete',
            };
            setMessages([...nextMessages, assistantMsg]);
            setIsStreaming(false);
            setStreamingText('');
            loadConversations();
            setTimeout(() => scrollToBottom(true), 50);
          },
          onError: (err, reqId) => {
            const errMsg: Message = {
              id: 'msg_err_' + Date.now(),
              role: 'assistant',
              content: '',
              timestamp: new Date().toISOString(),
              status: 'error',
              error: err.message,
              requestId: reqId || 'req_' + Math.random().toString(36).substring(2, 9),
            };
            setMessages([...nextMessages, errMsg]);
            setIsWaiting(false);
            setIsStreaming(false);
          },
        },
        controller.signal
      );
    } catch (err: unknown) {
      if (waitingTimerRef.current) clearTimeout(waitingTimerRef.current);
      setIsWaiting(false);
      setIsStreaming(false);

      const isAbort =
        controller.signal.aborted ||
        (err instanceof Error &&
          (err.name === 'AbortError' || err.message?.toLowerCase().includes('aborted'))) ||
        (typeof DOMException !== 'undefined' &&
          err instanceof DOMException &&
          err.name === 'AbortError');

      if (isAbort) {
        if (streamingText) {
          const stoppedMsg: Message = {
            id: 'msg_a_' + Date.now(),
            role: 'assistant',
            content: streamingText,
            timestamp: new Date().toISOString(),
            status: 'stopped',
          };
          setMessages([...nextMessages, stoppedMsg]);
          setStreamingText('');
          showToast('Generation stopped by user.', 'info');
        } else {
          const stoppedMsg: Message = {
            id: 'msg_a_' + Date.now(),
            role: 'assistant',
            content: '',
            timestamp: new Date().toISOString(),
            status: 'stopped',
          };
          setMessages([...nextMessages, stoppedMsg]);
          showToast('Generation stopped by user.', 'info');
        }
        return;
      }
    }
  };

  // Stop Generating
  const handleStopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (waitingTimerRef.current) {
      clearTimeout(waitingTimerRef.current);
    }
    setIsWaiting(false);
    setIsStreaming(false);
  };

  // Regenerate Response
  const handleRegenerate = () => {
    const lastUserIndex = [...messages].reverse().findIndex(m => m.role === 'user');
    if (lastUserIndex === -1) return;
    const realIndex = messages.length - 1 - lastUserIndex;
    const userMessage = messages[realIndex];

    const trimmedMessages = messages.slice(0, realIndex);
    setMessages(trimmedMessages);
    setInput(userMessage.content);
    setTimeout(() => {
      handleSendMessage();
    }, 50);
  };

  // Retry from Error card
  const handleRetryError = (errorMsg: Message) => {
    const filtered = messages.filter(m => m.id !== errorMsg.id);
    const lastUser = filtered.filter(m => m.role === 'user').pop();
    if (!lastUser) return;

    setMessages(filtered.slice(0, -1));
    setInput(lastUser.content);
    setTimeout(() => {
      handleSendMessage();
    }, 50);
  };

  // Conversation Management Handlers via API Service
  const handleConfirmRename = async (newTitle: string) => {
    try {
      await api.renameConversation(renameModal.id, newTitle);
      setRenameModal({ isOpen: false, id: '', title: '' });
      loadConversations();
      showToast('Conversation renamed.', 'success');
    } catch {
      showToast('Failed to rename conversation.', 'error');
    }
  };

  const handleTogglePin = async (id: string, pinned: boolean) => {
    try {
      await api.togglePinConversation(id, pinned);
      loadConversations();
      showToast(pinned ? 'Chat pinned to top.' : 'Chat unpinned.', 'success');
    } catch {
      showToast('Failed to update pin status.', 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteModal.isAll) {
      try {
        setConversations([]);
        setDeleteModal({ isOpen: false, title: '' });
        handleNewChat();
        await api.clearAllConversations();
        showToast('All conversations cleared.', 'success');
      } catch {
        loadConversations();
        showToast('Failed to clear conversations.', 'error');
      }
    } else if (deleteModal.id) {
      const targetId = deleteModal.id;
      try {
        setConversations(prev => prev.filter(c => c.id !== targetId));
        if (activeConversationId === targetId) {
          handleNewChat();
        }
        setDeleteModal({ isOpen: false, title: '' });
        await api.deleteConversation(targetId);
        showToast('Conversation deleted.', 'success');
      } catch {
        loadConversations();
        showToast('Failed to delete conversation.', 'error');
      }
    }
  };

  // Export handlers
  const handleExport = (format: 'txt' | 'md') => {
    if (messages.length === 0) {
      showToast('No messages to export.', 'info');
      return;
    }

    let textContent = '';
    const convoTitle =
      conversations.find(c => c.id === activeConversationId)?.title || 'Chatora-Chat';

    if (format === 'md') {
      textContent = `# ${convoTitle}\n\nExported on ${new Date().toLocaleString()}\n\n---\n\n`;
      messages.forEach(m => {
        textContent += `### ${m.role === 'user' ? 'You' : 'Chatora AI'} (${new Date(m.timestamp).toLocaleTimeString()}):\n\n${m.content}\n\n---\n\n`;
      });
    } else {
      textContent = `${convoTitle}\nExported on ${new Date().toLocaleString()}\n${'='.repeat(40)}\n\n`;
      messages.forEach(m => {
        textContent += `[${m.role === 'user' ? 'You' : 'Chatora AI'} - ${new Date(m.timestamp).toLocaleTimeString()}]:\n${m.content}\n\n`;
      });
    }

    const blob = new Blob([textContent], { type: format === 'md' ? 'text/markdown' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${convoTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported as .${format}`, 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInputFocused =
        activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA';

      if (e.key === '/' && !isInputFocused) {
        e.preventDefault();
        textareaRef.current?.focus();
      }

      if (e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleNewChat();
      }

      if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
        e.preventDefault();
        toggleSidebar();
      }

      if (e.key === 'Escape') {
        if (authModal.isOpen) setAuthModal(prev => ({ ...prev, isOpen: false }));
        if (isSettingsOpen) setIsSettingsOpen(false);
        if (isHelpOpen) setIsHelpOpen(false);
        if (isUploadOpen) setIsUploadOpen(false);
        if (deleteModal.isOpen) setDeleteModal({ isOpen: false, title: '' });
        if (renameModal.isOpen) setRenameModal({ isOpen: false, id: '', title: '' });
        if (isStreaming || isWaiting) handleStopGenerating();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    authModal.isOpen,
    isSettingsOpen,
    isHelpOpen,
    isUploadOpen,
    deleteModal,
    renameModal,
    isStreaming,
    isWaiting,
    handleNewChat,
  ]);

  if (activeRoute !== 'home') {
    return (
      <MotionConfig reducedMotion="user">
        <PublicLayout
          onNavigate={navigate}
          theme={theme}
          onToggleTheme={() => setTheme(prev => (prev === 'light' ? 'dark' : 'light'))}
          onOpenCookieSettings={() => setIsCookieModalOpen(true)}
        >
          {activeRoute === 'faq' && <FAQPage onNavigateContact={() => navigate('/contact')} />}
          {activeRoute === 'privacy' && <LegalPage docType="privacy" onNavigateContact={() => navigate('/contact')} />}
          {activeRoute === 'terms' && <LegalPage docType="terms" onNavigateContact={() => navigate('/contact')} />}
          {activeRoute === 'cookies' && <LegalPage docType="cookies" onNavigateContact={() => navigate('/contact')} />}
          {activeRoute === 'contact' && (
            <ContactPage
              onSuccessSubmitted={refId => {
                setSubmittedRefId(refId);
                navigate('/thank-you');
              }}
            />
          )}
          {activeRoute === 'thank-you' && (
            <ThankYouPage referenceId={submittedRefId} onNavigate={navigate} />
          )}
          {activeRoute === 'not-found' && (
            <NotFoundPage onNavigate={navigate} onNewChat={handleNewChat} />
          )}
          <CookieBanner isOpenModalForce={isCookieModalOpen} onCloseModalForce={() => setIsCookieModalOpen(false)} />
        </PublicLayout>
      </MotionConfig>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <div
        className="flex h-screen w-screen overflow-hidden text-[var(--text)] transition-colors duration-200"
        style={{ backgroundColor: 'var(--bg)' }}
      >
        {/* Collapsible / Responsive Left Sidebar */}
        <Sidebar
          conversations={conversations}
          activeId={activeConversationId}
          onSelectConversation={selectConversation}
          onNewChat={handleNewChat}
          isExpanded={isSidebarExpanded}
          onToggleExpanded={toggleSidebar}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenHelp={() => setIsHelpOpen(true)}
          onRenameConversation={(id, title) => setRenameModal({ isOpen: true, id, title })}
          onTogglePin={handleTogglePin}
          onDeleteConversation={(id, title) => setDeleteModal({ isOpen: true, id, title })}
          onExportConversation={(id, format) => {
            selectConversation(id);
            setTimeout(() => handleExport(format), 100);
          }}
          onPrintConversation={id => {
            selectConversation(id);
            setTimeout(() => handlePrint(), 100);
          }}
          onOpenAuthModal={() => setAuthModal({ isOpen: true, view: 'signin' })}
        />

        {/* Main Workspace */}
        <div className="flex-1 flex flex-col h-full min-w-0 relative">
          {/* Top Bar */}
          <Topbar
            onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
            theme={theme}
            onToggleTheme={() => setTheme(prev => (prev === 'light' ? 'dark' : 'light'))}
            backendStatus={backendStatus}
            modelName={modelName}
            hasActiveConversation={messages.length > 0}
            onExport={handleExport}
            onPrint={handlePrint}
            onDeleteCurrent={() => {
              const current = conversations.find(c => c.id === activeConversationId);
              setDeleteModal({
                isOpen: true,
                id: activeConversationId || undefined,
                title: current?.title || 'this chat',
              });
            }}
            activeMode={activeMode}
            onSelectMode={setActiveMode}
            onTriggerSearch={() => {
              if (!isSidebarExpanded) setIsSidebarExpanded(true);
            }}
            onOpenAuthModal={(v) => setAuthModal({ isOpen: true, view: v || 'signin' })}
          />

          {/* Scrollable Chat / Welcome Container */}
          <main
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-4 sm:px-6 relative focus:outline-none"
            tabIndex={-1}
          >
            {messages.length === 0 || activeMode === 'overview' ? (
              <WelcomeBento
                onSelectPrompt={p => {
                  handleSelectBentoPrompt(p);
                  setActiveMode('chat');
                }}
                onSendPrompt={(p) => {
                  setActiveMode('chat');
                  handleSendMessage(p);
                }}
                onNavigate={navigate}
                onOpenCookieSettings={() => setIsCookieModalOpen(true)}
                recentConversations={conversations}
                onSelectConversation={id => {
                  selectConversation(id);
                  setActiveMode('chat');
                }}
                onViewAllConversations={() => setIsSidebarExpanded(true)}
              />
            ) : (
              <ConversationView
                messages={messages}
                isStreaming={isStreaming}
                streamingText={streamingText}
                isWaiting={isWaiting}
                isTakingLonger={isTakingLonger}
                onRegenerate={handleRegenerate}
                onRetryError={handleRetryError}
                showJumpToBottom={showJumpToBottom}
                onJumpToBottom={() => scrollToBottom(true)}
              />
            )}
          </main>

          {/* Docked / Sticky Bottom Composer */}
          <footer className="shrink-0 w-full z-10">
            <Composer
              input={input}
              setInput={setInput}
              onSend={() => {
                setActiveMode('chat');
                handleSendMessage();
              }}
              onStop={handleStopGenerating}
              isBusy={isStreaming || isWaiting}
              attachedFile={attachedFile}
              onAttachClick={() => setIsUploadOpen(true)}
              onRemoveAttachment={() => setAttachedFile(null)}
              onOpenPrivacy={() => setIsHelpOpen(true)}
              textareaRef={textareaRef}
              responseStyle={responseStyle}
              onSetResponseStyle={setResponseStyle}
            />
          </footer>
        </div>

        {/* Modals & Dialogs */}
        <DeleteDialog
          isOpen={deleteModal.isOpen}
          title={deleteModal.title}
          isAll={deleteModal.isAll}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteModal({ isOpen: false, title: '' })}
        />

        <RenameDialog
          isOpen={renameModal.isOpen}
          currentTitle={renameModal.title}
          onSave={handleConfirmRename}
          onCancel={() => setRenameModal({ isOpen: false, id: '', title: '' })}
        />

        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          theme={theme}
          setTheme={setTheme}
          responseStyle={responseStyle}
          setResponseStyle={setResponseStyle}
          responseLanguage={responseLanguage}
          setResponseLanguage={setResponseLanguage}
          onClearAllHistory={() => {
            setDeleteModal({
              isOpen: true,
              title: 'All Conversations',
              isAll: true,
            });
          }}
        />

        <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

        <UploadModal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          onFileAttached={file => {
            setAttachedFile(file);
            showToast(`Attached ${file.name}`, 'success');
          }}
        />

        {/* Supabase Authentication Modal */}
        <AuthModal
          isOpen={authModal.isOpen}
          initialView={authModal.view}
          onClose={() => setAuthModal(prev => ({ ...prev, isOpen: false }))}
          onSuccess={() => {
            loadConversations();
            showToast('Authentication updated', 'success');
          }}
        />

        {/* Cookie Banner & Consent */}
        <CookieBanner isOpenModalForce={isCookieModalOpen} onCloseModalForce={() => setIsCookieModalOpen(false)} />

        {/* Toast Notification */}
        <Toast message={toastMessage} type={toastType} />
      </div>
    </MotionConfig>
  );
}
