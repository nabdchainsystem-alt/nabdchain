import React, { useState } from 'react';
import { Sidebar, ContentTopBar } from '../components';
import {
  BuyerHome,
  Marketplace,
  ItemDetails,
  RequestQuote,
  MyRFQs,
  MyOrders,
  Tracking,
  BuyerWorkspace,
  Tests,
} from './pages';
import { PortalProvider, usePortal } from '../context/PortalContext';

interface BuyerPortalPageProps {
  onLogout: () => void;
  onRoleSwitch?: () => void;
}

type BuyerPage = 'home' | 'marketplace' | 'item-details' | 'rfq' | 'my-rfqs' | 'orders' | 'tracking' | 'workspace' | 'tests';

const BuyerPortalContent: React.FC<BuyerPortalPageProps> = ({
  onLogout,
  onRoleSwitch,
}) => {
  const [currentPage, setCurrentPage] = useState<BuyerPage>(() => {
    const saved = localStorage.getItem('buyer-portal-page');
    return (saved as BuyerPage) || 'home';
  });
  const { t, direction, styles } = usePortal();

  const navItems = [
    { id: 'home', label: t('buyer.nav.home') },
    { id: 'marketplace', label: t('buyer.nav.marketplace') },
    { id: 'rfq', label: t('buyer.nav.requestQuote') },
    { id: 'my-rfqs', label: t('buyer.nav.myRfqs') },
    { id: 'orders', label: t('buyer.nav.orders') },
    { id: 'tests', label: t('buyer.nav.tests') },
    { id: 'workspace', label: t('buyer.nav.workspace') },
  ];

  const handleNavigate = (page: string) => {
    setCurrentPage(page as BuyerPage);
    localStorage.setItem('buyer-portal-page', page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <BuyerHome onNavigate={handleNavigate} />;
      case 'marketplace':
        return <Marketplace onNavigate={handleNavigate} />;
      case 'item-details':
        return <ItemDetails onNavigate={handleNavigate} />;
      case 'rfq':
        return <RequestQuote onNavigate={handleNavigate} />;
      case 'my-rfqs':
        return <MyRFQs onNavigate={handleNavigate} />;
      case 'orders':
        return <MyOrders onNavigate={handleNavigate} />;
      case 'tracking':
        return <Tracking onNavigate={handleNavigate} />;
      case 'tests':
        return <Tests onNavigate={handleNavigate} />;
      case 'workspace':
        return <BuyerWorkspace onNavigate={handleNavigate} />;
      default:
        return <BuyerHome onNavigate={handleNavigate} />;
    }
  };

  return (
    <div
      className="min-h-screen transition-colors"
      style={{ fontFamily: styles.fontBody, backgroundColor: styles.bgPrimary }}
      dir={direction}
    >
      <Sidebar
        role="buyer"
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

export const BuyerPortalPage: React.FC<BuyerPortalPageProps> = (props) => {
  return (
    <PortalProvider>
      <BuyerPortalContent {...props} />
    </PortalProvider>
  );
};

export default BuyerPortalPage;
