import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, EnvelopeSimple, Link as LinkIcon, Check, Copy, PaperPlaneTilt } from 'phosphor-react';
import { useAppContext } from '../../../contexts/AppContext';
import { useAuth } from '../../../auth-adapter';
import { inviteService } from '../../../services/inviteService';
import { appLogger } from '../../../utils/logger';

interface InviteMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
    isOpen,
    onClose
}) => {
    const { t, language } = useAppContext();
    const { getToken } = useAuth();
    const isRTL = language === 'ar';

    const [email, setEmail] = useState('');
    const [inviteLink, setInviteLink] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    const [inviteSent, setInviteSent] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setEmail('');
            setInviteLink('');
            setError('');
            setCopied(false);
            setInviteSent(false);
        }
    }, [isOpen]);

    const validateEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleSendInvite = async () => {
        if (!email.trim()) {
            setError(t('please_enter_email') || 'Please enter an email address');
            return;
        }

        if (!validateEmail(email)) {
            setError(t('invalid_email') || 'Please enter a valid email address');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const token = await getToken();
            if (!token) {
                setError(t('auth_error') || 'Authentication error. Please try again.');
                return;
            }

            const result = await inviteService.createInvite(token, email);
            setInviteLink(result.link);
            setInviteSent(true);
        } catch (err) {
            setError(t('invite_failed') || 'Failed to send invitation. Please try again.');
            appLogger.error('Invite error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(inviteLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            appLogger.error('Copy failed:', err);
        }
    };

    const handleSendAnother = () => {
        setEmail('');
        setInviteLink('');
        setInviteSent(false);
        setCopied(false);
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="bg-white w-full max-w-md mx-4 rounded-2xl shadow-2xl overflow-hidden"
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <UserPlus size={24} weight="duotone" className="text-blue-600" />
                                    {t('invite_member') || 'Invite Member'}
                                </h2>
                                <p className="text-xs text-gray-500 mt-1">
                                    {t('invite_member_desc') || 'Send an invitation to join your workspace'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600 rounded-full p-2 hover:bg-gray-100 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6">
                            {!inviteSent ? (
                                <div className="space-y-4">
                                    {/* Email Input */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                                            <EnvelopeSimple size={16} className="text-gray-400" />
                                            {t('email_address') || 'Email Address'}
                                        </label>
                                        <input
                                            autoFocus
                                            type="email"
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-sm text-gray-900 placeholder-gray-400"
                                            placeholder={t('enter_email_placeholder') || 'colleague@company.com'}
                                            value={email}
                                            onChange={e => {
                                                setEmail(e.target.value);
                                                setError('');
                                            }}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleSendInvite();
                                                }
                                            }}
                                        />
                                        {error && (
                                            <p className="text-red-500 text-xs mt-1.5">{error}</p>
                                        )}
                                    </div>

                                    {/* Send Button */}
                                    <button
                                        onClick={handleSendInvite}
                                        disabled={isLoading}
                                        className="w-full flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                                    >
                                        {isLoading ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                <span>{t('sending') || 'Sending...'}</span>
                                            </>
                                        ) : (
                                            <>
                                                <PaperPlaneTilt size={18} weight="bold" />
                                                <span>{t('send_invitation') || 'Send Invitation'}</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Success Message */}
                                    <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-100">
                                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                            <Check size={20} weight="bold" className="text-green-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-green-800">
                                                {t('invitation_created') || 'Invitation Created!'}
                                            </p>
                                            <p className="text-xs text-green-600 mt-0.5">
                                                {t('invitation_sent_to') || 'Invitation link generated for'} {email}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Invite Link */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                                            <LinkIcon size={16} className="text-gray-400" />
                                            {t('invite_link') || 'Invite Link'}
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                readOnly
                                                value={inviteLink}
                                                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 truncate"
                                            />
                                            <button
                                                onClick={handleCopyLink}
                                                className={`px-4 py-3 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${
                                                    copied
                                                        ? 'bg-green-100 text-green-700 border border-green-200'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                                                }`}
                                            >
                                                {copied ? (
                                                    <>
                                                        <Check size={16} weight="bold" />
                                                        <span>{t('copied') || 'Copied!'}</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy size={16} />
                                                        <span>{t('copy') || 'Copy'}</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2">
                                            {t('link_expires') || 'This link expires in 7 days'}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-3 pt-2">
                                        <button
                                            onClick={handleSendAnother}
                                            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200"
                                        >
                                            {t('invite_another') || 'Invite Another'}
                                        </button>
                                        <button
                                            onClick={onClose}
                                            className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors"
                                        >
                                            {t('done') || 'Done'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};
