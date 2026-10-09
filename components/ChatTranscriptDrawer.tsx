'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Message } from '@/types/chat';
import { X, Search, Filter, MessageSquare, AlertCircle, User, ArrowDown } from 'lucide-react';

interface ChatTranscriptDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  highlightMessageId: string | null;
}

export function ChatTranscriptDrawer({
  isOpen,
  onClose,
  messages,
  highlightMessageId,
}: ChatTranscriptDrawerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [senderFilter, setSenderFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeMessageRef = useRef<HTMLDivElement>(null);

  const senders = Array.from(new Set(messages.map((m) => m.sender)));

  const filteredMessages = messages.filter((msg) => {
    if (senderFilter !== 'ALL' && msg.sender !== senderFilter) return false;
    if (priorityFilter === 'HIGH' && msg.priorityLevel !== 'high') return false;
    if (priorityFilter === 'MENTION' && !msg.isMention) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        msg.text.toLowerCase().includes(q) ||
        msg.sender.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Auto-scroll to highlighted message when selected
  useEffect(() => {
    if (highlightMessageId && activeMessageRef.current) {
      activeMessageRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightMessageId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Full Chat Transcript</h2>
            <p className="text-[11px] text-slate-400">
              {messages.length} total messages • Stored solely in browser IndexedDB
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-3 border-b border-slate-800 bg-slate-950/40 space-y-2 text-xs">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search transcript by keywords..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Sender filter */}
          <select
            value={senderFilter}
            onChange={(e) => setSenderFilter(e.target.value)}
            className="px-2 py-1 bg-slate-900 border border-slate-750 rounded-lg text-slate-300 text-[11px] focus:outline-none"
          >
            <option value="ALL">All Senders</option>
            {senders.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2 py-1 bg-slate-900 border border-slate-750 rounded-lg text-slate-300 text-[11px] focus:outline-none"
          >
            <option value="ALL">All Priorities</option>
            <option value="HIGH">High Priority (Urgent)</option>
            <option value="MENTION">Mentions Only</option>
          </select>
        </div>
      </div>

      {/* Messages Stream */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredMessages.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No messages match your search or filter criteria.
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const isTarget = msg.id === highlightMessageId;

            return (
              <div
                key={msg.id}
                ref={isTarget ? activeMessageRef : null}
                className={`p-3 rounded-xl border text-xs transition relative ${
                  isTarget
                    ? 'bg-emerald-950/40 border-emerald-500 shadow-md ring-2 ring-emerald-500/30'
                    : msg.priorityLevel === 'high'
                    ? 'bg-slate-950/60 border-rose-500/30'
                    : 'bg-slate-950/40 border-slate-850'
                }`}
              >
                {/* Message Header */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200">{msg.sender}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {msg.rawTimestamp}
                    </span>
                  </div>

                  {/* Priority & Mention Badges */}
                  <div className="flex items-center gap-1.5">
                    {msg.isMention && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        @MENTION
                      </span>
                    )}

                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                        msg.priorityLevel === 'high'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : msg.priorityLevel === 'medium'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {msg.priorityLevel} ({msg.priorityScore})
                    </span>
                  </div>
                </div>

                {/* Body Text */}
                <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {msg.text}
                </p>

                {/* Priority Reason Footnote */}
                {msg.priorityReason && (
                  <div className="mt-2 pt-1.5 border-t border-slate-850 text-[10px] text-slate-400 flex items-center gap-1">
                    <span className="text-emerald-400 font-semibold">Priority reason:</span>
                    <span>{msg.priorityReason}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-500">
        <span>Displaying {filteredMessages.length} of {messages.length} messages</span>
        <button
          onClick={onClose}
          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
        >
          Close Drawer
        </button>
      </div>
    </div>
  );
}
