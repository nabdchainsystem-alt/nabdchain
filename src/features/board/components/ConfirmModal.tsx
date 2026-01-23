import React from 'react';
import { createPortal } from 'react-dom';
import { Warning as AlertTriangle, X } from 'phosphor-react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen, onClose, onConfirm,
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'danger'
}) => {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 transition-opacity"
                onClick={onClose}
            />

            <div className="relative w-full max-w-md bg-white dark:bg-stone-900 rounded-2xl shadow-2xl p-6 border border-stone-200 dark:border-stone-800 animate-in fade-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="flex flex-col items-center text-center">
                    <div className={`
                        w-12 h-12 rounded-full flex items-center justify-center mb-4
                        ${type === 'danger' ? 'bg-red-100 text-red-500 dark:bg-red-900/30' :
                            type === 'warning' ? 'bg-amber-100 text-amber-500 dark:bg-amber-900/30' :
                                'bg-blue-100 text-blue-500 dark:bg-blue-900/30'}
                    `}>
                        <AlertTriangle size={24} />
                    </div>

                    <h3 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-2">
                        {title}
                    </h3>

                    <p className="text-stone-500 dark:text-stone-400 mb-8 leading-relaxed">
                        {message}
                    </p>

                    <div className="flex gap-3 w-full">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-xl font-medium text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className={`
                                flex-1 px-4 py-2.5 rounded-xl font-bold text-white shadow-lg transition-all
                                ${type === 'danger' ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' :
                                    type === 'warning' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' :
                                        'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'}
                            `}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
