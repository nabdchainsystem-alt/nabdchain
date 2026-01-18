import React from 'react';
import ProductivitySidebar from '../../components/common/ProductivitySidebar';
import TalkSidebar from './components/TalkSidebar';

import { useAppContext } from '../../contexts/AppContext';

const TalkPage: React.FC = () => {
    const { t } = useAppContext();
    return (
        <div className="flex flex-col h-full bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark font-sans overflow-hidden">
            {/* Page Header */}
            {/* ... (keep header) ... */}
            <header className="h-16 border-b border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark flex items-center justify-between px-6 shrink-0 z-10 transition-colors">
                <div className="flex items-center space-x-4">
                    <h1 className="text-xl font-bold flex items-center">
                        <span className="text-text-secondary-light dark:text-text-secondary-dark mr-2">#</span>
                        project-phoenix-launch
                    </h1>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">{t('active_sprint')}</span>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="flex -space-x-2 overflow-hidden">
                        <img alt="User Avatar 1" className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-800" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDu5VcNDcvkzIuG6142kSNeGjA_jGkf9TtIxF52Zu-47EHGGurpOwMGbwWrtvsGv-iLrs_sv8eShiXOvU3aA1NC5GEk6YsweE80Gg-TXNNB280Zu3Oezw-Oxhg_Ikl_icuLyPpIJmcVPTy4It6hDzCRYAbmMzSJwrTW0sT3n0M0SQ2OG2VLMjeyWMSoM985_gNUHYQNaTRngcbHtuHyFseIhXICWZJTkaQ5x2zNw3cw-8serHHSzGXHN078doA5_6ajLiC1C8vHmxA" />
                        <img alt="User Avatar 2" className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-800" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAlitVHp3TySxrCbV2a8_OeiiyMGJw3M1Hj03ZENcMFrlFBP80jArbNUvEDwMlHEQq3P15A6E35FF-rsgYuDUeNbCzZZVx1GJBQkqlwR3vBo_SHJcHiayqhY_Om7UpKg6NSiQGWAKN__BuFV8CuZKksgTc8tcSg8YppN-vNnS5JLQQLO0xwmD3QM9QTXkaKlaIaVQYWc5iqq7oXBTctAjpnF-YlS3ZKbLHYVLpOAL03Zs6JwstoEU7fGYfCqlCwMGFsMKgXVzE4qQs" />
                        <img alt="User Avatar 3" className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-800" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDdD6dyyVCfhJ1R_9Abp3zhS4FGlQGpQR6DgkM4cPs4reugaT5PV9dL1U7Ha7m7P2wjh6A6GCV_gozFXAAzv5tIUqOFaurDQOKlbMwviEkBFP3ybdvPoDNMIMrwFiM8VO11SAyOEm7G_TWYe-phwYfbhUKlb1jRaZ9_sWjPguDWVnabi3Q4TPmNNEP_mPIji336NA63xxq-zI8ROmStaOHGJVVlRsNAuKrBONrUbcbTgofomGHJbadAS_TCiX6y75KITHZDn4p541Q" />
                        <div className="h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-800 bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-500 dark:text-gray-300">+5</div>
                    </div>
                    <button className="text-text-secondary-light dark:text-text-secondary-dark hover:text-primary transition-colors">
                        <span className="material-icons">info_outline</span>
                    </button>
                    <button className="text-text-secondary-light dark:text-text-secondary-dark hover:text-primary transition-colors">
                        <span className="material-icons">settings</span>
                    </button>
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden">
                {/* Talk Sidebar (Channels/DMs) */}
                <TalkSidebar />

                {/* Messages Area */}
                {/* ... (keep messages area) ... */}
                <div className="flex-1 flex flex-col min-w-0 bg-background-light dark:bg-background-dark relative">
                    <div className="flex-1 overflow-y-auto p-6 space-y-8 talk-custom-scrollbar">
                        <div className="flex items-center justify-center">
                            <div className="bg-gray-200 dark:bg-gray-800 px-4 py-1 rounded-full text-xs text-text-secondary-light dark:text-text-secondary-dark font-medium">
                                Today, October 24th
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-text-secondary-light dark:text-text-secondary-dark">
                                <span className="material-icons text-3xl">chat_bubble_outline</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold">{t('no_messages_yet')}</h3>
                                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">{t('start_new_discussion_desc')}</p>
                            </div>
                        </div>
                    </div>

                    {/* Input Area */}
                    <div className="p-6 pt-2 bg-background-light dark:bg-background-dark">
                        <div className="border border-border-light dark:border-border-dark rounded-xl bg-surface-light dark:bg-surface-dark shadow-sm transition-all">
                            <div className="flex items-center px-2 py-1.5 border-b border-border-light dark:border-border-dark space-x-1">
                                <button className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-text-secondary-light dark:text-text-secondary-dark">
                                    <span className="material-icons text-lg">format_bold</span>
                                </button>
                                <button className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-text-secondary-light dark:text-text-secondary-dark">
                                    <span className="material-icons text-lg">format_italic</span>
                                </button>
                                <button className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-text-secondary-light dark:text-text-secondary-dark">
                                    <span className="material-icons text-lg">strikethrough_s</span>
                                </button>
                                <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1"></div>
                                <button className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-text-secondary-light dark:text-text-secondary-dark">
                                    <span className="material-icons text-lg">link</span>
                                </button>
                                <button className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-text-secondary-light dark:text-text-secondary-dark">
                                    <span className="material-icons text-lg">list</span>
                                </button>
                            </div>
                            <textarea
                                className="w-full bg-transparent p-3 text-sm max-h-48 focus:ring-0 focus:outline-none border-0 resize-none text-text-primary-light dark:text-text-primary-dark placeholder-text-secondary-light dark:placeholder-text-secondary-dark"
                                placeholder={`${t('message')} #project-phoenix-launch`}
                                rows={3}
                            ></textarea>
                            <div className="flex items-center justify-between px-3 py-2">
                                <div className="flex items-center space-x-2">
                                    <button className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-text-secondary-light dark:text-text-secondary-dark">
                                        <span className="material-icons text-xl">add_circle_outline</span>
                                    </button>
                                    <button className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-text-secondary-light dark:text-text-secondary-dark">
                                        <span className="material-icons text-xl">emoji_emotions</span>
                                    </button>
                                    <button className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-text-secondary-light dark:text-text-secondary-dark">
                                        <span className="material-icons text-xl">alternate_email</span>
                                    </button>
                                </div>
                                <button className="bg-primary hover:bg-primary-dark text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center">
                                    {t('send')}
                                    <span className="material-icons text-sm ml-1">send</span>
                                </button>
                            </div>
                        </div>
                        <div className="text-center mt-2">
                            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                                <span className="font-bold">{t('pro_tip')}</span> {t('type')} <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded text-xs font-mono">/task</code> {t('to_create_task_chat')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Sidebar (Productivity) */}
                <ProductivitySidebar />
            </main>

            <style>{`
                .talk-custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .talk-custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .talk-custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #D1D5DB;
                    border-radius: 20px;
                }
                .dark .talk-custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #4B5563;
                }
            `}</style>
        </div>
    );
};

export default TalkPage;
