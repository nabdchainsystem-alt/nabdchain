import React, { useState, useCallback, useEffect } from 'react';
import {
  SignOut,
  CaretLeft,
  CaretRight,
  House,
  Storefront,
  ShoppingCart,
  FileText,
  Package,
  ChartLine,
  Cube,
  Tag,
  ClipboardText,
  Gear,
  Flask,
} from 'phosphor-react';
import { usePortal } from '../context/PortalContext';

export type PortalRole = 'buyer' | 'seller';

interface NavItem {
  id: string;
  label: string;
  icon?: React.ElementType;
}

interface SidebarProps {
  role: PortalRole;
  currentPage: string;
  navItems: NavItem[];
  onNavigate: (page: string) => void;
  onLogout: () => void;
  onRoleSwitch?: () => void;
}

// Icon mapping for nav items
const iconMap: Record<string, React.ElementType> = {
  home: House,
  listings: Tag,
  rfqs: FileText,
  'my-rfqs': FileText,
  rfq: FileText,
  orders: Package,
  analytics: ChartLine,
  workspace: Cube,
  marketplace: Storefront,
  tracking: ClipboardText,
  tests: Flask,
  settings: Gear,
};

/**
 * Portal Sidebar
 * Minimal, clean sidebar inspired by Clerk/Vercel
 */
export const Sidebar: React.FC<SidebarProps> = ({
  role,
  currentPage,
  navItems,
  onNavigate,
  onLogout,
  onRoleSwitch,
}) => {
  const { toggleSidebar, sidebarCollapsed, sidebarWidth, setSidebarWidth, t, styles, direction } = usePortal();
  const RoleIcon = role === 'buyer' ? ShoppingCart : Storefront;
  const roleLabel = role === 'buyer' ? t('common.buyer') : t('common.seller');
  const isRtl = direction === 'rtl';

  const [isResizing, setIsResizing] = useState(false);

  const minWidth = 180;
  const maxWidth = 320;
  const collapsedWidth = 64;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    const newWidth = isRtl ? window.innerWidth - e.clientX : e.clientX;
    if (newWidth >= minWidth && newWidth <= maxWidth) {
      setSidebarWidth(newWidth);
    }
  }, [isResizing, isRtl, setSidebarWidth]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const currentWidth = sidebarCollapsed ? collapsedWidth : sidebarWidth;

  return (
    <>
      <aside
        className="fixed top-0 bottom-0 flex flex-col z-40"
        style={{
          width: `${currentWidth}px`,
          backgroundColor: styles.bgPrimary,
          borderColor: styles.border,
          fontFamily: styles.fontBody,
          transition: isResizing ? 'none' : 'width 0.2s',
          ...(isRtl ? { right: 0, borderLeft: `1px solid ${styles.border}` } : { left: 0, borderRight: `1px solid ${styles.border}` }),
        }}
      >
        {/* Header: Logo + Collapse */}
        <div
          className="h-16 flex items-center justify-between px-4 border-b"
          style={{ borderColor: styles.border }}
        >
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
              style={{
                backgroundColor: styles.isDark ? '#fff' : '#000',
                color: styles.isDark ? '#000' : '#fff',
              }}
            >
              N
            </div>
            {!sidebarCollapsed && (
              <span
                className="text-base font-semibold"
                style={{ color: styles.textPrimary, fontFamily: styles.fontHeading }}
              >
                Nabd
              </span>
            )}
          </button>
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-md transition-colors"
            style={{ color: styles.textMuted }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.bgHover)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            {sidebarCollapsed
              ? (isRtl ? <CaretLeft size={14} weight="bold" /> : <CaretRight size={14} weight="bold" />)
              : (isRtl ? <CaretRight size={14} weight="bold" /> : <CaretLeft size={14} weight="bold" />)}
          </button>
        </div>

        {/* Role Switcher */}
        {!sidebarCollapsed ? (
          <div className="px-3 py-3">
            <button
              onClick={onRoleSwitch}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors"
              style={{
                backgroundColor: styles.bgSecondary,
                color: styles.textSecondary,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.bgHover)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = styles.bgSecondary)}
            >
              <RoleIcon size={16} weight="fill" />
              <span className="text-xs font-medium uppercase tracking-wide">{roleLabel}</span>
            </button>
          </div>
        ) : (
          <div className="px-2 py-3 flex justify-center">
            <button
              onClick={onRoleSwitch}
              className="p-2 rounded-lg transition-colors"
              style={{
                backgroundColor: styles.bgSecondary,
                color: styles.textSecondary,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.bgHover)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = styles.bgSecondary)}
              title={roleLabel}
            >
              <RoleIcon size={18} weight="fill" />
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-2 py-2 overflow-y-auto">
          <div className="space-y-0.5">
            {navItems.map((item) => {
              const isActive = currentPage === item.id;
              const Icon = iconMap[item.id] || House;

              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center gap-3 rounded-lg transition-all ${
                    sidebarCollapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2'
                  }`}
                  style={{
                    color: isActive ? styles.textPrimary : styles.textSecondary,
                    backgroundColor: isActive ? styles.bgActive : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = styles.bgHover;
                      e.currentTarget.style.color = styles.textPrimary;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = styles.textSecondary;
                    }
                  }}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon size={18} weight={isActive ? 'fill' : 'regular'} />
                  {!sidebarCollapsed && (
                    <span className={`text-sm ${isActive ? 'font-medium' : ''}`}>
                      {item.label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Bottom Controls */}
        <div
          className="px-2 py-3 border-t"
          style={{ borderColor: styles.border }}
        >
          {/* Sign Out */}
          <button
            onClick={onLogout}
            className={`w-full flex items-center gap-2 rounded-md transition-colors ${
              sidebarCollapsed ? 'justify-center px-2 py-2' : 'px-3 py-2'
            }`}
            style={{ color: styles.textMuted }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = styles.bgHover;
              e.currentTarget.style.color = styles.textPrimary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = styles.textMuted;
            }}
            title={sidebarCollapsed ? t('common.signOut') : undefined}
          >
            <SignOut size={16} />
            {!sidebarCollapsed && <span className="text-sm">{t('common.signOut')}</span>}
          </button>
        </div>
        {/* Resize Handle - invisible but functional */}
        {!sidebarCollapsed && (
          <div
            onMouseDown={handleMouseDown}
            className="absolute top-0 bottom-0 w-2 cursor-col-resize"
            style={{
              [isRtl ? 'left' : 'right']: -4,
            }}
          />
        )}
      </aside>

      {/* Spacer for content - this updates parent layout */}
      <style>{`
        .portal-content-area {
          ${isRtl
            ? `margin-right: ${currentWidth}px; margin-left: 0; transition: ${isResizing ? 'none' : 'margin-right 0.2s'};`
            : `margin-left: ${currentWidth}px; margin-right: 0; transition: ${isResizing ? 'none' : 'margin-left 0.2s'};`
          }
        }
      `}</style>
    </>
  );
};

export default Sidebar;
