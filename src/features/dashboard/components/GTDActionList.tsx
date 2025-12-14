import React from 'react';
import { MoreHorizontal, GripVertical } from 'lucide-react';

interface Task {
    id: string;
    title: string;
    tag?: string;
    tagColor?: string;
}

interface GTDActionListProps {
    title: string;
    icon: React.ElementType;
    tasks: Task[];
    color: string;
}

export const GTDActionList: React.FC<GTDActionListProps> = ({ title, icon: Icon, tasks, color }) => {
    return (
        <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-[#2C2C2C] h-full">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${color} bg-opacity-10 flex items-center justify-center`}>
                        <Icon size={18} className={color.replace('bg-', 'text-').replace('/10', '')} />
                    </div>
                    <h3 className="font-bold text-gray-800 dark:text-gray-100">{title}</h3>
                </div>
                <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <MoreHorizontal size={20} />
                </button>
            </div>

            <div className="space-y-3">
                {tasks.length > 0 ? tasks.map(task => (
                    <div key={task.id} className="group flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors border border-transparent hover:border-gray-100 dark:hover:border-[#333] cursor-pointer">
                        <GripVertical size={16} className="text-gray-300 opacity-0 group-hover:opacity-100 cursor-grab" />
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 transition-colors" />
                        <span className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300">{task.title}</span>
                        {task.tag && (
                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500`}>
                                {task.tag}
                            </span>
                        )}
                    </div>
                )) : (
                    <div className="text-center py-10 text-gray-400 text-sm italic">
                        No actions here. Clear mind!
                    </div>
                )}
            </div>
        </div>
    );
};
