import React from 'react';
import { WarningCircle, X } from 'phosphor-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'danger'
}) => {
    if (!isOpen) return null;

    const variantStyles = {
        danger: {
            icon: <WarningCircle className="text-stone-900 dark:text-stone-100" size={26} weight="light" />,
            button: 'bg-black dark:bg-white text-white dark:text-black hover:scale-105 active:scale-95 transition-all duration-300 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_40px_-10px_rgba(255,255,255,0.1)]',
            glow: 'bg-stone-50 dark:bg-stone-900'
        },
        warning: {
            icon: <WarningCircle className="text-stone-900 dark:text-stone-100" size={26} weight="light" />,
            button: 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:scale-105 active:scale-95 transition-all duration-300 shadow-xl',
            glow: 'bg-stone-50 dark:bg-stone-900'
        },
        info: {
            icon: <WarningCircle className="text-stone-900 dark:text-stone-100" size={26} weight="light" />,
            button: 'bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-800 hover:scale-105 active:scale-95 transition-all duration-300 shadow-xl',
            glow: 'bg-stone-50 dark:bg-stone-800'
        }
    };

    const style = variantStyles[variant];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-500"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-sm bg-white dark:bg-monday-dark-bg border border-stone-200 dark:border-stone-800 rounded-3xl shadow-[0_30px_60px_-12px_rgba(0,0,0,0.3)] overflow-hidden animate-in fade-in zoom-in-95 duration-500">
                <div className="relative p-8">
                    <button
                        onClick={onClose}
                        className="absolute top-5 right-5 p-1 text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
                    >
                        <X size={18} />
                    </button>

                    <div className="flex flex-col gap-5">
                        <div className="w-11 h-11 rounded-xl bg-stone-50 dark:bg-stone-900 flex items-center justify-center border border-stone-100 dark:border-stone-800">
                            {style.icon}
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 leading-tight">
                                {title}
                            </h3>
                            <p className="text-[13px] font-medium text-stone-400 dark:text-stone-500 leading-relaxed max-w-[240px]">
                                {message}
                            </p>
                        </div>
                    </div>

                    <div className="mt-8 flex gap-2 justify-end">
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 text-[12px] font-bold text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-all active:scale-95"
                        >
                            {cancelLabel}
                        </button>
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className={`px-6 py-2.5 text-[12px] font-bold text-white rounded-xl ${style.button} active:scale-95`}
                        >
                            {confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
