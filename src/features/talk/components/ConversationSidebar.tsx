import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAppContext } from '../../../contexts/AppContext';
import { useAuth } from '../../../auth-adapter';
import { boardService } from '../../../services/boardService';
import { talkService } from '../../../services/talkService';
import { talkLogger } from '../../../utils/logger';
import {
    Plus,
    CheckSquare,
    Bell,
    Folder,
    CircleNotch,
    File,
    Trash,
    ArrowSquareOut,
    X,
    Clock,
    Check,
    Upload,
    Eye
} from 'phosphor-react';
import { TalkFileUploadModal } from './TalkFileUploadModal';
import { vaultService } from '../../../services/vaultService';

interface ConversationTask {
    id: string;
    name: string;
    status: 'pending' | 'in_progress' | 'completed';
    createdAt: string;
    sentToBoard?: {
        boardId: string;
        boardName: string;
    };
}

interface ConversationReminder {
    id: string;
    text: string;
    dueDate: string;
    completed: boolean;
    createdAt: string;
}

interface ConversationFile {
    id: string;
    name: string;
    type: string;
    size: number;
    url?: string;
    taskId?: string;
    createdAt: string;
}

interface Board {
    id: string;
    name: string;
}

interface ConversationSidebarProps {
    conversationId: string | null;
    onNavigate?: (view: string, boardId?: string) => void;
}

