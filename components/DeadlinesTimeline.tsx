'use client';

import React from 'react';
import { DeadlineItem } from '@/types/chat';
import { Calendar, Clock, AlertCircle, ArrowRight } from 'lucide-react';

interface DeadlinesTimelineProps {
  deadlines: DeadlineItem[];
  onSelectMessage: (messageId: string) => void;
}

export function DeadlinesTimeline({ deadlines, onSelectMessage }: DeadlinesTimelineProps) {
  if (!deadlines || deadlines.length === 0) {
    return (
      <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl glass-panel">
        <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
          <Calendar className="w-4 h-4 text-emerald-400" />
          Deadlines & Timeline
        </h2>
        <p className="text-xs text-slate-500">No explicit time constraints or deadlines detected.</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl glass-panel">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            Deadlines & Milestones Timeline
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Normalized relative deadlines extracted via chrono-node NLP
          </p>
        </div>
        <span className="text-xs font-mono text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          {deadlines.length} Due Dates
        </span>
      </div>

      {/* Timeline items */}
      <div className="relative pl-4 space-y-4 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-800">
        {deadlines.map((dl, idx) => (
          <div
            key={dl.id}
            onClick={() => onSelectMessage(dl.messageId)}
            className="group relative flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-emerald-500/40 hover:bg-slate-950/90 transition cursor-pointer"
          >
            {/* Timeline node icon */}
            <div className="absolute -left-[23px] top-4 w-3.5 h-3.5 rounded-full bg-slate-900 border-2 border-emerald-400 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
            </div>

            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-200 group-hover:text-emerald-300 transition">
                  {dl.title}
                </span>

                {/* Relative badge */}
                <div className="flex items-center gap-1.5">
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    <Clock className="w-2.5 h-2.5" />
                    {dl.relativeText}
                  </span>

                  {dl.isOverdue && (
                    <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      <AlertCircle className="w-2.5 h-2.5" />
                      Passed
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Stated by <strong className="text-slate-400">{dl.sender}</strong></span>
                <span className="flex items-center gap-1 text-[11px] text-slate-400 group-hover:text-emerald-400 transition font-medium">
                  Jump to chat
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
