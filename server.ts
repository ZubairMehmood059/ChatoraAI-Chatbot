import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '10mb' }));

// Supabase Server-Side Client Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  '';

const supabaseServer =
  SUPABASE_URL && SUPABASE_KEY && SUPABASE_URL.startsWith('http')
    ? createSupabaseClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })
    : null;

export interface AuthenticatedUser {
  id: string;
  email: string;
  role?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser | null;
    }
  }
}

// Bearer Token Authentication Middleware
async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    req.user = null;
    return next();
  }

  // Support demo JWT format for local testing / demo accounts
  if (token.startsWith('demo_jwt_')) {
    const rawDemo = token.slice('demo_jwt_'.length);
    const demoId = rawDemo.replace(/_\d+$/, '') || 'user_demo';
    req.user = {
      id: demoId,
      email: `${demoId}@chatora.ai`,
      role: 'authenticated',
    };
    return next();
  }

  if (supabaseServer) {
    try {
      const { data, error } = await supabaseServer.auth.getUser(token);
      if (error || !data.user) {
        res.status(401).json({ error: 'Invalid or expired authentication token' });
        return;
      }
      req.user = {
        id: data.user.id,
        email: data.user.email || 'user@chatora.ai',
        role: data.user.role,
      };
      return next();
    } catch (err) {
      console.error('Server Supabase token verification failed:', err);
      res.status(401).json({ error: 'Failed to verify authentication token' });
      return;
    }
  }

  // When Supabase server verification is unconfigured, do not synthesize fake authenticated identities.
  // Treat unknown unverified tokens as unauthenticated.
  req.user = null;
  next();
}

// Security & Browser Headers (permitted inside AI Studio preview iframe)
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// Attach auth parsing to all /api routes
app.use('/api', authMiddleware);

// In-Memory Rate Limiting
interface RateLimitRecord {
  count: number;
  resetTime: number;
}
const rateLimitStores: Record<string, Map<string, RateLimitRecord>> = {};

function createRateLimiter(bucketName: string, maxRequests: number, windowMs: number) {
  if (!rateLimitStores[bucketName]) {
    rateLimitStores[bucketName] = new Map();
  }
  const store = rateLimitStores[bucketName];

  return (req: Request, res: Response, next: () => void) => {
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const existing = store.get(clientIp);

    if (!existing || now > existing.resetTime) {
      store.set(clientIp, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (existing.count >= maxRequests) {
      const retryAfter = Math.ceil((existing.resetTime - now) / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      res.status(429).json({
        error: 'Too many requests. Please wait a moment before trying again.',
        retryAfterSeconds: retryAfter,
      });
      return;
    }

    existing.count += 1;
    next();
  };
}

const authLimiter = createRateLimiter('auth', 15, 60 * 1000); // 15 req/min
const chatLimiter = createRateLimiter('chat', 45, 60 * 1000); // 45 req/min
const uploadLimiter = createRateLimiter('upload', 20, 60 * 1000); // 20 req/min
const feedbackLimiter = createRateLimiter('feedback', 8, 10 * 60 * 1000); // 8 req/10min

// Persistence directories
const DATA_DIR = path.resolve(process.cwd(), 'instance');
const DATA_FILE = path.join(DATA_DIR, 'conversations.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const FEEDBACK_FILE = path.join(DATA_DIR, 'feedback.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  status?: 'complete' | 'stopped' | 'error';
  requestId?: string;
  error?: string;
}

interface Conversation {
  id: string;
  title: string;
  pinned?: boolean;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
  userId?: string;
}

interface User {
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
}

// Memory/File-based storage helpers
function loadConversations(): Conversation[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading conversations file:', err);
  }

  // Provide starter conversations if storage was empty
  const defaultConvos: Conversation[] = [
    {
      id: 'conv_init_1',
      title: 'Streaming AI Architecture & SSE',
      pinned: true,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 1800000).toISOString(),
      messages: [
        {
          id: 'msg_u_1',
          role: 'user',
          content: 'Explain how Server-Sent Events (SSE) compare to WebSockets for real-time streaming AI responses.',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 'msg_a_1',
          role: 'assistant',
          content: 'Server-Sent Events (SSE) provide an elegant, unidirectional HTTP streaming protocol that fits LLM generation workflows.\n\n### Key Advantages of SSE:\n1. **Native HTTP/2 Multiplexing:** Works over standard HTTP ports without special reverse proxy protocol upgrades.\n2. **Automatic Reconnection:** Browsers natively manage network drops via the `EventSource` protocol.\n3. **Simpler Mental Model:** Unidirectional streaming matches the server-to-client token delivery model without WebSocket handshake overhead.',
          timestamp: new Date(Date.now() - 3540000).toISOString(),
          status: 'complete',
        },
      ],
    },
    {
      id: 'conv_init_2',
      title: 'Thoughtful AI Assistant Guidelines',
      pinned: false,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86000000).toISOString(),
      messages: [
        {
          id: 'msg_u_2',
          role: 'user',
          content: 'What principles define a thoughtful, human-centric AI assistant?',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: 'msg_a_2',
          role: 'assistant',
          content: 'A thoughtful AI assistant is defined by restraint, clarity, and deep user agency:\n\n- **Substance over Fluff:** Direct, well-reasoned answers without generic pleasantries.\n- **Transparent Latency:** Respecting user patience with steady token pacing and responsive controls.\n- **Private & Local-First:** Keeping conversation history strictly within user-controlled storage.',
          timestamp: new Date(Date.now() - 86340000).toISOString(),
          status: 'complete',
        },
      ],
    },
  ];

  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultConvos, null, 2), 'utf-8');
  } catch {
    // Ignore write failures in fallback
  }

  return defaultConvos;
}

