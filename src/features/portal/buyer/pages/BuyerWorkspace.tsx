import React, { useState } from 'react';
import {
  ShoppingCart,
  Users,
  Cube,
  Receipt,
  ChartLineUp,
} from 'phosphor-react';
import { Container, PageHeader } from '../../components';
import { usePortal } from '../../context/PortalContext';
import { DashboardTab, PurchasesTab, SuppliersTab, InventoryTab, ExpensesTab } from './workspace';

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

        {/* Dashboard View - Advanced Intelligence */}
        {activeTab === 'dashboard' && (
          <DashboardTab
            onNavigate={onNavigate}
            onSwitchTab={setActiveTab}
          />
        )}

        {/* Purchases Tab */}
        {activeTab === 'purchases' && <PurchasesTab onNavigate={onNavigate} />}

        {/* Suppliers Tab */}
        {activeTab === 'suppliers' && (
          <SuppliersTab
            onNavigate={onNavigate}
            onCreatePO={() => setActiveTab('purchases')}
          />
        )}

        {/* Inventory Tab */}
        {activeTab === 'inventory' && <InventoryTab onNavigate={onNavigate} />}

        {/* Expenses Tab */}
        {activeTab === 'expenses' && <ExpensesTab onNavigate={onNavigate} />}
      </Container>
    </div>
  );
};

export default BuyerWorkspace;
