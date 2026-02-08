import { Key, FileText, Note, Shield, Star, Trash, Folder, Image, Globe } from 'phosphor-react';
import type { IconComponent } from '@/types/icons';

export type VaultItemType = 'login' | 'note' | 'folder' | 'document' | 'image' | 'weblink';

export interface FolderMetadata {
  description?: string;
  tags?: string[];
  managedBy?: string;
  accessLevel?: 'private' | 'team' | 'public';
  retentionPolicy?: 'none' | '1-year' | '5-years' | 'forever';
  notes?: string;
  sharedWith?: string[]; // New: list of user IDs or emails
  icon?: string;
  isGroup?: boolean;
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

export interface LoginMetadata {
  url?: string;
  username: string;
  password?: string; // In real app, this would be encrypted
  notes?: string;
}

export interface NoteMetadata {
  content?: string;
  tags?: string[];
}

export interface VaultItem {
  id: string;
  type: VaultItemType;
  title: string;
  subtitle?: string; // e.g. username for login, or masked card number
  lastModified: string;
  isFavorite: boolean;
  isDeleted?: boolean;
  deletedAt?: string;
  folderId?: string;
  icon?: IconComponent;
  color?: string;
  metadata?: FolderMetadata | LinkMetadata | FileMetadata | LoginMetadata | NoteMetadata;
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
  { id: 'note', label: 'Secure Notes', icon: Note },
  { id: 'trash', label: 'Trash', icon: Trash },
];
