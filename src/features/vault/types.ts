
import { Key, FileText, StickyNote, CreditCard, Shield, Star, Trash2 } from 'lucide-react';

export type VaultItemType = 'login' | 'note' | 'card' | 'document';

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
}

export interface VaultFolder {
    id: string;
    name: string;
    icon: any;
    count?: number;
}

export const MOCK_VAULT_ITEMS: VaultItem[] = [];

export const MOCK_CATEGORIES = [
    { id: 'all', label: 'All Items', icon: Shield },
    { id: 'favorites', label: 'Favorites', icon: Star },
    { id: 'login', label: 'Logins', icon: Key },
    { id: 'card', label: 'Cards', icon: CreditCard },
    { id: 'note', label: 'Secure Notes', icon: StickyNote },
    { id: 'document', label: 'Documents', icon: FileText },
    { id: 'trash', label: 'Trash', icon: Trash2 },
];
