import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { RightSidebar } from './components/RightSidebar';
import { CaptureModal } from './components/CaptureModal';
import { NewBoardModal } from './components/NewBoardModal';
import { Thread, Message, ViewMode, Board, Task, Note } from './types';
import { BoardTemplate } from '../board/data/templates';

import { useLanguage } from '../../contexts/LanguageContext';
import { useUI } from '../../contexts/UIContext';
import { chatWithGemini } from '../../services/geminiService';

import KanbanBoard from '../board/views/Kanban/KanbanBoard';
import RoomTable from '../board/views/Table/RoomTable';
import DataTable from '../board/views/Table/DataTable';
import Lists from '../board/views/List/Lists';



// Mock initial data
const INITIAL_BOARDS: Board[] = [
    { id: 'b1', name: 'Work' },
    { id: 'b2', name: 'Personal' }
];

const INITIAL_THREADS: Thread[] = [
    {
        id: '1',
        boardId: 'b1',
        title: 'Weekly Review',
        preview: 'Productivity analysis for the past week...',
        updatedAt: new Date(),
        priority: 'high',
        dueDate: new Date(Date.now() + 86400000),
        messages: [
            {
                id: 'm1',
                role: 'model',
                content: 'Ready to review your week. What were your key wins?',
                timestamp: new Date(Date.now() - 3600000)
            }
        ]
    },
    {
        id: '2',
        boardId: 'b1',
        title: 'Project Alpha Brainstorming',
        preview: 'Key concepts for the new architecture...',
        updatedAt: new Date(Date.now() - 86400000),
        priority: 'medium',
        messages: []
    },
    {
        id: '3',
        boardId: 'b2',
        title: 'Book Ideas',
        preview: 'Sci-fi concepts about time travel...',
        updatedAt: new Date(Date.now() - 172800000),
        priority: 'low',
        messages: []
    }
];

const INITIAL_TASKS: Task[] = [
    { id: 't1', content: 'Email Sarah about the design', status: 'todo' },
    { id: 't2', content: 'Draft the project proposal', status: 'in_progress' },
];

const MOCK_USERS = [
    { id: 'u1', name: 'Alex Rivera', avatar: '', initials: 'AR', status: 'online' as const },
    { id: 'u2', name: 'Sarah Chen', avatar: '', initials: 'SC', status: 'busy' as const },
    { id: 'u3', name: 'Mike Ross', avatar: '', initials: 'MR', status: 'online' as const },
];

