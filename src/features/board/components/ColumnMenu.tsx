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
    Tags
} from 'lucide-react';

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

    const handleSelect = (type: any) => {
        let options: any[] = [];
        if (type.id === 'dropdown') {
            options = [
                { id: 'opt1', label: 'Option 1', color: 'bg-indigo-500' },
                { id: 'opt2', label: 'Option 2', color: 'bg-pink-500' },
                { id: 'opt3', label: 'Option 3', color: 'bg-teal-500' }
            ];
        }
        onSelect(type.id, type.label, options);
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
