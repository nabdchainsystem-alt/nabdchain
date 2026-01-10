import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Board, Workspace } from '../../types';

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


    if (!isOpen) return null;

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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-600">add_task</span>
                        New Task
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 rounded-full p-1 hover:bg-gray-100 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* content */}
                <div className="p-6 space-y-5">

                    {/* Task Name */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Task Name</label>
                        <input
                            autoFocus
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="What needs to be done?"
                            value={taskName}
                            onChange={e => setTaskName(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Priority */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Priority</label>
                            <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                value={priority}
                                onChange={e => setPriority(e.target.value)}
                            >
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                            </select>
                        </div>

                        {/* Date */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Due Date</label>
                            <input
                                type="date"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <hr className="border-gray-100" />

                    {/* Location Selection */}
                    <div className="space-y-3">
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            <button
                                className={`flex-1 text-sm font-medium py-1.5 px-3 rounded-md transition-all ${locationType === 'existing' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                onClick={() => setLocationType('existing')}
                            >
                                Existing Board
                            </button>
                            <button
                                className={`flex-1 text-sm font-medium py-1.5 px-3 rounded-md transition-all ${locationType === 'new' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                onClick={() => setLocationType('new')}
                            >
                                New Board
                            </button>
                        </div>

                        {locationType === 'existing' ? (
                            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Workspace</label>
                                    <select
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                        value={selectedWorkspaceId}
                                        onChange={e => setSelectedWorkspaceId(e.target.value)}
                                    >
                                        {workspaces.map(ws => (
                                            <option key={ws.id} value={ws.id}>{ws.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Board</label>
                                    <select
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white disabled:bg-gray-50 disabled:text-gray-400"
                                        value={selectedBoardId}
                                        onChange={e => setSelectedBoardId(e.target.value)}
                                        disabled={boards.filter(b => b.workspaceId === selectedWorkspaceId).length === 0}
                                    >
                                        {boards.filter(b => b.workspaceId === selectedWorkspaceId).map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                        {boards.filter(b => b.workspaceId === selectedWorkspaceId).length === 0 && (
                                            <option>No boards found</option>
                                        )}
                                    </select>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Workspace</label>
                                    <select
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                        value={selectedWorkspaceId}
                                        onChange={e => setSelectedWorkspaceId(e.target.value)}
                                    >
                                        {workspaces.map(ws => (
                                            <option key={ws.id} value={ws.id}>{ws.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">New Board Name</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm hover:shadow transition-all"
                    >
                        Create Task
                    </button>
                </div>

            </div>
        </div>,
        document.body
    );
};
