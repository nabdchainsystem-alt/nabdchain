import React from 'react';
import { X, UserCircle, ArrowRight, Clock, CheckCircle } from 'phosphor-react';
import { Assignment } from '../../services/assignmentService';
import { useAppContext } from '../../contexts/AppContext';

interface NotificationPanelProps {
    isOpen: boolean;
    onClose: () => void;
    assignments: Assignment[];
    onViewAssignment: (assignment: Assignment) => void;
    isLoading?: boolean;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
    isOpen,
    onClose,
    assignments,
    onViewAssignment,
    isLoading = false
}) => {
    const { t } = useAppContext();

    if (!isOpen) return null;

    const formatTimeAgo = (dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        return date.toLocaleDateString();
    };

    const getTaskName = (assignment: Assignment): string => {
        const taskData = assignment.sourceTaskData;
        return (taskData?.name as string) || (taskData?.title as string) || 'Untitled Task';
    };

    return (
        <div className="absolute top-full right-0 rtl:right-auto rtl:left-0 mt-2 w-96 max-h-[480px] bg-white dark:bg-monday-dark-surface rounded-xl shadow-2xl border border-gray-100 dark:border-monday-dark-border z-50 overflow-hidden animate-fadeIn">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-monday-dark-border bg-gray-50 dark:bg-monday-dark-bg">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-800 dark:text-monday-dark-text">
                            Assigned to You
                        </h3>
                        {assignments.length > 0 && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-monday-blue text-white rounded-full">
                                {assignments.length}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-monday-dark-hover rounded-md transition-colors"
                    >
                        <X size={18} className="text-gray-500 dark:text-monday-dark-text-secondary" />
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto max-h-[400px]">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-monday-blue"></div>
                        </div>
                    ) : assignments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-monday-dark-text-secondary">
                            <CheckCircle size={48} weight="light" className="mb-3 opacity-50" />
                            <p className="text-sm">No new assignments</p>
                            <p className="text-xs mt-1 opacity-70">You're all caught up!</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100 dark:divide-monday-dark-border">
                            {assignments.map((assignment) => (
                                <div
                                    key={assignment.id}
                                    className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-monday-dark-hover cursor-pointer transition-colors ${
                                        !assignment.isViewed ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                                    }`}
                                    onClick={() => onViewAssignment(assignment)}
                                >
                                    <div className="flex items-start gap-3">
                                        {/* Avatar */}
                                        <div className="flex-shrink-0">
                                            {assignment.assignedFromUser.avatarUrl ? (
                                                <img
                                                    src={assignment.assignedFromUser.avatarUrl}
                                                    alt={assignment.assignedFromUser.name || 'User'}
                                                    className="w-10 h-10 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center">
                                                    <UserCircle size={24} weight="fill" className="text-white" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-sm text-gray-800 dark:text-monday-dark-text truncate">
                                                    {assignment.assignedFromUser.name || assignment.assignedFromUser.email}
                                                </span>
                                                {!assignment.isViewed && (
                                                    <span className="w-2 h-2 bg-monday-blue rounded-full flex-shrink-0"></span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-monday-dark-text-secondary mt-0.5">
                                                assigned you: <span className="font-medium text-gray-800 dark:text-monday-dark-text">{getTaskName(assignment)}</span>
                                            </p>
                                            <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400 dark:text-monday-dark-text-secondary">
                                                <Clock size={12} />
                                                <span>{formatTimeAgo(assignment.createdAt)}</span>
                                            </div>
                                        </div>

                                        {/* Arrow */}
                                        <ArrowRight size={16} className="text-gray-400 dark:text-monday-dark-text-secondary flex-shrink-0 mt-2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
        </div>
    );
};
