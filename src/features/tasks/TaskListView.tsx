import React, { useState } from 'react';
import {
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Clock,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { formatHumanDate, getTodayIsoDate } from '../../lib/dateUtils';
import type { Priority } from '../../types';

export const TaskListView: React.FC = () => {
  const tasks = useStore((s) => s.tasks);
  const addTask = useStore((s) => s.addTask);
  const deleteTask = useStore((s) => s.deleteTask);
  const toggleTask = useStore((s) => s.toggleTask);

  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'high' | 'today'>('all');
  const [quickTitle, setQuickTitle] = useState('');
  const [quickPriority, setQuickPriority] = useState<Priority>('med');
  const [quickDue, setQuickDue] = useState('');
  const [quickEstimate, setQuickEstimate] = useState<number>(30);
  const [showAddForm, setShowAddForm] = useState(false);

  const todayStr = getTodayIsoDate();

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'active') return !t.done;
    if (filter === 'completed') return t.done;
    if (filter === 'high') return t.priority === 'high' && !t.done;
    if (filter === 'today') return t.due?.startsWith(todayStr);
    return true;
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    addTask({
      title: quickTitle.trim(),
      priority: quickPriority,
      due: quickDue || undefined,
      estimateMin: quickEstimate,
      done: false,
    });

    setQuickTitle('');
    setQuickDue('');
    setQuickEstimate(30);
    setShowAddForm(false);
  };

  const getPriorityBadge = (p: Priority) => {
    switch (p) {
      case 'high':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'med':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'low':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
  };

  const completedCount = tasks.filter((t) => t.done).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-emerald-400" /> Tasks & To-Dos
          </h2>
          <p className="text-xs text-slate-400">
            Prioritize, estimate, and complete your day-to-day focus items
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-emerald-600/25 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> {showAddForm ? 'Close Form' : 'New Task'}
        </button>
      </div>

      {/* Progress Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center justify-between text-xs font-medium text-slate-300 mb-2">
          <span>Overall Completion Rate</span>
          <span>
            {completedCount} of {tasks.length} tasks done ({progressPercent}%)
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Quick Add Form Drawer */}
      {showAddForm && (
        <form
          onSubmit={handleCreateTask}
          className="glass-panel p-5 rounded-2xl border border-emerald-500/30 space-y-3 animate-in slide-in-from-top-3 duration-200"
        >
          <h3 className="text-sm font-semibold text-slate-200">Quick Add Task</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              required
              placeholder="What needs to be done?"
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
            />
            <div className="flex items-center gap-2">
              <select
                value={quickPriority}
                onChange={(e) => setQuickPriority(e.target.value as Priority)}
                className="px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value="low">Low Priority</option>
                <option value="med">Med Priority</option>
                <option value="high">High Priority</option>
              </select>

              <input
                type="date"
                value={quickDue}
                onChange={(e) => setQuickDue(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
              />

              <div className="relative">
                <input
                  type="number"
                  min="5"
                  step="5"
                  placeholder="Min"
                  value={quickEstimate}
                  onChange={(e) => setQuickEstimate(Number(e.target.value))}
                  className="w-20 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                  title="Estimated time in minutes"
                />
              </div>

              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-md shadow-emerald-600/30"
              >
                Add
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {(
          [
            { id: 'all', label: 'All Tasks' },
            { id: 'active', label: 'Open' },
            { id: 'today', label: 'Due Today' },
            { id: 'high', label: 'High Priority' },
            { id: 'completed', label: 'Completed' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              filter === tab.id
                ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-2.5">
        {filteredTasks.length === 0 ? (
          <div className="glass-panel p-10 text-center rounded-2xl border border-slate-800">
            <CheckCircle2 className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-400">No tasks in this view</p>
            <p className="text-xs text-slate-500 mt-1">Use the Quick Add bar or button above to add one.</p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isDueToday = task.due?.startsWith(todayStr);
            const isOverdue = task.due && task.due < todayStr && !task.done;

            return (
              <div
                key={task.id}
                className={`group glass-card p-4 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                  task.done
                    ? 'opacity-60 bg-slate-900/30 border-slate-800/40'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <button
                    onClick={() => toggleTask(task.id)}
                    className="shrink-0 text-slate-400 hover:text-emerald-400 transition"
                  >
                    {task.done ? (
                      <CheckSquare className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>

                  <div className="min-w-0">
                    <p
                      className={`text-sm font-medium truncate ${
                        task.done ? 'line-through text-slate-500' : 'text-slate-200'
                      }`}
                    >
                      {task.title}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-400">
                      {/* Priority badge */}
                      <span
                        className={`px-2 py-0.5 rounded-full font-semibold border ${getPriorityBadge(
                          task.priority
                        )}`}
                      >
                        {task.priority.toUpperCase()}
                      </span>

                      {/* Due date */}
                      {task.due && (
                        <span
                          className={`flex items-center gap-1 ${
                            isOverdue
                              ? 'text-rose-400 font-semibold'
                              : isDueToday
                              ? 'text-amber-400 font-semibold'
                              : 'text-slate-400'
                          }`}
                        >
                          <Calendar className="w-3 h-3" />
                          {isOverdue ? 'Overdue: ' : isDueToday ? 'Today: ' : ''}
                          {formatHumanDate(task.due)}
                        </span>
                      )}

                      {/* Estimate */}
                      {task.estimateMin && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <Clock className="w-3 h-3" />
                          {task.estimateMin}m
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                    title="Delete task"
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
