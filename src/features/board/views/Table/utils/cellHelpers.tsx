import React from 'react';
import {
    CheckCircle,
    Clock,
    Circle,
    XCircle,
    WarningCircle,
    CircleDashed,
    FileText
} from 'phosphor-react';
import { getPriorityClasses, normalizePriority, PriorityLevel } from '../../../../priorities/priorityUtils';

/**
 * Get the appropriate icon for a status value
 */
export const getStatusIcon = (status: string): React.ReactNode => {
    switch (status) {
        case 'Done':
            return <CheckCircle size={14} className="text-emerald-600" />;
        case 'In Progress':
            return <Clock size={14} className="text-blue-600" />;
        case 'To Do':
            return <Circle size={14} className="text-stone-400" />;
        case 'Rejected':
            return <XCircle size={14} className="text-red-500" />;
        case 'Stuck':
            return <WarningCircle size={14} className="text-orange-500" />;
        default:
            return <CircleDashed size={14} className="text-stone-400" />;
    }
};

/**
 * Format priority label using normalization
 */
export const formatPriorityLabel = (value: string | null): PriorityLevel | null => {
    return normalizePriority(value);
};

/**
 * Get priority text color class
 */
export const getPriorityColor = (priority: string | null): string => {
    return getPriorityClasses(priority).text;
};

/**
 * Get priority dot color class
 */
export const getPriorityDot = (priority: string | null): string => {
    return getPriorityClasses(priority).dot;
};

/**
 * Get file icon based on extension/mime type
 */
export const getFileIcon = (filename: string, mimeType?: string): React.ReactNode => {
    const ext = filename?.split('.').pop()?.toLowerCase();
    const mime = mimeType?.toLowerCase() || '';

    if (ext === 'pdf' || mime.includes('pdf')) {
        return <FileText size={14} className="text-red-500 shrink-0" />;
    } else if (['doc', 'docx'].includes(ext || '') || mime.includes('word')) {
        return <FileText size={14} className="text-blue-600 shrink-0" />;
    } else if (['xls', 'xlsx', 'csv'].includes(ext || '') || mime.includes('spreadsheet') || mime.includes('excel')) {
        return <FileText size={14} className="text-emerald-600 shrink-0" />;
    } else if (['ppt', 'pptx'].includes(ext || '') || mime.includes('presentation')) {
        return <FileText size={14} className="text-orange-500 shrink-0" />;
    } else if (mime.includes('image') || ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext || '')) {
        return <FileText size={14} className="text-purple-500 shrink-0" />;
    }
    return <FileText size={14} className="text-indigo-500 shrink-0" />;
};

/**
 * Get short filename for display (truncate long names)
 */
export const getShortFileName = (name: string): string => {
    if (!name) return 'File';
    if (name.length <= 15) return name;
    const ext = name.split('.').pop();
    const baseName = name.slice(0, name.lastIndexOf('.'));
    return baseName.slice(0, 10) + '...' + (ext ? '.' + ext : '');
};

/**
 * Default checkbox color
 */
export const DEFAULT_CHECKBOX_COLOR = '#2563eb'; // blue-600
