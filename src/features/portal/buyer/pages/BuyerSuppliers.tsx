import React, { useState, useEffect, useMemo } from 'react'
import {
  Buildings,
  MagnifyingGlass,
  Funnel,
  CaretDown,
  CaretUp,
  TrendUp,
  TrendDown,
  Clock,
  Package,
  ChatCircle,
  Warning,
  CheckCircle,
  Info,
  Users,
  CurrencyDollar,
  Calendar,
  MapPin,
  Envelope,
  Phone,
  ArrowSquareOut,
  ChartBar,
  Percent,
  Timer,
  ShieldCheck,
  ShieldWarning,
  X,
} from 'phosphor-react'
import { usePortal } from '../../context/PortalContext'
import { Container } from '../../components/Container'
import type {
  Supplier,
  SupplierFilters,
  SupplierSortField,
  SupplierSortConfig,
  SupplierTier,
  SupplierStatus,
  RiskLevel,
} from '../../types/supplier.types'
import {
  getSupplierTierConfig,
  getSupplierStatusConfig,
  getRiskLevelConfig,
  formatDeliveryDeviation,
  formatResponseTime,
  getScoreRating,
  RELIABILITY_WEIGHTS,
  calculateDeliveryScore,
} from '../../types/supplier.types'
import { generateMockSuppliers, generateMockSummary } from '../../services/supplierService'

interface BuyerSuppliersProps {
  onNavigate: (page: string, data?: Record<string, unknown>) => void
}

// ============================================================================
// Hover Tooltip Component
// ============================================================================

interface TooltipProps {
  children: React.ReactNode
  content: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
}

const Tooltip: React.FC<TooltipProps> = ({ children, content, position = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false)
  const { styles } = usePortal()

  const positionStyles: Record<string, React.CSSProperties> = {
    top: { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '8px' },
    bottom: { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '8px' },
    left: { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: '8px' },
    right: { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: '8px' },
  }

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className="absolute z-50 px-3 py-2 text-xs rounded-lg shadow-lg whitespace-nowrap"
          style={{
            backgroundColor: styles.bgSecondary,
            color: styles.textPrimary,
            border: `1px solid ${styles.border}`,
            ...positionStyles[position],
          }}
        >
          {content}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Score Breakdown Tooltip
// ============================================================================

interface ScoreBreakdownProps {
  supplier: Supplier
}

const ScoreBreakdown: React.FC<ScoreBreakdownProps> = ({ supplier }) => {
  const { styles } = usePortal()
  const { metrics } = supplier

  const deliveryScore = calculateDeliveryScore(metrics)
  const qualityScore = metrics.qualityScore
  const communicationScore = metrics.communicationScore
  const fulfillmentScore = Math.round(metrics.completeOrderRate * 100)

  const breakdown = [
    { label: 'Delivery', score: deliveryScore, weight: RELIABILITY_WEIGHTS.delivery },
    { label: 'Quality', score: qualityScore, weight: RELIABILITY_WEIGHTS.quality },
    { label: 'Communication', score: communicationScore, weight: RELIABILITY_WEIGHTS.communication },
    { label: 'Fulfillment', score: fulfillmentScore, weight: RELIABILITY_WEIGHTS.fulfillment },
  ]

  return (
    <div className="min-w-[200px]">
      <div className="text-xs font-medium mb-2" style={{ color: styles.textSecondary }}>
        Score Breakdown
      </div>
      {breakdown.map(item => (
        <div key={item.label} className="flex items-center justify-between py-1">
          <span className="text-xs" style={{ color: styles.textSecondary }}>
            {item.label} ({Math.round(item.weight * 100)}%)
          </span>
          <span className="text-xs font-medium" style={{ color: styles.textPrimary }}>
            {item.score}
          </span>
        </div>
      ))}
      <div
        className="flex items-center justify-between pt-2 mt-2"
        style={{ borderTop: `1px solid ${styles.border}` }}
      >
        <span className="text-xs font-medium" style={{ color: styles.textPrimary }}>
          Weighted Total
        </span>
        <span className="text-xs font-semibold" style={{ color: styles.textPrimary }}>
          {supplier.reliabilityScore}
        </span>
      </div>
    </div>
  )
}

// ============================================================================
// Metric Card Component
// ============================================================================

interface MetricCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  subtitle?: string
  trend?: 'up' | 'down' | 'neutral'
  tooltipContent?: React.ReactNode
}