const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
    conversationId,
    onNavigate
}) => {
    const { t, activeWorkspaceId, language } = useAppContext();
    const { getToken } = useAuth();

    // State for conversation data
    const [tasks, setTasks] = useState<ConversationTask[]>([]);
    const [reminders, setReminders] = useState<ConversationReminder[]>([]);
    const [files, setFiles] = useState<ConversationFile[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);

    // UI State
    const [showAddTask, setShowAddTask] = useState(false);
    const [showAddReminder, setShowAddReminder] = useState(false);
    const [newTaskName, setNewTaskName] = useState('');
    const [newReminderText, setNewReminderText] = useState('');
    const [newReminderDate, setNewReminderDate] = useState('');

    // Send to board modal
    const [showSendToBoardModal, setShowSendToBoardModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState<ConversationTask | null>(null);
    const [boards, setBoards] = useState<Board[]>([]);
    const [selectedBoardId, setSelectedBoardId] = useState<string>('');
    const [isSending, setIsSending] = useState(false);
    const [loadingBoards, setLoadingBoards] = useState(false);

    // File Upload / Assign
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [assigningTaskId, setAssigningTaskId] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [showFileUploadModal, setShowFileUploadModal] = useState(false);

    // Load conversation data from backend
    const loadConversationData = useCallback(async () => {
        if (!conversationId) {
            setTasks([]);
            setReminders([]);
            setFiles([]);
            return;
        }

        try {
            const token = await getToken();
            if (!token) return;

            const data = await talkService.getConversationData(token, conversationId);
            setTasks(data.tasks);
            setReminders(data.reminders);
            setFiles(data.files);
        } catch (error) {
            talkLogger.error('Failed to load conversation data:', error);
        }
    }, [conversationId, getToken]);

    // Initial load and polling
    useEffect(() => {
        const init = async () => {
            setIsLoadingData(true);
            await loadConversationData();
            setIsLoadingData(false);
        };
        init();

        const interval = setInterval(loadConversationData, 3000);
        return () => clearInterval(interval);
    }, [loadConversationData]);

    // Load boards for send to board modal
    const loadBoards = useCallback(async () => {
        setLoadingBoards(true);
        try {
            const token = await getToken();
            if (!token) return;

            const boardsList = await boardService.getAllBoards(token, activeWorkspaceId || undefined);
            setBoards(boardsList);
        } catch (error) {
            talkLogger.error('Failed to load boards:', error);
        } finally {
            setLoadingBoards(false);
        }
    }, [getToken, activeWorkspaceId]);

    // Add new task
    const handleAddTask = async () => {
        if (!newTaskName.trim() || !conversationId) return;

        try {
            const token = await getToken();
            if (!token) return;

            const task = await talkService.createTask(token, conversationId, newTaskName.trim());
            setTasks(prev => [...prev, task]);
            setNewTaskName('');
            setShowAddTask(false);
        } catch (error) {
            talkLogger.error('Failed to create task:', error);
        }
    };

    // Add new reminder
    const handleAddReminder = async () => {
        if (!newReminderText.trim() || !conversationId) return;

        try {
            const token = await getToken();
            if (!token) return;

            const reminder = await talkService.createReminder(
                token,
                conversationId,
                newReminderText.trim(),
                newReminderDate || new Date().toISOString()
            );
            setReminders(prev => [...prev, reminder]);
            setNewReminderText('');
            setNewReminderDate('');
            setShowAddReminder(false);
        } catch (error) {
            talkLogger.error('Failed to create reminder:', error);
        }
    };

    // Toggle task status
    const toggleTaskStatus = async (taskId: string, currentStatus: string) => {
        try {
            const token = await getToken();
            if (!token) return;

            const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
            const updated = await talkService.updateTask(token, taskId, { status: newStatus });
            setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
        } catch (error) {
            talkLogger.error('Failed to toggle task:', error);
        }
    };

    // Toggle reminder completed
    const toggleReminderCompleted = async (reminderId: string, currentCompleted: boolean) => {
        try {
            const token = await getToken();
            if (!token) return;

            const updated = await talkService.updateReminder(token, reminderId, { completed: !currentCompleted });
            setReminders(prev => prev.map(r => r.id === reminderId ? updated : r));
        } catch (error) {
            talkLogger.error('Failed to toggle reminder:', error);
        }
    };

    // Delete task
    const deleteTask = async (taskId: string) => {
        try {
            const token = await getToken();
            if (!token) return;

            await talkService.deleteTask(token, taskId);
            setTasks(prev => prev.filter(t => t.id !== taskId));
        } catch (error) {
            talkLogger.error('Failed to delete task:', error);
        }
    };

    // Delete reminder
    const deleteReminder = async (reminderId: string) => {
        try {
            const token = await getToken();
            if (!token) return;

            await talkService.deleteReminder(token, reminderId);
            setReminders(prev => prev.filter(r => r.id !== reminderId));
        } catch (error) {
            talkLogger.error('Failed to delete reminder:', error);
        }
    };

    // Open send to board modal
    const openSendToBoardModal = (task: ConversationTask) => {
        setSelectedTask(task);
        setShowSendToBoardModal(true);
        loadBoards();
    };

    // Send task to board
    const handleSendToBoard = async () => {
        if (!selectedTask || !selectedBoardId) return;

        setIsSending(true);
        try {
            const token = await getToken();
            if (!token) return;

            const board = boards.find(b => b.id === selectedBoardId);
            if (!board) return;

            const boardData = await boardService.getBoard(token, selectedBoardId);
            const existingTasks = boardData.tasks ?
                (typeof boardData.tasks === 'string' ? JSON.parse(boardData.tasks) : boardData.tasks) : [];

            const newBoardTask = {
                id: `task-${Date.now()}`,
                name: selectedTask.name,
                status: 'To Do',
                createdAt: new Date().toISOString()
            };

            await boardService.updateBoard(token, selectedBoardId, {
                tasks: JSON.stringify([...existingTasks, newBoardTask]) as any
            });

            // Update on backend
            const updated = await talkService.updateTask(token, selectedTask.id, {
                boardId: selectedBoardId,
                boardName: board.name
            });
            setTasks(prev => prev.map(t => t.id === selectedTask.id ? updated : t));

            setShowSendToBoardModal(false);
            setSelectedTask(null);
            setSelectedBoardId('');
        } catch (error) {
            talkLogger.error('Failed to send task to board:', error);
        } finally {
            setIsSending(false);
        }
    };

    // File Upload
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setShowFileUploadModal(true);
        }
    };

    const handleFileUploadConfirm = async (data: { name: string; saveToVault: boolean; folderId?: string }) => {
        if (!selectedFile || !conversationId) return;

        try {
            const token = await getToken();
            if (!token) return;

            let fileUrl = '';

            // 1. Read file as base64 for preview and upload
            const reader = new FileReader();
            reader.onload = async () => {
                const base64Content = reader.result as string;

                // 2. Optional: Save to Vault
                if (data.saveToVault) {
                    try {
                        const vaultItem = await vaultService.create(token, {
                            title: data.name,
                            type: selectedFile.type.startsWith('image/') ? 'image' : 'document',
                            userId: 'current-user', // Service handles this usually but good to be explicit if needed
                            folderId: data.folderId,
                            content: base64Content,
                            previewUrl: selectedFile.type.startsWith('image/') ? base64Content : undefined,
                            metadata: {
                                size: selectedFile.size,
                                mimeType: selectedFile.type
                            }
                        });
                        fileUrl = vaultItem.previewUrl || ''; // Use vault preview URL if available
                    } catch (vaultError) {
                        talkLogger.error('Failed to save to vault:', vaultError);
                    }
                }

                // 3. Create file record in Talk (accessible to all participants)
                // We send the base64 content or a placeholder URL so others can see it
                const newFile = await talkService.createFile(token, conversationId, {
                    name: data.name,
                    type: selectedFile.type,
                    size: selectedFile.size,
                    url: base64Content, // For demo/mock, we pass base64 as the URL so all users can see it
                    taskId: assigningTaskId || undefined
                });

                setFiles(prev => [...prev, newFile]);
                setAssigningTaskId(null);
                setSelectedFile(null);
            };

            reader.readAsDataURL(selectedFile);
        } catch (error) {
            talkLogger.error('Failed to upload file:', error);
        }
    };

    const handleFilePreview = (file: ConversationFile) => {
        if (!file.url) return;

        // Simple quick display: open in new tab or modal
        if (file.type.startsWith('image/')) {
            const win = window.open();
            win?.document.write(`<img src="${file.url}" style="max-width:100%; height:auto;" />`);
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.type === 'application/vnd.ms-excel') {
            // For Excel, we'd ideally use a library, but for "quick display" we can try to download or show Info
            alert(`Quick Display: ${file.name}\nSize: ${(file.size / 1024).toFixed(1)} KB\nType: Excel Document`);
        } else {
            const win = window.open();
            win?.document.write(`<iframe src="${file.url}" style="width:100%; height:100vh;" frameborder="0"></iframe>`);
        }
    };

    // Format date
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.toDateString() === today.toDateString()) return t('today');
        if (date.toDateString() === tomorrow.toDateString()) return t('tomorrow');
        return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' });
    };

    const isOverdue = (dateStr: string) => new Date(dateStr) < new Date();

    if (!conversationId) {
        return (
            <aside className="w-72 border-s flex-col h-full bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 flex shrink-0" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                <div className="flex-1 flex items-center justify-center text-center p-6 text-gray-400">
                    <div>
                        <CheckSquare size={36} className="mx-auto mb-3" />
                        <p className="text-sm">{t('select_conversation_to_see_data')}</p>
                    </div>
                </div>
            </aside>
        );
    }

    return (
        <>
            <aside className="w-72 border-s flex-col h-full bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 flex shrink-0 transition-all" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                {/* Tasks Section */}
                <div className="flex-1 border-b flex flex-col min-h-0 border-gray-200 dark:border-gray-800">
                    <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
                        <h3 className="font-medium text-sm text-gray-700 dark:text-gray-300 flex items-center">
                            <CheckSquare className="me-2" size={16} />
                            {t('tasks')}
                        </h3>
                        <button onClick={() => setShowAddTask(true)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white">
                            <Plus size={16} />
                        </button>
                    </div>
                    <div className="p-3 space-y-1 overflow-y-auto flex-1">
                        {showAddTask && (
                            <div className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg mb-2">
                                <input
                                    type="text"
                                    value={newTaskName}
                                    onChange={(e) => setNewTaskName(e.target.value)}
                                    placeholder={t('task_name_placeholder')}
                                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border rounded focus:outline-none"
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                                />
                                <div className="flex gap-2 mt-2">
                                    <button onClick={() => setShowAddTask(false)} className="flex-1 py-1.5 text-xs text-gray-500">{t('cancel')}</button>
                                    <button onClick={handleAddTask} disabled={!newTaskName.trim()} className="flex-1 py-1.5 text-xs bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded">{t('add')}</button>
                                </div>
                            </div>
                        )}

                        {tasks.length === 0 && !showAddTask ? (
                            <div className="text-gray-400 text-center py-6">
                                <CheckSquare size={28} className="mx-auto mb-2" />
                                <p className="text-xs">{t('no_tasks')}</p>
                            </div>
                        ) : (
                            tasks.map(task => (
                                <div key={task.id} className="group p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                    <div className="flex items-start gap-2">
                                        <button
                                            onClick={() => toggleTaskStatus(task.id, task.status)}
                                            className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center ${task.status === 'completed' ? 'bg-gray-900 dark:bg-white' : 'border-gray-300'
                                                }`}
                                        >
                                            {task.status === 'completed' && <Check size={10} className="text-white dark:text-gray-900" weight="bold" />}
                                        </button>
                                        <div className="flex-1 min-w-0 text-start">
                                            <p className={`text-sm truncate ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                                {task.name}
                                            </p>
                                            {task.sentToBoard && (
                                                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><ArrowSquareOut size={10} /> {task.boardName}</p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                                            <button
                                                onClick={() => {
                                                    setAssigningTaskId(task.id);
                                                    fileInputRef.current?.click();
                                                }}
                                                className="p-1 text-gray-400 hover:text-gray-700"
                                                title={t('attachment')}
                                            >
                                                <Plus size={14} />
                                            </button>
                                            {!task.sentToBoard && task.status !== 'completed' && (
                                                <button onClick={() => openSendToBoardModal(task)} className="p-1 text-gray-400 hover:text-gray-700" title={t('send_to_board')}><ArrowSquareOut size={14} /></button>
                                            )}
                                            <button onClick={() => deleteTask(task.id)} className="p-1 text-gray-400 hover:text-red-500" title={t('delete')}><Trash size={14} /></button>
                                        </div>
                                    </div>
                                    {/* Related Files */}
                                    {files.filter(f => f.taskId === task.id).map(file => (
                                        <div
                                            key={file.id}
                                            className="ms-6 mt-1 flex items-center justify-between gap-1.5 text-xs text-gray-500 bg-gray-50 dark:bg-gray-800/80 px-2 py-1 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 group/file"
                                            onClick={() => handleFilePreview(file)}
                                        >
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <File size={10} />
                                                <span className="truncate">{file.name}</span>
                                            </div>
                                            <Eye size={10} className="opacity-0 group-hover/file:opacity-100" />
                                        </div>
                                    ))}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Reminders Section */}
                <div className="flex-1 border-b flex flex-col min-h-0 border-gray-200 dark:border-gray-800">
                    <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
                        <h3 className="font-medium text-sm text-gray-700 dark:text-gray-300 flex items-center">
                            <Bell className="me-2" size={16} />
                            {t('reminders')}
                        </h3>
                        <button onClick={() => setShowAddReminder(true)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white">
                            <Plus size={16} />
                        </button>
                    </div>
                    <div className="p-3 space-y-1 overflow-y-auto flex-1">
                        {showAddReminder && (
                            <div className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg mb-2">
                                <input
                                    type="text"
                                    value={newReminderText}
                                    onChange={(e) => setNewReminderText(e.target.value)}
                                    placeholder={t('reminders')}
                                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border rounded focus:outline-none mb-2"
                                />
                                <input
                                    type="datetime-local"
                                    value={newReminderDate}
                                    onChange={(e) => setNewReminderDate(e.target.value)}
                                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border rounded focus:outline-none"
                                />
                                <div className="flex gap-2 mt-2">
                                    <button onClick={() => setShowAddReminder(false)} className="flex-1 py-1.5 text-xs text-gray-500">{t('cancel')}</button>
                                    <button onClick={handleAddReminder} disabled={!newReminderText.trim()} className="flex-1 py-1.5 text-xs bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded">{t('add')}</button>
                                </div>
                            </div>
                        )}
                        {reminders.length === 0 && !showAddReminder ? (
                            <div className="text-gray-400 text-center py-6">
                                <Bell size={28} className="mx-auto mb-2" />
                                <p className="text-xs">{t('no_reminders')}</p>
                            </div>
                        ) : (
                            reminders.map(reminder => (
                                <div key={reminder.id} className="group p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                    <div className="flex items-start gap-2">
                                        <button
                                            onClick={() => toggleReminderCompleted(reminder.id, reminder.completed)}
                                            className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center ${reminder.completed ? 'bg-gray-900 dark:bg-white' : 'border-gray-300'
                                                }`}
                                        >
                                            {reminder.completed && <Check size={10} className="text-white dark:text-gray-900" weight="bold" />}
                                        </button>
                                        <div className="flex-1 min-w-0 text-start">
                                            <p className={`text-sm truncate ${reminder.completed ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                                {reminder.text}
                                            </p>
                                            <p className={`text-xs flex items-center gap-1 mt-0.5 ${isOverdue(reminder.dueDate) && !reminder.completed ? 'text-red-500' : 'text-gray-400'}`}>
                                                <Clock size={10} /> <span className="font-datetime">{formatDate(reminder.dueDate)}</span>
                                            </p>
                                        </div>
                                        <button onClick={() => deleteReminder(reminder.id)} className="p-1 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-500"><Trash size={14} /></button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Files Section */}
                <div className="flex-1 flex flex-col min-h-0">
                    <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
                        <h3 className="font-medium text-sm text-gray-700 dark:text-gray-300 flex items-center">
                            <Folder className="me-2" size={16} />
                            {t('folders')}
                        </h3>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-1 text-[10px] font-bold text-primary hover:underline uppercase tracking-wider"
                            >
                                <Upload size={12} weight="bold" />
                                {t('upload')}
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={handleFileSelect}
                            />
                        </div>
                    </div>
                    <div className="p-3 space-y-1 overflow-y-auto flex-1">
                        {files.filter(f => !f.taskId).length === 0 ? (
                            <div className="text-gray-400 text-center py-6">
                                <File size={28} className="mx-auto mb-2" />
                                <p className="text-xs">{t('no_files')}</p>
                            </div>
                        ) : (
                            files.filter(f => !f.taskId).map(file => (
                                <div
                                    key={file.id}
                                    className="flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer group/file"
                                    onClick={() => handleFilePreview(file)}
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <File size={16} className="text-gray-400" />
                                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate text-start">{file.name}</span>
                                    </div>
                                    <Eye size={14} className="text-gray-400 opacity-0 group-hover/file:opacity-100" />
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </aside>

            {/* File Upload Modal */}
            <TalkFileUploadModal
                isOpen={showFileUploadModal}
                onClose={() => {
                    setShowFileUploadModal(false);
                    setSelectedFile(null);
                }}
                file={selectedFile}
                onConfirm={handleFileUploadConfirm}
            />

            {/* Send to Board Modal */}
            {showSendToBoardModal && selectedTask && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                    <div className="fixed inset-0" onClick={() => setShowSendToBoardModal(false)} />

                    <div className="bg-white dark:bg-monday-dark-surface p-5 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] max-w-sm w-full m-4 border border-gray-200 dark:border-monday-dark-border relative z-10 scale-in-center">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-base font-bold text-gray-900 dark:text-white">{t('send_to_board')}</h3>
                            <button onClick={() => setShowSendToBoardModal(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                        </div>

                        <div className="mb-4 p-3 bg-gray-50 dark:bg-monday-dark-bg rounded-lg border border-gray-100 dark:border-monday-dark-border text-start">
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">{t('task')}</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedTask.name}</p>
                        </div>

                        <p className="text-xs font-semibold text-gray-500 mb-2 text-start">{t('select_board_desc')}</p>

                        {loadingBoards ? (
                            <div className="flex items-center justify-center py-6"><CircleNotch size={20} className="animate-spin text-primary" /></div>
                        ) : boards.length === 0 ? (
                            <div className="text-center py-4 text-sm text-gray-500">{t('no_boards_available')}</div>
                        ) : (
                            <div className="max-h-40 overflow-y-auto mb-4 space-y-1 custom-scrollbar">
                                {boards.map(board => (
                                    <button
                                        key={board.id}
                                        onClick={() => setSelectedBoardId(board.id)}
                                        className={`w-full flex items-center p-2.5 rounded-lg transition-all text-start text-sm ${selectedBoardId === board.id ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                                            }`}
                                    >
                                        <div className={`w-2 h-2 rounded-full me-2.5 ${selectedBoardId === board.id ? 'bg-primary' : 'bg-gray-300'}`} />
                                        {board.name}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="flex gap-2 pt-4 border-t border-gray-100 dark:border-monday-dark-border">
                            <button
                                onClick={() => setShowSendToBoardModal(false)}
                                className="flex-1 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors border border-transparent"
                            >
                                {t('cancel')}
                            </button>
                            <button
                                onClick={handleSendToBoard}
                                disabled={!selectedBoardId || isSending}
                                className="flex-1 py-2.5 text-sm font-bold bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-primary/20"
                            >
                                {isSending ? <CircleNotch size={14} className="animate-spin" /> : <><ArrowSquareOut size={16} weight="bold" /> {t('send')}</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .scale-in-center { animation: scale-in-center 0.15s cubic-bezier(0.250, 0.460, 0.450, 0.940) both; }
                @keyframes scale-in-center { 0% { transform: scale(0.95); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 10px; }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #374151; }
            `}</style>
        </>
    );
};

export default ConversationSidebar;
