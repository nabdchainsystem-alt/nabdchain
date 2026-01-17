import React from 'react';
import { useAppContext } from '../../../contexts/AppContext';

interface Discussion {
    id: string;
    name: string;
    type: 'channel' | 'dm';
    unreadCount?: number;
    active?: boolean;
}

const TalkSidebar: React.FC = () => {
    const { t } = useAppContext();
    const channels: Discussion[] = [];

    const dms: Discussion[] = [];

    return (
        <div className="w-64 border-r border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark flex flex-col shrink-0">
            <div className="p-4 flex items-center justify-between">
                <h2 className="text-lg font-bold">{t('talk')}</h2>
                <button className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-primary transition-colors" title={t('new_discussion')}>
                    <span className="material-icons">add_comment</span>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto talk-custom-scrollbar">
                <div className="px-2 py-4">
                    <div className="mb-6">
                        <div className="px-2 flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">{t('channels')}</span>
                        </div>
                        <div className="space-y-0.5">
                            {channels.map((channel) => (
                                <button
                                    key={channel.id}
                                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-sm transition-colors ${channel.active
                                        ? 'bg-primary/10 text-primary font-semibold'
                                        : 'text-text-secondary-light dark:text-text-secondary-dark hover:bg-gray-100 dark:hover:bg-gray-800'
                                        }`}
                                >
                                    <div className="flex items-center min-w-0">
                                        <span className="mr-2 opacity-70">#</span>
                                        <span className="truncate">{channel.name}</span>
                                    </div>
                                    {channel.unreadCount && (
                                        <span className="bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                            {channel.unreadCount}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="px-2 flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">{t('direct_messages')}</span>
                        </div>
                        <div className="space-y-0.5">
                            {dms.map((dm) => (
                                <button
                                    key={dm.id}
                                    className="w-full flex items-center px-2 py-1.5 rounded-lg text-sm text-text-secondary-light dark:text-text-secondary-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <div className="flex items-center min-w-0">
                                        <div className="w-2 h-2 rounded-full bg-green-500 mr-3"></div>
                                        <span className="truncate">{dm.name}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4 border-t border-border-light dark:border-border-dark">
                <button className="w-full flex items-center justify-center p-2 rounded-lg bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 transition-colors">
                    <span className="material-icons text-sm mr-2">add</span>
                    Create New
                </button>
            </div>
        </div>
    );
};

export default TalkSidebar;
