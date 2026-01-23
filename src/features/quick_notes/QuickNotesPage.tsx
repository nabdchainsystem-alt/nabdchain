import React, { useState, useMemo, useEffect } from 'react';
import { Note as StickyNote, PushPin as Pin, Trash as Trash2, MagnifyingGlass as Search, Funnel as Filter, Plus, X, Clock, Tag, ArrowDown, ArrowUp, Sparkle as Sparkles } from 'phosphor-react';

interface QuickNote {
    id: string;
    content: string;
    tags: string[];
    pinned: boolean;
    createdAt: string;
}

const TAG_COLORS: Record<string, { bg: string; text: string }> = {
    important: { bg: 'bg-red-100 dark:bg-red-500/20', text: 'text-red-700 dark:text-red-400' },
    todo: { bg: 'bg-amber-100 dark:bg-amber-500/20', text: 'text-amber-700 dark:text-amber-400' },
    idea: { bg: 'bg-blue-100 dark:bg-blue-500/20', text: 'text-blue-700 dark:text-blue-400' },
    later: { bg: 'bg-gray-100 dark:bg-gray-500/20', text: 'text-gray-700 dark:text-gray-400' },
    urgent: { bg: 'bg-orange-100 dark:bg-orange-500/20', text: 'text-orange-700 dark:text-orange-400' },
    work: { bg: 'bg-indigo-100 dark:bg-indigo-500/20', text: 'text-indigo-700 dark:text-indigo-400' },
    personal: { bg: 'bg-pink-100 dark:bg-pink-500/20', text: 'text-pink-700 dark:text-pink-400' },
    meeting: { bg: 'bg-purple-100 dark:bg-purple-500/20', text: 'text-purple-700 dark:text-purple-400' },
};

const NOTES_KEY = 'nabd-quick-notes';

