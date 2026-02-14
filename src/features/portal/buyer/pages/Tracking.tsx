// =============================================================================
// Buyer Tracking Page
// =============================================================================
// Track incoming shipments and deliveries with real-time KPI stats
// =============================================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  MagnifyingGlass,
  Truck,
  MapPin,
  CheckCircle,
  Warning,
  Package,
  Spinner,
  Clock,
  CaretDown,
  CaretUp,
} from 'phosphor-react';
import { Container, PageHeader } from '../../components';
import { KPICard } from '../../../../features/board/components/dashboard/KPICard';
import { usePortal } from '../../context/PortalContext';
import { marketplaceOrderService } from '../../services/marketplaceOrderService';
import type { MarketplaceOrder } from '../../types/item.types';
import { STEPPER_STEPS } from '../../components/orders/orders.types';

interface TrackingProps {
  onNavigate: (page: string, data?: Record<string, unknown>) => void;
}

interface TrackingStats {
  inTransit: number;
  outForDelivery: number;
  deliveredToday: number;
  delayed: number;
}

type ShipmentStatus = 'shipped' | 'delivered' | 'processing' | 'confirmed';

const getTrackingStatus = (order: MarketplaceOrder): ShipmentStatus => {
  if (order.status === 'delivered' || order.status === 'closed') return 'delivered';
  if (order.status === 'shipped') return 'shipped';
  if (order.status === 'processing') return 'processing';
  return 'confirmed';
};

const getStatusLabel = (status: ShipmentStatus): string => {
  switch (status) {
    case 'shipped':
      return 'In Transit';
    case 'delivered':
      return 'Delivered';
    case 'processing':
      return 'Preparing';
    case 'confirmed':
      return 'Confirmed';
    default:
      return status;
  }
};

const formatRelativeTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

