import React, { useState, useEffect } from 'react';
import { Plus, Copy, Trash, Check, CaretLeft, MagnifyingGlass } from 'phosphor-react';

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = 'mobile-notes-v1';

export const MobileNotes: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Persist notes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  const activeNote = notes.find((n) => n.id === activeNoteId);

  const createNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: 'Untitled Note',
      content: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setNotes([newNote, ...notes]);
    setActiveNoteId(newNote.id);
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    setNotes(notes.map((n) => (n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n)));
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter((n) => n.id !== id));
    if (activeNoteId === id) {
      setActiveNoteId(null);
    }
  };

  const copyNote = async (note: Note) => {
    const textToCopy = `${note.title}\n\n${note.content}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedId(note.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (_err) {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = textToCopy;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedId(note.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const filteredNotes = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Note Editor View
  if (activeNote) {
    return (
      <div className="flex flex-col h-full bg-white">
        {/* Editor Header */}
        <div className="flex items-center gap-2 px-2 py-2 border-b border-gray-200">
          <button
            onClick={() => setActiveNoteId(null)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <CaretLeft size={24} />
          </button>
          <input
            type="text"
            value={activeNote.title}
            onChange={(e) => updateNote(activeNote.id, { title: e.target.value })}
            placeholder="Note title"
            className="flex-1 text-lg font-semibold bg-transparent focus:outline-none"
          />
          <button
            onClick={() => copyNote(activeNote)}
            className={`p-2 rounded-lg transition-colors ${
              copiedId === activeNote.id ? 'text-green-600 bg-green-50' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {copiedId === activeNote.id ? <Check size={20} /> : <Copy size={20} />}
          </button>
          <button
            onClick={() => deleteNote(activeNote.id)}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash size={20} />
          </button>
        </div>

        {/* Editor Content */}
        <textarea
          value={activeNote.content}
          onChange={(e) => updateNote(activeNote.id, { content: e.target.value })}
          placeholder="Start writing..."
          className="flex-1 p-4 text-base resize-none focus:outline-none"
          autoFocus
        />

        {/* Editor Footer */}
        <div className="px-4 py-2 text-xs text-gray-400 border-t border-gray-100">
          Last edited {formatDate(activeNote.updatedAt)}
        </div>
      </div>
    );
  }

  // Notes List View
  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="relative">
          <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-auto">
        {filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <p className="text-sm mb-4">{searchQuery ? 'No notes found' : 'No notes yet'}</p>
            {!searchQuery && (
              <button
                onClick={createNote}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Create your first note
              </button>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filteredNotes.map((note) => (
              <li key={note.id} className="bg-white hover:bg-gray-50 transition-colors">
                <div
                  onClick={() => setActiveNoteId(note.id)}
                  className="flex items-start gap-3 px-4 py-3 cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-800 truncate">{note.title || 'Untitled'}</h3>
                    <p className="text-sm text-gray-500 truncate mt-0.5">{note.content || 'No content'}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatDate(note.updatedAt)}</p>
                  </div>

                  {/* Quick Copy Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyNote(note);
                    }}
                    className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
                      copiedId === note.id
                        ? 'text-green-600 bg-green-50'
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {copiedId === note.id ? <Check size={18} /> : <Copy size={18} />}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Floating Add Button */}
      <button
        onClick={createNote}
        className="absolute bottom-20 right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 active:bg-blue-800 transition-colors"
      >
        <Plus size={28} weight="bold" />
      </button>
    </div>
  );
};

export default MobileNotes;
