import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth, useUser } from '../../auth-adapter';
import { authLogger } from '../../utils/logger';
import { inviteService } from '../../services/inviteService';
import { CheckCircle, Warning as AlertTriangle, CircleNotch as Loader } from 'phosphor-react';
import { useAppContext } from '../../contexts/AppContext';

export const AcceptInvitePage: React.FC = () => {
  const { t } = useAppContext();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user } = useUser();

  const token = searchParams.get('token');
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      // Redirect to login, preserving the invite link as the redirect url
      // Clerk usually handles this if we protect the route, but explicit is good
      const _redirectUrl = encodeURIComponent(window.location.href);
      // Assuming we have a way to trigger login or just let Clerk's RedirectToSignIn handle it via route protection
      return;
    }

    const processInvite = async () => {
      if (!token) {
        setStatus('error');
        setErrorMsg(t('invalid_invitation_link'));
        return;
      }

      try {
        const authToken = await getToken();
        if (!authToken) return;

        await inviteService.acceptInvite(authToken, token);
        setStatus('success');

        // Redirect after small delay
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } catch (e) {
        authLogger.error('Invite Error:', e);
        setStatus('error');
        setErrorMsg(e instanceof Error ? e.message : t('failed_to_join'));
      }
    };

    processInvite();
  }, [isLoaded, isSignedIn, token, getToken, navigate]);

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-monday-dark-bg">
        <p className="dark:text-monday-dark-text">{t('please_sign_in_accept')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-monday-dark-bg p-4">
      <div className="bg-white dark:bg-monday-dark-surface p-8 rounded-xl shadow-lg max-w-md w-full text-center">
        {status === 'processing' && (
          <div className="flex flex-col items-center">
            <Loader className="animate-spin text-blue-600 mb-4" size={48} />
            <h2 className="text-xl font-bold mb-2 dark:text-monday-dark-text">{t('joining_team')}</h2>
            <p className="text-gray-500 dark:text-monday-dark-text-secondary">{t('verifying_token')}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4 text-green-600 dark:text-green-400">
              <CheckCircle size={32} />
            </div>
            <h2 className="text-xl font-bold mb-2 dark:text-monday-dark-text">{t('welcome_to_team')}</h2>
            <p className="text-gray-500 dark:text-monday-dark-text-secondary mb-4">{t('successfully_joined')}</p>
            <p className="text-sm text-gray-400 dark:text-monday-dark-text-secondary">{t('redirecting_dashboard')}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4 text-red-600 dark:text-red-400">
              <AlertTriangle size={32} />
            </div>
            <h2 className="text-xl font-bold mb-2 text-red-700 dark:text-red-400">{t('invitation_failed')}</h2>
            <p className="text-gray-600 dark:text-monday-dark-text-secondary mb-6">{errorMsg}</p>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-gray-200 dark:bg-monday-dark-hover rounded-lg hover:bg-gray-300 dark:hover:bg-monday-dark-border transition dark:text-monday-dark-text"
            >
              {t('go_to_dashboard')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
