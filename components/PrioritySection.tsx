'use client';

import React from 'react';
import { Message } from '@/types/chat';
import { AlertTriangle, ArrowRight, UserCheck, HelpCircle, Flame } from 'lucide-react';

interface PrioritySectionProps {
  urgentMessages: Message[];
  onSelectMessage: (messageId: string) => void;
}

export function PrioritySection({ urgentMessages, onSelectMessage }: PrioritySectionProps) {
  if (!urgentMessages || urgentMessages.length === 0) {
    return (
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
        <p className="text-xs text-slate-400">No critically urgent items detected in this chat segment.</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl glass-panel">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              High Priority & Urgent Items
              <span className="px-2 py-0.5 text-[10px] font-mono bg-rose-500/20 text-rose-300 rounded-full border border-rose-500/30">
                Score &ge; 70
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">Ranked by urgency keywords, mentions, questions, and deadlines</p>
          </div>
        </div>
      </div>

      {/* Grid of Urgent Cards */}
      <div className="space-y-3">
        {urgentMessages.map((msg) => (
          <div
            key={msg.id}
            onClick={() => onSelectMessage(msg.id)}
            className="group p-3.5 rounded-xl bg-slate-950/60 border border-rose-500/20 hover:border-rose-500/50 hover:bg-slate-950/80 transition cursor-pointer relative"
          >
            {/* Top row: Sender, Timestamp, Priority Score */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[11px] font-bold text-slate-300">
                  {msg.sender.substring(0, 2).toUpperCase()}
                </span>
                <span className="text-xs font-bold text-slate-200">{msg.sender}</span>
                <span className="text-[10px] text-slate-500 font-mono">{msg.rawTimestamp}</span>

                {msg.isMention && (
                  <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                    <UserCheck className="w-2.5 h-2.5" />
                    Mention
                  </span>
                )}

                {msg.hasQuestionForMe && (
                  <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                    <HelpCircle className="w-2.5 h-2.5" />
                    Question
                  </span>
                )}
              </div>

              {/* Score pill */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono font-bold text-rose-400">
                  {msg.priorityScore}/100
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  HIGH
                </span>
              </div>
            </div>

            {/* Message Snippet */}
            <p className="text-xs text-slate-300 font-sans line-clamp-2 pl-8 border-l-2 border-rose-500/40 ml-1">
              &quot;{msg.text}&quot;
            </p>

            {/* Why This Matters Line */}
            {msg.priorityReason && (
              <div className="mt-2.5 pt-2 border-t border-slate-850 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 text-amber-300/90">
                  <AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0" />
                  <span className="font-medium">Why this matters:</span>
                  <span className="text-slate-300">{msg.priorityReason}</span>
                </div>

                <span className="flex items-center gap-1 text-[11px] text-slate-400 group-hover:text-emerald-400 transition font-medium">
                  Jump to chat
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
