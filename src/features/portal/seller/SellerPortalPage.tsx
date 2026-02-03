import React, { useState } from 'react';
import { Sidebar, ContentTopBar } from '../components';
import { PortalProvider, usePortal } from '../context/PortalContext';

// Existing pages
import {
  SellerHome,
  Listings,
  RFQsInbox,
  SellerOrders,
  Analytics,
  SellerWorkspace,
  Tests,
  DisputeInbox,
  SellerPayouts,
  SellerAutomation,
} from './pages';
import { SellerSettings } from './pages/SellerSettings';
import { SellerInvoices } from './pages/SellerInvoices';

type SellerPage = 'home' | 'listings' | 'rfqs' | 'orders' | 'invoices' | 'disputes' | 'payouts' | 'automation' | 'analytics' | 'workspace' | 'tests' | 'settings' | 'profile';

interface SellerPortalPageProps {
  onLogout: () => void;
  onRoleSwitch?: () => void;
}

const SellerPortalContent: React.FC<SellerPortalPageProps> = ({
  onLogout,
  onRoleSwitch,
}) => {
  const [currentPage, setCurrentPage] = useState<SellerPage>(() => {
    const saved = localStorage.getItem('seller-portal-page');
    return (saved as SellerPage) || 'home';
  });
  const { t, direction, styles } = usePortal();

  const navItems = [
    { id: 'home', label: t('seller.nav.home') },
    { id: 'listings', label: t('seller.nav.listings') },
    { id: 'rfqs', label: t('seller.nav.rfqs') },
    { id: 'orders', label: t('seller.nav.orders') },
    { id: 'invoices', label: t('seller.nav.invoices') },
    { id: 'disputes', label: t('seller.nav.disputes') },
    { id: 'payouts', label: 'Payouts' },
    { id: 'automation', label: 'Automation' },
    { id: 'analytics', label: t('seller.nav.analytics') },
    { id: 'workspace', label: t('seller.nav.workspace') },
    { id: 'tests', label: t('seller.nav.tests') },
  ];

  const handleNavigate = (page: string) => {
    setCurrentPage(page as SellerPage);
    localStorage.setItem('seller-portal-page', page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <SellerHome onNavigate={handleNavigate} />;
      case 'listings':
        return <Listings onNavigate={handleNavigate} />;
      case 'rfqs':
        return <RFQsInbox onNavigate={handleNavigate} />;
      case 'orders':
        return <SellerOrders onNavigate={handleNavigate} />;
      case 'invoices':
        return <SellerInvoices onNavigate={handleNavigate} />;
      case 'disputes':
        return <DisputeInbox onNavigate={handleNavigate} />;
      case 'payouts':
        return <SellerPayouts onNavigate={handleNavigate} />;
      case 'automation':
        return <SellerAutomation onNavigate={handleNavigate} />;
      case 'analytics':
        return <Analytics onNavigate={handleNavigate} />;
      case 'tests':
        return <Tests onNavigate={handleNavigate} />;
      case 'workspace':
        return <SellerWorkspace onNavigate={handleNavigate} />;
      case 'settings':
      case 'profile':
        return <SellerSettings />;
      default:
        return <SellerHome onNavigate={handleNavigate} />;
    }
  };

  return (
    <div
      className="min-h-screen transition-colors"
      style={{ fontFamily: styles.fontBody, backgroundColor: styles.bgPrimary }}
      dir={direction}
    >
      <Sidebar
        role="seller"
        currentPage={currentPage}
        navItems={navItems}
        onNavigate={handleNavigate}
        onLogout={onLogout}
        onRoleSwitch={onRoleSwitch}
      />
      <div className="portal-content-area flex flex-col h-screen overflow-hidden">
        <ContentTopBar />
        <main className="flex-1 overflow-y-auto pb-8">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

export const SellerPortalPage: React.FC<SellerPortalPageProps> = (props) => {
  return (
    <PortalProvider>
      <SellerPortalContent {...props} />
    </PortalProvider>
  );
};

export default SellerPortalPage;
