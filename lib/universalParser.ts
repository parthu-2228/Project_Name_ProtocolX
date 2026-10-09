import { Message } from '@/types/chat';

export type PlatformSource =
  | 'auto'
  | 'whatsapp'
  | 'telegram'
  | 'discord'
  | 'slack'
  | 'email'
  | 'instagram'
  | 'linkedin'
  | 'generic';

export interface ParseResult {
  source: PlatformSource;
  detectedSource: PlatformSource;
  messages: Message[];
}

export function detectPlatformSource(rawText: string): PlatformSource {
  const text = rawText.trim();
  if (!text) return 'generic';

  // 1. Email signatures / headers
  if (
    /^(from:|subject:|to:|date:)/im.test(text) ||
    /on\s+.+wrote:/im.test(text) ||
    /----------\s*forwarded message\s*----------/im.test(text)
  ) {
    return 'email';
  }

  // 2. Discord: "Username — MM/DD/YYYY HH:MM AM" or "Username [Yesterday at 4:20 PM]"
  if (
    /^.+\s+—\s+\d{1,2}\/\d{1,2}\/\d{4}\s+[\d:]+\s*(?:AM|PM)?/im.test(text) ||
    /^.+\s+\[(?:Today|Yesterday|[\w\s]+)\s+at\s+[\d:]+\s*(?:AM|PM)?\]/im.test(text)
  ) {
    return 'discord';
  }

  // 3. Slack: "Username [10:30 AM]" or "Username\n10:30 AM\nMessage"
  if (/^.+\s+\[\d{1,2}:\d{2}\s*(?:AM|PM)?\]/im.test(text)) {
    return 'slack';
  }

  // 4. Telegram: "Sender, [DD.MM.YY HH:mm]" or "Sender, [Oct 9, 2026 at 2:30 PM]"
  if (/^.+,\s*\[\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\s+[\d:]+\]/im.test(text) || /^.+,\s*\[[A-Za-z]+\s+\d{1,2},\s*\d{4}/im.test(text)) {
    return 'telegram';
  }

  // 5. WhatsApp: "[MM/DD/YY, HH:MM:SS] Sender:" or "MM/DD/YY, HH:MM - Sender:"
  if (
    /^\[\d{1,2}[./\-]\d{1,2}[./\-]\d{2,4}[,\s]+[\d:]+(?:\s*[APap][Mm])?\]\s+[^:]+:/im.test(text) ||
    /^\d{1,2}[./\-]\d{1,2}[./\-]\d{2,4}[,\s]+[\d:]+(?:\s*[APap][Mm])?\s+-\s+[^:]+:/im.test(text)
  ) {
    return 'whatsapp';
  }

  // 6. LinkedIn or Instagram direct messages (often "Sender \n Time \n Message" or "Sender: message")
  if (/^(linkedin|inmail|instagram|direct)/im.test(text)) {
    return 'linkedin';
  }

  return 'generic';
}

export function parseUniversalContent(
  rawText: string,
  preferredSource: PlatformSource = 'auto',
  chatId: string = 'current'
): ParseResult {
  const detected = detectPlatformSource(rawText);
  const source = preferredSource === 'auto' ? detected : preferredSource;

  let messages: Message[] = [];

  switch (source) {
    case 'email':
      messages = parseEmailThread(rawText, chatId);
      break;
    case 'discord':
      messages = parseDiscordChat(rawText, chatId);
      break;
    case 'slack':
      messages = parseSlackChat(rawText, chatId);
      break;
    case 'telegram':
      messages = parseTelegramChat(rawText, chatId);
      break;
    case 'instagram':
    case 'linkedin':
      messages = parseSocialChat(rawText, source, chatId);
      break;
    case 'whatsapp':
      messages = parseWhatsAppFormat(rawText, chatId);
      break;
    case 'generic':
    default:
      messages = parseGenericFormat(rawText, chatId);
      break;
  }

  // Fallback to generic if specialized parser yielded zero messages
  if (messages.length === 0 && rawText.trim().length > 0) {
    messages = parseGenericFormat(rawText, chatId);
  }

  return {
    source,
    detectedSource: detected,
    messages,
  };
}

// 1. WhatsApp Parser
function parseWhatsAppFormat(rawText: string, chatId: string): Message[] {
  const lines = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const msgs: Message[] = [];

  const patterns = [
    /^\[(\d{1,2}[./\-]\d{1,2}[./\-]\d{2,4}[,\s]+[\d:]+(?:\s*[APap][Mm])?)\]\s+([^:]+):\s+(.*)$/,
    /^(\d{1,2}[./\-]\d{1,2}[./\-]\d{2,4}[,\s]+[\d:]+(?:\s*[APap][Mm])?)\s+-\s+([^:]+):\s+(.*)$/,
  ];

  let current: Message | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim() && !current) continue;

    let matched = false;
    for (const p of patterns) {
      const m = line.match(p);
      if (m) {
        if (current) msgs.push(current);
        current = {
          id: `wa-${i}-${Date.now()}`,
          chatId,
          sender: m[2].trim(),
          rawTimestamp: m[1].trim(),
          timestamp: new Date().toISOString(),
          text: m[3].trim(),
          isSystem: m[2].toLowerCase().includes('system') || m[3].toLowerCase().includes('end-to-end encrypted'),
          isMention: false,
          hasQuestionForMe: false,
          priorityScore: 0,
          priorityLevel: 'low',
          priorityReason: '',
        };
        matched = true;
        break;
      }
    }

    if (!matched && current) {
      current.text += '\n' + line;
    }
  }

  if (current) msgs.push(current);
  return msgs;
}

