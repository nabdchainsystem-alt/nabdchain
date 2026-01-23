import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Trash, Warning, X } from 'phosphor-react';
import { useAppContext } from '../../contexts/AppContext';

interface DeleteBoardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (mode: 'single' | 'recursive') => void;
    boardName: string;
    hasSubBoards: boolean;
}

export const DeleteBoardModal: React.FC<DeleteBoardModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    boardName,
    hasSubBoards
}) => {
    const { t } = useAppContext();
    const [deleteMode, setDeleteMode] = useState<'single' | 'recursive'>('single');

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
                    <div className="w-12 h-12 rounded-full bg-red-100 text-red-500 dark:bg-red-900/30 flex items-center justify-center mb-4">
                        <Trash size={24} />
                    </div>

                    <h3 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-2">
                        {t('delete_board')}
                    </h3>

                    <p className="text-stone-500 dark:text-stone-400 mb-6 leading-relaxed">
                        {t('delete_board_confirmation_named').replace('{boardName}', boardName)}
                    </p>

                    {hasSubBoards && (
                        <div className="w-full bg-stone-50 dark:bg-stone-800/50 rounded-lg p-4 mb-6 text-left border border-stone-100 dark:border-stone-800/50">
                            <div className="flex items-start gap-3 mb-3">
                                <Warning className="text-amber-500 mt-0.5 shrink-0" size={18} />
                                <p className="text-sm text-stone-600 dark:text-stone-300">
                                    {t('has_sub_boards_warning')}
                                </p>
                            </div>

                            <div className="space-y-3 pl-1">
                                <label className="flex items-start gap-3 cursor-pointer group">
                                    <div className="relative flex items-center mt-0.5">
                                        <input
                                            type="radio"
                                            name="deleteMode"
                                            value="single"
                                            checked={deleteMode === 'single'}
                                            onChange={() => setDeleteMode('single')}
                                            className="peer sr-only"
                                        />
                                        <div className="w-4 h-4 border-2 border-stone-300 dark:border-stone-600 rounded-full peer-checked:border-blue-500 peer-checked:bg-blue-500 transition-all"></div>
                                        <div className="absolute inset-0 flex items-center justify-center scale-0 peer-checked:scale-100 transition-transform">
                                            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="block text-sm font-medium text-stone-800 dark:text-stone-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            {t('delete_single_board')}
                                        </span>
                                        <span className="block text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                                            {t('delete_single_board_desc')}
                                        </span>
                                    </div>
                                </label>

                                <label className="flex items-start gap-3 cursor-pointer group">
                                    <div className="relative flex items-center mt-0.5">
                                        <input
                                            type="radio"
                                            name="deleteMode"
                                            value="recursive"
                                            checked={deleteMode === 'recursive'}
                                            onChange={() => setDeleteMode('recursive')}
                                            className="peer sr-only"
                                        />
                                        <div className="w-4 h-4 border-2 border-stone-300 dark:border-stone-600 rounded-full peer-checked:border-red-500 peer-checked:bg-red-500 transition-all"></div>
                                        <div className="absolute inset-0 flex items-center justify-center scale-0 peer-checked:scale-100 transition-transform">
                                            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="block text-sm font-medium text-stone-800 dark:text-stone-200 group-hover:text-red-500 transition-colors">
                                            {t('delete_recursive_board')}
                                        </span>
                                        <span className="block text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                                            {t('delete_recursive_board_desc')}
                                        </span>
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3 w-full">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-xl font-medium text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                        >
                            {t('cancel')}
                        </button>
                        <button
                            onClick={() => onConfirm(hasSubBoards ? deleteMode : 'single')}
                            className="flex-1 px-4 py-2.5 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all"
                        >
                            {t('delete')}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
