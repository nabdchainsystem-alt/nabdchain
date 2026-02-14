import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendUp,
  TrendDown,
  Warning,
  WarningCircle,
  Lightning,
  ChartLineUp,
  Buildings,
  Cube,
  CaretDown,
  CaretUp,
  CheckCircle,
  X,
  Truck,
  CurrencyDollar,
  Fire,
  Heartbeat,
  Info,
  Package,
  Receipt,
  Storefront,
} from 'phosphor-react';
import { usePortal } from '../../../context/PortalContext';
import { useAuth } from '../../../../../auth-adapter';
import { API_URL } from '../../../../../config/api';
import { BuyerDashboardSummary } from '../../../types/order.types';

interface DashboardTabProps {
  onNavigate?: (tab: string) => void;
  onSwitchTab?: (tab: string) => void;
}

// =============================================================================
// Intelligence Types
// =============================================================================

interface PurchaseVelocity {
  current: number; // orders per week
  previous: number;
  trend: 'accelerating' | 'steady' | 'slowing';
  insight: string;
  weeklyData: number[]; // last 8 weeks
}

interface SupplierRisk {
  supplierId: string;
  supplierName: string;
  dependencyScore: number; // 0-100, higher = more dependent
  spendShare: number; // percentage of total spend
  riskLevel: 'high' | 'medium' | 'low';
  factors: string[];
  alternativeCount: number;
}

interface InventoryBurnRate {
  itemId: string;
  itemName: string;
  currentStock: number;
  burnRate: number; // units per week
  daysUntilEmpty: number;
  status: 'critical' | 'warning' | 'ok';
  reorderSuggested: boolean;
}

interface SmartAlert {
  id: string;
  type: 'price_increase' | 'delay_risk' | 'stockout_warning' | 'supplier_issue' | 'opportunity';
  severity: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  itemName?: string;
  supplierName?: string;
  actionLabel?: string;
  actionTarget?: string;
  createdAt: string;
  dismissed?: boolean;
}

interface Snackbar {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  action?: {
    label: string;
    onClick: () => void;
  };
}

// =============================================================================
// Empty defaults (Production: Backend aggregation)
// =============================================================================

const emptyPurchaseVelocity: PurchaseVelocity = {
  current: 0,
  previous: 0,
  trend: 'steady',
  insight: 'No purchase activity yet',
  weeklyData: [],
};

// =============================================================================
// Dashboard Tab Component
// =============================================================================

