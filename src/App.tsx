import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { QuickAddBar } from './components/QuickAddBar';
import { SettingsModal } from './components/SettingsModal';
import { AuthModal } from './components/AuthModal';
import { CalendarView } from './features/calendar/CalendarView';
import { TaskListView } from './features/tasks/TaskListView';
import { HabitTrackerView } from './features/habits/HabitTrackerView';
import { NotesView } from './features/notes/NotesView';
import { DayPlannerView } from './features/planner/DayPlannerView';
import { ChatAssistantView } from './features/chat/ChatAssistantView';
import { useStore } from './store/useStore';
import { getSupabase } from './lib/supabase';

export function App() {
  const activeTab = useStore((s) => s.activeTab);
  const darkMode = useStore((s) => s.settings.darkMode);
  const setUser = useStore((s) => s.setUser);
  const pullFromCloud = useStore((s) => s.pullFromCloud);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Synchronize dark mode class on html/body
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Check Supabase session on startup & listen to auth changes
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          lastSignIn: session.user.last_sign_in_at || new Date().toISOString(),
        });
        // Pull cloud data into store
        pullFromCloud();
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          lastSignIn: session.user.last_sign_in_at || new Date().toISOString(),
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, pullFromCloud]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Background glow effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-tr from-indigo-600/15 via-purple-600/15 to-transparent blur-3xl rounded-full" />
        <div className="absolute top-1/3 -left-40 w-[500px] h-[500px] bg-indigo-900/10 blur-3xl rounded-full" />
      </div>

      {/* Top Navbar */}
      <Navbar
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10 space-y-6">
        {/* Quick Add Bar banner */}
        <section className="max-w-3xl mx-auto">
          <QuickAddBar />
        </section>

        {/* Tab content */}
        <section>
          {activeTab === 'calendar' && <CalendarView />}
          {activeTab === 'tasks' && <TaskListView />}
          {activeTab === 'habits' && <HabitTrackerView />}
          {activeTab === 'notes' && <NotesView />}
          {activeTab === 'planner' && <DayPlannerView />}
          {activeTab === 'chat' && <ChatAssistantView />}
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-900 py-4 text-center text-xs text-slate-500 relative z-10">
        <p>AI Schedule • Groq LLaMA 3.3 & Supabase Cloud PostgreSQL • Local-First</p>
      </footer>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Supabase Auth & Cloud Sync Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />
    </div>
  );
}

export default App;
