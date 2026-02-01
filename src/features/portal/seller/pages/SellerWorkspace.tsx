import React, { useState } from 'react';
import {
  CurrencyDollar,
  Users,
  Cube,
  Receipt,
  ChartLineUp,
} from 'phosphor-react';
import { Container, PageHeader } from '../../components';
import { usePortal } from '../../context/PortalContext';
import { SellerDashboard } from '../components/SellerDashboard';
import { SellerSales } from '../components/SellerSales';
import { SellerCustomers } from '../components/SellerCustomers';
import { SellerInventory } from '../components/SellerInventory';
import { SellerExpenses } from '../components/SellerExpenses';

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
      className="min-h-screen transition-colors"
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
        {activeTab === 'dashboard' && <SellerDashboard />}

        {/* Sales View */}
        {activeTab === 'sales' && <SellerSales />}

        {/* Customers View */}
        {activeTab === 'customers' && <SellerCustomers />}

        {/* Inventory View */}
        {activeTab === 'inventory' && <SellerInventory />}

        {/* Expenses View */}
        {activeTab === 'expenses' && <SellerExpenses />}
      </Container>
    </div>
  );
};

export default SellerWorkspace;