function saveConversations(convos: Conversation[]) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(convos, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving conversations file:', err);
  }
}

function loadUsers(): User[] {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const raw = fs.readFileSync(USERS_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading users file:', err);
  }
  return [];
}

function saveUsers(users: User[]) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving users file:', err);
  }
}

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

// Initialize Gemini client server-side
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
        timeout: 60000,
      },
    })
  : null;

// Health Endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    service: 'Chatora AI',
    model: 'gemini-3.8-flash',
    configured: Boolean(apiKey),
    timestamp: new Date().toISOString(),
  });
});

interface FeedbackSubmission {
  id: string;
  name: string;
  email: string;
  category: 'bug' | 'feature' | 'general' | 'praise';
  message: string;
  createdAt: string;
  ipHash?: string;
}

function loadFeedback(): FeedbackSubmission[] {
  try {
    if (fs.existsSync(FEEDBACK_FILE)) {
      const raw = fs.readFileSync(FEEDBACK_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading feedback file:', err);
  }
  return [];
}

function saveFeedback(submissions: FeedbackSubmission[]) {
  try {
    fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(submissions, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving feedback file:', err);
  }
}

// Authentication Endpoints (Rate Limited)
app.post('/api/auth/register', authLimiter, (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    res.status(400).json({ error: 'Please provide a valid email address' });
    return;
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters long' });
    return;
  }

  const users = loadUsers();
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    res.status(400).json({ error: 'An account with this email already exists' });
    return;
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const newUser: User = {
    id: 'user_' + crypto.randomUUID().slice(0, 8),
    email: email.toLowerCase(),
    salt,
    passwordHash: hashPassword(password, salt),
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);

  res.status(201).json({
    success: true,
    user: { id: newUser.id, email: newUser.email, createdAt: newUser.createdAt },
  });
});

app.post('/api/auth/login', authLimiter, (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email or password is incorrect' });
    return;
  }

  const users = loadUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    res.status(401).json({ error: 'Email or password is incorrect' });
    return;
  }

  const checkHash = hashPassword(password, user.salt);
  if (checkHash !== user.passwordHash) {
    res.status(401).json({ error: 'Email or password is incorrect' });
    return;
  }

  res.json({
    success: true,
    user: { id: user.id, email: user.email, createdAt: user.createdAt },
  });
});

