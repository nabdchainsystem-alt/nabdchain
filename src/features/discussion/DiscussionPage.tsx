import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { RightSidebar } from './components/RightSidebar';
import { CaptureModal } from './components/CaptureModal';
import { NewGroupModal } from './components/NewGroupModal';
import { Board, Task as GlobalTask } from '../../types';
import { Thread, Message, ViewMode, Task, Note } from './types';
import { BoardTemplate } from '../board/data/templates';

import { useLanguage } from '../../contexts/LanguageContext';
import { useUI } from '../../contexts/UIContext';
import { useAuth } from '@clerk/clerk-react';

import KanbanBoard from '../board/views/Kanban/KanbanBoard';
import RoomTable from '../board/views/Table/RoomTable';
import DataTable from '../board/views/Table/DataTable';
import Lists from '../board/views/List/Lists';

import { boardService } from '../../services/boardService';
import { discussionService } from '../../services/discussionService';

// Mock Users for UI display
const MOCK_USERS = [
    { id: 'u1', name: 'Alex Rivera', avatar: '', initials: 'AR', status: 'online' as const },
    { id: 'u2', name: 'Sarah Chen', avatar: '', initials: 'SC', status: 'busy' as const },
    { id: 'u3', name: 'Mike Ross', avatar: '', initials: 'MR', status: 'online' as const },
];

interface DiscussionPageProps {
    groups?: Board[];
    onGroupCreated?: (group: Board) => void | Promise<void>;
    onGroupDeleted?: (id: string) => void | Promise<void>;
    logActivity?: (type: string, content: string, metadata?: any, workspaceId?: string, boardId?: string) => Promise<void>;
}

