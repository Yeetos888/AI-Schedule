import React from 'react';
import {
  Calendar,
  CheckSquare,
  Flame,
  FileText,
  Sparkles,
  MessageSquare,
  Settings,
  Sun,
  Moon,
  Zap,
  Cloud,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { getGroqApiKey } from '../lib/groq';
import { isSupabaseConfigured } from '../lib/supabase';

interface NavbarProps {
  onOpenSettings: () => void;
  onOpenAuth: () => void;
}

interface NavItem {
  id: 'calendar' | 'tasks' | 'habits' | 'notes' | 'planner' | 'chat';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  highlight?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSettings, onOpenAuth }) => {
  const activeTab = useStore((s) => s.activeTab);
  const setActiveTab = useStore((s) => s.setActiveTab);
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const user = useStore((s) => s.user);
  const cloudSyncStatus = useStore((s) => s.cloudSyncStatus);

  const openTasksCount = useStore((s) => s.tasks.filter((t) => !t.done).length);
  const eventsCount = useStore((s) => s.events.length);
  const habitsCount = useStore((s) => s.habits.length);

  const hasApiKey = !!getGroqApiKey();
  const hasSupabase = isSupabaseConfigured();

  const toggleDarkMode = () => {
    updateSettings({ darkMode: !settings.darkMode });
  };

  const navItems: NavItem[] = [
    { id: 'calendar', label: 'Calendar', icon: Calendar, badge: eventsCount },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, badge: openTasksCount },
    { id: 'habits', label: 'Habits', icon: Flame, badge: habitsCount },
    { id: 'notes', label: 'Notes', icon: FileText },
    { id: 'planner', label: 'AI Day Planner', icon: Sparkles, highlight: true },
    { id: 'chat', label: 'AI Assistant', icon: MessageSquare },
  ];

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Status */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                  AI Schedule
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Smart Planner
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900/60 border border-slate-800">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                    isActive
                      ? item.highlight
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${item.highlight && !isActive ? 'text-indigo-400' : ''}`} />
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Actions & Settings */}
          <div className="flex items-center gap-2">
            {/* Supabase Cloud Status Button */}
            <button
              onClick={onOpenAuth}
              title={
                user
                  ? `Cloud Connected as ${user.email} (${cloudSyncStatus})`
                  : hasSupabase
                  ? 'Supabase Configured - Click to Sign In'
                  : 'Connect Supabase Cloud'
              }
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                user
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                  : hasSupabase
                  ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/20'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Cloud
                className={`w-3.5 h-3.5 ${
                  user
                    ? 'text-emerald-400'
                    : hasSupabase
                    ? 'text-indigo-400'
                    : 'text-slate-400'
                }`}
              />
              <span className="hidden sm:inline">
                {user ? user.email?.split('@')[0] || 'Synced' : hasSupabase ? 'Cloud Sync' : 'Supabase'}
              </span>
            </button>

            {/* Groq Status badge */}
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                hasApiKey
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}
              title={hasApiKey ? 'Groq AI Ready' : 'API Key missing - click settings'}
            >
              <Zap className={`w-3 h-3 ${hasApiKey ? 'text-emerald-400' : 'text-amber-400'}`} />
              <span>{hasApiKey ? 'Groq Active' : 'Key Needed'}</span>
            </div>

            {/* Dark / Light Toggle */}
            <button
              onClick={toggleDarkMode}
              title={settings.darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-2 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800/80 transition"
            >
              {settings.darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Settings Modal Button */}
            <button
              onClick={onOpenSettings}
              title="Settings & Backup"
              className="p-2 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800/80 transition"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden overflow-x-auto py-2 gap-1 border-t border-slate-800/60 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 shrink-0 transition ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
