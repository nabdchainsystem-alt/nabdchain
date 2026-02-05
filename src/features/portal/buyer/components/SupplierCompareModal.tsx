import React, { useMemo } from 'react';
import {
  X,
  Buildings,
  Trophy,
  FileXls,
  FilePdf,
  ShieldCheck,
  Timer,
  Clock,
  Package,
  Warning,
  CheckCircle,
  TrendUp,
  TrendDown,
  Minus,
} from 'phosphor-react';
import { usePortal } from '../../context/PortalContext';
import type { Supplier } from '../../types/supplier.types';
import {
  getRiskLevelConfig,
  formatDeliveryDeviation,
  formatResponseTime,
} from '../../types/supplier.types';

interface SupplierCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  suppliers: Supplier[];
  onExportPDF?: () => void;
  onExportExcel?: () => void;
}

// Country flag emoji mapping
const COUNTRY_FLAGS: Record<string, string> = {
  'United States': '🇺🇸',
  'Germany': '🇩🇪',
  'China': '🇨🇳',
  'Japan': '🇯🇵',
  'United Kingdom': '🇬🇧',
  'India': '🇮🇳',
  'South Korea': '🇰🇷',
  'Italy': '🇮🇹',
  'France': '🇫🇷',
  'Canada': '🇨🇦',
};

interface ComparisonMetric {
  label: string;
  key: string;
  format: (supplier: Supplier) => string | number;
  compare: (a: Supplier, b: Supplier) => number; // positive = a is better
  higherIsBetter: boolean;
  icon: React.ReactNode;
}

