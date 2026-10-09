'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Zap,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { signUp, persistLocalSession } from '@/lib/auth';

function PasswordStrengthBar({ password }: { password: string }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;

  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500'];
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i < score ? colors[score - 1] : 'bg-slate-700'
            }`}
          />
        ))}
      </div>
      <p className={`text-xs ${score === 4 ? 'text-emerald-400' : score >= 2 ? 'text-yellow-400' : 'text-red-400'}`}>
        Password strength: {labels[Math.max(0, score - 1)] || 'Weak'}
      </p>
    </div>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('wdim_session_user');
    if (stored) router.replace('/');
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!displayName.trim()) {
      setError('Please enter your display name.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!agreed) {
      setError('Please agree to the privacy policy to continue.');
      return;
    }

    setIsLoading(true);
    try {
      const { user, error: authError } = await signUp(email.trim(), password, displayName.trim());
      if (authError || !user) {
        setError(authError || 'Sign-up failed. Please try again.');
      } else {
        persistLocalSession(user);
        setSuccess('Account created! Redirecting to your dashboard…');
        setTimeout(() => router.replace('/'), 1500);
      }
    } finally {
      setIsLoading(false);
    }
  }

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-2xl shadow-emerald-500/30 font-black text-3xl mb-4 relative">
            <span>?</span>
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-amber-400 border-2 border-slate-950 rounded-full animate-ping" />
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-amber-400 border-2 border-slate-950 rounded-full" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">What Did I Miss?</h1>
          <p className="text-sm text-slate-400 mt-1">Create your secure, private account</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-8 shadow-2xl shadow-slate-950/50">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white">Get started for free</h2>
            <p className="text-sm text-slate-400 mt-1">No credit card required • Always local-first</p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-4 flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-950/50 border border-red-500/30 text-red-300 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Banner */}
          {success && (
            <div className="mb-4 flex items-start gap-2.5 px-4 py-3 rounded-xl bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 text-sm">
              <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-400" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Display Name */}
            <div>
              <label htmlFor="signup-name" className="block text-xs font-medium text-slate-300 mb-1.5">
                Display Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="signup-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your Name"
                  autoComplete="name"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/70 border border-slate-700/70 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="signup-email" className="block text-xs font-medium text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/70 border border-slate-700/70 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="signup-password" className="block text-xs font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  required
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-800/70 border border-slate-700/70 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <PasswordStrengthBar password={password} />
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="signup-confirm-password" className="block text-xs font-medium text-slate-300 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="signup-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  required
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-800/70 border text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 transition ${
                    confirmPassword && confirmPassword !== password
                      ? 'border-red-500/60 focus:ring-red-500/30'
                      : confirmPassword && confirmPassword === password
                      ? 'border-emerald-500/50 focus:ring-emerald-500/30'
                      : 'border-slate-700/70 focus:ring-emerald-500/50 focus:border-emerald-500/50'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && confirmPassword !== password && (
                <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
              )}
              {confirmPassword && confirmPassword === password && (
                <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Passwords match
                </p>
              )}
            </div>

            {/* Privacy Agreement */}
            <label htmlFor="signup-agree" className="flex items-start gap-3 cursor-pointer group">
              <input
                id="signup-agree"
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500 accent-emerald-500 flex-shrink-0 cursor-pointer"
              />
              <span className="text-xs text-slate-400 group-hover:text-slate-300 transition">
                I understand that{' '}
                <span className="text-emerald-400 font-medium">all conversation content stays on my device</span>{' '}
                and never leaves it. Only account metadata (email, display name) is stored securely.
              </span>
            </label>

            {/* Submit */}
            <button
              id="signup-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-semibold shadow-lg shadow-emerald-500/20 transition disabled:opacity-60 disabled:cursor-not-allowed mt-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account…
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-slate-900/70 text-xs text-slate-500">Already have an account?</span>
            </div>
          </div>

          <Link
            id="goto-login-link"
            href="/login"
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl border border-slate-700/70 hover:border-slate-600 text-slate-300 hover:text-white text-sm font-medium transition bg-slate-800/30 hover:bg-slate-800/60"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Sign in instead
          </Link>
        </div>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-6 mt-6 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Local-First Privacy
          </span>
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Zero Content Upload
          </span>
        </div>
      </div>
    </div>
  );
}