export const DashboardTab: React.FC<DashboardTabProps> = ({ onNavigate }) => {
  const { styles, t, direction } = usePortal();
  const { getToken } = useAuth();
  const isRTL = direction === 'rtl';

  // Fetch dashboard data internally
  const [dashboardData, setDashboardData] = useState<BuyerDashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchDashboard = async () => {
      try {
        setIsLoading(true);
        const token = await getToken();
        if (!token || cancelled) return;

        // Fetch dashboard summary and intelligence in parallel
        const [dashRes, intelRes] = await Promise.all([
          fetch(`${API_URL}/orders/buyer/dashboard`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/purchases/buyer/intelligence`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!dashRes.ok) throw new Error('Failed to fetch dashboard');
        const data = await dashRes.json();
        if (!cancelled) setDashboardData(data);

        // Intelligence data (graceful degradation)
        if (intelRes.ok) {
          const intel = await intelRes.json();
          if (!cancelled) {
            setPurchaseVelocity(intel.purchaseVelocity || emptyPurchaseVelocity);
            setSupplierRisks(intel.supplierRisks || []);
            setAlerts(intel.alerts || []);
          }
        }
      } catch {
        if (!cancelled) setDashboardData(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    fetchDashboard();
    return () => {
      cancelled = true;
    };
  }, [getToken]);

  // State
  const [purchaseVelocity, setPurchaseVelocity] = useState<PurchaseVelocity>(emptyPurchaseVelocity);
  const [supplierRisks, setSupplierRisks] = useState<SupplierRisk[]>([]);
  const [burnRates] = useState<InventoryBurnRate[]>([]);
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const [snackbars, setSnackbars] = useState<Snackbar[]>([]);
  const [expandedPanels, setExpandedPanels] = useState<Record<string, boolean>>({
    velocity: true,
    risks: false,
    burnRate: false,
  });

  // Toggle panel expansion
  const togglePanel = useCallback((panel: string) => {
    setExpandedPanels((prev) => ({ ...prev, [panel]: !prev[panel] }));
  }, []);

  // Dismiss alert
  const dismissAlert = useCallback((alertId: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    showSnackbar('Alert dismissed', 'info');
  }, []);

  // Show snackbar
  const showSnackbar = useCallback((message: string, type: Snackbar['type'], action?: Snackbar['action']) => {
    const id = Date.now().toString();
    setSnackbars((prev) => [...prev, { id, message, type, action }]);
    setTimeout(() => {
      setSnackbars((prev) => prev.filter((s) => s.id !== id));
    }, 4000);
  }, []);

  // Handle action from alert
  const handleAlertAction = useCallback(
    (alert: SmartAlert) => {
      if (alert.actionTarget && onNavigate) {
        onNavigate(alert.actionTarget);
        showSnackbar(`Navigating to ${alert.actionTarget}...`, 'info');
      }
    },
    [onNavigate, showSnackbar],
  );

  return (
    <div className="space-y-6" dir={direction}>
      {/* Smart Alerts Section - Top Priority */}
      {alerts.length > 0 && (
        <SmartAlertsSection
          alerts={alerts}
          onDismiss={dismissAlert}
          onAction={handleAlertAction}
          styles={styles}
          isRTL={isRTL}
        />
      )}

      {/* Insight Panels Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Purchase Velocity Panel */}
        <InsightPanel
          id="velocity"
          title="Purchase Velocity"
          subtitle={purchaseVelocity.insight}
          icon={ChartLineUp}
          iconColor={
            purchaseVelocity.trend === 'accelerating'
              ? styles.success
              : purchaseVelocity.trend === 'slowing'
                ? '#f59e0b'
                : styles.info
          }
          isExpanded={expandedPanels.velocity}
          onToggle={() => togglePanel('velocity')}
          styles={styles}
          isRTL={isRTL}
        >
          <PurchaseVelocityContent velocity={purchaseVelocity} styles={styles} isRTL={isRTL} />
        </InsightPanel>

        {/* Supplier Dependency Risk Panel */}
        <InsightPanel
          id="risks"
          title="Supplier Dependency Risk"
          subtitle={`${supplierRisks.filter((r) => r.riskLevel === 'high').length} high-risk dependencies`}
          icon={Buildings}
          iconColor={supplierRisks.some((r) => r.riskLevel === 'high') ? styles.error : styles.success}
          isExpanded={expandedPanels.risks}
          onToggle={() => togglePanel('risks')}
          badge={supplierRisks.filter((r) => r.riskLevel === 'high').length > 0 ? 'Action Needed' : undefined}
          badgeColor={styles.error}
          styles={styles}
          isRTL={isRTL}
        >
          <SupplierRiskContent
            risks={supplierRisks}
            onFindAlternatives={(_supplierId) => {
              showSnackbar('Searching for alternative suppliers...', 'info');
              onNavigate?.('marketplace');
            }}
            styles={styles}
            isRTL={isRTL}
          />
        </InsightPanel>

        {/* Inventory Burn Rate Panel */}
        <InsightPanel
          id="burnRate"
          title="Inventory Burn Rate"
          subtitle={`${burnRates.filter((b) => b.status !== 'ok').length} items need attention`}
          icon={Cube}
          iconColor={burnRates.some((b) => b.status === 'critical') ? styles.error : '#f59e0b'}
          isExpanded={expandedPanels.burnRate}
          onToggle={() => togglePanel('burnRate')}
          badge={burnRates.filter((b) => b.status === 'critical').length > 0 ? 'Critical' : undefined}
          badgeColor={styles.error}
          styles={styles}
          isRTL={isRTL}
        >
          <BurnRateContent
            items={burnRates}
            onReorder={(_itemId) => {
              showSnackbar('Opening RFQ for reorder...', 'success');
              onNavigate?.('rfq');
            }}
            styles={styles}
            isRTL={isRTL}
          />
        </InsightPanel>

        {/* Quick Stats Mini Panel */}
        <QuickStatsPanel data={dashboardData} isLoading={isLoading} styles={styles} isRTL={isRTL} t={t} />
      </div>

      {/* Contextual Snackbars */}
      <SnackbarContainer
        snackbars={snackbars}
        onDismiss={(id) => setSnackbars((prev) => prev.filter((s) => s.id !== id))}
        styles={styles}
      />
    </div>
  );
};

// =============================================================================
// Smart Alerts Section
// =============================================================================

interface SmartAlertsSectionProps {
  alerts: SmartAlert[];
  onDismiss: (id: string) => void;
  onAction: (alert: SmartAlert) => void;
  styles: ReturnType<typeof usePortal>['styles'];
  isRTL: boolean;
}

const SmartAlertsSection: React.FC<SmartAlertsSectionProps> = ({ alerts, onDismiss, onAction, styles, isRTL }) => {
  const getAlertConfig = (alert: SmartAlert) => {
    const configs = {
      price_increase: { icon: TrendUp, color: styles.error, bg: 'rgba(239, 68, 68, 0.08)' },
      delay_risk: { icon: Truck, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.08)' },
      stockout_warning: { icon: Warning, color: styles.error, bg: 'rgba(239, 68, 68, 0.08)' },
      supplier_issue: { icon: WarningCircle, color: styles.error, bg: 'rgba(239, 68, 68, 0.08)' },
      opportunity: { icon: Lightning, color: styles.success, bg: 'rgba(34, 197, 94, 0.08)' },
    };
    return configs[alert.type];
  };

  const sortedAlerts = [...alerts].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.severity] - order[b.severity];
  });

  return (
    <div className="space-y-2">
      <div className={`flex items-center gap-2 mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <Heartbeat size={18} weight="fill" style={{ color: styles.error }} />
        <h3 className="text-sm font-semibold" style={{ color: styles.textPrimary }}>
          Smart Alerts
        </h3>
        <span
          className="px-2 py-0.5 rounded-full text-[10px] font-medium"
          style={{ backgroundColor: styles.error, color: '#fff' }}
        >
          {alerts.length}
        </span>
      </div>

      <div className="space-y-2">
        {sortedAlerts.slice(0, 3).map((alert) => {
          const config = getAlertConfig(alert);
          const Icon = config.icon;

          return (
            <div
              key={alert.id}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${isRTL ? 'flex-row-reverse' : ''}`}
              style={{
                backgroundColor: config.bg,
                borderColor: `${config.color}30`,
              }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${config.color}20` }}
              >
                <Icon size={16} weight="fill" style={{ color: config.color }} />
              </div>

              <div className={`flex-1 min-w-0 ${isRTL ? 'text-right' : ''}`}>
                <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="text-sm font-medium" style={{ color: styles.textPrimary }}>
                    {alert.title}
                  </span>
                  {alert.severity === 'high' && <Fire size={12} weight="fill" style={{ color: styles.error }} />}
                </div>
                <p className="text-xs mt-0.5" style={{ color: styles.textSecondary }}>
                  {alert.message}
                </p>
                {alert.supplierName && (
                  <p className="text-[10px] mt-1" style={{ color: styles.textMuted }}>
                    via {alert.supplierName}
                  </p>
                )}
              </div>

              <div className={`flex items-center gap-1 shrink-0 ${isRTL ? 'flex-row-reverse' : ''}`}>
                {alert.actionLabel && (
                  <button
                    onClick={() => onAction(alert)}
                    className="px-2 py-1 rounded text-xs font-medium transition-colors"
                    style={{ backgroundColor: config.color, color: '#fff' }}
                  >
                    {alert.actionLabel}
                  </button>
                )}
                <button
                  onClick={() => onDismiss(alert.id)}
                  className="p-1 rounded transition-colors hover:bg-black/10"
                  style={{ color: styles.textMuted }}
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// =============================================================================
// Expandable Insight Panel
// =============================================================================

interface InsightPanelProps {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  iconColor: string;
  isExpanded: boolean;
  onToggle: () => void;
  badge?: string;
  badgeColor?: string;
  styles: ReturnType<typeof usePortal>['styles'];
  isRTL: boolean;
  children: React.ReactNode;
}

const InsightPanel: React.FC<InsightPanelProps> = ({
  id: _id,
  title,
  subtitle,
  icon: Icon,
  iconColor,
  isExpanded,
  onToggle,
  badge,
  badgeColor,
  styles,
  isRTL,
  children,
}) => {
  return (
    <div
      className="rounded-xl border overflow-hidden transition-all"
      style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
    >
      {/* Header - Always visible, clickable */}
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between p-4 transition-colors ${isRTL ? 'flex-row-reverse text-right' : ''}`}
        style={{ backgroundColor: isExpanded ? styles.bgSecondary : 'transparent' }}
      >
        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${iconColor}15` }}
          >
            <Icon size={20} weight="duotone" style={{ color: iconColor }} />
          </div>
          <div className={isRTL ? 'text-right' : ''}>
            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <h3 className="text-sm font-semibold" style={{ color: styles.textPrimary }}>
                {title}
              </h3>
              {badge && (
                <span
                  className="px-1.5 py-0.5 rounded text-[9px] font-medium"
                  style={{ backgroundColor: `${badgeColor}20`, color: badgeColor }}
                >
                  {badge}
                </span>
              )}
            </div>
            <p className="text-xs mt-0.5" style={{ color: styles.textMuted }}>
              {subtitle}
            </p>
          </div>
        </div>
        <div style={{ color: styles.textMuted }}>{isExpanded ? <CaretUp size={16} /> : <CaretDown size={16} />}</div>
      </button>

      {/* Expandable Content */}
      {isExpanded && <div className="p-4 pt-0">{children}</div>}
    </div>
  );
};

// =============================================================================
// Purchase Velocity Content
// =============================================================================

interface PurchaseVelocityContentProps {
  velocity: PurchaseVelocity;
  styles: ReturnType<typeof usePortal>['styles'];
  isRTL: boolean;
}

const PurchaseVelocityContent: React.FC<PurchaseVelocityContentProps> = ({ velocity, styles, isRTL }) => {
  const maxValue = Math.max(...velocity.weeklyData);
  const trendColor =
    velocity.trend === 'accelerating' ? styles.success : velocity.trend === 'slowing' ? '#f59e0b' : styles.info;

  return (
    <div className="space-y-4">
      {/* Mini Trend Chart */}
      <div className="flex items-end justify-between gap-1 h-16">
        {velocity.weeklyData.map((value, idx) => {
          const height = (value / maxValue) * 100;
          const isLatest = idx === velocity.weeklyData.length - 1;
          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`w-full rounded-t transition-all ${isLatest ? 'opacity-100' : 'opacity-60'}`}
                style={{
                  height: `${height}%`,
                  backgroundColor: isLatest ? trendColor : styles.textMuted,
                  minHeight: '4px',
                }}
              />
              <span className="text-[9px]" style={{ color: styles.textMuted }}>
                {idx === 0 ? '8w' : idx === velocity.weeklyData.length - 1 ? 'Now' : ''}
              </span>
            </div>
          );
        })}
      </div>

      {/* Stats Row */}
      <div
        className={`flex items-center justify-between p-3 rounded-lg ${isRTL ? 'flex-row-reverse' : ''}`}
        style={{ backgroundColor: styles.bgSecondary }}
      >
        <div className={isRTL ? 'text-right' : ''}>
          <span className="text-xs" style={{ color: styles.textMuted }}>
            This Week
          </span>
          <p className="text-lg font-bold" style={{ color: styles.textPrimary }}>
            {velocity.current} orders
          </p>
        </div>
        <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {velocity.current > velocity.previous ? (
            <TrendUp size={16} weight="bold" style={{ color: styles.success }} />
          ) : (
            <TrendDown size={16} weight="bold" style={{ color: styles.error }} />
          )}
          <span
            className="text-sm font-medium"
            style={{ color: velocity.current > velocity.previous ? styles.success : styles.error }}
          >
            {Math.abs(Math.round(((velocity.current - velocity.previous) / velocity.previous) * 100))}%
          </span>
        </div>
      </div>

      {/* Insight */}
      <div
        className={`flex items-start gap-2 p-3 rounded-lg ${isRTL ? 'flex-row-reverse' : ''}`}
        style={{ backgroundColor: `${trendColor}10` }}
      >
        <Info size={14} style={{ color: trendColor, marginTop: 2 }} />
        <p className="text-xs" style={{ color: styles.textSecondary }}>
          {velocity.insight}
        </p>
      </div>
    </div>
  );
};

// =============================================================================
// Supplier Risk Content
// =============================================================================

interface SupplierRiskContentProps {
  risks: SupplierRisk[];
  onFindAlternatives: (supplierId: string) => void;
  styles: ReturnType<typeof usePortal>['styles'];
  isRTL: boolean;
}

const SupplierRiskContent: React.FC<SupplierRiskContentProps> = ({ risks, onFindAlternatives, styles, isRTL }) => {
  const getRiskColor = (level: SupplierRisk['riskLevel']) => {
    return level === 'high' ? styles.error : level === 'medium' ? '#f59e0b' : styles.success;
  };

  return (
    <div className="space-y-3">
      {risks.map((risk) => {
        const color = getRiskColor(risk.riskLevel);
        return (
          <div
            key={risk.supplierId}
            className={`flex items-center gap-3 p-3 rounded-lg border ${isRTL ? 'flex-row-reverse' : ''}`}
            style={{ borderColor: styles.border, backgroundColor: styles.bgSecondary }}
          >
            {/* Dependency Score Gauge */}
            <div className="relative w-12 h-12 shrink-0">
              <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={styles.bgHover}
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={color}
                  strokeWidth="3"
                  strokeDasharray={`${risk.dependencyScore}, 100`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold" style={{ color }}>
                  {risk.dependencyScore}
                </span>
              </div>
            </div>

            {/* Info */}
            <div className={`flex-1 min-w-0 ${isRTL ? 'text-right' : ''}`}>
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="text-sm font-medium truncate" style={{ color: styles.textPrimary }}>
                  {risk.supplierName}
                </span>
                <span
                  className="px-1.5 py-0.5 rounded text-[9px] font-medium uppercase"
                  style={{ backgroundColor: `${color}20`, color }}
                >
                  {risk.riskLevel}
                </span>
              </div>
              <p className="text-[10px] mt-0.5" style={{ color: styles.textMuted }}>
                {risk.spendShare}% of spend • {risk.alternativeCount} alternatives
              </p>
              <p className="text-[10px]" style={{ color: styles.textSecondary }}>
                {risk.factors[0]}
              </p>
            </div>

            {/* Action */}
            {risk.riskLevel === 'high' && (
              <button
                onClick={() => onFindAlternatives(risk.supplierId)}
                className="px-2 py-1 rounded text-[10px] font-medium transition-colors shrink-0"
                style={{ backgroundColor: styles.info, color: '#fff' }}
              >
                Diversify
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

// =============================================================================
// Burn Rate Content
// =============================================================================

interface BurnRateContentProps {
  items: InventoryBurnRate[];
  onReorder: (itemId: string) => void;
  styles: ReturnType<typeof usePortal>['styles'];
  isRTL: boolean;
}

const BurnRateContent: React.FC<BurnRateContentProps> = ({ items, onReorder, styles, isRTL }) => {
  const getStatusConfig = (status: InventoryBurnRate['status']) => {
    return {
      critical: { color: styles.error, label: 'Critical', icon: Fire },
      warning: { color: '#f59e0b', label: 'Low', icon: Warning },
      ok: { color: styles.success, label: 'OK', icon: CheckCircle },
    }[status];
  };

  // Sort by days until empty
  const sortedItems = [...items].sort((a, b) => a.daysUntilEmpty - b.daysUntilEmpty);

  return (
    <div className="space-y-2">
      {sortedItems.map((item) => {
        const config = getStatusConfig(item.status);
        const Icon = config.icon;
        const daysWidth = Math.min((item.daysUntilEmpty / 90) * 100, 100);

        return (
          <div
            key={item.itemId}
            className={`flex items-center gap-3 p-3 rounded-lg ${isRTL ? 'flex-row-reverse' : ''}`}
            style={{ backgroundColor: styles.bgSecondary }}
          >
            {/* Status Icon */}
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${config.color}15` }}
            >
              <Icon size={14} weight="fill" style={{ color: config.color }} />
            </div>

            {/* Info + Progress */}
            <div className={`flex-1 min-w-0 ${isRTL ? 'text-right' : ''}`}>
              <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="text-sm font-medium truncate" style={{ color: styles.textPrimary }}>
                  {item.itemName}
                </span>
                <span className="text-xs font-medium shrink-0" style={{ color: config.color }}>
                  {item.daysUntilEmpty}d left
                </span>
              </div>

              {/* Burn rate bar */}
              <div className="mt-1.5 flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: styles.bgHover }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${daysWidth}%`,
                      backgroundColor: config.color,
                    }}
                  />
                </div>
                <span className="text-[10px] shrink-0" style={{ color: styles.textMuted }}>
                  {item.burnRate}/wk
                </span>
              </div>
            </div>

            {/* Reorder Button */}
            {item.reorderSuggested && (
              <button
                onClick={() => onReorder(item.itemId)}
                className="px-2 py-1 rounded text-[10px] font-medium transition-colors shrink-0"
                style={{ backgroundColor: config.color, color: '#fff' }}
              >
                Reorder
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

// =============================================================================
// Quick Stats Panel
// =============================================================================

interface QuickStatsPanelProps {
  data: BuyerDashboardSummary | null;
  isLoading: boolean;
  styles: ReturnType<typeof usePortal>['styles'];
  isRTL: boolean;
  t: (key: string) => string;
}

const QuickStatsPanel: React.FC<QuickStatsPanelProps> = ({ data, isLoading, styles, isRTL, t: _t }) => {
  const stats = [
    {
      label: 'Total Spend',
      value: data ? `${data.currency} ${(data.totalPurchaseSpend / 1000).toFixed(0)}K` : '-',
      trend: data?.trends.spend,
      icon: CurrencyDollar,
      color: styles.success,
    },
    {
      label: 'Active Suppliers',
      value: data?.activeSuppliers.toString() || '-',
      trend: data?.trends.suppliers,
      icon: Storefront,
      color: styles.info,
    },
    {
      label: 'Avg Order Value',
      value: data ? `${data.currency} ${data.avgPurchaseValue.toLocaleString()}` : '-',
      trend: data?.trends.avgValue,
      icon: Receipt,
      color: '#8b5cf6',
    },
    {
      label: 'Open Orders',
      value: data?.totalPurchaseOrders.toString() || '-',
      trend: data?.trends.orders,
      icon: Package,
      color: '#f59e0b',
    },
  ];

  return (
    <div className="rounded-xl border p-4" style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}>
      <h3 className={`text-sm font-semibold mb-4 ${isRTL ? 'text-right' : ''}`} style={{ color: styles.textPrimary }}>
        Quick Overview
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className={`p-3 rounded-lg ${isRTL ? 'text-right' : ''}`}
              style={{ backgroundColor: styles.bgSecondary }}
            >
              <div className={`flex items-center gap-2 mb-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Icon size={12} style={{ color: stat.color }} />
                <span className="text-[10px]" style={{ color: styles.textMuted }}>
                  {stat.label}
                </span>
              </div>
              {isLoading ? (
                <div className="h-5 w-16 rounded animate-pulse" style={{ backgroundColor: styles.bgHover }} />
              ) : (
                <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="text-base font-bold" style={{ color: styles.textPrimary }}>
                    {stat.value}
                  </span>
                  {stat.trend !== undefined && (
                    <span className="text-[10px]" style={{ color: stat.trend >= 0 ? styles.success : styles.error }}>
                      {stat.trend >= 0 ? '+' : ''}
                      {stat.trend}%
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// =============================================================================
// Snackbar Container
// =============================================================================

interface SnackbarContainerProps {
  snackbars: Snackbar[];
  onDismiss: (id: string) => void;
  styles: ReturnType<typeof usePortal>['styles'];
}

const SnackbarContainer: React.FC<SnackbarContainerProps> = ({ snackbars, onDismiss, styles }) => {
  if (snackbars.length === 0) return null;

  const getSnackbarConfig = (type: Snackbar['type']) =>
    ({
      success: { color: styles.success, icon: CheckCircle },
      info: { color: styles.info, icon: Info },
      warning: { color: '#f59e0b', icon: Warning },
      error: { color: styles.error, icon: WarningCircle },
    })[type];

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 space-y-2">
      {snackbars.map((snackbar) => {
        const config = getSnackbarConfig(snackbar.type);
        const Icon = config.icon;

        return (
          <div
            key={snackbar.id}
            className="flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border animate-slide-up"
            style={{
              backgroundColor: styles.bgCard,
              borderColor: `${config.color}40`,
              minWidth: '280px',
            }}
          >
            <Icon size={18} weight="fill" style={{ color: config.color }} />
            <span className="text-sm flex-1" style={{ color: styles.textPrimary }}>
              {snackbar.message}
            </span>
            {snackbar.action && (
              <button
                onClick={snackbar.action.onClick}
                className="text-xs font-medium px-2 py-1 rounded transition-colors"
                style={{ color: config.color }}
              >
                {snackbar.action.label}
              </button>
            )}
            <button
              onClick={() => onDismiss(snackbar.id)}
              className="p-1 rounded transition-colors hover:bg-black/10"
              style={{ color: styles.textMuted }}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default DashboardTab;
