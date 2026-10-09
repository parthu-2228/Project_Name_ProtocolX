'use client';

import React from 'react';
import { ShieldCheck, Sparkles, Zap, Settings as SettingsIcon, Sun, Moon, LogOut } from 'lucide-react';
import { UserSettings } from '@/types/chat';
import { AuthUser } from '@/lib/auth';

interface HeaderProps {
  settings: UserSettings;
  onOpenPrivacy: () => void;
  onOpenSettings: () => void;
  onToggleAiMode: () => void;
  onToggleTheme: () => void;
  isOllamaAvailable: boolean;
  user?: AuthUser | null;
  onSignOut?: () => void;
}

export function Header({
  settings,
  onOpenPrivacy,
  onOpenSettings,
  onToggleAiMode,
  onToggleTheme,
  isOllamaAvailable,
  user,
  onSignOut,
}: HeaderProps) {
  // Derive initials for avatar
  const initials = user?.displayName
    ? user.displayName
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user?.email
    ? user.email[0].toUpperCase()
    : '?';
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-lg shadow-emerald-500/20 font-black text-lg">
            <span>?</span>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 border-2 border-slate-950 rounded-full animate-ping"></span>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 border-2 border-slate-950 rounded-full"></span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">
                What Did I Miss?
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full">
                Local-First AI
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Catch up on 100s of messages in seconds • Zero data leaves device
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Privacy Badge — 100% On-Device Processing */}
          <button
            onClick={onOpenPrivacy}
            title="Inspect on-device privacy guarantee"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 hover:border-emerald-400/50 shadow-sm transition"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="hidden md:inline">100% On-Device</span>
            <span className="md:hidden text-[11px]">Local</span>
          </button>

          {/* AI Mode Selector Chip */}
          <button
            onClick={onToggleAiMode}
            title={`Current: ${settings.aiMode === 'smart' ? 'Smart (Local LLM)' : 'Quick (Rules)'}. Click to toggle.`}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
              settings.aiMode === 'smart'
                ? 'bg-blue-950/40 border-blue-500/30 text-blue-300 hover:bg-blue-900/40'
                : 'bg-amber-950/40 border-amber-500/30 text-amber-300 hover:bg-amber-900/40'
            }`}
          >
            {settings.aiMode === 'smart' ? (
              <>
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden lg:inline">Mode:</span>
                <span className="font-semibold">Smart {isOllamaAvailable ? '(Ollama)' : '(Auto-Fallback)'}</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden lg:inline">Mode:</span>
                <span className="font-semibold">Quick Rules</span>
              </>
            )}
          </button>

          {/* Settings Trigger */}
          <button
            onClick={onOpenSettings}
            title="User Profile & Detection Settings"
            className="p-2 rounded-lg text-slate-400 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            title="Toggle theme"
            className="p-2 rounded-lg text-slate-400 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition"
          >
            {settings.theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-300" />
            ) : (
              <Moon className="w-4 h-4 text-blue-300" />
            )}
          </button>

          {/* User Avatar + Sign Out */}
          {user && (
            <div className="flex items-center gap-2 pl-1 border-l border-slate-800">
              <div
                title={user.displayName || user.email}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-emerald-500/20 select-none"
              >
                {initials}
              </div>
              {onSignOut && (
                <button
                  id="header-signout-btn"
                  onClick={onSignOut}
                  title="Sign out"
                  className="p-2 rounded-lg text-slate-400 hover:text-red-400 bg-slate-900/80 hover:bg-red-950/30 border border-slate-800 hover:border-red-500/30 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
