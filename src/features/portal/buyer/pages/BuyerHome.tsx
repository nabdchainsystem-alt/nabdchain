import React from 'react';
import { MagnifyingGlass, FileText, Package, ClockCounterClockwise } from 'phosphor-react';
import { Container, QuickActionCard } from '../../components';
import { usePortal } from '../../context/PortalContext';

interface BuyerHomeProps {
  onNavigate: (page: string) => void;
}

export const BuyerHome: React.FC<BuyerHomeProps> = ({ onNavigate }) => {
  const { styles, t } = usePortal();

  return (
    <div
      className="min-h-screen flex items-start justify-center transition-colors pt-[15vh]"
      style={{ backgroundColor: styles.bgPrimary }}
    >
      <Container variant="content">
        <div className="text-center">
          {/* Hero */}
          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight"
            style={{
              color: styles.textPrimary,
              fontFamily: styles.fontHeading,
            }}
          >
            {t('buyer.home.title')}
          </h1>
          <p
            className="mt-4 text-lg max-w-xl mx-auto"
            style={{ color: styles.textSecondary }}
          >
            {t('buyer.home.subtitle')}
          </p>

          {/* Search Bar */}
          <div className="mt-10 max-w-2xl mx-auto">
            <div
              className="flex items-center gap-3 px-5 py-4 rounded-lg border transition-colors"
              style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
            >
              <MagnifyingGlass size={20} style={{ color: styles.textMuted }} />
              <input
                type="text"
                placeholder={t('buyer.home.searchPlaceholder')}
                className="flex-1 outline-none text-sm bg-transparent"
                style={{
                  color: styles.textPrimary,
                  fontFamily: styles.fontBody,
                }}
                onFocus={() => onNavigate('marketplace')}
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            <QuickActionCard
              icon={FileText}
              title={t('buyer.home.requestQuote')}
              onClick={() => onNavigate('rfq')}
              variant="button"
            />
            <QuickActionCard
              icon={Package}
              title={t('buyer.home.browseCatalog')}
              onClick={() => onNavigate('marketplace')}
              variant="button"
            />
            <QuickActionCard
              icon={ClockCounterClockwise}
              title={t('buyer.home.viewOrders')}
              onClick={() => onNavigate('orders')}
              variant="button"
            />
          </div>

          {/* Stats */}
          <div className="mt-20 flex items-center justify-center gap-12">
            <Stat value="500+" label={t('common.suppliers')} />
            <div className="h-8 w-px" style={{ backgroundColor: styles.border }} />
            <Stat value="50K+" label={t('common.products')} />
            <div className="h-8 w-px" style={{ backgroundColor: styles.border }} />
            <Stat value="99%" label={t('common.onTimeDelivery')} />
          </div>
        </div>
      </Container>
    </div>
  );
};

const Stat: React.FC<{ value: string; label: string }> = ({ value, label }) => {
  const { styles } = usePortal();

  return (
    <div className="text-center">
      <div
        className="text-2xl font-semibold"
        style={{ color: styles.textPrimary, fontFamily: styles.fontHeading }}
      >
        {value}
      </div>
      <div className="text-xs mt-1" style={{ color: styles.textMuted }}>
        {label}
      </div>
    </div>
  );
};

export default BuyerHome;
