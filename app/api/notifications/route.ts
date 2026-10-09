import { NextRequest, NextResponse } from 'next/server';

// Stateless in-memory buffer for real-time notification streaming
interface LiveNotification {
  id: string;
  app: 'whatsapp' | 'telegram' | 'discord' | 'email' | 'instagram' | 'linkedin' | 'generic';
  sender: string;
  text: string;
  timestamp: string;
  receivedAt: string;
}

// In-memory queue (kept in memory, cleared periodically, never written to disk)
const notificationBuffer: LiveNotification[] = [];

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    count: notificationBuffer.length,
    notifications: [...notificationBuffer].reverse().slice(0, 50),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const notification: LiveNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      app: body.app || 'generic',
      sender: body.sender || 'Unknown Sender',
      text: body.text || '',
      timestamp: body.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      receivedAt: new Date().toISOString(),
    };

    notificationBuffer.push(notification);

    // Keep buffer bounded in memory (max 100 items)
    if (notificationBuffer.length > 100) {
      notificationBuffer.shift();
    }

    return NextResponse.json({
      success: true,
      notification,
      totalBuffered: notificationBuffer.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Invalid notification body' }, { status: 400 });
  }
}

export async function DELETE() {
  notificationBuffer.length = 0;
  return NextResponse.json({ success: true, message: 'Buffer cleared' });
}
