'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, HardDrive, Server, Database, CloudOff, Trash2, CheckCircle2, X } from 'lucide-react';
import { getStorageStats, clearAllLocalData } from '@/lib/db';
import { isSupabaseConfigured } from '@/lib/supabaseClient';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataPurged?: () => void;
}

export function PrivacyModal({ isOpen, onClose, onDataPurged }: PrivacyModalProps) {
  const [stats, setStats] = useState({
    chatsCount: 0,
    messagesCount: 0,
    actionItemsCount: 0,
    decisionsCount: 0,
    deadlinesCount: 0,
    summariesCount: 0,
  });
  const [isPurging, setIsPurging] = useState(false);
  const [purgedMessage, setPurgedMessage] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadStats();
    }
  }, [isOpen]);

  async function loadStats() {
    const s = await getStorageStats();
    setStats(s);
  }

  async function handlePurge() {
    if (confirm('Are you sure you want to completely erase all local chats, messages, and action items from this browser?')) {
      setIsPurging(true);
      await clearAllLocalData();
      await loadStats();
      setIsPurging(false);
      setPurgedMessage(true);
      setTimeout(() => setPurgedMessage(false), 3000);
      if (onDataPurged) onDataPurged();
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-750 rounded-2xl shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Privacy Architecture & Data Isolation</h2>
              <p className="text-xs text-slate-400">100% Local-First Guarantee: Chat transcripts NEVER leave your machine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto space-y-6 py-4 pr-1">
          {/* Architecture Visual Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Box 1: Browser IndexedDB */}
            <div className="p-4 rounded-xl bg-slate-800/60 border border-emerald-500/30 flex flex-col">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm mb-2">
                <HardDrive className="w-4 h-4" />
                <span>Browser IndexedDB</span>
              </div>
              <p className="text-xs text-slate-300 flex-1">
                Raw WhatsApp chat text, parsed messages, summaries, action items, and deadlines are stored exclusively here.
              </p>
              <div className="mt-3 pt-2 border-t border-slate-750 text-[11px] text-emerald-300 font-mono">
                Storage: 100% On-Device
              </div>
            </div>

            {/* Box 2: Localhost Node Backend */}
            <div className="p-4 rounded-xl bg-slate-800/60 border border-blue-500/30 flex flex-col">
              <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm mb-2">
                <Server className="w-4 h-4" />
                <span>Localhost Backend</span>
              </div>
              <p className="text-xs text-slate-300 flex-1">
                Stateless runner. Receives text over 127.0.0.1, runs local Ollama or rule-based fallback, and logs zero content.
              </p>
              <div className="mt-3 pt-2 border-t border-slate-750 text-[11px] text-blue-300 font-mono">
                Memory Only • No Disk Logs
              </div>
            </div>

            {/* Box 3: Supabase */}
            <div className="p-4 rounded-xl bg-slate-800/60 border border-purple-500/30 flex flex-col">
              <div className="flex items-center gap-2 text-purple-400 font-semibold text-sm mb-2">
                <Database className="w-4 h-4" />
                <span>Supabase (Postgres)</span>
              </div>
              <p className="text-xs text-slate-300 flex-1">
                Stores ONLY non-content: profile, nicknames for mention tagging, theme, and keyword preferences. Row Level Security enforced.
              </p>
              <div className="mt-3 pt-2 border-t border-slate-750 text-[11px] text-purple-300 font-mono">
                {isSupabaseConfigured ? 'Connected (RLS Enabled)' : 'Local / Guest Mode'}
              </div>
            </div>
          </div>

          {/* Cloud Zero Telemetry Callout */}
          <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/20 flex items-start gap-3">
            <CloudOff className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <div className="font-semibold text-emerald-300">Zero Cloud LLM & Zero Telemetry Guarantee</div>
              <p className="text-slate-300">
                No OpenAI, Anthropic, or external cloud AI endpoints are ever called. If you disconnect your Wi-Fi, the entire summarization and deadline extraction pipeline will execute without errors.
              </p>
            </div>
          </div>

          {/* Live Browser Storage Inspector */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Live On-Device Storage Inspector (IndexedDB)
              </h3>
              <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Active Database: WhatDidIMissDB
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-lg font-bold text-white font-mono">{stats.messagesCount}</div>
                <div className="text-slate-400 text-[11px]">Parsed Messages</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-lg font-bold text-white font-mono">{stats.actionItemsCount}</div>
                <div className="text-slate-400 text-[11px]">Action Items</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-lg font-bold text-white font-mono">{stats.deadlinesCount}</div>
                <div className="text-slate-400 text-[11px]">Deadlines</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-lg font-bold text-white font-mono">{stats.decisionsCount}</div>
                <div className="text-slate-400 text-[11px]">Decisions</div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-xs text-slate-400">
                Want to remove all stored data from this device?
              </div>
              <button
                onClick={handlePurge}
                disabled={isPurging || stats.messagesCount === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isPurging ? 'Purging...' : 'Purge All Data'}</span>
              </button>
            </div>

            {purgedMessage && (
              <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                All browser storage cleared successfully!
              </div>
            )}
          </div>

          {/* Network Tab Proof Guide */}
          <div className="text-xs text-slate-400 space-y-1.5 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            <div className="font-semibold text-slate-300">How Hackathon Judges Can Verify:</div>
            <ol className="list-decimal list-inside space-y-1 pl-1">
              <li>Open Browser DevTools (<kbd className="px-1 py-0.5 bg-slate-800 rounded text-slate-200">F12</kbd>) → Network tab.</li>
              <li>Filter by &quot;Fetch / XHR&quot; and click &quot;Analyze What I Missed&quot;.</li>
              <li>Observe requests: only <code className="text-emerald-300">http://localhost:3000/api/analyze</code> (or 100% in-browser rules) is invoked. Zero outbound calls to foreign domains!</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition"
          >
            Close Privacy Panel
          </button>
        </div>
      </div>
    </div>
  );
}