const loadNotes = (): QuickNote[] => {
    try {
        const saved = localStorage.getItem(NOTES_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch {
        return [];
    }
};

const saveNotes = (notes: QuickNote[]) => {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
};

const QuickNotesPage: React.FC = () => {
    const [notes, setNotes] = useState<QuickNote[]>(loadNotes);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterTag, setFilterTag] = useState<string>('');
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
    const [newNoteContent, setNewNoteContent] = useState('');
    const [isAddingNote, setIsAddingNote] = useState(false);
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');

    // Persist notes
    useEffect(() => {
        saveNotes(notes);
    }, [notes]);

    // Listen for storage changes (sync with Smart Bar)
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === NOTES_KEY) {
                setNotes(loadNotes());
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // Also poll for changes from same window (Smart Bar updates)
    useEffect(() => {
        const interval = setInterval(() => {
            const currentNotes = loadNotes();
            if (JSON.stringify(currentNotes) !== JSON.stringify(notes)) {
                setNotes(currentNotes);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [notes]);

    // Extract all unique tags
    const allTags = useMemo(() => {
        const tagSet = new Set<string>();
        notes.forEach(note => note.tags?.forEach(tag => tagSet.add(tag)));
        return Array.from(tagSet).sort();
    }, [notes]);

    // Filter and sort notes
    const filteredNotes = useMemo(() => {
        let result = [...notes];

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(note =>
                note.content.toLowerCase().includes(query) ||
                note.tags?.some(tag => tag.toLowerCase().includes(query))
            );
        }

        // Tag filter
        if (filterTag) {
            result = result.filter(note => note.tags?.includes(filterTag));
        }

        // Sort: pinned first, then by date
        result.sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });

        return result;
    }, [notes, searchQuery, filterTag, sortOrder]);

    // Stats
    const stats = useMemo(() => ({
        total: notes.length,
        pinned: notes.filter(n => n.pinned).length,
        today: notes.filter(n => {
            const noteDate = new Date(n.createdAt).toDateString();
            return noteDate === new Date().toDateString();
        }).length
    }), [notes]);

    const extractTags = (content: string): string[] => {
        return (content.match(/#(\w+)/g) || []).map(t => t.slice(1).toLowerCase());
    };

    const getContentWithoutTags = (content: string): string => {
        return content.replace(/#\w+/g, '').trim();
    };

    const handleAddNote = () => {
        if (!newNoteContent.trim()) return;

        const tags = extractTags(newNoteContent);
        const content = getContentWithoutTags(newNoteContent);

        const newNote: QuickNote = {
            id: `note-${Date.now()}`,
            content,
            tags,
            pinned: tags.includes('important') || tags.includes('urgent'),
            createdAt: new Date().toISOString()
        };

        setNotes(prev => [newNote, ...prev]);
        setNewNoteContent('');
        setIsAddingNote(false);
    };

    const handleUpdateNote = (noteId: string) => {
        if (!editContent.trim()) return;

        const tags = extractTags(editContent);
        const content = getContentWithoutTags(editContent);

        setNotes(prev => prev.map(note =>
            note.id === noteId
                ? { ...note, content, tags, pinned: tags.includes('important') || tags.includes('urgent') || note.pinned }
                : note
        ));
        setEditingNoteId(null);
        setEditContent('');
    };

    const togglePin = (noteId: string) => {
        setNotes(prev => prev.map(note =>
            note.id === noteId ? { ...note, pinned: !note.pinned } : note
        ));
    };

    const deleteNote = (noteId: string) => {
        setNotes(prev => prev.filter(note => note.id !== noteId));
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    const getTagStyle = (tag: string) => {
        const style = TAG_COLORS[tag.toLowerCase()];
        if (style) return style;
        return { bg: 'bg-gray-100 dark:bg-gray-500/20', text: 'text-gray-700 dark:text-gray-400' };
    };

    return (
        <div className="h-full w-full bg-[#FCFCFD] dark:bg-monday-dark-bg overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-8 py-6 border-b border-gray-100 dark:border-monday-dark-border bg-white dark:bg-monday-dark-surface">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                            <StickyNote className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Quick Notes</h1>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Capture ideas on the fly with the Smart Bar</p>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsAddingNote(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black text-sm font-medium rounded-lg hover:opacity-80 transition-opacity"
                    >
                        <Plus size={16} />
                        New Note
                    </button>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Total:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{stats.total}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <Pin size={14} className="text-amber-500" />
                        <span className="text-gray-500 dark:text-gray-400">Pinned:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{stats.pinned}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <Clock size={14} className="text-blue-500" />
                        <span className="text-gray-500 dark:text-gray-400">Today:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{stats.today}</span>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="flex items-center gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search notes..."
                            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-monday-dark-bg border border-gray-200 dark:border-monday-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                    </div>

                    <div className="relative">
                        <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <select
                            value={filterTag}
                            onChange={(e) => setFilterTag(e.target.value)}
                            className="pl-9 pr-8 py-2 text-sm bg-gray-50 dark:bg-monday-dark-bg border border-gray-200 dark:border-monday-dark-border rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                            <option value="">All Tags</option>
                            {allTags.map(tag => (
                                <option key={tag} value={tag}>#{tag}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
                        className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-50 dark:bg-monday-dark-bg border border-gray-200 dark:border-monday-dark-border rounded-lg hover:bg-gray-100 dark:hover:bg-monday-dark-hover transition-colors"
                        title={sortOrder === 'newest' ? 'Newest first' : 'Oldest first'}
                    >
                        {sortOrder === 'newest' ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
                        {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
                    </button>
                </div>
            </div>

            {/* Notes Grid */}
            <div className="flex-1 overflow-y-auto p-8">
                {/* Add Note Form */}
                {isAddingNote && (
                    <div className="mb-6 p-4 bg-white dark:bg-monday-dark-surface border border-gray-200 dark:border-monday-dark-border rounded-xl shadow-sm">
                        <textarea
                            autoFocus
                            value={newNoteContent}
                            onChange={(e) => setNewNoteContent(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                    handleAddNote();
                                }
                                if (e.key === 'Escape') {
                                    setIsAddingNote(false);
                                    setNewNoteContent('');
                                }
                            }}
                            placeholder="Write your note... Use #tags to organize (e.g., #important #todo)"
                            className="w-full h-24 p-2 text-sm bg-transparent border-none resize-none focus:outline-none placeholder-gray-400"
                        />
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                            <p className="text-xs text-gray-400">Tip: Use #important or #urgent to auto-pin</p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => { setIsAddingNote(false); setNewNoteContent(''); }}
                                    className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddNote}
                                    disabled={!newNoteContent.trim()}
                                    className="px-4 py-1.5 text-xs font-medium text-white bg-black dark:bg-white dark:text-black rounded-lg hover:opacity-80 disabled:opacity-40 transition-opacity"
                                >
                                    Save Note
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {filteredNotes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                            <Sparkles className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No notes yet</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                            {searchQuery || filterTag
                                ? 'No notes match your search. Try different keywords.'
                                : 'Click the Smart Bar icon and select "Quick Note" to capture your first idea.'
                            }
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredNotes.map(note => (
                            <div
                                key={note.id}
                                className={`group relative p-4 bg-white dark:bg-monday-dark-surface border rounded-xl transition-all hover:shadow-md ${
                                    note.pinned
                                        ? 'border-amber-200 dark:border-amber-500/30 ring-1 ring-amber-100 dark:ring-amber-500/10'
                                        : 'border-gray-200 dark:border-monday-dark-border'
                                }`}
                            >
                                {/* Pin indicator */}
                                {note.pinned && (
                                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center shadow-sm">
                                        <Pin size={12} className="text-white" fill="white" />
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => togglePin(note.id)}
                                        className={`p-1.5 rounded-lg transition-colors ${
                                            note.pinned
                                                ? 'text-amber-500 bg-amber-50 dark:bg-amber-500/10'
                                                : 'text-gray-400 hover:text-amber-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                                        }`}
                                        title={note.pinned ? 'Unpin' : 'Pin'}
                                    >
                                        <Pin size={14} />
                                    </button>
                                    <button
                                        onClick={() => deleteNote(note.id)}
                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>

                                {/* Content */}
                                {editingNoteId === note.id ? (
                                    <div>
                                        <textarea
                                            autoFocus
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                                    handleUpdateNote(note.id);
                                                }
                                                if (e.key === 'Escape') {
                                                    setEditingNoteId(null);
                                                    setEditContent('');
                                                }
                                            }}
                                            className="w-full h-20 p-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        />
                                        <div className="flex justify-end gap-2 mt-2">
                                            <button
                                                onClick={() => { setEditingNoteId(null); setEditContent(''); }}
                                                className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={() => handleUpdateNote(note.id)}
                                                className="px-3 py-1 text-xs font-medium text-white bg-blue-500 rounded hover:bg-blue-600"
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => {
                                            setEditingNoteId(note.id);
                                            setEditContent(note.content + ' ' + note.tags.map(t => `#${t}`).join(' '));
                                        }}
                                        className="cursor-pointer"
                                    >
                                        <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap break-words pr-8">
                                            {note.content}
                                        </p>
                                    </div>
                                )}

                                {/* Tags */}
                                {note.tags.length > 0 && editingNoteId !== note.id && (
                                    <div className="flex flex-wrap items-center gap-1.5 mt-3">
                                        {note.tags.map(tag => {
                                            const style = getTagStyle(tag);
                                            return (
                                                <span
                                                    key={tag}
                                                    onClick={() => setFilterTag(tag)}
                                                    className={`px-2 py-0.5 text-[10px] font-medium rounded-full cursor-pointer hover:opacity-80 transition-opacity ${style.bg} ${style.text}`}
                                                >
                                                    #{tag}
                                                </span>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Timestamp */}
                                <div className="flex items-center gap-1.5 mt-3 text-[10px] text-gray-400 font-datetime">
                                    <Clock size={10} />
                                    {formatDate(note.createdAt)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuickNotesPage;
