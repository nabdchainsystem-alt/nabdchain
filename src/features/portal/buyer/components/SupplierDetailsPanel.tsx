import React, { useState } from 'react';
import {
  X,
  Buildings,
  FileText,
  ChatCircle,
  Star,
  ArrowSquareOut,
  ShieldCheck,
  Timer,
  TrendUp,
  Package,
  Warning,
  Clock,
  Users,
  Envelope,
  Phone,
  MapPin,
  Tag,
  FileDoc,
} from 'phosphor-react';
import { usePortal } from '../../context/PortalContext';
import type { Supplier } from '../../types/supplier.types';
import {
  getRiskLevelConfig,
  getSupplierTierConfig,
  formatDeliveryDeviation,
  formatResponseTime,
  calculateDeliveryScore,
} from '../../types/supplier.types';

interface SupplierDetailsPanelProps {
  supplier: Supplier;
  onClose: () => void;
  onRequestQuote?: () => void;
  onMessage?: () => void;
  onShortlist?: () => void;
  onOpenProfile?: () => void;
  isShortlisted?: boolean;
  isDrawer?: boolean; // For mobile drawer mode
}

// Key Metric Card
const MetricCard: React.FC<{
  label: string;
  value: string | number;
  subtext?: string;
  icon: React.ReactNode;
  color?: string;
}> = ({ label, value, subtext, icon, color }) => {
  const { styles } = usePortal();

  return (
    <div className="p-3 rounded-lg" style={{ backgroundColor: styles.bgSecondary }}>
      <div className="flex items-center gap-2 mb-1.5">
        <span style={{ color: styles.textMuted }}>{icon}</span>
        <span className="text-[10px] uppercase tracking-wider font-medium" style={{ color: styles.textMuted }}>
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-lg font-semibold" style={{ color: color || styles.textPrimary }}>
          {value}
        </span>
        {subtext && (
          <span className="text-[10px]" style={{ color: styles.textMuted }}>
            {subtext}
          </span>
        )}
      </div>
    </div>
  );
};

