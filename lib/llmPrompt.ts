import { z } from 'zod';

// Strict Zod schema for LLM JSON output validation
export const ActionItemSchema = z.object({
  task: z.string(),
  assignee: z.string(),
  deadline: z.string().optional().nullable(),
  urgency: z.enum(['high', 'medium', 'low']).default('medium'),
  originalQuote: z.string().optional(),
});

export const DecisionSchema = z.object({
  decision: z.string(),
  context: z.string(),
  originalQuote: z.string().optional(),
});

export const DeadlineSchema = z.object({
  title: z.string(),
  sender: z.string().default('Team Member'),
  dueDate: z.string(),
  relativeText: z.string(),
  priority: z.enum(['high', 'medium', 'low']).default('medium'),
});

export const PriorityMessageScoreSchema = z.object({
  messageSnippet: z.string(),
  sender: z.string(),
  score: z.number().min(0).max(100),
  priorityLevel: z.enum(['high', 'medium', 'low']),
  whyItMatters: z.string(),
});

export const LLMAnalysisOutputSchema = z.object({
  tldr: z.array(z.string()).min(3).max(6),
  topics: z.array(
    z.object({
      topic: z.string(),
      points: z.array(z.string()),
    })
  ),
  urgentHighlights: z.array(z.string()).default([]),
  actionItems: z.array(ActionItemSchema).default([]),
  decisions: z.array(DecisionSchema).default([]),
  deadlines: z.array(DeadlineSchema).default([]),
  messagePriorities: z.array(PriorityMessageScoreSchema).default([]),
});

export type LLMAnalysisOutput = z.infer<typeof LLMAnalysisOutputSchema>;

export function buildSystemPrompt(userName: string, nicknames: string[]): string {
  return `You are "What Did I Miss?", an expert local-first AI assistant running on-device.
Your mission is to read high-volume chat transcripts and extract critical information for the user "${userName}" (who may also be referred to as: ${nicknames.join(
    ', '
  )}).

CORE RULES:
1. The user values privacy: you are running locally on their device.
2. Identify:
   - Exactly 5 clear TL;DR summary lines capturing the core updates.
   - Key decisions agreed upon by the team.
   - Action items (who is doing what, by when). Check if any action is assigned to "${userName}".
   - Deadlines with normalized times (e.g., "Tomorrow 4:00 PM", "Tonight 9:00 PM").
   - Mentions or direct questions directed at "${userName}".
   - Priority scoring (0-100) and High/Med/Low ranking for urgent messages with a 1-line "why this matters".
3. Handle colloquial language, Hinglish (e.g. "jaldi kar", "kal tak", "bhai", "pakka done", "scene kya hai"), and tech jargon.
4. Output STRICT JSON ONLY. Do NOT include markdown code blocks, do not include preamble or explanations. Return only valid parseable JSON conforming exactly to the requested schema.`;
}

export function buildAnalysisUserPrompt(chatText: string): string {
  return `Analyze this chat transcript and return a JSON object with this exact structure:
{
  "tldr": [
    "Line 1: High level purpose and current project/chat status",
    "Line 2: Crucial decision or agreement reached",
    "Line 3: Urgent blocker or immediate request for the user",
    "Line 4: Assigned action items and responsible owners",
    "Line 5: Next milestone and upcoming deadline"
  ],
  "topics": [
    { "topic": "Name of topic", "points": ["Bullet 1", "Bullet 2"] }
  ],
  "urgentHighlights": [
    "Sender: Brief quote — why it needs urgent attention"
  ],
  "actionItems": [
    {
      "task": "Specific task description",
      "assignee": "Name of assignee (e.g., 'Partha' or 'Vikram')",
      "deadline": "Optional deadline string or null",
      "urgency": "high" | "medium" | "low",
      "originalQuote": "Exact short quote from chat"
    }
  ],
  "decisions": [
    {
      "decision": "What was agreed or decided",
      "context": "Short context or who agreed",
      "originalQuote": "Quote"
    }
  ],
  "deadlines": [
    {
      "title": "What is due",
      "sender": "Who stated the deadline",
      "dueDate": "ISO timestamp or normalized date",
      "relativeText": "Human friendly relative string e.g. Tomorrow at 4:00 PM",
      "priority": "high" | "medium" | "low"
    }
  ],
  "messagePriorities": [
    {
      "messageSnippet": "Short snippet of important message",
      "sender": "Sender name",
      "score": 85,
      "priorityLevel": "high",
      "whyItMatters": "Why this message is critical for the user"
    }
  ]
}

CHAT TRANSCRIPT:
${chatText}`;
}

export function buildMapPrompt(chunkIndex: number, totalChunks: number, chunkText: string): string {
  return `This is PART ${chunkIndex + 1} of ${totalChunks} from a long chat transcript.
Extract key events, tasks, decisions, and deadlines from this specific segment into strict JSON:
{
  "keyNotes": ["Important event 1", "Important event 2"],
  "actionItems": [
    { "task": "...", "assignee": "...", "deadline": "...", "urgency": "high" }
  ],
  "decisions": [
    { "decision": "...", "context": "..." }
  ],
  "deadlines": [
    { "title": "...", "dueDate": "...", "relativeText": "...", "priority": "high" }
  ]
}

CHUNK TEXT:
${chunkText}`;
}

export function buildReducePrompt(chunkSummariesJson: string): string {
  return `Synthesize these extracted segment summaries into one cohesive final catch-up output for the user.
Return the strict JSON format with "tldr" (5 lines), "topics", "urgentHighlights", "actionItems", "decisions", "deadlines", "messagePriorities".

SEGMENT DATA:
${chunkSummariesJson}`;
}
