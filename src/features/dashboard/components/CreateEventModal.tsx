import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Board, Workspace, Task } from '../../../types';
import { X, CalendarBlank, User, TextAlignLeft, Tag } from 'phosphor-react';

interface CreateEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    boards: Board[];
    workspaces: Workspace[];
    onSave: (eventData: any, boardId: string) => void;
    activeWorkspaceId?: string;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
    isOpen,
    onClose,
    boards,
    workspaces,
    onSave,
    activeWorkspaceId
}) => {
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [description, setDescription] = useState('');
    const [attendees, setAttendees] = useState('');
    const [priority, setPriority] = useState('Medium');

    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(activeWorkspaceId || (workspaces[0]?.id || ''));
    const [selectedBoardId, setSelectedBoardId] = useState('');

    // Initialize defaults
    useEffect(() => {
        if (isOpen) {
            setTitle('');
            setDate(new Date().toISOString().split('T')[0]);
            setDescription('');
            setAttendees('');
            setPriority('Medium');

            const defaultWs = activeWorkspaceId || workspaces[0]?.id || '';
            setSelectedWorkspaceId(defaultWs);

            const wsBoards = boards.filter(b => b.workspaceId === defaultWs);
            if (wsBoards.length > 0) {
                setSelectedBoardId(wsBoards[0].id);
            }
        }
    }, [isOpen, activeWorkspaceId, workspaces, boards]);

    // Update boards when workspace changes
    useEffect(() => {
        const wsBoards = boards.filter(b => b.workspaceId === selectedWorkspaceId);
        if (wsBoards.length > 0) {
            if (!wsBoards.find(b => b.id === selectedBoardId)) {
                setSelectedBoardId(wsBoards[0].id);
            }
        } else {
            setSelectedBoardId('');
        }
    }, [selectedWorkspaceId, boards]);



    const handleSave = () => {
        if (!title.trim()) {
            alert("Please enter an event title.");
            return;
        }
        if (!selectedBoardId) {
            alert("Please select a project board.");
            return;
        }

        const eventData = {
            name: title,
            date: date,
            priority: priority,
            description: description,
            attendees: attendees,
            type: 'event' // Marker to distinguish events
        };

        onSave(eventData, selectedBoardId);
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
                        className="bg-white w-full max-w-[360px] h-full shadow-2xl overflow-hidden flex flex-col border-l border-gray-100"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
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
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                        <CalendarBlank size={24} weight="duotone" className="text-blue-600" />
                                        Create Event
                                    </h2>
                                    <p className="text-xs text-gray-500 mt-1">Schedule a new event for your project</p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-gray-600 rounded-full p-2 hover:bg-gray-100 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-5 space-y-4 flex-1 overflow-y-auto custom-scrollbar">

                                {/* Project Selection */}
                                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50 space-y-2">
                                    <label className="block text-xs font-bold text-blue-800 uppercase tracking-wide">Project Context</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Workspace</label>
                                            <select
                                                className="w-full text-sm bg-white border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-blue-500"
                                                value={selectedWorkspaceId}
                                                onChange={e => setSelectedWorkspaceId(e.target.value)}
                                            >
                                                {workspaces.map(ws => (
                                                    <option key={ws.id} value={ws.id}>{ws.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Board</label>
                                            <select
                                                className="w-full text-sm bg-white border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-blue-500"
                                                value={selectedBoardId}
                                                onChange={e => setSelectedBoardId(e.target.value)}
                                                disabled={!selectedBoardId}
                                            >
                                                {boards.filter(b => b.workspaceId === selectedWorkspaceId).map(b => (
                                                    <option key={b.id} value={b.id}>{b.name}</option>
                                                ))}
                                                {boards.filter(b => b.workspaceId === selectedWorkspaceId).length === 0 && (
                                                    <option value="">No boards</option>
                                                )}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Event Title</label>
                                    <input
                                        autoFocus
                                        type="text"
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-gray-900 placeholder-gray-400"
                                        placeholder="e.g. Project Kickoff Meeting"
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    {/* Date */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                                            <CalendarBlank size={16} className="text-gray-400" />
                                            Date
                                        </label>
                                        <input
                                            type="date"
                                            className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                                            value={date}
                                            onChange={e => setDate(e.target.value)}
                                        />
                                    </div>
                                    {/* Priority */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                                            <Tag size={16} className="text-gray-400" />
                                            Priority
                                        </label>
                                        <select
                                            className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none bg-white"
                                            value={priority}
                                            onChange={e => setPriority(e.target.value)}
                                        >
                                            <option value="High">High Priority</option>
                                            <option value="Medium">Medium Priority</option>
                                            <option value="Low">Low Priority</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                                        <TextAlignLeft size={16} className="text-gray-400" />
                                        Description
                                    </label>
                                    <textarea
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-sm min-h-[80px] resize-y"
                                        placeholder="Add details about this event..."
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                    />
                                </div>

                                {/* Attendees */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                                        <User size={16} className="text-gray-400" />
                                        Attendees
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-sm"
                                        placeholder="Add people..."
                                        value={attendees}
                                        onChange={e => setAttendees(e.target.value)}
                                    />
                                </div>

                            </div>

                            {/* Footer */}
                            <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 shrink-0">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5"
                                >
                                    Create Event
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