// Risk Insight Item
const RiskInsightItem: React.FC<{
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
}> = ({ title, description, severity }) => {
  const { styles } = usePortal();
  const colors = {
    low: styles.success,
    medium: styles.warning,
    high: styles.error,
  };

  return (
    <div
      className="p-3 rounded-lg border-l-2"
      style={{
        backgroundColor: styles.bgSecondary,
        borderLeftColor: colors[severity],
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <Warning size={12} style={{ color: colors[severity] }} />
        <span className="text-xs font-medium" style={{ color: styles.textPrimary }}>
          {title}
        </span>
      </div>
      <p className="text-[11px]" style={{ color: styles.textSecondary }}>
        {description}
      </p>
    </div>
  );
};

// Placeholder Performance Chart
const PerformanceTrendChart: React.FC = () => {
  const { styles } = usePortal();

  // Mock trend data points
  const points = [45, 52, 48, 65, 58, 72, 68, 75, 70, 78, 82, 85];
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min;

  return (
    <div className="p-4 rounded-lg" style={{ backgroundColor: styles.bgSecondary }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium" style={{ color: styles.textSecondary }}>
          Performance Trend (12 months)
        </span>
        <span className="flex items-center gap-1 text-xs" style={{ color: styles.success }}>
          <TrendUp size={12} />
          +12%
        </span>
      </div>
      <div className="h-16 flex items-end gap-1">
        {points.map((point, i) => {
          const height = ((point - min) / range) * 100;
          return (
            <div
              key={i}
              className="flex-1 rounded-t transition-all hover:opacity-80"
              style={{
                height: `${Math.max(height, 10)}%`,
                backgroundColor: i === points.length - 1 ? styles.success : styles.textMuted + '40',
              }}
            />
          );
        })}
      </div>
      <div className="flex justify-between mt-2 text-[10px]" style={{ color: styles.textMuted }}>
        <span>Jan</span>
        <span>Dec</span>
      </div>
    </div>
  );
};

// Notes & Tags Section
const NotesTagsSection: React.FC<{
  tags: string[];
  onAddTag?: (tag: string) => void;
  onRemoveTag?: (tag: string) => void;
}> = ({ tags, _onAddTag, onRemoveTag }) => {
  const { styles } = usePortal();
  const [_newTag, _setNewTag] = useState('');
  const [notes, setNotes] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  return (
    <div className="space-y-3">
      {/* Tags */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium" style={{ color: styles.textSecondary }}>
            Tags
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]"
              style={{
                backgroundColor: styles.bgSecondary,
                color: styles.textSecondary,
              }}
            >
              <Tag size={10} />
              {tag}
              {onRemoveTag && (
                <button onClick={() => onRemoveTag(tag)} className="hover:opacity-70">
                  <X size={8} />
                </button>
              )}
            </span>
          ))}
          {tags.length === 0 && (
            <span className="text-[10px]" style={{ color: styles.textMuted }}>
              No tags added
            </span>
          )}
        </div>
      </div>

      {/* Notes */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium" style={{ color: styles.textSecondary }}>
            Notes
          </span>
          <button
            onClick={() => setIsEditingNotes(!isEditingNotes)}
            className="text-[10px] px-2 py-0.5 rounded"
            style={{ color: styles.textMuted }}
          >
            {isEditingNotes ? 'Done' : 'Edit'}
          </button>
        </div>
        {isEditingNotes ? (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about this supplier..."
            className="w-full px-3 py-2 rounded-lg text-xs resize-none"
            style={{
              backgroundColor: styles.bgSecondary,
              border: `1px solid ${styles.border}`,
              color: styles.textPrimary,
            }}
            rows={3}
          />
        ) : (
          <p className="text-xs" style={{ color: notes ? styles.textSecondary : styles.textMuted }}>
            {notes || 'No notes added'}
          </p>
        )}
      </div>
    </div>
  );
};

// Documents Placeholder
const DocumentsSection: React.FC = () => {
  const { styles } = usePortal();

  const documents = [
    { name: 'ISO 9001 Certificate', status: 'verified', expiry: '2025-06-15' },
    { name: 'Business License', status: 'verified', expiry: '2026-01-01' },
    { name: 'Insurance Certificate', status: 'pending', expiry: null },
  ];

  return (
    <div className="space-y-2">
      {documents.map((doc, i) => (
        <div
          key={i}
          className="flex items-center justify-between p-2.5 rounded-lg"
          style={{ backgroundColor: styles.bgSecondary }}
        >
          <div className="flex items-center gap-2">
            <FileDoc size={14} style={{ color: styles.textMuted }} />
            <div>
              <span className="text-xs" style={{ color: styles.textPrimary }}>
                {doc.name}
              </span>
              {doc.expiry && (
                <span className="block text-[10px]" style={{ color: styles.textMuted }}>
                  Expires: {doc.expiry}
                </span>
              )}
            </div>
          </div>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded"
            style={{
              backgroundColor: doc.status === 'verified' ? `${styles.success}15` : `${styles.warning}15`,
              color: doc.status === 'verified' ? styles.success : styles.warning,
            }}
          >
            {doc.status === 'verified' ? 'Verified' : 'Pending'}
          </span>
        </div>
      ))}
    </div>
  );
};

export const SupplierDetailsPanel: React.FC<SupplierDetailsPanelProps> = ({
  supplier,
  onClose,
  onRequestQuote,
  onMessage,
  onShortlist,
  onOpenProfile,
  isShortlisted = false,
  isDrawer = false,
}) => {
  const { styles } = usePortal();

  const tierConfig = getSupplierTierConfig(supplier.tier);
  const riskConfig = getRiskLevelConfig(supplier.riskLevel);
  const _deliveryDeviation = formatDeliveryDeviation(supplier.metrics.averageDeliveryDeviation);
  const responseTime = formatResponseTime(supplier.metrics.averageResponseTimeHours);
  const _deliveryScore = calculateDeliveryScore(supplier.metrics);

  // Risk chip color
  const riskColorMap = {
    success: styles.success,
    warning: styles.warning,
    error: styles.error,
    info: styles.info,
  };
  const riskColor = riskColorMap[riskConfig.color];

  // Calculate on-time percentage
  const onTimePercentage =
    supplier.metrics.totalOrders > 0
      ? Math.round((supplier.metrics.onTimeDeliveries / supplier.metrics.totalOrders) * 100)
      : 0;

  // Disputes rate (mock calculation)
  const disputesRate =
    supplier.metrics.returnedOrders > 0
      ? ((supplier.metrics.returnedOrders / supplier.metrics.totalOrders) * 100).toFixed(1)
      : '0';

  // Generate risk insights based on supplier data
  const riskInsights: Array<{ title: string; description: string; severity: 'low' | 'medium' | 'high' }> = [];

  if (supplier.metrics.dependencyPercentage > 60) {
    riskInsights.push({
      title: 'High Dependency Risk',
      description: `${supplier.metrics.dependencyPercentage.toFixed(0)}% of your category spend is with this supplier. Consider diversifying.`,
      severity: 'high',
    });
  } else if (supplier.metrics.dependencyPercentage > 30) {
    riskInsights.push({
      title: 'Moderate Dependency',
      description: `${supplier.metrics.dependencyPercentage.toFixed(0)}% concentration - within acceptable range but monitor.`,
      severity: 'medium',
    });
  }

  if (supplier.reliabilityScore < 50) {
    riskInsights.push({
      title: 'Low Reliability Score',
      description: 'Recent performance issues detected. Review delivery and quality metrics.',
      severity: 'high',
    });
  }

  if (supplier.metrics.averageDeliveryDeviation > 3) {
    riskInsights.push({
      title: 'Delivery Delays',
      description: `Average of ${supplier.metrics.averageDeliveryDeviation.toFixed(1)} days late on deliveries.`,
      severity: 'medium',
    });
  }

  return (
    <div
      className={`h-full flex flex-col ${isDrawer ? 'w-full' : ''}`}
      style={{
        backgroundColor: styles.bgCard,
        borderLeft: isDrawer ? 'none' : `1px solid ${styles.border}`,
      }}
    >
      {/* Header */}
      <div
        className="flex items-start justify-between p-4 flex-shrink-0"
        style={{ borderBottom: `1px solid ${styles.border}` }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: styles.bgSecondary }}
          >
            <Buildings size={18} style={{ color: styles.textSecondary }} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm truncate" style={{ color: styles.textPrimary }}>
                {supplier.name}
              </h3>
              <span
                className="px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0"
                style={{
                  backgroundColor: `${riskColor}15`,
                  color: riskColor,
                }}
              >
                {riskConfig.label.replace(' Risk', '')}
              </span>
            </div>
            <p className="text-xs" style={{ color: styles.textMuted }}>
              {supplier.code} · {tierConfig.label}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md transition-colors flex-shrink-0"
          style={{ color: styles.textMuted }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.bgHover)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <X size={16} />
        </button>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-2 p-4 flex-shrink-0" style={{ borderBottom: `1px solid ${styles.border}` }}>
        <button
          onClick={onRequestQuote}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-colors"
          style={{
            backgroundColor: styles.isDark ? '#E6E8EB' : '#0F1115',
            color: styles.isDark ? '#0F1115' : '#E6E8EB',
          }}
        >
          <FileText size={12} />
          Request Quote
        </button>
        <button
          onClick={onMessage}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-colors"
          style={{
            backgroundColor: styles.bgSecondary,
            border: `1px solid ${styles.border}`,
            color: styles.textSecondary,
          }}
        >
          <ChatCircle size={12} />
          Message
        </button>
        <button
          onClick={onShortlist}
          className="p-2 rounded-md transition-colors"
          style={{
            backgroundColor: isShortlisted ? `${styles.warning}15` : styles.bgSecondary,
            border: `1px solid ${styles.border}`,
            color: isShortlisted ? styles.warning : styles.textMuted,
          }}
          title={isShortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
        >
          <Star size={14} weight={isShortlisted ? 'fill' : 'regular'} />
        </button>
        <button
          onClick={onOpenProfile}
          className="p-2 rounded-md transition-colors"
          style={{
            backgroundColor: styles.bgSecondary,
            border: `1px solid ${styles.border}`,
            color: styles.textMuted,
          }}
          title="Open full profile"
        >
          <ArrowSquareOut size={14} />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Section A: Key Metrics */}
        <section>
          <h4 className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: styles.textMuted }}>
            Key Metrics
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <MetricCard
              label="Reliability"
              value={supplier.reliabilityScore}
              subtext="/100"
              icon={<ShieldCheck size={12} />}
              color={
                supplier.reliabilityScore >= 75
                  ? styles.success
                  : supplier.reliabilityScore >= 50
                    ? styles.warning
                    : styles.error
              }
            />
            <MetricCard
              label="On-time"
              value={`${onTimePercentage}%`}
              icon={<Clock size={12} />}
              color={onTimePercentage >= 85 ? styles.success : onTimePercentage >= 70 ? styles.warning : styles.error}
            />
            <MetricCard
              label="Lead Time"
              value={`${supplier.leadTimeDays}d`}
              subtext="avg"
              icon={<Timer size={12} />}
            />
            <MetricCard label="Response" value={responseTime} subtext="avg" icon={<ChatCircle size={12} />} />
            <MetricCard
              label="Disputes"
              value={`${disputesRate}%`}
              icon={<Warning size={12} />}
              color={
                parseFloat(disputesRate) > 5
                  ? styles.error
                  : parseFloat(disputesRate) > 2
                    ? styles.warning
                    : styles.success
              }
            />
            <MetricCard
              label="Total Spend"
              value={`$${(supplier.metrics.totalSpend / 1000).toFixed(0)}K`}
              icon={<Package size={12} />}
            />
          </div>
        </section>

        {/* Section B: Risk Insights */}
        {riskInsights.length > 0 && (
          <section>
            <h4 className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: styles.textMuted }}>
              Risk Insights
            </h4>
            <div className="space-y-2">
              {riskInsights.map((insight, i) => (
                <RiskInsightItem key={i} {...insight} />
              ))}
            </div>
          </section>
        )}

        {/* Section C: Performance Trend */}
        <section>
          <h4 className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: styles.textMuted }}>
            Performance
          </h4>
          <PerformanceTrendChart />
        </section>

        {/* Section D: Notes & Tags */}
        <section>
          <h4 className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: styles.textMuted }}>
            Notes & Tags
          </h4>
          <NotesTagsSection tags={supplier.categories} />
        </section>

        {/* Section E: Documents */}
        <section>
          <h4 className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: styles.textMuted }}>
            Documents & Compliance
          </h4>
          <DocumentsSection />
        </section>

        {/* Contact Information */}
        <section>
          <h4 className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: styles.textMuted }}>
            Contact
          </h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs" style={{ color: styles.textPrimary }}>
              <Users size={12} style={{ color: styles.textMuted }} />
              {supplier.contactName}
            </div>
            <div className="flex items-center gap-2 text-xs" style={{ color: styles.textPrimary }}>
              <Envelope size={12} style={{ color: styles.textMuted }} />
              {supplier.contactEmail}
            </div>
            {supplier.contactPhone && (
              <div className="flex items-center gap-2 text-xs" style={{ color: styles.textPrimary }}>
                <Phone size={12} style={{ color: styles.textMuted }} />
                {supplier.contactPhone}
              </div>
            )}
            <div className="flex items-center gap-2 text-xs" style={{ color: styles.textPrimary }}>
              <MapPin size={12} style={{ color: styles.textMuted }} />
              {supplier.city ? `${supplier.city}, ` : ''}
              {supplier.country}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SupplierDetailsPanel;
