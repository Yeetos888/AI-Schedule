import React, { useState } from 'react';
import {
  X,
  Cloud,
  CheckCircle2,
  AlertCircle,
  Key,
  Database,
  Lock,
  Mail,
  ArrowRight,
  LogOut,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Server,
  Sparkles,
  User,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import {
  getSupabase,
  isSupabaseConfigured,
  testSupabaseConnection,
} from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const user = useStore((s) => s.user);
  const setUser = useStore((s) => s.setUser);
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const cloudSyncStatus = useStore((s) => s.cloudSyncStatus);
  const lastSyncedAt = useStore((s) => s.lastSyncedAt);
  const pullFromCloud = useStore((s) => s.pullFromCloud);
  const pushToCloud = useStore((s) => s.pushToCloud);

  const [activeTab, setActiveTab] = useState<'auth' | 'config' | 'schema'>(() =>
    !isSupabaseConfigured() && !settings.supabaseUrl ? 'config' : 'auth'
  );
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'magic'>('signin');

  // Auth fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Config fields
  const [supabaseUrl, setSupabaseUrl] = useState(settings.supabaseUrl || import.meta.env.VITE_SUPABASE_URL || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(settings.supabaseAnonKey || import.meta.env.VITE_SUPABASE_ANON_KEY || '');
  const [testStatus, setTestStatus] = useState<{ success?: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [schemaCopied, setSchemaCopied] = useState(false);

  // Sync action feedback
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestStatus(null);
    const result = await testSupabaseConnection(supabaseUrl.trim(), supabaseAnonKey.trim());
    setIsTesting(false);
    setTestStatus(result);
  };

  const handleSaveCredentials = () => {
    updateSettings({
      supabaseUrl: supabaseUrl.trim(),
      supabaseAnonKey: supabaseAnonKey.trim(),
    });
    setTestStatus({ success: true, message: 'Settings saved! Client reinitialized.' });
    setTimeout(() => {
      if (isSupabaseConfigured()) {
        setActiveTab('auth');
      }
    }, 800);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setAuthMessage({ type: 'error', text: 'Please fill in both email and password.' });
      return;
    }

    const supabase = getSupabase();
    if (!supabase) {
      setAuthMessage({ type: 'error', text: 'Supabase client is not configured. Check the Configuration tab.' });
      return;
    }

    setAuthLoading(true);
    setAuthMessage(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email,
          lastSignIn: data.user.last_sign_in_at || new Date().toISOString(),
        });
        setAuthMessage({ type: 'success', text: `Welcome back, ${data.user.email}!` });
        // Automatically sync cloud data after login
        await pullFromCloud();
        setTimeout(() => onClose(), 1200);
      }
    } catch (err: any) {
      setAuthMessage({ type: 'error', text: err?.message || 'Failed to sign in.' });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setAuthMessage({ type: 'error', text: 'Please fill in both email and password.' });
      return;
    }

    const supabase = getSupabase();
    if (!supabase) {
      setAuthMessage({ type: 'error', text: 'Supabase client is not configured.' });
      return;
    }

    setAuthLoading(true);
    setAuthMessage(null);

    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;

      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email,
          lastSignIn: new Date().toISOString(),
        });
        // Push initial local data up to newly created account
        await pushToCloud();
        setAuthMessage({
          type: 'success',
          text: 'Account created! Initial data backed up to cloud.',
        });
        setTimeout(() => onClose(), 1500);
      }
    } catch (err: any) {
      setAuthMessage({ type: 'error', text: err?.message || 'Failed to sign up.' });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setAuthMessage({ type: 'error', text: 'Please enter your email address.' });
      return;
    }

    const supabase = getSupabase();
    if (!supabase) return;

    setAuthLoading(true);
    setAuthMessage(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;

      setAuthMessage({
        type: 'success',
        text: 'Magic link sent! Check your email inbox to sign in.',
      });
    } catch (err: any) {
      setAuthMessage({ type: 'error', text: err?.message || 'Failed to send magic link.' });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAnonymousSignIn = async () => {
    const supabase = getSupabase();
    if (!supabase) {
      setAuthMessage({ type: 'error', text: 'Supabase client is not configured.' });
      return;
    }

    setAuthLoading(true);
    setAuthMessage(null);

    try {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) throw error;

      if (data.user) {
        setUser({
          id: data.user.id,
          email: 'Anonymous Guest',
          lastSignIn: data.user.last_sign_in_at || new Date().toISOString(),
        });
        await pushToCloud();
        setAuthMessage({
          type: 'success',
          text: 'Signed in anonymously! Local data is backed up to Supabase.',
        });
        setTimeout(() => onClose(), 1200);
      }
    } catch (err: any) {
      setAuthMessage({ type: 'error', text: err?.message || 'Failed to sign in anonymously.' });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setAuthMessage({ type: 'success', text: 'Signed out successfully. Data remains in local browser storage.' });
  };

  const handleSyncPull = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    const result = await pullFromCloud();
    setIsSyncing(false);
    if (result.success) {
      setSyncFeedback('All items (events, tasks, habits, notes, AI chat history, day plans) pulled from Supabase!');
      setTimeout(() => setSyncFeedback(null), 4000);
    } else {
      setSyncFeedback(`Sync failed: ${result.error}`);
    }
  };

  const handleSyncPush = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    const result = await pushToCloud();
    setIsSyncing(false);
    if (result.success) {
      setSyncFeedback('All local data successfully backed up to Supabase cloud!');
      setTimeout(() => setSyncFeedback(null), 4000);
    } else {
      setSyncFeedback(`Sync failed: ${result.error}`);
    }
  };

  const copySqlSchema = async () => {
    try {
      const res = await fetch('/supabase/schema.sql');
      let sql = '';
      if (res.ok) {
        sql = await res.text();
      } else {
        sql = `-- Supabase schema for AI Schedule\n-- View supabase/schema.sql in the project`;
      }
      await navigator.clipboard.writeText(sql);
      setSchemaCopied(true);
      setTimeout(() => setSchemaCopied(false), 2500);
    } catch {
      setSchemaCopied(true);
      setTimeout(() => setSchemaCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl glass-panel rounded-3xl p-6 shadow-2xl border border-slate-700 max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950 font-bold">
              <Cloud className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-100">Supabase Cloud Sync</h3>
                {isSupabaseConfigured() ? (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    Connected
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    Setup Needed
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Sync events, tasks, habits, notes & AI conversations to PostgreSQL
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex items-center gap-2 mt-5 p-1 bg-slate-900/80 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('auth')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition ${
              activeTab === 'auth'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{user ? 'Cloud Account' : 'Sign In / Register'}</span>
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition ${
              activeTab === 'config'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Project Settings</span>
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition ${
              activeTab === 'schema'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>SQL Schema</span>
          </button>
        </div>

        {/* Feedback Message */}
        {authMessage && (
          <div
            className={`mt-4 p-3 rounded-xl text-xs flex items-center gap-2 border ${
              authMessage.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
            }`}
          >
            {authMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{authMessage.text}</span>
          </div>
        )}

        {/* TAB 1: AUTHENTICATION / ACCOUNT */}
        {activeTab === 'auth' && (
          <div className="mt-5 space-y-5">
            {user ? (
              // Logged in View
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-sm">
                        {user.email ? user.email.slice(0, 2).toUpperCase() : 'US'}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-100 text-sm">{user.email}</div>
                        <div className="text-[11px] text-slate-400 font-mono">User ID: {user.id.slice(0, 16)}...</div>
                      </div>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 hover:text-rose-300 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700 hover:border-rose-500/30"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-800 text-xs">
                    <div>
                      <span className="text-slate-500">Sync Status:</span>
                      <div className="flex items-center gap-1.5 font-medium mt-0.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            cloudSyncStatus === 'synced'
                              ? 'bg-emerald-400'
                              : cloudSyncStatus === 'syncing'
                              ? 'bg-amber-400 animate-ping'
                              : 'bg-indigo-400'
                          }`}
                        />
                        <span className="text-slate-300 capitalize">{cloudSyncStatus}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500">Last Synced:</span>
                      <div className="font-medium text-slate-300 mt-0.5">
                        {lastSyncedAt ? new Date(lastSyncedAt).toLocaleTimeString() : 'Not yet synced'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cloud Sync Actions */}
                <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-200">Cloud Data Synchronization</h4>
                      <p className="text-xs text-slate-400">
                        Synchronizes your events, tasks, habits, notes, and AI conversations
                      </p>
                    </div>
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleSyncPull}
                      disabled={isSyncing}
                      className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>Pull from Supabase</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSyncPush}
                      disabled={isSyncing}
                      className="p-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50"
                    >
                      <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Push All to Supabase</span>
                    </button>
                  </div>

                  {syncFeedback && (
                    <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-900 text-xs text-emerald-300 flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{syncFeedback}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Logged out / Auth Form
              <div className="space-y-4">
                {/* Auth Mode Toggle */}
                <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signin');
                      setAuthMessage(null);
                    }}
                    className={`flex-1 py-1 text-xs font-semibold rounded-lg transition ${
                      authMode === 'signin' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signup');
                      setAuthMessage(null);
                    }}
                    className={`flex-1 py-1 text-xs font-semibold rounded-lg transition ${
                      authMode === 'signup' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Create Account
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('magic');
                      setAuthMessage(null);
                    }}
                    className={`flex-1 py-1 text-xs font-semibold rounded-lg transition ${
                      authMode === 'magic' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Magic Link
                  </button>
                </div>

                {!isSupabaseConfigured() && (
                  <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Supabase Project URL & Key not configured yet.</span>
                    </div>
                    <button
                      onClick={() => setActiveTab('config')}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-semibold underline text-[11px]"
                    >
                      Configure
                    </button>
                  </div>
                )}

                <form
                  onSubmit={
                    authMode === 'signin'
                      ? handleSignIn
                      : authMode === 'signup'
                      ? handleSignUp
                      : handleMagicLink
                  }
                  className="space-y-3.5"
                >
                  <div>
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1">
                      <Mail className="w-3.5 h-3.5 text-indigo-400" /> Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@domain.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>

                  {authMode !== 'magic' && (
                    <div>
                      <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1">
                        <Lock className="w-3.5 h-3.5 text-indigo-400" /> Password
                      </label>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition disabled:opacity-50"
                  >
                    {authLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>
                          {authMode === 'signin'
                            ? 'Sign In & Sync'
                            : authMode === 'signup'
                            ? 'Create Account & Push Local Data'
                            : 'Send Magic Login Link'}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="relative my-3 flex items-center justify-center">
                  <div className="border-t border-slate-800 w-full" />
                  <span className="bg-slate-900 px-2 text-[11px] text-slate-500 uppercase tracking-wider absolute">
                    or instant access
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleAnonymousSignIn}
                  disabled={authLoading}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 transition hover:text-white disabled:opacity-50"
                >
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Continue as Guest (Anonymous Sign-In)</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CONFIGURATION */}
        {activeTab === 'config' && (
          <div className="mt-5 space-y-4">
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
              <p>
                Connect to your own Supabase project. You can find these credentials in the{' '}
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-400 hover:underline inline-flex items-center gap-1"
                >
                  Supabase Dashboard <ExternalLink className="w-3 h-3" />
                </a>{' '}
                under <strong>Project Settings → API</strong>.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1">
                  <Server className="w-3.5 h-3.5 text-emerald-400" /> Project URL
                </label>
                <input
                  type="text"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  placeholder="https://xyzproject.supabase.co"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 font-mono transition"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1">
                  <Key className="w-3.5 h-3.5 text-emerald-400" /> Anon / Public API Key
                </label>
                <input
                  type="password"
                  value={supabaseAnonKey}
                  onChange={(e) => setSupabaseAnonKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 font-mono transition"
                />
              </div>
            </div>

            {testStatus && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                  testStatus.success
                    ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-800 text-rose-300'
                }`}
              >
                {testStatus.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{testStatus.message}</span>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting || !supabaseUrl || !supabaseAnonKey}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                <span>Test Connection</span>
              </button>

              <button
                type="button"
                onClick={handleSaveCredentials}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/30 transition text-center"
              >
                Save Credentials
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: SQL SCHEMA */}
        {activeTab === 'schema' && (
          <div className="mt-5 space-y-4">
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 space-y-2">
              <p>
                In your Supabase project dashboard, open the <strong>SQL Editor</strong>, paste this schema, and click <strong>Run</strong>.
              </p>
              <p className="text-slate-400">
                It creates all tables (<code>events</code>, <code>tasks</code>, <code>habits</code>, <code>notes</code>, <code>chat_messages</code>, <code>ai_plans</code>, <code>user_settings</code>) and configures Row Level Security (RLS) policies.
              </p>
            </div>

            <div className="relative">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-400 max-h-48 overflow-y-auto leading-relaxed">
                <span className="text-emerald-400">-- 1. Events Table</span><br />
                create table public.events ( id text primary key, user_id uuid references auth.users ... );<br />
                <span className="text-emerald-400">-- 2. Tasks Table</span><br />
                create table public.tasks ( id text primary key, user_id uuid references auth.users ... );<br />
                <span className="text-emerald-400">-- 3. Habits Table</span><br />
                create table public.habits ( id text primary key, user_id uuid references auth.users ... );<br />
                <span className="text-emerald-400">-- 4. Notes Table</span><br />
                create table public.notes ( id text primary key, user_id uuid references auth.users ... );<br />
                <span className="text-emerald-400">-- 5. AI Chat Messages (Full Conversation History)</span><br />
                create table public.chat_messages ( id text primary key, user_id uuid references auth.users ... );<br />
                <span className="text-emerald-400">-- 6. AI Plans & Artifacts (Day Planner & Summaries)</span><br />
                create table public.ai_plans ( id text primary key, user_id uuid references auth.users ... );<br />
                <span className="text-emerald-400">-- 7. Row Level Security & Realtime enabled for all</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={copySqlSchema}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold flex items-center justify-center gap-2 transition"
              >
                {schemaCopied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-300">Copied SQL to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-indigo-400" />
                    <span>Copy Full SQL Schema</span>
                  </>
                )}
              </button>

              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-4 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <span>Open Dashboard</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