// 2. Telegram Parser (handles: "Sender, [DD.MM.YY HH:MM]\nMessage" or "Sender: Message")
function parseTelegramChat(rawText: string, chatId: string): Message[] {
  const lines = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const msgs: Message[] = [];

  // Pattern: Sender, [10.10.26 14:30]
  const headerPattern = /^([^,]+),\s*\[([^\]]+)\]$/;
  let current: Message | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const headerMatch = line.match(headerPattern);

    if (headerMatch) {
      if (current) msgs.push(current);
      current = {
        id: `tg-${i}-${Date.now()}`,
        chatId,
        sender: headerMatch[1].trim(),
        rawTimestamp: headerMatch[2].trim(),
        timestamp: new Date().toISOString(),
        text: '',
        isSystem: false,
        isMention: false,
        hasQuestionForMe: false,
        priorityScore: 0,
        priorityLevel: 'low',
        priorityReason: '',
      };
    } else if (current) {
      current.text = current.text ? current.text + '\n' + line : line;
    } else {
      // Inline pattern "Sender [12:30]: Message"
      const inlineMatch = line.match(/^([^:]+)\s*\[([\d: APM]+)\]:\s*(.*)$/i);
      if (inlineMatch) {
        msgs.push({
          id: `tg-${i}-${Date.now()}`,
          chatId,
          sender: inlineMatch[1].trim(),
          rawTimestamp: inlineMatch[2].trim(),
          timestamp: new Date().toISOString(),
          text: inlineMatch[3].trim(),
          isSystem: false,
          isMention: false,
          hasQuestionForMe: false,
          priorityScore: 0,
          priorityLevel: 'low',
          priorityReason: '',
        });
      }
    }
  }

  if (current && current.text.trim()) msgs.push(current);
  return msgs.length > 0 ? msgs : parseGenericFormat(rawText, chatId);
}

// 3. Discord Parser (handles: "User — MM/DD/YYYY HH:MM AM" \n Message)
function parseDiscordChat(rawText: string, chatId: string): Message[] {
  const lines = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const msgs: Message[] = [];

  // Discord export: "Username — 10/09/2026 2:15 PM"
  const headerPattern = /^(.+?)\s+—\s+(\d{1,2}\/\d{1,2}\/\d{4}\s+[\d:]+\s*(?:AM|PM)?)$/i;
  let current: Message | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(headerPattern);

    if (match) {
      if (current) msgs.push(current);
      current = {
        id: `dc-${i}-${Date.now()}`,
        chatId,
        sender: match[1].trim(),
        rawTimestamp: match[2].trim(),
        timestamp: new Date().toISOString(),
        text: '',
        isSystem: false,
        isMention: false,
        hasQuestionForMe: false,
        priorityScore: 0,
        priorityLevel: 'low',
        priorityReason: '',
      };
    } else if (current) {
      current.text = current.text ? current.text + '\n' + line : line;
    }
  }

  if (current && current.text.trim()) msgs.push(current);
  return msgs.length > 0 ? msgs : parseGenericFormat(rawText, chatId);
}