export const Tracking: React.FC<TrackingProps> = ({ onNavigate: _onNavigate }) => {
  const { styles, t, direction } = usePortal();
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<TrackingStats | null>(null);
  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const isRtl = direction === 'rtl';
  void _onNavigate;

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);

      const [statsData, ordersRes] = await Promise.all([
        marketplaceOrderService.getBuyerTrackingStats(),
        marketplaceOrderService.getBuyerOrders({ limit: 100 }),
      ]);

      setStats(statsData);
      // Show orders that are in active fulfillment (confirmed through delivered)
      const trackable = ordersRes.orders.filter((o: MarketplaceOrder) =>
        ['confirmed', 'processing', 'shipped', 'delivered'].includes(o.status),
      );
      setOrders(trackable);
    } catch {
      setStats({ inTransit: 0, outForDelivery: 0, deliveredToday: 0, delayed: 0 });
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredOrders = useMemo(() => {
    if (!searchQuery) return orders;
    const q = searchQuery.toLowerCase();
    return orders.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        (o.trackingNumber || '').toLowerCase().includes(q) ||
        (o.itemName || '').toLowerCase().includes(q) ||
        (o.carrier || '').toLowerCase().includes(q),
    );
  }, [orders, searchQuery]);

  const getStatusColor = (status: ShipmentStatus) => {
    switch (status) {
      case 'delivered':
        return styles.success;
      case 'shipped':
        return styles.info;
      case 'processing':
        return '#8b5cf6';
      case 'confirmed':
        return styles.warning;
      default:
        return styles.textMuted;
    }
  };

  const getStatusBg = (status: ShipmentStatus) => {
    switch (status) {
      case 'delivered':
        return styles.isDark ? '#1B3D2F' : '#E8F5E9';
      case 'shipped':
        return styles.isDark ? '#1E3A5F' : '#E3F2FD';
      case 'processing':
        return styles.isDark ? '#2D2458' : '#EDE9FE';
      case 'confirmed':
        return styles.isDark ? '#3D2F1B' : '#FFF3E0';
      default:
        return styles.bgSecondary;
    }
  };

  return (
    <div className="min-h-screen transition-colors" style={{ backgroundColor: styles.bgPrimary }}>
      <Container variant="full">
        <PageHeader title={t('buyer.tracking.title')} subtitle={t('buyer.tracking.subtitle')} />

        {/* Search Tracking */}
        <div
          className="rounded-lg border p-6 mb-6 transition-colors"
          style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
        >
          <label className="block text-sm font-medium mb-2" style={{ color: styles.textPrimary }}>
            {t('buyer.tracking.enterTracking') || 'Search shipments'}
          </label>
          <div className={`flex gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <div
              className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-md border transition-colors"
              style={{
                borderColor: styles.border,
                backgroundColor: styles.bgPrimary,
              }}
            >
              <MagnifyingGlass size={18} style={{ color: styles.textMuted }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  t('buyer.tracking.trackingPlaceholder') || 'Enter order ID, tracking number, or item name...'
                }
                className="flex-1 bg-transparent outline-none text-sm"
                style={{
                  color: styles.textPrimary,
                  fontFamily: styles.fontBody,
                }}
              />
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner size={24} className="animate-spin" style={{ color: styles.textMuted }} />
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KPICard
              id="inTransit"
              label={t('buyer.tracking.inTransit') || 'In Transit'}
              value={String(stats?.inTransit ?? 0)}
              change=""
              trend="neutral"
              icon={<Truck size={18} />}
              color="blue"
            />
            <KPICard
              id="outForDelivery"
              label={t('buyer.tracking.outForDelivery') || 'Out for Delivery'}
              value={String(stats?.outForDelivery ?? 0)}
              change=""
              trend="neutral"
              icon={<MapPin size={18} />}
              color="violet"
            />
            <KPICard
              id="deliveredToday"
              label={t('buyer.tracking.deliveredToday') || 'Delivered Today'}
              value={String(stats?.deliveredToday ?? 0)}
              change=""
              trend="neutral"
              icon={<CheckCircle size={18} />}
              color="emerald"
            />
            <KPICard
              id="delayed"
              label={t('buyer.tracking.delayed') || 'Delayed'}
              value={String(stats?.delayed ?? 0)}
              change=""
              trend="neutral"
              icon={<Warning size={18} />}
              color="amber"
            />
          </div>
        )}

        {/* Shipments List */}
        <div
          className="rounded-lg border transition-colors"
          style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
        >
          <div className="p-4 border-b" style={{ borderColor: styles.border }}>
            <h3
              className="text-base font-semibold"
              style={{ color: styles.textPrimary, fontFamily: styles.fontHeading }}
            >
              {t('buyer.tracking.recentShipments') || 'Recent Shipments'}
            </h3>
          </div>

          {isLoading ? (
            <div className="p-8 flex items-center justify-center">
              <Spinner size={24} className="animate-spin" style={{ color: styles.textMuted }} />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-8 text-center">
              <Package size={48} style={{ color: styles.textMuted }} className="mx-auto mb-3" />
              <p style={{ color: styles.textMuted }}>
                {searchQuery
                  ? t('buyer.tracking.noResults') || 'No shipments match your search'
                  : t('buyer.tracking.noTracking') || 'No active shipments'}
              </p>
              <p className="text-sm mt-1" style={{ color: styles.textMuted }}>
                {t('buyer.tracking.noTrackingDesc') || 'Your shipments will appear here once orders are shipped'}
              </p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: styles.border }}>
              {filteredOrders.map((order) => {
                const status = getTrackingStatus(order);
                const statusColor = getStatusColor(status);
                const statusBg = getStatusBg(status);
                const isExpanded = expandedOrderId === order.id;

                return (
                  <div key={order.id}>
                    <div
                      className={`p-4 flex items-center justify-between gap-4 transition-colors cursor-pointer ${
                        isRtl ? 'flex-row-reverse' : ''
                      }`}
                      style={{ backgroundColor: isExpanded ? styles.bgHover : 'transparent' }}
                      onMouseEnter={(e) => {
                        if (!isExpanded) e.currentTarget.style.backgroundColor = styles.bgHover;
                      }}
                      onMouseLeave={(e) => {
                        if (!isExpanded) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                      onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                    >
                      <div className={`flex items-center gap-4 flex-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: statusBg }}
                        >
                          {status === 'delivered' ? (
                            <CheckCircle size={20} weight="fill" style={{ color: statusColor }} />
                          ) : status === 'shipped' ? (
                            <Truck size={20} weight="fill" style={{ color: statusColor }} />
                          ) : (
                            <Package size={20} weight="fill" style={{ color: statusColor }} />
                          )}
                        </div>

                        <div className={`flex-1 min-w-0 ${isRtl ? 'text-right' : ''}`}>
                          <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                            <span className="font-medium text-sm" style={{ color: styles.textPrimary }}>
                              {order.orderNumber}
                            </span>
                            <span
                              className="px-2 py-0.5 rounded text-xs font-medium"
                              style={{ backgroundColor: statusBg, color: statusColor }}
                            >
                              {getStatusLabel(status)}
                            </span>
                          </div>
                          <p className="text-sm truncate" style={{ color: styles.textSecondary }}>
                            {order.itemName || 'Order Item'}
                          </p>
                          {order.trackingNumber && (
                            <div
                              className={`flex items-center gap-2 text-xs mt-1 ${isRtl ? 'flex-row-reverse' : ''}`}
                              style={{ color: styles.textMuted }}
                            >
                              {order.carrier && <span>{order.carrier}</span>}
                              {order.carrier && <span>·</span>}
                              <span>{order.trackingNumber}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className={`${isRtl ? 'text-left' : 'text-right'} flex-shrink-0`}>
                        {order.estimatedDelivery && (
                          <>
                            <p className="text-xs" style={{ color: styles.textMuted }}>
                              {t('buyer.tracking.estDelivery') || 'Est. Delivery'}
                            </p>
                            <p className="text-sm font-medium" style={{ color: styles.textPrimary }}>
                              {new Date(order.estimatedDelivery).toLocaleDateString()}
                            </p>
                          </>
                        )}
                        <div
                          className={`flex items-center gap-1 text-xs mt-1 ${isRtl ? 'flex-row-reverse' : ''}`}
                          style={{ color: styles.textMuted }}
                        >
                          <Clock size={10} />
                          <span>{formatRelativeTime(order.updatedAt || order.createdAt)}</span>
                        </div>
                      </div>

                      {isExpanded ? (
                        <CaretUp size={16} style={{ color: styles.textMuted }} />
                      ) : (
                        <CaretDown size={16} style={{ color: styles.textMuted }} />
                      )}
                    </div>

                    {/* Expanded Timeline */}
                    {isExpanded && (
                      <div className="px-6 pb-5 pt-1" style={{ backgroundColor: styles.bgHover }}>
                        <div className={`${isRtl ? 'mr-14' : 'ml-14'}`}>
                          {STEPPER_STEPS.map((step, idx) => {
                            const isCompleted = step.completedStatuses.includes(order.status);
                            const isActive = step.activeStatuses.includes(order.status);
                            const isLast = idx === STEPPER_STEPS.length - 1;
                            const tsKey = step.timestampKey as keyof MarketplaceOrder | undefined;
                            const timestamp = tsKey ? (order[tsKey] as string | undefined) : undefined;
                            const dotColor = isCompleted ? styles.success : isActive ? styles.info : styles.border;
                            const StepIcon = step.icon;

                            return (
                              <div key={step.key} className={`flex ${isRtl ? 'flex-row-reverse' : ''}`}>
                                {/* Dot + Line */}
                                <div className="flex flex-col items-center" style={{ width: 24 }}>
                                  <div
                                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                                    style={{
                                      backgroundColor: isCompleted || isActive ? dotColor : 'transparent',
                                      border: !isCompleted && !isActive ? `2px solid ${styles.border}` : 'none',
                                    }}
                                  >
                                    <StepIcon
                                      size={12}
                                      weight={isCompleted || isActive ? 'bold' : 'regular'}
                                      style={{ color: isCompleted || isActive ? '#fff' : styles.textMuted }}
                                    />
                                  </div>
                                  {!isLast && (
                                    <div
                                      className="flex-1"
                                      style={{
                                        width: 2,
                                        minHeight: 28,
                                        backgroundColor: isCompleted ? styles.success : styles.border,
                                      }}
                                    />
                                  )}
                                </div>

                                {/* Label + Timestamp */}
                                <div className={`${isRtl ? 'mr-3' : 'ml-3'} pb-4`}>
                                  <p
                                    className="text-sm font-medium"
                                    style={{
                                      color: isCompleted || isActive ? styles.textPrimary : styles.textMuted,
                                    }}
                                  >
                                    {step.label}
                                    {isActive && (
                                      <span
                                        className="text-xs font-normal ml-2 px-1.5 py-0.5 rounded"
                                        style={{ backgroundColor: `${styles.info}18`, color: styles.info }}
                                      >
                                        Current
                                      </span>
                                    )}
                                  </p>
                                  {timestamp && (
                                    <p className="text-xs mt-0.5" style={{ color: styles.textMuted }}>
                                      {new Date(timestamp).toLocaleString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}

                          {/* Tracking details */}
                          {order.trackingNumber && (
                            <div
                              className="mt-1 p-3 rounded-lg border"
                              style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
                            >
                              <p className="text-xs font-medium" style={{ color: styles.textSecondary }}>
                                {t('buyer.tracking.trackingInfo') || 'Tracking Info'}
                              </p>
                              <div className={`flex items-center gap-3 mt-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                <Truck size={14} style={{ color: styles.textMuted }} />
                                <span className="text-sm" style={{ color: styles.textPrimary }}>
                                  {order.carrier && `${order.carrier} · `}
                                  {order.trackingNumber}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Container>
    </div>
  );
};

export default Tracking;
