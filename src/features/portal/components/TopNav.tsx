import React from 'react';
import { SignOut, ShoppingCart, Storefront, Moon, Sun } from 'phosphor-react';
import { usePortal } from '../context/PortalContext';

export type PortalRole = 'buyer' | 'seller';

interface NavItem {
  id: string;
  label: string;
}

interface TopNavProps {
  role: PortalRole;
  currentPage: string;
  navItems: NavItem[];
  onNavigate: (page: string) => void;
  onLogout: () => void;
  onRoleSwitch?: () => void;
}

/**
 * Top Navigation Bar
 *
 * Includes: Logo, Main sections (center), Language/Theme toggles, Role badge, Sign out
 */
export const TopNav: React.FC<TopNavProps> = ({ role, currentPage, navItems, onNavigate, onLogout, onRoleSwitch }) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { language, setLanguage, toggleTheme, t, direction, styles } = usePortal();
  const RoleIcon = role === 'buyer' ? ShoppingCart : Storefront;
  const roleLabel = role === 'buyer' ? t('common.buyer') : t('common.seller');

  return (
    <header
      className="border-b sticky top-0 z-50 transition-colors"
      style={{
        borderColor: styles.border,
        fontFamily: styles.fontBody,
        backgroundColor: styles.bgPrimary,
      }}
    >
      <div className="w-full px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Logo */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2.5 hover:opacity-70 transition-opacity"
        >
          <div
            className="w-8 h-8 rounded-md flex items-center justify-center text-sm font-semibold"
            style={{
              backgroundColor: styles.isDark ? '#E6E8EB' : '#0F1115',
              color: styles.isDark ? '#0F1115' : '#E6E8EB',
            }}
          >
            N
          </div>
          <span
            className="text-base font-semibold tracking-tight hidden sm:block"
            style={{ color: styles.textPrimary, fontFamily: styles.fontHeading }}
          >
            Nabd
          </span>
        </button>

        {/* Center: Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`px-3.5 py-2 text-sm font-medium rounded-md transition-colors ${styles.hoverBgClass}`}
              style={{
                color: currentPage === item.id ? styles.textPrimary : styles.textSecondary,
                backgroundColor: currentPage === item.id ? styles.bgActive : 'transparent',
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right: Controls & Sign Out */}
        <div className="flex items-center gap-2">
          {/* Role Badge */}
          <button
            onClick={onRoleSwitch}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md transition-colors ${styles.hoverBgClass}`}
            style={{
              backgroundColor: styles.bgSecondary,
              color: styles.textSecondary,
            }}
          >
            <RoleIcon size={14} weight="bold" />
            <span className="font-medium">{roleLabel}</span>
          </button>

          <div className="h-5 w-px" style={{ backgroundColor: styles.border }} />

          {/* Language & Theme Toggle */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${styles.hoverBgClass}`}
              style={{ color: styles.textSecondary }}
              title={language === 'en' ? 'Switch to Arabic' : 'التبديل إلى الإنجليزية'}
            >
              {language === 'en' ? 'AR' : 'EN'}
            </button>
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-md transition-colors ${styles.hoverBgClass}`}
              style={{ color: styles.textSecondary }}
              title={styles.isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {styles.isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>

          <div className="h-5 w-px" style={{ backgroundColor: styles.border }} />

          {/* Sign Out */}
          <button
            onClick={onLogout}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${styles.hoverBgClass}`}
            style={{ color: styles.textSecondary }}
          >
            <SignOut size={18} />
            <span className="hidden sm:inline font-medium">{t('common.signOut')}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopNav;
