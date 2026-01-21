import React, { useState, useRef } from 'react';


import {
    TextT as Type,
    CircleDashed,
    CalendarBlank as Calendar,
    Users,
    Hash,
    List,
    CheckSquare,
    LinkSimple as Link2,
    FileText,
    Calculator,
    Paperclip,
    Minus,
    MagnifyingGlass as Search,
    MapPin,
    Star,
    ThumbsUp,
    PencilLine as PenLine,
    ArrowUpRight,
    Cursor as MousePointerClick,
    ListChecks as ListTodo,
    Envelope as Mail,
    Phone,
    Globe,
    Tag as Tags,
    Plus,
    X,
    Flag,
    CurrencyDollar,
    BookmarkSimple,
    Trash,
    FloppyDisk,
    Check
} from 'phosphor-react';

const DROPDOWN_PRESETS_KEY = 'nabd-dropdown-presets';

interface DropdownPreset {
    id: string;
    name: string;
    options: { id: string; label: string; color: string }[];
}

const COLORS = [
    'bg-rose-500', 'bg-purple-500', 'bg-indigo-500', 'bg-blue-500',
    'bg-teal-500', 'bg-emerald-500', 'bg-amber-500', 'bg-orange-400',
    'bg-stone-500', 'bg-pink-500'
];

