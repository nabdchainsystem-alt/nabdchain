import React, { useState, useRef, useEffect, useCallback } from 'react';
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
    Gear,
    Robot,
    Eye,
    FileText,
    ArrowClockwise,
    Info,
    CaretDown,
    CaretUp,
} from 'phosphor-react';
import { useAI, ModelTier, BoardContextData, RoomContextData } from '../contexts/AIContext';
import { useAppContext } from '../contexts/AppContext';
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

interface AIChatProps {
    isOpen: boolean;
    onClose: () => void;
    initialPrompt?: string;
}

const getQuickActions = (t: (key: string) => string) => [
    { icon: ChartBar, label: t('ai_chart'), prompt: 'Create a chart showing ', promptType: 'chart', color: 'text-blue-500 bg-blue-500/10' },
    { icon: Table, label: t('ai_table'), prompt: 'Generate a table of ', promptType: 'table', color: 'text-green-500 bg-green-500/10' },
    { icon: ListChecks, label: t('tasks'), prompt: 'Extract tasks from: ', promptType: 'gtd', color: 'text-orange-500 bg-orange-500/10' },
    { icon: TrendUp, label: t('ai_forecast'), prompt: 'Forecast the trend for ', promptType: 'forecast', color: 'text-purple-500 bg-purple-500/10' },
    { icon: Lightbulb, label: t('ai_tips'), prompt: 'Give me tips on ', promptType: 'tips', color: 'text-amber-500 bg-amber-500/10' },
];

