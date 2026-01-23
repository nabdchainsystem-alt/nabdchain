import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PaperPlaneRight, User, CircleNotch, ChatCircle, Phone, VideoCamera, Microphone, UsersThree, DotsThreeVertical } from 'phosphor-react';
import { useAppContext } from '../../contexts/AppContext';
import { useAuth, useUser } from '../../auth-adapter';
import { talkService, Conversation, Message } from '../../services/talkService';
import { teamService, TeamMember } from '../../services/teamService';
import ConversationSidebar from './components/ConversationSidebar';

interface TalkPageProps {
    onNavigate?: (view: string, boardId?: string) => void;
}

const TalkPage: React.FC<TalkPageProps> = ({ onNavigate }) => {
    const { t, language } = useAppContext();
    const { getToken } = useAuth();
    const { user } = useUser();

    // State
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [showNewConversationModal, setShowNewConversationModal] = useState(false);
    const [newConvStep, setNewConvStep] = useState(1); // 1: Select Type, 2: Action
    const [newConvType, setNewConvType] = useState<'dm' | 'channel' | null>(null);
    const [newChannelName, setNewChannelName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

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
        setIsCreating(true);
        try {
            const token = await getToken();
            if (!token) return;

            const conv = await talkService.getOrCreateDM(token, memberId);
            await loadConversations();
            setSelectedConversation(conv);
            setShowNewConversationModal(false);
            setNewConvStep(1);
            setNewConvType(null);
        } catch (error) {
            console.error('Failed to create DM:', error);
        } finally {
            setIsCreating(false);
        }
    };

    // Create new channel
    const handleCreateChannel = async () => {
        if (!newChannelName.trim()) return;
        setIsCreating(true);
        try {
            const token = await getToken();
            if (!token) return;

            const conv = await talkService.createChannel(token, newChannelName.trim());
            await loadConversations();
            setSelectedConversation(conv);
            setShowNewConversationModal(false);
            setNewConvStep(1);
            setNewConvType(null);
            setNewChannelName('');
        } catch (error) {
            console.error('Failed to create channel:', error);
        } finally {
            setIsCreating(false);
        }
    };

    const handleOpenNewConversationModal = () => {
        setNewConvStep(1);
        setNewConvType(null);
        setNewChannelName('');
        setShowNewConversationModal(true);
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
        <div className="flex flex-col h-full bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark font-sans overflow-hidden" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            {/* Header */}
            <header className="h-16 border-b border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark flex items-center justify-between px-6 shrink-0 z-10">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold flex items-center">
                        {selectedConversation ? (
                            <>
                                {selectedConversation.type === 'channel' ? (
                                    <span className="text-text-secondary-light dark:text-text-secondary-dark me-2">#</span>
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center me-2">
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
                            t('talk')
                        )}
                    </h1>
                    {selectedConversation?.type === 'dm' && selectedConversation.participants[0] && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isUserOnline(selectedConversation.participants[0].lastActiveAt)
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                            }`}>
                            {isUserOnline(selectedConversation.participants[0].lastActiveAt) ? t('online') : t('offline')}
                        </span>
                    )}
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden">
                {/* Sidebar - Conversations */}
                <div className="w-64 border-e border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark flex flex-col shrink-0">
                    <div className="p-4 flex items-center justify-between">
                        <h2 className="text-lg font-bold">{t('talk')}</h2>
                        <button
                            onClick={handleOpenNewConversationModal}
                            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                            title={t('new_message')}
                        >
                            <span className="material-icons">add_comment</span>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        <div className="px-2 py-2">
                            {/* Talk Groups (Channels) */}
                            <div className="px-2 mb-2 text-start">
                                <span className="text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                                    {language === 'ar' ? 'مجموعات المحادثة' : 'Talk Groups'}
                                </span>
                            </div>
                            <div className="space-y-0.5 mb-4">
                                {conversations.filter(c => c.type === 'channel').length === 0 ? (
                                    <p className="px-2 py-2 text-xs text-text-secondary-light dark:text-text-secondary-dark text-center">
                                        {t('no_conversations')}
                                    </p>
                                ) : (
                                    conversations.filter(c => c.type === 'channel').map((conv) => {
                                        const isActive = selectedConversation?.id === conv.id;

                                        return (
                                            <button
                                                key={conv.id}
                                                onClick={() => setSelectedConversation(conv)}
                                                className={`w-full flex items-center px-2 py-2 rounded-lg text-sm transition-colors ${isActive
                                                    ? 'bg-primary/10 text-primary font-semibold'
                                                    : 'text-text-secondary-light dark:text-text-secondary-dark hover:bg-gray-100 dark:hover:bg-gray-800'
                                                    }`}
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center me-3 shrink-0">
                                                    <UsersThree size={16} className="text-primary" weight="bold" />
                                                </div>
                                                <div className="flex-1 min-w-0 text-start">
                                                    <div className="truncate font-medium">{conv.name}</div>
                                                </div>
                                                {conv.unreadCount > 0 && (
                                                    <span className="bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full ms-2">
                                                        {conv.unreadCount}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })
                                )}
                            </div>

                            {/* Private Talk (DMs) */}
                            <div className="px-2 mb-2 text-start">
                                <span className="text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                                    {language === 'ar' ? 'محادثات خاصة' : 'Private Talk'}
                                </span>
                            </div>
                            <div className="space-y-0.5">
                                {conversations.filter(c => c.type === 'dm').length === 0 ? (
                                    <p className="px-2 py-2 text-xs text-text-secondary-light dark:text-text-secondary-dark text-center">
                                        {t('no_conversations')}
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
                                                className={`w-full flex items-center px-2 py-2 rounded-lg text-sm transition-colors ${isActive
                                                    ? 'bg-primary/10 text-primary font-semibold'
                                                    : 'text-text-secondary-light dark:text-text-secondary-dark hover:bg-gray-100 dark:hover:bg-gray-800'
                                                    }`}
                                            >
                                                <div className="relative me-3">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                                        {other?.avatarUrl ? (
                                                            <img src={other.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                                                        ) : (
                                                            <User size={14} className="text-white" weight="fill" />
                                                        )}
                                                    </div>
                                                    <div className={`absolute bottom-0 right-0 rtl:right-auto rtl:left-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-gray-800 ${isOnline ? 'bg-green-500' : 'bg-gray-400'
                                                        }`} />
                                                </div>
                                                <div className="flex-1 min-w-0 text-start">
                                                    <div className="truncate font-medium">
                                                        {other?.name || other?.email?.split('@')[0] || 'Unknown'}
                                                    </div>
                                                </div>
                                                {conv.unreadCount > 0 && (
                                                    <span className="bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full ms-2">
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
                            onClick={handleOpenNewConversationModal}
                            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <span className="text-lg">+</span>
                            {t('new_message')}
                        </button>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 flex flex-col min-w-0 bg-background-light dark:bg-background-dark relative">
                    {!selectedConversation ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-5">
                            <div className="w-16 h-16 border-2 border-gray-200 dark:border-gray-700 rounded-full flex items-center justify-center">
                                <ChatCircle size={32} className="text-gray-400" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                    {t('select_conversation')}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                                    {t('select_or_start_conversation')}
                                </p>
                            </div>
                            <button
                                onClick={handleOpenNewConversationModal}
                                className="px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                            >
                                {t('start_new_conversation')}
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Call/Video/Toolbar */}
                            <div className="px-4 py-3 border-b border-border-light dark:border-border-dark flex items-center justify-end gap-1">
                                <button
                                    className="p-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                    title="Voice Call"
                                >
                                    <Phone size={20} />
                                </button>
                                <button
                                    className="p-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                    title="Video Call"
                                >
                                    <VideoCamera size={20} />
                                </button>
                                <button
                                    className="p-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                    title="Voice Message"
                                >
                                    <Microphone size={20} />
                                </button>
                                <button
                                    className="p-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                    title="Start Meeting"
                                >
                                    <UsersThree size={20} />
                                </button>
                                <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />
                                <button
                                    className="p-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                    title="More Options"
                                >
                                    <DotsThreeVertical size={20} />
                                </button>
                            </div>

                            {/* Messages List */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 talk-custom-scrollbar">
                                {messages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center">
                                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                                            <span className="material-icons text-3xl text-gray-400">waving_hand</span>
                                        </div>
                                        <h3 className="text-lg font-semibold">{t('no_messages_yet')}</h3>
                                        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                                            {t('send_first_message')}
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
                                                        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${isOwnMessage ? 'ms-3' : 'me-3'
                                                            } bg-gradient-to-br from-blue-500 to-indigo-600`}>
                                                            {msg.sender.avatarUrl ? (
                                                                <img src={msg.sender.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                                                            ) : (
                                                                <User size={14} className="text-white" weight="fill" />
                                                            )}
                                                        </div>
                                                        <div className={`max-w-[70%] ${isOwnMessage ? 'text-start' : 'text-start'}`}>
                                                            <div className={`flex items-center gap-2 mb-1 ${isOwnMessage ? 'flex-row-reverse text-start' : 'text-start'}`}>
                                                                <span className="font-semibold text-sm">
                                                                    {msg.sender.name || msg.sender.email.split('@')[0]}
                                                                </span>
                                                                <span className="text-xs text-gray-500">
                                                                    {formatTime(msg.createdAt)}
                                                                </span>
                                                            </div>
                                                            <div className={`inline-block px-4 py-2 rounded-2xl ${isOwnMessage
                                                                ? 'bg-primary text-white rounded-te-none rtl:rounded-te-2xl rtl:rounded-ts-none'
                                                                : 'bg-gray-100 dark:bg-gray-800 rounded-ts-none rtl:rounded-ts-2xl rtl:rounded-te-none'
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
                                        placeholder={`${t('message')} ${getConversationName(selectedConversation)}...`}
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

                {/* Right Sidebar - Conversation specific */}
                <ConversationSidebar
                    conversationId={selectedConversation?.id || null}
                    onNavigate={onNavigate}
                />
            </main>

            {/* New Conversation Modal */}
            {showNewConversationModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                    <div className="absolute inset-0" onClick={() => setShowNewConversationModal(false)} />
                    <div className="bg-white dark:bg-monday-dark-surface p-6 rounded-xl shadow-2xl max-w-md w-full m-4 border border-gray-200 dark:border-monday-dark-border relative z-10 transition-all">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">
                                {newConvStep === 1
                                    ? (language === 'ar' ? 'بدء محادثة جديدة' : 'Start New Conversation')
                                    : (newConvType === 'dm'
                                        ? (language === 'ar' ? 'محادثة خاصة' : 'Private Talk')
                                        : (language === 'ar' ? 'مجموعة محادثة' : 'Talk Group'))
                                }
                            </h3>
                            <button
                                onClick={() => setShowNewConversationModal(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                <span className="material-icons">close</span>
                            </button>
                        </div>

                        {newConvStep === 1 ? (
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => {
                                        setNewConvType('dm');
                                        setNewConvStep(2);
                                    }}
                                    className="flex flex-col items-center gap-4 p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-center group"
                                >
                                    <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <User size={32} className="text-blue-600 dark:text-blue-400" weight="fill" />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="font-bold text-gray-900 dark:text-gray-100">
                                            {language === 'ar' ? 'محادثة خاصة' : 'Private Talk'}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {language === 'ar' ? 'تحدث مع أحد أعضاء الفريق' : 'Chat with a team member'}
                                        </div>
                                    </div>
                                </button>

                                <button
                                    onClick={() => {
                                        setNewConvType('channel');
                                        setNewConvStep(2);
                                    }}
                                    className="flex flex-col items-center gap-4 p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-center group"
                                >
                                    <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <UsersThree size={32} className="text-purple-600 dark:text-purple-400" weight="fill" />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="font-bold text-gray-900 dark:text-gray-100">
                                            {language === 'ar' ? 'مجموعة محادثة' : 'Talk Group'}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {language === 'ar' ? 'دردشة جماعية للمشاريع' : 'Group chat for projects'}
                                        </div>
                                    </div>
                                </button>
                            </div>
                        ) : newConvType === 'dm' ? (
                            <>
                                <p className="text-sm text-gray-500 mb-4 text-start">
                                    {language === 'ar' ? 'اختر عضواً لبدء محادثة' : 'Select a team member to start a conversation'}
                                </p>
                                <div className="max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                                    {teamMembers.length === 0 ? (
                                        <p className="text-center text-gray-500 py-4">
                                            {language === 'ar' ? 'لا يوجد أعضاء بعد.' : 'No team members yet.'}
                                        </p>
                                    ) : (
                                        teamMembers.map((member) => (
                                            <button
                                                key={member.id}
                                                disabled={isCreating}
                                                onClick={() => handleStartDM(member.id)}
                                                className="w-full flex items-center p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors mb-1"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center me-3 shrink-0">
                                                    {member.avatarUrl ? (
                                                        <img src={member.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                                                    ) : (
                                                        <User size={18} className="text-white" weight="fill" />
                                                    )}
                                                </div>
                                                <div className="text-start min-w-0 flex-1">
                                                    <div className="font-medium truncate">{member.name || member.email.split('@')[0]}</div>
                                                    <div className="text-xs text-gray-500 truncate">{member.email}</div>
                                                </div>
                                                {isCreating && <CircleNotch size={14} className="animate-spin text-primary ms-2" />}
                                            </button>
                                        ))
                                    )}
                                </div>
                                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                                    <button
                                        onClick={() => setNewConvStep(1)}
                                        className="w-full py-2.5 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-sm font-medium"
                                    >
                                        {language === 'ar' ? 'رجوع' : 'Back'}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block text-start">
                                        {language === 'ar' ? 'اسم المجموعة' : 'Group Name'}
                                    </label>
                                    <input
                                        type="text"
                                        value={newChannelName}
                                        onChange={(e) => setNewChannelName(e.target.value)}
                                        placeholder={language === 'ar' ? 'أدخل اسم المجموعة...' : 'Enter group name...'}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                        autoFocus
                                        onKeyDown={(e) => e.key === 'Enter' && handleCreateChannel()}
                                    />
                                </div>
                                <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                                    <button
                                        onClick={() => setNewConvStep(1)}
                                        className="flex-1 py-2.5 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-sm font-medium"
                                    >
                                        {language === 'ar' ? 'رجوع' : 'Back'}
                                    </button>
                                    <button
                                        disabled={!newChannelName.trim() || isCreating}
                                        onClick={handleCreateChannel}
                                        className="flex-1 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 transition-colors text-sm font-bold flex items-center justify-center gap-2"
                                    >
                                        {isCreating ? <CircleNotch size={16} className="animate-spin" /> : (language === 'ar' ? 'إنشاء' : 'Create')}
                                    </button>
                                </div>
                            </div>
                        )}
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