app.post('/api/auth/logout', (_req: Request, res: Response) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// Feedback and Contact Submission Endpoint
app.post('/api/feedback', feedbackLimiter, (req: Request, res: Response) => {
  const { name, email, category, message, hp_website } = req.body;

  // Honeypot spam protection: bots often fill hidden inputs
  if (hp_website && typeof hp_website === 'string' && hp_website.trim().length > 0) {
    // Return standard success to fool spam bots without storing payload
    res.status(200).json({ success: true, referenceId: 'fb_hp_' + Date.now().toString(36) });
    return;
  }

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    res.status(400).json({ error: 'Please provide a valid name (at least 2 characters)' });
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
    res.status(400).json({ error: 'Please provide a valid email address' });
    return;
  }

  const validCategories = ['bug', 'feature', 'general', 'praise'];
  if (!category || !validCategories.includes(category)) {
    res.status(400).json({ error: 'Please select a valid feedback category' });
    return;
  }

  if (!message || typeof message !== 'string' || message.trim().length < 10) {
    res.status(400).json({ error: 'Feedback message must be at least 10 characters long' });
    return;
  }

  if (message.length > 3000) {
    res.status(400).json({ error: 'Feedback message cannot exceed 3,000 characters' });
    return;
  }

  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '';
  const ipHash = clientIp ? crypto.createHash('sha256').update(clientIp).digest('hex').slice(0, 12) : undefined;

  const referenceId = 'fb_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
  const submission: FeedbackSubmission = {
    id: referenceId,
    name: name.trim().slice(0, 100),
    email: email.trim().toLowerCase().slice(0, 150),
    category,
    message: message.trim(),
    createdAt: new Date().toISOString(),
    ipHash,
  };

  const list = loadFeedback();
  list.unshift(submission);
  saveFeedback(list);

  res.status(201).json({
    success: true,
    referenceId,
    message: 'Thank you for your feedback! The team has received your submission.',
  });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  if (req.user) {
    res.json({
      authenticated: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
      },
    });
  } else {
    res.json({ authenticated: false });
  }
});

// Conversations List - Per-User Isolation
app.get('/api/conversations', (req: Request, res: Response) => {
  const convos = loadConversations();
  const currentUserId = req.user ? req.user.id : 'guest';

  // Strictly filter conversations by user ownership
  const userConvos = convos.filter(c => {
    if (req.user) {
      return c.userId === currentUserId;
    }
    // Guest users access only unassigned or guest-tagged conversations
    return !c.userId || c.userId === 'guest';
  });

  const summaries = userConvos.map(c => ({
    id: c.id,
    title: c.title,
    pinned: Boolean(c.pinned),
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    messageCount: c.messages.length,
    snippet: c.messages[c.messages.length - 1]?.content.slice(0, 80) || '',
    userId: c.userId,
  }));
  res.json(summaries);
});

// Create Conversation - Assigned to Current User
app.post('/api/conversations', (req: Request, res: Response) => {
  const { title } = req.body;
  const convos = loadConversations();
  const newConvo: Conversation = {
    id: 'conv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    title: title || 'New Conversation',
    pinned: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [],
    userId: req.user ? req.user.id : 'guest',
  };
  convos.unshift(newConvo);
  saveConversations(convos);
  res.status(201).json(newConvo);
});

// Get Single Conversation - Enforce Authorization
app.get('/api/conversations/:id', (req: Request, res: Response) => {
  const convos = loadConversations();
  const convo = convos.find(c => c.id === req.params.id);
  if (!convo) {
    res.status(404).json({ error: 'Conversation not found' });
    return;
  }

  // Authorization check
  if (convo.userId && convo.userId !== 'guest') {
    if (!req.user || req.user.id !== convo.userId) {
      res.status(403).json({ error: 'Forbidden: You do not have permission to view this conversation' });
      return;
    }
  }

  res.json(convo);
});

