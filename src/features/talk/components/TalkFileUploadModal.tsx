import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { vaultService, VaultItem } from '../../../services/vaultService';
import { useAuth } from '../../../auth-adapter';
import { storageLogger, talkLogger } from '../../../utils/logger';
import { useAppContext } from '../../../contexts/AppContext';
import { X, Upload, Folder, FileText, CheckCircle, Plus } from 'phosphor-react';

interface TalkFileUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    file: File | null;
    onConfirm: (fileData: { name: string; saveToVault: boolean; folderId?: string }) => void;
}

export const TalkFileUploadModal: React.FC<TalkFileUploadModalProps> = ({ isOpen, onClose, file, onConfirm }) => {
    const { getToken, userId } = useAuth();
    const { t, language } = useAppContext();
    const [folders, setFolders] = useState<VaultItem[]>([]);
    const [selectedFolderId, setSelectedFolderId] = useState<string>('');
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [saveToVault, setSaveToVault] = useState(true);
    const [fileName, setFileName] = useState('');
    const [isLoadingFolders, setIsLoadingFolders] = useState(false);

    useEffect(() => {
        if (isOpen && file) {
            setFileName(file.name);
            if (saveToVault) {
                loadFolders();
            }
        }
    }, [isOpen, file, saveToVault]);

    const loadFolders = async () => {
        setIsLoadingFolders(true);
        try {
            const token = await getToken();
            if (!token || !userId) return;
            const items = await vaultService.getAll(token, userId);
            const folderItems = items.filter(item => item.type === 'folder');
            setFolders(folderItems);
        } catch (error) {
            storageLogger.error('Failed to load folders:', error);
        } finally {
            setIsLoadingFolders(false);
        }
    };

    const handleConfirm = async () => {
        if (!file) return;

        let finalFolderId = selectedFolderId;

        if (saveToVault && isCreatingFolder && newFolderName.trim()) {
            try {
                const token = await getToken();
                if (token && userId) {
                    const newFolder = await vaultService.create(token, {
                        title: newFolderName.trim(),
                        type: 'folder',
                        userId: userId,
                        isFavorite: false
                    });
                    finalFolderId = newFolder.id;
                }
            } catch (error) {
                talkLogger.error('Failed to create folder:', error);
            }
        }

        onConfirm({
            name: fileName.trim() || file.name,
            saveToVault,
            folderId: saveToVault ? finalFolderId : undefined
        });
        onClose();
    };

    if (!isOpen || !file) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose} dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="bg-white dark:bg-monday-dark-surface rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 border border-gray-200 dark:border-monday-dark-border" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="p-5 border-b border-gray-100 dark:border-monday-dark-border flex justify-between items-center bg-gray-50/50 dark:bg-monday-dark-bg/50">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Upload size={20} weight="bold" className="text-primary" />
                        {t('file_details')}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* File Preview Info */}
                    <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-monday-dark-bg rounded-xl border border-gray-100 dark:border-monday-dark-border">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <FileText size={24} weight="bold" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5 truncate">{file.name}</p>
                            <p className="text-xs font-bold text-gray-400 uppercase">{(file.size / 1024).toFixed(1)} {t('kb')}</p>
                        </div>
                    </div>

                    {/* File Name Input */}
                    <div>
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">{t('file_name')}</label>
                        <input
                            type="text"
                            value={fileName}
                            onChange={(e) => setFileName(e.target.value)}
                            placeholder={t('enter_file_name')}
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-monday-dark-bg border border-gray-200 dark:border-monday-dark-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all dark:text-white"
                            autoFocus
                        />
                    </div>

                    {/* Save to Vault Toggle */}
                    <div className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-monday-dark-bg/50 rounded-xl border border-dashed border-gray-200 dark:border-monday-dark-border">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${saveToVault ? 'bg-primary/10 text-primary' : 'bg-gray-200 dark:bg-gray-800 text-gray-400'}`}>
                                <Folder size={20} weight={saveToVault ? 'fill' : 'regular'} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{t('save_to_vault_optional')}</p>
                                <p className="text-[10px] text-gray-500">{saveToVault ? t('save_to_vault_desc') : t('upload_to_chat')}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setSaveToVault(!saveToVault)}
                            className={`w-12 h-6 rounded-full transition-all relative ${saveToVault ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-700'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${saveToVault ? (language === 'ar' ? 'left-1' : 'right-1') : (language === 'ar' ? 'right-1' : 'left-1')}`} />
                        </button>
                    </div>

                    {/* Folder Selection (Conditional) */}
                    {saveToVault && (
                        <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block">{t('where_to_save')}</label>

                            {!isCreatingFolder ? (
                                <div className="space-y-2">
                                    <div className="relative">
                                        <select
                                            value={selectedFolderId}
                                            onChange={(e) => setSelectedFolderId(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-monday-dark-bg border border-gray-200 dark:border-monday-dark-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all dark:text-white appearance-none"
                                            disabled={isLoadingFolders}
                                        >
                                            <option value="">{t('root_no_folder')}</option>
                                            {folders.map(folder => (
                                                <option key={folder.id} value={folder.id}>{folder.title}</option>
                                            ))}
                                        </select>
                                        <div className={`absolute top-1/2 -translate-y-1/2 ${language === 'ar' ? 'left-3' : 'right-3'} pointer-events-none text-gray-400`}>
                                            <span className="material-symbols-outlined">expand_more</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsCreatingFolder(true)}
                                        className="text-xs text-primary font-bold hover:underline flex items-center gap-1 uppercase tracking-wider"
                                    >
                                        <Plus size={14} weight="bold" />
                                        {t('create_new_folder')}
                                    </button>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newFolderName}
                                        onChange={(e) => setNewFolderName(e.target.value)}
                                        placeholder={t('folder_name')}
                                        className="flex-1 px-4 py-2 bg-white dark:bg-monday-dark-surface border border-primary rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all dark:text-white"
                                        autoFocus
                                    />
                                    <button
                                        onClick={() => setIsCreatingFolder(false)}
                                        className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 dark:border-monday-dark-border bg-gray-50/30 dark:bg-monday-dark-bg/30 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                    >
                        {t('cancel')}
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={saveToVault && isCreatingFolder && !newFolderName.trim()}
                        className="px-8 py-2.5 text-sm font-bold text-white bg-primary hover:bg-primary-dark rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center gap-2"
                    >
                        <CheckCircle size={18} weight="bold" />
                        {saveToVault ? t('save_to_vault') : t('upload')}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
