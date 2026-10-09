import {
  LLMAnalysisOutputSchema,
  LLMAnalysisOutput,
  buildSystemPrompt,
  buildAnalysisUserPrompt,
  buildMapPrompt,
  buildReducePrompt,
} from './llmPrompt';
import {
  Message,
  AnalysisResult,
  UserSettings,
  ActionItem,
  Decision,
  DeadlineItem,
  MentionItem,
} from '@/types/chat';
import { analyzeChatWithRules } from './ruleEngine';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:latest';

export interface OllamaHealthStatus {
  available: boolean;
  activeModel: string;
  installedModels: string[];
  error?: string;
}

export async function checkOllamaHealth(): Promise<OllamaHealthStatus> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return {
        available: false,
        activeModel: DEFAULT_MODEL,
        installedModels: [],
        error: `Ollama returned HTTP ${res.status}`,
      };
    }

    const data = (await res.json()) as { models?: Array<{ name: string }> };
    const models = (data.models || []).map((m) => m.name);

    return {
      available: true,
      activeModel: models.find((m) => m.includes('llama3.2') || m.includes('qwen')) || models[0] || DEFAULT_MODEL,
      installedModels: models,
    };
  } catch (err: any) {
    return {
      available: false,
      activeModel: DEFAULT_MODEL,
      installedModels: [],
      error: err.name === 'AbortError' ? 'Connection timed out' : err.message || 'Ollama offline',
    };
  }
}

export async function analyzeChat(
  messages: Message[],
  settings: UserSettings,
  mode: 'smart' | 'quick' = 'smart',
  chatId: string = 'current'
): Promise<AnalysisResult> {
  const startTime = performance.now();

  // If user explicitly selected 'quick' mode, use rule engine immediately
  if (mode === 'quick') {
    const ruleResult = analyzeChatWithRules(messages, settings, chatId);
    return {
      ...ruleResult,
      processedWith: 'rules',
      processingTimeMs: Math.round(performance.now() - startTime),
    };
  }

  // Check Ollama connectivity
  const health = await checkOllamaHealth();
  if (!health.available) {
    console.log('[AI Pipeline] Ollama offline. Falling back to rule-based engine.');
    const ruleResult = analyzeChatWithRules(messages, settings, chatId);
    return {
      ...ruleResult,
      processedWith: 'rules',
      modelUsed: 'Fallback NLP Engine (Ollama Offline)',
      processingTimeMs: Math.round(performance.now() - startTime),
    };
  }

  const modelToUse = health.activeModel || DEFAULT_MODEL;

  try {
    // Check if map-reduce chunking is needed (> 30 messages)
    let parsedLlmOutput: LLMAnalysisOutput;

    if (messages.length > 30) {
      parsedLlmOutput = await runMapReduce(messages, settings, modelToUse);
    } else {
      const chatTranscript = messages
        .filter((m) => !m.isSystem)
        .map((m) => `[${m.rawTimestamp}] ${m.sender}: ${m.text}`)
        .join('\n');

      const systemPrompt = buildSystemPrompt(settings.displayName, settings.nicknames);
      const userPrompt = buildAnalysisUserPrompt(chatTranscript);

      const rawJson = await callOllamaGenerate(modelToUse, userPrompt, systemPrompt);
      parsedLlmOutput = cleanAndValidateJson(rawJson);
    }

    // Merge LLM output with rule-based mentions and timestamps for 100% precision
    const ruleFallback = analyzeChatWithRules(messages, settings, chatId);

    const mergedActionItems: ActionItem[] = (parsedLlmOutput.actionItems || []).map((a, idx) => ({
      id: `act-llm-${idx}-${Date.now()}`,
      chatId,
      messageId: findMatchingMessageId(a.originalQuote || a.task, messages) || messages[0]?.id || 'msg-0',
      task: a.task,
      assignee: a.assignee,
      deadline: a.deadline || undefined,
      completed: false,
      urgency: a.urgency || 'medium',
    }));

    const mergedDecisions: Decision[] = (parsedLlmOutput.decisions || []).map((d, idx) => ({
      id: `dec-llm-${idx}-${Date.now()}`,
      chatId,
      messageId: findMatchingMessageId(d.originalQuote || d.decision, messages) || messages[0]?.id || 'msg-0',
      decision: d.decision,
      context: d.context || 'Team Consensus',
      timestamp: new Date().toLocaleTimeString(),
    }));

    const mergedDeadlines: DeadlineItem[] = (parsedLlmOutput.deadlines || []).map((dl, idx) => ({
      id: `dl-llm-${idx}-${Date.now()}`,
      chatId,
      messageId: findMatchingMessageId(dl.title, messages) || messages[0]?.id || 'msg-0',
      title: dl.title,
      sender: dl.sender || 'Team',
      dueDate: dl.dueDate || new Date().toISOString(),
      relativeText: dl.relativeText || 'Upcoming',
      isOverdue: false,
      priority: dl.priority || 'medium',
    }));

    return {
      summary: {
        tldr: parsedLlmOutput.tldr.slice(0, 5),
        topics: parsedLlmOutput.topics,
        urgentHighlights:
          parsedLlmOutput.urgentHighlights.length > 0
            ? parsedLlmOutput.urgentHighlights
            : ruleFallback.summary.urgentHighlights,
      },
      actionItems: mergedActionItems.length > 0 ? mergedActionItems : ruleFallback.actionItems,
      decisions: mergedDecisions.length > 0 ? mergedDecisions : ruleFallback.decisions,
      deadlines: mergedDeadlines.length > 0 ? mergedDeadlines : ruleFallback.deadlines,
      mentions: ruleFallback.mentions, // rule-based mention regex is 100% accurate on exact tokens
      processedWith: 'ollama',
      modelUsed: modelToUse,
      processingTimeMs: Math.round(performance.now() - startTime),
      totalMessages: messages.length,
    };
  } catch (err) {
    console.warn('[AI Pipeline] LLM call or parsing failed, safely falling back to rules:', err);
    const ruleResult = analyzeChatWithRules(messages, settings, chatId);
    return {
      ...ruleResult,
      processedWith: 'rules',
      modelUsed: `Fallback NLP Engine (LLM Parse Error)`,
      processingTimeMs: Math.round(performance.now() - startTime),
    };
  }
}

