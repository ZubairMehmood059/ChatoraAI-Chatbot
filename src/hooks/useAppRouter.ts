import { useState, useEffect, useCallback } from 'react';

export type AppRoute =
  | 'home'
  | 'faq'
  | 'privacy'
  | 'terms'
  | 'cookies'
  | 'contact'
  | 'thank-you'
  | 'not-found';

interface RouteMeta {
  route: AppRoute;
  title: string;
  description: string;
}

const ROUTE_CONFIG: Record<string, RouteMeta> = {
  '/': {
    route: 'home',
    title: 'Chatora AI — Thoughtful Streaming AI Assistant',
    description: 'A premium, minimalist AI chatbot web application with Bento Grid layout, intelligent conversation management, and real-time streaming.',
  },
  '/faq': {
    route: 'faq',
    title: 'Frequently Asked Questions — Chatora AI',
    description: 'Find answers about Chatora AI capabilities, starter prompts, response language, conversation pinning, storage, and privacy.',
  },
  '/privacy': {
    route: 'privacy',
    title: 'Privacy Policy — Chatora AI',
    description: 'Learn how Chatora AI handles user prompts, conversations, uploaded files, and your data privacy with Google Gemini.',
  },
  '/terms': {
    route: 'terms',
    title: 'Terms & Conditions — Chatora AI',
    description: 'Read the terms of service, acceptable use guidelines, and policies for using the Chatora AI conversation platform.',
  },
  '/cookies': {
    route: 'cookies',
    title: 'Cookies Policy — Chatora AI',
    description: 'Understand how essential session cookies, theme preferences, and optional analytics operate on Chatora AI.',
  },
  '/contact': {
    route: 'contact',
    title: 'Feedback & Support — Chatora AI',
    description: 'Send bug reports, feedback, and feature requests directly to the Chatora AI product and engineering team.',
  },
  '/thank-you': {
    route: 'thank-you',
    title: 'Thank You for Your Feedback — Chatora AI',
    description: 'Your feedback has been received and logged with the Chatora AI team.',
  },
};

export function useAppRouter() {
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname || '/');

  const updateMetadata = useCallback((path: string) => {
    const config = ROUTE_CONFIG[path];
    if (config) {
      document.title = config.title;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', config.description);
      }
    } else {
      document.title = 'Page Not Found — Chatora AI';
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', 'The page you requested could not be found on Chatora AI.');
      }
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname || '/';
      setCurrentPath(path);
      updateMetadata(path);
    };

    window.addEventListener('popstate', handlePopState);
    updateMetadata(window.location.pathname || '/');

    return () => window.removeEventListener('popstate', handlePopState);
  }, [updateMetadata]);

  const navigate = useCallback(
    (to: string, options?: { replace?: boolean }) => {
      const target = to.startsWith('/') ? to : `/${to}`;
      if (options?.replace) {
        window.history.replaceState({}, '', target);
      } else {
        window.history.pushState({}, '', target);
      }
      setCurrentPath(target);
      updateMetadata(target);
      window.scrollTo(0, 0);
    },
    [updateMetadata]
  );

  const matched = ROUTE_CONFIG[currentPath];
  const activeRoute: AppRoute = matched ? matched.route : 'not-found';

  return {
    currentPath,
    activeRoute,
    navigate,
  };
}
