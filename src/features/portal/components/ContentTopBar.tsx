import React from 'react';
import { MagnifyingGlass, Bell, User, Moon, Sun } from 'phosphor-react';
import { usePortal } from '../context/PortalContext';

interface ContentTopBarProps {
  title?: string;
}

/**
 * Content Top Bar
 * Top bar for the main content area with search and user actions
 */
export const ContentTopBar: React.FC<ContentTopBarProps> = ({ title }) => {
  const { styles, language, setLanguage, toggleTheme } = usePortal();

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
          className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
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
          className="p-2 rounded-lg transition-colors"
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

        {/* Notifications */}
        <button
          className="relative p-2 rounded-lg transition-colors"
          style={{ color: styles.textSecondary }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.bgHover)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <Bell size={20} />
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
            style={{ backgroundColor: '#EF4444' }}
          />
        </button>

        {/* User Avatar */}
        <button
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
          style={{ backgroundColor: styles.bgSecondary, color: styles.textSecondary }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.bgHover)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = styles.bgSecondary)}
        >
          <User size={18} weight="bold" />
        </button>
      </div>
    </header>
  );
};

export default ContentTopBar;
