/**
 * B2B Industrial Marketplace - Design System
 *
 * Style: Minimal, classic, calm, premium, enterprise-grade
 * Philosophy: Dark mode is "long-work-hours mode" - supports reading
 *             data, KPIs, tables for hours without fatigue
 */

// =============================================================================
// LIGHT MODE PALETTE
// =============================================================================
export const lightMode = {
  // Backgrounds
  bgPrimary: '#FFFFFF',
  bgSecondary: '#F7F7F7',
  bgCard: '#FFFFFF',
  bgHover: '#F5F5F5',
  bgActive: '#EBEBEB',

  // Text
  textPrimary: '#111111',
  textSecondary: '#6B6B6B',
  textMuted: '#9AA0AA',
  textDisabled: '#B3B3B3',

  // Borders
  border: '#E5E5E5',
  borderLight: '#F0F0F0',
  borderHover: '#D4D4D4',

  // Table specific
  tableHeader: '#F7F7F7',
  tableRowHover: '#FAFAFA',
  tableBorder: '#EBEBEB',
} as const;

// =============================================================================
// DARK MODE PALETTE - Professional B2B Industrial
// "Calm, professional, premium, enterprise-ready — not flashy, not gaming"
// =============================================================================
export const darkMode = {
  // Backgrounds - Near black, not pure black
  bgPrimary: '#0F1115',      // Main background
  bgSecondary: '#161A20',    // Cards, panels - slightly lighter
  bgCard: '#161A20',         // Card backgrounds
  bgHover: '#1C2128',        // Hover states
  bgActive: '#232834',       // Active/pressed states

  // Text - Soft white, never pure white (reduces eye strain)
  textPrimary: '#E6E8EB',    // Main text - soft white
  textSecondary: '#9AA0AA',  // Secondary text - muted gray
  textMuted: '#6B7280',      // Disabled/placeholder - dark muted
  textDisabled: '#4B5563',   // Very muted

  // Borders - Very subtle gray
  border: '#232834',         // Main borders
  borderLight: '#1C2128',    // Subtle borders
  borderHover: '#2D3544',    // Border on hover

  // Table specific - "No grid overload, use spacing and contrast"
  tableHeader: '#111518',    // Slightly darker than cards
  tableRowHover: '#1C2128',  // Very subtle lightening
  tableBorder: '#232834',    // Subtle dividers
} as const;

// =============================================================================
// SHARED COLORS (Same in both modes)
// =============================================================================
export const statusColors = {
  // Status colors - Subtle, not bright
  success: '#2D7D46',
  successDark: '#22633A',   // Darker for dark mode if needed
  warning: '#9A6700',
  warningDark: '#7A5200',
  error: '#C53030',
  errorDark: '#9B2626',
  info: '#2B6CB0',
  infoDark: '#1E4E8C',
} as const;

// =============================================================================
// LEGACY COLORS (for backwards compatibility)
// =============================================================================
export const portalColors = {
  // Core
  black: '#000000',
  white: '#FFFFFF',

  // Grays
  gray900: '#0F1115',
  gray800: '#161A20',
  gray700: '#232834',
  gray600: '#4B5563',
  gray500: '#6B7280',
  gray400: '#9AA0AA',
  gray300: '#B3B3B3',
  gray200: '#D4D4D4',
  gray100: '#E6E8EB',
  gray50: '#F7F7F7',

  // Functional
  border: '#E5E5E5',
  borderLight: '#F0F0F0',
  background: '#FAFAFA',
  backgroundAlt: '#F5F5F5',

  // Text
  textPrimary: '#111111',
  textSecondary: '#6B6B6B',
  textTertiary: '#9AA0AA',
  textMuted: '#B3B3B3',

  // Status
  ...statusColors,
} as const;

export type PortalColorKey = keyof typeof portalColors;

// =============================================================================
// TYPOGRAPHY SYSTEM
// =============================================================================
export const typography = {
  fontFamily: {
    // English fonts
    body: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    heading: "'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    // Arabic fonts
    bodyArabic: "'Noto Kufi Arabic', 'Cairo', -apple-system, BlinkMacSystemFont, sans-serif",
    headingArabic: "'Noto Kufi Arabic', 'Cairo', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
} as const;

/** Get the correct font family based on language */
export const getFontFamily = (language: 'en' | 'ar', type: 'body' | 'heading' = 'body') => {
  if (language === 'ar') {
    return type === 'heading' ? typography.fontFamily.headingArabic : typography.fontFamily.bodyArabic;
  }
  return type === 'heading' ? typography.fontFamily.heading : typography.fontFamily.body;
};

// =============================================================================
// SMART THEME GETTER
// Returns complete style object based on theme and language
// =============================================================================
export type Theme = 'light' | 'dark';
export type Language = 'en' | 'ar';

export interface ThemeStyles {
  // Backgrounds
  bgPrimary: string;
  bgSecondary: string;
  bgCard: string;
  bgHover: string;
  bgActive: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textDisabled: string;

  // Borders
  border: string;
  borderLight: string;
  borderHover: string;

  // Table
  tableHeader: string;
  tableRowHover: string;
  tableBorder: string;

  // Fonts
  fontBody: string;
  fontHeading: string;

  // Status
  success: string;
  warning: string;
  error: string;
  info: string;

  // State
  isDark: boolean;
  isRTL: boolean;

  // CSS classes for hover (Tailwind)
  hoverBgClass: string;
  focusRingClass: string;
}

/**
 * Get complete theme styles based on theme and language
 * Smart auto-detection of all styles needed
 */
export const getThemeStyles = (theme: Theme, language: Language): ThemeStyles => {
  const isDark = theme === 'dark';
  const isRTL = language === 'ar';
  const palette = isDark ? darkMode : lightMode;

  return {
    // Backgrounds
    bgPrimary: palette.bgPrimary,
    bgSecondary: palette.bgSecondary,
    bgCard: palette.bgCard,
    bgHover: palette.bgHover,
    bgActive: palette.bgActive,

    // Text
    textPrimary: palette.textPrimary,
    textSecondary: palette.textSecondary,
    textMuted: palette.textMuted,
    textDisabled: palette.textDisabled,

    // Borders
    border: palette.border,
    borderLight: palette.borderLight,
    borderHover: palette.borderHover,

    // Table
    tableHeader: palette.tableHeader,
    tableRowHover: palette.tableRowHover,
    tableBorder: palette.tableBorder,

    // Fonts - Auto-switch based on language
    fontBody: getFontFamily(language, 'body'),
    fontHeading: getFontFamily(language, 'heading'),

    // Status - Same in both themes
    success: statusColors.success,
    warning: statusColors.warning,
    error: statusColors.error,
    info: statusColors.info,

    // State
    isDark,
    isRTL,

    // Tailwind classes
    hoverBgClass: isDark ? 'hover:bg-[#1C2128]' : 'hover:bg-gray-50',
    focusRingClass: isDark
      ? 'focus:ring-1 focus:ring-[#232834] focus:ring-offset-0'
      : 'focus:ring-1 focus:ring-gray-200 focus:ring-offset-0',
  };
};

// =============================================================================
// LAYOUT CONSTANTS
// =============================================================================
export const layout = {
  maxWidth: '1140px',
  maxWidthWide: '1200px',
  headerHeight: '64px',
  containerPadding: '24px',
} as const;
