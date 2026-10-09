import { Message } from '@/types/chat';

export interface ParsedRawMessage {
  rawTimestamp: string;
  sender: string;
  text: string;
  isSystem: boolean;
}

// Regex patterns for common WhatsApp export formats
const PATTERNS = [
  // [MM/DD/YY, H:MM:SS AM/PM] Sender: Message or [DD/MM/YYYY, HH:MM:SS]
  /^\[(\d{1,2}[./\-]\d{1,2}[./\-]\d{2,4}[,\s]+[\d:]+(?:\s*[APap][Mm])?)\]\s+([^:]+):\s+(.*)$/,
  // MM/DD/YY, H:MM AM - Sender: Message
  /^(\d{1,2}[./\-]\d{1,2}[./\-]\d{2,4}[,\s]+[\d:]+(?:\s*[APap][Mm])?)\s+-\s+([^:]+):\s+(.*)$/,
  // [YYYY-MM-DD HH:MM:SS] Sender: Message
  /^\[(\d{4}[./\-]\d{1,2}[./\-]\d{1,2}[,\s]+[\d:]+(?:\s*[APap][Mm])?)\]\s+([^:]+):\s+(.*)$/,
];

const SYSTEM_PATTERNS = [
  // [MM/DD/YY, ...] System text (no sender colon)
  /^\[(\d{1,2}[./\-]\d{1,2}[./\-]\d{2,4}[,\s]+[\d:]+(?:\s*[APap][Mm])?)\]\s+(.*)$/,
  // MM/DD/YY, ... - System text
  /^(\d{1,2}[./\-]\d{1,2}[./\-]\d{2,4}[,\s]+[\d:]+(?:\s*[APap][Mm])?)\s+-\s+(.*)$/,
];

const SYSTEM_KEYWORDS = [
  'end-to-end encrypted',
  'created group',
  'changed the group',
  'changed the subject',
  'added',
  'left',
  'removed',
  'security code changed',
  'disappearing messages',
];

export function parseWhatsAppChat(rawText: string, chatId: string = 'current'): Message[] {
  if (!rawText || !rawText.trim()) {
    return [];
  }

  // Normalize newlines
  const lines = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const rawMessages: ParsedRawMessage[] = [];

  let currentMsg: ParsedRawMessage | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim() && !currentMsg) continue;

    let matched = false;

    // 1. Try standard sender pattern
    for (const pattern of PATTERNS) {
      const match = line.match(pattern);
      if (match) {
        if (currentMsg) {
          rawMessages.push(currentMsg);
        }
        const rawTimestamp = match[1].trim();
        const sender = match[2].trim();
        const text = match[3].trim();
        currentMsg = {
          rawTimestamp,
          sender,
          text,
          isSystem: false,
        };
        matched = true;
        break;
      }
    }

    // 2. Try system message pattern if not matched as sender message
    if (!matched) {
      for (const sysPattern of SYSTEM_PATTERNS) {
        const match = line.match(sysPattern);
        if (match) {
          const rawTimestamp = match[1].trim();
          const content = match[2].trim();
          // Check if this line looks like a system event
          const isSystemKeyword = SYSTEM_KEYWORDS.some((kw) =>
            content.toLowerCase().includes(kw)
          );

          if (isSystemKeyword || !content.includes(':')) {
            if (currentMsg) {
              rawMessages.push(currentMsg);
            }
            currentMsg = {
              rawTimestamp,
              sender: 'System',
              text: content,
              isSystem: true,
            };
            matched = true;
            break;
          }
        }
      }
    }

    // 3. Continuation of previous multi-line message
    if (!matched) {
      if (currentMsg) {
        currentMsg.text += '\n' + line;
      } else if (line.trim()) {
        // Fallback for line without standard timestamp header
        currentMsg = {
          rawTimestamp: new Date().toLocaleTimeString(),
          sender: 'Unknown',
          text: line,
          isSystem: false,
        };
      }
    }
  }

  if (currentMsg) {
    rawMessages.push(currentMsg);
  }

  // Convert to full Message objects with IDs
  return rawMessages.map((raw, idx) => ({
    id: `msg-${Date.now()}-${idx}`,
    chatId,
    sender: raw.sender,
    timestamp: normalizeTimestamp(raw.rawTimestamp),
    rawTimestamp: raw.rawTimestamp,
    text: raw.text,
    isSystem: raw.isSystem,
    isMention: false,
    hasQuestionForMe: false,
    priorityScore: 0,
    priorityLevel: 'low',
    priorityReason: '',
  }));
}

function normalizeTimestamp(raw: string): string {
  try {
    const parsed = new Date(raw);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  } catch {
    // ignore
  }
  return raw;
}
