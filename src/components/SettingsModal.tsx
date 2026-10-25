import React, { useState } from 'react';
import { X, Key, Sliders, Download, Upload, RotateCcw, Check, Cloud, Database, ArrowRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import { GROQ_MODELS } from '../lib/groq';
import { isSupabaseConfigured } from '../lib/supabase';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onOpenAuth }) => {
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const exportData = useStore((s) => s.exportData);
  const importData = useStore((s) => s.importData);
  const loadDemoData = useStore((s) => s.loadDemoData);
  const user = useStore((s) => s.user);

  const [apiKey, setApiKey] = useState(settings.groqApiKey || '');
  const [fastModel, setFastModel] = useState(settings.fastModel || GROQ_MODELS.FAST);
  const [smartModel, setSmartModel] = useState(settings.smartModel || GROQ_MODELS.SMART);
  const [workStart, setWorkStart] = useState(settings.workingHoursStart || '09:00');
  const [workEnd, setWorkEnd] = useState(settings.workingHoursEnd || '18:00');
  const [supabaseUrl, setSupabaseUrl] = useState(settings.supabaseUrl || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(settings.supabaseAnonKey || '');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const envKey = import.meta.env.VITE_GROQ_API_KEY;
  const isEnvConfigured = !!(envKey && !envKey.includes('your_key_here'));

  const envSupabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const isEnvSupabaseConfigured = !!(envSupabaseUrl && envSupabaseUrl.length > 5);

  const handleSave = () => {
    updateSettings({
      groqApiKey: apiKey.trim(),
      fastModel,
      smartModel,
      workingHoursStart: workStart,
      workingHoursEnd: workEnd,
      supabaseUrl: supabaseUrl.trim(),
      supabaseAnonKey: supabaseAnonKey.trim(),
    });
    onClose();
  };

  const handleExport = () => {
    const jsonStr = exportData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-planner-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const result = importData(text);
      if (result.success) {
        setImportStatus('Backup data restored successfully!');
        setTimeout(() => setImportStatus(null), 3000);
      } else {
        setImportStatus(`Restore error: ${result.error}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-xl glass-panel rounded-2xl p-6 shadow-2xl border border-slate-700 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-700/50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Settings & Configuration</h3>
              <p className="text-xs text-slate-400">Configure AI models, Supabase database, and backups</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-5">
          {/* Supabase Cloud Sync Section */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Cloud className="w-4 h-4 text-emerald-400" /> Supabase Cloud Persistence
              </label>
              {isSupabaseConfigured() ? (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {user ? `Connected: ${user.email}` : 'Database Configured'}
                </span>
              ) : (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Not Connected
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Persist all events, tasks, habits, notes, and AI conversations to PostgreSQL in real time.
            </p>
            <div className="grid grid-cols-1 gap-2.5">
              <div>
                <span className="text-xs text-slate-400">Supabase URL</span>
                <input
                  type="text"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  placeholder={isEnvSupabaseConfigured ? 'Using VITE_SUPABASE_URL from .env' : 'https://your-project.supabase.co'}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
              <div>
                <span className="text-xs text-slate-400">Anon / Public API Key</span>
                <input
                  type="password"
                  value={supabaseAnonKey}
                  onChange={(e) => setSupabaseAnonKey(e.target.value)}
                  placeholder="eyJhbGciOi..."
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            {onOpenAuth && (
              <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs text-slate-400">Manage user login, RLS & Cloud Sync</span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAuth();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition border border-emerald-500/30"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Cloud Sync Center</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Groq API Key */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Key className="w-4 h-4 text-indigo-400" /> Groq API Key
              </label>
              {isEnvConfigured && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Detected from .env
                </span>
              )}
            </div>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={isEnvConfigured ? 'Using VITE_GROQ_API_KEY from .env (or override here)' : 'gsk_...'}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition font-mono"
            />
            <p className="text-xs text-slate-400 mt-2">
              Groq keys start with <code className="text-indigo-300">gsk_</code>. Stored locally in your browser or read securely from <code className="text-indigo-300">.env</code>.
            </p>
          </div>

          {/* Model selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Fast Model (Quick Add)
              </label>
              <select
                value={fastModel}
                onChange={(e) => setFastModel(e.target.value)}
                className="w-full mt-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition"
              >
                <option value="openai/gpt-oss-20b">GPT-OSS 20B (Default Fast)</option>
                <option value="llama-3.1-8b-instant">LLaMA 3.1 8B Instant</option>
                <option value="llama-3.3-70b-versatile">LLaMA 3.3 70B Versatile</option>
                <option value="gemma2-9b-it">Gemma 2 9B IT</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Smart Model (Planner & Chat)
              </label>
              <select
                value={smartModel}
                onChange={(e) => setSmartModel(e.target.value)}
                className="w-full mt-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition"
              >
                <option value="openai/gpt-oss-120b">GPT-OSS 120B (Default Smart)</option>
                <option value="llama-3.3-70b-versatile">LLaMA 3.3 70B Versatile</option>
                <option value="llama-3.1-8b-instant">LLaMA 3.1 8B Instant</option>
              </select>
            </div>
          </div>

          {/* Working hours */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Working Hours (for AI Day Planner)
            </label>
            <div className="grid grid-cols-2 gap-3 mt-1.5">
              <div>
                <span className="text-xs text-slate-500">Day Starts</span>
                <input
                  type="time"
                  value={workStart}
                  onChange={(e) => setWorkStart(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
              <div>
                <span className="text-xs text-slate-500">Day Ends</span>
                <input
                  type="time"
                  value={workEnd}
                  onChange={(e) => setWorkEnd(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Backup and Restore */}
          <div className="pt-4 border-t border-slate-800">
            <h4 className="text-sm font-semibold text-slate-200 mb-2">Local JSON Backup & Restore</h4>
            <p className="text-xs text-slate-400 mb-3">
              Export regular JSON backups to safeguard your schedule or import them on other machines without a cloud account.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleExport}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium flex items-center gap-2 transition"
              >
                <Download className="w-4 h-4 text-indigo-400" /> Export JSON
              </button>

              <label className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium flex items-center gap-2 cursor-pointer transition">
                <Upload className="w-4 h-4 text-emerald-400" /> Import JSON
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={() => {
                  if (confirm('Load sample starter data? Current items will be reset to demo.')) {
                    loadDemoData();
                    setImportStatus('Demo data loaded!');
                    setTimeout(() => setImportStatus(null), 3000);
                  }
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-sm font-medium flex items-center gap-2 transition ml-auto"
              >
                <RotateCcw className="w-4 h-4" /> Load Demo Data
              </button>
            </div>

            {importStatus && (
              <div className="mt-3 text-xs text-emerald-400 flex items-center gap-1.5 bg-emerald-950/40 p-2 rounded-lg border border-emerald-900">
                <Check className="w-3.5 h-3.5" />
                <span>{importStatus}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-700/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/30 transition"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
