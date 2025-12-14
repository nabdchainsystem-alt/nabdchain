import React, { useState } from 'react';
import { Plus, ArrowRight, Zap } from 'lucide-react';

interface GTDCaptureProps {
    onCapture: (text: string) => void;
}

export const GTDCapture: React.FC<GTDCaptureProps> = ({ onCapture }) => {
    const [text, setText] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (text.trim()) {
            onCapture(text);
            setText('');
        }
    };

    return (
        <div className="w-full mb-10">
            <h2 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider flex items-center gap-2">
                <Zap size={16} className="text-yellow-500" /> Quick Capture
            </h2>
            <form onSubmit={handleSubmit} className="relative group">
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="What's on your mind? Capture it now..."
                    className="w-full h-16 pl-6 pr-32 bg-white dark:bg-[#1E1E1E] rounded-2xl shadow-lg border border-transparent focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all text-lg placeholder-gray-400 text-gray-800 dark:text-gray-100 outline-none"
                    autoFocus
                />
                <button
                    type="submit"
                    disabled={!text.trim()}
                    className="absolute right-3 top-3 bottom-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center gap-2 text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
                >
                    Add <ArrowRight size={16} />
                </button>
            </form>
            <p className="text-xs text-gray-400 mt-2 ml-2">Press <span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">Enter</span> to save to Inbox</p>
        </div>
    );
};
