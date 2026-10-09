'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { ChatImport } from '@/components/ChatImport';
import { SummaryCard } from '@/components/SummaryCard';
import { PrioritySection } from '@/components/PrioritySection';
import { ActionItemsList } from '@/components/ActionItemsList';
import { DeadlinesTimeline } from '@/components/DeadlinesTimeline';
import { DecisionsList } from '@/components/DecisionsList';
import { MentionsList } from '@/components/MentionsList';
import { ChatTranscriptDrawer } from '@/components/ChatTranscriptDrawer';
import { PrivacyModal } from '@/components/PrivacyModal';
import { SettingsModal } from '@/components/SettingsModal';
import { EmergencyTriageCard } from '@/components/EmergencyTriageCard';
import { AuthGuard } from '@/components/AuthGuard';

import {
  Message,
  ActionItem,
  Decision,
  DeadlineItem,
  MentionItem,
  AnalysisResult,
  UserSettings,
  DEFAULT_USER_SETTINGS,
} from '@/types/chat';
import { AuthUser, signOut as authSignOut, clearLocalSession } from '@/lib/auth';
import { parseUniversalContent, PlatformSource } from '@/lib/universalParser';
import { LiveNotificationStream } from '@/components/LiveNotificationStream';
import { analyzeChatWithRules } from '@/lib/ruleEngine';
import {
  saveChatAnalysis,
  toggleActionItemCompleted,
  getLocalSettings,
  db,
} from '@/lib/db';
import { recordAnonymousStat } from '@/lib/supabaseClient';
import {
  Sparkles,
  Calendar,
  CheckSquare,
  CheckCircle,
  AtSign,
  Flame,
  MessageSquare,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Radio,
  FileText,
  Zap,
} from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [messages, setMessages] = useState<Message[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isOllamaAvailable, setIsOllamaAvailable] = useState(false);

  // Ingestion Mode: 'universal' (Paste / File) or 'live' (Real-time Notification Stream)
  const [ingestionMode, setIngestionMode] = useState<'universal' | 'live'>('universal');

  // Modals & Drawers
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);
  const [highlightMessageId, setHighlightMessageId] = useState<string | null>(null);

  // Active view tab in dashboard
  const [activeTab, setActiveTab] = useState<'overview' | 'urgent' | 'actions' | 'deadlines' | 'decisions' | 'mentions'>('overview');

  // Load settings and check backend health on mount
  useEffect(() => {
    async function init() {
      // 1. Load local user settings
      const s = await getLocalSettings();
      setSettings(s);

      // 2. Check Ollama server health
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          const data = await res.json();
          setIsOllamaAvailable(data.ai?.ollamaConnected || false);
        }
      } catch {
        setIsOllamaAvailable(false);
      }

      // 3. Load latest chat analysis from IndexedDB if present
      try {
        const latestChat = await db.chats.orderBy('createdAt').last();
        if (latestChat) {
          const storedMessages = await db.messages.where('chatId').equals(latestChat.id).toArray();
          const storedActions = await db.actionItems.where('chatId').equals(latestChat.id).toArray();
          const storedDecisions = await db.decisions.where('chatId').equals(latestChat.id).toArray();
          const storedDeadlines = await db.deadlines.where('chatId').equals(latestChat.id).toArray();
          const storedSummary = await db.summaries.get(latestChat.id);

          if (storedMessages.length > 0 && storedSummary) {
            setMessages(storedMessages);
            const mentions = storedMessages
              .filter((m) => m.isMention)
              .map((m) => ({
                id: `mention-${m.id}`,
                chatId: latestChat.id,
                messageId: m.id,
                sender: m.sender,
                text: m.text,
                timestamp: m.rawTimestamp,
                matchedNickname: settings.displayName,
              }));

            setAnalysis({
              summary: storedSummary.summary,
              actionItems: storedActions,
              decisions: storedDecisions,
              deadlines: storedDeadlines,
              mentions,
              processedWith: storedSummary.processedWith as any,
              modelUsed: storedSummary.modelUsed,
              processingTimeMs: storedSummary.processingTimeMs,
              totalMessages: storedMessages.length,
            });
          }
        }
      } catch (err) {
        console.warn('Error reading past chat from IndexedDB:', err);
      }
    }
    init();
  }, []);

  // Handle Universal Content Analysis (WhatsApp, Telegram, Discord, Slack, Email, etc.)
  async function handleAnalyze(rawChatText: string, preferredSource: PlatformSource = 'auto') {
    setIsAnalyzing(true);
    const chatId = `chat-${Date.now()}`;

    try {
      // Universal multi-source parsing
      const { messages: parsedMsgs } = parseUniversalContent(rawChatText, preferredSource, chatId);

      if (parsedMsgs.length === 0) {
        alert('No valid messages found in the input. Please check the conversation format.');
        setIsAnalyzing(false);
        return;
      }

      await runAnalysisPipeline(parsedMsgs, rawChatText, chatId);
    } catch (err: any) {
      console.error('Analysis failed:', err);
      alert('Error analyzing conversation: ' + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  }

  // Handle Live Notification Stream Batch Analysis
  async function handleSummarizeLiveNotifications(streamMessages: Message[]) {
    if (streamMessages.length === 0) return;
    setIsAnalyzing(true);
    const chatId = `live-${Date.now()}`;
    const rawText = streamMessages.map((m) => `[${m.rawTimestamp}] ${m.sender}: ${m.text}`).join('\n');

    try {
      await runAnalysisPipeline(streamMessages, rawText, chatId);
    } catch (err: any) {
      console.error('Live analysis failed:', err);
      alert('Error summarizing live notifications: ' + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  }

  // Common local execution pipeline
  async function runAnalysisPipeline(parsedMsgs: Message[], rawText: string, chatId: string) {
    setMessages(parsedMsgs);

    let result: AnalysisResult;

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: parsedMsgs,
          settings,
          mode: settings.aiMode,
          chatId,
        }),
      });

      if (res.ok) {
        result = await res.json();
      } else {
        throw new Error('API route returned status ' + res.status);
      }
    } catch (networkErr) {
      console.warn('Backend unavailable, running 100% in-browser rule NLP engine:', networkErr);
      result = analyzeChatWithRules(parsedMsgs, settings, chatId);
    }

    // Save strictly to browser IndexedDB
    await saveChatAnalysis(
      chatId,
      `Conversation (${new Date().toLocaleTimeString()})`,
      rawText,
      parsedMsgs,
      result.actionItems,
      result.decisions,
      result.deadlines,
      result.summary,
      result.processedWith,
      result.processingTimeMs,
      result.modelUsed
    );

    await recordAnonymousStat(parsedMsgs.length, result.processedWith);
    setAnalysis(result);
  }

  // Handle action item completion toggle
  async function handleToggleAction(actionId: string, currentStatus: boolean) {
    await toggleActionItemCompleted(actionId, currentStatus);
    setAnalysis((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        actionItems: prev.actionItems.map((a) =>
          a.id === actionId ? { ...a, completed: !currentStatus } : a
        ),
      };
    });
  }

  // Open Chat transcript drawer and jump to specific message
  function handleSelectMessage(messageId: string) {
    setHighlightMessageId(messageId);
    setIsTranscriptOpen(true);
  }

  function handleToggleAiMode() {
    const newMode = settings.aiMode === 'smart' ? 'quick' : 'smart';
    setSettings((prev) => ({ ...prev, aiMode: newMode }));
  }

  function handleToggleTheme() {
    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
    setSettings((prev) => ({ ...prev, theme: nextTheme }));
    if (typeof document !== 'undefined') {
      if (nextTheme === 'light') {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      } else {
        document.documentElement.classList.remove('light');
        document.documentElement.classList.add('dark');
      }
    }
  }

  async function handleSignOut() {
    clearLocalSession();
    await authSignOut();
    router.replace('/login');
  }

  const urgentMessages = messages.filter((m) => m.priorityLevel === 'high');

  return (
    <AuthGuard onUserResolved={setCurrentUser}>
      {(user) => (
    <div className={`min-h-screen ${settings.theme === 'light' ? 'light' : 'dark'} flex flex-col bg-slate-950 text-slate-100`}>
      {/* Global Navigation Header */}
      <Header
        settings={settings}
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleAiMode={handleToggleAiMode}
        onToggleTheme={handleToggleTheme}
        isOllamaAvailable={isOllamaAvailable}
        user={user}
        onSignOut={handleSignOut}
      />

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Ingestion Mode Toggle Strip */}
        <section className="flex items-center justify-between border-b border-slate-850 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIngestionMode('universal')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                ingestionMode === 'universal'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Universal Multi-Platform Import</span>
            </button>

            <button
              onClick={() => setIngestionMode('live')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                ingestionMode === 'live'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Real-Time Notification Reader</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-500 font-mono">
            <span>Sources: WhatsApp • Telegram • Discord • Slack • Email • LinkedIn</span>
          </div>
        </section>

        {/* Input Ingestion Box (Universal or Live Stream) */}
        <section>
          {ingestionMode === 'universal' ? (
            <ChatImport
              onAnalyze={handleAnalyze}
              isAnalyzing={isAnalyzing}
              aiMode={settings.aiMode}
            />
          ) : (
            <LiveNotificationStream
              onSummarizeNotifications={handleSummarizeLiveNotifications}
              isAnalyzing={isAnalyzing}
            />
          )}
        </section>

        {/* Dashboard Section (Active if chat has been analyzed) */}
        {analysis && (
          <section className="space-y-6 animate-in fade-in duration-300">
            {/* 30-Second Emergency Triage Card (Top Urgent Action Bar) */}
            <EmergencyTriageCard
              urgentMessages={urgentMessages}
              actionItems={analysis.actionItems}
              deadlines={analysis.deadlines}
              mentions={analysis.mentions}
              userName={settings.displayName}
              myNames={[settings.displayName, ...settings.nicknames]}
              onSelectMessage={handleSelectMessage}
              onToggleTask={handleToggleAction}
            />

            {/* Top Row: Executive TL;DR Summary */}
            <SummaryCard
              summary={analysis.summary}
              processedWith={analysis.processedWith}
              modelUsed={analysis.modelUsed}
              processingTimeMs={analysis.processingTimeMs}
              totalMessages={analysis.totalMessages}
            />

            {/* Quick Navigation Tabs & Chat Transcript Opener */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
                {/* Dedicated SOS Urgent Only Tab */}
                <button
                  onClick={() => setActiveTab('urgent')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
                    activeTab === 'urgent'
                      ? 'bg-rose-500 text-white shadow-lg shadow-rose-900/50'
                      : 'text-rose-400 hover:text-rose-300 bg-rose-500/10 border border-rose-500/30'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 animate-pulse" />
                  <span>🔥 Urgent Only ({urgentMessages.length + analysis.actionItems.filter(a => !a.completed).length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('overview')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                    activeTab === 'overview'
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Overview</span>
                </button>

                <button
                  onClick={() => setActiveTab('actions')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                    activeTab === 'actions'
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Actions ({analysis.actionItems.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('deadlines')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                    activeTab === 'deadlines'
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Timeline ({analysis.deadlines.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('decisions')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                    activeTab === 'decisions'
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Decisions ({analysis.decisions.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('mentions')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                    activeTab === 'mentions'
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <AtSign className="w-3.5 h-3.5" />
                  <span>Mentions ({analysis.mentions.length})</span>
                </button>
              </div>

              {/* View Full Chat Button */}
              <button
                onClick={() => {
                  setHighlightMessageId(null);
                  setIsTranscriptOpen(true);
                }}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-white transition shadow"
              >
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>Open Full Chat ({messages.length} msgs)</span>
              </button>
            </div>

            {/* Tab Views */}
            {activeTab === 'urgent' && (
              <div className="space-y-6">
                <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-rose-400 animate-pulse" />
                    <strong>Emergency Focus Mode Active:</strong> Showing strictly high-priority blockers, tasks assigned to you, and today&apos;s deadlines.
                  </span>
                  <button
                    onClick={() => setActiveTab('overview')}
                    className="text-white hover:underline text-[11px] font-semibold"
                  >
                    View All Items &rarr;
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <PrioritySection
                    urgentMessages={urgentMessages}
                    onSelectMessage={handleSelectMessage}
                  />

                  <div className="space-y-6">
                    <ActionItemsList
                      actionItems={analysis.actionItems.filter(a => {
                        const ass = a.assignee.toLowerCase();
                        return a.urgency === 'high' || ass === 'you' || [settings.displayName, ...settings.nicknames].some(n => ass.includes(n.toLowerCase()));
                      })}
                      onToggleComplete={handleToggleAction}
                      onSelectMessage={handleSelectMessage}
                      myNames={[settings.displayName, ...settings.nicknames]}
                    />

                    <DeadlinesTimeline
                      deadlines={analysis.deadlines.filter(d => d.priority === 'high' || d.relativeText.toLowerCase().includes('today') || d.relativeText.toLowerCase().includes('tonight'))}
                      onSelectMessage={handleSelectMessage}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Urgent / High Priority Messages */}
                <div className="space-y-6">
                  <PrioritySection
                    urgentMessages={urgentMessages}
                    onSelectMessage={handleSelectMessage}
                  />

                  <MentionsList
                    mentions={analysis.mentions}
                    onSelectMessage={handleSelectMessage}
                  />
                </div>

                {/* Right: Action Items & Deadlines */}
                <div className="space-y-6">
                  <ActionItemsList
                    actionItems={analysis.actionItems}
                    onToggleComplete={handleToggleAction}
                    onSelectMessage={handleSelectMessage}
                    myNames={[settings.displayName, ...settings.nicknames]}
                  />

                  <DeadlinesTimeline
                    deadlines={analysis.deadlines}
                    onSelectMessage={handleSelectMessage}
                  />
                </div>
              </div>
            )}

            {activeTab === 'actions' && (
              <div className="max-w-4xl mx-auto">
                <ActionItemsList
                  actionItems={analysis.actionItems}
                  onToggleComplete={handleToggleAction}
                  onSelectMessage={handleSelectMessage}
                  myNames={[settings.displayName, ...settings.nicknames]}
                />
              </div>
            )}

            {activeTab === 'deadlines' && (
              <div className="max-w-4xl mx-auto">
                <DeadlinesTimeline
                  deadlines={analysis.deadlines}
                  onSelectMessage={handleSelectMessage}
                />
              </div>
            )}

            {activeTab === 'decisions' && (
              <div className="max-w-4xl mx-auto">
                <DecisionsList
                  decisions={analysis.decisions}
                  onSelectMessage={handleSelectMessage}
                />
              </div>
            )}

            {activeTab === 'mentions' && (
              <div className="max-w-4xl mx-auto">
                <MentionsList
                  mentions={analysis.mentions}
                  onSelectMessage={handleSelectMessage}
                />
              </div>
            )}
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">What Did I Miss?</span>
            <span>•</span>
            <span>Local-First AI Hackathon Project</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => setIsPrivacyOpen(true)}
              className="text-emerald-400 hover:underline flex items-center gap-1"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Privacy Manifesto
            </button>
            <span>•</span>
            <span>Zero Data Leakage Guaranteed</span>
          </div>
        </div>
      </footer>

      {/* Modals & Slide-overs */}
      <PrivacyModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
        onDataPurged={() => {
          setAnalysis(null);
          setMessages([]);
        }}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={(updated) => setSettings(updated)}
      />

      <ChatTranscriptDrawer
        isOpen={isTranscriptOpen}
        onClose={() => setIsTranscriptOpen(false)}
        messages={messages}
        highlightMessageId={highlightMessageId}
      />
    </div>
      )}
    </AuthGuard>
  );
}
