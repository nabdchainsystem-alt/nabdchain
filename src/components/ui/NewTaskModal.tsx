import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Board, Workspace } from '../../types';
import { useAppContext } from '../../contexts/AppContext';

interface NewTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    boards: Board[];
    workspaces: Workspace[];
    onSave: (task: { name: string; priority: string; date: string }, location: { type: 'existing' | 'new'; boardId?: string; workspaceId?: string; newBoardName?: string }) => void;
    activeWorkspaceId?: string;
}

export const NewTaskModal: React.FC<NewTaskModalProps> = ({
    isOpen,
    onClose,
    boards,
    workspaces,
    onSave,
    activeWorkspaceId
}) => {
    const { t, language } = useAppContext();
    const isRTL = language === 'ar';
    const [taskName, setTaskName] = useState('');
    const [priority, setPriority] = useState('Medium');
    const [date, setDate] = useState('');

    const [locationType, setLocationType] = useState<'existing' | 'new'>('existing');
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(activeWorkspaceId || (workspaces[0]?.id || ''));
    const [selectedBoardId, setSelectedBoardId] = useState('');
    const [newBoardName, setNewBoardName] = useState('');

    // Reset or initialize defaults when opening
    useEffect(() => {
        if (isOpen) {
            setTaskName('');
            setPriority('Medium');
            setDate(new Date().toISOString().split('T')[0]);
            setLocationType('existing');
            setNewBoardName('');

            const defaultWs = activeWorkspaceId || workspaces[0]?.id || '';
            setSelectedWorkspaceId(defaultWs);

            // Filter boards for this workspace
            const wsBoards = boards.filter(b => b.workspaceId === defaultWs);
            if (wsBoards.length > 0) {
                setSelectedBoardId(wsBoards[0].id);
            } else {
                setSelectedBoardId('');
            }
        }
    }, [isOpen, activeWorkspaceId, workspaces, boards]);

    // Update available boards when workspace changes
    useEffect(() => {
        if (locationType === 'existing') {
            const wsBoards = boards.filter(b => b.workspaceId === selectedWorkspaceId);
            if (wsBoards.length > 0) {
                // Only change if current selected is not in the new list
                if (!wsBoards.find(b => b.id === selectedBoardId)) {
                    setSelectedBoardId(wsBoards[0].id);
                }
            } else {
                setSelectedBoardId('');
            }
        }
    }, [selectedWorkspaceId, boards, locationType, selectedBoardId]);




    const handleSave = () => {
        if (!taskName.trim()) return;

        if (locationType === 'existing' && !selectedBoardId) {
            alert("Please select a board.");
            return;
        }
        if (locationType === 'new' && (!newBoardName.trim() || !selectedWorkspaceId)) {
            alert("Please enter a board name and select a workspace.");
            return;
        }

        onSave(
            { name: taskName, priority, date },
            {
                type: locationType,
                boardId: selectedBoardId,
                workspaceId: selectedWorkspaceId,
                newBoardName: newBoardName
            }
        );
        onClose();
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[9999] flex justify-end bg-transparent"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="bg-white w-full max-w-[360px] h-full shadow-2xl overflow-hidden flex flex-col border-s border-gray-100"
                        initial={{ x: isRTL ? '-100%' : '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: isRTL ? '-100%' : '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <form
                            className="flex flex-col h-full"
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSave();
                            }}
                        >
                            {/* Header */}
                            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-blue-600">add_task</span>
                                    {t('new_task')}
                                </h2>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-gray-600 rounded-full p-2 hover:bg-gray-100 transition-colors"
                                >
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-5 space-y-4 flex-1 overflow-y-auto custom-scrollbar">

                                {/* Task Name */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">{t('task_name')}</label>
                                    <input
                                        autoFocus
                                        type="text"
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-gray-900 placeholder-gray-400"
                                        placeholder={t('what_needs_done')}
                                        value={taskName}
                                        onChange={e => setTaskName(e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    {/* Priority */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">{t('priority')}</label>
                                        <select
                                            className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none bg-white"
                                            value={priority}
                                            onChange={e => setPriority(e.target.value)}
                                        >
                                            <option value="Urgent">{t('urgent')}</option>
                                            <option value="High">{t('high')}</option>
                                            <option value="Medium">{t('medium')}</option>
                                            <option value="Low">{t('low')}</option>
                                        </select>
                                    </div>

                                    {/* Date */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">{t('due_date')}</label>
                                        <input
                                            type="date"
                                            className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                                            value={date}
                                            onChange={e => setDate(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <hr className="border-gray-100" />

                                {/* Location Selection */}
                                <div className="space-y-4">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">{t('location')}</label>
                                    <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
                                        <button
                                            type="button"
                                            className={`flex-1 text-sm font-medium py-2 px-3 rounded-lg transition-all ${locationType === 'existing' ? 'bg-white text-blue-600 shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-700'}`}
                                            onClick={() => setLocationType('existing')}
                                        >
                                            {t('existing_board')}
                                        </button>
                                        <button
                                            type="button"
                                            className={`flex-1 text-sm font-medium py-2 px-3 rounded-lg transition-all ${locationType === 'new' ? 'bg-white text-blue-600 shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-700'}`}
                                            onClick={() => setLocationType('new')}
                                        >
                                            {t('new_board')}
                                        </button>
                                    </div>

                                    {locationType === 'existing' ? (
                                        <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">{t('workspace')}</label>
                                                <select
                                                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none bg-white"
                                                    value={selectedWorkspaceId}
                                                    onChange={e => setSelectedWorkspaceId(e.target.value)}
                                                >
                                                    {workspaces.map(ws => (
                                                        <option key={ws.id} value={ws.id}>{ws.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">{t('board')}</label>
                                                <select
                                                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none bg-white disabled:bg-gray-50 disabled:text-gray-400"
                                                    value={selectedBoardId}
                                                    onChange={e => setSelectedBoardId(e.target.value)}
                                                    disabled={boards.filter(b => b.workspaceId === selectedWorkspaceId).length === 0}
                                                >
                                                    {boards.filter(b => b.workspaceId === selectedWorkspaceId).map(b => (
                                                        <option key={b.id} value={b.id}>{b.name}</option>
                                                    ))}
                                                    {boards.filter(b => b.workspaceId === selectedWorkspaceId).length === 0 && (
                                                        <option>{t('no_boards_found')}</option>
                                                    )}
                                                </select>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">{t('workspace')}</label>
                                                <select
                                                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none bg-white"
                                                    value={selectedWorkspaceId}
                                                    onChange={e => setSelectedWorkspaceId(e.target.value)}
                                                >
                                                    {workspaces.map(ws => (
                                                        <option key={ws.id} value={ws.id}>{ws.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">{t('new_board_name')}</label>
                                                <input
                                                    type="text"
                                                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                                                    placeholder="e.g. Marketing Projects"
                                                    value={newBoardName}
                                                    onChange={e => setNewBoardName(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                            </div>

                            {/* Footer */}
                            <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 shrink-0">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-xl transition-colors"
                                >
                                    {t('cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5"
                                >
                                    {t('create_task')}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};
