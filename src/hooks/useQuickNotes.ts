import { useState, useEffect, useCallback } from 'react';

export interface QuickNote {
    id: string;
    content: string;
    tags: string[];
    pinned: boolean;
    createdAt: string;
}

const NOTES_KEY = 'nabd-quick-notes';

export const useQuickNotes = () => {
    const [notes, setNotes] = useState<QuickNote[]>([]);

    // Load notes on mount
    useEffect(() => {
        const loadNotes = () => {
            try {
                const saved = localStorage.getItem(NOTES_KEY);
                if (saved) {
                    setNotes(JSON.parse(saved));
                }
            } catch (e) {
                console.error('Failed to load notes', e);
            }
        };

        loadNotes();

        // Listen for storage events (sync across tabs/components)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === NOTES_KEY) {
                loadNotes();
            }
        };

        // Custom event for same-tab updates
        const handleLocalUpdate = () => loadNotes();

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('quick-notes-updated', handleLocalUpdate);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('quick-notes-updated', handleLocalUpdate);
        };
    }, []);

    const saveNotes = useCallback((newNotes: QuickNote[]) => {
        setNotes(newNotes);
        localStorage.setItem(NOTES_KEY, JSON.stringify(newNotes));
        // Dispatch custom event to notify other components in same tab
        window.dispatchEvent(new Event('quick-notes-updated'));
    }, []);

    const addNote = useCallback((content: string, tags: string[] = []) => {
        const newNote: QuickNote = {
            id: `note-${Date.now()}`,
            content,
            tags,
            pinned: tags.includes('important') || tags.includes('urgent'),
            createdAt: new Date().toISOString()
        };

        saveNotes([newNote, ...notes]);
        return newNote;
    }, [notes, saveNotes]);

    const deleteNote = useCallback((id: string) => {
        saveNotes(notes.filter(n => n.id !== id));
    }, [notes, saveNotes]);

    const togglePinNote = useCallback((id: string) => {
        saveNotes(notes.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n));
    }, [notes, saveNotes]);

    const updateNote = useCallback((id: string, content: string) => {
        saveNotes(notes.map(n => n.id === id ? { ...n, content } : n));
    }, [notes, saveNotes]);

    return {
        notes,
        addNote,
        deleteNote,
        togglePinNote,
        updateNote
    };
};