export const SupplierCompareModal: React.FC<SupplierCompareModalProps> = ({
  isOpen,
  onClose,
  suppliers,
  onExportPDF,
  onExportExcel,
}) => {
  const { styles } = usePortal();

  // Define comparison metrics
  const metrics: ComparisonMetric[] = [
    {
      label: 'Reliability Score',
      key: 'reliability',
      format: s => s.reliabilityScore,
      compare: (a, b) => a.reliabilityScore - b.reliabilityScore,
      higherIsBetter: true,
      icon: <ShieldCheck size={14} />,
    },
    {
      label: 'Risk Level',
      key: 'risk',
      format: s => getRiskLevelConfig(s.riskLevel).label.replace(' Risk', ''),
      compare: (a, b) => {
        const order = { low: 3, medium: 2, high: 1, critical: 0 };
        return order[a.riskLevel] - order[b.riskLevel];
      },
      higherIsBetter: true, // lower risk is better, but compare returns higher = better
      icon: <Warning size={14} />,
    },
    {
      label: 'On-Time Delivery',
      key: 'ontime',
      format: s => `${Math.round((s.metrics.onTimeDeliveries / s.metrics.totalOrders) * 100)}%`,
      compare: (a, b) =>
        (a.metrics.onTimeDeliveries / a.metrics.totalOrders) -
        (b.metrics.onTimeDeliveries / b.metrics.totalOrders),
      higherIsBetter: true,
      icon: <Clock size={14} />,
    },
    {
      label: 'Delivery Time',
      key: 'delivery',
      format: s => formatDeliveryDeviation(s.metrics.averageDeliveryDeviation).label,
      compare: (a, b) => b.metrics.averageDeliveryDeviation - a.metrics.averageDeliveryDeviation,
      higherIsBetter: true, // lower deviation is better
      icon: <Package size={14} />,
    },
    {
      label: 'Avg Response Time',
      key: 'response',
      format: s => formatResponseTime(s.metrics.averageResponseTimeHours),
      compare: (a, b) => b.metrics.averageResponseTimeHours - a.metrics.averageResponseTimeHours,
      higherIsBetter: true, // faster is better
      icon: <Timer size={14} />,
    },
    {
      label: 'Lead Time',
      key: 'leadtime',
      format: s => `${s.leadTimeDays} days`,
      compare: (a, b) => b.leadTimeDays - a.leadTimeDays,
      higherIsBetter: true, // shorter is better
      icon: <Clock size={14} />,
    },
    {
      label: 'Quality Score',
      key: 'quality',
      format: s => `${s.metrics.qualityScore}%`,
      compare: (a, b) => a.metrics.qualityScore - b.metrics.qualityScore,
      higherIsBetter: true,
      icon: <CheckCircle size={14} />,
    },
    {
      label: 'Communication',
      key: 'communication',
      format: s => s.metrics.communicationScore,
      compare: (a, b) => a.metrics.communicationScore - b.metrics.communicationScore,
      higherIsBetter: true,
      icon: <Timer size={14} />,
    },
    {
      label: 'Dependency',
      key: 'dependency',
      format: s => `${s.metrics.dependencyPercentage.toFixed(1)}%`,
      compare: (a, b) => b.metrics.dependencyPercentage - a.metrics.dependencyPercentage,
      higherIsBetter: true, // lower dependency is better
      icon: <Warning size={14} />,
    },
    {
      label: 'Total Spend',
      key: 'spend',
      format: s => `$${(s.metrics.totalSpend / 1000).toFixed(0)}K`,
      compare: (a, b) => a.metrics.totalSpend - b.metrics.totalSpend,
      higherIsBetter: false, // just info, no preference
      icon: <Package size={14} />,
    },
    {
      label: 'Total Orders',
      key: 'orders',
      format: s => s.metrics.totalOrders,
      compare: (a, b) => a.metrics.totalOrders - b.metrics.totalOrders,
      higherIsBetter: true,
      icon: <Package size={14} />,
    },
    {
      label: 'Payment Terms',
      key: 'payment',
      format: s => s.paymentTerms,
      compare: () => 0, // No comparison
      higherIsBetter: false,
      icon: <Clock size={14} />,
    },
  ];

  // Calculate recommended supplier
  const recommendedSupplier = useMemo(() => {
    if (suppliers.length < 2) return null;

    // Simple scoring: weighted sum of key metrics
    const scores = suppliers.map(s => {
      let score = 0;
      score += s.reliabilityScore * 0.35;
      score += (100 - (s.riskLevel === 'low' ? 0 : s.riskLevel === 'medium' ? 25 : s.riskLevel === 'high' ? 50 : 75)) * 0.25;
      score += (s.metrics.onTimeDeliveries / s.metrics.totalOrders) * 100 * 0.2;
      score += (100 - Math.min(s.metrics.averageResponseTimeHours, 48) / 48 * 100) * 0.1;
      score += (100 - Math.min(s.metrics.dependencyPercentage, 100)) * 0.1;
      return { supplier: s, score };
    });

    scores.sort((a, b) => b.score - a.score);
    return scores[0].supplier;
  }, [suppliers]);

  // Determine best/worst for each metric
  const getBestWorst = (metric: ComparisonMetric): { bestId: string | null; worstId: string | null } => {
    if (suppliers.length < 2) return { bestId: null, worstId: null };

    const sorted = [...suppliers].sort((a, b) => metric.compare(a, b));
    return {
      bestId: sorted[sorted.length - 1].id, // highest = best (assuming compare returns higher for better)
      worstId: sorted[0].id,
    };
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed inset-4 z-50 flex items-center justify-center"
        onClick={e => e.stopPropagation()}
      >
        <div
          className="w-full max-w-5xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden"
          style={{
            backgroundColor: styles.bgCard,
            border: `1px solid ${styles.border}`,
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4 flex-shrink-0"
            style={{ borderBottom: `1px solid ${styles.border}` }}
          >
            <div>
              <h2
                className="text-lg font-semibold"
                style={{ color: styles.textPrimary, fontFamily: styles.fontHeading }}
              >
                Compare Suppliers
              </h2>
              <p className="text-sm" style={{ color: styles.textSecondary }}>
                Comparing {suppliers.length} suppliers side by side
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Export buttons */}
              <button
                onClick={onExportPDF}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                style={{
                  backgroundColor: styles.bgSecondary,
                  border: `1px solid ${styles.border}`,
                  color: styles.textSecondary,
                }}
              >
                <FilePdf size={14} />
                PDF
              </button>
              <button
                onClick={onExportExcel}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                style={{
                  backgroundColor: styles.bgSecondary,
                  border: `1px solid ${styles.border}`,
                  color: styles.textSecondary,
                }}
              >
                <FileXls size={14} />
                Excel
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-md transition-colors ml-2"
                style={{ color: styles.textMuted }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = styles.bgHover)}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            {/* Supplier Headers */}
            <div className="flex gap-4 mb-4">
              {/* Empty cell for metric labels */}
              <div className="w-40 flex-shrink-0" />

              {/* Supplier columns */}
              {suppliers.map(supplier => {
                const isRecommended = recommendedSupplier?.id === supplier.id;
                const riskConfig = getRiskLevelConfig(supplier.riskLevel);
                const riskColorMap = {
                  success: styles.success,
                  warning: styles.warning,
                  error: styles.error,
                  info: styles.info,
                };
                const countryFlag = COUNTRY_FLAGS[supplier.country] || '🌍';

                return (
                  <div
                    key={supplier.id}
                    className="flex-1 min-w-0 p-4 rounded-lg relative"
                    style={{
                      backgroundColor: isRecommended ? `${styles.success}08` : styles.bgSecondary,
                      border: `1px solid ${isRecommended ? styles.success : styles.border}`,
                    }}
                  >
                    {/* Recommended badge */}
                    {isRecommended && (
                      <div
                        className="absolute -top-2 left-4 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                        style={{ backgroundColor: styles.success, color: '#fff' }}
                      >
                        <Trophy size={10} weight="fill" />
                        Recommended
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: styles.bgPrimary }}
                      >
                        <Buildings size={16} style={{ color: styles.textSecondary }} />
                      </div>
                      <div className="min-w-0">
                        <h3
                          className="font-semibold text-sm truncate"
                          style={{ color: styles.textPrimary }}
                        >
                          {supplier.name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs" style={{ color: styles.textMuted }}>
                          <span>{countryFlag}</span>
                          <span className="truncate">{supplier.country}</span>
                          <span>·</span>
                          <span
                            className="px-1 py-0.5 rounded text-[10px]"
                            style={{
                              backgroundColor: `${riskColorMap[riskConfig.color]}15`,
                              color: riskColorMap[riskConfig.color],
                            }}
                          >
                            {riskConfig.label.replace(' Risk', '')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Comparison Table */}
            <div
              className="rounded-lg overflow-hidden border"
              style={{ borderColor: styles.border }}
            >
              {metrics.map((metric, idx) => {
                const { bestId, worstId } = getBestWorst(metric);
                const canCompare = metric.compare(suppliers[0], suppliers[0]) !== undefined;

                return (
                  <div
                    key={metric.key}
                    className="flex gap-4"
                    style={{
                      borderBottom: idx < metrics.length - 1 ? `1px solid ${styles.border}` : 'none',
                    }}
                  >
                    {/* Metric Label */}
                    <div
                      className="w-40 flex-shrink-0 flex items-center gap-2 px-4 py-3"
                      style={{ backgroundColor: styles.bgSecondary }}
                    >
                      <span style={{ color: styles.textMuted }}>{metric.icon}</span>
                      <span className="text-xs font-medium" style={{ color: styles.textSecondary }}>
                        {metric.label}
                      </span>
                    </div>

                    {/* Values */}
                    {suppliers.map(supplier => {
                      const value = metric.format(supplier);
                      const isBest = metric.higherIsBetter && bestId === supplier.id && canCompare;
                      const isWorst = metric.higherIsBetter && worstId === supplier.id && canCompare && suppliers.length > 1;

                      return (
                        <div
                          key={supplier.id}
                          className="flex-1 flex items-center justify-center px-4 py-3"
                          style={{
                            backgroundColor: isBest
                              ? `${styles.success}08`
                              : isWorst
                              ? `${styles.error}05`
                              : 'transparent',
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="text-sm font-medium"
                              style={{
                                color: isBest
                                  ? styles.success
                                  : isWorst
                                  ? styles.error
                                  : styles.textPrimary,
                              }}
                            >
                              {value}
                            </span>
                            {isBest && metric.higherIsBetter && (
                              <TrendUp size={12} weight="bold" style={{ color: styles.success }} />
                            )}
                            {isWorst && metric.higherIsBetter && suppliers.length > 2 && (
                              <TrendDown size={12} weight="bold" style={{ color: styles.error }} />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Summary / Recommendation */}
            {recommendedSupplier && (
              <div
                className="mt-6 p-4 rounded-lg"
                style={{
                  backgroundColor: `${styles.success}08`,
                  border: `1px solid ${styles.success}30`,
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${styles.success}20` }}
                  >
                    <Trophy size={14} weight="fill" style={{ color: styles.success }} />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-1" style={{ color: styles.textPrimary }}>
                      Recommendation: {recommendedSupplier.name}
                    </h4>
                    <p className="text-xs" style={{ color: styles.textSecondary }}>
                      Based on overall reliability score ({recommendedSupplier.reliabilityScore}), risk level (
                      {getRiskLevelConfig(recommendedSupplier.riskLevel).label.replace(' Risk', '')}), on-time delivery rate (
                      {Math.round(
                        (recommendedSupplier.metrics.onTimeDeliveries / recommendedSupplier.metrics.totalOrders) * 100
                      )}
                      %), and response time ({formatResponseTime(recommendedSupplier.metrics.averageResponseTimeHours)}),
                      this supplier offers the best overall value.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SupplierCompareModal;
