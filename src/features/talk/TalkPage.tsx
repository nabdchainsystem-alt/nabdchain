import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PaperPlaneRight, User, CircleNotch } from 'phosphor-react';
import { useAppContext } from '../../contexts/AppContext';
import { useAuth } from '../../auth-adapter';
import { talkService, Conversation, Message } from '../../services/talkService';
import { teamService, TeamMember } from '../../services/teamService';
import ProductivitySidebar from '../../components/common/ProductivitySidebar';

interface TalkPageProps {
    onNavigate?: (view: string, boardId?: string) => void;
}

const TalkPage: React.FC<TalkPageProps> = ({ onNavigate }) => {
    const { t } = useAppContext();
    const { getToken, user } = useAuth();

    // State
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [showNewDmModal, setShowNewDmModal] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const pollIntervalRef = useRef<number | null>(null);

    // Scroll to bottom of messages
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Load conversations
    const loadConversations = useCallback(async () => {
        try {
            const token = await getToken();
            if (!token) return;

            const convs = await talkService.getConversations(token);
            setConversations(convs);
        } catch (error) {
            console.error('Failed to load conversations:', error);
        }
    }, [getToken]);

    // Load messages for selected conversation
    const loadMessages = useCallback(async () => {
        if (!selectedConversation) return;

        try {
            const token = await getToken();
            if (!token) return;

            const msgs = await talkService.getMessages(token, selectedConversation.id);
            setMessages(msgs);
        } catch (error) {
            console.error('Failed to load messages:', error);
        }
    }, [getToken, selectedConversation]);

    // Load team members for new DM
    const loadTeamMembers = useCallback(async () => {
        try {
            const token = await getToken();
            if (!token) return;

            const members = await teamService.getTeamMembers(token);
            setTeamMembers(members);
        } catch (error) {
            console.error('Failed to load team members:', error);
        }
    }, [getToken]);

    // Initial load
    useEffect(() => {
        const init = async () => {
            setIsLoading(true);
            await loadConversations();
            await loadTeamMembers();
            setIsLoading(false);
        };
        init();
    }, [loadConversations, loadTeamMembers]);

    // Load messages when conversation selected
    useEffect(() => {
        if (selectedConversation) {
            loadMessages();
        }
    }, [selectedConversation, loadMessages]);

    // Poll for new messages every 3 seconds
    useEffect(() => {
        if (selectedConversation) {
            pollIntervalRef.current = window.setInterval(() => {
                loadMessages();
                loadConversations(); // Also refresh conversation list for unread counts
            }, 3000);
        }

        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
        };
    }, [selectedConversation, loadMessages, loadConversations]);

    // Scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Send message
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversation || isSending) return;

        setIsSending(true);
        try {
            const token = await getToken();
            if (!token) return;

            const message = await talkService.sendMessage(token, selectedConversation.id, newMessage.trim());
            setMessages(prev => [...prev, message]);
            setNewMessage('');
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setIsSending(false);
        }
    };

    // Start new DM
    const handleStartDM = async (memberId: string) => {
        try {
            const token = await getToken();
            if (!token) return;

            const conv = await talkService.getOrCreateDM(token, memberId);
            await loadConversations();
            setSelectedConversation(conv);
            setShowNewDmModal(false);
        } catch (error) {
            console.error('Failed to create DM:', error);
        }
    };

    // Get conversation display name
    const getConversationName = (conv: Conversation) => {
        if (conv.type === 'channel') {
            return conv.name || 'Unnamed Channel';
        }
        // For DM, show other participant's name
        const other = conv.participants[0];
        return other?.name || other?.email?.split('@')[0] || 'Unknown';
    };

    // Check if user is online (active within last 5 minutes)
    const isUserOnline = (lastActiveAt: string | null | undefined): boolean => {
        if (!lastActiveAt) return false;
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
        return new Date(lastActiveAt).getTime() > fiveMinutesAgo;
    };

    // Format timestamp
    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    };

    // Group messages by date
    const groupMessagesByDate = (msgs: Message[]) => {
        const groups: { date: string; messages: Message[] }[] = [];
        let currentDate = '';

        msgs.forEach(msg => {
            const msgDate = new Date(msg.createdAt).toDateString();
            if (msgDate !== currentDate) {
                currentDate = msgDate;
                groups.push({ date: msg.createdAt, messages: [msg] });
            } else {
                groups[groups.length - 1].messages.push(msg);
            }
        });

        return groups;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full bg-background-light dark:bg-background-dark">
                <CircleNotch size={32} className="animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark font-sans overflow-hidden">
            {/* Header */}
            <header className="h-16 border-b border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark flex items-center justify-between px-6 shrink-0 z-10">
                <div className="flex items-center space-x-4">
                    <h1 className="text-xl font-bold flex items-center">
                        {selectedConversation ? (
                            <>
                                {selectedConversation.type === 'channel' ? (
                                    <span className="text-text-secondary-light dark:text-text-secondary-dark mr-2">#</span>
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mr-2">
                                        {selectedConversation.participants[0]?.avatarUrl ? (
                                            <img
                                                src={selectedConversation.participants[0].avatarUrl}
                                                alt=""
                                                className="w-full h-full rounded-full object-cover"
                                            />
                                        ) : (
                                            <User size={16} className="text-white" weight="fill" />
                                        )}
                                    </div>
                                )}
                                {getConversationName(selectedConversation)}
                            </>
                        ) : (
                            t('talk') || 'Talk'
                        )}
                    </h1>
                    {selectedConversation?.type === 'dm' && selectedConversation.participants[0] && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            isUserOnline(selectedConversation.participants[0].lastActiveAt)
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        }`}>
                            {isUserOnline(selectedConversation.participants[0].lastActiveAt) ? 'Online' : 'Offline'}
                        </span>
                    )}
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden">
                {/* Sidebar - Conversations */}
                <div className="w-64 border-r border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark flex flex-col shrink-0">
                    <div className="p-4 flex items-center justify-between">
                        <h2 className="text-lg font-bold">{t('talk') || 'Talk'}</h2>
                        <button
                            onClick={() => setShowNewDmModal(true)}
                            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-primary transition-colors"
                            title={t('new_message') || 'New Message'}
                        >
                            <span className="material-icons">add_comment</span>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        <div className="px-2 py-2">
                            {/* Direct Messages */}
                            <div className="px-2 mb-2">
                                <span className="text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                                    {t('direct_messages') || 'Direct Messages'}
                                </span>
                            </div>
                            <div className="space-y-0.5">
                                {conversations.filter(c => c.type === 'dm').length === 0 ? (
                                    <p className="px-2 py-4 text-sm text-text-secondary-light dark:text-text-secondary-dark text-center">
                                        {t('no_conversations') || 'No conversations yet'}
                                    </p>
                                ) : (
                                    conversations.filter(c => c.type === 'dm').map((conv) => {
                                        const other = conv.participants[0];
                                        const isActive = selectedConversation?.id === conv.id;
                                        const isOnline = isUserOnline(other?.lastActiveAt);

                                        return (
                                            <button
                                                key={conv.id}
                                                onClick={() => setSelectedConversation(conv)}
                                                className={`w-full flex items-center px-2 py-2 rounded-lg text-sm transition-colors ${
                                                    isActive
                                                        ? 'bg-primary/10 text-primary font-semibold'
                                                        : 'text-text-secondary-light dark:text-text-secondary-dark hover:bg-gray-100 dark:hover:bg-gray-800'
                                                }`}
                                            >
                                                <div className="relative mr-3">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                                        {other?.avatarUrl ? (
                                                            <img src={other.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                                                        ) : (
                                                            <User size={14} className="text-white" weight="fill" />
                                                        )}
                                                    </div>
                                                    <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-gray-800 ${
                                                        isOnline ? 'bg-green-500' : 'bg-gray-400'
                                                    }`} />
                                                </div>
                                                <div className="flex-1 min-w-0 text-left">
                                                    <div className="truncate font-medium">
                                                        {other?.name || other?.email?.split('@')[0] || 'Unknown'}
                                                    </div>
                                                    {conv.lastMessage && (
                                                        <div className="truncate text-xs text-gray-500">
                                                            {conv.lastMessage.content}
                                                        </div>
                                                    )}
                                                </div>
                                                {conv.unreadCount > 0 && (
                                                    <span className="bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full ml-2">
                                                        {conv.unreadCount}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border-t border-border-light dark:border-border-dark">
                        <button
                            onClick={() => setShowNewDmModal(true)}
                            className="w-full flex items-center justify-center p-2 rounded-lg bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 transition-colors"
                        >
                            <span className="material-icons text-sm mr-2">add</span>
                            {t('new_message') || 'New Message'}
                        </button>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 flex flex-col min-w-0 bg-background-light dark:bg-background-dark relative">
                    {!selectedConversation ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-text-secondary-light dark:text-text-secondary-dark">
                                <span className="material-icons text-3xl">chat_bubble_outline</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold">{t('select_conversation') || 'Select a conversation'}</h3>
                                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                                    {t('select_or_start_conversation') || 'Choose a conversation from the sidebar or start a new one'}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowNewDmModal(true)}
                                className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                            >
                                {t('start_new_conversation') || 'Start New Conversation'}
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Messages List */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 talk-custom-scrollbar">
                                {messages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center">
                                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                                            <span className="material-icons text-3xl text-gray-400">waving_hand</span>
                                        </div>
                                        <h3 className="text-lg font-semibold">{t('no_messages_yet') || 'No messages yet'}</h3>
                                        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                                            {t('send_first_message') || 'Send the first message to start the conversation'}
                                        </p>
                                    </div>
                                ) : (
                                    groupMessagesByDate(messages).map((group, groupIndex) => (
                                        <div key={groupIndex}>
                                            {/* Date Separator */}
                                            <div className="flex items-center justify-center my-4">
                                                <div className="bg-gray-200 dark:bg-gray-800 px-4 py-1 rounded-full text-xs text-text-secondary-light dark:text-text-secondary-dark font-medium">
                                                    {formatDate(group.date)}
                                                </div>
                                            </div>

                                            {/* Messages */}
                                            {group.messages.map((msg) => {
                                                const isOwnMessage = msg.senderId === user?.id;

                                                return (
                                                    <div
                                                        key={msg.id}
                                                        className={`flex items-start mb-4 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
                                                    >
                                                        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                                                            isOwnMessage ? 'ml-3' : 'mr-3'
                                                        } bg-gradient-to-br from-blue-500 to-indigo-600`}>
                                                            {msg.sender.avatarUrl ? (
                                                                <img src={msg.sender.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                                                            ) : (
                                                                <User size={14} className="text-white" weight="fill" />
                                                            )}
                                                        </div>
                                                        <div className={`max-w-[70%] ${isOwnMessage ? 'text-right' : ''}`}>
                                                            <div className={`flex items-center gap-2 mb-1 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                                                                <span className="font-semibold text-sm">
                                                                    {msg.sender.name || msg.sender.email.split('@')[0]}
                                                                </span>
                                                                <span className="text-xs text-gray-500">
                                                                    {formatTime(msg.createdAt)}
                                                                </span>
                                                            </div>
                                                            <div className={`inline-block px-4 py-2 rounded-2xl ${
                                                                isOwnMessage
                                                                    ? 'bg-primary text-white rounded-tr-sm'
                                                                    : 'bg-gray-100 dark:bg-gray-800 rounded-tl-sm'
                                                            }`}>
                                                                <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <form onSubmit={handleSendMessage} className="p-4 bg-background-light dark:bg-background-dark border-t border-border-light dark:border-border-dark">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder={`${t('message') || 'Message'} ${getConversationName(selectedConversation)}...`}
                                        className="flex-1 px-4 py-3 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim() || isSending}
                                        className="p-3 bg-primary text-white rounded-xl hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {isSending ? (
                                            <CircleNotch size={20} className="animate-spin" />
                                        ) : (
                                            <PaperPlaneRight size={20} weight="fill" />
                                        )}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </div>

                {/* Right Sidebar */}
                <ProductivitySidebar onNavigate={onNavigate} />
            </main>

            {/* New DM Modal */}
            {showNewDmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="bg-white dark:bg-monday-dark-surface p-6 rounded-xl shadow-2xl max-w-md w-full m-4 border border-gray-200 dark:border-monday-dark-border">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">New Message</h3>
                            <button
                                onClick={() => setShowNewDmModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <span className="material-icons">close</span>
                            </button>
                        </div>

                        <p className="text-sm text-gray-500 mb-4">
                            Select a team member to start a conversation
                        </p>

                        <div className="max-h-64 overflow-y-auto">
                            {teamMembers.length === 0 ? (
                                <p className="text-center text-gray-500 py-4">
                                    No team members yet. Connect with team members first.
                                </p>
                            ) : (
                                teamMembers.map((member) => (
                                    <button
                                        key={member.id}
                                        onClick={() => handleStartDM(member.id)}
                                        className="w-full flex items-center p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mr-3">
                                            {member.avatarUrl ? (
                                                <img src={member.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                                            ) : (
                                                <User size={18} className="text-white" weight="fill" />
                                            )}
                                        </div>
                                        <div className="text-left">
                                            <div className="font-medium">{member.name || member.email.split('@')[0]}</div>
                                            <div className="text-sm text-gray-500">{member.email}</div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>

                        <div className="mt-4 pt-4 border-t">
                            <button
                                onClick={() => setShowNewDmModal(false)}
                                className="w-full py-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
