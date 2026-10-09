'use client';

import React, { useState } from 'react';
import { Settings, User, Tag, Zap, Database, Check, X, Shield } from 'lucide-react';
import { UserSettings } from '@/types/chat';
import { isSupabaseConfigured, syncSettingsToSupabase } from '@/lib/supabaseClient';
import { saveLocalSettings } from '@/lib/db';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSave: (updated: UserSettings) => void;
}

export function SettingsModal({ isOpen, onClose, settings, onSave }: SettingsModalProps) {
  const [displayName, setDisplayName] = useState(settings.displayName);
  const [nicknames, setNicknames] = useState(settings.nicknames.join(', '));
  const [keywords, setKeywords] = useState(settings.priorityKeywords.join(', '));
  const [aiMode, setAiMode] = useState<'smart' | 'quick'>(settings.aiMode);
  const [theme, setTheme] = useState<'dark' | 'light'>(settings.theme);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  async function handleSave() {
    setSaving(true);
    const updated: UserSettings = {
      displayName: displayName.trim() || 'User',
      nicknames: nicknames
        .split(',')
        .map((n) => n.trim())
        .filter(Boolean),
      priorityKeywords: keywords
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean),
      aiMode,
      theme,
    };

    // Save locally to IndexedDB
    await saveLocalSettings(updated);

    // Sync to Supabase if configured
    if (isSupabaseConfigured) {
      await syncSettingsToSupabase('local-user', updated);
    }

    onSave(updated);
    setSaving(false);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-750 rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Detection & Profile Settings</h2>
              <p className="text-xs text-slate-400">Configure how mentions, urgency, and tasks are detected</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="space-y-4 py-4 text-xs">
          {/* Display Name */}
          <div>
            <label className="block text-slate-300 font-medium mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-400" />
              Your Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Partha"
              className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition"
            />
            <span className="text-[11px] text-slate-500">
              Used when presenting summaries and checking tasks assigned to you.
            </span>
          </div>

          {/* Nicknames for Mention Detection */}
          <div>
            <label className="block text-slate-300 font-medium mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-purple-400" />
              Nicknames & Handles (Comma-separated)
            </label>
            <input
              type="text"
              value={nicknames}
              onChange={(e) => setNicknames(e.target.value)}
              placeholder="e.g. Partha, Parth, PS, me, @partha"
              className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500 transition"
            />
            <span className="text-[11px] text-slate-500">
              Any chat message containing these words or @handles triggers an urgent mention notification.
            </span>
          </div>

          {/* Priority Keywords */}
          <div>
            <label className="block text-slate-300 font-medium mb-1.5 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Urgency Keywords & Hinglish Slang
            </label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="urgent, asap, blocker, deadline, jaldi, kal tak, eod"
              className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500 transition"
            />
            <span className="text-[11px] text-slate-500">
              Keywords that boost message priority score (0-100) and highlight critical actions.
            </span>
          </div>

          {/* AI Mode Preference */}
          <div>
            <label className="block text-slate-300 font-medium mb-1.5">
              Preferred AI Engine Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAiMode('smart')}
                className={`p-2.5 rounded-lg border text-left transition flex flex-col ${
                  aiMode === 'smart'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                    : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="font-semibold text-xs">Smart Mode (Ollama)</span>
                <span className="text-[10px] opacity-80">Local LLM with automatic rule fallback</span>
              </button>

              <button
                type="button"
                onClick={() => setAiMode('quick')}
                className={`p-2.5 rounded-lg border text-left transition flex flex-col ${
                  aiMode === 'quick'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                    : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="font-semibold text-xs">Quick Mode (Rules)</span>
                <span className="text-[10px] opacity-80">Sub-15ms NLP regex & chrono-node</span>
              </button>
            </div>
          </div>

          {/* Supabase Sync Status Card */}
          <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-purple-400" />
              <div>
                <div className="font-semibold text-slate-300 text-[11px]">Supabase Non-Content Sync</div>
                <div className="text-[10px] text-slate-500">
                  {isSupabaseConfigured
                    ? 'Connected • Syncing settings with RLS policies'
                    : 'Offline / Guest mode • Settings preserved in IndexedDB'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              <Shield className="w-3 h-3 text-emerald-400" />
              <span>RLS Enforced</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-emerald-900/30 transition disabled:opacity-50"
          >
            {savedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Saved!</span>
              </>
            ) : (
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
