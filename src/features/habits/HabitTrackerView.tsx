import React, { useState } from 'react';
import {
  Flame,
  Plus,
  Trash2,
  Check,
  Trophy,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { calculateHabitStreaks, getCurrentWeekDays, getTodayIsoDate } from '../../lib/dateUtils';
import { groqChat, GROQ_MODELS } from '../../lib/groq';
import confetti from 'canvas-confetti';

export const HabitTrackerView: React.FC = () => {
  const habits = useStore((s) => s.habits);
  const addHabit = useStore((s) => s.addHabit);
  const deleteHabit = useStore((s) => s.deleteHabit);
  const toggleHabitLog = useStore((s) => s.toggleHabitLog);
  const latestHabitReflection = useStore((s) => s.latestHabitReflection);
  const setLatestHabitReflection = useStore((s) => s.setLatestHabitReflection);
  const fastModel = useStore((s) => s.settings.fastModel) || GROQ_MODELS.FAST;

  const [newHabitName, setNewHabitName] = useState('');
  const [newCategory, setNewCategory] = useState('Wellness');
  const [reflection, setReflection] = useState<string | null>(latestHabitReflection?.text || null);
  const [isReflecting, setIsReflecting] = useState(false);

  const todayStr = getTodayIsoDate();
  const weekDays = getCurrentWeekDays();

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;
    addHabit(newHabitName.trim(), newCategory);
    setNewHabitName('');
  };

  const handleToggle = (habitId: string, dateStr: string) => {
    const habit = habits.find((h) => h.id === habitId);
    const willBeCompleted = !habit?.logs.includes(dateStr);
    toggleHabitLog(habitId, dateStr);

    if (willBeCompleted && dateStr === todayStr) {
      try {
        confetti({
          particleCount: 25,
          spread: 45,
          origin: { y: 0.7 },
        });
      } catch {
        // ignore
      }
    }
  };

  const handleGenerateReflection = async () => {
    setIsReflecting(true);
    setReflection(null);
    try {
      const summaryData = habits.map((h) => {
        const stats = calculateHabitStreaks(h.logs);
        return `${h.name} (${h.category || 'General'}): Current streak ${stats.currentStreak} days, total ${stats.totalCompletions} logs.`;
      });

      const response = await groqChat({
        model: fastModel,
        messages: [
          {
            role: 'system',
            content:
              'You are an empathetic habit coach. Provide a concise, encouraging 2-sentence reflection and 1 actionable piece of advice based on the user habit streaks.',
          },
          {
            role: 'user',
            content: `Here are my habits and streaks:\n${summaryData.join('\n')}`,
          },
        ],
        temperature: 0.4,
      });

      const text = response.choices?.[0]?.message?.content || 'Keep up the consistent work!';
      setReflection(text);
      setLatestHabitReflection({ text, date: todayStr });
    } catch (err: any) {
      setReflection(`Coach error: ${err?.message || 'Unable to generate reflection'}`);
    } finally {
      setIsReflecting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500" /> Habit Tracker & Streaks
          </h2>
          <p className="text-xs text-slate-400">
            Build unshakeable daily consistency and track your momentum
          </p>
        </div>

        <button
          onClick={handleGenerateReflection}
          disabled={isReflecting || habits.length === 0}
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-purple-600/25 transition disabled:opacity-50 self-start sm:self-auto"
        >
          {isReflecting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 text-purple-200" />
          )}
          AI Habit Reflection
        </button>
      </div>

      {/* AI Habit Reflection Card */}
      {reflection && (
        <div className="glass-panel p-4 rounded-2xl border border-purple-500/40 bg-purple-950/20 text-slate-200 text-sm animate-in slide-in-from-top-2 duration-200 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider mb-1">
              Coach Reflection
            </h4>
            <p className="text-slate-200 text-sm leading-relaxed">{reflection}</p>
          </div>
        </div>
      )}

      {/* Create New Habit */}
      <form
        onSubmit={handleCreate}
        className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row gap-3"
      >
        <input
          type="text"
          required
          placeholder="New habit (e.g. Read 20 pages, 30m workout)..."
          value={newHabitName}
          onChange={(e) => setNewHabitName(e.target.value)}
          className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-amber-500"
        />
        <select
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          className="px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-amber-500"
        >
          <option value="Wellness">Wellness</option>
          <option value="Health">Health & Fitness</option>
          <option value="Focus">Focus & Work</option>
          <option value="Growth">Personal Growth</option>
        </select>
        <button
          type="submit"
          className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-amber-600/30 transition"
        >
          <Plus className="w-4 h-4" /> Add Habit
        </button>
      </form>

      {/* Habits Matrix */}
      <div className="space-y-3">
        {habits.length === 0 ? (
          <div className="glass-panel p-10 text-center rounded-2xl border border-slate-800">
            <Flame className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-400">No habits tracked yet</p>
            <p className="text-xs text-slate-500 mt-1">Add your daily habits above to start building streaks.</p>
          </div>
        ) : (
          habits.map((habit) => {
            const stats = calculateHabitStreaks(habit.logs);

            return (
              <div
                key={habit.id}
                className="group glass-card p-4 sm:p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Habit Info & Streaks */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                      {habit.category || 'General'}
                    </span>
                    <h3 className="text-sm sm:text-base font-semibold text-slate-100 truncate">
                      {habit.name}
                    </h3>
                  </div>

                  {/* Streaks stats */}
                  <div className="flex items-center gap-4 mt-2 text-xs">
                    <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                      <Flame className="w-4 h-4 fill-amber-400/20" />
                      <span>{stats.currentStreak} day streak</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400">
                      <Trophy className="w-3.5 h-3.5 text-yellow-500" />
                      <span>Best: {stats.longestStreak}</span>
                    </div>
                    <div className="text-slate-500">
                      Total: {stats.totalCompletions} logs
                    </div>
                  </div>
                </div>

                {/* 7-Day Matrix */}
                <div className="flex items-center gap-2 self-start md:self-auto">
                  {weekDays.map((day) => {
                    const isLogged = habit.logs.includes(day.dateStr);
                    const isToday = day.dateStr === todayStr;

                    return (
                      <button
                        key={day.dateStr}
                        onClick={() => handleToggle(habit.id, day.dateStr)}
                        className={`w-9 h-11 rounded-xl flex flex-col items-center justify-center transition-all ${
                          isLogged
                            ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20 scale-105'
                            : 'bg-slate-900/80 text-slate-400 hover:bg-slate-800 border border-slate-800'
                        } ${isToday ? 'ring-2 ring-indigo-500/60' : ''}`}
                        title={`${day.dayName} (${day.dateStr})`}
                      >
                        <span className="text-[10px] uppercase font-medium">{day.dayName.slice(0, 2)}</span>
                        <span className="text-xs mt-0.5">
                          {isLogged ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : day.dayNumber}
                        </span>
                      </button>
                    );
                  })}

                  <button
                    onClick={() => deleteHabit(habit.id)}
                    className="p-2 ml-1 text-slate-600 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                    title="Delete habit"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