export default function DiscussionPage({ groups: globalGroups, onGroupCreated, onGroupDeleted, logActivity }: DiscussionPageProps) {
    const { language, t } = useLanguage();
    const { theme } = useUI();
    const { getToken, isSignedIn } = useAuth();

    const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
    const [isCaptureOpen, setIsCaptureOpen] = useState(false);
    const [isNewBoardModalOpen, setIsNewBoardModalOpen] = useState(false);

    // Data State (Filtered to only show "discussion" type)
    const [groups, setGroups] = useState<Board[]>(globalGroups?.filter(b => b.type === 'discussion') || []);
    const [threads, setThreads] = useState<Thread[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [activeNote, setActiveNote] = useState<Note>({ content: '' });

    const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
    const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
    const [mainViewMode, setMainViewMode] = useState<'chat' | 'board'>('chat');

    // Responsive Mobile View State
    const [mobileViewMode, setMobileViewMode] = useState<ViewMode>(ViewMode.MobileList);

    // Sync with global groups
    useEffect(() => {
        if (globalGroups) {
            setGroups(globalGroups.filter(b => b.type === 'discussion'));
        }
    }, [globalGroups]);

    // Fetch Initial Data (Threads)
    useEffect(() => {
        const loadThreads = async () => {
            if (!isSignedIn) return;
            try {
                const token = await getToken();
                if (!token) return;

                const fetchedThreads = await discussionService.getThreads(token);
                setThreads(fetchedThreads);

                if (fetchedThreads.length > 0 && !activeThreadId) {
                    setActiveThreadId(fetchedThreads[0].id);
                }
            } catch (error) {
                console.error("Failed to load initial threads", error);
            }
        };
        loadThreads();
    }, [isSignedIn, getToken]);

    const handleSendMessage = async (text: string) => {
        if (!activeThreadId) return;

        const currentThread = threads.find(t => t.id === activeThreadId);
        if (!currentThread) return;

        const newMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
            timestamp: new Date()
        };

        const updatedThread = {
            ...currentThread,
            messages: [...currentThread.messages, newMessage],
            updatedAt: new Date(),
            preview: text
        };

        setThreads(prev => prev.map(t => t.id === activeThreadId ? updatedThread : t));

        try {
            const token = await getToken();
            if (token) {
                await discussionService.updateThread(token, updatedThread);
                if (logActivity) {
                    logActivity('MESSAGE_SENT', `Sent message: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`, { threadId: activeThreadId });
                }
            }
        } catch (error) {
            console.error("Failed to send message", error);
        }
    };

    const handleNewThread = async (boardId: string) => {
        const newThreadData = {
            boardId,
            title: t('discussion.new_discussion'),
            preview: '...',
            messages: []
        };

        try {
            const token = await getToken();
            if (token) {
                const newThread = await discussionService.createThread(token, newThreadData as Thread);
                setThreads([newThread, ...threads]);
                setActiveThreadId(newThread.id);
                setMobileViewMode(ViewMode.MobileChat);
                if (logActivity) {
                    const board = groups.find(g => g.id === boardId);
                    logActivity('THREAD_CREATED', `Started new discussion in ${board?.name || 'group'}`, { boardId, threadId: newThread.id });
                }
            }
        } catch (error) {
            console.error("Failed to create new thread", error);
        }
    };

    const handleThreadSelect = (id: string) => {
        setActiveThreadId(id);
        setMainViewMode('chat');
        setMobileViewMode(ViewMode.MobileChat);
    };

    const handleGroupSelect = (groupId: string) => {
        setActiveBoardId(groupId);
        setMainViewMode('board');
        setMobileViewMode(ViewMode.MobileList);
    };

    const handleNewGroup = () => {
        setIsNewBoardModalOpen(true);
    };

    const handleCreateGroup = async (groupData: Partial<Board>, template?: BoardTemplate) => {
        if (groupData.name) {
            const newGroupPayload: Partial<Board> = {
                name: groupData.name,
                description: groupData.description,
                type: 'discussion',
                defaultView: (groupData.defaultView as any) || 'table',
            };

            try {
                const token = await getToken();
                if (token) {
                    const newGroup = await boardService.createBoard(token, newGroupPayload);
                    if (onGroupCreated) {
                        onGroupCreated(newGroup);
                    } else {
                        setGroups([...groups, newGroup]);
                    }

                    if (logActivity) {
                        logActivity('GROUP_CREATED', `Created discussion group: ${newGroup.name}`, { boardId: newGroup.id }, newGroup.workspaceId, newGroup.id);
                    }

                    setActiveBoardId(newGroup.id);
                    setMainViewMode('board');

                    localStorage.setItem(`board-default-view-${newGroup.id}`, groupData.defaultView || 'table');

                    if (template) {
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

                        localStorage.setItem(`room-table-columns-v3-${newGroup.id}-table`, JSON.stringify(mappedColumns));
                        localStorage.setItem(`room-table-columns-v3-${newGroup.id}-default`, JSON.stringify(mappedColumns));

                        if (template.groups.length > 0) {
                            const statusOptions = template.groups.map(g => g.title);
                            localStorage.setItem(`board-statuses-${newGroup.id}`, JSON.stringify(statusOptions));
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
                        localStorage.setItem(`room-table-columns-v3-${newGroup.id}-table`, JSON.stringify(defaultColumns));
                        localStorage.setItem(`room-table-columns-v3-${newGroup.id}-default`, JSON.stringify(defaultColumns));
                    }
                }
            } catch (error) {
                console.error("Failed to create group", error);
            }
        }
    };

    const handleDeleteGroup = async (id: string) => {
        if (confirm(t('discussion.delete_board') + '?')) {
            try {
                const token = await getToken();
                if (token) {
                    await boardService.deleteBoard(token, id);
                    if (onGroupDeleted) {
                        onGroupDeleted(id);
                    } else {
                        setGroups(groups.filter(b => b.id !== id));
                    }

                    if (logActivity) {
                        const group = groups.find(g => g.id === id);
                        logActivity('GROUP_DELETED', `Deleted discussion group: ${group?.name || 'group'}`, { boardId: id }, group?.workspaceId, id);
                    }

                    setThreads(threads.filter(t => t.boardId !== id));
                    if (activeThreadId && threads.find(t => t.id === activeThreadId)?.boardId === id) {
                        setActiveThreadId(null);
                    }
                }
            } catch (error) {
                console.error("Failed to delete group", error);
            }
        }
    };

    const handleAddTask = (content: string) => {
        const newTask: Task = { id: Date.now().toString(), content, status: 'todo' };
        setTasks([...tasks, newTask]);
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
            <div
                className={`
              flex-shrink-0 h-full w-60
              ${mobileViewMode === ViewMode.MobileChat ? 'hidden md:block' : 'w-full md:w-60'}
            `}
            >
                <Sidebar
                    groups={groups}
                    threads={threads}
                    activeThreadId={activeThreadId}
                    onSelectThread={handleThreadSelect}
                    onNewThread={handleNewThread}
                    onNewGroup={handleNewGroup}
                    onSelectGroup={handleGroupSelect}
                    onDeleteGroup={handleDeleteGroup}
                    onCapture={() => setIsCaptureOpen(true)}
                    onQuickCapture={handleAddTask}
                />
            </div>

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
                            <React.Suspense fallback={<div className="flex items-center justify-center h-full text-gray-400">Loading Group...</div>}>
                                {(() => {
                                    const group = groups.find(b => b.id === activeBoardId);
                                    const viewType = group?.defaultView === 'list_board' ? 'list' : group?.defaultView || 'table';

                                    switch (viewType) {
                                        case 'kanban':
                                            return <KanbanBoard boardId={activeBoardId} />;
                                        case 'list':
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

            <NewGroupModal
                isOpen={isNewBoardModalOpen}
                onClose={() => setIsNewBoardModalOpen(false)}
                onCreate={handleCreateGroup}
                availableUsers={MOCK_USERS}
            />
        </div>
    );
}
