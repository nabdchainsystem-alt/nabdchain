import React, { useState } from 'react';
import {
    Send, Trash2, Paperclip, FileSignature, Edit3, Accessibility,
    MoreHorizontal, CornerUpLeft, RotateCcw, ChevronDown,
    Type, Bold, Italic, Underline, Link, MoreHorizontal as MoreDots,
    AlignLeft, List, Code, Quote, Maximize2
} from 'lucide-react';

interface ComposeViewProps {
    onDiscard: () => void;
}

export const ComposeView: React.FC<ComposeViewProps> = ({ onDiscard }) => {
    const [to, setTo] = useState("");
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");

    return (
        <div className="flex flex-col h-full w-full bg-white dark:bg-monday-dark-bg text-gray-900 dark:text-gray-100 font-sans">

            {/* 1. Main Action Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-monday-dark-border bg-white dark:bg-monday-dark-surface">
                <div className="flex items-center gap-4">
                    <button className="flex items-center gap-2 bg-monday-blue hover:bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors">
                        <Send size={14} className="-ml-0.5" />
                        Send
                    </button>
                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <ToolBtn icon={<Trash2 size={16} />} label="Discard" onClick={onDiscard} />
                        <ToolBtn icon={<Paperclip size={16} />} label="Attach File" />
                        <ToolBtn icon={<FileSignature size={16} />} label="Signature" />
                        <ToolBtn icon={<Edit3 size={16} />} label="Editor" />
                        <ToolBtn icon={<Accessibility size={16} />} label="Check Accessibility" />
                    </div>
                </div>
                <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                    <MoreHorizontal size={20} />
                </button>
            </div>

            {/* 2. Formatting Toolbar */}
            <div className="flex items-center px-4 py-2 border-b border-gray-200 dark:border-monday-dark-border bg-[#fcfcfc] dark:bg-monday-dark-bg gap-3 text-gray-600 dark:text-gray-400 overflow-x-auto">
                <div className="flex items-center gap-1 border-r border-gray-200 dark:border-monday-dark-border pr-2">
                    <IconBtn icon={<CornerUpLeft size={16} />} label="Undo" withChevron />
                    <IconBtn icon={<RotateCcw size={16} />} label="Redo" />
                </div>

                <div className="flex items-center gap-2 border-r border-gray-200 dark:border-monday-dark-border pr-2">
                    <button className="flex items-center gap-1 bg-gray-100 dark:bg-monday-dark-hover px-2 py-0.5 rounded text-xs">
                        Aptos <ChevronDown size={12} />
                    </button>
                    <button className="flex items-center gap-1 bg-gray-100 dark:bg-monday-dark-hover px-2 py-0.5 rounded text-xs">
                        12 <ChevronDown size={12} />
                    </button>
                </div>

                <div className="flex items-center gap-1.5 border-r border-gray-200 dark:border-monday-dark-border pr-2">
                    <IconBtn icon={<Type size={16} />} />
                    <IconBtn icon={<Bold size={16} />} isActive />
                    <IconBtn icon={<Italic size={16} />} />
                    <IconBtn icon={<Underline size={16} />} />
                </div>

                <div className="flex items-center gap-1.5 border-r border-gray-200 dark:border-monday-dark-border pr-2">
                    <IconBtn icon={<List size={16} />} withChevron />
                    <IconBtn icon={<AlignLeft size={16} />} withChevron />
                    <IconBtn icon={<Code size={16} />} />
                    <IconBtn icon={<Quote size={16} />} />
                </div>

                <div className="flex items-center gap-1.5">
                    <IconBtn icon={<Link size={16} />} />
                    <IconBtn icon={<MoreDots size={16} />} />
                </div>
            </div>

            {/* 3. Input Fields */}
            <div className="px-8 py-4 space-y-4 max-w-5xl mx-auto w-full">

                {/* From */}
                <div className="flex items-baseline gap-4 group">
                    <label className="text-sm text-gray-500 w-12 text-right">From:</label>
                    <div className="flex-1 flex items-center justify-between border-b border-transparent group-hover:border-gray-200 py-1">
                        <span className="text-sm text-gray-800 dark:text-gray-200">Mohamed Ali (mohamedali89114@gmail.com)</span>
                        <div className="flex items-center gap-2 text-gray-400">
                            <ChevronDown size={14} />
                            <Maximize2 size={12} className="rotate-45" />
                        </div>
                    </div>
                </div>

                {/* To */}
                <div className="flex items-baseline gap-4 group relative">
                    <label className="text-sm text-gray-500 w-12 text-right">To:</label>
                    <div className="flex-1 flex items-center justify-between border-b border-monday-blue py-1">
                        <input
                            type="text"
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                            className="w-full outline-none bg-transparent text-sm"
                        />
                    </div>
                    <div className="absolute right-0 top-1 text-xs text-gray-500 flex gap-2">
                        <button className="hover:text-gray-800">Cc</button>
                        <button className="hover:text-gray-800">Bcc</button>
                        <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-[10px] text-gray-600 dark:text-gray-300">
                            <span className="sr-only">Avatar</span>
                            <UserIcon />
                        </div>
                    </div>
                </div>

                {/* Subject */}
                <div className="flex items-baseline gap-4 group">
                    <label className="text-sm text-gray-500 w-12 text-right">Subject:</label>
                    <div className="flex-1 flex items-center justify-between border-b border-gray-200 dark:border-monday-dark-border py-1">
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full outline-none bg-transparent text-sm"
                            placeholder=""
                        />
                        <div className="text-xs text-gray-400 flex items-center gap-1 cursor-pointer hover:text-gray-600">
                            Importance <ChevronDown size={10} />
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="mt-6 pl-16">
                    <div className="min-h-[300px] outline-none text-sm text-gray-800 dark:text-gray-200" contentEditable>

                    </div>
                    {/* Blinking Cursor Simulation (optional, as contentEditable has one) */}
                    <div className="h-5 w-px bg-black animate-pulse inline-block"></div>
                </div>

            </div>

        </div>
    );
};

// --- Helpers ---

const ToolBtn = ({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick?: () => void }) => (
    <button onClick={onClick} className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-monday-dark-hover rounded text-xs font-medium transition-colors">
        {icon}
        <span>{label}</span>
    </button>
);

const IconBtn = ({ icon, label, withChevron, isActive }: { icon: React.ReactNode, label?: string, withChevron?: boolean, isActive?: boolean }) => (
    <button className={`flex items-center gap-0.5 p-1 rounded hover:bg-gray-200 dark:hover:bg-monday-dark-hover transition-colors ${isActive ? 'bg-gray-200 dark:bg-monday-dark-hover' : ''}`}>
        {icon}
        {label && <span className="text-xs ml-1">{label}</span>}
        {withChevron && <ChevronDown size={10} className="ml-0.5 text-gray-400" />}
    </button>
);

const UserIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
    </svg>
);
