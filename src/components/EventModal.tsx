import React, { useState, useEffect } from 'react';
import { X, Trash2, Calendar } from 'lucide-react';
import type { CalendarEvent } from '../types';

interface EventModalProps {
  isOpen: boolean;
  event: Partial<CalendarEvent> | null;
  onSave: (event: Omit<CalendarEvent, 'id'> & { id?: string }) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

const COLOR_PALETTE = [
  '#9333ea', // Purple
  '#a855f7', // Violet
  '#6366f1', // Indigo
  '#3b82f6', // Blue
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#ec4899', // Pink
];

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  event,
  onSave,
  onDelete,
  onClose,
}) => {
  const [title, setTitle] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [color, setColor] = useState('#9333ea');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (event) {
      setTitle(event.title || '');
      setStart(event.start ? event.start.slice(0, 16) : '');
      setEnd(event.end ? event.end.slice(0, 16) : '');
      setColor(event.color || '#9333ea');
      setNotes(event.notes || '');
    } else {
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      setTitle('');
      setStart(now.toISOString().slice(0, 16));
      setEnd(oneHourLater.toISOString().slice(0, 16));
      setColor('#9333ea');
      setNotes('');
    }
  }, [event, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !start) return;

    onSave({
      ...(event?.id ? { id: event.id } : {}),
      title: title.trim(),
      start: start.length === 16 ? `${start}:00` : start,
      end: end ? (end.length === 16 ? `${end}:00` : end) : `${start}:00`,
      color,
      notes: notes.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md glass-panel rounded-2xl p-6 shadow-2xl border border-slate-700/80">
        <div className="flex items-center justify-between pb-4 border-b border-slate-700/50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">
              {event?.id ? 'Edit Event' : 'Create Event'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Weekly Roadmap Planning"
              className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Start Time
              </label>
              <input
                type="datetime-local"
                required
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="w-full mt-1.5 px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                End Time
              </label>
              <input
                type="datetime-local"
                required
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="w-full mt-1.5 px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Color Accent
            </label>
            <div className="flex items-center gap-2 mt-2">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    color === c ? 'ring-2 ring-white scale-110' : 'hover:scale-105 opacity-80'
                  }`}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Agenda or notes..."
              className="w-full mt-1.5 px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-700/50 mt-6">
            {event?.id && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Delete event "${event.title}"?`)) {
                    onDelete(event.id!);
                    onClose();
                  }
                }}
                className="px-3 py-2 text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-xl flex items-center gap-1.5 transition"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/30 transition"
              >
                {event?.id ? 'Save Changes' : 'Create Event'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