// Rename / Pin / Update Conversation - Enforce Authorization
app.patch('/api/conversations/:id', (req: Request, res: Response) => {
  const { title, pinned } = req.body;
  const convos = loadConversations();
  const index = convos.findIndex(c => c.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: 'Conversation not found' });
    return;
  }

  const convo = convos[index];
  if (convo.userId && convo.userId !== 'guest') {
    if (!req.user || req.user.id !== convo.userId) {
      res.status(403).json({ error: 'Forbidden: You do not have permission to modify this conversation' });
      return;
    }
  }

  if (typeof title === 'string' && title.trim()) {
    convos[index].title = title.trim();
  }
  if (typeof pinned === 'boolean') {
    convos[index].pinned = pinned;
  }
  convos[index].updatedAt = new Date().toISOString();
  saveConversations(convos);
  res.json(convos[index]);
});

// Delete Single Conversation - Enforce Authorization
app.delete('/api/conversations/:id', (req: Request, res: Response) => {
  let convos = loadConversations();
  const convo = convos.find(c => c.id === req.params.id);
  if (!convo) {
    res.status(404).json({ error: 'Conversation not found' });
    return;
  }

  if (convo.userId && convo.userId !== 'guest') {
    if (!req.user || req.user.id !== convo.userId) {
      res.status(403).json({ error: 'Forbidden: You do not have permission to delete this conversation' });
      return;
    }
  }

  convos = convos.filter(c => c.id !== req.params.id);
  saveConversations(convos);
  res.json({ success: true, message: 'Conversation deleted' });
});

// Delete All Conversations - Scoped strictly to the requesting user
app.delete('/api/conversations', (req: Request, res: Response) => {
  let convos = loadConversations();
  convos = convos.filter(c => {
    if (req.user) {
      return c.userId !== req.user.id;
    }
    return c.userId && c.userId !== 'guest';
  });
  saveConversations(convos);
  res.json({ success: true, message: 'All conversations cleared' });
});

