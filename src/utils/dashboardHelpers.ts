/**
 * Dashboard-specific helper utilities
 * Used by Dashboard.tsx and related components
 */

import {
    SquaresFour,
    Trash,
    ListPlus,
    PencilSimple,
    UserPlus,
    ChatCircle,
    PaperPlaneRight,
    EnvelopeSimple,
    Archive,
    Bell,
} from 'phosphor-react';
import type { IconProps } from 'phosphor-react';
import type { FC } from 'react';

export interface ActivityStyle {
    bg: string;
    icon: FC<IconProps>;
    color: string;
}

/**
 * Get styling for activity feed items based on activity type
 * @param type - Activity type string (e.g., 'BOARD_CREATED', 'TASK_UPDATED')
 * @returns Object with background class, icon component, and text color class
 */
export const getActivityStyles = (type: string): ActivityStyle => {
    switch (type) {
        case 'BOARD_CREATED':
            return { bg: 'bg-green-100', icon: SquaresFour, color: 'text-green-600' };
        case 'BOARD_DELETED':
            return { bg: 'bg-red-100', icon: Trash, color: 'text-red-600' };
        case 'TASK_CREATED':
            return { bg: 'bg-blue-100', icon: ListPlus, color: 'text-blue-600' };
        case 'TASK_UPDATED':
            return { bg: 'bg-amber-100', icon: PencilSimple, color: 'text-amber-600' };
        case 'TASK_DELETED':
            return { bg: 'bg-red-100', icon: Trash, color: 'text-red-600' };
        case 'GROUP_CREATED':
            return { bg: 'bg-green-100', icon: UserPlus, color: 'text-green-600' };
        case 'GROUP_DELETED':
            return { bg: 'bg-red-100', icon: Trash, color: 'text-red-600' };
        case 'THREAD_CREATED':
            return { bg: 'bg-teal-100', icon: ChatCircle, color: 'text-teal-600' };
        case 'MESSAGE_SENT':
            return { bg: 'bg-indigo-100', icon: PaperPlaneRight, color: 'text-indigo-600' };
        case 'EMAIL_SENT':
            return { bg: 'bg-sky-100', icon: EnvelopeSimple, color: 'text-sky-600' };
        case 'EMAIL_DELETED':
            return { bg: 'bg-gray-100', icon: Trash, color: 'text-gray-600' };
        case 'EMAIL_ARCHIVED':
            return { bg: 'bg-orange-100', icon: Archive, color: 'text-orange-600' };
        default:
            return { bg: 'bg-gray-100', icon: Bell, color: 'text-gray-600' };
    }
};

// Card theme images for recently visited boards
const CARD_IMAGES = {
    marketing: '/assets/covers/marketing.png',
    production: '/assets/covers/production.png',
    finance: '/assets/covers/finance.png',
    generic: '/assets/covers/generic.png',
};

const ABSTRACT_POOL = [
    '/assets/covers/generic.png',
    '/assets/covers/abstract_blue.png',
    '/assets/covers/abstract_orange.png',
    '/assets/covers/abstract_purple.png',
    '/assets/covers/abstract_green.png',
];

/**
 * Get card background image for a board based on its title
 * Uses keyword matching for specific themes, or a deterministic hash for variety
 * @param title - Board title
 * @param _type - Board type (unused, kept for compatibility)
 * @returns Image path string
 */
export const getCardTheme = (title: string, _type?: string): string => {
    const lowerTitle = title.toLowerCase();

    // Check for specific keywords
    if (lowerTitle.includes('market')) return CARD_IMAGES.marketing;
    if (lowerTitle.includes('design') || lowerTitle.includes('creative')) return CARD_IMAGES.marketing;
    if (lowerTitle.includes('product')) return CARD_IMAGES.production;
    if (lowerTitle.includes('ops') || lowerTitle.includes('maint')) return CARD_IMAGES.production;
    if (lowerTitle.includes('sale') || lowerTitle.includes('crm')) return CARD_IMAGES.finance;
    if (lowerTitle.includes('finance') || lowerTitle.includes('money')) return CARD_IMAGES.finance;

    // Deterministic hash to pick an abstract image
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
        hash = title.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % ABSTRACT_POOL.length;

    return ABSTRACT_POOL[index];
};
