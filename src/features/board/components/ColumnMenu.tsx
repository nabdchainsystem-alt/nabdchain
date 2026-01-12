import React, { useState, useRef } from 'react';


import {
    Type,
    CircleDashed,
    Calendar,
    Users,
    Hash,
    List,
    CheckSquare,
    Link2,
    FileText,
    Calculator,
    Paperclip,
    Minus,
    Search,
    MapPin,
    Star,
    ThumbsUp,
    PenLine,
    ArrowUpRight,
    MousePointerClick,
    ListTodo,
    Mail,
    Phone,
    Globe,
    Tags,
    Plus,
    X
} from 'lucide-react';

const COLORS = [
    'bg-rose-500', 'bg-purple-500', 'bg-indigo-500', 'bg-blue-500',
    'bg-teal-500', 'bg-emerald-500', 'bg-amber-500', 'bg-orange-400',
    'bg-stone-500', 'bg-pink-500'
];

interface ColumnMenuProps {
    onClose: () => void;
    onSelect: (type: string, label: string, options?: any[], currency?: string, config?: any) => void;
    darkMode?: boolean;
}

interface ColumnType {
    id: string;
    label: string;
    icon: any;
    color: string; // Tailwind class for background color
    description: string;
}

export const ColumnMenu: React.FC<ColumnMenuProps> = ({ onClose, onSelect, darkMode }) => {
    const [searchTerm, setSearchTerm] = useState('');


    const essentials: ColumnType[] = [
        { id: 'custom', label: 'Custom', icon: CircleDashed, color: 'bg-gray-400', description: 'Custom column' },
        { id: 'status', label: 'Status', icon: CheckSquare, color: 'bg-emerald-500', description: 'Track task status' },
        { id: 'dropdown', label: 'Dropdown', icon: List, color: 'bg-emerald-500', description: 'Select options' },
        { id: 'text', label: 'Text', icon: Type, color: 'bg-yellow-400', description: 'Free text' },
        { id: 'date', label: 'Date', icon: Calendar, color: 'bg-purple-500', description: 'Dates' },
        { id: 'people', label: 'People', icon: Users, color: 'bg-blue-400', description: 'Assign people' },
        { id: 'number', label: 'Numbers', icon: Hash, color: 'bg-yellow-400', description: 'Count things' },
    ];

    const superUseful: ColumnType[] = [
        { id: 'files', label: 'Files', icon: Paperclip, color: 'bg-rose-400', description: 'Attach files' },
        { id: 'timeline', label: 'Timeline', icon: Calendar, color: 'bg-purple-500', description: 'Visual timeline' },
        { id: 'connect_boards', label: 'Connect...', icon: Link2, color: 'bg-rose-400', description: 'Connect boards' },
        { id: 'checkbox', label: 'Checkbox', icon: CheckSquare, color: 'bg-orange-400', description: 'Check/Uncheck' },
        { id: 'doc', label: 'NABD Doc', icon: FileText, color: 'bg-rose-400', description: 'Embed docs' },
        { id: 'formula', label: 'Formula', icon: Calculator, color: 'bg-teal-500', description: 'Calculations' },
        { id: 'location', label: 'Location', icon: MapPin, color: 'bg-rose-500', description: 'Add a location' },
        { id: 'progress_manual', label: 'Progress', icon: Minus, color: 'bg-emerald-500', description: 'Track progress' },
        { id: 'rating', label: 'Rating', icon: Star, color: 'bg-yellow-400', description: 'Rate items with stars' },
        { id: 'voting', label: 'Voting', icon: ThumbsUp, color: 'bg-blue-400', description: 'Vote on items' },
        { id: 'signature', label: 'Signature', icon: PenLine, color: 'bg-emerald-500', description: 'Add a signature' },
        { id: 'rollup', label: 'Rollup', icon: ArrowUpRight, color: 'bg-indigo-500', description: 'Mirror value' },
        { id: 'button', label: 'Button', icon: MousePointerClick, color: 'bg-blue-400', description: 'Trigger an action' },
        { id: 'action_items', label: 'Item ID', icon: ListTodo, color: 'bg-teal-500', description: 'Track unique IDs' },
    ];

    const powerUps: ColumnType[] = [
        { id: 'email', label: 'Email', icon: Mail, color: 'bg-purple-400', description: 'Email address' },
        { id: 'phone', label: 'Phone', icon: Phone, color: 'bg-blue-400', description: 'Phone number' },
        { id: 'world_clock', label: 'World Clock', icon: Globe, color: 'bg-sky-400', description: 'See time in other zones' },
        { id: 'tags', label: 'Tags', icon: Tags, color: 'bg-purple-500', description: 'Manage tags' },
    ];

    const filteredEssentials = essentials.filter(t => t.label.toLowerCase().includes(searchTerm.toLowerCase()));
    const filteredUseful = superUseful.filter(t => t.label.toLowerCase().includes(searchTerm.toLowerCase()));
    const filteredPowerUps = powerUps.filter(t => t.label.toLowerCase().includes(searchTerm.toLowerCase()));

    const hasEssentials = filteredEssentials.length > 0;
    const hasUseful = filteredUseful.length > 0;
    const hasPowerUps = filteredPowerUps.length > 0;

    const [view, setView] = useState<'list' | 'custom_name' | 'custom_dropdown'>('list');
    const [customName, setCustomName] = useState('');
    const [dropdownName, setDropdownName] = useState('');
    const [dropdownOptions, setDropdownOptions] = useState<{ id: string, label: string, color: string }[]>([
        { id: 'opt1', label: 'Option 1', color: 'bg-rose-500' },
        { id: 'opt2', label: 'Option 2', color: 'bg-purple-500' }
    ]);
    const [newOptionName, setNewOptionName] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownInputRef = useRef<HTMLInputElement>(null);
    const [activeColorPicker, setActiveColorPicker] = useState<string | null>(null);

    React.useEffect(() => {
        if (view === 'custom_name' && inputRef.current) {
            inputRef.current.focus();
        } else if (view === 'custom_dropdown' && dropdownInputRef.current) {
            dropdownInputRef.current.focus();
        }
    }, [view]);

    const handleSelect = (type: any) => {
        if (type.id === 'custom') {
            setView('custom_name');
            return;
        }
        if (type.id === 'dropdown') {
            setView('custom_dropdown');
            return;
        }

        let options: any[] = [];

        // Provide default status options for status columns
        if (type.id === 'status') {
            options = [
                { id: 'todo', label: 'To Do', color: 'bg-stone-400' },
                { id: 'in_progress', label: 'In Progress', color: 'bg-amber-500' },
                { id: 'done', label: 'Done', color: 'bg-emerald-500' },
                { id: 'stuck', label: 'Stuck', color: 'bg-red-500' },
                { id: 'pending', label: 'Pending', color: 'bg-orange-400' },
            ];
        }

        onSelect(type.id, type.label, options);
    };

    const handleCreateCustom = () => {
        if (!customName.trim()) return;
        onSelect('text', customName, []);
    };

    const handleAddOption = () => {
        if (!newOptionName.trim()) return;
        const colors = ['bg-rose-500', 'bg-purple-500', 'bg-indigo-500', 'bg-blue-500', 'bg-teal-500', 'bg-emerald-500', 'bg-amber-500', 'bg-orange-400'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        setDropdownOptions([
            ...dropdownOptions,
            { id: Date.now().toString(), label: newOptionName, color: randomColor }
        ]);
        setNewOptionName('');
    };

    const handleCreateDropdown = () => {
        if (!dropdownName.trim()) return;
        onSelect('dropdown', dropdownName, dropdownOptions);
    };

    const RenderItem: React.FC<{ type: ColumnType }> = ({ type }) => (
        <button
            onClick={() => handleSelect(type)}
            className="flex items-center gap-3 w-full p-1.5 rounded hover:bg-gray-100 dark:hover:bg-stone-800 transition-colors group text-left"
        >
            <div className={`shrink-0 w-6 h-6 rounded flex items-center justify-center ${type.color} text-white shadow-sm`}>
                <type.icon size={12} strokeWidth={2.5} />
            </div>
            <span className="text-[13px] text-gray-700 dark:text-stone-300 group-hover:text-gray-900 dark:group-hover:text-white truncate">
                {type.label}
            </span>
        </button>
    );

    if (view === 'custom_name') {
        return (
            <div
                className={`flex flex-col w-[340px] bg-white dark:bg-stone-900 shadow-2xl rounded-xl overflow-hidden border border-gray-200 dark:border-stone-800 ${darkMode ? 'dark' : ''}`}
            >
                <div className="p-4">
                    <div className="flex items-center gap-2 mb-4">
                        <button
                            onClick={() => setView('list')}
                            className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded text-stone-500"
                        >
                            <ArrowUpRight className="rotate-[-135deg]" size={16} />
                        </button>
                        <span className="text-sm font-medium text-stone-700 dark:text-stone-200">Name your column</span>
                    </div>

                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Column name"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCreateCustom();
                            if (e.key === 'Escape') setView('list');
                        }}
                        className="w-full px-3 py-2 text-sm bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-stone-800 dark:text-stone-200 mb-4"
                    />

                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setView('list')}
                            className="px-3 py-1.5 text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded"
                        >
                            Back
                        </button>
                        <button
                            onClick={handleCreateCustom}
                            disabled={!customName.trim()}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Create Column
                        </button>
                    </div>
                </div>
            </div>
        );
    }



    if (view === 'custom_dropdown') {
        return (
            <div
                className={`flex flex-col w-[340px] bg-white dark:bg-stone-900 shadow-2xl rounded-xl overflow-hidden border border-gray-200 dark:border-stone-800 ${darkMode ? 'dark' : ''}`}
            >
                <div className="p-4">
                    <div className="flex items-center gap-2 mb-4">
                        <button
                            onClick={() => setView('list')}
                            className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded text-stone-500"
                        >
                            <ArrowUpRight className="rotate-[-135deg]" size={16} />
                        </button>
                        <span className="text-sm font-medium text-stone-700 dark:text-stone-200">Configure Dropdown</span>
                    </div>

                    <div className="mb-4">
                        <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 mb-1">Field name <span className="text-red-500">*</span></label>
                        <input
                            ref={dropdownInputRef}
                            type="text"
                            placeholder="Enter name..."
                            value={dropdownName}
                            onChange={(e) => setDropdownName(e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-stone-800 dark:text-stone-200"
                        />
                    </div>

                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-semibold text-stone-500 dark:text-stone-400">Dropdown options <span className="text-red-500">*</span></label>
                        </div>

                        <div className="space-y-2 mb-2 max-h-[200px] overflow-y-auto pr-1">
                            {dropdownOptions.map(opt => (
                                <div key={opt.id} className="mb-1">
                                    <div className="relative flex items-center gap-2 p-1.5 rounded border border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 group">
                                        {/* Color Picker Trigger */}
                                        <button
                                            onClick={() => setActiveColorPicker(activeColorPicker === opt.id ? null : opt.id)}
                                            className={`w-4 h-4 rounded-full ${opt.color} shrink-0 hover:scale-110 transition-transform`}
                                        />

                                        {/* Editable Label */}
                                        <input
                                            type="text"
                                            value={opt.label}
                                            onChange={(e) => setDropdownOptions(prev => prev.map(o => o.id === opt.id ? { ...o, label: e.target.value } : o))}
                                            className="flex-1 text-sm bg-transparent border-none outline-none text-stone-700 dark:text-stone-300 placeholder:text-stone-400 min-w-0"
                                        />

                                        {/* Delete Button */}
                                        <button
                                            onClick={() => setDropdownOptions(prev => prev.filter(o => o.id !== opt.id))}
                                            className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-red-500 transition-all"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>

                                    {/* Inline Color Palette */}
                                    {activeColorPicker === opt.id && (
                                        <div className="mt-1 p-2 bg-stone-50 dark:bg-stone-800/50 rounded-lg border border-stone-100 dark:border-stone-700 grid grid-cols-5 gap-2 w-full">
                                            {COLORS.map(c => (
                                                <button
                                                    key={c}
                                                    className={`w-5 h-5 rounded-full ${c} hover:scale-110 transition-transform ${opt.color === c ? 'ring-2 ring-stone-900 dark:ring-white ring-offset-1 dark:ring-offset-stone-800' : ''}`}
                                                    onClick={() => {
                                                        setDropdownOptions(prev => prev.map(o => o.id === opt.id ? { ...o, color: c } : o));
                                                        setActiveColorPicker(null);
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="relative mt-2">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500">
                                <Plus size={14} />
                            </div>
                            <input
                                type="text"
                                placeholder="Type or paste options"
                                value={newOptionName}
                                onChange={(e) => setNewOptionName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleAddOption();
                                }}
                                className="w-full pl-8 pr-3 py-2 text-sm bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-stone-800 dark:text-stone-200"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <span className="text-xs text-stone-400">⏎</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
                        <button
                            onClick={() => setView('list')}
                            className="px-3 py-1.5 text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded"
                        >
                            Back
                        </button>
                        <button
                            onClick={handleCreateDropdown}
                            disabled={!dropdownName.trim() || dropdownOptions.length === 0}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Create Column
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`flex flex-col w-[340px] bg-white dark:bg-stone-900 shadow-2xl rounded-xl overflow-hidden border border-gray-200 dark:border-stone-800 ${darkMode ? 'dark' : ''}`}
            style={{ maxHeight: '600px' }} // Let it grow but cap it
        >
            {/* Search */}
            <div className="p-4 pb-2">
                <div className="relative group">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500" />
                    <input
                        type="text"
                        placeholder="Search or describe your column"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-[13px] bg-white border border-gray-300 dark:border-stone-700 rounded transition-all placeholder:text-gray-400 text-gray-700 dark:text-stone-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Content Container - No Scrollbar Visual */}
            <div className="flex-1 overflow-y-auto px-4 py-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">

                {/* Essentials */}
                {hasEssentials && (
                    <div className="mb-4">
                        <div className="text-[13px] text-gray-500 dark:text-gray-400 mb-2 font-medium">Essentials</div>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                            {filteredEssentials.map(type => (
                                <RenderItem key={type.id} type={type} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Super Useful */}
                {hasUseful && (
                    <div className="mb-4">
                        <div className="text-[13px] text-gray-500 dark:text-gray-400 mb-2 font-medium">Super useful</div>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                            {filteredUseful.map(type => (
                                <RenderItem key={type.id} type={type} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Power Ups */}
                {hasPowerUps && (
                    <div className="mb-2">
                        <div className="text-[13px] text-gray-500 dark:text-gray-400 mb-2 font-medium">Board Power Ups</div>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                            {filteredPowerUps.map(type => (
                                <RenderItem key={type.id} type={type} />
                            ))}
                        </div>
                    </div>
                )}


                {(!hasEssentials && !hasUseful && !hasPowerUps) && (
                    <div className="text-center py-4 text-gray-400 text-sm">No columns found</div>
                )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-100 dark:border-stone-800 text-center">
                <button className="text-[13px] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:underline transition-all">
                    More columns
                </button>
            </div>
        </div>
    );
};
