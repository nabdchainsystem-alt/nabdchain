import React from 'react';
import { Package } from 'phosphor-react';
import { Container, PageHeader, DataTable, EmptyState } from '../../components';
import { usePortal } from '../../context/PortalContext';

interface MyOrdersProps {
  onNavigate: (page: string) => void;
}

interface Order {
  id: string;
  orderNumber: string;
  supplier: string;
  items: number;
  total: string;
  status: 'processing' | 'shipped' | 'delivered' | 'cancelled';
  date: string;
}

export const MyOrders: React.FC<MyOrdersProps> = ({ onNavigate }) => {
  const orders: Order[] = []; // Empty for structure
  const { styles, t } = usePortal();

  const columns = [
    { key: 'orderNumber', header: t('buyer.orders.orderNumber'), width: '15%' },
    { key: 'supplier', header: t('buyer.orders.supplier'), width: '20%' },
    { key: 'items', header: t('buyer.orders.items'), width: '10%' },
    { key: 'total', header: t('buyer.orders.total'), width: '15%' },
    {
      key: 'status',
      header: t('buyer.orders.status'),
      width: '15%',
      render: (item: Order) => <OrderStatusBadge status={item.status} />,
    },
    { key: 'date', header: t('buyer.orders.date'), width: '15%' },
    {
      key: 'actions',
      header: '',
      width: '10%',
      render: () => <ActionButton label={t('common.track')} onClick={() => onNavigate('tracking')} />,
    },
  ];

  return (
    <div
      className="min-h-[calc(100vh-64px)] transition-colors"
      style={{ backgroundColor: styles.bgPrimary }}
    >
      <Container variant="full">
        <PageHeader
          title={t('buyer.orders.title')}
          subtitle={t('buyer.orders.subtitle')}
        />

        {orders.length === 0 ? (
          <EmptyState
            icon={Package}
            title={t('buyer.orders.noOrders')}
            description={t('buyer.orders.noOrdersDesc')}
            action={
              <button
                onClick={() => onNavigate('marketplace')}
                className="text-sm font-medium"
                style={{ color: styles.textPrimary }}
              >
                {t('buyer.orders.browseMarketplace')}
              </button>
            }
          />
        ) : (
          <DataTable
            columns={columns}
            data={orders}
            emptyMessage="No orders found"
            onRowClick={() => onNavigate('tracking')}
          />
        )}
      </Container>
    </div>
  );
};

const ActionButton: React.FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => {
  const { styles } = usePortal();

  return (
    <button
      onClick={onClick}
      className="text-xs font-medium px-3 py-1.5 rounded transition-colors"
      style={{ color: styles.textSecondary }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = styles.bgHover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      {label}
    </button>
  );
};

const OrderStatusBadge: React.FC<{ status: Order['status'] }> = ({ status }) => {
  const { styles, t } = usePortal();

  const badgeStyles = {
    processing: { bg: styles.bgSecondary, text: styles.textSecondary },
    shipped: { bg: styles.isDark ? '#1E3A5F' : '#E3F2FD', text: styles.info },
    delivered: { bg: styles.isDark ? '#1B3D2F' : '#E8F5E9', text: styles.success },
    cancelled: { bg: styles.isDark ? '#4A2525' : '#FFEBEE', text: styles.error },
  };

  const labels = {
    processing: t('buyer.orders.processing'),
    shipped: t('buyer.orders.shipped'),
    delivered: t('buyer.orders.delivered'),
    cancelled: t('buyer.orders.cancelled'),
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

export default MyOrders;
