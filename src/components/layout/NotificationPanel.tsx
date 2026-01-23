import React, { useState } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { X, UserCircle, ArrowRight, Clock, CheckCircle, EnvelopeSimple, EnvelopeOpen } from 'phosphor-react';
import { Assignment } from '../../services/assignmentService';

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
    const { t, language } = useAppContext();
    const [activeTab, setActiveTab] = useState<'unread' | 'read'>('unread');

    if (!isOpen) return null;

    const formatTimeAgo = (dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (language === 'ar') {
            if (diffInSeconds < 60) return 'الآن';
            if (diffInSeconds < 3600) return `منذ ${Math.floor(diffInSeconds / 60)} دقيقة`;
            if (diffInSeconds < 86400) return `منذ ${Math.floor(diffInSeconds / 3600)} ساعة`;
            if (diffInSeconds < 604800) return `منذ ${Math.floor(diffInSeconds / 86400)} يوم`;
            return date.toLocaleDateString('ar-EG');
        }

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

    // Filter assignments by read/unread status
    const unreadAssignments = assignments.filter(a => !a.isViewed);
    const readAssignments = assignments.filter(a => a.isViewed);
    const displayedAssignments = activeTab === 'unread' ? unreadAssignments : readAssignments;

    return (
        <div className="absolute top-full right-0 rtl:right-auto rtl:left-0 mt-2 w-96 max-h-[520px] bg-white dark:bg-monday-dark-surface rounded-xl shadow-2xl border border-gray-100 dark:border-monday-dark-border z-50 overflow-hidden animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-monday-dark-border bg-gray-50 dark:bg-monday-dark-bg">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-800 dark:text-monday-dark-text">
                        {t('notifications')}
                    </h3>
                    {unreadAssignments.length > 0 && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-monday-blue text-white rounded-full">
                            {unreadAssignments.length}
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

            {/* Tabs */}
            <div className="flex border-b border-gray-100 dark:border-monday-dark-border">
                <button
                    onClick={() => setActiveTab('unread')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${activeTab === 'unread'
                        ? 'text-monday-blue border-b-2 border-monday-blue bg-blue-50/50 dark:bg-blue-900/10'
                        : 'text-gray-500 dark:text-monday-dark-text-secondary hover:bg-gray-50 dark:hover:bg-monday-dark-hover'
                        }`}
                >
                    <EnvelopeSimple size={16} />
                    {t('unread')}
                    {unreadAssignments.length > 0 && (
                        <span className={`px-1.5 py-0.5 text-xs rounded-full ${activeTab === 'unread' ? 'bg-monday-blue text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                            }`}>
                            {unreadAssignments.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('read')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${activeTab === 'read'
                        ? 'text-monday-blue border-b-2 border-monday-blue bg-blue-50/50 dark:bg-blue-900/10'
                        : 'text-gray-500 dark:text-monday-dark-text-secondary hover:bg-gray-50 dark:hover:bg-monday-dark-hover'
                        }`}
                >
                    <EnvelopeOpen size={16} />
                    {t('read')}
                    {readAssignments.length > 0 && (
                        <span className={`px-1.5 py-0.5 text-xs rounded-full ${activeTab === 'read' ? 'bg-monday-blue text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                            }`}>
                            {readAssignments.length}
                        </span>
                    )}
                </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[380px]">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-monday-blue"></div>
                    </div>
                ) : displayedAssignments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-monday-dark-text-secondary">
                        <CheckCircle size={48} weight="light" className="mb-3 opacity-50" />
                        <p className="text-sm">
                            {activeTab === 'unread' ? t('no_notifications') : t('no_notifications')}
                        </p>
                        <p className="text-xs mt-1 opacity-70">
                            {activeTab === 'unread' ? t('no_urgent_tasks') : t('no_recent_history')}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-monday-dark-border">
                        {displayedAssignments.map((assignment) => (
                            <div
                                key={assignment.id}
                                className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-monday-dark-hover cursor-pointer transition-colors ${!assignment.isViewed ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
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
                                            {language === 'ar' ? 'عيّن لك: ' : 'assigned you: '} <span className="font-medium text-gray-800 dark:text-monday-dark-text">{getTaskName(assignment)}</span>
                                        </p>
                                        <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400 dark:text-monday-dark-text-secondary">
                                            <Clock size={12} />
                                            <span className="font-datetime">{formatTimeAgo(assignment.createdAt)}</span>
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
