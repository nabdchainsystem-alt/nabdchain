import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  PaperPlaneTilt,
  Sparkle,
  Lightning,
  Brain,
  CircleNotch,
  X,
  ArrowsOutSimple,
  ArrowsInSimple,
  ChartBar,
  Table,
  ListChecks,
  TrendUp,
  Lightbulb,
  Trash,
  Copy,
  Check,
  Warning,
  Database,
  Robot,
  Eye,
  FileText,
  ArrowClockwise,
  Info,
  CaretDown,
  CaretUp,
  ChatCircle,
  ChartLineUp,
  ClockCounterClockwise,
  Plus,
  ChatDots,
} from 'phosphor-react';
import { useAI, ModelTier } from '../contexts/AIContext';
import { useAppContext } from '../contexts/AppContext';
import { getStorageItem, setStorageItem } from '../utils/storage';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  tier?: ModelTier;
  creditsUsed?: number;
  error?: boolean;
  type?: 'text' | 'chart' | 'table' | 'tasks' | 'forecast' | 'tips';
  metadata?: {
    model?: string;
    confidence?: number;
    processingTime?: number;
    escalated?: boolean;
    complexityScore?: number;
    factors?: string[];
  };
  data?: Record<string, unknown>;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

interface AIChatProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
}

const getQuickActions = (t: (key: string) => string, isRTL: boolean) => [
  {
    icon: ChartBar,
    label: t('ai_chart'),
    prompt: isRTL ? 'أنشئ رسم بياني يوضح ' : 'Create a chart showing ',
    promptType: 'chart',
  },
  {
    icon: Table,
    label: t('ai_table'),
    prompt: isRTL ? 'أنشئ جدول يحتوي على ' : 'Generate a table of ',
    promptType: 'table',
  },
  {
    icon: ListChecks,
    label: t('tasks'),
    prompt: isRTL ? 'استخرج المهام من: ' : 'Extract tasks from: ',
    promptType: 'gtd',
  },
  {
    icon: TrendUp,
    label: t('ai_forecast'),
    prompt: isRTL ? 'توقع الاتجاه لـ ' : 'Forecast the trend for ',
    promptType: 'forecast',
  },
  {
    icon: Lightbulb,
    label: t('ai_tips'),
    prompt: isRTL ? 'أعطني نصائح حول ' : 'Give me tips on ',
    promptType: 'tips',
  },
];

const TIER_INFO = {
  cleaner: {
    name: 'Cleaner',
    model: 'Gemini 2.5 Flash',
    description: 'File processing & data cleaning',
    color: 'text-gray-400',
    bgColor: 'bg-gray-400/10',
    icon: Sparkle,
    cost: 1,
  },
  assistant: {
    name: 'Assistant',
    model: 'Gemini 3 Flash',
    description: 'Simple Q&A & quick answers',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    icon: ChatCircle,
    cost: 1,
  },
  worker: {
    name: 'Worker',
    model: 'Gemini 3 Flash',
    description: 'Charts, tables & reports',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    icon: Lightning,
    cost: 1,
  },
  analyst: {
    name: 'Analyst',
    model: 'Gemini 2.5 Flash',
    description: 'Analysis & pattern insights',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    icon: ChartLineUp,
    cost: 3,
  },
  thinker: {
    name: 'Thinker',
    model: 'Gemini 3 Pro',
    description: 'Strategy & complex reasoning',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    icon: Brain,
    cost: 5,
  },
};

// Helper to generate chat title from first message
const generateChatTitle = (content: string, t: (key: string) => string): string => {
  if (!content) return t('new_chat') || 'New Chat';
  const cleaned = content.trim().slice(0, 50);
  return cleaned.length < content.trim().length ? `${cleaned}...` : cleaned;
};

