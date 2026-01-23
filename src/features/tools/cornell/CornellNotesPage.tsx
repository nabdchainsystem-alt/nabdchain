import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { CornellLayout } from './CornellLayout';
import { FloppyDisk as Save, Plus, FileText, Trash as Trash2, MagnifyingGlass as Search, List as Menu, X, Clock, CheckSquare, Tag, Link as LinkIcon, CaretDown as ChevronDown, DotsThree as MoreHorizontal, Funnel as Filter, ArrowUp, ArrowDown, WarningCircle as AlertCircle, CalendarBlank as Calendar } from 'phosphor-react';
import { SharedDatePicker } from '../../../components/ui/SharedDatePicker';
import { PortalPopup } from '../../../components/ui/PortalPopup';
import { useAppContext } from '../../../contexts/AppContext';
import { appLogger } from '../../../utils/logger';

// --- Types ---
interface ActionItem {
    id: string;
    title: string;
    done: boolean;
    dueDate?: string;
    owner?: string;
    link?: string;
}

interface CornellNote {
    id: string;
    title: string;
    date: string; // ISO Date string YYYY-MM-DD
    cues: string;
    notes: string;
    summary: string;
    topic: string;

    // New Fields
    tags: string[];
    linkedRecords: string[];
    actionItems: ActionItem[];
    updatedAt: number;
    createdAt: number;
}

interface CornellNotesPageProps {
    roomId?: string;
}

// --- Templates ---
const TEMPLATES = [
    {
        id: 'basic',
        label: 'Basic',
        cues: 'Questions / Cues:',
        notes: 'Notes:',
        summary: 'Summary:'
    },
    {
        id: 'meeting',
        label: 'Meeting Notes',
        cues: 'Attendees:\n\nAgenda Items:\n\nDecisions Made:',
        notes: 'Discussion Points:\n\n\n\nFollow-up:',
        summary: 'Key takeaway from this meeting:'
    },
    {
        id: 'root-cause',
        label: 'Problem / Root Cause',
        cues: 'Symptoms:\n\nTimeline:\n\nPotential Causes:',
        notes: 'Investigation Details:\n\n\nEvidence:',
        summary: 'Root Cause identified:'
    },
    {
        id: 'vendor',
        label: 'Vendor Call',
        cues: 'Vendor Name:\nContact Person:\n\nQuestions to Ask:',
        notes: 'Call Notes:\n\n\nPricing/Terms discussed:',
        summary: 'Next steps with vendor:'
    },
    {
        id: 'weekly',
        label: 'Weekly Review',
        cues: 'Wins:\n\nChallenges:\n\nMetrics:',
        notes: 'Project Updates:\n\n\n\nPriorities for next week:',
        summary: 'Focus for the upcoming week:'
    }
];

