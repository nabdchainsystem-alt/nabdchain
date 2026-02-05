import React, { useState } from 'react';
import { Sidebar, ContentTopBar, ToastProvider } from '../components';
import {
  BuyerHome,
  Marketplace,
  ItemDetails,
  Cart,
  RequestQuote,
  MyRFQs,
  MyOrders,
  Purchases,
  Tracking,
  BuyerWorkspace,
  BuyerAnalytics,
  BuyerExpenses,
  BuyerSuppliers,
  DisputeCenter,
  OrderTracking,
} from './pages';
import { BuyerInvoices } from './pages/BuyerInvoices';
import { PortalProvider, usePortal } from '../context/PortalContext';
import { NotificationProvider } from '../context/NotificationContext';
import { CartProvider } from '../context/CartContext';
import { CartDrawer } from './components/CartDrawer';
import { CartIconButton } from './components/CartIconButton';

interface BuyerPortalPageProps {
  onLogout: () => void;
  onRoleSwitch?: () => void;
}

type BuyerPage = 'home' | 'marketplace' | 'item-details' | 'cart' | 'rfq' | 'my-rfqs' | 'orders' | 'invoices' | 'disputes' | 'purchases' | 'tracking' | 'order-tracking' | 'workspace' | 'analytics' | 'expenses' | 'suppliers';

const VALID_BUYER_PAGES: BuyerPage[] = ['home', 'marketplace', 'item-details', 'cart', 'rfq', 'my-rfqs', 'orders', 'invoices', 'disputes', 'purchases', 'tracking', 'order-tracking', 'workspace', 'analytics', 'expenses', 'suppliers'];

const BuyerPortalContent: React.FC<BuyerPortalPageProps> = ({
  onLogout,
  onRoleSwitch,
}) => {
  const [currentPage, setCurrentPage] = useState<BuyerPage>(() => {
    const saved = localStorage.getItem('buyer-portal-page') as BuyerPage;
    // Validate saved page exists
    return saved && VALID_BUYER_PAGES.includes(saved) ? saved : 'home';
  });
  const [selectedItemId, setSelectedItemId] = useState<string | undefined>();
  const [selectedOrderId, setSelectedOrderId] = useState<string | undefined>();
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  // Workspace navigation state
  const [workspaceTab, setWorkspaceTab] = useState<string | undefined>();
  const [workspaceFilters, setWorkspaceFilters] = useState<{ status?: string; health?: string } | undefined>();
  const { t, direction, styles } = usePortal();

  // Cart is removed from sidebar - accessed via TopBar drawer instead
  // Professional navigation order for buyer portal
  const navItems = [
    { id: 'home', label: t('buyer.nav.home') },
    { id: 'marketplace', label: t('buyer.nav.marketplace') },
    { id: 'rfq', label: t('buyer.nav.requestQuote') },
    { id: 'my-rfqs', label: t('buyer.nav.myRfqs') },
    { id: 'orders', label: t('buyer.nav.orders') },
    { id: 'tracking', label: t('buyer.nav.tracking') },
    { id: 'invoices', label: t('buyer.nav.invoices') },
    { id: 'purchases', label: t('buyer.nav.purchases') },
    { id: 'suppliers', label: t('buyer.nav.suppliers') },
    { id: 'disputes', label: t('buyer.nav.disputes') },
    { id: 'analytics', label: t('buyer.nav.analytics') },
    { id: 'expenses', label: t('buyer.nav.expenses') },
    { id: 'workspace', label: t('buyer.nav.workspace') },
  ];

  const handleNavigate = (page: string, data?: Record<string, unknown>) => {
    setCurrentPage(page as BuyerPage);
    localStorage.setItem('buyer-portal-page', page);

    // Handle item details navigation
    if (page === 'item-details' && data?.itemId) {
      setSelectedItemId(data.itemId as string);
    }

    // Handle order tracking navigation
    if (page === 'order-tracking' && data?.orderId) {
      setSelectedOrderId(data.orderId as string);
    }

    // Handle workspace navigation with tab and filters
    if (page === 'workspace') {
      if (data?.tab) {
        setWorkspaceTab(data.tab as string);
      }
      if (data?.filters) {
        setWorkspaceFilters(data.filters as { status?: string; health?: string });
      }
    } else {
      // Clear workspace state when navigating away
      setWorkspaceTab(undefined);
      setWorkspaceFilters(undefined);
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
      case 'cart':
        return <Cart onNavigate={handleNavigate} />;
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
      case 'order-tracking':
        return selectedOrderId ? (
          <OrderTracking orderId={selectedOrderId} onNavigate={handleNavigate} />
        ) : (
          <MyOrders onNavigate={handleNavigate} />
        );
      case 'analytics':
        return <BuyerAnalytics onNavigate={handleNavigate} />;
      case 'expenses':
        return <BuyerExpenses onNavigate={handleNavigate} />;
      case 'workspace':
        return (
          <BuyerWorkspace
            onNavigate={handleNavigate}
            initialTab={workspaceTab as 'dashboard' | 'orders' | 'purchases' | 'invoices' | 'suppliers' | 'inventory' | 'expenses' | undefined}
            initialFilters={workspaceFilters}
          />
        );
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
        <ContentTopBar
          actions={<CartIconButton onClick={() => setIsCartDrawerOpen(true)} />}
          role="buyer"
          onNavigate={handleNavigate}
          onRoleSwitch={onRoleSwitch}
          onLogout={onLogout}
        />
        <main className="flex-1 overflow-y-auto pb-8">
          {renderPage()}
        </main>
      </div>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartDrawerOpen}
        onClose={() => setIsCartDrawerOpen(false)}
        onNavigateToCart={() => handleNavigate('cart')}
      />
    </div>
  );
};

export const BuyerPortalPage: React.FC<BuyerPortalPageProps> = (props) => {
  return (
    <PortalProvider>
      <ToastProvider position="bottom-right">
        <NotificationProvider portalType="buyer">
          <CartProvider>
            <BuyerPortalContent {...props} />
          </CartProvider>
        </NotificationProvider>
      </ToastProvider>
    </PortalProvider>
  );
};

export default BuyerPortalPage;