const TIER_INFO = {
    cleaner: {
        name: 'Cleaner',
        model: 'Gemini 2.5 Flash',
        description: 'Fast data formatting & simple tasks',
        color: 'text-green-500',
        bgColor: 'bg-green-500/10',
        icon: Sparkle,
        cost: 1,
    },
    worker: {
        name: 'Worker',
        model: 'Gemini 3 Flash',
        description: 'Analysis, charts, tables & insights',
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
        icon: Lightning,
        cost: 1,
    },
    thinker: {
        name: 'Thinker',
        model: 'Gemini 3 Pro',
        description: 'Deep strategy & complex analysis',
        color: 'text-purple-500',
        bgColor: 'bg-purple-500/10',
        icon: Brain,
        cost: 5,
    },
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
        error,
        clearError,
        processPrompt,
        generateChart,
        generateTable,
        generateForecast,
        generateTips,
        extractGTDTasks,
        previewTier,
        analyzeComplexity,
        currentBoardContext,
        currentRoomContext,
    } = useAI();
    const { theme, t, dir } = useAppContext();
    const isRTL = dir === 'rtl';

    const [messages, setMessages] = useState<Message[]>([]);
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

    const isDark = theme === 'dark';

    // Get current context summary
    const contextSummary = useCallback(() => {
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

    // Add welcome message on first open
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            const welcomeMessage: Message = {
                id: 'welcome',
                role: 'system',
                content: `**${t('welcome_nabd_brain')}** 🧠\n\n${t('ai_system_intro')}\n\n- **Cleaner** (Gemini 2.5 Flash) - ${t('cleaner_desc')}\n- **Worker** (Gemini 3 Flash) - ${t('worker_desc')}\n- **Thinker** (Gemini 3 Pro) - ${t('thinker_desc')}\n\n${t('auto_model_selection')} ${currentBoardContext || currentRoomContext ? `\n\n📊 **${t('current_context')}:** ${contextSummary()}` : ''}`,
                timestamp: new Date(),
            };
            setMessages([welcomeMessage]);
        }
    }, [isOpen, messages.length, currentBoardContext, currentRoomContext, contextSummary, t]);

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
                } catch (err) {
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

        setMessages(prev => [...prev, userMessage]);
        const currentInput = input;
        setInput('');
        setTierPreview(null);

        try {
            const startTime = Date.now();
            const response = await processPrompt(currentInput, promptType);
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

            setMessages(prev => [...prev, assistantMessage]);

            // Refresh credits after successful request
            if (response.success) {
                refreshCredits();
            }
        } catch (err) {
            const errorMessage: Message = {
                id: `error-${Date.now()}`,
                role: 'assistant',
                content: 'An error occurred while processing your request. Please try again.',
                timestamp: new Date(),
                error: true,
                type: 'text',
            };
            setMessages(prev => [...prev, errorMessage]);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const QUICK_ACTIONS = getQuickActions(t);

    const handleQuickAction = (action: typeof QUICK_ACTIONS[0]) => {
        setInput(action.prompt);
        inputRef.current?.focus();
    };

    const handleCopy = async (content: string, id: string) => {
        await navigator.clipboard.writeText(content);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const clearChat = () => {
        setMessages([]);
    };

    const getTierIcon = (tier: ModelTier) => {
        const info = TIER_INFO[tier];
        const IconComponent = info.icon;
        return <IconComponent size={12} weight="fill" className={info.color} />;
    };

    const getTierLabel = (tier: ModelTier) => TIER_INFO[tier].model;

    if (!isOpen) return null;

    return (
        <div
            className={`
                fixed z-[9999] flex flex-col shadow-2xl border rounded-2xl overflow-hidden transition-all duration-300
                ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}
                ${isExpanded
                    ? 'inset-4'
                    : `bottom-20 w-[440px] h-[620px] ${isRTL ? 'left-4' : 'right-4'}`
                }
            `}
        >
            {/* Header */}
            <div className={`
                flex items-center justify-between px-4 py-3 border-b
                ${isDark ? 'border-gray-700 bg-gradient-to-r from-gray-800 to-gray-800/50' : 'border-gray-100 bg-gradient-to-r from-gray-50 to-white'}
            `}>
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
                        <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {t('nabd_brain')}
                        </h3>
                        <div className="flex items-center gap-1.5">
                            {creditsLoading ? (
                                <CircleNotch size={10} className="animate-spin text-gray-400" />
                            ) : (
                                <span className={`text-[11px] font-medium ${credits < 10 ? 'text-red-500' : isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {credits} {t('credit')}
                                </span>
                            )}
                            <span className={`text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>•</span>
                            <button
                                onClick={toggleDeepMode}
                                className={`
                                    text-[11px] font-medium flex items-center gap-1 px-1.5 py-0.5 rounded-md transition-all
                                    ${deepModeEnabled
                                        ? 'text-purple-500 bg-purple-500/10'
                                        : isDark ? 'text-blue-400 bg-blue-500/10' : 'text-blue-500 bg-blue-500/10'
                                    }
                                `}
                                title={deepModeEnabled ? `${t('deep_mode')}: ${t('thinker_only')} (5 cr)` : `${t('auto_mode')}: ${t('smart_routing')}`}
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
                    {/* Context info button */}
                    <button
                        onClick={() => setShowContextInfo(!showContextInfo)}
                        className={`
                            p-1.5 rounded-lg transition-colors relative
                            ${showContextInfo
                                ? 'bg-blue-500/20 text-blue-500'
                                : isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                            }
                        `}
                        title={t('view_context')}
                    >
                        <Database size={16} />
                        {(currentBoardContext || currentRoomContext) && (
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

            {/* Context Info Panel */}
            {showContextInfo && (
                <div className={`
                    px-4 py-3 border-b
                    ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-100 bg-blue-50/50'}
                `}>
                    <div className="flex items-center gap-2 mb-2">
                        <Eye size={14} className={isDark ? 'text-blue-400' : 'text-blue-500'} />
                        <span className={`text-xs font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                            {t('context_being_read')}
                        </span>
                    </div>
                    {currentBoardContext ? (
                        <div className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            <div className="flex items-center gap-2 mb-1">
                                <FileText size={12} />
                                <strong>{t('board_label')}:</strong> {currentBoardContext.name}
                            </div>
                            <div className={`space-y-0.5 text-[11px] opacity-80 ${isRTL ? 'mr-4' : 'ml-4'}`}>
                                <div>{currentBoardContext.taskCount} {t('tasks')}</div>
                                <div>{t('columns_label')}: {currentBoardContext.columns.slice(0, 5).join(', ')}{currentBoardContext.columns.length > 5 ? '...' : ''}</div>
                            </div>
                        </div>
                    ) : currentRoomContext ? (
                        <div className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            <div className="flex items-center gap-2 mb-1">
                                <Table size={12} />
                                <strong>{t('room_label')}:</strong> {currentRoomContext.name}
                            </div>
                            <div className={`space-y-0.5 text-[11px] opacity-80 ${isRTL ? 'mr-4' : 'ml-4'}`}>
                                <div>{currentRoomContext.rowCount} {t('rows_label')}</div>
                                <div>{t('columns_label')}: {currentRoomContext.columns.slice(0, 5).join(', ')}{currentRoomContext.columns.length > 5 ? '...' : ''}</div>
                            </div>
                        </div>
                    ) : (
                        <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            <Info size={12} className={`inline ${isRTL ? 'ml-1' : 'mr-1'}`} />
                            {t('no_board_context_hint')}
                        </div>
                    )}
                </div>
            )}

            {/* Messages */}
            <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`
                                max-w-[85%] rounded-2xl px-4 py-3 relative group
                                ${message.role === 'user'
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
                                <div className={`
                                    flex items-center flex-wrap gap-x-3 gap-y-1 mt-3 pt-2 border-t text-[10px]
                                    ${isDark ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'}
                                `}>
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
                        <div className={`
                            rounded-2xl rounded-bl-md px-4 py-3
                            ${isDark ? 'bg-gray-800' : 'bg-gray-100'}
                        `}>
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <CircleNotch size={20} className="animate-spin text-blue-500" />
                                    <div className={`absolute inset-0 flex items-center justify-center`}>
                                        {currentTier && getTierIcon(currentTier)}
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <span className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                                        {currentTier === 'thinker' ? t('deep_thinking') :
                                         currentTier === 'cleaner' ? t('processing_data') : t('analyzing')}
                                    </span>
                                    <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                        {t('using_ai')} {currentTier ? TIER_INFO[currentTier].model : 'AI'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions Bar */}
            {messages.length <= 1 && (
                <div className={`px-4 py-2 border-t ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {QUICK_ACTIONS.map((action) => (
                            <button
                                key={action.label}
                                onClick={() => handleQuickAction(action)}
                                className={`
                                    flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                                    transition-all border whitespace-nowrap shrink-0
                                    ${isDark
                                        ? 'border-gray-700 hover:border-gray-600 text-gray-300 hover:bg-gray-800'
                                        : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50'
                                    }
                                `}
                            >
                                <action.icon size={14} className={action.color.split(' ')[0]} />
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
                                    <strong className={TIER_INFO[tierPreview.tier].color}>{TIER_INFO[tierPreview.tier].name}</strong>
                                    {' '}will handle this ({tierPreview.cost} credit{tierPreview.cost > 1 ? 's' : ''})
                                </span>
                            </div>
                            {tierPreview.complexity && (
                                <div className="flex items-center gap-1">
                                    <span className="opacity-60">Score: {tierPreview.complexity.score}</span>
                                    {showTierDetails ? <CaretUp size={12} /> : <CaretDown size={12} />}
                                </div>
                            )}
                        </button>

                        {showTierDetails && tierPreview.complexity && (
                            <div className={`px-3 pb-2 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                                <div className={`pt-2 text-[10px] space-y-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    <div><strong>Why this tier:</strong></div>
                                    <div className="flex flex-wrap gap-1">
                                        {tierPreview.complexity.factors.map((factor, i) => (
                                            <span
                                                key={i}
                                                className={`px-1.5 py-0.5 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}
                                            >
                                                {factor}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="opacity-70">
                                        Confidence: {Math.round(tierPreview.complexity.confidence * 100)}%
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
                        placeholder={currentBoardContext ? `${t('ask_about')} ${currentBoardContext.name}...` : t('ask_me_anything')}
                        disabled={isProcessing}
                        rows={1}
                        className={`
                            flex-1 resize-none rounded-xl px-4 py-3 text-sm
                            focus:outline-none focus:ring-2 focus:ring-blue-500/50
                            transition-colors
                            ${isDark
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
                            ${input.trim() && !isProcessing && credits >= 1
                                ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105'
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
                        <Warning size={10} className="inline mr-1" />
                        Low credits ({credits} remaining)
                    </div>
                )}
                {credits < 1 && (
                    <div className={`mt-2 text-[10px] text-center ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                        <Warning size={10} className="inline mr-1" />
                        No credits remaining. Please add credits to continue.
                    </div>
                )}
            </div>
        </div>
    );
}

export default AIChat;
