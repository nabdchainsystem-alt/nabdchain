/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from '@tanstack/react-table';
import {
  Receipt,
  Package,
  Users,
  Plus,
  MagnifyingGlass,
  X,
  CaretDown,
  CaretUp,
  Trash,
  Eye,
  ArrowUp,
  ArrowDown,
  Tag,
  Star,
  Phone,
  EnvelopeSimple,
  Buildings,
  Note,
  Spinner,
  Sparkle,
  Gauge,
  FileText,
  Truck,
  CurrencyDollar,
  Warning,
  ShieldWarning,
  ArrowRight,
  ArrowsClockwise,
} from 'phosphor-react';
import { Container, PageHeader, EmptyState, Select, Button } from '../../components';
import { usePortal } from '../../context/PortalContext';
import { AICopilotPanel } from '../../components/ai/AICopilotPanel';
import { IntelligenceFeed } from '../../components/ai/IntelligenceFeed';
import { marketplaceInvoiceService } from '../../services/marketplaceInvoiceService';
import { sellerWorkspaceService } from '../../services/sellerWorkspaceService';
import { sellerHomeSummaryService, SellerHomeSummary } from '../../services/sellerHomeSummaryService';
import {
  SellerInvoice,
  InvoiceStatus,
  StockAdjustment,
  ItemCostTag,
  CostType,
  SellerBuyerProfile,
  getInvoiceStatusConfig,
  getStockReasonConfig,
  getCostTypeConfig,
  InventoryItem,
  StockStatus,
  getStockStatusConfig,
} from '../../types/workspace.types';

interface SellerWorkspaceProps {
  onNavigate: (page: string) => void;
}

type WorkspaceTab = 'operations' | 'invoices' | 'stock' | 'costs' | 'buyers' | 'intelligence';

// =============================================================================
// Main Component
// =============================================================================

export const SellerWorkspace: React.FC<SellerWorkspaceProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('operations');
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const { styles, t, direction } = usePortal();
  const isRtl = direction === 'rtl';

  const tabs: { id: WorkspaceTab; label: string; icon: React.ComponentType<{ size: number; weight?: string }> }[] = [
    { id: 'operations', label: 'Operations', icon: Gauge },
    { id: 'invoices', label: t('seller.workspace.invoices'), icon: Receipt },
    { id: 'stock', label: t('seller.workspace.stock'), icon: Package },
    { id: 'costs', label: t('seller.workspace.costs'), icon: Tag },
    { id: 'buyers', label: t('seller.workspace.buyers'), icon: Users },
    { id: 'intelligence', label: 'Intelligence', icon: Sparkle },
  ];

  return (
    <div className="min-h-screen transition-colors" style={{ backgroundColor: styles.bgPrimary }}>
      <Container variant="full">
        <div className="flex items-start justify-between">
          <PageHeader title={t('seller.workspace.title')} subtitle={t('seller.workspace.executionSubtitle')} />
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
          className="flex items-center gap-1 p-1 rounded-lg mb-6 w-fit overflow-x-auto"
          style={{ backgroundColor: styles.bgSecondary }}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
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

        {/* Tab Content */}
        {activeTab === 'operations' && (
          <OperationsDashboard styles={styles} t={t} isRtl={isRtl} onNavigate={onNavigate} />
        )}
        {activeTab === 'invoices' && <InvoicesTab styles={styles} t={t} isRtl={isRtl} />}
        {activeTab === 'stock' && <StockTab styles={styles} t={t} isRtl={isRtl} />}
        {activeTab === 'costs' && <CostsTab styles={styles} t={t} isRtl={isRtl} />}
        {activeTab === 'buyers' && <BuyersTab styles={styles} t={t} isRtl={isRtl} />}
        {activeTab === 'intelligence' && <IntelligenceFeed role="seller" />}
      </Container>

      {/* AI Copilot Panel */}
      <AICopilotPanel isOpen={aiPanelOpen} onClose={() => setAiPanelOpen(false)} role="seller" />
    </div>
  );
};

// =============================================================================
// Operations Dashboard Tab - Command Center
// =============================================================================

interface OperationsDashboardProps extends TabProps {
  onNavigate: (page: string) => void;
}

