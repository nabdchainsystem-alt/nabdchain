import React from 'react';

export interface NavItem {
    id: string;
    label: string;
    icon?: React.ReactNode;
    children?: NavItem[];
    type: 'folder' | 'doc' | 'list';
}

export type Theme = 'light' | 'dark';

export interface Doc {
    id: string;
    title: string;
    content: string;
    tags: string[];
    createdAt: string;
    updatedAt: string;
    author: {
        id: string;
        name: string;
        avatar: string;
    };
    parentId?: string;
}

// Alias for API usage
export type DocPage = Doc;
