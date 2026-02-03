import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Heartbeat,
  Warning,
  TrendUp,
  TrendDown,
  Package,
  Users,
  Clock,
  ShieldCheck,
  ChartLine,
  ArrowRight,
  CaretRight,
  Lightning,
  Eye,
  Cube,
  CurrencyDollar,
  CalendarBlank,
  WarningCircle,
  CheckCircle,
  Info,
  ArrowClockwise,
  Target,
  ShoppingCart,
  Percent,
  Bank,
  Buildings,
  Truck,
  Timer,
  Gauge,
  Graph,
  FileText,
} from 'phosphor-react';
import { Container, PageHeader } from '../../components';
import { usePortal } from '../../context/PortalContext';
import { useAuth } from '../../../../auth-adapter';

// =============================================================================
// Types - Business Health Metrics
// =============================================================================

interface FulfillmentRisk {
  ordersAtRisk: number;
  ordersCritical: number;
  ordersDelayed: number;
  avgFulfillmentTime: number; // hours
  slaCompliance: number; // percentage
  predictedLateShipments: number;
  riskTrend: 'improving' | 'stable' | 'worsening';
}

interface InventoryExposure {
  totalInventoryValue: number;
  overstockValue: number;
  overstockItems: number;
  lowTurnoverItems: number;
  deadStockValue: number;
  healthyStockPercentage: number;
  avgDaysToSell: number;
  exposureRisk: 'low' | 'moderate' | 'high';
}

interface RevenueConcentration {
  topBuyerPercentage: number;
  topBuyerName: string;
  top5BuyersPercentage: number;
  singleProductPercentage: number;
  topProductName: string;
  diversificationScore: number; // 0-100
  monthlyRecurringRevenue: number;
  revenueAtRisk: number;
}

interface BuyerBehavior {
  activeQuotes: number;
  quotesToOrderRate: number;
  repeatBuyerRate: number;
  avgOrderValue: number;
  buyerChurnRisk: number;
  newBuyersThisMonth: number;
  returningBuyersThisMonth: number;
  avgTimeToReorder: number; // days
}

interface BusinessHealthSummary {
  overallScore: number; // 0-100
  scoreLabel: 'Excellent' | 'Good' | 'Needs Attention' | 'Critical';
  keyInsights: HealthInsight[];
  lastUpdated: string;
}

interface HealthInsight {
  id: string;
  type: 'warning' | 'opportunity' | 'positive';
  title: string;
  description: string;
  metric?: string;
  action?: string;
  actionPath?: string;
  priority: 'high' | 'medium' | 'low';
}

interface SellerDashboardProps {
  onNavigate: (page: string) => void;
}

// =============================================================================
// Mock Data Generator
// =============================================================================

