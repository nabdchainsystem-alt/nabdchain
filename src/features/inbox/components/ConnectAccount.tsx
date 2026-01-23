import { Envelope as Mail } from 'phosphor-react';
import { useAuth } from '../../../auth-adapter';
import { emailService } from '../../../services/emailService';
import { useAppContext } from '../../../contexts/AppContext';
import { appLogger } from '../../../utils/logger';

export const ConnectAccount: React.FC = () => {
    const { getToken } = useAuth();
    const { t, language } = useAppContext();

    const handleConnect = async (provider: 'google' | 'outlook') => {
        try {
            const token = await getToken();
            if (!token) {
                alert(t('must_be_logged_in'));
                return;
            }
            const { url } = await emailService.getAuthUrl(token, provider);
            window.location.href = url;
        } catch (e) {
            appLogger.error("Failed to start connection", e);
            alert(t('failed_init_connection'));
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-full p-8 bg-gray-50 dark:bg-monday-dark-bg text-center" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="bg-white dark:bg-monday-dark-surface p-8 rounded-xl shadow-sm border border-gray-200 dark:border-monday-dark-border max-w-md w-full">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600 dark:text-blue-400">
                    <Mail size={32} />
                </div>

                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">{t('connect_inbox_title')}</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-8 whitespace-pre-line">
                    {t('connect_inbox_desc')}
                </p>

                <div className="space-y-3">
                    <button
                        onClick={() => handleConnect('google')}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-200 font-medium"
                    >
                        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        {t('connect_with_google')}
                    </button>

                    <button
                        onClick={() => handleConnect('outlook')}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-200 font-medium"
                    >
                        <svg className="w-5 h-5 shrink-0" viewBox="0 0 23 23">
                            <path fill="#f25022" d="M1 1h10v10H1z" /><path fill="#00a4ef" d="M1 12h10v10H1z" /><path fill="#7fba00" d="M12 1h10v10H12z" /><path fill="#ffb900" d="M12 12h10v10H12z" />
                        </svg>
                        {t('connect_with_outlook')}
                    </button>
                </div>

                <p className="mt-6 text-xs text-gray-400">
                    {t('connect_terms')}
                </p>
            </div>
        </div>
    );
};
