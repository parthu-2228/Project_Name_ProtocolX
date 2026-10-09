'use client';

import React from 'react';
import { Decision } from '@/types/chat';
import { CheckCircle, ArrowRight, UserCheck } from 'lucide-react';

interface DecisionsListProps {
  decisions: Decision[];
  onSelectMessage: (messageId: string) => void;
}

export function DecisionsList({ decisions, onSelectMessage }: DecisionsListProps) {
  if (!decisions || decisions.length === 0) {
    return (
      <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl glass-panel">
        <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          Decisions & Agreements
        </h2>
        <p className="text-xs text-slate-500">No explicit consensus or decisions recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl glass-panel">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            Decisions & Consensus Log
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Key agreements locked in chat to avoid re-debating settled topics
          </p>
        </div>
        <span className="text-xs font-mono text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          {decisions.length} Decisions
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {decisions.map((dec) => (
          <div
            key={dec.id}
            onClick={() => onSelectMessage(dec.messageId)}
            className="group p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-emerald-500/40 hover:bg-slate-950/90 transition cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                <UserCheck className="w-3 h-3" />
                <span>Agreed by Team</span>
              </div>
              <p className="text-xs font-semibold text-slate-200 leading-snug">
                {dec.decision}
              </p>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-850 flex items-center justify-between text-[11px] text-slate-500">
              <span className="truncate pr-2">{dec.context}</span>
              <span className="flex items-center gap-1 text-[11px] text-slate-400 group-hover:text-emerald-400 transition font-medium flex-shrink-0">
                View
                <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
