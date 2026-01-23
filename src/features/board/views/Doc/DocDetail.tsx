import React from 'react';
import { Doc } from './types';
import { DotsThree as MoreHorizontal, CalendarBlank as Calendar, Tag, Clock } from 'phosphor-react';

interface DocDetailProps {
    doc: Doc | null;
}

export const DocDetail: React.FC<DocDetailProps> = ({ doc }) => {
    if (!doc) {
        return (
            <div className="h-full flex items-center justify-center text-stone-400 dark:text-stone-600 font-serif italic bg-white dark:bg-stone-900">
                Select a document to view
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-white dark:bg-stone-900 relative">
            {/* Paper Texture */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-multiply dark:mix-blend-screen bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]"></div>

            {/* Header / Meta */}
            <div className="px-8 pt-8 pb-4 flex items-start justify-between z-10">
                <div className="space-y-4 max-w-2xl w-full">
                    <div className="flex items-center gap-4 text-sm text-stone-400 font-sans">
                        <div className="flex items-center gap-1.5 font-datetime">
                            <Calendar size={14} />
                            <span>{new Date(doc.updatedAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-datetime">
                            <Clock size={14} />
                            <span>{new Date(doc.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        {doc.tags.map(tag => (
                            <div key={tag} className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-500">
                                <Tag size={12} />
                                <span>{tag}</span>
                            </div>
                        ))}
                    </div>

                    <h1 className="text-4xl font-serif font-bold text-stone-900 dark:text-stone-50 tracking-tight leading-tight">
                        {doc.title}
                    </h1>
                </div>

                <button className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors rounded-full hover:bg-stone-100 dark:hover:bg-stone-800">
                    <MoreHorizontal size={20} />
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto px-8 pb-12 z-10">
                <div className="prose prose-stone dark:prose-invert max-w-3xl prose-lg prose-headings:font-serif prose-p:font-serif prose-p:text-stone-700 dark:prose-p:text-stone-300">
                    {/* Placeholder content simulation */}
                    <p className="leading-relaxed whitespace-pre-wrap font-serif text-lg">
                        {doc.content}
                    </p>
                </div>
            </div>
        </div>
    );
};
