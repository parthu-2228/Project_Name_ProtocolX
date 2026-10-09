'use client';

import React, { useState } from 'react';
import { ActionItem } from '@/types/chat';
import { CheckSquare, Square, User, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ActionItemsListProps {
  actionItems: ActionItem[];
  onToggleComplete: (itemId: string, currentStatus: boolean) => void;
  onSelectMessage: (messageId: string) => void;
  myNames: string[];
}

export function ActionItemsList({
  actionItems,
  onToggleComplete,
  onSelectMessage,
  myNames,
}: ActionItemsListProps) {
  const [filterMine, setFilterMine] = useState(false);

  const filteredItems = actionItems.filter((item) => {
    if (!filterMine) return true;
    const assigneeLower = item.assignee.toLowerCase();
    return (
      assigneeLower === 'you' ||
      myNames.some((name) => assigneeLower.includes(name.toLowerCase()))
    );
  });

  const completedCount = actionItems.filter((i) => i.completed).length;
  const totalCount = actionItems.length;

  function handleCheck(item: ActionItem) {
    onToggleComplete(item.id, item.completed);

    // If this check completes all items, celebrate!
    if (!item.completed && completedCount + 1 === totalCount && totalCount > 0) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl glass-panel">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-400" />
              Action Items & Next Steps
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-mono bg-slate-800 text-slate-300 rounded-full border border-slate-700">
              {completedCount}/{totalCount} Completed
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Click checkbox to complete. Stored securely on this browser in IndexedDB.
          </p>
        </div>

        {/* Filter Chip */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <button
            onClick={() => setFilterMine(false)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
              !filterMine
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white bg-slate-950/40 border border-slate-800'
            }`}
          >
            All Tasks ({totalCount})
          </button>
          <button
            onClick={() => setFilterMine(true)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
              filterMine
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white bg-slate-950/40 border border-slate-800'
            }`}
          >
            My Tasks Only
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {totalCount > 0 && (
        <div className="w-full bg-slate-950 rounded-full h-1.5 mb-4 overflow-hidden border border-slate-800">
          <div
            className="bg-emerald-500 h-full transition-all duration-300"
            style={{ width: `${Math.round((completedCount / totalCount) * 100)}%` }}
          ></div>
        </div>
      )}

      {/* Action Items List */}
      {filteredItems.length === 0 ? (
        <div className="p-6 text-center text-slate-500 text-xs rounded-xl bg-slate-950/40 border border-slate-850">
          No action items found matching current filter.
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`group flex items-start justify-between gap-3 p-3 rounded-xl border transition ${
                item.completed
                  ? 'bg-slate-950/30 border-slate-850 text-slate-500 opacity-60'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-200'
              }`}
            >
              <div className="flex items-start gap-3 flex-1">
                {/* Interactive Checkbox */}
                <button
                  type="button"
                  onClick={() => handleCheck(item)}
                  className="mt-0.5 text-slate-400 hover:text-emerald-400 transition flex-shrink-0 cursor-pointer"
                >
                  {item.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-500 group-hover:text-emerald-400" />
                  )}
                </button>

                <div className="space-y-1 flex-1">
                  <p
                    className={`text-xs font-medium leading-snug ${
                      item.completed ? 'line-through text-slate-500' : 'text-slate-200'
                    }`}
                  >
                    {item.task}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 text-[10px]">
                    {/* Assignee */}
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                      <User className="w-2.5 h-2.5 text-blue-400" />
                      <span>{item.assignee}</span>
                    </span>

                    {/* Deadline if present */}
                    {item.deadline && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{item.deadline}</span>
                      </span>
                    )}

                    {/* Urgency Badge */}
                    <span
                      className={`px-1.5 py-0.5 rounded uppercase font-bold text-[9px] ${
                        item.urgency === 'high'
                          ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.urgency}
                    </span>
                  </div>
                </div>
              </div>

              {/* Jump to message in chat */}
              <button
                type="button"
                onClick={() => onSelectMessage(item.messageId)}
                title="Jump to message in chat"
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-emerald-400 transition self-center"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
