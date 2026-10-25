import React, { useState } from 'react';
import { FileText, Plus, Trash2, Search, Edit3 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { formatDateTime } from '../../lib/dateUtils';
import type { Note } from '../../types';

export const NotesView: React.FC = () => {
  const notes = useStore((s) => s.notes);
  const addNote = useStore((s) => s.addNote);
  const updateNote = useStore((s) => s.updateNote);
  const deleteNote = useStore((s) => s.deleteNote);

  const [search, setSearch] = useState('');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editText, setEditText] = useState('');
  const [editTags, setEditTags] = useState('');

  const filteredNotes = notes.filter((n) => {
    const q = search.toLowerCase();
    const matchTitle = n.title?.toLowerCase().includes(q);
    const matchText = n.text.toLowerCase().includes(q);
    const matchTag = n.tags?.some((t) => t.toLowerCase().includes(q));
    return matchTitle || matchText || matchTag;
  });

  const handleStartCreate = () => {
    setSelectedNote(null);
    setEditTitle('');
    setEditText('');
    setEditTags('');
    setIsEditing(true);
  };

  const handleStartEdit = (note: Note) => {
    setSelectedNote(note);
    setEditTitle(note.title || '');
    setEditText(note.text);
    setEditTags(note.tags ? note.tags.join(', ') : '');
    setIsEditing(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editText.trim()) return;

    const parsedTags = editTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (selectedNote) {
      updateNote(selectedNote.id, {
        title: editTitle.trim() || 'Untitled Note',
        text: editText.trim(),
        tags: parsedTags,
      });
    } else {
      addNote(editText.trim(), editTitle.trim() || 'Untitled Note', parsedTags);
    }

    setIsEditing(false);
    setSelectedNote(null);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" /> Notes & Thoughts
          </h2>
          <p className="text-xs text-slate-400">
            Jot down ideas, meeting notes, and project documentation
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search notes or tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="py-2 pl-9 pr-3.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 w-48 sm:w-64"
            />
          </div>

          <button
            onClick={handleStartCreate}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition shrink-0"
          >
            <Plus className="w-4 h-4" /> New Note
          </button>
        </div>
      </div>

      {/* Editor Drawer / Modal */}
      {isEditing && (
        <form
          onSubmit={handleSave}
          className="glass-panel p-5 rounded-2xl border border-indigo-500/40 space-y-4 animate-in slide-in-from-top-2 duration-200"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-sm font-bold text-slate-200">
              {selectedNote ? 'Edit Note' : 'Create New Note'}
            </h3>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Title
            </label>
            <input
              type="text"
              placeholder="Note Title"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full mt-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Content
            </label>
            <textarea
              rows={5}
              required
              placeholder="Write your note here..."
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Tags (comma separated)
            </label>
            <input
              type="text"
              placeholder="AI, Roadmap, Architecture"
              value={editTags}
              onChange={(e) => setEditTags(e.target.value)}
              className="w-full mt-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md shadow-indigo-600/30"
            >
              Save Note
            </button>
          </div>
        </form>
      )}

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredNotes.length === 0 ? (
          <div className="col-span-full glass-panel p-12 text-center rounded-2xl border border-slate-800">
            <FileText className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-400">No notes found</p>
            <p className="text-xs text-slate-500 mt-1">Create your first note above to capture ideas.</p>
          </div>
        ) : (
          filteredNotes.map((note) => (
            <div
              key={note.id}
              className="group glass-card p-5 rounded-2xl border border-slate-800 hover:border-slate-700 flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-slate-100 text-base leading-snug">
                    {note.title || 'Untitled Note'}
                  </h3>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => handleStartEdit(note)}
                      className="p-1.5 text-slate-400 hover:text-indigo-400 rounded-lg hover:bg-slate-800 transition"
                      title="Edit note"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteNote(note.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                      title="Delete note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed line-clamp-6">
                  {note.text}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                <div className="flex flex-wrap items-center gap-1.5">
                  {note.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                <span className="text-slate-500">
                  {formatDateTime(note.createdAt).split(' ')[0]}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
