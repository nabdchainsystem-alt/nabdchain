import React, { useState, useMemo, useRef, memo } from 'react';
import { createPortal } from 'react-dom';
import {
    Paperclip, Upload, File, Image, FileDoc, FileXls, FilePdf,
    Trash, Download, Eye, Plus, X, CloudArrowUp
} from 'phosphor-react';
import { useLanguage } from '../../../../../../contexts/LanguageContext';
import { boardLogger } from '@/utils/logger';

// =============================================================================
// FILES/ATTACHMENTS PICKER - PLACEHOLDER COMPONENT
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

export interface FileAttachment {
    id: string;
    name: string;
    size: number;
    type: string;
    url: string;
    thumbnailUrl?: string;
    uploadedAt: Date;
    uploadedBy?: string;
}

interface FilesPickerProps {
    value: FileAttachment[] | null;
    onSelect: (value: FileAttachment[] | null) => void;
    onClose: () => void;
    triggerRect?: DOMRect;
    maxFiles?: number;
    acceptedTypes?: string[];
    maxFileSize?: number; // in bytes
}

// Format file size
const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// Get file icon based on type
const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return Image;
    if (type.includes('pdf')) return FilePdf;
    if (type.includes('sheet') || type.includes('excel') || type.includes('csv')) return FileXls;
    if (type.includes('document') || type.includes('word')) return FileDoc;
    return File;
};

// Get file type color
const getFileColor = (type: string): string => {
    if (type.startsWith('image/')) return 'text-purple-500';
    if (type.includes('pdf')) return 'text-red-500';
    if (type.includes('sheet') || type.includes('excel')) return 'text-green-500';
    if (type.includes('document') || type.includes('word')) return 'text-blue-500';
    return 'text-stone-500';
};

