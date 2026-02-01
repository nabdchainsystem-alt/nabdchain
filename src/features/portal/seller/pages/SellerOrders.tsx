import React from 'react';
import { Package } from 'phosphor-react';
import { Container, PageHeader, DataTable, EmptyState } from '../../components';
import { usePortal } from '../../context/PortalContext';

interface SellerOrdersProps {
  onNavigate: (page: string) => void;
}

interface SellerOrder {
  id: string;
  orderNumber: string;
  buyer: string;
  items: number;
  total: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered';
  date: string;
}

export const SellerOrders: React.FC<SellerOrdersProps> = ({ onNavigate }) => {
  const orders: SellerOrder[] = []; // Empty for structure
  const { styles, t } = usePortal();

  const columns = [
    { key: 'orderNumber', header: t('seller.orders.orderNumber'), width: '12%' },
    { key: 'buyer', header: t('seller.orders.buyer'), width: '20%' },
    { key: 'items', header: t('seller.orders.items'), width: '8%' },
    { key: 'total', header: t('seller.orders.total'), width: '12%' },
    {
      key: 'status',
      header: t('seller.orders.status'),
      width: '15%',
      render: (item: SellerOrder) => <OrderStatusBadge status={item.status} />,
    },
    { key: 'date', header: t('seller.orders.date'), width: '15%' },
    {
      key: 'actions',
      header: '',
      width: '18%',
      render: (item: SellerOrder) => <OrderActions status={item.status} />,
    },
  ];

  return (
    <div
      className="min-h-[calc(100vh-64px)] transition-colors"
      style={{ backgroundColor: styles.bgPrimary }}
    >
      <Container variant="full">
        <PageHeader
          title={t('seller.orders.title')}
          subtitle={t('seller.orders.subtitle')}
        />

        {orders.length === 0 ? (
          <EmptyState
            icon={Package}
            title={t('seller.orders.noOrders')}
            description={t('seller.orders.noOrdersDesc')}
          />
        ) : (
          <DataTable
            columns={columns}
            data={orders}
            emptyMessage="No orders found"
          />
        )}
      </Container>
    </div>
  );
};

const OrderActions: React.FC<{ status: SellerOrder['status'] }> = ({ status }) => {
  const { styles, t } = usePortal();

  return (
    <div className="flex items-center gap-2">
      {status === 'pending' && (
        <button
          className="text-xs font-medium px-3 py-1.5 rounded transition-colors"
          style={{
            backgroundColor: styles.isDark ? '#E6E8EB' : '#0F1115',
            color: styles.isDark ? '#0F1115' : '#E6E8EB',
          }}
        >
          {t('common.confirm')}
        </button>
      )}
      {status === 'confirmed' && (
        <button
          className="text-xs font-medium px-3 py-1.5 rounded transition-colors"
          style={{
            backgroundColor: styles.isDark ? '#E6E8EB' : '#0F1115',
            color: styles.isDark ? '#0F1115' : '#E6E8EB',
          }}
        >
          {t('common.ship')}
        </button>
      )}
      <button
        className="text-xs font-medium px-3 py-1.5 rounded transition-colors"
        style={{ color: styles.textSecondary }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = styles.bgHover;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        {t('common.details')}
      </button>
    </div>
  );
};

const OrderStatusBadge: React.FC<{ status: SellerOrder['status'] }> = ({ status }) => {
  const { styles, t } = usePortal();

  const badgeStyles = {
    pending: { bg: styles.isDark ? '#4A3D1A' : '#FFF8E1', text: styles.warning },
    confirmed: { bg: styles.isDark ? '#1E3A5F' : '#E3F2FD', text: styles.info },
    shipped: { bg: styles.bgSecondary, text: styles.textSecondary },
    delivered: { bg: styles.isDark ? '#1B3D2F' : '#E8F5E9', text: styles.success },
  };

  const labels = {
    pending: t('seller.orders.pending'),
    confirmed: t('seller.orders.confirmed'),
    shipped: t('seller.orders.shipped'),
    delivered: t('seller.orders.delivered'),
  };

  return (
    <span
      className="inline-flex px-2.5 py-1 rounded text-xs font-medium"
      style={{ backgroundColor: badgeStyles[status].bg, color: badgeStyles[status].text }}
    >
      {labels[status]}
    </span>
  );
};

export default SellerOrders;