// Helper for generating concise conversation title
async function autoGenerateTitle(promptText: string): Promise<string> {
  if (!ai) {
    return promptText.slice(0, 32).trim() + (promptText.length > 32 ? '…' : '');
  }
  try {
    const titleResponse = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Create a brief 3-5 word title summarizing this message. Do not use quotes or markdown:\n\n${promptText.slice(0, 300)}`,
    });
    const title = titleResponse.text?.trim().replace(/^["']|["']$/g, '');
    if (title && title.length < 50) {
      return title;
    }
  } catch {
    // fallback on error
  }
  return promptText.slice(0, 32).trim() + (promptText.length > 32 ? '…' : '');
}

// Chat API Endpoint with real-time Server-Sent Events (SSE) Streaming
app.post('/api/chat', chatLimiter, async (req: Request, res: Response) => {
  const requestId = 'req_' + Math.random().toString(36).substring(2, 9);
  const { conversationId, message, history = [], responseStyle = 'balanced', responseLanguage = 'auto' } = req.body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    res.status(400).json({ error: 'Message cannot be empty', requestId });
    return;
  }

  if (message.length > 8000) {
    res.status(400).json({ error: 'Message exceeds 8,000 character limit', requestId });
    return;
  }

  // Enforce conversation ownership before opening SSE stream
  if (conversationId) {
    const convos = loadConversations();
    const existingConvo = convos.find(c => c.id === conversationId);
    if (existingConvo && existingConvo.userId && existingConvo.userId !== 'guest') {
      if (!req.user || req.user.id !== existingConvo.userId) {
        res.status(403).json({
          error: 'Forbidden: You do not have permission to post to this conversation',
          requestId,
        });
        return;
      }
    }
  }

  // Check if API key is configured
  if (!process.env.GEMINI_API_KEY) {
    res.status(503).json({
      error: 'GEMINI_NOT_CONFIGURED',
      message: 'Chatora isn’t set up to answer yet. The site owner needs to add an AI provider key in the Secrets panel.',
      requestId,
    });
    return;
  }

  // Set SSE Headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // Send initial event
  res.write(`data: ${JSON.stringify({ type: 'start', requestId })}\n\n`);

  let isClientConnected = true;
  req.on('close', () => {
    isClientConnected = false;
  });

  try {
    let systemInstruction = 'You are Chatora AI, an intelligent, helpful, professional, and friendly AI assistant. Format your responses with clean Markdown, clear headings, structured lists, and well-commented code blocks where applicable.';
    if (responseStyle === 'concise') {
      systemInstruction += ' Be extremely concise, direct, and avoid filler explanations unless explicitly asked.';
    } else if (responseStyle === 'detailed') {
      systemInstruction += ' Provide deep, comprehensive, nuanced, and detailed analysis with step-by-step breakdowns, edge cases, and rich examples.';
    }
    if (responseLanguage && responseLanguage !== 'auto') {
      systemInstruction += ` You MUST write your entire response in ${responseLanguage}.`;
    }

    // Build context contents from history (capped at last 10 messages)
    const formattedContents = [];
    const recentHistory = Array.isArray(history) ? history.slice(-10) : [];
    
    for (const item of recentHistory) {
      if (item.role === 'user' && item.content) {
        formattedContents.push({
          role: 'user',
          parts: [{ text: item.content }],
        });
      } else if (item.role === 'assistant' && item.content) {
        formattedContents.push({
          role: 'model',
          parts: [{ text: item.content }],
        });
      }
    }

    // Add current user message
    formattedContents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    // Ensure conversation and initial user message exist immediately in storage
    if (conversationId) {
      const convos = loadConversations();
      let convo = convos.find(c => c.id === conversationId);
      if (!convo) {
        convo = {
          id: conversationId,
          title: message.trim().slice(0, 36).replace(/\n+/g, ' ') || 'New Chat',
          pinned: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messages: [],
          userId: req.user ? req.user.id : 'guest',
        };
        convos.unshift(convo);
      }
      const lastMsg = convo.messages[convo.messages.length - 1];
      if (!lastMsg || lastMsg.role !== 'user' || lastMsg.content !== message) {
        convo.messages.push({
          id: 'msg_u_' + Date.now(),
          role: 'user',
          content: message,
          timestamp: new Date().toISOString(),
        });
        convo.updatedAt = new Date().toISOString();
        saveConversations(convos);
      }
    }

    const activeAi = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
        timeout: 60000,
      },
    });

    let responseStream: any;
    try {
      responseStream = await activeAi.models.generateContentStream({
        model: 'gemini-3.8-flash',
        contents: formattedContents,
        config: {
          systemInstruction,
        },
      });
    } catch (primaryErr: any) {
      const errStr = String(primaryErr?.message || primaryErr);
      if (errStr.includes('503') || errStr.includes('high demand') || errStr.includes('UNAVAILABLE')) {
        console.warn('gemini-3.8-flash busy, falling back to gemini-flash-latest...');
        responseStream = await activeAi.models.generateContentStream({
          model: 'gemini-flash-latest',
          contents: formattedContents,
          config: {
            systemInstruction,
          },
        });
      } else {
        throw primaryErr;
      }
    }

    if (!responseStream) {
      throw new Error('Failed to initiate AI stream from upstream model');
    }

    let fullText = '';
    for await (const chunk of responseStream) {
      if (!isClientConnected) {
        break;
      }
      const chunkText = chunk.text || '';
      if (chunkText) {
        fullText += chunkText;
        res.write(`data: ${JSON.stringify({ type: 'chunk', text: chunkText })}\n\n`);
      }
    }

    // Save assistant response to conversation if conversationId is provided
    let updatedTitle: string | undefined;
    if (conversationId) {
      const convos = loadConversations();
      const convo = convos.find(c => c.id === conversationId);
      if (convo && fullText) {
        convo.messages.push({
          id: 'msg_a_' + Date.now(),
          role: 'assistant',
          content: fullText,
          timestamp: new Date().toISOString(),
          status: isClientConnected ? 'complete' : 'stopped',
          requestId,
        });

        // Auto-title if it's the first exchange or title is default
        if (convo.messages.filter(m => m.role === 'user').length <= 1 || convo.title === 'New Chat') {
          updatedTitle = await autoGenerateTitle(message);
          convo.title = updatedTitle;
        }

        convo.updatedAt = new Date().toISOString();
        saveConversations(convos);
      }
    }

    if (isClientConnected) {
      res.write(`data: ${JSON.stringify({ type: 'done', fullText, title: updatedTitle })}\n\n`);
      res.end();
    }
  } catch (err: unknown) {
    const isAbort =
      !isClientConnected ||
      req.destroyed ||
      (err instanceof Error &&
        (err.name === 'AbortError' ||
          err.message?.toLowerCase().includes('aborted') ||
          (err as any).code === 'ERR_STREAM_PREMATURE_CLOSE' ||
          (err as any).code === 'ECONNRESET'));

    if (isAbort) {
      // Client cancelled/stopped generating or closed connection. Cleanly finalize.
      if (!res.writableEnded) {
        try {
          res.end();
        } catch {
          // ignore
        }
      }
      return;
    }

    console.error('Chat error:', err);
    if (isClientConnected && !res.writableEnded) {
      let errorMessage = 'An unexpected error occurred while communicating with the AI service.';
      const rawMsg = err instanceof Error ? err.message : String(err);
      try {
        const parsed = JSON.parse(rawMsg);
        if (parsed.error?.code === 503 || parsed.error?.status === 'UNAVAILABLE') {
          errorMessage = 'The AI model is currently experiencing temporary high demand from Google. Please wait a moment and click Retry.';
        } else if (parsed.error?.code === 429 || parsed.error?.status === 'RESOURCE_EXHAUSTED') {
          errorMessage = 'Rate limit reached. Please wait a few seconds before sending another message.';
        } else if (parsed.error?.code === 504 || parsed.error?.message?.includes('DEADLINE_EXCEEDED')) {
          errorMessage = 'The model took too long to respond. Your message was kept; click Retry to try again.';
        } else if (parsed.error?.message) {
          errorMessage = parsed.error.message;
        }
      } catch {
        if (rawMsg.includes('503') || rawMsg.includes('high demand') || rawMsg.includes('UNAVAILABLE')) {
          errorMessage = 'The AI model is currently experiencing temporary high demand from Google. Please wait a moment and click Retry.';
        } else if (rawMsg.includes('DEADLINE_EXCEEDED') || rawMsg.includes('timeout') || rawMsg.toLowerCase().includes('aborted')) {
          errorMessage = 'The model took too long to respond. Your message was kept; click Retry to try again.';
        } else if (rawMsg) {
          errorMessage = rawMsg;
        }
      }

      try {
        res.write(
          `data: ${JSON.stringify({
            type: 'error',
            error: errorMessage,
            requestId,
          })}\n\n`
        );
        res.end();
      } catch {
        // ignore write on closed socket
      }
    }
  }
});

// File upload endpoint for extracting readable text from documents/text files
app.post('/api/upload', uploadLimiter, (req: Request, res: Response) => {
  const { fileName, fileContent, fileType } = req.body;
  if (!fileName || !fileContent) {
    res.status(400).json({ error: 'Missing file payload' });
    return;
  }

  // Prevent path traversal and sanitize filename
  const baseName = path.basename(fileName);
  const safeName = baseName.replace(/[^a-zA-Z0-9._-]/g, '_');

  // Enforce size limit (approx 2MB text limit)
  if (fileContent.length > 3_000_000) {
    res.status(413).json({ error: 'File size exceeds 2MB limit' });
    return;
  }

  // Validate supported extensions
  const ext = path.extname(safeName).toLowerCase();
  const allowedExts = ['.txt', '.md', '.json', '.csv', '.js', '.ts', '.py', '.html', '.css', '.pdf'];
  if (!allowedExts.includes(ext)) {
    res.status(400).json({ error: `File type ${ext} is not supported. Please upload plain text, code, or markdown documents.` });
    return;
  }

  // Clean extracted snippet
  const extractedText = fileContent.slice(0, 15000);
  res.json({
    success: true,
    fileName: safeName,
    fileType: fileType || ext,
    extractedLength: extractedText.length,
    content: extractedText,
  });
});

// Unknown API routes return JSON 404 response rather than frontend HTML
app.all('/api/*', (req: Request, res: Response) => {
  res.status(404).json({ error: 'API route not found', path: req.path });
});

async function start() {
  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Chatora AI full-stack server running at http://0.0.0.0:${PORT}`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