const generateMockData = () => {
  const fulfillmentRisk: FulfillmentRisk = {
    ordersAtRisk: 3,
    ordersCritical: 1,
    ordersDelayed: 2,
    avgFulfillmentTime: 18.5,
    slaCompliance: 94.2,
    predictedLateShipments: 2,
    riskTrend: 'stable',
  };

  const inventoryExposure: InventoryExposure = {
    totalInventoryValue: 487500,
    overstockValue: 42300,
    overstockItems: 8,
    lowTurnoverItems: 12,
    deadStockValue: 15600,
    healthyStockPercentage: 78,
    avgDaysToSell: 23,
    exposureRisk: 'moderate',
  };

  const revenueConcentration: RevenueConcentration = {
    topBuyerPercentage: 28,
    topBuyerName: 'Ahmed Industrial Co.',
    top5BuyersPercentage: 62,
    singleProductPercentage: 18,
    topProductName: 'Hydraulic Pump HP-5000',
    diversificationScore: 68,
    monthlyRecurringRevenue: 45200,
    revenueAtRisk: 32400,
  };

  const buyerBehavior: BuyerBehavior = {
    activeQuotes: 18,
    quotesToOrderRate: 42.5,
    repeatBuyerRate: 67,
    avgOrderValue: 3450,
    buyerChurnRisk: 12,
    newBuyersThisMonth: 8,
    returningBuyersThisMonth: 24,
    avgTimeToReorder: 45,
  };

  const insights: HealthInsight[] = [
    {
      id: '1',
      type: 'warning',
      title: '3 orders at fulfillment risk',
      description: 'These orders may miss their delivery SLA if not shipped within 24 hours.',
      metric: '3 orders',
      action: 'Review orders',
      actionPath: 'orders?filter=at_risk',
      priority: 'high',
    },
    {
      id: '2',
      type: 'warning',
      title: 'Revenue concentration alert',
      description: '28% of your revenue comes from a single buyer. Consider diversifying.',
      metric: '28%',
      priority: 'medium',
    },
    {
      id: '3',
      type: 'opportunity',
      title: '18 active quotes awaiting response',
      description: 'Quick responses improve win rate. Average response time is 4.2 hours.',
      metric: '18 quotes',
      action: 'View RFQs',
      actionPath: 'rfqs',
      priority: 'medium',
    },
    {
      id: '4',
      type: 'positive',
      title: 'Repeat buyer rate up 12%',
      description: '67% of orders this month came from returning buyers.',
      metric: '+12%',
      priority: 'low',
    },
    {
      id: '5',
      type: 'warning',
      title: '8 items with overstock risk',
      description: 'SAR 42,300 tied up in slow-moving inventory.',
      metric: 'SAR 42.3K',
      action: 'View inventory',
      actionPath: 'inventory?filter=overstock',
      priority: 'medium',
    },
  ];

  const summary: BusinessHealthSummary = {
    overallScore: 76,
    scoreLabel: 'Good',
    keyInsights: insights,
    lastUpdated: new Date().toISOString(),
  };

  return {
    fulfillmentRisk,
    inventoryExposure,
    revenueConcentration,
    buyerBehavior,
    summary,
  };
};

// =============================================================================
// Component
// =============================================================================

export const SellerDashboard: React.FC<SellerDashboardProps> = ({ onNavigate }) => {
  const { styles, t, direction } = usePortal();
  const { getToken } = useAuth();
  const isRtl = direction === 'rtl';

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReturnType<typeof generateMockData> | null>(null);

  // Fetch dashboard data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // In production, fetch from API
      // const token = await getToken();
      // const response = await dashboardService.getBusinessHealth(token);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      setData(generateMockData());
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: styles.bgPrimary }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: styles.border, borderTopColor: 'transparent' }} />
          <p style={{ color: styles.textMuted }}>Loading business health...</p>
        </div>
      </div>
    );
  }

  const { fulfillmentRisk, inventoryExposure, revenueConcentration, buyerBehavior, summary } = data;

  return (
    <div className="min-h-screen transition-colors" style={{ backgroundColor: styles.bgPrimary }}>
      <Container variant="full">
        <PageHeader
          title={t('seller.dashboard.title') || 'Business Health'}
          subtitle={t('seller.dashboard.subtitle') || 'Executive overview of your business performance'}
          actions={
            <div className="flex items-center gap-3">
              <span className="text-xs" style={{ color: styles.textMuted }}>
                Last updated: {new Date(summary.lastUpdated).toLocaleTimeString()}
              </span>
              <button
                onClick={fetchData}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{ backgroundColor: styles.bgSecondary, color: styles.textSecondary }}
              >
                <ArrowClockwise size={14} />
                Refresh
              </button>
            </div>
          }
        />

        {/* Health Score Banner */}
        <HealthScoreBanner summary={summary} styles={styles} />

        {/* Key Insights */}
        <InsightsPanel insights={summary.keyInsights} styles={styles} onNavigate={onNavigate} isRtl={isRtl} />

        {/* Main Metrics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Fulfillment Risk */}
          <FulfillmentRiskCard risk={fulfillmentRisk} styles={styles} onNavigate={onNavigate} t={t} />

          {/* Inventory Exposure */}
          <InventoryExposureCard exposure={inventoryExposure} styles={styles} onNavigate={onNavigate} t={t} />

          {/* Revenue Concentration */}
          <RevenueConcentrationCard concentration={revenueConcentration} styles={styles} t={t} />

          {/* Buyer Behavior */}
          <BuyerBehaviorCard behavior={buyerBehavior} styles={styles} onNavigate={onNavigate} t={t} />
        </div>
      </Container>
    </div>
  );
};

