// =============================================================================
// Order KPI Cards - Summary metrics using unified KPICard
// =============================================================================

import React from 'react';
import { Package, CurrencyDollar, CheckCircle, Truck, Lightning } from 'phosphor-react';
import { KPICard } from '../../../board/components/dashboard/KPICard';
import type { OrderRole, OrderStats, Order } from './orders.types';
import { formatCurrency } from './orders.utils';

interface OrderKPICardsProps {
  role: OrderRole;
  stats: OrderStats;
  orders: Order[];
}

// =============================================================================
// Main Component
// =============================================================================

export const OrderKPICards: React.FC<OrderKPICardsProps> = ({ role, stats, orders }) => {
  // Calculate fulfillment rate
  const totalNonCancelled = stats.total - stats.cancelled;
  const fulfillmentRate = totalNonCancelled > 0 ? Math.round((stats.delivered / totalNonCancelled) * 100) : 0;

  // Calculate avg delivery time
  const deliveredOrders = orders.filter((o) => o.status === 'delivered' && o.deliveredAt && o.createdAt);
  const avgDeliveryDays =
    deliveredOrders.length > 0
      ? Math.round(
          (deliveredOrders.reduce((sum, o) => {
            const created = new Date(o.createdAt).getTime();
            const delivered = new Date(o.deliveredAt!).getTime();
            return sum + (delivered - created) / (1000 * 60 * 60 * 24);
          }, 0) /
            deliveredOrders.length) *
            10,
        ) / 10
      : 0;

  // Revenue/Spend
  const currency = orders[0]?.currency || 'SAR';
  const revenueLabel = role === 'seller' ? 'Revenue' : 'Total Spend';

  return (
    <div
      className={`grid gap-3 mb-4 ${role === 'seller' ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5' : 'grid-cols-2 lg:grid-cols-4'}`}
    >
      {/* Total Orders */}
      <KPICard
        id="totalOrders"
        label="Total Orders"
        value={String(stats.total)}
        change=""
        trend="neutral"
        icon={<Package size={18} />}
        color="blue"
      />

      {/* Revenue / Spend */}
      <KPICard
        id="revenue"
        label={revenueLabel}
        value={formatCurrency(stats.totalRevenue, currency)}
        change=""
        trend="neutral"
        icon={<CurrencyDollar size={18} />}
        color="emerald"
      />

      {/* Fulfillment Rate */}
      <KPICard
        id="fulfillmentRate"
        label="Fulfillment Rate"
        value={`${fulfillmentRate}%`}
        change=""
        trend={fulfillmentRate >= 80 ? 'up' : fulfillmentRate >= 50 ? 'neutral' : 'down'}
        icon={<CheckCircle size={18} />}
        color="emerald"
      />

      {/* Avg Delivery Time */}
      <KPICard
        id="avgDelivery"
        label="Avg Delivery"
        value={avgDeliveryDays > 0 ? `${avgDeliveryDays} days` : '-'}
        change=""
        trend="neutral"
        icon={<Truck size={18} />}
        color="violet"
      />

      {/* Pending Actions (seller only) */}
      {role === 'seller' && (
        <KPICard
          id="pendingActions"
          label="Pending Actions"
          value={String(stats.needsAction)}
          change=""
          trend={stats.needsAction > 0 ? 'down' : 'neutral'}
          icon={<Lightning size={18} />}
          color="red"
        />
      )}
    </div>
  );
};
