import React, { ReactNode, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  MagnifyingGlass,
  User,
  Moon,
  Sun,
  GearSix,
  ArrowsLeftRight,
  SignOut,
  Scales,
} from 'phosphor-react';
import { usePortal } from '../context/PortalContext';
import { NotificationBell } from './NotificationBell';
import { ManualCompareModal } from './ManualCompareModal';

export type PortalRole = 'buyer' | 'seller';

interface ContentTopBarProps {
  title?: string;
  /** Additional action buttons to render before notifications (e.g., cart icon) */
  actions?: ReactNode;
  role?: PortalRole;
  onNavigate?: (page: string) => void;
  onRoleSwitch?: () => void;
  onLogout?: () => void;
}

/**
 * Content Top Bar
 * Top bar for the main content area with search and user actions
 */
export const ContentTopBar: React.FC<ContentTopBarProps> = ({
  title,
  actions,
  role = 'buyer',
  onNavigate,
  onRoleSwitch,
  onLogout,
}) => {
  const { styles, language, setLanguage, toggleTheme, t, direction } = usePortal();
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isManualCompareOpen, setIsManualCompareOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const isRtl = direction === 'rtl';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setIsAccountOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Memoized handlers to prevent re-renders
  const handleProfileClick = useCallback(() => {
    onNavigate?.('profile');
    setIsAccountOpen(false);
  }, [onNavigate]);

  const handleRoleSwitchClick = useCallback(() => {
    onRoleSwitch?.();
    setIsAccountOpen(false);
  }, [onRoleSwitch]);

  const handleSettingsClick = useCallback(() => {
    onNavigate?.('settings');
    setIsAccountOpen(false);
  }, [onNavigate]);

  // Memoized menu items array
  const accountMenuItems = useMemo(() => [
    {
      id: 'profile',
      icon: User,
      label: t('common.profile') || 'Profile',
      onClick: handleProfileClick,
    },
    {
      id: 'switch',
      icon: ArrowsLeftRight,
      label: t('common.switchAccount') || 'Switch Account',
      sublabel: role === 'seller' ? t('common.buyer') : t('common.seller'),
      onClick: handleRoleSwitchClick,
    },
    {
      id: 'settings',
      icon: GearSix,
      label:
        role === 'seller'
          ? t('seller.settings.title') || 'Seller Settings'
          : t('buyer.settings.title') || 'Buyer Settings',
      onClick: handleSettingsClick,
    },
  ], [t, role, handleProfileClick, handleRoleSwitchClick, handleSettingsClick]);

  return (
    <header
      className="sticky top-0 z-30 h-16 grid grid-cols-3 items-center px-6 border-b transition-colors"
      style={{
        backgroundColor: styles.bgPrimary,
        borderColor: styles.border,
      }}
    >
      {/* Left: Page Title (optional) */}
      <div className="flex items-center">
        {title && (
          <h1
            className="text-lg font-semibold"
            style={{ color: styles.textPrimary, fontFamily: styles.fontHeading }}
          >
            {title}
          </h1>
        )}
      </div>

      {/* Center: Search */}
      <div className="flex justify-center">
        <div
          className="flex items-center gap-2 px-4 h-10 w-full max-w-md rounded-lg border transition-colors"
          style={{
            backgroundColor: styles.bgCard,
            borderColor: styles.border,
          }}
        >
          <MagnifyingGlass size={18} style={{ color: styles.textMuted }} />
          <input
            type="text"
            placeholder="Search..."
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: styles.textPrimary }}
          />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center justify-end gap-2">
        {/* Language Toggle */}
        <button
          onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
          className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1"
          style={{ color: styles.textMuted }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = styles.bgHover;
            e.currentTarget.style.color = styles.textPrimary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = styles.textMuted;
          }}
        >
          {language === 'en' ? 'AR' : 'EN'}
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1"
          style={{ color: styles.textMuted }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = styles.bgHover;
            e.currentTarget.style.color = styles.textPrimary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = styles.textMuted;
          }}
        >
          {styles.isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Manual Compare Button - Buyer only */}
        {role === 'buyer' && (
          <button
            onClick={() => setIsManualCompareOpen(true)}
            className="p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1"
            style={{ color: styles.textMuted }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = styles.bgHover;
              e.currentTarget.style.color = styles.textPrimary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = styles.textMuted;
            }}
            title="Manual Compare"
          >
            <Scales size={18} />
          </button>
        )}

        {/* Custom Actions (e.g., cart icon) */}
        {actions}

        {/* Notifications */}
        <NotificationBell />

        {/* User Avatar with Dropdown */}
        <div className="relative" ref={accountRef}>
          <button
            onClick={() => setIsAccountOpen(!isAccountOpen)}
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1"
            style={{
              backgroundColor: isAccountOpen ? styles.bgHover : styles.bgSecondary,
              color: styles.textSecondary,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.bgHover)}
            onMouseLeave={(e) => {
              if (!isAccountOpen) {
                e.currentTarget.style.backgroundColor = styles.bgSecondary;
              }
            }}
          >
            <User size={18} weight="bold" />
          </button>

          {/* Account Dropdown */}
          {isAccountOpen && (
            <div
              className="absolute top-full mt-2 w-56 py-1 rounded-lg border shadow-lg z-50"
              style={{
                backgroundColor: styles.bgCard,
                borderColor: styles.border,
                [isRtl ? 'left' : 'right']: 0,
              }}
            >
              {accountMenuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={item.onClick}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                    style={{ color: styles.textSecondary }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = styles.bgHover;
                      e.currentTarget.style.color = styles.textPrimary;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = styles.textSecondary;
                    }}
                  >
                    <Icon size={16} />
                    <div className="flex flex-col items-start">
                      <span>{item.label}</span>
                      {item.sublabel && (
                        <span className="text-xs" style={{ color: styles.textMuted }}>
                          → {item.sublabel}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}

              {/* Divider */}
              <div className="my-1 border-t" style={{ borderColor: styles.border }} />

              {/* Sign Out */}
              <button
                onClick={() => {
                  onLogout?.();
                  setIsAccountOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                style={{ color: styles.textMuted }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = styles.bgHover;
                  e.currentTarget.style.color = styles.textPrimary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = styles.textMuted;
                }}
              >
                <SignOut size={16} />
                <span>{t('common.signOut') || 'Sign Out'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Manual Compare Modal - Buyer only */}
      {role === 'buyer' && (
        <ManualCompareModal
          isOpen={isManualCompareOpen}
          onClose={() => setIsManualCompareOpen(false)}
        />
      )}
    </header>
  );
};

export default ContentTopBar;
