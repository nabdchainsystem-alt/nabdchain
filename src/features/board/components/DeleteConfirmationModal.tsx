import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { WarningCircle as AlertCircle, Trash as Trash2, X } from 'phosphor-react';

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Delete',
    cancelText = 'Cancel'
}) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
        } else {
            const timer = setTimeout(() => setIsVisible(false), 200); // Wait for exit animation
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isVisible) return null;

    const content = (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-stone-900/20 dark:bg-black/40 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
            />

            {/* Modal */}
            <div
                className={`
                    relative w-full max-w-sm bg-white dark:bg-stone-900 rounded-xl shadow-2xl border border-stone-200 dark:border-stone-800 
                    transform transition-all duration-200 ease-out 
                    ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'}
                `}
            >
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                            <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div className="flex-1 pt-0.5">
                            <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100 leading-6">
                                {title}
                            </h3>
                            {description && (
                                <p className="mt-2 text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
                                    {description}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="mt-8 flex items-center justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg transition-colors"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm shadow-red-600/20 transition-all active:scale-95"
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>

                {/* Close Button abs */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-stone-400 hover:text-stone-500 dark:hover:text-stone-300 transition-colors"
                >
                    <X size={20} />
                </button>
            </div>
        </div>
    );

    return createPortal(content, document.body);
};
