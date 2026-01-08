import React, { useState, useRef } from 'react';
import { CoverPicker } from './CoverPicker';
import { IconPicker } from './IconPicker';
import { useClickOutside } from '../../../../hooks/useClickOutside';
import {
    FileText,
    Table,
    Columns,
    List,
    File,
    ArrowUpRight,
    Link,
    Plus,
    Type,
    Image as ImageIcon,
    Heading,
    MoreHorizontal,
    PanelRight,
    ArrowLeftRight,
    Wand2,
    SquareArrowUp,
    X,
} from 'lucide-react';

interface DocEditorProps {
    defaultTitle?: string;
    storageKey?: string;
}

export const DocEditor: React.FC<DocEditorProps> = ({ defaultTitle = '', storageKey }) => {
    // Persistence state
    const [isLoaded, setIsLoaded] = useState(false);

    const [title, setTitle] = useState(defaultTitle === 'Inbox' || defaultTitle === 'Untitled' ? '' : defaultTitle);
    const [icon, setIcon] = useState<string | null>(null);
    const [coverImage, setCoverImage] = useState<string | null>(null);
    const [hasStartedWriting, setHasStartedWriting] = useState(false);
    const loadedContentRef = useRef<string | null>(null);

    // Initial load from storage
    React.useEffect(() => {
        if (!storageKey) {
            setIsLoaded(true);
            return;
        }

        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                const data = JSON.parse(saved);
                if (data.title !== undefined) setTitle(data.title);
                if (data.icon !== undefined) setIcon(data.icon);
                if (data.coverImage !== undefined) setCoverImage(data.coverImage);
                if (data.hasStartedWriting !== undefined) setHasStartedWriting(data.hasStartedWriting);


                // Content is handled separately via ref to avoid React render cycles with contentEditable
                // We store it in a ref and apply it once the contentRef becomes available
                if (data.content) {
                    loadedContentRef.current = data.content;
                }
            }
        } catch (e) {
            console.error('Failed to load doc data', e);
        }
        setIsLoaded(true);
    }, [storageKey]);

    // Save helper
    const saveToStorage = React.useCallback(() => {
        if (!storageKey || !isLoaded) return;

        try {
            const data = {
                title,
                icon,
                coverImage,
                hasStartedWriting,
                content: contentRef.current?.innerHTML || ''
            };
            localStorage.setItem(storageKey, JSON.stringify(data));
        } catch (e) {
            console.error('Failed to save doc data', e);
        }
    }, [storageKey, isLoaded, title, icon, coverImage, hasStartedWriting]);

    // Content-only save for higher frequency updates
    const saveContentOnly = React.useCallback(() => {
        if (!storageKey || !isLoaded) return;
        try {
            const saved = localStorage.getItem(storageKey);
            const data = saved ? JSON.parse(saved) : {};
            data.content = contentRef.current?.innerHTML || '';
            localStorage.setItem(storageKey, JSON.stringify(data));
        } catch (e) {
            console.error('Failed to save content', e);
        }
    }, [storageKey, isLoaded]);

    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const debouncedSaveContent = React.useCallback(() => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(saveContentOnly, 1000);
    }, [saveContentOnly]);

    // Clean up timeout
    React.useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, []);

    // Auto-save when metadata changes
    React.useEffect(() => {
        saveToStorage();
    }, [title, icon, coverImage, hasStartedWriting, saveToStorage]);

    // Update title when defaultTitle changes (e.g. navigation) if not loaded yet
    React.useEffect(() => {
        if (!isLoaded) {
            setTitle(defaultTitle === 'Inbox' || defaultTitle === 'Untitled' ? '' : defaultTitle);
        }
    }, [defaultTitle, isLoaded]);
    // Apply loaded content when ref becomes available
    React.useEffect(() => {
        if (isLoaded && hasStartedWriting && contentRef.current && loadedContentRef.current !== null) {
            contentRef.current.innerHTML = loadedContentRef.current;
            loadedContentRef.current = null; // Mark as applied
        }
    }, [isLoaded, hasStartedWriting]);

    const [isTitleFocused, setIsTitleFocused] = useState(false);
    const [isCoverPickerOpen, setIsCoverPickerOpen] = useState(false);
    const [showIconPicker, setShowIconPicker] = useState(false); // New state for IconPicker
    const contentRef = React.useRef<HTMLDivElement>(null);
    const coverButtonRef = useRef<HTMLButtonElement>(null);
    const iconButtonRef = useRef<HTMLButtonElement>(null); // Ref for the "Add icon" button
    const iconDisplayRef = useRef<HTMLDivElement>(null); // Ref for the displayed icon

    useClickOutside(coverButtonRef, () => setIsCoverPickerOpen(false));
    useClickOutside(iconButtonRef, () => setShowIconPicker(false));
    useClickOutside(iconDisplayRef, () => setShowIconPicker(false));


    const handleAddCover = () => setCoverImage('https://images.unsplash.com/photo-1579546929518-9e396f3cc809?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80');

    const handleStartWriting = () => {
        setHasStartedWriting(true);
        // Small timeout to allow render
        setTimeout(() => {
            if (contentRef.current) {
                contentRef.current.focus();
            }
        }, 10);
    };

    const handleTitleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleStartWriting();
        }
    };

    return (
        <div className="w-full min-h-full pb-32 flex flex-col items-center relative">
            {coverImage && (
                <div className="w-full h-48 md:h-60 relative group shrink-0 animate-in fade-in duration-500">
                    <div
                        className="w-full h-full"
                        style={{
                            background: coverImage.startsWith('http') ? `url(${coverImage}) center/cover no-repeat` : coverImage,
                        }}
                    />

                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 flex items-center gap-2 transition-opacity z-10">
                        <button
                            className="bg-white/90 hover:bg-white text-stone-600 text-xs font-medium px-2.5 py-1.5 rounded shadow-sm transition-colors border border-stone-200"
                        >
                            Reposition
                        </button>
                        <div className="relative" ref={coverButtonRef}>
                            <button
                                onClick={() => setIsCoverPickerOpen(!isCoverPickerOpen)}
                                className="bg-white/90 hover:bg-white text-stone-600 text-xs font-medium px-2.5 py-1.5 rounded shadow-sm transition-colors border border-stone-200"
                            >
                                Change cover
                            </button>
                            {isCoverPickerOpen && (
                                <CoverPicker
                                    onSelect={(val) => {
                                        setCoverImage(val);
                                        setIsCoverPickerOpen(false);
                                    }}
                                    onRemove={() => {
                                        setCoverImage(null);
                                        setIsCoverPickerOpen(false);
                                    }}
                                    onClose={() => setIsCoverPickerOpen(false)}
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Right Floating Toolbar (Visual Only) */}
            <div className="fixed right-6 top-1/2 -translate-y-1/2 flex flex-col gap-6 z-20 text-stone-300">
                <ToolButton icon={<PanelRight size={20} strokeWidth={1.5} />} label="Sidebar" />
                <ToolButton icon={<Type size={20} strokeWidth={1.5} />} label="Typography" />
                <ToolButton icon={<ArrowLeftRight size={20} strokeWidth={1.5} />} label="Connections" />
                <ToolButton icon={<Wand2 size={20} strokeWidth={1.5} />} label="AI Assistant" />
                <ToolButton icon={<SquareArrowUp size={20} strokeWidth={1.5} />} label="Share" />
            </div>

            <div className="w-full max-w-4xl px-8 sm:px-16 py-8 sm:py-12 relative animate-in fade-in duration-500">

                {/* Top Actions */}
                <div className="mb-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-4 text-sm text-stone-400">
                    <button className="flex items-center gap-1.5 hover:text-stone-700 dark:hover:text-stone-300 transition-colors">
                        <Link size={14} />
                        <span>Link Task or Doc</span>
                    </button>
                </div>

                {/* Title Area */}
                <div className="group relative mb-6">
                    {icon && (
                        <div className={`mb-4 relative w-fit group/icon animate-in zoom-in-50 duration-300 ${coverImage ? '-mt-10 z-10' : ''}`} ref={iconDisplayRef}>
                            <div
                                className="text-[78px] leading-none select-none cursor-pointer hover:opacity-90"
                                onClick={() => setShowIconPicker(!showIconPicker)}
                            >
                                {icon}
                            </div>
                            {showIconPicker && (
                                <IconPicker
                                    onSelect={(val) => {
                                        setIcon(val);
                                        setShowIconPicker(false);
                                    }}
                                    onClose={() => setShowIconPicker(false)}
                                />
                            )}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevent triggering the icon picker
                                    setIcon(null);
                                    setShowIconPicker(false); // Close picker if open
                                }}
                                className="absolute -top-2 -right-2 bg-stone-100 dark:bg-stone-800 text-stone-400 p-1 rounded-full opacity-0 group-hover/icon:opacity-100 hover:text-stone-600 transition-all"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    )}
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onFocus={() => setIsTitleFocused(true)}
                        onBlur={() => setIsTitleFocused(false)}
                        className="w-full bg-transparent text-5xl font-serif font-bold text-stone-900 dark:text-stone-100 placeholder-stone-300 dark:placeholder-stone-700 outline-none border-none p-0 leading-tight"
                        placeholder="Untitled"
                        onKeyDown={handleTitleKeyDown}
                    />
                    {/* Add icon/cover hint - visible on hover or empty */}
                    <div className={`absolute -top-8 left-0 flex items-center gap-2 text-stone-400 text-sm transition-opacity ${isTitleFocused ? 'opacity-0 pointer-events-none' : (!title && !icon && !coverImage ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')}`}>
                        {!icon && (
                            <div className="relative" ref={iconButtonRef}>
                                <button
                                    onClick={() => setShowIconPicker(!showIconPicker)}
                                    className="hover:bg-stone-100 dark:hover:bg-stone-800 px-2 py-1 rounded flex items-center gap-1.5 transition-colors"
                                >
                                    <span className="text-base">☺</span> Add icon
                                </button>
                                {showIconPicker && (
                                    <IconPicker
                                        onSelect={(val) => {
                                            setIcon(val);
                                            setShowIconPicker(false);
                                        }}
                                        onClose={() => setShowIconPicker(false)}
                                    />
                                )}
                            </div>
                        )}
                        {!coverImage && (
                            <button onClick={handleAddCover} className="hover:bg-stone-100 dark:hover:bg-stone-800 px-2 py-1 rounded flex items-center gap-1.5 transition-colors">
                                <ImageIcon size={14} /> Add cover
                            </button>
                        )}
                    </div>
                </div>

                {/* Initial Setup State */}
                {!hasStartedWriting && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Metadata */}
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-10 text-xs sm:text-sm text-stone-500 dark:text-stone-400 font-sans">
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold">A</div>
                                <span className="text-stone-400">Owners:</span>
                                <span className="text-stone-800 dark:text-stone-200">You</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-stone-400">Last Updated:</span>
                                <span className="text-stone-800 dark:text-stone-200">Today at 2:01 pm</span>
                            </div>
                        </div>

                        {/* Quick Actions (Empty State) */}
                        <div className="space-y-1 mb-12">
                            <QuickActionItem
                                icon={<FileText size={16} />}
                                label="Start writing"
                                active
                                onClick={handleStartWriting}
                            />
                            <QuickActionItem icon={<File size={16} />} label="Blank wiki" />
                        </div>

                        {/* Add New Section */}
                        <div className="mt-8">
                            <div className="text-sm font-medium text-stone-500 mb-3 px-2">Add new</div>
                            <div className="flex flex-col gap-1">
                                <AddItem icon={<Table size={20} strokeWidth={1.5} />} label="Table" />
                                <AddItem icon={<Columns size={20} strokeWidth={1.5} />} label="Column" />
                                <AddItem icon={<List size={20} strokeWidth={1.5} />} label="ClickUp List" />
                                <AddItem icon={<FileText size={20} strokeWidth={1.5} />} label="Subpage" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Writing Content State */}
                {hasStartedWriting && (
                    <div className="animate-in fade-in duration-500 mt-4">
                        <div
                            ref={contentRef}
                            contentEditable
                            onBlur={saveToStorage}
                            onInput={debouncedSaveContent}
                            className="w-full min-h-[50vh] outline-none text-lg text-stone-800 dark:text-stone-200 leading-relaxed empty:before:content-[attr(data-placeholder)] empty:before:text-stone-400 cursor-text"
                            data-placeholder="Type '/' for commands"
                            onKeyDown={(e) => {
                                if (e.key === 'Backspace' && e.currentTarget.textContent === '') {
                                    // Optional: Could go back to setup state if desired, but sticking to simple flow for now
                                }
                            }}
                            onKeyUp={(e) => {
                                // Save immediately on Enter or period 
                                if (e.key === 'Enter' || e.key === '.') {
                                    saveContentOnly();
                                }
                            }}
                        />
                    </div>
                )}

            </div>

            {/* Bottom Status / Footer */}
            <div className="fixed bottom-4 right-6 flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-full shadow-sm text-xs text-stone-500 z-20">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="font-medium text-stone-700 dark:text-stone-300">1</span>
                <button className="hover:bg-stone-100 dark:hover:bg-stone-700 rounded p-0.5">
                    <ArrowUpRight size={12} />
                </button>
            </div>

        </div>
    );
};

