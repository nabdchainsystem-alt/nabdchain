import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Package,
  User,
  Cube,
  Truck,
  CurrencyDollar,
  Clock,
  CheckCircle,
  XCircle,
  CaretDown,
  CaretUp,
  FileText,
  CopySimple,
  Check,
  ListBullets,
} from 'phosphor-react';
import { usePortal } from '../../context/PortalContext';
import {
  Order,
  getOrderStatusConfig,
  getPaymentStatusConfig,
  getFulfillmentStatusConfig,
  canConfirmOrder,
  canShipOrder,
  canCancelOrder,
  canMarkDelivered,
} from '../../types/order.types';
import { EnhancedOrderTimeline } from './EnhancedOrderTimeline';
import { DelayReasonModal, DelayReasonData } from './DelayReasonModal';
import { orderTimelineApiService } from '../../services/orderTimelineService';
import { OrderTimeline } from '../../types/timeline.types';

interface OrderDetailsPanelProps {
  isOpen: boolean;
  order: Order | null;
  onClose: () => void;
  onConfirm: (order: Order) => void;
  onShip: (order: Order) => void;
  onMarkDelivered: (order: Order) => void;
  onCancel: (order: Order) => void;
}

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatCurrency = (amount: number, currency: string): string => {
  return `${currency} ${amount.toLocaleString()}`;
};

