import React from 'react';
import { Plus as PlusIcon } from 'phosphor-react';
import { PRIORITY_LEVELS, normalizePriority } from '../../../../priorities/priorityUtils';
import { useAppContext } from '../../../../../contexts/AppContext';

export type Priority = 'urgent' | 'high' | 'medium' | 'low' | 'none';

const PRIORITY_STYLES: Record<string, string> = {
    'Urgent': 'bg-[#EF4444] text-white', // Red
    'High': 'bg-[#F59E0B] text-white', // Orange
    'Medium': 'bg-[#3B82F6] text-white', // Blue
    'Low': 'bg-[#10B981] text-white', // Green
};

export interface PriorityMenuProps {
    currentPriority: Priority | string | null;
    onSelect: (priority: Priority | 'clear') => void;
}

/**
 * Priority selection dropdown menu for task cards
 * Shows all priority levels with colored badges
 */
export const PriorityMenu: React.FC<PriorityMenuProps> = ({ currentPriority, onSelect }) => {
    const { t } = useAppContext();
    const normalizedCurrent = normalizePriority(currentPriority);

    return (
        <div className="flex flex-col gap-1 p-2">
            <div className="px-4 py-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1 whitespace-nowrap">
                {t('task_priority')}
            </div>
            {PRIORITY_LEVELS.map(level => {
                const value = level.toLowerCase() as Priority;
                const styleClass = PRIORITY_STYLES[level] || 'bg-gray-100 text-gray-800';
                const isActive = normalizedCurrent === level;

                return (
                    <button
                        key={level}
                        onClick={() => onSelect(value)}
                        className={`
                            w-full flex items-center justify-center px-3 py-1.5 text-xs font-semibold rounded shadow-sm
                            transition-transform active:scale-95 ${styleClass}
                            ${isActive ? 'ring-2 ring-offset-1 ring-stone-400' : ''}
                        `}
                    >
                        {t(value)}
                    </button>
                );
            })}
            <div className="h-px bg-gray-100 my-1 mx-2" />
            <button
                onClick={() => onSelect('clear')}
                className="w-full text-center px-3 py-1.5 rounded flex items-center justify-center gap-2 text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors"
            >
                {t('no_priority')}
            </button>
            <div className="mt-2 pt-2 border-t border-gray-100 px-3 pb-1">
                <div className="text-[9px] font-semibold text-gray-400 mb-2 uppercase tracking-wide whitespace-nowrap">
                    {t('add_to_personal_priorities')}
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold border-2 border-white shadow-sm ring-1 ring-gray-100">
                        MA
                    </div>
                    <button className="w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-400 flex items-center justify-center hover:bg-gray-50 hover:text-gray-600 hover:border-gray-300 transition-all">
                        <PlusIcon size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PriorityMenu;
