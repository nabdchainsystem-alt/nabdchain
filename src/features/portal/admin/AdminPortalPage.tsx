import React, { useState, useEffect } from 'react';
import { Sidebar, ContentTopBar, ToastProvider } from '../components';
import { PortalProvider, usePortal } from '../context/PortalContext';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { portalAdminService } from '../services/portalAdminService';
import { Users, ClipboardText, GearSix, Warning, Spinner } from 'phosphor-react';

type AdminPage = 'users' | 'audit-logs' | 'settings' | 'dashboard';

interface AdminPortalPageProps {
  onLogout: () => void;
  onRoleSwitch?: () => void;
}

const VALID_ADMIN_PAGES: AdminPage[] = ['users', 'audit-logs', 'settings', 'dashboard'];

const AdminPortalContent: React.FC<AdminPortalPageProps> = ({ onLogout, onRoleSwitch }) => {
  const [currentPage, setCurrentPage] = useState<AdminPage>(() => {
    const saved = localStorage.getItem('admin-portal-page') as AdminPage;
    return saved && VALID_ADMIN_PAGES.includes(saved) ? saved : 'users';
  });
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const { direction, styles } = usePortal();

  // Check admin status on mount
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const result = await portalAdminService.checkAdminStatus();
        setIsAdmin(result.isAdmin);
      } catch {
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };
    checkAdmin();
  }, []);

  const navItems = [
    { id: 'users', label: 'Users', icon: Users },
    { id: 'audit-logs', label: 'Audit Logs', icon: ClipboardText },
    { id: 'settings', label: 'Settings', icon: GearSix },
  ];

  const handleNavigate = (page: string) => {
    setCurrentPage(page as AdminPage);
    localStorage.setItem('admin-portal-page', page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'users':
        return <AdminUsersPage onNavigate={handleNavigate} />;
      case 'audit-logs':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-4">Audit Logs</h1>
            <p className="text-zinc-500">Coming soon: View all admin actions and changes.</p>
          </div>
        );
      case 'settings':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-4">Admin Settings</h1>
            <p className="text-zinc-500">Coming soon: Configure portal settings.</p>
          </div>
        );
      default:
        return <AdminUsersPage onNavigate={handleNavigate} />;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: styles.bgPrimary }}>
        <Spinner size={48} className="animate-spin text-blue-500" />
      </div>
    );
  }

  // 403 Forbidden
  if (!isAdmin) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: styles.bgPrimary }}
        dir={direction}
      >
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Warning size={40} className="text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-3">Access Denied</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">
            You don't have permission to access the admin dashboard. This area is restricted to portal administrators
            only.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                localStorage.setItem('portal_type', 'buyer');
                window.location.reload();
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Go to Buyer Portal
            </button>
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen transition-colors"
      style={{ fontFamily: styles.fontBody, backgroundColor: styles.bgPrimary }}
      dir={direction}
    >
      <Sidebar
        role="admin"
        currentPage={currentPage}
        navItems={navItems}
        onNavigate={handleNavigate}
        onLogout={onLogout}
        onRoleSwitch={onRoleSwitch}
      />
      <div className="portal-content-area flex flex-col h-screen overflow-hidden">
        <ContentTopBar role="admin" onNavigate={handleNavigate} onRoleSwitch={onRoleSwitch} onLogout={onLogout} />
        <main className="flex-1 overflow-y-auto pb-8">{renderPage()}</main>
      </div>
    </div>
  );
};

export const AdminPortalPage: React.FC<AdminPortalPageProps> = (props) => {
  return (
    <PortalProvider>
      <ToastProvider position="bottom-right">
        <AdminPortalContent {...props} />
      </ToastProvider>
    </PortalProvider>
  );
};

export default AdminPortalPage;
