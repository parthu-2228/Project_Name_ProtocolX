import Dexie, { Table } from 'dexie';
import {
  Message,
  ActionItem,
  Decision,
  DeadlineItem,
  CatchUpSummary,
  ChatSession,
  UserSettings,
  DEFAULT_USER_SETTINGS,
} from '@/types/chat';

export interface StoredSummary {
  chatId: string;
  summary: CatchUpSummary;
  processedWith: string;
  modelUsed?: string;
  processingTimeMs: number;
}

export interface StoredSetting {
  key: string;
  value: any;
}

export class WhatDidIMissDatabase extends Dexie {
  chats!: Table<ChatSession, string>;
  messages!: Table<Message, string>;
  actionItems!: Table<ActionItem, string>;
  decisions!: Table<Decision, string>;
  deadlines!: Table<DeadlineItem, string>;
  summaries!: Table<StoredSummary, string>;
  settings!: Table<StoredSetting, string>;

  constructor() {
    super('WhatDidIMissDB');
    this.version(1).stores({
      chats: 'id, title, createdAt',
      messages: 'id, chatId, sender, priorityScore, isMention',
      actionItems: 'id, chatId, messageId, completed, urgency',
      decisions: 'id, chatId, messageId',
      deadlines: 'id, chatId, dueDate, priority',
      summaries: 'chatId',
      settings: 'key',
    });
  }
}

export const db = new WhatDidIMissDatabase();

// Database Helper methods
export async function saveChatAnalysis(
  chatId: string,
  title: string,
  rawText: string,
  messages: Message[],
  actionItems: ActionItem[],
  decisions: Decision[],
  deadlines: DeadlineItem[],
  summary: CatchUpSummary,
  processedWith: string,
  processingTimeMs: number,
  modelUsed?: string
): Promise<void> {
  await db.transaction('rw', [db.chats, db.messages, db.actionItems, db.decisions, db.deadlines, db.summaries], async () => {
    // 1. Save chat metadata
    await db.chats.put({
      id: chatId,
      title,
      createdAt: new Date().toISOString(),
      rawText,
      messagesCount: messages.length,
      latestMessageTime: messages[messages.length - 1]?.rawTimestamp || '',
    });

    // 2. Clear old messages for this chat if re-analyzing
    await db.messages.where('chatId').equals(chatId).delete();
    await db.messages.bulkPut(messages);

    // 3. Clear and save action items
    await db.actionItems.where('chatId').equals(chatId).delete();
    await db.actionItems.bulkPut(actionItems);

    // 4. Clear and save decisions
    await db.decisions.where('chatId').equals(chatId).delete();
    await db.decisions.bulkPut(decisions);

    // 5. Clear and save deadlines
    await db.deadlines.where('chatId').equals(chatId).delete();
    await db.deadlines.bulkPut(deadlines);

    // 6. Save summary
    await db.summaries.put({
      chatId,
      summary,
      processedWith,
      modelUsed,
      processingTimeMs,
    });
  });
}

export async function toggleActionItemCompleted(actionId: string, currentStatus: boolean): Promise<boolean> {
  const newStatus = !currentStatus;
  await db.actionItems.update(actionId, { completed: newStatus });
  return newStatus;
}

export async function getLocalSettings(): Promise<UserSettings> {
  try {
    const item = await db.settings.get('user_settings');
    if (item && item.value) {
      return item.value;
    }
  } catch (err) {
    console.warn('Could not read settings from IndexedDB:', err);
  }
  return DEFAULT_USER_SETTINGS;
}

export async function saveLocalSettings(settings: UserSettings): Promise<void> {
  await db.settings.put({
    key: 'user_settings',
    value: settings,
  });
}

export async function clearAllLocalData(): Promise<void> {
  await db.transaction('rw', [db.chats, db.messages, db.actionItems, db.decisions, db.deadlines, db.summaries], async () => {
    await db.chats.clear();
    await db.messages.clear();
    await db.actionItems.clear();
    await db.decisions.clear();
    await db.deadlines.clear();
    await db.summaries.clear();
  });
}

export async function getStorageStats(): Promise<{
  chatsCount: number;
  messagesCount: number;
  actionItemsCount: number;
  decisionsCount: number;
  deadlinesCount: number;
  summariesCount: number;
}> {
  try {
    const [c, m, a, d, dl, s] = await Promise.all([
      db.chats.count(),
      db.messages.count(),
      db.actionItems.count(),
      db.decisions.count(),
      db.deadlines.count(),
      db.summaries.count(),
    ]);
    return {
      chatsCount: c,
      messagesCount: m,
      actionItemsCount: a,
      decisionsCount: d,
      deadlinesCount: dl,
      summariesCount: s,
    };
  } catch {
    return {
      chatsCount: 0,
      messagesCount: 0,
      actionItemsCount: 0,
      decisionsCount: 0,
      deadlinesCount: 0,
      summariesCount: 0,
    };
  }
}
