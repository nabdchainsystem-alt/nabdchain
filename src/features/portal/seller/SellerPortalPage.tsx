import React, { useState, useEffect } from 'react';
import { Sidebar, ContentTopBar, ToastProvider } from '../components';
import { PortalProvider, usePortal } from '../context/PortalContext';
import { NotificationProvider } from '../context/NotificationContext';

// Existing pages
import {
  SellerHome,
  Listings,
  RFQsInbox,
  RFQMarketplace,
  SellerOrders,
  Analytics,
  SellerWorkspace,
  DisputeInbox,
  SellerPayouts,
  SellerAutomation,
  SellerOnboarding,
  Tracking,
  OrderTracking,
} from './pages';
import { SellerSettings } from './pages/SellerSettings';
import { SellerInvoices } from './pages/SellerInvoices';

type SellerPage = 'home' | 'listings' | 'rfqs' | 'rfq-marketplace' | 'orders' | 'tracking' | 'order-tracking' | 'invoices' | 'disputes' | 'payouts' | 'automation' | 'analytics' | 'workspace' | 'settings' | 'profile' | 'onboarding';

interface SellerPortalPageProps {
  onLogout: () => void;
  onRoleSwitch?: () => void;
}

const VALID_SELLER_PAGES: SellerPage[] = ['home', 'listings', 'rfqs', 'rfq-marketplace', 'orders', 'tracking', 'order-tracking', 'invoices', 'disputes', 'payouts', 'automation', 'analytics', 'workspace', 'settings', 'profile', 'onboarding'];

const SellerPortalContent: React.FC<SellerPortalPageProps> = ({
  onLogout,
  onRoleSwitch,
}) => {
  const [currentPage, setCurrentPage] = useState<SellerPage>(() => {
    // Check if we should show onboarding
    const sellerStatus = localStorage.getItem('seller_status');
    if (sellerStatus === 'incomplete') {
      return 'onboarding';
    }
    const saved = localStorage.getItem('seller-portal-page') as SellerPage;
    // Validate saved page exists
    return saved && VALID_SELLER_PAGES.includes(saved) ? saved : 'home';
  });
  const [selectedOrderId, setSelectedOrderId] = useState<string | undefined>();
  const { t, direction, styles } = usePortal();

  // Check onboarding status on mount
  useEffect(() => {
    const checkOnboardingStatus = () => {
      const sellerStatus = localStorage.getItem('seller_status');
      if (sellerStatus === 'incomplete' && currentPage !== 'onboarding') {
        setCurrentPage('onboarding');
      }
    };
    checkOnboardingStatus();
  }, []);

  const navItems = [
    { id: 'home', label: t('seller.nav.home') },
    { id: 'listings', label: t('seller.nav.listings') },
    { id: 'rfq-marketplace', label: t('seller.nav.rfqMarketplace') || 'RFQ Marketplace' },
    { id: 'rfqs', label: t('seller.nav.rfqs') },
    { id: 'orders', label: t('seller.nav.orders') },
    { id: 'tracking', label: t('seller.nav.tracking') || 'Tracking' },
    { id: 'invoices', label: t('seller.nav.invoices') },
    { id: 'payouts', label: t('seller.nav.payouts') || 'Payouts' },
    { id: 'disputes', label: t('seller.nav.disputes') },
    { id: 'automation', label: t('seller.nav.automation') || 'Automation' },
    { id: 'analytics', label: t('seller.nav.analytics') },
    { id: 'workspace', label: t('seller.nav.workspace') },
  ];

  const handleNavigate = (page: string, data?: Record<string, unknown>) => {
    setCurrentPage(page as SellerPage);
    localStorage.setItem('seller-portal-page', page);

    // Handle order tracking navigation
    if (page === 'order-tracking' && data?.orderId) {
      setSelectedOrderId(data.orderId as string);
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <SellerHome onNavigate={handleNavigate} />;
      case 'listings':
        return <Listings onNavigate={handleNavigate} />;
      case 'rfqs':
        return <RFQsInbox onNavigate={handleNavigate} />;
      case 'rfq-marketplace':
        return <RFQMarketplace onNavigate={handleNavigate} />;
      case 'orders':
        return <SellerOrders onNavigate={handleNavigate} />;
      case 'tracking':
        return <Tracking onNavigate={handleNavigate} />;
      case 'order-tracking':
        return selectedOrderId ? (
          <OrderTracking orderId={selectedOrderId} onNavigate={handleNavigate} />
        ) : (
          <Tracking onNavigate={handleNavigate} />
        );
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
      case 'workspace':
        return <SellerWorkspace onNavigate={handleNavigate} />;
      case 'settings':
      case 'profile':
        return <SellerSettings />;
      case 'onboarding':
        return <SellerOnboarding />;
      default:
        return <SellerHome onNavigate={handleNavigate} />;
    }
  };

  // If on onboarding page, render it without sidebar
  if (currentPage === 'onboarding') {
    return (
      <div
        className="min-h-screen transition-colors"
        style={{ fontFamily: styles.fontBody, backgroundColor: styles.bgPrimary }}
        dir={direction}
      >
        <SellerOnboarding />
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
        role="seller"
        currentPage={currentPage}
        navItems={navItems}
        onNavigate={handleNavigate}
        onLogout={onLogout}
        onRoleSwitch={onRoleSwitch}
      />
      <div className="portal-content-area flex flex-col h-screen overflow-hidden">
        <ContentTopBar
          role="seller"
          onNavigate={handleNavigate}
          onRoleSwitch={onRoleSwitch}
          onLogout={onLogout}
        />
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
      <ToastProvider position="bottom-right">
        <NotificationProvider portalType="seller">
          <SellerPortalContent {...props} />
        </NotificationProvider>
      </ToastProvider>
    </PortalProvider>
  );
};

export default SellerPortalPage;
