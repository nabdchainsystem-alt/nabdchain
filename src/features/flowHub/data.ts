import {
    Target,
    Calendar,
    Layers,
    Lightbulb,
    PenTool,
    RotateCw,
    Search,
    Zap
} from 'lucide-react';

export const SYSTEMS = [
    { id: 'capture', label: 'Clear Mind', icon: PenTool, desc: 'Capture thoughts freely', type: 'Thinking' },
    { id: 'focus', label: 'Focus Mode', icon: Target, desc: 'Deep work timer', type: 'Execution' },
    { id: 'plan', label: 'Planning', icon: Calendar, desc: 'Schedule & timeline', type: 'Thinking' },
    { id: 'organize', label: 'Organize Work', icon: Layers, desc: 'Projects & tasks', type: 'Execution' },
    { id: 'clarify', label: 'Thinking Space', icon: Search, desc: 'Analyze & clarify', type: 'Thinking' },
    { id: 'reflect', label: 'Reflection', icon: RotateCw, desc: 'Review progress', type: 'Reflection' },
    { id: 'idea', label: 'Ideas', icon: Lightbulb, desc: 'Incubate concepts', type: 'Thinking' },
    { id: 'reset', label: 'Stuck Mode', icon: Zap, desc: 'Unblock & reset', type: 'Reflection' },
];

export const getTypeColor = (type: string) => {
    switch (type) {
        case 'Thinking': return 'text-purple-500 bg-purple-50 dark:bg-purple-900/20';
        case 'Execution': return 'text-green-500 bg-green-50 dark:bg-green-900/20';
        case 'Reflection': return 'text-amber-500 bg-amber-50 dark:bg-amber-900/20';
        default: return 'text-gray-500 bg-gray-50 dark:bg-gray-800';
    }
};
