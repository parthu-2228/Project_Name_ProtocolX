'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { getCurrentUser, AuthUser } from '@/lib/auth';

interface AuthGuardProps {
  children: (user: AuthUser) => React.ReactNode;
  onUserResolved?: (user: AuthUser) => void;
}

/**
 * AuthGuard — client-only session check.
 * Shows a loading screen while checking, redirects to /login if no session,
 * or renders children with the authenticated user.
 */
export function AuthGuard({ children, onUserResolved }: AuthGuardProps) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checking, setChecking] = useState(true);

  const resolveUser = useCallback(
    (resolved: AuthUser) => {
      setUser(resolved);
      if (onUserResolved) onUserResolved(resolved);
    },
    [onUserResolved]
  );

  useEffect(() => {
    // Only runs on client — safe for localStorage
    let cancelled = false;

    async function check() {
      try {
        const currentUser = await getCurrentUser();
        if (cancelled) return;

        if (!currentUser) {
          router.replace('/login');
        } else {
          resolveUser(currentUser);
        }
      } catch {
        if (!cancelled) router.replace('/login');
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [router, resolveUser]);

  // Full-screen animated loading while checking session
  if (checking) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-slate-400">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-black text-2xl shadow-2xl shadow-emerald-500/30">
              ?
            </div>
            <div className="absolute -inset-2 rounded-3xl border border-emerald-500/20 animate-ping" />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
            <span>Checking session…</span>
          </div>
        </div>
      </div>
    );
  }

  // If no user after check (redirect in progress), render nothing
  if (!user) return null;

  return <>{children(user)}</>;
}
