import { ConversationSummary, Message } from './api';

interface GuestConversation {
  summary: ConversationSummary;
  messages: Message[];
}

const STORAGE_KEY = 'chatora-guest-conversations';

function isGuestConversation(value: unknown): value is GuestConversation {
  if (!value || typeof value !== 'object') return false;
  const record = value as Partial<GuestConversation>;
  return Boolean(
    record.summary &&
      typeof record.summary.id === 'string' &&
      typeof record.summary.title === 'string' &&
      Array.isArray(record.messages) &&
      record.messages.every(message =>
        Boolean(
          message &&
            (message.role === 'user' || message.role === 'assistant') &&
            typeof message.content === 'string' &&
            typeof message.timestamp === 'string'
        )
      )
  );
}

export function getGuestConversations(): GuestConversation[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];

  try {
    const records: unknown = JSON.parse(stored);
    if (!Array.isArray(records)) {
      console.error('[Conversations] Local guest history has an invalid format.');
      return [];
    }

    return records.filter(isGuestConversation);
  } catch (error) {
    console.error('[Conversations] Could not read local guest history.', error);
    return [];
  }
}

export function saveGuestConversation(summary: ConversationSummary, messages: Message[]): void {
  const conversations = getGuestConversations().filter(
    conversation => conversation.summary.id !== summary.id
  );
  conversations.unshift({ summary, messages });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
}

export function getGuestConversation(id: string): GuestConversation | undefined {
  return getGuestConversations().find(conversation => conversation.summary.id === id);
}

export function updateGuestConversation(
  id: string,
  update: (summary: ConversationSummary) => ConversationSummary
): void {
  const conversations = getGuestConversations();
  const target = conversations.find(conversation => conversation.summary.id === id);
  if (!target) throw new Error('Guest conversation was not found in local history.');

  target.summary = update(target.summary);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
}

export function deleteGuestConversation(id: string): void {
  const conversations = getGuestConversations().filter(
    conversation => conversation.summary.id !== id
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
}

export function clearGuestConversations(): void {
  localStorage.removeItem(STORAGE_KEY);
}
