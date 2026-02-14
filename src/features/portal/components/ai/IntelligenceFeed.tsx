/**
 * IntelligenceFeed — Workspace Intelligence Hub
 *
 * Paginated feed of AI insight events with filters, resolve/dismiss actions.
 * Used as a tab in both BuyerWorkspace and SellerWorkspace.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkle,
  Lightning,
  Warning,
  CheckCircle,
  XCircle,
  Funnel,
  Spinner,
  CaretDown,
  Package,
  Receipt,
  FileText,
  ChartLineUp,
} from 'phosphor-react';
import { usePortal } from '../../context/PortalContext';
import { portalAIService, InsightEvent } from '../../services/aiService';

interface IntelligenceFeedProps {
  role: 'buyer' | 'seller';
}

const entityTypeIcons: Record<string, React.ComponentType<{ size: number; style?: React.CSSProperties }>> = {
  order: Package,
  invoice: Receipt,
  rfq: FileText,
  workspace: ChartLineUp,
};

const severityStyles: Record<string, { bg: string; text: string; border: string }> = {
  info: { bg: 'rgba(59, 130, 246, 0.08)', text: '#3B82F6', border: 'rgba(59, 130, 246, 0.2)' },
  warning: { bg: 'rgba(245, 158, 11, 0.08)', text: '#F59E0B', border: 'rgba(245, 158, 11, 0.2)' },
  critical: { bg: 'rgba(239, 68, 68, 0.08)', text: '#EF4444', border: 'rgba(239, 68, 68, 0.2)' },
};

const formatRelativeTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

export const IntelligenceFeed: React.FC<IntelligenceFeedProps> = ({ role }) => {
  const { styles } = usePortal();

  const [events, setEvents] = useState<InsightEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [entityFilter, setEntityFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const loadFeed = useCallback(
    async (cursor?: string) => {
      try {
        if (cursor) {
          setIsLoadingMore(true);
        } else {
          setIsLoading(true);
        }
        setError(null);

        const response = await portalAIService.getInsightFeed({
          role,
          status: statusFilter || undefined,
          entityType: entityFilter || undefined,
          limit: 15,
          cursor,
        });

        if (cursor) {
          setEvents((prev) => [...prev, ...response.data.items]);
        } else {
          setEvents(response.data.items);
        }
        setNextCursor(response.data.nextCursor);
        setHasMore(response.data.hasMore);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load intelligence feed');
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [role, statusFilter, entityFilter],
  );

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const handleResolve = async (eventId: string) => {
    try {
      await portalAIService.resolveInsight(eventId);
      setEvents((prev) => prev.map((e) => (e.id === eventId ? { ...e, status: 'resolved' } : e)));
    } catch {
      // Silent fail — user can retry
    }
  };

  const handleDismiss = async (eventId: string) => {
    try {
      await portalAIService.dismissInsight(eventId);
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
    } catch {
      // Silent fail
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size={28} className="animate-spin" style={{ color: '#8B5CF6' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <Warning size={32} style={{ color: styles.error, margin: '0 auto 12px' }} />
        <p className="text-sm" style={{ color: styles.error }}>
          {error}
        </p>
        <button
          onClick={() => loadFeed()}
          className="mt-3 text-sm px-4 py-2 rounded-lg"
          style={{ backgroundColor: styles.bgSecondary, color: styles.textPrimary }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header + Filters */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkle size={20} weight="fill" style={{ color: '#8B5CF6' }} />
          <h3 className="text-lg font-semibold" style={{ color: styles.textPrimary }}>
            Intelligence Feed
          </h3>
          {events.length > 0 && (
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6' }}
            >
              {events.length}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors"
          style={{ backgroundColor: styles.bgSecondary, color: styles.textSecondary }}
        >
          <Funnel size={14} />
          Filters
          <CaretDown size={12} />
        </button>
      </div>

      {/* Filter Bar */}
      {showFilters && (
        <div className="flex items-center gap-3 p-3 rounded-lg mb-4" style={{ backgroundColor: styles.bgSecondary }}>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: styles.textMuted }}>
              Status:
            </span>
            {['active', 'resolved', 'dismissed'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
                className="text-xs px-2.5 py-1 rounded-full transition-colors"
                style={{
                  backgroundColor: statusFilter === s ? 'rgba(139, 92, 246, 0.15)' : styles.bgCard,
                  color: statusFilter === s ? '#8B5CF6' : styles.textSecondary,
                  border: `1px solid ${statusFilter === s ? 'rgba(139, 92, 246, 0.3)' : styles.border}`,
                }}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="w-px h-5" style={{ backgroundColor: styles.border }} />
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: styles.textMuted }}>
              Type:
            </span>
            {['order', 'invoice', 'rfq', 'workspace'].map((t) => (
              <button
                key={t}
                onClick={() => setEntityFilter(entityFilter === t ? '' : t)}
                className="text-xs px-2.5 py-1 rounded-full transition-colors"
                style={{
                  backgroundColor: entityFilter === t ? 'rgba(139, 92, 246, 0.15)' : styles.bgCard,
                  color: entityFilter === t ? '#8B5CF6' : styles.textSecondary,
                  border: `1px solid ${entityFilter === t ? 'rgba(139, 92, 246, 0.3)' : styles.border}`,
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Feed */}
      {events.length === 0 ? (
        <div className="text-center py-16">
          <Lightning size={40} style={{ color: styles.textMuted, margin: '0 auto 12px' }} />
          <p className="text-sm" style={{ color: styles.textMuted }}>
            No intelligence events yet. Use AI features to generate insights.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => {
            const sev = severityStyles[event.severity] || severityStyles.info;
            const EntityIcon = entityTypeIcons[event.entityType] || Lightning;

            return (
              <div
                key={event.id}
                className="rounded-lg border p-4 transition-colors"
                style={{
                  backgroundColor: styles.bgCard,
                  borderColor: event.status === 'active' ? sev.border : styles.border,
                  borderLeftWidth: '3px',
                  borderLeftColor: event.status === 'active' ? sev.text : styles.border,
                  opacity: event.status === 'resolved' ? 0.7 : 1,
                }}
              >
                {/* Event Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <EntityIcon size={16} style={{ color: sev.text }} />
                    <span className="text-sm font-medium" style={{ color: styles.textPrimary }}>
                      {event.title}
                    </span>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: sev.bg, color: sev.text }}
                    >
                      {event.severity}
                    </span>
                  </div>
                  <span className="text-xs flex-shrink-0" style={{ color: styles.textMuted }}>
                    {formatRelativeTime(event.createdAt)}
                  </span>
                </div>

                {/* Summary */}
                <p className="text-sm mb-3 leading-relaxed" style={{ color: styles.textSecondary }}>
                  {event.summary.length > 200 ? `${event.summary.slice(0, 200)}...` : event.summary}
                </p>

                {/* Meta + Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs px-2 py-0.5 rounded"
                      style={{ backgroundColor: styles.bgSecondary, color: styles.textMuted }}
                    >
                      {event.entityType}
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded"
                      style={{ backgroundColor: styles.bgSecondary, color: styles.textMuted }}
                    >
                      {Math.round(event.confidence * 100)}%
                    </span>
                    {event.status === 'resolved' && (
                      <span className="text-xs flex items-center gap-1" style={{ color: '#22C55E' }}>
                        <CheckCircle size={12} weight="fill" /> Resolved
                      </span>
                    )}
                  </div>

                  {event.status === 'active' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleResolve(event.id)}
                        className="text-xs flex items-center gap-1 px-2.5 py-1 rounded transition-colors"
                        style={{ color: '#22C55E' }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.1)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <CheckCircle size={12} /> Resolve
                      </button>
                      <button
                        onClick={() => handleDismiss(event.id)}
                        className="text-xs flex items-center gap-1 px-2.5 py-1 rounded transition-colors"
                        style={{ color: styles.textMuted }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.bgSecondary)}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <XCircle size={12} /> Dismiss
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Load More */}
          {hasMore && (
            <div className="text-center py-4">
              <button
                onClick={() => nextCursor && loadFeed(nextCursor)}
                disabled={isLoadingMore}
                className="text-sm px-6 py-2 rounded-lg transition-colors"
                style={{
                  backgroundColor: styles.bgSecondary,
                  color: '#8B5CF6',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                }}
              >
                {isLoadingMore ? (
                  <span className="flex items-center gap-2">
                    <Spinner size={14} className="animate-spin" /> Loading...
                  </span>
                ) : (
                  'Load More'
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default IntelligenceFeed;