const MetricCard: React.FC<MetricCardProps> = ({
  icon,
  label,
  value,
  subtitle,
  trend,
  tooltipContent,
}) => {
  const { styles } = usePortal()

  const card = (
    <div
      className="flex items-start gap-3 p-4 rounded-lg transition-colors"
      style={{
        backgroundColor: styles.bgSecondary,
        border: `1px solid ${styles.border}`,
      }}
    >
      <div
        className="p-2 rounded-md"
        style={{ backgroundColor: styles.bgSecondary }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs mb-1" style={{ color: styles.textSecondary }}>
          {label}
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-xl font-semibold"
            style={{ color: styles.textPrimary }}
          >
            {value}
          </span>
          {trend && trend !== 'neutral' && (
            <span
              className="flex items-center text-xs"
              style={{
                color: trend === 'up' ? styles.success : styles.error,
              }}
            >
              {trend === 'up' ? (
                <TrendUp size={12} />
              ) : (
                <TrendDown size={12} />
              )}
            </span>
          )}
        </div>
        {subtitle && (
          <div className="text-xs mt-1" style={{ color: styles.textMuted }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  )

  if (tooltipContent) {
    return (
      <Tooltip content={tooltipContent} position="bottom">
        {card}
      </Tooltip>
    )
  }

  return card
}

// ============================================================================
// Summary Cards Section
// ============================================================================

interface SummaryCardsProps {
  suppliers: Supplier[]
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ suppliers }) => {
  const { styles, t } = usePortal()
  const summary = useMemo(() => generateMockSummary(suppliers), [suppliers])

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <MetricCard
        icon={<Users size={16} style={{ color: styles.textSecondary }} />}
        label="Total Suppliers"
        value={summary.totalSuppliers}
        subtitle={`${summary.activeSuppliers} active`}
        tooltipContent={
          <div className="text-xs">
            <div>Active: {summary.activeSuppliers}</div>
            <div>Inactive: {summary.totalSuppliers - summary.activeSuppliers}</div>
          </div>
        }
      />
      <MetricCard
        icon={<ShieldCheck size={16} style={{ color: styles.textSecondary }} />}
        label="Avg. Reliability"
        value={summary.averageReliabilityScore}
        subtitle={getScoreRating(summary.averageReliabilityScore).label}
        trend={summary.averageReliabilityScore >= 70 ? 'up' : 'down'}
        tooltipContent={
          <div className="text-xs">
            Weighted average of all supplier<br />reliability scores
          </div>
        }
      />
      <MetricCard
        icon={<Warning size={16} style={{ color: styles.textSecondary }} />}
        label="Risk Alerts"
        value={summary.highRiskCount + summary.criticalRiskCount}
        subtitle={`${summary.criticalRiskCount} critical`}
        trend={summary.criticalRiskCount > 0 ? 'down' : 'neutral'}
        tooltipContent={
          <div className="text-xs">
            <div>High Risk: {summary.highRiskCount}</div>
            <div>Critical Risk: {summary.criticalRiskCount}</div>
          </div>
        }
      />
      <MetricCard
        icon={<ChartBar size={16} style={{ color: styles.textSecondary }} />}
        label="Top Category"
        value={summary.topCategories[0]?.category || 'N/A'}
        subtitle={`${summary.topCategories[0]?.count || 0} suppliers`}
        tooltipContent={
          <div className="text-xs">
            {summary.topCategories.slice(0, 3).map(cat => (
              <div key={cat.category}>{cat.category}: {cat.count}</div>
            ))}
          </div>
        }
      />
    </div>
  )
}

// ============================================================================
// Supplier Card Component (for card view)
// ============================================================================

interface SupplierCardProps {
  supplier: Supplier
  onSelect: (supplier: Supplier) => void
  isSelected: boolean
}

const SupplierCard: React.FC<SupplierCardProps> = ({ supplier, onSelect, isSelected }) => {
  const { styles } = usePortal()
  const tierConfig = getSupplierTierConfig(supplier.tier)
  const statusConfig = getSupplierStatusConfig(supplier.status)
  const riskConfig = getRiskLevelConfig(supplier.riskLevel)
  const deliveryDeviation = formatDeliveryDeviation(supplier.metrics.averageDeliveryDeviation)
  const responseTime = formatResponseTime(supplier.metrics.averageResponseTimeHours)
  const scoreRating = getScoreRating(supplier.reliabilityScore)

  return (
    <div
      className="rounded-lg p-4 transition-all cursor-pointer"
      style={{
        backgroundColor: styles.bgSecondary,
        border: `1px solid ${isSelected ? styles.textSecondary : styles.border}`,
      }}
      onClick={() => onSelect(supplier)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: styles.bgSecondary }}
          >
            <Buildings size={20} style={{ color: styles.textSecondary }} />
          </div>
          <div>
            <div className="font-medium" style={{ color: styles.textPrimary }}>
              {supplier.name}
            </div>
            <div className="text-xs" style={{ color: styles.textSecondary }}>
              {supplier.code} · {supplier.country}
            </div>
          </div>
        </div>
        <Tooltip
          content={
            <div className="text-xs">
              <div>{riskConfig.label}</div>
              <div className="mt-1 text-[10px]" style={{ color: styles.textMuted }}>
                Based on dependency ({supplier.metrics.dependencyPercentage.toFixed(1)}%)
                and reliability ({supplier.reliabilityScore})
              </div>
            </div>
          }
          position="left"
        >
          <div
            className="px-2 py-1 rounded text-xs"
            style={{
              backgroundColor:
                riskConfig.color === 'success' ? `${styles.success}15` :
                riskConfig.color === 'warning' ? `${styles.warning}15` :
                riskConfig.color === 'error' ? `${styles.error}15` :
                `${styles.info}15`,
              color:
                riskConfig.color === 'success' ? styles.success :
                riskConfig.color === 'warning' ? styles.warning :
                riskConfig.color === 'error' ? styles.error :
                styles.info,
            }}
          >
            {riskConfig.label}
          </div>
        </Tooltip>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Reliability Score */}
        <Tooltip content={<ScoreBreakdown supplier={supplier} />} position="bottom">
          <div
            className="p-2.5 rounded-md"
            style={{ backgroundColor: styles.bgSecondary }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <ShieldCheck size={14} style={{ color: styles.textMuted }} />
              <span className="text-[10px]" style={{ color: styles.textMuted }}>
                Reliability
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-semibold" style={{ color: styles.textPrimary }}>
                {supplier.reliabilityScore}
              </span>
              <span className="text-[10px]" style={{ color: styles.textSecondary }}>
                {scoreRating.label}
              </span>
            </div>
          </div>
        </Tooltip>

        {/* Dependency */}
        <Tooltip
          content={
            <div className="text-xs">
              <div>Dependency Percentage</div>
              <div className="mt-1 text-[10px]" style={{ color: styles.textMuted }}>
                {supplier.metrics.dependencyPercentage.toFixed(1)}% of your category<br />
                spend goes to this supplier
              </div>
              <div className="mt-1 text-[10px]" style={{ color: styles.textMuted }}>
                {supplier.metrics.dependencyPercentage > 60 ? '⚠️ High concentration risk' :
                 supplier.metrics.dependencyPercentage > 30 ? '⚡ Moderate dependency' :
                 '✓ Diversified'}
              </div>
            </div>
          }
          position="bottom"
        >
          <div
            className="p-2.5 rounded-md"
            style={{ backgroundColor: styles.bgSecondary }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Percent size={14} style={{ color: styles.textMuted }} />
              <span className="text-[10px]" style={{ color: styles.textMuted }}>
                Dependency
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-semibold" style={{ color: styles.textPrimary }}>
                {supplier.metrics.dependencyPercentage.toFixed(1)}%
              </span>
            </div>
          </div>
        </Tooltip>

        {/* Delivery Deviation */}
        <Tooltip
          content={
            <div className="text-xs">
              <div>Average Delivery Deviation</div>
              <div className="mt-1 text-[10px]" style={{ color: styles.textMuted }}>
                On-time: {supplier.metrics.onTimeDeliveries} orders<br />
                Late: {supplier.metrics.lateDeliveries} orders<br />
                Early: {supplier.metrics.earlyDeliveries} orders
              </div>
              <div className="mt-1 text-[10px]" style={{ color: styles.textMuted }}>
                Total: {supplier.metrics.totalOrders} orders
              </div>
            </div>
          }
          position="bottom"
        >
          <div
            className="p-2.5 rounded-md"
            style={{ backgroundColor: styles.bgSecondary }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Timer size={14} style={{ color: styles.textMuted }} />
              <span className="text-[10px]" style={{ color: styles.textMuted }}>
                Delivery
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span
                className="text-lg font-semibold"
                style={{
                  color: deliveryDeviation.isPositive ? styles.success : styles.warning,
                }}
              >
                {deliveryDeviation.label}
              </span>
            </div>
          </div>
        </Tooltip>

        {/* Communication */}
        <Tooltip
          content={
            <div className="text-xs">
              <div>Communication Score: {supplier.metrics.communicationScore}</div>
              <div className="mt-1 text-[10px]" style={{ color: styles.textMuted }}>
                Avg. Response: {formatResponseTime(supplier.metrics.averageResponseTimeHours)}<br />
                RFQ Response Rate: {(supplier.metrics.rfqResponseRate * 100).toFixed(0)}%<br />
                Issue Resolution: {formatResponseTime(supplier.metrics.issueResolutionTimeHours)}
              </div>
            </div>
          }
          position="bottom"
        >
          <div
            className="p-2.5 rounded-md"
            style={{ backgroundColor: styles.bgSecondary }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <ChatCircle size={14} style={{ color: styles.textMuted }} />
              <span className="text-[10px]" style={{ color: styles.textMuted }}>
                Response
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-semibold" style={{ color: styles.textPrimary }}>
                {responseTime}
              </span>
              <span className="text-[10px]" style={{ color: styles.textSecondary }}>
                avg
              </span>
            </div>
          </div>
        </Tooltip>
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between pt-3"
        style={{ borderTop: `1px solid ${styles.border}` }}
      >
        <div className="flex items-center gap-2">
          <span
            className="px-2 py-0.5 rounded text-[10px]"
            style={{
              backgroundColor: styles.bgSecondary,
              color: styles.textSecondary,
            }}
          >
            {tierConfig.label}
          </span>
          <span
            className="px-2 py-0.5 rounded text-[10px]"
            style={{
              backgroundColor: statusConfig.canOrder ? `${styles.success}15` : `${styles.warning}15`,
              color: statusConfig.canOrder ? styles.success : styles.warning,
            }}
          >
            {statusConfig.label}
          </span>
        </div>
        <div className="text-[10px]" style={{ color: styles.textMuted }}>
          ${(supplier.metrics.totalSpend / 1000).toFixed(0)}K total
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Supplier Table Row Component (for table view)
// ============================================================================

interface SupplierTableRowProps {
  supplier: Supplier
  onSelect: (supplier: Supplier) => void
  isSelected: boolean
}

const SupplierTableRow: React.FC<SupplierTableRowProps> = ({ supplier, onSelect, isSelected }) => {
  const { styles } = usePortal()
  const tierConfig = getSupplierTierConfig(supplier.tier)
  const statusConfig = getSupplierStatusConfig(supplier.status)
  const riskConfig = getRiskLevelConfig(supplier.riskLevel)
  const deliveryDeviation = formatDeliveryDeviation(supplier.metrics.averageDeliveryDeviation)
  const responseTime = formatResponseTime(supplier.metrics.averageResponseTimeHours)

  return (
    <tr
      className="transition-colors cursor-pointer"
      style={{
        backgroundColor: isSelected ? styles.bgSecondary : 'transparent',
      }}
      onClick={() => onSelect(supplier)}
    >
      {/* Supplier */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: styles.bgSecondary }}
          >
            <Buildings size={16} style={{ color: styles.textSecondary }} />
          </div>
          <div>
            <div className="font-medium text-sm" style={{ color: styles.textPrimary }}>
              {supplier.name}
            </div>
            <div className="text-xs" style={{ color: styles.textMuted }}>
              {supplier.code}
            </div>
          </div>
        </div>
      </td>

      {/* Reliability Score */}
      <td className="px-4 py-3">
        <Tooltip content={<ScoreBreakdown supplier={supplier} />} position="bottom">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
              style={{
                backgroundColor:
                  supplier.reliabilityScore >= 75 ? `${styles.success}15` :
                  supplier.reliabilityScore >= 50 ? `${styles.warning}15` :
                  `${styles.error}15`,
                color:
                  supplier.reliabilityScore >= 75 ? styles.success :
                  supplier.reliabilityScore >= 50 ? styles.warning :
                  styles.error,
              }}
            >
              {supplier.reliabilityScore}
            </div>
          </div>
        </Tooltip>
      </td>

      {/* Dependency */}
      <td className="px-4 py-3">
        <Tooltip
          content={
            <div className="text-xs">
              {supplier.metrics.dependencyPercentage > 60 ? '⚠️ High concentration risk' :
               supplier.metrics.dependencyPercentage > 30 ? '⚡ Moderate dependency' :
               '✓ Well diversified'}
            </div>
          }
          position="bottom"
        >
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: styles.bgSecondary }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(supplier.metrics.dependencyPercentage, 100)}%`,
                  backgroundColor:
                    supplier.metrics.dependencyPercentage > 60 ? styles.error :
                    supplier.metrics.dependencyPercentage > 30 ? styles.warning :
                    styles.success,
                }}
              />
            </div>
            <span className="text-sm" style={{ color: styles.textPrimary }}>
              {supplier.metrics.dependencyPercentage.toFixed(1)}%
            </span>
          </div>
        </Tooltip>
      </td>

      {/* Delivery Deviation */}
      <td className="px-4 py-3">
        <Tooltip
          content={
            <div className="text-xs">
              On-time: {supplier.metrics.onTimeDeliveries}/{supplier.metrics.totalOrders} orders
            </div>
          }
          position="bottom"
        >
          <span
            className="text-sm"
            style={{
              color: deliveryDeviation.isPositive ? styles.success : styles.warning,
            }}
          >
            {deliveryDeviation.label}
          </span>
        </Tooltip>
      </td>

      {/* Communication */}
      <td className="px-4 py-3">
        <Tooltip
          content={
            <div className="text-xs">
              RFQ Response: {(supplier.metrics.rfqResponseRate * 100).toFixed(0)}%<br />
              Resolution: {formatResponseTime(supplier.metrics.issueResolutionTimeHours)}
            </div>
          }
          position="bottom"
        >
          <div className="flex items-center gap-1.5">
            <Clock size={14} style={{ color: styles.textMuted }} />
            <span className="text-sm" style={{ color: styles.textPrimary }}>
              {responseTime}
            </span>
          </div>
        </Tooltip>
      </td>

      {/* Risk */}
      <td className="px-4 py-3">
        <span
          className="px-2 py-1 rounded text-xs"
          style={{
            backgroundColor:
              riskConfig.color === 'success' ? `${styles.success}15` :
              riskConfig.color === 'warning' ? `${styles.warning}15` :
              riskConfig.color === 'error' ? `${styles.error}15` :
              `${styles.info}15`,
            color:
              riskConfig.color === 'success' ? styles.success :
              riskConfig.color === 'warning' ? styles.warning :
              riskConfig.color === 'error' ? styles.error :
              styles.info,
          }}
        >
          {riskConfig.label}
        </span>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <span
          className="px-2 py-1 rounded text-xs"
          style={{
            backgroundColor: statusConfig.canOrder ? `${styles.success}15` : styles.bgSecondary,
            color: statusConfig.canOrder ? styles.success : styles.textSecondary,
          }}
        >
          {statusConfig.label}
        </span>
      </td>
    </tr>
  )
}

// ============================================================================
// Supplier Detail Panel
// ============================================================================

interface SupplierDetailPanelProps {
  supplier: Supplier
  onClose: () => void
}

const SupplierDetailPanel: React.FC<SupplierDetailPanelProps> = ({ supplier, onClose }) => {
  const { styles } = usePortal()
  const tierConfig = getSupplierTierConfig(supplier.tier)
  const riskConfig = getRiskLevelConfig(supplier.riskLevel)
  const deliveryDeviation = formatDeliveryDeviation(supplier.metrics.averageDeliveryDeviation)

  return (
    <div
      className="h-full flex flex-col"
      style={{
        backgroundColor: styles.bgSecondary,
        borderLeft: `1px solid ${styles.border}`,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-4"
        style={{ borderBottom: `1px solid ${styles.border}` }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: styles.bgSecondary }}
          >
            <Buildings size={20} style={{ color: styles.textSecondary }} />
          </div>
          <div>
            <div className="font-medium" style={{ color: styles.textPrimary }}>
              {supplier.name}
            </div>
            <div className="text-xs" style={{ color: styles.textSecondary }}>
              {supplier.code}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md transition-colors hover:bg-opacity-80"
          style={{ backgroundColor: styles.bgSecondary }}
        >
          <X size={16} style={{ color: styles.textSecondary }} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg" style={{ backgroundColor: styles.bgSecondary }}>
            <div className="text-xs mb-1" style={{ color: styles.textMuted }}>
              Reliability Score
            </div>
            <div className="text-2xl font-semibold" style={{ color: styles.textPrimary }}>
              {supplier.reliabilityScore}
            </div>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: styles.bgSecondary }}>
            <div className="text-xs mb-1" style={{ color: styles.textMuted }}>
              Dependency
            </div>
            <div className="text-2xl font-semibold" style={{ color: styles.textPrimary }}>
              {supplier.metrics.dependencyPercentage.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Score Breakdown */}
        <div>
          <div className="text-xs font-medium mb-3" style={{ color: styles.textSecondary }}>
            Score Calculation
          </div>
          <div className="space-y-2">
            {[
              { label: 'Delivery (40%)', value: calculateDeliveryScore(supplier.metrics), icon: Package },
              { label: 'Quality (30%)', value: supplier.metrics.qualityScore, icon: CheckCircle },
              { label: 'Communication (20%)', value: supplier.metrics.communicationScore, icon: ChatCircle },
              { label: 'Fulfillment (10%)', value: Math.round(supplier.metrics.completeOrderRate * 100), icon: ShieldCheck },
            ].map(item => (
              <div
                key={item.label}
                className="flex items-center justify-between p-2 rounded-md"
                style={{ backgroundColor: styles.bgSecondary }}
              >
                <div className="flex items-center gap-2">
                  <item.icon size={14} style={{ color: styles.textMuted }} />
                  <span className="text-xs" style={{ color: styles.textSecondary }}>
                    {item.label}
                  </span>
                </div>
                <span className="text-sm font-medium" style={{ color: styles.textPrimary }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Info */}
        <div>
          <div className="text-xs font-medium mb-3" style={{ color: styles.textSecondary }}>
            Contact
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm" style={{ color: styles.textPrimary }}>
              <Users size={14} style={{ color: styles.textMuted }} />
              {supplier.contactName}
            </div>
            <div className="flex items-center gap-2 text-sm" style={{ color: styles.textPrimary }}>
              <Envelope size={14} style={{ color: styles.textMuted }} />
              {supplier.contactEmail}
            </div>
            {supplier.contactPhone && (
              <div className="flex items-center gap-2 text-sm" style={{ color: styles.textPrimary }}>
                <Phone size={14} style={{ color: styles.textMuted }} />
                {supplier.contactPhone}
              </div>
            )}
            <div className="flex items-center gap-2 text-sm" style={{ color: styles.textPrimary }}>
              <MapPin size={14} style={{ color: styles.textMuted }} />
              {supplier.city ? `${supplier.city}, ` : ''}{supplier.country}
            </div>
          </div>
        </div>

        {/* Business Info */}
        <div>
          <div className="text-xs font-medium mb-3" style={{ color: styles.textSecondary }}>
            Business Details
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span style={{ color: styles.textMuted }}>Tier</span>
              <span style={{ color: styles.textPrimary }}>{tierConfig.label}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: styles.textMuted }}>Payment Terms</span>
              <span style={{ color: styles.textPrimary }}>{supplier.paymentTerms}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: styles.textMuted }}>Lead Time</span>
              <span style={{ color: styles.textPrimary }}>{supplier.leadTimeDays} days</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: styles.textMuted }}>Min. Order</span>
              <span style={{ color: styles.textPrimary }}>
                ${supplier.minimumOrderValue?.toLocaleString() || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: styles.textMuted }}>Partner Since</span>
              <span style={{ color: styles.textPrimary }}>{supplier.partnerSince}</span>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div>
          <div className="text-xs font-medium mb-3" style={{ color: styles.textSecondary }}>
            Categories
          </div>
          <div className="flex flex-wrap gap-2">
            {supplier.categories.map(cat => (
              <span
                key={cat}
                className="px-2 py-1 rounded text-xs"
                style={{
                  backgroundColor: styles.bgSecondary,
                  color: styles.textSecondary,
                }}
              >
                {cat}
              </span>
            ))}
          </div>
        </div>

        {/* Performance Metrics */}
        <div>
          <div className="text-xs font-medium mb-3" style={{ color: styles.textSecondary }}>
            Performance Metrics
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span style={{ color: styles.textMuted }}>Total Orders</span>
              <span style={{ color: styles.textPrimary }}>{supplier.metrics.totalOrders}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: styles.textMuted }}>Delivery Deviation</span>
              <span style={{ color: deliveryDeviation.isPositive ? styles.success : styles.warning }}>
                {deliveryDeviation.label}
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: styles.textMuted }}>Quality Score</span>
              <span style={{ color: styles.textPrimary }}>{supplier.metrics.qualityScore}%</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: styles.textMuted }}>RFQ Response Rate</span>
              <span style={{ color: styles.textPrimary }}>
                {(supplier.metrics.rfqResponseRate * 100).toFixed(0)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: styles.textMuted }}>Total Spend</span>
              <span style={{ color: styles.textPrimary }}>
                ${supplier.metrics.totalSpend.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Filter Dropdown Component
// ============================================================================

interface FilterDropdownProps {
  label: string
  options: { value: string; label: string }[]
  selected: string[]
  onChange: (selected: string[]) => void
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({ label, options, selected, onChange }) => {
  const [isOpen, setIsOpen] = useState(false)
  const { styles } = usePortal()

  const toggleOption = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors"
        style={{
          backgroundColor: selected.length > 0 ? styles.bgSecondary : 'transparent',
          border: `1px solid ${styles.border}`,
          color: styles.textSecondary,
        }}
      >
        {label}
        {selected.length > 0 && (
          <span
            className="w-4 h-4 rounded-full flex items-center justify-center text-[10px]"
            style={{ backgroundColor: styles.textSecondary, color: styles.bgPrimary }}
          >
            {selected.length}
          </span>
        )}
        <CaretDown size={14} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div
            className="absolute top-full left-0 mt-1 z-50 min-w-[160px] rounded-lg shadow-lg py-1"
            style={{
              backgroundColor: styles.bgSecondary,
              border: `1px solid ${styles.border}`,
            }}
          >
            {options.map(option => (
              <button
                key={option.value}
                onClick={() => toggleOption(option.value)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors hover:bg-opacity-80"
                style={{
                  backgroundColor: selected.includes(option.value) ? styles.bgSecondary : 'transparent',
                  color: styles.textPrimary,
                }}
              >
                <div
                  className="w-4 h-4 rounded border flex items-center justify-center"
                  style={{
                    borderColor: selected.includes(option.value) ? styles.textPrimary : styles.border,
                    backgroundColor: selected.includes(option.value) ? styles.textPrimary : 'transparent',
                  }}
                >
                  {selected.includes(option.value) && (
                    <CheckCircle size={12} style={{ color: styles.bgPrimary }} />
                  )}
                </div>
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ============================================================================
// Main BuyerSuppliers Component
// ============================================================================

export const BuyerSuppliers: React.FC<BuyerSuppliersProps> = ({ onNavigate }) => {
  const { styles, t } = usePortal()

  // State
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [sortConfig, setSortConfig] = useState<SupplierSortConfig>({
    field: 'reliabilityScore',
    direction: 'desc',
  })

  // Filters
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [tierFilter, setTierFilter] = useState<string[]>([])
  const [riskFilter, setRiskFilter] = useState<string[]>([])

  // Load mock data
  useEffect(() => {
    const loadSuppliers = async () => {
      setLoading(true)
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))
      const mockData = generateMockSuppliers(15)
      setSuppliers(mockData)
      setLoading(false)
    }
    loadSuppliers()
  }, [])

  // Filter and sort suppliers
  const filteredSuppliers = useMemo(() => {
    let result = [...suppliers]

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        s =>
          s.name.toLowerCase().includes(query) ||
          s.code.toLowerCase().includes(query) ||
          s.country.toLowerCase().includes(query)
      )
    }

    // Status filter
    if (statusFilter.length > 0) {
      result = result.filter(s => statusFilter.includes(s.status))
    }

    // Tier filter
    if (tierFilter.length > 0) {
      result = result.filter(s => tierFilter.includes(s.tier))
    }

    // Risk filter
    if (riskFilter.length > 0) {
      result = result.filter(s => riskFilter.includes(s.riskLevel))
    }

    // Sort
    result.sort((a, b) => {
      let aVal: number | string = 0
      let bVal: number | string = 0

      switch (sortConfig.field) {
        case 'name':
          aVal = a.name
          bVal = b.name
          break
        case 'reliabilityScore':
          aVal = a.reliabilityScore
          bVal = b.reliabilityScore
          break
        case 'dependencyPercentage':
          aVal = a.metrics.dependencyPercentage
          bVal = b.metrics.dependencyPercentage
          break
        case 'averageDeliveryDeviation':
          aVal = Math.abs(a.metrics.averageDeliveryDeviation)
          bVal = Math.abs(b.metrics.averageDeliveryDeviation)
          break
        case 'communicationScore':
          aVal = a.metrics.communicationScore
          bVal = b.metrics.communicationScore
          break
        case 'totalSpend':
          aVal = a.metrics.totalSpend
          bVal = b.metrics.totalSpend
          break
        default:
          aVal = a.reliabilityScore
          bVal = b.reliabilityScore
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortConfig.direction === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      }

      return sortConfig.direction === 'asc'
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number)
    })

    return result
  }, [suppliers, searchQuery, statusFilter, tierFilter, riskFilter, sortConfig])

  const handleSort = (field: SupplierSortField) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc',
    }))
  }

  const SortIcon = ({ field }: { field: SupplierSortField }) => {
    if (sortConfig.field !== field) return null
    return sortConfig.direction === 'desc' ? (
      <CaretDown size={14} />
    ) : (
      <CaretUp size={14} />
    )
  }

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: styles.bgPrimary }}>
      <Container variant="full" className="flex-1 flex flex-col py-6">
        {/* Header */}
        <div className="mb-6">
          <h1
            className="text-2xl font-semibold mb-1"
            style={{ color: styles.textPrimary, fontFamily: styles.fontHeading }}
          >
            Supplier Evaluation
          </h1>
          <p className="text-sm" style={{ color: styles.textSecondary }}>
            Evaluate and compare suppliers based on reliability, dependency, and performance metrics
          </p>
        </div>

        {/* Summary Cards */}
        {!loading && <SummaryCards suppliers={suppliers} />}

        {/* Toolbar */}
        <div
          className="flex items-center justify-between gap-4 mb-4 pb-4"
          style={{ borderBottom: `1px solid ${styles.border}` }}
        >
          {/* Search */}
          <div className="flex items-center gap-3 flex-1">
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg flex-1 max-w-md"
              style={{
                backgroundColor: styles.bgSecondary,
                border: `1px solid ${styles.border}`,
              }}
            >
              <MagnifyingGlass size={16} style={{ color: styles.textMuted }} />
              <input
                type="text"
                placeholder="Search suppliers..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none flex-1 text-sm"
                style={{ color: styles.textPrimary }}
              />
            </div>

            {/* Filters */}
            <FilterDropdown
              label="Status"
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'on_hold', label: 'On Hold' },
              ]}
              selected={statusFilter}
              onChange={setStatusFilter}
            />
            <FilterDropdown
              label="Tier"
              options={[
                { value: 'strategic', label: 'Strategic' },
                { value: 'preferred', label: 'Preferred' },
                { value: 'approved', label: 'Approved' },
                { value: 'conditional', label: 'Conditional' },
              ]}
              selected={tierFilter}
              onChange={setTierFilter}
            />
            <FilterDropdown
              label="Risk"
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
                { value: 'critical', label: 'Critical' },
              ]}
              selected={riskFilter}
              onChange={setRiskFilter}
            />
          </div>

          {/* View Toggle */}
          <div
            className="flex items-center rounded-lg p-1"
            style={{ backgroundColor: styles.bgSecondary }}
          >
            <button
              onClick={() => setViewMode('cards')}
              className="px-3 py-1.5 rounded-md text-sm transition-colors"
              style={{
                backgroundColor: viewMode === 'cards' ? styles.bgSecondary : 'transparent',
                color: viewMode === 'cards' ? styles.textPrimary : styles.textSecondary,
              }}
            >
              Cards
            </button>
            <button
              onClick={() => setViewMode('table')}
              className="px-3 py-1.5 rounded-md text-sm transition-colors"
              style={{
                backgroundColor: viewMode === 'table' ? styles.bgSecondary : 'transparent',
                color: viewMode === 'table' ? styles.textPrimary : styles.textSecondary,
              }}
            >
              Table
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex gap-4 min-h-0">
          {/* Main List */}
          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div
                  className="w-8 h-8 border-2 rounded-full animate-spin"
                  style={{
                    borderColor: styles.border,
                    borderTopColor: styles.textPrimary,
                  }}
                />
              </div>
            ) : filteredSuppliers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64">
                <Buildings size={48} className="mb-3" style={{ color: styles.textMuted }} />
                <div className="text-sm" style={{ color: styles.textSecondary }}>
                  No suppliers found
                </div>
              </div>
            ) : viewMode === 'cards' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredSuppliers.map(supplier => (
                  <SupplierCard
                    key={supplier.id}
                    supplier={supplier}
                    onSelect={setSelectedSupplier}
                    isSelected={selectedSupplier?.id === supplier.id}
                  />
                ))}
              </div>
            ) : (
              <div
                className="rounded-lg overflow-hidden"
                style={{
                  backgroundColor: styles.bgSecondary,
                  border: `1px solid ${styles.border}`,
                }}
              >
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${styles.border}` }}>
                      <th
                        className="px-4 py-3 text-left text-xs font-medium cursor-pointer"
                        style={{ color: styles.textSecondary }}
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center gap-1">
                          Supplier
                          <SortIcon field="name" />
                        </div>
                      </th>
                      <th
                        className="px-4 py-3 text-left text-xs font-medium cursor-pointer"
                        style={{ color: styles.textSecondary }}
                        onClick={() => handleSort('reliabilityScore')}
                      >
                        <div className="flex items-center gap-1">
                          Reliability
                          <SortIcon field="reliabilityScore" />
                        </div>
                      </th>
                      <th
                        className="px-4 py-3 text-left text-xs font-medium cursor-pointer"
                        style={{ color: styles.textSecondary }}
                        onClick={() => handleSort('dependencyPercentage')}
                      >
                        <div className="flex items-center gap-1">
                          Dependency
                          <SortIcon field="dependencyPercentage" />
                        </div>
                      </th>
                      <th
                        className="px-4 py-3 text-left text-xs font-medium cursor-pointer"
                        style={{ color: styles.textSecondary }}
                        onClick={() => handleSort('averageDeliveryDeviation')}
                      >
                        <div className="flex items-center gap-1">
                          Delivery
                          <SortIcon field="averageDeliveryDeviation" />
                        </div>
                      </th>
                      <th
                        className="px-4 py-3 text-left text-xs font-medium cursor-pointer"
                        style={{ color: styles.textSecondary }}
                        onClick={() => handleSort('communicationScore')}
                      >
                        <div className="flex items-center gap-1">
                          Response
                          <SortIcon field="communicationScore" />
                        </div>
                      </th>
                      <th
                        className="px-4 py-3 text-left text-xs font-medium"
                        style={{ color: styles.textSecondary }}
                      >
                        Risk
                      </th>
                      <th
                        className="px-4 py-3 text-left text-xs font-medium"
                        style={{ color: styles.textSecondary }}
                      >
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSuppliers.map(supplier => (
                      <SupplierTableRow
                        key={supplier.id}
                        supplier={supplier}
                        onSelect={setSelectedSupplier}
                        isSelected={selectedSupplier?.id === supplier.id}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Detail Panel */}
          {selectedSupplier && (
            <div className="w-80 flex-shrink-0">
              <SupplierDetailPanel
                supplier={selectedSupplier}
                onClose={() => setSelectedSupplier(null)}
              />
            </div>
          )}
        </div>

        {/* Score Methodology Footer */}
        <div
          className="mt-6 p-4 rounded-lg"
          style={{
            backgroundColor: styles.bgSecondary,
            border: `1px solid ${styles.border}`,
          }}
        >
          <div className="flex items-start gap-3">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: styles.textMuted }} />
            <div>
              <div className="text-sm font-medium mb-2" style={{ color: styles.textPrimary }}>
                How Scores Are Calculated
              </div>
              <div className="text-xs space-y-1" style={{ color: styles.textSecondary }}>
                <p>
                  <strong>Reliability Score (0-100):</strong> Weighted average of Delivery (40%), Quality (30%),
                  Communication (20%), and Fulfillment (10%). Higher scores indicate more dependable suppliers.
                </p>
                <p>
                  <strong>Dependency %:</strong> Your spend with this supplier as a percentage of total category spend.
                  Values above 60% indicate concentration risk.
                </p>
                <p>
                  <strong>Delivery Deviation:</strong> Average difference between promised and actual delivery dates.
                  Negative values indicate early delivery; positive values indicate late delivery.
                </p>
                <p>
                  <strong>Communication:</strong> Based on average response time to inquiries, RFQ response rate,
                  and issue resolution speed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}

export default BuyerSuppliers
