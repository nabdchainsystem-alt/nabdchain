import React, { useState } from 'react';
import { MagnifyingGlass } from 'phosphor-react';
import { Container, PageHeader, EmptyState } from '../../components';
import { usePortal } from '../../context/PortalContext';

interface TrackingProps {
  onNavigate: (page: string) => void;
}

export const Tracking: React.FC<TrackingProps> = ({ _onNavigate }) => {
  const { styles, t } = usePortal();
  const [trackingNumber, setTrackingNumber] = useState('');

  return (
    <div className="min-h-screen transition-colors" style={{ backgroundColor: styles.bgPrimary }}>
      <Container variant="full">
        <PageHeader title={t('buyer.tracking.title')} subtitle={t('buyer.tracking.subtitle')} />

        {/* Search Tracking */}
        <div
          className="rounded-lg border p-6 mb-8 transition-colors"
          style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
        >
          <label className="block text-sm font-medium mb-2" style={{ color: styles.textPrimary }}>
            {t('buyer.tracking.enterTracking')}
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
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

        {/* Empty State - No tracking results */}
        <EmptyState
          icon={MagnifyingGlass}
          title={t('buyer.tracking.noTracking') || 'No Tracking Data'}
          description={
            t('buyer.tracking.noTrackingDesc') || 'Enter a tracking number above to view your shipment status'
          }
        />
      </Container>
    </div>
  );
};

export default Tracking;
