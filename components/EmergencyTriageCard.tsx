'use client';

import React, { useState } from 'react';
import {
  Flame,
  AlertTriangle,
  Clock,
  UserCheck,
  CheckSquare,
  ArrowRight,
  Zap,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Message, ActionItem, DeadlineItem, MentionItem } from '@/types/chat';

interface EmergencyTriageCardProps {
  urgentMessages: Message[];
  actionItems: ActionItem[];
  deadlines: DeadlineItem[];
  mentions: MentionItem[];
  userName: string;
  myNames: string[];
  onSelectMessage: (messageId: string) => void;
  onToggleTask: (taskId: string, currentStatus: boolean) => void;
}

export function EmergencyTriageCard({
  urgentMessages,
  actionItems,
  deadlines,
  mentions,
  userName,
  myNames,
  onSelectMessage,
  onToggleTask,
}: EmergencyTriageCardProps) {
  const [copiedAck, setCopiedAck] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  // Filter tasks strictly assigned to user
  const myTasks = actionItems.filter((item) => {
    const assigneeLower = item.assignee.toLowerCase();
    return (
      assigneeLower === 'you' ||
      myNames.some((n) => assigneeLower.includes(n.toLowerCase()))
    );
  });

  // Filter deadlines due today or with imminent flags
  const urgentDeadlines = deadlines.filter((dl) => dl.priority === 'high' || dl.relativeText.toLowerCase().includes('today') || dl.relativeText.toLowerCase().includes('tonight'));

  const totalUrgentCount = urgentMessages.length + myTasks.filter((t) => !t.completed).length + urgentDeadlines.length;

  if (totalUrgentCount === 0 && urgentMessages.length === 0) {
    return null;
  }

  function handleCopyQuickAck() {
    const topTask = myTasks.find((t) => !t.completed);
    const topDeadline = urgentDeadlines[0];

    const message = `Got it team. Acknowledging the urgent updates: ${
      topTask ? `I am on "${topTask.task}"` : "I've reviewed the blocker"
    }${topDeadline ? ` before ${topDeadline.relativeText}` : ''}. Pushing updates shortly!`;

    navigator.clipboard.writeText(message);
    setCopiedAck(true);
    setTimeout(() => setCopiedAck(false), 2000);
  }

  return (
    <div className="w-full bg-gradient-to-r from-rose-950/80 via-slate-900/90 to-amber-950/70 border-2 border-rose-500/50 rounded-2xl p-5 shadow-2xl relative overflow-hidden backdrop-blur-md">
      {/* Glowing top line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-amber-400 to-rose-500 animate-pulse"></div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-rose-500/20">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
            <Flame className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                ⚡ 30-Second Emergency Triage (Urgent Only)
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-rose-500 text-white rounded-full uppercase shadow">
                {totalUrgentCount} Urgent Items
              </span>
            </div>
            <p className="text-[11px] text-rose-200/80 mt-0.5">
              Filtered down to immediate blockers, tasks assigned to you, and today&apos;s deadlines
            </p>
          </div>
        </div>

        {/* Quick Ack copy button + toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyQuickAck}
            title="Copy quick acknowledgment to paste in your chat"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 transition"
          >
            {copiedAck ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedAck ? 'Copied Reply!' : 'Quick "On It" Reply'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expandable Triage Grid */}
      {isExpanded && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Column 1: Top Blockers */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-rose-500/20 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-rose-400">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Critical Blockers ({urgentMessages.length})</span>
              </span>
            </div>

            {urgentMessages.length === 0 ? (
              <p className="text-[11px] text-slate-500">No active blockers flagged.</p>
            ) : (
              urgentMessages.slice(0, 2).map((m) => (
                <div
                  key={m.id}
                  onClick={() => onSelectMessage(m.id)}
                  className="p-2 rounded-lg bg-rose-950/30 border border-rose-500/30 hover:border-rose-400 text-xs cursor-pointer transition"
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <strong className="text-rose-300">{m.sender}</strong>
                    <span className="font-mono text-rose-400 font-bold">{m.priorityScore}/100</span>
                  </div>
                  <p className="text-slate-200 line-clamp-2 text-[11px]">&quot;{m.text}&quot;</p>
                  <div className="mt-1 flex justify-end text-[10px] text-rose-300 font-medium items-center gap-0.5">
                    Jump <ArrowRight className="w-2.5 h-2.5" />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Column 2: My Action Items */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-amber-500/20 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-amber-400">
              <span className="flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Assigned To You ({myTasks.length})</span>
              </span>
            </div>

            {myTasks.length === 0 ? (
              <p className="text-[11px] text-slate-500">No pending tasks directly assigned to you.</p>
            ) : (
              myTasks.slice(0, 3).map((t) => (
                <div
                  key={t.id}
                  className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs flex items-start gap-2"
                >
                  <input
                    type="checkbox"
                    checked={t.completed}
                    onChange={() => onToggleTask(t.id, t.completed)}
                    className="mt-0.5 rounded text-amber-500 focus:ring-amber-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <p className={`text-[11px] leading-snug ${t.completed ? 'line-through text-slate-500' : 'text-slate-200 font-medium'}`}>
                      {t.task}
                    </p>
                    {t.deadline && (
                      <span className="text-[9px] font-mono text-amber-300 bg-amber-500/10 px-1 py-0.2 rounded mt-1 inline-block">
                        Due: {t.deadline}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Column 3: Approaching Deadlines */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-emerald-500/20 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Today&apos;s Deadlines ({urgentDeadlines.length})</span>
              </span>
            </div>

            {urgentDeadlines.length === 0 ? (
              <p className="text-[11px] text-slate-500">No deadlines expiring today.</p>
            ) : (
              urgentDeadlines.slice(0, 3).map((dl) => (
                <div
                  key={dl.id}
                  onClick={() => onSelectMessage(dl.messageId)}
                  className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs cursor-pointer hover:border-emerald-500/40 transition"
                >
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="text-emerald-300 font-bold">{dl.relativeText}</span>
                    <span className="text-slate-500">{dl.sender}</span>
                  </div>
                  <p className="text-slate-200 line-clamp-1 text-[11px]">{dl.title}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
