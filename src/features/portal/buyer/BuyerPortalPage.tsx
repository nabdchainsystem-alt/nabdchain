import React, { useState } from 'react';
import { Sidebar, ContentTopBar } from '../components';
import {
  BuyerHome,
  Marketplace,
  ItemDetails,
  RequestQuote,
  MyRFQs,
  MyOrders,
  Purchases,
  Tracking,
  BuyerWorkspace,
  BuyerAnalytics,
  BuyerExpenses,
  BuyerSuppliers,
  Tests,
  DisputeCenter,
} from './pages';
import { BuyerInvoices } from './pages/BuyerInvoices';
import { PortalProvider, usePortal } from '../context/PortalContext';

interface BuyerPortalPageProps {
  onLogout: () => void;
  onRoleSwitch?: () => void;
}

type BuyerPage = 'home' | 'marketplace' | 'item-details' | 'rfq' | 'my-rfqs' | 'orders' | 'invoices' | 'disputes' | 'purchases' | 'tracking' | 'workspace' | 'analytics' | 'expenses' | 'suppliers' | 'tests';

const BuyerPortalContent: React.FC<BuyerPortalPageProps> = ({
  onLogout,
  onRoleSwitch,
}) => {
  const [currentPage, setCurrentPage] = useState<BuyerPage>(() => {
    const saved = localStorage.getItem('buyer-portal-page');
    return (saved as BuyerPage) || 'home';
  });
  const [selectedItemId, setSelectedItemId] = useState<string | undefined>();
  const { t, direction, styles } = usePortal();

  const navItems = [
    { id: 'home', label: t('buyer.nav.home') },
    { id: 'marketplace', label: t('buyer.nav.marketplace') },
    { id: 'rfq', label: t('buyer.nav.requestQuote') },
    { id: 'my-rfqs', label: t('buyer.nav.myRfqs') },
    { id: 'orders', label: t('buyer.nav.orders') },
    { id: 'invoices', label: t('buyer.nav.invoices') },
    { id: 'disputes', label: t('buyer.nav.disputes') },
    { id: 'purchases', label: t('buyer.nav.purchases') },
    { id: 'suppliers', label: t('buyer.nav.suppliers') },
    { id: 'analytics', label: t('buyer.nav.analytics') },
    { id: 'expenses', label: t('buyer.nav.expenses') },
    { id: 'workspace', label: t('buyer.nav.workspace') },
    { id: 'tests', label: t('buyer.nav.tests') },
  ];

  const handleNavigate = (page: string, data?: Record<string, unknown>) => {
    setCurrentPage(page as BuyerPage);
    localStorage.setItem('buyer-portal-page', page);

    // Handle item details navigation
    if (page === 'item-details' && data?.itemId) {
      setSelectedItemId(data.itemId as string);
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <BuyerHome onNavigate={handleNavigate} />;
      case 'marketplace':
        return <Marketplace onNavigate={handleNavigate} />;
      case 'item-details':
        return <ItemDetails onNavigate={handleNavigate} itemId={selectedItemId} />;
      case 'rfq':
        return <RequestQuote onNavigate={handleNavigate} />;
      case 'my-rfqs':
        return <MyRFQs onNavigate={handleNavigate} />;
      case 'orders':
        return <MyOrders onNavigate={handleNavigate} />;
      case 'invoices':
        return <BuyerInvoices onNavigate={handleNavigate} />;
      case 'disputes':
        return <DisputeCenter onNavigate={handleNavigate} />;
      case 'purchases':
        return <Purchases onNavigate={handleNavigate} />;
      case 'suppliers':
        return <BuyerSuppliers onNavigate={handleNavigate} />;
      case 'tracking':
        return <Tracking onNavigate={handleNavigate} />;
      case 'analytics':
        return <BuyerAnalytics onNavigate={handleNavigate} />;
      case 'expenses':
        return <BuyerExpenses onNavigate={handleNavigate} />;
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
