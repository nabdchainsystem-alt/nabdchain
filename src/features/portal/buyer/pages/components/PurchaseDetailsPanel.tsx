// =============================================================================
// Purchase Details Panel Component
// Slide-from-right panel with tabs for purchase details
// =============================================================================

import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Clock,
  Truck,
  ChartLine,
  MapPin,
  Package,
  ChatCircle,
  WarningCircle,
  Buildings,
  Copy,
  Check,
} from 'phosphor-react';
import { usePortal } from '../../../context/PortalContext';
import { Purchase, PriceComparison, BuyerSupplierMetrics, PurchaseTimelineEvent } from '../../../types/purchase.types';
import { getOrderStatusConfig, getHealthStatusConfig } from '../../../types/order.types';
import PurchaseTimeline from './PurchaseTimeline';
import PriceComparisonCard from './PriceComparisonCard';
import SupplierPerformanceCard from './SupplierPerformanceCard';

type TabId = 'overview' | 'timeline' | 'tracking' | 'history';

interface PurchaseDetailsPanelProps {
  purchase: Purchase | null;
  isOpen: boolean;
  onClose: () => void;
  onReportIssue: (purchase: Purchase) => void;
  // Data that would be fetched
  priceComparison?: PriceComparison | null;
  supplierMetrics?: BuyerSupplierMetrics | null;
  timeline?: PurchaseTimelineEvent[];
  priceHistory?: { date: string; price: number; seller: string }[];
}

