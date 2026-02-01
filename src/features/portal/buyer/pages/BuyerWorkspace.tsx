import React, { useState } from 'react';
import {
  ShoppingCart,
  Users,
  Cube,
  Receipt,
  ChartLineUp,
} from 'phosphor-react';
import { Container, PageHeader, StatCard } from '../../components';
import { usePortal } from '../../context/PortalContext';

interface BuyerWorkspaceProps {
  onNavigate: (page: string) => void;
}

type WorkspaceTab = 'purchases' | 'suppliers' | 'inventory' | 'expenses' | 'dashboard';

export const BuyerWorkspace: React.FC<BuyerWorkspaceProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('dashboard');
  const { styles, t } = usePortal();

  const tabs: { id: WorkspaceTab; label: string; icon: React.ComponentType<{ size: number }> }[] = [
    { id: 'dashboard', label: t('buyer.workspace.dashboard'), icon: ChartLineUp },
    { id: 'purchases', label: t('buyer.workspace.purchases'), icon: ShoppingCart },
    { id: 'suppliers', label: t('buyer.workspace.suppliers'), icon: Users },
    { id: 'inventory', label: t('buyer.workspace.inventory'), icon: Cube },
    { id: 'expenses', label: t('buyer.workspace.expenses'), icon: Receipt },
  ];

  return (
    <div
      className="min-h-screen transition-colors"
      style={{ backgroundColor: styles.bgPrimary }}
    >
      <Container variant="full">
        <PageHeader
          title={t('buyer.workspace.title')}
          subtitle={t('buyer.workspace.subtitle')}
        />

        {/* Tabs */}
        <div
          className="flex items-center gap-1 p-1 rounded-lg mb-8 w-fit"
          style={{ backgroundColor: styles.bgSecondary }}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                style={{
                  backgroundColor: activeTab === tab.id ? styles.bgCard : 'transparent',
                  color: activeTab === tab.id ? styles.textPrimary : styles.textSecondary,
                  boxShadow: activeTab === tab.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Dashboard View */}
        {activeTab === 'dashboard' && (
          <div>
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                label={t('buyer.workspace.totalSpend')}
                value="$124,500"
                change={{ value: '+12% from last month', positive: true }}
              />
              <StatCard
                label={t('buyer.workspace.activeOrders')}
                value="23"
              />
              <StatCard
                label={t('buyer.workspace.pendingRfqs')}
                value="8"
              />
              <StatCard
                label={t('buyer.workspace.suppliersCount')}
                value="45"
              />
            </div>

            {/* Chart Placeholder */}
            <div
              className="rounded-lg border p-6 transition-colors"
              style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
            >
              <h3
                className="text-sm font-semibold mb-4"
                style={{ color: styles.textPrimary, fontFamily: styles.fontHeading }}
              >
                {t('buyer.workspace.spendingOverview')}
              </h3>
              <div
                className="h-64 rounded-md flex items-center justify-center"
                style={{ backgroundColor: styles.bgSecondary }}
              >
                <span className="text-sm" style={{ color: styles.textMuted }}>
                  Chart Area
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Other tabs - Placeholder */}
        {activeTab !== 'dashboard' && (
          <div
            className="rounded-lg border p-12 text-center transition-colors"
            style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
          >
            <p className="text-sm" style={{ color: styles.textSecondary }}>
              {tabs.find((t) => t.id === activeTab)?.label} content
            </p>
          </div>
        )}
      </Container>
    </div>
  );
};

export default BuyerWorkspace;