async function runMapReduce(
  messages: Message[],
  settings: UserSettings,
  model: string
): Promise<LLMAnalysisOutput> {
  const chunkSize = 20;
  const overlap = 4;
  const chunks: Message[][] = [];

  for (let i = 0; i < messages.length; i += chunkSize - overlap) {
    chunks.push(messages.slice(i, i + chunkSize));
    if (i + chunkSize >= messages.length) break;
  }

  const chunkSummaries: any[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunkText = chunks[i]
      .filter((m) => !m.isSystem)
      .map((m) => `[${m.rawTimestamp}] ${m.sender}: ${m.text}`)
      .join('\n');

    const mapPrompt = buildMapPrompt(i, chunks.length, chunkText);
    const rawChunkJson = await callOllamaGenerate(model, mapPrompt);
    try {
      chunkSummaries.push(JSON.parse(sanitizeJsonString(rawChunkJson)));
    } catch {
      chunkSummaries.push({ notes: [rawChunkJson.substring(0, 200)] });
    }
  }

  // Reduce Step
  const reducePrompt = buildReducePrompt(JSON.stringify(chunkSummaries, null, 2));
  const systemPrompt = buildSystemPrompt(settings.displayName, settings.nicknames);
  const rawReducedJson = await callOllamaGenerate(model, reducePrompt, systemPrompt);

  return cleanAndValidateJson(rawReducedJson);
}

async function callOllamaGenerate(
  model: string,
  prompt: string,
  system?: string
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 35000); // 35s timeout

  const res = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      system,
      stream: false,
      format: 'json',
      options: {
        temperature: 0.2,
      },
    }),
    signal: controller.signal,
  });
  clearTimeout(timeoutId);

  if (!res.ok) {
    throw new Error(`Ollama API error: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as { response: string };
  return data.response;
}

function sanitizeJsonString(raw: string): string {
  let cleaned = raw.trim();
  // Strip markdown code fences if present
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned.trim();
}

function cleanAndValidateJson(raw: string): LLMAnalysisOutput {
  const sanitized = sanitizeJsonString(raw);
  const parsed = JSON.parse(sanitized);
  return LLMAnalysisOutputSchema.parse(parsed);
}

function findMatchingMessageId(snippet: string, messages: Message[]): string | undefined {
  if (!snippet) return undefined;
  const snippetLower = snippet.toLowerCase().trim();
  const found = messages.find(
    (m) => m.text.toLowerCase().includes(snippetLower) || snippetLower.includes(m.text.toLowerCase())
  );
  return found?.id;
}