// =============================================================================
// Health Score Banner
// =============================================================================

interface HealthScoreBannerProps {
  summary: BusinessHealthSummary;
  styles: any;
}

const HealthScoreBanner: React.FC<HealthScoreBannerProps> = ({ summary, styles }) => {
  const getScoreColor = (score: number) => {
    if (score >= 85) return styles.success;
    if (score >= 70) return '#3b82f6';
    if (score >= 50) return '#f59e0b';
    return styles.error;
  };

  const scoreColor = getScoreColor(summary.overallScore);

  return (
    <div
      className="rounded-xl p-6 mb-6"
      style={{
        backgroundColor: styles.bgCard,
        border: `1px solid ${styles.border}`,
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Score Circle */}
          <div className="relative">
            <svg className="w-24 h-24 transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                fill="none"
                stroke={styles.bgSecondary}
                strokeWidth="8"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                fill="none"
                stroke={scoreColor}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${(summary.overallScore / 100) * 251.2} 251.2`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold" style={{ color: scoreColor }}>
                {summary.overallScore}
              </span>
              <span className="text-xs" style={{ color: styles.textMuted }}>/ 100</span>
            </div>
          </div>

          {/* Score Info */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Heartbeat size={20} weight="fill" style={{ color: scoreColor }} />
              <h3 className="text-lg font-semibold" style={{ color: styles.textPrimary }}>
                Business Health: {summary.scoreLabel}
              </h3>
            </div>
            <p className="text-sm" style={{ color: styles.textMuted }}>
              Based on fulfillment, inventory, revenue, and buyer metrics
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-8">
          <QuickStat
            icon={Warning}
            label="Warnings"
            value={summary.keyInsights.filter(i => i.type === 'warning').length}
            color="#f59e0b"
            styles={styles}
          />
          <QuickStat
            icon={Lightning}
            label="Opportunities"
            value={summary.keyInsights.filter(i => i.type === 'opportunity').length}
            color="#3b82f6"
            styles={styles}
          />
          <QuickStat
            icon={CheckCircle}
            label="Positives"
            value={summary.keyInsights.filter(i => i.type === 'positive').length}
            color={styles.success}
            styles={styles}
          />
        </div>
      </div>
    </div>
  );
};

const QuickStat: React.FC<{
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
  styles: any;
}> = ({ icon: Icon, label, value, color, styles }) => (
  <div className="text-center">
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-1"
      style={{ backgroundColor: `${color}15` }}
    >
      <Icon size={20} weight="fill" style={{ color }} />
    </div>
    <div className="text-xl font-bold" style={{ color: styles.textPrimary }}>{value}</div>
    <div className="text-xs" style={{ color: styles.textMuted }}>{label}</div>
  </div>
);

// =============================================================================
// Insights Panel
// =============================================================================

interface InsightsPanelProps {
  insights: HealthInsight[];
  styles: any;
  onNavigate: (page: string) => void;
  isRtl: boolean;
}

const InsightsPanel: React.FC<InsightsPanelProps> = ({ insights, styles, onNavigate, isRtl }) => {
  const highPriorityInsights = insights.filter(i => i.priority === 'high' || i.type === 'warning');

  if (highPriorityInsights.length === 0) return null;

  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: styles.textSecondary }}>
        <WarningCircle size={16} />
        Needs Attention
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {highPriorityInsights.slice(0, 3).map((insight) => (
          <InsightCard
            key={insight.id}
            insight={insight}
            styles={styles}
            onNavigate={onNavigate}
            isRtl={isRtl}
          />
        ))}
      </div>
    </div>
  );
};

const InsightCard: React.FC<{
  insight: HealthInsight;
  styles: any;
  onNavigate: (page: string) => void;
  isRtl: boolean;
}> = ({ insight, styles, onNavigate, isRtl }) => {
  const config = {
    warning: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: Warning },
    opportunity: { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: Lightning },
    positive: { color: styles.success, bg: 'rgba(34,197,94,0.1)', icon: TrendUp },
  };

  const { color, bg, icon: Icon } = config[insight.type];

  return (
    <div
      className="rounded-xl p-4"
      style={{ backgroundColor: bg, border: `1px solid ${color}30` }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon size={18} weight="bold" style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold mb-1" style={{ color: styles.textPrimary }}>
            {insight.title}
          </h4>
          <p className="text-xs leading-relaxed" style={{ color: styles.textSecondary }}>
            {insight.description}
          </p>
          {insight.action && insight.actionPath && (
            <button
              onClick={() => onNavigate(insight.actionPath!)}
              className="flex items-center gap-1 mt-2 text-xs font-medium transition-colors"
              style={{ color }}
            >
              {insight.action}
              <CaretRight size={12} style={{ transform: isRtl ? 'rotate(180deg)' : 'none' }} />
            </button>
          )}
        </div>
        {insight.metric && (
          <div className="text-right flex-shrink-0">
            <span className="text-lg font-bold" style={{ color }}>{insight.metric}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// Fulfillment Risk Card
// =============================================================================

interface FulfillmentRiskCardProps {
  risk: FulfillmentRisk;
  styles: any;
  onNavigate: (page: string) => void;
  t: (key: string) => string;
}

const FulfillmentRiskCard: React.FC<FulfillmentRiskCardProps> = ({ risk, styles, onNavigate, t }) => {
  const getTrendIcon = () => {
    if (risk.riskTrend === 'improving') return { icon: TrendDown, color: styles.success, label: 'Improving' };
    if (risk.riskTrend === 'worsening') return { icon: TrendUp, color: styles.error, label: 'Worsening' };
    return { icon: Graph, color: styles.textMuted, label: 'Stable' };
  };

  const trend = getTrendIcon();
  const TrendIcon = trend.icon;

  return (
    <MetricCard
      icon={Truck}
      title="Order Fulfillment Risk"
      subtitle="Active orders requiring attention"
      styles={styles}
      headerAction={
        <button
          onClick={() => onNavigate('orders')}
          className="text-xs font-medium flex items-center gap-1"
          style={{ color: styles.info }}
        >
          View all <ArrowRight size={12} />
        </button>
      }
    >
      {/* Risk Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <RiskMetric
          value={risk.ordersCritical}
          label="Critical"
          color={styles.error}
          styles={styles}
        />
        <RiskMetric
          value={risk.ordersAtRisk}
          label="At Risk"
          color="#f59e0b"
          styles={styles}
        />
        <RiskMetric
          value={risk.ordersDelayed}
          label="Delayed"
          color="#f59e0b"
          styles={styles}
        />
      </div>

      {/* Performance Metrics */}
      <div className="space-y-4">
        <MetricRow
          icon={Clock}
          label="Avg. Fulfillment Time"
          value={`${risk.avgFulfillmentTime}h`}
          subvalue="Target: 24h"
          status={risk.avgFulfillmentTime <= 24 ? 'good' : 'warning'}
          styles={styles}
        />
        <MetricRow
          icon={ShieldCheck}
          label="SLA Compliance"
          value={`${risk.slaCompliance}%`}
          status={risk.slaCompliance >= 95 ? 'good' : risk.slaCompliance >= 90 ? 'warning' : 'error'}
          styles={styles}
        />
        <MetricRow
          icon={Warning}
          label="Predicted Late Shipments"
          value={risk.predictedLateShipments.toString()}
          subvalue="Next 48 hours"
          status={risk.predictedLateShipments === 0 ? 'good' : 'warning'}
          styles={styles}
        />
      </div>

      {/* Trend */}
      <div
        className="mt-4 pt-4 flex items-center justify-between"
        style={{ borderTop: `1px solid ${styles.border}` }}
      >
        <span className="text-xs" style={{ color: styles.textMuted }}>Risk Trend</span>
        <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: trend.color }}>
          <TrendIcon size={14} />
          {trend.label}
        </span>
      </div>
    </MetricCard>
  );
};

// =============================================================================
// Inventory Exposure Card
// =============================================================================

interface InventoryExposureCardProps {
  exposure: InventoryExposure;
  styles: any;
  onNavigate: (page: string) => void;
  t: (key: string) => string;
}

const InventoryExposureCard: React.FC<InventoryExposureCardProps> = ({ exposure, styles, onNavigate, t }) => {
  const getRiskColor = () => {
    if (exposure.exposureRisk === 'low') return styles.success;
    if (exposure.exposureRisk === 'moderate') return '#f59e0b';
    return styles.error;
  };

  return (
    <MetricCard
      icon={Cube}
      title="Inventory Exposure"
      subtitle="Capital tied up in stock"
      styles={styles}
      headerAction={
        <button
          onClick={() => onNavigate('inventory')}
          className="text-xs font-medium flex items-center gap-1"
          style={{ color: styles.info }}
        >
          View inventory <ArrowRight size={12} />
        </button>
      }
    >
      {/* Total Value */}
      <div className="mb-6">
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-2xl font-bold" style={{ color: styles.textPrimary }}>
            SAR {(exposure.totalInventoryValue / 1000).toFixed(1)}K
          </span>
          <span className="text-sm" style={{ color: styles.textMuted }}>total inventory value</span>
        </div>
        {/* Health Bar */}
        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: styles.bgSecondary }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${exposure.healthyStockPercentage}%`,
              backgroundColor: styles.success,
            }}
          />
        </div>
        <div className="flex justify-between mt-1 text-xs" style={{ color: styles.textMuted }}>
          <span>{exposure.healthyStockPercentage}% healthy stock</span>
          <span>{100 - exposure.healthyStockPercentage}% at risk</span>
        </div>
      </div>

      {/* Risk Breakdown */}
      <div className="space-y-4">
        <MetricRow
          icon={Warning}
          label="Overstock Value"
          value={`SAR ${(exposure.overstockValue / 1000).toFixed(1)}K`}
          subvalue={`${exposure.overstockItems} items`}
          status="warning"
          styles={styles}
        />
        <MetricRow
          icon={Clock}
          label="Low Turnover Items"
          value={exposure.lowTurnoverItems.toString()}
          subvalue="> 60 days to sell"
          status={exposure.lowTurnoverItems > 10 ? 'warning' : 'good'}
          styles={styles}
        />
        <MetricRow
          icon={WarningCircle}
          label="Dead Stock"
          value={`SAR ${(exposure.deadStockValue / 1000).toFixed(1)}K`}
          subvalue="No sales in 90 days"
          status={exposure.deadStockValue > 10000 ? 'error' : 'warning'}
          styles={styles}
        />
      </div>

      {/* Exposure Risk */}
      <div
        className="mt-4 pt-4 flex items-center justify-between"
        style={{ borderTop: `1px solid ${styles.border}` }}
      >
        <span className="text-xs" style={{ color: styles.textMuted }}>Exposure Risk Level</span>
        <span
          className="px-2 py-0.5 rounded text-xs font-medium capitalize"
          style={{ backgroundColor: `${getRiskColor()}15`, color: getRiskColor() }}
        >
          {exposure.exposureRisk}
        </span>
      </div>
    </MetricCard>
  );
};

