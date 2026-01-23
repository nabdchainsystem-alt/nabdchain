import React, { useState } from 'react';
import {
    PaperPlaneTilt as Send, Trash as Trash2, Paperclip, FileDotted as FileSignature, PencilSimple as Edit3, Wheelchair as Accessibility,
    DotsThree as MoreHorizontal, ArrowBendUpLeft as CornerUpLeft, ArrowCounterClockwise as RotateCcw, CaretDown as ChevronDown,
    TextT as Type, TextBolder as Bold, TextItalic as Italic, TextUnderline as Underline, Link, DotsThree as MoreDots,
    TextAlignLeft as AlignLeft, List, Code, Quotes as Quote, ArrowsOut as Maximize2
} from 'phosphor-react';

import { emailService, EmailAccount } from '../../services/emailService';
import { appLogger } from '../../utils/logger';

interface ComposeViewProps {
    onDiscard: () => void;
    accounts?: EmailAccount[];
    initialData?: { to: string, subject: string, body: string };
    logActivity?: (type: string, content: string, metadata?: any, workspaceId?: string, boardId?: string) => Promise<void>;
}

import { useAuth } from '../../auth-adapter';

export const ComposeView: React.FC<ComposeViewProps> = ({ onDiscard, accounts, initialData, logActivity }) => {
    const { getToken } = useAuth();
    const [to, setTo] = useState(initialData?.to || "");
    const [cc, setCc] = useState("");
    const [bcc, setBcc] = useState("");
    const [showCc, setShowCc] = useState(false);
    const [showBcc, setShowBcc] = useState(false);

    const [subject, setSubject] = useState(initialData?.subject || "");
    const [body, setBody] = useState(initialData?.body || "");
    const [sending, setSending] = useState(false);

    // Sync initial body to contentEditable div
    React.useEffect(() => {
        const el = document.getElementById('compose-body');
        if (el && initialData?.body) {
            el.innerText = initialData.body;
        }
    }, [initialData?.body]);

    const handleSend = async () => {
        if (!to || !subject || !body) return;

        try {
            setSending(true);
            const token = await getToken();
            if (!token) return;
            const provider = accounts?.[0]?.provider || 'google';
            await emailService.sendEmail(token, to, subject, body, provider as 'google' | 'outlook', cc, bcc);
            if (logActivity) {
                logActivity('EMAIL_SENT', `Sent email: ${subject}`, { to, subject });
            }
            onDiscard();
        } catch (error) {
            appLogger.error("Failed to send", error);
            alert("Failed to send email");
        } finally {
            setSending(false);
        }
    };

    const handleInsertSignature = () => {
        const signature = `\n\nBest regards,\n${accounts?.[0]?.email || 'NABD User'}`;
        setBody(prev => prev + signature);
        const el = document.getElementById('compose-body');
        if (el) {
            el.innerText = el.innerText + signature;
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-white dark:bg-monday-dark-bg text-gray-900 dark:text-gray-100 font-sans">
            {/* 1. Main Action Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-monday-dark-border bg-white dark:bg-monday-dark-surface">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleSend}
                        disabled={sending}
                        className="flex items-center gap-2 bg-monday-blue hover:bg-blue-600 disabled:opacity-50 text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
                    >
                        <Send size={14} className="-ml-0.5" />
                        {sending ? 'Sending...' : 'Send'}
                    </button>
                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <ToolBtn icon={<Trash2 size={16} />} label="Discard" onClick={onDiscard} />
                        <ToolBtn icon={<Paperclip size={16} />} label="Attach File" onClick={() => alert("Attachments coming soon!")} />
                        <ToolBtn icon={<FileSignature size={16} />} label="Signature" onClick={handleInsertSignature} />
                        <ToolBtn icon={<Edit3 size={16} />} label="Editor" />
                        <ToolBtn icon={<Accessibility size={16} />} label="Check Accessibility" />
                    </div>
                </div>
                <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                    <MoreHorizontal size={20} />
                </button>
            </div>

            {/* 2. Formatting Toolbar */}
            <div className="flex items-center px-4 py-2 border-b border-gray-200 dark:border-monday-dark-border bg-[#fcfcfc] dark:bg-monday-dark-bg gap-3 text-gray-600 dark:text-gray-400 overflow-x-auto">
                <div className="flex items-center gap-1 border-r border-gray-200 dark:border-monday-dark-border pr-2">
                    <IconBtn icon={<CornerUpLeft size={16} />} label="Undo" withChevron />
                    <IconBtn icon={<RotateCcw size={16} />} label="Redo" />
                </div>

                <div className="flex items-center gap-2 border-r border-gray-200 dark:border-monday-dark-border pr-2">
                    <button className="flex items-center gap-1 bg-gray-100 dark:bg-monday-dark-hover px-2 py-0.5 rounded text-xs">
                        Aptos <ChevronDown size={12} />
                    </button>
                    <button className="flex items-center gap-1 bg-gray-100 dark:bg-monday-dark-hover px-2 py-0.5 rounded text-xs">
                        12 <ChevronDown size={12} />
                    </button>
                </div>

                <div className="flex items-center gap-1.5 border-r border-gray-200 dark:border-monday-dark-border pr-2">
                    <IconBtn icon={<Type size={16} />} />
                    <IconBtn icon={<Bold size={16} />} isActive />
                    <IconBtn icon={<Italic size={16} />} />
                    <IconBtn icon={<Underline size={16} />} />
                </div>

                <div className="flex items-center gap-1.5 border-r border-gray-200 dark:border-monday-dark-border pr-2">
                    <IconBtn icon={<List size={16} />} withChevron />
                    <IconBtn icon={<AlignLeft size={16} />} withChevron />
                    <IconBtn icon={<Code size={16} />} />
                    <IconBtn icon={<Quote size={16} />} />
                </div>

                <div className="flex items-center gap-1.5">
                    <IconBtn icon={<Link size={16} />} />
                    <IconBtn icon={<MoreDots size={16} />} />
                </div>
            </div>

            {/* 3. Input Fields */}
            <div className="px-8 py-4 space-y-4 max-w-5xl mx-auto w-full">

                {/* From */}
                <div className="flex items-baseline gap-4 group">
                    <label className="text-sm text-gray-500 w-12 text-right">From:</label>
                    <div className="flex-1 flex items-center justify-between border-b border-transparent group-hover:border-gray-200 py-1">
                        <span className="text-sm text-gray-800 dark:text-gray-200">
                            {accounts?.[0]?.email || 'me'}
                        </span>
                        <div className="flex items-center gap-2 text-gray-400">
                            <ChevronDown size={14} />
                            <Maximize2 size={12} className="rotate-45" />
                        </div>
                    </div>
                </div>

                {/* To */}
                <div className="flex items-baseline gap-4 group relative">
                    <label className="text-sm text-gray-500 w-12 text-right">To:</label>
                    <div className="flex-1 flex items-center justify-between border-b border-monday-blue py-1">
                        <input
                            type="text"
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                            className="w-full outline-none bg-transparent text-sm"
                            placeholder="Recipients..."
                        />
                    </div>
                    <div className="absolute right-0 top-1 text-xs text-gray-500 flex gap-2">
                        <button onClick={() => setShowCc(!showCc)} className={`hover:text-gray-800 ${showCc ? 'text-monday-blue font-bold' : ''}`}>Cc</button>
                        <button onClick={() => setShowBcc(!showBcc)} className={`hover:text-gray-800 ${showBcc ? 'text-monday-blue font-bold' : ''}`}>Bcc</button>
                    </div>
                </div>

                {/* CC (Conditional) */}
                {showCc && (
                    <div className="flex items-baseline gap-4 group animate-in slide-in-from-top-2 duration-200">
                        <label className="text-sm text-gray-500 w-12 text-right">Cc:</label>
                        <div className="flex-1 border-b border-gray-200 dark:border-monday-dark-border py-1">
                            <input
                                type="text"
                                value={cc}
                                onChange={(e) => setCc(e.target.value)}
                                className="w-full outline-none bg-transparent text-sm"
                            />
                        </div>
                    </div>
                )}

                {/* BCC (Conditional) */}
                {showBcc && (
                    <div className="flex items-baseline gap-4 group animate-in slide-in-from-top-2 duration-200">
                        <label className="text-sm text-gray-500 w-12 text-right">Bcc:</label>
                        <div className="flex-1 border-b border-gray-200 dark:border-monday-dark-border py-1">
                            <input
                                type="text"
                                value={bcc}
                                onChange={(e) => setBcc(e.target.value)}
                                className="w-full outline-none bg-transparent text-sm"
                            />
                        </div>
                    </div>
                )}

                {/* Subject */}
                <div className="flex items-baseline gap-4 group">
                    <label className="text-sm text-gray-500 w-12 text-right">Subject:</label>
                    <div className="flex-1 flex items-center justify-between border-b border-gray-200 dark:border-monday-dark-border py-1">
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full outline-none bg-transparent text-sm"
                            placeholder="Subject line"
                        />
                    </div>
                </div>

                {/* Body */}
                <div className="mt-2 pl-16">
                    <div
                        id="compose-body"
                        className="min-h-[300px] outline-none text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap"
                        contentEditable
                        onInput={(e) => setBody(e.currentTarget.textContent || "")}
                        suppressContentEditableWarning={true}
                    >
                        {/* Initial content mapped in useEffect or handled via initialData props */}
                    </div>
                </div>

            </div>

        </div>
    );
};

// --- Helpers ---

const ToolBtn = ({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick?: () => void }) => (
    <button onClick={onClick} className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-monday-dark-hover rounded text-xs font-medium transition-colors">
        {icon}
        <span>{label}</span>
    </button>
);

const IconBtn = ({ icon, label, withChevron, isActive }: { icon: React.ReactNode, label?: string, withChevron?: boolean, isActive?: boolean }) => (
    <button className={`flex items-center gap-0.5 p-1 rounded hover:bg-gray-200 dark:hover:bg-monday-dark-hover transition-colors ${isActive ? 'bg-gray-200 dark:bg-monday-dark-hover' : ''}`}>
        {icon}
        {label && <span className="text-xs ml-1">{label}</span>}
        {withChevron && <ChevronDown size={10} className="ml-0.5 text-gray-400" />}
    </button>
);

const UserIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
    </svg>
);
