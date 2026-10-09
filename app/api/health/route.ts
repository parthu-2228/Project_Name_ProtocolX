import { NextResponse } from 'next/server';
import { checkOllamaHealth } from '@/lib/ollamaClient';

export async function GET() {
  try {
    const health = await checkOllamaHealth();
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      ai: {
        ollamaConnected: health.available,
        model: health.activeModel,
        availableModels: health.installedModels,
        error: health.error,
      },
      privacy: {
        chatStorage: 'IndexedDB (Browser Client Only)',
        backendStateless: true,
        cloudTelemetry: 'Disabled',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        status: 'partial',
        error: err.message,
        ai: {
          ollamaConnected: false,
          fallbackEngine: 'Active (Rules + Chrono-node)',
        },
      },
      { status: 200 }
    );
  }
}