export default function DiscussionPage() {
    const { language, t } = useLanguage();
    const { theme } = useUI(); // Access global theme if needed for specific logic, but mainly CSS handles it

    const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
    const [isCaptureOpen, setIsCaptureOpen] = useState(false);
    const [isNewBoardModalOpen, setIsNewBoardModalOpen] = useState(false);

    // Data State
    const [boards, setBoards] = useState<Board[]>(INITIAL_BOARDS);
    const [threads, setThreads] = useState<Thread[]>(INITIAL_THREADS);
    const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
    const [activeNote, setActiveNote] = useState<Note>({ content: '' });

    const [activeThreadId, setActiveThreadId] = useState<string | null>('1');
    const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
    const [mainViewMode, setMainViewMode] = useState<'chat' | 'board'>('chat');








    // Responsive Mobile View State
    const [mobileViewMode, setMobileViewMode] = useState<ViewMode>(ViewMode.MobileList);

    const handleSendMessage = async (text: string) => {
        if (!activeThreadId) return;

        const newMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
            timestamp: new Date()
        };

        // 1. Add User Message
        setThreads(prev => prev.map(t => {
            if (t.id === activeThreadId) {
                return {
                    ...t,
                    messages: [...t.messages, newMessage],
                    updatedAt: new Date(),
                    preview: text
                };
            }
            return t;
        }));

        // 2. Prepare AI Placeholder
        const aiMsgId = (Date.now() + 1).toString();
        const aiPlaceholder: Message = {
            id: aiMsgId,
            role: 'model',
            content: '',
            timestamp: new Date(),
            isStreaming: true
        };

        setThreads(prev => prev.map(t => {
            if (t.id === activeThreadId) {
                return { ...t, messages: [...t.messages, aiPlaceholder] };
            }
            return t;
        }));

        // 3. Stream AI Response
        try {
            const currentThread = threads.find(t => t.id === activeThreadId);
            const history = currentThread?.messages.map(m => ({
                role: m.role || 'user',
                parts: m.content
            })) || [];

            let fullContent = "";

            for await (const chunk of chatWithGemini(text, history)) {
                fullContent += chunk;

                setThreads(prev => prev.map(t => {
                    if (t.id === activeThreadId) {
                        return {
                            ...t,
                            messages: t.messages.map(m =>
                                m.id === aiMsgId ? { ...m, content: fullContent } : m
                            )
                        };
                    }
                    return t;
                }));
            }

            // End Streaming
            setThreads(prev => prev.map(t => {
                if (t.id === activeThreadId) {
                    return {
                        ...t,
                        messages: t.messages.map(m =>
                            m.id === aiMsgId ? { ...m, isStreaming: false } : m
                        )
                    };
                }
                return t;
            }));

        } catch (error) {
            console.error("Gemini Error:", error);
            const errorText = "I'm having trouble connecting right now. Please check your API key.";
            setThreads(prev => prev.map(t => {
                if (t.id === activeThreadId) {
                    return {
                        ...t,
                        messages: t.messages.map(m =>
                            m.id === aiMsgId ? { ...m, content: errorText, isStreaming: false } : m
                        )
                    };
                }
                return t;
            }));
        }
    };

    const handleNewThread = (boardId: string) => {
        const newThread: Thread = {
            id: Date.now().toString(),
            boardId,
            title: t('discussion.new_discussion'),
            preview: '...',
            updatedAt: new Date(),
            messages: []
        };
        setThreads([newThread, ...threads]);
        setActiveThreadId(newThread.id);
        setMobileViewMode(ViewMode.MobileChat);
    };

    const handleThreadSelect = (id: string) => {
        setActiveThreadId(id);
        setMainViewMode('chat');
        setMobileViewMode(ViewMode.MobileChat);
    };

    const handleBoardSelect = (boardId: string) => {
        setActiveBoardId(boardId);
        setMainViewMode('board');
        setMobileViewMode(ViewMode.MobileList); // Or equivalent for board
    };

    const handleNewBoard = () => {
        setIsNewBoardModalOpen(true);
    };

    const handleCreateBoard = (boardData: Partial<Board>, template?: BoardTemplate) => {
        if (boardData.name) {
            const newBoardId = Date.now().toString();
            const newBoard: Board = {
                id: newBoardId,
                name: boardData.name,
                description: boardData.description,
                members: boardData.members,
                theme: boardData.theme,
                defaultView: boardData.defaultView
            };
            setBoards([...boards, newBoard]);

            // Switch to new board view
            setActiveBoardId(newBoardId);
            setMainViewMode('board');

            // Persist Default View Preference
            if (boardData.defaultView) {
                localStorage.setItem(`board-default-view-${newBoardId}`, boardData.defaultView);
            }

            // Initialize Template Data
            if (template) {
                try {
                    const mappedColumns = template.columns.map(col => ({
                        id: col.id,
                        label: col.label,
                        type: col.type,
                        width: col.width,
                        minWidth: 100,
                        resizable: true,
                        options: col.options,
                        pinned: col.id === 'name' || col.id === 'select'
                    }));

                    localStorage.setItem(`room-table-columns-v3-${newBoardId}-table`, JSON.stringify(mappedColumns));
                    localStorage.setItem(`room-table-columns-v3-${newBoardId}-default`, JSON.stringify(mappedColumns));

                    if (template.groups.length > 0) {
                        const statusOptions = template.groups.map(g => g.title);
                        localStorage.setItem(`board-statuses-${newBoardId}`, JSON.stringify(statusOptions));
                    }

                } catch (error) {
                    console.error("Failed to initialize template", error);
                }
            } else {
                const defaultColumns = [
                    { id: 'select', label: '', type: 'select', width: 40, pinned: true },
                    { id: 'name', label: 'Task Name', type: 'text', width: 300, pinned: true },
                    { id: 'status', label: 'Status', type: 'status', width: 140 },
                    { id: 'priority', label: 'Priority', type: 'priority', width: 140 },
                    { id: 'dueDate', label: 'Due Date', type: 'date', width: 140 },
                    { id: 'assignees', label: 'Owner', type: 'person', width: 140 }
                ];
                localStorage.setItem(`room-table-columns-v3-${newBoardId}-table`, JSON.stringify(defaultColumns));
                localStorage.setItem(`room-table-columns-v3-${newBoardId}-default`, JSON.stringify(defaultColumns));
            }
        }
    };

    const handleDeleteBoard = (id: string) => {
        if (confirm(t('discussion.delete_board') + '?')) {
            setBoards(boards.filter(b => b.id !== id));
            setThreads(threads.filter(t => t.boardId !== id));
            if (activeThreadId && threads.find(t => t.id === activeThreadId)?.boardId === id) {
                setActiveThreadId(null);
            }
        }
    };

    const handleAddTask = (content: string) => {
        const newTask: Task = { id: Date.now().toString(), content, status: 'todo' };
        setTasks([...tasks, newTask]);
        // Optionally open sidebar if capturing
        if (isCaptureOpen || content) {
            setIsRightSidebarOpen(true);
        }
    };

    const handleUpdateTaskStatus = (taskId: string, status: Task['status']) => {
        setTasks(tasks.map(t => t.id === taskId ? { ...t, status } : t));
    };

    const handleDeleteTask = (taskId: string) => {
        setTasks(tasks.filter(t => t.id !== taskId));
    };

    const handleUpdateTaskDueDate = (taskId: string, date: Date) => {
        setTasks(tasks.map(t => t.id === taskId ? { ...t, dueDate: date } : t));
    };

    const activeThread = threads.find(t => t.id === activeThreadId);

    return (
        <div className="flex h-full w-full overflow-hidden bg-white dark:bg-monday-dark-bg text-gray-900 dark:text-monday-dark-text font-sans">

            {/* Sidebar - Hidden on mobile if viewing chat */}
            <div
                className={`
          flex-shrink-0 h-full w-60
          ${mobileViewMode === ViewMode.MobileChat ? 'hidden md:block' : 'w-full md:w-60'}
        `}
            >
                <Sidebar
                    boards={boards}
                    threads={threads}
                    activeThreadId={activeThreadId}
                    onSelectThread={handleThreadSelect}
                    onNewThread={handleNewThread}
                    onNewBoard={handleNewBoard}
                    onDeleteBoard={handleDeleteBoard}
                    onCapture={() => setIsCaptureOpen(true)}
                    onQuickCapture={handleAddTask}
                    onSelectBoard={handleBoardSelect}
                />
            </div>

            {/* Main Content */}
            <div
                className={`
          flex-1 h-full flex flex-col min-w-0 relative
          ${mobileViewMode === ViewMode.MobileList ? 'hidden md:flex' : 'flex'}
        `}
            >
                <div className="flex flex-1 h-full overflow-hidden">
                    <div className="flex-1 flex flex-col min-w-0">
                        {activeThread ? (
                            <ChatArea
                                thread={activeThread}
                                onSendMessage={handleSendMessage}
                                isStreaming={false}
                                onBack={() => setMobileViewMode(ViewMode.MobileList)}
                                users={MOCK_USERS}
                                onToggleRightSidebar={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
                                isRightSidebarOpen={isRightSidebarOpen}
                            />
                        ) : mainViewMode === 'board' && activeBoardId ? (
                            <React.Suspense fallback={<div className="flex items-center justify-center h-full text-gray-400">Loading Board...</div>}>
                                {(() => {
                                    const board = boards.find(b => b.id === activeBoardId);
                                    const viewType = board?.defaultView === 'list_board' ? 'list' : board?.defaultView || 'table';

                                    // Render appropriate view based on selection
                                    switch (viewType) {
                                        case 'kanban':
                                            return <KanbanBoard boardId={activeBoardId} />;
                                        case 'list':
                                            // Passing props that match Lists.tsx expectations
                                            return <Lists roomId={activeBoardId || 'demo-room'} viewId="list" />;
                                        case 'data_table':
                                            return <DataTable roomId={activeBoardId || 'demo-room'} viewId="data_table" />;
                                        case 'table':
                                        default:
                                            return <RoomTable roomId={activeBoardId || 'demo-room'} viewId={viewType} />;
                                    }
                                })()}
                            </React.Suspense>
                        ) : (
                            <div className="flex-1 flex items-center justify-center bg-white dark:bg-monday-dark-bg text-gray-400">
                                <p className="font-serif italic">{t('discussion.select_conversation')}</p>
                            </div>
                        )}
                    </div>

                    {/* Right Sidebar */}
                    <RightSidebar
                        isOpen={isRightSidebarOpen}
                        tasks={tasks}
                        note={activeNote}
                        onUpdateNote={(content) => setActiveNote({ content })}
                        onAddTask={handleAddTask}
                        onUpdateTaskStatus={handleUpdateTaskStatus}
                        onDeleteTask={handleDeleteTask}
                        onUpdateTaskDueDate={handleUpdateTaskDueDate}
                    />
                </div>
            </div>

            <CaptureModal
                isOpen={isCaptureOpen}
                onClose={() => setIsCaptureOpen(false)}
                onCapture={handleAddTask}
            />

            <NewBoardModal
                isOpen={isNewBoardModalOpen}
                onClose={() => setIsNewBoardModalOpen(false)}
                onCreate={handleCreateBoard}
                availableUsers={MOCK_USERS}
            />
        </div>
    );
}
