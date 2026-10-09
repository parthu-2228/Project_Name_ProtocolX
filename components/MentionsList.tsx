'use client';

import React from 'react';
import { MentionItem } from '@/types/chat';
import { AtSign, MessageCircle, ArrowRight } from 'lucide-react';

interface MentionsListProps {
  mentions: MentionItem[];
  onSelectMessage: (messageId: string) => void;
}

export function MentionsList({ mentions, onSelectMessage }: MentionsListProps) {
  if (!mentions || mentions.length === 0) {
    return (
      <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl glass-panel">
        <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
          <AtSign className="w-4 h-4 text-purple-400" />
          Mentions & Direct Inquiries
        </h2>
        <p className="text-xs text-slate-500">No direct @mentions or questions addressed to your handle.</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl glass-panel">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <AtSign className="w-4 h-4 text-purple-400" />
            Mentions & Direct Inquiries
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Messages addressing you specifically via name or configured nicknames
          </p>
        </div>
        <span className="text-xs font-mono text-purple-300 px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20">
          {mentions.length} Mentions
        </span>
      </div>

      <div className="space-y-2.5">
        {mentions.map((m) => (
          <div
            key={m.id}
            onClick={() => onSelectMessage(m.messageId)}
            className="group p-3 rounded-xl bg-slate-950/60 border border-purple-500/20 hover:border-purple-500/50 hover:bg-slate-950/90 transition cursor-pointer flex flex-col gap-2"
          >
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-purple-300">{m.sender}</span>
                <span className="text-[10px] text-slate-500 font-mono">{m.timestamp}</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 font-mono">
                matched: &quot;{m.matchedNickname}&quot;
              </span>
            </div>

            <p className="text-xs text-slate-200 line-clamp-2">
              &quot;{m.text}&quot;
            </p>

            <div className="flex justify-end pt-1">
              <span className="flex items-center gap-1 text-[11px] text-slate-400 group-hover:text-purple-300 transition font-medium">
                Jump to message
                <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
