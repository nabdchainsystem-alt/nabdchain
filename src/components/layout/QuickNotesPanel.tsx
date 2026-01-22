import React, { useState } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { X, Note, Trash, PushPin, ArrowLeft, Copy, Check } from 'phosphor-react';
import { useQuickNotes, QuickNote } from '../../hooks/useQuickNotes';
import { formatTimeAgo } from '../../utils/formatters';

interface QuickNotesPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export const QuickNotesPanel: React.FC<QuickNotesPanelProps> = ({
    isOpen,
    onClose
}) => {
    const { t, language } = useAppContext();
    const { notes, deleteNote, togglePinNote, updateNote } = useQuickNotes();
    const [selectedNote, setSelectedNote] = useState<QuickNote | null>(null);
    const [editingContent, setEditingContent] = useState('');
    const [copiedId, setCopiedId] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleNoteClick = (note: QuickNote) => {
        setSelectedNote(note);
        setEditingContent(note.content);
    };

    const handleBack = () => {
        if (selectedNote && editingContent !== selectedNote.content) {
            updateNote(selectedNote.id, editingContent);
        }
        setSelectedNote(null);
    };

    const handleCopy = (content: string, id: string) => {
        navigator.clipboard.writeText(content);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const sortedNotes = [...notes].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return (
        <div className="absolute top-full right-0 rtl:right-auto rtl:left-0 mt-2 w-80 max-h-[500px] bg-white dark:bg-monday-dark-surface rounded-xl shadow-2xl border border-gray-100 dark:border-monday-dark-border z-50 overflow-hidden animate-fadeIn flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-monday-dark-border bg-gray-50 dark:bg-monday-dark-bg shrink-0">
                <div className="flex items-center gap-2">
                    {selectedNote ? (
                        <button
                            onClick={handleBack}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-monday-dark-hover rounded-md transition-colors mr-1 rtl:ml-1 rtl:mr-0"
                        >
                            <ArrowLeft size={16} className="text-gray-600 dark:text-monday-dark-text" />
                        </button>
                    ) : (
                        <Note size={18} className="text-amber-500" weight="duotone" />
                    )}
                    <h3 className="font-semibold text-gray-800 dark:text-monday-dark-text">
                        {selectedNote ? t('edit_note') : t('quick_notes')}
                    </h3>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-monday-dark-hover rounded-md transition-colors"
                >
                    <X size={18} className="text-gray-500 dark:text-monday-dark-text-secondary" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto min-h-[300px]">
                {selectedNote ? (
                    <div className="p-4 h-full flex flex-col">
                        <textarea
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            className="flex-1 w-full p-3 bg-gray-50 dark:bg-monday-dark-bg border-none rounded-lg resize-none outline-none focus:ring-1 focus:ring-amber-500 text-sm text-gray-800 dark:text-monday-dark-text"
                            placeholder={t('type_note_here')}
                            autoFocus
                        />
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-monday-dark-border">
                            <span className="text-xs text-gray-400">
                                {formatTimeAgo(selectedNote.createdAt, language)}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleCopy(editingContent, selectedNote.id)}
                                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-monday-dark-hover rounded-full transition-colors relative"
                                    title={t('copy')}
                                >
                                    {copiedId === selectedNote.id ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                                </button>
                                <button
                                    onClick={() => togglePinNote(selectedNote.id)}
                                    className={`p-2 rounded-full transition-colors ${selectedNote.pinned ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-monday-dark-hover'}`}
                                    title={selectedNote.pinned ? t('unpin') : t('pin')}
                                >
                                    <PushPin size={16} weight={selectedNote.pinned ? "fill" : "regular"} />
                                </button>
                                <button
                                    onClick={() => {
                                        deleteNote(selectedNote.id);
                                        setSelectedNote(null);
                                    }}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                                    title={t('delete')}
                                >
                                    <Trash size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-monday-dark-border">
                        {sortedNotes.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-monday-dark-text-secondary">
                                <Note size={48} weight="light" className="mb-3 opacity-50" />
                                <p className="text-sm">{t('no_notes_yet')}</p>
                            </div>
                        ) : (
                            sortedNotes.map((note) => (
                                <div
                                    key={note.id}
                                    onClick={() => handleNoteClick(note)}
                                    className="group px-4 py-3 hover:bg-gray-50 dark:hover:bg-monday-dark-hover cursor-pointer transition-colors relative"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-gray-800 dark:text-monday-dark-text line-clamp-2">
                                                {note.content}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <span className="text-[10px] text-gray-400">
                                                    {formatTimeAgo(note.createdAt, language)}
                                                </span>
                                                {note.tags.map(tag => (
                                                    <span key={tag} className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[10px] text-gray-500 font-medium">
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        {note.pinned && (
                                            <PushPin size={14} weight="fill" className="text-amber-500 shrink-0 mt-1" />
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
            {!selectedNote && (
                <div className="p-3 border-t border-gray-100 dark:border-monday-dark-border bg-gray-50 dark:bg-monday-dark-bg text-center">
                    <span className="text-xs text-gray-400">{t('use_quick_notes_hint')}</span>
                </div>
            )}
        </div>
    );
};
