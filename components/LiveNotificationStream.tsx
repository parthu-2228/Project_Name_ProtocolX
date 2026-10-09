'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  Radio,
  Play,
  Square,
  Sparkles,
  Send,
  MessageCircle,
  Mail,
  Share2,
  Trash2,
  Copy,
  Check,
  Zap,
} from 'lucide-react';
import { Message } from '@/types/chat';

export interface LiveNotificationItem {
  id: string;
  app: 'whatsapp' | 'telegram' | 'discord' | 'slack' | 'email' | 'instagram' | 'linkedin' | 'generic';
  sender: string;
  text: string;
  timestamp: string;
  isUrgent?: boolean;
}

interface LiveNotificationStreamProps {
  onSummarizeNotifications: (messages: Message[]) => void;
  isAnalyzing: boolean;
}

const SIMULATED_STREAM_EVENTS: Omit<LiveNotificationItem, 'id' | 'timestamp'>[] = [
  {
    app: 'whatsapp',
    sender: 'Rohan (WhatsApp)',
    text: 'Bhai kal tak demo rehearsal hai at 11:00 AM! Please be ready.',
    isUrgent: true,
  },
  {
    app: 'discord',
    sender: 'DevLead (Discord)',
    text: '@Partha can you push the database migration script before tonight 9:00 PM?',
    isUrgent: true,
  },
  {
    app: 'email',
    sender: 'Manager (Email)',
    text: 'DECIDED: Executive committee approved the on-device AI privacy architecture proposal.',
    isUrgent: false,
  },
  {
    app: 'telegram',
    sender: 'Aisha (Telegram)',
    text: 'Action item for Aisha: I am verifying Supabase Row Level Security policies by 2:00 PM.',
    isUrgent: false,
  },
  {
    app: 'slack',
    sender: 'Vikram (Slack)',
    text: 'Drafting 5 pitch slides right now. Review needed by tomorrow morning 9:00 AM.',
    isUrgent: true,
  },
  {
    app: 'linkedin',
    sender: 'Talent Lead (LinkedIn)',
    text: 'Hey Partha, saw your local-first AI work. Would love to connect regarding hackathon mentorship!',
    isUrgent: false,
  },
];

