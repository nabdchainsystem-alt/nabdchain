import React from 'react';
import { Package, Truck, CheckCircle, MapPin, Clock } from 'phosphor-react';
import { Container, PageHeader } from '../../components';
import { usePortal } from '../../context/PortalContext';

interface TrackingProps {
  onNavigate: (page: string) => void;
}

export const Tracking: React.FC<TrackingProps> = ({ onNavigate }) => {
  const { styles, t } = usePortal();

  return (
    <div
      className="min-h-screen transition-colors"
      style={{ backgroundColor: styles.bgPrimary }}
    >
      <Container variant="full">
        <PageHeader
          title={t('buyer.tracking.title')}
          subtitle={t('buyer.tracking.subtitle')}
        />

        {/* Search Tracking */}
        <div
          className="rounded-lg border p-6 mb-8 transition-colors"
          style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
        >
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: styles.textPrimary }}
          >
            {t('buyer.tracking.enterTracking')}
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder={t('buyer.tracking.trackingPlaceholder')}
              className="flex-1 px-4 py-2.5 rounded-md border outline-none text-sm transition-colors"
              style={{
                borderColor: styles.border,
                backgroundColor: styles.bgPrimary,
                color: styles.textPrimary,
                fontFamily: styles.fontBody,
              }}
            />
            <button
              className="px-6 py-2.5 rounded-md text-sm font-medium transition-opacity hover:opacity-80"
              style={{
                backgroundColor: styles.isDark ? '#E6E8EB' : '#0F1115',
                color: styles.isDark ? '#0F1115' : '#E6E8EB',
              }}
            >
              {t('common.track')}
            </button>
          </div>
        </div>

        {/* Tracking Timeline (Structure) */}
        <div
          className="rounded-lg border p-6 transition-colors"
          style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3
                className="text-lg font-semibold"
                style={{ color: styles.textPrimary, fontFamily: styles.fontHeading }}
              >
                {t('buyer.tracking.orderStatus')}
              </h3>
              <p className="text-sm mt-1" style={{ color: styles.textSecondary }}>
                {t('buyer.tracking.tracking')}: NABD-2024-001234
              </p>
            </div>
            <div
              className="px-3 py-1.5 rounded text-xs font-medium"
              style={{ backgroundColor: styles.isDark ? '#1E3A5F' : '#E3F2FD', color: styles.info }}
            >
              {t('buyer.tracking.inTransit')}
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-0">
            <TimelineItem
              icon={CheckCircle}
              title={t('buyer.tracking.orderConfirmed')}
              description={t('buyer.tracking.orderConfirmedDesc')}
              time="Jan 28, 2024 - 10:00 AM"
              completed
            />
            <TimelineItem
              icon={Package}
              title={t('buyer.tracking.shipped')}
              description={t('buyer.tracking.shippedDesc')}
              time="Jan 29, 2024 - 2:30 PM"
              completed
            />
            <TimelineItem
              icon={Truck}
              title={t('buyer.tracking.inTransit')}
              description={t('buyer.tracking.inTransitDesc')}
              time="Jan 30, 2024 - 8:15 AM"
              active
            />
            <TimelineItem
              icon={MapPin}
              title={t('buyer.tracking.outForDelivery')}
              description={t('buyer.tracking.outForDeliveryDesc')}
              time={t('buyer.tracking.estimated')}
              pending
            />
            <TimelineItem
              icon={CheckCircle}
              title={t('buyer.tracking.delivered')}
              description={t('buyer.tracking.deliveredDesc')}
              time={`${t('buyer.tracking.estimated')}: Jan 31, 2024`}
              pending
              isLast
            />
          </div>
        </div>
      </Container>
    </div>
  );
};

const TimelineItem: React.FC<{
  icon: React.ComponentType<{ size: number; weight?: string; style?: React.CSSProperties }>;
  title: string;
  description: string;
  time: string;
  completed?: boolean;
  active?: boolean;
  pending?: boolean;
  isLast?: boolean;
}> = ({ icon: Icon, title, description, time, completed, active, pending, isLast }) => {
  const { styles } = usePortal();

  const iconColor = completed
    ? styles.success
    : active
    ? (styles.isDark ? '#0F1115' : '#FFFFFF')
    : styles.textMuted;

  const lineColor = completed ? styles.success : styles.border;

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{
            backgroundColor: active
              ? (styles.isDark ? '#E6E8EB' : '#0F1115')
              : completed
              ? (styles.isDark ? '#1B3D2F' : '#E8F5E9')
              : styles.bgSecondary,
          }}
        >
          <Icon
            size={20}
            weight={completed || active ? 'fill' : 'regular'}
            style={{ color: iconColor }}
          />
        </div>
        {!isLast && (
          <div
            className="w-0.5 h-16"
            style={{ backgroundColor: lineColor }}
          />
        )}
      </div>
      <div className="flex-1 pb-8">
        <div
          className="font-medium text-sm"
          style={{ color: pending ? styles.textMuted : styles.textPrimary }}
        >
          {title}
        </div>
        <div className="text-sm mt-0.5" style={{ color: styles.textSecondary }}>
          {description}
        </div>
        <div className="flex items-center gap-1.5 mt-2 text-xs" style={{ color: styles.textMuted }}>
          <Clock size={12} />
          {time}
        </div>
      </div>
    </div>
  );
};

export default Tracking;
