import { NextRequest, NextResponse } from 'next/server';
import { analyzeChat } from '@/lib/ollamaClient';
import { Message, UserSettings, DEFAULT_USER_SETTINGS } from '@/types/chat';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages: Message[] = body.messages || [];
    const settings: UserSettings = body.settings || DEFAULT_USER_SETTINGS;
    const mode: 'smart' | 'quick' = body.mode || settings.aiMode || 'smart';
    const chatId: string = body.chatId || 'current';

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'No messages provided to analyze' },
        { status: 400 }
      );
    }

    // Process via local AI pipeline (Ollama + rules fallback)
    const result = await analyzeChat(messages, settings, mode, chatId);

    // Return stateless result — NO content is saved to server database or logs!
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[API /analyze] Processing error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to process chat analysis' },
      { status: 500 }
    );
  }
}
