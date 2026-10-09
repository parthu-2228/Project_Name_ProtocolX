'use client';

import React, { useState } from 'react';
import { CatchUpSummary } from '@/types/chat';
import { Copy, Check, Download, Layers, Clock, Zap, Cpu } from 'lucide-react';

interface SummaryCardProps {
  summary: CatchUpSummary;
  processedWith: 'ollama' | 'rules';
  modelUsed?: string;
  processingTimeMs: number;
  totalMessages: number;
}

export function SummaryCard({
  summary,
  processedWith,
  modelUsed,
  processingTimeMs,
  totalMessages,
}: SummaryCardProps) {
  const [copied, setCopied] = useState(false);

  function handleCopyMarkdown() {
    const md = `# Catch-Up Summary (What Did I Miss?)\n\n## 5-Line Executive TL;DR\n${summary.tldr
      .map((line, idx) => `${idx + 1}. ${line}`)
      .join('\n')}\n\n## Topic Breakdown\n${summary.topics
      .map((t) => `### ${t.topic}\n${t.points.map((p) => `- ${p}`).join('\n')}`)
      .join('\n\n')}`;

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const textContent = `WHAT DID I MISS? — CHAT SUMMARY\nGenerated: ${new Date().toLocaleString()}\nMessages Processed: ${totalMessages}\nEngine: ${processedWith === 'ollama' ? 'Local LLM (Ollama)' : 'Rule-Based NLP Engine'}\n\n=========================================\n5-LINE EXECUTIVE TL;DR\n=========================================\n${summary.tldr
      .map((l, i) => `[${i + 1}] ${l}`)
      .join('\n')}\n\n=========================================\nKEY TOPICS & DECISIONS\n=========================================\n${summary.topics
      .map((t) => `[${t.topic.toUpperCase()}]\n${t.points.map((p) => `• ${p}`).join('\n')}`)
      .join('\n\n')}`;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `WhatDidIMiss_Summary_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl glass-panel relative overflow-hidden">
      {/* Decorative gradient glow top border */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500"></div>

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white tracking-tight">Executive Catch-Up TL;DR</h2>
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
              5 Key Highlights
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Synthesized overview of all unread developments, consensus, and deliverables
          </p>
        </div>

        {/* Engine Metadata + Copy buttons */}
        <div className="flex items-center gap-2">
          {/* Performance Pill */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 font-mono">
            {processedWith === 'ollama' ? (
              <span className="flex items-center gap-1 text-blue-400">
                <Cpu className="w-3 h-3" />
                <span>{modelUsed || 'Ollama'}</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-400">
                <Zap className="w-3 h-3" />
                <span>Rules Fallback</span>
              </span>
            )}
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-500" />
              <span>{processingTimeMs}ms</span>
            </span>
          </div>

          <button
            onClick={handleCopyMarkdown}
            title="Copy as Markdown"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handleDownload}
            title="Download Summary Text"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 5-Line TL;DR Points */}
      <div className="mt-5 space-y-3">
        {summary.tldr.map((line, index) => (
          <div
            key={index}
            className="flex items-start gap-3.5 p-3 rounded-xl bg-slate-950/50 border border-slate-850 hover:border-slate-800 transition"
          >
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-400 font-bold text-xs flex-shrink-0 border border-emerald-500/20 font-mono">
              {index + 1}
            </div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">{line}</p>
          </div>
        ))}
      </div>

      {/* Per-Topic Deep Dive Bullets */}
      {summary.topics && summary.topics.length > 0 && (
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            Topic Breakdown
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {summary.topics.map((t, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-850 flex flex-col">
                <h4 className="text-xs font-bold text-slate-200 mb-2 text-emerald-300">
                  {t.topic}
                </h4>
                <ul className="space-y-1.5 flex-1">
                  {t.points.map((p, pIdx) => (
                    <li key={pIdx} className="text-xs text-slate-300 flex items-start gap-2">
                      <span className="text-emerald-500 mt-1">•</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
