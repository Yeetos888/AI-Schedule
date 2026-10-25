import React, { useState } from 'react';
import { Check, X, Calendar, CheckSquare, Clock } from 'lucide-react';
import type { QuickAddResult, Priority } from '../types';
import confetti from 'canvas-confetti';

interface ConfirmCardProps {
  initialData: QuickAddResult;
  onConfirm: (data: QuickAddResult) => void;
  onCancel: () => void;
}

export const ConfirmCard: React.FC<ConfirmCardProps> = ({ initialData, onConfirm, onCancel }) => {
  const [data, setData] = useState<QuickAddResult>({ ...initialData });

  const handleSave = () => {
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch {
      // ignore
    }
    onConfirm(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg glass-panel rounded-2xl p-6 shadow-2xl border border-indigo-500/30">
        <div className="flex items-center justify-between pb-4 border-b border-slate-700/50">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${data.type === 'event' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
              {data.type === 'event' ? <Calendar className="w-5 h-5" /> : <CheckSquare className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">
                Confirm AI Parsed {data.type === 'event' ? 'Event' : 'Task'}
              </h3>
              <p className="text-xs text-slate-400">
                Review and fine-tune details before adding to your schedule
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {/* Type Toggle */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Type</label>
            <div className="grid grid-cols-2 gap-2 mt-1.5">
              <button
                type="button"
                onClick={() => setData({ ...data, type: 'event' })}
                className={`py-2 px-3 text-sm font-medium rounded-xl flex items-center justify-center gap-2 transition ${
                  data.type === 'event'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Calendar className="w-4 h-4" /> Calendar Event
              </button>
              <button
                type="button"
                onClick={() => setData({ ...data, type: 'task' })}
                className={`py-2 px-3 text-sm font-medium rounded-xl flex items-center justify-center gap-2 transition ${
                  data.type === 'task'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                    : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <CheckSquare className="w-4 h-4" /> To-Do Task
              </button>
            </div>
          </div>

          {/* Title input */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Title</label>
            <input
              type="text"
              value={data.title}
              onChange={(e) => setData({ ...data, title: e.target.value })}
              className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              placeholder="e.g. Sprint Review Meeting"
            />
          </div>

          {/* Event start / end */}
          {data.type === 'event' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Start Time</label>
                <input
                  type="datetime-local"
                  value={data.start ? data.start.slice(0, 16) : ''}
                  onChange={(e) => setData({ ...data, start: e.target.value ? `${e.target.value}:00` : '' })}
                  className="w-full mt-1.5 px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">End Time</label>
                <input
                  type="datetime-local"
                  value={data.end ? data.end.slice(0, 16) : ''}
                  onChange={(e) => setData({ ...data, end: e.target.value ? `${e.target.value}:00` : '' })}
                  className="w-full mt-1.5 px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>
          )}

          {/* Task fields: Due date, priority, estimate */}
          {data.type === 'task' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Due Date</label>
                <input
                  type="date"
                  value={data.due ? data.due.slice(0, 10) : ''}
                  onChange={(e) => setData({ ...data, due: e.target.value })}
                  className="w-full mt-1.5 px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Priority</label>
                <select
                  value={data.priority || 'med'}
                  onChange={(e) => setData({ ...data, priority: e.target.value as Priority })}
                  className="w-full mt-1.5 px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 transition"
                >
                  <option value="low">Low</option>
                  <option value="med">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Estimate (min)</label>
                <div className="relative mt-1.5">
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={data.estimateMin || 30}
                    onChange={(e) => setData({ ...data, estimateMin: parseInt(e.target.value, 10) || 30 })}
                    className="w-full px-3 py-2 pr-8 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 transition"
                  />
                  <Clock className="w-4 h-4 text-slate-500 absolute right-2.5 top-3 pointer-events-none" />
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Notes / Details</label>
            <textarea
              rows={2}
              value={data.notes || ''}
              onChange={(e) => setData({ ...data, notes: e.target.value })}
              className="w-full mt-1.5 px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition"
              placeholder="Additional notes or link..."
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-700/50">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded-xl transition"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!data.title.trim()}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-xl shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition disabled:opacity-50"
          >
            <Check className="w-4 h-4" /> Save {data.type === 'event' ? 'Event' : 'Task'}
          </button>
        </div>
      </div>
    </div>
  );
};
