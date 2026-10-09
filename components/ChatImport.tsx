'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileText, Sparkles, RefreshCw, AlertCircle, PlayCircle, Zap, Globe } from 'lucide-react';
import { PlatformSource } from '@/lib/universalParser';

interface ChatImportProps {
  onAnalyze: (chatText: string, source: PlatformSource) => void;
  isAnalyzing: boolean;
  aiMode: 'smart' | 'quick';
}

export function ChatImport({ onAnalyze, isAnalyzing, aiMode }: ChatImportProps) {
  const [text, setText] = useState('');
  const [selectedSource, setSelectedSource] = useState<PlatformSource>('auto');
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const lineCount = text ? text.split('\n').filter((l) => l.trim()).length : 0;
  const charCount = text.length;

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setText(content || '');
    };
    reader.readAsText(file);
  }

  async function handleLoadSample(preset: 'whatsapp' | 'telegram' | 'discord' | 'email') {
    try {
      setError(null);
      let url = '/sample-chat.txt';
      let name = 'WhatsApp_Sprint_Export.txt';

      if (preset === 'telegram') {
        url = '/samples/telegram-chat.txt';
        name = 'Telegram_Group_Export.txt';
      } else if (preset === 'discord') {
        url = '/samples/discord-chat.txt';
        name = 'Discord_Channel_Export.txt';
      } else if (preset === 'email') {
        url = '/samples/email-thread.txt';
        name = 'Email_Thread_Forward.txt';
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error('Could not load sample file');
      const sampleText = await res.text();
      setText(sampleText);
      setFileName(name);
      setSelectedSource(preset);
    } catch {
      setError('Failed to load sample preset file.');
    }
  }

  function handleTriggerAnalyze() {
    if (!text.trim()) {
      setError('Please paste conversation text or load a sample first.');
      return;
    }
    setError(null);
    onAnalyze(text, selectedSource);
  }

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl glass-panel">
      {/* Title & Actions Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            Universal Conversation Ingestion
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Summarize chats and threads from WhatsApp, Telegram, Discord, Slack, Email, LinkedIn & Instagram.
          </p>
        </div>

        {/* 1-Click Platform Sample Presets */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-slate-500 font-medium">Load Preset:</span>
          <button
            type="button"
            onClick={() => handleLoadSample('whatsapp')}
            disabled={isAnalyzing}
            className="px-2 py-1 rounded-md text-[11px] font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition"
          >
            WhatsApp
          </button>
          <button
            type="button"
            onClick={() => handleLoadSample('telegram')}
            disabled={isAnalyzing}
            className="px-2 py-1 rounded-md text-[11px] font-semibold bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 transition"
          >
            Telegram
          </button>
          <button
            type="button"
            onClick={() => handleLoadSample('discord')}
            disabled={isAnalyzing}
            className="px-2 py-1 rounded-md text-[11px] font-semibold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 transition"
          >
            Discord
          </button>
          <button
            type="button"
            onClick={() => handleLoadSample('email')}
            disabled={isAnalyzing}
            className="px-2 py-1 rounded-md text-[11px] font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition"
          >
            Email
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.eml,.csv"
            onChange={handleFileUpload}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzing}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 transition"
          >
            <Upload className="w-3 h-3 text-slate-400" />
            <span>{fileName ? 'File Loaded' : 'Upload'}</span>
          </button>
        </div>
      </div>

      {/* Source Selector Pills */}
      <div className="flex items-center gap-1.5 mb-2.5 overflow-x-auto pb-1 text-[11px]">
        <span className="text-slate-500 font-medium">Source Mode:</span>
        {(['auto', 'whatsapp', 'telegram', 'discord', 'slack', 'email', 'generic'] as PlatformSource[]).map((src) => (
          <button
            key={src}
            type="button"
            onClick={() => setSelectedSource(src)}
            className={`px-2 py-0.5 rounded capitalize transition ${
              selectedSource === src
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200 bg-slate-950/40 border border-slate-800'
            }`}
          >
            {src === 'auto' ? 'Auto-Detect' : src}
          </button>
        ))}
      </div>

      {/* Text Area */}
      <div className="relative">
        <textarea
          rows={6}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (error) setError(null);
          }}
          placeholder="Paste conversation or message thread here...
Supported formats:
• WhatsApp: [10/09/26, 9:20 AM] Rohan: Can you review by 5 PM?
• Telegram: Rohan, [09.10.26 14:08] \n Need PR review
• Discord: DevLead — 10/09/2026 1:25 PM \n Database migration needed
• Slack: Alex [10:30 AM] \n Deploying build
• Email: From: manager@company.com \n Subject: Roadmap Signoff"
          className="w-full p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-200 placeholder:text-slate-600 font-mono text-xs focus:outline-none focus:border-emerald-500/70 transition resize-y leading-relaxed"
        />

        {fileName && (
          <div className="absolute top-2 right-3 text-[11px] bg-slate-800/80 px-2 py-0.5 rounded text-emerald-300 font-mono border border-slate-700">
            {fileName}
          </div>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mt-3 p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Bottom Bar: Stats + Submit CTA */}
      <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800/70">
        <div className="flex items-center gap-4 text-xs text-slate-400 font-mono">
          <span>
            <strong className="text-slate-200">{lineCount}</strong> raw lines
          </span>
          <span>•</span>
          <span>
            <strong className="text-slate-200">{charCount.toLocaleString()}</strong> characters
          </span>
          {text.length > 0 && (
            <button
              onClick={() => {
                setText('');
                setFileName(null);
              }}
              className="text-slate-500 hover:text-slate-300 underline text-[11px] ml-2"
            >
              Clear
            </button>
          )}
        </div>

        {/* CTA Button */}
        <button
          type="button"
          onClick={handleTriggerAnalyze}
          disabled={isAnalyzing || !text.trim()}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-900/40 hover:shadow-emerald-700/50 transition-all transform active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {isAnalyzing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
              <span>Analyzing On-Device...</span>
            </>
          ) : (
            <>
              {aiMode === 'smart' ? (
                <Sparkles className="w-4 h-4 text-emerald-200" />
              ) : (
                <Zap className="w-4 h-4 text-amber-200" />
              )}
              <span>Analyze What I Missed</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