export function AIChat({ isOpen, onClose, initialPrompt }: AIChatProps) {
  const {
    credits,
    creditsLoading,
    refreshCredits,
    deepModeEnabled,
    toggleDeepMode,
    isProcessing,
    currentTier,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    error,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    clearError,
    processPrompt,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    generateChart,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    generateTable,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    generateForecast,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    generateTips,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    extractGTDTasks,
    previewTier,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    analyzeComplexity,
    currentBoardContext,
    currentRoomContext,
    currentPageContext,
  } = useAI();
  const { theme, t, dir } = useAppContext();
  const isRTL = dir === 'rtl';

  // Load all chat sessions from localStorage
  const [chatSessions, setChatSessions] = useState<ChatSession[]>(() => {
    const stored = getStorageItem<
      Array<ChatSession & { createdAt: string; updatedAt: string; messages: Array<Message & { timestamp: string }> }>
    >('ai-chat-sessions', []);
    return stored.map((session) => ({
      ...session,
      createdAt: new Date(session.createdAt),
      updatedAt: new Date(session.updatedAt),
      messages: session.messages.map((msg) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      })),
    }));
  });

  // Current active chat session ID
  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => {
    return getStorageItem<string | null>('ai-active-session-id', null);
  });

  // Show chat history panel
  const [showHistory, setShowHistory] = useState(false);

  // Get current session messages
  const currentSession = chatSessions.find((s) => s.id === activeSessionId);
  const messages = currentSession?.messages || [];

  // Set messages for current session
  const setMessages = useCallback(
    (updater: Message[] | ((prev: Message[]) => Message[])) => {
      setChatSessions((prev) => {
        const newMessages = typeof updater === 'function' ? updater(currentSession?.messages || []) : updater;

        if (!activeSessionId) {
          // Create new session if none active
          const newSession: ChatSession = {
            id: `chat-${Date.now()}`,
            title: t('new_chat') || 'New Chat',
            messages: newMessages,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          setActiveSessionId(newSession.id);
          return [...prev, newSession];
        }

        return prev.map((session) =>
          session.id === activeSessionId
            ? {
                ...session,
                messages: newMessages,
                updatedAt: new Date(),
                // Update title from first user message if still "New Chat"
                title:
                  session.title === (t('new_chat') || 'New Chat') && newMessages.length > 0
                    ? generateChatTitle(newMessages.find((m) => m.role === 'user')?.content || '', t)
                    : session.title,
              }
            : session,
        );
      });
    },
    [activeSessionId, currentSession?.messages, t],
  );

  const [input, setInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [tierPreview, setTierPreview] = useState<{
    tier: ModelTier;
    cost: number;
    model: string;
    complexity?: { score: number; confidence: number; factors: string[] };
  } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showContextInfo, setShowContextInfo] = useState(false);
  const [showTierDetails, setShowTierDetails] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const isDark = theme === 'dark';

  // Get current context summary
  const _contextSummary = useCallback(() => {
    const parts: string[] = [];
    if (currentBoardContext) {
      parts.push(`${t('board_label')}: ${currentBoardContext.name} (${currentBoardContext.taskCount} ${t('tasks')})`);
    }
    if (currentRoomContext) {
      parts.push(`${t('room_label')}: ${currentRoomContext.name} (${currentRoomContext.rowCount} ${t('rows_label')})`);
    }
    return parts.length > 0 ? parts.join(' • ') : t('no_context_loaded');
  }, [currentBoardContext, currentRoomContext, t]);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Save chat sessions to localStorage whenever they change
  useEffect(() => {
    setStorageItem('ai-chat-sessions', chatSessions);
  }, [chatSessions]);

  // Save active session ID to localStorage
  useEffect(() => {
    if (activeSessionId) {
      setStorageItem('ai-active-session-id', activeSessionId);
    }
  }, [activeSessionId]);

  // Create new chat session
  const createNewChat = useCallback(() => {
    const newSession: ChatSession = {
      id: `chat-${Date.now()}`,
      title: t('new_chat') || 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setChatSessions((prev) => [...prev, newSession]);
    setActiveSessionId(newSession.id);
    setShowHistory(false);
  }, [t]);

  // Switch to a different chat session
  const switchToSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
    setShowHistory(false);
  }, []);

  // Delete a chat session
  const deleteSession = useCallback(
    (sessionId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setChatSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (activeSessionId === sessionId) {
        const remaining = chatSessions.filter((s) => s.id !== sessionId);
        setActiveSessionId(remaining.length > 0 ? remaining[0].id : null);
      }
    },
    [activeSessionId, chatSessions],
  );

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Handle initial prompt
  useEffect(() => {
    if (initialPrompt && isOpen) {
      setInput(initialPrompt);
    }
  }, [initialPrompt, isOpen]);

  // Preview tier on input change with debounce
  useEffect(() => {
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
    }

    if (input.trim().length > 10) {
      previewTimeoutRef.current = setTimeout(async () => {
        try {
          const preview = await previewTier(input);
          setTierPreview({
            tier: preview.tier,
            cost: preview.creditCost,
            model: preview.model,
            complexity: preview.complexity,
          });
        } catch (_err) {
          // Ignore errors in preview
        }
      }, 500);
    } else {
      setTierPreview(null);
    }

    return () => {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
    };
  }, [input, previewTier]);

  // Determine prompt type from input
  const detectPromptType = (text: string): string => {
    const lower = text.toLowerCase();
    if (lower.includes('chart') || lower.includes('graph') || lower.includes('visualiz')) return 'chart';
    if (lower.includes('table') || lower.includes('list') || lower.includes('format')) return 'table';
    if (lower.includes('task') || lower.includes('todo') || lower.includes('action item')) return 'gtd';
    if (lower.includes('forecast') || lower.includes('predict') || lower.includes('trend')) return 'forecast';
    if (lower.includes('tip') || lower.includes('suggest') || lower.includes('recommend')) return 'tips';
    return 'general';
  };

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const promptType = detectPromptType(input);

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
      type: 'text',
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setTierPreview(null);

    try {
      const startTime = Date.now();
      // Pass language based on RTL mode: Arabic when RTL, English otherwise
      const language = isRTL ? 'ar' : 'en';
      const response = await processPrompt(currentInput, promptType, language);
      const processingTime = Date.now() - startTime;

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.content || response.error || 'No response received',
        timestamp: new Date(),
        tier: response.tier,
        creditsUsed: response.creditsUsed,
        error: !response.success,
        type: 'text',
        metadata: {
          ...response.metadata,
          processingTime,
          complexityScore: response.complexityScore,
          factors: response.complexityFactors,
        },
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Refresh credits after successful request
      if (response.success) {
        refreshCredits();
      }
    } catch (_err) {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'An error occurred while processing your request. Please try again.',
        timestamp: new Date(),
        error: true,
        type: 'text',
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const QUICK_ACTIONS = useMemo(() => getQuickActions(t, isRTL), [t, isRTL]);

  const handleQuickAction = (action: (typeof QUICK_ACTIONS)[0]) => {
    setInput(action.prompt);
    inputRef.current?.focus();
  };

  const handleCopy = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    if (activeSessionId) {
      setChatSessions((prev) =>
        prev.map((session) =>
          session.id === activeSessionId
            ? { ...session, messages: [], updatedAt: new Date(), title: t('new_chat') || 'New Chat' }
            : session,
        ),
      );
    }
  };

  const getTierIcon = (tier: ModelTier) => {
    const info = TIER_INFO[tier];
    const IconComponent = info.icon;
    return <IconComponent size={12} weight="fill" className={info.color} />;
  };

  const getTierLabel = (tier: ModelTier) => {
    const tierNameKey = `${tier}_name` as keyof typeof TIER_INFO;
    return t(tierNameKey as string);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Click-outside overlay */}
      <div className="fixed inset-0 z-[9998] bg-transparent" onClick={onClose} />
      <div
        ref={chatContainerRef}
        className={`
                    fixed z-[9999] flex flex-col shadow-2xl border rounded-2xl overflow-hidden transition-all duration-300
                    ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}
                    ${isExpanded ? 'inset-4' : `bottom-20 w-[440px] h-[620px] ${isRTL ? 'left-4' : 'right-4'}`}
                `}
      >
        {/* Header */}
        <div
          className={`
                flex items-center justify-between px-4 py-3 border-b
                ${isDark ? 'border-gray-700 bg-gradient-to-r from-gray-800 to-gray-800/50' : 'border-gray-100 bg-gradient-to-r from-gray-50 to-white'}
            `}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              {/* 3D Neumorphic Icon - matches floating button */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{
                  background: isDark
                    ? 'linear-gradient(145deg, #505050, #404040)'
                    : 'linear-gradient(145deg, #6a6a6a, #505050)',
                  boxShadow: isDark
                    ? '3px 3px 6px #2a2a2a, -2px -2px 4px #606060'
                    : '3px 3px 6px rgba(0,0,0,0.2), -2px -2px 4px rgba(120,120,120,0.2)',
                  padding: '3px',
                }}
              >
                <div
                  className="w-full h-full rounded-full flex items-center justify-center"
                  style={{
                    background: isDark
                      ? 'linear-gradient(145deg, #606060, #4a4a4a)'
                      : 'linear-gradient(145deg, #ffffff, #e6e6e6)',
                    boxShadow: isDark
                      ? 'inset 1px 1px 3px #3a3a3a, inset -1px -1px 3px #707070'
                      : 'inset 1px 1px 3px #d0d0d0, inset -1px -1px 3px #ffffff',
                  }}
                >
                  <Sparkle size={18} weight="fill" className={isDark ? 'text-white' : 'text-gray-700'} />
                </div>
              </div>
              {/* Online indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white dark:border-gray-900" />
            </div>
            <div>
              <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('nabd_brain')}</h3>
              <div className="flex items-center gap-1.5">
                {creditsLoading ? (
                  <CircleNotch size={10} className="animate-spin text-gray-400" />
                ) : (
                  <span
                    className={`text-[11px] font-medium ${credits < 10 ? 'text-red-500' : isDark ? 'text-gray-400' : 'text-gray-500'}`}
                  >
                    {credits} {t('credit')}
                  </span>
                )}
                <span className={`text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>•</span>
                <button
                  onClick={toggleDeepMode}
                  className={`
                                    text-[11px] font-medium flex items-center gap-1 px-1.5 py-0.5 rounded-md transition-all
                                    ${
                                      deepModeEnabled
                                        ? 'text-purple-500 bg-purple-500/10'
                                        : isDark
                                          ? 'text-blue-400 bg-blue-500/10'
                                          : 'text-blue-500 bg-blue-500/10'
                                    }
                                `}
                  title={
                    deepModeEnabled
                      ? `${t('deep_mode')}: ${t('thinker_only')} (5 cr)`
                      : `${t('auto_mode')}: ${t('smart_routing')}`
                  }
                >
                  {deepModeEnabled ? (
                    <>
                      <Brain size={11} weight="fill" />
                      {t('deep_mode')}
                    </>
                  ) : (
                    <>
                      <Robot size={11} weight="fill" />
                      {t('auto_mode')}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* New chat button */}
            <button
              onClick={createNewChat}
              className={`p-1.5 rounded-lg transition-colors ${
                isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
              }`}
              title={t('new_chat') || 'New Chat'}
            >
              <Plus size={16} />
            </button>
            {/* Chat history button */}
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`
                            p-1.5 rounded-lg transition-colors relative
                            ${
                              showHistory
                                ? 'bg-purple-500/20 text-purple-500'
                                : isDark
                                  ? 'hover:bg-gray-700 text-gray-400'
                                  : 'hover:bg-gray-100 text-gray-500'
                            }
                        `}
              title={t('chat_history') || 'Chat History'}
            >
              <ClockCounterClockwise size={16} />
              {chatSessions.length > 0 && (
                <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-purple-500 text-[8px] text-white font-bold flex items-center justify-center">
                  {chatSessions.length > 9 ? '9+' : chatSessions.length}
                </div>
              )}
            </button>
            {/* Context info button */}
            <button
              onClick={() => setShowContextInfo(!showContextInfo)}
              className={`
                            p-1.5 rounded-lg transition-colors relative
                            ${
                              showContextInfo
                                ? 'bg-blue-500/20 text-blue-500'
                                : isDark
                                  ? 'hover:bg-gray-700 text-gray-400'
                                  : 'hover:bg-gray-100 text-gray-500'
                            }
                        `}
              title={t('view_context')}
            >
              <Database size={16} />
              {(currentBoardContext || currentRoomContext || currentPageContext) && (
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-500" />
              )}
            </button>
            {messages.length > 1 && (
              <button
                onClick={clearChat}
                className={`p-1.5 rounded-lg transition-colors ${
                  isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                }`}
                title={t('clear_chat')}
              >
                <Trash size={16} />
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`p-1.5 rounded-lg transition-colors ${
                isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
              }`}
              title={isExpanded ? t('minimize') : t('expand')}
            >
              {isExpanded ? <ArrowsInSimple size={16} /> : <ArrowsOutSimple size={16} />}
            </button>
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors ${
                isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
              }`}
              title={t('close')}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Chat History Panel */}
        {showHistory && (
          <div
            className={`
                    border-b max-h-[280px] overflow-y-auto
                    ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-100 bg-purple-50/30'}
                `}
          >
            <div
              className="flex items-center justify-between px-4 py-2 sticky top-0 z-10 backdrop-blur-sm"
              style={{ backgroundColor: isDark ? 'rgba(31, 41, 55, 0.9)' : 'rgba(250, 245, 255, 0.9)' }}
            >
              <div className="flex items-center gap-2">
                <ClockCounterClockwise size={14} className={isDark ? 'text-purple-400' : 'text-purple-500'} />
                <span className={`text-xs font-semibold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                  {t('chat_history') || 'Chat History'}
                </span>
              </div>
              <button
                onClick={createNewChat}
                className={`
                                flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors
                                ${
                                  isDark
                                    ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                                    : 'bg-purple-500/10 text-purple-600 hover:bg-purple-500/20'
                                }
                            `}
              >
                <Plus size={12} />
                {t('new_chat') || 'New Chat'}
              </button>
            </div>
            {chatSessions.length === 0 ? (
              <div className={`px-4 py-6 text-center text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                <ChatDots size={24} className="mx-auto mb-2 opacity-50" />
                {t('no_chat_history') || 'No chat history yet'}
              </div>
            ) : (
              <div className="px-2 pb-2 space-y-1">
                {[...chatSessions]
                  .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                  .map((session) => (
                    <div
                      key={session.id}
                      onClick={() => switchToSession(session.id)}
                      className={`
                                            group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all
                                            ${
                                              session.id === activeSessionId
                                                ? isDark
                                                  ? 'bg-purple-500/20 border border-purple-500/30'
                                                  : 'bg-purple-500/10 border border-purple-500/20'
                                                : isDark
                                                  ? 'hover:bg-gray-700/50 border border-transparent'
                                                  : 'hover:bg-gray-100 border border-transparent'
                                            }
                                        `}
                    >
                      <div
                        className={`
                                            w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                                            ${
                                              session.id === activeSessionId
                                                ? 'bg-purple-500/20'
                                                : isDark
                                                  ? 'bg-gray-700'
                                                  : 'bg-gray-100'
                                            }
                                        `}
                      >
                        <ChatCircle
                          size={16}
                          weight={session.id === activeSessionId ? 'fill' : 'regular'}
                          className={
                            session.id === activeSessionId
                              ? 'text-purple-500'
                              : isDark
                                ? 'text-gray-400'
                                : 'text-gray-500'
                          }
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs font-medium truncate ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                          {session.title}
                        </div>
                        <div className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          {session.messages.length} {t('messages') || 'messages'} •{' '}
                          {new Date(session.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <button
                        onClick={(e) => deleteSession(session.id, e)}
                        className={`
                                                p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity
                                                ${isDark ? 'hover:bg-red-500/20 text-red-400' : 'hover:bg-red-50 text-red-500'}
                                            `}
                        title={t('delete') || 'Delete'}
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Context Info Panel */}
        {showContextInfo && !showHistory && (
          <div
            className={`
                    px-4 py-3 border-b
                    ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-100 bg-blue-50/50'}
                `}
          >
            <div className="flex items-center gap-2 mb-2">
              <Eye size={14} className={isDark ? 'text-blue-400' : 'text-blue-500'} />
              <span className={`text-xs font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                {t('context_being_read')}
              </span>
            </div>
            {/* Current Page Context */}
            {currentPageContext && (
              <div
                className={`text-xs mb-2 pb-2 border-b ${isDark ? 'text-gray-300 border-gray-700' : 'text-gray-600 border-gray-200'}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Eye size={12} />
                  <strong>{t('current_page') || 'Current Page'}:</strong>
                  <span
                    className={`px-1.5 py-0.5 rounded ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-500/10 text-blue-600'}`}
                  >
                    {currentPageContext.department || currentPageContext.view}
                  </span>
                </div>
                {currentPageContext.boardName && (
                  <div className={`text-[11px] opacity-80 ${isRTL ? 'mr-4' : 'ml-4'}`}>
                    {t('board_label')}: {currentPageContext.boardName}
                  </div>
                )}
              </div>
            )}
            {/* Board/Room Context */}
            {currentBoardContext ? (
              <div className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <FileText size={12} />
                  <strong>{t('board_label')}:</strong> {currentBoardContext.name}
                </div>
                <div className={`space-y-0.5 text-[11px] opacity-80 ${isRTL ? 'mr-4' : 'ml-4'}`}>
                  <div>
                    {currentBoardContext.taskCount} {t('tasks')}
                  </div>
                  <div>
                    {t('columns_label')}: {currentBoardContext.columns.slice(0, 5).join(', ')}
                    {currentBoardContext.columns.length > 5 ? '...' : ''}
                  </div>
                </div>
              </div>
            ) : currentRoomContext ? (
              <div className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Table size={12} />
                  <strong>{t('room_label')}:</strong> {currentRoomContext.name}
                </div>
                <div className={`space-y-0.5 text-[11px] opacity-80 ${isRTL ? 'mr-4' : 'ml-4'}`}>
                  <div>
                    {currentRoomContext.rowCount} {t('rows_label')}
                  </div>
                  <div>
                    {t('columns_label')}: {currentRoomContext.columns.slice(0, 5).join(', ')}
                    {currentRoomContext.columns.length > 5 ? '...' : ''}
                  </div>
                </div>
              </div>
            ) : (
              !currentPageContext && (
                <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <Info size={12} className={`inline ${isRTL ? 'ml-1' : 'mr-1'}`} />
                  {t('no_board_context_hint')}
                </div>
              )
            )}
          </div>
        )}

        {/* Messages */}
        <div className={`flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
          {/* Welcome Screen - shows when no messages */}
          {messages.length === 0 && !isProcessing && (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="mb-4">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}
                >
                  <Brain
                    size={32}
                    weight="duotone"
                    className={isDark ? 'text-gray-300' : 'text-gray-700'}
                    style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.2))' }}
                  />
                </div>
                <h2 className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {t('welcome_nabd_brain')}
                </h2>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('ai_assistant')}</p>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`
                                max-w-[85%] rounded-2xl px-4 py-3 relative group
                                ${
                                  message.role === 'user'
                                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-md'
                                    : message.role === 'system'
                                      ? isDark
                                        ? 'bg-gradient-to-br from-gray-800 to-gray-800/50 border border-gray-700 text-gray-200 rounded-bl-md'
                                        : 'bg-gradient-to-br from-gray-50 to-white border border-gray-200 text-gray-700 rounded-bl-md'
                                      : message.error
                                        ? isDark
                                          ? 'bg-red-900/30 border border-red-800/50 text-red-200 rounded-bl-md'
                                          : 'bg-red-50 border border-red-200 text-red-700 rounded-bl-md'
                                        : isDark
                                          ? 'bg-gray-800 text-gray-100 rounded-bl-md'
                                          : 'bg-gray-100 text-gray-900 rounded-bl-md'
                                }
                            `}
              >
                {message.error && (
                  <div className="flex items-center gap-1.5 mb-2">
                    <Warning size={14} weight="fill" />
                    <span className="text-xs font-medium">{t('ai_error')}</span>
                  </div>
                )}

                <div className="text-sm prose prose-sm max-w-none dark:prose-invert [&>p]:mb-2 [&>ul]:mb-2 [&>ol]:mb-2 [&>*:last-child]:mb-0">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>

                {/* Message metadata */}
                {message.role === 'assistant' && !message.error && message.tier && (
                  <div
                    className={`
                                    flex items-center flex-wrap gap-x-3 gap-y-1 mt-3 pt-2 border-t text-[10px]
                                    ${isDark ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'}
                                `}
                  >
                    <div className="flex items-center gap-1">
                      {getTierIcon(message.tier)}
                      <span>{getTierLabel(message.tier)}</span>
                    </div>
                    {message.creditsUsed !== undefined && message.creditsUsed > 0 && (
                      <span className="text-amber-500">-{message.creditsUsed} cr</span>
                    )}
                    {message.metadata?.processingTime && (
                      <span>{(message.metadata.processingTime / 1000).toFixed(1)}s</span>
                    )}
                    {message.metadata?.escalated && (
                      <span className="text-purple-400 flex items-center gap-0.5">
                        <ArrowClockwise size={10} />
                        {t('escalated')}
                      </span>
                    )}
                    {message.metadata?.complexityScore !== undefined && (
                      <span className="opacity-70">
                        {t('complexity')}: {message.metadata.complexityScore}/100
                      </span>
                    )}
                  </div>
                )}

                {/* Copy button */}
                {message.role === 'assistant' && !message.error && (
                  <button
                    onClick={() => handleCopy(message.content, message.id)}
                    className={`
                                        absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100
                                        transition-opacity
                                        ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}
                                    `}
                    title="Copy"
                  >
                    {copiedId === message.id ? (
                      <Check size={14} className="text-green-500" />
                    ) : (
                      <Copy size={14} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Processing indicator */}
          {isProcessing && (
            <div className="flex justify-start">
              <div
                className={`
                            rounded-2xl rounded-bl-md px-4 py-3
                            ${isDark ? 'bg-gray-800' : 'bg-gray-100'}
                        `}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <CircleNotch size={20} className="animate-spin text-blue-500" />
                    <div className={`absolute inset-0 flex items-center justify-center`}>
                      {currentTier && getTierIcon(currentTier)}
                    </div>
                  </div>
                  <span className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                    {currentTier === 'thinker'
                      ? t('deep_thinking')
                      : currentTier === 'analyst'
                        ? t('analyzing_patterns')
                        : currentTier === 'worker'
                          ? t('generating')
                          : currentTier === 'assistant'
                            ? t('quick_response')
                            : currentTier === 'cleaner'
                              ? t('processing_data')
                              : t('analyzing')}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions Bar */}
        {messages.length <= 1 && (
          <div className={`px-4 py-2 border-t ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  onClick={() => handleQuickAction(action)}
                  className={`
                                    flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                                    transition-all border whitespace-nowrap shrink-0
                                    ${
                                      isDark
                                        ? 'border-gray-700 hover:border-gray-600 text-gray-300 hover:bg-gray-800'
                                        : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50'
                                    }
                                `}
                >
                  <action.icon size={14} className={isDark ? 'text-gray-400' : 'text-gray-600'} />
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className={`p-3 border-t ${isDark ? 'border-gray-700 bg-gray-800/30' : 'border-gray-100 bg-gray-50/30'}`}>
          {/* Tier preview */}
          {tierPreview && !isProcessing && (
            <div
              className={`
                            mb-2 rounded-xl overflow-hidden transition-all
                            ${isDark ? 'bg-gray-800' : 'bg-gray-100'}
                        `}
            >
              <button
                onClick={() => setShowTierDetails(!showTierDetails)}
                className={`
                                w-full flex items-center justify-between px-3 py-2 text-xs
                                ${isDark ? 'text-gray-300' : 'text-gray-600'}
                            `}
              >
                <div className="flex items-center gap-2">
                  {getTierIcon(tierPreview.tier)}
                  <span>
                    <strong className={TIER_INFO[tierPreview.tier].color}>{t(`${tierPreview.tier}_name`)}</strong>{' '}
                    {t('will_handle_this')} ({tierPreview.cost} {t('credit')})
                  </span>
                </div>
                {tierPreview.complexity && (
                  <div className="flex items-center gap-1">
                    <span className="opacity-60">
                      {t('complexity')}: {tierPreview.complexity.score}
                    </span>
                    {showTierDetails ? <CaretUp size={12} /> : <CaretDown size={12} />}
                  </div>
                )}
              </button>

              {showTierDetails && tierPreview.complexity && (
                <div className={`px-3 pb-2 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className={`pt-2 text-[10px] space-y-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    <div>
                      <strong>{t('why_this_tier')}</strong>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {tierPreview.complexity.factors.map((factor, i) => (
                        <span key={i} className={`px-1.5 py-0.5 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                          {factor}
                        </span>
                      ))}
                    </div>
                    <div className="opacity-70">
                      {t('confidence')}: {Math.round(tierPreview.complexity.confidence * 100)}%
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('ask_me_anything')}
              disabled={isProcessing}
              rows={1}
              className={`
                            flex-1 resize-none rounded-xl px-4 py-3 text-sm
                            focus:outline-none focus:ring-2 focus:ring-blue-500/50
                            transition-colors
                            ${
                              isDark
                                ? 'bg-gray-800 text-white placeholder-gray-500 border-gray-700'
                                : 'bg-white text-gray-900 placeholder-gray-400 border-gray-200'
                            }
                            border
                        `}
              style={{
                minHeight: '44px',
                maxHeight: '120px',
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 120) + 'px';
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isProcessing || credits < 1}
              className={`
                            w-11 h-11 rounded-xl flex items-center justify-center shrink-0
                            transition-all duration-200
                            ${
                              input.trim() && !isProcessing && credits >= 1
                                ? 'bg-black text-white shadow-lg hover:bg-gray-800 hover:scale-105'
                                : isDark
                                  ? 'bg-gray-800 text-gray-500'
                                  : 'bg-gray-100 text-gray-400'
                            }
                        `}
              title={credits < 1 ? t('no_credits_remaining') : t('send_message')}
            >
              {isProcessing ? (
                <CircleNotch size={20} className="animate-spin" />
              ) : (
                <PaperPlaneTilt size={20} weight="fill" />
              )}
            </button>
          </div>

          {/* Credits warning */}
          {credits < 5 && credits > 0 && (
            <div className={`mt-2 text-[10px] text-center ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
              <Warning size={10} className={`inline ${isRTL ? 'ml-1' : 'mr-1'}`} />
              {t('low_credits')} ({credits} {t('remaining')})
            </div>
          )}
          {credits < 1 && (
            <div className={`mt-2 text-[10px] text-center ${isDark ? 'text-red-400' : 'text-red-600'}`}>
              <Warning size={10} className={`inline ${isRTL ? 'ml-1' : 'mr-1'}`} />
              {t('no_credits_remaining')}. {t('add_credits_continue')}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default AIChat;
