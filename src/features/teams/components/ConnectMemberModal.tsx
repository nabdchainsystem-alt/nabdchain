import React, { useState } from 'react';
import { X, MagnifyingGlass, UserPlus, CircleNotch, Check, Warning, User } from 'phosphor-react';
import { useAuth } from '../../../auth-adapter';
import { teamService, SearchUserResult } from '../../../services/teamService';
import { useAppContext } from '../../../contexts/AppContext';

interface ConnectMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const ConnectMemberModal: React.FC<ConnectMemberModalProps> = ({
    isOpen,
    onClose,
    onSuccess
}) => {
    const { t } = useAppContext();
    const { getToken } = useAuth();

    const [email, setEmail] = useState('');
    const [searchResult, setSearchResult] = useState<SearchUserResult | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSearch = async () => {
        if (!email.trim()) return;

        setIsSearching(true);
        setError('');
        setSearchResult(null);
        setSuccess('');

        try {
            const token = await getToken();
            if (!token) return;

            const result = await teamService.searchUser(token, email.trim());
            setSearchResult(result);
        } catch (err: any) {
            setError(err.message || 'User not found');
        } finally {
            setIsSearching(false);
        }
    };

    const handleSendRequest = async () => {
        if (!searchResult) return;

        setIsSending(true);
        setError('');

        try {
            const token = await getToken();
            if (!token) return;

            await teamService.sendConnectionRequest(token, searchResult.user.email);
            setSuccess('Connection request sent!');
            setSearchResult(null);
            setEmail('');

            // Notify parent to refresh
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 1500);
        } catch (err: any) {
            setError(err.message || 'Failed to send request');
        } finally {
            setIsSending(false);
        }
    };

    const resetModal = () => {
        setEmail('');
        setSearchResult(null);
        setError('');
        setSuccess('');
    };

    const handleClose = () => {
        resetModal();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 animate-fade-in">
            <div className="bg-white dark:bg-monday-dark-surface p-6 rounded-xl shadow-2xl max-w-md w-full border border-gray-100 dark:border-monday-dark-border m-4">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {t('connect_with_member') || 'Connect with Team Member'}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {t('search_by_email_connect') || 'Search by email to send a connection request'}
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Search Input */}
                <div className="relative mb-4">
                    <MagnifyingGlass
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        size={18}
                    />
                    <input
                        type="text"
                        placeholder={t('enter_email_to_search') || 'Enter email address...'}
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            setError('');
                            setSearchResult(null);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSearch();
                        }}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-monday-dark-bg border border-gray-200 dark:border-monday-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                    <button
                        onClick={handleSearch}
                        disabled={isSearching || !email.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-monday-blue text-white text-sm rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isSearching ? (
                            <CircleNotch size={16} className="animate-spin" />
                        ) : (
                            t('search') || 'Search'
                        )}
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-4">
                        <Warning size={18} className="text-red-500" />
                        <span className="text-sm text-red-700 dark:text-red-400">{error}</span>
                    </div>
                )}

                {/* Success Message */}
                {success && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg mb-4">
                        <Check size={18} className="text-green-500" />
                        <span className="text-sm text-green-700 dark:text-green-400">{success}</span>
                    </div>
                )}

                {/* Search Result */}
                {searchResult && (
                    <div className="border border-gray-200 dark:border-monday-dark-border rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-4">
                            {/* Avatar */}
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-lg">
                                {searchResult.user.avatarUrl ? (
                                    <img
                                        src={searchResult.user.avatarUrl}
                                        alt={searchResult.user.name || searchResult.user.email}
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                ) : (
                                    <User size={24} weight="fill" />
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                                    {searchResult.user.name || 'No name'}
                                </h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                    {searchResult.user.email}
                                </p>
                            </div>

                            {/* Status/Action */}
                            <div>
                                {searchResult.connectionStatus === 'ACCEPTED' ? (
                                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full">
                                        <Check size={14} />
                                        {t('connected') || 'Connected'}
                                    </span>
                                ) : searchResult.connectionStatus === 'PENDING' ? (
                                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-semibold rounded-full">
                                        {t('pending') || 'Pending'}
                                    </span>
                                ) : (
                                    <button
                                        onClick={handleSendRequest}
                                        disabled={isSending}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-monday-blue text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                                    >
                                        {isSending ? (
                                            <CircleNotch size={16} className="animate-spin" />
                                        ) : (
                                            <>
                                                <UserPlus size={16} />
                                                {t('connect') || 'Connect'}
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="flex justify-end gap-3 pt-2">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-monday-dark-hover rounded-lg transition-colors"
                    >
                        {t('close') || 'Close'}
                    </button>
                </div>
            </div>
        </div>
    );
};
