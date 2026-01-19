import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeSlash, Spinner } from 'phosphor-react';
import { useAppContext } from '../../contexts/AppContext';

interface DeveloperLoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const DeveloperLoginModal: React.FC<DeveloperLoginModalProps> = ({ isOpen, onClose }) => {
    const { t } = useAppContext();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const performLogin = async () => {
        setLoading(true);
        setError('');

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // In dev mode, we accept either the specific credential OR just allow the Google/Bypass button
        // But for the manual form, we check credentials if provided
        localStorage.setItem('nabd_dev_mode', 'true');
        localStorage.setItem('mock_auth_token', 'dev-token');
        window.location.reload();
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Valid dev credentials
        const validCredentials = [
            { email: 'master@nabdchain.com', password: '2450', token: 'dev-token' },
            { email: 'sam@nabdchain.com', password: '123', token: 'sam-token' },
        ];

        const match = validCredentials.find(c => c.email === email && c.password === password);

        if (match) {
            setLoading(true);
            setError('');
            await new Promise(resolve => setTimeout(resolve, 1000));
            localStorage.setItem('nabd_dev_mode', 'true');
            localStorage.setItem('mock_auth_token', match.token);
            window.location.reload();
        } else {
            setError(t('invalid_dev_credentials'));
            setLoading(false);
        }
    };

    const handleGoogleBypass = async () => {
        // Dev convenience: Google button logs you in as a simulated Google user
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 800));

        localStorage.setItem('nabd_dev_mode', 'true');
        localStorage.setItem('mock_auth_token', 'google-token');
        window.location.reload();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-50 flex items-center justify-center p-4 transition-colors"
                    >
                        {/* Card */}
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white dark:bg-monday-dark-surface w-full max-w-[400px] rounded-xl shadow-[0_16px_32px_-8px_rgba(0,0,0,0.08),0_4px_8px_-4px_rgba(0,0,0,0.1)] overflow-hidden relative border border-zinc-200 dark:border-monday-dark-border"
                        >
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-md transition-colors focus:outline-none"
                            >
                                <X size={20} />
                            </button>

                            <div className="p-10 pb-8">
                                <div className="text-center mb-8">
                                    <div className="w-8 h-8 bg-[#6C47FF] rounded-md flex items-center justify-center text-white text-sm font-bold mx-auto mb-6">
                                        N
                                    </div>
                                    <h2 className="text-xl font-bold text-zinc-900 dark:text-monday-dark-text mb-2">{t('sign_in_to_nabd')}</h2>
                                    <p className="text-sm text-zinc-500 dark:text-monday-dark-text-secondary">{t('welcome_back_continue')}</p>
                                </div>

                                <div className="space-y-3 mb-6">
                                    <button
                                        onClick={handleGoogleBypass}
                                        disabled={loading}
                                        className="w-full h-10 border border-zinc-200 dark:border-monday-dark-border rounded-md flex items-center justify-center gap-3 text-sm font-medium text-zinc-700 dark:text-monday-dark-text hover:bg-zinc-50 dark:hover:bg-monday-dark-hover transition-colors focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/20 focus:border-[#6C47FF]"
                                    >
                                        <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                        </svg>
                                        {t('continue_with_google')}
                                    </button>
                                </div>

                                <div className="relative mb-6">
                                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-200 dark:border-monday-dark-border"></div></div>
                                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-white dark:bg-monday-dark-surface px-2 text-zinc-500 dark:text-monday-dark-text-secondary">{t('or_divider')}</span></div>
                                </div>

                                <form onSubmit={handleFormSubmit} className="space-y-4">
                                    {error && (
                                        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-md border border-red-100 dark:border-red-900/30 flex items-start gap-2">
                                            <span>•</span> {error}
                                        </div>
                                    )}

                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-semibold text-zinc-700 dark:text-monday-dark-text">{t('email_address')}</label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            className="w-full h-9 rounded-md border border-zinc-200 dark:border-monday-dark-border px-3 text-sm text-zinc-900 dark:text-monday-dark-text bg-white dark:bg-monday-dark-bg placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/20 focus:border-[#6C47FF] transition-all"
                                            placeholder=""
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-semibold text-zinc-700 dark:text-monday-dark-text">{t('password')}</label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                onChange={e => setPassword(e.target.value)}
                                                className="w-full h-9 rounded-md border border-zinc-200 dark:border-monday-dark-border px-3 text-sm text-zinc-900 dark:text-monday-dark-text bg-white dark:bg-monday-dark-bg placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/20 focus:border-[#6C47FF] transition-all"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute end-3 top-2.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                                            >
                                                {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full h-9 bg-[#6C47FF] text-white rounded-md text-sm font-medium hover:bg-[#5839db] transition-colors shadow-sm flex items-center justify-center gap-2 mt-2"
                                    >
                                        {loading ? <Spinner className="animate-spin" size={16} /> : t('continue_btn')}
                                    </button>
                                </form>
                            </div>

                            <div className="bg-zinc-50 dark:bg-monday-dark-bg border-t border-zinc-100 dark:border-monday-dark-border p-4 text-center">
                                <p className="text-xs text-zinc-500 dark:text-monday-dark-text-secondary">
                                    {t('dont_have_account')} <a href="#" className="text-[#6C47FF] hover:underline font-medium">{t('sign_up')}</a>
                                </p>
                            </div>

                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
