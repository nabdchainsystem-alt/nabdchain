import React, { useState } from 'react';
import {
  CurrencyDollar,
  Users,
  Cube,
  Receipt,
  ChartLineUp,
} from 'phosphor-react';
import { Container, PageHeader, StatCard } from '../../components';
import { usePortal } from '../../context/PortalContext';

interface SellerWorkspaceProps {
  onNavigate: (page: string) => void;
}

type WorkspaceTab = 'sales' | 'customers' | 'inventory' | 'expenses' | 'dashboard';

export const SellerWorkspace: React.FC<SellerWorkspaceProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('dashboard');
  const { styles, t } = usePortal();

  const tabs: { id: WorkspaceTab; label: string; icon: React.ComponentType<{ size: number }> }[] = [
    { id: 'dashboard', label: t('seller.workspace.dashboard'), icon: ChartLineUp },
    { id: 'sales', label: t('seller.workspace.sales'), icon: CurrencyDollar },
    { id: 'customers', label: t('seller.workspace.customers'), icon: Users },
    { id: 'inventory', label: t('seller.workspace.inventory'), icon: Cube },
    { id: 'expenses', label: t('seller.workspace.expenses'), icon: Receipt },
  ];

  return (
    <div
      className="min-h-[calc(100vh-64px)] transition-colors"
      style={{ backgroundColor: styles.bgPrimary }}
    >
      <Container variant="full">
        <PageHeader
          title={t('seller.workspace.title')}
          subtitle={t('seller.workspace.subtitle')}
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
                label={t('seller.workspace.totalRevenue')}
                value="$248,500"
                change={{ value: '+22% from last month', positive: true }}
              />
              <StatCard
                label={t('seller.workspace.totalCustomers')}
                value="156"
              />
              <StatCard
                label={t('seller.workspace.inventoryItems')}
                value="1,247"
              />
              <StatCard
                label={t('seller.workspace.monthlyExpenses')}
                value="$34,200"
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div
                className="rounded-lg border p-6 transition-colors"
                style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
              >
                <h3
                  className="text-sm font-semibold mb-4"
                  style={{ color: styles.textPrimary, fontFamily: styles.fontHeading }}
                >
                  {t('seller.workspace.salesOverview')}
                </h3>
                <div
                  className="h-64 rounded-md flex items-center justify-center"
                  style={{ backgroundColor: styles.bgSecondary }}
                >
                  <span className="text-sm" style={{ color: styles.textMuted }}>
                    Sales Chart
                  </span>
                </div>
              </div>

              <div
                className="rounded-lg border p-6 transition-colors"
                style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
              >
                <h3
                  className="text-sm font-semibold mb-4"
                  style={{ color: styles.textPrimary, fontFamily: styles.fontHeading }}
                >
                  {t('seller.workspace.expenseBreakdown')}
                </h3>
                <div
                  className="h-64 rounded-md flex items-center justify-center"
                  style={{ backgroundColor: styles.bgSecondary }}
                >
                  <span className="text-sm" style={{ color: styles.textMuted }}>
                    Expense Chart
                  </span>
                </div>
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

export default SellerWorkspace;