export const PurchaseDetailsPanel: React.FC<PurchaseDetailsPanelProps> = ({
  purchase,
  isOpen,
  onClose,
  onReportIssue,
  priceComparison,
  supplierMetrics,
  timeline = [],
  priceHistory = [],
}) => {
  const { styles, t, direction } = usePortal();
  const isRtl = direction === 'rtl';
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [copied, setCopied] = useState(false);

  // Reset tab when panel opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab('overview');
    }
  }, [isOpen, purchase?.id]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateStr?: string | null): string => {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number, currency: string = 'SAR'): string => {
    return `${currency} ${amount.toLocaleString()}`;
  };

  if (!purchase) return null;

  const statusConfig = getOrderStatusConfig(purchase.status);
  const healthConfig = getHealthStatusConfig(purchase.healthStatus || 'on_track');

  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: t('buyer.purchases.overview') || 'Overview', icon: FileText },
    { id: 'timeline', label: t('buyer.purchases.timeline') || 'Timeline', icon: Clock },
    { id: 'tracking', label: t('buyer.purchases.tracking') || 'Tracking', icon: Truck },
    { id: 'history', label: t('buyer.purchases.history') || 'History', icon: ChartLine },
  ];

  const canReportIssue = !purchase.hasException && !['delivered', 'cancelled', 'refunded'].includes(purchase.status);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`
          fixed top-0 bottom-0 z-50 w-full max-w-lg
          transition-transform duration-300 overflow-hidden flex flex-col
          ${isRtl ? 'left-0' : 'right-0'}
          ${isOpen ? 'translate-x-0' : isRtl ? '-translate-x-full' : 'translate-x-full'}
        `}
        style={{ backgroundColor: styles.bgCard }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 border-b flex-shrink-0"
          style={{ borderColor: styles.border }}
        >
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold" style={{ color: styles.textPrimary }}>
                {purchase.orderNumber}
              </h2>
              <button
                onClick={() => copyToClipboard(purchase.orderNumber)}
                className="p-1 rounded transition-colors"
                style={{ color: styles.textMuted }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
            <div className="flex items-center gap-2 mt-1">
              {/* Status badge */}
              <span
                className="text-xs px-2 py-0.5 rounded font-medium"
                style={{
                  backgroundColor: `var(--color-${statusConfig.color}, ${styles.info})20`,
                  color: statusConfig.color === 'success' ? styles.success
                    : statusConfig.color === 'error' ? styles.error
                    : statusConfig.color === 'warning' ? '#f59e0b'
                    : styles.info,
                }}
              >
                {statusConfig.label}
              </span>
              {/* Health badge */}
              <span
                className="text-xs px-2 py-0.5 rounded font-medium"
                style={{
                  backgroundColor: healthConfig.color === 'success' ? `${styles.success}15`
                    : healthConfig.color === 'warning' ? '#f59e0b15'
                    : `${styles.error}15`,
                  color: healthConfig.color === 'success' ? styles.success
                    : healthConfig.color === 'warning' ? '#f59e0b'
                    : styles.error,
                }}
              >
                {healthConfig.label}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{ color: styles.textMuted }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.bgHover)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div
          className="flex border-b flex-shrink-0"
          style={{ borderColor: styles.border }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative"
                style={{ color: isActive ? styles.info : styles.textMuted }}
              >
                <tab.icon size={16} />
                {tab.label}
                {isActive && (
                  <div
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ backgroundColor: styles.info }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Item Info */}
              <div
                className="p-4 rounded-lg"
                style={{ backgroundColor: styles.bgSecondary }}
              >
                <h3 className="text-sm font-semibold mb-3" style={{ color: styles.textPrimary }}>
                  {t('buyer.purchases.itemDetails') || 'Item Details'}
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span style={{ color: styles.textMuted }}>{t('buyer.purchases.item') || 'Item'}:</span>
                    <p className="font-medium" style={{ color: styles.textPrimary }}>{purchase.itemName}</p>
                  </div>
                  <div>
                    <span style={{ color: styles.textMuted }}>{t('buyer.purchases.sku') || 'SKU'}:</span>
                    <p className="font-mono" style={{ color: styles.textPrimary }}>{purchase.itemSku}</p>
                  </div>
                  <div>
                    <span style={{ color: styles.textMuted }}>{t('buyer.purchases.quantity') || 'Quantity'}:</span>
                    <p className="font-medium" style={{ color: styles.textPrimary }}>{purchase.quantity}</p>
                  </div>
                  <div>
                    <span style={{ color: styles.textMuted }}>{t('buyer.purchases.total') || 'Total'}:</span>
                    <p className="font-semibold" style={{ color: styles.textPrimary }}>
                      {formatCurrency(purchase.totalPrice, purchase.currency)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Price Comparison Card */}
              <PriceComparisonCard
                comparison={priceComparison || null}
                currentPrice={purchase.unitPrice}
                currency={purchase.currency}
              />

              {/* Supplier Performance Card */}
              <SupplierPerformanceCard
                metrics={supplierMetrics || null}
                sellerName={purchase.buyerName}
              />

              {/* Issue Alert */}
              {purchase.hasException && (
                <div
                  className="p-4 rounded-lg border"
                  style={{
                    backgroundColor: `${styles.error}05`,
                    borderColor: styles.error,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <WarningCircle size={20} weight="fill" style={{ color: styles.error }} />
                    <div className="flex-1">
                      <p className="font-medium text-sm" style={{ color: styles.error }}>
                        {t('buyer.purchases.activeIssue') || 'Active Issue'}
                      </p>
                      <p className="text-sm mt-1" style={{ color: styles.textMuted }}>
                        {purchase.exceptionMessage || 'An issue has been detected with this order.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'timeline' && (
            <PurchaseTimeline events={timeline} />
          )}

          {activeTab === 'tracking' && (
            <div className="space-y-4">
              {purchase.trackingNumber ? (
                <>
                  {/* Tracking status card */}
                  <div
                    className="p-4 rounded-lg border"
                    style={{
                      backgroundColor: styles.bgSecondary,
                      borderColor: styles.border,
                    }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${styles.info}15` }}
                      >
                        <Truck size={24} style={{ color: styles.info }} />
                      </div>
                      <div>
                        <p className="font-medium" style={{ color: styles.textPrimary }}>
                          {purchase.carrier || 'Carrier'}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono" style={{ color: styles.info }}>
                            {purchase.trackingNumber}
                          </span>
                          <button
                            onClick={() => copyToClipboard(purchase.trackingNumber || '')}
                            className="p-0.5"
                            style={{ color: styles.textMuted }}
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span style={{ color: styles.textMuted }}>
                          {t('buyer.purchases.estimatedDelivery') || 'Estimated Delivery'}:
                        </span>
                        <span style={{ color: styles.textPrimary }}>
                          {formatDate(purchase.estimatedDelivery)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Track button */}
                  <button
                    className="w-full py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    style={{ backgroundColor: styles.info, color: '#fff' }}
                  >
                    <MapPin size={16} />
                    {t('buyer.purchases.trackPackage') || 'Track Package'}
                  </button>
                </>
              ) : (
                <div className="text-center py-8">
                  <Truck size={48} style={{ color: styles.textMuted }} className="mx-auto mb-3" />
                  <p className="text-sm" style={{ color: styles.textMuted }}>
                    {t('buyer.purchases.noTrackingYet') || 'No tracking information available yet'}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold" style={{ color: styles.textPrimary }}>
                {t('buyer.purchases.priceHistory') || 'Price History'} - {purchase.itemSku}
              </h3>
              {priceHistory.length > 0 ? (
                <div className="space-y-2">
                  {priceHistory.map((entry, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg"
                      style={{ backgroundColor: styles.bgSecondary }}
                    >
                      <div>
                        <p className="text-sm font-medium" style={{ color: styles.textPrimary }}>
                          {entry.seller}
                        </p>
                        <p className="text-xs" style={{ color: styles.textMuted }}>
                          {entry.date}
                        </p>
                      </div>
                      <p className="text-sm font-semibold" style={{ color: styles.textPrimary }}>
                        {formatCurrency(entry.price, purchase.currency)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ChartLine size={48} style={{ color: styles.textMuted }} className="mx-auto mb-3" />
                  <p className="text-sm" style={{ color: styles.textMuted }}>
                    {t('buyer.purchases.noPriceHistory') || 'No previous purchases of this item'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between p-4 border-t flex-shrink-0"
          style={{ borderColor: styles.border, backgroundColor: styles.bgSecondary }}
        >
          {canReportIssue ? (
            <button
              onClick={() => onReportIssue(purchase)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ color: styles.error }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `${styles.error}10`)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <WarningCircle size={16} />
              {t('buyer.purchases.reportIssue') || 'Report Issue'}
            </button>
          ) : (
            <div />
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ backgroundColor: styles.bgCard, color: styles.textPrimary }}
          >
            {t('common.close') || 'Close'}
          </button>
        </div>
      </div>
    </>
  );
};

export default PurchaseDetailsPanel;