export const FilesPicker: React.FC<FilesPickerProps> = memo(({
    value,
    onSelect,
    onClose,
    triggerRect,
    maxFiles = 10,
    acceptedTypes,
    maxFileSize = 10 * 1024 * 1024, // 10MB default
}) => {
    const { t, dir } = useLanguage();
    const isRtl = dir === 'rtl';
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const files = value || [];

    const MENU_WIDTH = 360;
    const MENU_HEIGHT = 450;
    const PADDING = 16;

    const positionStyle = useMemo(() => {
        if (!triggerRect) return { position: 'fixed' as const, display: 'none' };

        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const spaceBelow = windowHeight - triggerRect.bottom;
        const wouldOverflowRight = triggerRect.left + MENU_WIDTH > windowWidth - PADDING;

        let left: number | undefined;
        let right: number | undefined;

        if (wouldOverflowRight) {
            right = PADDING;
        } else {
            left = Math.max(PADDING, triggerRect.left);
        }

        const openUp = spaceBelow < MENU_HEIGHT + PADDING && triggerRect.top > spaceBelow;

        const baseStyle: React.CSSProperties = {
            position: 'fixed',
            zIndex: 9999,
            width: MENU_WIDTH,
        };

        if (openUp) {
            return {
                ...baseStyle,
                bottom: windowHeight - triggerRect.top + 4,
                ...(isRtl ? (right !== undefined ? { right: PADDING } : { left: PADDING }) : (left !== undefined ? { left } : { right }))
            };
        }
        return {
            ...baseStyle,
            top: triggerRect.bottom + 4,
            ...(isRtl ? (right !== undefined ? { right: PADDING } : { left: PADDING }) : (left !== undefined ? { left } : { right }))
        };
    }, [triggerRect, isRtl]);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const droppedFiles = Array.from(e.dataTransfer.files) as File[];
        await handleFiles(droppedFiles);
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.target.files ? (Array.from(e.target.files) as File[]) : [];
        await handleFiles(selectedFiles);
    };

    const handleFiles = async (newFiles: File[]) => {
        // TODO: Implement actual file upload
        boardLogger.debug('[Files] Upload files - NOT IMPLEMENTED', newFiles);

        setUploading(true);

        // Simulate upload delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Create mock file attachments
        const newAttachments: FileAttachment[] = newFiles.slice(0, maxFiles - files.length).map((file, index) => ({
            id: `file-${Date.now()}-${index}`,
            name: file.name,
            size: file.size,
            type: file.type,
            url: URL.createObjectURL(file), // This would be replaced with actual upload URL
            uploadedAt: new Date(),
        }));

        onSelect([...files, ...newAttachments]);
        setUploading(false);
    };

    const handleRemoveFile = (fileId: string) => {
        const updatedFiles = files.filter(f => f.id !== fileId);
        onSelect(updatedFiles.length > 0 ? updatedFiles : null);
    };

    const handlePreview = (file: FileAttachment) => {
        // TODO: Implement file preview
        boardLogger.debug('[Files] Preview file - NOT IMPLEMENTED', file);
        window.open(file.url, '_blank');
    };

    const handleDownload = (file: FileAttachment) => {
        // TODO: Implement proper download
        const link = document.createElement('a');
        link.href = file.url;
        link.download = file.name;
        link.click();
    };

    const content = (
        <>
            <div className="fixed inset-0 z-[9998]" onClick={onClose} />
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100"
                style={positionStyle}
            >
                {/* Header */}
                <div className="px-3 py-2 border-b border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50">
                    <div className={`flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <span className={`text-xs font-medium text-stone-600 dark:text-stone-400 flex items-center gap-1.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
                            <Paperclip size={14} />
                            {t('files_and_attachments')}
                        </span>
                        <span className="text-[10px] text-stone-400">
                            {files.length}/{maxFiles}
                        </span>
                    </div>
                </div>

                {/* Drop Zone */}
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`p-4 border-b border-stone-100 dark:border-stone-800 transition-colors ${isDragging
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                        : 'bg-stone-50 dark:bg-stone-800/30'
                        }`}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={handleFileSelect}
                        accept={acceptedTypes?.join(',')}
                        className="hidden"
                    />

                    <div className="text-center">
                        {uploading ? (
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                <span className="text-sm text-stone-500">{t('uploading')}</span>
                            </div>
                        ) : (
                            <>
                                <CloudArrowUp size={32} className={`mx-auto mb-2 ${isDragging ? 'text-blue-500' : 'text-stone-400'}`} />
                                <p className="text-sm text-stone-600 dark:text-stone-400 mb-2">
                                    {isDragging ? t('drop_files_here') : t('drag_drop_files_here')}
                                </p>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={files.length >= maxFiles}
                                    className="px-3 py-1.5 text-xs bg-blue-500 hover:bg-blue-600 disabled:bg-stone-300 text-white rounded-lg transition-colors"
                                >
                                    <Upload size={12} className={`inline ${isRtl ? 'ml-1' : 'mr-1'}`} />
                                    {t('browse_files')}
                                </button>
                                <p className="text-[10px] text-stone-400 mt-2">
                                    {t('max_file_size').replace('{size}', formatFileSize(maxFileSize))}
                                </p>
                            </>
                        )}
                    </div>
                </div>

                {/* Files List */}
                <div className="flex-1 overflow-y-auto max-h-[250px]">
                    {files.length === 0 ? (
                        <div className="p-6 text-center text-sm text-stone-400">
                            {t('no_files_attached')}
                        </div>
                    ) : (
                        <div className="p-2 space-y-1">
                            {files.map((file) => {
                                const FileIcon = getFileIcon(file.type);
                                return (
                                    <div
                                        key={file.id}
                                        className={`flex items-center gap-2 p-2 bg-stone-50 dark:bg-stone-800/50 rounded-lg group ${isRtl ? 'flex-row-reverse' : ''}`}
                                    >
                                        {/* Thumbnail or Icon */}
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-white dark:bg-stone-700 ${getFileColor(file.type)}`}>
                                            {file.type.startsWith('image/') && file.thumbnailUrl ? (
                                                <img
                                                    src={file.thumbnailUrl || file.url}
                                                    alt={file.name}
                                                    className="w-full h-full object-cover rounded-lg"
                                                />
                                            ) : (
                                                <FileIcon size={20} />
                                            )}
                                        </div>

                                        {/* File Info */}
                                        <div className={`flex-1 min-w-0 ${isRtl ? 'text-right' : ''}`}>
                                            <div className="text-sm text-stone-700 dark:text-stone-300 truncate">
                                                {file.name}
                                            </div>
                                            <div className="text-[10px] text-stone-400">
                                                {formatFileSize(file.size)}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${isRtl ? 'flex-row-reverse' : ''}`}>
                                            <button
                                                onClick={() => handlePreview(file)}
                                                className="p-1.5 hover:bg-stone-200 dark:hover:bg-stone-600 rounded transition-colors"
                                                title={t('preview') || "Preview"}
                                            >
                                                <Eye size={14} className="text-stone-500" />
                                            </button>
                                            <button
                                                onClick={() => handleDownload(file)}
                                                className="p-1.5 hover:bg-stone-200 dark:hover:bg-stone-600 rounded transition-colors"
                                                title={t('download') || "Download"}
                                            >
                                                <Download size={14} className="text-stone-500" />
                                            </button>
                                            <button
                                                onClick={() => handleRemoveFile(file.id)}
                                                className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                                                title={t('remove') || "Remove"}
                                            >
                                                <Trash size={14} className="text-red-500" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-3 py-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                    <button
                        onClick={() => { onSelect(null); onClose(); }}
                        className="py-1.5 px-2 text-xs text-stone-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                    >
                        {t('clear_all')}
                    </button>
                    <button
                        onClick={onClose}
                        className="py-1.5 px-3 text-xs bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-md transition-colors"
                    >
                        {t('common_done') || 'Done'}
                    </button>
                </div>
            </div>
        </>
    );

    return createPortal(content, document.body);
});

// Inline display for table cells
export const FilesDisplay: React.FC<{
    value: FileAttachment[] | null;
    onClick?: () => void;
    maxDisplay?: number;
}> = memo(({ value, onClick, maxDisplay = 3 }) => {
    const { t, dir } = useLanguage();
    const isRtl = dir === 'rtl';
    const files = value || [];

    if (files.length === 0) {
        return (
            <button onClick={onClick} className={`text-stone-400 hover:text-stone-600 text-sm flex items-center gap-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <Plus size={12} />
                {t('add_files')}
            </button>
        );
    }

    return (
        <button onClick={onClick} className={`flex items-center gap-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <div className={`flex -space-x-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
                {files.slice(0, maxDisplay).map((file) => {
                    const FileIcon = getFileIcon(file.type);
                    return (
                        <div
                            key={file.id}
                            className={`w-6 h-6 rounded border-2 border-white dark:border-stone-800 flex items-center justify-center bg-stone-100 dark:bg-stone-700 ${getFileColor(file.type)}`}
                        >
                            <FileIcon size={12} />
                        </div>
                    );
                })}
            </div>
            {files.length > maxDisplay && (
                <span className="text-xs text-stone-500">+{files.length - maxDisplay}</span>
            )}
            <span className="text-xs text-stone-400">{files.length} {t('uploaded_files')}</span>
        </button>
    );
});

export default FilesPicker;