// =============================================================================
// Revenue Concentration Card
// =============================================================================

interface RevenueConcentrationCardProps {
  concentration: RevenueConcentration;
  styles: any;
  t: (key: string) => string;
}

const RevenueConcentrationCard: React.FC<RevenueConcentrationCardProps> = ({ concentration, styles, t }) => {
  const getDiversificationColor = (score: number) => {
    if (score >= 80) return styles.success;
    if (score >= 60) return '#f59e0b';
    return styles.error;
  };

  return (
    <MetricCard
      icon={CurrencyDollar}
      title="Revenue Concentration"
      subtitle="Dependency risk analysis"
      styles={styles}
    >
      {/* Diversification Score */}
      <div className="flex items-center gap-4 mb-6">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${getDiversificationColor(concentration.diversificationScore)}15` }}
        >
          <span
            className="text-xl font-bold"
            style={{ color: getDiversificationColor(concentration.diversificationScore) }}
          >
            {concentration.diversificationScore}
          </span>
        </div>
        <div>
          <div className="text-sm font-medium" style={{ color: styles.textPrimary }}>
            Diversification Score
          </div>
          <div className="text-xs" style={{ color: styles.textMuted }}>
            {concentration.diversificationScore >= 80
              ? 'Well diversified revenue base'
              : concentration.diversificationScore >= 60
              ? 'Moderate concentration risk'
              : 'High dependency on few sources'}
          </div>
        </div>
      </div>

      {/* Concentration Metrics */}
      <div className="space-y-4">
        <MetricRow
          icon={Buildings}
          label="Top Buyer Concentration"
          value={`${concentration.topBuyerPercentage}%`}
          subvalue={concentration.topBuyerName}
          status={concentration.topBuyerPercentage > 25 ? 'warning' : 'good'}
          styles={styles}
        />
        <MetricRow
          icon={Users}
          label="Top 5 Buyers"
          value={`${concentration.top5BuyersPercentage}%`}
          subvalue="of total revenue"
          status={concentration.top5BuyersPercentage > 60 ? 'warning' : 'good'}
          styles={styles}
        />
        <MetricRow
          icon={Package}
          label="Top Product"
          value={`${concentration.singleProductPercentage}%`}
          subvalue={concentration.topProductName}
          status={concentration.singleProductPercentage > 30 ? 'warning' : 'good'}
          styles={styles}
        />
      </div>

      {/* Revenue at Risk */}
      <div
        className="mt-4 pt-4"
        style={{ borderTop: `1px solid ${styles.border}` }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Warning size={14} style={{ color: '#f59e0b' }} />
            <span className="text-xs" style={{ color: styles.textMuted }}>Revenue at Risk</span>
          </div>
          <span className="text-sm font-semibold" style={{ color: '#f59e0b' }}>
            SAR {(concentration.revenueAtRisk / 1000).toFixed(1)}K
          </span>
        </div>
        <p className="text-xs mt-1" style={{ color: styles.textMuted }}>
          If top buyer churns or reduces orders
        </p>
      </div>
    </MetricCard>
  );
};

// =============================================================================
// Buyer Behavior Card
// =============================================================================

interface BuyerBehaviorCardProps {
  behavior: BuyerBehavior;
  styles: any;
  onNavigate: (page: string) => void;
  t: (key: string) => string;
}

const BuyerBehaviorCard: React.FC<BuyerBehaviorCardProps> = ({ behavior, styles, onNavigate, t }) => {
  return (
    <MetricCard
      icon={Users}
      title="Buyer Behavior Signals"
      subtitle="Customer engagement & retention"
      styles={styles}
      headerAction={
        <button
          onClick={() => onNavigate('rfqs')}
          className="text-xs font-medium flex items-center gap-1"
          style={{ color: styles.info }}
        >
          View RFQs <ArrowRight size={12} />
        </button>
      }
    >
      {/* Key Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <BuyerStatBox
          value={behavior.activeQuotes}
          label="Active Quotes"
          icon={FileText}
          color={styles.info}
          styles={styles}
        />
        <BuyerStatBox
          value={`${behavior.quotesToOrderRate}%`}
          label="Quote-to-Order"
          icon={Target}
          color={styles.success}
          styles={styles}
        />
        <BuyerStatBox
          value={`${behavior.repeatBuyerRate}%`}
          label="Repeat Buyers"
          icon={ArrowClockwise}
          color="#8b5cf6"
          styles={styles}
        />
        <BuyerStatBox
          value={`SAR ${(behavior.avgOrderValue / 1000).toFixed(1)}K`}
          label="Avg Order Value"
          icon={ShoppingCart}
          color="#ec4899"
          styles={styles}
        />
      </div>

      {/* Additional Metrics */}
      <div className="space-y-4">
        <MetricRow
          icon={Users}
          label="New Buyers This Month"
          value={behavior.newBuyersThisMonth.toString()}
          status="good"
          styles={styles}
        />
        <MetricRow
          icon={ArrowClockwise}
          label="Returning Buyers"
          value={behavior.returningBuyersThisMonth.toString()}
          styles={styles}
        />
        <MetricRow
          icon={Warning}
          label="Churn Risk"
          value={`${behavior.buyerChurnRisk}%`}
          subvalue="buyers inactive > 60 days"
          status={behavior.buyerChurnRisk > 15 ? 'warning' : 'good'}
          styles={styles}
        />
      </div>

      {/* Avg Time to Reorder */}
      <div
        className="mt-4 pt-4 flex items-center justify-between"
        style={{ borderTop: `1px solid ${styles.border}` }}
      >
        <span className="text-xs" style={{ color: styles.textMuted }}>Avg. Time to Reorder</span>
        <span className="text-sm font-medium" style={{ color: styles.textPrimary }}>
          {behavior.avgTimeToReorder} days
        </span>
      </div>
    </MetricCard>
  );
};

const BuyerStatBox: React.FC<{
  value: string | number;
  label: string;
  icon: React.ElementType;
  color: string;
  styles: any;
}> = ({ value, label, icon: Icon, color, styles }) => (
  <div
    className="p-3 rounded-lg"
    style={{ backgroundColor: `${color}10` }}
  >
    <div className="flex items-center gap-2 mb-1">
      <Icon size={14} style={{ color }} />
      <span className="text-xs" style={{ color: styles.textMuted }}>{label}</span>
    </div>
    <span className="text-lg font-bold" style={{ color: styles.textPrimary }}>{value}</span>
  </div>
);

// =============================================================================
// Shared Components
// =============================================================================

interface MetricCardProps {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  styles: any;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({ icon: Icon, title, subtitle, styles, headerAction, children }) => (
  <div
    className="rounded-xl p-6"
    style={{ backgroundColor: styles.bgCard, border: `1px solid ${styles.border}` }}
  >
    <div className="flex items-start justify-between mb-6">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: styles.bgSecondary }}
        >
          <Icon size={20} style={{ color: styles.info }} />
        </div>
        <div>
          <h3 className="font-semibold" style={{ color: styles.textPrimary }}>{title}</h3>
          <p className="text-xs" style={{ color: styles.textMuted }}>{subtitle}</p>
        </div>
      </div>
      {headerAction}
    </div>
    {children}
  </div>
);

interface MetricRowProps {
  icon: React.ElementType;
  label: string;
  value: string;
  subvalue?: string;
  status?: 'good' | 'warning' | 'error';
  styles: any;
}

const MetricRow: React.FC<MetricRowProps> = ({ icon: Icon, label, value, subvalue, status, styles }) => {
  const getStatusColor = () => {
    if (status === 'good') return styles.success;
    if (status === 'warning') return '#f59e0b';
    if (status === 'error') return styles.error;
    return styles.textPrimary;
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon size={14} style={{ color: styles.textMuted }} />
        <span className="text-sm" style={{ color: styles.textSecondary }}>{label}</span>
      </div>
      <div className="text-right">
        <span className="text-sm font-semibold" style={{ color: getStatusColor() }}>{value}</span>
        {subvalue && (
          <span className="text-xs ml-1" style={{ color: styles.textMuted }}>{subvalue}</span>
        )}
      </div>
    </div>
  );
};

interface RiskMetricProps {
  value: number;
  label: string;
  color: string;
  styles: any;
}

const RiskMetric: React.FC<RiskMetricProps> = ({ value, label, color, styles }) => (
  <div className="text-center">
    <div
      className="text-2xl font-bold mb-1"
      style={{ color: value > 0 ? color : styles.success }}
    >
      {value}
    </div>
    <div className="text-xs" style={{ color: styles.textMuted }}>{label}</div>
  </div>
);

export default SellerDashboard;
