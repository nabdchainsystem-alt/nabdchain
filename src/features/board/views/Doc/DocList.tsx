import React from 'react';
import { Doc } from './types';
import { FileText, Clock } from 'phosphor-react';

interface DocListProps {
    docs: Doc[];
    selectedDocId: string | null;
    onSelectDoc: (id: string) => void;
}

export const DocList: React.FC<DocListProps> = ({ docs, selectedDocId, onSelectDoc }) => {
    return (
        <div className="h-full flex flex-col border-e border-stone-200 dark:border-stone-800 bg-stone-50/30 dark:bg-stone-900/30">
            <div className="p-4 border-b border-stone-200 dark:border-stone-800">
                <h2 className="text-lg font-serif font-bold text-stone-900 dark:text-stone-100">Documents</h2>
                <p className="text-xs text-stone-500 dark:text-stone-500 mt-1 font-sans">{docs.length} items</p>
            </div>

            <div className="flex-1 overflow-y-auto">
                {docs.map(doc => (
                    <div
                        key={doc.id}
                        onClick={() => onSelectDoc(doc.id)}
                        className={`p-4 border-b border-stone-100 dark:border-stone-800/50 cursor-pointer transition-colors group ${selectedDocId === doc.id
                                ? 'bg-white dark:bg-stone-800 shadow-sm'
                                : 'hover:bg-white/50 dark:hover:bg-stone-800/50'
                            }`}
                    >
                        <h3 className={`font-serif font-medium text-base mb-1 ${selectedDocId === doc.id ? 'text-stone-900 dark:text-stone-50' : 'text-stone-800 dark:text-stone-200'
                            }`}>
                            {doc.title || 'Untitled'}
                        </h3>
                        <p className="text-sm text-stone-500 dark:text-stone-400 line-clamp-2 font-serif opacity-80 mb-2">
                            {doc.content || 'No content...'}
                        </p>

                        <div className="flex items-center gap-3 text-xs text-stone-400 font-sans">
                            <span className="flex items-center gap-1 font-datetime">
                                <Clock size={12} />
                                {new Date(doc.updatedAt).toLocaleDateString()}
                            </span>
                            {doc.tags.length > 0 && (
                                <span className="px-1.5 py-0.5 bg-stone-100 dark:bg-stone-800 rounded text-stone-500 border border-stone-200 dark:border-stone-700">
                                    {doc.tags[0]}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