// 4. Slack Parser (handles: "Username [10:30 AM]" or "Username 10:30 AM \n message")
function parseSlackChat(rawText: string, chatId: string): Message[] {
  const lines = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const msgs: Message[] = [];

  const slackPattern = /^([A-Za-z0-9_.\s]+)\s+\[([\d:]+\s*(?:AM|PM)?)\](?:\s*:?\s*(.*))?$/i;
  let current: Message | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(slackPattern);

    if (match) {
      if (current) msgs.push(current);
      current = {
        id: `slack-${i}-${Date.now()}`,
        chatId,
        sender: match[1].trim(),
        rawTimestamp: match[2].trim(),
        timestamp: new Date().toISOString(),
        text: match[3] ? match[3].trim() : '',
        isSystem: false,
        isMention: false,
        hasQuestionForMe: false,
        priorityScore: 0,
        priorityLevel: 'low',
        priorityReason: '',
      };
    } else if (current) {
      current.text = current.text ? current.text + '\n' + line : line;
    }
  }

  if (current && current.text.trim()) msgs.push(current);
  return msgs.length > 0 ? msgs : parseGenericFormat(rawText, chatId);
}

// 5. Email Thread Parser (From:, Date:, Subject:, or "On [Date], [Person] wrote:")
function parseEmailThread(rawText: string, chatId: string): Message[] {
  const msgs: Message[] = [];
  // Split on email thread delimiters
  const emailBlocks = rawText.split(/(?:(?:^|\n)(?:From:\s*|On\s+.+wrote:|-{3,}\s*Original Message\s*-{3,}))/i);

  emailBlocks.forEach((block, idx) => {
    const trimmed = block.trim();
    if (!trimmed) return;

    // Extract sender if present
    const fromMatch = trimmed.match(/(?:From:\s*)?([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}|[A-Za-z\s]+)(?:<.+>)?/i);
    const dateMatch = trimmed.match(/(?:Date:\s*)([^\n]+)/i);
    const subjectMatch = trimmed.match(/(?:Subject:\s*)([^\n]+)/i);

    const sender = fromMatch ? fromMatch[1].trim() : `Email Participant ${idx + 1}`;
    const rawTimestamp = dateMatch ? dateMatch[1].trim() : new Date().toLocaleTimeString();

    // Clean body text by stripping header lines
    const cleanedBody = trimmed
      .replace(/^Subject:[^\n]+\n/im, '')
      .replace(/^To:[^\n]+\n/im, '')
      .replace(/^Date:[^\n]+\n/im, '')
      .replace(/^From:[^\n]+\n/im, '')
      .trim();

    msgs.push({
      id: `email-${idx}-${Date.now()}`,
      chatId,
      sender: subjectMatch ? `${sender} (${subjectMatch[1].trim()})` : sender,
      rawTimestamp,
      timestamp: new Date().toISOString(),
      text: cleanedBody || trimmed,
      isSystem: false,
      isMention: false,
      hasQuestionForMe: false,
      priorityScore: 0,
      priorityLevel: 'low',
      priorityReason: '',
    });
  });

  return msgs.length > 0 ? msgs : parseGenericFormat(rawText, chatId);
}

// 6. Social Platforms (Instagram, LinkedIn DM)
function parseSocialChat(rawText: string, source: PlatformSource, chatId: string): Message[] {
  // Frequently pasted as: "Sender: message" or "Sender \n timestamp \n message"
  return parseGenericFormat(rawText, chatId, source.toUpperCase());
}

// 7. Generic Robust Fallback Parser
export function parseGenericFormat(rawText: string, chatId: string, defaultPrefix = 'Chat'): Message[] {
  const lines = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const msgs: Message[] = [];

  // Matches "Sender: Message" or "@Sender: Message" or "Sender (time): Message"
  const colonPattern = /^@?([A-Za-z0-9_.\s-]{2,25})\s*(?:\([^)]+\))?:\s*(.*)$/;
  let current: Message | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim() && !current) continue;

    const match = line.match(colonPattern);
    if (match) {
      if (current) msgs.push(current);
      current = {
        id: `gen-${i}-${Date.now()}`,
        chatId,
        sender: match[1].trim(),
        rawTimestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: new Date().toISOString(),
        text: match[2].trim(),
        isSystem: false,
        isMention: false,
        hasQuestionForMe: false,
        priorityScore: 0,
        priorityLevel: 'low',
        priorityReason: '',
      };
    } else if (current) {
      current.text += '\n' + line;
    } else if (line.trim()) {
      // Paragraph mode fallback
      msgs.push({
        id: `gen-${i}-${Date.now()}`,
        chatId,
        sender: `${defaultPrefix} Message`,
        rawTimestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: new Date().toISOString(),
        text: line.trim(),
        isSystem: false,
        isMention: false,
        hasQuestionForMe: false,
        priorityScore: 0,
        priorityLevel: 'low',
        priorityReason: '',
      });
    }
  }

  if (current) msgs.push(current);
  return msgs;
}
