import React from 'react';
import { FileText, Package, TrendUp, ArrowRight } from 'phosphor-react';
import { Container, StatCard } from '../../components';
import { usePortal } from '../../context/PortalContext';

interface SellerHomeProps {
  onNavigate: (page: string) => void;
}

export const SellerHome: React.FC<SellerHomeProps> = ({ onNavigate }) => {
  const { t, styles } = usePortal();

  return (
    <div
      className="min-h-[calc(100vh-64px)] flex items-center justify-center transition-colors"
      style={{ backgroundColor: styles.bgPrimary }}
    >
      <Container variant="content">
        <div className="py-16">
          {/* Hero */}
          <div className="text-center mb-16">
            <h1
              className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight"
              style={{
                color: styles.textPrimary,
                fontFamily: styles.fontHeading,
              }}
            >
              {t('seller.home.title')}
            </h1>
            <p
              className="mt-4 text-lg max-w-xl mx-auto"
              style={{ color: styles.textSecondary }}
            >
              {t('seller.home.subtitle')}
            </p>
          </div>

          {/* Key Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
            <StatCard
              label={t('seller.home.rfqsThisMonth')}
              value="24"
              icon={FileText}
              change={{ value: `8+ ${t('seller.home.fromLastMonth')}`, positive: true }}
            />
            <StatCard
              label={t('seller.home.activeOrders')}
              value="12"
              icon={Package}
            />
            <StatCard
              label={t('seller.home.revenue')}
              value="$48,250"
              icon={TrendUp}
              change={{ value: '+15%', positive: true }}
            />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <QuickActionCard
              title={t('seller.home.rfqInbox')}
              description={`5 ${t('seller.home.newRequests')}`}
              action={t('seller.home.viewRfqs')}
              onClick={() => onNavigate('rfqs')}
            />
            <QuickActionCard
              title={t('seller.home.manageListings')}
              description={`127 ${t('seller.home.activeProducts')}`}
              action={t('seller.home.viewListings')}
              onClick={() => onNavigate('listings')}
            />
          </div>
        </div>
      </Container>
    </div>
  );
};

const QuickActionCard: React.FC<{
  title: string;
  description: string;
  action: string;
  onClick: () => void;
}> = ({ title, description, action, onClick }) => {
  const { styles } = usePortal();

  return (
    <button
      onClick={onClick}
      className="flex items-center justify-between p-5 rounded-lg border text-start transition-all hover:border-gray-400 group"
      style={{
        borderColor: styles.border,
        backgroundColor: styles.bgCard,
      }}
    >
      <div>
        <div
          className="font-semibold"
          style={{ color: styles.textPrimary, fontFamily: styles.fontHeading }}
        >
          {title}
        </div>
        <div className="text-sm mt-1" style={{ color: styles.textSecondary }}>
          {description}
        </div>
      </div>
      <div
        className="flex items-center gap-2 text-sm font-medium group-hover:gap-3 transition-all"
        style={{ color: styles.textPrimary }}
      >
        {action}
        <ArrowRight size={16} />
      </div>
    </button>
  );
};

export default SellerHome;
