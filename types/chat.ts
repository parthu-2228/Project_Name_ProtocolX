export type PriorityLevel = 'high' | 'medium' | 'low';

export interface Message {
  id: string;
  chatId: string;
  sender: string;
  timestamp: string;
  rawTimestamp: string;
  text: string;
  isSystem: boolean;
  isMention: boolean;
  hasQuestionForMe: boolean;
  priorityScore: number; // 0 - 100
  priorityLevel: PriorityLevel;
  priorityReason: string;
}

export interface ActionItem {
  id: string;
  chatId: string;
  messageId: string;
  task: string;
  assignee: string;
  deadline?: string;
  completed: boolean;
  urgency: PriorityLevel;
}

export interface Decision {
  id: string;
  chatId: string;
  messageId: string;
  decision: string;
  context: string;
  timestamp: string;
}

export interface DeadlineItem {
  id: string;
  chatId: string;
  messageId: string;
  title: string;
  sender: string;
  dueDate: string; // ISO date or normalized string
  relativeText: string;
  isOverdue: boolean;
  priority: PriorityLevel;
}

export interface MentionItem {
  id: string;
  chatId: string;
  messageId: string;
  sender: string;
  text: string;
  timestamp: string;
  matchedNickname: string;
}

export interface CatchUpSummary {
  tldr: string[]; // 5-line TL;DR
  topics: {
    topic: string;
    points: string[];
  }[];
  urgentHighlights: string[];
}

export interface AnalysisResult {
  summary: CatchUpSummary;
  actionItems: ActionItem[];
  decisions: Decision[];
  deadlines: DeadlineItem[];
  mentions: MentionItem[];
  processedWith: 'ollama' | 'rules';
  modelUsed?: string;
  processingTimeMs: number;
  totalMessages: number;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  rawText?: string;
  messagesCount: number;
  latestMessageTime?: string;
}

export interface UserSettings {
  displayName: string;
  nicknames: string[];
  priorityKeywords: string[];
  theme: 'dark' | 'light';
  aiMode: 'smart' | 'quick'; // smart = Ollama + fallback, quick = instant rules
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  displayName: 'Partha',
  nicknames: ['Partha', 'Parth', 'PS', 'me'],
  priorityKeywords: ['urgent', 'asap', 'blocker', 'deadline', 'jaldi', 'critical', 'eod', 'bug', 'turant', 'break'],
  theme: 'dark',
  aiMode: 'smart',
};
