import React, { useState, useEffect } from 'react';
import { vaultService, VaultItem } from '../../../services/vaultService';
import { useAuth } from '../../../auth-adapter';

interface SaveToVaultModalProps {
    isOpen: boolean;
    onClose: () => void;
    file: File | null;
}

export const SaveToVaultModal: React.FC<SaveToVaultModalProps> = ({ isOpen, onClose, file }) => {
    const { getToken, userId } = useAuth();
    const [folders, setFolders] = useState<VaultItem[]>([]);
    const [selectedFolderId, setSelectedFolderId] = useState<string>('');
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [tags, setTags] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadFolders();
            // Reset state on open
            setSelectedFolderId('');
            setIsCreatingFolder(false);
            setNewFolderName('');
            setTags('');
        }
    }, [isOpen]);

    const loadFolders = async () => {
        try {
            const token = await getToken();
            if (!token || !userId) return;
            const items = await vaultService.getAll(token, userId);
            const folderItems = items.filter(item => item.type === 'folder');
            setFolders(folderItems);
        } catch (error) {
            console.error('Failed to load folders:', error);
        }
    };

    const handleSave = async () => {
        if (!file) return;
        setIsSaving(true);
        try {
            const token = await getToken();
            if (!token || !userId) throw new Error('No auth token or user ID');

            let targetFolderId = selectedFolderId;

            // Create new folder if needed
            if (isCreatingFolder && newFolderName.trim()) {
                const newFolder = await vaultService.create(token, {
                    title: newFolderName,
                    type: 'folder',
                    userId: userId, // Ensure userId is passed
                    isFavorite: false
                });
                targetFolderId = newFolder.id;
            }

            // Read file content as base64
            const reader = new FileReader();

            reader.onload = async () => {
                try {
                    const base64Content = reader.result as string;

                    // Save file
                    await vaultService.create(token, {
                        title: file.name,
                        type: file.type.startsWith('image/') ? 'image' : 'document',
                        userId: userId, // Ensure userId is passed
                        folderId: targetFolderId || undefined,
                        isFavorite: false,
                        content: base64Content,
                        previewUrl: file.type.startsWith('image/') ? base64Content : undefined,
                        metadata: {
                            size: file.size,
                            mimeType: file.type,
                            tags: tags.split(',').map(tag => tag.trim()).filter(Boolean)
                        }
                    });

                    setIsSaving(false);
                    onClose();
                    // Force refresh events
                    window.dispatchEvent(new Event('vault-updated'));
                    window.dispatchEvent(new Event('dashboard-updated'));
                } catch (innerError) {
                    console.error('Failed to save file content:', innerError);
                    alert('Failed to save file. Please check your connection.');
                    setIsSaving(false);
                }
            };

            reader.onerror = () => {
                console.error('File reading failed');
                alert('Failed to read the file.');
                setIsSaving(false);
            };

            reader.readAsDataURL(file);

        } catch (error) {
            console.error('Failed to initiate save:', error);
            alert('Failed to initiate save.');
            setIsSaving(false);
        }
    };

    if (!isOpen || !file) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h2 className="text-lg font-bold text-gray-900">Save to Vault</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {/* File Info */}
                    <div className="flex items-center gap-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                            <span className="material-symbols-outlined">description</span>
                        </div>
                        <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">{file.name}</p>
                            <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                    </div>

                    {/* Folder Selection */}
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-gray-700 block">Where to save?</label>

                        {!isCreatingFolder ? (
                            <div className="space-y-3">
                                <select
                                    value={selectedFolderId}
                                    onChange={(e) => setSelectedFolderId(e.target.value)}
                                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                >
                                    <option value="">Root (No Folder)</option>
                                    {folders.map(folder => (
                                        <option key={folder.id} value={folder.id}>{folder.title}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={() => setIsCreatingFolder(true)}
                                    className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1"
                                >
                                    <span className="material-symbols-outlined text-[16px]">create_new_folder</span>
                                    Create new folder
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newFolderName}
                                        onChange={(e) => setNewFolderName(e.target.value)}
                                        placeholder="Folder Name"
                                        className="flex-1 p-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    />
                                    <button
                                        onClick={() => setIsCreatingFolder(false)}
                                        className="p-2.5 text-gray-500 hover:bg-gray-100 rounded-lg"
                                    >
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="text-sm font-semibold text-gray-700 block mb-2">Tags</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-[18px]">label</span>
                            <input
                                type="text"
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                                placeholder="design, project, important (comma separated)"
                                className="w-full pl-9 p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50/30 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || (isCreatingFolder && !newFolderName.trim())}
                        className="px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isSaving ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                Saving...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-[18px]">upload</span>
                                Save to Vault
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
