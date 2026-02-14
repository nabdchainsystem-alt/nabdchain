import React, { useState, useEffect } from 'react';
import { ShoppingCart, Users, Cube, Receipt, ChartLineUp, Package, FileText, Sparkle } from 'phosphor-react';
import { Container, PageHeader } from '../../components';
import { usePortal } from '../../context/PortalContext';
import {
  DashboardTab,
  PurchasesTab,
  OrdersTab,
  InvoicesTab,
  SuppliersTab,
  InventoryTab,
  ExpensesTab,
} from './workspace';
import { AICopilotPanel } from '../../components/ai/AICopilotPanel';
import { IntelligenceFeed } from '../../components/ai/IntelligenceFeed';

interface BuyerWorkspaceProps {
  onNavigate: (page: string, data?: Record<string, unknown>) => void;
  initialTab?: WorkspaceTab;
  initialFilters?: {
    status?: string;
    health?: string;
  };
}

type WorkspaceTab =
  | 'dashboard'
  | 'orders'
  | 'purchases'
  | 'invoices'
  | 'suppliers'
  | 'inventory'
  | 'expenses'
  | 'intelligence';

export const BuyerWorkspace: React.FC<BuyerWorkspaceProps> = ({ onNavigate, initialTab, initialFilters }) => {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>(initialTab || 'dashboard');
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const { styles, t } = usePortal();

  // Update tab when initialTab prop changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const tabs: { id: WorkspaceTab; label: string; icon: React.ComponentType<{ size: number }> }[] = [
    { id: 'dashboard', label: t('buyer.workspace.dashboard'), icon: ChartLineUp },
    { id: 'orders', label: t('buyer.workspace.orders') || 'Orders', icon: Package },
    { id: 'purchases', label: t('buyer.workspace.purchases'), icon: ShoppingCart },
    { id: 'invoices', label: t('buyer.workspace.invoices') || 'Invoices', icon: FileText },
    { id: 'suppliers', label: t('buyer.workspace.suppliers'), icon: Users },
    { id: 'inventory', label: t('buyer.workspace.inventory'), icon: Cube },
    { id: 'expenses', label: t('buyer.workspace.expenses'), icon: Receipt },
    { id: 'intelligence', label: 'Intelligence', icon: Sparkle },
  ];

  return (
    <div className="min-h-screen transition-colors" style={{ backgroundColor: styles.bgPrimary }}>
      <Container variant="full">
        <div className="flex items-start justify-between">
          <PageHeader title={t('buyer.workspace.title')} subtitle={t('buyer.workspace.subtitle')} />
          <button
            onClick={() => setAiPanelOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all mt-2"
            style={{
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              color: '#fff',
              boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
            }}
          >
            <Sparkle size={16} weight="fill" />
            {t('ai.askAI') || 'Ask AI'}
          </button>
        </div>

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
        {activeTab === 'dashboard' && <DashboardTab onNavigate={onNavigate} onSwitchTab={setActiveTab} />}

        {/* Orders Tab (Marketplace Orders) */}
        {activeTab === 'orders' && (
          <OrdersTab
            onNavigate={onNavigate}
            initialStatusFilter={initialFilters?.status}
            initialHealthFilter={initialFilters?.health}
          />
        )}

        {/* Purchases Tab (Internal POs) */}
        {activeTab === 'purchases' && <PurchasesTab onNavigate={onNavigate} />}

        {/* Invoices Tab */}
        {activeTab === 'invoices' && (
          <InvoicesTab
            onNavigate={onNavigate}
            initialStatusFilter={
              initialFilters?.status as 'all' | 'draft' | 'issued' | 'paid' | 'overdue' | 'cancelled' | undefined
            }
          />
        )}

        {/* Suppliers Tab */}
        {activeTab === 'suppliers' && (
          <SuppliersTab onNavigate={onNavigate} onCreatePO={() => setActiveTab('purchases')} />
        )}

        {/* Inventory Tab */}
        {activeTab === 'inventory' && <InventoryTab onNavigate={onNavigate} />}

        {/* Expenses Tab */}
        {activeTab === 'expenses' && <ExpensesTab onNavigate={onNavigate} />}

        {/* Intelligence Tab */}
        {activeTab === 'intelligence' && <IntelligenceFeed role="buyer" />}
      </Container>

      {/* AI Copilot Panel */}
      <AICopilotPanel isOpen={aiPanelOpen} onClose={() => setAiPanelOpen(false)} role="buyer" />
    </div>
  );
};

export default BuyerWorkspace;