export function LiveNotificationStream({
  onSummarizeNotifications,
  isAnalyzing,
}: LiveNotificationStreamProps) {
  const [notifications, setNotifications] = useState<LiveNotificationItem[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const simIndexRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Manual Quick Input
  const [manualSender, setManualSender] = useState('');
  const [manualText, setManualText] = useState('');
  const [manualApp, setManualApp] = useState<'whatsapp' | 'telegram' | 'discord' | 'email' | 'slack'>('whatsapp');

  // Handle Simulation
  useEffect(() => {
    if (isSimulating) {
      timerRef.current = setInterval(() => {
        const template = SIMULATED_STREAM_EVENTS[simIndexRef.current % SIMULATED_STREAM_EVENTS.length];
        simIndexRef.current++;

        const newNotif: LiveNotificationItem = {
          ...template,
          id: `sim-${Date.now()}-${Math.random()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        };

        setNotifications((prev) => [newNotif, ...prev]);
      }, 3500);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isSimulating]);

  function handleAddManual(e: React.FormEvent) {
    e.preventDefault();
    if (!manualText.trim()) return;

    const newNotif: LiveNotificationItem = {
      id: `manual-${Date.now()}`,
      app: manualApp,
      sender: manualSender.trim() || `${manualApp.toUpperCase()} Contact`,
      text: manualText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      isUrgent: /urgent|asap|deadline|jaldi|blocker/i.test(manualText),
    };

    setNotifications((prev) => [newNotif, ...prev]);
    setManualText('');
  }

  function handleSummarizeStream() {
    if (notifications.length === 0) return;

    // Convert live notifications into Message objects
    const converted: Message[] = notifications.map((n, idx) => ({
      id: `notif-${idx}-${Date.now()}`,
      chatId: 'live-stream',
      sender: `${n.sender} [${n.app.toUpperCase()}]`,
      timestamp: new Date().toISOString(),
      rawTimestamp: n.timestamp,
      text: n.text,
      isSystem: false,
      isMention: n.text.toLowerCase().includes('partha') || n.text.toLowerCase().includes('me'),
      hasQuestionForMe: n.text.includes('?'),
      priorityScore: n.isUrgent ? 85 : 30,
      priorityLevel: n.isUrgent ? 'high' : 'low',
      priorityReason: n.isUrgent ? 'Live urgent notification' : 'Live stream notification',
    }));

    onSummarizeNotifications(converted);
  }

  function handleCopyWebhook() {
    const curl = `curl -X POST http://localhost:3000/api/notifications \\
  -H "Content-Type: application/json" \\
  -d '{"app": "telegram", "sender": "Rohan", "text": "Bhai check the PR urgently!"}'`;
    navigator.clipboard.writeText(curl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  }

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl glass-panel space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="relative p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Radio className="w-5 h-5 animate-pulse" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-purple-400 animate-ping"></span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white">Real-Time Notification Reader & Streamer</h2>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-purple-500/15 text-purple-300 rounded-full border border-purple-500/30">
                Live Ingestion Feed
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Aggregates live notifications from WhatsApp, Telegram, Discord, Slack & Email into a consolidated catch-up
            </p>
          </div>
        </div>

        {/* Live Stream Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsSimulating(!isSimulating)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
              isSimulating
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 hover:bg-rose-500/30'
                : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
            }`}
          >
            {isSimulating ? (
              <>
                <Square className="w-3.5 h-3.5 fill-rose-300" />
                <span>Pause Live Stream</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-emerald-300" />
                <span>Simulate Live Incoming Feed</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleSummarizeStream}
            disabled={notifications.length === 0 || isAnalyzing}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-lg shadow-md transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Summarize Live Feed ({notifications.length})</span>
          </button>
        </div>
      </div>

      {/* Manual Quick Injector Form */}
      <form onSubmit={handleAddManual} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row gap-2">
        <select
          value={manualApp}
          onChange={(e) => setManualApp(e.target.value as any)}
          className="px-2.5 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-slate-200 text-xs focus:outline-none"
        >
          <option value="whatsapp">WhatsApp</option>
          <option value="telegram">Telegram</option>
          <option value="discord">Discord</option>
          <option value="slack">Slack</option>
          <option value="email">Email</option>
        </select>

        <input
          type="text"
          value={manualSender}
          onChange={(e) => setManualSender(e.target.value)}
          placeholder="Sender name (e.g. Boss, Rohan)"
          className="px-3 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-slate-200 text-xs focus:outline-none sm:w-44"
        />

        <input
          type="text"
          value={manualText}
          onChange={(e) => setManualText(e.target.value)}
          placeholder="Type live notification text... (e.g. 'Can we do the demo today at 4 PM?')"
          className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-slate-200 text-xs focus:outline-none"
        />

        <button
          type="submit"
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition self-end sm:self-auto"
        >
          <Send className="w-3.5 h-3.5 text-purple-400" />
          <span>Inject</span>
        </button>
      </form>

      {/* Live Feed Stream Box */}
      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-xs bg-slate-950/40 rounded-xl border border-slate-850">
            No live notifications in buffer. Click <strong className="text-emerald-400">&quot;Simulate Live Incoming Feed&quot;</strong> above to watch notifications arrive in real-time, or inject a test message!
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-2.5 rounded-xl border text-xs flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top-1 transition ${
                n.isUrgent
                  ? 'bg-rose-950/30 border-rose-500/30 text-rose-200'
                  : 'bg-slate-950/60 border-slate-850 text-slate-300'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono ${getAppBadgeColor(n.app)}`}>
                  {n.app}
                </span>

                <div>
                  <div className="flex items-center gap-2">
                    <strong className="text-slate-200 font-medium">{n.sender}</strong>
                    <span className="text-[10px] text-slate-500 font-mono">{n.timestamp}</span>
                    {n.isUrgent && (
                      <span className="flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-rose-500/20 text-rose-300">
                        <Zap className="w-2.5 h-2.5" />
                        Urgent
                      </span>
                    )}
                  </div>
                  <p className="text-slate-300 mt-0.5">{n.text}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Webhook API & Architecture Integration Strip */}
      <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <span>Local Webhook Endpoint:</span>
          <code className="text-purple-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 font-mono">
            POST /api/notifications
          </code>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyWebhook}
            className="flex items-center gap-1 text-slate-400 hover:text-white transition"
          >
            {copiedWebhook ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copiedWebhook ? 'Copied cURL' : 'Copy cURL command'}</span>
          </button>

          {notifications.length > 0 && (
            <button
              onClick={() => setNotifications([])}
              className="text-slate-500 hover:text-rose-400 transition flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear Feed</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function getAppBadgeColor(app: string): string {
  switch (app) {
    case 'whatsapp':
      return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
    case 'telegram':
      return 'bg-sky-500/20 text-sky-300 border border-sky-500/30';
    case 'discord':
      return 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30';
    case 'slack':
      return 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
    case 'email':
      return 'bg-rose-500/20 text-rose-300 border border-rose-500/30';
    case 'linkedin':
      return 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
    default:
      return 'bg-slate-800 text-slate-400';
  }
}