// Sub-components for cleaner code
const QuickActionItem = ({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) => (
    <div
        onClick={onClick}
        className={`
        flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-all
        ${active
                ? 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-medium'
                : 'text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800/50 hover:text-stone-800 dark:hover:text-stone-200'}
    `}>
        <span className="text-stone-400 dark:text-stone-500">{icon}</span>
        <span>{label}</span>
    </div>
);

const AddItem = ({ icon, label }: { icon: React.ReactNode, label: string }) => (
    <div className="flex items-center gap-3 px-2 py-2.5 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800/50 cursor-pointer transition-colors group">
        <span className="text-stone-400 group-hover:text-stone-600 dark:text-stone-500 dark:group-hover:text-stone-300 transition-colors">
            {icon}
        </span>
        <span className="text-stone-600 dark:text-stone-300 font-medium text-[15px]">{label}</span>
    </div>
);

const ToolButton = ({ icon, label }: { icon: React.ReactNode, label: string }) => (
    <div className="group relative">
        <button className="p-1 text-stone-300 hover:text-stone-600 dark:hover:text-stone-300 transition-colors">
            {icon}
        </button>
        <span className="absolute right-full top-1/2 -translate-y-1/2 mr-4 px-2 py-1 bg-stone-900 text-stone-100 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            {label}
        </span>
    </div>
);
