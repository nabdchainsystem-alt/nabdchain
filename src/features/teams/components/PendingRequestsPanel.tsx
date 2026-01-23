import React, { useState, useEffect } from 'react';
import { Check, X, User, CircleNotch, Bell, PaperPlaneTilt } from 'phosphor-react';
import { useAuth } from '../../../auth-adapter';
import { teamService, ConnectionRequest } from '../../../services/teamService';
import { useAppContext } from '../../../contexts/AppContext';
import { appLogger } from '../../../utils/logger';

interface PendingRequestsPanelProps {
    onRequestHandled: () => void;
}

export const PendingRequestsPanel: React.FC<PendingRequestsPanelProps> = ({
    onRequestHandled
}) => {
    const { t } = useAppContext();
    const { getToken } = useAuth();

    const [receivedRequests, setReceivedRequests] = useState<ConnectionRequest[]>([]);
    const [sentRequests, setSentRequests] = useState<ConnectionRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');

    const fetchRequests = async () => {
        try {
            const token = await getToken();
            if (!token) return;

            const [received, sent] = await Promise.all([
                teamService.getPendingRequests(token),
                teamService.getSentRequests(token)
            ]);

            setReceivedRequests(received);
            setSentRequests(sent);
        } catch (error) {
            appLogger.error('Failed to fetch requests:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleRespond = async (connectionId: string, action: 'accept' | 'reject') => {
        setProcessingId(connectionId);
        try {
            const token = await getToken();
            if (!token) return;

            await teamService.respondToRequest(token, connectionId, action);

            // Remove from list
            setReceivedRequests(prev => prev.filter(r => r.id !== connectionId));
            onRequestHandled();
        } catch (error) {
            appLogger.error('Failed to respond:', error);
        } finally {
            setProcessingId(null);
        }
    };

    const totalPending = receivedRequests.length + sentRequests.length;

    if (isLoading) {
        return (
            <div className="bg-white dark:bg-monday-dark-surface rounded-xl border border-gray-100 dark:border-monday-dark-border p-6">
                <div className="flex items-center justify-center py-8">
                    <CircleNotch size={24} className="animate-spin text-monday-blue" />
                </div>
            </div>
        );
    }

    if (totalPending === 0) {
        return null;
    }

    return (
        <div className="bg-white dark:bg-monday-dark-surface rounded-xl border border-gray-100 dark:border-monday-dark-border shadow-sm overflow-hidden">
            {/* Header with Tabs */}
            <div className="border-b border-gray-100 dark:border-monday-dark-border">
                <div className="flex items-center px-4">
                    <button
                        onClick={() => setActiveTab('received')}
                        className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                            activeTab === 'received'
                                ? 'border-monday-blue text-monday-blue'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <Bell size={18} />
                        <span className="font-medium text-sm">
                            {t('received') || 'Received'}
                        </span>
                        {receivedRequests.length > 0 && (
                            <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold rounded-full">
                                {receivedRequests.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('sent')}
                        className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                            activeTab === 'sent'
                                ? 'border-monday-blue text-monday-blue'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <PaperPlaneTilt size={18} />
                        <span className="font-medium text-sm">
                            {t('sent') || 'Sent'}
                        </span>
                        {sentRequests.length > 0 && (
                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-bold rounded-full">
                                {sentRequests.length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="divide-y divide-gray-100 dark:divide-monday-dark-border">
                {activeTab === 'received' ? (
                    receivedRequests.length === 0 ? (
                        <div className="p-6 text-center text-gray-500 dark:text-gray-400 text-sm">
                            {t('no_pending_requests') || 'No pending requests'}
                        </div>
                    ) : (
                        receivedRequests.map((request) => (
                            <div
                                key={request.id}
                                className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-monday-dark-hover transition-colors"
                            >
                                {/* Avatar */}
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 text-white flex items-center justify-center font-bold">
                                    {request.sender?.avatarUrl ? (
                                        <img
                                            src={request.sender.avatarUrl}
                                            alt={request.sender.name || ''}
                                            className="w-full h-full rounded-full object-cover"
                                        />
                                    ) : (
                                        <User size={20} weight="fill" />
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-gray-900 dark:text-white truncate text-sm">
                                        {request.sender?.name || 'Unknown'}
                                    </h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                        {request.sender?.email}
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleRespond(request.id, 'accept')}
                                        disabled={processingId === request.id}
                                        className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 disabled:opacity-50 transition-colors"
                                        title={t('accept') || 'Accept'}
                                    >
                                        {processingId === request.id ? (
                                            <CircleNotch size={18} className="animate-spin" />
                                        ) : (
                                            <Check size={18} weight="bold" />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => handleRespond(request.id, 'reject')}
                                        disabled={processingId === request.id}
                                        className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50 transition-colors"
                                        title={t('reject') || 'Reject'}
                                    >
                                        <X size={18} weight="bold" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )
                ) : (
                    sentRequests.length === 0 ? (
                        <div className="p-6 text-center text-gray-500 dark:text-gray-400 text-sm">
                            {t('no_sent_requests') || 'No pending sent requests'}
                        </div>
                    ) : (
                        sentRequests.map((request) => (
                            <div
                                key={request.id}
                                className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-monday-dark-hover transition-colors"
                            >
                                {/* Avatar */}
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold">
                                    {request.receiver?.avatarUrl ? (
                                        <img
                                            src={request.receiver.avatarUrl}
                                            alt={request.receiver.name || ''}
                                            className="w-full h-full rounded-full object-cover"
                                        />
                                    ) : (
                                        <User size={20} weight="fill" />
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-gray-900 dark:text-white truncate text-sm">
                                        {request.receiver?.name || 'Unknown'}
                                    </h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                        {request.receiver?.email}
                                    </p>
                                </div>

                                {/* Status */}
                                <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-semibold rounded-full">
                                    {t('awaiting_response') || 'Awaiting response'}
                                </span>
                            </div>
                        ))
                    )
                )}
            </div>
        </div>
    );
};