export const OrderDetailsPanel: React.FC<OrderDetailsPanelProps> = ({
  isOpen,
  order,
  onClose,
  onConfirm,
  onShip,
  onMarkDelivered,
  onCancel,
}) => {
  const { styles, t, direction, ...portalRest } = usePortal();
  const sellerId = (portalRest as Record<string, unknown>).sellerId as string | undefined;
  const isRtl = direction === 'rtl';
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'timeline'>('details');
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [showDelayModal, setShowDelayModal] = useState(false);
  const [timelineData, setTimelineData] = useState<Partial<OrderTimeline> | null>(null);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(false);

  // Load timeline data when order changes or timeline tab is selected
  useEffect(() => {
    if (order && activeTab === 'timeline') {
      loadTimelineData();
    }
  }, [order?.id, activeTab]);

  const loadTimelineData = useCallback(async () => {
    if (!order || !sellerId) {
      // No seller context - show empty state
      setTimelineData(null);
      return;
    }

    setIsLoadingTimeline(true);
    try {
      const data = await orderTimelineApiService.getOrderTimeline(order.id, sellerId);
      setTimelineData(data);
    } catch (error) {
      console.error('[OrderDetailsPanel] Failed to load timeline:', error);
      // Show empty state on error - no mock fallback
      setTimelineData(null);
    } finally {
      setIsLoadingTimeline(false);
    }
  }, [order, sellerId]);

  const handleReportDelay = () => {
    setShowDelayModal(true);
  };

  const handleSubmitDelay = async (data: DelayReasonData) => {
    if (!order || !sellerId) return;
    await orderTimelineApiService.reportOrderDelay(order.id, sellerId, data);
    // Refresh timeline after reporting delay
    loadTimelineData();
  };

  if (!order) return null;

  const statusConfig = getOrderStatusConfig(order.status);
  const paymentConfig = getPaymentStatusConfig(order.paymentStatus);
  const fulfillmentConfig = getFulfillmentStatusConfig(order.fulfillmentStatus);

  const colorMap: Record<string, string> = {
    warning: styles.warning,
    info: styles.info,
    primary: '#8B5CF6',
    success: styles.success,
    error: styles.error,
    muted: styles.textMuted,
  };

  const bgColorMap: Record<string, string> = {
    warning: styles.isDark ? '#4A3D1A' : '#FFF8E1',
    info: styles.isDark ? '#1E3A5F' : '#E3F2FD',
    primary: styles.isDark ? '#3B2D5F' : '#EDE9FE',
    success: styles.isDark ? '#1B3D2F' : '#E8F5E9',
    error: styles.isDark ? '#3D1B1B' : '#FFEBEE',
    muted: styles.bgSecondary,
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getAuditActionLabel = (action: string): string => {
    const labels: Record<string, string> = {
      created: 'Order Created',
      confirmed: 'Order Confirmed',
      status_changed: 'Status Changed',
      payment_updated: 'Payment Updated',
      fulfillment_updated: 'Fulfillment Updated',
      shipped: 'Order Shipped',
      delivered: 'Order Delivered',
      cancelled: 'Order Cancelled',
      refunded: 'Order Refunded',
      note_added: 'Note Added',
      tracking_added: 'Tracking Added',
    };
    return labels[action] || action;
  };

  const getActorLabel = (actor: string): string => {
    const labels: Record<string, string> = {
      buyer: 'Buyer',
      seller: 'Seller',
      system: 'System',
    };
    return labels[actor] || actor;
  };

  // Animation states for smooth enter/exit
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop - transparent, just for click-outside */}
      <div className="fixed inset-0 z-40" style={{ top: '64px' }} onClick={onClose} />

      {/* Panel */}
      <div
        className="fixed z-50 w-full max-w-lg overflow-hidden flex flex-col"
        dir={direction}
        style={{
          top: '64px',
          bottom: 0,
          backgroundColor: styles.bgCard,
          borderLeft: isRtl ? 'none' : `1px solid ${styles.border}`,
          borderRight: isRtl ? `1px solid ${styles.border}` : 'none',
          boxShadow: styles.isDark ? '-12px 0 40px rgba(0, 0, 0, 0.6)' : '-8px 0 30px rgba(0, 0, 0, 0.1)',
          right: isRtl ? 'auto' : 0,
          left: isRtl ? 0 : 'auto',
          transform: isAnimating ? 'translateX(0)' : isRtl ? 'translateX(-100%)' : 'translateX(100%)',
          transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
          style={{ borderColor: styles.border }}
        >
          <div>
            <h2 className="text-lg font-semibold" style={{ color: styles.textPrimary }}>
              {t('seller.orders.orderDetails')}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-medium" style={{ color: styles.info }}>
                {order.orderNumber}
              </span>
              <button
                onClick={() => handleCopy(order.orderNumber, 'orderNumber')}
                className="p-0.5 rounded hover:bg-opacity-10"
                style={{ color: styles.textMuted }}
              >
                {copiedField === 'orderNumber' ? <Check size={14} /> : <CopySimple size={14} />}
              </button>
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

        {/* Status Bar */}
        <div
          className="px-6 py-3 border-b flex items-center gap-3 flex-shrink-0"
          style={{ borderColor: styles.border }}
        >
          <span
            className="inline-flex px-2.5 py-1 rounded text-xs font-medium"
            style={{
              backgroundColor: bgColorMap[statusConfig.color],
              color: colorMap[statusConfig.color],
            }}
          >
            {t(statusConfig.labelKey)}
          </span>
          <span className="flex items-center gap-1 text-xs" style={{ color: colorMap[paymentConfig.color] }}>
            <CurrencyDollar size={12} />
            {t(paymentConfig.labelKey)}
          </span>
          <span className="flex items-center gap-1 text-xs" style={{ color: styles.textMuted }}>
            <Truck size={12} />
            {t(fulfillmentConfig.labelKey)}
          </span>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b flex gap-4 flex-shrink-0" style={{ borderColor: styles.border }}>
          <button
            onClick={() => setActiveTab('details')}
            className={`py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'details' ? '' : 'border-transparent'
            }`}
            style={{
              color: activeTab === 'details' ? styles.info : styles.textMuted,
              borderColor: activeTab === 'details' ? styles.info : 'transparent',
            }}
          >
            {t('seller.orders.orderInfo')}
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'timeline' ? '' : 'border-transparent'
            }`}
            style={{
              color: activeTab === 'timeline' ? styles.info : styles.textMuted,
              borderColor: activeTab === 'timeline' ? styles.info : 'transparent',
            }}
          >
            {t('seller.orders.auditLog')}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'details' ? (
            <div className="p-6 space-y-6">
              {/* Item Details */}
              <Section title={t('seller.orders.itemDetails')} icon={Cube} styles={styles}>
                <div
                  className="flex items-start gap-4 p-4 rounded-lg border"
                  style={{ borderColor: styles.border, backgroundColor: styles.bgSecondary }}
                >
                  <div
                    className="w-16 h-16 rounded-lg flex-shrink-0 overflow-hidden border flex items-center justify-center"
                    style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
                  >
                    {order.itemImage ? (
                      <img src={order.itemImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Cube size={28} style={{ color: styles.textMuted }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium" style={{ color: styles.textPrimary }}>
                      {order.itemName}
                    </p>
                    <p className="text-sm mt-0.5" style={{ color: styles.textMuted }}>
                      SKU: {order.itemSku}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-sm" style={{ color: styles.textSecondary }}>
                        {t('seller.orders.quantity')}: <strong>{order.quantity}</strong>
                      </span>
                      <span className="text-sm" style={{ color: styles.textSecondary }}>
                        {t('seller.orders.unitPrice')}:{' '}
                        <strong>{formatCurrency(order.unitPrice, order.currency)}</strong>
                      </span>
                    </div>
                  </div>
                </div>
                <div
                  className="flex items-center justify-between mt-3 pt-3 border-t"
                  style={{ borderColor: styles.border }}
                >
                  <span className="text-sm font-medium" style={{ color: styles.textPrimary }}>
                    {t('seller.orders.totalPrice')}
                  </span>
                  <span className="text-lg font-bold" style={{ color: styles.textPrimary }}>
                    {formatCurrency(order.totalPrice, order.currency)}
                  </span>
                </div>
              </Section>

              {/* Buyer Info */}
              <Section title={t('seller.orders.buyerInfo')} icon={User} styles={styles}>
                <InfoRow label={t('seller.orders.buyer')} value={order.buyerName} styles={styles} />
                {order.buyerCompany && order.buyerCompany !== order.buyerName && (
                  <InfoRow label="Company" value={order.buyerCompany} styles={styles} />
                )}
                {order.buyerEmail && (
                  <InfoRow
                    label="Email"
                    value={order.buyerEmail}
                    styles={styles}
                    copyable
                    onCopy={handleCopy}
                    copiedField={copiedField}
                  />
                )}
              </Section>

              {/* Order Info */}
              <Section title={t('seller.orders.orderInfo')} icon={FileText} styles={styles}>
                <InfoRow
                  label={t('seller.orders.source')}
                  value={order.source === 'rfq' ? t('seller.orders.fromRfq') : t('seller.orders.directBuy')}
                  styles={styles}
                />
                {order.rfqNumber && (
                  <InfoRow
                    label="RFQ #"
                    value={order.rfqNumber}
                    styles={styles}
                    copyable
                    onCopy={handleCopy}
                    copiedField={copiedField}
                  />
                )}
                <InfoRow label={t('seller.orders.created')} value={formatDate(order.createdAt)} styles={styles} />
                {order.confirmedAt && (
                  <InfoRow label={t('seller.orders.confirmed')} value={formatDate(order.confirmedAt)} styles={styles} />
                )}
                {order.shippedAt && (
                  <InfoRow label={t('seller.orders.shipped')} value={formatDate(order.shippedAt)} styles={styles} />
                )}
                {order.deliveredAt && (
                  <InfoRow label={t('seller.orders.delivered')} value={formatDate(order.deliveredAt)} styles={styles} />
                )}
              </Section>

              {/* Shipping Info */}
              {(order.trackingNumber || order.carrier || order.shippingAddress) && (
                <Section title={t('seller.orders.shippingInfo')} icon={Truck} styles={styles}>
                  {order.trackingNumber && (
                    <InfoRow
                      label={t('seller.orders.trackingNumber')}
                      value={order.trackingNumber}
                      styles={styles}
                      copyable
                      onCopy={handleCopy}
                      copiedField={copiedField}
                    />
                  )}
                  {order.carrier && (
                    <InfoRow label={t('seller.orders.carrier')} value={order.carrier} styles={styles} />
                  )}
                  {order.estimatedDelivery && (
                    <InfoRow
                      label={t('seller.orders.estimatedDelivery')}
                      value={order.estimatedDelivery}
                      styles={styles}
                    />
                  )}
                  {order.shippingAddress && (
                    <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: styles.bgSecondary }}>
                      <p className="text-xs font-medium mb-2" style={{ color: styles.textMuted }}>
                        Delivery Address
                      </p>
                      <p className="text-sm" style={{ color: styles.textPrimary }}>
                        {order.shippingAddress.name}
                        <br />
                        {order.shippingAddress.street1}
                        {order.shippingAddress.street2 && (
                          <>
                            <br />
                            {order.shippingAddress.street2}
                          </>
                        )}
                        <br />
                        {order.shippingAddress.city}
                        {order.shippingAddress.state && `, ${order.shippingAddress.state}`}
                        {order.shippingAddress.postalCode && ` ${order.shippingAddress.postalCode}`}
                        <br />
                        {order.shippingAddress.country}
                      </p>
                    </div>
                  )}
                </Section>
              )}

              {/* Notes */}
              {(order.buyerNotes || order.sellerNotes || order.internalNotes) && (
                <Section title={t('seller.orders.notes')} icon={FileText} styles={styles}>
                  {order.buyerNotes && (
                    <NoteBlock label={t('seller.orders.buyerNotes')} content={order.buyerNotes} styles={styles} />
                  )}
                  {order.sellerNotes && (
                    <NoteBlock label={t('seller.orders.sellerNotes')} content={order.sellerNotes} styles={styles} />
                  )}
                  {order.internalNotes && (
                    <NoteBlock
                      label={t('seller.orders.internalNotes')}
                      content={order.internalNotes}
                      styles={styles}
                      isInternal
                    />
                  )}
                </Section>
              )}
            </div>
          ) : (
            <div className="p-0">
              {/* Enhanced Order Timeline with SLA tracking */}
              {isLoadingTimeline ? (
                <div className="p-8 flex items-center justify-center">
                  <Clock size={24} className="animate-spin" style={{ color: styles.textMuted }} />
                </div>
              ) : (
                <EnhancedOrderTimeline
                  order={order}
                  timeline={
                    timelineData
                      ? {
                          steps: timelineData.steps || [],
                          riskAssessment: timelineData.riskAssessment || {
                            overallRisk: 'low',
                            riskScore: 0,
                            factors: [],
                            recommendations: [],
                            lastAssessedAt: new Date().toISOString(),
                          },
                          metrics: {
                            slasMet: timelineData.metrics?.slasMet || 0,
                            slasBreached: timelineData.metrics?.slasBreached || 0,
                            avgSlaUtilization: timelineData.metrics?.avgSlaUtilization || 0,
                            promisedDeliveryDate: timelineData.metrics?.promisedDeliveryDate?.toString(),
                            actualDeliveryDate: timelineData.metrics?.actualDeliveryDate?.toString(),
                            deliveryVariance: timelineData.metrics?.deliveryVariance,
                          },
                        }
                      : undefined
                  }
                  onReportDelay={handleReportDelay}
                />
              )}

              {/* Collapsible Audit Log */}
              {order.auditLog && order.auditLog.length > 0 && (
                <div className="mx-4 mb-4">
                  <button
                    onClick={() => setShowAuditLog(!showAuditLog)}
                    className="w-full flex items-center justify-between p-3 rounded-lg transition-colors"
                    style={{ backgroundColor: styles.bgSecondary }}
                  >
                    <div className="flex items-center gap-2">
                      <ListBullets size={16} style={{ color: styles.textMuted }} />
                      <span className="text-sm font-medium" style={{ color: styles.textPrimary }}>
                        {t('seller.orders.auditLog')}
                      </span>
                      <span
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: styles.bgHover, color: styles.textMuted }}
                      >
                        {order.auditLog.length}
                      </span>
                    </div>
                    {showAuditLog ? (
                      <CaretUp size={16} style={{ color: styles.textMuted }} />
                    ) : (
                      <CaretDown size={16} style={{ color: styles.textMuted }} />
                    )}
                  </button>

                  {showAuditLog && (
                    <div
                      className="mt-2 p-4 rounded-lg border"
                      style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
                    >
                      <div className="space-y-0">
                        {[...order.auditLog].reverse().map((entry, index) => (
                          <div key={entry.id} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div
                                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: styles.bgSecondary }}
                              >
                                {entry.action === 'created' && <Package size={12} style={{ color: styles.info }} />}
                                {entry.action === 'confirmed' && (
                                  <CheckCircle size={12} style={{ color: styles.success }} />
                                )}
                                {entry.action === 'shipped' && <Truck size={12} style={{ color: styles.info }} />}
                                {entry.action === 'delivered' && (
                                  <CheckCircle size={12} weight="fill" style={{ color: styles.success }} />
                                )}
                                {entry.action === 'cancelled' && <XCircle size={12} style={{ color: styles.error }} />}
                                {!['created', 'confirmed', 'shipped', 'delivered', 'cancelled'].includes(
                                  entry.action,
                                ) && <Clock size={12} style={{ color: styles.textMuted }} />}
                              </div>
                              {index < order.auditLog.length - 1 && (
                                <div className="w-px flex-1 my-1" style={{ backgroundColor: styles.border }} />
                              )}
                            </div>
                            <div className="pb-4 flex-1 min-w-0">
                              <p className="text-sm font-medium" style={{ color: styles.textPrimary }}>
                                {getAuditActionLabel(entry.action)}
                              </p>
                              <p className="text-xs mt-0.5" style={{ color: styles.textMuted }}>
                                {formatDate(entry.timestamp)} &middot; {getActorLabel(entry.actor)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div
          className="px-6 py-4 border-t flex-shrink-0 flex items-center gap-3"
          style={{ borderColor: styles.border, backgroundColor: styles.bgSecondary }}
        >
          {canConfirmOrder(order) && (
            <button
              onClick={() => onConfirm(order)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-colors"
              style={{ backgroundColor: styles.success }}
            >
              <CheckCircle size={16} />
              {t('seller.orders.confirmOrder')}
            </button>
          )}
          {canShipOrder(order) && (
            <button
              onClick={() => onShip(order)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-colors"
              style={{ backgroundColor: styles.info }}
            >
              <Truck size={16} />
              {t('seller.orders.shipOrder')}
            </button>
          )}
          {canMarkDelivered(order) && (
            <button
              onClick={() => onMarkDelivered(order)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-colors"
              style={{ backgroundColor: styles.success }}
            >
              <CheckCircle size={16} weight="fill" />
              {t('seller.orders.markDelivered')}
            </button>
          )}
          {canCancelOrder(order) && (
            <button
              onClick={() => onCancel(order)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border"
              style={{ borderColor: styles.error, color: styles.error }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = styles.error;
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = styles.error;
              }}
            >
              <XCircle size={16} />
              {t('seller.orders.cancelOrder')}
            </button>
          )}
        </div>
      </div>

      {/* Delay Reason Modal */}
      <DelayReasonModal
        isOpen={showDelayModal}
        order={order}
        onClose={() => setShowDelayModal(false)}
        onSubmit={handleSubmitDelay}
      />
    </>
  );
};

// Section Component
const Section: React.FC<{
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  styles: ReturnType<typeof usePortal>['styles'];
}> = ({ title, icon: Icon, children, styles }) => (
  <div>
    <div className="flex items-center gap-2 mb-3">
      <Icon size={16} style={{ color: styles.textMuted }} />
      <h3 className="text-sm font-semibold" style={{ color: styles.textPrimary }}>
        {title}
      </h3>
    </div>
    {children}
  </div>
);

// Info Row Component
const InfoRow: React.FC<{
  label: string;
  value: string;
  styles: ReturnType<typeof usePortal>['styles'];
  copyable?: boolean;
  onCopy?: (text: string, field: string) => void;
  copiedField?: string | null;
}> = ({ label, value, styles, copyable, onCopy, copiedField }) => (
  <div className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: styles.border }}>
    <span className="text-sm" style={{ color: styles.textMuted }}>
      {label}
    </span>
    <div className="flex items-center gap-1">
      <span className="text-sm font-medium" style={{ color: styles.textPrimary }}>
        {value}
      </span>
      {copyable && onCopy && (
        <button onClick={() => onCopy(value, label)} className="p-0.5 rounded" style={{ color: styles.textMuted }}>
          {copiedField === label ? <Check size={12} /> : <CopySimple size={12} />}
        </button>
      )}
    </div>
  </div>
);

// Note Block Component
const NoteBlock: React.FC<{
  label: string;
  content: string;
  styles: ReturnType<typeof usePortal>['styles'];
  isInternal?: boolean;
}> = ({ label, content, styles, isInternal }) => (
  <div
    className="p-3 rounded-lg mb-2 last:mb-0"
    style={{
      backgroundColor: isInternal ? (styles.isDark ? '#3D3D1B' : '#FFFDE7') : styles.bgSecondary,
    }}
  >
    <p className="text-xs font-medium mb-1" style={{ color: isInternal ? styles.warning : styles.textMuted }}>
      {label}
    </p>
    <p className="text-sm" style={{ color: styles.textPrimary }}>
      {content}
    </p>
  </div>
);

export default OrderDetailsPanel;