const CURRENCIES = [
    { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
    { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
    { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
    { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', flag: '🇸🇦' },
    { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', flag: '🇦🇪' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', flag: '🇨🇳' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
    { code: 'KRW', symbol: '₩', name: 'South Korean Won', flag: '🇰🇷' },
    { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', flag: '🇧🇷' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' },
    { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', flag: '🇨🇭' },
    { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso', flag: '🇲🇽' },
    { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬' },
    { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound', flag: '🇪🇬' },
    { code: 'TRY', symbol: '₺', name: 'Turkish Lira', flag: '🇹🇷' },
    { code: 'RUB', symbol: '₽', name: 'Russian Ruble', flag: '🇷🇺' },
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
        { id: 'priority', label: 'Priority', icon: Flag, color: 'bg-orange-500', description: 'Set task priority' },
        { id: 'dropdown', label: 'Dropdown', icon: List, color: 'bg-emerald-500', description: 'Select options' },
        { id: 'text', label: 'Text', icon: Type, color: 'bg-yellow-400', description: 'Free text' },
        { id: 'date', label: 'Date', icon: Calendar, color: 'bg-purple-500', description: 'Dates' },
        { id: 'files', label: 'Files', icon: Paperclip, color: 'bg-rose-400', description: 'Attach files' },
        { id: 'people', label: 'People', icon: Users, color: 'bg-blue-400', description: 'Assign people' },
        { id: 'number', label: 'Numbers', icon: Hash, color: 'bg-yellow-400', description: 'Count things' },
        { id: 'currency', label: 'Currency', icon: CurrencyDollar, color: 'bg-emerald-500', description: 'Money with conversion' },
    ];

    const superUseful: ColumnType[] = [
        { id: 'timeline', label: 'Timeline', icon: Calendar, color: 'bg-purple-500', description: 'Visual timeline' },
        { id: 'url', label: 'URL', icon: Link2, color: 'bg-slate-500', description: 'Add a URL' },
        { id: 'checkbox', label: 'Checkbox', icon: CheckSquare, color: 'bg-orange-400', description: 'Check/Uncheck' },
        { id: 'doc', label: 'NABD Doc', icon: FileText, color: 'bg-rose-400', description: 'Embed docs' },
        { id: 'location', label: 'Location', icon: MapPin, color: 'bg-red-500', description: 'Add a location' },
        { id: 'rating', label: 'Rating', icon: Star, color: 'bg-yellow-400', description: 'Rate items with stars' },
        { id: 'voting', label: 'Voting', icon: ThumbsUp, color: 'bg-blue-400', description: 'Vote on items' },
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

    const [view, setView] = useState<'list' | 'custom_name' | 'custom_dropdown' | 'currency'>('list');
    const [customName, setCustomName] = useState('');
    const [dropdownName, setDropdownName] = useState('');

    // Preset state
    const [showPresets, setShowPresets] = useState(false);
    const [presetName, setPresetName] = useState('');
    const [presets, setPresets] = useState<DropdownPreset[]>(() => {
        try {
            const saved = localStorage.getItem(DROPDOWN_PRESETS_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });
    const [dropdownOptions, setDropdownOptions] = useState<{ id: string, label: string, color: string }[]>([
        { id: 'opt1', label: 'Option 1', color: 'bg-rose-500' },
        { id: 'opt2', label: 'Option 2', color: 'bg-purple-500' }
    ]);
    const [newOptionName, setNewOptionName] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownInputRef = useRef<HTMLInputElement>(null);
    const [activeColorPicker, setActiveColorPicker] = useState<string | null>(null);
    const [currencyName, setCurrencyName] = useState('');
    const [selectedCurrency, setSelectedCurrency] = useState(CURRENCIES[0]);
    const [currencySearch, setCurrencySearch] = useState('');
    const currencyInputRef = useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (view === 'custom_name' && inputRef.current) {
            inputRef.current.focus();
        } else if (view === 'custom_dropdown' && dropdownInputRef.current) {
            dropdownInputRef.current.focus();
        } else if (view === 'currency' && currencyInputRef.current) {
            currencyInputRef.current.focus();
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
        if (type.id === 'currency') {
            setView('currency');
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

        // Provide default priority options for priority columns
        if (type.id === 'priority') {
            options = [
                { id: 'urgent', label: 'Urgent', color: 'bg-red-500' },
                { id: 'high', label: 'High', color: 'bg-orange-500' },
                { id: 'medium', label: 'Medium', color: 'bg-blue-500' },
                { id: 'low', label: 'Low', color: 'bg-emerald-500' },
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

    const [saveSuccess, setSaveSuccess] = useState(false);

    const handleSavePreset = () => {
        if (!presetName.trim() || dropdownOptions.length === 0) return;
        const newPreset: DropdownPreset = {
            id: Date.now().toString(),
            name: presetName.trim(),
            options: dropdownOptions.map(o => ({ ...o }))
        };
        const updatedPresets = [...presets, newPreset];
        setPresets(updatedPresets);
        localStorage.setItem(DROPDOWN_PRESETS_KEY, JSON.stringify(updatedPresets));
        setPresetName('');
        // Show success feedback
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
    };

    const handleLoadPreset = (preset: DropdownPreset) => {
        setDropdownOptions(preset.options.map(o => ({ ...o, id: `${o.id}-${Date.now()}` })));
        setShowPresets(false);
    };

    const handleDeletePreset = (presetId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const updatedPresets = presets.filter(p => p.id !== presetId);
        setPresets(updatedPresets);
        localStorage.setItem(DROPDOWN_PRESETS_KEY, JSON.stringify(updatedPresets));
    };

    const handleCreateCurrency = () => {
        if (!currencyName.trim()) return;
        onSelect('currency', currencyName, [], undefined, { currency: { code: selectedCurrency.code, symbol: selectedCurrency.symbol } });
    };

    const filteredCurrencies = CURRENCIES.filter(c =>
        c.name.toLowerCase().includes(currencySearch.toLowerCase()) ||
        c.code.toLowerCase().includes(currencySearch.toLowerCase())
    );

    const RenderItem: React.FC<{ type: ColumnType, showPlus?: boolean }> = ({ type, showPlus = true }) => (
        <div
            className="flex items-center gap-3 w-full p-1.5 rounded hover:bg-gray-100 dark:hover:bg-stone-800 transition-colors group text-left cursor-pointer"
            onClick={() => {
                handleSelect(type);
                // For direct actions (not custom/dropdown/currency setup), close the menu
                if (type.id !== 'custom' && type.id !== 'dropdown' && type.id !== 'currency') {
                    onClose();
                }
            }}
        >
            <div className={`shrink-0 w-6 h-6 rounded flex items-center justify-center ${type.color} text-white shadow-sm`}>
                <type.icon size={12} strokeWidth={2.5} />
            </div>
            <span className="text-[13px] text-gray-700 dark:text-stone-300 group-hover:text-gray-900 dark:group-hover:text-white truncate flex-1">
                {type.label}
            </span>
            {showPlus && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(type);
                        // Close menu for direct actions (not custom/dropdown/currency setup)
                        if (type.id !== 'custom' && type.id !== 'dropdown' && type.id !== 'currency') {
                            onClose();
                        }
                    }}
                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-stone-700 text-gray-400 group-hover:text-stone-600 dark:text-stone-500 dark:group-hover:text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <Plus size={14} />
                </button>
            )}
        </div>
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
                            if (e.key === 'Enter' && customName.trim()) {
                                handleCreateCustom();
                                onClose();
                            }
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
                            onClick={() => {
                                handleCreateCustom();
                                onClose();
                            }}
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
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && dropdownName.trim() && dropdownOptions.length > 0) {
                                    handleCreateDropdown();
                                    onClose();
                                }
                                if (e.key === 'Escape') setView('list');
                            }}
                            className="w-full px-3 py-2 text-sm bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-stone-800 dark:text-stone-200"
                        />
                    </div>

                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-semibold text-stone-500 dark:text-stone-400">Dropdown options <span className="text-red-500">*</span></label>
                            <button
                                onClick={() => setShowPresets(!showPresets)}
                                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                            >
                                <BookmarkSimple size={14} />
                                {showPresets ? 'Hide Presets' : 'Presets'}
                            </button>
                        </div>

                        {/* Presets Section */}
                        {showPresets && (
                            <div className="mb-3 p-2 bg-stone-50 dark:bg-stone-800/50 rounded-lg border border-stone-200 dark:border-stone-700">
                                <div className="text-xs font-medium text-stone-600 dark:text-stone-300 mb-2">Saved Presets</div>
                                {presets.length > 0 ? (
                                    <div className="space-y-1 max-h-[120px] overflow-y-auto mb-2">
                                        {presets.map(preset => (
                                            <div
                                                key={preset.id}
                                                onClick={() => handleLoadPreset(preset)}
                                                className="flex items-center justify-between p-2 bg-white dark:bg-stone-900 rounded border border-stone-100 dark:border-stone-700 hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer group"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-xs font-medium text-stone-700 dark:text-stone-200 truncate">{preset.name}</div>
                                                    <div className="flex gap-0.5 mt-1">
                                                        {preset.options.slice(0, 4).map(opt => (
                                                            <span key={opt.id} className={`w-3 h-3 rounded-full ${opt.color}`} />
                                                        ))}
                                                        {preset.options.length > 4 && (
                                                            <span className="text-[10px] text-stone-400">+{preset.options.length - 4}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={(e) => handleDeletePreset(preset.id, e)}
                                                    className="p-1 opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-500 transition-all"
                                                >
                                                    <Trash size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-xs text-stone-400 mb-2">No saved presets yet</div>
                                )}
                                {/* Save current as preset */}
                                <div className="flex gap-1 pt-2 border-t border-stone-200 dark:border-stone-700">
                                    <input
                                        type="text"
                                        placeholder="Preset name..."
                                        value={presetName}
                                        onChange={(e) => setPresetName(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') handleSavePreset(); }}
                                        className="flex-1 px-2 py-1 text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded focus:outline-none focus:border-blue-500"
                                    />
                                    <button
                                        onClick={handleSavePreset}
                                        disabled={!presetName.trim() || dropdownOptions.length === 0 || saveSuccess}
                                        className={`px-2 py-1 text-xs text-white rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors ${saveSuccess ? 'bg-emerald-500' : 'bg-blue-600 hover:bg-blue-700'}`}
                                    >
                                        {saveSuccess ? (
                                            <>
                                                <Check size={12} />
                                                Saved!
                                            </>
                                        ) : (
                                            <>
                                                <FloppyDisk size={12} />
                                                Save
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

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
                            onClick={() => {
                                handleCreateDropdown();
                                onClose();
                            }}
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

    if (view === 'currency') {
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
                        <span className="text-sm font-medium text-stone-700 dark:text-stone-200">Configure Currency Column</span>
                    </div>

                    <div className="mb-4">
                        <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 mb-1">Column name <span className="text-red-500">*</span></label>
                        <input
                            ref={currencyInputRef}
                            type="text"
                            placeholder="e.g. Budget, Price, Cost..."
                            value={currencyName}
                            onChange={(e) => setCurrencyName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && currencyName.trim()) {
                                    handleCreateCurrency();
                                    onClose();
                                }
                                if (e.key === 'Escape') setView('list');
                            }}
                            className="w-full px-3 py-2 text-sm bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-stone-800 dark:text-stone-200"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 mb-2">Select Currency</label>

                        {/* Selected Currency Display */}
                        <div className="flex items-center gap-2 p-2 mb-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                            <span className="text-lg">{selectedCurrency.flag}</span>
                            <span className="text-sm font-medium text-stone-700 dark:text-stone-200">{selectedCurrency.symbol}</span>
                            <span className="text-sm text-stone-600 dark:text-stone-300">{selectedCurrency.name}</span>
                            <span className="text-xs text-stone-400 ml-auto">{selectedCurrency.code}</span>
                        </div>

                        {/* Currency Search */}
                        <div className="relative mb-2">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                            <input
                                type="text"
                                placeholder="Search currencies..."
                                value={currencySearch}
                                onChange={(e) => setCurrencySearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-sm bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-stone-800 dark:text-stone-200"
                            />
                        </div>

                        {/* Currency List */}
                        <div className="max-h-[180px] overflow-y-auto border border-stone-200 dark:border-stone-700 rounded-lg">
                            {filteredCurrencies.map(currency => (
                                <button
                                    key={currency.code}
                                    onClick={() => setSelectedCurrency(currency)}
                                    className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors ${selectedCurrency.code === currency.code ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                                >
                                    <span className="text-base">{currency.flag}</span>
                                    <span className="text-sm font-medium text-stone-700 dark:text-stone-200 w-8">{currency.symbol}</span>
                                    <span className="text-sm text-stone-600 dark:text-stone-300 flex-1 truncate">{currency.name}</span>
                                    <span className="text-xs text-stone-400">{currency.code}</span>
                                </button>
                            ))}
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
                            onClick={() => {
                                handleCreateCurrency();
                                onClose();
                            }}
                            disabled={!currencyName.trim()}
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
                                <RenderItem key={type.id} type={type} showPlus={true} />
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
                                <RenderItem key={type.id} type={type} showPlus={true} />
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
                                <RenderItem key={type.id} type={type} showPlus={true} />
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
