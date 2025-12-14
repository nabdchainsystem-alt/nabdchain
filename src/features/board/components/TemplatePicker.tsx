
import React, { useState } from 'react';
import { BOARD_TEMPLATES, BoardTemplate } from '../data/templates';
import { Layout, Briefcase, User, Settings, CheckCircle } from 'lucide-react';

interface TemplatePickerProps {
    onSelect: (template: BoardTemplate) => void;
    selectedTemplateId?: string;
}

const CATEGORIES = {
    Personal: { icon: User, color: 'text-blue-500' },
    Work: { icon: Briefcase, color: 'text-purple-500' },
    Management: { icon: Layout, color: 'text-orange-500' },
    HR: { icon: User, color: 'text-pink-500' }, // Reusing User for HR
    Development: { icon: Settings, color: 'text-green-500' }
};

export const TemplatePicker: React.FC<TemplatePickerProps> = ({ onSelect, selectedTemplateId }) => {
    const [activeCategory, setActiveCategory] = useState<string>('All');

    const categories = ['All', ...Array.from(new Set(BOARD_TEMPLATES.map(t => t.category)))];

    const filteredTemplates = activeCategory === 'All'
        ? BOARD_TEMPLATES
        : BOARD_TEMPLATES.filter(t => t.category === activeCategory);

    return (
        <div className="flex flex-col h-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden">
            {/* Category Tabs */}
            <div className="flex overflow-x-auto p-2 border-b border-stone-200 dark:border-stone-800 gap-2 bg-white dark:bg-stone-950 no-scrollbar">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`
              px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors
              ${activeCategory === cat
                                ? 'bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900'
                                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'}
            `}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Templates Grid */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3">
                    {filteredTemplates.map(template => {
                        const CategoryIcon = CATEGORIES[template.category as keyof typeof CATEGORIES]?.icon || Layout;
                        const isSelected = selectedTemplateId === template.id;

                        return (
                            <div
                                key={template.id}
                                onClick={() => {
                                    console.log('Template clicked:', template);
                                    onSelect(template);
                                }}
                                className={`
                  relative cursor-pointer group flex flex-col p-4 rounded-xl border-2 transition-all duration-200
                  ${isSelected
                                        ? 'border-stone-800 dark:border-stone-200 bg-white dark:bg-stone-800 shadow-md'
                                        : 'border-transparent bg-white dark:bg-stone-950 hover:border-stone-200 dark:hover:border-stone-700 hover:shadow-sm'}
                `}
                            >
                                {isSelected && (
                                    <div className="absolute top-2 right-2 text-stone-800 dark:text-stone-200 animate-in zoom-in spin-in-90 duration-300">
                                        <CheckCircle size={20} fill="currentColor" className="text-white dark:text-stone-900" />
                                    </div>
                                )}

                                <div className="flex items-center gap-2 mb-2">
                                    <div className={`p-2 rounded-lg bg-stone-50 dark:bg-stone-900 ${CATEGORIES[template.category as keyof typeof CATEGORIES]?.color}`}>
                                        <CategoryIcon size={18} />
                                    </div>
                                    <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                                        {template.category}
                                    </span>
                                </div>

                                <h3 className="font-serif font-semibold text-stone-900 dark:text-stone-100 mb-1">
                                    {template.name}
                                </h3>

                                <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 mb-3">
                                    {template.description}
                                </p>

                                {/* Mini Preview of Groups */}
                                <div className="mt-auto space-y-1 opacity-60">
                                    {template.groups.slice(0, 2).map((g, i) => (
                                        <div key={i} className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: g.color }} />
                                            <div className="h-1.5 rounded-full bg-stone-100 dark:bg-stone-800 w-16" />
                                        </div>
                                    ))}
                                    {template.groups.length > 2 && (
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-stone-300 dark:bg-stone-700" />
                                            <div className="h-1.5 rounded-full bg-stone-100 dark:bg-stone-800 w-8" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
