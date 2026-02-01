import React, { useState } from 'react';
import { TopNav } from '../components';
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
} from './pages';

type SellerPage = 'home' | 'listings' | 'rfqs' | 'orders' | 'analytics' | 'workspace' | 'tests';

interface SellerPortalPageProps {
  onLogout: () => void;
  onRoleSwitch?: () => void;
}

const SellerPortalContent: React.FC<SellerPortalPageProps> = ({
  onLogout,
  onRoleSwitch,
}) => {
  const [currentPage, setCurrentPage] = useState<SellerPage>('home');
  const { t, direction, styles } = usePortal();

  const navItems = [
    { id: 'home', label: t('seller.nav.home') },
    { id: 'listings', label: t('seller.nav.listings') },
    { id: 'rfqs', label: t('seller.nav.rfqs') },
    { id: 'orders', label: t('seller.nav.orders') },
    { id: 'analytics', label: t('seller.nav.analytics') },
    { id: 'tests', label: t('seller.nav.tests') },
    { id: 'workspace', label: t('seller.nav.workspace') },
  ];

  const handleNavigate = (page: string) => {
    setCurrentPage(page as SellerPage);
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
      case 'analytics':
        return <Analytics onNavigate={handleNavigate} />;
      case 'tests':
        return <Tests onNavigate={handleNavigate} />;
      case 'workspace':
        return <SellerWorkspace onNavigate={handleNavigate} />;
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
      <TopNav
        role="seller"
        currentPage={currentPage}
        navItems={navItems}
        onNavigate={handleNavigate}
        onLogout={onLogout}
        onRoleSwitch={onRoleSwitch}
      />
      <main>
        {renderPage()}
      </main>
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
