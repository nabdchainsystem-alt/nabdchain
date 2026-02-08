// =============================================================================
// Seller Live Tracking Page
// =============================================================================
// Overview page for tracking outbound shipments
// Allows sellers to search and monitor order deliveries
// =============================================================================

import React, { useState } from 'react';
import { Package, Truck, CheckCircle, MapPin, Clock, MagnifyingGlass, ArrowRight, Warning } from 'phosphor-react';
import { Container, PageHeader } from '../../components';
import { KPICard } from '../../../../features/board/components/dashboard/KPICard';
import { usePortal } from '../../context/PortalContext';

interface TrackingProps {
  onNavigate: (page: string, data?: Record<string, unknown>) => void;
}

const shipments: {
  id: string;
  buyer: string;
  status: string;
  statusLabel: string;
  carrier: string;
  trackingNumber: string;
  estimatedDelivery: string;
  lastUpdate: string;
}[] = [];

export const Tracking: React.FC<TrackingProps> = ({ onNavigate }) => {
  const { styles, t, direction } = usePortal();
  const [searchQuery, setSearchQuery] = useState('');
  const isRtl = direction === 'rtl';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return styles.success;
      case 'in_transit':
        return styles.info;
      case 'out_for_delivery':
        return '#8b5cf6'; // purple
      case 'delayed':
        return styles.warning;
      default:
        return styles.textMuted;
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'delivered':
        return styles.isDark ? '#1B3D2F' : '#E8F5E9';
      case 'in_transit':
        return styles.isDark ? '#1E3A5F' : '#E3F2FD';
      case 'out_for_delivery':
        return styles.isDark ? '#2D2458' : '#EDE9FE';
      case 'delayed':
        return styles.isDark ? '#3D2F1B' : '#FFF3E0';
      default:
        return styles.bgSecondary;
    }
  };

  const handleTrackOrder = (orderId: string) => {
    onNavigate('order-tracking', { orderId });
  };

  const filteredShipments = shipments.filter(
    (s) =>
      s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.buyer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen transition-colors" style={{ backgroundColor: styles.bgPrimary }}>
      <Container variant="full">
        <PageHeader
          title={t('seller.tracking.title') || 'Live Tracking'}
          subtitle={t('seller.tracking.subtitle') || 'Monitor your shipments in real-time'}
        />

        {/* Search Tracking */}
        <div
          className="rounded-lg border p-6 mb-6 transition-colors"
          style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
        >
          <label className="block text-sm font-medium mb-2" style={{ color: styles.textPrimary }}>
            {t('seller.tracking.searchLabel') || 'Search by Order ID, Buyer, or Tracking Number'}
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
                  t('seller.tracking.searchPlaceholder') || 'Enter order ID, buyer name, or tracking number...'
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KPICard
            id="inTransit"
            label={t('seller.tracking.inTransit') || 'In Transit'}
            value="2"
            change=""
            trend="neutral"
            icon={<Truck size={18} />}
            color="blue"
          />
          <KPICard
            id="outForDelivery"
            label={t('seller.tracking.outForDelivery') || 'Out for Delivery'}
            value="1"
            change=""
            trend="neutral"
            icon={<MapPin size={18} />}
            color="violet"
          />
          <KPICard
            id="deliveredToday"
            label={t('seller.tracking.deliveredToday') || 'Delivered Today'}
            value="3"
            change=""
            trend="neutral"
            icon={<CheckCircle size={18} />}
            color="emerald"
          />
          <KPICard
            id="delayed"
            label={t('seller.tracking.delayed') || 'Delayed'}
            value="1"
            change=""
            trend="neutral"
            icon={<Warning size={18} />}
            color="amber"
          />
        </div>

        {/* Recent Shipments */}
        <div
          className="rounded-lg border transition-colors"
          style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
        >
          <div className="p-4 border-b" style={{ borderColor: styles.border }}>
            <h3
              className="text-base font-semibold"
              style={{ color: styles.textPrimary, fontFamily: styles.fontHeading }}
            >
              {t('seller.tracking.recentShipments') || 'Recent Shipments'}
            </h3>
          </div>

          {filteredShipments.length === 0 ? (
            <div className="p-8 text-center">
              <Package size={48} style={{ color: styles.textMuted }} className="mx-auto mb-3" />
              <p style={{ color: styles.textMuted }}>
                {searchQuery
                  ? t('seller.tracking.noResults') || 'No shipments match your search'
                  : t('seller.tracking.noShipments') || 'No active shipments'}
              </p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: styles.border }}>
              {filteredShipments.map((shipment) => (
                <div
                  key={shipment.id}
                  className={`p-4 flex items-center justify-between gap-4 hover:bg-opacity-50 transition-colors cursor-pointer ${
                    isRtl ? 'flex-row-reverse' : ''
                  }`}
                  style={{ backgroundColor: 'transparent' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.bgHover)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  onClick={() => handleTrackOrder(shipment.id)}
                >
                  <div className={`flex items-center gap-4 flex-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: getStatusBg(shipment.status) }}
                    >
                      {shipment.status === 'delayed' ? (
                        <Warning size={20} weight="fill" style={{ color: getStatusColor(shipment.status) }} />
                      ) : shipment.status === 'delivered' ? (
                        <CheckCircle size={20} weight="fill" style={{ color: getStatusColor(shipment.status) }} />
                      ) : shipment.status === 'out_for_delivery' ? (
                        <MapPin size={20} weight="fill" style={{ color: getStatusColor(shipment.status) }} />
                      ) : (
                        <Truck size={20} weight="fill" style={{ color: getStatusColor(shipment.status) }} />
                      )}
                    </div>

                    <div className={`flex-1 min-w-0 ${isRtl ? 'text-right' : ''}`}>
                      <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <span className="font-medium text-sm" style={{ color: styles.textPrimary }}>
                          {shipment.id}
                        </span>
                        <span
                          className="px-2 py-0.5 rounded text-xs font-medium"
                          style={{
                            backgroundColor: getStatusBg(shipment.status),
                            color: getStatusColor(shipment.status),
                          }}
                        >
                          {shipment.statusLabel}
                        </span>
                      </div>
                      <p className="text-sm truncate" style={{ color: styles.textSecondary }}>
                        {shipment.buyer}
                      </p>
                      <div
                        className={`flex items-center gap-2 text-xs mt-1 ${isRtl ? 'flex-row-reverse' : ''}`}
                        style={{ color: styles.textMuted }}
                      >
                        <span>{shipment.carrier}</span>
                        <span>•</span>
                        <span>{shipment.trackingNumber}</span>
                      </div>
                    </div>
                  </div>

                  <div className={`${isRtl ? 'text-left' : 'text-right'} flex-shrink-0`}>
                    <p className="text-xs" style={{ color: styles.textMuted }}>
                      {t('seller.tracking.estDelivery') || 'Est. Delivery'}
                    </p>
                    <p
                      className="text-sm font-medium"
                      style={{ color: shipment.status === 'delayed' ? styles.warning : styles.textPrimary }}
                    >
                      {shipment.estimatedDelivery}
                    </p>
                    <div
                      className={`flex items-center gap-1 text-xs mt-1 ${isRtl ? 'flex-row-reverse' : ''}`}
                      style={{ color: styles.textMuted }}
                    >
                      <Clock size={10} />
                      <span>{shipment.lastUpdate}</span>
                    </div>
                  </div>

                  <ArrowRight
                    size={16}
                    style={{
                      color: styles.textMuted,
                      transform: isRtl ? 'rotate(180deg)' : 'none',
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </Container>
    </div>
  );
};

export default Tracking;
