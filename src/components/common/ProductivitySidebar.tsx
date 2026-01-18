import React from 'react';
import { useAppContext } from '../../contexts/AppContext';

interface ProductivitySidebarProps {
    layout?: 'right' | 'bottom';
    contentOnly?: boolean;
}

const ProductivitySidebar: React.FC<ProductivitySidebarProps> = ({ layout = 'right', contentOnly = false }) => {
    const { t } = useAppContext();
    const isRight = layout === 'right';

    const content = (
        <>
            {/* Tasks Section */}
            <div className={`
                ${isRight || contentOnly ? 'flex-1 border-b' : 'flex-1 border-r'} 
                flex flex-col min-h-0 border-border-light dark:border-border-dark
            `}>
                <div className={`
                        ${isRight ? 'p-4' : 'py-1.5 px-3'} 
                        flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/30
                    `}>
                    <h3 className={`font-semibold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark flex items-center ${isRight ? 'text-sm' : 'text-[11px]'}`}>
                        <span className={`material-icons mr-2 ${isRight ? 'text-base' : 'text-sm'}`}>check_circle_outline</span>
                        {t('tasks')}
                    </h3>
                    <button className="text-primary hover:text-primary-dark">
                        <span className="material-icons text-lg">add</span>
                    </button>
                </div>
                <div className={`
                        ${isRight ? 'p-4 space-y-3' : 'p-2 space-y-1.5'} 
                        overflow-y-auto productivity-sidebar-scrollbar flex-1 flex flex-col items-center justify-center text-center
                    `}>
                    <div className="text-text-secondary-light dark:text-text-secondary-dark opacity-50">
                        <span className="material-icons text-2xl mb-1">done_all</span>
                        <p className="text-xs">{t('no_active_tasks')}</p>
                    </div>
                </div>
            </div>

            {/* Reminders Section */}
            <div className={`
                    ${isRight ? 'flex-1 border-b' : 'flex-1 border-r'} 
                    flex flex-col min-h-0 border-border-light dark:border-border-dark
                `}>
                <div className={`
                        ${isRight ? 'p-4' : 'py-1.5 px-3'} 
                        flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/30
                    `}>
                    <h3 className={`font-semibold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark flex items-center ${isRight ? 'text-sm' : 'text-[11px]'}`}>
                        <span className={`material-icons mr-2 ${isRight ? 'text-base' : 'text-sm'}`}>alarm</span>
                        {t('reminders')}
                    </h3>
                    <button className="text-primary hover:text-primary-dark">
                        <span className="material-icons text-lg">add</span>
                    </button>
                </div>
                <div className={`
                        ${isRight ? 'p-4 space-y-4' : 'p-2 space-y-2'} 
                        overflow-y-auto productivity-sidebar-scrollbar flex-1 flex flex-col items-center justify-center text-center
                    `}>
                    <div className="text-text-secondary-light dark:text-text-secondary-dark opacity-50">
                        <span className="material-icons text-2xl mb-1">notifications_off</span>
                        <p className="text-xs">{t('no_reminders')}</p>
                    </div>
                </div>
            </div>

            {/* Mentions & Files Section */}
            <div className="flex-1 flex flex-col min-h-0">
                <div className={`
                        ${isRight ? 'p-4' : 'py-1.5 px-3'} 
                        flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/30
                    `}>
                    <h3 className={`font-semibold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark flex items-center ${isRight ? 'text-sm' : 'text-[11px]'}`}>
                        <span className={`material-icons mr-2 ${isRight ? 'text-base' : 'text-sm'}`}>folder_open</span>
                        {t('mentions_and_files')}
                    </h3>
                    <button className="text-primary hover:text-primary-dark text-xs font-medium">{t('view_all')}</button>
                </div>
                <div className={`
                        ${isRight ? 'p-4 space-y-3' : 'p-2 space-y-2'} 
                        overflow-y-auto productivity-sidebar-scrollbar flex-1 flex flex-col items-center justify-center text-center
                    `}>
                    <div className="text-text-secondary-light dark:text-text-secondary-dark opacity-50">
                        <span className="material-icons text-2xl mb-1">description</span>
                        <p className="text-xs">{t('no_recent_files')}</p>
                    </div>
                </div>
            </div>
        </>
    );

    if (contentOnly) {
        return (
            <div className="flex flex-col flex-1 h-full min-h-0 bg-surface-light dark:bg-surface-dark transition-all">
                {content}
            </div>
        );
    }

    return (
        <>
            <aside className={`
                ${isRight ? 'w-80 border-l flex-col h-full' : 'w-full border-t flex-row h-32'} 
                bg-surface-light dark:bg-surface-dark border-border-light dark:border-border-dark flex shrink-0 transition-all
            `}>
                {content}
            </aside>
            <style>{`
                .productivity-sidebar-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .productivity-sidebar-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .productivity-sidebar-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #D1D5DB;
                    border-radius: 20px;
                }
                .dark .productivity-sidebar-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #4B5563;
                }
            `}</style>
        </>
    );
};

export default ProductivitySidebar;
