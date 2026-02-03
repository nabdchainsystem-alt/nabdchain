import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Package, TrendUp, ArrowRight } from 'phosphor-react';
import { Container, StatCard } from '../../components';
import { usePortal } from '../../context/PortalContext';
import { useAuth } from '../../../../auth-adapter';
import { itemService } from '../../services/itemService';
import { orderService } from '../../services/orderService';
import { sellerRfqInboxService } from '../../services/sellerRfqInboxService';

interface SellerHomeProps {
  onNavigate: (page: string) => void;
}

interface SellerStats {
  totalItems: number;
  activeItems: number;
  totalRfqs: number;
  newRfqs: number;
  pendingOrders: number;
  totalRevenue: number;
  isLoading: boolean;
}

export const SellerHome: React.FC<SellerHomeProps> = ({ onNavigate }) => {
  const { t, styles } = usePortal();
  const { getToken } = useAuth();
  const [stats, setStats] = useState<SellerStats>({
    totalItems: 0,
    activeItems: 0,
    totalRfqs: 0,
    newRfqs: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    isLoading: true,
  });

  const fetchStats = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const [itemStats, orderStats, rfqData] = await Promise.all([
        itemService.getSellerStats(token),
        orderService.getSellerOrderStats(token),
        sellerRfqInboxService.getInbox(token, { limit: 1 }), // Just need stats
      ]);

      setStats({
        totalItems: itemStats.totalItems,
        activeItems: itemStats.activeItems,
        totalRfqs: rfqData.stats.total,
        newRfqs: rfqData.stats.new,
        pendingOrders: orderStats.pendingConfirmation + orderStats.confirmed + orderStats.inProgress,
        totalRevenue: orderStats.totalRevenue,
        isLoading: false,
      });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      setStats(prev => ({ ...prev, isLoading: false }));
    }
  }, [getToken]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div
      className="min-h-screen flex items-start justify-center transition-colors pt-[15vh]"
      style={{ backgroundColor: styles.bgPrimary }}
    >
      <Container variant="content">
        <div>
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
              value={stats.isLoading ? '...' : stats.totalRfqs.toString()}
              icon={FileText}
            />
            <StatCard
              label={t('seller.home.activeOrders')}
              value={stats.isLoading ? '...' : stats.pendingOrders.toString()}
              icon={Package}
            />
            <StatCard
              label={t('seller.home.revenue')}
              value={stats.isLoading ? '...' : `SAR ${stats.totalRevenue.toLocaleString()}`}
              icon={TrendUp}
            />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <QuickActionCard
              title={t('seller.home.rfqInbox')}
              description={stats.isLoading ? '...' : `${stats.newRfqs} ${t('seller.home.newRequests')}`}
              action={t('seller.home.viewRfqs')}
              onClick={() => onNavigate('rfqs')}
            />
            <QuickActionCard
              title={t('seller.home.manageListings')}
              description={stats.isLoading ? '...' : `${stats.activeItems} ${t('seller.home.activeProducts')}`}
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