const CornellNotesPage: React.FC<CornellNotesPageProps> = ({ roomId = 'default' }) => {
    const { t } = useAppContext();

    // --- State ---
    const [notesList, setNotesList] = useState<CornellNote[]>([]);
    const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

    // Filter/Sort State
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
    const [filterTag, setFilterTag] = useState<string>('');

    // Active Note Content State
    const [cues, setCues] = useState('');
    const [notes, setNotes] = useState('');
    const [summary, setSummary] = useState('');
    const [topic, setTopic] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [title, setTitle] = useState('Untitled Note');

    // New Content State
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [linkedRecords, setLinkedRecords] = useState<string[]>([]);
    const [linkInput, setLinkInput] = useState('');
    const [actionItems, setActionItems] = useState<ActionItem[]>([]);
    const [actionInput, setActionInput] = useState('');

    // Popover Refs & State
    const [activeDateSelector, setActiveDateSelector] = useState<{ id: 'note' | 'action', actionId?: string, rect: DOMRect } | null>(null);
    const dateTriggerRef = useRef<HTMLButtonElement>(null);

    // Modal State
    const [confirmationModal, setConfirmationModal] = useState<{
        isOpen: boolean;
        templateId?: string;
        message: string;
    }>({ isOpen: false, message: '' });

    const drawerRef = useRef<HTMLDivElement>(null);

    // Storage Keys
    const listKey = `cornell-notes-list-${roomId}`;

    // --- Helpers ---
    const getSafeList = (data: any[]): CornellNote[] => {
        // Ensure backward compatibility by mapping old notes to new structure
        return data.map(item => ({
            ...item,
            tags: item.tags || [],
            linkedRecords: item.linkedRecords || [],
            actionItems: item.actionItems || [],
            updatedAt: item.updatedAt || Date.now(),
            createdAt: item.createdAt || Date.now(),
        }));
    };

    // --- Effects ---

    // 1. Load List on Mount
    useEffect(() => {
        const savedList = localStorage.getItem(listKey);
        if (savedList) {
            try {
                const parsed = JSON.parse(savedList);
                const safeList = getSafeList(parsed);
                setNotesList(safeList);
                if (safeList.length > 0) {
                    setActiveNoteId(safeList[0].id);
                } else {
                    handleCreateNewNote();
                }
            } catch (e) {
                appLogger.error("Failed to load notes list", e);
                handleCreateNewNote();
            }
        } else {
            handleCreateNewNote();
        }
    }, [roomId]);

    // 2. Sync Active Note State when activeNoteId changes
    useEffect(() => {
        if (!activeNoteId) return;

        const note = notesList.find(n => n.id === activeNoteId);
        if (note) {
            // Load state
            setCues(note.cues || '');
            setNotes(note.notes || '');
            setSummary(note.summary || '');
            setTopic(note.topic || '');
            setDate(note.date || new Date().toISOString().split('T')[0]);
            setTitle(note.title || 'Untitled Note');
            setTags(note.tags || []);
            setLinkedRecords(note.linkedRecords || []);
            setActionItems(note.actionItems || []);
            setSaveStatus('saved');
        }
    }, [activeNoteId]);

    // 3. Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                handleSave();
            }
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                if (isDrawerOpen) setIsDrawerOpen(false);
                handleSave();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isDrawerOpen, activeNoteId, title, topic, date, cues, notes, summary, tags, linkedRecords, actionItems]);


    // Click Outside Drawer
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (drawerRef.current && !drawerRef.current.contains(event.target as Node) && isDrawerOpen) {
                setIsDrawerOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isDrawerOpen]);


    // --- Actions ---

    const handleCreateNewNote = () => {
        const now = Date.now();
        const newNote: CornellNote = {
            id: now.toString(),
            title: 'Untitled Note',
            topic: '',
            date: new Date().toISOString().split('T')[0],
            cues: '',
            notes: '',
            summary: '',
            tags: [],
            linkedRecords: [],
            actionItems: [],
            createdAt: now,
            updatedAt: now
        };

        const newList = [newNote, ...notesList];
        setNotesList(newList);
        setActiveNoteId(newNote.id);

        localStorage.setItem(listKey, JSON.stringify(newList));
        setIsDrawerOpen(false);
    };

    const handleSave = () => {
        if (!activeNoteId) return;
        setSaveStatus('saving');

        const updatedNote: CornellNote = {
            id: activeNoteId,
            title: title || 'Untitled Note',
            topic,
            date,
            cues,
            notes,
            summary,
            tags,
            linkedRecords,
            actionItems,
            createdAt: notesList.find(n => n.id === activeNoteId)?.createdAt || Date.now(),
            updatedAt: Date.now()
        };

        const newList = notesList.map(n => n.id === activeNoteId ? updatedNote : n);

        // Optimistic update
        setNotesList(newList);
        localStorage.setItem(listKey, JSON.stringify(newList));

        setTimeout(() => setSaveStatus('saved'), 500);
    };

    const handleChange = (setter: React.Dispatch<React.SetStateAction<any>>, value: any) => {
        setter(value);
        setSaveStatus('unsaved');
    };

    const handleDeleteNote = (e: React.MouseEvent, noteId: string) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this note?')) return;

        const newList = notesList.filter(n => n.id !== noteId);
        setNotesList(newList);
        localStorage.setItem(listKey, JSON.stringify(newList));

        if (activeNoteId === noteId) {
            if (newList.length > 0) {
                setActiveNoteId(newList[0].id);
            } else {
                handleCreateNewNote();
            }
        }
    };

    // --- Templates Logic ---
    const requestApplyTemplate = (templateId: string) => {
        if (cues || notes || summary) {
            setConfirmationModal({
                isOpen: true,
                templateId,
                message: 'Do you want to append to existing notes or replace them?'
            });
        } else {
            // Apply directly if empty (replace mode effectively same as append on empty)
            applyTemplate(templateId, 'replace');
        }
    };

    const applyTemplate = (templateId: string, mode: 'append' | 'replace') => {
        const tmpl = TEMPLATES.find(t => t.id === templateId);
        if (!tmpl) return;

        if (mode === 'replace') {
            setCues(tmpl.cues);
            setNotes(tmpl.notes);
            setSummary(tmpl.summary);
        } else {
            if (!cues) setCues(tmpl.cues);
            else setCues(prev => prev + '\n\n' + tmpl.cues);

            if (!notes) setNotes(tmpl.notes);
            else setNotes(prev => prev + '\n\n' + tmpl.notes);

            if (!summary) setSummary(tmpl.summary);
            else setSummary(prev => prev + '\n\n' + tmpl.summary);
        }

        setSaveStatus('unsaved');
        setConfirmationModal({ isOpen: false, message: '' });
    };


    // --- Action Items Logic ---
    const handleAddAction = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && actionInput.trim()) {
            const newItem: ActionItem = {
                id: Date.now().toString(),
                title: actionInput.trim(),
                done: false,
                dueDate: undefined,
                owner: undefined,
                link: undefined
            };
            const newActions = [...actionItems, newItem];
            handleChange(setActionItems, newActions);
            setActionInput('');
            handleSave();
        }
    };
    const toggleAction = (id: string) => {
        const newActions = actionItems.map(a => a.id === id ? { ...a, done: !a.done } : a);
        handleChange(setActionItems, newActions);
        handleSave();
    };
    const deleteAction = (id: string) => {
        const newActions = actionItems.filter(a => a.id !== id);
        handleChange(setActionItems, newActions);
        handleSave();
    };

    const handleActionDateSelect = (actionId: string, d: Date) => {
        const newActions = actionItems.map(a => a.id === actionId ? { ...a, dueDate: d.toISOString().split('T')[0] } : a);
        handleChange(setActionItems, newActions);
        setActiveDateSelector(null);
        handleSave();
    };


    // --- Tags Logic ---
    const handleAddTag = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            if (!tags.includes(tagInput.trim())) {
                const newTags = [...tags, tagInput.trim()];
                handleChange(setTags, newTags);
            }
            setTagInput('');
        }
    };
    const removeTag = (t: string) => {
        handleChange(setTags, tags.filter(tag => tag !== t));
    };

    // --- Linked Records Logic ---
    const handleAddLink = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && linkInput.trim()) {
            if (!linkedRecords.includes(linkInput.trim())) {
                const newLinks = [...linkedRecords, linkInput.trim()];
                handleChange(setLinkedRecords, newLinks);
            }
            setLinkInput('');
        }
    };
    const removeLink = (l: string) => {
        handleChange(setLinkedRecords, linkedRecords.filter(link => link !== l));
    };


    // --- Filtering & Sorting ---
    const filteredNotes = useMemo(() => {
        let result = notesList;

        // Search
        if (searchQuery) {
            const lower = searchQuery.toLowerCase();
            result = result.filter(n =>
                n.title.toLowerCase().includes(lower) ||
                n.topic.toLowerCase().includes(lower) ||
                n.notes.toLowerCase().includes(lower) ||
                n.summary.toLowerCase().includes(lower)
            );
        }

        // Tag Filter
        if (filterTag) {
            result = result.filter(n => n.tags && n.tags.includes(filterTag));
        }

        // Sort
        return result.sort((a, b) => {
            const dateA = new Date(a.date).getTime() || 0;
            const dateB = new Date(b.date).getTime() || 0;
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });
    }, [notesList, searchQuery, sortOrder, filterTag]);

    // Collect all available tags for filter
    const allTags = useMemo(() => {
        const set = new Set<string>();
        notesList.forEach(n => n.tags?.forEach(t => set.add(t)));
        return Array.from(set);
    }, [notesList]);


    // --- Renderers ---

    const renderActionItems = () => (
        <div className="space-y-2 mt-2">
            {/* Input */}
            <div className="flex items-center gap-2 mb-3">
                <Plus size={16} className="text-gray-400" />
                <input
                    type="text"
                    value={actionInput}
                    onChange={(e) => setActionInput(e.target.value)}
                    onKeyDown={handleAddAction}
                    placeholder={t('add_action_item')}
                    className="flex-1 bg-transparent text-sm border-b border-dashed border-gray-300 dark:border-monday-dark-border focus:border-blue-500 outline-none pb-1"
                />
            </div>

            {/* List */}
            <div className="space-y-1">
                {actionItems.map(item => (
                    <div key={item.id} className="group flex items-center gap-3 text-sm hover:bg-gray-50 dark:hover:bg-monday-dark-hover/50 p-1.5 rounded -ml-1.5">
                        <button
                            onClick={() => toggleAction(item.id)}
                            className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${item.done ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-400 text-transparent hover:border-blue-500'}`}
                        >
                            <CheckSquare size={12} fill="currentColor" className={item.done ? 'opacity-100' : 'opacity-0'} />
                        </button>
                        <span className={`flex-1 ${item.done ? 'text-gray-400 line-through' : 'text-gray-700 dark:text-monday-dark-text'}`}>
                            {item.title}
                        </span>

                        <div className="flex items-center gap-2">
                            {item.dueDate && (
                                <span className="text-[10px] bg-zinc-100 dark:bg-monday-dark-hover text-zinc-500 dark:text-monday-dark-text-secondary px-1.5 py-0.5 rounded font-medium font-datetime">
                                    {new Date(item.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>
                            )}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveDateSelector({ id: 'action', actionId: item.id, rect: e.currentTarget.getBoundingClientRect() });
                                }}
                                className={`p-1 rounded hover:bg-zinc-100 dark:hover:bg-monday-dark-hover transition-colors ${item.dueDate ? 'text-blue-500' : 'text-gray-400'}`}
                            >
                                <Calendar size={13} />
                            </button>
                            <button onClick={() => deleteAction(item.id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1 transition-opacity">
                                <Trash2 size={13} />
                            </button>
                        </div>
                    </div>
                ))}
                {actionItems.length > 0 && (
                    <div className="text-[10px] text-gray-400 text-end mt-1">
                        {actionItems.filter(i => i.done).length} / {actionItems.length} {t('completed')}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="flex h-full w-full bg-[#FCFCFD] dark:bg-monday-dark-bg overflow-hidden relative">

            {/* Drawer Navigation */}
            <div
                ref={drawerRef}
                className={`fixed top-0 left-0 h-full w-80 bg-white dark:bg-monday-dark-surface shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-r border-gray-200 dark:border-monday-dark-border flex flex-col ${isDrawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="p-4 border-b border-gray-100 dark:border-monday-dark-border flex items-center justify-between bg-gray-50/50 dark:bg-monday-dark-bg/50">
                    <span className="font-semibold text-gray-800 dark:text-monday-dark-text flex items-center gap-2">
                        <FileText size={18} className="text-blue-600" /> {t('library')}
                    </span>
                    <button onClick={() => setIsDrawerOpen(false)} className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-200 dark:hover:bg-monday-dark-hover">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-4 space-y-3 border-b border-gray-100 dark:border-monday-dark-border">
                    <button
                        onClick={handleCreateNewNote}
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors shadow-sm"
                    >
                        <Plus size={16} /> {t('new_entry')}
                    </button>

                    {/* Filters */}
                    <div className="space-y-2 pt-2">
                        <div className="relative">
                            <Search size={14} className="absolute start-3 top-2.5 text-gray-400" />
                            <input
                                type="text"
                                placeholder={t('search')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full ps-9 pe-3 py-2 text-sm bg-gray-50 dark:bg-monday-dark-bg border border-gray-200 dark:border-monday-dark-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                            />
                        </div>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <select
                                    value={filterTag}
                                    onChange={(e) => setFilterTag(e.target.value)}
                                    className="w-full ps-2 pe-6 py-1.5 text-xs bg-gray-50 dark:bg-monday-dark-bg border border-gray-200 dark:border-monday-dark-border rounded-md appearance-none focus:outline-none focus:border-blue-500"
                                >
                                    <option value="">{t('all_tags')}</option>
                                    {allTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
                                </select>
                                <Filter size={10} className="absolute end-2 top-2.5 text-gray-400 pointer-events-none" />
                            </div>
                            <button
                                onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
                                className="px-2 py-1.5 border border-gray-200 dark:border-monday-dark-border rounded-md bg-gray-50 dark:bg-monday-dark-bg text-gray-600 hover:bg-gray-100"
                                title={sortOrder === 'newest' ? t('newest_first') : t('oldest_first')}
                            >
                                {sortOrder === 'newest' ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {filteredNotes.map(note => (
                        <div
                            key={note.id}
                            onClick={() => {
                                handleSave();
                                setActiveNoteId(note.id);
                                setIsDrawerOpen(false);
                            }}
                            className={`group flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all border ${activeNoteId === note.id ? 'bg-white shadow-md border-blue-200 z-10' : 'hover:bg-gray-50 dark:hover:bg-monday-dark-hover border-transparent'}`}
                        >
                            <div className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeNoteId === note.id ? 'bg-blue-500' : 'bg-gray-300'}`} />
                            <div className="flex-1 min-w-0">
                                <div className={`text-sm font-semibold truncate ${activeNoteId === note.id ? 'text-blue-900 dark:text-blue-100' : 'text-gray-800 dark:text-monday-dark-text'}`}>
                                    {note.title || t('untitled')}
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                    <span className="font-datetime">{note.date}</span>
                                    {note.tags.length > 0 && <span className="bg-gray-100 dark:bg-monday-dark-hover px-1.5 rounded text-[10px]">{note.tags[0]}</span>}
                                </div>
                            </div>
                            <div
                                onClick={(e) => handleDeleteNote(e, note.id)}
                                className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 rounded transition-opacity"
                            >
                                <Trash2 size={14} />
                            </div>
                        </div>
                    ))}
                    {filteredNotes.length === 0 && (
                        <div className="text-center py-10 text-gray-400 text-sm">
                            {t('no_notes_found')}
                        </div>
                    )}
                </div>
            </div>

            {/* Main Editor Area */}
            <div className={`flex-1 flex flex-col min-w-0 bg-[#FCFCFD] dark:bg-monday-dark-bg h-full ${confirmationModal.isOpen ? 'blur-sm brightness-90 transition-all duration-300' : 'transition-all duration-300'}`}>
                {/* Editor Header */}
                <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 dark:border-monday-dark-border bg-white dark:bg-monday-dark-bg z-10 shadow-sm">
                    <div className="flex items-center gap-4 flex-1">
                        <button
                            onClick={() => setIsDrawerOpen(true)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-monday-dark-hover rounded-md text-gray-600 dark:text-monday-dark-text-secondary transition-colors"
                            title={t('open_notes_library')}
                        >
                            <Menu size={20} />
                        </button>
                        <div className="flex-1">
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => handleChange(setTitle, e.target.value)}
                                onBlur={handleSave}
                                placeholder={t('note_title')}
                                className="w-full text-xl font-bold bg-transparent border-none outline-none placeholder-gray-300 dark:placeholder-gray-600 text-gray-900 dark:text-monday-dark-text font-sans"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Status Indicator */}
                        <div className="text-xs text-gray-400 flex items-center gap-1.5 me-2">
                            {saveStatus === 'saving' && <span className="animate-pulse">{t('saving')}</span>}
                            {saveStatus === 'saved' && <><Clock size={12} /> {t('saved')}</>}
                            {saveStatus === 'unsaved' && <span className="text-orange-400">{t('unsaved_changes')}</span>}
                        </div>

                        {/* Templates Dropdown */}
                        <div className="relative group">
                            <button className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 transition-colors">
                                {t('templates')} <ChevronDown size={12} />
                            </button>
                            <div className="absolute right-0 rtl:right-auto rtl:left-0 top-full mt-1 w-48 bg-white dark:bg-monday-dark-surface border border-gray-200 dark:border-monday-dark-border rounded-lg shadow-xl z-20 hidden group-hover:block animate-in fade-in zoom-in-95 duration-100">
                                <div className="py-1">
                                    {TEMPLATES.map(t => (
                                        <button
                                            key={t.id}
                                            onClick={() => requestApplyTemplate(t.id)}
                                            className="w-full text-start px-4 py-2 text-sm text-gray-700 dark:text-monday-dark-text hover:bg-blue-50 dark:hover:bg-monday-dark-hover hover:text-blue-600"
                                        >
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 shadow-sm transition-colors"
                            title={`${t('save')} (Cmd+S)`}
                        >
                            <Save size={16} /> {t('save')}
                        </button>
                    </div>
                </div>

                {/* Meta Bar */}
                <div className="px-6 py-3 bg-[#FCFCFD] dark:bg-monday-dark-bg border-b border-gray-100 dark:border-monday-dark-border">
                    <div className="flex flex-wrap items-start gap-x-6 gap-y-3">
                        {/* Topic + Tags */}
                        <div className="flex-1 min-w-[200px] space-y-2">
                            <input
                                type="text"
                                value={topic}
                                onChange={(e) => handleChange(setTopic, e.target.value)}
                                onBlur={handleSave}
                                placeholder={t('topic_objective')}
                                className="w-full text-sm font-semibold bg-transparent border-none outline-none p-0 focus:ring-0 placeholder-gray-400 text-gray-800 dark:text-monday-dark-text"
                            />
                            <div className="flex flex-wrap items-center gap-2">
                                <Tag size={12} className="text-gray-400" />
                                {tags.map(tag => (
                                    <span key={tag} className="inline-flex items-center gap-1 bg-gray-100 dark:bg-monday-dark-hover text-gray-600 dark:text-monday-dark-text-secondary text-[10px] px-1.5 py-0.5 rounded border border-gray-200 dark:border-monday-dark-border">
                                        {tag} <button onClick={() => removeTag(tag)} className="hover:text-red-500"><X size={10} /></button>
                                    </span>
                                ))}
                                <input
                                    type="text"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={handleAddTag}
                                    placeholder={t('add_tag')}
                                    className="bg-transparent text-xs outline-none min-w-[60px] placeholder-gray-300"
                                />
                            </div>
                        </div>

                        {/* Date */}
                        <div className="w-[160px]">
                            <button
                                ref={dateTriggerRef}
                                onClick={() => setActiveDateSelector({ id: 'note', rect: dateTriggerRef.current!.getBoundingClientRect() })}
                                className="w-full flex items-center justify-between px-3 py-1.5 text-xs bg-white dark:bg-monday-dark-surface border border-gray-200 dark:border-monday-dark-border rounded-lg text-gray-600 dark:text-monday-dark-text-secondary hover:border-blue-500 transition-colors shadow-sm"
                            >
                                <span className="font-medium font-datetime">
                                    {new Date(date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                                </span>
                                <Calendar size={14} className="text-gray-400" />
                            </button>
                        </div>

                        {/* Links */}
                        <div className="flex-1 min-w-[200px] border-s border-gray-200 dark:border-monday-dark-border ps-6 space-y-1">
                            <div className="flex flex-wrap gap-2 items-center">
                                <LinkIcon size={12} className="text-gray-400" />
                                {linkedRecords.map(l => (
                                    <span key={l} className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 text-[10px] px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-900/30">
                                        {l} <button onClick={() => removeLink(l)} className="hover:text-blue-800"><X size={10} /></button>
                                    </span>
                                ))}
                                <input
                                    type="text"
                                    value={linkInput}
                                    onChange={(e) => setLinkInput(e.target.value)}
                                    onKeyDown={handleAddLink}
                                    placeholder={t('link_record')}
                                    className="bg-transparent text-xs outline-none min-w-[100px] placeholder-gray-300"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Editor Content */}
                <div className="flex-1 px-6 pb-6 pt-4 min-h-0 overflow-hidden">
                    <CornellLayout
                        className="h-full"
                        cuesContent={
                            <textarea
                                value={cues}
                                onChange={(e) => handleChange(setCues, e.target.value)}
                                onBlur={handleSave}
                                placeholder={t('key_questions_cues')}
                                className="w-full h-full p-0 resize-none border-none outline-none focus:ring-0 bg-transparent text-gray-700 dark:text-monday-dark-text text-sm leading-relaxed placeholder-gray-300 font-medium"
                            />
                        }
                        notesContent={
                            <textarea
                                value={notes}
                                onChange={(e) => handleChange(setNotes, e.target.value)}
                                onBlur={handleSave}
                                placeholder={t('record_detailed_notes')}
                                className="w-full h-full p-0 resize-none border-none outline-none focus:ring-0 bg-transparent text-gray-800 dark:text-monday-dark-text text-base leading-7 placeholder-gray-300"
                            />
                        }
                        summaryContent={
                            <textarea
                                value={summary}
                                onChange={(e) => handleChange(setSummary, e.target.value)}
                                onBlur={handleSave}
                                placeholder={t('summarize_takeaways')}
                                className="w-full h-full p-0 resize-none border-none outline-none focus:ring-0 bg-transparent text-gray-700 dark:text-monday-dark-text text-sm placeholder-gray-300"
                            />
                        }
                        actionsContent={renderActionItems()}
                    />
                </div>
            </div>

            {/* Backdrop for Drawer */}
            {isDrawerOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
                    onClick={() => setIsDrawerOpen(false)}
                />
            )}

            {/* Custom Confirmation Modal */}
            {confirmationModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setConfirmationModal(prev => ({ ...prev, isOpen: false }))}></div>
                    <div className="bg-white dark:bg-monday-dark-surface border border-gray-200 dark:border-monday-dark-border rounded-xl shadow-2xl w-full max-w-sm relative z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-6">
                        <div className="flex flex-col items-center text-center space-y-3">
                            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                <AlertCircle size={20} />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('append_template')}</h3>
                            <p className="text-sm text-gray-500 dark:text-monday-dark-text-muted max-w-[260px]">
                                {confirmationModal.message}
                            </p>
                        </div>
                        <div className="flex items-center gap-3 mt-8">
                            <button
                                onClick={() => setConfirmationModal(prev => ({ ...prev, isOpen: false }))}
                                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none dark:bg-transparent dark:text-monday-dark-text-secondary dark:border-monday-dark-border dark:hover:bg-monday-dark-hover"
                            >
                                {t('cancel')}
                            </button>
                            <button
                                onClick={() => {
                                    if (confirmationModal.templateId) applyTemplate(confirmationModal.templateId, 'append');
                                }}
                                className="flex-1 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-900/30"
                            >
                                {t('append')}
                            </button>
                            <button
                                onClick={() => {
                                    if (confirmationModal.templateId) applyTemplate(confirmationModal.templateId, 'replace');
                                }}
                                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-md shadow-blue-500/20"
                            >
                                {t('replace')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Premium Date Picker Popover */}
            {activeDateSelector && (
                <PortalPopup
                    triggerRef={{ current: { getBoundingClientRect: () => activeDateSelector.rect } } as any}
                    onClose={() => setActiveDateSelector(null)}
                    align="end"
                >
                    <SharedDatePicker
                        selectedDate={activeDateSelector.id === 'note' ? date : actionItems.find(a => a.id === activeDateSelector.actionId)?.dueDate}
                        onSelectDate={(d) => {
                            if (activeDateSelector.id === 'note') {
                                setDate(d.toISOString().split('T')[0]);
                                setSaveStatus('unsaved');
                                setActiveDateSelector(null);
                                // Note: handleSave will be called via useEffect shortcut or manual save
                            } else if (activeDateSelector.actionId) {
                                handleActionDateSelect(activeDateSelector.actionId, d);
                            }
                        }}
                        onClear={() => {
                            if (activeDateSelector.id === 'note') {
                                setDate(new Date().toISOString().split('T')[0]);
                            } else if (activeDateSelector.actionId) {
                                const newActions = actionItems.map(a => a.id === activeDateSelector.actionId ? { ...a, dueDate: undefined } : a);
                                handleChange(setActionItems, newActions);
                                handleSave();
                            }
                            setActiveDateSelector(null);
                        }}
                        onClose={() => setActiveDateSelector(null)}
                    />
                </PortalPopup>
            )}
        </div>
    );
};

export default CornellNotesPage;
