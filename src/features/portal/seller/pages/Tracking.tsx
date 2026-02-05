// =============================================================================
// Seller Live Tracking Page
// =============================================================================
// Overview page for tracking outbound shipments
// Allows sellers to search and monitor order deliveries
// =============================================================================

import React, { useState } from 'react';
import { Package, Truck, CheckCircle, MapPin, Clock, MagnifyingGlass, ArrowRight, Warning } from 'phosphor-react';
import { Container, PageHeader } from '../../components';
import { usePortal } from '../../context/PortalContext';

interface TrackingProps {
  onNavigate: (page: string, data?: Record<string, unknown>) => void;
}

// Mock data for recent shipments
const mockShipments = [
  {
    id: 'ORD-2024-001234',
    buyer: 'Al-Faisaliah Trading Co.',
    status: 'in_transit',
    statusLabel: 'In Transit',
    carrier: 'SMSA Express',
    trackingNumber: 'SMSA-78923456',
    estimatedDelivery: 'Jan 31, 2024',
    lastUpdate: '2 hours ago',
  },
  {
    id: 'ORD-2024-001233',
    buyer: 'Riyadh Industrial Supplies',
    status: 'out_for_delivery',
    statusLabel: 'Out for Delivery',
    carrier: 'Aramex',
    trackingNumber: 'ARX-45678901',
    estimatedDelivery: 'Today',
    lastUpdate: '30 mins ago',
  },
  {
    id: 'ORD-2024-001232',
    buyer: 'Eastern Construction LLC',
    status: 'delivered',
    statusLabel: 'Delivered',
    carrier: 'DHL',
    trackingNumber: 'DHL-12345678',
    estimatedDelivery: 'Jan 29, 2024',
    lastUpdate: 'Jan 29, 2024',
  },
  {
    id: 'ORD-2024-001230',
    buyer: 'Jeddah Steel Works',
    status: 'delayed',
    statusLabel: 'Delayed',
    carrier: 'SMSA Express',
    trackingNumber: 'SMSA-78923400',
    estimatedDelivery: 'Jan 30, 2024',
    lastUpdate: '1 day ago',
  },
];

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

  const filteredShipments = mockShipments.filter(
    (s) =>
      s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.buyer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className="min-h-screen transition-colors"
      style={{ backgroundColor: styles.bgPrimary }}
    >
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
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: styles.textPrimary }}
          >
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
                placeholder={t('seller.tracking.searchPlaceholder') || 'Enter order ID, buyer name, or tracking number...'}
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
          <QuickStat
            label={t('seller.tracking.inTransit') || 'In Transit'}
            count={2}
            icon={Truck}
            color={styles.info}
            bgColor={styles.isDark ? '#1E3A5F' : '#E3F2FD'}
          />
          <QuickStat
            label={t('seller.tracking.outForDelivery') || 'Out for Delivery'}
            count={1}
            icon={MapPin}
            color="#8b5cf6"
            bgColor={styles.isDark ? '#2D2458' : '#EDE9FE'}
          />
          <QuickStat
            label={t('seller.tracking.deliveredToday') || 'Delivered Today'}
            count={3}
            icon={CheckCircle}
            color={styles.success}
            bgColor={styles.isDark ? '#1B3D2F' : '#E8F5E9'}
          />
          <QuickStat
            label={t('seller.tracking.delayed') || 'Delayed'}
            count={1}
            icon={Warning}
            color={styles.warning}
            bgColor={styles.isDark ? '#3D2F1B' : '#FFF3E0'}
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
                        <span
                          className="font-medium text-sm"
                          style={{ color: styles.textPrimary }}
                        >
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
                      <p
                        className="text-sm truncate"
                        style={{ color: styles.textSecondary }}
                      >
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

// Quick stat card component
const QuickStat: React.FC<{
  label: string;
  count: number;
  icon: React.ComponentType<{ size: number; weight?: string; style?: React.CSSProperties }>;
  color: string;
  bgColor: string;
}> = ({ label, count, icon: Icon, color, bgColor }) => {
  const { styles, direction } = usePortal();
  const isRtl = direction === 'rtl';

  return (
    <div
      className="rounded-lg border p-4 transition-colors"
      style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
    >
      <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: bgColor }}
        >
          <Icon size={20} weight="fill" style={{ color }} />
        </div>
        <div className={isRtl ? 'text-right' : ''}>
          <p className="text-2xl font-bold" style={{ color: styles.textPrimary }}>
            {count}
          </p>
          <p className="text-xs" style={{ color: styles.textMuted }}>
            {label}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Tracking;
