import { Key, FileText, StickyNote, Shield, Star, Trash2, Folder, Image, Globe, File } from 'lucide-react';

export type VaultItemType = 'login' | 'note' | 'folder' | 'document' | 'image' | 'weblink';

export interface FolderMetadata {
    description?: string;
    tags?: string[];
    managedBy?: string;
    accessLevel?: 'private' | 'team' | 'public';
    retentionPolicy?: 'none' | '1-year' | '5-years' | 'forever';
    notes?: string;
}

export interface LinkMetadata {
    url: string;
    username?: string;
    password?: string; // In real app, this would be encrypted
}

export interface FileMetadata {
    size?: string;
    mimeType?: string;
    dimensions?: string; // For images
    uploadedBy?: string;
}

export interface VaultItem {
    id: string;
    type: VaultItemType;
    title: string;
    subtitle?: string; // e.g. username for login, or masked card number
    lastModified: string;
    isFavorite: boolean;
    folderId?: string;
    icon?: any; // Lucide icon component
    color?: string;
    metadata?: FolderMetadata | LinkMetadata | FileMetadata;
    previewUrl?: string; // For images or link favicons
}

export const MOCK_VAULT_ITEMS: VaultItem[] = [];

export const MOCK_CATEGORIES = [
    { id: 'all', label: 'All Items', icon: Shield },
    { id: 'favorites', label: 'Favorites', icon: Star },
    { id: 'folder', label: 'Folders', icon: Folder },
    { id: 'weblink', label: 'Web Links', icon: Globe },
    { id: 'document', label: 'Documents', icon: FileText },
    { id: 'image', label: 'Images', icon: Image },
    { id: 'login', label: 'Logins', icon: Key },
    { id: 'note', label: 'Secure Notes', icon: StickyNote },
    { id: 'trash', label: 'Trash', icon: Trash2 },
];