const OperationsDashboard: React.FC<OperationsDashboardProps> = ({ styles, t: _t, isRtl: _isRtl, onNavigate }) => {
  const [summary, setSummary] = useState<SellerHomeSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const data = await sellerHomeSummaryService.getSummary(30);
      setSummary(data);
    } catch {
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size={28} className="animate-spin" style={{ color: styles.textMuted }} />
      </div>
    );
  }

  if (!summary) {
    return (
      <EmptyState icon={Gauge} title="Unable to load operations data" description="Please try refreshing the page." />
    );
  }

  const kpis = summary.kpis;

  // Quick links for navigation
  const quickLinks = [
    {
      label: 'RFQ Marketplace',
      route: 'rfq-marketplace',
      icon: FileText,
      badge: kpis.newRfqs > 0 ? kpis.newRfqs : undefined,
    },
    { label: 'RFQ Inbox', route: 'rfqs', icon: FileText, badge: kpis.rfqInbox > 0 ? kpis.rfqInbox : undefined },
    {
      label: 'Orders',
      route: 'orders',
      icon: Package,
      badge: kpis.ordersNeedingAction > 0 ? kpis.ordersNeedingAction : undefined,
    },
    { label: 'Invoices', route: 'invoices', icon: Receipt },
    { label: 'Payouts', route: 'payouts', icon: CurrencyDollar },
    { label: 'Analytics', route: 'analytics', icon: Gauge },
  ];

  return (
    <div className="space-y-6">
      {/* Alerts Banner */}
      {summary.alerts.length > 0 && (
        <div className="space-y-2">
          {summary.alerts.slice(0, 3).map((alert) => {
            const severityColor =
              alert.severity === 'critical' ? styles.error : alert.severity === 'warning' ? '#F59E0B' : styles.info;
            return (
              <div
                key={alert.id}
                className="flex items-center justify-between p-3 rounded-lg border-l-4"
                style={{
                  backgroundColor: `${severityColor}08`,
                  borderLeftColor: severityColor,
                }}
              >
                <div className="flex items-center gap-3">
                  {alert.severity === 'critical' ? (
                    <ShieldWarning size={18} style={{ color: severityColor }} />
                  ) : (
                    <Warning size={18} style={{ color: severityColor }} />
                  )}
                  <span className="text-sm" style={{ color: styles.textPrimary }}>
                    {alert.message}
                  </span>
                </div>
                <button
                  onClick={() => onNavigate(alert.ctaRoute)}
                  className="flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-md transition-colors"
                  style={{ color: severityColor }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `${severityColor}15`)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  {alert.ctaLabel}
                  <ArrowRight size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Open Actions Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: styles.textMuted }}>
            Open Actions
          </h2>
          <button
            onClick={fetchSummary}
            className="p-1.5 rounded transition-colors"
            style={{ color: styles.textMuted }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.bgHover)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <ArrowsClockwise size={16} />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ActionCard
            label="RFQs Awaiting Quote"
            value={kpis.rfqInbox}
            highlight={kpis.newRfqs}
            highlightLabel="new"
            icon={FileText}
            color="#3b82f6"
            styles={styles}
            onClick={() => onNavigate('rfqs')}
            cta="Quote Now"
          />
          <ActionCard
            label="Orders Needing Action"
            value={kpis.ordersNeedingAction}
            icon={Package}
            color="#8b5cf6"
            styles={styles}
            onClick={() => onNavigate('orders')}
            cta="Process Orders"
          />
          <ActionCard
            label="Active Orders"
            value={kpis.activeOrders}
            icon={Truck}
            color="#06b6d4"
            styles={styles}
            onClick={() => onNavigate('tracking')}
            cta="Track Shipments"
          />
          <ActionCard
            label="Pending Payout"
            value={kpis.pendingPayout}
            isCurrency
            currency={kpis.currency}
            icon={CurrencyDollar}
            color="#10b981"
            styles={styles}
            onClick={() => onNavigate('payouts')}
            cta="View Payouts"
          />
        </div>
      </div>

      {/* Risk Indicators */}
      {summary.systemHealth.status !== 'healthy' && (
        <div
          className="rounded-xl border p-4"
          style={{
            backgroundColor:
              summary.systemHealth.status === 'critical' ? 'rgba(239,68,68,0.05)' : 'rgba(245,158,11,0.05)',
            borderColor: summary.systemHealth.status === 'critical' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <ShieldWarning
              size={18}
              style={{ color: summary.systemHealth.status === 'critical' ? styles.error : '#F59E0B' }}
            />
            <span className="text-sm font-medium" style={{ color: styles.textPrimary }}>
              {summary.systemHealth.message}
            </span>
          </div>
          {summary.systemHealth.issues.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {summary.systemHealth.issues.map((issue, idx) => (
                <button
                  key={idx}
                  onClick={() => onNavigate(issue.ctaRoute)}
                  className="text-xs px-3 py-1 rounded-full transition-colors"
                  style={{
                    backgroundColor: styles.bgSecondary,
                    color: styles.textMuted,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = styles.textPrimary)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = styles.textMuted)}
                >
                  {issue.area}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Focus Item */}
      {summary.focus && !summary.focus.isEmpty && (
        <div className="rounded-xl border p-5" style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}>
          <div className="flex items-start justify-between">
            <div>
              <span
                className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: summary.focus.priority === 'urgent' ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)',
                  color: summary.focus.priority === 'urgent' ? styles.error : styles.info,
                }}
              >
                {summary.focus.priority} priority
              </span>
              <h3 className="text-lg font-semibold mt-2" style={{ color: styles.textPrimary }}>
                {summary.focus.title}
              </h3>
              <p className="text-sm mt-1" style={{ color: styles.textMuted }}>
                {summary.focus.description}
              </p>
            </div>
            <Button variant="primary" size="sm" onClick={() => onNavigate(summary.focus.ctaRoute)}>
              {summary.focus.ctaLabel}
              <ArrowRight size={14} className="ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: styles.textMuted }}>
          Quick Links
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.route}
                onClick={() => onNavigate(link.route)}
                className="relative flex flex-col items-center gap-2 p-4 rounded-xl border transition-all"
                style={{
                  backgroundColor: styles.bgCard,
                  borderColor: styles.border,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = styles.info;
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = styles.border;
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Icon size={20} style={{ color: styles.textMuted }} />
                <span className="text-xs font-medium" style={{ color: styles.textPrimary }}>
                  {link.label}
                </span>
                {link.badge && (
                  <span
                    className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{ backgroundColor: styles.error }}
                  >
                    {link.badge > 9 ? '9+' : link.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Revenue Summary */}
      <div className="rounded-xl border p-4" style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase" style={{ color: styles.textMuted }}>
              Revenue (Last 30 days)
            </p>
            <p className="text-2xl font-bold mt-1" style={{ color: styles.textPrimary }}>
              {kpis.currency} {kpis.revenue.toLocaleString()}
            </p>
          </div>
          {kpis.revenueChange !== 0 && (
            <div className="flex items-center gap-1">
              {kpis.revenueChange > 0 ? (
                <ArrowUp size={14} style={{ color: styles.success }} />
              ) : (
                <ArrowDown size={14} style={{ color: styles.error }} />
              )}
              <span
                className="text-sm font-medium"
                style={{ color: kpis.revenueChange > 0 ? styles.success : styles.error }}
              >
                {Math.abs(kpis.revenueChange)}%
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Action Card for Operations Dashboard
const ActionCard: React.FC<{
  label: string;
  value: number;
  highlight?: number;
  highlightLabel?: string;
  icon: React.ComponentType<{ size: number; weight?: string }>;
  color: string;
  styles: ReturnType<typeof usePortal>['styles'];
  onClick: () => void;
  cta: string;
  isCurrency?: boolean;
  currency?: string;
}> = ({ label, value, highlight, highlightLabel, icon: Icon, color, styles, onClick, cta, isCurrency, currency }) => (
  <div
    className="rounded-xl border p-4 cursor-pointer transition-all"
    style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
    onClick={onClick}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = color;
      e.currentTarget.style.transform = 'translateY(-1px)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = styles.border;
      e.currentTarget.style.transform = 'translateY(0)';
    }}
  >
    <div className="flex items-start justify-between mb-3">
      <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}15` }}>
        <Icon size={18} style={{ color }} />
      </div>
      {highlight !== undefined && highlight > 0 && (
        <span
          className="px-2 py-0.5 text-[10px] font-bold rounded-full text-white"
          style={{ backgroundColor: styles.error }}
        >
          {highlight} {highlightLabel}
        </span>
      )}
    </div>
    <p className="text-xs mb-1" style={{ color: styles.textMuted }}>
      {label}
    </p>
    <p className="text-xl font-bold mb-2" style={{ color: styles.textPrimary }}>
      {isCurrency ? `${currency} ${value.toLocaleString()}` : value}
    </p>
    <span className="text-xs font-medium flex items-center gap-1" style={{ color }}>
      {cta} <ArrowRight size={12} />
    </span>
  </div>
);

// =============================================================================
// Invoices Tab
// =============================================================================

interface TabProps {
  styles: ReturnType<typeof usePortal>['styles'];
  t: (key: string) => string;
  isRtl: boolean;
}

type InvoicesTabProps = TabProps;

const invoiceColumnHelper = createColumnHelper<SellerInvoice>();

const InvoicesTab: React.FC<InvoicesTabProps> = ({ styles, t, _isRtl }) => {
  const [invoices, setInvoices] = useState<SellerInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([{ id: 'issueDate', desc: true }]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | ''>('');
  const [_showCreatePanel, setShowCreatePanel] = useState(false);

  const fetchInvoices = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await marketplaceInvoiceService.getSellerInvoices({
        status: statusFilter || undefined,
      });
      // Map MarketplaceInvoice to SellerInvoice shape for the table
      const mapped: SellerInvoice[] = res.invoices.map((inv: any) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        customerName: inv.buyerName || 'Buyer',
        customerEmail: undefined,
        customerPhone: undefined,
        customerCompany: inv.buyerCompany,
        lineItems: inv.lineItems || [],
        subtotal: inv.subtotal || 0,
        vatRate: inv.vatRate || 15,
        vatAmount: inv.vatAmount || 0,
        total: inv.totalAmount || 0,
        currency: inv.currency || 'SAR',
        status: inv.status as InvoiceStatus,
        issueDate: inv.issuedAt || inv.createdAt,
        dueDate: inv.dueDate,
        createdAt: inv.createdAt,
        updatedAt: inv.updatedAt || inv.createdAt,
      }));
      setInvoices(mapped);
    } catch {
      setInvoices([]);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const filteredInvoices = useMemo(() => {
    let result = [...invoices];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(q) ||
          inv.customerName.toLowerCase().includes(q) ||
          inv.customerCompany?.toLowerCase().includes(q),
      );
    }
    if (statusFilter) {
      result = result.filter((inv) => inv.status === statusFilter);
    }
    return result;
  }, [invoices, searchQuery, statusFilter]);

  const columns = useMemo(
    () => [
      invoiceColumnHelper.accessor('invoiceNumber', {
        header: t('seller.workspace.invoiceNumber'),
        cell: ({ row }) => (
          <span className="font-medium" style={{ color: styles.info }}>
            {row.original.invoiceNumber}
          </span>
        ),
        size: 140,
      }),
      invoiceColumnHelper.accessor('customerName', {
        header: t('seller.workspace.customer'),
        cell: ({ row }) => (
          <div>
            <p className="font-medium" style={{ color: styles.textPrimary }}>
              {row.original.customerName}
            </p>
            {row.original.customerCompany && (
              <p className="text-xs" style={{ color: styles.textMuted }}>
                {row.original.customerCompany}
              </p>
            )}
          </div>
        ),
        size: 200,
      }),
      invoiceColumnHelper.accessor('total', {
        header: t('seller.workspace.total'),
        cell: ({ row }) => (
          <span className="font-semibold tabular-nums" style={{ color: styles.textPrimary }}>
            {row.original.total.toLocaleString()} {row.original.currency}
          </span>
        ),
        size: 120,
      }),
      invoiceColumnHelper.accessor('status', {
        header: t('seller.workspace.status'),
        cell: ({ row }) => {
          const config = getInvoiceStatusConfig(row.original.status);
          const colorMap: Record<string, string> = {
            muted: styles.textMuted,
            info: styles.info,
            success: styles.success,
            error: styles.error,
            warning: styles.warning,
          };
          return (
            <span
              className="px-2 py-0.5 rounded text-xs font-medium"
              style={{ backgroundColor: `${colorMap[config.color]}15`, color: colorMap[config.color] }}
            >
              {t(config.labelKey)}
            </span>
          );
        },
        size: 100,
      }),
      invoiceColumnHelper.accessor('issueDate', {
        header: t('seller.workspace.date'),
        cell: ({ row }) => (
          <span className="text-sm" style={{ color: styles.textMuted }}>
            {new Date(row.original.issueDate).toLocaleDateString()}
          </span>
        ),
        size: 100,
      }),
      invoiceColumnHelper.display({
        id: 'actions',
        header: t('common.actions'),
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <ActionButton
              icon={Eye}
              tooltip={t('common.view')}
              styles={styles}
              onClick={() => {
                // Navigate to invoices filtered view - invoice details handled by backend
                window.open(`/portal/seller/invoices/${row.original.id}`, '_self');
              }}
            />
          </div>
        ),
        size: 80,
      }),
    ],
    [styles, t],
  );

  const table = useReactTable({
    data: filteredInvoices,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={t('seller.workspace.searchInvoices')}
            styles={styles}
          />
          <Select
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as InvoiceStatus | '')}
            options={[
              { value: '', label: t('common.all') },
              { value: 'draft', label: t('seller.workspace.invoiceDraft') },
              { value: 'sent', label: t('seller.workspace.invoiceSent') },
              { value: 'paid', label: t('seller.workspace.invoicePaid') },
              { value: 'overdue', label: t('seller.workspace.invoiceOverdue') },
            ]}
          />
        </div>
        <button
          onClick={() => setShowCreatePanel(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{
            backgroundColor: styles.isDark ? '#E6E8EB' : '#0F1115',
            color: styles.isDark ? '#0F1115' : '#E6E8EB',
          }}
        >
          <Plus size={16} weight="bold" />
          {t('seller.workspace.createInvoice')}
        </button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div
          className="rounded-xl border py-12 flex items-center justify-center"
          style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
        >
          <Spinner size={28} className="animate-spin" style={{ color: styles.textMuted }} />
        </div>
      ) : (
        <DataTable
          table={table}
          styles={styles}
          emptyIcon={Receipt}
          emptyTitle={t('seller.workspace.noInvoices')}
          emptyDesc={t('seller.workspace.noInvoicesDesc')}
        />
      )}
    </div>
  );
};

// =============================================================================
// Stock Tab
// =============================================================================

const stockColumnHelper = createColumnHelper<InventoryItem>();

const StockTab: React.FC<InvoicesTabProps> = ({ styles, t, _isRtl }) => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<StockStatus | ''>('');
  const [_showAdjustPanel, setShowAdjustPanel] = useState(false);
  const [_selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const fetchStock = useCallback(async () => {
    try {
      setIsLoading(true);
      const [inv, adj] = await Promise.all([
        sellerWorkspaceService.getInventory(),
        sellerWorkspaceService.getStockAdjustments(),
      ]);
      setInventory(inv);
      setAdjustments(adj);
    } catch {
      setInventory([]);
      setAdjustments([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStock();
  }, [fetchStock]);

  const filteredInventory = useMemo(() => {
    let result = [...inventory];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((item) => item.name.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q));
    }
    if (stockFilter) {
      result = result.filter((item) => item.stockStatus === stockFilter);
    }
    return result;
  }, [inventory, searchQuery, stockFilter]);

  const columns = useMemo(
    () => [
      stockColumnHelper.accessor('name', {
        header: t('seller.workspace.item'),
        cell: ({ row }) => (
          <div>
            <p className="font-medium" style={{ color: styles.textPrimary }}>
              {row.original.name}
            </p>
            <p className="text-xs" style={{ color: styles.textMuted }}>
              {row.original.sku}
            </p>
          </div>
        ),
        size: 250,
      }),
      stockColumnHelper.accessor('stock', {
        header: t('seller.workspace.currentStock'),
        cell: ({ row }) => (
          <span className="font-semibold tabular-nums" style={{ color: styles.textPrimary }}>
            {row.original.stock}
          </span>
        ),
        size: 100,
      }),
      stockColumnHelper.accessor('stockStatus', {
        header: t('seller.workspace.status'),
        cell: ({ row }) => {
          const config = getStockStatusConfig(row.original.stockStatus);
          const colorMap: Record<string, string> = {
            success: styles.success,
            warning: styles.warning,
            error: styles.error,
          };
          return (
            <span
              className="px-2 py-0.5 rounded text-xs font-medium"
              style={{ backgroundColor: `${colorMap[config.color]}15`, color: colorMap[config.color] }}
            >
              {t(config.labelKey)}
            </span>
          );
        },
        size: 110,
      }),
      stockColumnHelper.accessor('price', {
        header: t('seller.workspace.price'),
        cell: ({ row }) => (
          <span className="tabular-nums" style={{ color: styles.textSecondary }}>
            {row.original.price.toLocaleString()} SAR
          </span>
        ),
        size: 100,
      }),
      stockColumnHelper.display({
        id: 'actions',
        header: t('common.actions'),
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setSelectedItem(row.original);
                setShowAdjustPanel(true);
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ backgroundColor: styles.bgSecondary, color: styles.textPrimary }}
            >
              <ArrowUp size={12} />
              <ArrowDown size={12} />
              {t('seller.workspace.adjust')}
            </button>
          </div>
        ),
        size: 120,
      }),
    ],
    [styles, t],
  );

  const table = useReactTable({
    data: filteredInventory,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={t('seller.workspace.searchStock')}
            styles={styles}
          />
          <Select
            value={stockFilter}
            onChange={(v) => setStockFilter(v as StockStatus | '')}
            options={[
              { value: '', label: t('common.all') },
              { value: 'in_stock', label: t('seller.workspace.inStock') },
              { value: 'low_stock', label: t('seller.workspace.lowStock') },
              { value: 'out_of_stock', label: t('seller.workspace.outOfStock') },
            ]}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <StockStatCard
          label={t('seller.workspace.inStock')}
          value={inventory.filter((i) => i.stockStatus === 'in_stock').length}
          color={styles.success}
          styles={styles}
        />
        <StockStatCard
          label={t('seller.workspace.lowStock')}
          value={inventory.filter((i) => i.stockStatus === 'low_stock').length}
          color={styles.warning}
          styles={styles}
        />
        <StockStatCard
          label={t('seller.workspace.outOfStock')}
          value={inventory.filter((i) => i.stockStatus === 'out_of_stock').length}
          color={styles.error}
          styles={styles}
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div
          className="rounded-xl border py-12 flex items-center justify-center"
          style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
        >
          <Spinner size={28} className="animate-spin" style={{ color: styles.textMuted }} />
        </div>
      ) : (
        <DataTable
          table={table}
          styles={styles}
          emptyIcon={Package}
          emptyTitle={t('seller.workspace.noStock')}
          emptyDesc={t('seller.workspace.noStockDesc')}
        />
      )}

      {/* Recent Adjustments */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold mb-3" style={{ color: styles.textPrimary }}>
          {t('seller.workspace.recentAdjustments')}
        </h3>
        <div className="space-y-2">
          {adjustments.slice(0, 5).map((adj) => {
            const config = getStockReasonConfig(adj.reason);
            const item = inventory.find((i) => i.id === adj.itemId);
            return (
              <div
                key={adj.id}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ backgroundColor: styles.bgCard, border: `1px solid ${styles.border}` }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${adj.adjustmentQty > 0 ? 'text-green-600' : 'text-red-600'}`}
                    style={{ backgroundColor: adj.adjustmentQty > 0 ? `${styles.success}15` : `${styles.error}15` }}
                  >
                    {adj.adjustmentQty > 0 ? (
                      <ArrowUp size={16} weight="bold" />
                    ) : (
                      <ArrowDown size={16} weight="bold" />
                    )}
                  </span>
                  <div>
                    <p className="text-sm font-medium" style={{ color: styles.textPrimary }}>
                      {item?.name || 'Unknown Item'}
                    </p>
                    <p className="text-xs" style={{ color: styles.textMuted }}>
                      {t(config.labelKey)} • {adj.notes || '-'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className="text-sm font-semibold tabular-nums"
                    style={{ color: adj.adjustmentQty > 0 ? styles.success : styles.error }}
                  >
                    {adj.adjustmentQty > 0 ? '+' : ''}
                    {adj.adjustmentQty}
                  </p>
                  <p className="text-xs" style={{ color: styles.textMuted }}>
                    {new Date(adj.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// Costs Tab
// =============================================================================

const costColumnHelper = createColumnHelper<ItemCostTag>();

const CostsTab: React.FC<InvoicesTabProps> = ({ styles, t, _isRtl }) => {
  const [costTags, setCostTags] = useState<ItemCostTag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([{ id: 'date', desc: true }]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<CostType | ''>('');

  const fetchCostTags = useCallback(async () => {
    try {
      setIsLoading(true);
      const tags = await sellerWorkspaceService.getCostTags({
        costType: typeFilter || undefined,
      });
      setCostTags(tags);
    } catch {
      setCostTags([]);
    } finally {
      setIsLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => {
    fetchCostTags();
  }, [fetchCostTags]);

  const filteredCosts = useMemo(() => {
    let result = [...costTags];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((c) => c.vendor?.toLowerCase().includes(q) || c.invoiceRef?.toLowerCase().includes(q));
    }
    if (typeFilter) {
      result = result.filter((c) => c.costType === typeFilter);
    }
    return result;
  }, [costTags, searchQuery, typeFilter]);

  // Cost summary
  const costSummary = useMemo(() => {
    const byType: Record<CostType, number> = {
      purchase: 0,
      shipping: 0,
      customs: 0,
      storage: 0,
      marketing: 0,
      platform_fee: 0,
      other: 0,
    };
    costTags.forEach((c) => {
      byType[c.costType] += c.amount;
    });
    const total = Object.values(byType).reduce((a, b) => a + b, 0);
    return { byType, total };
  }, [costTags]);

  const columns = useMemo(
    () => [
      costColumnHelper.accessor('costType', {
        header: t('seller.workspace.costType'),
        cell: ({ row }) => {
          const config = getCostTypeConfig(row.original.costType);
          return (
            <span className="flex items-center gap-2">
              <span
                className="px-2 py-0.5 rounded text-xs font-medium"
                style={{ backgroundColor: styles.bgSecondary, color: styles.textSecondary }}
              >
                {t(config.labelKey)}
              </span>
            </span>
          );
        },
        size: 130,
      }),
      costColumnHelper.accessor('amount', {
        header: t('seller.workspace.amount'),
        cell: ({ row }) => (
          <span className="font-semibold tabular-nums" style={{ color: styles.textPrimary }}>
            {row.original.amount.toLocaleString()} {row.original.currency}
          </span>
        ),
        size: 120,
      }),
      costColumnHelper.accessor('vendor', {
        header: t('seller.workspace.vendor'),
        cell: ({ row }) => <span style={{ color: styles.textSecondary }}>{row.original.vendor || '-'}</span>,
        size: 150,
      }),
      costColumnHelper.accessor('date', {
        header: t('seller.workspace.date'),
        cell: ({ row }) => (
          <span className="text-sm" style={{ color: styles.textMuted }}>
            {row.original.date ? new Date(row.original.date).toLocaleDateString() : '-'}
          </span>
        ),
        size: 100,
      }),
      costColumnHelper.display({
        id: 'actions',
        header: t('common.actions'),
        cell: () => (
          <div className="flex items-center gap-1">
            <ActionButton icon={Trash} tooltip={t('common.delete')} styles={styles} onClick={() => {}} danger />
          </div>
        ),
        size: 80,
      }),
    ],
    [styles, t],
  );

  const table = useReactTable({
    data: filteredCosts,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div>
      {/* Cost Summary */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div
          className="p-4 rounded-xl"
          style={{ backgroundColor: styles.bgCard, border: `1px solid ${styles.border}` }}
        >
          <p className="text-xs font-medium uppercase" style={{ color: styles.textMuted }}>
            {t('seller.workspace.totalCosts')}
          </p>
          <p className="text-2xl font-bold mt-1 tabular-nums" style={{ color: styles.textPrimary }}>
            {costSummary.total.toLocaleString()} SAR
          </p>
        </div>
        <CostTypeCard
          label={t('seller.workspace.costPurchase')}
          amount={costSummary.byType.purchase}
          color="#3B82F6"
          styles={styles}
        />
        <CostTypeCard
          label={t('seller.workspace.costShipping')}
          amount={costSummary.byType.shipping}
          color="#10B981"
          styles={styles}
        />
        <CostTypeCard
          label={t('seller.workspace.costCustoms')}
          amount={costSummary.byType.customs}
          color="#F59E0B"
          styles={styles}
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={t('seller.workspace.searchCosts')}
            styles={styles}
          />
          <Select
            value={typeFilter}
            onChange={(v) => setTypeFilter(v as CostType | '')}
            options={[
              { value: '', label: t('common.all') },
              { value: 'purchase', label: t('seller.workspace.costPurchase') },
              { value: 'shipping', label: t('seller.workspace.costShipping') },
              { value: 'customs', label: t('seller.workspace.costCustoms') },
              { value: 'storage', label: t('seller.workspace.costStorage') },
              { value: 'marketing', label: t('seller.workspace.costMarketing') },
              { value: 'other', label: t('seller.workspace.costOther') },
            ]}
          />
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{
            backgroundColor: styles.isDark ? '#E6E8EB' : '#0F1115',
            color: styles.isDark ? '#0F1115' : '#E6E8EB',
          }}
        >
          <Plus size={16} weight="bold" />
          {t('seller.workspace.addCost')}
        </button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div
          className="rounded-xl border py-12 flex items-center justify-center"
          style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
        >
          <Spinner size={28} className="animate-spin" style={{ color: styles.textMuted }} />
        </div>
      ) : (
        <DataTable
          table={table}
          styles={styles}
          emptyIcon={Tag}
          emptyTitle={t('seller.workspace.noCosts')}
          emptyDesc={t('seller.workspace.noCostsDesc')}
        />
      )}
    </div>
  );
};

// =============================================================================
// Buyers Tab
// =============================================================================

const buyerColumnHelper = createColumnHelper<SellerBuyerProfile>();

const BuyersTab: React.FC<InvoicesTabProps> = ({ styles, t, _isRtl }) => {
  const [buyers, setBuyers] = useState<SellerBuyerProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([{ id: 'totalSpend', desc: true }]);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchBuyers = useCallback(async () => {
    try {
      setIsLoading(true);
      const profiles = await sellerWorkspaceService.getBuyerProfiles();
      setBuyers(profiles);
    } catch {
      setBuyers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBuyers();
  }, [fetchBuyers]);

  const filteredBuyers = useMemo(() => {
    if (!searchQuery) return buyers;
    const q = searchQuery.toLowerCase();
    return buyers.filter(
      (b) =>
        b.name.toLowerCase().includes(q) || b.company?.toLowerCase().includes(q) || b.email?.toLowerCase().includes(q),
    );
  }, [buyers, searchQuery]);

  const columns = useMemo(
    () => [
      buyerColumnHelper.accessor('name', {
        header: t('seller.workspace.buyer'),
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold"
              style={{ backgroundColor: styles.bgSecondary, color: styles.textSecondary }}
            >
              {row.original.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)}
            </div>
            <div>
              <p className="font-medium" style={{ color: styles.textPrimary }}>
                {row.original.name}
              </p>
              {row.original.company && (
                <p className="text-xs flex items-center gap-1" style={{ color: styles.textMuted }}>
                  <Buildings size={10} />
                  {row.original.company}
                </p>
              )}
            </div>
          </div>
        ),
        size: 220,
      }),
      buyerColumnHelper.accessor('totalOrders', {
        header: t('seller.workspace.orders'),
        cell: ({ row }) => (
          <span className="font-semibold tabular-nums" style={{ color: styles.textPrimary }}>
            {row.original.totalOrders}
          </span>
        ),
        size: 80,
      }),
      buyerColumnHelper.accessor('totalSpend', {
        header: t('seller.workspace.totalSpend'),
        cell: ({ row }) => (
          <span className="font-semibold tabular-nums" style={{ color: styles.success }}>
            {row.original.totalSpend.toLocaleString()} SAR
          </span>
        ),
        size: 130,
      }),
      buyerColumnHelper.accessor('avgOrderValue', {
        header: t('seller.workspace.avgOrder'),
        cell: ({ row }) => (
          <span className="tabular-nums" style={{ color: styles.textSecondary }}>
            {row.original.avgOrderValue.toLocaleString()} SAR
          </span>
        ),
        size: 120,
      }),
      buyerColumnHelper.accessor('rating', {
        header: t('seller.workspace.rating'),
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            {row.original.rating ? (
              <>
                <Star size={14} weight="fill" style={{ color: '#FBBF24' }} />
                <span className="font-medium" style={{ color: styles.textPrimary }}>
                  {row.original.rating}
                </span>
              </>
            ) : (
              <span style={{ color: styles.textMuted }}>-</span>
            )}
          </div>
        ),
        size: 80,
      }),
      buyerColumnHelper.display({
        id: 'contact',
        header: t('seller.workspace.contact'),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            {row.original.email && (
              <button className="p-1.5 rounded" style={{ color: styles.textMuted }} title={row.original.email}>
                <EnvelopeSimple size={14} />
              </button>
            )}
            {row.original.phone && (
              <button className="p-1.5 rounded" style={{ color: styles.textMuted }} title={row.original.phone}>
                <Phone size={14} />
              </button>
            )}
          </div>
        ),
        size: 80,
      }),
      buyerColumnHelper.display({
        id: 'actions',
        header: t('common.actions'),
        cell: () => (
          <div className="flex items-center gap-1">
            <ActionButton icon={Eye} tooltip={t('common.view')} styles={styles} onClick={() => {}} />
            <ActionButton icon={Note} tooltip={t('seller.workspace.addNote')} styles={styles} onClick={() => {}} />
          </div>
        ),
        size: 100,
      }),
    ],
    [styles, t],
  );

  const table = useReactTable({
    data: filteredBuyers,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={t('seller.workspace.searchBuyers')}
            styles={styles}
          />
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{
            backgroundColor: styles.isDark ? '#E6E8EB' : '#0F1115',
            color: styles.isDark ? '#0F1115' : '#E6E8EB',
          }}
        >
          <Plus size={16} weight="bold" />
          {t('seller.workspace.addBuyer')}
        </button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div
          className="rounded-xl border py-12 flex items-center justify-center"
          style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
        >
          <Spinner size={28} className="animate-spin" style={{ color: styles.textMuted }} />
        </div>
      ) : (
        <DataTable
          table={table}
          styles={styles}
          emptyIcon={Users}
          emptyTitle={t('seller.workspace.noBuyers')}
          emptyDesc={t('seller.workspace.noBuyersDesc')}
        />
      )}
    </div>
  );
};

// =============================================================================
// Shared Components
// =============================================================================

const SearchInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  styles: ReturnType<typeof usePortal>['styles'];
}> = ({ value, onChange, placeholder, styles }) => (
  <div
    className="flex items-center gap-2 px-3 h-9 rounded-lg border min-w-[200px] max-w-[300px]"
    style={{ borderColor: styles.border, backgroundColor: styles.bgPrimary }}
  >
    <MagnifyingGlass size={16} style={{ color: styles.textMuted }} />
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="outline-none text-sm bg-transparent flex-1"
      style={{ color: styles.textPrimary }}
    />
    {value && (
      <button onClick={() => onChange('')} style={{ color: styles.textMuted }}>
        <X size={14} />
      </button>
    )}
  </div>
);

const ActionButton: React.FC<{
  icon: React.ComponentType<{ size: number }>;
  tooltip: string;
  styles: ReturnType<typeof usePortal>['styles'];
  onClick: () => void;
  danger?: boolean;
}> = ({ icon: Icon, tooltip, styles, onClick, danger }) => (
  <button
    onClick={onClick}
    className="p-1.5 rounded transition-colors"
    style={{ color: danger ? styles.error : styles.textMuted }}
    title={tooltip}
    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.bgHover)}
    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
  >
    <Icon size={14} />
  </button>
);

const DataTable: React.FC<{
  table: any;
  styles: ReturnType<typeof usePortal>['styles'];
  emptyIcon: React.ComponentType<{ size: number; weight?: string }>;
  emptyTitle: string;
  emptyDesc: string;
}> = ({ table, styles, emptyIcon, emptyTitle, emptyDesc }) => {
  if (table.getRowModel().rows.length === 0) {
    return (
      <div className="rounded-xl border py-12" style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}>
        <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDesc} />
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup: any) => (
              <tr
                key={headerGroup.id}
                style={{ backgroundColor: styles.tableHeader, borderBottom: `1px solid ${styles.tableBorder}` }}
              >
                {headerGroup.headers.map((header: any) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-left"
                    style={{ color: styles.textMuted, width: header.getSize() }}
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={`flex items-center gap-1 ${header.column.getCanSort() ? 'cursor-pointer select-none' : ''}`}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <span className="flex flex-col -space-y-1 ml-0.5">
                            {header.column.getIsSorted() === 'asc' ? (
                              <CaretUp size={12} weight="bold" style={{ color: styles.textPrimary }} />
                            ) : header.column.getIsSorted() === 'desc' ? (
                              <CaretDown size={12} weight="bold" style={{ color: styles.textPrimary }} />
                            ) : (
                              <>
                                <CaretUp size={10} style={{ color: styles.textMuted, opacity: 0.4 }} />
                                <CaretDown size={10} style={{ color: styles.textMuted, opacity: 0.4 }} />
                              </>
                            )}
                          </span>
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row: any, index: number) => (
              <tr
                key={row.id}
                style={{
                  borderBottom:
                    index === table.getRowModel().rows.length - 1 ? 'none' : `1px solid ${styles.tableBorder}`,
                }}
                className="transition-colors"
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.tableRowHover)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                {row.getVisibleCells().map((cell: any) => (
                  <td key={cell.id} className="px-4 py-3" style={{ width: cell.column.getSize() }}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const StockStatCard: React.FC<{
  label: string;
  value: number;
  color: string;
  styles: ReturnType<typeof usePortal>['styles'];
}> = ({ label, value, color, styles }) => (
  <div className="p-4 rounded-xl" style={{ backgroundColor: styles.bgCard, border: `1px solid ${styles.border}` }}>
    <p className="text-xs font-medium uppercase" style={{ color: styles.textMuted }}>
      {label}
    </p>
    <p className="text-2xl font-bold mt-1 tabular-nums" style={{ color }}>
      {value}
    </p>
  </div>
);

const CostTypeCard: React.FC<{
  label: string;
  amount: number;
  color: string;
  styles: ReturnType<typeof usePortal>['styles'];
}> = ({ label, amount, color, styles }) => (
  <div className="p-4 rounded-xl" style={{ backgroundColor: styles.bgCard, border: `1px solid ${styles.border}` }}>
    <div className="flex items-center gap-2 mb-1">
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      <p className="text-xs font-medium uppercase" style={{ color: styles.textMuted }}>
        {label}
      </p>
    </div>
    <p className="text-lg font-bold tabular-nums" style={{ color: styles.textPrimary }}>
      {amount.toLocaleString()} SAR
    </p>
  </div>
);

export default SellerWorkspace;
