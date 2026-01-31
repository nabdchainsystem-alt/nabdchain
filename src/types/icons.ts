/**
 * Shared icon type definitions
 * Used for phosphor-react and other icon libraries
 */
import type { Icon as PhosphorIcon, IconProps as PhosphorIconProps } from 'phosphor-react';

/**
 * Generic icon component type that works with phosphor-react icons
 * Can be used for any icon library that accepts size, weight, and color props
 */
export type IconComponent = PhosphorIcon;

/**
 * Props accepted by icon components
 */
export type IconProps = PhosphorIconProps;

/**
 * Icon size variants commonly used in the app
 */
export type IconSize = 12 | 14 | 16 | 18 | 20 | 24 | 28 | 32;

/**
 * Interface for menu items with icons
 */
export interface IconMenuItem {
    id: string;
    label: string;
    icon?: IconComponent;
}

/**
 * Interface for navigation items with icons
 */
export interface IconNavItem {
    id: string;
    label: string;
    icon: IconComponent;
    href?: string;
    onClick?: () => void;
}
