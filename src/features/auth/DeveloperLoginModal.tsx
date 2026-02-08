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

  // PRODUCTION MODE: Development login only available in dev environment
  const isDevelopment = import.meta.env.DEV || import.meta.env.VITE_USE_MOCK_AUTH === 'true';

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isDevelopment) {
      setError('Development login is only available in development mode');
      return;
    }

    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password');
      return;
    }

    // Development-only credentials (will only work if isDevelopment is true)
    const validCredentials = [
      { email: 'master@nabdchain.com', password: '2450', token: 'dev-token' },
      { email: 'sam@nabdchain.com', password: '123', token: 'sam-token' },
    ];

    const match = validCredentials.find((c) => c.email === email && c.password === password);

    if (match) {
      setLoading(true);
      setError('');
      await new Promise((resolve) => setTimeout(resolve, 1000));
      localStorage.setItem('nabd_dev_mode', 'true');
      localStorage.setItem('mock_auth_token', match.token);

      const hostname = window.location.hostname;
      const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
      if (!isLocalhost && hostname.includes('nabdchain.com') && !hostname.startsWith('app.')) {
        window.location.href = `https://app.nabdchain.com?dev_auth=${match.token}`;
      } else {
        window.location.reload();
      }
    } else {
      setError(t('invalid_dev_credentials'));
      setLoading(false);
    }
  };

  const _handleGoogleBypass = async () => {
    // Development-only: Google button logs you in as a simulated Google user
    if (!isDevelopment) {
      setError('Development login is only available in development mode');
      return;
    }

    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    localStorage.setItem('nabd_dev_mode', 'true');
    localStorage.setItem('mock_auth_token', 'google-token');

    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    if (!isLocalhost && hostname.includes('nabdchain.com') && !hostname.startsWith('app.')) {
      window.location.href = 'https://app.nabdchain.com?dev_auth=google-token';
    } else {
      window.location.reload();
    }
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
              onClick={(e) => e.stopPropagation()}
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
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-monday-dark-text mb-2">
                    {t('sign_in_to_nabd')}
                  </h2>
                  <p className="text-sm text-zinc-500 dark:text-monday-dark-text-secondary">
                    {t('welcome_back_continue')}
                  </p>
                </div>

                <div className="space-y-3 mb-6">
                  <p className="text-xs text-zinc-500 dark:text-monday-dark-text-secondary text-center">
                    {t('enter_dev_credentials')}
                  </p>
                </div>

                <form onSubmit={handleFormSubmit} className="space-y-4">
                  {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-md border border-red-100 dark:border-red-900/30 flex items-start gap-2">
                      <span>•</span> {error}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-monday-dark-text">
                      {t('email_address')}
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-9 rounded-md border border-zinc-200 dark:border-monday-dark-border px-3 text-sm text-zinc-900 dark:text-monday-dark-text bg-white dark:bg-monday-dark-bg placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/20 focus:border-[#6C47FF] transition-all"
                      placeholder=""
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-monday-dark-text">
                      {t('password')}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
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
                  {t('dont_have_account')}{' '}
                  <a href="#" className="text-[#6C47FF] hover:underline font-medium">
                    {t('sign_up')}
                  </a>
                </p>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
