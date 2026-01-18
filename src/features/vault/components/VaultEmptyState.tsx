
import React from 'react';
import { Shield, Key, CreditCard, Note as StickyNote, Plus, DownloadSimple as Import, MagnifyingGlass as Search, ArrowRight, Folder } from 'phosphor-react';
import { useAppContext } from '../../../contexts/AppContext';

interface VaultEmptyStateProps {
    type: 'empty-vault' | 'active-search' | 'empty-category' | 'empty-folder';
    category?: string;
    searchQuery?: string;
    onClearSearch?: () => void;
    onCreateItem?: (type?: string) => void;
}

export const VaultEmptyState: React.FC<VaultEmptyStateProps> = ({
    type,
    category,
    searchQuery,
    onClearSearch,
    onCreateItem
}) => {
    const { t } = useAppContext();

    // 1. Search Result Empty State
    if (type === 'active-search') {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-fade-in-up">
                <div className="w-16 h-16 bg-gray-100 dark:bg-monday-dark-hover rounded-full flex items-center justify-center mb-6">
                    <Search className="text-gray-400" size={32} />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
                    {t('no_matching_items')}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
                    {t('no_matching_desc').replace('{query}', searchQuery || '')}
                </p>
                {onClearSearch && (
                    <button
                        onClick={onClearSearch}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md font-medium transition-colors"
                    >
                        {t('clear_search')}
                    </button>
                )}
            </div>
        );
    }

    // 2. Specific Category Empty State (e.g., "No favorites yet")
    if (type === 'empty-category') {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-fade-in-up">
                <div className="w-20 h-20 bg-blue-50 dark:bg-monday-dark-hover rounded-full flex items-center justify-center mb-6">
                    {category === 'favorites' ? <div className="text-4xl">⭐</div> : <div className="text-4xl">📭</div>}
                </div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                    {category === 'favorites' ? t('no_favorites_yet') : t('no_category_yet').replace('{category}', t(category || '') || category || '')}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-8">
                    {category === 'favorites'
                        ? t('favorites_empty_desc')
                        : t('empty_folder_desc').replace('{category}', t(category || '') || category || '')}
                </p>
                {onCreateItem && (
                    <button
                        onClick={() => onCreateItem(category)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-monday-blue hover:bg-blue-600 text-white rounded-md font-medium shadow-sm transition-all hover:shadow-md"
                    >
                        <Plus size={18} />
                        <span>{category === 'favorites' ? 'Item' : t('create_category_item').replace('{category}', t(category || '') || category || '')}</span>
                    </button>
                )}
            </div>
        );
    }



    // 4. Empty Folder State
    if (type === 'empty-folder') {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-fade-in-up">
                <div className="w-20 h-20 bg-blue-50 dark:bg-monday-dark-hover rounded-full flex items-center justify-center mb-6">
                    <Folder className="text-blue-500" size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                    {t('this_folder_is_empty')}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-8">
                    {t('add_new_items_folder')}
                </p>
                {onCreateItem && (
                    <div className="flex gap-4">
                        <button
                            onClick={() => onCreateItem('folder')}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md font-medium transition-all"
                        >
                            <Plus size={18} />
                            <span>{t('new_subfolder')}</span>
                        </button>
                        <button
                            onClick={() => onCreateItem('note')}
                            className="flex items-center gap-2 px-5 py-2.5 bg-monday-blue hover:bg-blue-600 text-white rounded-md font-medium transition-all shadow-md"
                        >
                            <StickyNote size={18} />
                            <span>{t('new_note')}</span>
                        </button>
                    </div>
                )}
            </div>
        )
    }

    // 3. Global "Zero Page" - The Efficiency Dashboard
    return (
        <div className="flex flex-col items-center justify-center h-full p-8 animate-fade-in-up">
            <div className="max-w-4xl w-full">

                {/* Hero Section */}
                <div className="text-center mb-12">
                    <div className="inline-flex p-4 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl mb-6 shadow-sm border border-white/50 dark:border-white/5">
                        <Shield className="w-12 h-12 text-monday-blue" strokeWidth={1.5} />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                        {t('secure_digital_life')}
                    </h2>
                    <p className="text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
                        {t('vault_empty_desc')}
                    </p>
                </div>

                {/* efficiency Actions Grid */}
                <div className="flex flex-wrap justify-center gap-4 mb-10">
                    <QuickAction
                        icon={<Key className="text-red-500" />}
                        title={t('add_login')}
                        desc={t('save_passwords_desc')}
                        bg="bg-red-50 dark:bg-red-900/10"
                        onClick={() => onCreateItem && onCreateItem('login')}
                    />
                    <QuickAction
                        icon={<Folder className="text-blue-500" />}
                        title={t('new_folder')}
                        desc={t('create_secure_folder')}
                        bg="bg-blue-50 dark:bg-blue-900/10"
                        onClick={() => onCreateItem && onCreateItem('folder')}
                    />
                    <QuickAction
                        icon={<StickyNote className="text-yellow-500" />}
                        title={t('secure_note')}
                        desc={t('encrypted_text_notes')}
                        bg="bg-yellow-50 dark:bg-yellow-900/10"
                        onClick={() => onCreateItem && onCreateItem('note')}
                    />

                </div>

                {/* Footer Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 border-t border-gray-200 dark:border-monday-dark-border pt-8">
                    <button className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-monday-blue dark:hover:text-monday-blue font-medium transition-colors group">
                        <div className="p-2 bg-gray-100 dark:bg-monday-dark-hover rounded-md group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20">
                            <Import size={18} />
                        </div>
                        <span>{t('import_from_1password')}</span>
                    </button>

                    <div className="h-4 w-px bg-gray-300 dark:bg-gray-700 hidden sm:block"></div>

                    <div className="text-sm text-gray-400 dark:text-gray-500 flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs font-mono">N</span>
                        {t('to_create_new_item')}
                    </div>
                </div>
            </div>
        </div>
    );
};

const QuickAction = ({ icon, title, desc, bg, onClick }: { icon: React.ReactNode, title: string, desc: string, bg: string, onClick?: () => void }) => (
    <button
        onClick={onClick}
        className="flex flex-col items-center p-5 bg-white dark:bg-monday-dark-surface border border-gray-200 dark:border-monday-dark-border rounded-xl hover:shadow-lg hover:border-monday-blue/30 dark:hover:border-monday-blue/30 transition-all text-center group w-64"
    >
        <div className={`p-3 rounded-lg ${bg} mb-4 group-hover:scale-110 transition-transform duration-300`}>
            {React.cloneElement(icon as React.ReactElement, { size: 24 })}
        </div>
        <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-1 group-hover:text-monday-blue transition-colors flex items-center justify-center gap-2">
            {title}
            <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
        </h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            {desc}
        </p>
    </button>
)

