import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Chat as MessageSquare, FileText, Activity, TextBolder as Bold, TextItalic as Italic, TextUnderline as Underline, TextStrikethrough as Strikethrough, List, Link, Image, Smiley as Smile, At as AtSign, Trash as Trash2, UserPlus, Check, UserCircle } from 'phosphor-react';
import { useAuth } from '../../../auth-adapter';
import { teamService, TeamMember } from '../../../services/teamService';
import { assignmentService } from '../../../services/assignmentService';

interface RowDetailPanelProps {
    isOpen: boolean;
    onClose: () => void;
    row: any; // Using any for flexibility, expects { id, name, ... }
    boardId?: string;
}

export const RowDetailPanel: React.FC<RowDetailPanelProps> = ({ isOpen, onClose, row, boardId }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [activeTab, setActiveTab] = useState<'updates' | 'files' | 'activity'>('updates');
    const [updateText, setUpdateText] = useState('');
    const [updates, setUpdates] = useState<{ id: string; text: string; createdAt: Date }[]>([]);

    // Assignment state
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [isLoadingMembers, setIsLoadingMembers] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);
    const [assignSuccess, setAssignSuccess] = useState<string | null>(null);
    const { getToken } = useAuth();

    const handleSaveUpdate = () => {
        if (!updateText.trim()) return;
        const newUpdate = {
            id: Date.now().toString(),
            text: updateText,
            createdAt: new Date()
        };
        setUpdates(prev => [newUpdate, ...prev]);
        setUpdateText('');
    };

    const handleDeleteUpdate = (id: string) => {
        setUpdates(prev => prev.filter(u => u.id !== id));
    };

    // Fetch team members when assign modal opens
    const handleOpenAssignModal = useCallback(async () => {
        setIsAssignModalOpen(true);
        setIsLoadingMembers(true);
        try {
            const token = await getToken();
            if (!token) return;
            const members = await teamService.getTeamMembers(token);
            setTeamMembers(members);
        } catch (error) {
            console.error('Failed to fetch team members:', error);
        } finally {
            setIsLoadingMembers(false);
        }
    }, [getToken]);

    // Handle assigning task to a team member
    const handleAssignTo = async (member: TeamMember) => {
        if (!boardId || !row?.id) {
            console.error('Missing boardId or row id');
            return;
        }

        setIsAssigning(true);
        try {
            const token = await getToken();
            if (!token) return;

            await assignmentService.assignTask(token, {
                sourceBoardId: boardId,
                sourceRowId: row.id,
                sourceTaskData: row,
                assignedToUserId: member.id
            });

            setAssignSuccess(member.name || member.email);
            setTimeout(() => {
                setAssignSuccess(null);
                setIsAssignModalOpen(false);
            }, 2000);
        } catch (error) {
            console.error('Failed to assign task:', error);
            alert('Failed to assign task. Make sure you are connected to this team member.');
        } finally {
            setIsAssigning(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isVisible && !isOpen) return null;

    const content = (
        <div className="fixed inset-0 z-[999999] overflow-hidden">
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-stone-900/20 backdrop-blur-[1px] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
            />

            {/* Panel */}
            <div
                className={`
                    absolute top-0 right-0 h-full w-full max-w-2xl bg-white dark:bg-monday-dark-surface shadow-2xl border-l border-stone-200 dark:border-stone-800
                    transform transition-transform duration-300 ease-in-out flex flex-col
                    ${isOpen ? 'translate-x-0' : 'translate-x-full'}
                `}
            >
                {/* Header */}
                <div className="flex-none px-6 py-4 border-b border-stone-100 dark:border-stone-800 flex items-start justify-between gap-4 bg-white dark:bg-monday-dark-surface">
                    <div className="flex-1 mt-1">
                        <h2 className="text-2xl font-semibold text-stone-800 dark:text-stone-100 leading-snug break-words">
                            {row?.name || 'Untitled Item'}
                        </h2>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Assign Button */}
                        <button
                            onClick={handleOpenAssignModal}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        >
                            <UserPlus size={18} />
                            Assign
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Assign Modal */}
                {isAssignModalOpen && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center">
                        <div className="absolute inset-0 bg-black/30" onClick={() => setIsAssignModalOpen(false)} />
                        <div className="relative bg-white dark:bg-monday-dark-surface rounded-xl shadow-2xl w-80 max-h-96 overflow-hidden animate-fadeIn">
                            <div className="px-4 py-3 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
                                <h3 className="font-semibold text-stone-800 dark:text-stone-100">Assign to Team Member</h3>
                                <button
                                    onClick={() => setIsAssignModalOpen(false)}
                                    className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded"
                                >
                                    <X size={16} className="text-stone-500" />
                                </button>
                            </div>
                            <div className="max-h-72 overflow-y-auto">
                                {assignSuccess ? (
                                    <div className="flex flex-col items-center justify-center py-8 text-center">
                                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-3">
                                            <Check size={24} className="text-green-600 dark:text-green-400" />
                                        </div>
                                        <p className="text-sm text-stone-600 dark:text-stone-300">
                                            Task assigned to <span className="font-medium">{assignSuccess}</span>
                                        </p>
                                    </div>
                                ) : isLoadingMembers ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                                    </div>
                                ) : teamMembers.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                                        <UserCircle size={40} className="text-stone-300 dark:text-stone-600 mb-2" />
                                        <p className="text-sm text-stone-500 dark:text-stone-400">No team members found</p>
                                        <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">Connect with team members in the Teams page first</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-stone-100 dark:divide-stone-800">
                                        {teamMembers.map((member) => (
                                            <button
                                                key={member.id}
                                                onClick={() => handleAssignTo(member)}
                                                disabled={isAssigning}
                                                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors text-left disabled:opacity-50"
                                            >
                                                {member.avatarUrl ? (
                                                    <img
                                                        src={member.avatarUrl}
                                                        alt={member.name || member.email}
                                                        className="w-8 h-8 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white text-sm font-medium">
                                                        {(member.name || member.email).charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-stone-800 dark:text-stone-100 truncate">
                                                        {member.name || member.email}
                                                    </p>
                                                    {member.name && (
                                                        <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                                                            {member.email}
                                                        </p>
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex-none px-6 border-b border-stone-100 dark:border-stone-800 flex gap-6 bg-white dark:bg-monday-dark-surface">
                    {[
                        { id: 'updates', label: 'Updates', icon: MessageSquare },
                        { id: 'files', label: 'Files', icon: FileText },
                        { id: 'activity', label: 'Activity Log', icon: Activity },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`
                                py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors
                                ${activeTab === tab.id
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'}
                            `}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto bg-stone-50/50 dark:bg-monday-dark-elevated p-6">
                    {activeTab === 'updates' && (
                        <div className="space-y-8">
                            {/* Write Update Box */}
                            <div className="bg-white dark:bg-monday-dark-surface rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                                <div className="p-4">
                                    <textarea
                                        value={updateText}
                                        onChange={(e) => setUpdateText(e.target.value)}
                                        placeholder="Write an update..."
                                        className="w-full min-h-[100px] bg-transparent border-none outline-none text-stone-700 dark:text-stone-200 placeholder:text-stone-400 resize-none"
                                    />
                                </div>

                                {/* Fake Toolbar */}
                                <div className="px-3 py-2 border-t border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50 flex items-center justify-between">
                                    <div className="flex items-center gap-1 text-stone-500 dark:text-stone-400">
                                        <button className="p-1.5 hover:bg-stone-200 dark:hover:bg-stone-700 rounded"><Bold size={14} /></button>
                                        <button className="p-1.5 hover:bg-stone-200 dark:hover:bg-stone-700 rounded"><Italic size={14} /></button>
                                        <button className="p-1.5 hover:bg-stone-200 dark:hover:bg-stone-700 rounded"><Underline size={14} /></button>
                                        <button className="p-1.5 hover:bg-stone-200 dark:hover:bg-stone-700 rounded"><Strikethrough size={14} /></button>
                                        <div className="w-px h-4 bg-stone-300 dark:bg-stone-700 mx-1" />
                                        <button className="p-1.5 hover:bg-stone-200 dark:hover:bg-stone-700 rounded"><List size={14} /></button>
                                        <div className="w-px h-4 bg-stone-300 dark:bg-stone-700 mx-1" />
                                        <button className="p-1.5 hover:bg-stone-200 dark:hover:bg-stone-700 rounded"><Link size={14} /></button>
                                        <button className="p-1.5 hover:bg-stone-200 dark:hover:bg-stone-700 rounded"><Image size={14} /></button>
                                        <button className="p-1.5 hover:bg-stone-200 dark:hover:bg-stone-700 rounded"><AtSign size={14} /></button>
                                        <button className="p-1.5 hover:bg-stone-200 dark:hover:bg-stone-700 rounded"><Smile size={14} /></button>
                                    </div>
                                    <button
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
                                        onClick={handleSaveUpdate}
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>

                            {/* Updates List */}
                            {updates.length > 0 && (
                                <div className="space-y-4">
                                    {updates.map(update => (
                                        <div key={update.id} className="bg-white dark:bg-monday-dark-surface border border-stone-200 dark:border-stone-800 rounded-xl p-4 shadow-sm group">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="prose dark:prose-invert prose-sm max-w-none text-stone-700 dark:text-stone-300 whitespace-pre-wrap">
                                                    {update.text}
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteUpdate(update.id)}
                                                    className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Delete update"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                            <div className="mt-2 flex items-center gap-2 text-xs text-stone-400">
                                                <span>You</span>
                                                <span>•</span>
                                                <span>{update.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Empty State */}
                            {updates.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <div className="w-24 h-24 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mb-4">
                                        <img src="https://cdn.monday.com/images/pulse-page-empty-state.svg" alt="" className="w-16 h-16 opacity-50 grayscale" />
                                        <MessageSquare size={40} className="text-blue-300 dark:text-blue-600/50" />
                                    </div>
                                    <h3 className="text-lg font-medium text-stone-900 dark:text-stone-100">No updates yet</h3>
                                    <p className="text-sm text-stone-500 dark:text-stone-400 mt-1 max-w-xs">
                                        Share progress, mention a teammate, or upload a file to get things moving.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab !== 'updates' && (
                        <div className="flex items-center justify-center h-full text-stone-400 text-sm">
                            Coming soon
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return createPortal(content, document.body);
};
